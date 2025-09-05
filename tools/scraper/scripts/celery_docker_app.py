#!/usr/bin/env python3
"""
Docker環境用Celeryアプリケーション

Phase 3-Full Docker展開での分散処理システム
"""

import os
import sys
from pathlib import Path

# パス設定
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir.parent))

from shared.celery_config import configure_celery

def create_docker_celery_app():
    """Docker環境用Celeryアプリケーション作成"""

    # Docker環境変数から設定取得
    redis_url = os.getenv(
        'CELERY_BROKER_URL',
        'redis://redis-master:6379/0'
    )

    result_backend = os.getenv(
        'CELERY_RESULT_BACKEND',
        'redis://redis-master:6379/0'
    )

    # Celery設定
    app = configure_celery(
        redis_url=redis_url,
        result_backend=result_backend
    )

    # Docker環境用追加設定
    app.conf.update(
        # ワーカー設定
        worker_concurrency=int(os.getenv('CELERY_WORKER_CONCURRENCY', '4')),
        worker_max_tasks_per_child=int(os.getenv('CELERY_WORKER_MAX_TASKS_PER_CHILD', '1000')),

        # タスク設定
        task_soft_time_limit=240,
        task_time_limit=300,

        # 結果設定
        result_expires=3600,
        result_compression='gzip',

        # 監視設定
        worker_send_task_events=True,
        task_send_sent_event=True,

        # セキュリティ
        worker_hijack_root_logger=False,
        worker_log_color=False,

        # パフォーマンス
        task_compression='gzip',
        worker_prefetch_multiplier=4,
        task_acks_late=True,
        worker_disable_rate_limits=False,

        # ヘルスチェック
        worker_enable_remote_control=True,
    )

    print(f"🐳 Docker Celery App initialized:")
    print(f"   Broker: {redis_url}")
    print(f"   Backend: {result_backend}")
    print(f"   Concurrency: {app.conf.worker_concurrency}")

    return app

# Docker環境用アプリケーション
app = create_docker_celery_app()

if __name__ == '__main__':
    app.start()
