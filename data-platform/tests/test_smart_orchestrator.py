#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Smart Orchestrator Integration Test

Phase 3-Full統合テスト - Smart Orchestratorと既存コンポーネントの連携テスト
"""

import asyncio
import pytest
import logging
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
import sys
import os

# パス設定
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from shared.smart_orchestrator import (
    SmartOrchestrator,
    SystemState,
    WorkerState,
    SystemHealth,
    WorkerMetrics,
    LoadBalancingConfig,
    FailoverConfig
)
from shared.cache_service import CacheService, CacheStats
from shared.performance_monitor import PerformanceMonitor
from shared.exceptions import OrchestrationError, HealthCheckError, WorkerFailureError


@pytest.fixture
async def mock_cache_service():
    """モックキャッシュサービス"""
    cache_service = AsyncMock(spec=CacheService)

    # デフォルトレスポンス設定
    cache_service.health_check.return_value = True
    cache_service.get_stats.return_value = CacheStats(
        hit_rate=0.85,
        memory_usage="150MB",
        connected_clients=5,
        total_commands=1000,
        evicted_keys=10,
        expired_keys=50
    )

    return cache_service


@pytest.fixture
def mock_performance_monitor():
    """モックパフォーマンス監視"""
    monitor = MagicMock(spec=PerformanceMonitor)

    # メソッドの設定
    monitor.start_monitoring.return_value = None
    monitor.record_metric.return_value = None
    monitor.get_stats.return_value = MagicMock(
        count=100,
        success_rate=0.95
    )

    return monitor


@pytest.fixture
def load_config():
    """負荷分散設定"""
    return LoadBalancingConfig(
        algorithm="weighted_round_robin",
        health_threshold=0.7,
        max_tasks_per_worker=50,
        auto_scale=True,
        min_workers=2,
        max_workers=5
    )


@pytest.fixture
def failover_config():
    """フェイルオーバー設定"""
    return FailoverConfig(
        enable_auto_failover=True,
        health_check_interval=5,  # テスト用に短縮
        failure_threshold=2,
        recovery_threshold=1,
        circuit_breaker_threshold=0.5
    )


@pytest.fixture
async def orchestrator(mock_cache_service, mock_performance_monitor, load_config, failover_config):
    """Smart Orchestrator インスタンス"""
    orchestrator = SmartOrchestrator(
        cache_service=mock_cache_service,
        performance_monitor=mock_performance_monitor,
        load_config=load_config,
        failover_config=failover_config
    )

    # テスト用ワーカー追加
    test_workers = {
        "worker1": WorkerMetrics(
            worker_id="worker1",
            state=WorkerState.ACTIVE,
            load=0.3,
            active_tasks=2,
            completed_tasks=50,
            failed_tasks=1,
            last_activity=datetime.now(),
            response_time=100.0,
            memory_usage=200.0,
            cpu_usage=30.0
        ),
        "worker2": WorkerMetrics(
            worker_id="worker2",
            state=WorkerState.ACTIVE,
            load=0.5,
            active_tasks=5,
            completed_tasks=100,
            failed_tasks=2,
            last_activity=datetime.now(),
            response_time=150.0,
            memory_usage=300.0,
            cpu_usage=50.0
        ),
        "worker3": WorkerMetrics(
            worker_id="worker3",
            state=WorkerState.IDLE,
            load=0.1,
            active_tasks=0,
            completed_tasks=30,
            failed_tasks=0,
            last_activity=datetime.now(),
            response_time=80.0,
            memory_usage=150.0,
            cpu_usage=10.0
        )
    }

    orchestrator.worker_metrics = test_workers

    return orchestrator


class TestSmartOrchestratorBasic:
    """Smart Orchestrator基本機能テスト"""

    @pytest.mark.asyncio
    async def test_orchestrator_initialization(self, orchestrator):
        """初期化テスト"""
        assert orchestrator is not None
        assert orchestrator.system_health.state == SystemState.HEALTHY
        assert len(orchestrator.worker_metrics) == 3
        assert orchestrator.load_config.algorithm == "weighted_round_robin"

    @pytest.mark.asyncio
    async def test_worker_discovery(self, orchestrator):
        """ワーカー検出テスト"""
        with patch('shared.smart_orchestrator.celery_app.control.inspect') as mock_inspect:
            # モックのinspector設定
            mock_inspector = MagicMock()
            mock_inspector.active.return_value = {
                "worker1@host": [],
                "worker2@host": [],
                "worker3@host": []
            }
            mock_inspect.return_value = mock_inspector

            await orchestrator._discover_workers()

            # ワーカーが検出されることを確認
            assert len(orchestrator.worker_metrics) >= 3

    @pytest.mark.asyncio
    async def test_get_system_status(self, orchestrator):
        """システム状態取得テスト"""
        status = await orchestrator.get_system_status()

        assert 'system_health' in status
        assert 'workers' in status
        assert 'load_balancing' in status

        assert status['system_health']['state'] == SystemState.HEALTHY.value
        assert len(status['workers']) == 3
        assert status['load_balancing']['algorithm'] == "weighted_round_robin"


class TestLoadBalancing:
    """負荷分散機能テスト"""

    @pytest.mark.asyncio
    async def test_get_optimal_worker_weighted_round_robin(self, orchestrator):
        """重み付きラウンドロビンテスト"""
        orchestrator.load_config.algorithm = "weighted_round_robin"

        worker_id = await orchestrator.get_optimal_worker("api_call", priority=5)

        assert worker_id is not None
        assert worker_id in orchestrator.worker_metrics
        # 負荷が低いworker3が選ばれやすい
        assert worker_id in ["worker1", "worker3"]  # worker2は負荷が高い

    @pytest.mark.asyncio
    async def test_get_optimal_worker_least_connections(self, orchestrator):
        """最少接続数テスト"""
        orchestrator.load_config.algorithm = "least_connections"

        worker_id = await orchestrator.get_optimal_worker("api_call")

        assert worker_id is not None
        # アクティブタスクが最少のworker3が選ばれる
        assert worker_id == "worker3"

    @pytest.mark.asyncio
    async def test_get_optimal_worker_health_based(self, orchestrator):
        """健康度ベース選択テスト"""
        orchestrator.load_config.algorithm = "health_based"

        worker_id = await orchestrator.get_optimal_worker("api_call")

        assert worker_id is not None
        assert worker_id in orchestrator.worker_metrics

    @pytest.mark.asyncio
    async def test_no_available_workers(self, orchestrator):
        """利用可能ワーカーなしテスト"""
        # 全ワーカーを障害状態に
        orchestrator.failed_workers = set(orchestrator.worker_metrics.keys())

        worker_id = await orchestrator.get_optimal_worker("api_call")

        assert worker_id is None


class TestFailoverMechanism:
    """フェイルオーバー機能テスト"""

    @pytest.mark.asyncio
    async def test_handle_worker_failure(self, orchestrator):
        """ワーカー障害処理テスト"""
        worker_id = "worker1"
        test_error = Exception("Test error")

        await orchestrator.handle_worker_failure(worker_id, test_error)

        # 障害カウントが増加することを確認
        assert orchestrator.failure_counts[worker_id] == 1

    @pytest.mark.asyncio
    async def test_mark_worker_failed(self, orchestrator):
        """ワーカー障害マークテスト"""
        worker_id = "worker1"

        await orchestrator._mark_worker_failed(worker_id)

        # ワーカーが障害リストに追加されることを確認
        assert worker_id in orchestrator.failed_workers
        assert orchestrator.worker_metrics[worker_id].state == WorkerState.FAILED

    @pytest.mark.asyncio
    async def test_circuit_breaker_activation(self, orchestrator):
        """サーキットブレーカー作動テスト"""
        worker_id = "worker1"
        test_error = Exception("Test error")

        # 複数回障害を発生させる
        await orchestrator.handle_worker_failure(worker_id, test_error)
        await orchestrator.handle_worker_failure(worker_id, test_error)

        # サーキットブレーカーが作動することを確認
        assert orchestrator.circuit_breaker_state[worker_id] is True

    @pytest.mark.asyncio
    async def test_force_failover(self, orchestrator):
        """強制フェイルオーバーテスト"""
        worker_id = "worker2"

        result = await orchestrator.force_failover(worker_id)

        assert result is True
        assert worker_id in orchestrator.failed_workers

    @pytest.mark.asyncio
    async def test_reset_circuit_breaker(self, orchestrator):
        """サーキットブレーカーリセットテスト"""
        worker_id = "worker1"

        # サーキットブレーカーを作動状態にする
        orchestrator.circuit_breaker_state[worker_id] = True
        orchestrator.failure_counts[worker_id] = 5

        result = await orchestrator.reset_circuit_breaker(worker_id)

        assert result is True
        assert orchestrator.circuit_breaker_state[worker_id] is False
        assert orchestrator.failure_counts[worker_id] == 0


class TestResourceOptimization:
    """リソース最適化テスト"""

    @pytest.mark.asyncio
    async def test_optimize_resources(self, orchestrator):
        """リソース最適化テスト"""
        results = await orchestrator.optimize_resources()

        assert 'cache_optimization' in results
        assert 'worker_optimization' in results
        assert 'task_optimization' in results

    @pytest.mark.asyncio
    async def test_cache_optimization(self, orchestrator):
        """キャッシュ最適化テスト"""
        result = await orchestrator._optimize_cache()

        assert 'hit_rate' in result
        assert 'memory_usage' in result
        assert result['hit_rate'] == pytest.approx(0.85, rel=0.01)

    @pytest.mark.asyncio
    async def test_worker_optimization_scale_up(self, orchestrator):
        """ワーカー最適化（スケールアップ）テスト"""
        # 高負荷状態をシミュレート
        for worker in orchestrator.worker_metrics.values():
            worker.load = 0.9  # 90%負荷

        result = await orchestrator._optimize_workers()

        assert 'optimizations' in result
        assert 'scale_up' in result['optimizations']

    @pytest.mark.asyncio
    async def test_worker_optimization_scale_down(self, orchestrator):
        """ワーカー最適化（スケールダウン）テスト"""
        # 低負荷状態をシミュレート
        for worker in orchestrator.worker_metrics.values():
            worker.load = 0.1  # 10%負荷

        result = await orchestrator._optimize_workers()

        assert 'optimizations' in result
        assert 'scale_down' in result['optimizations']


class TestHealthMonitoring:
    """健康監視テスト"""

    @pytest.mark.asyncio
    async def test_health_check_healthy_system(self, orchestrator):
        """健康システムテスト"""
        await orchestrator._perform_health_check()

        assert orchestrator.system_health.state == SystemState.HEALTHY
        assert orchestrator.system_health.overall_health >= 0.7

    @pytest.mark.asyncio
    async def test_health_check_degraded_system(self, orchestrator, mock_cache_service):
        """性能低下システムテスト"""
        # キャッシュヒット率を低下させる
        mock_cache_service.get_stats.return_value = CacheStats(
            hit_rate=0.4,  # 低ヒット率
            memory_usage="150MB",
            connected_clients=5,
            total_commands=1000,
            evicted_keys=10,
            expired_keys=50
        )

        await orchestrator._perform_health_check()

        # システム状態が低下することを確認
        assert orchestrator.system_health.overall_health < 0.9

    @pytest.mark.asyncio
    async def test_check_workers_health(self, orchestrator):
        """ワーカー健康度テスト"""
        health_score = await orchestrator._check_workers_health()

        # 3つのワーカーが全て健康なので100%
        assert health_score == pytest.approx(1.0, rel=0.01)

    @pytest.mark.asyncio
    async def test_check_workers_health_with_failures(self, orchestrator):
        """障害ワーカー含む健康度テスト"""
        # 1つのワーカーを障害状態に
        orchestrator.failed_workers.add("worker1")

        health_score = await orchestrator._check_workers_health()

        # 3つ中2つが健康なので約67%
        assert health_score == pytest.approx(0.67, rel=0.1)


class TestManagedTaskExecution:
    """管理されたタスク実行テスト"""

    @pytest.mark.asyncio
    async def test_managed_task_execution_success(self, orchestrator):
        """タスク実行成功テスト"""
        async with orchestrator.managed_task_execution("api_call", priority=5) as worker_id:
            assert worker_id is not None
            assert worker_id in orchestrator.worker_metrics

            # テスト内で特定の処理を実行
            await asyncio.sleep(0.01)

        # 完了後、統計が更新されることを確認
        assert orchestrator.worker_metrics[worker_id].completed_tasks > 0
        assert orchestrator.task_distribution[worker_id] > 0

    @pytest.mark.asyncio
    async def test_managed_task_execution_failure(self, orchestrator):
        """タスク実行失敗テスト"""
        exception_caught = False
        try:
            async with orchestrator.managed_task_execution("api_call"):
                # タスク内で例外発生（より具体的な例外）
                raise ValueError("Task processing failed")
        except ValueError:
            # 例外が発生することを確認
            exception_caught = True

        assert exception_caught, "Expected ValueError was not caught"

        # 失敗統計が更新されることを確認
        failed_count = sum(
            metrics.failed_tasks
            for metrics in orchestrator.worker_metrics.values()
        )
        assert failed_count > 0

    @pytest.mark.asyncio
    async def test_managed_task_execution_no_workers(self, orchestrator):
        """利用可能ワーカーなし実行テスト"""
        # 全ワーカーを障害状態に
        orchestrator.failed_workers = set(orchestrator.worker_metrics.keys())

        with pytest.raises(OrchestrationError, match="No available workers"):
            async with orchestrator.managed_task_execution("api_call"):
                # この部分は実行されない
                await asyncio.sleep(0.01)


class TestStartStopLifecycle:
    """開始・停止ライフサイクルテスト"""

    @pytest.mark.asyncio
    async def test_start_stop_orchestrator(self, orchestrator):
        """Orchestrator開始・停止テスト"""
        # 開始
        await orchestrator.start()
        assert orchestrator._running is True

        # 停止
        await orchestrator.stop()
        assert orchestrator._running is False

    @pytest.mark.asyncio
    async def test_start_already_running(self, orchestrator):
        """既に開始済みの場合のテスト"""
        await orchestrator.start()

        # 再度開始してもエラーが発生しないことを確認
        await orchestrator.start()
        assert orchestrator._running is True

        await orchestrator.stop()

    @pytest.mark.asyncio
    async def test_stop_not_running(self, orchestrator):
        """未開始状態での停止テスト"""
        # 開始していない状態で停止してもエラーが発生しないことを確認
        await orchestrator.stop()
        assert orchestrator._running is False


if __name__ == "__main__":
    # テスト実行
    import pytest

    # ログレベル設定
    logging.basicConfig(level=logging.INFO)

    # テスト実行
    pytest.main([__file__, "-v", "--tb=short"])
