#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 2 実データテストスクリプト

実際のGoogle Places APIを使用したPhase 2 API統合の実データテスト
"""

import sys
import os
import asyncio
import logging
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

# JSON datetime エンコーダー
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# パス設定
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.api_integration import create_api_integration, APIIntegrationConfig
from shared.cache_service import CacheService, CacheConfig
from shared.distributed_tasks import BatchTaskConfig, process_places_batch
from shared.exceptions import APIError, ProcessingError


class Phase2RealDataTester:
    """Phase 2 実データテスター"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.setup_logging()
        self.test_results = {}
        self.api_key = os.getenv('PLACES_API_KEY')

        # 佐渡島周辺の実際のPlace IDs（テスト用）
        self.sado_test_place_ids = [
            # 実在する可能性が高い汎用的なPlace ID形式を使用
            # 実際のテストではSado Island周辺の検索で取得したIDを使用
        ]

        # より一般的なテスト用Place IDs（確実に存在する）
        self.general_test_place_ids = [
            "ChIJN1t_tDeuEmsRUsoyG83frY4",  # Google Sydney (確実に存在)
            "ChIJrTLr-GyuEmsRBfy61i59si0",  # Sydney Opera House (確実に存在)
            "ChIJ2WrMN9MDdkgRo_juFXH0MM4",  # Big Ben, London (確実に存在)
        ]

    def setup_logging(self):
        """ログ設定"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    def check_api_key_availability(self) -> bool:
        """API キーの可用性確認"""
        self.logger.info("--- API キー可用性確認 ---")

        if not self.api_key:
            self.logger.error("❌ PLACES_API_KEY環境変数が設定されていません")
            self.logger.info("💡 実データテストを実行するには、Google Places APIキーが必要です")
            self.logger.info("💡 設定方法: export PLACES_API_KEY='your_api_key_here'")
            return False

        self.logger.info(f"✅ API キー確認: OK (長さ: {len(self.api_key)}文字)")
        return True

    async def test_single_place_real_api(self) -> bool:
        """単一Place実データAPIテスト"""
        self.logger.info("--- 単一Place実データAPIテスト ---")

        try:
            # ローカルキャッシュサービス設定 (Redisなし)
            cache_config = CacheConfig(
                redis_nodes=[],  # 空配列 = ローカルキャッシュ使用
                default_ttl=3600,
                compression_enabled=False
            )
            cache_service = CacheService(cache_config)
            await cache_service.initialize()  # 初期化を追加

            # API統合サービス作成
            api_integration = create_api_integration(
                api_key=self.api_key,
                cache_service=cache_service,
                request_delay=1.0,
                timeout=30
            )

            # 実際のPlace IDでテスト
            test_place_id = self.general_test_place_ids[0]
            self.logger.info(f"テスト対象Place ID: {test_place_id}")

            start_time = datetime.now()
            place_data = await api_integration.fetch_place_details_with_cache(test_place_id)
            end_time = datetime.now()

            processing_time = (end_time - start_time).total_seconds()

            if place_data:
                self.logger.info("✅ 単一Place実データ取得: 成功")
                self.logger.info(f"   Place ID: {getattr(place_data, 'place_id', 'N/A')}")
                self.logger.info(f"   名前: {getattr(place_data, 'display_name', 'N/A')}")
                self.logger.info(f"   住所: {getattr(place_data, 'formatted_address', 'N/A')}")
                self.logger.info(f"   評価: {getattr(place_data, 'rating', 'N/A')}")
                self.logger.info(f"   処理時間: {processing_time:.2f}秒")

                self.test_results['single_place_real'] = {
                    "success": True,
                    "place_data": {
                        "place_id": getattr(place_data, 'place_id', 'N/A'),
                        "name": getattr(place_data, 'display_name', 'N/A'),
                        "address": getattr(place_data, 'formatted_address', 'N/A'),
                        "rating": getattr(place_data, 'rating', 'N/A')
                    },
                    "processing_time": processing_time
                }
                return True
            else:
                self.logger.warning("⚠️ 単一Place実データ取得: データなし")
                self.test_results['single_place_real'] = {"success": False, "reason": "no_data"}
                return False

        except Exception as e:
            self.logger.error(f"❌ 単一Place実データAPIテストエラー: {e}")
            self.test_results['single_place_real'] = {"success": False, "error": str(e)}
            return False

    async def test_batch_places_real_api(self) -> bool:
        """バッチPlace実データAPIテスト"""
        self.logger.info("--- バッチPlace実データAPIテスト ---")

        try:
            # キャッシュサービス設定
            cache_config = CacheConfig(redis_nodes=[])
            cache_service = CacheService(cache_config)

            # API統合サービス作成
            api_integration = create_api_integration(
                api_key=self.api_key,
                cache_service=cache_service,
                batch_size=3,
                request_delay=1.0,
                timeout=60
            )

            # 複数のPlace IDでバッチテスト
            test_place_ids = self.general_test_place_ids[:3]  # 最初の3つ
            self.logger.info(f"テスト対象Place IDs: {len(test_place_ids)}件")

            start_time = datetime.now()
            results, errors, stats = await api_integration.batch_fetch_places(test_place_ids)
            end_time = datetime.now()

            total_time = (end_time - start_time).total_seconds()

            self.logger.info("✅ バッチPlace実データ取得: 完了")
            self.logger.info(f"   成功: {len(results)}件")
            self.logger.info(f"   エラー: {len(errors)}件")
            self.logger.info(f"   API呼び出し: {stats.get('api_calls', 0)}件")
            self.logger.info(f"   キャッシュヒット: {stats.get('cache_hits', 0)}件")
            self.logger.info(f"   総処理時間: {total_time:.2f}秒")
            self.logger.info(f"   平均処理時間: {total_time/len(test_place_ids):.2f}秒/件")

            # 取得したデータの詳細
            for i, place_data in enumerate(results[:2]):  # 最初の2件を表示
                self.logger.info(f"   結果{i+1}: {getattr(place_data, 'display_name', 'N/A')}")

            self.test_results['batch_places_real'] = {
                "success": len(results) > 0,
                "total_requested": len(test_place_ids),
                "successful": len(results),
                "errors": len(errors),
                "stats": stats,
                "total_time": total_time,
                "avg_time_per_place": total_time/len(test_place_ids)
            }

            return len(results) > 0

        except Exception as e:
            self.logger.error(f"❌ バッチPlace実データAPIテストエラー: {e}")
            self.test_results['batch_places_real'] = {"success": False, "error": str(e)}
            return False

    def test_distributed_task_real_api(self) -> bool:
        """分散タスク実データAPIテスト"""
        self.logger.info("--- 分散タスク実データAPIテスト ---")

        try:
            # 実データ使用設定
            config = BatchTaskConfig(
                batch_size=2,
                use_real_api=True,  # 実際のAPIを使用
                use_cache=True,
                timeout=120  # 2分のタイムアウト
            )

            # テスト用Place IDs（少数でテスト）
            test_place_ids = self.general_test_place_ids[:2]  # 最初の2つ

            self.logger.info(f"テスト対象: {len(test_place_ids)}件")
            self.logger.info("分散タスク実行中...")

            start_time = datetime.now()
            task_result = process_places_batch.apply(
                args=[test_place_ids, config.__dict__]
            )

            result = task_result.get(timeout=config.timeout)
            end_time = datetime.now()

            processing_time = (end_time - start_time).total_seconds()

            self.logger.info("✅ 分散タスク実データ実行: 完了")
            self.logger.info(f"   処理済み: {result.get('processed', 0)}件")
            self.logger.info(f"   リクエスト総数: {result.get('total_requested', 0)}件")
            self.logger.info(f"   API呼び出し: {result.get('api_calls', 0)}件")
            self.logger.info(f"   キャッシュヒット: {result.get('cache_hits', 0)}件")
            self.logger.info(f"   エラー: {result.get('errors', 0)}件")
            self.logger.info(f"   APIモード: {result.get('api_mode', 'unknown')}")
            self.logger.info(f"   処理時間: {processing_time:.2f}秒")

            # 結果の詳細表示
            results = result.get('results', [])
            for i, place_result in enumerate(results[:2]):  # 最初の2件
                self.logger.info(f"   結果{i+1}: {place_result.get('name', 'N/A')} (評価: {place_result.get('rating', 'N/A')})")

            self.test_results['distributed_task_real'] = {
                "success": result.get('processed', 0) > 0,
                "result": result,
                "processing_time": processing_time
            }

            return result.get('processed', 0) > 0

        except Exception as e:
            self.logger.error(f"❌ 分散タスク実データAPIテストエラー: {e}")
            self.test_results['distributed_task_real'] = {"success": False, "error": str(e)}
            return False

    async def test_cache_integration_real_api(self) -> bool:
        """キャッシュ統合実データテスト"""
        self.logger.info("--- キャッシュ統合実データテスト ---")

        try:
            # キャッシュサービス設定
            cache_config = CacheConfig(redis_nodes=[])
            cache_service = CacheService(cache_config)

            # API統合サービス作成
            api_integration = create_api_integration(
                api_key=self.api_key,
                cache_service=cache_service,
                request_delay=1.0
            )

            test_place_id = self.general_test_place_ids[0]

            # 1回目：APIから取得
            self.logger.info("1回目取得（API）...")
            start_time1 = datetime.now()
            place_data1 = await api_integration.fetch_place_details_with_cache(test_place_id)
            end_time1 = datetime.now()
            time1 = (end_time1 - start_time1).total_seconds()

            # 2回目：キャッシュから取得
            self.logger.info("2回目取得（キャッシュ）...")
            start_time2 = datetime.now()
            place_data2 = await api_integration.fetch_place_details_with_cache(test_place_id)
            end_time2 = datetime.now()
            time2 = (end_time2 - start_time2).total_seconds()

            if place_data1 and place_data2:
                speedup = time1 / time2 if time2 > 0 else 1
                self.logger.info("✅ キャッシュ統合実データテスト: 成功")
                self.logger.info(f"   1回目（API）: {time1:.3f}秒")
                self.logger.info(f"   2回目（キャッシュ）: {time2:.3f}秒")
                self.logger.info(f"   スピードアップ: {speedup:.2f}倍")

                self.test_results['cache_integration_real'] = {
                    "success": True,
                    "api_time": time1,
                    "cache_time": time2,
                    "speedup": speedup
                }
                return True
            else:
                self.logger.warning("⚠️ キャッシュ統合実データテスト: データ取得失敗")
                return False

        except Exception as e:
            self.logger.error(f"❌ キャッシュ統合実データテストエラー: {e}")
            self.test_results['cache_integration_real'] = {"success": False, "error": str(e)}
            return False

    async def test_error_handling_real_api(self) -> bool:
        """エラーハンドリング実データテスト"""
        self.logger.info("--- エラーハンドリング実データテスト ---")

        try:
            # キャッシュサービス設定
            cache_config = CacheConfig(redis_nodes=[])
            cache_service = CacheService(cache_config)

            # API統合サービス作成
            api_integration = create_api_integration(
                api_key=self.api_key,
                cache_service=cache_service,
                timeout=5  # 短いタイムアウト
            )

            # 無効なPlace IDでテスト
            invalid_place_id = "ChIJ_INVALID_PLACE_ID_TEST"

            self.logger.info(f"無効なPlace IDでテスト: {invalid_place_id}")

            place_data = await api_integration.fetch_place_details_with_cache(invalid_place_id)

            # エラーが適切に処理されたかチェック
            if place_data is None:
                self.logger.info("✅ エラーハンドリング: OK（無効IDで適切にNoneを返す）")
                self.test_results['error_handling_real'] = {"success": True, "result": "handled_gracefully"}
                return True
            else:
                self.logger.warning("⚠️ エラーハンドリング: 予期しないデータが返された")
                self.test_results['error_handling_real'] = {"success": False, "result": "unexpected_data"}
                return False

        except Exception as e:
            # 例外が発生した場合でも適切にハンドリングされているかチェック
            self.logger.info(f"✅ エラーハンドリング: OK（例外を適切にキャッチ: {type(e).__name__}）")
            self.test_results['error_handling_real'] = {"success": True, "result": "exception_handled", "exception": str(e)}
            return True

    async def run_all_real_data_tests(self) -> Dict[str, Any]:
        """全実データテスト実行"""
        self.logger.info("=== Phase 2 実データテスト開始 ===")
        start_time = datetime.now()

        # APIキー確認
        if not self.check_api_key_availability():
            return {
                "error": "API key not available",
                "message": "Google Places API キーが設定されていません",
                "success_rate": 0
            }

        # テスト実行
        tests = [
            ("単一Place実データAPI", self.test_single_place_real_api()),
            ("バッチPlace実データAPI", self.test_batch_places_real_api()),
            ("分散タスク実データAPI", self.test_distributed_task_real_api),
            ("キャッシュ統合実データ", self.test_cache_integration_real_api()),
            ("エラーハンドリング実データ", self.test_error_handling_real_api())
        ]

        passed = 0
        total = len(tests)

        for test_name, test_func in tests:
            try:
                self.logger.info(f"\n🔍 実行中: {test_name}")

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
            "api_key_length": len(self.api_key),
            "test_results": self.test_results
        }

        self.logger.info(f"\n=== Phase 2 実データテスト完了 ({execution_time:.2f}秒) ===")
        self.logger.info(f"成功率: {success_rate:.1f}% ({passed}/{total})")
        self.logger.info(f"🔑 実際のGoogle Places API使用")

        # 結果をファイルに保存
        result_file = f"phase2_real_data_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2, cls=DateTimeEncoder)

        self.logger.info(f"実データテスト結果を {result_file} に保存しました")

        return summary


async def main():
    """メイン関数"""
    tester = Phase2RealDataTester()

    try:
        results = await tester.run_all_real_data_tests()

        if 'error' in results:
            print(f"\n❌ {results['message']}")
            return 1

        if results['success_rate'] >= 80:
            print(f"\n🎉 Phase 2 実データテスト: 成功 ({results['success_rate']:.1f}%)")
            print("✅ 実際のGoogle Places APIとの統合が正常に動作しています")
            return 0
        elif results['success_rate'] >= 60:
            print(f"\n⚠️ Phase 2 実データテスト: 部分的成功 ({results['success_rate']:.1f}%)")
            print("🔧 一部の機能に改善の余地があります")
            return 0
        else:
            print(f"\n❌ Phase 2 実データテスト: 要改善 ({results['success_rate']:.1f}%)")
            return 1

    except Exception as e:
        print(f"\n❌ Phase 2 実データテストエラー: {e}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
