#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ML Engine 統合テスト

ML Engineの全機能を包括的にテストし、動作確認を行う統合テストスイート。
データ品質分析、異常検知、処理パターン分析などの高度なML機能を検証。
"""

import sys
import os
import logging
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any
import tempfile
import shutil

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# ローカルモジュールのインポート
try:
    from shared.ml_engine import (
        MLEngine, QualityMetrics, MLPrediction, AnomalyReport,
        create_ml_engine
    )
except ImportError as e:
    print(f"モジュールインポートエラー: {e}")
    sys.exit(1)

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MLEngineIntegrationTest:
    """ML Engine統合テストクラス"""

    def __init__(self):
        self.test_results = []
        self.temp_dir = None
        self.ml_engine = None

    def setup_test_environment(self):
        """テスト環境セットアップ"""
        try:
            # 一時ディレクトリ作成
            self.temp_dir = tempfile.mkdtemp(prefix="ml_engine_test_")
            logger.info(f"テスト環境セットアップ: {self.temp_dir}")

            # ML Engine初期化
            self.ml_engine = create_ml_engine(model_dir=self.temp_dir)

            return True

        except Exception as e:
            logger.error(f"テスト環境セットアップエラー: {e}")
            return False

    def cleanup_test_environment(self):
        """テスト環境クリーンアップ"""
        try:
            if self.temp_dir and os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
                logger.info("テスト環境クリーンアップ完了")
        except Exception as e:
            logger.warning(f"クリーンアップエラー: {e}")

    def generate_test_data(self) -> List[Dict[str, Any]]:
        """テスト用サンプルデータ生成"""
        test_data = [
            # 高品質データ
            {
                "place_id": "ChIJ123456789",
                "name": "佐渡の郷土料理レストラン",
                "formatted_address": "新潟県佐渡市両津湊1-1",
                "rating": 4.2,
                "user_ratings_total": 85,
                "price_level": 2,
                "phone_number": "+81-259-12-3456",
                "website": "https://example-restaurant.com",
                "opening_hours": {
                    "weekday_text": ["月曜日: 11:00～21:00", "火曜日: 11:00～21:00"]
                },
                "updated_at": datetime.now().isoformat()
            },
            # 中品質データ
            {
                "place_id": "ChIJ987654321",
                "name": "海鮮居酒屋",
                "formatted_address": "新潟県佐渡市相川下戸町1-2",
                "rating": 3.8,
                "user_ratings_total": 42,
                "updated_at": (datetime.now() - timedelta(hours=12)).isoformat()
            },
            # 低品質データ（不完全）
            {
                "place_id": "ChIJ111222333",
                "name": "test",
                "rating": 6.0,  # 無効な評価値
                "updated_at": (datetime.now() - timedelta(days=30)).isoformat()
            },
            # 異常データ
            {
                "place_id": "ChIJ444555666",
                "name": "東京の寿司店",  # 地理的不整合
                "formatted_address": "東京都渋谷区1-1-1",
                "rating": 4.9,
                "user_ratings_total": 1,  # 高評価だが評価数が極小
                "updated_at": datetime.now().isoformat()
            },
            # 正常データ（フル情報）
            {
                "place_id": "ChIJ777888999",
                "name": "佐渡金山食堂",
                "formatted_address": "新潟県佐渡市相川金山町1-3",
                "rating": 4.1,
                "user_ratings_total": 156,
                "price_level": 1,
                "phone_number": "+81-259-74-1234",
                "website": "https://sado-kinzan-restaurant.jp",
                "opening_hours": {
                    "weekday_text": ["月曜日: 10:00～19:00", "火曜日: 10:00～19:00"],
                    "open_now": True
                },
                "updated_at": datetime.now().isoformat()
            }
        ]

        return test_data

    def generate_processing_history(self) -> List[Dict[str, Any]]:
        """処理履歴テストデータ生成"""
        history = []
        base_time = datetime.now() - timedelta(days=7)

        for i in range(50):
            job_time = base_time + timedelta(hours=i * 2)

            # 成功ジョブ
            if i % 10 != 9:  # 90%成功率
                history.append({
                    "job_id": f"job_{i:03d}",
                    "status": "success",
                    "start_time": job_time.isoformat(),
                    "end_time": (job_time + timedelta(minutes=30 + i % 60)).isoformat(),
                    "duration": 30 + i % 60,
                    "data_count": 100 + i * 10,
                    "batch_size": 50,
                    "worker_count": 4,
                    "complexity": 0.3 + (i % 10) * 0.07
                })
            else:
                # 失敗ジョブ
                history.append({
                    "job_id": f"job_{i:03d}",
                    "status": "failed",
                    "start_time": job_time.isoformat(),
                    "error": "Connection timeout",
                    "data_count": 50 + i * 5,
                    "worker_count": 4
                })

        return history

    def test_data_quality_analysis(self) -> Dict[str, Any]:
        """データ品質分析テスト"""
        test_name = "データ品質分析"
        logger.info(f"{test_name}テスト開始")

        try:
            test_data = self.generate_test_data()
            quality_metrics = self.ml_engine.analyze_data_quality(test_data)

            # 基本検証
            assert len(quality_metrics) == len(test_data), "品質メトリクス数が一致しない"
            assert all(isinstance(m, QualityMetrics) for m in quality_metrics), "QualityMetricsインスタンス型不正"

            # スコア範囲検証
            for metric in quality_metrics:
                assert 0.0 <= metric.overall_score <= 1.0, f"総合スコア範囲外: {metric.overall_score}"
                assert 0.0 <= metric.completeness <= 1.0, f"完全性スコア範囲外: {metric.completeness}"
                assert 0.0 <= metric.accuracy <= 1.0, f"正確性スコア範囲外: {metric.accuracy}"
                assert 0.0 <= metric.consistency <= 1.0, f"一貫性スコア範囲外: {metric.consistency}"
                assert 0.0 <= metric.confidence <= 1.0, f"信頼度範囲外: {metric.confidence}"

            # 品質判定検証
            high_quality_count = sum(1 for m in quality_metrics if m.overall_score >= 0.8)
            low_quality_count = sum(1 for m in quality_metrics if m.overall_score < 0.5)

            logger.info(f"品質分析結果: 高品質={high_quality_count}件, 低品質={low_quality_count}件")

            return {
                "status": "success",
                "metrics_count": len(quality_metrics),
                "high_quality_count": high_quality_count,
                "low_quality_count": low_quality_count,
                "average_score": sum(m.overall_score for m in quality_metrics) / len(quality_metrics)
            }

        except Exception as e:
            logger.error(f"{test_name}テストエラー: {e}")
            return {"status": "failed", "error": str(e)}

    def test_anomaly_detection(self) -> Dict[str, Any]:
        """異常検知テスト"""
        test_name = "異常検知"
        logger.info(f"{test_name}テスト開始")

        try:
            test_data = self.generate_test_data()
            anomaly_reports = self.ml_engine.detect_anomalies(test_data)

            # 基本検証
            assert len(anomaly_reports) == len(test_data), "異常レポート数が一致しない"
            assert all(isinstance(r, AnomalyReport) for r in anomaly_reports), "AnomalyReportインスタンス型不正"

            # 異常検知検証
            anomaly_count = sum(1 for r in anomaly_reports if r.is_anomaly)
            high_severity_count = sum(1 for r in anomaly_reports if r.severity == "high")

            # スコア範囲検証
            for report in anomaly_reports:
                assert 0.0 <= report.anomaly_score <= 1.0, f"異常スコア範囲外: {report.anomaly_score}"
                assert 0.0 <= report.confidence <= 1.0, f"信頼度範囲外: {report.confidence}"
                assert report.severity in ["none", "low", "medium", "high"], f"無効な重要度: {report.severity}"

            logger.info(f"異常検知結果: 異常={anomaly_count}件, 高重要度={high_severity_count}件")

            return {
                "status": "success",
                "total_reports": len(anomaly_reports),
                "anomaly_count": anomaly_count,
                "high_severity_count": high_severity_count
            }

        except Exception as e:
            logger.error(f"{test_name}テストエラー: {e}")
            return {"status": "failed", "error": str(e)}

    def test_processing_time_prediction(self) -> Dict[str, Any]:
        """処理時間予測テスト"""
        test_name = "処理時間予測"
        logger.info(f"{test_name}テスト開始")

        try:
            # 複数のシナリオでテスト
            test_scenarios = [
                {"query_count": 100, "complexity": 0.3, "workers": 4},
                {"query_count": 500, "complexity": 0.7, "workers": 8},
                {"query_count": 50, "complexity": 0.5, "workers": 2},
                {"query_count": 1000, "complexity": 0.9, "workers": 1}
            ]

            predictions = []
            for scenario in test_scenarios:
                prediction = self.ml_engine.predict_processing_time(
                    scenario["query_count"],
                    scenario["complexity"],
                    scenario["workers"]
                )

                # 基本検証
                assert isinstance(prediction, MLPrediction), "MLPredictionインスタンス型不正"
                assert prediction.prediction >= 0, f"予測時間が負数: {prediction.prediction}"
                assert 0.0 <= prediction.confidence <= 1.0, f"信頼度範囲外: {prediction.confidence}"
                assert prediction.explanation, "説明が空"

                predictions.append(prediction)

            logger.info(f"処理時間予測テスト完了: {len(predictions)}シナリオ")

            return {
                "status": "success",
                "scenarios_tested": len(predictions),
                "predictions": [
                    {
                        "time": p.prediction,
                        "confidence": p.confidence,
                        "explanation": p.explanation
                    } for p in predictions
                ]
            }

        except Exception as e:
            logger.error(f"{test_name}テストエラー: {e}")
            return {"status": "failed", "error": str(e)}

    def test_batch_size_optimization(self) -> Dict[str, Any]:
        """バッチサイズ最適化テスト"""
        test_name = "バッチサイズ最適化"
        logger.info(f"{test_name}テスト開始")

        try:
            # 複数のシナリオでテスト
            test_scenarios = [
                {"total": 1000, "workers": 8, "target": 300},
                {"total": 200, "workers": 2, "target": 600},
                {"total": 5000, "workers": 16, "target": 180},
                {"total": 50, "workers": 1, "target": 120}
            ]

            optimizations = []
            for scenario in test_scenarios:
                result = self.ml_engine.optimize_batch_size(
                    scenario["total"],
                    scenario["workers"],
                    scenario["target"]
                )

                # 基本検証
                assert "optimal_batch_size" in result, "最適バッチサイズが不明"
                assert "estimated_batches" in result, "推定バッチ数が不明"
                assert "confidence" in result, "信頼度が不明"

                batch_size = result["optimal_batch_size"]
                assert 1 <= batch_size <= scenario["total"], f"バッチサイズ範囲外: {batch_size}"
                assert 0.0 <= result["confidence"] <= 1.0, f"信頼度範囲外: {result['confidence']}"

                optimizations.append(result)

            logger.info(f"バッチサイズ最適化テスト完了: {len(optimizations)}シナリオ")

            return {
                "status": "success",
                "scenarios_tested": len(optimizations),
                "optimizations": optimizations
            }

        except Exception as e:
            logger.error(f"{test_name}テストエラー: {e}")
            return {"status": "failed", "error": str(e)}

    def test_processing_pattern_analysis(self) -> Dict[str, Any]:
        """処理パターン分析テスト"""
        test_name = "処理パターン分析"
        logger.info(f"{test_name}テスト開始")

        try:
            processing_history = self.generate_processing_history()
            analysis_result = self.ml_engine.analyze_processing_patterns(processing_history)

            # 基本検証
            assert analysis_result["status"] == "success", f"分析失敗: {analysis_result}"
            assert "patterns" in analysis_result, "パターン情報が不明"
            assert "recommendations" in analysis_result, "推奨事項が不明"

            patterns = analysis_result["patterns"]

            # 必須パターン要素の検証
            required_patterns = [
                "basic_statistics", "temporal_patterns", "performance_patterns",
                "error_patterns", "efficiency_patterns", "predictions"
            ]

            for pattern_type in required_patterns:
                assert pattern_type in patterns, f"パターン要素不足: {pattern_type}"

            # 統計情報の妥当性検証
            basic_stats = patterns["basic_statistics"]
            assert basic_stats["total_jobs"] == len(processing_history), "ジョブ数不一致"
            assert 0.0 <= basic_stats["success_rate"] <= 1.0, "成功率範囲外"

            logger.info(f"処理パターン分析完了: {basic_stats['total_jobs']}ジョブ分析")

            return {
                "status": "success",
                "jobs_analyzed": basic_stats["total_jobs"],
                "success_rate": basic_stats["success_rate"],
                "recommendations_count": len(analysis_result["recommendations"])
            }

        except Exception as e:
            logger.error(f"{test_name}テストエラー: {e}")
            return {"status": "failed", "error": str(e)}

    def test_recommendation_generation(self) -> Dict[str, Any]:
        """推奨事項生成テスト"""
        test_name = "推奨事項生成"
        logger.info(f"{test_name}テスト開始")

        try:
            test_data = self.generate_test_data()
            quality_metrics = self.ml_engine.analyze_data_quality(test_data)
            recommendations = self.ml_engine.generate_recommendations(quality_metrics)

            # 基本検証
            assert isinstance(recommendations, list), "推奨事項がリスト型でない"

            # 推奨事項の構造検証
            for rec in recommendations:
                required_fields = ["type", "severity", "priority", "description", "actions"]
                for field in required_fields:
                    assert field in rec, f"推奨事項フィールド不足: {field}"

                assert rec["severity"] in ["low", "medium", "high"], f"無効な重要度: {rec['severity']}"
                assert rec["priority"] in ["low", "medium", "high"], f"無効な優先度: {rec['priority']}"
                assert isinstance(rec["actions"], list), "アクションがリスト型でない"

            logger.info(f"推奨事項生成テスト完了: {len(recommendations)}件生成")

            return {
                "status": "success",
                "recommendations_count": len(recommendations),
                "high_priority_count": sum(1 for r in recommendations if r["priority"] == "high")
            }

        except Exception as e:
            logger.error(f"{test_name}テストエラー: {e}")
            return {"status": "failed", "error": str(e)}

    def test_status_monitoring(self) -> Dict[str, Any]:
        """ステータス監視テスト"""
        test_name = "ステータス監視"
        logger.info(f"{test_name}テスト開始")

        try:
            status = self.ml_engine.get_comprehensive_status()

            # 基本検証
            assert "engine_info" in status, "エンジン情報が不明"
            assert "model_status" in status, "モデル状態が不明"
            assert "configuration" in status, "設定情報が不明"
            assert "statistics" in status, "統計情報が不明"

            engine_info = status["engine_info"]
            assert "version" in engine_info, "バージョン情報が不明"
            assert "sklearn_available" in engine_info, "sklearn可用性が不明"
            assert "models_loaded" in engine_info, "モデル読み込み状態が不明"

            logger.info(f"ステータス監視テスト完了: v{engine_info.get('version', 'unknown')}")

            return {
                "status": "success",
                "engine_version": engine_info.get("version"),
                "sklearn_available": engine_info.get("sklearn_available"),
                "models_loaded": engine_info.get("models_loaded")
            }

        except Exception as e:
            logger.error(f"{test_name}テストエラー: {e}")
            return {"status": "failed", "error": str(e)}

    def test_error_handling(self) -> Dict[str, Any]:
        """エラーハンドリングテスト"""
        test_name = "エラーハンドリング"
        logger.info(f"{test_name}テスト開始")

        try:
            error_tests = []

            # 空データテスト
            try:
                quality_metrics = self.ml_engine.analyze_data_quality([])
                assert quality_metrics == [], "空データ処理失敗"
                error_tests.append({"test": "empty_data", "status": "passed"})
            except Exception as e:
                error_tests.append({"test": "empty_data", "status": "failed", "error": str(e)})

            # 不正データテスト
            try:
                invalid_data = [{"invalid": "data"}]
                quality_metrics = self.ml_engine.analyze_data_quality(invalid_data)
                assert len(quality_metrics) == 1, "不正データ処理失敗"
                error_tests.append({"test": "invalid_data", "status": "passed"})
            except Exception as e:
                error_tests.append({"test": "invalid_data", "status": "failed", "error": str(e)})

            # 極端値テスト
            try:
                extreme_prediction = self.ml_engine.predict_processing_time(0, 0.0, 1)
                assert isinstance(extreme_prediction, MLPrediction), "極端値処理失敗"
                error_tests.append({"test": "extreme_values", "status": "passed"})
            except Exception as e:
                error_tests.append({"test": "extreme_values", "status": "failed", "error": str(e)})

            passed_tests = sum(1 for test in error_tests if test["status"] == "passed")
            logger.info(f"エラーハンドリングテスト完了: {passed_tests}/{len(error_tests)}件成功")

            return {
                "status": "success",
                "total_tests": len(error_tests),
                "passed_tests": passed_tests,
                "test_results": error_tests
            }

        except Exception as e:
            logger.error(f"{test_name}テストエラー: {e}")
            return {"status": "failed", "error": str(e)}

    def run_comprehensive_test(self) -> Dict[str, Any]:
        """包括的統合テスト実行"""
        logger.info("=== ML Engine 統合テスト開始 ===")
        start_time = time.time()

        # テスト環境セットアップ
        if not self.setup_test_environment():
            return {"status": "setup_failed"}

        try:
            # 各テストの実行
            test_methods = [
                ("データ品質分析", self.test_data_quality_analysis),
                ("異常検知", self.test_anomaly_detection),
                ("処理時間予測", self.test_processing_time_prediction),
                ("バッチサイズ最適化", self.test_batch_size_optimization),
                ("処理パターン分析", self.test_processing_pattern_analysis),
                ("推奨事項生成", self.test_recommendation_generation),
                ("ステータス監視", self.test_status_monitoring),
                ("エラーハンドリング", self.test_error_handling)
            ]

            test_results = {}
            passed_count = 0

            for test_name, test_method in test_methods:
                logger.info(f"--- {test_name}テスト実行中 ---")
                try:
                    result = test_method()
                    test_results[test_name] = result

                    if result.get("status") == "success":
                        passed_count += 1
                        logger.info(f"✅ {test_name}テスト: 成功")
                    else:
                        logger.error(f"❌ {test_name}テスト: 失敗 - {result.get('error', 'Unknown error')}")

                except Exception as e:
                    error_msg = f"テスト実行エラー: {e}"
                    logger.error(f"❌ {test_name}テスト: {error_msg}")
                    test_results[test_name] = {"status": "error", "error": error_msg}

            # 総合結果
            total_tests = len(test_methods)
            success_rate = passed_count / total_tests
            elapsed_time = time.time() - start_time

            comprehensive_result = {
                "status": "completed",
                "summary": {
                    "total_tests": total_tests,
                    "passed_tests": passed_count,
                    "failed_tests": total_tests - passed_count,
                    "success_rate": success_rate,
                    "elapsed_time": elapsed_time
                },
                "test_results": test_results,
                "timestamp": datetime.now().isoformat()
            }

            # 結果サマリー出力
            logger.info("=== ML Engine 統合テスト完了 ===")
            logger.info(f"実行時間: {elapsed_time:.2f}秒")
            logger.info(f"テスト結果: {passed_count}/{total_tests}件成功 ({success_rate:.1%})")

            if success_rate >= 0.8:
                logger.info("🎉 統合テスト成功: ML Engineは正常に動作しています")
            elif success_rate >= 0.6:
                logger.warning("⚠️ 統合テスト部分成功: 一部機能に問題があります")
            else:
                logger.error("🚨 統合テスト失敗: 重大な問題が検出されました")

            return comprehensive_result

        finally:
            self.cleanup_test_environment()


def main():
    """メイン実行関数"""
    print("ML Engine 統合テスト開始")
    print("=" * 60)

    # テストインスタンス作成と実行
    test_runner = MLEngineIntegrationTest()

    try:
        result = test_runner.run_comprehensive_test()

        # 結果の詳細出力
        print("\n" + "=" * 60)
        print("統合テスト結果詳細:")
        print("=" * 60)

        summary = result.get("summary", {})
        print(f"総テスト数: {summary.get('total_tests', 0)}")
        print(f"成功テスト: {summary.get('passed_tests', 0)}")
        print(f"失敗テスト: {summary.get('failed_tests', 0)}")
        print(f"成功率: {summary.get('success_rate', 0):.1%}")
        print(f"実行時間: {summary.get('elapsed_time', 0):.2f}秒")

        # 詳細結果出力
        print("\n個別テスト結果:")
        for test_name, test_result in result.get("test_results", {}).items():
            status_icon = "✅" if test_result.get("status") == "success" else "❌"
            print(f"{status_icon} {test_name}: {test_result.get('status', 'unknown')}")

            if test_result.get("status") != "success" and "error" in test_result:
                print(f"   エラー: {test_result['error']}")

        # 結果ファイル保存
        result_file = Path("ml_engine_integration_test_result.json")
        with open(result_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"\n詳細結果を保存: {result_file}")

        # 終了コード決定
        success_rate = summary.get('success_rate', 0)
        exit_code = 0 if success_rate >= 0.8 else 1

        return exit_code

    except Exception as e:
        print(f"統合テスト実行エラー: {e}")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
