#!/usr/bin/env python3
"""
Phase 3-Full 分散処理テストスクリプト
Redis + Celery 環境での分散タスク処理をテストします
"""

import time
import sys
import os
from typing import List, Dict, Any

# プロジェクトパスを追加
scraper_path = os.path.join(os.path.dirname(__file__), 'tools', 'scraper')
sys.path.insert(0, scraper_path)

try:
    from shared.celery_config import celery_app, health_check, get_worker_stats  # type: ignore
    from shared.distributed_tasks import (  # type: ignore
        process_places_batch
    )
    print("✅ Celeryモジュールのインポート成功")
except ImportError as e:
    print(f"❌ インポートエラー: {e}")
    print(f"パス確認: {scraper_path}")
    print(f"存在確認: {os.path.exists(scraper_path)}")
    sys.exit(1)


def test_health_check():
    """ヘルスチェックテスト"""
    print("\n🔍 ヘルスチェックテスト開始...")
    try:
        # 非同期タスクを送信
        result = health_check.delay()
        print(f"タスクID: {result.id}")
        print(f"タスク状態: {result.status}")

        # 結果を待機（最大10秒）
        try:
            health_result = result.get(timeout=10)
            print(f"✅ ヘルスチェック成功: {health_result}")
            return True
        except Exception as e:
            print(f"❌ ヘルスチェック失敗: {e}")
            return False

    except Exception as e:
        print(f"❌ ヘルスチェックエラー: {e}")
        return False
def test_worker_stats():
    """ワーカー統計テスト"""
    print("\n📊 ワーカー統計テスト開始...")
    try:
        result = get_worker_stats.delay()
        print(f"タスクID: {result.id}")

        try:
            stats = result.get(timeout=10)
            print(f"✅ ワーカー統計取得成功:")
            for key, value in stats.items():
                print(f"  {key}: {value}")
            return True
        except Exception as e:
            print(f"❌ ワーカー統計取得失敗: {e}")
            return False

    except Exception as e:
        print(f"❌ ワーカー統計エラー: {e}")
        return False


def test_batch_processing():
    """バッチ処理テスト"""
    print("\n🚀 分散バッチ処理テスト開始...")

    # テスト用のplace IDs
    test_place_ids = [
        "test_place_001",
        "test_place_002",
        "test_place_003",
        "test_place_004",
        "test_place_005"
    ]

    # バッチ処理設定
    config = {
        'use_real_api': False,  # テスト用にモックAPIを使用
        'batch_size': 3
    }

    try:
        print(f"処理対象: {len(test_place_ids)}件のプレイス")
        print(f"設定: {config}")

        # 非同期バッチタスクを送信
        result = process_places_batch.delay(test_place_ids, config)
        print(f"バッチタスクID: {result.id}")
        print(f"タスク状態: {result.status}")

        # 進行状況を監視
        print("処理中...", end="")
        while not result.ready():
            print(".", end="", flush=True)
            time.sleep(1)
        print()

        # 結果を取得
        try:
            batch_result = result.get(timeout=30)
            print(f"✅ バッチ処理完了!")
            print(f"  成功: {batch_result.get('success', 0)}件")
            print(f"  エラー: {batch_result.get('errors', 0)}件")
            print(f"  APIモード: {batch_result.get('api_mode', 'unknown')}")

            # 詳細結果
            if 'results' in batch_result:
                print(f"  結果詳細: {len(batch_result['results'])}件")
                for i, res in enumerate(batch_result['results'][:3]):  # 最初の3件を表示
                    print(f"    {i+1}. {res.get('place_id', 'unknown')}: {res.get('status', 'unknown')}")

            return True

        except Exception as e:
            print(f"❌ バッチ処理結果取得失敗: {e}")
            return False

    except Exception as e:
        print(f"❌ バッチ処理エラー: {e}")
        return False


def test_multiple_concurrent_tasks():
    """複数同時タスクテスト"""
    print("\n⚡ 複数同時タスクテスト開始...")

    tasks = []
    task_count = 3

    try:
        # 複数のバッチタスクを同時送信
        for i in range(task_count):
            place_ids = [f"concurrent_test_{i}_{j}" for j in range(3)]
            config = {'use_real_api': False}

            result = process_places_batch.delay(place_ids, config)
            tasks.append((f"Task-{i+1}", result))
            print(f"タスク{i+1}送信: {result.id}")

        # すべてのタスクの完了を待機
        print("すべてのタスク完了を待機中...", end="")
        completed = 0

        while completed < task_count:
            completed_now = sum(1 for _, task in tasks if task.ready())
            if completed_now > completed:
                completed = completed_now
                print(f"\n進行状況: {completed}/{task_count} 完了", end="")
            print(".", end="", flush=True)
            time.sleep(1)

        print(f"\n✅ 全{task_count}タスク完了!")

        # 結果を確認
        success_count = 0
        for name, task in tasks:
            try:
                result = task.get(timeout=5)
                print(f"  {name}: 成功 - {result.get('success', 0)}件処理")
                success_count += 1
            except Exception as e:
                print(f"  {name}: 失敗 - {e}")

        print(f"成功率: {success_count}/{task_count}")
        return success_count == task_count

    except Exception as e:
        print(f"❌ 複数同時タスクエラー: {e}")
        return False


def main():
    """メイン実行関数"""
    print("🎉 Phase 3-Full 分散処理テスト開始")
    print("=" * 50)

    test_results = []

    # 1. ヘルスチェック
    test_results.append(("ヘルスチェック", test_health_check()))

    # 2. ワーカー統計
    test_results.append(("ワーカー統計", test_worker_stats()))

    # 3. バッチ処理
    test_results.append(("バッチ処理", test_batch_processing()))

    # 4. 複数同時タスク
    test_results.append(("複数同時タスク", test_multiple_concurrent_tasks()))

    # 結果サマリー
    print("\n" + "=" * 50)
    print("🏁 テスト結果サマリー")
    print("=" * 50)

    success_count = 0
    for test_name, success in test_results:
        status = "✅ 成功" if success else "❌ 失敗"
        print(f"{test_name}: {status}")
        if success:
            success_count += 1

    total_tests = len(test_results)
    success_rate = (success_count / total_tests) * 100

    print(f"\n総合結果: {success_count}/{total_tests} 成功 ({success_rate:.1f}%)")

    if success_count == total_tests:
        print("🎉 すべてのテストが成功しました！")
        print("Phase 3-Full 分散処理環境が正常に動作しています。")
    else:
        print("⚠️  一部のテストが失敗しました。")
        print("ログを確認して問題を調査してください。")


if __name__ == "__main__":
    main()
