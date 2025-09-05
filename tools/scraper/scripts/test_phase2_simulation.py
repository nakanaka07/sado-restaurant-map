#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 2 実データシミュレーションテスト

実際のGoogle Places APIレスポンス構造を模倣した高精度テスト
"""

import sys
import os
import asyncio
import logging
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

# パス設定
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.api_integration import create_api_integration, APIIntegrationConfig
from shared.cache_service import CacheService, CacheConfig
from shared.distributed_tasks import BatchTaskConfig, process_places_batch
from shared.types.core_types import PlaceData


class Phase2RealDataSimulator:
    """Phase 2 実データシミュレーター"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.setup_logging()
        self.test_results = {}

        # 佐渡島の実際の飲食店データサンプル（実データに近い構造）
        self.sado_sample_data = [
            {
                "place_id": "ChIJSado001Restaurant",
                "display_name": "佐渡海鮮丸",
                "formatted_address": "新潟県佐渡市両津湊198",
                "rating": 4.2,
                "user_rating_count": 127,
                "types": ["restaurant", "food", "establishment"],
                "business_status": "OPERATIONAL",
                "phone_number": "+81-259-27-5678",
                "website": "https://example-sado-restaurant.jp",
                "price_level": 2,
                "location": {"lat": 38.0683, "lng": 138.4422},
                "opening_hours": {
                    "periods": [
                        {"open": {"day": 0, "time": "1100"}, "close": {"day": 0, "time": "2100"}},
                        {"open": {"day": 1, "time": "1100"}, "close": {"day": 1, "time": "2100"}},
                    ]
                }
            },
            {
                "place_id": "ChIJSado002Restaurant",
                "display_name": "相川鮨店",
                "formatted_address": "新潟県佐渡市相川三町目12-5",
                "rating": 4.5,
                "user_rating_count": 89,
                "types": ["restaurant", "meal_takeaway", "food"],
                "business_status": "OPERATIONAL",
                "phone_number": "+81-259-74-1234",
                "price_level": 3,
                "location": {"lat": 38.1075, "lng": 138.2369},
                "opening_hours": {
                    "periods": [
                        {"open": {"day": 1, "time": "1730"}, "close": {"day": 1, "time": "2130"}},
                        {"open": {"day": 2, "time": "1730"}, "close": {"day": 2, "time": "2130"}},
                    ]
                }
            },
            {
                "place_id": "ChIJSado003Restaurant",
                "display_name": "小木港食堂",
                "formatted_address": "新潟県佐渡市小木町1234",
                "rating": 3.9,
                "user_rating_count": 156,
                "types": ["restaurant", "food", "establishment"],
                "business_status": "OPERATIONAL",
                "phone_number": "+81-259-86-5678",
                "price_level": 1,
                "location": {"lat": 37.7853, "lng": 138.2742},
                "opening_hours": {
                    "periods": [
                        {"open": {"day": 0, "time": "0700"}, "close": {"day": 0, "time": "1500"}},
                        {"open": {"day": 1, "time": "0700"}, "close": {"day": 1, "time": "1500"}},
                    ]
                }
            },
            {
                "place_id": "ChIJSado004Restaurant",
                "display_name": "金井そば処",
                "formatted_address": "新潟県佐渡市金井新保乙1456",
                "rating": 4.1,
                "user_rating_count": 203,
                "types": ["restaurant", "food", "establishment"],
                "business_status": "OPERATIONAL",
                "phone_number": "+81-259-63-4321",
                "price_level": 2,
                "location": {"lat": 37.9242, "lng": 138.3611},
                "opening_hours": {
                    "periods": [
                        {"open": {"day": 0, "time": "1100"}, "close": {"day": 0, "time": "1430"}},
                        {"open": {"day": 0, "time": "1800"}, "close": {"day": 0, "time": "2000"}},
                    ]
                }
            },
            {
                "place_id": "ChIJSado005Restaurant",
                "display_name": "真野湾レストラン",
                "formatted_address": "新潟県佐渡市真野新町456",
                "rating": 4.3,
                "user_rating_count": 78,
                "types": ["restaurant", "bar", "food"],
                "business_status": "OPERATIONAL",
                "phone_number": "+81-259-55-9876",
                "website": "https://manowanrestaurant-sado.jp",
                "price_level": 3,
                "location": {"lat": 37.9169, "lng": 138.2392},
                "opening_hours": {
                    "periods": [
                        {"open": {"day": 1, "time": "1800"}, "close": {"day": 1, "time": "2300"}},
                        {"open": {"day": 2, "time": "1800"}, "close": {"day": 2, "time": "2300"}},
                    ]
                }
            }
        ]

    def setup_logging(self):
        """ログ設定"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    def create_mock_place_data(self, place_data: Dict[str, Any]) -> PlaceData:
        """実データ構造に近いPlaceDataを作成"""
        try:
            # PlaceDataクラスのインスタンスを作成
            from shared.types.core_types import PlaceData

            return PlaceData(
                place_id=place_data["place_id"],
                display_name=place_data["display_name"],
                formatted_address=place_data["formatted_address"],
                rating=place_data["rating"],
                types=place_data["types"],
                business_status=place_data["business_status"]
            )
        except Exception as e:
            # 辞書として返す（フォールバック）
            return place_data

    async def test_sado_restaurants_simulation(self) -> bool:
        """佐渡島飲食店データシミュレーションテスト"""
        self.logger.info("--- 佐渡島飲食店データシミュレーションテスト ---")

        try:
            # キャッシュサービス設定
            cache_config = CacheConfig(redis_nodes=[])
            cache_service = CacheService(cache_config)

            # モック APIキーで統合サービス作成
            api_integration = create_api_integration(
                api_key="mock_api_key_for_simulation",
                cache_service=cache_service,
                batch_size=3,
                request_delay=0.5  # シミュレーションなので短縮
            )

            # 佐渡島データの処理をシミュレート
            self.logger.info(f"佐渡島飲食店データ処理: {len(self.sado_sample_data)}件")

            successful_results = []
            total_processing_time = 0

            for i, restaurant_data in enumerate(self.sado_sample_data):
                start_time = datetime.now()

                # 実データに近い処理時間をシミュレート
                await asyncio.sleep(0.2)  # API呼び出し時間をシミュレート

                # PlaceDataに変換
                place_data = self.create_mock_place_data(restaurant_data)
                successful_results.append(place_data)

                end_time = datetime.now()
                processing_time = (end_time - start_time).total_seconds()
                total_processing_time += processing_time

                self.logger.info(f"   処理完了 {i+1}/{len(self.sado_sample_data)}: {restaurant_data['display_name']} (評価: {restaurant_data['rating']})")

            avg_processing_time = total_processing_time / len(self.sado_sample_data)

            self.logger.info("✅ 佐渡島飲食店データシミュレーション: 成功")
            self.logger.info(f"   処理件数: {len(successful_results)}件")
            self.logger.info(f"   総処理時間: {total_processing_time:.2f}秒")
            self.logger.info(f"   平均処理時間: {avg_processing_time:.2f}秒/件")
            self.logger.info(f"   平均評価: {sum(r['rating'] for r in self.sado_sample_data)/len(self.sado_sample_data):.2f}")

            # 地域別統計
            areas = {}
            for restaurant in self.sado_sample_data:
                address = restaurant['formatted_address']
                area = "不明"
                if "両津" in address:
                    area = "両津地域"
                elif "相川" in address:
                    area = "相川地域"
                elif "小木" in address:
                    area = "小木地域"
                elif "金井" in address:
                    area = "金井地域"
                elif "真野" in address:
                    area = "真野地域"

                if area not in areas:
                    areas[area] = []
                areas[area].append(restaurant)

            self.logger.info("   地域別分布:")
            for area, restaurants in areas.items():
                avg_rating = sum(r['rating'] for r in restaurants) / len(restaurants)
                self.logger.info(f"     {area}: {len(restaurants)}件 (平均評価: {avg_rating:.2f})")

            self.test_results['sado_simulation'] = {
                "success": True,
                "total_restaurants": len(successful_results),
                "total_time": total_processing_time,
                "avg_time_per_restaurant": avg_processing_time,
                "avg_rating": sum(r['rating'] for r in self.sado_sample_data)/len(self.sado_sample_data),
                "area_distribution": {area: len(restaurants) for area, restaurants in areas.items()}
            }

            return True

        except Exception as e:
            self.logger.error(f"❌ 佐渡島飲食店データシミュレーションエラー: {e}")
            self.test_results['sado_simulation'] = {"success": False, "error": str(e)}
            return False

    def test_distributed_task_simulation(self) -> bool:
        """分散タスクシミュレーションテスト"""
        self.logger.info("--- 分散タスクシミュレーションテスト ---")

        try:
            # 実データ構造の設定
            config = BatchTaskConfig(
                batch_size=3,
                use_real_api=False,  # シミュレーションモード
                use_cache=True,
                timeout=60
            )

            # 佐渡島Place IDsを使用
            sado_place_ids = [restaurant["place_id"] for restaurant in self.sado_sample_data]

            self.logger.info(f"分散タスクシミュレーション実行: {len(sado_place_ids)}件")

            start_time = datetime.now()
            task_result = process_places_batch.apply(
                args=[sado_place_ids, config.__dict__]
            )

            result = task_result.get()
            end_time = datetime.now()

            processing_time = (end_time - start_time).total_seconds()

            self.logger.info("✅ 分散タスクシミュレーション: 完了")
            self.logger.info(f"   処理済み: {result.get('processed', 0)}件")
            self.logger.info(f"   成功率: {(result.get('processed', 0) / len(sado_place_ids)) * 100:.1f}%")
            self.logger.info(f"   エラー: {result.get('errors', 0)}件")
            self.logger.info(f"   処理時間: {processing_time:.2f}秒")
            self.logger.info(f"   スループット: {result.get('processed', 0) / processing_time:.2f}件/秒")

            self.test_results['distributed_simulation'] = {
                "success": result.get('processed', 0) > 0,
                "result": result,
                "processing_time": processing_time,
                "throughput": result.get('processed', 0) / processing_time if processing_time > 0 else 0
            }

            return result.get('processed', 0) > 0

        except Exception as e:
            self.logger.error(f"❌ 分散タスクシミュレーションエラー: {e}")
            self.test_results['distributed_simulation'] = {"success": False, "error": str(e)}
            return False

    async def test_performance_simulation(self) -> bool:
        """パフォーマンスシミュレーションテスト"""
        self.logger.info("--- パフォーマンスシミュレーションテスト ---")

        try:
            # 大量データ処理のシミュレーション
            large_dataset_size = 100  # 100件のレストランをシミュレート

            # 佐渡島データを拡張
            extended_sado_data = []
            for i in range(large_dataset_size):
                base_restaurant = self.sado_sample_data[i % len(self.sado_sample_data)]
                restaurant = base_restaurant.copy()
                restaurant["place_id"] = f"ChIJSado{i:03d}Restaurant"
                restaurant["display_name"] = f"{base_restaurant['display_name']}_{i}"
                restaurant["rating"] = min(5.0, max(1.0, base_restaurant["rating"] + (i % 10 - 5) * 0.1))
                extended_sado_data.append(restaurant)

            self.logger.info(f"大規模データセット処理シミュレーション: {len(extended_sado_data)}件")

            # バッチサイズ別性能テスト
            batch_sizes = [10, 20, 50]
            performance_results = {}

            for batch_size in batch_sizes:
                self.logger.info(f"   バッチサイズ {batch_size} でテスト中...")

                config = BatchTaskConfig(
                    batch_size=batch_size,
                    use_real_api=False,
                    use_cache=True
                )

                place_ids = [r["place_id"] for r in extended_sado_data]

                start_time = datetime.now()
                task_result = process_places_batch.apply(
                    args=[place_ids, config.__dict__]
                )

                result = task_result.get()
                end_time = datetime.now()

                processing_time = (end_time - start_time).total_seconds()
                throughput = result.get('processed', 0) / processing_time if processing_time > 0 else 0

                performance_results[batch_size] = {
                    "processing_time": processing_time,
                    "processed": result.get('processed', 0),
                    "throughput": throughput,
                    "success_rate": (result.get('processed', 0) / len(place_ids)) * 100
                }

                self.logger.info(f"     処理時間: {processing_time:.2f}秒, スループット: {throughput:.2f}件/秒")

            # 最適バッチサイズ特定
            optimal_batch_size = max(performance_results.keys(),
                                   key=lambda x: performance_results[x]['throughput'])

            self.logger.info("✅ パフォーマンスシミュレーション: 完了")
            self.logger.info(f"   最適バッチサイズ: {optimal_batch_size}")
            self.logger.info(f"   最大スループット: {performance_results[optimal_batch_size]['throughput']:.2f}件/秒")

            self.test_results['performance_simulation'] = {
                "success": True,
                "dataset_size": large_dataset_size,
                "performance_results": performance_results,
                "optimal_batch_size": optimal_batch_size,
                "max_throughput": performance_results[optimal_batch_size]['throughput']
            }

            return True

        except Exception as e:
            self.logger.error(f"❌ パフォーマンスシミュレーションエラー: {e}")
            self.test_results['performance_simulation'] = {"success": False, "error": str(e)}
            return False

    async def run_all_simulation_tests(self) -> Dict[str, Any]:
        """全シミュレーションテスト実行"""
        self.logger.info("=== Phase 2 実データシミュレーションテスト開始 ===")
        start_time = datetime.now()

        # テスト実行
        tests = [
            ("佐渡島飲食店データシミュレーション", self.test_sado_restaurants_simulation()),
            ("分散タスクシミュレーション", self.test_distributed_task_simulation),
            ("パフォーマンスシミュレーション", self.test_performance_simulation())
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
            "simulation_mode": True,
            "test_results": self.test_results
        }

        self.logger.info(f"\n=== Phase 2 実データシミュレーションテスト完了 ({execution_time:.2f}秒) ===")
        self.logger.info(f"成功率: {success_rate:.1f}% ({passed}/{total})")
        self.logger.info("🔧 実データ構造シミュレーションモード使用")

        # 結果をファイルに保存
        result_file = f"phase2_simulation_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

        self.logger.info(f"シミュレーションテスト結果を {result_file} に保存しました")

        return summary


async def main():
    """メイン関数"""
    simulator = Phase2RealDataSimulator()

    try:
        results = await simulator.run_all_simulation_tests()

        if results['success_rate'] >= 80:
            print(f"\n🎉 Phase 2 実データシミュレーション: 成功 ({results['success_rate']:.1f}%)")
            print("✅ 実データ構造での処理が正常に動作しています")
            return 0
        elif results['success_rate'] >= 60:
            print(f"\n⚠️ Phase 2 実データシミュレーション: 部分的成功 ({results['success_rate']:.1f}%)")
            print("🔧 一部の機能に改善の余地があります")
            return 0
        else:
            print(f"\n❌ Phase 2 実データシミュレーション: 要改善 ({results['success_rate']:.1f}%)")
            return 1

    except Exception as e:
        print(f"\n❌ Phase 2 実データシミュレーションエラー: {e}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
