# optimized_places_data_updater.py
import requests
import gspread
import time
import os
import json
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()

# --- 設定項目 ---
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
SERVICE_ACCOUNT_FILE_PATH = os.environ.get('GOOGLE_SERVICE_ACCOUNT_PATH', 
                                           os.path.join(SCRIPT_DIR, 'your-service-account-key.json'))
SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID')
PLACES_API_KEY = os.environ.get('PLACES_API_KEY')

# APIリクエスト間の待機時間（秒）
API_REQUEST_DELAY = 1
SHEETS_API_DELAY = 1.5

# 佐渡島の境界ボックス
SADO_BOUNDS = {
    "north": 38.4,
    "south": 37.7,
    "east": 138.6,
    "west": 138.0
}

# 佐渡の地区分類
SADO_DISTRICTS = {
    '両津地区': ['両津', '河崎', '秋津', '梅津', '湊', '原黒', '北田野浦'],
    '相川地区': ['相川', '戸中', '北立島', '達者', '入川', '北片辺', '関'],
    '佐和田地区': ['佐和田', '沢根', '窪田', '中原', '河原田'],
    '金井地区': ['金井', '千種', '吉井', '下新穂', '泉', '中興'],
    '新穂地区': ['新穂', '大野', '下新穂', '舟下', '皆川'],
    '畑野地区': ['畑野', '宮川', '栗野江', '目黒町', '三宮', '松ヶ崎'],
    '真野地区': ['真野', '豊田', '四日町', '吉岡', '大小'],
    '小木地区': ['小木', '宿根木', '深浦', '田野浦', '強清水'],
    '羽茂地区': ['羽茂', '大石', '羽茂本郷', '羽茂三瀬', '亀脇'],
    '赤泊地区': ['赤泊', '徳和', '柳沢', '多田', '莚場']
}

# カテゴリ別の基本フィールド
BASE_FIELDS = [
    "places.id",
    "places.shortFormattedAddress", 
    "places.location",
    "places.displayName",
    "places.primaryType",
    "places.primaryTypeDisplayName",
    "places.googleMapsLinks"
]

# 飲食店用の追加フィールド
RESTAURANT_ADDITIONAL_FIELDS = [
    "places.regularOpeningHours",
    "places.nationalPhoneNumber",
    "places.rating",
    "places.userRatingCount"
]

# カテゴリ設定
CATEGORIES = {
    "飲食店": {
        "worksheet": "飲食店",
        "fields": BASE_FIELDS + RESTAURANT_ADDITIONAL_FIELDS,
        "included_types": ["restaurant", "meal_takeaway", "cafe", "bar", "bakery"],
        "search_terms": ["レストラン", "食堂", "カフェ", "居酒屋"]
    },
    "駐車場": {
        "worksheet": "駐車場", 
        "fields": BASE_FIELDS,
        "included_types": ["parking"],
        "search_terms": ["駐車場", "パーキング", "parking"]
    },
    "公衆トイレ": {
        "worksheet": "公衆トイレ",
        "fields": BASE_FIELDS,
        "included_types": [],
        "search_terms": ["トイレ", "公衆トイレ", "便所", "化粧室"]
    }
}

# スプレッドシートヘッダー（最適化版）
HEADERS = {
    "飲食店": [
        "プレイスID", "店舗名", "住所", "緯度", "経度", 
        "カテゴリ", "カテゴリ詳細", "電話番号", "営業時間", 
        "評価", "レビュー数", "地区", "GoogleマップURL", "最終更新日時"
    ],
    "駐車場": [
        "プレイスID", "駐車場名", "所在地", "緯度", "経度",
        "カテゴリ", "カテゴリ詳細", "地区", "GoogleマップURL", "最終更新日時"
    ],
    "公衆トイレ": [
        "プレイスID", "施設名", "所在地", "緯度", "経度", 
        "カテゴリ", "カテゴリ詳細", "地区", "GoogleマップURL", "最終更新日時"
    ]
}

NOT_FOUND_HEADERS = ["検索語", "実際の検索語", "検索日", "試行回数", "カテゴリ"]

def normalize_address(address):
    """佐渡の住所を正規化"""
    replacements = {
        '新潟県佐渡市': '佐渡市',
        '佐渡郡': '佐渡市',
        '両津市': '佐渡市両津',
        '相川町': '佐渡市相川',
        '佐和田町': '佐渡市佐和田',
        '金井町': '佐渡市金井',
        '新穂村': '佐渡市新穂',
        '畑野町': '佐渡市畑野',
        '真野町': '佐渡市真野',
        '小木町': '佐渡市小木',
        '羽茂町': '佐渡市羽茂',
        '赤泊村': '佐渡市赤泊'
    }
    
    normalized = address
    for old, new in replacements.items():
        normalized = normalized.replace(old, new)
    
    return normalized

