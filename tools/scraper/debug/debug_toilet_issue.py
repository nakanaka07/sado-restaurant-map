#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
トイレデータ取得問題のデバッグスクリプト

トイレ（公衆トイレ）のPlace IDから実際のAPI応答を確認し、
データ取得の状況を検証する。
"""

import os
import json
from dotenv import load_dotenv
from processors.places_api_client import PlacesAPIClient
from processors.data_validator import DataValidator
from utils.translators import translate_business_status, translate_types

# 環境変数読み込み
load_dotenv('config/.env')

def debug_toilet_place_id(place_id: str, category: str = 'toilets'):
    """トイレPlace IDのデバッグ"""
    print(f"🚽 トイレデータデバッグ開始: {place_id}")
    
    # API クライアント初期化
    try:
        client = PlacesAPIClient()
        print("✅ API クライアント初期化成功")
    except Exception as e:
        print(f"❌ API クライアント初期化失敗: {e}")
        return
    
    # フィールドマスクの確認
    field_mask = client._build_field_mask(category)
    print(f"📋 トイレ用フィールドマスク: {field_mask}")
    
    # API リクエスト実行
    try:
        # Place Detailsを直接取得
        import requests
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': client.config.api_key,
            'X-Goog-FieldMask': field_mask
        }
        
        url = f'https://places.googleapis.com/v1/places/{place_id}'
        print(f"📡 API URL: {url}")
        
        response = requests.get(url, headers=headers, timeout=30)
        print(f"📊 レスポンス状態: {response.status_code}")
        
        if response.status_code == 200:
            place_data = response.json()
            print(f"✅ API応答成功")
            
            # 生のAPIデータを表示
            print("\n=== 生APIレスポンス ===")
            print(json.dumps(place_data, indent=2, ensure_ascii=False))
            
            # データ検証
            validator = DataValidator()
            result = validator.validate_place_data(place_data, category)
            
            print(f"\n=== データ検証結果 ===")
            print(f"有効: {result.is_valid}")
            print(f"エラー: {result.errors}")
            print(f"警告: {result.warnings}")
            print(f"地区: {result.district}")
            
            # 抽出されたデータ
            print(f"\n=== 抽出データ ===")
            for key, value in result.data.items():
                print(f"{key}: {value}")
                
            # トイレ特有のデータを確認
            print(f"\n=== トイレ特有データ ===")
            restroom = place_data.get('restroom', 'データなし')
            good_for_children = place_data.get('goodForChildren', 'データなし')
            accessibility = place_data.get('accessibilityOptions', {})
            parking = place_data.get('parkingOptions', {})
            
            print(f"トイレ設備: {restroom}")
            print(f"子供連れ対応: {good_for_children}")
            print(f"アクセシビリティ: {accessibility}")
            print(f"駐車場情報: {parking}")
                
        else:
            print(f"❌ API応答エラー: {response.status_code}")
            print(f"エラー内容: {response.text}")
            
    except Exception as e:
        print(f"❌ API リクエスト失敗: {e}")

def test_toilet_text_search():
    """トイレの文字検索をテスト"""
    print("\n🔍 トイレの文字検索テスト")
    
    try:
        client = PlacesAPIClient()
        
        # 佐渡島内のトイレを検索
        test_queries = [
            "佐渡 公衆トイレ",
            "佐渡市 トイレ",
            "両津 トイレ",
            "相川 公衆トイレ",
            "小木 トイレ"
        ]
        
        for query in test_queries:
            print(f"\n--- 検索: {query} ---")
            status, places = client.search_text(query, 'toilets', 'point_of_interest')
            
            print(f"ステータス: {status}")
            print(f"結果数: {len(places)}")
            
            if places:
                for i, place in enumerate(places[:3], 1):
                    name = place.get('displayName', {})
                    if isinstance(name, dict):
                        name = name.get('text', 'Unknown')
                    address = place.get('shortFormattedAddress', 'Unknown')
                    place_id = place.get('id', 'No ID')
                    types = place.get('types', [])
                    
                    print(f"  {i}. {name}")
                    print(f"     住所: {address}")
                    print(f"     Place ID: {place_id}")
                    print(f"     タイプ: {types}")
                    
    except Exception as e:
        print(f"❌ 文字検索テスト失敗: {e}")

def compare_toilet_vs_parking_fields():
    """トイレと駐車場のフィールドマスク比較"""
    print("\n📋 トイレ vs 駐車場 フィールドマスク比較")
    
    client = PlacesAPIClient()
    
    toilet_fields = client._build_field_mask('toilets').split(',')
    parking_fields = client._build_field_mask('parkings').split(',')
    
    print(f"\n🚽 トイレ用フィールド ({len(toilet_fields)}個):")
    for field in toilet_fields:
        print(f"  - {field}")
    
    print(f"\n🅿️ 駐車場用フィールド ({len(parking_fields)}個):")
    for field in parking_fields:
        print(f"  - {field}")
    
    # 共通フィールドと差異を確認
    common = set(toilet_fields) & set(parking_fields)
    toilet_only = set(toilet_fields) - set(parking_fields)
    parking_only = set(parking_fields) - set(toilet_fields)
    
    print(f"\n🔗 共通フィールド ({len(common)}個):")
    for field in sorted(common):
        print(f"  - {field}")
    
    if toilet_only:
        print(f"\n🚽 トイレ専用フィールド ({len(toilet_only)}個):")
        for field in sorted(toilet_only):
            print(f"  - {field}")
    
    if parking_only:
        print(f"\n🅿️ 駐車場専用フィールド ({len(parking_only)}個):")
        for field in sorted(parking_only):
            print(f"  - {field}")

if __name__ == "__main__":
    print("🚀 トイレデータ取得問題デバッグスクリプト")
    
    # フィールド比較
    compare_toilet_vs_parking_fields()
    
    # 文字検索テスト
    test_toilet_text_search()
    
    # 特定のPlace IDをテストしたい場合（サンプル）
    sample_toilet_place_ids = [
        # ここに実際のトイレのPlace IDを追加
        # "ChIJXXXXXXXXXXXXXXXXXXXXXXXXXX"  # サンプル
    ]
    
    if sample_toilet_place_ids:
        for place_id in sample_toilet_place_ids:
            print("\n" + "="*50)
            debug_toilet_place_id(place_id, 'toilets')
    else:
        print("\n💡 特定のPlace IDをテストするには、sample_toilet_place_ids リストに追加してください")
