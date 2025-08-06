#!/usr/bin/env python3
"""
飲食店 API テスト（実際のCIDから抽出）
実際のデータファイルから有効なPlace IDを使用してテスト
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

def extract_place_id_from_cid(cid_url):
    """CID URLからPlace IDを抽出"""
    try:
        # CID URLの例: https://maps.google.com/place?cid=9867684745575651684
        cid = cid_url.split('cid=')[1].split('&')[0].split('#')[0].strip()
        # CIDから実際のPlace IDを生成（この方法は正確ではない可能性があります）
        return f"ChIJ{cid}"
    except:
        return None

def test_restaurant_with_real_data():
    """実際の飲食店データでAPIテスト"""
    
    print("🍽️ 飲食店 API テスト（実際のCID使用）")
    
    # 環境確認
    if not validate_environment():
        print("❌ 環境変数が正しく設定されていません")
        return False
    
    # APIクライアント初期化
    client = PlacesAPIClient()
    validator = DataValidator()
    
    # 実際のCID URLを使用（データファイルから）
    test_cid_urls = [
        "https://maps.google.com/place?cid=9867684745575651684",    # ma_ma
        "https://maps.google.com/place?cid=8416518954523348407",    # ショッピングプラザ キング 両津店
    ]
    
    print("🔍 CID URL → Place Details API テスト")
    
    successful_count = 0
    
    for i, cid_url in enumerate(test_cid_urls, 1):
        print(f"\n=== 飲食店 {i}: {cid_url} ===")
        
        try:
            # CID URLから直接Place詳細取得（既存のメソッド使用）
            status, result = client.get_place_details_from_cid(cid_url, 'restaurants')
            
            if status == 'OK' and result and 'result' in result:
                print("✅ CID → Place Details API 成功")
                place_data = result['result']
                
                # 基本情報表示
                name = place_data.get('displayName', {}).get('text', 'データなし')
                address = place_data.get('shortFormattedAddress', 'データなし')
                business_status = place_data.get('businessStatus', 'データなし')
                types = place_data.get('types', [])
                rating = place_data.get('rating', 'なし')
                review_count = place_data.get('userRatingCount', 'なし')
                
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
                
                print(f"店内飲食: {dine_in}")
                print(f"テイクアウト: {takeout}")
                print(f"デリバリー: {delivery}")
                
                # データ検証
                # Place IDを抽出（実際のPlace IDを取得）
                place_id = place_data.get('id', '')
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
                print(f"❌ CID → Place Details API 失敗")
                print(f"ステータス: {status}")
        
        except Exception as e:
            print(f"❌ エラー: {e}")
    
    print(f"\n📊 テスト結果: {successful_count}/{len(test_cid_urls)} 成功")
    
    # データ抽出の詳細テスト
    if successful_count > 0:
        print("\n🧪 飲食店データ抽出詳細テスト")
        test_cid = test_cid_urls[0]
        
        try:
            status, result = client.get_place_details_from_cid(test_cid, 'restaurants')
            if status == 'OK' and result and 'result' in result:
                place_data = result['result']
                place_id = place_data.get('id', '')
                validated_data = validator.validate_restaurant_data(place_data, place_id)
                
                if validated_data:
                    print("📊 抽出されたデータ（主要項目）:")
                    important_fields = ['place_id', 'name', 'address', 'latitude', 'longitude', 
                                      'rating', 'review_count', 'business_status', 'district']
                    
                    for field in important_fields:
                        value = validated_data.get(field, 'データなし')
                        print(f"  {field}: {value}")
                    
                    print("✅ 検証結果: 有効")
                    print(f"地区: {validated_data.get('district', '未分類')}")
                else:
                    print("❌ データ抽出失敗")
        except Exception as e:
            print(f"❌ データ抽出エラー: {e}")
    
    return successful_count > 0

if __name__ == "__main__":
    print("🚀 飲食店データ収集 API動作確認テスト（実際のCID使用）")
    success = test_restaurant_with_real_data()
    
    if success:
        print("\n✅ APIテスト成功: 飲食店データ収集は正常に動作します")
        print("💡 駐車場・トイレと同様に、飲食店APIも修正の効果が確認できました")
    else:
        print("\n⚠️  APIテスト失敗: 詳細を確認してください")