def classify_district(address):
    """住所から地区を分類"""
    normalized_address = normalize_address(address)
    
    for district, areas in SADO_DISTRICTS.items():
        if any(area in normalized_address for area in areas):
            return district
    return "その他"

def generate_search_queries(query, category):
    """検索クエリを「<クエリ> 佐渡」の形式に統一"""
    if "佐渡" not in query:
        return [f"{query} 佐渡"]
    return [query]

def search_places_multi_pattern(query, category):
    """生成された検索クエリで場所を検索する"""
    search_queries = generate_search_queries(query, category)
    
    for i, search_query in enumerate(search_queries):
        print(f"  Trying pattern {i+1}/{len(search_queries)}: '{search_query}'")
        
        status, places = search_places_new_api(search_query, category)
        
        if status == 'OK' and places:
            print(f"  ✓ Found {len(places)} places with pattern {i+1}")
            return status, places, search_query
        
        if status == 'REQUEST_FAILED':
            return status, [], search_query
            
        # 短い待機時間
        if i < len(search_queries) - 1:
            time.sleep(0.5)
    
    print(f"  ✗ No results found with any pattern")
    return 'ZERO_RESULTS', [], search_queries[0]

def search_places_new_api(text_query, category):
    """新しいPlaces API（Text Search）を使用して場所を検索"""
    if not PLACES_API_KEY:
        print("PLACES_API_KEYが設定されていません。")
        return 'SKIPPED', []
    
    config = CATEGORIES[category]
    
    # リクエストボディを構築
    request_body = {
        "textQuery": text_query,
        "languageCode": "ja",
        "maxResultCount": 20,
        "locationBias": {
            "rectangle": {
                "low": {"latitude": SADO_BOUNDS["south"], "longitude": SADO_BOUNDS["west"]},
                "high": {"latitude": SADO_BOUNDS["north"], "longitude": SADO_BOUNDS["east"]}
            }
        }
    }
    
    # カテゴリに応じてフィルタを追加
    if config["included_types"]:
        request_body["includedType"] = config["included_types"][0]
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': ','.join(config["fields"])
    }
    
    try:
        response = requests.post(
            'https://places.googleapis.com/v1/places:searchText',
            headers=headers,
            json=request_body
        )
        response.raise_for_status()
        data = response.json()
        
        places = data.get('places', [])
        return 'OK' if places else 'ZERO_RESULTS', places
        
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        return 'REQUEST_FAILED', []

def determine_category_from_place(place):
    """場所データからカテゴリを判定（改良版）"""
    name = place.get('displayName', {}).get('text', '').lower()
    address = place.get('shortFormattedAddress', '').lower()
    primary_type = place.get('primaryType', '')
    
    # 名前と住所による判定（優先）
    toilet_keywords = ["トイレ", "便所", "化粧室", "restroom", "toilet"]
    parking_keywords = ["駐車", "parking", "パーキング"]
    
    if any(keyword in name for keyword in toilet_keywords) or any(keyword in address for keyword in toilet_keywords):
        return "公衆トイレ"
    
    if any(keyword in name for keyword in parking_keywords) or any(keyword in address for keyword in parking_keywords):
        return "駐車場"
    
    # プライマリタイプによる判定
    if primary_type == "parking":
        return "駐車場"
    elif primary_type in ["restaurant", "meal_takeaway", "cafe", "bar", "bakery", "food"]:
        return "飲食店"
    
    # デフォルトは飲食店
    return "飲食店"

def format_detailed_opening_hours(opening_hours_data):
    """営業時間データを詳細にフォーマット"""
    if not opening_hours_data:
        return ""
    
    # weekdayTextがある場合はそれを優先
    weekday_text = opening_hours_data.get('weekdayText', [])
    if weekday_text:
        return "\n".join(weekday_text)
    
    # periodsから構築
    periods = opening_hours_data.get('periods', [])
    if not periods:
        return ""
    
    formatted_hours = []
    days = ['日', '月', '火', '水', '木', '金', '土']
    
    for period in periods:
        open_time = period.get('open', {})
        close_time = period.get('close', {})
        
        day = open_time.get('day', 0)
        day_name = days[day] if 0 <= day < 7 else str(day)
        
        open_hour = f"{open_time.get('hour', 0):02d}:{open_time.get('minute', 0):02d}"
        
        if close_time:
            close_hour = f"{close_time.get('hour', 0):02d}:{close_time.get('minute', 0):02d}"
            formatted_hours.append(f"{day_name}: {open_hour}-{close_hour}")
        else:
            formatted_hours.append(f"{day_name}: {open_hour}-24:00")
    
    return "\n".join(formatted_hours)

