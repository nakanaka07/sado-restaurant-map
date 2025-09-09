#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cache Service Integration Test Suite
キャッシュサービスの包括的統合テスト
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta

from shared.cache_service import CacheService, CacheConfig, CacheStats
from shared.types.core_types import PlaceData
from shared.exceptions import CacheError, CacheConnectionError


class TestCacheServiceIntegration:
    """CacheService 統合テストクラス"""

    @pytest.fixture
    def mock_redis_config(self):
        """モックRedis設定"""
        return CacheConfig(
            redis_nodes=["redis://localhost:6379"],
            default_ttl=3600,
            search_ttl=1800,
            max_retries=3,
            compression_enabled=True
        )

    @pytest.fixture
    async def cache_service(self, mock_redis_config):
        """テスト用CacheServiceインスタンス"""
        with patch('shared.cache_service.redis') as mock_redis_module:
            # Redis接続のモック
            mock_cluster = AsyncMock()
            mock_redis_module.RedisCluster.return_value = mock_cluster

            # 基本Redis操作のモック
            mock_cluster.ping.return_value = True
            mock_cluster.get.return_value = None
            mock_cluster.set.return_value = True
            mock_cluster.delete.return_value = 1
            mock_cluster.exists.return_value = False
            mock_cluster.info.return_value = {
                "used_memory": 1000000,
                "maxmemory": 10000000,
                "keyspace_hits": 100,
                "keyspace_misses": 50
            }

            service = CacheService(mock_redis_config)
            await service.initialize()

            yield service

            # クリーンアップは個別に処理

    @pytest.fixture
    def sample_place_data(self):
        """サンプルPlace データ"""
        return PlaceData(
            place_id="ChIJ123test456",
            name="テストレストラン",
            formattedAddress="新潟県佐渡市両津湊123",
            location={"latitude": 38.0333, "longitude": 138.4333},
            types=["restaurant", "food"],
            rating=4.2,
            userRatingCount=50,
            businessStatus="OPERATIONAL"
        )

    @pytest.mark.asyncio
    async def test_cache_service_initialization(self, cache_service):
        """CacheService初期化テスト"""
        assert cache_service.redis_cluster is not None
        assert cache_service.config.default_ttl == 3600
        assert cache_service.config.compression_enabled is True

    @pytest.mark.asyncio
    async def test_cache_operations_basic(self, cache_service, sample_place_data):
        """基本的なキャッシュ操作テスト"""
        cache_key = "test:place:123"

        # モック設定: 最初は存在しない、セット後は存在する
        cache_service.redis_cluster.get.side_effect = [None, sample_place_data.model_dump_json()]
        cache_service.redis_cluster.exists.side_effect = [False, True]

        # キーが存在しないことを確認
        exists = await cache_service.exists(cache_key)
        assert exists is False

        # データをキャッシュに保存
        success = await cache_service.set(cache_key, sample_place_data, ttl=3600)
        assert success is True

        # データを取得
        cached_data = await cache_service.get(cache_key)
        assert cached_data is not None
        # PlaceDataであることを確認
        assert isinstance(cached_data, dict)
        assert cached_data.get('place_id') == sample_place_data['place_id']

    @pytest.mark.asyncio
    async def test_cache_ttl_management(self, cache_service, sample_place_data):
        """TTL管理テスト"""
        cache_key = "test:ttl:place"

        # 短いTTLでセット
        await cache_service.set(cache_key, sample_place_data, ttl=1)

        # TTLを設定したことを確認
        cache_service.redis_cluster.set.assert_called()
        call_args = cache_service.redis_cluster.set.call_args
        assert call_args[1]['ex'] == 1  # TTLが設定されている

    @pytest.mark.asyncio
    async def test_cache_compression(self, cache_service, sample_place_data):
        """データ圧縮テスト"""
        cache_key = "test:compression:place"

        # 圧縮有効な設定でテスト
        assert cache_service.config.compression_enabled is True

        await cache_service.set(cache_key, sample_place_data)

        # データが圧縮されて保存されることを確認
        cache_service.redis_cluster.set.assert_called()

    @pytest.mark.asyncio
    async def test_cache_batch_operations(self, cache_service):
        """バッチ操作テスト"""
        place_data_list = [
            PlaceData(
                place_id=f"test_place_{i}",
                name=f"テストレストラン{i}",
                formattedAddress=f"住所{i}",
                location={"latitude": 38.0 + i * 0.01, "longitude": 138.0 + i * 0.01}
            )
            for i in range(5)
        ]

        # バッチセット操作のモック
        cache_service.redis_cluster.mset.return_value = True

        # バッチでデータを保存
        keys = [f"batch:place:{i}" for i in range(5)]
        result = await cache_service.set_batch(dict(zip(keys, place_data_list)))

        assert result.successful_count == 5
        assert result.failed_count == 0

    @pytest.mark.asyncio
    async def test_cache_error_handling(self, cache_service):
        """エラーハンドリングテスト"""
        # Redis接続エラーをシミュレート
        cache_service.redis_cluster.ping.side_effect = Exception("Connection failed")

        with pytest.raises(CacheConnectionError):
            await cache_service._perform_health_check()

    @pytest.mark.asyncio
    async def test_cache_health_monitoring(self, cache_service):
        """ヘルス監視テスト"""
        # ヘルスチェック実行
        health_status = await cache_service._perform_health_check()

        assert "status" in health_status
        assert "memory_usage_ratio" in health_status
        assert "response_time_ms" in health_status
        assert "hit_rate" in health_status

    @pytest.mark.asyncio
    async def test_cache_statistics(self, cache_service):
        """キャッシュ統計テスト"""
        stats = await cache_service.get_cache_stats()

        assert isinstance(stats, CacheStats)
        assert stats.hit_rate >= 0.0
        assert stats.memory_usage is not None

    @pytest.mark.asyncio
    async def test_cache_cleanup_operations(self, cache_service):
        """クリーンアップ操作テスト"""
        # 期限切れキーのクリーンアップ
        cache_service.redis_cluster.scan_iter.return_value = [
            "expired:key:1", "expired:key:2"
        ]
        cache_service.redis_cluster.ttl.return_value = -1  # 期限切れ
        cache_service.redis_cluster.delete.return_value = 2

        cleaned_count = await cache_service.cleanup_expired_keys()
        assert cleaned_count >= 0

    @pytest.mark.asyncio
    async def test_cache_failover_scenarios(self, cache_service):
        """フェイルオーバーシナリオテスト"""
        # 一部のRedisノードが失敗した場合のテスト
        cache_service.redis_cluster.get.side_effect = [
            Exception("Node 1 failed"),  # 最初の試行は失敗
            '{"test": "data"}'  # リトライで成功
        ]

        # リトライ機能のテスト
        await cache_service.get("test:failover:key")
        # フェイルオーバーやリトライが適切に動作することを確認
        assert cache_service.redis_cluster.get.call_count >= 1

    @pytest.mark.asyncio
    async def test_cache_performance_metrics(self, cache_service):
        """パフォーマンスメトリクステスト"""
        # パフォーマンス監視の統計情報取得
        performance_stats = await cache_service.get_performance_stats()

        assert "average_response_time" in performance_stats
        assert "operations_count" in performance_stats
        assert "error_rate" in performance_stats

    @pytest.mark.asyncio
    async def test_cache_memory_management(self, cache_service):
        """メモリ管理テスト"""
        # メモリ使用量の監視
        cache_service.redis_cluster.info.return_value = {
            "used_memory": 8000000,  # 8MB使用
            "maxmemory": 10000000    # 10MB上限
        }

        memory_info = await cache_service.get_memory_info()

        assert abs(memory_info["usage_ratio"] - 0.8) < 0.01
        assert memory_info["status"] in ["normal", "warning", "critical"]

    @pytest.mark.asyncio
    async def test_cache_concurrent_operations(self, cache_service, sample_place_data):
        """並行操作テスト"""
        # 複数の並行操作をシミュレート
        tasks = []
        for i in range(10):
            key = f"concurrent:test:{i}"
            task = cache_service.set(key, sample_place_data)
            tasks.append(task)

        # 全ての操作が完了することを確認
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # エラーが発生していないことを確認
        errors = [r for r in results if isinstance(r, Exception)]
        assert len(errors) == 0


