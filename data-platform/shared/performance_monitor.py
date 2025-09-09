#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Performance Monitor - パフォーマンス監視・メトリクスシステム

API呼び出し、データ処理、ストレージ操作のパフォーマンスを追跡
Performance optimizations:
- Memory-efficient data structures
- Bounded collections to prevent memory leaks
- La    def record_metric(
        self,
        name: str,
        value: float,
        tags: Optional[Dict[str, str]] = None
    ) -> None:ic calculation
- Optimized string operations
"""

import time
import threading
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Tuple
from contextlib import contextmanager
from enum import Enum
import weakref
import gc

from shared.logger import get_logger


class MetricType(Enum):
    """メトリクスタイプ"""
    COUNTER = "counter"       # カウンター（累積値）
    GAUGE = "gauge"          # ゲージ（現在値）
    HISTOGRAM = "histogram"   # ヒストグラム（分布）
    TIMER = "timer"          # タイマー（実行時間）


@dataclass(slots=True)  # Memory optimization: use __slots__
class MetricValue:
    """メトリクス値 - メモリ効率最適化版"""
    value: float
    timestamp: datetime = field(default_factory=datetime.now)
    labels: Optional[Dict[str, str]] = None

    def __post_init__(self):
        # Avoid empty dict creation for memory efficiency
        if self.labels is None:
            self.labels = {}


@dataclass(slots=True)  # Memory optimization
class PerformanceStats:
    """パフォーマンス統計 - 最適化版"""
    count: int = 0
    total_time: float = 0.0
    min_time: float = float('inf')
    max_time: float = 0.0
    _avg_time: Optional[float] = None  # Lazy calculation
    success_count: int = 0
    error_count: int = 0
    _success_rate: Optional[float] = None  # Lazy calculation

    @property
    def avg_time(self) -> float:
        """Lazy calculation of average time."""
        if self._avg_time is None and self.count > 0:
            self._avg_time = self.total_time / self.count
        return self._avg_time or 0.0

    @property
    def success_rate(self) -> float:
        """Lazy calculation of success rate."""
        if self._success_rate is None and self.count > 0:
            self._success_rate = self.success_count / self.count
        return self._success_rate or 0.0

    def add_measurement(self, duration: float, success: bool = True) -> None:
        """測定値を追加 - 最適化版"""
        self.count += 1
        self.total_time += duration

        # Optimized min/max calculation
        if duration < self.min_time:
            self.min_time = duration
        if duration > self.max_time:
            self.max_time = duration

        # Update success/error counts
        if success:
            self.success_count += 1
        else:
            self.error_count += 1

        # Invalidate cached calculations
        self._avg_time = None
        self._success_rate = None


@dataclass(slots=True)  # Memory optimization
class APIMetrics:
    """API関連メトリクス - メモリ効率最適化版"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_cost: float = 0.0
    rate_limit_hits: int = 0

    # Bounded collections to prevent memory leaks
    response_times: deque = field(default_factory=lambda: deque(maxlen=500))  # Reduced from 1000
    requests_by_endpoint: Dict[str, int] = field(default_factory=dict)
    cost_by_operation: Dict[str, float] = field(default_factory=dict)

    def add_request(self, endpoint: str, duration: float, success: bool, cost: float = 0.0) -> None:
        """API リクエストを記録 - 最適化版"""
        self.total_requests += 1
        self.total_cost += cost
        self.response_times.append(duration)

        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1

        # Memory-efficient endpoint tracking
        self.requests_by_endpoint[endpoint] = self.requests_by_endpoint.get(endpoint, 0) + 1
        self.cost_by_operation[endpoint] = self.cost_by_operation.get(endpoint, 0.0) + cost

    def get_success_rate(self) -> float:
        """成功率を取得"""
        return self.successful_requests / self.total_requests if self.total_requests > 0 else 0.0

    def get_avg_response_time(self) -> float:
        """平均レスポンス時間を取得 - 最適化版"""
        if not self.response_times:
            return 0.0
        return sum(self.response_times) / len(self.response_times)

    def get_percentile_response_time(self, percentile: float) -> float:
        """レスポンス時間のパーセンタイルを取得 - 最適化版"""
        if not self.response_times:
            return 0.0

        sorted_times = sorted(self.response_times)
        index = int((percentile / 100.0) * len(sorted_times))
        return sorted_times[min(index, len(sorted_times) - 1)]


