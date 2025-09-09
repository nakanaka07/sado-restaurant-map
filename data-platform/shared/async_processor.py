#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Async Processing System - 非同期処理システム - Performance Optimized

Google Places API呼び出しの並列化とバッチ処理

Performance optimizations:
- Memory-efficient data structures with __slots__
- Optimized connection pooling and session management
- Intelligent batch size adjustment based on performance
- Advanced error handling with circuit breaker pattern
- Resource pooling and cleanup optimization
"""

import asyncio
import aiohttp
import time
from typing import List, Dict, Any, Optional, Callable, Tuple, AsyncGenerator, Type
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
from functools import wraps
import weakref
from collections import deque
from enum import Enum
import gc

from shared.logger import get_logger
from shared.error_handler import ErrorHandler
from shared.performance_monitor import PerformanceMonitor


class ProcessingState(Enum):
    """処理状態"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass(slots=True)  # Memory optimization
class OptimizedBatchConfig:
    """バッチ処理設定 - 最適化版"""
    batch_size: int = 20              # バッチサイズ増加
    max_concurrent: int = 10          # 最大同時実行数増加
    retry_attempts: int = 3           # リトライ回数
    retry_delay: float = 0.5          # リトライ間隔短縮
    rate_limit_delay: float = 1.0     # レート制限時の待機時間
    timeout: float = 30.0             # タイムアウト時間
    connection_pool_size: int = 50    # 接続プール最適化
    adaptive_batch_size: bool = True  # 動的バッチサイズ調整
    circuit_breaker_threshold: int = 5  # サーキットブレーカー閾値


@dataclass(slots=True)  # Memory optimization
class ProcessingResult:
    """処理結果 - 最適化版"""
    success: bool
    data: Any = None
    error: Optional[Exception] = None
    duration: float = 0.0
    retry_count: int = 0
    state: ProcessingState = ProcessingState.PENDING
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass(slots=True)  # Memory optimization
class BatchResult:
    """バッチ処理結果 - 最適化版"""
    total_items: int
    successful_items: int
    failed_items: int
    results: List[ProcessingResult]
    total_duration: float
    success_rate: float = 0.0
    avg_processing_time: float = 0.0
    throughput: float = 0.0  # items/second

    def __post_init__(self):
        """統計を計算"""
        if self.total_items > 0:
            self.success_rate = self.successful_items / self.total_items

        if self.total_duration > 0:
            self.throughput = self.total_items / self.total_duration

        if self.results:
            self.avg_processing_time = sum(r.duration for r in self.results) / len(self.results)


