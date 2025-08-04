# optimized_places_data_updater.py
import requests
import gspread
import time
import os
import json
import re
from typing import List, Dict, Tuple, Optional
from dotenv import load_dotenv

# 改善された検索戦略をインポート
try:
    from improved_search_strategy import ImprovedSearchStrategy, SearchResultAnalyzer
except ImportError:
    # フォールバック実装
    class ImprovedSearchStrategy:
        def should_skip_search(self, query): return False
        def generate_smart_search_queries(self, query, category): return [f"{query} 佐渡"] if "佐渡" not in query else [query]
        def optimize_search_order(self, queries): return queries
    class SearchResultAnalyzer:
        def analyze_successful_query(self, *args): pass
        def analyze_failed_query(self, *args): pass
        def get_recommendations(self): return {}

# .envファイルから環境変数を読み込む（ローカル開発用）
if os.path.exists('.env'):
    load_dotenv()

# --- 設定項目 ---
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

# GitHub Actions環境での環境変数読み込み
PLACES_API_KEY = os.environ.get('PLACES_API_KEY')
SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID')

# サービスアカウントキーのパス設定
if 'GOOGLE_SERVICE_ACCOUNT_KEY' in os.environ:
    # GitHub Actions: 環境変数からJSONキーを取得
    SERVICE_ACCOUNT_FILE_PATH = os.path.join(SCRIPT_DIR, 'your-service-account-key.json')
else:
    # ローカル開発: 既存のJSONファイルを使用
    SERVICE_ACCOUNT_FILE_PATH = os.environ.get('GOOGLE_SERVICE_ACCOUNT_PATH', 
                                               os.path.join(SCRIPT_DIR, 'your-service-account-key.json'))

# APIリクエスト間の待機時間（秒）- 環境変数で調整可能
API_REQUEST_DELAY = float(os.environ.get('API_DELAY', '1'))
SHEETS_API_DELAY = 1.5

# 更新対象データの指定（コスト最適化）
TARGET_DATA = os.environ.get('TARGET_DATA', 'all')  # 'all', 'restaurants', 'parkings', 'toilets'

# 佐渡島の境界ボックス
SADO_BOUNDS = {
    "north": 38.4,
    "south": 37.7,
    "east": 138.6,
    "west": 138.0
}

