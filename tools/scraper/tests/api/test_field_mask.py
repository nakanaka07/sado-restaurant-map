#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Places API フィールドマスクの修正テスト

Google Places API (New) v1 の正しいフィールド名を確認し、
無効なフィールドを特定・修正する。
"""

import os
import json
import requests
from dotenv import load_dotenv

# 環境変数読み込み
load_dotenv('config/.env')

def test_field_mask(place_id: str, field_mask: str):
    """指定されたフィールドマスクをテスト"""
    api_key = os.environ.get('PLACES_API_KEY')
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        'X-Goog-FieldMask': field_mask
    }
    
    url = f'https://places.googleapis.com/v1/places/{place_id}'
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        print(f"📋 フィールドマスク: {field_mask}")
        print(f"📊 レスポンス状態: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 成功")
            return True, data
        else:
            print(f"❌ 失敗: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False, None

def find_correct_fields():
    """正しいフィールドマスクを段階的に特定"""
    place_id = "ChIJ5yhd5IlD818RfYgU8KuzWVg"  # テスト用Place ID
    
    print("🔍 基本フィールドのテスト")
    
    # 段階的にフィールドをテスト
    test_fields = [
        # 基本フィールド（必須）
        "id",
        "displayName", 
        "location",
        "shortFormattedAddress",
        "formattedAddress",
        
        # ビジネス情報
        "businessStatus",
        "primaryType",
        "primaryTypeDisplayName", 
        "types",
        
        # 評価・レビュー
        "rating",
        "userRatingCount",
        
        # 営業情報
        "regularOpeningHours",
        "currentOpeningHours",
        
        # 連絡先
        "nationalPhoneNumber",
        "internationalPhoneNumber",
        "websiteUri",
        
        # その他の属性
        "editorialSummary",
        "priceLevel",
        "photos",
        "reviews",
        
        # 設備・サービス（駐車場・トイレ関連）
        "paymentOptions",
        "parkingOptions", 
        "accessibilityOptions",
        "restroom",
        "goodForChildren",
        
        # Places API リンク
        "googleMapsUri"
    ]
    
    working_fields = []
    
    for field in test_fields:
        print(f"\n--- テスト: {field} ---")
        success, data = test_field_mask(place_id, field)
        
        if success:
            working_fields.append(field)
            print(f"✅ {field}: 有効")
            
            # データ内容を確認
            if data and field.replace('places.', '') in data:
                value = data[field.replace('places.', '')]
                print(f"   値: {json.dumps(value, ensure_ascii=False, indent=2)[:200]}...")
        else:
            print(f"❌ {field}: 無効")
    
    print(f"\n🎉 有効なフィールド一覧 ({len(working_fields)}個):")
    for field in working_fields:
        print(f"  - {field}")
    
    return working_fields

def test_combined_fields(working_fields):
    """有効なフィールドを組み合わせてテスト"""
    place_id = "ChIJ5yhd5IlD818RfYgU8KuzWVg"
    
    # 駐車場に必要そうなフィールドの組み合わせ
    essential_fields = [
        "id",
        "displayName", 
        "location",
        "shortFormattedAddress",
        "businessStatus",
        "primaryType",
        "rating",
        "userRatingCount"
    ]
    
    # 有効なフィールドから選別
    valid_essential = [f for f in essential_fields if f in working_fields]
    
    print(f"\n🧪 必須フィールドの組み合わせテスト:")
    field_mask = ','.join(valid_essential)
    
    success, data = test_field_mask(place_id, field_mask)
    
    if success:
        print(f"✅ 組み合わせ成功")
        print(f"📊 取得データ:")
        print(json.dumps(data, ensure_ascii=False, indent=2))
        
        return field_mask, data
    else:
        print(f"❌ 組み合わせ失敗")
        return None, None

if __name__ == "__main__":
    print("🚀 Places API フィールドマスク修正テスト")
    
    # ステップ1: 個別フィールドの有効性確認
    working_fields = find_correct_fields()
    
    # ステップ2: 組み合わせテスト
    if working_fields:
        print("\n" + "="*50)
        field_mask, data = test_combined_fields(working_fields)
        
        if field_mask:
            print(f"\n✅ 推奨フィールドマスク:")
            print(field_mask)
    
    print(f"\n🎯 次のステップ:")
    print(f"1. places_api_client.py の _build_field_mask() メソッドを修正")
    print(f"2. 無効なフィールドを削除し、有効なフィールドのみを使用")
    print(f"3. 再度データ取得をテスト")
