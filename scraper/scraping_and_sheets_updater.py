# scraping_and_sheets_updater.py
import requests
import gspread
import time
import os
import json
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む (ローカル開発用)
# .envファイルが存在しなくてもエラーにはならない
load_dotenv()

# --- 設定項目 ---
# スクリプト自身の場所を基準に、ローカル開発用のサービスアカウントキーファイルへのパスを構築
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

# --- 環境変数から設定を読み込む ---
# ローカル開発用のサービスアカウントキーファイルパス (環境変数から取得、なければデフォルト)
SERVICE_ACCOUNT_FILE_PATH = os.environ.get('GOOGLE_SERVICE_ACCOUNT_PATH', os.path.join(SCRIPT_DIR, 'your-service-account-key.json'))
# 更新したいスプレッドシートのID (環境変数から取得)
SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID')
# Google Geocoding APIキー (環境変数から取得)
PLACES_API_KEY = os.environ.get('PLACES_API_KEY') # Places APIキーに変更

# APIリクエスト間の待機時間（秒）
PLACES_API_REQUEST_DELAY = 1  # Places APIへのリクエスト間隔
SHEETS_API_DELAY = 1.5        # Google Sheets APIのレート制限対策

# スプレッドシートのヘッダー
SHEET_HEADERS = ["PlaceID", "Name", "Address", "Latitude", "Longitude", "Rating", "UserRatingsTotal", "LastUpdated", "GoogleMapsURL"]

# --- Google Places API 検索関数 ---
def search_restaurants_with_places_api(query="佐渡市のレストラン"):
    """Google Places APIのText Searchを使用してレストラン情報を取得する"""
    if not PLACES_API_KEY:
        print("PLACES_API_KEYが設定されていません。処理をスキップします。")
        return []

    print(f"Searching for '{query}' using Google Places API...")
    all_results = []
    next_page_token = None

    while True:
        params = {
            'query': query,
            'key': PLACES_API_KEY,
            'language': 'ja', # 結果を日本語で取得
        }
        if next_page_token:
            params['pagetoken'] = next_page_token
            # pagetokenを使用する際は少し待機が必要
            time.sleep(2)

        response = requests.get('https://maps.googleapis.com/maps/api/place/textsearch/json', params=params)
        response.raise_for_status()
        data = response.json()

        if data['status'] in ['OK', 'ZERO_RESULTS']:
            all_results.extend(data.get('results', []))
            next_page_token = data.get('next_page_token')
            if not next_page_token:
                break # 次のページがなければ終了
        else:
            print(f"Places API Error: {data.get('status')}, {data.get('error_message', '')}")
            break

        print(f"Retrieved {len(all_results)} places so far...")
        time.sleep(PLACES_API_REQUEST_DELAY)

    print(f"Total {len(all_results)} places found.")
    return all_results

