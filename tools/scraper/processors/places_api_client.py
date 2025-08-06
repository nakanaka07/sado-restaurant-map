#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Places API Client - Google Places API通信専用クラス

このモジュールはGoogle Places API (New) v1との通信を管理します。
places_data_updater.py から抽出された API通信機能を統合・最適化。

Features:
- Text Search API対応
- Place Details API対応  
- CID URL対応
- エラーハンドリング
- レート制限対応
"""

import os
import time
import requests
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime


@dataclass
class APIConfig:
    """API設定クラス"""
    api_key: str
    request_delay: float = 1.0
    max_results: int = 20
    language_code: str = "ja"
    
    
@dataclass
class LocationBounds:
    """地理的境界設定"""
    north: float = 38.39
    south: float = 37.74
    east: float = 138.62
    west: float = 137.85


class PlacesAPIClient:
    """Google Places API (New) v1 クライアント"""
    
    def __init__(self, api_key: Optional[str] = None, request_delay: float = 1.0):
        """
        初期化
        
        Args:
            api_key: Google Places API キー
            request_delay: リクエスト間の待機時間（秒）
        """
        self.config = APIConfig(
            api_key=api_key or os.environ.get('PLACES_API_KEY', ''),
            request_delay=request_delay
        )
        self.bounds = LocationBounds()
        self.last_request_time = 0
        
        if not self.config.api_key:
            raise ValueError("PLACES_API_KEY が設定されていません")
    
    def _wait_for_rate_limit(self) -> None:
        """レート制限に従って待機"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.config.request_delay:
            time.sleep(self.config.request_delay - elapsed)
        self.last_request_time = time.time()
    
    def _build_field_mask(self, category: str, api_type: str = 'details') -> str:
        """カテゴリに応じたフィールドマスクを構築
        
        Args:
            category: カテゴリ（restaurants, parkings, toilets）
            api_type: APIの種類（'details' または 'search'）
        """
        base_fields = [
            "id",
            "shortFormattedAddress", 
            "location",
            "displayName",
            "primaryType",
            "primaryTypeDisplayName",
            "googleMapsUri"
        ]
        
        if category in ['restaurant', 'restaurants']:
            # Places API (New) v1 拡張フィールド（飲食店用包括的データ）
            additional_fields = [
                # 基本営業データ
                "regularOpeningHours",
                "nationalPhoneNumber",
                "rating",
                "userRatingCount",
                "priceLevel",
                "businessStatus",
                "types",
                "websiteUri",
                "reviews",
                "photos",
                
                # 拡張営業データ (Places API New v1)
                "editorialSummary",        # 店舗説明
                "formattedAddress",        # 完全住所
                "currentOpeningHours",     # 現在の営業時間
                "utcOffsetMinutes",        # UTCオフセット
                
                # サービス・設備情報
                "takeout",                 # テイクアウト対応
                "delivery",                # デリバリー対応
                "dineIn",                  # 店内飲食対応
                "curbsidePickup",          # カーブサイドピックアップ
                "reservable",              # 予約可能
                
                # 食事・時間帯対応
                "servesBreakfast",         # 朝食提供
                "servesLunch",             # 昼食提供
                "servesDinner",            # 夕食提供
                
                # アルコール・飲み物
                "servesBeer",              # ビール提供
                "servesWine",              # ワイン提供
                "servesCocktails",         # カクテル提供
                "servesCoffee",            # コーヒー提供
                
                # 特別メニュー・食事制限対応
                "servesVegetarianFood",    # ベジタリアン料理
                "servesDessert",           # デザート提供
                "menuForChildren",         # 子供向けメニュー
                
                # 設備・環境
                "outdoorSeating",          # 屋外席
                "liveMusic",               # ライブ音楽
                "restroom",                # トイレ完備
                
                # 顧客対応
                "goodForChildren",         # 子供連れ歓迎
                "allowsDogs",              # ペット同伴可
                "goodForGroups",           # グループ向け
                "goodForWatchingSports",   # スポーツ観戦向け
                
                # 支払い・駐車場
                "paymentOptions",          # 支払い方法
                "parkingOptions",          # 駐車場オプション
                "accessibilityOptions"     # アクセシビリティオプション
            ]
            all_fields = base_fields + additional_fields
        elif category in ['parking', 'parkings', 'toilet', 'toilets']:
            # 駐車場・公衆トイレ用設定（修正版 - 2025年8月6日）
            # 有効なフィールドのみを使用
            
            additional_fields = [
                # 基本営業データ
                "businessStatus",          # 営業状況
                "types",                   # 施設タイプ
                "photos",                  # 写真データ
                "rating",                  # 評価
                "userRatingCount",         # レビュー数
                
                # 営業・設備情報
                "regularOpeningHours",     # 営業/開放時間
                "accessibilityOptions",    # アクセシビリティ全般
                "paymentOptions",          # 料金体系（駐車場重要）
                "restroom",                # トイレ設備（駐車場）
                "goodForChildren",         # 子供連れ対応（公衆トイレ）
                "parkingOptions",          # 駐車場併設（公衆トイレ）
                "editorialSummary",        # 施設説明
                "formattedAddress"         # 完全住所
            ]
            all_fields = base_fields + additional_fields
        else:
            # 未知のカテゴリの場合は基本フィールドのみ
            all_fields = base_fields
        
        # APIの種類に応じてプレフィックスを付与
        if api_type == 'search':
            # Text Search API用: places. プレフィックスが必要
            return ','.join(f'places.{field}' for field in all_fields)
        else:
            # Place Details API用: プレフィックス不要
            return ','.join(all_fields)
    
    def _build_location_bias(self) -> Dict[str, Any]:
        """佐渡島の境界ボックスを構築"""
        return {
            "rectangle": {
                "low": {
                    "latitude": self.bounds.south, 
                    "longitude": self.bounds.west
                },
                "high": {
                    "latitude": self.bounds.north, 
                    "longitude": self.bounds.east
                }
            }
        }
    
    def search_text(self, text_query: str, category: str, 
                   included_type: Optional[str] = None) -> Tuple[str, List[Dict]]:
        """
        Text Search API を使用して場所を検索
        
        Args:
            text_query: 検索クエリ
            category: カテゴリ（restaurants, parkings, toilets）
            included_type: 含めるタイプ（オプション）
            
        Returns:
            Tuple[status, places]: (ステータス, 場所リスト)
        """
        self._wait_for_rate_limit()
        
        # リクエストボディ構築
        request_body = {
            "textQuery": text_query,
            "languageCode": self.config.language_code,
            "maxResultCount": self.config.max_results,
            "locationBias": self._build_location_bias()
        }
        
        # タイプフィルタの追加
        if included_type:
            request_body["includedType"] = included_type
        
        # ヘッダー構築
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.config.api_key,
            'X-Goog-FieldMask': self._build_field_mask(category, 'search')
        }
        
        try:
            print(f"🔍 検索中: {text_query}")
            
            response = requests.post(
                'https://places.googleapis.com/v1/places:searchText',
                headers=headers,
                json=request_body,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            places = data.get('places', [])
            
            status = 'OK' if places else 'ZERO_RESULTS'
            print(f"✅ 結果: {len(places)}件")
            
            return status, places
            
        except requests.exceptions.RequestException as e:
            print(f"❌ API request failed: {e}")
            return 'REQUEST_FAILED', []
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return 'ERROR', []
    
    def get_place_details(self, place_id: str, category: str = 'restaurants') -> Optional[Dict]:
        """
        Place IDから詳細情報を取得
        
        Args:
            place_id: Google Place ID
            category: カテゴリ（restaurants, parkings, toilets）
            
        Returns:
            Place詳細情報またはNone
        """
        self._wait_for_rate_limit()
        
        # ヘッダー構築
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.config.api_key,
            'X-Goog-FieldMask': self._build_field_mask(category, 'details')
        }
        
        try:
            print(f"🔍 Place Details検索: {place_id}")
            
            response = requests.get(
                f'https://places.googleapis.com/v1/places/{place_id}',
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 404:
                print(f"⚠️ Place not found: {place_id}")
                return None
            
            response.raise_for_status()
            place_data = response.json()
            
            print(f"✅ Place Details取得成功")
            return place_data
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Place Details API request failed: {e}")
            return None
        except Exception as e:
            print(f"❌ Place Details Unexpected error: {e}")
            return None

    def get_place_details_from_cid(self, cid_url: str, category: str) -> Tuple[str, Optional[Dict]]:
        """
        CID URLからPlace詳細を取得
        
        Args:
            cid_url: CID URL (例: https://maps.google.com/place?cid=123456789)
            category: カテゴリ
            
        Returns:
            Tuple[status, place]: (ステータス, 場所詳細)
        """
        self._wait_for_rate_limit()
        
        # CIDを抽出
        try:
            cid = cid_url.split('cid=')[1].split('&')[0].split('#')[0].strip()
        except (IndexError, AttributeError):
            print(f"❌ 無効なCID URL: {cid_url}")
            return 'INVALID_CID', None
        
        # Place IDをCIDから構築
        place_id = f"ChIJ{cid}"  # CIDからPlace IDを構築
        
        # ヘッダー構築
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': self.config.api_key,
            'X-Goog-FieldMask': self._build_field_mask(category, 'details')
        }
        
        try:
            print(f"🔍 CID検索: {cid}")
            
            response = requests.get(
                f'https://places.googleapis.com/v1/places/{place_id}',
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 404:
                print(f"⚠️ Place not found for CID: {cid}")
                return 'NOT_FOUND', None
            
            response.raise_for_status()
            place = response.json()
            
            print(f"✅ CID詳細取得成功")
            return 'OK', place
            
        except requests.exceptions.RequestException as e:
            print(f"❌ CID API request failed: {e}")
            return 'REQUEST_FAILED', None
        except Exception as e:
            print(f"❌ CID Unexpected error: {e}")
            return 'ERROR', None
    
    def batch_search(self, queries: List[str], category: str, 
                    included_type: Optional[str] = None) -> Dict[str, Tuple[str, List[Dict]]]:
        """
        複数クエリのバッチ検索
        
        Args:
            queries: 検索クエリリスト
            category: カテゴリ
            included_type: 含めるタイプ（オプション）
            
        Returns:
            Dict[query, (status, places)]: クエリ別結果
        """
        results = {}
        
        print(f"🚀 バッチ検索開始: {len(queries)}件")
        
        for i, query in enumerate(queries, 1):
            print(f"[{i}/{len(queries)}] 処理中...")
            
            status, places = self.search_text(query, category, included_type)
            results[query] = (status, places)
            
            # 進捗表示
            if i % 10 == 0:
                print(f"📊 進捗: {i}/{len(queries)} 完了")
        
        print(f"🎉 バッチ検索完了: {len(results)}件処理")
        return results
    
    def get_api_usage_stats(self) -> Dict[str, Any]:
        """API使用統計を取得"""
        return {
            "api_key_configured": bool(self.config.api_key),
            "request_delay": self.config.request_delay,
            "max_results": self.config.max_results,
            "language_code": self.config.language_code,
            "bounds": {
                "north": self.bounds.north,
                "south": self.bounds.south,
                "east": self.bounds.east,
                "west": self.bounds.west
            }
        }


# 利便性のための関数群
def create_client(api_key: Optional[str] = None, request_delay: float = 1.0) -> PlacesAPIClient:
    """Places API クライアントを作成"""
    return PlacesAPIClient(api_key, request_delay)


def quick_search(text_query: str, category: str = 'restaurants', 
                api_key: Optional[str] = None) -> Tuple[str, List[Dict]]:
    """クイック検索（単発使用向け）"""
    client = create_client(api_key)
    return client.search_text(text_query, category)


if __name__ == "__main__":
    # テスト実行
    import sys
    
    if len(sys.argv) < 2:
        print("使用方法: python places_api_client.py <検索クエリ>")
        sys.exit(1)
    
    query = sys.argv[1]
    
    try:
        client = create_client()
        status, places = client.search_text(query, 'restaurants')
        
        print(f"\n=== 検索結果 ===")
        print(f"クエリ: {query}")
        print(f"ステータス: {status}")
        print(f"結果数: {len(places)}")
        
        if places:
            for i, place in enumerate(places[:3], 1):
                name = place.get('displayName', {}).get('text', 'Unknown')
                address = place.get('shortFormattedAddress', 'Unknown')
                print(f"{i}. {name} - {address}")
                
    except Exception as e:
        print(f"❌ エラー: {e}")
        sys.exit(1)
