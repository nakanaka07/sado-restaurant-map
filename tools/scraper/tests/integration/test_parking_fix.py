#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
駐車場名フィールド修正のテストスクリプト
"""

import os
import sys

# パスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from processors.unified_cid_processor import UnifiedCIDProcessor

def test_parking_field_fix():
    """駐車場名フィールドの修正をテスト"""
    print("🔧 駐車場名フィールド修正テストを開始...")
    
    processor = UnifiedCIDProcessor()
    
    # テストファイルを処理
    queries = processor.parse_query_file('data/urls/parking_test.txt')
    
    if not queries:
        print("❌ テストデータが見つかりません")
        return
    
    print(f"📋 {len(queries)}件のテストクエリを処理")
    
    # 処理実行
    results = processor.process_all_queries(queries)
    
    if results:
        result = results[0]
        print("\n🔍 結果確認:")
        print(f"   Place ID: {result.get('Place ID', 'N/A')}")
        print(f"   駐車場名: {result.get('駐車場名', 'N/A')}")
        print(f"   店舗名: {result.get('店舗名', 'N/A')}")
        print(f"   カテゴリ: {result.get('カテゴリ', 'N/A')}")
        print(f"   カテゴリ詳細: {result.get('カテゴリ詳細', 'N/A')}")
        print(f"   所在地: {result.get('所在地', 'N/A')}")
        
        # 駐車場名フィールドに値があり、店舗名フィールドが空かチェック
        parking_name = result.get('駐車場名', '')
        store_name = result.get('店舗名', '')
        
        if parking_name and not store_name:
            print("\n✅ 修正成功: 駐車場名フィールドに正しく値が設定されています")
            return True
        elif store_name and not parking_name:
            print("\n❌ 修正失敗: 店舗名フィールドに値があり、駐車場名フィールドが空です")
            return False
        else:
            print(f"\n⚠️ 予期しない状態: 駐車場名='{parking_name}', 店舗名='{store_name}'")
            return False
    else:
        print("❌ 処理結果が取得できませんでした")
        return False

if __name__ == "__main__":
    test_parking_field_fix()
