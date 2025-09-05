#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Smart Orchestrator - インテリジェント制御システム

Phase 3-Full分散処理の中核制御システム
- インテリジェント制御ロジック
- 負荷分散アルゴリズム
- 自動フェイルオーバー機能
- リソース最適化システム
"""

import asyncio
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Set, Tuple
from enum import Enum
from contextlib import asynccontextmanager
import json
import logging

from .cache_service import CacheService, CacheStats
from .celery_config import celery_app, get_queue_stats
from .performance_monitor import PerformanceMonitor, MetricType
from .exceptions import OrchestrationError, HealthCheckError
from .logger import get_logger


class SystemState(Enum):
    """システム状態"""
    HEALTHY = "healthy"           # 正常
    DEGRADED = "degraded"         # 性能低下
    CRITICAL = "critical"         # 危険状態
    FAILED = "failed"             # 障害
    MAINTENANCE = "maintenance"   # メンテナンス


class WorkerState(Enum):
    """ワーカー状態"""
    ACTIVE = "active"            # アクティブ
    IDLE = "idle"                # アイドル
    BUSY = "busy"                # ビジー
    FAILED = "failed"            # 障害
    OFFLINE = "offline"          # オフライン


@dataclass
class SystemHealth:
    """システム健康状態"""
    state: SystemState
    cache_health: float          # 0.0-1.0
    worker_health: float         # 0.0-1.0
    api_health: float           # 0.0-1.0
    overall_health: float       # 0.0-1.0
    last_check: datetime = field(default_factory=datetime.now)
    issues: List[str] = field(default_factory=list)


@dataclass
class WorkerMetrics:
    """ワーカーメトリクス"""
    worker_id: str
    state: WorkerState
    load: float                  # 0.0-1.0
    active_tasks: int
    completed_tasks: int
    failed_tasks: int
    last_activity: datetime
    response_time: float
    memory_usage: float
    cpu_usage: float


@dataclass
class LoadBalancingConfig:
    """負荷分散設定"""
    algorithm: str = "weighted_round_robin"  # weighted_round_robin, least_connections, health_based
    health_threshold: float = 0.7            # 健康閾値
    max_tasks_per_worker: int = 100          # ワーカー毎最大タスク数
    auto_scale: bool = True                  # 自動スケーリング
    scale_up_threshold: float = 0.8          # スケールアップ閾値
    scale_down_threshold: float = 0.3        # スケールダウン閾値
    min_workers: int = 2                     # 最小ワーカー数
    max_workers: int = 10                    # 最大ワーカー数


@dataclass
class FailoverConfig:
    """フェイルオーバー設定"""
    enable_auto_failover: bool = True
    health_check_interval: int = 30          # 健康チェック間隔（秒）
    failure_threshold: int = 3               # 障害閾値
    recovery_threshold: int = 2              # 復旧閾値
    circuit_breaker_threshold: float = 0.5   # サーキットブレーカー閾値
    fallback_cache_ttl: int = 300           # フォールバックキャッシュTTL


class SmartOrchestrator:
    """Smart Orchestrator - インテリジェント制御システム

    Phase 3-Full分散処理の中核制御システム
    """

    def __init__(
        self,
        cache_service: CacheService,
        performance_monitor: PerformanceMonitor,
        load_config: Optional[LoadBalancingConfig] = None,
        failover_config: Optional[FailoverConfig] = None
    ):
        self.cache_service = cache_service
        self.performance_monitor = performance_monitor
        self.load_config = load_config or LoadBalancingConfig()
        self.failover_config = failover_config or FailoverConfig()

        self.logger = get_logger(__name__)

        # システム状態管理
        self.system_health = SystemHealth(SystemState.HEALTHY, 1.0, 1.0, 1.0, 1.0)
        self.worker_metrics: Dict[str, WorkerMetrics] = {}
        self.failed_workers: Set[str] = set()
        self.recovery_attempts: Dict[str, int] = defaultdict(int)

        # 負荷分散管理
        self.current_worker_index = 0
        self.worker_loads: Dict[str, float] = defaultdict(float)
        self.task_distribution: Dict[str, int] = defaultdict(int)

        # サーキットブレーカー
        self.circuit_breaker_state: Dict[str, bool] = defaultdict(bool)
        self.failure_counts: Dict[str, int] = defaultdict(int)

        # 制御フラグ
        self._running = False
        self._health_check_task: Optional[asyncio.Task] = None
        self._monitoring_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        """Orchestrator開始"""
        if self._running:
            return

        self.logger.info("Smart Orchestrator starting...")

        try:
            # 初期化
            await self._initialize_system()

            # 監視タスク開始
            self._running = True
            self._health_check_task = asyncio.create_task(self._health_check_loop())
            self._monitoring_task = asyncio.create_task(self._monitoring_loop())

            self.logger.info("Smart Orchestrator started successfully")

        except Exception as e:
            self.logger.error(f"Failed to start Smart Orchestrator: {e}")
            raise OrchestrationError(f"Startup failed: {e}")

    async def stop(self) -> None:
        """Orchestrator停止"""
        if not self._running:
            return

        self.logger.info("Smart Orchestrator stopping...")

        self._running = False

        # タスク停止
        if self._health_check_task:
            self._health_check_task.cancel()
            await self._health_check_task

        if self._monitoring_task:
            self._monitoring_task.cancel()
            await self._monitoring_task

        self.logger.info("Smart Orchestrator stopped")

    async def _initialize_system(self) -> None:
        """システム初期化"""
        # キャッシュ接続確認
        try:
            await self.cache_service.health_check()
        except Exception as e:
            raise OrchestrationError(f"Cache service initialization failed: {e}")

        # ワーカー検出
        await self._discover_workers()

        # パフォーマンス監視初期化
        self.performance_monitor.start_monitoring()

    async def _discover_workers(self) -> None:
        """ワーカー検出"""
        try:
            # Celeryワーカー情報取得（非同期実行）
            loop = asyncio.get_event_loop()
            inspector = celery_app.control.inspect()
            active_workers = await loop.run_in_executor(None, inspector.active)

            if active_workers:
                for worker_id in active_workers.keys():
                    self.worker_metrics[worker_id] = WorkerMetrics(
                        worker_id=worker_id,
                        state=WorkerState.ACTIVE,
                        load=0.0,
                        active_tasks=0,
                        completed_tasks=0,
                        failed_tasks=0,
                        last_activity=datetime.now(),
                        response_time=0.0,
                        memory_usage=0.0,
                        cpu_usage=0.0
                    )

                self.logger.info(f"Discovered {len(active_workers)} workers")
            else:
                self.logger.warning("No active workers found")

        except Exception as e:
            self.logger.error(f"Worker discovery failed: {e}")

    # ==========================================
    # インテリジェント制御ロジック
    # ==========================================

    async def get_optimal_worker(self, task_type: str, priority: int = 5) -> Optional[str]:
        """最適ワーカー選択

        Args:
            task_type: タスクタイプ (api_call, data_processing, cache_operation等)
            priority: 優先度 (1-10)

        Returns:
            選択されたワーカーID
        """
        async with self._lock:
            available_workers = await self._get_available_workers(task_type)

            if not available_workers:
                self.logger.warning(f"No available workers for task_type: {task_type}")
                return None

            # 負荷分散アルゴリズム適用
            if self.load_config.algorithm == "weighted_round_robin":
                return await self._weighted_round_robin(available_workers, priority, task_type)
            elif self.load_config.algorithm == "least_connections":
                return await self._least_connections(available_workers)
            elif self.load_config.algorithm == "health_based":
                return await self._health_based_selection(available_workers)
            else:
                # デフォルト: ラウンドロビン
                return await self._round_robin(available_workers)

    async def _get_available_workers(self, task_type: Optional[str] = None) -> List[str]:
        """利用可能ワーカー取得

        Args:
            task_type: タスクタイプに基づく適合性チェック用
        """
        available = []

        for worker_id, metrics in self.worker_metrics.items():
            # 障害ワーカー除外
            if worker_id in self.failed_workers:
                continue

            # サーキットブレーカーチェック
            if self.circuit_breaker_state.get(worker_id, False):
                continue

            # タスクタイプ適合性チェック（将来の拡張用）
            if task_type and not await self._is_worker_suitable_for_task(worker_id, task_type):
                continue

            # 負荷チェック
            if metrics.load < 0.9:  # 90%未満
                available.append(worker_id)

        return available

    async def _is_worker_suitable_for_task(self, worker_id: str, task_type: str) -> bool:
        """ワーカーのタスクタイプ適合性チェック

        Args:
            worker_id: ワーカーID
            task_type: タスクタイプ

        Returns:
            適合性（現在は基本的な適合性判定、将来的に特化ワーカー対応）
        """
        await asyncio.sleep(0)  # 非同期関数として維持

        # 基本的な適合性チェック（worker_idとtask_typeを使用）
        if not worker_id or not task_type:
            return False

        # ワーカーが存在するかチェック
        if worker_id not in self.worker_metrics:
            return False

        # タスクタイプ別の基本的な適合性判定
        worker_metrics = self.worker_metrics[worker_id]

        # 高負荷のワーカーは重いタスクを避ける
        if task_type in ["batch_processing", "data_processing"] and worker_metrics.load > 0.7:
            return False

        # APIコールは応答時間が重要
        if task_type == "api_call" and worker_metrics.response_time > 500:  # 500ms以上
            return False

        return True

    async def _weighted_round_robin(self, workers: List[str], priority: int, task_type: str) -> str:
        """重み付きラウンドロビン

        Args:
            workers: 利用可能ワーカーリスト
            priority: タスク優先度 (1-10、高いほど優先)
            task_type: タスクタイプ
        """
        weights = {}

        for worker_id in workers:
            metrics = self.worker_metrics[worker_id]
            # 負荷が低いほど重み大
            weight = max(0.1, 1.0 - metrics.load)
            # 健康度を考慮
            health_factor = 1.0 - (metrics.failed_tasks / max(1, metrics.completed_tasks + metrics.failed_tasks))
            # 優先度を考慮（高優先度タスクは高性能ワーカーを優先）
            priority_factor = 1.0 + (priority - 5) * 0.1  # 優先度5を基準に±50%調整
            # タスクタイプによる適合度（将来拡張用）
            type_factor = await self._get_task_type_affinity(worker_id, task_type)

            weights[worker_id] = weight * health_factor * priority_factor * type_factor

        # 重み付き選択
        total_weight = sum(weights.values())
        if total_weight == 0:
            return workers[0]

        import random
        r = random.uniform(0, total_weight)
        upto = 0

        for worker_id, weight in weights.items():
            if upto + weight >= r:
                return worker_id
            upto += weight

        return workers[-1]

    async def _get_task_type_affinity(self, worker_id: str, task_type: str) -> float:
        """タスクタイプ親和性取得（将来拡張用）

        Returns:
            親和性係数 (0.5-1.5)
        """
        await asyncio.sleep(0)  # 非同期関数として維持

        # ワーカー固有の性能履歴を考慮した親和性計算
        worker_stats = self.worker_states.get(worker_id)
        if not worker_stats:
            return 1.0

        # 基本親和性マップ
        affinity_map = {
            "api_call": 1.0,
            "data_processing": 1.0,
            "cache_operation": 1.0,
            "batch_processing": 1.0
        }

        base_affinity = affinity_map.get(task_type, 1.0)

        # ワーカーの応答時間と成功率を考慮した調整
        response_time_factor = max(0.5, min(1.5, 1.0 / (worker_stats.avg_response_time + 0.1)))
        success_rate_factor = max(0.5, min(1.5, worker_stats.success_rate))

        # 最終的な親和性係数を計算
        return base_affinity * response_time_factor * success_rate_factor

    async def _least_connections(self, workers: List[str]) -> str:
        """最少接続数"""
        await asyncio.sleep(0)  # 非同期関数として維持

        min_tasks = float('inf')
        selected_worker = workers[0]

        for worker_id in workers:
            metrics = self.worker_metrics[worker_id]
            if metrics.active_tasks < min_tasks:
                min_tasks = metrics.active_tasks
                selected_worker = worker_id

        return selected_worker

    async def _health_based_selection(self, workers: List[str]) -> str:
        """健康度ベース選択"""
        await asyncio.sleep(0)  # 非同期関数として維持

        best_score = -1
        selected_worker = workers[0]

        for worker_id in workers:
            metrics = self.worker_metrics[worker_id]

            # 健康度スコア計算
            success_rate = metrics.completed_tasks / max(1, metrics.completed_tasks + metrics.failed_tasks)
            load_score = 1.0 - metrics.load
            response_score = max(0, 1.0 - (metrics.response_time / 1000))  # 1秒を基準

            health_score = (success_rate * 0.4 + load_score * 0.4 + response_score * 0.2)

            if health_score > best_score:
                best_score = health_score
                selected_worker = worker_id

        return selected_worker

    async def _round_robin(self, workers: List[str]) -> str:
        """シンプルラウンドロビン"""
        await asyncio.sleep(0)  # 非同期関数として維持

        self.current_worker_index = (self.current_worker_index + 1) % len(workers)
        return workers[self.current_worker_index]

    # ==========================================
    # 自動フェイルオーバー機能
    # ==========================================

    async def handle_worker_failure(self, worker_id: str, error: Exception) -> None:
        """ワーカー障害処理"""
        self.logger.warning(f"Worker {worker_id} failure detected: {error}")

        # 障害カウント増加
        self.failure_counts[worker_id] += 1

        # 障害閾値チェック
        if self.failure_counts[worker_id] >= self.failover_config.failure_threshold:
            await self._mark_worker_failed(worker_id)

        # サーキットブレーカー判定
        if self.failure_counts[worker_id] >= 2:
            self.circuit_breaker_state[worker_id] = True
            self.logger.warning(f"Circuit breaker activated for worker {worker_id}")

    async def _mark_worker_failed(self, worker_id: str) -> None:
        """ワーカー障害マーク"""
        # 非同期処理として明示的に宣言
        await asyncio.sleep(0)

        self.failed_workers.add(worker_id)

        if worker_id in self.worker_metrics:
            self.worker_metrics[worker_id].state = WorkerState.FAILED

        self.logger.error(f"Worker {worker_id} marked as failed")

        # 自動復旧試行開始
        if self.failover_config.enable_auto_failover:
            # タスクを変数に保存してガベージコレクションを防ぐ
            recovery_task = asyncio.create_task(self._attempt_worker_recovery(worker_id))
            # タスク参照を保持
            if not hasattr(self, '_recovery_tasks'):
                self._recovery_tasks = set()
            self._recovery_tasks.add(recovery_task)

            # 完了時にクリーンアップ
            def cleanup_task(task):
                self._recovery_tasks.discard(task)
            recovery_task.add_done_callback(cleanup_task)

    async def _attempt_worker_recovery(self, worker_id: str) -> None:
        """ワーカー復旧試行"""
        self.recovery_attempts[worker_id] += 1
        recovery_delay = min(300, 30 * self.recovery_attempts[worker_id])  # 最大5分

        self.logger.info(f"Attempting recovery for worker {worker_id} in {recovery_delay}s")

        await asyncio.sleep(recovery_delay)

        # 健康チェック
        if await self._check_worker_health(worker_id):
            await self._restore_worker(worker_id)

    async def _check_worker_health(self, worker_id: str) -> bool:
        """ワーカー健康チェック"""
        try:
            # Celeryワーカー状態確認（非同期実行）
            loop = asyncio.get_event_loop()
            inspector = celery_app.control.inspect()
            active_workers = await loop.run_in_executor(None, inspector.active)

            if active_workers and worker_id in active_workers:
                # 簡単なテストタスク送信（非同期実行）
                result = await loop.run_in_executor(
                    None,
                    lambda: celery_app.send_task('test_health_check', args=[], queue='health_check')
                )

                # タイムアウト付きで結果待機
                try:
                    await asyncio.wait_for(
                        self._wait_for_result(result),
                        timeout=5.0
                    )
                    return True
                except asyncio.TimeoutError:
                    return False

        except Exception as e:
            self.logger.debug(f"Health check failed for {worker_id}: {e}")

        return False

    async def _wait_for_result(self, result) -> None:
        """結果待機（非同期）"""
        while not result.ready():
            await asyncio.sleep(0.1)

    async def _restore_worker(self, worker_id: str) -> None:
        """ワーカー復旧"""
        await asyncio.sleep(0)  # 非同期関数として維持

        self.failed_workers.discard(worker_id)
        self.circuit_breaker_state[worker_id] = False
        self.failure_counts[worker_id] = 0
        self.recovery_attempts[worker_id] = 0

        if worker_id in self.worker_metrics:
            self.worker_metrics[worker_id].state = WorkerState.ACTIVE

        self.logger.info(f"Worker {worker_id} restored successfully")

    # ==========================================
    # リソース最適化システム
    # ==========================================

    async def optimize_resources(self) -> Dict[str, Any]:
        """リソース最適化"""
        optimization_results = {
            'cache_optimization': await self._optimize_cache(),
            'worker_optimization': await self._optimize_workers(),
            'task_optimization': await self._optimize_task_distribution()
        }

        self.logger.info(f"Resource optimization completed: {optimization_results}")
        return optimization_results

    async def _optimize_cache(self) -> Dict[str, Any]:
        """キャッシュ最適化"""
        try:
            cache_stats = await self.cache_service.get_stats()

            optimizations = []

            # ヒット率が低い場合
            if cache_stats.hit_rate < 0.7:
                optimizations.append("increase_ttl")

            # メモリ使用量が高い場合
            if "MB" in cache_stats.memory_usage:
                memory_mb = float(cache_stats.memory_usage.replace("MB", ""))
                if memory_mb > 500:  # 500MB以上
                    optimizations.append("enable_compression")

            return {
                'hit_rate': cache_stats.hit_rate,
                'memory_usage': cache_stats.memory_usage,
                'optimizations': optimizations
            }

        except Exception as e:
            self.logger.error(f"Cache optimization failed: {e}")
            return {'error': str(e)}

    async def _optimize_workers(self) -> Dict[str, Any]:
        """ワーカー最適化"""
        await asyncio.sleep(0)  # 非同期関数として維持

        total_load = sum(metrics.load for metrics in self.worker_metrics.values())
        avg_load = total_load / max(1, len(self.worker_metrics))

        optimizations = []

        # 自動スケーリング判定
        if self.load_config.auto_scale:
            if avg_load > self.load_config.scale_up_threshold:
                if len(self.worker_metrics) < self.load_config.max_workers:
                    optimizations.append("scale_up")

            elif avg_load < self.load_config.scale_down_threshold:
                if len(self.worker_metrics) > self.load_config.min_workers:
                    optimizations.append("scale_down")

        return {
            'avg_load': avg_load,
            'worker_count': len(self.worker_metrics),
            'optimizations': optimizations
        }

    async def _optimize_task_distribution(self) -> Dict[str, Any]:
        """タスク分散最適化"""
        await asyncio.sleep(0)  # 非同期関数として維持

        # タスク分散の偏り検出
        if not self.task_distribution:
            return {'status': 'no_data'}

        task_counts = list(self.task_distribution.values())
        if not task_counts:
            return {'status': 'no_tasks'}

        avg_tasks = sum(task_counts) / len(task_counts)
        max_tasks = max(task_counts)
        min_tasks = min(task_counts)

        # 分散度計算（変動係数）
        variance = sum((count - avg_tasks) ** 2 for count in task_counts) / len(task_counts)
        std_dev = variance ** 0.5
        coefficient_of_variation = std_dev / avg_tasks if avg_tasks > 0 else 0

        optimizations = []
        if coefficient_of_variation > 0.3:  # 30%以上の偏り
            optimizations.append("rebalance_tasks")

        return {
            'avg_tasks': avg_tasks,
            'max_tasks': max_tasks,
            'min_tasks': min_tasks,
            'distribution_variance': coefficient_of_variation,
            'optimizations': optimizations
        }

    # ==========================================
    # 健康監視・監視ループ
    # ==========================================

    async def _health_check_loop(self) -> None:
        """健康チェックループ"""
        while self._running:
            try:
                await self._perform_health_check()
                await asyncio.sleep(self.failover_config.health_check_interval)
            except asyncio.CancelledError:
                # CancelledErrorは再発生させる
                raise
            except Exception as e:
                self.logger.error(f"Health check loop error: {e}")
                await asyncio.sleep(5)

    async def _perform_health_check(self) -> None:
        """健康チェック実行"""
        try:
            # キャッシュ健康度
            cache_health = await self._check_cache_health()

            # ワーカー健康度
            worker_health = await self._check_workers_health()

            # API健康度
            api_health = await self._check_api_health()

            # 全体健康度計算
            overall_health = (cache_health + worker_health + api_health) / 3

            # システム状態判定
            if overall_health >= 0.9:
                state = SystemState.HEALTHY
            elif overall_health >= 0.7:
                state = SystemState.DEGRADED
            elif overall_health >= 0.5:
                state = SystemState.CRITICAL
            else:
                state = SystemState.FAILED

            # 健康状態更新
            self.system_health = SystemHealth(
                state=state,
                cache_health=cache_health,
                worker_health=worker_health,
                api_health=api_health,
                overall_health=overall_health,
                issues=[]
            )

            # メトリクス記録
            self.performance_monitor.record_metric(
                "system_health",
                overall_health,
                MetricType.GAUGE,
                {"component": "orchestrator"}
            )

        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            raise HealthCheckError(f"Health check failed: {e}")

    async def _check_cache_health(self) -> float:
        """キャッシュ健康度チェック"""
        try:
            stats = await self.cache_service.get_stats()

            # ヒット率ベースの健康度
            hit_rate_score = min(1.0, stats.hit_rate / 0.8)  # 80%を満点とする

            # 接続数ベースの健康度
            connection_score = 1.0 if stats.connected_clients > 0 else 0.0

            return (hit_rate_score + connection_score) / 2

        except Exception:
            return 0.0

    async def _check_workers_health(self) -> float:
        """ワーカー健康度チェック"""
        await asyncio.sleep(0)  # 非同期関数として維持

        if not self.worker_metrics:
            return 0.0

        total_workers = len(self.worker_metrics)
        healthy_workers = 0

        for worker_id, metrics in self.worker_metrics.items():
            if (worker_id not in self.failed_workers and
                not self.circuit_breaker_state.get(worker_id, False) and
                metrics.state in [WorkerState.ACTIVE, WorkerState.IDLE]):
                healthy_workers += 1

        return healthy_workers / total_workers

    async def _check_api_health(self) -> float:
        """API健康度チェック"""
        await asyncio.sleep(0)  # 非同期関数として維持

        # パフォーマンス監視からAPI成功率取得
        try:
            api_stats = self.performance_monitor.get_stats("api_calls")
            if api_stats and api_stats.count > 0:
                return api_stats.success_rate
            return 1.0  # データがない場合は正常とみなす
        except Exception:
            return 0.5  # エラーの場合は中間値

    async def _monitoring_loop(self) -> None:
        """監視ループ"""
        while self._running:
            try:
                await self._update_worker_metrics()
                await self._optimize_if_needed()
                await asyncio.sleep(10)  # 10秒間隔
            except asyncio.CancelledError:
                # CancelledErrorは再発生させる
                raise
            except Exception as e:
                self.logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(5)

    async def _update_worker_metrics(self) -> None:
        """ワーカーメトリクス更新"""
        try:
            # 非同期実行
            loop = asyncio.get_event_loop()
            inspector = celery_app.control.inspect()

            # アクティブタスク（非同期実行）
            active_tasks = await loop.run_in_executor(None, inspector.active) or {}

            # 統計情報（非同期実行）
            stats = await loop.run_in_executor(None, inspector.stats) or {}

            for worker_id in self.worker_metrics:
                metrics = self.worker_metrics[worker_id]

                # アクティブタスク数
                worker_active = active_tasks.get(worker_id, [])
                metrics.active_tasks = len(worker_active)

                # 負荷計算（アクティブタスク数ベース）
                metrics.load = min(1.0, metrics.active_tasks / self.load_config.max_tasks_per_worker)

                # 統計情報更新
                worker_stats = stats.get(worker_id, {})
                if worker_stats:
                    pool_stats = worker_stats.get('pool', {})
                    if pool_stats:
                        metrics.memory_usage = pool_stats.get('memory', 0)

                metrics.last_activity = datetime.now()

        except Exception as e:
            self.logger.debug(f"Worker metrics update failed: {e}")

    async def _optimize_if_needed(self) -> None:
        """必要に応じて最適化実行"""
        await asyncio.sleep(0)  # 非同期関数として維持

        # 定期的な最適化（1時間に1回）
        current_time = datetime.now()
        if not hasattr(self, '_last_optimization'):
            self._last_optimization = current_time

        if (current_time - self._last_optimization).total_seconds() > 3600:
            await self.optimize_resources()
            self._last_optimization = current_time
            await self.optimize_resources()
            self._last_optimization = current_time

    # ==========================================
    # 公開API
    # ==========================================

    def get_system_status(self) -> Dict[str, Any]:
        """システム状態取得"""
        return {
            'system_health': {
                'state': self.system_health.state.value,
                'overall_health': self.system_health.overall_health,
                'cache_health': self.system_health.cache_health,
                'worker_health': self.system_health.worker_health,
                'api_health': self.system_health.api_health,
                'last_check': self.system_health.last_check.isoformat(),
                'issues': self.system_health.issues
            },
            'workers': {
                worker_id: {
                    'state': metrics.state.value,
                    'load': metrics.load,
                    'active_tasks': metrics.active_tasks,
                    'completed_tasks': metrics.completed_tasks,
                    'failed_tasks': metrics.failed_tasks,
                    'response_time': metrics.response_time,
                    'last_activity': metrics.last_activity.isoformat()
                }
                for worker_id, metrics in self.worker_metrics.items()
            },
            'load_balancing': {
                'algorithm': self.load_config.algorithm,
                'auto_scale': self.load_config.auto_scale,
                'current_workers': len(self.worker_metrics),
                'failed_workers': len(self.failed_workers),
                'circuit_breakers': sum(1 for active in self.circuit_breaker_state.values() if active)
            }
        }

    async def force_failover(self, worker_id: str) -> bool:
        """強制フェイルオーバー"""
        try:
            await self._mark_worker_failed(worker_id)
            self.logger.info(f"Forced failover for worker {worker_id}")
            return True
        except Exception as e:
            self.logger.error(f"Force failover failed for {worker_id}: {e}")
            return False

    def reset_circuit_breaker(self, worker_id: str) -> bool:
        """サーキットブレーカーリセット"""
        try:
            self.circuit_breaker_state[worker_id] = False
            self.failure_counts[worker_id] = 0
            self.logger.info(f"Circuit breaker reset for worker {worker_id}")
            return True
        except Exception as e:
            self.logger.error(f"Circuit breaker reset failed for {worker_id}: {e}")
            return False

    @asynccontextmanager
    async def managed_task_execution(self, task_type: str, priority: int = 5):
        """管理されたタスク実行コンテキスト"""
        worker_id = await self.get_optimal_worker(task_type, priority)

        if not worker_id:
            raise OrchestrationError("No available workers")

        start_time = time.time()

        try:
            # タスク開始記録
            if worker_id in self.worker_metrics:
                self.worker_metrics[worker_id].active_tasks += 1
            self.task_distribution[worker_id] += 1

            yield worker_id

            # 成功記録
            if worker_id in self.worker_metrics:
                self.worker_metrics[worker_id].completed_tasks += 1

        except Exception as e:
            # 失敗記録
            if worker_id in self.worker_metrics:
                self.worker_metrics[worker_id].failed_tasks += 1

            # 障害処理
            await self.handle_worker_failure(worker_id, e)
            raise

        finally:
            # タスク終了記録
            if worker_id in self.worker_metrics:
                self.worker_metrics[worker_id].active_tasks = max(0, self.worker_metrics[worker_id].active_tasks - 1)

            # レスポンス時間記録
            response_time = (time.time() - start_time) * 1000  # ms
            if worker_id in self.worker_metrics:
                self.worker_metrics[worker_id].response_time = response_time