# --- Google Sheets 更新関数 ---
def update_spreadsheet(restaurant_list):
    print("Updating spreadsheet...")
    
    # 環境変数からGoogle認証情報を読み込む (GitHub Actions / .env)
    creds_json_str = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY')

    try:
        if creds_json_str:
            # 環境変数にJSON文字列が設定されている場合 (GitHub Actions向け)
            print("Authenticating with GOOGLE_SERVICE_ACCOUNT_KEY secret...")
            creds_dict = json.loads(creds_json_str)
            gc = gspread.service_account_from_dict(creds_dict)
        else:
            # ローカル開発用にファイルから読み込む
            print(f"Authenticating with local file: {SERVICE_ACCOUNT_FILE_PATH}")
            gc = gspread.service_account(filename=SERVICE_ACCOUNT_FILE_PATH)
    except Exception as e:
        print(f"Google認証に失敗しました: {e}")
        if not creds_json_str:
             print(f"ローカルの `{SERVICE_ACCOUNT_FILE_PATH}` ファイルが存在するか、パスが正しいか確認してください。")
        else:
             print("GitHub Actionsの`GOOGLE_SERVICE_ACCOUNT_KEY` secretが正しいJSON形式か確認してください。")
        return

    try:
        # スプレッドシートを開く
        if not SPREADSHEET_ID:
            print("エラー: 環境変数 `SPREADSHEET_ID` が設定されていません。")
            return
        print(f"Opening spreadsheet with ID: {SPREADSHEET_ID[:10]}...") # IDが長いので一部だけ表示
        spreadsheet = gc.open_by_key(SPREADSHEET_ID)
        # 最初のワークシートを選択
        worksheet = spreadsheet.sheet1

        print("Checking spreadsheet header...")
        # ヘッダー行を直接取得して確認
        try:
            existing_headers = worksheet.row_values(1)
        except gspread.exceptions.APIError: # シートが完全に空の場合のエラーをハンドル
            existing_headers = []

        if existing_headers != SHEET_HEADERS:
            worksheet.update(range_name='A1', values=[SHEET_HEADERS], value_input_option='USER_ENTERED')
            print("Header row has been created or updated.")
            all_records = [] # ヘッダーを更新した場合は、データがないものとして扱う
        else:
            print("Header is correct. Reading existing data...")
            all_records = worksheet.get_all_records()
        
        # 既存データをPlaceIDをキーにした辞書に変換
        existing_data_map = {
            record['PlaceID']: {'data': record, 'row_num': i + 2}
            for i, record in enumerate(all_records) if 'PlaceID' in record and record.get('PlaceID')
        }
        
        updates_to_perform = []
        appends_to_perform = []

        for restaurant in restaurant_list:
            name = restaurant.get('name')
            if not name or name == '取得不可':
                continue
            
            timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
            place_id = restaurant.get('place_id')
            address = restaurant.get('formatted_address', '')
            location = restaurant.get('geometry', {}).get('location', {})
            lat = location.get('lat')
            lng = location.get('lng')
            rating = restaurant.get('rating', '')
            user_ratings_total = restaurant.get('user_ratings_total', '')
            # Google MapsのURLを生成
            google_maps_url = f"https://www.google.com/maps/search/?api=1&query=Google&query_place_id={place_id}" if place_id else ""

            if place_id in existing_data_map:
                # --- 既存店舗: 変更があるか確認して更新リストへ ---
                entry = existing_data_map[place_id]
                old_data = entry['data']
                row_num = entry['row_num']

                # 住所、評価、評価数などが変更されていたら更新
                if (str(old_data.get('Address', '')) != str(address) or
                    str(old_data.get('Rating', '')) != str(rating) or
                    str(old_data.get('UserRatingsTotal', '')) != str(user_ratings_total)):
                    
                    print(f"Updating entry for: {name}")
                    row_content = [place_id, name, address, lat, lng, rating, user_ratings_total, timestamp, google_maps_url]
                    # ヘッダーの数に合わせて範囲を調整
                    range_end_col = chr(ord('A') + len(SHEET_HEADERS) - 1)
                    updates_to_perform.append({'range': f'A{row_num}:{range_end_col}{row_num}', 'values': [row_content]})
            else:
                # --- 新規店舗: 追加リストへ ---
                print(f"Found new entry to append: {name}")
                row_content = [place_id, name, address, lat, lng, rating, user_ratings_total, timestamp, google_maps_url]
                appends_to_perform.append(row_content)

        if updates_to_perform:
            print(f"Batch updating {len(updates_to_perform)} rows...")
            worksheet.batch_update(updates_to_perform, value_input_option='USER_ENTERED')
            time.sleep(SHEETS_API_DELAY) # APIレート制限への配慮

        if appends_to_perform:
            print(f"Batch appending {len(appends_to_perform)} new rows...")
            worksheet.append_rows(appends_to_perform, value_input_option='USER_ENTERED')
        
        if not updates_to_perform and not appends_to_perform:
            print("No changes detected. Spreadsheet is up-to-date.")

    except gspread.exceptions.SpreadsheetNotFound:
        print(f"エラー: スプレッドシートID '{SPREADSHEET_ID}' が見つかりません。")
        print("または、サービスアカウントのメールアドレスをスプレッドシートの編集者として共有しているか確認してください。")
    except Exception as e:
        print(f"スプレッドシートの更新中にエラーが発生しました: {e}")

# --- メイン処理 ---
def main():
    # Google Places APIでレストラン情報を検索
    # 必要に応じて検索クエリを変更してください
    # 例: "佐渡市 カフェ", "佐渡市 ラーメン" など
    collected_data = search_restaurants_with_places_api(query="佐渡市の飲食店")

    if collected_data:
        update_spreadsheet(collected_data)
    
    print("Process finished.")

if __name__ == '__main__':
    main()