def extract_place_data(place, category):
    """場所データから必要な情報を抽出（改良版）"""
    place_id = place.get('id', '')
    name = place.get('displayName', {}).get('text', '')
    raw_address = place.get('shortFormattedAddress', '')
    address = normalize_address(raw_address)
    
    location = place.get('location', {})
    lat = location.get('latitude', '')
    lng = location.get('longitude', '')
    
    primary_type = place.get('primaryType', '')
    primary_type_display = place.get('primaryTypeDisplayName', {}).get('text', '')
    
    # 地区分類
    district = classify_district(address)
    
    # Google MapsリンクはpreviewなのでフォールバックURLを生成
    google_maps_url = ""
    if 'googleMapsLinks' in place and place['googleMapsLinks']:
        google_maps_url = place['googleMapsLinks'].get('directionsLink', 
                         place['googleMapsLinks'].get('searchLink', ''))
    
    if not google_maps_url and place_id:
        google_maps_url = f"https://www.google.com/maps/search/?api=1&query=Google&query_place_id={place_id}"
    
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    
    # カテゴリ別にデータ構造を最適化
    if category == "飲食店":
        phone = place.get('nationalPhoneNumber', '')
        opening_hours = format_detailed_opening_hours(place.get('regularOpeningHours'))
        rating = place.get('rating', '')
        review_count = place.get('userRatingCount', '')
        
        return [
            place_id, name, address, lat, lng,
            primary_type, primary_type_display, phone, opening_hours,
            rating, review_count, district, google_maps_url, timestamp
        ]
    
    else:
        # 駐車場・公衆トイレ: シンプル構成
        return [
            place_id, name, address, lat, lng,
            primary_type, primary_type_display, district, google_maps_url, timestamp
        ]

def get_or_create_worksheet(spreadsheet, worksheet_name):
    """ワークシートを取得または作成"""
    try:
        return spreadsheet.worksheet(worksheet_name)
    except gspread.exceptions.WorksheetNotFound:
        print(f"Creating worksheet: {worksheet_name}")
        return spreadsheet.add_worksheet(title=worksheet_name, rows=1000, cols=20)

def update_worksheet(spreadsheet, category, places_data):
    """カテゴリ別ワークシートを更新（改良版）"""
    worksheet_name = CATEGORIES[category]["worksheet"]
    print(f"Updating worksheet: {worksheet_name}")
    
    worksheet = get_or_create_worksheet(spreadsheet, worksheet_name)
    
    # ヘッダー確認・設定
    try:
        existing_headers = worksheet.row_values(1)
    except:
        existing_headers = []
    
    expected_headers = HEADERS[category]
    if existing_headers != expected_headers:
        worksheet.update('A1', [expected_headers])
        print(f"Headers updated for {worksheet_name}")
        all_records = []
    else:
        all_records = worksheet.get_all_records()
    
    # 既存データマップ作成
    existing_data = {
        record['プレイスID']: {'data': record, 'row': i + 2}
        for i, record in enumerate(all_records) 
        if record.get('プレイスID')
    }
    
    updates = []
    appends = []
    
    for place in places_data:
        # カテゴリ判定
        place_category = determine_category_from_place(place)
        if place_category != category:
            continue
            
        place_id = place.get('id', '')
        if not place_id:
            continue
            
        row_data = extract_place_data(place, category)
        
        if place_id in existing_data:
            # 既存データの更新判定（改良版）
            old_data = existing_data[place_id]['data']
            row_num = existing_data[place_id]['row']
            
            # より詳細な更新判定
            address_field = "住所" if category == "飲食店" else "所在地"
            needs_update = (
                str(old_data.get(address_field, '')) != str(row_data[2]) or
                str(old_data.get('地区', '')) != str(row_data[-3]) or  # 地区情報
                (category == "飲食店" and (
                    str(old_data.get('電話番号', '')) != str(row_data[7]) or
                    str(old_data.get('営業時間', '')) != str(row_data[8])
                ))
            )
            
            if needs_update:
                end_col = chr(ord('A') + len(expected_headers) - 1)
                updates.append({
                    'range': f'A{row_num}:{end_col}{row_num}',
                    'values': [row_data]
                })
        else:
            appends.append(row_data)
    
    # バッチ更新
    if updates:
        worksheet.batch_update(updates)
        print(f"Updated {len(updates)} rows in {worksheet_name}")
        time.sleep(SHEETS_API_DELAY)
    
    if appends:
        worksheet.append_rows(appends)
        print(f"Added {len(appends)} new rows in {worksheet_name}")

