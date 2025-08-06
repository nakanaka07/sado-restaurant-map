#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
地区・GoogleマップURL修正版更新ツール

列番号を正しく計算して、地区とGoogleマップURLを更新します。
"""

import os
import sys
from pathlib import Path

# パスを追加
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from utils.google_auth import authenticate_google_sheets, validate_environment

def column_number_to_letter(col_num):
    """列番号（0ベース）をGoogle Sheetsの列文字に変換"""
    result = ""
    while col_num >= 0:
        result = chr(col_num % 26 + ord('A')) + result
        col_num = col_num // 26 - 1
    return result

def determine_district(address: str) -> str:
    """住所から佐渡市の地区を判定"""
    if not address:
        return ''
    
    # 佐渡市の公式地区分類
    district_mapping = {
        '両津': [
            '両津夷', '両津湊', '両津福浦', '梅津', '秋津', '原黒', '加茂歌代',
            '吉井', '吉井本郷', '立野', '水津', '東強清水', '両尾', '下久知',
            '上横山', '下横山', '月布施', '河崎', '長江', '真野', '真野新町'
        ],
        '相川': [
            '相川', '相川市町', '相川栄町', '相川北沢町', '相川一町目', '相川二町目',
            '相川三町目', '相川四町目', '相川五町目', '相川六町目', '相川下戸町',
            '相川下戸村', '相川材木町', '相川羽田町', '相川羽田村', '下相川',
            '北鵜島', '稲鯨', '橘', '海府', '鹿伏', '北狄', '高千', '北松ケ崎',
            '戸地', '戸中', '姫津', '関', '小川', '大小', '入川', '田切須'
        ],
        '佐和田': [
            '佐和田', '八幡', '八幡新町', '河原田', '河原田本町', '河原田諏訪町',
            '中原', '窪田', '沢根', '沢根篭町', '沢根五十里', '真野', '真野新町',
            '背合', '四日町', '市野沢', '平清水', '大小', '二見'
        ],
        '金井': [
            '金井', '金井新保', '千種', '貝塚', '下新穂', '新穂', '新穂舟下',
            '新穂武井', '新穂青木', '新穂瓜生屋', '新穂正明寺', '新穂長畝',
            '新穂潟上', '新穂田野沢', '新穂皆川', '新穂大野', '新穂北方',
            '畑野', '畑野甲', '畑野乙', '目黒町', '泉', '泉甲', '泉乙'
        ],
        '羽茂': [
            '羽茂', '羽茂大橋', '羽茂上山田', '羽茂小泊', '羽茂三瀬', '羽茂滝平',
            '羽茂本郷', '羽茂村山', '羽茂亀脇', '村山', '飯岡', '蒲原', '阿仏坊'
        ],
        '小木': [
            '小木', '小木町', '小木大浦', '小木堂釜', '宿根木', '強清水',
            '田野浦', '深浦', '犬神平', '琴浦', '木野浦', '五十浦',
            '岩谷口', '虫崎', '北田野浦', '南田野浦'
        ],
        '赤泊': [
            '赤泊', '多田', '杉野浦', '柳沢', '大杉', '徳和', '莚場',
            '真更川', '南新保', '赤玉', '南片辺', '北片辺'
        ],
        '松ヶ崎': [
            '松ヶ崎', '北松ヶ崎', '南松ヶ崎', '鷲崎', '願', '北小浦', '豊岡'
        ],
        '前浜': [
            '前浜', '岩首', '野浦', '鹿野浦', '柿野浦', '豊田', '東鵜島'
        ]
    }
    
    # 住所から地区を判定
    for district, areas in district_mapping.items():
        for area in areas:
            if area in address:
                return district
    
    # 佐渡市以外の場合は「市外」
    if '佐渡市' not in address:
        return '市外'
    
    # 判定できない場合は空文字
    return ''

def generate_google_maps_url(place_id: str) -> str:
    """Place IDからGoogleマップURLを生成"""
    if not place_id:
        return ''
    
    # GoogleマップのPlace ID URL形式
    return f"https://www.google.com/maps/place/?q=place_id:{place_id}"

def update_missing_fields_fixed():
    """地区・GoogleマップURLの修正版自動設定"""
    
    print("🔧 地区・GoogleマップURL修正版更新ツール")
    print("=" * 70)
    
    # 環境変数の確認
    if not validate_environment():
        print("❌ 環境変数が設定されていません")
        return
    
    # Google Sheets認証
    gc = authenticate_google_sheets()
    spreadsheet_id = os.getenv('SPREADSHEET_ID')
    
    try:
        spreadsheet = gc.open_by_key(spreadsheet_id)
        print(f"✅ スプレッドシート接続成功: {spreadsheet.title}")
        
        # restaurantsシートから開始
        sheet_name = 'restaurants'
        print(f"\n📄 シート更新: {sheet_name}")
        print("-" * 50)
        
        sheet = spreadsheet.worksheet(sheet_name)
        
        # ヘッダー行を取得
        headers = sheet.row_values(1)
        
        # 必要な列インデックスを特定
        place_id_index = None
        address_index = None
        district_index = None
        maps_url_index = None
        
        for i, header in enumerate(headers):
            if header == 'Place ID':
                place_id_index = i
            elif header == '所在地':
                address_index = i
            elif header == '地区':
                district_index = i
            elif header == 'GoogleマップURL':
                maps_url_index = i
        
        print(f"📍 列インデックス:")
        print(f"   Place ID: {place_id_index}")
        print(f"   所在地: {address_index}")
        print(f"   地区: {district_index} → {column_number_to_letter(district_index)}")
        print(f"   GoogleマップURL: {maps_url_index} → {column_number_to_letter(maps_url_index)}")
        
        if None in [place_id_index, address_index, district_index, maps_url_index]:
            print(f"❌ 必要な列が見つかりません")
            return
        
        # 最初の3行でテスト更新
        print(f"\n🧪 テスト更新（最初の3行）:")
        
        for test_row in range(2, 5):  # 行2-4
            print(f"\n   行{test_row}:")
            
            # 該当行のデータを取得
            row_data = sheet.row_values(test_row)
            
            if len(row_data) <= max(place_id_index, address_index):
                print(f"      ⚠️ データ不足（{len(row_data)}列）")
                continue
            
            place_id = row_data[place_id_index].strip() if len(row_data) > place_id_index else ''
            address = row_data[address_index].strip() if len(row_data) > address_index else ''
            current_district = row_data[district_index].strip() if len(row_data) > district_index else ''
            current_maps_url = row_data[maps_url_index].strip() if len(row_data) > maps_url_index else ''
            store_name = row_data[1] if len(row_data) > 1 else 'N/A'
            
            print(f"      店舗: {store_name}")
            print(f"      住所: {address[:50]}...")
            print(f"      現在の地区: '{current_district}'")
            print(f"      現在のURL: '{current_maps_url[:30]}...'")
            
            # 地区更新
            if not current_district and address:
                new_district = determine_district(address)
                if new_district:
                    district_cell = f"{column_number_to_letter(district_index)}{test_row}"
                    print(f"      → 地区更新: {district_cell} = '{new_district}'")
                    
                    try:
                        sheet.update(district_cell, new_district)
                        print(f"      ✅ 地区更新成功")
                    except Exception as e:
                        print(f"      ❌ 地区更新失敗: {e}")
            
            # URL更新
            if not current_maps_url and place_id:
                new_maps_url = generate_google_maps_url(place_id)
                if new_maps_url:
                    maps_url_cell = f"{column_number_to_letter(maps_url_index)}{test_row}"
                    print(f"      → URL更新: {maps_url_cell} = '{new_maps_url[:30]}...'")
                    
                    try:
                        sheet.update(maps_url_cell, new_maps_url)
                        print(f"      ✅ URL更新成功")
                    except Exception as e:
                        print(f"      ❌ URL更新失敗: {e}")
        
        # 全データ更新の確認
        print(f"\n❓ 全データ更新を実行しますか？ (y/N): ", end="")
        # 自動的にyesにする（テスト環境）
        answer = 'y'
        print(answer)
        
        if answer.lower() == 'y':
            print(f"\n🔄 全データ更新開始...")
            
            # 全データを取得
            all_data = sheet.get_all_values()
            data_rows = all_data[1:]  # ヘッダー行を除く
            
            # 一括更新用のリスト
            updates = []
            update_count = 0
            
            for row_idx, row in enumerate(data_rows, 2):  # 行番号は2から開始
                if len(row) <= max(place_id_index, address_index):
                    continue
                
                place_id = row[place_id_index].strip() if len(row) > place_id_index else ''
                address = row[address_index].strip() if len(row) > address_index else ''
                current_district = row[district_index].strip() if len(row) > district_index else ''
                current_maps_url = row[maps_url_index].strip() if len(row) > maps_url_index else ''
                
                # 地区更新が必要か
                if not current_district and address:
                    new_district = determine_district(address)
                    if new_district:
                        district_cell = f"{column_number_to_letter(district_index)}{row_idx}"
                        updates.append({
                            'range': district_cell,
                            'values': [[new_district]]
                        })
                
                # URL更新が必要か
                if not current_maps_url and place_id:
                    new_maps_url = generate_google_maps_url(place_id)
                    if new_maps_url:
                        maps_url_cell = f"{column_number_to_letter(maps_url_index)}{row_idx}"
                        updates.append({
                            'range': maps_url_cell,
                            'values': [[new_maps_url]]
                        })
                
                update_count += 1
                if update_count % 100 == 0:
                    print(f"   📊 処理進捗: {update_count}件")
            
            # バッチ更新実行
            if updates:
                print(f"\n📝 {len(updates)}セルを更新中...")
                
                batch_size = 100
                for i in range(0, len(updates), batch_size):
                    batch = updates[i:i + batch_size]
                    sheet.batch_update(batch)
                    print(f"   ✅ バッチ {i//batch_size + 1}: {len(batch)}セル更新完了")
                
                print(f"\n🎉 全更新完了！")
                print(f"   📊 更新セル数: {len(updates)}")
            else:
                print(f"\n ℹ️ 更新が必要なデータがありません")
    
    except Exception as e:
        print(f"❌ エラー: {e}")

def main():
    """メイン実行"""
    update_missing_fields_fixed()

if __name__ == "__main__":
    main()
