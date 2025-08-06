"""
トイレデータ処理テスト
駐車場と同様にトイレデータでもカテゴリフィールドが正しく生成されるかを確認
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processors.unified_cid_processor import UnifiedCIDProcessor
from config.headers import get_unified_header

def test_toilet_format():
    """トイレデータフォーマットをテスト"""
    
    print("=== トイレデータフォーマットテスト ===")
    
    # テスト用のAPIレスポンス（トイレ施設）
    sample_toilet_response = {
        'place_id': 'ChIJT456example',
        'name': 'サンプル公衆トイレ',
        'formatted_address': '佐渡市相川下戸町5-8',
        'geometry': {
            'location': {
                'lat': 38.0789,
                'lng': 138.2341
            }
        },
        'rating': 3.8,
        'user_ratings_total': 8,
        'business_status': 'OPERATIONAL',
        'types': ['establishment', 'point_of_interest'],  # toiletタイプがない場合
        'opening_hours': {
            'weekday_text': ['月曜日: 24 時間営業']
        },
        'editorialSummary': {'text': '24時間利用可能な公衆トイレ'},
        'regularOpeningHours': {
            'weekdayText': ['月曜日: 24 時間営業', '火曜日: 24 時間営業']
        },
        'accessibilityOptions': {
            'wheelchairAccessibleRestroom': True,
            'wheelchairAccessibleEntrance': True
        },
        'goodForChildren': True,
        'parkingOptions': {
            'freeParking': True
        }
    }
    
    # プロセッサーのインスタンス作成
    processor = UnifiedCIDProcessor()
    
    # クエリデータ
    query_data = {
        'type': 'test',
        'store_name': 'テスト公衆トイレ'
    }
    
    # 施設判定テスト
    print("🔍 施設タイプ判定テスト:")
    is_restaurant = processor._is_restaurant_data(sample_toilet_response)
    is_parking = processor._is_parking_data(sample_toilet_response)
    is_toilet = processor._is_toilet_data(sample_toilet_response)
    
    print(f"   飲食店判定: {is_restaurant}")
    print(f"   駐車場判定: {is_parking}")
    print(f"   トイレ判定: {is_toilet}")
    
    # フォーマット実行
    formatted_result = processor.format_result(sample_toilet_response, query_data, 'Test API')
    
    print(f"\n📋 生成されたフィールド数: {len(formatted_result)}")
    print("\n生成されたデータ:")
    for i, (key, value) in enumerate(formatted_result.items(), 1):
        print(f"  {i:2d}. {key}: {value}")
    
    # ヘッダーとの対応確認
    toilet_headers = get_unified_header('toilets')
    
    print(f"\n📊 ヘッダー対応確認:")
    print(f"トイレヘッダーフィールド数: {len(toilet_headers)}")
    
    print("\n🔍 フィールド対応状況:")
    for i, header in enumerate(toilet_headers, 1):
        value = formatted_result.get(header, '❌ データなし')
        status = "✅" if header in formatted_result else "❌"
        print(f"  {i:2d}. {header} {status} → {value}")
    
    # カテゴリフィールドの確認
    print(f"\n🏷️ カテゴリフィールド確認:")
    print(f"   カテゴリ: {formatted_result.get('カテゴリ', '❌ なし')}")
    print(f"   カテゴリ詳細: {formatted_result.get('カテゴリ詳細', '❌ なし')}")
    
    return formatted_result, toilet_headers

def test_toilet_with_toilet_type():
    """toiletタイプが明示的に含まれる場合のテスト"""
    
    print(f"\n=== トイレタイプ明示的含有テスト ===")
    
    # toiletタイプが明示的に含まれるケース
    toilet_with_type = {
        'place_id': 'ChIJT789example',
        'name': '佐渡観光トイレ',
        'formatted_address': '佐渡市小木町1234-5',
        'geometry': {
            'location': {
                'lat': 37.8456,
                'lng': 138.2789
            }
        },
        'types': ['establishment', 'point_of_interest', 'tourist_attraction'],  # 観光地トイレ
        'business_status': 'OPERATIONAL'
    }
    
    processor = UnifiedCIDProcessor()
    
    # 施設判定
    is_toilet = processor._is_toilet_data(toilet_with_type)
    print(f"🔍 トイレ判定: {is_toilet}")
    
    # トイレ名での判定テスト
    toilet_by_name = {
        'place_id': 'ChIJT101example',
        'name': '公衆トイレ第1号',
        'types': ['establishment', 'point_of_interest']
    }
    
    is_toilet_by_name = processor._is_toilet_data(toilet_by_name)
    print(f"🔍 名前によるトイレ判定: {is_toilet_by_name}")
    
    if is_toilet or is_toilet_by_name:
        query_data = {'type': 'test', 'store_name': 'テスト'}
        
        # タイプ判定結果
        result1 = processor.format_result(toilet_with_type, query_data, 'Test API')
        result2 = processor.format_result(toilet_by_name, query_data, 'Test API')
        
        print(f"\n📋 観光地トイレのカテゴリ:")
        print(f"   カテゴリ: {result1.get('カテゴリ', '❌ なし')}")
        print(f"   カテゴリ詳細: {result1.get('カテゴリ詳細', '❌ なし')}")
        
        print(f"\n📋 名前判定トイレのカテゴリ:")
        print(f"   カテゴリ: {result2.get('カテゴリ', '❌ なし')}")
        print(f"   カテゴリ詳細: {result2.get('カテゴリ詳細', '❌ なし')}")

def test_toilet_save_structure():
    """トイレデータのシート保存構造をテスト"""
    print(f"\n=== トイレシート保存構造テスト ===")
    
    formatted_result, toilet_headers = test_toilet_format()
    
    # save_to_spreadsheetでの並び替えをシミュレート
    ordered_row = []
    for header in toilet_headers:
        value = formatted_result.get(header, '')
        ordered_row.append(str(value) if value is not None else '')
    
    print(f"\n📝 シート保存用の並び替え結果:")
    for i, (header, value) in enumerate(zip(toilet_headers, ordered_row), 1):
        print(f"  {i:2d}. {header}: {value}")
    
    # カテゴリデータが正しい位置にあるかを確認
    category_index = toilet_headers.index('カテゴリ') if 'カテゴリ' in toilet_headers else -1
    category_detail_index = toilet_headers.index('カテゴリ詳細') if 'カテゴリ詳細' in toilet_headers else -1
    
    if category_index >= 0:
        print(f"\n✅ カテゴリデータ位置確認:")
        print(f"   位置 {category_index + 1}: {ordered_row[category_index]}")
        
    if category_detail_index >= 0:
        print(f"   位置 {category_detail_index + 1}: {ordered_row[category_detail_index]}")

if __name__ == "__main__":
    test_toilet_format()
    test_toilet_with_toilet_type()
    test_toilet_save_structure()
