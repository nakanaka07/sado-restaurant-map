"""
駐車場判定とカテゴリ生成の詳細デバッグ
なぜカテゴリフィールドが生成されないのかを調査
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processors.unified_cid_processor import UnifiedCIDProcessor

def debug_parking_detection():
    """駐車場判定とカテゴリ生成をデバッグ"""
    
    print("=== 駐車場判定とカテゴリ生成デバッグ ===")
    
    # テスト用のAPIレスポンス
    test_data = {
        'place_id': 'ChIJK123example',
        'name': 'サンプル駐車場',
        'formatted_address': '佐渡市両津夷12-3',
        'geometry': {
            'location': {
                'lat': 38.0452,
                'lng': 138.3626
            }
        },
        'types': ['establishment', 'parking', 'point_of_interest'],
        'business_status': 'OPERATIONAL'
    }
    
    processor = UnifiedCIDProcessor()
    
    # 各判定メソッドをテスト
    print("🔍 施設タイプ判定テスト:")
    
    is_restaurant = processor._is_restaurant_data(test_data)
    is_parking = processor._is_parking_data(test_data)
    is_toilet = processor._is_toilet_data(test_data)
    
    print(f"   飲食店判定: {is_restaurant}")
    print(f"   駐車場判定: {is_parking}")
    print(f"   トイレ判定: {is_toilet}")
    
    print(f"\n📋 データ内容:")
    print(f"   名前: {test_data.get('name')}")
    print(f"   タイプ: {test_data.get('types')}")
    
    # 拡張データ処理を直接テスト
    print(f"\n🔧 拡張データ処理テスト:")
    
    if is_parking or is_toilet:
        extended_data = processor._format_extended_parking_toilet_data(test_data)
        print(f"   拡張データフィールド数: {len(extended_data)}")
        
        for key, value in extended_data.items():
            print(f"   {key}: {value}")
        
        # カテゴリ生成の詳細確認
        types = test_data.get('types', [])
        print(f"\n🏷️ カテゴリ生成詳細:")
        print(f"   元のタイプリスト: {types}")
        print(f"   駐車場判定: {processor._is_parking_data(test_data)}")
        
        if processor._is_parking_data(test_data):
            category_detail = processor._get_parking_category_detail(types)
            print(f"   生成されるカテゴリ: '駐車場'")
            print(f"   生成されるカテゴリ詳細: '{category_detail}'")
        
    else:
        print("   拡張データ処理が実行されませんでした")
    
    # format_result 全体をテスト
    print(f"\n🏗️ format_result全体テスト:")
    
    query_data = {'type': 'test', 'store_name': 'テスト'}
    result = processor.format_result(test_data, query_data, 'Test API')
    
    print(f"   最終結果フィールド数: {len(result)}")
    
    category_fields = ['カテゴリ', 'カテゴリ詳細']
    for field in category_fields:
        value = result.get(field, '❌ なし')
        print(f"   {field}: {value}")

def test_different_parking_data():
    """異なる駐車場データパターンをテスト"""
    
    print(f"\n=== 異なる駐車場データパターンテスト ===")
    
    test_cases = [
        {
            'name': '一般駐車場',
            'data': {
                'name': 'サンプル駐車場',
                'types': ['establishment', 'parking', 'point_of_interest']
            }
        },
        {
            'name': '観光地駐車場',
            'data': {
                'name': '観光駐車場',
                'types': ['parking', 'tourist_attraction', 'point_of_interest']
            }
        },
        {
            'name': '名前にキーワード含む',
            'data': {
                'name': '佐渡パーキング',
                'types': ['establishment', 'point_of_interest']
            }
        }
    ]
    
    processor = UnifiedCIDProcessor()
    
    for test_case in test_cases:
        data = test_case['data']
        print(f"\n📋 {test_case['name']}:")
        print(f"   名前: {data['name']}")
        print(f"   タイプ: {data['types']}")
        
        is_parking = processor._is_parking_data(data)
        print(f"   駐車場判定: {is_parking}")
        
        if is_parking:
            category_detail = processor._get_parking_category_detail(data['types'])
            print(f"   カテゴリ詳細: {category_detail}")

if __name__ == "__main__":
    debug_parking_detection()
    test_different_parking_data()
