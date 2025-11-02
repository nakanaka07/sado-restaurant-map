#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Places API Adapter - 新しいアーキテクチャ対応版

既存のPlacesAPIClientを新しいインターフェースに適合させるアダプター
"""

from typing import List, Dict, Optional, Any
from core.domain.interfaces import APIClient
from shared.types.core_types import PlaceData
from shared.exceptions import APIError, ConfigurationError
from shared.logger import get_logger
import os
import time
import requests
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass

# 定数定義
CONTENT_TYPE_JSON = 'application/json'

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


class PlacesAPIAdapter(APIClient):
    """Places API Client adapter for new architecture"""

    def __init__(self, api_key: str, delay: float = 1.0, max_retries: int = 3, timeout: int = 30):
        """Initialize the Places API adapter"""
        self.config = APIConfig(
            api_key=api_key or os.environ.get('PLACES_API_KEY', ''),
            request_delay=delay
        )
        self.bounds = LocationBounds()
        self.last_request_time = 0
        self._max_retries = max_retries
        self._timeout = timeout
        self._logger = get_logger(__name__)

        if not self.config.api_key:
            raise ConfigurationError("Places API key is required")

    def _wait_for_rate_limit(self) -> None:
        """レート制限に従って待機"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.config.request_delay:
            time.sleep(self.config.request_delay - elapsed)
        self.last_request_time = time.time()

    def _build_field_mask(self, category: str, api_type: str = 'details', id_only: bool = False) -> str:
        """カテゴリに応じたフィールドマスクを構築

        Args:
            category: カテゴリ名
            api_type: 'details' または 'search'
            id_only: Trueの場合はID onlyフィールド（無料SKU）
        """
        # ID onlyモード: 無料SKU適用
        if id_only:
            if api_type == 'search':
                return 'places.id,places.name'
            else:
                return 'id,name'

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
            additional_fields = [
                "regularOpeningHours", "nationalPhoneNumber", "rating", "userRatingCount",
                "priceLevel", "businessStatus", "types", "websiteUri", "reviews", "photos",
                "editorialSummary", "formattedAddress", "currentOpeningHours", "utcOffsetMinutes",
                "takeout", "delivery", "dineIn", "curbsidePickup", "reservable",
                "servesBreakfast", "servesLunch", "servesDinner", "servesBeer", "servesWine",
                "servesCocktails", "servesCoffee", "servesVegetarianFood", "servesDessert",
                "menuForChildren", "outdoorSeating", "liveMusic", "restroom",
                "goodForChildren", "allowsDogs", "goodForGroups", "goodForWatchingSports",
                "paymentOptions", "parkingOptions", "accessibilityOptions"
            ]
            all_fields = base_fields + additional_fields
        else:
            all_fields = base_fields

        if api_type == 'search':
            return ','.join(f'places.{field}' for field in all_fields)
        else:
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

    def fetch_place_details(self, place_id: str) -> Optional[PlaceData]:
        """
        Fetch detailed information for a specific place.

        Args:
            place_id: The unique place identifier

        Returns:
            Place details or None if not found
        """
        try:
            place_data = self._get_place_details(place_id, 'restaurants')
            if place_data:
                return self._normalize_place_data(place_data)
            return None

        except Exception as e:
            self._logger.error("Failed to fetch place details", place_id=place_id, error=str(e))
            raise APIError(f"Failed to fetch place details: {e}")

    def fetch_place_by_cid(self, cid: str) -> Optional[PlaceData]:
        """
        CID (Customer ID) から Place詳細を取得

        ⚠️ 重要な制限:
        Google Places API (New) v1では、CIDからの直接検索は**サポートされていません**。
        この実装は互換性のために残されていますが、常にNoneを返します。

        代替案:
        1. 事前にCIDをPlace IDに変換してデータを保存
        2. 店舗名での検索にフォールバック
        3. 旧Places API v1 (Nearby Search)を使用

        Args:
            cid: Google Maps CID (Customer ID)

        Returns:
            None (CIDからの直接取得は不可能)
        """
        self._logger.warning(
            "CID-based search is not supported by Places API (New) v1",
            cid=cid,
            recommendation="Use Place ID or store name search instead"
        )
        return None

    def search_text_id_only(self, text_query: str) -> Optional[str]:
        """Text Search (ID only) - 無料SKU

        店舗名からPlace IDのみを取得します。
        Text Search Essentials (ID only) SKUが適用され、**完全無料**です。

        Args:
            text_query: 検索クエリ（店舗名など）

        Returns:
            Place ID（見つからない場合はNone）
        """
        self._wait_for_rate_limit()

        request_body = {
            "textQuery": text_query,
            "languageCode": self.config.language_code,
            "maxResultCount": 1,  # 最初の1件のみ取得
            "locationBias": self._build_location_bias()
        }

        field_mask = self._build_field_mask('', 'search', id_only=True)
        headers = {
            'Content-Type': CONTENT_TYPE_JSON,
            'X-Goog-Api-Key': self.config.api_key,
            'X-Goog-FieldMask': field_mask
        }

        self._logger.debug("Text Search ID Only リクエスト",
                          query=text_query,
                          field_mask=field_mask,
                          url='https://places.googleapis.com/v1/places:searchText')

        try:
            response = requests.post(
                'https://places.googleapis.com/v1/places:searchText',
                headers=headers,
                json=request_body,
                timeout=self._timeout
            )

            self._logger.debug("API レスポンス",
                             status_code=response.status_code,
                             headers=dict(response.headers))

            response.raise_for_status()

            data = response.json()
            places = data.get('places', [])

            if places:
                place_id = places[0].get('id')
                self._logger.info("Place ID取得成功（無料SKU）",
                                query=text_query,
                                place_id=place_id)
                return place_id
            else:
                self._logger.warning("Place ID取得失敗: 結果なし", query=text_query)
                return None

        except requests.exceptions.HTTPError as e:
            error_detail = "Unknown error"
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                except:
                    error_detail = e.response.text

            self._logger.error(
                "Text Search (ID only) HTTP error",
                query=text_query,
                status_code=e.response.status_code if hasattr(e, 'response') else None,
                error=str(e),
                response_body=error_detail
            )
            return None
        except requests.exceptions.RequestException as e:
            self._logger.error(
                "Text Search (ID only) request failed",
                query=text_query,
                error=str(e)
            )
            return None

    def refresh_place_id(self, old_place_id: str) -> Optional[str]:
        """Place ID更新 - 無料SKU

        12ヶ月以上経過したPlace IDを更新します。
        Place Details Essentials (ID Refresh) SKUが適用され、**完全無料**です。

        Args:
            old_place_id: 更新対象のPlace ID

        Returns:
            新しいPlace ID（更新失敗時はNone）
        """
        self._wait_for_rate_limit()

        headers = {
            'Content-Type': CONTENT_TYPE_JSON,
            'X-Goog-Api-Key': self.config.api_key,
            'X-Goog-FieldMask': 'id'  # ID Refresh = 無料
        }

        try:
            response = requests.get(
                f'https://places.googleapis.com/v1/places/{old_place_id}',
                headers=headers,
                timeout=self._timeout
            )

            if response.status_code == 404:
                self._logger.warning("Place ID更新失敗: 場所が見つかりません",
                                   old_place_id=old_place_id)
                return None

            response.raise_for_status()
            data = response.json()
            new_place_id = data.get('id')

            if new_place_id:
                self._logger.info("Place ID更新成功（無料SKU）",
                                old_id=old_place_id,
                                new_id=new_place_id)
                return new_place_id
            else:
                self._logger.warning("Place ID更新失敗: IDなし", old_place_id=old_place_id)
                return None

        except requests.exceptions.HTTPError as e:
            error_detail = "Unknown error"
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                except:
                    error_detail = e.response.text

            self._logger.error(
                "Place ID Refresh HTTP error",
                old_place_id=old_place_id,
                status_code=e.response.status_code if hasattr(e, 'response') else None,
                error=str(e),
                response_body=error_detail
            )
            return None
        except requests.exceptions.RequestException as e:
            self._logger.error(
                "Place ID Refresh request failed",
                old_place_id=old_place_id,
                error=str(e)
            )
            return None

    def _get_place_details(self, place_id: str, category: str = 'restaurants') -> Optional[Dict]:
        """
        Place IDから詳細情報を取得
        """
        self._wait_for_rate_limit()

        headers = {
            'Content-Type': CONTENT_TYPE_JSON,
            'X-Goog-Api-Key': self.config.api_key,
            'X-Goog-FieldMask': self._build_field_mask(category, 'details')
        }

        try:
            response = requests.get(
                f'https://places.googleapis.com/v1/places/{place_id}',
                headers=headers,
                timeout=self._timeout
            )

            if response.status_code == 404:
                self._logger.warning("Place not found", place_id=place_id, status_code=404)
                return None

            response.raise_for_status()
            return response.json()

        except requests.exceptions.HTTPError as e:
            self._logger.error(
                "Place Details API HTTP error",
                place_id=place_id,
                status_code=e.response.status_code if hasattr(e, 'response') else None,
                response_text=e.response.text[:200] if hasattr(e, 'response') else None,
                error=str(e)
            )
            return None
        except requests.exceptions.RequestException as e:
            self._logger.error(
                "Place Details API request failed",
                place_id=place_id,
                error_type=type(e).__name__,
                error=str(e)
            )
            return None

    def search_places(self, query: str, location: Optional[str] = None) -> List[PlaceData]:
        """
        Search for places matching a query.

        Args:
            query: The search query
            location: Optional location constraint (ignored - using Sado bounds)

        Returns:
            List of matching places
        """
        try:
            status, places = self._search_text(query, 'restaurants')

            if status == 'OK':
                return [self._normalize_place_data(place) for place in places]
            elif status == 'ZERO_RESULTS':
                return []
            else:
                raise APIError(f"API returned status: {status}")

        except APIError:
            raise
        except Exception as e:
            self._logger.error("Failed to search places", query=query, error=str(e))
            raise APIError(f"Failed to search places: {e}")

    def _search_text(self, text_query: str, category: str,
                   included_type: Optional[str] = None) -> Tuple[str, List[Dict]]:
        """
        Text Search API を使用して場所を検索
        """
        self._wait_for_rate_limit()

        request_body = {
            "textQuery": text_query,
            "languageCode": self.config.language_code,
            "maxResultCount": self.config.max_results,
            "locationBias": self._build_location_bias()
        }

        if included_type:
            request_body["includedType"] = included_type

        headers = {
            'Content-Type': CONTENT_TYPE_JSON,
            'X-Goog-Api-Key': self.config.api_key,
            'X-Goog-FieldMask': self._build_field_mask(category, 'search')
        }

        try:
            response = requests.post(
                'https://places.googleapis.com/v1/places:searchText',
                headers=headers,
                json=request_body,
                timeout=self._timeout
            )
            response.raise_for_status()

            data = response.json()
            places = data.get('places', [])

            status = 'OK' if places else 'ZERO_RESULTS'
            return status, places

        except requests.exceptions.RequestException:
            return 'REQUEST_FAILED', []

    def is_healthy(self) -> bool:
        """
        Check if the API client is healthy and can make requests.

        Returns:
            True if healthy, False otherwise
        """
        try:
            stats = self.get_usage_stats()
            return stats.get('api_key_configured', False)
        except Exception as e:
            self._logger.warning("Health check failed", error=str(e))
            return False

    def _normalize_place_data(self, raw_data: Dict[str, Any]) -> PlaceData:
        """
        Normalize raw API response to PlaceData format.

        Args:
            raw_data: Raw API response data

        Returns:
            Normalized PlaceData
        """
        # Extract location data
        location = raw_data.get('location', {})
        latitude = location.get('latitude')
        longitude = location.get('longitude')

        # Extract display name
        display_name = raw_data.get('displayName', {})
        name = display_name.get('text', '') if isinstance(display_name, dict) else str(display_name)

        # Create normalized PlaceData
        place_data: PlaceData = {
            'id': raw_data.get('id', ''),
            'place_id': raw_data.get('id', ''),  # backward compatibility
            'displayName': display_name,
            'name': name,  # backward compatibility
            'formattedAddress': raw_data.get('formattedAddress', ''),
            'formatted_address': raw_data.get('formattedAddress', ''),  # backward compatibility
            'location': location,
            'latitude': latitude,
            'longitude': longitude,
            'types': raw_data.get('types', []),
            'rating': raw_data.get('rating'),
            'userRatingCount': raw_data.get('userRatingCount'),
            'user_ratings_total': raw_data.get('userRatingCount'),  # backward compatibility
            'businessStatus': raw_data.get('businessStatus'),
            'nationalPhoneNumber': raw_data.get('nationalPhoneNumber'),
            'formatted_phone_number': raw_data.get('nationalPhoneNumber'),  # backward compatibility
            'websiteUri': raw_data.get('websiteUri'),
            'website': raw_data.get('websiteUri'),  # backward compatibility
            'regularOpeningHours': raw_data.get('regularOpeningHours'),
            'opening_hours': raw_data.get('regularOpeningHours'),  # backward compatibility
            'priceLevel': raw_data.get('priceLevel'),
            'takeout': raw_data.get('takeout'),
            'delivery': raw_data.get('delivery'),
            'dineIn': raw_data.get('dineIn'),
            'servesBreakfast': raw_data.get('servesBreakfast'),
            'servesLunch': raw_data.get('servesLunch'),
            'servesDinner': raw_data.get('servesDinner'),
            'photos': raw_data.get('photos', []),
            'reviews': raw_data.get('reviews', [])
        }

        return place_data

    def search_by_cid(self, cid_url: str) -> Optional[PlaceData]:
        """
        Search for a place by CID URL.

        Args:
            cid_url: CID URL from Google Maps

        Returns:
            Place data or None if not found
        """
        try:
            status, place_data = self._get_place_details_from_cid(cid_url, 'restaurants')

            if status == 'OK' and place_data:
                return self._normalize_place_data(place_data)
            return None

        except Exception as e:
            self._logger.error("Failed to search by CID", cid_url=cid_url, error=str(e))
            raise APIError(f"Failed to search by CID: {e}")

    def _get_place_details_from_cid(self, cid_url: str, category: str) -> Tuple[str, Optional[Dict]]:
        """
        CID URLからPlace詳細を取得

        Note: CID URLを使用してText Searchを実行します。
        """
        try:
            cid = cid_url.split('cid=')[1].split('&')[0].split('#')[0].strip()
        except (IndexError, AttributeError):
            self._logger.error("Invalid CID URL format", cid_url=cid_url)
            return 'INVALID_CID', None

        # Text Search APIを使用してCIDから検索
        status, places = self._search_text(cid_url, category)

        if status == 'OK' and places:
            return 'OK', places[0]
        elif status == 'ZERO_RESULTS':
            return 'NOT_FOUND', None
        else:
            return 'REQUEST_FAILED', None

    def batch_search(self, queries: List[str]) -> Dict[str, List[PlaceData]]:
        """
        Perform batch search for multiple queries.

        Args:
            queries: List of search queries

        Returns:
            Dictionary mapping queries to their results
        """
        results = {}

        for query in queries:
            try:
                places = self.search_places(query)
                results[query] = places
            except Exception as e:
                self._logger.error("Batch search failed for query", query=query, error=str(e))
                results[query] = []

        return results

    def get_usage_stats(self) -> Dict[str, Any]:
        """Get API usage statistics"""
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
