#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
スマート更新システムのテスト実行

実際のGoogle Sheetsデータを使用してスマート更新機能をテストします。
"""

import os
import sys
import time
from datetime import datetime

# 必要なモジュールのインポート
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from infrastructure.storage.sheets_storage_adapter import SheetsStorageAdapter
from shared.config import ScraperConfig
from shared.container import create_container
from shared.logger import get_logger

# ログ設定
logger = get_logger(__name__)

def test_smart_update_with_real_data():
    """実際のデータを使ったスマート更新テスト"""

    print("=== スマート更新システムの実行テスト ===")

    try:
        # 設定とDIコンテナから適切にサービスを取得
        config = ScraperConfig.from_environment()
        container = create_container(config)
        adapter = container.get(SheetsStorageAdapter)

        # テスト用の更新ポリシー設定
        print("\n1. UPDATE_POLICY=smart で実行")
        os.environ['UPDATE_POLICY'] = 'smart'
        os.environ['UPDATE_THRESHOLD_DAYS'] = '1'  # 1日で強制更新（テスト用）

        # 既存のテストデータを確認
        test_data = {
            'place_id': 'ChIJSWduTcfLjF8RDgE6nO9Kgn0',  # 既存のPlace ID
            'name': 'スマート更新テスト施設',
            'address': '佐渡市テスト住所',
            'latitude': '38.0000',
            'longitude': '138.0000',
            'rating': '4.5',  # 評価を改善
            'review_count': '25',  # レビュー数を増加
            'business_status': 'OPERATIONAL',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'is_in_sado': True,  # 佐渡内データとして明示
            'district': '佐渡市'
        }

        # rawデータを直接渡す（save操作内でMockValidationResultがラップされる）
        result = adapter.save([test_data], 'toilets')

        if result:
            print("✅ スマート更新テスト成功")
            print("📝 ログを確認して更新理由を確認してください")
        else:
            print("❌ テスト失敗")

    except Exception as e:
        print(f"❌ エラー発生: {str(e)}")
        logger.error("Smart update test failed", error=str(e))


def test_different_policies():
    """異なる更新ポリシーのテスト"""

    print("\n=== 更新ポリシー別テスト ===")

    policies = ['smart', 'always', 'never']

    for policy in policies:
        print(f"\n{policy.upper()} ポリシーでテスト中...")
        os.environ['UPDATE_POLICY'] = policy

        try:
            config = ScraperConfig.from_environment()
            container = create_container(config)
            adapter = container.get(SheetsStorageAdapter)

            test_data = {
                'place_id': 'ChIJSWduTcfLjF8RDgE6nO9Kgn0',
                'name': f'テスト施設 ({policy})',
                'address': '佐渡市テスト住所',
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'is_in_sado': True,  # 佐渡内データとして明示
                'district': '佐渡市'
            }

            # rawデータを直接渡す
            result = adapter.save([test_data], 'toilets')

            status = "✅ 成功" if result else "❌ 失敗"
            print(f"  {policy}: {status}")

        except Exception as e:
            print(f"  {policy}: ❌ エラー - {str(e)}")


def check_current_data():
    """現在のデータ状況を確認"""

    print("\n=== 現在のデータ状況確認 ===")

    try:
        config = ScraperConfig.from_environment()
        container = create_container(config)
        adapter = container.get(SheetsStorageAdapter)

        # toiletsカテゴリのデータを取得
        test_place_id = 'ChIJSWduTcfLjF8RDgE6nO9Kgn0'
        existing_data = adapter.load(test_place_id, 'toilets')

        if existing_data:
            print("既存データ確認:")
            print(f"  Place ID: {existing_data.get('Place ID', 'N/A')}")
            print(f"  施設名: {existing_data.get('施設名', 'N/A')}")
            print(f"  評価: {existing_data.get('施設評価', 'N/A')}")
            print(f"  レビュー数: {existing_data.get('レビュー数', 'N/A')}")
            print(f"  最終更新: {existing_data.get('最終更新日時', 'N/A')}")
        else:
            print("既存データが見つかりません")

    except Exception as e:
        print(f"❌ データ確認エラー: {str(e)}")


def main():
    """メイン実行"""

    print("スマート更新システムの包括テストを開始します")
    print("=" * 50)

    # 現在のデータ状況確認
    check_current_data()

    # スマート更新テスト
    test_smart_update_with_real_data()

    # 異なるポリシーのテスト
    test_different_policies()

    print("\n" + "=" * 50)
    print("テスト完了！")
    print("\n💡 ヒント:")
    print("- UPDATE_POLICY=smart: 内容変更時のみ更新")
    print("- UPDATE_POLICY=always: 常に更新")
    print("- UPDATE_POLICY=never: 更新しない")
    print("- UPDATE_THRESHOLD_DAYS: 強制更新の日数閾値")


if __name__ == "__main__":
    main()
