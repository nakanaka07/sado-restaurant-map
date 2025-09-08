#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Error Handler - 統一エラーハンドリングシステム

アプリケーション全体で一貫したエラー処理を提供する
Phase 2改善: エラーハンドリングの統一
"""

import traceback
from enum import Enum
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, field
from datetime import datetime

from shared.logger import get_logger
from shared.exceptions import (
    APIError,
    ConfigurationError,
    ValidationError,
    ScraperError
)


class ErrorSeverity(Enum):
    """エラーの重要度レベル"""
    LOW = "low"           # 警告レベル（処理継続可能）
    MEDIUM = "medium"     # 中程度（部分的な処理失敗）
    HIGH = "high"         # 高レベル（重要な処理失敗）
    CRITICAL = "critical" # クリティカル（システム停止レベル）


class ErrorCategory(Enum):
    """エラーカテゴリ分類"""
    API = "api"                    # API関連エラー
    CONFIGURATION = "config"       # 設定エラー
    VALIDATION = "validation"      # データ検証エラー
    NETWORK = "network"           # ネットワークエラー
    STORAGE = "storage"           # ストレージエラー
    PROCESSING = "processing"     # データ処理エラー
    AUTHENTICATION = "auth"       # 認証エラー
    RATE_LIMIT = "rate_limit"     # レート制限エラー
    SYSTEM = "system"             # システムエラー
    UNKNOWN = "unknown"           # 不明なエラー


@dataclass
class ErrorContext:
    """エラーの詳細情報"""
    timestamp: datetime = field(default_factory=datetime.now)
    category: ErrorCategory = ErrorCategory.UNKNOWN
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
    component: str = ""
    operation: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    retry_count: int = 0
    max_retries: int = 3
    user_message: str = ""
    technical_message: str = ""
    suggestions: List[str] = field(default_factory=list)


@dataclass
class ErrorMetrics:
    """エラー統計情報"""
    total_errors: int = 0
    errors_by_category: Dict[ErrorCategory, int] = field(default_factory=dict)
    errors_by_severity: Dict[ErrorSeverity, int] = field(default_factory=dict)
    recent_errors: List[ErrorContext] = field(default_factory=list)

    def add_error(self, context: ErrorContext) -> None:
        """エラーを統計に追加"""
        self.total_errors += 1

        # カテゴリ別集計
        if context.category not in self.errors_by_category:
            self.errors_by_category[context.category] = 0
        self.errors_by_category[context.category] += 1

        # 重要度別集計
        if context.severity not in self.errors_by_severity:
            self.errors_by_severity[context.severity] = 0
        self.errors_by_severity[context.severity] += 1

        # 最近のエラー記録（最大100件）
        self.recent_errors.append(context)
        if len(self.recent_errors) > 100:
            self.recent_errors = self.recent_errors[-100:]


class ErrorHandler:
    """統一エラーハンドリングクラス"""

    def __init__(self, component_name: str = "unknown"):
        """ErrorHandler初期化"""
        self._component_name = component_name
        self._logger = get_logger(f"ErrorHandler.{component_name}")
        self._metrics = ErrorMetrics()

        # エラー分類ルール
        self._error_classification = {
            APIError: (ErrorCategory.API, ErrorSeverity.HIGH),
            ConfigurationError: (ErrorCategory.CONFIGURATION, ErrorSeverity.CRITICAL),
            ValidationError: (ErrorCategory.VALIDATION, ErrorSeverity.MEDIUM),
            ConnectionError: (ErrorCategory.NETWORK, ErrorSeverity.HIGH),
            TimeoutError: (ErrorCategory.NETWORK, ErrorSeverity.MEDIUM),
            PermissionError: (ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH),
            ValueError: (ErrorCategory.VALIDATION, ErrorSeverity.MEDIUM),
            TypeError: (ErrorCategory.PROCESSING, ErrorSeverity.MEDIUM),
            KeyError: (ErrorCategory.PROCESSING, ErrorSeverity.LOW),
            FileNotFoundError: (ErrorCategory.STORAGE, ErrorSeverity.MEDIUM),
        }

    def handle_error(
        self,
        error: Exception,
        operation: str = "",
        context_data: Optional[Dict[str, Any]] = None,
        user_message: str = "",
        retry_count: int = 0,
        max_retries: int = 3
    ) -> ErrorContext:
        """
        エラーを統一的に処理

        Args:
            error: 発生したエラー
            operation: 実行していた操作名
            context_data: エラー発生時のコンテキスト情報
            user_message: ユーザー向けメッセージ
            retry_count: リトライ回数
            max_retries: 最大リトライ回数

        Returns:
            ErrorContext: エラーの詳細情報
        """
        # エラーを分類
        category, severity = self._classify_error(error)

        # エラーコンテキストを作成
        error_context = ErrorContext(
            category=category,
            severity=severity,
            component=self._component_name,
            operation=operation,
            details=context_data or {},
            retry_count=retry_count,
            max_retries=max_retries,
            technical_message=str(error),
            user_message=user_message or self._generate_user_message(category, error),
            suggestions=self._generate_suggestions(category, error)
        )

        # ログ出力
        self._log_error(error, error_context)

        # メトリクス更新
        self._metrics.add_error(error_context)

        return error_context

    def should_retry(self, error_context: ErrorContext) -> bool:
        """リトライすべきかどうかを判定"""
        # クリティカルエラーはリトライしない
        if error_context.severity == ErrorSeverity.CRITICAL:
            return False

        # リトライ回数チェック
        if error_context.retry_count >= error_context.max_retries:
            return False

        # カテゴリ別リトライ判定
        retryable_categories = {
            ErrorCategory.NETWORK,
            ErrorCategory.RATE_LIMIT,
            ErrorCategory.API,
            ErrorCategory.STORAGE
        }

        return error_context.category in retryable_categories

    def get_retry_delay(self, error_context: ErrorContext) -> float:
        """リトライ遅延時間を計算（指数バックオフ）"""
        base_delay = 1.0

        # カテゴリ別基本遅延
        category_delays = {
            ErrorCategory.RATE_LIMIT: 5.0,
            ErrorCategory.NETWORK: 2.0,
            ErrorCategory.API: 1.5,
            ErrorCategory.STORAGE: 1.0
        }

        base_delay = category_delays.get(error_context.category, base_delay)

        # 指数バックオフ
        return base_delay * (2 ** error_context.retry_count)

    def _classify_error(self, error: Exception) -> tuple[ErrorCategory, ErrorSeverity]:
        """エラーを分類"""
        error_type = type(error)

        # 既知のエラータイプから分類
        if error_type in self._error_classification:
            return self._error_classification[error_type]

        # エラーメッセージからの推定
        error_msg = str(error).lower()

        if "rate limit" in error_msg or "quota" in error_msg:
            return ErrorCategory.RATE_LIMIT, ErrorSeverity.MEDIUM
        elif "timeout" in error_msg:
            return ErrorCategory.NETWORK, ErrorSeverity.MEDIUM
        elif "authentication" in error_msg or "unauthorized" in error_msg:
            return ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH
        elif "not found" in error_msg:
            return ErrorCategory.STORAGE, ErrorSeverity.LOW

        return ErrorCategory.UNKNOWN, ErrorSeverity.MEDIUM

    def _generate_user_message(self, category: ErrorCategory, _error: Exception) -> str:
        """ユーザー向けメッセージを生成"""
        messages = {
            ErrorCategory.API: "外部APIとの通信でエラーが発生しました。しばらく待ってから再試行してください。",
            ErrorCategory.CONFIGURATION: "設定に問題があります。環境変数や設定ファイルを確認してください。",
            ErrorCategory.VALIDATION: "入力データに問題があります。データ形式を確認してください。",
            ErrorCategory.NETWORK: "ネットワーク接続でエラーが発生しました。接続状況を確認してください。",
            ErrorCategory.STORAGE: "データ保存でエラーが発生しました。権限や容量を確認してください。",
            ErrorCategory.AUTHENTICATION: "認証でエラーが発生しました。認証情報を確認してください。",
            ErrorCategory.RATE_LIMIT: "API制限に達しました。しばらく待ってから再試行してください。",
            ErrorCategory.PROCESSING: "データ処理でエラーが発生しました。入力データを確認してください。",
        }

        return messages.get(category, "予期しないエラーが発生しました。")

    def _generate_suggestions(self, category: ErrorCategory, _error: Exception) -> List[str]:
        """改善提案を生成"""
        suggestions = {
            ErrorCategory.API: [
                "API キーが正しく設定されているか確認してください",
                "API の使用制限を確認してください",
                "しばらく時間を置いてから再試行してください"
            ],
            ErrorCategory.CONFIGURATION: [
                "環境変数ファイル(.env)の設定を確認してください",
                "必要な設定項目がすべて設定されているか確認してください",
                "設定値の形式が正しいか確認してください"
            ],
            ErrorCategory.NETWORK: [
                "インターネット接続を確認してください",
                "ファイアウォールの設定を確認してください",
                "プロキシ設定が正しいか確認してください"
            ],
            ErrorCategory.RATE_LIMIT: [
                "処理間隔を長くしてください",
                "バッチサイズを小さくしてください",
                "API プランのアップグレードを検討してください"
            ]
        }

        return suggestions.get(category, ["ログを確認して詳細情報を確認してください"])

    def _log_error(self, error: Exception, context: ErrorContext) -> None:
        """エラーをログに記録"""
        log_data = {
            "error_type": type(error).__name__,
            "category": context.category.value,
            "severity": context.severity.value,
            "operation": context.operation,
            "retry_count": context.retry_count,
            "component": context.component,
            **context.details
        }

        # 重要度別ログレベル
        if context.severity == ErrorSeverity.CRITICAL:
            self._logger.critical(context.technical_message, **log_data,
                                stack_trace=traceback.format_exc())
        elif context.severity == ErrorSeverity.HIGH:
            self._logger.error(context.technical_message, **log_data)
        elif context.severity == ErrorSeverity.MEDIUM:
            self._logger.warning(context.technical_message, **log_data)
        else:
            self._logger.info(context.technical_message, **log_data)

    def get_metrics(self) -> ErrorMetrics:
        """エラー統計を取得"""
        return self._metrics

    def reset_metrics(self) -> None:
        """エラー統計をリセット"""
        self._metrics = ErrorMetrics()

    def get_health_status(self) -> Dict[str, Any]:
        """システムの健全性ステータスを取得"""
        critical_errors = self._metrics.errors_by_severity.get(ErrorSeverity.CRITICAL, 0)
        high_errors = self._metrics.errors_by_severity.get(ErrorSeverity.HIGH, 0)

        # 健全性の判定
        if critical_errors > 0:
            status = "critical"
        elif high_errors > 5:
            status = "degraded"
        elif self._metrics.total_errors > 20:
            status = "warning"
        else:
            status = "healthy"

        return {
            "status": status,
            "total_errors": self._metrics.total_errors,
            "critical_errors": critical_errors,
            "high_errors": high_errors,
            "last_error": self._metrics.recent_errors[-1].timestamp if self._metrics.recent_errors else None
        }


def create_error_handler(component_name: str) -> ErrorHandler:
    """ErrorHandler のファクトリ関数"""
    return ErrorHandler(component_name)
