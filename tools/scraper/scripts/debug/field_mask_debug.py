#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Places APIフィールドマスク確認ツール

フィールドマスクの詳細確認と実際のAPIレスポンスをテストします。
"""

import os
import sys
import json
from pathlib import Path

# パスを追加してprocessorsにアクセス
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from processors.places_api_client import PlacesAPIClient
from utils.google_auth import validate_environment

def test_field_mask():
    """フィールドマスクのテスト"""
    
    print("🔍 Places API フィールドマスク確認ツール")
    print("=" * 60)
    
    # 環境変数の確認
    if not validate_environment():
        print("❌ 環境変数が設定されていません")
        return
    
    # APIクライアント初期化
    api_key = os.getenv('PLACES_API_KEY')
    client = PlacesAPIClient(api_key=api_key)
    
    # フィールドマスクの確認
    categories = ['restaurants', 'parkings', 'toilets']
    
    for category in categories:
        print(f"\n📋 カテゴリ: {category}")
        print("-" * 40)
        
        field_mask = client._build_field_mask(category)
        fields = field_mask.split(',')
        
        print(f"📊 フィールド数: {len(fields)}")
        print(f"📝 フィールドマスク:")
        
        # フィールドを分類して表示
        base_fields = []
        extended_fields = []
        
        for field in fields:
            if field.strip() in [
                "places.id",
                "places.shortFormattedAddress", 
                "places.location",
                "places.displayName",
                "places.primaryType",
                "places.primaryTypeDisplayName",
                "places.googleMapsLinks"
            ]:
                base_fields.append(field.strip())
            else:
                extended_fields.append(field.strip())
        
        print(f"   📌 基本フィールド ({len(base_fields)}件):")
        for field in base_fields:
            print(f"      - {field}")
        
        print(f"   🆕 拡張フィールド ({len(extended_fields)}件):")
        for field in extended_fields:
            print(f"      - {field}")

def test_actual_api_call():
    """実際のAPI呼び出しテスト"""
    
    print("\n" + "=" * 60)
    print("🚀 実際のAPI呼び出しテスト")
    print("=" * 60)
    
    # 環境変数の確認
    if not validate_environment():
        print("❌ 環境変数が設定されていません")
        return
    
    # APIクライアント初期化
    api_key = os.getenv('PLACES_API_KEY')
    client = PlacesAPIClient(api_key=api_key)
    
    # Text Search APIを使用してテスト（CIDの代わりに）
    test_query = "ma_ma 佐渡市"
    
    print(f"🔍 テスト対象: {test_query}")
    print(f"📋 カテゴリ: restaurants")
    
    # フィールドマスクを表示
    field_mask = client._build_field_mask('restaurants')
    print(f"📝 使用フィールドマスク:")
    fields = field_mask.split(',')
    for i, field in enumerate(fields, 1):
        print(f"   {i:2d}. {field.strip()}")
    
    print(f"\n🚀 Text Search API呼び出し実行中...")
    
    # Text Search API呼び出し
    status, places_list = client.search_text(test_query, 'restaurants')
    
    print(f"📊 ステータス: {status}")
    print(f"📊 取得件数: {len(places_list) if places_list else 0}")
    
    if status == 'OK' and places_list and len(places_list) > 0:
        place_data = places_list[0]  # 最初の結果を使用
        print(f"✅ データ取得成功")
        
        # レスポンス分析
        available_fields = list(place_data.keys())
        print(f"📋 取得されたフィールド数: {len(available_fields)}")
        
        # 基本フィールドの確認
        basic_fields = ['id', 'displayName', 'shortFormattedAddress', 'location']
        extended_fields = [
            'takeout', 'delivery', 'dineIn', 'servesBreakfast', 'servesLunch', 'servesDinner',
            'servesBeer', 'servesWine', 'servesCocktails', 'servesCoffee',
            'servesVegetarianFood', 'servesDessert', 'menuForChildren',
            'outdoorSeating', 'liveMusic', 'restroom',
            'goodForChildren', 'allowsDogs', 'goodForGroups', 'goodForWatchingSports',
            'paymentOptions', 'parkingOptions', 'accessibilityOptions'
        ]
        
        print(f"\n📌 基本フィールドの確認:")
        for field in basic_fields:
            status_icon = "✅" if field in available_fields else "❌"
            print(f"   {status_icon} {field}")
        
        print(f"\n🆕 拡張フィールドの確認:")
        for field in extended_fields:
            status_icon = "✅" if field in available_fields else "❌"
            value = place_data.get(field, "N/A")
            print(f"   {status_icon} {field}: {value}")
        
        # 実際のレスポンス構造を表示
        print(f"\n📋 実際のレスポンス構造:")
        for key, value in place_data.items():
            if isinstance(value, dict):
                print(f"   📁 {key}: {type(value).__name__} (キー: {list(value.keys())[:3]}...)")
            elif isinstance(value, list):
                print(f"   📄 {key}: {type(value).__name__} (長さ: {len(value)})")
            else:
                print(f"   📝 {key}: {type(value).__name__} = {str(value)[:50]}...")
                
        # JSON形式でのサンプル出力
        print(f"\n📄 レスポンスサンプル（JSON形式）:")
        print(json.dumps(place_data, indent=2, ensure_ascii=False)[:1000] + "...")
    
    else:
        print(f"❌ データ取得失敗: {status}")
        if places_list:
            print(f"📋 取得データ: {places_list}")

def main():
    """メイン実行"""
    test_field_mask()
    test_actual_api_call()

if __name__ == "__main__":
    main()
