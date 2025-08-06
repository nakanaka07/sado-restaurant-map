#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
地区・GoogleマップURL欠損データ確認ツール

地区やGoogleマップURLが記入されていないレコードを特定・分析します。
"""

import os
import sys
from pathlib import Path

# パスを追加
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from utils.google_auth import authenticate_google_sheets, validate_environment

def check_missing_fields():
    """地区・GoogleマップURLの欠損データ確認"""
    
    print("🔍 地区・GoogleマップURL欠損データ確認ツール")
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
        
        # 分析対象シートリスト
        target_sheets = ['restaurants', 'parkings', 'toilets']
        
        for sheet_name in target_sheets:
            try:
                print(f"\n📄 シート分析: {sheet_name}")
                print("-" * 50)
                
                sheet = spreadsheet.worksheet(sheet_name)
                
                # 全データ取得
                all_data = sheet.get_all_values()
                if len(all_data) < 2:
                    print(f"   ⚠️ データが不足しています（{len(all_data)}行）")
                    continue
                
                headers = all_data[0]
                data_rows = all_data[1:]
                
                print(f"   📊 総レコード数: {len(data_rows)}")
                print(f"   📋 フィールド数: {len(headers)}")
                
                # 地区とGoogleマップURLの列インデックスを特定
                district_index = None
                maps_url_index = None
                store_name_index = None
                location_index = None
                
                for i, header in enumerate(headers):
                    if header == '地区':
                        district_index = i
                    elif header == 'GoogleマップURL':
                        maps_url_index = i
                    elif header in ['店舗名', '駐車場名', '施設名']:
                        store_name_index = i
                    elif header == '所在地':
                        location_index = i
                
                print(f"   📍 地区フィールド位置: 列{district_index + 1 if district_index is not None else 'N/A'}")
                print(f"   🔗 GoogleマップURLフィールド位置: 列{maps_url_index + 1 if maps_url_index is not None else 'N/A'}")
                
                # 欠損データの分析
                missing_district_count = 0
                missing_maps_url_count = 0
                missing_both_count = 0
                total_empty_records = 0
                
                missing_district_records = []
                missing_maps_url_records = []
                missing_both_records = []
                
                for row_idx, row in enumerate(data_rows, 2):  # 2行目から開始
                    # 行が完全に空かチェック
                    if all(cell.strip() == '' for cell in row):
                        total_empty_records += 1
                        continue
                    
                    # 必要なフィールドの値を取得
                    district_value = row[district_index].strip() if district_index is not None and len(row) > district_index else ''
                    maps_url_value = row[maps_url_index].strip() if maps_url_index is not None and len(row) > maps_url_index else ''
                    store_name = row[store_name_index].strip() if store_name_index is not None and len(row) > store_name_index else f'行{row_idx}'
                    location = row[location_index].strip() if location_index is not None and len(row) > location_index else ''
                    
                    # 欠損チェック
                    district_missing = district_value == ''
                    maps_url_missing = maps_url_value == ''
                    
                    if district_missing and maps_url_missing:
                        missing_both_count += 1
                        missing_both_records.append({
                            'row': row_idx,
                            'name': store_name,
                            'location': location
                        })
                    elif district_missing:
                        missing_district_count += 1
                        missing_district_records.append({
                            'row': row_idx,
                            'name': store_name,
                            'location': location,
                            'maps_url': maps_url_value
                        })
                    elif maps_url_missing:
                        missing_maps_url_count += 1
                        missing_maps_url_records.append({
                            'row': row_idx,
                            'name': store_name,
                            'location': location,
                            'district': district_value
                        })
                
                # 統計情報表示
                valid_records = len(data_rows) - total_empty_records
                print(f"\n   📊 欠損データ統計:")
                print(f"      💾 有効レコード数: {valid_records}")
                print(f"      📋 空行数: {total_empty_records}")
                print(f"      🗺️ 地区のみ欠損: {missing_district_count}件")
                print(f"      🔗 GoogleマップURLのみ欠損: {missing_maps_url_count}件")
                print(f"      ⚠️ 両方とも欠損: {missing_both_count}件")
                
                # 欠損率計算
                if valid_records > 0:
                    district_missing_rate = (missing_district_count + missing_both_count) / valid_records * 100
                    maps_url_missing_rate = (missing_maps_url_count + missing_both_count) / valid_records * 100
                    print(f"      📈 地区欠損率: {district_missing_rate:.1f}%")
                    print(f"      📈 GoogleマップURL欠損率: {maps_url_missing_rate:.1f}%")
                
                # 詳細な欠損レコード表示（最大10件）
                if missing_both_records:
                    print(f"\n   ⚠️ 地区・GoogleマップURL両方欠損レコード（最大10件表示）:")
                    for i, record in enumerate(missing_both_records[:10]):
                        print(f"      {i+1:2d}. 行{record['row']:3d}: {record['name'][:30]:<30} | 所在地: {record['location'][:40]}")
                    if len(missing_both_records) > 10:
                        print(f"      ... 他 {len(missing_both_records) - 10}件")
                
                if missing_district_records:
                    print(f"\n   🗺️ 地区のみ欠損レコード（最大5件表示）:")
                    for i, record in enumerate(missing_district_records[:5]):
                        print(f"      {i+1:2d}. 行{record['row']:3d}: {record['name'][:30]:<30} | 所在地: {record['location'][:40]}")
                    if len(missing_district_records) > 5:
                        print(f"      ... 他 {len(missing_district_records) - 5}件")
                
                if missing_maps_url_records:
                    print(f"\n   🔗 GoogleマップURLのみ欠損レコード（最大5件表示）:")
                    for i, record in enumerate(missing_maps_url_records[:5]):
                        print(f"      {i+1:2d}. 行{record['row']:3d}: {record['name'][:30]:<30} | 地区: {record['district']}")
                    if len(missing_maps_url_records) > 5:
                        print(f"      ... 他 {len(missing_maps_url_records) - 5}件")
                
                # 所在地から県の分析
                if missing_district_records or missing_both_records:
                    print(f"\n   📍 県別分析（地区欠損レコード）:")
                    prefecture_analysis = {}
                    
                    all_missing_district = missing_district_records + missing_both_records
                    for record in all_missing_district:
                        location = record['location']
                        # 県名を抽出
                        prefecture = '不明'
                        if '新潟県' in location:
                            prefecture = '新潟県'
                        elif '佐渡市' in location and '新潟県' not in location:
                            prefecture = '新潟県（推定）'
                        elif any(pref in location for pref in ['東京都', '大阪府', '愛知県', '福岡県', '北海道']):
                            for pref in ['東京都', '大阪府', '愛知県', '福岡県', '北海道']:
                                if pref in location:
                                    prefecture = pref
                                    break
                        elif '県' in location:
                            # 県が含まれている場合、県名を抽出
                            parts = location.split('県')
                            if len(parts) > 1:
                                county_part = parts[0].split('、')[-1]
                                prefecture = county_part + '県'
                        
                        if prefecture not in prefecture_analysis:
                            prefecture_analysis[prefecture] = []
                        prefecture_analysis[prefecture].append(record)
                    
                    for prefecture, records in sorted(prefecture_analysis.items()):
                        print(f"      🏛️ {prefecture}: {len(records)}件")
                        for record in records[:3]:  # 最大3件表示
                            print(f"         - {record['name'][:25]:<25} | {record['location'][:35]}")
                        if len(records) > 3:
                            print(f"         ... 他 {len(records) - 3}件")
                
            except Exception as e:
                print(f"❌ シート '{sheet_name}' の分析エラー: {e}")
    
    except Exception as e:
        print(f"❌ スプレッドシート接続エラー: {e}")

def main():
    """メイン実行"""
    check_missing_fields()

if __name__ == "__main__":
    main()