def update_not_found_worksheet(spreadsheet, not_found_data):
    """検索結果なしワークシートを更新（改良版）"""
    if not not_found_data:
        return
    
    worksheet = get_or_create_worksheet(spreadsheet, "検索結果なし")
    
    try:
        existing_headers = worksheet.row_values(1)
    except:
        existing_headers = []
    
    if existing_headers != NOT_FOUND_HEADERS:
        worksheet.update('A1', [NOT_FOUND_HEADERS])
        all_records = []
    else:
        all_records = worksheet.get_all_records()
    
    # 既存クエリマップ
    existing_queries = {
        (record['検索語'], record['カテゴリ']): {'data': record, 'row': i + 2}
        for i, record in enumerate(all_records)
        if record.get('検索語') and record.get('カテゴリ')
    }
    
    current_date = time.strftime('%Y-%m-%d')
    updates = []
    appends = []
    
    for item in not_found_data:
        query = item['original_query']
        search_query = item['search_query']
        category = item['category']
        
        key = (query, category)
        
        if key in existing_queries:
            old_data = existing_queries[key]['data']
            if old_data.get('検索日') == current_date:
                # 試行回数を増やす
                attempts = int(old_data.get('試行回数', 1)) + 1
                row_num = existing_queries[key]['row']
                updates.append({
                    'range': f'A{row_num}:E{row_num}',
                    'values': [[query, search_query, current_date, attempts, category]]
                })
            else:
                appends.append([query, search_query, current_date, 1, category])
        else:
            appends.append([query, search_query, current_date, 1, category])
    
    if updates:
        worksheet.batch_update(updates)
    if appends:
        worksheet.append_rows(appends)

def authenticate_google_sheets():
    """Google Sheets認証"""
    creds_json_str = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    
    try:
        if creds_json_str:
            creds_dict = json.loads(creds_json_str)
            return gspread.service_account_from_dict(creds_dict)
        else:
            return gspread.service_account(filename=SERVICE_ACCOUNT_FILE_PATH)
    except Exception as e:
        print(f"Google認証エラー: {e}")
        return None

def load_queries_from_file(filename):
    """ファイルからクエリを読み込み"""
    file_path = os.path.join(SCRIPT_DIR, filename)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            queries = [line.strip() for line in f 
                      if line.strip() and not line.strip().startswith('#')]
        print(f"Loaded {len(queries)} queries from {filename}")
        return queries
    except FileNotFoundError:
        print(f"Warning: {filename} not found")
        return []

def main():
    """メイン処理（最適化版）"""
    if not PLACES_API_KEY or not SPREADSHEET_ID:
        print("Error: PLACES_API_KEY or SPREADSHEET_ID not set")
        return
    
    # Google Sheets認証
    gc = authenticate_google_sheets()
    if not gc:
        return
    
    try:
        spreadsheet = gc.open_by_key(SPREADSHEET_ID)
    except Exception as e:
        print(f"スプレッドシートオープンエラー: {e}")
        return
    
    # クエリファイル読み込み
    query_files = {
        '飲食店': 'restaurants.txt',
        '公衆トイレ': 'toilets.txt', 
        '駐車場': 'parkings.txt'
    }
    
    all_not_found = []
    total_api_calls = 0
    
    for category, filename in query_files.items():
        queries = load_queries_from_file(filename)
        if not queries:
            continue
        
        print(f"\n=== Processing {category} ({len(queries)} queries) ===")
        all_places = []
        category_not_found = []
        
        for i, query in enumerate(queries, 1):
            print(f"[{i}/{len(queries)}] Processing: {query}")
            
            status, places, search_query = search_places_multi_pattern(query, category)
            total_api_calls += len(generate_search_queries(query, category))
            
            if status == 'ZERO_RESULTS':
                category_not_found.append({
                    'original_query': query,
                    'search_query': search_query,
                    'category': category
                })
            elif status == 'OK':
                all_places.extend(places)
            elif status == 'REQUEST_FAILED':
                print(f"  ⚠️ API request failed for: {query}")
                break
            
            time.sleep(API_REQUEST_DELAY)
        
        # 重複除去
        unique_places = list({place['id']: place for place in all_places 
                            if place.get('id')}.values())
        
        print(f"Found {len(unique_places)} unique places for {category}")
        
        # ワークシート更新
        if unique_places:
            update_worksheet(spreadsheet, category, unique_places)
        
        all_not_found.extend(category_not_found)
        time.sleep(SHEETS_API_DELAY)
    
    # 検索結果なしの記録
    if all_not_found:
        update_not_found_worksheet(spreadsheet, all_not_found)
        print(f"\n{len(all_not_found)} queries had no results")
    
    print(f"\nProcess completed!")
    print(f"Total API calls made: approximately {total_api_calls}")

if __name__ == '__main__':
    main()