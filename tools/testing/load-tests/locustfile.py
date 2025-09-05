#!/usr/bin/env python3
"""
Phase 3-Full統合テスト環境用ロードテストファイル
Locustを使用したパフォーマンステスト実装
"""

# 条件付きインポート - 開発環境での型チェックエラー回避
try:
    from locust import HttpUser, task, between, events  # type: ignore
    LOCUST_AVAILABLE = True
except ImportError:
    # 開発環境でlocustが利用できない場合は型定義スタブを使用
    try:
        from .locust_types import HttpUser, task, between, events  # type: ignore
        LOCUST_AVAILABLE = False
    except ImportError:
        # フォールバック用の最小限のモック
        LOCUST_AVAILABLE = False

        class HttpUser:
            wait_time = None
            weight = 1
            def __init__(self):
                self.client = None

        def task(weight: int = 1):
            """Locust task デコレータのモック"""
            def decorator(func):
                func._task_weight = weight
                return func
            return decorator

        def between(min_wait: float, max_wait: float):
            """Locust between 関数のモック"""
            return lambda: (min_wait + max_wait) / 2

        class events:
            class test_start:
                @staticmethod
                def add_listener(func):
                    return func

            class test_stop:
                @staticmethod
                def add_listener(func):
                    return func

import json
import random
import time
from datetime import datetime
import logging
from typing import Optional, Dict, Any

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SadoRestaurantMapUser(HttpUser):
    """佐渡飲食店マップユーザーシミュレーション"""

    wait_time = between(1, 3)  # ユーザー間のウェイト時間
    weight = 1

    def on_start(self):
        """テスト開始時の初期化"""
        self.test_data = {
            'start_time': time.time(),
            'user_id': f"test_user_{random.randint(1000, 9999)}",
            'session_id': f"session_{int(time.time())}_{random.randint(100, 999)}"
        }
        logger.info(f"Starting test for user: {self.test_data['user_id']}")

    @task(10)
    def view_homepage(self):
        """ホームページアクセステスト（最も頻繁）"""
        with self.client.get("/", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Homepage failed with status {response.status_code}")

    @task(8)
    def health_check(self):
        """ヘルスチェックエンドポイントテスト"""
        with self.client.get("/health", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    response.success()
                else:
                    response.failure("Health check returned unhealthy status")
            else:
                response.failure(f"Health check failed with status {response.status_code}")

    @task(6)
    def search_restaurants(self):
        """レストラン検索テスト（佐渡特化）"""
        # 佐渡特有の検索キーワード
        search_terms = [
            '寿司', 'ラーメン', '居酒屋', 'カフェ', '焼肉', '海鮮',
            '日本料理', 'そば', 'うどん', '定食', 'イタリアン',
            '佐渡牛', '海鮮丼', '刺身', '天ぷら', '料亭'
        ]
        locations = ['両津', '佐和田', '金井', '新穂', '畑野', '真野', '小木', '羽茂', '赤泊']

        query = random.choice(search_terms)
        location = random.choice(locations) if random.random() > 0.5 else None

        params = {'q': query}
        if location:
            params['location'] = location

        with self.client.get("/api/search", params=params, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) or 'results' in data:
                    response.success()
                    logger.info(f"検索成功: {query} in {location or '全域'}")
                else:
                    response.failure("Search returned invalid format")
            else:
                response.failure(f"Search failed with status {response.status_code}")

    @task(5)
    def get_restaurant_details(self):
        """レストラン詳細取得テスト"""
        # テスト用の仮想レストランID
        restaurant_ids = ['rest_001', 'rest_002', 'rest_003', 'rest_004', 'rest_005']
        restaurant_id = random.choice(restaurant_ids)

        with self.client.get(f"/api/restaurants/{restaurant_id}", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'name' in data:
                    response.success()
                else:
                    response.failure("Restaurant details missing required fields")
            elif response.status_code == 404:
                # テストデータが存在しない場合は正常
                response.success()
            else:
                response.failure(f"Restaurant details failed with status {response.status_code}")

    @task(4)
    def map_api_request(self):
        """マップAPI連携テスト"""
        # 佐渡島の座標範囲
        lat = random.uniform(37.7, 38.3)  # 佐渡島の緯度範囲
        lng = random.uniform(138.1, 138.6)  # 佐渡島の経度範囲

        with self.client.get(f"/api/map/nearby?lat={lat}&lng={lng}&radius=1000", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) or 'places' in data:
                    response.success()
                else:
                    response.failure("Map API returned invalid format")
            else:
                response.failure(f"Map API failed with status {response.status_code}")

    @task(3)
    def static_assets(self):
        """静的アセットアクセステスト"""
        assets = ['/favicon.ico', '/manifest.json', '/robots.txt']
        asset = random.choice(assets)

        with self.client.get(asset, catch_response=True) as response:
            if response.status_code in [200, 304]:  # OK or Not Modified
                response.success()
            else:
                response.failure(f"Static asset {asset} failed with status {response.status_code}")

    @task(2)
    def celery_task_status(self):
        """Celeryタスクステータス確認テスト"""
        # テスト用タスクID
        task_id = f"test_task_{random.randint(10000, 99999)}"

        with self.client.get(f"/api/tasks/{task_id}/status", catch_response=True) as response:
            if response.status_code in [200, 404]:  # タスクが存在するか、存在しない場合
                response.success()
            else:
                response.failure(f"Task status check failed with status {response.status_code}")

    @task(1)
    def redis_cache_test(self):
        """Redisキャッシュテスト"""
        cache_key = f"test_cache_{random.randint(1, 100)}"

        with self.client.get(f"/api/cache/{cache_key}", catch_response=True) as response:
            if response.status_code in [200, 404]:  # キャッシュが存在するか、存在しない場合
                response.success()
            else:
                response.failure(f"Cache test failed with status {response.status_code}")


class AdminUser(HttpUser):
    """管理者ユーザーシミュレーション（高負荷操作）"""

    wait_time = between(5, 10)  # 管理者操作は間隔が長い
    weight = 1

    @task(5)
    def admin_dashboard(self):
        """管理者ダッシュボードアクセス"""
        with self.client.get("/admin/dashboard", catch_response=True) as response:
            if response.status_code in [200, 401, 403]:  # 認証が必要な場合
                response.success()
            else:
                response.failure(f"Admin dashboard failed with status {response.status_code}")

    @task(3)
    def bulk_data_processing(self):
        """大量データ処理テスト"""
        payload = {
            'action': 'bulk_process',
            'data_size': random.randint(100, 1000),
            'process_type': random.choice(['update', 'validate', 'index'])
        }

        with self.client.post("/api/admin/bulk-process",
                             json=payload,
                             catch_response=True) as response:
            if response.status_code in [200, 202, 401, 403]:  # 処理開始または認証エラー
                response.success()
            else:
                response.failure(f"Bulk processing failed with status {response.status_code}")

    @task(2)
    def system_metrics(self):
        """システムメトリクス取得"""
        with self.client.get("/api/admin/metrics", catch_response=True) as response:
            if response.status_code in [200, 401, 403]:
                response.success()
            else:
                response.failure(f"System metrics failed with status {response.status_code}")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """テスト開始時のイベント"""
    logger.info("=== Phase 3-Full統合テスト開始 ===")
    logger.info(f"Target host: {environment.host}")
    logger.info(f"User count: {environment.runner.target_user_count}")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """テスト終了時のイベント"""
    logger.info("=== Phase 3-Full統合テスト終了 ===")

    # テスト結果の簡易レポート
    stats = environment.runner.stats
    logger.info(f"Total requests: {stats.total.num_requests}")
    logger.info(f"Failed requests: {stats.total.num_failures}")
    logger.info(f"Average response time: {stats.total.avg_response_time:.2f}ms")
    logger.info(f"Max response time: {stats.total.max_response_time:.2f}ms")


if __name__ == "__main__":
    # スタンドアロン実行用（開発・デバッグ用）
    import subprocess
    import sys

    if not LOCUST_AVAILABLE:
        print("❌ エラー: Locustがインストールされていません")
        print("インストール方法: pip install locust")
        sys.exit(1)

    print("統合テスト用ロードテスト開始...")
    print("Locust Web UI: http://localhost:8089")

    cmd = [
        sys.executable, "-m", "locust",
        "-f", __file__,
        "--host", "http://localhost:3001",
        "--web-host", "0.0.0.0",
        "--web-port", "8089"
    ]

    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Locust実行エラー: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️ テストが中断されました")
        sys.exit(0)
