#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
実際のAPI レスポンスデバッグスクリプト
"""

import os
import sys

# パスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from processors.unified_cid_processor import UnifiedCIDProcessor

def test_actual_api_response():
    """実際のAPIレスポンスをデバッグ"""
    print("🔧 実際のAPIレスポンスデバッグを開始...")
    
    processor = UnifiedCIDProcessor()
    
    # 実際の駐車場のPlace ID
    test_place_ids = [
        'ChIJ5yhd5IlD818RfYgU8KuzWVg',  # 平根崎駐車場
        'ChIJK06RNHlv818RQ7zYlklxhF0',  # 空の名前のもの  
        'ChIJ0_JiZHJP818RYOA7zmar8SE'   # 平松駐車場
    ]
    
    for i, place_id in enumerate(test_place_ids, 1):
        print(f"\n📍 APIテスト {i}: {place_id}")
        
        # 実際のAPI呼び出し
        details = processor.get_place_details(place_id)
        
        if details:
            print(f"   名前: '{details.get('name', '')}'")
            print(f"   Types: {details.get('types', [])}")
            print(f"   住所: {details.get('formatted_address', '')}")
            
            # 判定テスト
            is_parking = processor._is_parking_data(details)
            is_toilet = processor._is_toilet_data(details)
            
            print(f"   駐車場判定: {is_parking}")
            print(f"   トイレ判定: {is_toilet}")
            
            # 拡張データ生成テスト
            if is_parking or is_toilet:
                extended_data = processor._format_extended_parking_toilet_data(details)
                print(f"   生成されたカテゴリ: '{extended_data.get('カテゴリ', '')}'")
                print(f"   生成されたカテゴリ詳細: '{extended_data.get('カテゴリ詳細', '')}'")
            else:
                print(f"   ⚠️ 駐車場・トイレとして認識されませんでした")
        else:
            print(f"   ❌ API呼び出し失敗")

if __name__ == "__main__":
    test_actual_api_response()
