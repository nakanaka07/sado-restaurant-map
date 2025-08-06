"""
修正後の駐車場データ処理テスト
カテゴリフィールドが正しくヘッダーに対応しているかを確認
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processors.unified_cid_processor import UnifiedCIDProcessor
from config.headers import get_unified_header

def test_updated_parking_format():
    """修正後の駐車場フォーマットをテスト"""
    
    print("=== 修正後の駐車場データフォーマットテスト ===")
    
    # テスト用のAPIレスポンス（実際のデータから抜粋）
    sample_response = {
        'place_id': 'ChIJK123example',
        'name': 'サンプル駐車場',
        'formatted_address': '佐渡市両津夷12-3',
        'geometry': {
            'location': {
                'lat': 38.0452,
                'lng': 138.3626
            }
        },
        'rating': 4.2,
        'user_ratings_total': 15,
        'business_status': 'OPERATIONAL',
        'types': ['establishment', 'parking', 'point_of_interest'],
        'opening_hours': {
            'weekday_text': ['月曜日: 24 時間営業']
        },
        'formatted_phone_number': '0259-12-3456',
        'website': 'https://example.com',
        'editorialSummary': {'text': 'テスト駐車場の説明'},
        'regularOpeningHours': {
            'weekdayText': ['月曜日: 24 時間営業', '火曜日: 24 時間営業']
        },
        'accessibilityOptions': {
            'wheelchairAccessibleParking': True,
            'wheelchairAccessibleEntrance': True
        },
        'paymentOptions': {
            'acceptsCreditCards': True,
            'acceptsCashOnly': False
        },
        'restroom': True
    }
    
    # プロセッサーのインスタンス作成
    processor = UnifiedCIDProcessor()
    
    # クエリデータ
    query_data = {
        'type': 'test',
        'store_name': 'テスト駐車場'
    }
    
    # フォーマット実行
    formatted_result = processor.format_result(sample_response, query_data, 'Test API')
    
    print(f"生成されたフィールド数: {len(formatted_result)}")
    print("\n📋 生成されたデータ:")
    for i, (key, value) in enumerate(formatted_result.items(), 1):
        print(f"  {i:2d}. {key}: {value}")
    
    # ヘッダーとの対応確認
    parking_headers = get_unified_header('parkings')
    
    print(f"\n📊 ヘッダー対応確認:")
    print(f"駐車場ヘッダーフィールド数: {len(parking_headers)}")
    
    print("\n🔍 フィールド対応状況:")
    for i, header in enumerate(parking_headers, 1):
        value = formatted_result.get(header, '❌ データなし')
        status = "✅" if header in formatted_result else "❌"
        print(f"  {i:2d}. {header} {status} → {value}")
    
    print("\n📝 生成データにあるがヘッダーにない項目:")
    extra_fields = []
    for key in formatted_result:
        if key not in parking_headers:
            extra_fields.append(key)
            print(f"     - {key}: {formatted_result[key]}")
    
    # カテゴリフィールドの確認
    print(f"\n🏷️ カテゴリフィールド確認:")
    print(f"   カテゴリ: {formatted_result.get('カテゴリ', '❌ なし')}")
    print(f"   カテゴリ詳細: {formatted_result.get('カテゴリ詳細', '❌ なし')}")
    
    # ヘッダー位置確認
    if 'カテゴリ' in parking_headers:
        category_pos = parking_headers.index('カテゴリ') + 1
        print(f"   カテゴリの位置: {category_pos}番目")
    
    if 'カテゴリ詳細' in parking_headers:
        detail_pos = parking_headers.index('カテゴリ詳細') + 1
        print(f"   カテゴリ詳細の位置: {detail_pos}番目")
    
    return formatted_result, parking_headers

def test_save_structure():
    """save_to_spreadsheet用のデータ構造をテスト"""
    print("\n=== save_to_spreadsheet用データ構造テスト ===")
    
    formatted_result, parking_headers = test_updated_parking_format()
    
    # save_to_spreadsheetでの並び替えをシミュレート
    ordered_row = []
    for header in parking_headers:
        value = formatted_result.get(header, '')
        ordered_row.append(str(value) if value is not None else '')
    
    print(f"\n📝 シート保存用の並び替え結果:")
    for i, (header, value) in enumerate(zip(parking_headers, ordered_row), 1):
        print(f"  {i:2d}. {header}: {value}")
    
    # カテゴリデータが正しい位置にあるかを確認
    category_index = parking_headers.index('カテゴリ') if 'カテゴリ' in parking_headers else -1
    category_detail_index = parking_headers.index('カテゴリ詳細') if 'カテゴリ詳細' in parking_headers else -1
    
    if category_index >= 0:
        print(f"\n✅ カテゴリデータ位置確認:")
        print(f"   位置 {category_index + 1}: {ordered_row[category_index]}")
        
    if category_detail_index >= 0:
        print(f"   位置 {category_detail_index + 1}: {ordered_row[category_detail_index]}")

if __name__ == "__main__":
    test_updated_parking_format()
    test_save_structure()
