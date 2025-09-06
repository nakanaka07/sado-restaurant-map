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
                return self._redis_available  # 実際の状態を返す

            # Redis Cluster接続試行
            startup_nodes = [
                {"host": node.split(':')[0], "port": int(node.split(':')[1])}
                for node in self.config.redis_nodes
            ]

            self.cluster = redis.RedisCluster(
                startup_nodes=startup_nodes,
                decode_responses=False,
                skip_full_coverage_check=True,
                max_connections_per_node=self.config.max_connections,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30
            )

            # 接続テスト
            await self.cluster.ping()
            self._redis_available = True
            self.logger.info("Redis Cluster接続成功")
            return self._redis_available

        except Exception as e:
            self.logger.warning(f"Redis Cluster 接続失敗 - インメモリキャッシュを使用: {e}")
            self._redis_available = False
            return self._redis_available  # 実際の状態を返す

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
            except Exception as exc:
                self.logger.warning(f"Get attempt {attempt + 1} failed: {exc}")
                if attempt == self.config.max_retries - 1:
                    raise
                await self._wait_retry_delay(attempt)

    async def _set_with_retry(self, key: str, value: bytes, ttl: int) -> bool:
        """リトライ付き保存"""
        for attempt in range(self.config.max_retries):
            try:
                return await self.cluster.setex(key, ttl, value)
            except Exception as exc:
                self.logger.warning(f"Set attempt {attempt + 1} failed: {exc}")
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


# ==========================================
# 本格運用設定（Phase 3-Full 完成版）
# ==========================================

@dataclass
class ProductionCacheConfig:
    """本番環境用キャッシュ設定"""
    # Redis Cluster設定
    redis_nodes: List[str]
    redis_password: Optional[str] = None
    redis_ssl: bool = False
    redis_ssl_cert_reqs: str = "required"

    # パフォーマンス設定
    connection_pool_size: int = 20
    max_connections_per_node: int = 50
    socket_timeout: float = 5.0
    socket_connect_timeout: float = 5.0

    # TTL戦略設定
    place_data_ttl: int = 86400 * 7     # 場所データ: 7日
    search_results_ttl: int = 3600 * 6  # 検索結果: 6時間
    api_response_ttl: int = 1800        # APIレスポンス: 30分
    temporary_data_ttl: int = 300       # 一時データ: 5分

    # 圧縮・最適化設定
    compression_enabled: bool = True
    compression_level: int = 6
    large_data_threshold: int = 10240   # 10KB以上で圧縮

    # 監視・アラート設定
    health_check_interval: int = 30
    max_memory_usage: float = 0.8       # 80%でアラート
    min_hit_rate: float = 0.7           # 70%未満でアラート

    # 障害対応設定
    max_retries: int = 5
    retry_delay: float = 0.5
    circuit_breaker_threshold: int = 10
    circuit_breaker_timeout: int = 60


