#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
トイレのPlace Details APIテスト

Text Searchで見つかったトイレのPlace IDを使って、
Place Details APIから詳細データを取得してテストする。
"""

import os
import json
from dotenv import load_dotenv
from processors.places_api_client import PlacesAPIClient
from processors.data_validator import DataValidator

# 環境変数読み込み
load_dotenv('config/.env')

def test_toilet_place_details():
    """トイレのPlace Details APIテスト"""
    print("🚽 トイレ Place Details API テスト")
    
    # Text Searchで見つかったトイレのPlace ID
    toilet_place_ids = [
        "ChIJAcdkYQBd818RVrNZq0mgCYk",  # あいぽーと佐渡 トイレ
        "ChIJE4vWvhFd818Rz98NqiyvUkE",  # おけさ橋公衆トイレ
        "ChIJvXnozv1d818RXFV2hE20i4M"   # ムサシ両津店トイレ
    ]
    
    try:
        client = PlacesAPIClient()
        validator = DataValidator()
        
        for i, place_id in enumerate(toilet_place_ids, 1):
            print(f"\n=== トイレ {i}: {place_id} ===")
            
            # Place Details APIで詳細データを取得
            import requests
            headers = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': client.config.api_key,
                'X-Goog-FieldMask': client._build_field_mask('toilets', 'details')
            }
            
            url = f'https://places.googleapis.com/v1/places/{place_id}'
            
            try:
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    place_data = response.json()
                    print("✅ Place Details API 成功")
                    
                    # 基本情報を表示
                    name = place_data.get('displayName', {})
                    if isinstance(name, dict):
                        name = name.get('text', 'Unknown')
                    
                    print(f"施設名: {name}")
                    print(f"住所: {place_data.get('shortFormattedAddress', 'Unknown')}")
                    print(f"完全住所: {place_data.get('formattedAddress', 'Unknown')}")
                    print(f"営業状況: {place_data.get('businessStatus', 'Unknown')}")
                    print(f"施設タイプ: {place_data.get('types', [])}")
                    print(f"評価: {place_data.get('rating', 'なし')}")
                    print(f"レビュー数: {place_data.get('userRatingCount', 'なし')}")
                    
                    # トイレ特有の情報
                    print(f"トイレ設備: {place_data.get('restroom', 'データなし')}")
                    print(f"子供連れ対応: {place_data.get('goodForChildren', 'データなし')}")
                    
                    # アクセシビリティ情報
                    accessibility = place_data.get('accessibilityOptions', {})
                    if accessibility:
                        print(f"アクセシビリティ: {accessibility}")
                    
                    # 営業時間
                    opening_hours = place_data.get('regularOpeningHours', {})
                    if opening_hours:
                        descriptions = opening_hours.get('weekdayDescriptions', [])
                        if descriptions:
                            print(f"営業時間: {descriptions[:2]}...")  # 最初の2つだけ表示
                    
                    # データ検証
                    result = validator.validate_place_data(place_data, 'toilets')
                    print(f"データ検証: {'✅ 有効' if result.is_valid else '❌ 無効'}")
                    print(f"地区分類: {result.district}")
                    
                    if result.errors:
                        print(f"エラー: {result.errors}")
                    if result.warnings:
                        print(f"警告: {result.warnings}")
                        
                else:
                    print(f"❌ Place Details API エラー: {response.status_code}")
                    print(f"エラー内容: {response.text}")
                    
            except Exception as e:
                print(f"❌ API リクエスト失敗: {e}")
                
    except Exception as e:
        print(f"❌ テスト失敗: {e}")

def test_toilet_data_extraction():
    """トイレデータの抽出テスト"""
    print("\n🧪 トイレデータ抽出テスト")
    
    # サンプルトイレデータ（実際のAPIレスポンス形式）
    sample_toilet_data = {
        "id": "ChIJAcdkYQBd818RVrNZq0mgCYk",
        "displayName": {"text": "あいぽーと佐渡 トイレ", "languageCode": "ja"},
        "shortFormattedAddress": "佐渡市両津夷９５２ 0011",
        "formattedAddress": "Japan, 〒952-0011 Niigata, Sado, Ryotsuwashi, 952 0011",
        "location": {"latitude": 38.0897, "longitude": 138.4456},
        "types": ["public_bathroom", "point_of_interest", "establishment"],
        "businessStatus": "OPERATIONAL",
        "rating": 3.5,
        "userRatingCount": 12,
        "restroom": True,
        "goodForChildren": True,
        "accessibilityOptions": {
            "wheelchairAccessibleEntrance": True,
            "wheelchairAccessibleRestroom": True
        }
    }
    
    try:
        validator = DataValidator()
        result = validator.validate_place_data(sample_toilet_data, 'toilets')
        
        print("📊 抽出されたデータ:")
        for key, value in result.data.items():
            print(f"  {key}: {value}")
            
        print(f"\n✅ 検証結果: {'有効' if result.is_valid else '無効'}")
        print(f"地区: {result.district}")
        
    except Exception as e:
        print(f"❌ データ抽出テスト失敗: {e}")

if __name__ == "__main__":
    print("🚀 トイレ Place Details API & データ抽出テスト")
    
    # Place Details APIテスト
    test_toilet_place_details()
    
    # データ抽出テスト
    test_toilet_data_extraction()