# 佐渡の地区分類（佐渡市公式サイト基準）
# 参考: https://www.city.sado.niigata.jp/soshiki/2002/2359.html
SADO_DISTRICTS = {
    '両津地区': [
        '両津', '河崎', '秋津', '梅津', '湊', '原黒', '北田野浦', '春日', '浜田', '加茂歌代',
        '羽吉', '椿', '北五十里', '白瀬', '玉崎', '和木', '馬首', '北松ケ崎', '平松',
        '浦川', '歌見', '黒姫', '虫崎', '両津大川', '羽二生', '両尾', '椎泊', '真木',
        '下久知', '久知河内', '城腰', '住吉', '吾潟', '立野', '上横山', '長江',
        '潟端', '下横山', '旭', '水津', '片野尾', '月布施', '野浦', '東強清水',
        '東立島', '岩首', '東鵜島', '柿野浦', '豊岡', '立間', '赤玉', '蚫',
        '北小浦', '見立', '鷲崎', '願', '北鵜島', '真更川', '両津福浦', '藻浦'
    ],
    '相川地区': [
        '相川', '戸中', '北立島', '達者', '入川', '北片辺', '関', '高瀬', '橘', '稲鯨',
        '米郷', '二見', '下相川', '小川', '姫津', '北狄', '戸地', '南片辺', '石花',
        '後尾', '北川内', '高千', '小野見', '石名', '小田', '大倉', '矢柄',
        '五十浦', '岩谷口', '相川大浦',
        # 相川町内の詳細地名も含める
        '相川水金町', '相川柴町', '相川大間町', '相川紙屋町', '相川炭屋町', '相川濁川町',
        '相川坂下町', '相川北沢町', '相川下山之神町', '相川柄杓町', '相川奈良町', '奈良町',
        '相川嘉左衛門町', '相川清右衛門町', '相川銀山町', '相川小右衛門町', '相川勘四郎町',
        '上相川町', '相川五郎右衛門町', '相川宗徳町', '相川庄右衛門町', '相川次助町',
        '相川諏訪町', '相川大工町', '相川新五郎町', '相川六右衛門町', '相川上京町',
        '相川左門町', '相川大床屋町', '相川中京町', '相川下京町', '相川八百屋町',
        '相川会津町', '相川味噌屋町', '相川米屋町', '相川夕白町', '相川弥十郎町',
        '相川四十物町', '相川広間町', '相川西坂町', '相川長坂町', '相川上寺町',
        '相川中寺町', '相川下寺町', '相川南沢町', '相川小六町', '相川新西坂町',
        '相川石扣町', '相川塩屋町', '相川板町', '相川材木町', '相川新材木町',
        '相川羽田町', '相川江戸沢町', '相川一町目', '相川一町目裏町', '相川一町目浜町',
        '相川二町目', '相川五郎左衛門町', '相川二町目浜町', '相川二町目新浜町',
        '相川三町目', '相川三町目浜町', '相川三町目新浜町', '相川四町目',
        '相川四町目浜町', '相川市町', '相川新浜町', '相川馬町', '相川羽田村',
        '相川下戸町', '相川下戸浜町', '相川下戸炭屋町', '相川下戸炭屋裏町',
        '相川下戸炭屋浜町', '相川海士町', '相川下戸村', '相川鹿伏', '相川栄町'
    ],
    '佐和田地区': [
        '佐和田', '沢根', '窪田', '中原', '河原田', '八幡', '八幡新町', '八幡町',
        '河原田本町', '河原田諏訪町', '鍛冶町', '石田', '上長木', '下長木', '長木',
        '上矢馳', '二宮', '市野沢', '真光寺', '山田', '青野', '東大通',
        '沢根五十里', '沢根篭町', '沢根炭屋町', '沢根町'
    ],
    '金井地区': [
        '金井', '千種', '吉井', '泉', '中興', '平清水', '金井新保', '貝塚',
        '大和', '吉井本郷', '安養寺', '三瀬川', '水渡田'
    ],
    '新穂地区': [
        '新穂', '新穗', '大野', '下新穂', '舟下', '皆川', '新穂皆川', '新穂舟下', '新穂武井',
        '新穂大野', '新穂井内', '上新穂', '新穂瓜生屋', '新穂正明寺', '新穂田野沢',
        '新穂潟上', '新穂青木', '新穂長畝', '新穂北方'
    ],
    '畑野地区': [
        '畑野', '宮川', '栗野江', '目黒町', '三宮', '松ケ崎', '多田', '寺田', '飯持',
        '畉田', '大久保', '猿八', '小倉', '長谷', '坊ケ浦', '浜河内', '丸山'
    ],
    '真野地区': [
        '真野', '豊田', '四日町', '吉岡', '大小', '金丸', '長石', '真野新町', '滝脇',
        '背合', '大須', '静平', '下黒山', '真野大川', '名古屋', '国分寺', '竹田',
        '阿仏坊', '阿佛坊', '大倉谷', '田切須', '西三川', '椿尾'
    ],
    '小木地区': [
        '小木', '宿根木', '深浦', '田野浦', '強清水', '小木町', '小木木野浦', '小比叡',
        '小木堂釜', '井坪', '小木大浦', '木流', '江積', '沢崎', '犬神平',
        '小木強清水', '琴浦', '小木金田新田'
    ],
    '羽茂地区': [
        '羽茂', '大石', '羽茂本郷', '羽茂三瀬', '亀脇', '羽茂滝平', '羽茂大崎',
        '羽茂飯岡', '羽茂上山田', '羽茂大橋', '羽茂大石', '羽茂村山', '羽茂亀脇',
        '羽茂小泊'
    ],
    '赤泊地区': [
        '赤泊', '徳和', '柳沢', '莚場', '大杉', '杉野浦', '南新保', '真浦', '三川',
        '外山', '上川茂', '下川茂'
    ]
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
        "worksheet_outside": "飲食店_佐渡市外",
        "fields": BASE_FIELDS + RESTAURANT_ADDITIONAL_FIELDS,
        "included_types": ["restaurant", "meal_takeaway", "cafe", "bar", "bakery"],
        "search_terms": ["レストラン", "食堂", "カフェ", "居酒屋"]
    },
    "駐車場": {
        "worksheet": "駐車場", 
        "worksheet_outside": "駐車場_佐渡市外",
        "fields": BASE_FIELDS,
        "included_types": ["parking"],
        "search_terms": ["駐車場", "パーキング", "parking"]
    },
    "公衆トイレ": {
        "worksheet": "公衆トイレ",
        "worksheet_outside": "公衆トイレ_佐渡市外",
        "fields": BASE_FIELDS,
        "included_types": [],
        "search_terms": ["トイレ", "公衆トイレ", "便所", "化粧室"]
    }
}