class ProductionCacheService(CacheService):
    """本番環境用高度キャッシュサービス"""

    def __init__(self, config: ProductionCacheConfig):
        # 基底クラス初期化
        base_config = CacheConfig(
            redis_nodes=config.redis_nodes,
            default_ttl=config.place_data_ttl,
            search_ttl=config.search_results_ttl,
            max_retries=config.max_retries,
            retry_delay=config.retry_delay,
            compression_enabled=config.compression_enabled
        )
        super().__init__(base_config)

        self.prod_config = config
        self.health_status = {"status": "unknown", "last_check": None}
        self.circuit_breaker_state = False
        self.circuit_breaker_failures = 0
        self.circuit_breaker_last_failure = None

    async def initialize_production(self):
        """本番環境初期化"""
        try:
            # Redis Cluster接続設定
            connection_kwargs = {
                "decode_responses": True,
                "socket_timeout": self.prod_config.socket_timeout,
                "socket_connect_timeout": self.prod_config.socket_connect_timeout,
                "retry_on_timeout": True,
                "max_connections": self.prod_config.max_connections_per_node
            }

            # SSL設定
            if self.prod_config.redis_ssl:
                connection_kwargs.update({
                    "ssl": True,
                    "ssl_cert_reqs": self.prod_config.redis_ssl_cert_reqs
                })

            # パスワード設定
            if self.prod_config.redis_password:
                connection_kwargs["password"] = self.prod_config.redis_password

            # Redis Cluster接続設定
            cluster_nodes = [
                {"host": node.split(":")[0], "port": int(node.split(":")[1])}
                for node in self.prod_config.redis_nodes
            ]

            # ノード情報をログ出力
            self.logger.info(f"Connecting to Redis cluster nodes: {cluster_nodes}")

            self.redis_cluster = await redis.RedisCluster.from_url(
                f"redis://{self.prod_config.redis_nodes[0]}",
                **connection_kwargs
            )

            # 初期ヘルスチェック
            await self._perform_health_check()

            # 監視タスク開始
            asyncio.create_task(self._health_monitoring_loop())

            self.logger.info("Production cache service initialized successfully")

        except Exception as e:
            self.logger.error(f"Production cache initialization failed: {e}")
            raise CacheConnectionError(f"Failed to initialize production cache: {e}")

    async def _perform_health_check(self) -> Dict[str, Any]:
        """ヘルスチェック実行"""
        try:
            start_time = time.time()

            # 基本接続チェック
            pong = await self.redis_cluster.ping()
            if not pong:
                raise CacheConnectionError("Redis ping failed")

            # メモリ使用量チェック
            info = await self.redis_cluster.info("memory")
            memory_usage = info.get("used_memory", 0)
            max_memory = info.get("maxmemory", 0)
            memory_ratio = memory_usage / max_memory if max_memory > 0 else 0

            # パフォーマンスチェック
            response_time = (time.time() - start_time) * 1000

            # 統計情報取得
            stats = await self.get_cache_stats()

            # ヘルス評価
            health_score = self._calculate_health_score(
                memory_ratio, response_time, stats.hit_rate
            )

            health_status = {
                "status": self._determine_health_status(health_score),
                "score": health_score,
                "memory_usage_ratio": memory_ratio,
                "response_time_ms": response_time,
                "hit_rate": stats.hit_rate,
                "last_check": datetime.now(),
                "alerts": self._generate_alerts(memory_ratio, response_time, stats.hit_rate)
            }

            self.health_status = health_status
            return health_status

        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            self.health_status = {
                "status": "critical",
                "error": str(e),
                "last_check": datetime.now()
            }
            return self.health_status

    def _calculate_health_score(
        self,
        memory_ratio: float,
        response_time: float,
        hit_rate: float
    ) -> float:
        """ヘルススコア計算"""
        # メモリスコア (0-40点)
        memory_score = max(0, 40 - (memory_ratio * 50))

        # レスポンス時間スコア (0-30点)
        response_score = max(0, 30 - (response_time / 10))

        # ヒット率スコア (0-30点)
        hit_score = hit_rate * 30

        return memory_score + response_score + hit_score

    def _determine_health_status(self, score: float) -> str:
        """ヘルス状態判定"""
        if score >= 80:
            return "excellent"
        elif score >= 60:
            return "good"
        elif score >= 40:
            return "warning"
        elif score >= 20:
            return "critical"
        else:
            return "failed"

    def _generate_alerts(
        self,
        memory_ratio: float,
        response_time: float,
        hit_rate: float
    ) -> List[Dict[str, Any]]:
        """アラート生成"""
        alerts = []

        if memory_ratio > self.prod_config.max_memory_usage:
            alerts.append({
                "type": "memory_high",
                "severity": "warning",
                "message": f"Memory usage high: {memory_ratio*100:.1f}%",
                "threshold": self.prod_config.max_memory_usage * 100
            })

        if hit_rate < self.prod_config.min_hit_rate:
            alerts.append({
                "type": "hit_rate_low",
                "severity": "warning",
                "message": f"Cache hit rate low: {hit_rate*100:.1f}%",
                "threshold": self.prod_config.min_hit_rate * 100
            })

        if response_time > 1000:  # 1秒以上
            alerts.append({
                "type": "response_slow",
                "severity": "critical",
                "message": f"Response time slow: {response_time:.1f}ms",
                "threshold": 1000
            })

        return alerts

    async def _health_monitoring_loop(self):
        """ヘルス監視ループ"""
        while True:
            try:
                await asyncio.sleep(self.prod_config.health_check_interval)
                await self._perform_health_check()

                # サーキットブレーカーリセット判定
                if self.circuit_breaker_state:
                    await self._check_circuit_breaker_reset()

            except Exception as e:
                self.logger.error(f"Health monitoring error: {e}")

    async def _check_circuit_breaker_reset(self):
        """サーキットブレーカーリセット判定"""
        if not self.circuit_breaker_last_failure:
            return

        time_since_failure = time.time() - self.circuit_breaker_last_failure
        if time_since_failure > self.prod_config.circuit_breaker_timeout:
            try:
                # 接続テスト
                await self.redis_cluster.ping()
                self.circuit_breaker_state = False
                self.circuit_breaker_failures = 0
                self.logger.info("Circuit breaker reset - service recovered")
            except Exception:
                self.logger.debug("Circuit breaker reset failed - service still unavailable")

    async def set_with_intelligent_ttl(
        self,
        key: str,
        value: Any,
        data_type: str = "default"
    ) -> bool:
        """インテリジェントTTL設定"""
        try:
            # データタイプ別TTL設定
            ttl_mapping = {
                "place_data": self.prod_config.place_data_ttl,
                "search_results": self.prod_config.search_results_ttl,
                "api_response": self.prod_config.api_response_ttl,
                "temporary": self.prod_config.temporary_data_ttl,
                "default": self.config.default_ttl
            }

            ttl = ttl_mapping.get(data_type, self.config.default_ttl)

            # データサイズベース圧縮判定
            serialized_data = json.dumps(value, ensure_ascii=False)
            data_size = len(serialized_data.encode('utf-8'))

            if (data_size > self.prod_config.large_data_threshold and
                self.prod_config.compression_enabled):
                # 圧縮保存
                import gzip
                compressed_data = gzip.compress(
                    serialized_data.encode('utf-8'),
                    compresslevel=self.prod_config.compression_level
                )
                await self.redis_cluster.setex(f"{key}:compressed", ttl, compressed_data)
                return True
            else:
                # 通常保存
                await self.redis_cluster.setex(key, ttl, serialized_data)
                return True

        except Exception as e:
            await self._handle_cache_error(e, "set_with_intelligent_ttl")
            return False

    async def get_with_decompression(self, key: str) -> Optional[Any]:
        """圧縮対応取得"""
        try:
            # 圧縮版チェック
            compressed_data = await self.redis_cluster.get(f"{key}:compressed")
            if compressed_data:
                import gzip
                decompressed_data = gzip.decompress(compressed_data)
                return json.loads(decompressed_data.decode('utf-8'))

            # 通常版取得
            data = await self.redis_cluster.get(key)
            if data:
                return json.loads(data)

            return None

        except Exception as e:
            await self._handle_cache_error(e, "get_with_decompression")
            return None

    async def _handle_cache_error(self, error: Exception, operation: str):
        """キャッシュエラーハンドリング"""
        # 非同期処理を追加
        await asyncio.sleep(0.001)  # Make function truly async

        self.circuit_breaker_failures += 1

        if self.circuit_breaker_failures >= self.prod_config.circuit_breaker_threshold:
            self.circuit_breaker_state = True
            self.circuit_breaker_last_failure = time.time()
            self.logger.error(f"Circuit breaker activated after {self.circuit_breaker_failures} failures")

        self.logger.error(f"Cache operation '{operation}' failed: {error}")

    async def get_production_metrics(self) -> Dict[str, Any]:
        """本番環境メトリクス取得"""
        try:
            base_stats = await self.get_cache_stats()
            health = await self._perform_health_check()

            # Redis Cluster情報
            cluster_info = await self.redis_cluster.cluster_info()
            node_info = await self.redis_cluster.cluster_nodes()

            # ノード数をカウント
            node_count = len(node_info) if node_info else 0

            return {
                "basic_stats": asdict(base_stats),
                "health_status": health,
                "cluster_info": {
                    "state": cluster_info.get("cluster_state"),
                    "slots_assigned": cluster_info.get("cluster_slots_assigned"),
                    "node_count": node_count,
                    "known_nodes": cluster_info.get("cluster_known_nodes"),
                    "size": cluster_info.get("cluster_size")
                },
                "circuit_breaker": {
                    "active": self.circuit_breaker_state,
                    "failures": self.circuit_breaker_failures
                },
                "performance": {
                    "compression_enabled": self.prod_config.compression_enabled,
                    "connection_pool_size": self.prod_config.connection_pool_size
                }
            }

        except Exception as e:
            self.logger.error(f"Failed to get production metrics: {e}")
            return {"error": str(e)}


