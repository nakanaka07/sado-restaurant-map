#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新しいAPIクライアント対応版 - CID処理統合プロセッサー

Places API (New) v1を使用した最新版処理システム
Clean Architecture準拠・依存性注入対応版
Phase 2改善: 非同期処理・エラーハンドリング・パフォーマンス監視統合
"""

import os
import re
import time
import asyncio
from datetime import datetime
from typing import List, Dict, Optional, Tuple, Any
from urllib.parse import unquote, parse_qs, urlparse

# 新しいアーキテクチャ対応インポート
from core.domain.interfaces import APIClient, DataStorage, DataValidator, AuthenticationService
from core.domain.location_service import LocationService
from shared.types.core_types import PlaceData, ProcessingResult, CategoryType, QueryData
from shared.config import ScraperConfig
from shared.logger import get_logger
from shared.exceptions import APIError, ValidationError, ConfigurationError
from shared.utils.translators import translate_business_status, translate_types

# Phase 2改善: 新しい共有コンポーネント
from shared.error_handler import ErrorHandler, ErrorSeverity, ErrorCategory
from shared.performance_monitor import PerformanceMonitor
from shared.async_processor import AsyncProcessor, BatchConfig, ProcessingResult as AsyncProcessingResult


# 定数定義
class ProcessorConstants:
    """DataProcessor用の定数定義"""
    PLACE_ID_KEY = 'Place ID'


class DataProcessor:
    """新しいアーキテクチャ対応データプロセッサー - Phase 2改善版"""

    def __init__(
        self,
        api_client: APIClient,
        storage: DataStorage,
        validator: DataValidator,
        config: ScraperConfig,
        location_service: Optional[LocationService] = None,
        logger=None,
        enable_async: bool = True
    ):
        """依存性注入による初期化 - Phase 2改善版"""
        self._api_client = api_client
        self._storage = storage
        self._validator = validator
        self._config = config
        self._location_service = location_service or LocationService()
        self._logger = logger or get_logger(__name__)

        # Phase 2改善: 新しいコンポーネント
        self._error_handler = ErrorHandler("DataProcessor")
        self._performance_monitor = PerformanceMonitor("DataProcessor")

        # 非同期処理設定
        self._enable_async = enable_async
        self._async_processor = None
        if enable_async:
            batch_config = BatchConfig(
                batch_size=config.processing.batch_size if hasattr(config.processing, 'batch_size') else 10,
                max_concurrent=config.processing.max_concurrent if hasattr(config.processing, 'max_concurrent') else 5,
                retry_attempts=3,
                timeout=30.0
            )
            self._async_processor = AsyncProcessor("DataProcessor", batch_config)

        self.results: List[Dict[str, Any]] = []
        self.failed_queries: List[QueryData] = []
        self.raw_places_data: List[PlaceData] = []

        self._logger.info("データプロセッサー初期化完了",
                         api_client=type(api_client).__name__,
                         storage=type(storage).__name__,
                         async_enabled=enable_async)

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

    def process_all_queries(self, queries: List[QueryData], mode: str = 'standard') -> ProcessingResult:
        """全クエリを処理"""
        start_time = time.time()
        self._logger.info("クエリ処理開始", count=len(queries), mode=mode)

        # 処理開始時に生データ配列をクリア
        self.raw_places_data = []
        self.results = []
        self.failed_queries = []

        # モードに応じた処理フィルタリング
        filtered_queries = self._filter_queries_by_mode(queries, mode)
        self._logger.info("モード適用後のクエリ数",
                         original=len(queries),
                         filtered=len(filtered_queries),
                         mode=mode)

        for i, query_data in enumerate(filtered_queries, 1):
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
                    self._logger.info("クエリ処理成功", place_id=result.get(ProcessorConstants.PLACE_ID_KEY))
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

    async def process_all_queries_async(self, queries: List[QueryData], mode: str = 'standard') -> ProcessingResult:
        """非同期版全クエリ処理 - Phase 2改善"""
        if not self._enable_async or not self._async_processor:
            self._logger.warning("非同期処理が無効化されています。同期処理にフォールバック")
            return self.process_all_queries(queries, mode)

        start_time = time.time()

        with self._performance_monitor.measure_time("process_all_queries_async"):
            try:
                self._logger.info("非同期クエリ処理開始", count=len(queries), mode=mode)
                self._initialize_processing_state()

                # モードに応じた処理フィルタリング
                filtered_queries = self._filter_queries_by_mode(queries, mode)
                self._log_filtering_results(len(queries), len(filtered_queries), mode)

                # 非同期バッチ処理実行
                batch_result = await self._execute_async_batch_processing(filtered_queries)

                # 結果統合とメトリクス記録
                duration = time.time() - start_time
                return self._create_processing_result(batch_result, duration)

            except Exception as e:
                duration = time.time() - start_time
                return self._handle_async_processing_error(e, queries, mode, duration)

    def _initialize_processing_state(self) -> None:
        """処理状態の初期化"""
        self.raw_places_data = []
        self.results = []
        self.failed_queries = []

    def _log_filtering_results(self, original_count: int, filtered_count: int, mode: str) -> None:
        """フィルタリング結果のログ出力"""
        self._logger.info("モード適用後のクエリ数",
                         original=original_count,
                         filtered=filtered_count,
                         mode=mode)

    async def _execute_async_batch_processing(self, filtered_queries: List[QueryData]) -> Any:
        """非同期バッチ処理の実行"""
        async with self._async_processor:
            return await self._async_processor.process_batch_async(
                filtered_queries,
                self._process_single_query_async
            )

    def _integrate_batch_results(self, batch_result: Any) -> None:
        """バッチ処理結果の統合"""
        for result in batch_result.results:
            if result.success and result.data:
                self.results.append(result.data)
            else:
                self._handle_failed_result(result)

    def _handle_failed_result(self, result: Any) -> None:
        """失敗した結果の処理"""
        if result.error:
            self._error_handler.handle_error(
                result.error,
                ErrorSeverity.MEDIUM,
                ErrorCategory.PROCESSING
            )

        # クエリデータを復元して失敗リストに追加
        failed_query = result.metadata.get('query_data') if result.metadata else None
        if failed_query:
            self.failed_queries.append(failed_query)

    def _create_processing_result(self, batch_result: Any, duration: float) -> ProcessingResult:
        """処理結果の作成"""
        # バッチ結果統合
        self._integrate_batch_results(batch_result)

        # パフォーマンス統計記録
        self._performance_monitor.record_timing(
            "query_processing",
            duration,
            len(self.results) > 0
        )

        processing_result = ProcessingResult(
            success=len(self.results) > 0,
            category='restaurants',
            processed_count=len(self.results),
            error_count=len(self.failed_queries),
            duration=duration,
            errors=[str(q) for q in self.failed_queries]
        )

        self._logger.info("非同期クエリ処理完了",
                         success_count=len(self.results),
                         error_count=len(self.failed_queries),
                         duration=duration,
                         success_rate=batch_result.success_rate)

        return processing_result

    def _handle_async_processing_error(self, error: Exception, queries: List[QueryData], mode: str, _duration: float) -> ProcessingResult:
        """非同期処理エラーのハンドリング"""
        self._error_handler.handle_error(error, ErrorSeverity.HIGH, ErrorCategory.PROCESSING)

        # フォールバック処理
        self._logger.warning(f"非同期処理でエラー発生。同期処理にフォールバック: {str(error)}")
        return self.process_all_queries(queries, mode)

    async def _process_single_query_async(self, query_data: QueryData) -> Optional[Dict[str, Any]]:
        """単一クエリの非同期処理"""
        try:
            with self._performance_monitor.measure_time(f"process_query.{query_data['type']}"):
                result = None

                if query_data['type'] == 'cid_url':
                    result = await self._process_cid_url_async(query_data)
                elif query_data['type'] == 'maps_url':
                    result = await self._process_maps_url_async(query_data)
                elif query_data['type'] == 'store_name':
                    result = await self._process_store_name_async(query_data)

                if result:
                    self._logger.debug("非同期クエリ処理成功",
                                     place_id=result.get('Place ID'),
                                     store_name=query_data.get('store_name'))
                    return result
                else:
                    self._logger.warning("非同期クエリ処理失敗", query_data=query_data)
                    return None

        except Exception as e:
            self._logger.error("非同期クエリ処理エラー", error=str(e), query_data=query_data)
            raise  # 非同期プロセッサでハンドリングするため再発生

    async def _process_cid_url_async(self, query_data: QueryData) -> Optional[Dict[str, Any]]:
        """CID URLの非同期処理"""
        cid = query_data.get('cid')
        store_name = query_data.get('store_name', '')

        if cid:
            try:
                # API呼び出しを非同期実行
                loop = asyncio.get_event_loop()
                place_data = await loop.run_in_executor(
                    None,
                    self._api_client.get_place_details_by_cid,
                    cid
                )

                if place_data:
                    # 同期版と同じフォーマット処理
                    return self.format_result(place_data, query_data, store_name)

            except Exception as e:
                self._error_handler.handle_error(e, ErrorSeverity.MEDIUM, ErrorCategory.API)

        return None

    async def _process_maps_url_async(self, query_data: QueryData) -> Optional[Dict[str, Any]]:
        """Maps URLの非同期処理"""
        # 同期版と同じロジックを非同期実行
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.process_maps_url, query_data)

    async def _process_store_name_async(self, query_data: QueryData) -> Optional[Dict[str, Any]]:
        """店舗名の非同期処理"""
        store_name = query_data.get('store_name', '')

        if store_name:
            try:
                # API呼び出しを非同期実行
                loop = asyncio.get_event_loop()
                search_results = await loop.run_in_executor(
                    None,
                    self._api_client.search_places,
                    store_name
                )

                if search_results:
                    # 最初の結果を使用
                    place_data = search_results[0]
                    return self.format_result(place_data, query_data, store_name)

            except Exception as e:
                self._error_handler.handle_error(e, ErrorSeverity.MEDIUM, ErrorCategory.API)

        return None

    def get_processing_statistics(self) -> Dict[str, Any]:
        """処理統計を取得 - Phase 2改善"""
        stats = {
            "basic_stats": {
                "total_results": len(self.results),
                "failed_queries": len(self.failed_queries),
                "success_rate": len(self.results) / (len(self.results) + len(self.failed_queries)) if (len(self.results) + len(self.failed_queries)) > 0 else 0
            },
            "performance_stats": self._performance_monitor.get_performance_stats(),
            "error_stats": self._error_handler.get_error_stats(),
            "system_health": self._performance_monitor.get_system_health()
        }

        if self._async_processor:
            stats["async_stats"] = self._async_processor.get_processing_stats()

        return stats

    def _filter_queries_by_mode(self, queries: List[QueryData], mode: str) -> List[QueryData]:
        """モードに応じてクエリをフィルタリング"""
        if mode == 'quick':
            # CID URLのみを処理（最高速）
            return [q for q in queries if q.get('type') == 'cid_url']
        elif mode == 'standard':
            # CID URL + 店舗名のみ（標準速度・精度）
            return [q for q in queries if q.get('type') in ['cid_url', 'store_name']]
        elif mode == 'comprehensive':
            # 全データを処理（最高精度）
            return queries
        else:
            # デフォルトは標準モード
            return [q for q in queries if q.get('type') in ['cid_url', 'store_name']]

    def process_cid_url(self, query_data: QueryData) -> Optional[Dict[str, Any]]:
        """CID URLから直接店舗情報を取得"""
        cid = query_data.get('cid')
        store_name = query_data.get('store_name', '')

        if cid:
            try:
                # CIDから直接Place詳細を取得
                place_data = self._api_client.fetch_place_by_cid(cid)
                if place_data:
                    # 生データを保存
                    self.raw_places_data.append(place_data)
                    return self.format_result(place_data, query_data, 'CID直接取得')
            except Exception as e:
                self._logger.warning("CID直接取得失敗", cid=cid, error=str(e))

        # CID取得失敗時は店舗名検索にフォールバック
        if store_name:
            return self.search_by_name(store_name, query_data, 'CID URL検索（フォールバック）')

        return None

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
        # 位置情報を取得
        latitude = place.get('location', {}).get('latitude')
        longitude = place.get('location', {}).get('longitude')
        address = place.get('formattedAddress', '')

        # LocationServiceで統一的に位置分析
        location_info = self._location_service.analyze_location(
            latitude=latitude,
            longitude=longitude,
            address=address
        )

        result = {
            ProcessorConstants.PLACE_ID_KEY: place.get('id', ''),
            '店舗名': place.get('displayName', {}).get('text', ''),
            '住所': address,
            '緯度': latitude or '',
            '経度': longitude or '',
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
            '地区': location_info.district,
            'is_in_sado': location_info.is_in_sado,
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
        """佐渡市内・市外データを分離 - LocationService統合版"""
        sado_results: List[Dict[str, Any]] = []
        outside_results: List[Dict[str, Any]] = []

        for result in results:
            if self._is_sado_location(result):
                sado_results.append(result)
            else:
                outside_results.append(result)

        return sado_results, outside_results

    def _is_sado_location(self, result: Dict[str, Any]) -> bool:
        """単一レコードの佐渡島判定処理"""
        # 既に is_in_sado フラグが設定されている場合はそれを使用
        if 'is_in_sado' in result:
            return result['is_in_sado']

        # is_in_sado フラグがない場合はLocationServiceで再判定
        try:
            location_info = self._analyze_location_for_result(result)

            # 結果を更新
            result['地区'] = location_info.district
            result['is_in_sado'] = location_info.is_in_sado

            return location_info.is_in_sado

        except (ValueError, TypeError) as e:
            self._handle_location_error(result, e)
            return False

    def _analyze_location_for_result(self, result: Dict[str, Any]):
        """レコードの位置情報を分析"""
        lat = float(result.get('緯度', 0)) if result.get('緯度') else None
        lng = float(result.get('経度', 0)) if result.get('経度') else None
        address = result.get('住所', '')

        return self._location_service.analyze_location(
            latitude=lat,
            longitude=lng,
            address=address
        )

    def _handle_location_error(self, result: Dict[str, Any], error: Exception) -> None:
        """位置分析エラーの処理"""
        self._logger.warning("座標変換エラー",
                           lat=result.get('緯度'),
                           lng=result.get('経度'),
                           error=str(error))
        result['地区'] = '市外'
        result['is_in_sado'] = False

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
            # データ検証の実行
            validation_results = self._validate_data_for_save(data, sheet_name)

            # 有効なデータがない場合の処理
            if not validation_results:
                self._logger.warning("検証を通過したデータがありません", sheet=sheet_name)
                return False

            # ストレージに保存
            return self._save_validated_data(validation_results, sheet_name)

        except Exception as e:
            self._logger.error("データ保存処理エラー", error=str(e), sheet=sheet_name)
            return False

    def _validate_data_for_save(self, data: List[Dict[str, Any]], sheet_name: str) -> List[Any]:
        """保存用データの検証を実行"""
        # 検証用データの準備（生データがあれば優先使用）
        data_to_validate = self.raw_places_data if self.raw_places_data else data

        validation_results = []
        for i, item in enumerate(data_to_validate):
            validated_item = self._validate_single_item(item, i, sheet_name)
            if validated_item:
                validation_results.append(validated_item)

        self._logger.info("データ検証完了",
                        valid_count=len(validation_results),
                        total_count=len(data_to_validate))

        return validation_results

    def _validate_single_item(self, item: Any, index: int, sheet_name: str) -> Optional[Any]:
        """単一アイテムの検証"""
        try:
            # 型安全性を確保：辞書形式の確認
            if not isinstance(item, dict):
                self._logger.warning("無効なデータ型をスキップ",
                                   index=index,
                                   type=type(item).__name__)
                return None

            result = self._validator.validate(item, sheet_name)
            if result and getattr(result, 'is_valid', True):
                return result

        except Exception as e:
            self._logger.warning("データ検証エラー",
                               index=index,
                               error=str(e),
                               item_keys=list(item.keys()) if isinstance(item, dict) else "non-dict")

        return None

    def _save_validated_data(self, validation_results: List[Any], sheet_name: str) -> bool:
        """検証済みデータの保存"""
        success = self._storage.save(validation_results, sheet_name)

        if success:
            self._logger.info("データ保存成功", sheet=sheet_name, count=len(validation_results))
        else:
            self._logger.error("データ保存失敗", sheet=sheet_name)

        return success
