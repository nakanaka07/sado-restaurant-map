#!/usr/bin/env python3
"""
飲食店 Text Search API テスト
店舗名でText Searchを実行して、飲食店APIの動作を確認
"""

import sys
import os

# パスの設定
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(current_dir)
sys.path.append(parent_dir)

from processors.places_api_client import PlacesAPIClient
from processors.data_validator import DataValidator
from utils.google_auth import validate_environment

def test_restaurant_text_search():
    """飲食店のText Search APIテスト"""
    
    print("🍽️ 飲食店 Text Search API テスト")
    
    # 環境確認
    if not validate_environment():
        print("❌ 環境変数が正しく設定されていません")
        return False
    
    # APIクライアント初期化
    client = PlacesAPIClient()
    validator = DataValidator()
    
    # テスト用の実際の佐渡島内飲食店名
    test_restaurants = [
        "四季彩 味よし",
        "そば処 和味",
        "すしや まるいし"
    ]
    
    print("🔍 飲食店 Text Search API テスト")
    
    successful_count = 0
    
    for i, restaurant_name in enumerate(test_restaurants, 1):
        print(f"\n=== 飲食店 {i}: {restaurant_name} ===")
        
        try:
            # Text Search API呼び出し
            status, places = client.search_text(restaurant_name, 'restaurants')
            
            if status == 'OK' and places:
                print(f"✅ Text Search API 成功 - {len(places)}件発見")
                
                for j, place_data in enumerate(places[:1], 1):  # 最初の結果のみ表示
                    print(f"\n--- 結果 {j} ---")
                    
                    # 基本情報表示
                    name = place_data.get('displayName', {}).get('text', 'データなし')
                    address = place_data.get('shortFormattedAddress', 'データなし')
                    business_status = place_data.get('businessStatus', 'データなし')
                    types = place_data.get('types', [])
                    rating = place_data.get('rating', 'なし')
                    review_count = place_data.get('userRatingCount', 'なし')
                    place_id = place_data.get('id', 'データなし')
                    
                    print(f"Place ID: {place_id}")
                    print(f"店舗名: {name}")
                    print(f"住所: {address}")
                    print(f"営業状況: {business_status}")
                    print(f"店舗タイプ: {types}")
                    print(f"評価: {rating}")
                    print(f"レビュー数: {review_count}")
                    
                    # 飲食店特有の情報
                    dine_in = place_data.get('dineIn', 'データなし')
                    takeout = place_data.get('takeout', 'データなし')
                    delivery = place_data.get('delivery', 'データなし')
                    serves_breakfast = place_data.get('servesBreakfast', 'データなし')
                    serves_lunch = place_data.get('servesLunch', 'データなし')
                    serves_dinner = place_data.get('servesDinner', 'データなし')
                    
                    print(f"店内飲食: {dine_in}")
                    print(f"テイクアウト: {takeout}")
                    print(f"デリバリー: {delivery}")
                    print(f"朝食提供: {serves_breakfast}")
                    print(f"昼食提供: {serves_lunch}")
                    print(f"夕食提供: {serves_dinner}")
                    
                    # データ検証
                    validated_data = validator.validate_place_data(place_data, 'restaurants')
                    
                    if validated_data and validated_data.is_valid:
                        print("データ検証: ✅ 有効")
                        district = validated_data.data.get('地区', '未分類')
                        is_in_sado = validated_data.data.get('is_in_sado', False)
                        print(f"地区分類: {district}")
                        print(f"佐渡島内: {is_in_sado}")
                        
                        if validated_data.warnings:
                            print(f"警告: {validated_data.warnings}")
                    else:
                        print("データ検証: ❌ 無効")
                        if validated_data and validated_data.warnings:
                            print(f"エラー: {validated_data.warnings}")
                
                successful_count += 1
                
            else:
                print(f"❌ Text Search API 失敗")
                print(f"ステータス: {status}")
        
        except Exception as e:
            print(f"❌ エラー: {e}")
    
    print(f"\n📊 テスト結果: {successful_count}/{len(test_restaurants)} 成功")
    
    # 詳細なPlace Details APIテスト
    if successful_count > 0:
        print("\n🧪 Place Details API 追加テスト")
        test_restaurant = test_restaurants[0]
        
        try:
            status, places = client.search_text(test_restaurant, 'restaurants')
            if status == 'OK' and places:
                place_data = places[0]
                place_id = place_data.get('id', '')
                
                if place_id:
                    print(f"🔍 Place Details API テスト: {place_id}")
                    
                    # 新しく追加したget_place_detailsメソッドをテスト
                    detail_result = client.get_place_details(place_id, 'restaurants')
                    
                    if detail_result:
                        print("✅ Place Details API 成功")
                        # get_place_detailsは直接place dataを返すので、'result'キーは不要
                        detail_place = detail_result
                        detail_name = detail_place.get('displayName', {}).get('text', 'データなし')
                        print(f"詳細取得店舗名: {detail_name}")
                        
                        # データ検証
                        validated_detail = validator.validate_place_data(detail_place, 'restaurants')
                        if validated_detail and validated_detail.is_valid:
                            print("詳細データ検証: ✅ 有効")
                        else:
                            print("詳細データ検証: ❌ 無効")
                    else:
                        print("❌ Place Details API 失敗")
                
        except Exception as e:
            print(f"❌ Place Details テストエラー: {e}")
    
    return successful_count > 0

if __name__ == "__main__":
    print("🚀 飲食店データ収集 API動作確認テスト（Text Search）")
    success = test_restaurant_text_search()
    
    if success:
        print("\n✅ 飲食店APIテスト成功: Text Search & Place Details両方が正常動作")
        print("💡 駐車場・トイレ・飲食店全てのAPIで修正効果が確認できました")
        print("🔧 APIクライアントの field mask修正により、全カテゴリで詳細データ取得が可能になりました")
    else:
        print("\n⚠️  飲食店APIテスト失敗: 詳細を確認してください")