class CircuitBreaker:
    """サーキットブレーカーパターン実装"""

    __slots__ = ('threshold', 'failure_count', 'is_open', 'last_failure_time', 'timeout')

    def __init__(self, threshold: int = 5, timeout: float = 60.0):
        self.threshold = threshold
        self.failure_count = 0
        self.is_open = False
        self.last_failure_time = 0.0
        self.timeout = timeout

    def record_success(self) -> None:
        """成功を記録"""
        self.failure_count = 0
        self.is_open = False

    def record_failure(self) -> None:
        """失敗を記録"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.threshold:
            self.is_open = True

    def can_proceed(self) -> bool:
        """実行可能かチェック"""
        if not self.is_open:
            return True

        # タイムアウト後は再試行を許可
        if time.time() - self.last_failure_time > self.timeout:
            self.is_open = False
            self.failure_count = 0
            return True

        return False


class OptimizedAsyncProcessor:
    """非同期処理システム - 高性能最適化版"""

    __slots__ = (
        '_component_name', '_logger', '_config', '_error_handler',
        '_performance_monitor', '_session', '_executor', '_semaphore',
        '_circuit_breaker', '_batch_performance_history', '_weak_refs'
    )

    def __init__(
        self,
        component_name: str = "OptimizedAsyncProcessor",
        config: Optional[OptimizedBatchConfig] = None
    ):
        """OptimizedAsyncProcessor初期化"""
        self._component_name = component_name
        self._logger = get_logger(f"AsyncProcessor.{component_name}")
        self._config = config or OptimizedBatchConfig()
        self._error_handler = ErrorHandler(component_name)
        self._performance_monitor = PerformanceMonitor(component_name)

        # 同時実行制御
        self._semaphore = asyncio.Semaphore(self._config.max_concurrent)

        # セッション管理
        self._session: Optional[aiohttp.ClientSession] = None
        self._executor = ThreadPoolExecutor(
            max_workers=self._config.max_concurrent,
            thread_name_prefix=f"AsyncProcessor_{component_name}"
        )

        # サーキットブレーカー
        self._circuit_breaker = CircuitBreaker(
            threshold=self._config.circuit_breaker_threshold
        )

        # パフォーマンス履歴（動的最適化用）
        self._batch_performance_history: deque = deque(maxlen=100)

        # 弱参照管理
        self._weak_refs: List[weakref.ref] = []

    async def __aenter__(self):
        """非同期コンテキストマネージャー開始"""
        self._create_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """非同期コンテキストマネージャー終了"""
        await self._close_session()
        self._executor.shutdown(wait=True)

        # 弱参照クリーンアップ
        self._weak_refs.clear()
        gc.collect()

    def _create_session(self) -> None:
        """HTTPセッションを作成 - 最適化版"""
        if self._session is None:
            timeout = aiohttp.ClientTimeout(total=self._config.timeout)

            # 最適化されたコネクター設定
            connector = aiohttp.TCPConnector(
                limit=self._config.connection_pool_size,
                limit_per_host=self._config.max_concurrent,
                keepalive_timeout=60,  # Keep-alive最適化
                enable_cleanup_closed=True,
                use_dns_cache=True,
                ttl_dns_cache=300
            )

            self._session = aiohttp.ClientSession(
                timeout=timeout,
                connector=connector,
                headers={
                    'Connection': 'keep-alive',
                    'Keep-Alive': 'timeout=60, max=1000'
                }
            )

            self._logger.info(f"最適化されたHTTPセッション作成: pool_size={self._config.connection_pool_size}")

    async def _close_session(self) -> None:
        """HTTPセッションをクローズ"""
        if self._session:
            await self._session.close()
            self._session = None
            self._logger.info("HTTPセッション終了")

    async def process_batch_optimized(
        self,
        items: List[Any],
        processor_func: Callable,
        progress_callback: Optional[Callable[[int, int], None]] = None
    ) -> BatchResult:
        """最適化されたバッチ処理"""

        # 基本チェック
        if not self._circuit_breaker.can_proceed():
            raise RuntimeError("サーキットブレーカーが開いています")

        # 初期化
        start_time = time.perf_counter()
        optimal_batch_size = self._calculate_optimal_batch_size()

        return await self._execute_batch_processing_safely(
            items, processor_func, progress_callback, start_time, optimal_batch_size
        )

    async def _execute_batch_processing_safely(
        self, items, processor_func, progress_callback, start_time, batch_size
    ):
        """安全なバッチ処理実行"""
        results = []
        successful_count = 0

        # バッチ処理実行
        results, successful_count = await self._execute_batch_processing(
            items, processor_func, batch_size, progress_callback
        )

        # 結果作成
        duration = time.perf_counter() - start_time
        return self._create_batch_result(results, successful_count, len(items), duration)

    async def _execute_batch_processing(
        self,
        items: List[Any],
        processor_func: Callable,
        batch_size: int,
        progress_callback: Optional[Callable[[int, int], None]]
    ) -> Tuple[List[Any], int]:
        """バッチ処理実行"""
        results = []
        successful_count = 0
        total_items = len(items)

        for i in range(0, total_items, batch_size):
            batch = items[i:i + batch_size]
            batch_results, batch_success = await self._process_single_batch(
                batch, processor_func
            )

            results.extend(batch_results)
            successful_count += batch_success

            # 進捗報告
            if progress_callback:
                progress_callback(min(i + batch_size, total_items), total_items)

            # 適応的遅延
            if i + batch_size < total_items:
                await asyncio.sleep(self._config.rate_limit_delay)

        return results, successful_count

    async def _process_single_batch(
        self,
        batch: List[Any],
        processor_func: Callable
    ) -> Tuple[List[Any], int]:
        """単一バッチの処理"""
        batch_tasks = [
            self._process_single_item_with_circuit_breaker(item, processor_func)
            for item in batch
        ]

        batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
        results = []
        successful_count = 0

        for result in batch_results:
            if isinstance(result, Exception):
                # BaseException → Exception 型修正
                error = result if isinstance(result, Exception) else Exception(str(result))
                results.append(ProcessingResult(
                    success=False,
                    error=error,
                    state=ProcessingState.FAILED
                ))
            else:
                results.append(result)
                if hasattr(result, 'success') and getattr(result, 'success', False):
                    successful_count += 1

        return results, successful_count

    def _create_batch_result(
        self,
        results: List[Any],
        successful_count: int,
        total_items: int,
        duration: float
    ) -> BatchResult:
        """バッチ結果作成"""
        batch_result = BatchResult(
            total_items=total_items,
            successful_items=successful_count,
            failed_items=total_items - successful_count,
            results=results,
            total_duration=duration
        )

        # パフォーマンス履歴更新
        self._update_performance_history(batch_result)

        # サーキットブレーカー状態更新
        if batch_result.success_rate > 0.8:
            self._circuit_breaker.record_success()
        else:
            self._circuit_breaker.record_failure()

        return batch_result

    async def _process_single_item_with_circuit_breaker(
        self,
        item: Any,
        processor_func: Callable
    ) -> ProcessingResult:
        """サーキットブレーカー付き単一アイテム処理"""

        if not self._circuit_breaker.can_proceed():
            return ProcessingResult(
                success=False,
                error=RuntimeError("Circuit breaker open"),
                state=ProcessingState.FAILED
            )

        async with self._semaphore:
            start_time = time.perf_counter()
            retry_count = 0
            last_exception = None

            for attempt in range(self._config.retry_attempts):
                try:
                    with self._performance_monitor.measure_time(f"process_item_{type(item).__name__}"):
                        result = await processor_func(item)

                    end_time = time.perf_counter()
                    duration = end_time - start_time

                    return ProcessingResult(
                        success=True,
                        data=result,
                        duration=duration,
                        retry_count=retry_count,
                        state=ProcessingState.COMPLETED
                    )

                except Exception as e:
                    last_exception = e
                    retry_count += 1
                    self._logger.warning(f"処理エラー (試行 {attempt + 1}/{self._config.retry_attempts}): {e}")

                    if attempt < self._config.retry_attempts - 1:
                        # 指数バックオフでリトライ
                        delay = self._config.retry_delay * (2 ** attempt)
                        await asyncio.sleep(delay)

            # すべてのリトライが失敗
            end_time = time.perf_counter()
            duration = end_time - start_time

            return ProcessingResult(
                success=False,
                error=last_exception,
                duration=duration,
                retry_count=retry_count,
                state=ProcessingState.FAILED
            )

    def _calculate_optimal_batch_size(self) -> int:
        """パフォーマンス履歴に基づく最適バッチサイズ計算"""
        if not self._config.adaptive_batch_size or not self._batch_performance_history:
            return self._config.batch_size

        # 最近のパフォーマンスデータから最適サイズを計算
        recent_results = list(self._batch_performance_history)[-10:]  # 最新10件

        if len(recent_results) < 3:
            return self._config.batch_size

        # スループットが最も高いバッチサイズを見つける
        best_throughput = 0
        best_batch_size = self._config.batch_size

        for result in recent_results:
            if result.throughput > best_throughput:
                best_throughput = result.throughput
                # バッチサイズを推定（簡略版）
                estimated_batch_size = max(5, min(50, int(result.total_items / 5)))
                best_batch_size = estimated_batch_size

        return best_batch_size

    def _update_performance_history(self, batch_result: BatchResult) -> None:
        """パフォーマンス履歴を更新"""
        self._batch_performance_history.append(batch_result)

        # メモリ使用量監視
        if len(self._batch_performance_history) % 20 == 0:
            self._logger.debug(
                f"パフォーマンス履歴: {len(self._batch_performance_history)}件, "
                f"平均スループット: {sum(r.throughput for r in self._batch_performance_history) / len(self._batch_performance_history):.2f} items/sec"
            )

    async def process_stream_optimized(
        self,
        items: List[Any],
        processor_func: Callable,
        batch_size: Optional[int] = None
    ) -> AsyncGenerator[ProcessingResult, None]:
        """ストリーミング処理 - メモリ効率最適化版"""

        batch_size = batch_size or self._config.batch_size
        semaphore = asyncio.Semaphore(self._config.max_concurrent)

        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]

            async def process_item(item):
                async with semaphore:
                    try:
                        result = await processor_func(item)
                        return ProcessingResult(
                            success=True,
                            data=result,
                            state=ProcessingState.COMPLETED
                        )
                    except Exception as e:
                        return ProcessingResult(
                            success=False,
                            error=e,
                            state=ProcessingState.FAILED
                        )

            # バッチ処理
            tasks = [process_item(item) for item in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, ProcessingResult):
                    yield result
                else:
                    # BaseException → Exception 型修正
                    error = result if isinstance(result, Exception) else Exception(str(result))
                    yield ProcessingResult(
                        success=False,
                        error=error,
                        state=ProcessingState.FAILED
                    )

    async def parallel_execute(
        self,
        tasks: List[Callable],
        max_concurrency: Optional[int] = None
    ) -> List[ProcessingResult]:
        """並列実行 - 高度な最適化版"""

        max_concurrency = max_concurrency or self._config.max_concurrent
        semaphore = asyncio.Semaphore(max_concurrency)
        results = []

        async def execute_with_semaphore(task_func: Callable) -> ProcessingResult:
            async with semaphore:
                start_time = time.perf_counter()
                try:
                    result = await task_func()
                    duration = time.perf_counter() - start_time

                    return ProcessingResult(
                        success=True,
                        data=result,
                        duration=duration,
                        state=ProcessingState.COMPLETED
                    )
                except Exception as e:
                    duration = time.perf_counter() - start_time
                    self._logger.error(f"タスク実行エラー: {e}")

                    return ProcessingResult(
                        success=False,
                        error=e,
                        duration=duration,
                        state=ProcessingState.FAILED
                    )

        # 全タスクを並列実行
        task_futures = [execute_with_semaphore(task) for task in tasks]
        results = await asyncio.gather(*task_futures, return_exceptions=True)

        # 例外処理済み結果を正規化
        normalized_results = []
        for result in results:
            if isinstance(result, ProcessingResult):
                normalized_results.append(result)
            else:
                # BaseException → Exception 型修正
                error = result if isinstance(result, Exception) else Exception(str(result))
                normalized_results.append(ProcessingResult(
                    success=False,
                    error=error,
                    state=ProcessingState.FAILED
                ))

        return normalized_results

    def get_processing_stats(self) -> Dict[str, Any]:
        """処理統計取得 - 最適化版"""

        # パフォーマンス履歴から統計計算
        if self._batch_performance_history:
            recent_batches = list(self._batch_performance_history)[-20:]
            avg_throughput = sum(b.throughput for b in recent_batches) / len(recent_batches)
            avg_success_rate = sum(b.success_rate for b in recent_batches) / len(recent_batches)
        else:
            avg_throughput = 0.0
            avg_success_rate = 0.0

        return {
            "component_name": self._component_name,
            "config": {
                "batch_size": self._config.batch_size,
                "max_concurrent": self._config.max_concurrent,
                "adaptive_batch_size": self._config.adaptive_batch_size
            },
            "circuit_breaker": {
                "is_open": self._circuit_breaker.is_open,
                "failure_count": self._circuit_breaker.failure_count
            },
            "performance": {
                "avg_throughput": avg_throughput,
                "avg_success_rate": avg_success_rate,
                "batch_history_count": len(self._batch_performance_history)
            },
            "session_active": self._session is not None,
            "executor_active": not self._executor._shutdown
        }

    def health_check(self) -> Dict[str, Any]:
        """ヘルスチェック - 拡張版"""

        health_status = {
            "status": "healthy",
            "checks": {}
        }

        # セッション状態チェック
        if self._session and not self._session.closed:
            health_status["checks"]["session"] = "active"
        else:
            health_status["checks"]["session"] = "inactive"
            health_status["status"] = "degraded"

        # サーキットブレーカー状態
        if self._circuit_breaker.is_open:
            health_status["checks"]["circuit_breaker"] = "open"
            health_status["status"] = "unhealthy"
        else:
            health_status["checks"]["circuit_breaker"] = "closed"

        # エグゼキューター状態
        if self._executor._shutdown:
            health_status["checks"]["executor"] = "shutdown"
            health_status["status"] = "unhealthy"
        else:
            health_status["checks"]["executor"] = "active"

        return health_status


# ユーティリティ関数
def create_optimized_async_processor(
    component_name: str = "DefaultProcessor",
    config: Optional[OptimizedBatchConfig] = None
) -> OptimizedAsyncProcessor:
    """最適化AsyncProcessor生成関数"""
    return OptimizedAsyncProcessor(component_name, config)


# 非同期デコレータ（高度な最適化）
def async_retry_optimized(
    max_attempts: int = 3,
    delay: float = 1.0,
    backoff_multiplier: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,)
):
    """非同期リトライデコレータ - 最適化版"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        sleep_time = delay * (backoff_multiplier ** attempt)
                        await asyncio.sleep(sleep_time)

            if last_exception:
                raise last_exception
            else:
                raise RuntimeError("All retry attempts failed")

        return wrapper
    return decorator


def async_timeout_optimized(timeout_seconds: float):
    """非同期タイムアウトデコレータ"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=timeout_seconds
            )
        return wrapper
    return decorator