# スプレッドシートヘッダー（最適化版）
# 統一ヘッダー定義をインポート
from config.headers import get_unified_header, get_not_found_header, UNIFIED_HEADERS

# 後方互換性のため、従来の変数名も保持
HEADERS = UNIFIED_HEADERS
NOT_FOUND_HEADERS = get_not_found_header()

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

def is_within_sado_bounds(lat, lng):
    """緯度経度が佐渡島の境界内かどうかを判定"""
    try:
        lat = float(lat)
        lng = float(lng)
    except (ValueError, TypeError):
        return False
    
    return (SADO_BOUNDS["south"] <= lat <= SADO_BOUNDS["north"] and 
            SADO_BOUNDS["west"] <= lng <= SADO_BOUNDS["east"])

def classify_district_by_coordinates(lat, lng):
    """緯度経度による地区判定（補助機能）"""
    try:
        lat = float(lat)
        lng = float(lng)
    except (ValueError, TypeError):
        return None
    
    # 佐渡島の境界外の場合は除外
    if not is_within_sado_bounds(lat, lng):
        return None
    
    # 佐渡島の各地区の大まかな境界（緯度経度範囲）
    district_bounds = {
        '両津地区': {
            'lat_min': 37.95, 'lat_max': 38.45, 
            'lng_min': 138.35, 'lng_max': 138.60
        },
        '相川地区': {
            'lat_min': 38.00, 'lat_max': 38.25,
            'lng_min': 138.20, 'lng_max': 138.50
        },
        '佐和田地区': {
            'lat_min': 37.90, 'lat_max': 38.10,
            'lng_min': 138.30, 'lng_max': 138.45
        },
        '金井地区': {
            'lat_min': 37.85, 'lat_max': 38.05,
            'lng_min': 138.25, 'lng_max': 138.40
        },
        '新穂地区': {
            'lat_min': 37.88, 'lat_max': 38.08,
            'lng_min': 138.20, 'lng_max': 138.35
        },
        '畑野地区': {
            'lat_min': 37.82, 'lat_max': 38.00,
            'lng_min': 138.35, 'lng_max': 138.50
        },
        '真野地区': {
            'lat_min': 37.90, 'lat_max': 38.05,
            'lng_min': 138.15, 'lng_max': 138.35
        },
        '小木地区': {
            'lat_min': 37.80, 'lat_max': 37.95,
            'lng_min': 138.25, 'lng_max': 138.40
        },
        '羽茂地区': {
            'lat_min': 37.75, 'lat_max': 37.90,
            'lng_min': 138.30, 'lng_max': 138.45
        },
        '赤泊地区': {
            'lat_min': 37.70, 'lat_max': 37.85,
            'lng_min': 138.35, 'lng_max': 138.50
        }
    }
    
    # 各地区の境界をチェック
    for district, bounds in district_bounds.items():
        if (bounds['lat_min'] <= lat <= bounds['lat_max'] and 
            bounds['lng_min'] <= lng <= bounds['lng_max']):
            return district
    
    return None

