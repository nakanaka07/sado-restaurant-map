"""
Redis Cache Service Implementation for Phase 3-Full

High-performance distributed caching system for Google Places API data
with intelligent TTL management and cache optimization.
"""

from typing import Optional, Any, Dict, List, Union
import redis.asyncio as redis
import json
import pickle
import hashlib
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from .exceptions import CacheError, CacheConnectionError
from .types.core_types import PlaceData, SearchQuery


@dataclass
class CacheStats:
    """キャッシュ統計情報"""
    hit_rate: float
    memory_usage: str
    connected_clients: int
    total_commands: int
    evicted_keys: int
    expired_keys: int


@dataclass
class CacheConfig:
    """キャッシュ設定"""
    redis_nodes: List[str]
    default_ttl: int = 86400  # 24時間
    search_ttl: int = 3600    # 1時間
    max_retries: int = 3
    retry_delay: float = 1.0
    compression_enabled: bool = True


class CacheService:
    """高性能分散キャッシュサービス

    Features:
    - 分散Redis Cluster対応
    - インテリジェントTTL管理
    - データ圧縮・最適化
    - 統計・監視機能
    - 障害時自動リトライ
    """

    def __init__(self, config: CacheConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.cluster: Optional[redis.RedisCluster] = None
        self._connection_pool = None
        self._in_memory_cache = {}  # フォールバック用インメモリキャッシュ
        self._redis_available = False

    async def initialize(self) -> bool:
        """Redis Cluster接続初期化"""
        try:
            if not self.config.redis_nodes:
                self.logger.info("Redis設定なし - インメモリキャッシュを使用")
                self._redis_available = False
                return True

            startup_nodes = [
                {"host": node.split(':')[0], "port": int(node.split(':')[1])}
                for node in self.config.redis_nodes
            ]

            self.cluster = redis.RedisCluster(
                startup_nodes=startup_nodes,
                decode_responses=False,
                skip_full_coverage_check=True,
                max_connections_per_node=20,
                retry_on_cluster_down=True,
                health_check_interval=30
            )

            # 接続テスト
            await self.cluster.ping()
            self.logger.info(f"Redis Cluster 接続成功: {len(startup_nodes)} nodes")
            self._redis_available = True
            return True

        except Exception as e:
            self.logger.warning(f"Redis Cluster 接続失敗 - インメモリキャッシュを使用: {e}")
            self._redis_available = False
            return True  # インメモリキャッシュで続行

    async def close(self):
        """接続クローズ"""
        if self.cluster:
            await self.cluster.aclose()
            self.logger.info("Redis Cluster 接続クローズ")

    # 汎用キャッシュメソッド
    async def get(self, key: str) -> Optional[Any]:
        """汎用キャッシュ取得"""
        try:
            if self._redis_available and self.cluster:
                cached_data = await self._get_with_retry(key)
                if cached_data:
                    data = self._deserialize(cached_data)
                    self.logger.debug(f"Cache HIT (Redis): {key}")
                    return data
                else:
                    self.logger.debug(f"Cache MISS (Redis): {key}")
                    return None
            else:
                # インメモリキャッシュを使用
                if key in self._in_memory_cache:
                    self.logger.debug(f"Cache HIT (Memory): {key}")
                    return self._in_memory_cache[key]
                else:
                    self.logger.debug(f"Cache MISS (Memory): {key}")
                    return None
        except Exception as e:
            self.logger.error(f"Cache 取得エラー: {key}, {e}")
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """汎用キャッシュ保存"""
        try:
            if self._redis_available and self.cluster:
                ttl = ttl or self.config.default_ttl
                serialized = self._serialize(value)
                success = await self._set_with_retry(key, serialized, ttl)

                if success:
                    self.logger.debug(f"Cache SET (Redis): {key}")
                return success
            else:
                # インメモリキャッシュを使用
                self._in_memory_cache[key] = value
                self.logger.debug(f"Cache SET (Memory): {key}")
                return True
        except Exception as e:
            self.logger.error(f"Cache 保存エラー: {key}, {e}")
            return False

    # Places API データキャッシュ
    async def get_places_data(self, place_id: str) -> Optional[PlaceData]:
        """Places API データ取得"""
        cache_key = f"places:details:{place_id}"

        try:
            cached_data = await self._get_with_retry(cache_key)
            if cached_data:
                data = self._deserialize(cached_data)
                self.logger.debug(f"Cache HIT: {place_id}")
                return PlaceData(**data) if isinstance(data, dict) else data

            self.logger.debug(f"Cache MISS: {place_id}")
            return None

        except Exception as e:
            self.logger.error(f"Places data 取得エラー: {place_id}, {e}")
            return None

    async def set_places_data(
        self,
        place_id: str,
        data: PlaceData,
        ttl: Optional[int] = None
    ) -> bool:
        """Places API データキャッシュ保存"""
        cache_key = f"places:details:{place_id}"
        ttl = ttl or self.config.default_ttl

        try:
            serialized = self._serialize(asdict(data) if hasattr(data, '__dict__') else data)
            success = await self._set_with_retry(cache_key, serialized, ttl)

            if success:
                self.logger.debug(f"Places data キャッシュ保存: {place_id}")
            return success

        except Exception as e:
            self.logger.error(f"Places data 保存エラー: {place_id}, {e}")
            return False

    # 検索結果キャッシュ
    async def get_search_results(
        self,
        query: SearchQuery
    ) -> Optional[List[Dict]]:
        """検索結果キャッシュ取得"""
        cache_key = self._generate_search_key(query)

        try:
            cached_results = await self._get_with_retry(cache_key)
            if cached_results:
                results = self._deserialize(cached_results)
                self.logger.debug(f"Search cache HIT: {query.text[:20]}...")
                return results

            self.logger.debug(f"Search cache MISS: {query.text[:20]}...")
            return None

        except Exception as e:
            self.logger.error(f"Search results 取得エラー: {e}")
            return None

    async def set_search_results(
        self,
        query: SearchQuery,
        results: List[Dict],
        ttl: Optional[int] = None
    ) -> bool:
        """検索結果キャッシュ保存"""
        cache_key = self._generate_search_key(query)
        ttl = ttl or self.config.search_ttl

        try:
            serialized = self._serialize(results)
            success = await self._set_with_retry(cache_key, serialized, ttl)

            if success:
                self.logger.debug(f"Search results キャッシュ保存: {query.text[:20]}...")
            return success

        except Exception as e:
            self.logger.error(f"Search results 保存エラー: {e}")
            return False

    # キャッシュ統計・監視
    async def get_cache_stats(self) -> CacheStats:
        """キャッシュ統計取得"""
        try:
            info = await self.cluster.info()

            return CacheStats(
                hit_rate=self._calculate_hit_rate(info),
                memory_usage=info.get("used_memory_human", "0B"),
                connected_clients=info.get("connected_clients", 0),
                total_commands=info.get("total_commands_processed", 0),
                evicted_keys=info.get("evicted_keys", 0),
                expired_keys=info.get("expired_keys", 0)
            )

        except Exception as e:
            self.logger.error(f"Cache stats 取得エラー: {e}")
            return CacheStats(0.0, "Unknown", 0, 0, 0, 0)

    async def clear_expired_cache(self) -> int:
        """期限切れキャッシュクリア"""
        try:
            # 期限切れキーのパターン検索
            patterns = [
                "places:details:*",
                "search:*",
                "batch:*"
            ]

            cleared_count = 0
            for pattern in patterns:
                keys = await self.cluster.keys(pattern)
                for key in keys:
                    ttl = await self.cluster.ttl(key)
                    if ttl == -1:  # TTL未設定
                        await self.cluster.expire(key, self.config.default_ttl)
                    elif ttl == -2:  # 既に期限切れ
                        await self.cluster.delete(key)
                        cleared_count += 1

            self.logger.info(f"期限切れキャッシュクリア: {cleared_count}件")
            return cleared_count

        except Exception as e:
            self.logger.error(f"Cache clear エラー: {e}")
            return 0

    # 高度なキャッシュ機能
    async def batch_get(self, keys: List[str]) -> Dict[str, Any]:
        """バッチ取得"""
        try:
            pipeline = self.cluster.pipeline()
            for key in keys:
                pipeline.get(key)

            results = await pipeline.execute()

            batch_results = {}
            for key, result in zip(keys, results):
                if result:
                    batch_results[key] = self._deserialize(result)

            return batch_results

        except Exception as e:
            self.logger.error(f"Batch get エラー: {e}")
            return {}

    async def batch_set(
        self,
        data: Dict[str, Any],
        ttl: Optional[int] = None
    ) -> int:
        """バッチ保存"""
        try:
            pipeline = self.cluster.pipeline()
            ttl = ttl or self.config.default_ttl

            for key, value in data.items():
                serialized = self._serialize(value)
                pipeline.setex(key, ttl, serialized)

            results = await pipeline.execute()
            success_count = sum(1 for r in results if r)

            self.logger.debug(f"Batch set: {success_count}/{len(data)} 成功")
            return success_count

        except Exception as e:
            self.logger.error(f"Batch set エラー: {e}")
            return 0

    async def invalidate_pattern(self, pattern: str) -> int:
        """パターンマッチでキャッシュ無効化"""
        try:
            keys = await self.cluster.keys(pattern)
            if keys:
                deleted = await self.cluster.delete(*keys)
                self.logger.info(f"Pattern invalidation: {deleted}件削除 ({pattern})")
                return deleted
            return 0

        except Exception as e:
            self.logger.error(f"Pattern invalidation エラー: {e}")
            return 0

    # 内部ヘルパーメソッド
    async def _get_with_retry(self, key: str) -> Optional[bytes]:
        """リトライ付き取得"""
        for attempt in range(self.config.max_retries):
            try:
                return await self.cluster.get(key)
            except Exception as e:
                if attempt == self.config.max_retries - 1:
                    raise
                await self._wait_retry_delay(attempt)

    async def _set_with_retry(self, key: str, value: bytes, ttl: int) -> bool:
        """リトライ付き保存"""
        for attempt in range(self.config.max_retries):
            try:
                return await self.cluster.setex(key, ttl, value)
            except Exception as e:
                if attempt == self.config.max_retries - 1:
                    raise
                await self._wait_retry_delay(attempt)

    async def _wait_retry_delay(self, attempt: int):
        """リトライ待機"""
        import asyncio
        delay = self.config.retry_delay * (2 ** attempt)
        await asyncio.sleep(delay)

    def _serialize(self, data: Any) -> bytes:
        """データシリアライゼーション"""
        if self.config.compression_enabled:
            import zlib
            serialized = pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)
            return zlib.compress(serialized)
        else:
            return pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)

    def _deserialize(self, data: bytes) -> Any:
        """データデシリアライゼーション"""
        if self.config.compression_enabled:
            import zlib
            decompressed = zlib.decompress(data)
            return pickle.loads(decompressed)
        else:
            return pickle.loads(data)

    def _generate_search_key(self, query: SearchQuery) -> str:
        """検索キー生成"""
        search_string = f"{query.text}:{query.location or 'global'}:{query.radius or 'default'}"
        hash_key = hashlib.md5(search_string.encode()).hexdigest()
        return f"search:{hash_key}"

    def _calculate_hit_rate(self, info: Dict) -> float:
        """ヒット率計算"""
        hits = info.get("keyspace_hits", 0)
        misses = info.get("keyspace_misses", 0)
        total = hits + misses

        return (hits / total * 100) if total > 0 else 0.0


# ファクトリー関数
def create_cache_service(redis_nodes: List[str]) -> CacheService:
    """CacheService インスタンス作成"""
    config = CacheConfig(redis_nodes=redis_nodes)
    return CacheService(config)


# 使用例・テスト関数
async def test_cache_service():
    """CacheService テスト"""
    cache = create_cache_service(["localhost:6379"])

    try:
        await cache.initialize()

        # テストデータ
        test_data = {
            "place_id": "test123",
            "name": "テスト店舗",
            "rating": 4.5,
            "location": {"lat": 38.0, "lng": 138.4}
        }

        # 保存テスト
        success = await cache.set_places_data("test123", test_data)
        print(f"保存テスト: {'成功' if success else '失敗'}")

        # 取得テスト
        cached_data = await cache.get_places_data("test123")
        print(f"取得テスト: {'成功' if cached_data else '失敗'}")

        # 統計取得
        stats = await cache.get_cache_stats()
        print(f"統計: ヒット率={stats.hit_rate:.1f}%, メモリ={stats.memory_usage}")

    finally:
        await cache.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_cache_service())
