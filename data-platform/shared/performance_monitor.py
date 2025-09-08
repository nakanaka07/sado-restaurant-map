#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Performance Monitor - パフォーマンス監視・メトリクスシステム

API呼び出し、データ処理、ストレージ操作のパフォーマンスを追跡
Phase 2改善: 監視・メトリクス強化
"""

import time
import threading
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from contextlib import contextmanager
from enum import Enum

from shared.logger import get_logger


class MetricType(Enum):
    """メトリクスタイプ"""
    COUNTER = "counter"       # カウンター（累積値）
    GAUGE = "gauge"          # ゲージ（現在値）
    HISTOGRAM = "histogram"   # ヒストグラム（分布）
    TIMER = "timer"          # タイマー（実行時間）


@dataclass
class MetricValue:
    """メトリクス値"""
    value: float
    timestamp: datetime = field(default_factory=datetime.now)
    labels: Dict[str, str] = field(default_factory=dict)


@dataclass
class PerformanceStats:
    """パフォーマンス統計"""
    count: int = 0
    total_time: float = 0.0
    min_time: float = float('inf')
    max_time: float = 0.0
    avg_time: float = 0.0
    success_count: int = 0
    error_count: int = 0
    success_rate: float = 0.0

    def add_measurement(self, duration: float, success: bool = True) -> None:
        """測定値を追加"""
        self.count += 1
        self.total_time += duration
        self.min_time = min(self.min_time, duration)
        self.max_time = max(self.max_time, duration)
        self.avg_time = self.total_time / self.count

        if success:
            self.success_count += 1
        else:
            self.error_count += 1

        self.success_rate = self.success_count / self.count if self.count > 0 else 0.0


@dataclass
class APIMetrics:
    """API関連メトリクス"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_cost: float = 0.0
    rate_limit_hits: int = 0
    response_times: deque = field(default_factory=lambda: deque(maxlen=1000))
    requests_by_endpoint: Dict[str, int] = field(default_factory=dict)
    cost_by_operation: Dict[str, float] = field(default_factory=dict)

    def add_request(self, endpoint: str, duration: float, success: bool, cost: float = 0.0) -> None:
        """API リクエストを記録"""
        self.total_requests += 1
        self.total_cost += cost
        self.response_times.append(duration)

        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1

        # エンドポイント別統計
        if endpoint not in self.requests_by_endpoint:
            self.requests_by_endpoint[endpoint] = 0
        self.requests_by_endpoint[endpoint] += 1

        # コスト別統計
        if endpoint not in self.cost_by_operation:
            self.cost_by_operation[endpoint] = 0.0
        self.cost_by_operation[endpoint] += cost

    def get_success_rate(self) -> float:
        """成功率を取得"""
        return self.successful_requests / self.total_requests if self.total_requests > 0 else 0.0

    def get_avg_response_time(self) -> float:
        """平均応答時間を取得"""
        return sum(self.response_times) / len(self.response_times) if self.response_times else 0.0


