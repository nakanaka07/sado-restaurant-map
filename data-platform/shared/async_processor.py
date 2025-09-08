#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Async Processing System - 非同期処理システム

Google Places API呼び出しの並列化とバッチ処理
Phase 2改善: 非同期処理導入
"""

import asyncio
import aiohttp
import time
from typing import List, Dict, Any, Optional, Callable, Tuple, Union
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import wraps
import json

from shared.logger import get_logger
from shared.error_handler import ErrorHandler, ErrorSeverity, ErrorCategory
from shared.performance_monitor import PerformanceMonitor


@dataclass
class BatchConfig:
    """バッチ処理設定"""
    batch_size: int = 10              # バッチサイズ
    max_concurrent: int = 5           # 最大同時実行数
    retry_attempts: int = 3           # リトライ回数
    retry_delay: float = 1.0          # リトライ間隔（秒）
    rate_limit_delay: float = 1.0     # レート制限時の待機時間
    timeout: float = 30.0             # タイムアウト時間


@dataclass
class ProcessingResult:
    """処理結果"""
    success: bool
    data: Any = None
    error: Optional[Exception] = None
    duration: float = 0.0
    retry_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BatchResult:
    """バッチ処理結果"""
    total_items: int
    successful_items: int
    failed_items: int
    results: List[ProcessingResult]
    total_duration: float
    success_rate: float = 0.0

    def __post_init__(self):
        """成功率を計算"""
        if self.total_items > 0:
            self.success_rate = self.successful_items / self.total_items


class AsyncProcessor:
    """非同期処理システム"""

    def __init__(
        self,
        component_name: str = "AsyncProcessor",
        config: Optional[BatchConfig] = None
    ):
        """AsyncProcessor初期化"""
        self._component_name = component_name
        self._logger = get_logger(f"AsyncProcessor.{component_name}")
        self._config = config or BatchConfig()
        self._error_handler = ErrorHandler(component_name)
        self._performance_monitor = PerformanceMonitor(component_name)

        # セッション管理
        self._session: Optional[aiohttp.ClientSession] = None
        self._executor = ThreadPoolExecutor(max_workers=self._config.max_concurrent)

    async def __aenter__(self):
        """非同期コンテキストマネージャー開始"""
        self._create_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """非同期コンテキストマネージャー終了"""
        await self._close_session()
        self._executor.shutdown(wait=True)

    def _create_session(self) -> None:
        """HTTPセッションを作成"""
        if self._session is None:
            timeout = aiohttp.ClientTimeout(total=self._config.timeout)
            connector = aiohttp.TCPConnector(
                limit=self._config.max_concurrent,
                limit_per_host=self._config.max_concurrent
            )
            self._session = aiohttp.ClientSession(
                timeout=timeout,
                connector=connector
            )

    async def _close_session(self) -> None:
        """HTTPセッションを閉じる"""
        if self._session:
            await self._session.close()
            self._session = None

    async def process_batch_async(
        self,
        items: List[Any],
        processor_func: Callable,
        *args,
        **kwargs
    ) -> BatchResult:
        """非同期バッチ処理"""
        start_time = time.time()

        try:
            # バッチに分割
            batches = self._create_batches(items, self._config.batch_size)
            all_results = []

            self._logger.info(f"Starting async batch processing: {len(items)} items in {len(batches)} batches")

            # バッチを並列処理
            semaphore = asyncio.Semaphore(self._config.max_concurrent)

            tasks = [
                self._process_batch_with_semaphore(semaphore, batch, processor_func, *args, **kwargs)
                for batch in batches
            ]

            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            # 結果を統合
            for batch_result in batch_results:
                if isinstance(batch_result, Exception):
                    # バッチ全体の失敗を処理
                    error_result = ProcessingResult(
                        success=False,
                        error=batch_result,
                        duration=0.0
                    )
                    all_results.append(error_result)
                else:
                    all_results.extend(batch_result)

            # 統計計算
            total_duration = time.time() - start_time
            successful_items = sum(1 for r in all_results if r.success)
            failed_items = len(all_results) - successful_items

            result = BatchResult(
                total_items=len(items),
                successful_items=successful_items,
                failed_items=failed_items,
                results=all_results,
                total_duration=total_duration
            )

            # メトリクス記録
            self._performance_monitor.record_timing(
                "batch_processing",
                total_duration,
                successful_items > 0
            )

            self._logger.info(
                f"Batch processing completed: {successful_items}/{len(items)} successful "
                f"({result.success_rate:.1%}) in {total_duration:.2f}s"
            )

            return result

        except Exception as e:
            total_duration = time.time() - start_time
            self._error_handler.handle_error(e, ErrorSeverity.HIGH, ErrorCategory.PROCESSING)

            return BatchResult(
                total_items=len(items),
                successful_items=0,
                failed_items=len(items),
                results=[ProcessingResult(success=False, error=e) for _ in items],
                total_duration=total_duration
            )

    async def _process_batch_with_semaphore(
        self,
        semaphore: asyncio.Semaphore,
        batch: List[Any],
        processor_func: Callable,
        *args,
        **kwargs
    ) -> List[ProcessingResult]:
        """セマフォ付きバッチ処理"""
        async with semaphore:
            return await self._process_single_batch(batch, processor_func, *args, **kwargs)

    async def _process_single_batch(
        self,
        batch: List[Any],
        processor_func: Callable,
        *args,
        **kwargs
    ) -> List[ProcessingResult]:
        """単一バッチの処理"""
        results = []

        for item in batch:
            result = await self._process_single_item_with_retry(
                item, processor_func, *args, **kwargs
            )
            results.append(result)

            # レート制限対応
            if not result.success and self._is_rate_limit_error(result.error):
                await asyncio.sleep(self._config.rate_limit_delay)

        return results

    async def _process_single_item_with_retry(
        self,
        item: Any,
        processor_func: Callable,
        *args,
        **kwargs
    ) -> ProcessingResult:
        """リトライ付き単一アイテム処理"""
        last_error = None

        for attempt in range(self._config.retry_attempts):
            start_time = time.time()

            try:
                # 非同期関数かどうかチェック
                if asyncio.iscoroutinefunction(processor_func):
                    data = await processor_func(item, *args, **kwargs)
                else:
                    # 同期関数を非同期実行
                    loop = asyncio.get_event_loop()
                    data = await loop.run_in_executor(
                        self._executor, processor_func, item, *args, **kwargs
                    )

                duration = time.time() - start_time

                return ProcessingResult(
                    success=True,
                    data=data,
                    duration=duration,
                    retry_count=attempt
                )

            except Exception as e:
                duration = time.time() - start_time
                last_error = e

                # リトライ判定
                if attempt < self._config.retry_attempts - 1 and self._should_retry(e):
                    self._logger.warning(
                        f"Retrying item processing (attempt {attempt + 1}/{self._config.retry_attempts}): {str(e)}"
                    )
                    await asyncio.sleep(self._config.retry_delay * (attempt + 1))
                    continue
                else:
                    # 最終的な失敗
                    self._error_handler.handle_error(e, ErrorSeverity.MEDIUM, ErrorCategory.PROCESSING)

                    return ProcessingResult(
                        success=False,
                        error=e,
                        duration=duration,
                        retry_count=attempt
                    )

        # ここには到達しないはずだが、安全のため
        return ProcessingResult(
            success=False,
            error=last_error,
            duration=0.0,
            retry_count=self._config.retry_attempts
        )

    def _create_batches(self, items: List[Any], batch_size: int) -> List[List[Any]]:
        """アイテムをバッチに分割"""
        batches = []
        for i in range(0, len(items), batch_size):
            batches.append(items[i:i + batch_size])
        return batches

    def _should_retry(self, error: Exception) -> bool:
        """リトライ可能なエラーかどうか判定"""
        if isinstance(error, (aiohttp.ClientError, asyncio.TimeoutError)):
            return True

        # API固有のエラーチェック
        error_str = str(error).lower()
        retry_keywords = [
            'timeout', 'connection', 'temporary', 'server error',
            'internal error', 'service unavailable', '500', '502', '503'
        ]

        return any(keyword in error_str for keyword in retry_keywords)

    def _is_rate_limit_error(self, error: Optional[Exception]) -> bool:
        """レート制限エラーかどうか判定"""
        if not error:
            return False

        error_str = str(error).lower()
        rate_limit_keywords = [
            'rate limit', 'quota', 'too many requests', '429',
            'requests per', 'limit exceeded'
        ]

        return any(keyword in error_str for keyword in rate_limit_keywords)

    async def process_api_calls_parallel(
        self,
        requests: List[Dict[str, Any]],
        api_client: Any
    ) -> BatchResult:
        """API呼び出しの並列処理"""
        async def api_call_wrapper(request_data: Dict[str, Any]) -> Any:
            """API呼び出しラッパー"""
            endpoint = request_data.get('endpoint', 'unknown')

            with self._performance_monitor.measure_time(f"api_call.{endpoint}"):
                if hasattr(api_client, 'async_call'):
                    return await api_client.async_call(**request_data)
                else:
                    # 同期APIクライアントの場合
                    return await asyncio.get_event_loop().run_in_executor(
                        self._executor,
                        lambda: api_client.call(**request_data)
                    )

        return await self.process_batch_async(requests, api_call_wrapper)

    def get_processing_stats(self) -> Dict[str, Any]:
        """処理統計を取得"""
        return {
            "performance_stats": self._performance_monitor.get_performance_stats(),
            "system_health": self._performance_monitor.get_system_health(),
            "error_stats": self._error_handler.get_error_stats(),
            "config": {
                "batch_size": self._config.batch_size,
                "max_concurrent": self._config.max_concurrent,
                "retry_attempts": self._config.retry_attempts,
                "timeout": self._config.timeout
            }
        }


# 便利な関数とデコレータ

def async_retry(
    max_attempts: int = 3,
    delay: float = 1.0,
    backoff_factor: float = 2.0
):
    """非同期リトライデコレータ"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        wait_time = delay * (backoff_factor ** attempt)
                        await asyncio.sleep(wait_time)
                    else:
                        raise last_exception

            raise last_exception

        return wrapper
    return decorator


async def gather_with_concurrency(
    coros: List[Any],
    max_concurrency: int = 10
) -> List[Any]:
    """同時実行数制限付きgather"""
    semaphore = asyncio.Semaphore(max_concurrency)

    async def sem_coro(coro):
        async with semaphore:
            return await coro

    return await asyncio.gather(*[sem_coro(coro) for coro in coros])


def create_async_processor(
    component_name: str,
    config: Optional[BatchConfig] = None
) -> AsyncProcessor:
    """AsyncProcessor のファクトリ関数"""
    return AsyncProcessor(component_name, config)