class PerformanceMonitor:
    """パフォーマンス監視クラス - メモリ効率最適化版"""

    __slots__ = (
        '_component_name', '_logger', '_lock', '_metrics',
        '_performance_stats', '_api_metrics', '_max_history',
        '_cleanup_interval', '_last_cleanup'
    )

    def __init__(self, component_name: str = "unknown"):
        """PerformanceMonitor初期化 - 最適化版"""
        self._component_name = component_name
        self._logger = get_logger(f"PerformanceMonitor.{component_name}")
        self._lock = threading.Lock()

        # メトリクス保存 - メモリ効率化
        self._metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))  # Bounded
        self._performance_stats: Dict[str, PerformanceStats] = {}
        self._api_metrics = APIMetrics()

        # 設定 - メモリ使用量削減
        self._max_history = 5000  # 最大履歴保持数を削減 (10000 -> 5000)
        self._cleanup_interval = 1800  # クリーンアップ間隔を短縮 (3600 -> 1800)
        self._last_cleanup = time.time()

    @contextmanager
    def measure_time(self, operation_name: str, labels: Optional[Dict[str, str]] = None):
        """実行時間を測定するコンテキストマネージャー - 最適化版"""
        start_time = time.perf_counter()  # より高精度なタイマー
        success = True

        try:
            yield
        except Exception:
            success = False
            raise
        finally:
            end_time = time.perf_counter()
            duration = end_time - start_time

            # 最適化: 必要な場合のみロックを取得
            self._record_measurement(operation_name, duration, success, labels)

    def _record_measurement(self, operation_name: str, duration: float,
                          success: bool, labels: Optional[Dict[str, str]] = None) -> None:
        """測定結果を記録 - 最適化版"""
        with self._lock:
            # パフォーマンス統計の更新
            if operation_name not in self._performance_stats:
                self._performance_stats[operation_name] = PerformanceStats()

            self._performance_stats[operation_name].add_measurement(duration, success)

            # メトリクス記録 - メモリ効率化
            metric_value = MetricValue(value=duration, labels=labels)
            self._metrics[operation_name].append(metric_value)

            # 定期的なクリーンアップ
            current_time = time.time()
            if current_time - self._last_cleanup > self._cleanup_interval:
                self._cleanup_old_metrics()
                self._last_cleanup = current_time

    def _cleanup_old_metrics(self) -> None:
        """古いメトリクスのクリーンアップ - メモリリーク防止"""
        for operation_name, metrics_deque in self._metrics.items():
            # dequeは自動的にmaxlenで制限されるため、追加のクリーンアップは不要
            pass

        # ガベージコレクションの強制実行（必要に応じて）
    def record_timing(
        self,
        operation_name: str,
        duration: float,
        success: bool = True,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """実行時間を記録 - 最適化版"""
        self._record_measurement(operation_name, duration, success, labels)

    def record_api_request(
        self,
        endpoint: str,
        duration: float,
        success: bool,
        cost: float = 0.0,
        rate_limited: bool = False
    ) -> None:
        """API リクエストを記録 - 最適化版"""
        with self._lock:
            self._api_metrics.add_request(endpoint, duration, success, cost)

            if rate_limited:
                self._api_metrics.rate_limit_hits += 1

            # メトリクス記録 - メモリ効率化
            labels = {"endpoint": endpoint}
            self._record_measurement(f"api.request.{endpoint}", duration, success, labels)

    def record_metric(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """カスタムメトリクスを記録 - 最適化版"""
        with self._lock:
            metric_value = MetricValue(value=value, labels=labels)
            self._metrics[name].append(metric_value)

    def get_performance_stats(self, operation_name: Optional[str] = None) -> Dict[str, PerformanceStats]:
        """パフォーマンス統計を取得"""
        with self._lock:
            if operation_name:
                return {operation_name: self._performance_stats.get(operation_name, PerformanceStats())}
            return dict(self._performance_stats)

    def get_api_metrics(self) -> APIMetrics:
        """API メトリクスを取得"""
        with self._lock:
            return self._api_metrics

    def get_system_stats(self) -> Dict[str, Any]:
        """システム統計を取得 - 最適化版"""
        with self._lock:
            total_operations = sum(stats.count for stats in self._performance_stats.values())
            total_errors = sum(stats.error_count for stats in self._performance_stats.values())

            return {
                "component": self._component_name,
                "total_operations": total_operations,
                "total_errors": total_errors,
                "error_rate": total_errors / total_operations if total_operations > 0 else 0.0,
                "active_metrics": len(self._metrics),
                "api_metrics": {
                    "total_requests": self._api_metrics.total_requests,
                    "success_rate": self._api_metrics.get_success_rate(),
                    "total_cost": self._api_metrics.total_cost,
                    "avg_response_time": self._api_metrics.get_avg_response_time()
                }
            }

    def export_metrics(self, format_type: str = "dict") -> Any:
        """メトリクスをエクスポート - 最適化版"""
        with self._lock:
            if format_type == "dict":
                return {
                    "performance_stats": {name: {
                        "count": stats.count,
                        "avg_time": stats.avg_time,
                        "success_rate": stats.success_rate
                    } for name, stats in self._performance_stats.items()},
                    "api_metrics": {
                        "total_requests": self._api_metrics.total_requests,
                        "success_rate": self._api_metrics.get_success_rate(),
                        "total_cost": self._api_metrics.total_cost
                    }
                }

            elif format_type == "prometheus":
                # Prometheus形式での出力（簡略版）
                lines = []
                for name, stats in self._performance_stats.items():
                    lines.append(f"operation_count_total{{operation=\"{name}\"}} {stats.count}")
                    lines.append(f"operation_duration_avg{{operation=\"{name}\"}} {stats.avg_time}")
                    lines.append(f"operation_success_rate{{operation=\"{name}\"}} {stats.success_rate}")

                return "\n".join(lines)

            else:
                raise ValueError(f"Unsupported format: {format_type}")

    def reset_metrics(self) -> None:
        """メトリクスをリセット"""
        with self._lock:
            self._metrics.clear()
            self._performance_stats.clear()
            self._api_metrics = APIMetrics()
            self._last_cleanup = time.time()
            gc.collect()  # メモリクリーンアップ

    def __del__(self):
        """デストラクタ - リソースクリーンアップ"""
        try:
            self.reset_metrics()
        except Exception:
            pass  # デストラクタでの例外は無視


def create_performance_monitor(component_name: str) -> PerformanceMonitor:
    """PerformanceMonitor のファクトリ関数"""
    return PerformanceMonitor(component_name)
