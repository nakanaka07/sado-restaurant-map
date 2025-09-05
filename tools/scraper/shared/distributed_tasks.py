"""
Distributed Task Processing System

High-performance distributed task processing using Celery with intelligent
batching, retry strategies, and cache integration.
"""

from celery import group, chain, chord, signature
from typing import List, Dict, Any, Optional, Union
import asyncio
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict

from .celery_config import celery_app
from .cache_service import CacheService
from .exceptions import ProcessingError, APIError, CacheError
from .types.core_types import PlaceData, ValidatedPlaceData, ProcessingResult, BatchCacheResult


@dataclass
class TaskResult:
    """タスク実行結果"""
    task_id: str
    status: str  # success, failed, retry
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    retry_count: int = 0


@dataclass
class BatchTaskConfig:
    """バッチタスク設定"""
    batch_size: int = 50
    max_workers: int = 4
    retry_limit: int = 3
    timeout: int = 300  # 5分
    priority: int = 5
    use_cache: bool = True
    cache_ttl: int = 86400  # 24時間
    use_real_api: bool = False  # 実際のAPI使用フラグ


class DistributedTaskProcessor:
    """分散タスク処理管理クラス"""

    def __init__(self, cache_service: Optional[CacheService] = None):
        self.logger = logging.getLogger(__name__)
        self.cache_service = cache_service

    async def process_places_batch_workflow(
        self,
        place_ids: List[str],
        config: BatchTaskConfig
    ) -> Dict[str, Any]:
        """Places APIバッチ処理ワークフロー"""

        try:
            # バッチ分割
            batches = self._create_batches(place_ids, config.batch_size)

            # 並列バッチ処理タスク作成
            batch_tasks = group(
                process_places_batch.s(batch, asdict(config))
                for batch in batches
            )

            # データ検証・ML分析チェーン
            workflow = chain(
                batch_tasks,
                aggregate_batch_results.s(),
                validate_data_batch.s(),
                ml_quality_analysis.s()
            )

            # ワークフロー実行
            self.logger.info(f"開始: Places バッチ処理 - {len(place_ids)}件, {len(batches)}バッチ")
            result = workflow.apply_async()

            # 結果待機
            final_result = result.get(timeout=config.timeout * len(batches))

            self.logger.info(f"完了: Places バッチ処理 - 成功率 {final_result.get('success_rate', 0):.1f}%")
            return final_result

        except Exception as e:
            self.logger.error(f"バッチ処理ワークフローエラー: {e}")
            raise ProcessingError(f"Batch workflow failed: {e}")

    def _create_batches(self, items: List[str], batch_size: int) -> List[List[str]]:
        """リストをバッチに分割"""
        return [
            items[i:i + batch_size]
            for i in range(0, len(items), batch_size)
        ]


# Celery タスク定義
# ヘルパー関数（タスク外で定義）
def _process_places_batch_sync(place_ids: List[str], task_id: str, use_real_api: bool = False) -> Dict[str, Any]:
    """Places API バッチ処理（同期実装）"""
    logger = logging.getLogger(__name__)

    try:
        results = []
        cache_hits = 0
        api_calls = 0
        errors = []

        if use_real_api:
            # 実際のAPI統合を使用
            try:
                from .api_integration import create_api_integration
                from .cache_service import CacheService
                import os

                # API統合サービスを作成
                api_key = os.getenv('PLACES_API_KEY')
                if not api_key:
                    logger.warning("PLACES_API_KEY環境変数が設定されていません。モックデータを使用します。")
                    use_real_api = False
                else:
                    cache_service = CacheService()
                    api_integration = create_api_integration(
                        api_key=api_key,
                        cache_service=cache_service
                    )

                    # 非同期処理を同期実行
                    import asyncio
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                    try:
                        place_results, place_errors, stats = loop.run_until_complete(
                            api_integration.batch_fetch_places(place_ids)
                        )

                        # 結果をdict形式に変換
                        for place_data in place_results:
                            results.append({
                                "place_id": place_data.place_id,
                                "name": place_data.display_name,
                                "rating": getattr(place_data, 'rating', None),
                                "address": getattr(place_data, 'formatted_address', ''),
                                "types": getattr(place_data, 'types', [])
                            })

                        errors = place_errors
                        cache_hits = stats.get('cache_hits', 0)
                        api_calls = stats.get('api_calls', 0)

                    finally:
                        loop.close()

            except Exception as e:
                logger.error(f"API統合エラー: {e}、モックデータを使用します")
                use_real_api = False

        if not use_real_api:
            # モックデータを使用（開発・テスト用）
            for place_id in place_ids:
                try:
                    # 数値変換を安全に行う
                    rating_offset = 0.0
                    if 'test_' in place_id:
                        # test_の後の数字を取得
                        try:
                            num_part = place_id.replace('test_', '').replace('test_b_', '')
                            if num_part.replace('place_', '').isdigit():
                                rating_offset = float(num_part.replace('place_', '')) * 0.1
                            elif num_part.isdigit():
                                rating_offset = float(num_part) * 0.1
                        except ValueError:
                            rating_offset = 0.0

                    mock_data = {
                        "place_id": place_id,
                        "name": f"店舗{place_id.replace('test_', '')}",
                        "rating": 4.0 + rating_offset,
                        "address": f"佐渡市{place_id}",
                        "types": ["restaurant", "food", "establishment"]
                    }
                    results.append(mock_data)
                    api_calls += 1

                except Exception as e:
                    logger.warning(f"Place処理エラー: {place_id}, {e}")
                    errors.append(place_id)
                    continue

        return {
            "task_id": task_id,
            "status": "success",
            "processed": len(results),
            "total_requested": len(place_ids),
            "cache_hits": cache_hits,
            "api_calls": api_calls,
            "errors": len(errors),
            "error_place_ids": errors,
            "results": results,
            "api_mode": "real" if use_real_api else "mock"
        }
    except Exception as e:
        logger.error(f"バッチ処理エラー: {e}")
        raise
