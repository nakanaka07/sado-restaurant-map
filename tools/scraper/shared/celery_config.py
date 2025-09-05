"""
Celery Configuration for Distributed Task Processing

High-performance distributed task queue system using Redis as broker
with intelligent routing, auto-scaling, and monitoring capabilities.
"""

from celery import Celery
from kombu import Queue, Exchange
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import timedelta


# Celery アプリケーション作成
celery_app = Celery('sado_scraper')

# ログ設定
logging.getLogger('celery').setLevel(logging.INFO)


def configure_celery(
    redis_url: str = "redis://localhost:6379/0",
    result_backend: Optional[str] = None
) -> Celery:
    """Celery設定"""

    # Redis をブローカーとして使用
    celery_app.conf.broker_url = redis_url
    celery_app.conf.result_backend = result_backend or redis_url

    # 基本設定
    celery_app.conf.update(
        # タスクシリアライゼーション
        task_serializer='pickle',
        accept_content=['pickle', 'json'],
        result_serializer='pickle',
        timezone='Asia/Tokyo',
        enable_utc=True,

        # ワーカー設定
        worker_prefetch_multiplier=1,
        task_acks_late=True,
        worker_max_tasks_per_child=1000,
        worker_disable_rate_limits=False,

        # 結果バックエンド設定
        result_expires=3600,  # 1時間
        result_persistent=True,

        # 監視設定
        worker_send_task_events=True,
        task_send_sent_event=True,

        # タスクルーティング設定
        task_routes={
            'scraper.tasks.process_places_batch': {'queue': 'high_priority'},
            'scraper.tasks.process_single_place': {'queue': 'normal'},
            'scraper.tasks.validate_data_batch': {'queue': 'validation'},
            'scraper.tasks.ml_quality_analysis': {'queue': 'ml_processing'},
            'scraper.tasks.cache_warmup': {'queue': 'background'},
            'scraper.tasks.cleanup_expired_cache': {'queue': 'maintenance'},
        },

        # キュー定義
        task_queues=(
            Queue('high_priority',
                  Exchange('high_priority', type='direct'),
                  routing_key='high_priority',
                  queue_arguments={'x-max-priority': 10}),
            Queue('normal',
                  Exchange('normal', type='direct'),
                  routing_key='normal',
                  queue_arguments={'x-max-priority': 5}),
            Queue('validation',
                  Exchange('validation', type='direct'),
                  routing_key='validation',
                  queue_arguments={'x-max-priority': 7}),
            Queue('ml_processing',
                  Exchange('ml_processing', type='direct'),
                  routing_key='ml_processing',
                  queue_arguments={'x-max-priority': 3}),
            Queue('background',
                  Exchange('background', type='direct'),
                  routing_key='background',
                  queue_arguments={'x-max-priority': 1}),
            Queue('maintenance',
                  Exchange('maintenance', type='direct'),
                  routing_key='maintenance',
                  queue_arguments={'x-max-priority': 1}),
        ),

        # リトライ設定
        task_retry_backoff=True,
        task_retry_backoff_max=600,  # 10分
        task_retry_jitter=True,

        # 実行時制限
        task_time_limit=1800,      # 30分でハードタイムアウト
        task_soft_time_limit=1500,  # 25分でソフトタイムアウト

        # ビート設定（定期タスク）
        beat_schedule={
            'cleanup-expired-cache': {
                'task': 'scraper.tasks.cleanup_expired_cache',
                'schedule': timedelta(minutes=30),
                'options': {'queue': 'maintenance'}
            },
            'cache-warmup': {
                'task': 'scraper.tasks.cache_warmup',
                'schedule': timedelta(hours=2),
                'options': {'queue': 'background'}
            },
            'performance-metrics': {
                'task': 'scraper.tasks.collect_performance_metrics',
                'schedule': timedelta(minutes=5),
                'options': {'queue': 'background'}
            },
        },
    )

    return celery_app


# デバッグ用設定
def configure_celery_debug() -> Celery:
    """開発・デバッグ用Celery設定"""
    celery_app.conf.update(
        task_always_eager=True,  # タスクを同期実行
        task_eager_propagates=True,
        broker_url='memory://',
        result_backend='cache+memory://',
    )
    return celery_app


