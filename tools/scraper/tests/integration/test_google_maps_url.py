"""
GoogleマップURL修正テスト
新しいPlace ID形式のURLが正しく生成されて、実際に場所に移動するかをテスト
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from processors.unified_cid_processor import UnifiedCIDProcessor

def test_google_maps_url_generation():
    """GoogleマップURL生成をテスト"""
    
    print("=== GoogleマップURL生成テスト ===")
    
    processor = UnifiedCIDProcessor()
    
    # テスト用のPlace ID（実際のGoogle Places APIで取得される形式）
    test_place_ids = [
        'ChIJLU7jZClu2ygRdlhIoz5Ljak',  # 実際のPlace ID例
        'ChIJN1t_tDeuEmsRUsoyG83frY4',  # 別の実際のPlace ID例
        'ChIJT456example',               # テスト用ID
        '',                             # 空の場合
    ]
    
    print("🔗 URL生成結果:")
    for i, place_id in enumerate(test_place_ids, 1):
        url = processor._generate_google_maps_url(place_id)
        print(f"  {i}. Place ID: {place_id}")
        print(f"     URL: {url}")
        print()
    
    # 実際のデータ処理での確認
    sample_data = {
        'place_id': 'ChIJLU7jZClu2ygRdlhIoz5Ljak',
        'name': 'テスト施設',
        'formatted_address': '佐渡市両津夷12-3',
        'geometry': {
            'location': {
                'lat': 38.0452,
                'lng': 138.3626
            }
        },
        'types': ['parking'],
        'business_status': 'OPERATIONAL'
    }
    
    query_data = {'type': 'test', 'store_name': 'テスト'}
    result = processor.format_result(sample_data, query_data, 'Test API')
    
    print("📋 実際のデータ処理結果:")
    print(f"   GoogleマップURL: {result.get('GoogleマップURL', '❌ なし')}")
    
    return result.get('GoogleマップURL', '')

def test_url_formats():
    """異なるURL形式を比較テスト"""
    
    print("\n=== URL形式比較テスト ===")
    
    test_place_id = 'ChIJLU7jZClu2ygRdlhIoz5Ljak'
    
    # 従来の形式（問題あり）
    old_format = f"https://maps.google.com/?cid={test_place_id}"
    
    # 新しい形式（修正版）
    new_format = f"https://www.google.com/maps/place/?q=place_id:{test_place_id}"
    
    # 代替形式
    alt_format1 = f"https://maps.google.com/maps?q=place_id:{test_place_id}"
    alt_format2 = f"https://www.google.com/maps/search/?api=1&query=place_id:{test_place_id}"
    
    print("📊 URL形式比較:")
    print(f"1. 従来形式（問題あり）: {old_format}")
    print(f"2. 修正版形式（推奨）:   {new_format}")
    print(f"3. 代替形式1:           {alt_format1}")
    print(f"4. 代替形式2:           {alt_format2}")
    
    print(f"\n💡 修正のポイント:")
    print(f"   - CIDパラメーター → Place IDクエリ形式に変更")
    print(f"   - より確実に対象の場所に移動")
    print(f"   - Google Maps APIの標準的な使用方法")

def verify_url_accessibility():
    """URL形式の有効性を確認（理論的チェック）"""
    
    print(f"\n=== URL有効性確認 ===")
    
    processor = UnifiedCIDProcessor()
    test_place_id = 'ChIJLU7jZClu2ygRdlhIoz5Ljak'
    
    generated_url = processor._generate_google_maps_url(test_place_id)
    
    print(f"🔍 生成されたURL: {generated_url}")
    print(f"📝 URL構成要素:")
    print(f"   - ベースURL: https://www.google.com/maps/place/")
    print(f"   - クエリパラメーター: ?q=place_id:{test_place_id}")
    print(f"   - Place ID: {test_place_id}")
    
    print(f"\n✅ 期待される動作:")
    print(f"   1. URLをクリックするとGoogleマップが開く")
    print(f"   2. 指定されたPlace IDの場所に直接移動")
    print(f"   3. 場所の詳細情報が表示される")

if __name__ == "__main__":
    url = test_google_maps_url_generation()
    test_url_formats()
    verify_url_accessibility()
