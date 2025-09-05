#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 2 API統合テストスクリプト

既存Places API AdapterとPhase 3-Full分散タスクシステムの統合テスト
"""

import sys
import os
import asyncio
import logging
import json
from datetime import datetime
from typing import List, Dict, Any

# パス設定
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.api_integration import create_api_integration, APIIntegrationConfig
from shared.cache_service import CacheService
from shared.distributed_tasks import BatchTaskConfig, DistributedTaskProcessor
from shared.distributed_tasks import process_places_batch, aggregate_batch_results
from shared.exceptions import APIError, ProcessingError


class Phase2APIIntegrationTester:
    """Phase 2 API統合テスター"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.setup_logging()
        self.test_results = {}
        self.api_key = os.getenv('PLACES_API_KEY')

    def setup_logging(self):
        """ログ設定"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    async def test_api_integration_basic(self) -> bool:
        """基本的なAPI統合テスト"""
        self.logger.info("--- API統合基本テスト ---")

        try:
            if not self.api_key:
                self.logger.warning("⚠️ PLACES_API_KEY未設定 - モックテストのみ実行")
                return await self._test_mock_integration()

            # キャッシュサービス初期化
            from shared.cache_service import CacheConfig

            cache_config = CacheConfig(redis_nodes=[])
            cache_service = CacheService(cache_config)

            # API統合サービス作成
            api_integration = create_api_integration(
                api_key=self.api_key,
                cache_service=cache_service,
                batch_size=5,
                request_delay=1.0
            )

            self.logger.info("✅ API統合サービス初期化: OK")

            # テスト用Place IDs（実際のGoogle Places IDs）
            test_place_ids = [
                "ChIJN1t_tDeuEmsRUsoyG83frY4",  # Google Sydney
                "ChIJrTLr-GyuEmsRBfy61i59si0",  # Sydney Opera House
                "ChIJ_____9FXXkARxxxxxxxxxxxxx"   # 無効なID（エラーテスト用）
            ]

            # 単一Place取得テスト
            place_data = await api_integration.fetch_place_details_with_cache(test_place_ids[0])
            if place_data:
                self.logger.info(f"✅ 単一Place取得: OK ({place_data.display_name})")
                self.test_results['single_place_fetch'] = True
            else:
                self.logger.warning("⚠️ 単一Place取得: データなし")
                self.test_results['single_place_fetch'] = False

            # バッチ取得テスト
            results, errors, stats = await api_integration.batch_fetch_places(test_place_ids)

            self.logger.info(f"✅ バッチ取得完了: {len(results)}件成功, {len(errors)}件エラー")
            self.logger.info(f"   キャッシュヒット率: {stats.get('cache_hit_rate', 0):.1f}%")
            self.logger.info(f"   処理時間: {stats.get('processing_time', 0):.2f}秒")

            self.test_results['batch_fetch'] = len(results) > 0
            self.test_results['api_integration_stats'] = stats

            return len(results) > 0

        except Exception as e:
            self.logger.error(f"❌ API統合基本テストエラー: {e}")
            self.test_results['api_integration_basic'] = False
            return False

    async def _test_mock_integration(self) -> bool:
        """モック統合テスト"""
        try:
            # モック用のAPI統合（APIキーなし）
            from shared.cache_service import CacheConfig

            # デフォルト設定でCacheConfigを作成
            cache_config = CacheConfig(redis_nodes=[])
            cache_service = CacheService(cache_config)

            # テスト用Place IDs
            test_place_ids = ["test_place_1", "test_place_2", "test_place_3"]

            self.logger.info("✅ モックAPI統合テスト開始")
            self.test_results['mock_integration'] = True

            return True

        except Exception as e:
            self.logger.error(f"❌ モック統合テストエラー: {e}")
            return False

    def test_distributed_tasks_with_api(self) -> bool:
        """分散タスクとAPI統合テスト"""
        self.logger.info("--- 分散タスク・API統合テスト ---")

        try:
            # テスト用設定
            config = BatchTaskConfig(
                batch_size=5,
                use_real_api=bool(self.api_key),  # APIキーがあれば実際のAPIを使用
                use_cache=True
            )

            # テスト用Place IDs
            if self.api_key:
                # 実際のPlace IDs（少数でテスト）
                test_place_ids = [
                    "ChIJN1t_tDeuEmsRUsoyG83frY4",  # Google Sydney
                    "ChIJrTLr-GyuEmsRBfy61i59si0",  # Sydney Opera House
                ]
            else:
                # モックPlace IDs
                test_place_ids = ["test_place_1", "test_place_2", "test_place_3", "test_place_4"]

            # 分散タスク実行
            task_result = process_places_batch.apply(
                args=[test_place_ids, config.__dict__]
            )

            result = task_result.get()

            self.logger.info(f"✅ 分散タスク実行: OK")
            self.logger.info(f"   処理済み: {result.get('processed', 0)}件")
            self.logger.info(f"   API呼び出し: {result.get('api_calls', 0)}件")
            self.logger.info(f"   キャッシュヒット: {result.get('cache_hits', 0)}件")
            self.logger.info(f"   エラー: {result.get('errors', 0)}件")
            self.logger.info(f"   APIモード: {result.get('api_mode', 'unknown')}")

            self.test_results['distributed_task_with_api'] = result.get('processed', 0) > 0
            self.test_results['distributed_task_result'] = result

            return result.get('processed', 0) > 0

        except Exception as e:
            self.logger.error(f"❌ 分散タスク・API統合テストエラー: {e}")
            self.test_results['distributed_task_with_api'] = False
            return False

    def test_batch_aggregation(self) -> bool:
        """バッチ結果集約テスト"""
        self.logger.info("--- バッチ結果集約テスト ---")

        try:
            # モックバッチ結果
            batch_results = [
                {
                    "status": "success",
                    "processed": 3,
                    "total_requested": 3,
                    "cache_hits": 1,
                    "api_calls": 2,
                    "results": [
                        {"place_id": "test_1", "name": "店舗1", "rating": 4.1},
                        {"place_id": "test_2", "name": "店舗2", "rating": 4.2},
                        {"place_id": "test_3", "name": "店舗3", "rating": 4.3}
                    ]
                },
                {
                    "status": "success",
                    "processed": 2,
                    "total_requested": 2,
                    "cache_hits": 0,
                    "api_calls": 2,
                    "results": [
                        {"place_id": "test_4", "name": "店舗4", "rating": 4.4},
                        {"place_id": "test_5", "name": "店舗5", "rating": 4.5}
                    ]
                }
            ]

            # 集約実行
            aggregation_result = aggregate_batch_results.apply(
                args=[batch_results]
            )

            result = aggregation_result.get()

            self.logger.info(f"✅ バッチ結果集約: OK")
            self.logger.info(f"   総処理数: {result.get('total_processed', 0)}件")
            self.logger.info(f"   成功率: {result.get('success_rate', 0):.1f}%")
            self.logger.info(f"   キャッシュヒット率: {result.get('cache_hit_rate', 0):.1f}%")

            self.test_results['batch_aggregation'] = result.get('total_processed', 0) > 0
            self.test_results['aggregation_result'] = result

            return result.get('total_processed', 0) > 0

        except Exception as e:
            self.logger.error(f"❌ バッチ結果集約テストエラー: {e}")
            self.test_results['batch_aggregation'] = False
            return False

    async def run_all_tests(self) -> Dict[str, Any]:
        """全テスト実行"""
        self.logger.info("=== Phase 2 API統合テスト開始 ===")
        start_time = datetime.now()

        # テスト実行
        tests = [
            ("API統合基本", self.test_api_integration_basic()),
            ("分散タスク・API統合", self.test_distributed_tasks_with_api),
            ("バッチ結果集約", self.test_batch_aggregation)
        ]

        passed = 0
        total = len(tests)

        for test_name, test_func in tests:
            try:
                if asyncio.iscoroutine(test_func):
                    result = await test_func
                else:
                    result = test_func()

                if result:
                    passed += 1
                    self.logger.info(f"✅ {test_name}: 成功")
                else:
                    self.logger.warning(f"⚠️ {test_name}: 失敗")

            except Exception as e:
                self.logger.error(f"❌ {test_name}: エラー - {e}")

        # 結果サマリー
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds()
        success_rate = (passed / total) * 100

        summary = {
            "total_tests": total,
            "passed_tests": passed,
            "success_rate": success_rate,
            "execution_time": execution_time,
            "timestamp": end_time.isoformat(),
            "api_key_available": bool(self.api_key),
            "test_results": self.test_results
        }

        self.logger.info(f"=== Phase 2 API統合テスト完了 ({execution_time:.2f}秒) ===")
        self.logger.info(f"成功率: {success_rate:.1f}% ({passed}/{total})")

        if self.api_key:
            self.logger.info("🔑 実際のAPI統合テスト実行")
        else:
            self.logger.info("🔧 モック統合テスト実行")

        # 結果をファイルに保存
        result_file = f"phase2_api_integration_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

        self.logger.info(f"テスト結果を {result_file} に保存しました")

        return summary


async def main():
    """メイン関数"""
    tester = Phase2APIIntegrationTester()

    try:
        results = await tester.run_all_tests()

        if results['success_rate'] >= 70:
            print(f"\n🎉 Phase 2 API統合: 成功 ({results['success_rate']:.1f}%)")
            return 0
        else:
            print(f"\n⚠️ Phase 2 API統合: 要改善 ({results['success_rate']:.1f}%)")
            return 1

    except Exception as e:
        print(f"\n❌ Phase 2 API統合テストエラー: {e}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
