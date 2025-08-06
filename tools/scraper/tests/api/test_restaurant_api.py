#!/usr/bin/env python3
"""
飲食店 API & データ抽出テスト
駐車場・トイレで修正したAPIクライアントが飲食店でも正常動作するかテスト
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

def test_restaurant_place_details():
    """飲食店のPlace Details APIとデータ抽出をテスト"""
    
    print("🍽️ 飲食店 Place Details API & データ抽出テスト")
    
    # 環境確認
    if not validate_environment():
        print("❌ 環境変数が正しく設定されていません")
        return False
    
    # APIクライアント初期化
    client = PlacesAPIClient()
    validator = DataValidator()
    
    # テスト用飲食店Place ID（実際の佐渡島内レストラン）
    test_restaurant_places = [
        "ChIJL8wN_pFc818R1YqQBrHJYUw",  # 四季彩 味よし
        "ChIJKy8s4pNc818RtTgAQJF4lzc",  # そば処 和味
        "ChIJtXGQ8ZNc818RXLyg3HY7Lho"   # 回転寿司 大漁
    ]
    
    print("🍽️ 飲食店 Place Details API テスト")
    
    successful_count = 0
    
    for i, place_id in enumerate(test_restaurant_places, 1):
        print(f"\n=== 飲食店 {i}: {place_id} ===")
        
        try:
            # Place Details API呼び出し
            result = client.get_place_details(place_id)
            
            if result and 'result' in result:
                print("✅ Place Details API 成功")
                place_data = result['result']
                
                # 基本情報表示
                name = place_data.get('displayName', {}).get('text', 'データなし')
                address = place_data.get('shortFormattedAddress', 'データなし')
                full_address = place_data.get('formattedAddress', 'データなし')
                business_status = place_data.get('businessStatus', 'データなし')
                types = place_data.get('types', [])
                rating = place_data.get('rating', 'なし')
                review_count = place_data.get('userRatingCount', 'なし')
                
                print(f"店舗名: {name}")
                print(f"住所: {address}")
                print(f"完全住所: {full_address}")
                print(f"営業状況: {business_status}")
                print(f"店舗タイプ: {types}")
                print(f"評価: {rating}")
                print(f"レビュー数: {review_count}")
                
                # 飲食店特有の詳細情報
                opening_hours = place_data.get('regularOpeningHours', {})
                if opening_hours:
                    weekday_descriptions = opening_hours.get('weekdayDescriptions', [])
                    if weekday_descriptions:
                        print(f"営業時間: {weekday_descriptions[:2]}...")
                
                phone = place_data.get('nationalPhoneNumber', 'データなし')
                website = place_data.get('websiteUri', 'データなし')
                price_level = place_data.get('priceLevel', 'データなし')
                
                print(f"電話番号: {phone}")
                print(f"ウェブサイト: {website}")
                print(f"価格帯: {price_level}")
                
                # 飲食店特有のサービス情報
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
                validated_data = validator.validate_restaurant_data(place_data, place_id)
                if validated_data:
                    print("データ検証: ✅ 有効")
                    district = validated_data.get('地区', '未分類')
                    print(f"地区分類: {district}")
                    
                    warnings = validated_data.get('警告', [])
                    if warnings:
                        print(f"警告: {warnings}")
                else:
                    print("データ検証: ❌ 無効")
                
                successful_count += 1
                
            else:
                print("❌ Place Details API 失敗")
                print(f"レスポンス: {result}")
        
        except Exception as e:
            print(f"❌ エラー: {e}")
    
    print(f"\n📊 テスト結果: {successful_count}/{len(test_restaurant_places)} 成功")
    
    # データ抽出テスト
    if successful_count > 0:
        print("\n🧪 飲食店データ抽出テスト")
        test_place_id = test_restaurant_places[0]
        
        try:
            result = client.get_place_details(test_place_id)
            if result and 'result' in result:
                validated_data = validator.validate_restaurant_data(result['result'], test_place_id)
                
                if validated_data:
                    print("📊 抽出されたデータ:")
                    for key, value in validated_data.items():
                        if key != '警告':  # 警告は別途表示
                            print(f"  {key}: {value}")
                    
                    warnings = validated_data.get('警告', [])
                    if warnings:
                        print(f"  警告: {warnings}")
                    
                    print("✅ 検証結果: 有効")
                    print(f"地区: {validated_data.get('地区', '未分類')}")
                else:
                    print("❌ データ抽出失敗")
        except Exception as e:
            print(f"❌ データ抽出エラー: {e}")
    
    return successful_count == len(test_restaurant_places)

if __name__ == "__main__":
    print("🚀 飲食店データ収集 API動作確認テスト")
    success = test_restaurant_place_details()
    
    if success:
        print("\n✅ 全テスト成功: 飲食店APIは正常に動作しています")
    else:
        print("\n⚠️  一部テスト失敗: 詳細を確認してください")