@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_places_batch(self, place_ids: List[str], config: Dict) -> Dict[str, Any]:
    """Places API バッチ処理タスク"""

    try:
        # 設定からAPI使用モードを取得
        use_real_api = config.get('use_real_api', False)

        # 同期処理を実行
        return _process_places_batch_sync(place_ids, self.request.id, use_real_api)

    except Exception as exc:
        self.logger.error(f"バッチ処理エラー: {exc}")
        # 自動リトライ
        raise self.retry(countdown=60 * (self.request.retries + 1), exc=exc)


def _process_single_place_sync(place_id: str, task_id: str) -> Dict[str, Any]:
    """単一Place処理（同期実装）"""
    logger = logging.getLogger(__name__)

    try:
        # プレースホルダー実装
        mock_data = {
            "place_id": place_id,
            "name": f"店舗{place_id.replace('test_', '')}",
            "rating": 4.0
        }

        return {
            "task_id": task_id,
            "place_id": place_id,
            "status": "success",
            "source": "mock",
            "data": mock_data
        }

    except Exception as e:
        return {
            "task_id": task_id,
            "place_id": place_id,
            "status": "failed",
            "error": str(e)
        }


@celery_app.task(bind=True, max_retries=2)
def process_single_place(self, place_id: str, config: Dict) -> Dict[str, Any]:
    """単一Place処理タスク"""

    try:
        return _process_single_place_sync(place_id, self.request.id)

    except Exception as exc:
        self.logger.error(f"単一Place処理エラー: {place_id}, {exc}")
        raise self.retry(countdown=30 * (self.request.retries + 1), exc=exc)


@celery_app.task
def aggregate_batch_results(batch_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """バッチ結果集約タスク"""

    try:
        aggregated_results = []
        total_processed = 0
        total_requested = 0
        total_cache_hits = 0
        total_api_calls = 0

        for batch_result in batch_results:
            if batch_result.get('status') == 'success':
                aggregated_results.extend(batch_result.get('results', []))
                total_processed += batch_result.get('processed', 0)
                total_requested += batch_result.get('total_requested', 0)
                total_cache_hits += batch_result.get('cache_hits', 0)
                total_api_calls += batch_result.get('api_calls', 0)

        success_rate = (total_processed / total_requested * 100) if total_requested > 0 else 0
        cache_hit_rate = (total_cache_hits / (total_cache_hits + total_api_calls) * 100) if (total_cache_hits + total_api_calls) > 0 else 0

        return {
            "status": "success",
            "total_processed": total_processed,
            "total_requested": total_requested,
            "success_rate": success_rate,
            "cache_hit_rate": cache_hit_rate,
            "cache_hits": total_cache_hits,
            "api_calls": total_api_calls,
            "results": aggregated_results
        }

    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
            "results": []
        }


@celery_app.task
def validate_data_batch(aggregated_data: Dict[str, Any]) -> Dict[str, Any]:
    """データ検証バッチ処理タスク"""

    try:
        # プレースホルダー実装（実際のvalidatorは後で統合）
        raw_results = aggregated_data.get('results', [])

        validated_data = []
        validation_errors = []

        for item in raw_results:
            try:
                # 基本的な検証のみ実装
                if item.get('place_id') and item.get('name'):
                    validated_data.append(item)
                else:
                    validation_errors.append({
                        "item": item.get('place_id', 'unknown'),
                        "error": "Missing required fields"
                    })
            except Exception as e:
                validation_errors.append({
                    "item": item.get('place_id', 'unknown'),
                    "error": str(e)
                })

        # 元のデータに検証結果を追加
        result = aggregated_data.copy()
        result.update({
            "validated_results": validated_data,
            "validation_errors": validation_errors,
            "validation_success_rate": len(validated_data) / len(raw_results) * 100 if raw_results else 0
        })

        return result

    except Exception as e:
        return {
            "status": "failed",
            "error": f"Validation failed: {e}",
            "validated_results": []
        }


