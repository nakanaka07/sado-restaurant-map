#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
駐車場データ取得問題のデバッグスクリプト

問題のあるPlace IDから実際のAPI応答を確認し、
データ取得できない理由を特定する。
"""

import os
import json
from dotenv import load_dotenv
from processors.places_api_client import PlacesAPIClient
from processors.data_validator import DataValidator
from utils.translators import translate_business_status, translate_types

# 環境変数読み込み
load_dotenv('config/.env')

def debug_place_id(place_id: str, category: str = 'parkings'):
    """Place IDのデバッグ"""
    print(f"🔍 デバッグ開始: {place_id}")
    
    # API クライアント初期化
    try:
        client = PlacesAPIClient()
        print("✅ API クライアント初期化成功")
    except Exception as e:
        print(f"❌ API クライアント初期化失敗: {e}")
        return
    
    # フィールドマスクの確認
    field_mask = client._build_field_mask(category)
    print(f"📋 フィールドマスク: {field_mask}")
    
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
                
        else:
            print(f"❌ API応答エラー: {response.status_code}")
            print(f"エラー内容: {response.text}")
            
    except Exception as e:
        print(f"❌ API リクエスト失敗: {e}")

def debug_cid_url(cid_url: str, category: str = 'parkings'):
    """CID URLのデバッグ"""
    print(f"🔍 CID URLデバッグ開始: {cid_url}")
    
    try:
        client = PlacesAPIClient()
        status, place_data = client.get_place_details_from_cid(cid_url, category)
        
        print(f"📊 ステータス: {status}")
        
        if status == 'OK' and place_data:
            print(f"✅ CID検索成功")
            
            # 生のAPIデータを表示
            print("\n=== CID API応答 ===")
            print(json.dumps(place_data, indent=2, ensure_ascii=False))
            
            # データ検証
            validator = DataValidator()
            result = validator.validate_place_data(place_data, category)
            
            print(f"\n=== データ検証結果 ===")
            print(f"有効: {result.is_valid}")
            print(f"エラー: {result.errors}")
            print(f"警告: {result.warnings}")
            print(f"地区: {result.district}")
            
        else:
            print(f"❌ CID検索失敗: {status}")
            
    except Exception as e:
        print(f"❌ CID デバッグ失敗: {e}")

def compare_field_availability():
    """フィールドの利用可能性を比較"""
    print("\n=== フィールド利用可能性比較 ===")
    
    client = PlacesAPIClient()
    
    # 各カテゴリのフィールドマスクを比較
    categories = ['restaurants', 'parkings', 'toilets']
    
    for category in categories:
        field_mask = client._build_field_mask(category)
        fields = field_mask.split(',')
        print(f"\n📋 {category} ({len(fields)}フィールド):")
        for field in fields:
            print(f"  - {field}")

if __name__ == "__main__":
    print("🚀 駐車場データ取得問題デバッグスクリプト")
    
    # 問題のあるPlace ID
    problem_place_ids = [
        "ChIJK06RNHlv818RQ7zYlklxhF0",  # 相川地区の駐車場
        "ChIJvb7dufVi818RbM6iEfbj7Ps"   # 真野地区の駐車場
    ]
    
    # 正常なPlace ID（比較用）
    working_place_id = "ChIJ5yhd5IlD818RfYgU8KuzWVg"  # 平根崎駐車場
    
    # フィールド利用可能性の比較
    compare_field_availability()
    
    print("\n" + "="*50)
    print("🔍 正常なPlace IDのデータ確認")
    debug_place_id(working_place_id, 'parkings')
    
    # 問題のあるPlace IDをデバッグ
    for place_id in problem_place_ids:
        print("\n" + "="*50)
        print(f"🔍 問題のあるPlace IDのデータ確認")
        debug_place_id(place_id, 'parkings')
