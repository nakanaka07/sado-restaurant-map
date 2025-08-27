#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新しいAPIクライアント対応版 - 統合実行スクリプト

Places API (New) v1を使用した最新版実行システム
"""

import argparse
import os
import time
from datetime import datetime

# 環境変数の明示的読み込み
from dotenv import load_dotenv
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)  # tools/scraper を追加

config_dir = os.path.join(parent_dir, 'config')  # 修正: 正しいパス
config_env_path = os.path.join(config_dir, '.env')
if os.path.exists(config_env_path):
    load_dotenv(config_env_path)
    print(f"📄 環境変数を読み込み: {config_env_path}")

from processors.new_unified_processor import NewUnifiedProcessor
from utils.google_auth import validate_environment

class NewUnifiedRunner:
    """新しいAPIクライアント対応版統合実行クラス"""

    def __init__(self):
        self.data_files = {
            'restaurants': 'data/urls/restaurants_merged.txt',
            'parkings': 'data/urls/parkings_merged.txt',
            'toilets': 'data/urls/toilets_merged.txt'
        }

    def validate_file(self, file_path: str) -> bool:
        """ファイルの存在確認"""
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = [line.strip() for line in f.readlines() if line.strip() and not line.startswith('#')]
            return len(lines) > 0
        return False

    def count_queries(self, file_path: str) -> int:
        """クエリ数をカウント"""
        if not os.path.exists(file_path):
            return 0

        with open(file_path, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f.readlines() if line.strip() and not line.startswith('#')]

        return len(lines)

    def show_execution_plan(self, target: str, mode: str):
        """実行計画を表示"""
        print(f"📊 実行計画")
        print(f"   モード: {self.get_mode_description(mode)}")
        print(f"   対象データ: {target}")

        total_queries = 0
        file_details = []

        if target == 'all':
            for category, file_path in self.data_files.items():
                if self.validate_file(file_path):
                    count = self.count_queries(file_path)
                    total_queries += count
                    file_details.append(f"   📄 {category}: {count}件")
        else:
            if target in self.data_files:
                file_path = self.data_files[target]
                if self.validate_file(file_path):
                    count = self.count_queries(file_path)
                    total_queries += count
                    file_details.append(f"   📄 {target}: {count}件")

        print(f"   総クエリ数: {total_queries}件")
        print(f"   推定コスト: ${total_queries * 0.017:.3f} USD")
        print(f"   推定実行時間: {total_queries * 1.2 / 60:.1f} 分")

        print(f"\n📁 ファイル詳細:")
        for detail in file_details:
            print(detail)

        return total_queries

    def get_mode_description(self, mode: str) -> str:
        """モード説明を取得"""
        descriptions = {
            'quick': '高速モード（CID URLのみ処理）',
            'standard': '標準モード（CID URL + 高精度店舗名）',
            'comprehensive': '包括モード（全データ + 詳細検証）'
        }
        return descriptions.get(mode, mode)

    def run_category(self, category: str, mode: str, dry_run: bool = False, separate_location: bool = True) -> bool:
        """カテゴリごとの処理実行"""
        file_path = self.data_files.get(category)
        if not file_path or not self.validate_file(file_path):
            print(f"❌ {category}データファイルが見つからないか空です: {file_path}")
            return False

        if dry_run:
            print(f"📋 {category}データ: ドライラン完了")
            return True

        print(f"\n🔄 {category}データを処理中...")

        try:
            # プロセッサー初期化
            processor = NewUnifiedProcessor()

            # クエリ解析
            queries = processor.parse_query_file(file_path)
            if not queries:
                print(f"❌ {category}クエリが見つかりません")
                return False

            # 処理実行
            results = processor.process_all_queries(queries)

            # スプレッドシートに保存
            if results:
                success = processor.save_to_spreadsheet(category, separate_location)
                if success:
                    print(f"✅ {category}データ処理完了: {len(results)}件")
                    return True
                else:
                    print(f"❌ {category}データ保存失敗")
                    return False
            else:
                print(f"❌ {category}データ: 処理結果なし")
                return False

        except Exception as e:
            print(f"❌ {category}データ処理エラー: {e}")
            return False

    def run_unified_processing(self, target: str = 'all', mode: str = 'standard',
                             dry_run: bool = False, separate_location: bool = True) -> bool:
        """統合処理実行"""

        # 実行計画表示
        total_queries = self.show_execution_plan(target, mode)

        if total_queries == 0:
            print("❌ 処理対象のデータが見つかりません")
            return False

        if dry_run:
            print(f"\n{'='*60}")
            print(f"🎉 処理が正常に完了しました！")
            print(f"📝 ドライラン完了（実際の処理は行いませんでした）")
            print(f"🕐 終了時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            return True

        # 実行確認
        if not dry_run:
            confirmation = input("\n実行を続けますか？ (y/N): ")
            if confirmation.lower() != 'y':
                print("処理を中止しました")
                return False

        # 処理実行
        success_count = 0
        total_count = 0

        if target == 'all':
            categories = list(self.data_files.keys())
        else:
            categories = [target] if target in self.data_files else []

        for category in categories:
            total_count += 1
            if self.run_category(category, mode, dry_run, separate_location):
                success_count += 1

        # 結果表示
        print(f"\n{'='*60}")
        if success_count == total_count:
            print(f"🎉 処理が正常に完了しました！")
        else:
            print(f"⚠️ 処理が部分的に完了しました")

        print(f"📊 成功: {success_count}/{total_count} カテゴリ")
        print(f"🕐 終了時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        return success_count > 0

def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(description='佐渡飲食店マップ - 新しいAPIクライアント統合処理')
    parser.add_argument('--mode', choices=['quick', 'standard', 'comprehensive'],
                       default='standard', help='実行モード')
    parser.add_argument('--target', choices=['all', 'restaurants', 'parkings', 'toilets'],
                       default='all', help='処理対象')
    parser.add_argument('--dry-run', action='store_true', help='ドライラン（見積もりのみ）')
    parser.add_argument('--no-separate', action='store_true', help='佐渡市内・市外分離を無効化')
    parser.add_argument('--separate-only', action='store_true', help='データ分離のみ実行')

    args = parser.parse_args()

    # ヘッダー表示
    print("🚀 佐渡飲食店マップ - 新しいAPIクライアント統合処理実行")
    print("=" * 60)
    print(f"🕐 開始時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📦 バージョン: v2.2 (New API Client)")
    print("-" * 60)

    # 環境変数検証
    print("🔍 環境変数の検証を開始...")
    if not validate_environment():
        print("❌ 環境変数の検証に失敗しました")
        return

    # 統合処理実行
    runner = NewUnifiedRunner()

    success = runner.run_unified_processing(
        target=args.target,
        mode=args.mode,
        dry_run=args.dry_run,
        separate_location=not args.no_separate
    )

    if success:
        print("✅ 全体処理完了")
    else:
        print("❌ 処理に失敗しました")

if __name__ == "__main__":
    main()
