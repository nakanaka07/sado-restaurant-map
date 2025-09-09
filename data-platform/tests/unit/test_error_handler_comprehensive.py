#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive Error Handler Test Suite
エラーハンドラーの包括的テスト
"""

import pytest
import uuid
from unittest.mock import Mock, patch
from datetime import datetime, timedelta

from shared.error_handler import (
    ErrorHandler, ErrorContext, ErrorSeverity, ErrorCategory,
    ErrorMetrics, create_error_handler
)
from shared.exceptions import APIError, ValidationError, ScraperError, ConfigurationError


class TestErrorHandler:
    """ErrorHandler テストクラス"""

    @pytest.fixture
    def error_handler(self):
        """テスト用ErrorHandlerインスタンス"""
        return ErrorHandler("test_component")

    @pytest.fixture
    def sample_error_context(self):
        """サンプルエラーコンテキスト"""
        return ErrorContext(
            category=ErrorCategory.API,
            severity=ErrorSeverity.HIGH,
            component="test_component",
            operation="test_operation",
            technical_message="Test error occurred",
            user_message="エラーが発生しました",
            details={"test_key": "test_value"},
            correlation_id="test-correlation-123"
        )

    def test_error_handler_initialization(self, error_handler):
        """ErrorHandler初期化テスト"""
        assert error_handler._component_name == "test_component"
        assert error_handler._metrics.total_errors == 0
        assert len(error_handler._metrics.recent_errors) == 0

    def test_handle_error_basic(self, error_handler, sample_error_context):
        """基本的なエラーハンドリングテスト"""
        test_error = APIError("Test API error")

        with patch.object(error_handler, '_log_error') as mock_log:
            result = error_handler.handle_error(
                test_error,
                operation=sample_error_context.operation,
                context_data={"test_key": "test_value"},
                user_message="テストエラーが発生しました"
            )

            assert result.operation == sample_error_context.operation
            assert result.technical_message is not None
            mock_log.assert_called_once()

    def test_error_metrics_tracking(self, error_handler):
        """エラーメトリクス追跡テスト"""
        # APIError, ValidationError, ScraperErrorの実際の分類を確認
        error_handler.handle_error(APIError("API error 1"), operation="api_call_1")
        error_handler.handle_error(ValidationError("Validation error"), operation="validation_1")
        error_handler.handle_error(ScraperError("Scraper error"), operation="scraping_1")

        metrics = error_handler.get_metrics()

        # 総エラー数をチェック
        assert metrics.total_errors == 3

        # 実装ではAPIErrorはHIGH、他はMEDIUMになる
        assert metrics.errors_by_severity[ErrorSeverity.HIGH] == 1  # APIError
        assert metrics.errors_by_severity[ErrorSeverity.MEDIUM] == 2  # ValidationError + ScraperError
        assert len(metrics.recent_errors) == 3

    def test_sensitive_data_sanitization(self, error_handler):
        """センシティブデータのサニタイズテスト"""
        sensitive_data = {
            "password": "secret123",
            "api_key": "sk-1234567890",
            "authorization": "Bearer token123",
            "normal_data": "this is fine",
            "long_string": "a" * 150  # 100文字超過
        }

        sanitized = error_handler._sanitize_log_data(sensitive_data)

        assert sanitized["password"] == "***REDACTED***"
        assert sanitized["api_key"] == "***REDACTED***"
        assert sanitized["authorization"] == "***REDACTED***"
        assert sanitized["normal_data"] == "this is fine"
        assert len(sanitized["long_string"]) == 103  # 100 + "..."

    def test_health_status_calculation(self, error_handler):
        """ヘルスステータス計算テスト"""
        # 健全状態
        health = error_handler.get_health_status()
        assert health["status"] == "healthy"

        # 高レベルエラーを6回追加（HIGH errorが6回でdegraded）
        for _ in range(6):
            error_handler.handle_error(
                APIError("High error"),
                operation="test_high_error"
            )

        health = error_handler.get_health_status()
        assert health["status"] == "degraded"

        # ScraperErrorはMEDIUMなので、CriticalエラーにならないはずはCriticalカテゴリを使う
        error_handler.handle_error(
            ConfigurationError("Critical error"),  # これはCRITICAL分類
            operation="test_critical_error"
        )

        health = error_handler.get_health_status()
        assert health["status"] == "critical"

    def test_error_context_unique_ids(self):
        """ErrorContextの一意ID生成テスト"""
        context1 = ErrorContext()
        context2 = ErrorContext()

        assert context1.error_id != context2.error_id
        assert context1.error_id is not None
        assert context2.error_id is not None

        # UUID形式であることを確認
        uuid.UUID(context1.error_id)  # 例外が発生しなければOK
        uuid.UUID(context2.error_id)

    def test_error_suggestions_generation(self, error_handler):
        """エラー対処法提案テスト"""
        # _generate_suggestionsは(category, error)の2つの引数が必要
        test_error = APIError("Test API error")
        suggestions = error_handler._generate_suggestions(ErrorCategory.API, test_error)
        assert len(suggestions) > 0
        assert any("API" in suggestion for suggestion in suggestions)

        network_error = ConnectionError("Network error")
        network_suggestions = error_handler._generate_suggestions(ErrorCategory.NETWORK, network_error)
        assert any("接続" in suggestion for suggestion in network_suggestions)

    def test_factory_function(self):
        """ファクトリ関数テスト"""
        handler = create_error_handler("factory_test")
        assert handler._component_name == "factory_test"
        assert isinstance(handler, ErrorHandler)

    @pytest.mark.parametrize("severity,category", [
        (ErrorSeverity.LOW, ErrorCategory.VALIDATION),
        (ErrorSeverity.MEDIUM, ErrorCategory.NETWORK),
        (ErrorSeverity.HIGH, ErrorCategory.API),
        (ErrorSeverity.CRITICAL, ErrorCategory.SYSTEM)
    ])
    def test_various_error_combinations(self, error_handler, severity, category):
        """様々なエラー組み合わせテスト"""
        test_error = Exception(f"Test {severity.value} {category.value} error")

        result = error_handler.handle_error(
            test_error,
            operation=f"test_{severity.value}_{category.value}"
        )

        # 実装では、一般的なExceptionはUNKNOWNカテゴリ、MEDIUM重要度に分類される
        assert result.severity == ErrorSeverity.MEDIUM
        assert result.category == ErrorCategory.UNKNOWN
        assert result.error_id is not None


class TestErrorContext:
    """ErrorContext テストクラス"""

    def test_error_context_defaults(self):
        """ErrorContextデフォルト値テスト"""
        context = ErrorContext()

        assert context.category == ErrorCategory.UNKNOWN
        assert context.severity == ErrorSeverity.MEDIUM
        assert context.retry_count == 0
        assert context.max_retries == 3
        assert isinstance(context.timestamp, datetime)
        assert context.error_id is not None
        assert context.correlation_id is None

    def test_error_context_custom_values(self):
        """ErrorContextカスタム値テスト"""
        custom_time = datetime(2023, 1, 1, 12, 0, 0)
        custom_id = "custom-error-123"

        context = ErrorContext(
            timestamp=custom_time,
            category=ErrorCategory.API,
            severity=ErrorSeverity.CRITICAL,
            error_id=custom_id,
            correlation_id="correlation-456"
        )

        assert context.timestamp == custom_time
        assert context.category == ErrorCategory.API
        assert context.severity == ErrorSeverity.CRITICAL
        assert context.error_id == custom_id
        assert context.correlation_id == "correlation-456"


class TestErrorMetrics:
    """ErrorMetrics テストクラス"""

    def test_error_metrics_initialization(self):
        """ErrorMetrics初期化テスト"""
        metrics = ErrorMetrics()

        assert metrics.total_errors == 0
        assert len(metrics.errors_by_category) == 0
        assert len(metrics.errors_by_severity) == 0
        assert len(metrics.recent_errors) == 0

    def test_error_metrics_updates(self):
        """ErrorMetricsアップデートテスト"""
        metrics = ErrorMetrics()
        context = ErrorContext(
            category=ErrorCategory.API,
            severity=ErrorSeverity.HIGH
        )

        # 手動でメトリクスを更新（通常はErrorHandlerが行う）
        metrics.total_errors += 1
        metrics.errors_by_category[ErrorCategory.API] = 1
        metrics.errors_by_severity[ErrorSeverity.HIGH] = 1
        metrics.recent_errors.append(context)

        assert metrics.total_errors == 1
        assert metrics.errors_by_category[ErrorCategory.API] == 1
        assert metrics.errors_by_severity[ErrorSeverity.HIGH] == 1
        assert len(metrics.recent_errors) == 1