# ファクトリー関数（拡張版）
def create_cache_service(redis_nodes: List[str], production: bool = False) -> CacheService:
    """CacheService インスタンス作成"""
    if production:
        config = ProductionCacheConfig(redis_nodes=redis_nodes)
        return ProductionCacheService(config)
    else:
        config = CacheConfig(redis_nodes=redis_nodes)
        return CacheService(config)


def create_production_cache_service(
    redis_nodes: List[str],
    redis_password: Optional[str] = None,
    redis_ssl: bool = False,
    **kwargs
) -> ProductionCacheService:
    """本番環境用CacheService作成"""
    config = ProductionCacheConfig(
        redis_nodes=redis_nodes,
        redis_password=redis_password,
        redis_ssl=redis_ssl,
        **kwargs
    )
    return ProductionCacheService(config)


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


async def test_production_cache_service():
    """本番環境用CacheService テスト"""
    cache = create_production_cache_service(
        redis_nodes=["localhost:6379"],
        redis_password=None,
        redis_ssl=False
    )

    try:
        await cache.initialize_production()

        # インテリジェントTTLテスト
        await cache.set_with_intelligent_ttl("test:place", {"name": "テスト店舗"}, "place_data")

        # 圧縮対応取得テスト
        data = await cache.get_with_decompression("test:place")
        print(f"圧縮対応取得テスト: {'成功' if data else '失敗'}")

        # 本番環境メトリクス取得
        metrics = await cache.get_production_metrics()
        print(f"ヘルス状態: {metrics.get('health_status', {}).get('status', 'unknown')}")

    except Exception as e:
        print(f"本番環境テストエラー: {e}")
    finally:
        await cache.close()


if __name__ == "__main__":
    import asyncio
    import time

    print("=== CacheService テスト ===")
    asyncio.run(test_cache_service())

    print("\n=== Production CacheService テスト ===")
    asyncio.run(test_production_cache_service())
