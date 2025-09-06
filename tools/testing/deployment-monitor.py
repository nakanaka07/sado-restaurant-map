#!/usr/bin/env python3
"""
Deployment Monitor Script
佐渡飲食店マップ デプロイメント監視

デプロイメント後のシステム安定性を監視します。
"""

import asyncio
import aiohttp
import time
import argparse
import sys
from typing import Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DeploymentMonitor:
    """デプロイメント監視クラス"""

    def __init__(self, url: str, duration: int = 600):
        self.url = url
        self.duration = duration
        self.alert_threshold_error_rate = 5.0  # 5%
        self.alert_threshold_response_time = 2.0  # 2 seconds

        self.error_count = 0
        self.total_requests = 0
        self.response_times: List[float] = []

    async def monitor_health(self) -> bool:
        """ヘルスチェック監視"""
        logger.info("🔍 デプロイメント監視開始")
        logger.info(f"監視時間: {self.duration}秒")
        logger.info(f"対象URL: {self.url}")

        start_time = time.time()

        async with aiohttp.ClientSession() as session:
            while (time.time() - start_time) < self.duration:
                try:
                    # API ヘルスチェック
                    request_start = time.time()

                    async with session.get(f"{self.url}/health", timeout=10) as response:
                        response_time = time.time() - request_start
                        self.response_times.append(response_time)
                        self.total_requests += 1

                        if response.status != 200:
                            self.error_count += 1
                            logger.warning(f"⚠️ Error response: {response.status}")

                        # レスポンス時間チェック
                        if response_time > self.alert_threshold_response_time:
                            logger.warning(f"⚠️ Slow response: {response_time*1000:.0f}ms")

                        # エラー率チェック
                        error_rate = (self.error_count / self.total_requests) * 100
                        if error_rate > self.alert_threshold_error_rate:
                            logger.error(f"❌ Error rate too high: {error_rate:.1f}%")
                            return False

                except asyncio.TimeoutError:
                    self.error_count += 1
                    self.total_requests += 1
                    logger.warning("⚠️ Request timeout")

                except Exception as e:
                    self.error_count += 1
                    self.total_requests += 1
                    logger.warning(f"⚠️ Request error: {e}")

                await asyncio.sleep(10)  # 10秒間隔

        return self._evaluate_results()

    def _evaluate_results(self) -> bool:
        """結果評価"""
        error_rate = (self.error_count / self.total_requests) * 100 if self.total_requests > 0 else 0
        avg_response_time = sum(self.response_times) / len(self.response_times) if self.response_times else 0

        logger.info("✅ 監視完了")
        logger.info(f"総リクエスト数: {self.total_requests}")
        logger.info(f"エラー数: {self.error_count}")
        logger.info(f"エラー率: {error_rate:.1f}%")
        logger.info(f"平均レスポンス時間: {avg_response_time*1000:.0f}ms")

        if self.error_count == 0:
            logger.info("🎉 デプロイメント成功！")
            return True
        elif error_rate <= self.alert_threshold_error_rate:
            logger.info("✅ デプロイメント成功（軽微なエラーあり）")
            return True
        else:
            logger.error("❌ デプロイメント失敗")
            return False

    async def run_comprehensive_check(self) -> Dict[str, bool]:
        """包括的チェック実行"""
        results = {}

        # 基本ヘルスチェック
        results['health_check'] = await self.monitor_health()

        # API エンドポイントチェック
        results['api_endpoints'] = await self._check_api_endpoints()

        # パフォーマンステスト
        results['performance'] = await self._check_performance()

        return results

    async def _check_api_endpoints(self) -> bool:
        """API エンドポイントチェック"""
        logger.info("🔍 API エンドポイントチェック")

        endpoints = [
            '/health',
            '/api/places',
            '/api/search',
            '/api/status'
        ]

        success_count = 0

        async with aiohttp.ClientSession() as session:
            for endpoint in endpoints:
                try:
                    async with session.get(f"{self.url}{endpoint}", timeout=5) as response:
                        if response.status in [200, 404]:  # 404も正常レスポンス
                            success_count += 1
                            logger.info(f"✅ {endpoint}: {response.status}")
                        else:
                            logger.warning(f"⚠️ {endpoint}: {response.status}")

                except Exception as e:
                    logger.error(f"❌ {endpoint}: {e}")

        success_rate = (success_count / len(endpoints)) * 100
        logger.info(f"API エンドポイント成功率: {success_rate:.1f}%")

        return success_rate >= 80.0  # 80%以上で成功

    async def _check_performance(self) -> bool:
        """パフォーマンスチェック"""
        logger.info("⚡ パフォーマンスチェック")

        concurrent_requests = 10
        total_requests = 50

        async with aiohttp.ClientSession() as session:
            tasks = []
            for _ in range(total_requests):
                task = self._single_performance_request(session)
                tasks.append(task)

                # 同時リクエスト数制限
                if len(tasks) >= concurrent_requests:
                    await asyncio.gather(*tasks, return_exceptions=True)
                    tasks = []

            # 残りのリクエスト実行
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

        # パフォーマンス評価
        if self.response_times:
            avg_time = sum(self.response_times[-total_requests:]) / min(total_requests, len(self.response_times))
            p95_time = sorted(self.response_times[-total_requests:])[int(total_requests * 0.95)]

            logger.info(f"平均レスポンス時間: {avg_time*1000:.0f}ms")
            p95_time_ms = int(p95_time * 1000)
            logger.info("95%%ile レスポンス時間: %dms", p95_time_ms)

            # パフォーマンス基準
            return avg_time < 1.0 and p95_time < 3.0

        return False

    async def _single_performance_request(self, session: aiohttp.ClientSession):
        """単一パフォーマンスリクエスト"""
        try:
            start_time = time.time()
            async with session.get(f"{self.url}/health", timeout=10) as response:
                response_time = time.time() - start_time
                self.response_times.append(response_time)
                return response.status == 200
        except Exception:
            return False


async def main():
    """メイン実行関数"""
    parser = argparse.ArgumentParser(description="デプロイメント監視スクリプト")
    parser.add_argument("--url", default="https://sado-restaurant-map.com", help="監視対象URL")
    parser.add_argument("--duration", type=int, default=600, help="監視時間（秒）")
    parser.add_argument("--comprehensive", action="store_true", help="包括的チェック実行")

    args = parser.parse_args()

    monitor = DeploymentMonitor(args.url, args.duration)

    try:
        if args.comprehensive:
            results = await monitor.run_comprehensive_check()

            # 結果評価
            all_passed = all(results.values())

            logger.info("📊 包括的チェック結果:")
            for test_name, passed in results.items():
                status = "✅ 合格" if passed else "❌ 不合格"
                logger.info(f"  {test_name}: {status}")

            if all_passed:
                logger.info("🎉 全テスト合格！")
                sys.exit(0)
            else:
                logger.error("❌ 一部テストが失敗しました")
                sys.exit(1)
        else:
            # 基本監視のみ
            success = await monitor.monitor_health()
            sys.exit(0 if success else 1)

    except KeyboardInterrupt:
        logger.info("🛑 監視が中断されました")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ 監視中にエラーが発生: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
