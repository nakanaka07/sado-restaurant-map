#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Text Search API のエラー詳細確認

Text Search API の400エラーの詳細を確認し、
正しいリクエスト形式を特定する。
"""

import os
import json
import requests
from dotenv import load_dotenv

# 環境変数読み込み
load_dotenv('config/.env')

def test_text_search_detailed(text_query: str, category: str = 'toilets'):
    """Text Search APIの詳細テスト"""
    api_key = os.environ.get('PLACES_API_KEY')
    
    # フィールドマスク（基本版）
    field_mask = "id,displayName,location,shortFormattedAddress,types,businessStatus"
    
    # リクエストボディ構築
    request_body = {
        "textQuery": text_query,
        "languageCode": "ja",
        "maxResultCount": 5,
        "locationBias": {
            "rectangle": {
                "low": {
                    "latitude": 37.74, 
                    "longitude": 137.85
                },
                "high": {
                    "latitude": 38.39, 
                    "longitude": 138.62
                }
            }
        }
    }
    
    # ヘッダー構築
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        'X-Goog-FieldMask': field_mask
    }
    
    print(f"🔍 Text Search API テスト: {text_query}")
    print(f"📋 フィールドマスク: {field_mask}")
    print(f"📝 リクエストボディ:")
    print(json.dumps(request_body, indent=2, ensure_ascii=False))
    
    try:
        response = requests.post(
            'https://places.googleapis.com/v1/places:searchText',
            headers=headers,
            json=request_body,
            timeout=30
        )
        
        print(f"📊 レスポンス状態: {response.status_code}")
        print(f"📄 レスポンスヘッダー: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 成功")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"❌ エラー: {response.status_code}")
            print(f"エラー詳細: {response.text}")
            
            # エラー詳細を解析
            try:
                error_data = response.json()
                print(f"エラー構造化:")
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print("エラーレスポンスはJSONではありません")
                
    except Exception as e:
        print(f"❌ リクエスト失敗: {e}")

def test_minimal_text_search():
    """最小限のText Search APIテスト"""
    api_key = os.environ.get('PLACES_API_KEY')
    
    # 最小限のリクエスト
    request_body = {
        "textQuery": "佐渡",
        "languageCode": "ja"
    }
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        'X-Goog-FieldMask': 'places.id,places.displayName'
    }
    
    print(f"\n🧪 最小限のテスト")
    print(f"📝 最小リクエストボディ:")
    print(json.dumps(request_body, indent=2, ensure_ascii=False))
    
    try:
        response = requests.post(
            'https://places.googleapis.com/v1/places:searchText',
            headers=headers,
            json=request_body,
            timeout=30
        )
        
        print(f"📊 レスポンス状態: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 最小限テスト成功")
            print(json.dumps(data, indent=2, ensure_ascii=False)[:500] + "...")
        else:
            print(f"❌ 最小限テストもエラー: {response.status_code}")
            print(f"エラー詳細: {response.text}")
            
    except Exception as e:
        print(f"❌ 最小限テスト失敗: {e}")

def test_field_mask_variations():
    """フィールドマスクのバリエーションテスト"""
    api_key = os.environ.get('PLACES_API_KEY')
    
    # 異なるフィールドマスクパターン
    field_mask_patterns = [
        "places.id,places.displayName",  # 旧形式
        "id,displayName",                # 新形式
        "places.displayName",            # 旧形式（単一）
        "displayName"                    # 新形式（単一）
    ]
    
    request_body = {
        "textQuery": "佐渡",
        "languageCode": "ja"
    }
    
    for i, field_mask in enumerate(field_mask_patterns, 1):
        print(f"\n🧪 フィールドマスクテスト {i}: {field_mask}")
        
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': api_key,
            'X-Goog-FieldMask': field_mask
        }
        
        try:
            response = requests.post(
                'https://places.googleapis.com/v1/places:searchText',
                headers=headers,
                json=request_body,
                timeout=30
            )
            
            print(f"📊 レスポンス状態: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ 成功")
            else:
                print(f"❌ エラー: {response.text[:200]}...")
                
        except Exception as e:
            print(f"❌ テスト失敗: {e}")

if __name__ == "__main__":
    print("🚀 Text Search API 詳細エラー解析")
    
    # 基本テスト
    test_text_search_detailed("佐渡 トイレ")
    
    # 最小限テスト
    test_minimal_text_search()
    
    # フィールドマスクテスト
    test_field_mask_variations()