def classify_district(address):
    """住所から地区を分類（改良版）"""
    normalized_address = normalize_address(address)
    
    # より精密なマッチング（部分一致から完全一致優先へ）
    for district, areas in SADO_DISTRICTS.items():
        for area in areas:
            if area in normalized_address:
                return district
    
    # 「その他」になった場合のログ出力（デバッグ用）
    print(f"⚠️  地区分類「その他」: {normalized_address}")
    return "その他"

def generate_search_queries(query, category):
    """改善された検索クエリ生成"""
    strategy = ImprovedSearchStrategy()
    
    # 検索をスキップすべきクエリかチェック
    if strategy.should_skip_search(query):
        print(f"  ⏭️ Skipping query (contains exclusion keywords): {query}")
        return []
    
    # スマートな検索クエリ生成
    queries = strategy.generate_smart_search_queries(query, category)
    
    # 検索順序の最適化
    optimized_queries = strategy.optimize_search_order(queries)
    
    return optimized_queries

def search_places_multi_pattern(query, category):
    """改善された検索パターンで場所を検索する"""
    search_queries = generate_search_queries(query, category)
    
    # 検索をスキップする場合
    if not search_queries:
        return 'SKIPPED', [], query
    
    analyzer = SearchResultAnalyzer()
    
    for i, search_query in enumerate(search_queries):
        print(f"  Trying pattern {i+1}/{len(search_queries)}: '{search_query}'")
        
        status, places = search_places_new_api(search_query, category)
        
        if status == 'OK' and places:
            print(f"  ✓ Found {len(places)} places with pattern {i+1}")
            # 成功パターンを分析
            analyzer.analyze_successful_query(query, search_query, category)
            return status, places, search_query
        
        if status == 'REQUEST_FAILED':
            return status, [], search_query
            
        # 短い待機時間
        if i < len(search_queries) - 1:
            time.sleep(0.5)
    
    # 失敗パターンを分析
    analyzer.analyze_failed_query(query, category)
    print(f"  ✗ No results found with any pattern")
    return 'ZERO_RESULTS', [], search_queries[0] if search_queries else query

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

def get_place_details_from_cid(cid_url, category):
    """
    CID URLからPlace詳細を直接取得
    
    Args:
        cid_url: Google Maps CID URL (例: https://maps.google.com/place?cid=1234567890)
        category: カテゴリ名
    
    Returns:
        tuple: (status, places_list)
    """
    if not PLACES_API_KEY:
        print("PLACES_API_KEYが設定されていません。")
        return 'SKIPPED', []
    
    # CIDをPlace IDに変換（簡略化：CIDをそのままplace_idとして使用）
    # 実際のCID->Place ID変換は複雑なため、ここではCIDを直接使用
    import re
    cid_match = re.search(r'cid=(\d+)', cid_url)
    if not cid_match:
        print(f"❌ CID URLの形式が不正: {cid_url}")
        return 'INVALID_CID', []
    
    cid = cid_match.group(1)
    
    # CIDからPlace IDを取得する簡易的な方法
    # Google Maps CIDはそのままPlace IDとして使えない場合があるため、
    # 実際にはText Searchを使用してCIDに対応するPlaceを検索
    try:
        # CIDを使ったURL検索（代替手法）
        # Note: CID直接検索は Places API (New) では非対応のため、
        # 将来的にはLegacy Places APIまたは別の手法が必要
        print(f"🔍 CID URL検索: {cid}")
        return search_places_new_api(f"place_id:{cid}", category)
        
    except Exception as e:
        print(f"❌ CID検索エラー: {e}")
        return 'CID_SEARCH_FAILED', []