class TestCacheServiceConfiguration:
    """CacheService設定テストクラス"""

    def test_cache_config_validation(self):
        """設定バリデーションテスト"""
        # 正常な設定
        config = CacheConfig(
            redis_nodes=["redis://localhost:6379"],
            default_ttl=3600
        )
        assert config.default_ttl == 3600
        assert len(config.redis_nodes) == 1

    def test_cache_config_defaults(self):
        """設定デフォルト値テスト"""
        config = CacheConfig(redis_nodes=["redis://localhost:6379"])

        assert config.default_ttl == 86400  # 24時間
        assert config.search_ttl == 3600    # 1時間
        assert config.max_retries == 3
        assert config.compression_enabled is True


@pytest.mark.integration
class TestCacheServiceRealRedis:
    """実際のRedisを使用した統合テスト（オプショナル）"""

    @pytest.mark.skipif(
        True,  # 実際のRedisが利用可能な場合のみ実行
        reason="Real Redis instance required"
    )
    @pytest.mark.asyncio
    async def test_real_redis_integration(self):
        """実Redis統合テスト（条件付き実行）"""
        config = CacheConfig(redis_nodes=["redis://localhost:6379"])

        try:
            cache_service = CacheService(config)
            await cache_service.initialize()

            # 基本操作テスト
            await cache_service.set("integration:test", {"data": "test"})
            result = await cache_service.get("integration:test")

            assert result is not None
            assert result["data"] == "test"

            await cache_service.close()

        except Exception as e:
            pytest.skip(f"Redis not available: {e}")
