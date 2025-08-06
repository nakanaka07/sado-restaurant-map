#!/usr/bin/env python3
"""
トイレデータカテゴリ混入問題調査スクリプト
指摘されたPlace IDが実際にどのような情報を返すかテスト
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

def investigate_toilet_category_issue():
    """トイレカテゴリ問題の調査"""
    
    print("🚽 トイレデータカテゴリ混入問題調査")
    
    # 環境確認
    if not validate_environment():
        print("❌ 環境変数が正しく設定されていません")
        return False
    
    # APIクライアント初期化
    client = PlacesAPIClient()
    validator = DataValidator()
    
    # 問題のPlace ID（駐車場データとして表示されている）
    problematic_place_ids = [
        "ChIJs3wRb_xl818RocXP5tOD-YI",  # 日本、〒952-1552 新潟県佐渡市相川江戸沢町２３−２
        "ChIJ7QAUpEx_9F8RVLJwVZaAiKo"   # 日本、〒952-0621 新潟県佐渡市沢崎
    ]
    
    for i, place_id in enumerate(problematic_place_ids, 1):
        print(f"\n{'='*60}")
        print(f"🔍 調査 {i}: {place_id}")
        print(f"{'='*60}")
        
        try:
            # トイレカテゴリでPlace Details取得
            print("\n【トイレカテゴリでの取得結果】")
            toilet_result = client.get_place_details(place_id, 'toilets')
            
            if toilet_result:
                print("✅ トイレカテゴリでの取得: 成功")
                
                # 基本情報
                name = toilet_result.get('displayName', {}).get('text', 'データなし')
                address = toilet_result.get('shortFormattedAddress', 'データなし')
                types = toilet_result.get('types', [])
                primary_type = toilet_result.get('primaryType', 'データなし')
                business_status = toilet_result.get('businessStatus', 'データなし')
                
                print(f"施設名: {name}")
                print(f"住所: {address}")
                print(f"プライマリタイプ: {primary_type}")
                print(f"全タイプ: {types}")
                print(f"営業状況: {business_status}")
                
                # カテゴリ分析
                parking_keywords = ['parking', 'lot', '駐車', 'パーキング']
                toilet_keywords = ['toilet', 'restroom', 'bathroom', 'トイレ', '便所']
                
                is_parking_related = any(keyword.lower() in str(types).lower() or 
                                       keyword in name.lower() or 
                                       keyword in primary_type.lower() 
                                       for keyword in parking_keywords)
                
                is_toilet_related = any(keyword.lower() in str(types).lower() or 
                                      keyword in name.lower() or 
                                      keyword in primary_type.lower() 
                                      for keyword in toilet_keywords)
                
                print(f"\n🔍 カテゴリ分析:")
                print(f"駐車場関連の可能性: {is_parking_related}")
                print(f"トイレ関連の可能性: {is_toilet_related}")
                
                if is_parking_related and not is_toilet_related:
                    print("⚠️  警告: この施設は駐車場の可能性が高いです")
                elif is_toilet_related:
                    print("✅ この施設はトイレの可能性が高いです")
                else:
                    print("❓ カテゴリが不明確です")
                    
            else:
                print("❌ トイレカテゴリでの取得: 失敗")
            
            # 駐車場カテゴリでも試してみる
            print("\n【駐車場カテゴリでの取得結果】")
            parking_result = client.get_place_details(place_id, 'parkings')
            
            if parking_result:
                print("✅ 駐車場カテゴリでの取得: 成功")
                
                parking_name = parking_result.get('displayName', {}).get('text', 'データなし')
                parking_types = parking_result.get('types', [])
                parking_primary_type = parking_result.get('primaryType', 'データなし')
                
                print(f"施設名: {parking_name}")
                print(f"プライマリタイプ: {parking_primary_type}")
                print(f"全タイプ: {parking_types}")
                
                # 結果比較
                if toilet_result and parking_result:
                    print(f"\n🔄 カテゴリ別結果比較:")
                    print(f"トイレAPI - name: {toilet_result.get('displayName', {}).get('text', 'N/A')}")
                    print(f"駐車場API - name: {parking_result.get('displayName', {}).get('text', 'N/A')}")
                    print(f"トイレAPI - primary: {toilet_result.get('primaryType', 'N/A')}")
                    print(f"駐車場API - primary: {parking_result.get('primaryType', 'N/A')}")
                    
                    if toilet_result.get('primaryType') != parking_result.get('primaryType'):
                        print("⚠️  異なるカテゴリAPIで異なる結果が返されています")
                
            else:
                print("❌ 駐車場カテゴリでの取得: 失敗")
            
            # データ検証
            print("\n【データ検証結果】")
            if toilet_result:
                validated = validator.validate_place_data(toilet_result, 'toilets')
                if validated and validated.is_valid:
                    print("✅ データ検証: 有効")
                    print(f"地区: {validated.data.get('地区', '未分類')}")
                    if validated.warnings:
                        print(f"警告: {validated.warnings}")
                else:
                    print("❌ データ検証: 無効")
                    if validated and validated.warnings:
                        print(f"エラー: {validated.warnings}")
        
        except Exception as e:
            print(f"❌ エラー: {e}")
    
    print(f"\n{'='*60}")
    print("🧐 調査結論")
    print(f"{'='*60}")
    print("この調査により、以下の可能性が考えられます：")
    print("1. データソース（toilets_merged.txt）に駐車場URLが混入している")
    print("2. Google Places APIが同じ場所に対して複数の施設タイプを返している")
    print("3. データ処理時にカテゴリの誤分類が発生している")
    print("4. field mask設定により不適切なデータが取得されている")

if __name__ == "__main__":
    print("🚀 トイレデータカテゴリ混入問題調査開始")
    investigate_toilet_category_issue()
