#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全データの地区分類検証スクリプト
既存データに最新の地区分類ロジックが適用されているかチェック

⚠️ 注意: このファイルは2025年8月3日の地区分類改善作業で作成された検証用スクリプトです
         定期的なデータ検証に使用できますが、必要に応じて削除可能です

使用方法:
    python validate_all_districts.py                    # 全データ検証
    
関数:
    validate_all_data()                                 # 全データの検証
    update_all_misclassified_data(dry_run=True)        # 誤分類データの修正
    analyze_district_patterns()                        # 地区パターンの分析
"""

import os
import json
import time
import gspread
from dotenv import load_dotenv
from update_district_classification import (
    authenticate_google_sheets, 
    classify_district, 
    classify_district_by_coordinates,
    normalize_address
)

# 環境変数読み込み
if os.path.exists('.env'):
    load_dotenv()

SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID') or os.environ.get('VITE_SPREADSHEET_ID')

def validate_all_data():
    """全データの地区分類を検証"""
    
    print("🔍 全データの地区分類検証開始")
    
    # Google Sheets認証
    gc = authenticate_google_sheets()
    if not gc:
        print("❌ Google Sheets認証に失敗しました")
        return False
    
    try:
        spreadsheet = gc.open_by_key(SPREADSHEET_ID)
        print(f"✅ スプレッドシート接続成功: {spreadsheet.title}")
    except Exception as e:
        print(f"❌ スプレッドシートオープンエラー: {e}")
        return False
    
    # 各シートを検証
    worksheets_to_check = ['飲食店', '駐車場', '公衆トイレ']
    total_misclassified = 0
    
    for sheet_name in worksheets_to_check:
        print(f"\n{'='*50}")
        print(f"📋 {sheet_name}シートの検証")
        print(f"{'='*50}")
        
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
        except gspread.exceptions.WorksheetNotFound:
            print(f"⚠️ ワークシート '{sheet_name}' が見つかりません")
            continue
        
        # データ取得
        try:
            all_records = worksheet.get_all_records()
            print(f"📊 総データ数: {len(all_records)}件")
        except Exception as e:
            print(f"❌ データ取得エラー: {e}")
            continue
        
        if not all_records:
            print("⚠️ データがありません")
            continue
        
        # 検証結果の統計
        stats = {
            'total': len(all_records),
            'correct': 0,
            'misclassified': 0,
            'no_address': 0,
            'no_coordinates': 0,
            'improved_by_coordinates': 0
        }
        
        misclassified_items = []
        
        # 各レコードを検証
        for i, record in enumerate(all_records):
            row_num = i + 2  # ヘッダー行を考慮
            
            # フィールド名はシートによって異なる
            name_field = '店舗名' if sheet_name == '飲食店' else '名称'
            address_field = '住所' if sheet_name == '飲食店' else '所在地'
            
            name = record.get(name_field, '')
            address = record.get(address_field, '')
            current_district = record.get('地区', '')
            lat = record.get('緯度', '')
            lng = record.get('経度', '')
            
            # 住所データがない場合
            if not address:
                stats['no_address'] += 1
                continue
            
            # 座標データがない場合
            if not lat or not lng:
                stats['no_coordinates'] += 1
            
            # 最新ロジックによる地区判定
            address_district = classify_district(address)
            coord_district = None
            
            if lat and lng:
                try:
                    coord_district = classify_district_by_coordinates(float(lat), float(lng))
                except (ValueError, TypeError):
                    pass
            
            # 最終的な正しい地区
            correct_district = address_district
            if correct_district == 'その他' and coord_district:
                correct_district = coord_district
                stats['improved_by_coordinates'] += 1
            
            # 現在の分類と比較
            if current_district == correct_district:
                stats['correct'] += 1
            else:
                stats['misclassified'] += 1
                misclassified_items.append({
                    'row': row_num,
                    'name': name,
                    'address': address,
                    'current_district': current_district,
                    'correct_district': correct_district,
                    'address_district': address_district,
                    'coord_district': coord_district,
                    'lat': lat,
                    'lng': lng
                })
        
        # 検証結果の表示
        print(f"\n📊 検証結果:")
        print(f"   ✅ 正しく分類済み: {stats['correct']}件 ({stats['correct']/stats['total']*100:.1f}%)")
        print(f"   ❌ 誤分類: {stats['misclassified']}件 ({stats['misclassified']/stats['total']*100:.1f}%)")
        print(f"   ⚠️ 住所データなし: {stats['no_address']}件")
        print(f"   ⚠️ 座標データなし: {stats['no_coordinates']}件")
        print(f"   📍 座標で改善: {stats['improved_by_coordinates']}件")
        
        # 誤分類の詳細表示（最初の10件）
        if misclassified_items:
            print(f"\n❌ 誤分類の詳細（最初の10件）:")
            for item in misclassified_items[:10]:
                print(f"   行{item['row']}: {item['name']}")
                print(f"      住所: {item['address']}")
                print(f"      現在: '{item['current_district']}' → 正解: '{item['correct_district']}'")
                if item['address_district'] != item['coord_district']:
                    print(f"      (住所判定: '{item['address_district']}', 座標判定: '{item['coord_district']}')")
                print()
        
        total_misclassified += stats['misclassified']
    
    print(f"\n{'='*60}")
    print(f"🎯 全体の検証結果")
    print(f"{'='*60}")
    print(f"❌ 誤分類の総数: {total_misclassified}件")
    
    if total_misclassified > 0:
        print(f"💡 修正が必要なデータが見つかりました")
        print(f"   update_all_misclassified_data() 関数で一括修正できます")
    else:
        print(f"✅ すべてのデータが正しく分類されています")
    
    return total_misclassified == 0

def update_all_misclassified_data(dry_run=True):
    """誤分類されたデータを一括修正"""
    
    print(f"🔧 誤分類データの一括修正 (ドライラン: {dry_run})")
    
    # Google Sheets認証
    gc = authenticate_google_sheets()
    if not gc:
        return False
    
    try:
        spreadsheet = gc.open_by_key(SPREADSHEET_ID)
    except Exception as e:
        print(f"❌ スプレッドシートオープンエラー: {e}")
        return False
    
    worksheets_to_check = ['飲食店', '駐車場', '公衆トイレ']
    total_updated = 0
    
    for sheet_name in worksheets_to_check:
        print(f"\n📋 {sheet_name}シートの修正")
        
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
            all_records = worksheet.get_all_records()
        except Exception as e:
            print(f"❌ エラー: {e}")
            continue
        
        if not all_records:
            continue
        
        # 修正対象を特定
        updates = []
        
        for i, record in enumerate(all_records):
            row_num = i + 2
            
            # フィールド名の取得
            address_field = '住所' if sheet_name == '飲食店' else '所在地'
            address = record.get(address_field, '')
            current_district = record.get('地区', '')
            lat = record.get('緯度', '')
            lng = record.get('経度', '')
            
            if not address:
                continue
            
            # 正しい地区判定
            address_district = classify_district(address)
            coord_district = None
            
            if lat and lng:
                try:
                    coord_district = classify_district_by_coordinates(float(lat), float(lng))
                except:
                    pass
            
            correct_district = address_district if address_district != 'その他' else coord_district
            
            # 修正が必要な場合
            if current_district != correct_district and correct_district:
                # 地区列のセル位置を計算
                headers = worksheet.row_values(1)
                district_col_index = headers.index('地区') + 1 if '地区' in headers else 12
                district_cell = f"{chr(64 + district_col_index)}{row_num}"
                
                updates.append({
                    'range': district_cell,
                    'values': [[correct_district]]
                })
                
                name_field = '店舗名' if sheet_name == '飲食店' else '名称'
                name = record.get(name_field, '')
                
                print(f"   行{row_num}: {name}")
                print(f"      '{current_district}' → '{correct_district}'")
        
        # 更新実行
        if updates:
            print(f"\n📝 {len(updates)}件の修正対象")
            
            if not dry_run:
                try:
                    worksheet.batch_update(updates)
                    print(f"✅ {sheet_name}: {len(updates)}件を修正しました")
                    total_updated += len(updates)
                    time.sleep(1.5)  # API制限対策
                except Exception as e:
                    print(f"❌ 更新エラー: {e}")
            else:
                print(f"💡 ドライランモード: 実際の更新は行いません")
        else:
            print(f"✅ 修正対象なし")
    
    if not dry_run:
        print(f"\n✅ 一括修正完了: {total_updated}件")
    else:
        print(f"\n💡 実際に修正するには dry_run=False で実行してください")
    
    return True

def analyze_district_patterns():
    """地区分類パターンの分析"""
    
    print("📊 地区分類パターンの分析")
    
    gc = authenticate_google_sheets()
    if not gc:
        return
    
    try:
        spreadsheet = gc.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet('飲食店')
        all_records = worksheet.get_all_records()
    except Exception as e:
        print(f"❌ エラー: {e}")
        return
    
    # 地区別の統計
    district_stats = {}
    address_patterns = {}
    
    for record in all_records:
        address = record.get('住所', '')
        district = record.get('地区', '')
        
        if not district:
            continue
        
        # 地区別カウント
        district_stats[district] = district_stats.get(district, 0) + 1
        
        # 住所パターンの分析
        if district not in address_patterns:
            address_patterns[district] = []
        
        # 住所の最初の部分を抽出
        normalized = normalize_address(address)
        if normalized:
            # 最初の地名部分を抽出
            parts = normalized.replace('佐渡市', '').split()
            if parts:
                first_part = parts[0][:10]  # 最初の10文字
                address_patterns[district].append(first_part)
    
    print(f"\n📊 地区別データ数:")
    for district, count in sorted(district_stats.items()):
        print(f"   {district}: {count}件")
    
    print(f"\n📍 地区別住所パターン（上位5パターン）:")
    for district in sorted(address_patterns.keys()):
        patterns = address_patterns[district]
        if patterns:
            from collections import Counter
            common_patterns = Counter(patterns).most_common(5)
            print(f"   {district}:")
            for pattern, count in common_patterns:
                print(f"      '{pattern}': {count}件")

if __name__ == "__main__":
    print("🔍 既存データの地区分類検証システム")
    print("=" * 60)
    
    # Step 1: 全データの検証
    print("\n🔍 Step 1: 全データの検証")
    is_all_correct = validate_all_data()
    
    # Step 2: パターン分析
    print(f"\n📊 Step 2: 地区分類パターンの分析")
    analyze_district_patterns()
    
    # Step 3: 修正の提案
    if not is_all_correct:
        print(f"\n🔧 Step 3: 修正オプション")
        print(f"   誤分類が見つかりました。以下のオプションで修正できます:")
        print(f"   1. ドライラン（確認のみ）: update_all_misclassified_data(dry_run=True)")
        print(f"   2. 実際に修正: update_all_misclassified_data(dry_run=False)")
        print(f"\n💡 修正を実行しますか？")
        
        # ユーザーの選択を待つ（実際の実行では手動で関数を呼び出す）
        print(f"   以下のコマンドを実行してください:")
        print(f"   update_all_misclassified_data(dry_run=False)")
    else:
        print(f"\n✅ Step 3: すべてのデータが正しく分類されています")
    
    print(f"\n✅ 検証完了")
