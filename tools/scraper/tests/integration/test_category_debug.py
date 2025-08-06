#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
カテゴリ設定デバッグテストスクリプト
"""

import os
import sys

# パスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from processors.unified_cid_processor import UnifiedCIDProcessor

def test_category_assignment():
    """カテゴリ設定のデバッグテスト"""
    print("🔧 カテゴリ設定デバッグテストを開始...")
    
    processor = UnifiedCIDProcessor()
    
    # テスト用の模擬データ（実際の駐車場データから）
    test_details = [
        {
            'place_id': 'ChIJ5yhd5IlD818RfYgU8KuzWVg',
            'name': '平根崎駐車場',
            'types': ['parking', 'establishment'],
            'formatted_address': '日本、〒952-2131 新潟県佐渡市戸中 平根崎'
        },
        {
            'place_id': 'ChIJK06RNHlv818RQ7zYlklxhF0',
            'name': '',  # 空の名前（実際のケース）
            'types': ['establishment', 'point_of_interest'],
            'formatted_address': '日本、〒952-1501 新潟県佐渡市下相川'
        },
        {
            'place_id': 'ChIJ0_JiZHJP818RYOA7zmar8SE',
            'name': '平松駐車場',
            'types': ['establishment'],
            'formatted_address': '日本、〒952-3116 新潟県佐渡市北松ケ崎'
        }
    ]
    
    for i, details in enumerate(test_details, 1):
        print(f"\n📍 テストケース {i}: {details.get('name', 'Unknown')}")
        print(f"   Place ID: {details['place_id']}")
        print(f"   Types: {details['types']}")
        
        # 判定テスト
        is_parking = processor._is_parking_data(details)
        is_toilet = processor._is_toilet_data(details)
        
        print(f"   駐車場判定: {is_parking}")
        print(f"   トイレ判定: {is_toilet}")
        
        # カテゴリ詳細メソッドのテスト
        if is_parking:
            category_detail = processor._get_parking_category_detail(details['types'])
            print(f"   カテゴリ: 駐車場")
            print(f"   カテゴリ詳細: {category_detail}")
        elif is_toilet:
            category_detail = processor._get_toilet_category_detail(details['types'])
            print(f"   カテゴリ: 公衆トイレ")
            print(f"   カテゴリ詳細: {category_detail}")
        else:
            print(f"   カテゴリ: 未分類")
            
            # フォールバック処理のテスト
            from utils.translators import translate_types
            japanese_types = translate_types(details['types'])
            print(f"   翻訳されたTypes: {japanese_types}")
            if japanese_types:
                print(f"   フォールバック カテゴリ: {japanese_types[0]}")
                print(f"   フォールバック カテゴリ詳細: {', '.join(japanese_types[1:]) if len(japanese_types) > 1 else ''}")

if __name__ == "__main__":
    test_category_assignment()
