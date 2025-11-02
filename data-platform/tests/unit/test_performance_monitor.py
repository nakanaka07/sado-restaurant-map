#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for Performance Monitor

Tests for performance monitoring including:
- Metric recording (counter, gauge, timer)
- Performance statistics calculation
- API metrics tracking
- Context manager for timing
- Thread safety
"""

import pytest
import time
import threading
from datetime import datetime
from collections import deque

from shared.performance_monitor import (
    PerformanceMonitor,
    PerformanceStats,
    APIMetrics,
    MetricValue,
    MetricType,
)


class TestMetricType:
    """Test MetricType enum."""

    def test_enum_values(self):
        """Test that all metric types are defined."""
        assert MetricType.COUNTER.value == "counter"
        assert MetricType.GAUGE.value == "gauge"
        assert MetricType.HISTOGRAM.value == "histogram"
        assert MetricType.TIMER.value == "timer"

    def test_enum_members(self):
        """Test enum member access."""
        assert MetricType.COUNTER in MetricType
        assert MetricType.GAUGE in MetricType


class TestMetricValue:
    """Test MetricValue dataclass."""

    def test_init_with_defaults(self):
        """Test initialization with default values."""
        metric = MetricValue(value=10.5)

        assert metric.value == 10.5
        assert isinstance(metric.timestamp, datetime)
        assert metric.labels == {}

    def test_init_with_labels(self):
        """Test initialization with labels."""
        labels = {"endpoint": "api/v1", "method": "GET"}
        metric = MetricValue(value=20.0, labels=labels)

        assert metric.value == 20.0
        assert metric.labels == labels

    def test_post_init_creates_empty_labels(self):
        """Test that __post_init__ creates empty labels dict."""
        metric = MetricValue(value=5.0, labels=None)
        assert metric.labels == {}


class TestPerformanceStats:
    """Test PerformanceStats dataclass."""

    def test_init_defaults(self):
        """Test initialization with default values."""
        stats = PerformanceStats()

        assert stats.count == 0
        assert stats.total_time == 0.0
        assert stats.min_time == float('inf')
        assert stats.max_time == 0.0
        assert stats.success_count == 0
        assert stats.error_count == 0

    def test_add_measurement_success(self):
        """Test adding successful measurement."""
        stats = PerformanceStats()
        stats.add_measurement(1.5, success=True)

        assert stats.count == 1
        assert stats.total_time == 1.5
        assert stats.min_time == 1.5
        assert stats.max_time == 1.5
        assert stats.success_count == 1
        assert stats.error_count == 0

    def test_add_measurement_failure(self):
        """Test adding failed measurement."""
        stats = PerformanceStats()
        stats.add_measurement(2.0, success=False)

        assert stats.count == 1
        assert stats.error_count == 1
        assert stats.success_count == 0

    def test_add_multiple_measurements(self):
        """Test adding multiple measurements."""
        stats = PerformanceStats()
        stats.add_measurement(1.0, success=True)
        stats.add_measurement(2.0, success=True)
        stats.add_measurement(3.0, success=False)

        assert stats.count == 3
        assert stats.total_time == 6.0
        assert stats.min_time == 1.0
        assert stats.max_time == 3.0
        assert stats.success_count == 2
        assert stats.error_count == 1

    def test_avg_time_calculation(self):
        """Test average time calculation (lazy)."""
        stats = PerformanceStats()
        stats.add_measurement(1.0, success=True)
        stats.add_measurement(3.0, success=True)

        assert stats.avg_time == 2.0

    def test_avg_time_zero_count(self):
        """Test average time with zero measurements."""
        stats = PerformanceStats()
        assert stats.avg_time == 0.0

    def test_success_rate_calculation(self):
        """Test success rate calculation (lazy)."""
        stats = PerformanceStats()
        stats.add_measurement(1.0, success=True)
        stats.add_measurement(1.0, success=True)
        stats.add_measurement(1.0, success=False)

        assert stats.success_rate == pytest.approx(2/3, rel=0.01)

    def test_success_rate_zero_count(self):
        """Test success rate with zero measurements."""
        stats = PerformanceStats()
        assert stats.success_rate == 0.0

    def test_lazy_calculation_invalidation(self):
        """Test that cached calculations are invalidated on new measurement."""
        stats = PerformanceStats()
        stats.add_measurement(1.0, success=True)

        # Access properties to trigger caching
        _ = stats.avg_time
        _ = stats.success_rate

        # Add another measurement
        stats.add_measurement(3.0, success=True)

        # Verify new calculations
        assert stats.avg_time == 2.0
        assert stats.success_rate == 1.0


class TestAPIMetrics:
    """Test APIMetrics dataclass."""

    def test_init_defaults(self):
        """Test initialization with default values."""
        metrics = APIMetrics()

        assert metrics.total_requests == 0
        assert metrics.successful_requests == 0
        assert metrics.failed_requests == 0
        assert metrics.total_cost == 0.0
        assert metrics.rate_limit_hits == 0
        assert isinstance(metrics.response_times, deque)
        assert metrics.response_times.maxlen == 500

    def test_add_successful_request(self):
        """Test adding successful request."""
        metrics = APIMetrics()
        metrics.add_request("api/places", 1.5, success=True, cost=0.01)

        assert metrics.total_requests == 1
        assert metrics.successful_requests == 1
        assert metrics.failed_requests == 0
        assert metrics.total_cost == 0.01
        assert len(metrics.response_times) == 1
        assert metrics.requests_by_endpoint["api/places"] == 1

    def test_add_failed_request(self):
        """Test adding failed request."""
        metrics = APIMetrics()
        metrics.add_request("api/search", 2.0, success=False, cost=0.02)

        assert metrics.total_requests == 1
        assert metrics.successful_requests == 0
        assert metrics.failed_requests == 1

    def test_add_multiple_requests(self):
        """Test adding multiple requests."""
        metrics = APIMetrics()
        metrics.add_request("api/places", 1.0, success=True, cost=0.01)
        metrics.add_request("api/places", 1.5, success=True, cost=0.01)
        metrics.add_request("api/search", 2.0, success=False, cost=0.02)

        assert metrics.total_requests == 3
        assert metrics.requests_by_endpoint["api/places"] == 2
        assert metrics.requests_by_endpoint["api/search"] == 1
        assert metrics.cost_by_operation["api/places"] == 0.02
        assert metrics.cost_by_operation["api/search"] == 0.02

    def test_get_success_rate(self):
        """Test success rate calculation."""
        metrics = APIMetrics()
        metrics.add_request("api/test", 1.0, success=True)
        metrics.add_request("api/test", 1.0, success=True)
        metrics.add_request("api/test", 1.0, success=False)

        assert metrics.get_success_rate() == pytest.approx(2/3, rel=0.01)

    def test_get_success_rate_zero_requests(self):
        """Test success rate with zero requests."""
        metrics = APIMetrics()
        assert metrics.get_success_rate() == 0.0

    def test_get_avg_response_time(self):
        """Test average response time calculation."""
        metrics = APIMetrics()
        metrics.add_request("api/test", 1.0, success=True)
        metrics.add_request("api/test", 2.0, success=True)
        metrics.add_request("api/test", 3.0, success=True)

        assert metrics.get_avg_response_time() == 2.0

    def test_get_avg_response_time_empty(self):
        """Test average response time with no data."""
        metrics = APIMetrics()
        assert metrics.get_avg_response_time() == 0.0

    def test_get_percentile_response_time(self):
        """Test percentile response time calculation."""
        metrics = APIMetrics()
        for i in range(1, 11):
            metrics.add_request("api/test", float(i), success=True)

        # Test different percentiles
        p50 = metrics.get_percentile_response_time(50)
        p95 = metrics.get_percentile_response_time(95)

        # Percentile calculation may vary by implementation
        assert 5.0 <= p50 <= 6.0  # Allow for different percentile algorithms
        assert 9.0 <= p95 <= 10.0

    def test_get_percentile_response_time_empty(self):
        """Test percentile with no data."""
        metrics = APIMetrics()
        assert metrics.get_percentile_response_time(50) == 0.0

    def test_response_times_bounded(self):
        """Test that response_times is bounded to maxlen."""
        metrics = APIMetrics()

        # Add more than maxlen (500) requests
        for i in range(600):
            metrics.add_request("api/test", 1.0, success=True)

        # Should only keep last 500
        assert len(metrics.response_times) == 500


class TestPerformanceMonitor:
    """Test PerformanceMonitor class."""

    def test_init(self):
        """Test initialization."""
        monitor = PerformanceMonitor("test_component")

        assert monitor._component_name == "test_component"
        assert monitor._max_history == 5000
        assert monitor._cleanup_interval == 1800

    def test_record_timing(self):
        """Test recording timing measurement."""
        monitor = PerformanceMonitor("test")
        monitor.record_timing("operation1", 1.5, success=True)

        stats = monitor.get_performance_stats("operation1")
        assert "operation1" in stats
        assert stats["operation1"].count == 1
        assert stats["operation1"].total_time == 1.5

    def test_record_timing_with_labels(self):
        """Test recording timing with labels."""
        monitor = PerformanceMonitor("test")
        labels = {"type": "api", "method": "GET"}
        monitor.record_timing("operation2", 2.0, success=True, labels=labels)

        stats = monitor.get_performance_stats("operation2")
        assert "operation2" in stats
        assert stats["operation2"].count == 1

    def test_measure_time_context_manager_success(self):
        """Test measure_time context manager with successful operation."""
        monitor = PerformanceMonitor("test")

        with monitor.measure_time("test_operation"):
            time.sleep(0.01)  # Simulate work

        stats = monitor.get_performance_stats("test_operation")
        assert "test_operation" in stats
        assert stats["test_operation"].count == 1
        assert stats["test_operation"].success_count == 1
        assert stats["test_operation"].total_time > 0.01

    def test_measure_time_context_manager_failure(self):
        """Test measure_time context manager with failed operation."""
        monitor = PerformanceMonitor("test")

        with pytest.raises(ValueError):
            with monitor.measure_time("failing_operation"):
                raise ValueError("Test error")

        stats = monitor.get_performance_stats("failing_operation")
        assert "failing_operation" in stats
        assert stats["failing_operation"].count == 1
        assert stats["failing_operation"].error_count == 1

    def test_record_api_request(self):
        """Test recording API request."""
        monitor = PerformanceMonitor("test")
        monitor.record_api_request(
            endpoint="api/places",
            duration=1.5,
            success=True,
            cost=0.01,
            rate_limited=False
        )

        api_metrics = monitor.get_api_metrics()
        assert api_metrics.total_requests == 1
        assert api_metrics.successful_requests == 1
        assert api_metrics.total_cost == 0.01

    def test_record_api_request_with_rate_limit(self):
        """Test recording API request with rate limit."""
        monitor = PerformanceMonitor("test")
        monitor.record_api_request(
            endpoint="api/search",
            duration=2.0,
            success=False,
            rate_limited=True
        )

        api_metrics = monitor.get_api_metrics()
        assert api_metrics.rate_limit_hits == 1

    def test_record_metric(self):
        """Test recording custom metric."""
        monitor = PerformanceMonitor("test")
        monitor.record_metric("custom_metric", 42.0)

        # Verify metric was recorded
        assert "custom_metric" in monitor._metrics
        assert len(monitor._metrics["custom_metric"]) == 1

    def test_record_metric_with_labels(self):
        """Test recording custom metric with labels."""
        monitor = PerformanceMonitor("test")
        labels = {"region": "us-west", "env": "prod"}
        monitor.record_metric("response_time", 100.0, labels=labels)

        assert "response_time" in monitor._metrics

    def test_get_performance_stats(self):
        """Test getting performance stats."""
        monitor = PerformanceMonitor("test")
        monitor.record_timing("op1", 1.0, success=True)
        monitor.record_timing("op1", 2.0, success=True)

        stats = monitor.get_performance_stats("op1")
        assert "op1" in stats
        assert stats["op1"].count == 2
        assert stats["op1"].avg_time == 1.5

    def test_get_performance_stats_all(self):
        """Test getting all performance stats."""
        monitor = PerformanceMonitor("test")
        monitor.record_timing("op1", 1.0, success=True)
        monitor.record_timing("op2", 2.0, success=True)

        stats = monitor.get_performance_stats()
        assert "op1" in stats
        assert "op2" in stats

    def test_get_api_metrics(self):
        """Test getting API metrics."""
        monitor = PerformanceMonitor("test")
        monitor.record_api_request("api/test", 1.0, success=True, cost=0.01)

        metrics = monitor.get_api_metrics()
        assert metrics.total_requests == 1
        assert metrics.successful_requests == 1

    def test_get_system_stats(self):
        """Test getting system stats summary."""
        monitor = PerformanceMonitor("test")
        monitor.record_timing("op1", 1.0, success=True)
        monitor.record_timing("op1", 2.0, success=False)
        monitor.record_api_request("api/test", 2.0, success=True, cost=0.01)

        summary = monitor.get_system_stats()
        assert isinstance(summary, dict)
        assert summary["component"] == "test"
        # record_api_request also creates a metric, so total is 3 (op1 x2 + api.request.api/test x1)
        assert summary["total_operations"] == 3
        assert summary["total_errors"] == 1
        assert "api_metrics" in summary

    def test_thread_safety(self):
        """Test thread safety of concurrent operations."""
        monitor = PerformanceMonitor("test")

        def record_measurements():
            for i in range(100):
                monitor.record_timing("thread_op", 0.01, success=True)

        # Create multiple threads
        threads = [threading.Thread(target=record_measurements) for _ in range(5)]

        # Start all threads
        for thread in threads:
            thread.start()

        # Wait for completion
        for thread in threads:
            thread.join()

        # Verify all measurements recorded
        stats = monitor.get_performance_stats("thread_op")
        assert stats["thread_op"].count == 500

    def test_reset_metrics(self):
        """Test resetting monitor state."""
        monitor = PerformanceMonitor("test")
        monitor.record_timing("op1", 1.0, success=True)
        monitor.record_api_request("api/test", 2.0, success=True)

        monitor.reset_metrics()

        # Verify state is reset
        assert len(monitor._performance_stats) == 0
        assert monitor._api_metrics.total_requests == 0

    def test_export_metrics_dict(self):
        """Test exporting metrics as dict."""
        monitor = PerformanceMonitor("test")
        monitor.record_timing("op1", 1.0, success=True)
        monitor.record_api_request("api/test", 2.0, success=True, cost=0.01)

        exported = monitor.export_metrics(format_type="dict")
        assert isinstance(exported, dict)
        assert "performance_stats" in exported
        assert "api_metrics" in exported

    def test_export_metrics_prometheus(self):
        """Test exporting metrics in Prometheus format."""
        monitor = PerformanceMonitor("test")
        monitor.record_timing("op1", 1.5, success=True)

        exported = monitor.export_metrics(format_type="prometheus")
        assert isinstance(exported, str)
        assert "operation_count_total" in exported
        assert "operation_duration_avg" in exported

    def test_export_metrics_invalid_format(self):
        """Test exporting with invalid format."""
        monitor = PerformanceMonitor("test")

        with pytest.raises(ValueError, match="Unsupported format"):
            monitor.export_metrics(format_type="invalid")

    def test_create_performance_monitor_factory(self):
        """Test factory function."""
        from shared.performance_monitor import create_performance_monitor

        monitor = create_performance_monitor("factory_test")
        assert isinstance(monitor, PerformanceMonitor)
        assert monitor._component_name == "factory_test"
