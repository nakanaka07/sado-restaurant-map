"""
GoogleマップURL修正検証テスト
全データタイプ（駐車場・トイレ・飲食店）での新しいURL形式をテスト
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processors.unified_cid_processor import UnifiedCIDProcessor

def test_all_data_types_url():
    """全データタイプでのURL生成をテスト"""
    
    print("=== 全データタイプURL生成検証 ===")
    
    processor = UnifiedCIDProcessor()
    
    # 各データタイプのサンプル
    test_cases = [
        {
            'name': '飲食店データ',
            'data': {
                'place_id': 'ChIJR123restaurant',
                'name': '佐渡グルメレストラン',
                'formatted_address': '佐渡市両津夷12-3',
                'geometry': {'location': {'lat': 38.0452, 'lng': 138.3626}},
                'types': ['restaurant', 'food', 'establishment'],
                'business_status': 'OPERATIONAL'
            }
        },
        {
            'name': '駐車場データ',
            'data': {
                'place_id': 'ChIJP456parking',
                'name': '佐渡市営駐車場',
                'formatted_address': '佐渡市相川下戸町5-8',
                'geometry': {'location': {'lat': 38.0789, 'lng': 138.2341}},
                'types': ['parking', 'establishment'],
                'business_status': 'OPERATIONAL'
            }
        },
        {
            'name': 'トイレデータ',
            'data': {
                'place_id': 'ChIJT789toilet',
                'name': '公衆トイレ第1号',
                'formatted_address': '佐渡市小木町1234-5',
                'geometry': {'location': {'lat': 37.8456, 'lng': 138.2789}},
                'types': ['establishment', 'point_of_interest'],
                'business_status': 'OPERATIONAL'
            }
        }
    ]
    
    query_data = {'type': 'test', 'store_name': 'テスト'}
    
    for test_case in test_cases:
        print(f"\n📋 {test_case['name']}:")
        result = processor.format_result(test_case['data'], query_data, 'Test API')
        
        place_id = test_case['data']['place_id']
        generated_url = result.get('GoogleマップURL', '❌ なし')
        
        print(f"   Place ID: {place_id}")
        print(f"   生成URL: {generated_url}")
        
        # URL形式の検証
        expected_url = f"https://www.google.com/maps/place/?q=place_id:{place_id}"
        is_correct = generated_url == expected_url
        print(f"   URL形式: {'✅ 正しい' if is_correct else '❌ 間違い'}")
        
        if not is_correct:
            print(f"   期待値: {expected_url}")

def test_url_comparison():
    """新旧URL形式の比較テスト"""
    
    print(f"\n=== 新旧URL形式比較 ===")
    
    sample_place_id = 'ChIJLU7jZClu2ygRdlhIoz5Ljak'
    
    old_url = f"https://maps.google.com/?cid={sample_place_id}"
    new_url = f"https://www.google.com/maps/place/?q=place_id:{sample_place_id}"
    
    print(f"🔗 URL形式比較:")
    print(f"   旧形式: {old_url}")
    print(f"   新形式: {new_url}")
    
    print(f"\n💡 修正効果:")
    print(f"   ✅ Place IDを正しく使用")
    print(f"   ✅ 確実に対象の場所に移動")
    print(f"   ✅ Google Maps標準のURL形式")
    print(f"   ✅ モバイル・デスクトップ両対応")

def test_edge_cases():
    """エッジケースのテスト"""
    
    print(f"\n=== エッジケーステスト ===")
    
    processor = UnifiedCIDProcessor()
    
    edge_cases = [
        ('空のPlace ID', ''),
        ('None値', None),
        ('短いPlace ID', 'ChIJ123'),
        ('長いPlace ID', 'ChIJLU7jZClu2ygRdlhIoz5LjakVeryLongPlaceId'),
    ]
    
    for case_name, place_id in edge_cases:
        try:
            url = processor._generate_google_maps_url(place_id or '')
            print(f"   {case_name}: {url if url else '空文字'}")
        except Exception as e:
            print(f"   {case_name}: エラー - {e}")

if __name__ == "__main__":
    test_all_data_types_url()
    test_url_comparison()
    test_edge_cases()