def process_query(query, category):
    """
    クエリを処理（テキスト検索またはCID URL）
    
    Args:
        query: 検索クエリ（店舗名またはCID URL）
        category: カテゴリ名
    
    Returns:
        tuple: (status, places_list, processed_query)
    """
    if 'cid=' in query:
        # CID URL の場合
        print(f"🆔 CID URL処理: {query}")
        status, places = get_place_details_from_cid(query, category)
        return status, places, query
    else:
        # テキスト検索の場合（従来通り）
        return search_places_multi_pattern(query, category)

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
    
    # 地区分類（改良版：緯度経度を優先した佐渡島内判定）
    district = classify_district(address)
    
    # 住所による判定が「その他」の場合、緯度経度による判定を試行
    if district == 'その他' and lat and lng:
        coord_district = classify_district_by_coordinates(lat, lng)
        if coord_district:
            district = coord_district
            print(f"  📍 緯度経度により {district} に分類: {name}")
    
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

def is_within_sado(place, category):
    """場所が佐渡島内かどうかを判定（緯度経度を優先）"""
    location = place.get('location', {})
    lat = location.get('latitude', '')
    lng = location.get('longitude', '')
    
    # 緯度経度による判定（最優先）
    if lat and lng:
        if is_within_sado_bounds(lat, lng):
            return True
        else:
            return False
    
    # 緯度経度がない場合は住所による判定
    raw_address = place.get('shortFormattedAddress', '')
    address = normalize_address(raw_address)
    
    # 佐渡関連の住所表記をチェック
    sado_keywords = ['佐渡市', '佐渡', '新潟県佐渡', '両津', '相川', '佐和田', '金井', '新穂', '畑野', '真野', '小木', '羽茂', '赤泊']
    
    return any(keyword in address for keyword in sado_keywords)

def get_or_create_worksheet(spreadsheet, worksheet_name):
    """ワークシートを取得または作成"""
    try:
        return spreadsheet.worksheet(worksheet_name)
    except gspread.exceptions.WorksheetNotFound:
        print(f"Creating worksheet: {worksheet_name}")
        return spreadsheet.add_worksheet(title=worksheet_name, rows=1000, cols=20)

def update_worksheet(spreadsheet, category, places_data):
    """カテゴリ別ワークシートを更新（改良版：佐渡島内外の振り分け対応）"""
    
    # 佐渡島内外でデータを振り分け
    sado_places = []
    outside_places = []
    
    for place in places_data:
        # カテゴリ判定
        place_category = determine_category_from_place(place)
        if place_category != category:
            continue
            
        place_id = place.get('id', '')
        if not place_id:
            continue
        
        # 佐渡島内外を判定
        if is_within_sado(place, category):
            sado_places.append(place)
        else:
            outside_places.append(place)
    
    # 佐渡島内データの処理
    if sado_places:
        worksheet_name = CATEGORIES[category]["worksheet"]
        print(f"Updating worksheet: {worksheet_name} ({len(sado_places)} places)")
        _update_single_worksheet(spreadsheet, category, worksheet_name, sado_places, is_sado=True)
    
    # 佐渡島外データの処理
    if outside_places:
        worksheet_name_outside = CATEGORIES[category]["worksheet_outside"]
        print(f"Updating worksheet: {worksheet_name_outside} ({len(outside_places)} places)")
        _update_single_worksheet(spreadsheet, category, worksheet_name_outside, outside_places, is_sado=False)

