#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
佐渡飲食店マップ - 地区分類更新スクリプト
既存データベースの「その他」地区を最新の地区分類で再判定・更新

使用方法:
python update_district_classification.py

環境変数:
- GOOGLE_SERVICE_ACCOUNT_KEY: Google Sheets API認証キー
- SPREADSHEET_ID: スプレッドシートID
"""

import os
import json
import time
import gspread
from dotenv import load_dotenv

# 環境変数読み込み（複数の場所から読み込み対応）
if os.path.exists('.env'):
    load_dotenv()

# プロジェクトルートの.env.localも読み込み
project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
env_local_path = os.path.join(project_root, '.env.local')
if os.path.exists(env_local_path):
    load_dotenv(env_local_path)

# GitHub Actions環境での環境変数読み込み
SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID') or os.environ.get('VITE_SPREADSHEET_ID')

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
        # 相川町内の詳細地名
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
        '赤泊村': '佐渡市赤泊',
        # 異体字・繁体字の正規化
        '新穗': '新穂',
        '両津': '両津',
        '相川': '相川',
        '佐和田': '佐和田',
        '畑野': '畑野',
        '真野': '真野',
        '小木': '小木',
        '羽茂': '羽茂',
        '赤泊': '赤泊'
    }
    
    normalized = address
    for old, new in replacements.items():
        normalized = normalized.replace(old, new)
    
    return normalized

def classify_district_by_coordinates(lat, lng):
    """緯度経度による地区判定（補助機能）"""
    try:
        lat = float(lat)
        lng = float(lng)
    except (ValueError, TypeError):
        return None
    
    # 佐渡島の各地区の大まかな境界（緯度経度範囲）
    # 参考: Google Maps等での地区境界の確認に基づく
    district_bounds = {
        '両津地区': {
            'lat_min': 37.95, 'lat_max': 38.45, 
            'lng_min': 138.45, 'lng_max': 138.60
        },
        '相川地区': {
            'lat_min': 38.00, 'lat_max': 38.25,
            'lng_min': 138.20, 'lng_max': 138.45
        },
        '佐和田地区': {
            'lat_min': 37.90, 'lat_max': 38.10,
            'lng_min': 138.30, 'lng_max': 138.43
        },
        '金井地区': {
            'lat_min': 37.85, 'lat_max': 38.05,
            'lng_min': 138.25, 'lng_max': 138.38
        },
        '新穂地区': {
            'lat_min': 37.88, 'lat_max': 38.08,
            'lng_min': 138.35, 'lng_max': 138.50
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
    matching_districts = []
    for district, bounds in district_bounds.items():
        if (bounds['lat_min'] <= lat <= bounds['lat_max'] and 
            bounds['lng_min'] <= lng <= bounds['lng_max']):
            matching_districts.append(district)
    
    # 複数該当する場合は、より具体的な地区を優先
    if matching_districts:
        # 新穂地区、金井地区、畑野地区などの内陸部を優先
        priority_order = ['新穂地区', '金井地区', '畑野地区', '真野地区', '佐和田地区', '相川地区', '両津地区', '小木地区', '羽茂地区', '赤泊地区']
        for district in priority_order:
            if district in matching_districts:
                return district
        return matching_districts[0]
    
    return None

def classify_district(address):
    """住所から地区を分類（改良版）"""
    normalized_address = normalize_address(address)
    
    # より精密なマッチング
    for district, areas in SADO_DISTRICTS.items():
        for area in areas:
            if area in normalized_address:
                return district
    
    return "その他"

def authenticate_google_sheets():
    """Google Sheets認証"""
    creds_json_str = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    
    try:
        if creds_json_str:
            creds_dict = json.loads(creds_json_str)
            return gspread.service_account_from_dict(creds_dict)
        else:
            service_account_file = os.path.join(os.path.dirname(__file__), 'your-service-account-key.json')
            return gspread.service_account(filename=service_account_file)
    except Exception as e:
        print(f"Google認証エラー: {e}")
        return None

def update_district_classifications(spreadsheet):
    """「その他」地区のデータを再分類して更新"""
    
    # 更新対象のワークシート
    worksheets_to_check = ['飲食店', '駐車場', '公衆トイレ']
    
    total_updated = 0
    
    for sheet_name in worksheets_to_check:
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
            print(f"\n=== 処理中: {sheet_name} ===")
        except gspread.exceptions.WorksheetNotFound:
            print(f"ワークシート '{sheet_name}' が見つかりません。スキップします。")
            continue
        
        # 全データを取得
        try:
            all_records = worksheet.get_all_records()
        except Exception as e:
            print(f"データ取得エラー ({sheet_name}): {e}")
            continue
        
        if not all_records:
            print(f"データが見つかりません: {sheet_name}")
            continue
        
        # 「その他」地区のデータを抽出
        other_district_records = [
            (i + 2, record) for i, record in enumerate(all_records) 
            if record.get('地区') == 'その他'
        ]
        
        if not other_district_records:
            print(f"「その他」地区のデータはありません: {sheet_name}")
            continue
        
        print(f"「その他」地区のデータ数: {len(other_district_records)}")
        
        # 更新データを準備
        updates = []
        updated_count = 0
        
        for row_num, record in other_district_records:
            # 住所フィールドを特定（シートによって異なる）
            address_field = '住所' if sheet_name == '飲食店' else '所在地'
            address = record.get(address_field, '')
            
            if not address:
                print(f"  行 {row_num}: 住所データなし")
                continue
            
            # 新しい地区分類を判定
            new_district = classify_district(address)
            
            # 住所による判定が「その他」の場合、緯度経度による判定を試行
            if new_district == 'その他':
                lat = record.get('緯度', '')
                lng = record.get('経度', '')
                if lat and lng:
                    coord_district = classify_district_by_coordinates(lat, lng)
                    if coord_district:
                        new_district = coord_district
                        print(f"  行 {row_num}: 緯度経度により {new_district} に分類")
            
            if new_district != 'その他':
                # 地区列のインデックスを取得（一般的には12列目: L列）
                headers = worksheet.row_values(1)
                district_col_index = headers.index('地区') + 1 if '地区' in headers else 12
                district_cell = f"{chr(64 + district_col_index)}{row_num}"
                
                updates.append({
                    'range': district_cell,
                    'values': [[new_district]]
                })
                
                updated_count += 1
                print(f"  行 {row_num}: {address[:30]}... → {new_district}")
        
        # バッチ更新実行
        if updates:
            try:
                worksheet.batch_update(updates)
                print(f"✅ {sheet_name}: {updated_count}件のデータを更新しました")
                total_updated += updated_count
                time.sleep(1.5)  # API制限対策
            except Exception as e:
                print(f"❌ 更新エラー ({sheet_name}): {e}")
        else:
            print(f"更新対象なし: {sheet_name}")
    
    return total_updated

def analyze_other_districts(spreadsheet):
    """「その他」地区データの詳細分析"""
    
    worksheets_to_check = ['飲食店', '駐車場', '公衆トイレ']
    
    print("\n=== 「その他」地区データの分析 ===")
    
    for sheet_name in worksheets_to_check:
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
            all_records = worksheet.get_all_records()
        except:
            continue
        
        # 「その他」地区のデータを分析
        other_records = [record for record in all_records if record.get('地区') == 'その他']
        
        if not other_records:
            continue
        
        print(f"\n【{sheet_name}】")
        print(f"「その他」地区データ数: {len(other_records)}")
        
        # 住所パターンを分析
        address_field = '住所' if sheet_name == '飲食店' else '所在地'
        addresses = [record.get(address_field, '') for record in other_records]
        
        # ユニークな住所パターンを表示（最初の5件）
        unique_addresses = list(set(addresses))[:5]
        
        print("住所例:")
        for addr in unique_addresses:
            if addr:
                new_district = classify_district(addr)
                print(f"  {addr[:50]}... → {new_district}")

def main():
    """メイン処理"""
    
    # デバッグ用：環境変数確認
    print(f"🔍 SPREADSHEET_ID確認: {SPREADSHEET_ID}")
    print(f"🔍 VITE_SPREADSHEET_ID確認: {os.environ.get('VITE_SPREADSHEET_ID')}")
    
    if not SPREADSHEET_ID:
        print("❌ SPREADSHEET_IDが設定されていません")
        print("💡 .env.local または tools/scraper/.env を確認してください")
        return
    
    print("🔄 佐渡飲食店マップ - 地区分類更新スクリプト")
    print(f"📊 対象スプレッドシート: {SPREADSHEET_ID}")
    
    # Google Sheets認証
    gc = authenticate_google_sheets()
    if not gc:
        print("❌ Google Sheets認証に失敗しました")
        return
    
    try:
        spreadsheet = gc.open_by_key(SPREADSHEET_ID)
        print(f"✅ スプレッドシート接続成功: {spreadsheet.title}")
    except Exception as e:
        print(f"❌ スプレッドシートオープンエラー: {e}")
        return
    
    # 分析モード（実際の更新前に確認）
    print("\n--- Step 1: 現状分析 ---")
    analyze_other_districts(spreadsheet)
    
    # 更新実行の確認
    print("\n--- Step 2: 更新実行 ---")
    try:
        total_updated = update_district_classifications(spreadsheet)
        
        print(f"\n✅ 処理完了！")
        print(f"📊 合計更新件数: {total_updated}件")
        
        if total_updated > 0:
            print("\n💡 更新後の確認:")
            print("   - Google Sheetsで地区分類を確認してください")
            print("   - 必要に応じてフロントエンドのデータも更新してください")
        
    except Exception as e:
        print(f"❌ 処理エラー: {e}")

if __name__ == '__main__':
    main()
