#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新しいAPIクライアント対応版 - CID処理統合プロセッサー

Places API (New) v1を使用した最新版処理システム
Clean Architecture準拠・依存性注入対応版
"""

import os
import re
import time
from datetime import datetime
from typing import List, Dict, Optional, Tuple, Any
from urllib.parse import unquote, parse_qs, urlparse

# 新しいアーキテクチャ対応インポート
from core.domain.interfaces import APIClient, DataStorage, DataValidator, AuthenticationService
from shared.types.core_types import PlaceData, ProcessingResult, CategoryType, QueryData
from shared.config import ScraperConfig
from shared.logger import get_logger
from shared.exceptions import APIError, ValidationError, ConfigurationError
from shared.utils.translators import translate_business_status, translate_types

class DataProcessor:
    """新しいアーキテクチャ対応データプロセッサー"""

    def __init__(
        self,
        api_client: APIClient,
        storage: DataStorage,
        validator: DataValidator,
        config: ScraperConfig,
        logger=None
    ):
        """依存性注入による初期化"""
        self._api_client = api_client
        self._storage = storage
        self._validator = validator
        self._config = config
        self._logger = logger or get_logger(__name__)

        self.results: List[Dict[str, Any]] = []
        self.failed_queries: List[QueryData] = []
        self.raw_places_data: List[PlaceData] = []

        self._logger.info("データプロセッサー初期化完了",
                         api_client=type(api_client).__name__,
                         storage=type(storage).__name__)

    def parse_query_file(self, file_path: str) -> List[QueryData]:
        """クエリファイルを解析"""
        queries: List[QueryData] = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            for line_num, line in enumerate(lines, 1):
                line = line.strip()

                # コメント行や空行をスキップ
                if not line or line.startswith('#'):
                    continue

                query_data: QueryData = {
                    'line_number': line_num,
                    'original_line': line,
                    'type': 'store_name',  # デフォルト値
                    'store_name': ''
                }

                # CID URL形式の判定
                if 'maps.google.com/place?cid=' in line:
                    # CID URLを解析
                    parts = line.split('#', 1)
                    url = parts[0].strip()
                    store_name = parts[1].strip() if len(parts) > 1 else ''

                    # CIDを抽出
                    cid_match = re.search(r'cid=(\d+)', url)
                    if cid_match:
                        query_data.update({
                            'type': 'cid_url',
                            'cid': cid_match.group(1),
                            'url': url,
                            'store_name': store_name
                        })

                # Google Maps URL形式の判定
                elif 'www.google.com/maps/' in line:
                    query_data.update({
                        'type': 'maps_url',
                        'url': line,
                        'store_name': self.extract_name_from_url(line)
                    })

                # 店舗名のみの判定
                else:
                    query_data.update({
                        'type': 'store_name',
                        'store_name': line
                    })

                queries.append(query_data)

            self._logger.info("クエリファイル解析完了", count=len(queries), file_path=file_path)
            return queries

        except Exception as e:
            self._logger.error("ファイル読み込みエラー", error=str(e), file_path=file_path)
            raise ValidationError(f"ファイル読み込みエラー: {e}", "file_path", file_path)

    def extract_name_from_url(self, url: str) -> str:
        """URLから店舗名を抽出"""
        try:
            # URLデコード
            decoded_url = unquote(url)

            # 店舗名を抽出するパターン
            patterns = [
                r'/place/([^/@]+)/@',
                r'/place/([^/]+)/',
                r'place/([^/@]+)'
            ]

            for pattern in patterns:
                match = re.search(pattern, decoded_url)
                if match:
                    name = match.group(1).replace('+', ' ')
                    return name

            return ''

        except Exception:
            return ''

    def process_all_queries(self, queries: List[QueryData]) -> ProcessingResult:
        """全クエリを処理"""
        start_time = time.time()
        self._logger.info("クエリ処理開始", count=len(queries))

        # 処理開始時に生データ配列をクリア
        self.raw_places_data = []
        self.results = []
        self.failed_queries = []

        for i, query_data in enumerate(queries, 1):
            self._logger.info("クエリ処理中",
                            current=i,
                            total=len(queries),
                            store_name=query_data.get('store_name', 'Unknown'))

            try:
                result = None

                if query_data['type'] == 'cid_url':
                    result = self.process_cid_url(query_data)
                elif query_data['type'] == 'maps_url':
                    result = self.process_maps_url(query_data)
                elif query_data['type'] == 'store_name':
                    result = self.process_store_name(query_data)

                if result:
                    self.results.append(result)
                    self._logger.info("クエリ処理成功", place_id=result.get('Place ID'))
                else:
                    self.failed_queries.append(query_data)
                    self._logger.warning("クエリ処理失敗", query_data=query_data)

                # API制限対応
                time.sleep(self._config.processing.api_delay)

            except Exception as e:
                self._logger.error("クエリ処理エラー", error=str(e), query_data=query_data)
                self.failed_queries.append(query_data)

        duration = time.time() - start_time
        result = ProcessingResult(
            success=len(self.results) > 0,
            category='restaurants',  # デフォルト
            processed_count=len(self.results),
            error_count=len(self.failed_queries),
            duration=duration,
            errors=[str(q) for q in self.failed_queries]
        )

        self._logger.info("クエリ処理完了",
                         success_count=len(self.results),
                         error_count=len(self.failed_queries),
                         duration=duration)
        return result

    def process_cid_url(self, query_data: QueryData) -> Optional[Dict[str, Any]]:
        """CID URLから店舗名検索"""
        store_name = query_data.get('store_name', '')
        return self.search_by_name(store_name, query_data, 'CID URL検索')

    def process_maps_url(self, query_data: QueryData) -> Optional[Dict[str, Any]]:
        """Google Maps URLから検索"""
        store_name = query_data.get('store_name', '')
        return self.search_by_name(store_name, query_data, 'Maps URL検索')

    def process_store_name(self, query_data: QueryData) -> Optional[Dict[str, Any]]:
        """店舗名検索"""
        store_name = query_data.get('store_name', '')
        return self.search_by_name(store_name, query_data, '店舗名検索')

    def search_by_name(self, store_name: str, query_data: QueryData, method: str) -> Optional[Dict[str, Any]]:
        """店舗名で検索"""
        if not store_name:
            return None

        # 検索クエリの最適化
        search_queries = [
            f"{store_name} 佐渡",
            f"{store_name} 佐渡市",
            f"{store_name} 新潟県佐渡市",
            store_name
        ]

        for query in search_queries:
            try:
                # 新しいAPIクライアントインターフェースを使用
                places = self._api_client.search_places(query)

                if places:
                    # 最も関連性の高い結果を選択
                    best_place = self.select_best_match(places, store_name)
                    if best_place:
                        # 生データを保存
                        self.raw_places_data.append(best_place)
                        return self.format_result(best_place, query_data, method)

                time.sleep(self._config.processing.api_delay)

            except APIError as e:
                self._logger.error("API検索エラー", query=query, error=str(e))
                continue
            except Exception as e:
                self._logger.error("予期しない検索エラー", query=query, error=str(e))
                continue

        return None

    def select_best_match(self, places: List[PlaceData], _target_name: str) -> Optional[PlaceData]:
        """最適な結果を選択"""
        # 佐渡地域内の結果を優先
        sado_places: List[PlaceData] = []
        other_places: List[PlaceData] = []

        for place in places:
            address = place.get('formattedAddress', '')
            if '佐渡' in address:
                sado_places.append(place)
            else:
                other_places.append(place)

        # 佐渡地域内の結果があれば優先
        if sado_places:
            return sado_places[0]
        elif other_places:
            return other_places[0]

        return None

    def format_result(self, place: PlaceData, _query_data: QueryData, method: str) -> Dict[str, Any]:
        """結果をフォーマット"""
        result = {
            'Place ID': place.get('id', ''),
            '店舗名': place.get('displayName', {}).get('text', ''),
            '住所': place.get('formattedAddress', ''),
            '緯度': place.get('location', {}).get('latitude', ''),
            '経度': place.get('location', {}).get('longitude', ''),
            '評価': place.get('rating', ''),
            'レビュー数': place.get('userRatingCount', ''),
            '営業状況': translate_business_status(place.get('businessStatus', '')),
            '営業時間': self.format_opening_hours(place.get('regularOpeningHours')),
            '電話番号': place.get('nationalPhoneNumber', ''),
            'ウェブサイト': place.get('websiteUri', ''),
            '価格帯': self.translate_price_level(place.get('priceLevel')),
            '店舗タイプ': ', '.join(translate_types(place.get('types', []))),
            'テイクアウト': '可' if place.get('takeout') else '不可',
            'デリバリー': '可' if place.get('delivery') else '不可',
            '店内飲食': '可' if place.get('dineIn') else '不可',
            '朝食提供': '可' if place.get('servesBreakfast') else '不可',
            '昼食提供': '可' if place.get('servesLunch') else '不可',
            '夕食提供': '可' if place.get('servesDinner') else '不可',
            '地区': '未分類',  # 後で location_separator で処理
            '取得方法': method,
            '更新日時': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        return result

    def format_opening_hours(self, opening_hours: Optional[Dict[str, Any]]) -> str:
        """営業時間をフォーマット"""
        if not opening_hours or 'weekdayDescriptions' not in opening_hours:
            return ''

        descriptions = opening_hours.get('weekdayDescriptions', [])
        return '; '.join(descriptions)

    def translate_price_level(self, price_level: Optional[str]) -> str:
        """価格帯を翻訳"""
        price_map = {
            'PRICE_LEVEL_INEXPENSIVE': '手頃',
            'PRICE_LEVEL_MODERATE': '普通',
            'PRICE_LEVEL_EXPENSIVE': '高価',
            'PRICE_LEVEL_VERY_EXPENSIVE': '非常に高価'
        }
        return price_map.get(price_level, '') if price_level else ''

    def separate_sado_data(self, results: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """佐渡市内・市外データを分離"""
        # 佐渡島の境界
        SADO_BOUNDS = {
            'north': 38.39,
            'south': 37.74,
            'east': 138.62,
            'west': 137.85
        }

        sado_results: List[Dict[str, Any]] = []
        outside_results: List[Dict[str, Any]] = []

        for result in results:
            try:
                lat = float(result.get('緯度', 0))
                lng = float(result.get('経度', 0))

                # 佐渡島内判定
                is_in_sado = (SADO_BOUNDS['south'] <= lat <= SADO_BOUNDS['north'] and
                             SADO_BOUNDS['west'] <= lng <= SADO_BOUNDS['east'])

                if is_in_sado:
                    # 地区分類を追加
                    result['地区'] = self.classify_district(lat, lng, result.get('住所', ''))
                    result['is_in_sado'] = True  # フラグを明示的に設定
                    sado_results.append(result)
                else:
                    result['地区'] = '市外'
                    result['is_in_sado'] = False  # フラグを明示的に設定
                    outside_results.append(result)

            except (ValueError, TypeError) as e:
                # 座標が不正な場合は市外として扱う
                self._logger.warning("座標変換エラー",
                                   lat=result.get('緯度'),
                                   lng=result.get('経度'),
                                   error=str(e))
                result['地区'] = '市外'
                result['is_in_sado'] = False  # フラグを明示的に設定
                outside_results.append(result)

        return sado_results, outside_results

    def classify_district(self, _lat: float, _lng: float, address: str) -> str:
        """地区分類"""
        # 簡易的な地区分類（住所ベース）
        district_keywords = [
            '両津', '相川', '佐和田', '金井', '新穂',
            '畑野', '真野', '小木', '羽茂', '赤泊'
        ]

        for district in district_keywords:
            if district in address:
                return district

        return '佐渡市内'

    def save_to_spreadsheet(self, sheet_name: str, separate_location: bool = True) -> bool:
        """スプレッドシートに保存"""
        if not self.results:
            self._logger.warning("保存するデータがありません")
            return False

        try:
            if separate_location:
                return self._save_with_separation(sheet_name)
            else:
                return self._save_without_separation(sheet_name)

        except Exception as e:
            self._logger.error("スプレッドシート保存エラー", error=str(e))
            return False

    def _save_with_separation(self, sheet_name: str) -> bool:
        """地区分離ありでデータを保存"""
        self._logger.info("佐渡市内・市外データ分離を実行中")
        sado_results, outside_results = self.separate_sado_data(self.results)

        # メインシート（佐渡島内）保存
        self._save_sado_data(sado_results, sheet_name)

        # 佐渡市外シート保存
        self._save_outside_data(outside_results, sheet_name)

        return True

    def _save_without_separation(self, sheet_name: str) -> bool:
        """地区分離なしでデータを保存"""
        success = self._storage.save(self.results, sheet_name)
        if success:
            self._logger.info("データ保存完了",
                            sheet=sheet_name,
                            count=len(self.results))
        return success

    def _save_sado_data(self, sado_results: List[Dict[str, Any]], sheet_name: str) -> None:
        """佐渡島内データを保存"""
        if sado_results:
            success = self._storage.save(sado_results, sheet_name)
            if success:
                self._logger.info("佐渡島内データ保存完了",
                                sheet=sheet_name,
                                count=len(sado_results))

    def _save_outside_data(self, outside_results: List[Dict[str, Any]], sheet_name: str) -> None:
        """佐渡市外データを保存"""
        if outside_results:
            outside_sheet_name = f"{sheet_name}_佐渡市外"
            success = self._storage.save(outside_results, outside_sheet_name)
            if success:
                self._logger.info("佐渡市外データ保存完了",
                                sheet=outside_sheet_name,
                                count=len(outside_results))

    def save_data_to_sheet(self, data: List[Dict[str, Any]], sheet_name: str) -> bool:
        """データをシートに保存（新アーキテクチャ対応版）"""
        if not data:
            self._logger.warning("保存するデータがありません", sheet=sheet_name)
            return False

        try:
            # データ検証プロセス
            validation_results = []
            for item in self.raw_places_data or data:
                try:
                    result = self._validator.validate(item, sheet_name)
                    if result and getattr(result, 'is_valid', True):
                        validation_results.append(result)
                except Exception as e:
                    self._logger.warning("データ検証エラー", error=str(e), item=item)

            self._logger.info("データ検証完了",
                            valid_count=len(validation_results),
                            total_count=len(self.raw_places_data or data))

            # ストレージに保存
            success = self._storage.save(validation_results, sheet_name)

            if success:
                self._logger.info("データ保存成功", sheet=sheet_name, count=len(validation_results))
                return True
            else:
                self._logger.error("データ保存失敗", sheet=sheet_name)
                return False

        except Exception as e:
            self._logger.error("データ保存処理エラー", error=str(e), sheet=sheet_name)
            return False
