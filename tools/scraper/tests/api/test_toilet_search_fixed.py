#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修正されたAPIクライアントでトイレ検索をテスト
"""

import os
import json
from dotenv import load_dotenv
from processors.places_api_client import PlacesAPIClient

# 環境変数読み込み
load_dotenv('config/.env')

def test_toilet_search_with_fixed_api():
    """修正されたAPIクライアントでトイレ検索をテスト"""
    print("🚽 修正されたAPIクライアントでトイレ検索テスト")
    
    try:
        client = PlacesAPIClient()
        
        # Text Search用とDetails用のフィールドマスクを確認
        search_mask = client._build_field_mask('toilets', 'search')
        details_mask = client._build_field_mask('toilets', 'details')
        
        print(f"🔍 Text Search用フィールドマスク:")
        print(f"   {search_mask}")
        print(f"🔎 Place Details用フィールドマスク:")
        print(f"   {details_mask}")
        
        # トイレ検索テスト
        test_queries = [
            "佐渡 公衆トイレ",
            "佐渡市 トイレ",
            "toilet 佐渡"
        ]
        
        for query in test_queries:
            print(f"\n--- 検索テスト: {query} ---")
            
            try:
                status, places = client.search_text(query, 'toilets')
                
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
                        
                        # トイレ特有のデータをチェック
                        restroom = place.get('restroom', 'データなし')
                        good_for_children = place.get('goodForChildren', 'データなし')
                        print(f"     トイレ設備: {restroom}")
                        print(f"     子供連れ対応: {good_for_children}")
                else:
                    print("  検索結果なし")
                    
            except Exception as e:
                print(f"  ❌ 検索エラー: {e}")
        
    except Exception as e:
        print(f"❌ APIクライアント初期化失敗: {e}")

def test_general_search():
    """一般的な検索でトイレ関連施設を探す"""
    print("\n🔍 一般的な検索でトイレ関連施設を探すテスト")
    
    try:
        client = PlacesAPIClient()
        
        # より一般的な検索語
        general_queries = [
            "佐渡市役所",        # 公共施設（トイレあり）
            "両津港",            # 交通施設（トイレあり）
            "佐渡金山",          # 観光地（トイレあり）
            "道の駅 佐渡",       # 道の駅（トイレあり）
            "佐渡 公園"          # 公園（トイレあり）
        ]
        
        for query in general_queries:
            print(f"\n--- 一般検索: {query} ---")
            
            try:
                status, places = client.search_text(query, 'toilets')
                
                print(f"ステータス: {status}")
                print(f"結果数: {len(places)}")
                
                if places:
                    for i, place in enumerate(places[:2], 1):
                        name = place.get('displayName', {})
                        if isinstance(name, dict):
                            name = name.get('text', 'Unknown')
                        address = place.get('shortFormattedAddress', 'Unknown')
                        types = place.get('types', [])
                        restroom = place.get('restroom', 'データなし')
                        
                        print(f"  {i}. {name}")
                        print(f"     住所: {address}")
                        print(f"     タイプ: {types}")
                        print(f"     トイレ設備: {restroom}")
                        
            except Exception as e:
                print(f"  ❌ 検索エラー: {e}")
                
    except Exception as e:
        print(f"❌ 一般検索テスト失敗: {e}")

if __name__ == "__main__":
    print("🚀 修正されたAPIクライアントでのトイレ検索テスト")
    
    # 修正されたAPIクライアントでのテスト
    test_toilet_search_with_fixed_api()
    
    # 一般的な検索テスト
    test_general_search()
