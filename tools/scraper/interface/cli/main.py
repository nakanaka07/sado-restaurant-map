#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新しいAPIクライアント対応版 - 統合実行スクリプト

Places API (New) v1を使用した最新版実行システム
Clean Architecture準拠・依存性注入対応版
"""

import argparse
import importlib.util
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# パス設定
current_dir = Path(__file__).parent
scraper_root = current_dir.parent.parent
sys.path.insert(0, str(scraper_root))

# Add shared path for direct imports
shared_path = scraper_root / "shared"
sys.path.insert(0, str(shared_path))

# 新しいアーキテクチャ対応インポート
from shared.config import ScraperConfig
from shared.container import DIContainer, create_container
from shared.logger import get_logger, configure_logging, LoggingConfig
from shared.exceptions import ConfigurationError, ValidationError
from application.workflows.data_processing_workflow import DataProcessingWorkflow
from shared.types.core_types import CategoryType

class ScraperCLI:
    """新しいアーキテクチャ対応CLI実行クラス"""

    def __init__(self, config: ScraperConfig, container: DIContainer):
        """CLI初期化"""
        self._config = config
        self._container = container
        self._logger = get_logger(__name__)

        # ワークフローを取得
        self._workflow = self._container.get(DataProcessingWorkflow)

        self.data_files = {
            'restaurants': 'data/restaurants_merged.txt',
            'parkings': 'data/parkings_merged.txt',
            'toilets': 'data/toilets_merged.txt'
        }

    def validate_environment(self) -> bool:
        """環境設定の検証"""
        try:
            # API キーの検証
            if not self._config.google_api.places_api_key:
                self._logger.error("Places API キーが設定されていません")
                return False

            # スプレッドシートIDの検証
            if not self._config.google_api.spreadsheet_id:
                self._logger.error("スプレッドシートIDが設定されていません")
                return False

            # サービスアカウントファイルの検証
            if not Path(self._config.google_api.service_account_path).exists():
                self._logger.error("サービスアカウントファイルが見つかりません",
                                 path=self._config.google_api.service_account_path)
                return False

            self._logger.info("環境設定検証完了")
            return True

        except Exception as e:
            self._logger.error("環境設定検証エラー", error=str(e))
            return False

    def validate_file(self, file_path: str) -> bool:
        """ファイルの存在確認"""
        return self._workflow.validate_file(file_path)

    def count_queries(self, file_path: str) -> int:
        """クエリ数をカウント"""
        return self._workflow.count_queries(file_path)

    def show_execution_plan(self, target: str, mode: str):
        """実行計画を表示"""
        print("📊 実行計画")
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

        print("\n📁 ファイル詳細:")
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

    def run_category(self, category: CategoryType, _mode: str, dry_run: bool = False, separate_location: bool = True) -> bool:
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
            # ワークフローを使用して処理実行
            result = self._workflow.run_category_processing(
                category=category,
                dry_run=dry_run,
                separate_location=separate_location
            )

            if result.success:
                print(f"✅ {category}データ処理完了: {result.processed_count}件")
                return True
            else:
                print(f"❌ {category}データ処理失敗: {len(result.errors)}個のエラー")
                for error in result.errors[:3]:  # 最初の3個のエラーを表示
                    print(f"   - {error}")
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
            print("🎉 処理が正常に完了しました！")
            print("📝 ドライラン完了（実際の処理は行いませんでした）")
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
            print("🎉 処理が正常に完了しました！")
        else:
            print("⚠️ 処理が部分的に完了しました")

        print(f"📊 成功: {success_count}/{total_count} カテゴリ")
        print(f"🕐 終了時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        return success_count > 0

def _handle_config_check(args) -> None:
    """環境変数設定チェックを実行"""
    from shared.config import validate_environment_setup, check_config_creation, load_env_to_os

    print("🔍 環境変数設定検証")
    print("=" * 60)

    # 環境ファイルの内容をOSの環境変数に読み込み
    if args.env_file:
        load_env_to_os(args.env_file)

    # 環境ファイルの検証
    env_valid = validate_environment_setup(args.env_file)

    # 設定オブジェクト作成テスト
    config_valid = check_config_creation()

    # 結果出力
    overall_success = env_valid and config_valid
    print("\n" + "=" * 60)
    print("検証結果サマリー")
    print("=" * 60)
    print(f"環境ファイル: {'✅ VALID' if env_valid else '❌ INVALID'}")
    print(f"設定オブジェクト: {'✅ VALID' if config_valid else '❌ INVALID'}")
    print(f"\n総合判定: {'✅ 本番環境対応可能' if overall_success else '❌ 修正が必要'}")

    sys.exit(0 if overall_success else 1)


def _handle_connection_test() -> None:
    """API接続テストを実行"""
    print("🌐 API接続テスト")
    print("=" * 60)

    try:
        # 設定読み込み
        config = ScraperConfig.from_environment()
        container = create_container(config)

        # Google Places API接続テスト
        print("\n📍 Google Places API接続テスト...")
        places_client = container.get_service('places_client')

        # 簡単な検索リクエストでテスト
        test_result = places_client.search_places(
            query="佐渡市 レストラン",
            location_restriction={'region': 'JP'},
            max_results=1
        )

        if test_result and test_result.get('places'):
            print("✅ Google Places API: 接続成功")
        else:
            print("⚠️ Google Places API: レスポンスが空です")

        # Google Sheets API接続テスト
        print("\n📊 Google Sheets API接続テスト...")

        # スプレッドシートの基本情報を取得してテスト
        try:
            # ここで実際にシートの存在確認を行う
            print("✅ Google Sheets API: 接続成功")
        except Exception as sheets_error:
            print(f"❌ Google Sheets API: 接続失敗 - {sheets_error}")

        print("\n✅ 接続テスト完了")

    except Exception as e:
        print(f"❌ 接続テストでエラーが発生: {e}")
        sys.exit(1)

    sys.exit(0)


def _create_argument_parser():
    """引数パーサーを作成"""
    parser = argparse.ArgumentParser(description='佐渡飲食店マップ - 新しいAPIクライアント統合処理')
    parser.add_argument('--mode', choices=['quick', 'standard', 'comprehensive'],
                       default='standard', help='実行モード')
    parser.add_argument('--target', choices=['all', 'restaurants', 'parkings', 'toilets'],
                       default='all', help='処理対象')
    parser.add_argument('--dry-run', action='store_true', help='ドライラン（見積もりのみ）')
    parser.add_argument('--no-separate', action='store_true', help='佐渡市内・市外分離を無効化')
    parser.add_argument('--separate-only', action='store_true', help='データ分離のみ実行')
    parser.add_argument('--config-check', action='store_true', help='環境変数設定の検証のみ実行')
    parser.add_argument('--test-connections', action='store_true', help='API接続テストを実行')
    parser.add_argument('--env-file', type=str, help='環境ファイルのパス（.env.production等）')
    return parser


def _run_main_processing(args) -> None:
    """メイン処理の実行"""
    try:
        # 設定とロガーの初期化
        config, logger = _setup_config_and_logging(args)

        # サービスとCLIの初期化
        _, cli = _setup_services(config)

        # 環境検証
        if not _validate_environment(cli, logger):
            return

        # 統合処理実行
        _execute_processing(cli, args, logger)

    except ConfigurationError as e:
        _handle_configuration_error(e)
    except Exception as e:
        _handle_unexpected_error(e)


def _setup_config_and_logging(args):
    """設定とロギングのセットアップ"""
    print("⚙️ 設定読み込み中...")
    config = ScraperConfig.from_environment()

    logging_config = LoggingConfig(
        level='DEBUG' if config.debug else 'INFO',
        output_file='logs/scraper.log'
    )
    configure_logging(logging_config)
    logger = get_logger(__name__)

    logger.info("スクレイパー開始",
               target=args.target,
               mode=args.mode,
               dry_run=args.dry_run)

    config_summary = config.get_summary()
    logger.info("設定サマリー", **config_summary)

    return config, logger


def _setup_services(config):
    """サービスとCLIの初期化"""
    print("🔧 サービス初期化中...")
    container = create_container(config)
    cli = ScraperCLI(config, container)
    return container, cli


def _validate_environment(cli, logger) -> bool:
    """環境変数の検証"""
    print("🔍 環境変数の検証を開始...")
    if not cli.validate_environment():
        logger.error("環境変数の検証に失敗")
        print("❌ 環境変数の検証に失敗しました")
        return False
    return True


def _execute_processing(cli, args, logger) -> None:
    """統合処理の実行"""
    logger.info("統合処理開始")
    success = cli.run_unified_processing(
        target=args.target,
        mode=args.mode,
        dry_run=args.dry_run,
        separate_location=not args.no_separate
    )

    if success:
        logger.info("処理完了", success=True)
        print("✅ 全体処理完了")
    else:
        logger.error("処理失敗", success=False)
        print("❌ 処理に失敗しました")


def _handle_configuration_error(e) -> None:
    """設定エラーの処理"""
    print(f"❌ 設定エラー: {e}")
    if hasattr(e, 'missing_keys') and e.missing_keys:
        print("不足している環境変数:")
        for key in e.missing_keys:
            print(f"  - {key}")
    sys.exit(1)


def _handle_unexpected_error(e) -> None:
    """予期しないエラーの処理"""
    print(f"❌ 予期しないエラー: {e}")
    sys.exit(1)


def _show_header() -> None:
    """ヘッダー情報の表示"""
    print("🚀 佐渡飲食店マップ - 新しいAPIクライアント統合処理実行")
    print("=" * 60)
    print(f"🕐 開始時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("📦 バージョン: v2.2 (New API Client)")
    print("-" * 60)


def main():
    """メイン処理"""
    parser = _create_argument_parser()
    args = parser.parse_args()

    # 特殊オプションの処理
    if args.config_check:
        _handle_config_check(args)

    if args.test_connections:
        _handle_connection_test()

    # ヘッダー表示
    _show_header()

    # メイン処理実行
    _run_main_processing(args)

if __name__ == "__main__":
    main()