# プロダクション用設定
def configure_celery_production(
    redis_cluster_nodes: List[str],
    redis_password: Optional[str] = None
) -> Celery:
    """プロダクション用Celery設定"""

    # Redis Cluster URL構築
    if redis_password:
        redis_urls = [f"redis://:{redis_password}@{node}/0" for node in redis_cluster_nodes]
    else:
        redis_urls = [f"redis://{node}/0" for node in redis_cluster_nodes]

    primary_redis = redis_urls[0]

    celery_app.conf.update(
        broker_url=primary_redis,
        result_backend=primary_redis,

        # プロダクション最適化
        worker_concurrency=4,
        worker_prefetch_multiplier=2,
        task_compression='gzip',
        result_compression='gzip',

        # 高可用性設定
        broker_connection_retry_on_startup=True,
        broker_connection_retry=True,
        broker_connection_max_retries=10,

        # パフォーマンス最適化
        task_ignore_result=False,
        result_expires=7200,  # 2時間

        # セキュリティ設定
        worker_hijack_root_logger=False,
        worker_log_color=False,

        # 監視強化
        worker_send_task_events=True,
        task_send_sent_event=True,
        task_track_started=True,

        # カスタムシリアライザー設定
        task_serializer='pickle',
        result_serializer='pickle',
        accept_content=['pickle'],
    )

    return celery_app


# 環境変数からの自動設定
def auto_configure_celery() -> Celery:
    """環境変数から自動的にCelery設定"""
    redis_url = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    result_backend = os.getenv('CELERY_RESULT_BACKEND')
    environment = os.getenv('ENVIRONMENT', 'development')

    if environment == 'development':
        return configure_celery_debug()
    elif environment == 'production':
        # プロダクション環境での Redis Cluster ノード
        cluster_nodes = os.getenv('REDIS_CLUSTER_NODES', 'localhost:6379').split(',')
        redis_password = os.getenv('REDIS_PASSWORD')
        return configure_celery_production(cluster_nodes, redis_password)
    else:
        return configure_celery(redis_url, result_backend)


# ヘルスチェック用タスク
@celery_app.task(bind=True, name='celery.health_check')
def health_check(self):
    """Celeryワーカーのヘルスチェック"""
    import platform
    import psutil
    from datetime import datetime

    return {
        'status': 'healthy',
        'worker_id': self.request.id,
        'hostname': platform.node(),
        'timestamp': datetime.now().isoformat(),
        'system_info': {
            'cpu_percent': psutil.cpu_percent(),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_percent': psutil.disk_usage('/').percent,
        }
    }


# ワーカー統計情報取得
@celery_app.task(name='celery.get_worker_stats')
def get_worker_stats():
    """ワーカー統計情報取得"""
    inspect = celery_app.control.inspect()

    stats = {
        'active_tasks': inspect.active(),
        'scheduled_tasks': inspect.scheduled(),
        'reserved_tasks': inspect.reserved(),
        'worker_stats': inspect.stats(),
        'registered_tasks': inspect.registered(),
    }

    return stats


# 設定確認用関数
def get_celery_config_summary() -> Dict[str, Any]:
    """Celery設定サマリー取得"""
    conf = celery_app.conf

    return {
        'broker_url': conf.broker_url,
        'result_backend': conf.result_backend,
        'task_serializer': conf.task_serializer,
        'result_serializer': conf.result_serializer,
        'timezone': conf.timezone,
        'worker_prefetch_multiplier': conf.worker_prefetch_multiplier,
        'task_acks_late': conf.task_acks_late,
        'worker_max_tasks_per_child': conf.worker_max_tasks_per_child,
        'task_time_limit': conf.task_time_limit,
        'task_soft_time_limit': conf.task_soft_time_limit,
        'queues': [q.name for q in conf.task_queues],
        'routes': list(conf.task_routes.keys()),
    }


# 初期化
if not celery_app.conf.get('configured'):
    auto_configure_celery()
    celery_app.conf.configured = True


# インポート用エクスポート
__all__ = [
    'celery_app',
    'configure_celery',
    'configure_celery_debug',
    'configure_celery_production',
    'auto_configure_celery',
    'get_celery_config_summary',
    'health_check',
    'get_worker_stats'
]