def _update_single_worksheet(spreadsheet, category, worksheet_name, places_data, is_sado=True):
    """単一ワークシートの更新処理"""
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
        try:
            all_records = worksheet.get_all_records(expected_headers=expected_headers)
        except:
            # ヘッダー重複の場合、強制的にヘッダーを更新
            worksheet.update('A1', [expected_headers])
            print(f"Headers forcefully updated for {worksheet_name} due to duplicates")
            all_records = []
    
    # 既存データマップ作成
    existing_data = {
        record['プレイスID']: {'data': record, 'row': i + 2}
        for i, record in enumerate(all_records) 
        if record.get('プレイスID')
    }
    
    updates = []
    appends = []
    
    for place in places_data:
        place_id = place.get('id', '')
        if not place_id:
            continue
            
        row_data = extract_place_data(place, category)
        
        # 佐渡島外データの場合、地区情報を「市外」に設定
        if not is_sado:
            if category == "飲食店":
                row_data[11] = "市外"  # 地区フィールド
            else:
                row_data[7] = "市外"   # 地区フィールド
        
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
    """検索結果なしワークシートを更新（改良版 - 効率化対応）"""
    if not not_found_data:
        return
    
    worksheet = get_or_create_worksheet(spreadsheet, "検索結果なし")
    
    try:
        existing_headers = worksheet.row_values(1)
    except:
        existing_headers = []
    
    # NOT_FOUND_HEADERSを使用（既に「スキップ理由」と「改善提案」が含まれている）
    expected_headers = NOT_FOUND_HEADERS
    
    if existing_headers != expected_headers:
        worksheet.update('A1', [expected_headers])
        all_records = []
    else:
        try:
            all_records = worksheet.get_all_records(expected_headers=expected_headers)
        except Exception as e:
            print(f"⚠️ Error reading worksheet {worksheet.title}: {str(e)}")
            # ヘッダー重複の場合、ヘッダーを再設定
            if "duplicates" in str(e).lower():
                worksheet.update('A1', [expected_headers])
                print(f"Headers reset for {worksheet.title} due to duplicates")
            all_records = []
    
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
        skip_reason = item.get('skip_reason', '')
        suggestion = item.get('suggestion', '')
        
        key = (query, category)
        
        if key in existing_queries:
            old_data = existing_queries[key]['data']
            if old_data.get('検索日') == current_date:
                # 試行回数を増やす
                attempts = int(old_data.get('試行回数', 1)) + 1
                row_num = existing_queries[key]['row']
                updates.append({
                    'range': f'A{row_num}:G{row_num}',
                    'values': [[query, search_query, current_date, attempts, category, skip_reason, suggestion]]
                })
            else:
                appends.append([query, search_query, current_date, 1, category, skip_reason, suggestion])
        else:
            appends.append([query, search_query, current_date, 1, category, skip_reason, suggestion])
    
    if updates:
        worksheet.batch_update(updates)
        print(f"Updated {len(updates)} not-found entries")
    if appends:
        worksheet.append_rows(appends)
        print(f"Added {len(appends)} new not-found entries")

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
    """
    ファイルからクエリを読み込み（URL対応版）
    
    対応形式:
    - 店舗名（テキスト）
    - Google Maps URL (cid=XXXXX)
    """
    file_path = os.path.join(SCRIPT_DIR, filename)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            queries = []
            for line in f:
                line = line.strip()
                # コメント行と空行をスキップ
                if not line or line.startswith('#'):
                    continue
                
                # URL の場合はコメント部分を除去
                if 'cid=' in line and '#' in line:
                    url_part = line.split('#')[0].strip()
                    queries.append(url_part)
                else:
                    queries.append(line)
        
        # URL と テキストクエリの統計
        url_count = sum(1 for q in queries if 'cid=' in q)
        text_count = len(queries) - url_count
        
        print(f"📊 {filename}から読み込み: 総計{len(queries)}件 (URL: {url_count}件, テキスト: {text_count}件)")
        return queries
    except FileNotFoundError:
        print(f"⚠️ ファイルが見つかりません: {filename}")
        return []

