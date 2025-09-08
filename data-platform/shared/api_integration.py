"""
API Integration Module

Phase 3-Full分散タスクシステムと既存Places API Adapterの統合モジュール
"""

from typing import List, Dict, Any, Optional, Tuple
import asyncio
import logging
import sys
import os
from datetime import datetime
from dataclasses import dataclass, asdict

# パス設定
current_dir = os.path.dirname(os.path.abspath(__file__))
scraper_dir = os.path.dirname(current_dir)
sys.path.append(scraper_dir)

try:
    from infrastructure.external.places_api_adapter import PlacesAPIAdapter
except ImportError:
    # インポートできない場合のフォールバック
    PlacesAPIAdapter = None

from .cache_service import CacheService
from .exceptions import APIError, ProcessingError, CacheError
from .types.core_types import PlaceData, ProcessingResult, BatchCacheResult


@dataclass
class APIIntegrationConfig:
    """API統合設定"""
    api_key: str
    use_cache: bool = True
    cache_ttl: int = 86400  # 24時間
    batch_size: int = 10
    request_delay: float = 1.0
    max_retries: int = 3
    timeout: int = 30


class PlacesAPIIntegration:
    """Places API統合サービス"""

    def __init__(
        self,
        config: APIIntegrationConfig,
        cache_service: Optional[CacheService] = None
    ):
        self.config = config
        self.cache_service = cache_service
        self.logger = logging.getLogger(__name__)

        # Places API Adapterを初期化
        if PlacesAPIAdapter is None:
            self.logger.warning("PlacesAPIAdapterが利用できません。モックモードで動作します。")
            self.api_adapter = None
        else:
            try:
                self.api_adapter = PlacesAPIAdapter(
                    api_key=config.api_key,
                    delay=config.request_delay,
                    max_retries=config.max_retries,
                    timeout=config.timeout
                )
            except Exception as e:
                self.logger.warning(f"PlacesAPIAdapter初期化エラー: {e}、モックモードで動作します。")
                self.api_adapter = None

    async def fetch_place_details_with_cache(
        self,
        place_id: str
    ) -> Optional[PlaceData]:
        """キャッシュを使用したPlace詳細取得"""

        try:
            # キャッシュ確認
            if self.config.use_cache and self.cache_service:
                cached_data = await self._get_from_cache(place_id)
                if cached_data:
                    self.logger.debug(f"キャッシュヒット: {place_id}")
                    return cached_data

            # API呼び出し
            self.logger.debug(f"API呼び出し: {place_id}")
            place_data = await self._fetch_from_api(place_id)

            # キャッシュに保存
            if place_data and self.config.use_cache and self.cache_service:
                await self._save_to_cache(place_id, place_data)

            return place_data

        except Exception as e:
            self.logger.error(f"Place詳細取得エラー: {place_id}, {e}")
            raise APIError(f"Failed to fetch place details: {e}")

    async def batch_fetch_places(
        self,
        place_ids: List[str]
    ) -> Tuple[List[PlaceData], List[str], Dict[str, Any]]:
        """バッチでのPlace詳細取得"""

        results = []
        errors = []
        stats = {
            "total_requested": len(place_ids),
            "cache_hits": 0,
            "api_calls": 0,
            "errors": 0,
            "start_time": datetime.now()
        }

        try:
            # バッチ処理
            for place_id in place_ids:
                try:
                    # キャッシュ確認
                    cached_data = None
                    if self.config.use_cache and self.cache_service:
                        cached_data = await self._get_from_cache(place_id)
                        if cached_data:
                            results.append(cached_data)
                            stats["cache_hits"] += 1
                            continue

                    # API呼び出し
                    place_data = await self._fetch_from_api(place_id)
                    if place_data:
                        results.append(place_data)
                        stats["api_calls"] += 1

                        # キャッシュに保存
                        if self.config.use_cache and self.cache_service:
                            await self._save_to_cache(place_id, place_data)
                    else:
                        errors.append(place_id)
                        stats["errors"] += 1

                except Exception as e:
                    self.logger.warning(f"Place処理エラー: {place_id}, {e}")
                    errors.append(place_id)
                    stats["errors"] += 1

            # 統計計算
            stats["end_time"] = datetime.now()
            stats["processing_time"] = (stats["end_time"] - stats["start_time"]).total_seconds()
            stats["success_rate"] = len(results) / stats["total_requested"] * 100 if stats["total_requested"] > 0 else 0
            stats["cache_hit_rate"] = stats["cache_hits"] / (stats["cache_hits"] + stats["api_calls"]) * 100 if (stats["cache_hits"] + stats["api_calls"]) > 0 else 0

            self.logger.info(f"バッチ処理完了: {len(results)}件成功, {len(errors)}件エラー, キャッシュヒット率{stats['cache_hit_rate']:.1f}%")

            return results, errors, stats

        except Exception as e:
            self.logger.error(f"バッチ処理エラー: {e}")
            raise ProcessingError(f"Batch processing failed: {e}")

    async def fetch_place_by_cid_with_cache(
        self,
        cid: str
    ) -> Optional[PlaceData]:
        """CIDを使用したキャッシュ付きPlace詳細取得"""

        try:
            # CIDベースのキャッシュキー
            cache_key = f"cid:{cid}"

            # キャッシュ確認
            if self.config.use_cache and self.cache_service:
                cached_data = await self._get_from_cache(cache_key)
                if cached_data:
                    self.logger.debug(f"CIDキャッシュヒット: {cid}")
                    return cached_data

            # API呼び出し（既存のfetch_place_by_cidメソッドを使用）
            self.logger.debug(f"CID API呼び出し: {cid}")
            place_data = await self._fetch_by_cid_from_api(cid)

            # キャッシュに保存
            if place_data and self.config.use_cache and self.cache_service:
                await self._save_to_cache(cache_key, place_data)

            return place_data

        except Exception as e:
            self.logger.error(f"CID Place詳細取得エラー: {cid}, {e}")
            raise APIError(f"Failed to fetch place by CID: {e}")

    async def _get_from_cache(self, key: str) -> Optional[PlaceData]:
        """キャッシュからデータ取得"""
        try:
            if not self.cache_service:
                return None

            cached_result = await self.cache_service.get(key)
            if cached_result.hit and cached_result.data:
                # PlaceDataオブジェクトに変換
                if isinstance(cached_result.data, dict):
                    return PlaceData(**cached_result.data)
                return cached_result.data

            return None

        except Exception as e:
            self.logger.warning(f"キャッシュ取得エラー: {key}, {e}")
            return None

    async def _save_to_cache(self, key: str, data: PlaceData) -> None:
        """キャッシュにデータ保存"""
        try:
            if not self.cache_service:
                return

            # PlaceDataを辞書に変換
            data_dict = asdict(data) if hasattr(data, '__dict__') else data.__dict__

            await self.cache_service.set(
                key=key,
                value=data_dict,
                ttl=self.config.cache_ttl
            )

        except Exception as e:
            self.logger.warning(f"キャッシュ保存エラー: {key}, {e}")

    async def _fetch_from_api(self, place_id: str) -> Optional[PlaceData]:
        """APIからPlace詳細取得（非同期ラッパー）"""
        try:
            if self.api_adapter is None:
                # モックデータを返す
                self.logger.debug(f"モックAPI呼び出し: {place_id}")
                return self._create_mock_place_data(place_id)

            # 同期のAPIアダプターを非同期で呼び出し
            loop = asyncio.get_event_loop()
            place_data = await loop.run_in_executor(
                None,
                self.api_adapter.fetch_place_details,
                place_id
            )
            return place_data

        except Exception as e:
            self.logger.error(f"API呼び出しエラー: {place_id}, {e}")
            return None

    async def _fetch_by_cid_from_api(self, cid: str) -> Optional[PlaceData]:
        """APIからCIDでPlace詳細取得（非同期ラッパー）"""
        try:
            if self.api_adapter is None:
                # モックデータを返す
                self.logger.debug(f"モックCID API呼び出し: {cid}")
                return self._create_mock_place_data(f"cid_{cid}")

            # 同期のAPIアダプターを非同期で呼び出し
            loop = asyncio.get_event_loop()
            place_data = await loop.run_in_executor(
                None,
                self.api_adapter.fetch_place_by_cid,
                cid
            )
            return place_data

        except Exception as e:
            self.logger.error(f"CID API呼び出しエラー: {cid}, {e}")
            return None

    def _create_mock_place_data(self, place_id: str) -> PlaceData:
        """モックPlaceDataを作成"""
        try:
            # PlaceDataクラスのインスタンスを作成
            from .types.core_types import PlaceData

            return PlaceData(
                place_id=place_id,
                display_name=f"モック店舗 {place_id}",
                formatted_address=f"佐渡市モック地区{place_id}",
                rating=4.0 + (hash(place_id) % 10) * 0.1,
                types=["restaurant", "food", "establishment"],
                business_status="OPERATIONAL"
            )
        except Exception as e:
            self.logger.error(f"モックデータ作成エラー: {e}")
            # 辞書として返す
            return {
                "place_id": place_id,
                "display_name": f"モック店舗 {place_id}",
                "formatted_address": f"佐渡市モック地区{place_id}",
                "rating": 4.0,
                "types": ["restaurant"]
            }

    def get_stats(self) -> Dict[str, Any]:
        """統計情報取得"""
        return {
            "config": asdict(self.config),
            "cache_available": self.cache_service is not None,
            "api_adapter_available": self.api_adapter is not None,
            "api_adapter_status": "initialized" if self.api_adapter else "mock_mode"
        }


# ファクトリ関数
def create_api_integration(
    api_key: str,
    cache_service: Optional[CacheService] = None,
    **config_overrides
) -> PlacesAPIIntegration:
    """API統合サービスのファクトリ関数"""

    config = APIIntegrationConfig(
        api_key=api_key,
        **config_overrides
    )

    return PlacesAPIIntegration(
        config=config,
        cache_service=cache_service
    )


# エクスポート
__all__ = [
    'APIIntegrationConfig',
    'PlacesAPIIntegration',
    'create_api_integration'
]