@celery_app.task
def ml_quality_analysis(validated_data: Dict[str, Any]) -> Dict[str, Any]:
    """機械学習による品質分析タスク"""

    try:
        # プレースホルダー実装（MLエンジンは後で統合）
        validated_results = validated_data.get('validated_results', [])

        if not validated_results:
            return validated_data

        # 基本的な品質スコア算出
        quality_scores = [0.8 for _ in validated_results]  # デフォルトスコア
        anomalies = [False for _ in validated_results]     # 異常なし
        recommendations = ["品質良好" for _ in validated_results]

        # 品質フィルタリング
        high_quality_items = []
        low_quality_items = []

        for i, (item, score, is_anomaly) in enumerate(
            zip(validated_results, quality_scores, anomalies)
        ):
            if score >= 0.7 and not is_anomaly:
                high_quality_items.append(item)
            else:
                low_quality_items.append({
                    "data": item,
                    "quality_score": score,
                    "is_anomaly": is_anomaly,
                    "recommendation": recommendations[i]
                })

        # 最終結果
        result = validated_data.copy()
        result.update({
            "high_quality_results": high_quality_items,
            "low_quality_results": low_quality_items,
            "overall_quality_score": sum(quality_scores) / len(quality_scores) if quality_scores else 0,
            "anomaly_count": sum(anomalies),
            "quality_recommendations": recommendations
        })

        return result

    except Exception as e:
        # ML分析に失敗しても元のデータは返す
        result = validated_data.copy()
        result.update({
            "ml_analysis_error": str(e),
            "high_quality_results": validated_data.get('validated_results', [])
        })
        return result


# バックグラウンドタスク
@celery_app.task(queue='background')
def cache_warmup(popular_place_ids: List[str]) -> Dict[str, Any]:
    """キャッシュウォームアップタスク"""

    try:
        return _cache_warmup_async(popular_place_ids)

    except Exception as e:
        return {"status": "failed", "error": str(e)}


def _cache_warmup_async(popular_place_ids: List[str]) -> Dict[str, Any]:
    """キャッシュウォームアップ（実装）"""
    try:
        # プレースホルダー実装
        preloaded_count = len(popular_place_ids)  # 全て成功と仮定

        return {
            "status": "success",
            "preloaded_count": preloaded_count,
            "total_requested": len(popular_place_ids)
        }

    except Exception as e:
        return {"status": "failed", "error": str(e)}


@celery_app.task(queue='maintenance')
def cleanup_expired_cache() -> Dict[str, Any]:
    """期限切れキャッシュクリーンアップタスク"""

    try:
        return _cleanup_expired_cache_sync()

    except Exception as e:
        return {"status": "failed", "error": str(e)}


def _cleanup_expired_cache_sync() -> Dict[str, Any]:
    """期限切れキャッシュクリーンアップ（実装）"""
    try:
        # プレースホルダー実装
        cleared_count = 0  # 実際の実装で更新

        return {
            "status": "success",
            "cleared_count": cleared_count,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {"status": "failed", "error": str(e)}


@celery_app.task(queue='background')
def collect_performance_metrics() -> Dict[str, Any]:
    """パフォーマンスメトリクス収集タスク"""

    try:
        return _collect_performance_metrics_sync()

    except Exception as e:
        return {"status": "failed", "error": str(e)}


def _collect_performance_metrics_sync() -> Dict[str, Any]:
    """パフォーマンスメトリクス収集（実装）"""
    try:
        metrics = {}

        # プレースホルダー実装
        metrics['cache'] = {"hit_rate": 85.0, "memory_usage": "128MB"}

        # Celeryワーカー統計
        inspect = celery_app.control.inspect()
        worker_stats = inspect.stats()
        metrics['workers'] = worker_stats

        # タスクキュー統計
        active_tasks = inspect.active()
        metrics['active_tasks'] = len(active_tasks) if active_tasks else 0

        return {
            "status": "success",
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {"status": "failed", "error": str(e)}


# ヘルパー関数
def create_processing_workflow(
    place_ids: List[str],
    config: BatchTaskConfig
) -> signature:
    """分散処理ワークフロー作成"""

    # バッチ分割
    batch_size = config.batch_size
    batches = [
        place_ids[i:i + batch_size]
        for i in range(0, len(place_ids), batch_size)
    ]

    # 並列バッチ処理
    batch_tasks = group(
        process_places_batch.s(batch, asdict(config))
        for batch in batches
    )

    # 処理チェーン
    workflow = chain(
        batch_tasks,
        aggregate_batch_results.s(),
        validate_data_batch.s(),
        ml_quality_analysis.s()
    )

    return workflow


def submit_async_processing(
    place_ids: List[str],
    config: Optional[BatchTaskConfig] = None
) -> str:
    """非同期処理投入"""

    config = config or BatchTaskConfig()
    workflow = create_processing_workflow(place_ids, config)
    result = workflow.apply_async()

    return result.id


# エクスポート
__all__ = [
    'DistributedTaskProcessor',
    'TaskResult',
    'BatchTaskConfig',
    'process_places_batch',
    'process_single_place',
    'aggregate_batch_results',
    'validate_data_batch',
    'ml_quality_analysis',
    'cache_warmup',
    'cleanup_expired_cache',
    'collect_performance_metrics',
    'create_processing_workflow',
    'submit_async_processing'
]