class PerformanceMonitor:
    """パフォーマンス監視クラス"""

    def __init__(self, component_name: str = "unknown"):
        """PerformanceMonitor初期化"""
        self._component_name = component_name
        self._logger = get_logger(f"PerformanceMonitor.{component_name}")
        self._lock = threading.Lock()

        # メトリクス保存
        self._metrics: Dict[str, List[MetricValue]] = defaultdict(list)
        self._performance_stats: Dict[str, PerformanceStats] = defaultdict(PerformanceStats)
        self._api_metrics = APIMetrics()

        # 設定
        self._max_history = 10000  # 最大履歴保持数
        self._cleanup_interval = 3600  # クリーンアップ間隔（秒）
        self._last_cleanup = time.time()

    @contextmanager
    def measure_time(self, operation_name: str, labels: Optional[Dict[str, str]] = None):
        """実行時間を測定するコンテキストマネージャー"""
        start_time = time.time()
        success = True
        error = None

        try:
            yield
        except Exception as e:
            success = False
            error = e
            raise
        finally:
            duration = time.time() - start_time
            self.record_timing(operation_name, duration, success, labels)

            if error:
                self._logger.warning(f"Operation failed: {operation_name}",
                                   duration=duration, error=str(error))

    def record_timing(
        self,
        operation_name: str,
        duration: float,
        success: bool = True,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """実行時間を記録"""
        with self._lock:
            # パフォーマンス統計更新
            self._performance_stats[operation_name].add_measurement(duration, success)

            # メトリクス記録
            self._record_metric(f"{operation_name}.duration", duration, MetricType.TIMER, labels)
            self._record_metric(f"{operation_name}.count", 1, MetricType.COUNTER, labels)

            if success:
                self._record_metric(f"{operation_name}.success", 1, MetricType.COUNTER, labels)
            else:
                self._record_metric(f"{operation_name}.error", 1, MetricType.COUNTER, labels)

    def record_api_request(
        self,
        endpoint: str,
        duration: float,
        success: bool,
        cost: float = 0.0,
        rate_limited: bool = False
    ) -> None:
        """API リクエストを記録"""
        with self._lock:
            self._api_metrics.add_request(endpoint, duration, success, cost)

            if rate_limited:
                self._api_metrics.rate_limit_hits += 1

            # メトリクス記録
            labels = {"endpoint": endpoint}
            self._record_metric("api.request.duration", duration, MetricType.TIMER, labels)
            self._record_metric("api.request.cost", cost, MetricType.COUNTER, labels)

            if success:
                self._record_metric("api.request.success", 1, MetricType.COUNTER, labels)
            else:
                self._record_metric("api.request.error", 1, MetricType.COUNTER, labels)

    def record_metric(
        self,
        name: str,
        value: float,
        metric_type: MetricType = MetricType.GAUGE,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """カスタムメトリクスを記録"""
        with self._lock:
            self._record_metric(name, value, metric_type, labels)

    def _record_metric(
        self,
        name: str,
        value: float,
        _metric_type: MetricType,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """内部メトリクス記録"""
        metric_value = MetricValue(value=value, labels=labels or {})
        self._metrics[name].append(metric_value)        # 履歴サイズ制限
        if len(self._metrics[name]) > self._max_history:
            self._metrics[name] = self._metrics[name][-self._max_history:]

        # 定期クリーンアップ
        current_time = time.time()
        if current_time - self._last_cleanup > self._cleanup_interval:
            self._cleanup_old_metrics()
            self._last_cleanup = current_time

    def _cleanup_old_metrics(self) -> None:
        """古いメトリクスをクリーンアップ"""
        cutoff_time = datetime.now() - timedelta(hours=24)

        for name, values in self._metrics.items():
            # 24時間以上古いメトリクスを削除
            recent_values = [v for v in values if v.timestamp > cutoff_time]
            self._metrics[name] = recent_values

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

    def get_metric_summary(self, name: str, time_window: timedelta = timedelta(hours=1)) -> Dict[str, Any]:
        """メトリクスサマリーを取得"""
        with self._lock:
            if name not in self._metrics:
                return {}

            cutoff_time = datetime.now() - time_window
            recent_values = [v.value for v in self._metrics[name] if v.timestamp > cutoff_time]

            if not recent_values:
                return {}

            return {
                "count": len(recent_values),
                "sum": sum(recent_values),
                "avg": sum(recent_values) / len(recent_values),
                "min": min(recent_values),
                "max": max(recent_values),
                "latest": recent_values[-1] if recent_values else None
            }

    def get_system_health(self) -> Dict[str, Any]:
        """システム健全性レポートを生成"""
        with self._lock:
            api_success_rate = self._api_metrics.get_success_rate()
            avg_response_time = self._api_metrics.get_avg_response_time()

            # 健全性判定
            health_status = "healthy"
            issues = []

            if api_success_rate < 0.9:
                health_status = "degraded"
                issues.append(f"API成功率が低下: {api_success_rate:.1%}")

            if avg_response_time > 5.0:
                health_status = "warning" if health_status == "healthy" else health_status
                issues.append(f"API応答時間が遅延: {avg_response_time:.2f}s")

            if self._api_metrics.rate_limit_hits > 10:
                health_status = "warning" if health_status == "healthy" else health_status
                issues.append(f"レート制限に頻繁にヒット: {self._api_metrics.rate_limit_hits}回")

            return {
                "status": health_status,
                "component": self._component_name,
                "api_success_rate": api_success_rate,
                "avg_response_time": avg_response_time,
                "total_api_requests": self._api_metrics.total_requests,
                "total_api_cost": self._api_metrics.total_cost,
                "rate_limit_hits": self._api_metrics.rate_limit_hits,
                "issues": issues,
                "timestamp": datetime.now()
            }

    def export_metrics(self, format: str = "dict") -> Dict[str, Any]:
        """メトリクスをエクスポート"""
        with self._lock:
            if format == "prometheus":
                return self._export_prometheus_format()
            else:
                return {
                    "performance_stats": dict(self._performance_stats),
                    "api_metrics": self._api_metrics,
                    "custom_metrics": {
                        name: [{"value": v.value, "timestamp": v.timestamp.isoformat(), "labels": v.labels}
                               for v in values[-100:]]  # 最新100件
                        for name, values in self._metrics.items()
                    }
                }

    def _export_prometheus_format(self) -> Dict[str, Any]:
        """Prometheus形式でメトリクスをエクスポート"""
        prometheus_metrics = {}

        # API メトリクス
        prometheus_metrics["api_requests_total"] = self._api_metrics.total_requests
        prometheus_metrics["api_requests_successful_total"] = self._api_metrics.successful_requests
        prometheus_metrics["api_requests_failed_total"] = self._api_metrics.failed_requests
        prometheus_metrics["api_cost_total"] = self._api_metrics.total_cost
        prometheus_metrics["api_rate_limit_hits_total"] = self._api_metrics.rate_limit_hits

        # パフォーマンス統計
        for name, stats in self._performance_stats.items():
            prometheus_metrics[f"operation_duration_seconds_total{{operation=\"{name}\"}}"] = stats.total_time
            prometheus_metrics[f"operation_count_total{{operation=\"{name}\"}}"] = stats.count
            prometheus_metrics[f"operation_success_rate{{operation=\"{name}\"}}"] = stats.success_rate

        return prometheus_metrics

    def reset_metrics(self) -> None:
        """すべてのメトリクスをリセット"""
        with self._lock:
            self._metrics.clear()
            self._performance_stats.clear()
            self._api_metrics = APIMetrics()
            self._logger.info("All metrics reset")


def create_performance_monitor(component_name: str) -> PerformanceMonitor:
    """PerformanceMonitor のファクトリ関数"""
    return PerformanceMonitor(component_name)
