# scraping_and_sheets_updater.py
import requests
from bs4 import BeautifulSoup
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
# ローカル開発用のサービスアカウントキーファイル
SERVICE_ACCOUNT_FILE = os.path.join(SCRIPT_DIR, 'your-service-account-key.json')
# 更新したいスプレッドシートの名前
SPREADSHEET_NAME = '佐渡飲食店マップデータベース'
# Google Geocoding APIキー (環境変数から取得)
GEOCODING_API_KEY = os.environ.get('GEOCODING_API_KEY') 

# --- スクレイピング関数 (例: 佐渡観光協会のサイトを想定) ---
def scrape_sado_tourism_site(url):
    print(f"Scraping: {url}")
    try:
        # 偽のユーザーエージェントを設定して、ボットと判定されにくくする
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status() # エラーがあれば例外を発生
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # --- 店名の取得 ---
        # '.main_ttl'クラスの中にある'h1'タグを探す。より堅牢なセレクター。
        name_tag = soup.select_one('.main_ttl h1')
        name = name_tag.text.strip() if name_tag else "取得不可"

        # --- 住所の取得 ---
        # 'th'タグをすべて探し、テキストが「住所」のものを見つける
        address = "取得不可"
        th_list = soup.find_all('th')
        for th in th_list:
            if '住所' in th.get_text(strip=True):
                # 「住所」のthを見つけたら、その次の要素(td)のテキストを取得
                td = th.find_next_sibling('td')
                if td:
                    address = td.get_text(strip=True)
                break # 住所が見つかったらループを抜ける
        
        # 取得した情報と、どのURLから取得したかを辞書で返す
        # 'url'を返すことで、差分更新の際に役立つ
        return {'name': name, 'address': address, 'url': url}
        
    except requests.RequestException as e:
        print(f"Error scraping {url}: {e}")
        return None

# --- ジオコーディング関数 ---
def get_lat_lng(address):
    if not GEOCODING_API_KEY:
        print("Geocoding API key not found. Skipping.")
        return None, None
    if address == "取得不可":
        return None, None
        
    params = {'address': address, 'key': GEOCODING_API_KEY}
    response = requests.get('https://maps.googleapis.com/maps/api/geocode/json', params=params)
    
    if response.status_code == 200:
        data = response.json()
        if data['status'] == 'OK':
            location = data['results'][0]['geometry']['location']
            return location.get('lat'), location.get('lng')
    
    print(f"Geocoding failed for address: {address}. Status: {data.get('status')}")
    return None, None

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
            print(f"Authenticating with local file: {SERVICE_ACCOUNT_FILE}")
            gc = gspread.service_account(filename=SERVICE_ACCOUNT_FILE)
    except Exception as e:
        print(f"Google認証に失敗しました: {e}")
        if not creds_json_str:
             print(f"ローカルの `{SERVICE_ACCOUNT_FILE}` ファイルが存在するか、パスが正しいか確認してください。")
        else:
             print("GitHub Actionsの`GOOGLE_SERVICE_ACCOUNT_KEY` secretが正しいJSON形式か確認してください。")
        return

    try:
        # スプレッドシートを開く
        spreadsheet = gc.open(SPREADSHEET_NAME)
        # 最初のワークシートを選択
        worksheet = spreadsheet.sheet1

        print("Reading existing data from spreadsheet...")
        all_records = worksheet.get_all_records()

        # ヘッダー行を確認し、なければ作成（SourceURL列も追加）
        headers = ["ID", "Name", "Address", "Latitude", "Longitude", "LastUpdated", "SourceURL"]
        if not all_records:
            worksheet.update('A1', [headers], value_input_option='USER_ENTERED')
            print("Header row created.")

        # 既存データを高速に検索できるよう、店舗名をキーにした辞書を作成
        # {店舗名: {データ, 行番号}}
        existing_data_map = {
            record['Name']: {'data': record, 'row_num': i + 2} # +2 for header row and 0-based index
            for i, record in enumerate(all_records) if 'Name' in record
        }
        
        updates_to_perform = []
        appends_to_perform = []

        for restaurant in restaurant_list:
            name = restaurant.get('name')
            if not name or name == '取得不可':
                continue
            
            timestamp = time.strftime('%Y-%m-%d %H:%M:%S')

            if name in existing_data_map:
                # --- 既存店舗: 変更があるか確認して更新リストへ ---
                entry = existing_data_map[name]
                old_data = entry['data']
                row_num = entry['row_num']

                # 住所、緯度、経度のいずれかが変更されていたら更新対象
                if (str(old_data.get('Address', '')) != str(restaurant.get('address', '')) or
                    str(old_data.get('Latitude', '')) != str(restaurant.get('lat', '')) or
                    str(old_data.get('Longitude', '')) != str(restaurant.get('lng', ''))):
                    
                    print(f"Updating entry for: {name}")
                    # IDは既存のものを引き継ぐ
                    row_content = [old_data.get('ID', ''), name, restaurant.get('address', ''), restaurant.get('lat', ''), restaurant.get('lng', ''), timestamp, restaurant.get('url', '')]
                    updates_to_perform.append({'range': f'A{row_num}:G{row_num}', 'values': [row_content]})
            else:
                # --- 新規店舗: 追加リストへ ---
                print(f"Found new entry to append: {name}")
                new_id = len(all_records) + len(appends_to_perform) + 1
                row_content = [new_id, name, restaurant.get('address', ''), restaurant.get('lat', ''), restaurant.get('lng', ''), timestamp, restaurant.get('url', '')]
                appends_to_perform.append(row_content)

        if updates_to_perform:
            print(f"Batch updating {len(updates_to_perform)} rows...")
            worksheet.batch_update(updates_to_perform, value_input_option='USER_ENTERED')
            time.sleep(1.5) # APIレート制限への配慮

        if appends_to_perform:
            print(f"Batch appending {len(appends_to_perform)} new rows...")
            worksheet.append_rows(appends_to_perform, value_input_option='USER_ENTERED')
        
        if not updates_to_perform and not appends_to_perform:
            print("No changes detected. Spreadsheet is up-to-date.")

    except gspread.exceptions.SpreadsheetNotFound:
        print(f"エラー: スプレッドシート '{SPREADSHEET_NAME}' が見つかりません。")
        print("または、サービスアカウントのメールアドレスをスプレッドシートの編集者として共有しているか確認してください。")
    except Exception as e:
        print(f"スプレッドシートの更新中にエラーが発生しました: {e}")

# --- メイン処理 ---
def main():
    # スクレイピング対象のURLリスト (仮)
    target_urls = [
        # ここに佐渡の飲食店情報が掲載されているページのURLを追加
        'https://www.visitsado.com/spot/detail0346/',
        'https://www.visitsado.com/spot/detail0950/',
    ]

    if not target_urls:
        print("対象URLが指定されていません。処理をスキップします。")
        return
    
    collected_data = []
    for url in target_urls:
        info = scrape_sado_tourism_site(url)
        if info:
            lat, lng = get_lat_lng(info['address'])
            info['lat'] = lat
            info['lng'] = lng
            collected_data.append(info)
        # サーバーへの負荷を考慮した待機
        print("Waiting 5 seconds before next request...")
        time.sleep(5) 

    if collected_data:
        update_spreadsheet(collected_data)
    
    print("Process finished.")

if __name__ == '__main__':
    main()