def main():
    """メイン処理（最適化版）"""
    if not PLACES_API_KEY or not SPREADSHEET_ID:
        print("Error: PLACES_API_KEY or SPREADSHEET_ID not set")
        return
    
    print(f"🎯 Target data: {TARGET_DATA}")
    print(f"⏱️ API delay: {API_REQUEST_DELAY}s")
    
    # Google Sheets認証
    gc = authenticate_google_sheets()
    if not gc:
        return
    
    try:
        spreadsheet = gc.open_by_key(SPREADSHEET_ID)
    except Exception as e:
        print(f"スプレッドシートオープンエラー: {e}")
        return
    
    # クエリファイル読み込み（TARGET_DATAに基づく選択的処理）
    query_files = {
        '飲食店': 'data/urls/restaurants_merged.txt',  # 🆕 統合ファイルを使用
        '公衆トイレ': 'data/queries/toilets.txt', 
        '駐車場': 'data/queries/parkings.txt'
    }
    
    # TARGET_DATAによる絞り込み
    if TARGET_DATA != 'all':
        category_mapping = {
            'restaurants': '飲食店',
            'toilets': '公衆トイレ', 
            'parkings': '駐車場'
        }
        
        if TARGET_DATA in category_mapping:
            category = category_mapping[TARGET_DATA]
            query_files = {category: query_files[category]}
            print(f"📝 Processing only: {category}")
        else:
            print(f"❌ Unknown target data: {TARGET_DATA}")
            return
    
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
            
            status, places, search_query = process_query(query, category)
            
            if status == 'SKIPPED':
                # スキップされたクエリの処理
                category_not_found.append({
                    'original_query': query,
                    'search_query': search_query,
                    'category': category,
                    'skip_reason': '除外キーワード検出',
                    'suggestion': '店舗名を確認し、現在の正式名称で再検索してください'
                })
                continue
            
            # API呼び出し回数をカウント（スキップ時は除外）
            search_queries = generate_search_queries(query, category)
            total_api_calls += len(search_queries) if search_queries else 0
            
            if status == 'ZERO_RESULTS':
                category_not_found.append({
                    'original_query': query,
                    'search_query': search_query,
                    'category': category,
                    'skip_reason': '',
                    'suggestion': '地域名や業種を追加した検索を試してください'
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
    
    # コスト計算と効率レポート
    cost_per_request = 0.017  # Text Search (New) の料金 (USD)
    estimated_cost = total_api_calls * cost_per_request
    
    # 効率レポート生成
    total_queries = sum(len(load_queries_from_file(query_files[cat])) for cat in query_files.keys())
    skipped_queries = sum(1 for item in all_not_found if item.get('skip_reason'))
    success_rate = ((total_queries - len(all_not_found)) / total_queries * 100) if total_queries > 0 else 0
    
    print(f"\n✅ Process completed!")
    print(f"📊 Processing Statistics:")
    print(f"   - Total queries processed: {total_queries}")
    print(f"   - Queries with results: {total_queries - len(all_not_found)}")
    print(f"   - Queries skipped (optimization): {skipped_queries}")
    print(f"   - Queries with no results: {len(all_not_found) - skipped_queries}")
    print(f"   - Success rate: {success_rate:.1f}%")
    print(f"💰 API Usage:")
    print(f"   - Total API calls made: {total_api_calls}")
    print(f"   - Estimated cost: ${estimated_cost:.3f} USD")
    print(f"   - Average calls per query: {total_api_calls/total_queries:.1f}" if total_queries > 0 else "")
    print(f"📅 Target data: {TARGET_DATA}")
    
    # スキップによるコスト削減効果
    if skipped_queries > 0:
        saved_cost = skipped_queries * cost_per_request
        print(f"💡 Cost savings from smart skipping: ${saved_cost:.3f} USD ({skipped_queries} queries)")

if __name__ == '__main__':
    main()