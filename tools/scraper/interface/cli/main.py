#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新しいAPIクライアント対応版 - 統合実行スクリプト

Places API (New) v1を使用した最新版実行システム
Clean Architecture準拠・依存性注入対応版
Phase 2改善: 非同期処理・エラーハンドリング・パフォーマンス監視統合
"""

import argparse
import sys
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional

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

# Phase 2改善: 新しい共有コンポーネント
from shared.error_handler import ErrorHandler, ErrorSeverity, ErrorCategory
from shared.performance_monitor import PerformanceMonitor

# 定数定義
class ScraperConstants:
    """スクレイパー実行の定数定義"""
    COST_PER_QUERY = 0.017  # USD per query
    ESTIMATED_TIME_PER_QUERY = 1.2  # seconds per query
    SECONDS_TO_MINUTES = 60
    DEFAULT_ENV_FILE = 'config/.env'
    ERROR_DISPLAY_LIMIT = 3  # エラー表示の最大件数

    # メッセージ定数
    PROCESSING_COMPLETE_MSG = "🎉 処理が正常に完了しました！"
    PROCESSING_PARTIAL_MSG = "⚠️ 処理が部分的に完了しました"
    ASYNC_PROCESSING_COMPLETE_MSG = "🎉 非同期処理が正常に完了しました！"
    ASYNC_PROCESSING_PARTIAL_MSG = "⚠️ 非同期処理が部分的に完了しました"

class DataFileConfig:
    """データファイルパス設定"""
    RESTAURANTS = 'data/restaurants_merged.txt'
    PARKINGS = 'data/parkings_merged.txt'
    TOILETS = 'data/toilets_merged.txt'

    @classmethod
    def get_file_mapping(cls) -> dict[str, str]:
        """ファイルマッピング辞書を取得"""
        return {
            'restaurants': cls.RESTAURANTS,
            'parkings': cls.PARKINGS,
            'toilets': cls.TOILETS
        }

class UserInteraction:
    """ユーザー入力の抽象化クラス（テスタビリティ向上）"""

    @staticmethod
    def confirm_execution(message: str = "実行を続けますか？") -> bool:
        """実行確認を取得"""
        confirmation = input(f"\n{message} (y/N): ")
        return confirmation.lower() == 'y'

class ScraperCLI:
    """新しいアーキテクチャ対応CLI実行クラス - Phase 2改善版"""

    def __init__(self, config: ScraperConfig, container: DIContainer):
        """CLI初期化 - Phase 2改善版"""
        self._config = config
        self._container = container
        self._logger = get_logger(__name__)

        # ワークフローを取得
        self._workflow = self._container.get(DataProcessingWorkflow)

        # データファイル設定を使用
        self.data_files = DataFileConfig.get_file_mapping()

        # Phase 2改善: 新しいコンポーネント
        self._error_handler = ErrorHandler("ScraperCLI")
        self._performance_monitor = PerformanceMonitor("ScraperCLI")

    def validate_environment(self) -> bool:
        """環境設定の検証"""
        try:
            # API キーの検証
            if not self._config.google_api.places_api_key:
                self._logger.error("Places API キーが設定されていません")
                return False

            # スプレッドシートIDの検証（警告レベル）
            if not self._config.google_api.spreadsheet_id:
                self._logger.warning("スプレッドシートIDが設定されていません（Google Sheets保存無効）")

            # サービスアカウントファイルの検証（警告レベル）
            if not self._config.google_api.service_account_path or not Path(self._config.google_api.service_account_path).exists():
                self._logger.warning("サービスアカウントファイルが見つかりません（Google Sheets保存無効）",
                                   path=self._config.google_api.service_account_path)

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
        print(f"   推定コスト: ${total_queries * ScraperConstants.COST_PER_QUERY:.3f} USD")
        print(f"   推定実行時間: {total_queries * ScraperConstants.ESTIMATED_TIME_PER_QUERY / ScraperConstants.SECONDS_TO_MINUTES:.1f} 分")

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

    def run_category(self, category: CategoryType, mode: str, dry_run: bool = False, separate_location: bool = True) -> bool:
        """カテゴリごとの処理実行"""
        file_path: Optional[str] = self.data_files.get(category)

        # ファイルパスの型安全性チェック
        if file_path is None:
            self._logger.error("Unknown category specified", category=category)
            print(f"❌ 不明なカテゴリです: {category}")
            return False

        if not self.validate_file(file_path):
            self._logger.error("Data file not found or empty", category=category, file_path=file_path)
            print(f"❌ {category}データファイルが見つからないか空です: {file_path}")
            return False

        if dry_run:
            self._logger.info("Dry run completed", category=category)
            print(f"📋 {category}データ: ドライラン完了")
            return True

        print(f"\n🔄 {category}データを処理中...")
        print(f"   処理モード: {self.get_mode_description(mode)}")

        try:
            # ワークフローを使用して処理実行（モード情報を渡す）
            result = self._workflow.run_category_processing(
                category=category,
                mode=mode,  # モード情報を渡す
                dry_run=dry_run,
                separate_location=separate_location
            )

            if result.success:
                self._logger.info("Category processing completed successfully",
                                category=category, processed_count=result.processed_count)
                print(f"✅ {category}データ処理完了: {result.processed_count}件")
                return True
            else:
                self._logger.error("Category processing failed",
                                 category=category, error_count=len(result.errors))
                print(f"❌ {category}データ処理失敗: {len(result.errors)}個のエラー")
                # エラー表示を制限
                for error in result.errors[:ScraperConstants.ERROR_DISPLAY_LIMIT]:
                    print(f"   - {error}")
                if len(result.errors) > ScraperConstants.ERROR_DISPLAY_LIMIT:
                    print(f"   ... 他 {len(result.errors) - ScraperConstants.ERROR_DISPLAY_LIMIT} 個のエラー")
                return False

        except ValidationError as e:
            self._logger.error("Validation error during processing", category=category, error=str(e))
            print(f"❌ {category}データ検証エラー: {e}")
            return False
        except ConfigurationError as e:
            self._logger.error("Configuration error during processing", category=category, error=str(e))
            print(f"❌ {category}設定エラー: {e}")
            return False
        except Exception as e:
            self._logger.error("Unexpected error during processing", category=category, error=str(e))
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
            print(ScraperConstants.PROCESSING_COMPLETE_MSG)
            print("📝 ドライラン完了（実際の処理は行いませんでした）")
            print(f"🕐 終了時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            return True

        # 実行確認（ドライランでない場合のみ）
        if not dry_run and not UserInteraction.confirm_execution():
            self._logger.info("Processing cancelled by user")
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

    async def run_unified_processing_async(
        self,
        target: str = 'all',
        mode: str = 'standard',
        dry_run: bool = False,
        separate_location: bool = True
    ) -> bool:
        """統合処理実行 - 非同期版 (Phase 2改善)"""

        with self._performance_monitor.measure_time("unified_processing_async"):
            try:
                # 実行計画表示
                total_queries = self.show_execution_plan(target, mode)

                if total_queries == 0:
                    print("❌ 処理対象のデータが見つかりません")
                    return False

                if dry_run:
                    print(f"\n{'='*60}")
                    print(ScraperConstants.PROCESSING_COMPLETE_MSG)
                    print("📝 ドライラン完了（実際の処理は行いませんでした）")
                    print(f"🕐 終了時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                    return True

                # 実行確認（ドライランでない場合のみ）
                if not dry_run and not UserInteraction.confirm_execution():
                    self._logger.info("Processing cancelled by user")
                    print("処理を中止しました")
                    return False

                # 処理実行
                success_count = 0
                total_count = 0

                if target == 'all':
                    categories = list(self.data_files.keys())
                else:
                    categories = [target] if target in self.data_files else []

                print(f"\n🚀 非同期処理開始 - {len(categories)}カテゴリを並列処理")

                # 非同期カテゴリ処理
                for category in categories:
                    total_count += 1
                    if await self._run_category_async(category, mode, dry_run, separate_location):
                        success_count += 1

                # 統計情報表示
                stats = self.get_processing_statistics()
                self._display_processing_statistics(stats)

                # 結果表示
                print(f"\n{'='*60}")
                if success_count == total_count:
                    print(ScraperConstants.ASYNC_PROCESSING_COMPLETE_MSG)
                else:
                    print(ScraperConstants.ASYNC_PROCESSING_PARTIAL_MSG)

                print(f"📊 成功: {success_count}/{total_count} カテゴリ")
                print(f"🕐 終了時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

                return success_count > 0

            except Exception as e:
                self._error_handler.handle_error(e, ErrorSeverity.HIGH, ErrorCategory.SYSTEM)
                print(f"❌ 非同期処理でエラーが発生しました: {str(e)}")
                return False

    async def _run_category_async(
        self,
        category: CategoryType,
        mode: str,
        dry_run: bool = False,
        separate_location: bool = True
    ) -> bool:
        """カテゴリ別処理実行 - 非同期版"""

        with self._performance_monitor.measure_time(f"category_processing.{category}"):
            try:
                print(f"\n🔍 {category}データ処理開始（非同期モード）")

                # ワークフローに非同期処理を有効化して実行
                result = await self._workflow.process_category_async(
                    category=category,
                    mode=mode,
                    dry_run=dry_run,
                    separate_location=separate_location
                )

                if result.success:
                    print(f"✅ {category}データ処理完了")
                    print(f"📊 処理件数: {result.processed_count}")
                    if result.error_count > 0:
                        print(f"⚠️ エラー件数: {result.error_count}")
                    return True
                else:
                    print(f"❌ {category}データ処理失敗")
                    if result.errors:
                        print(f"エラー詳細（最新{ScraperConstants.ERROR_DISPLAY_LIMIT}件）:")
                        for error in result.errors[:ScraperConstants.ERROR_DISPLAY_LIMIT]:
                            print(f"  - {error}")
                    return False

            except ValidationError as e:
                self._error_handler.handle_error(e, ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION)
                print(f"❌ {category}データ検証エラー: {e}")
                return False
            except Exception as e:
                self._error_handler.handle_error(e, ErrorSeverity.HIGH, ErrorCategory.PROCESSING)
                print(f"❌ {category}データ処理エラー: {e}")
                return False

    def get_processing_statistics(self) -> dict:
        """処理統計を取得 - Phase 2改善"""
        return {
            "performance_stats": self._performance_monitor.get_performance_stats(),
            "error_stats": self._error_handler.get_error_stats(),
            "system_health": self._performance_monitor.get_system_health(),
            "workflow_stats": self._workflow.get_processing_statistics() if hasattr(self._workflow, 'get_processing_statistics') else {}
        }

    def _display_processing_statistics(self, stats: dict) -> None:
        """処理統計を表示"""
        print(f"\n{'='*60}")
        print("📈 処理統計サマリー")
        print(f"{'='*60}")

        # システム健全性
        health = stats.get('system_health', {})
        print(f"🏥 システム状態: {health.get('status', 'unknown')}")

        if health.get('api_success_rate'):
            print(f"📡 API成功率: {health['api_success_rate']:.1%}")

        if health.get('avg_response_time'):
            print(f"⏱️ 平均応答時間: {health['avg_response_time']:.2f}秒")

        # エラー統計
        error_stats = stats.get('error_stats', {})
        if error_stats.get('total_errors', 0) > 0:
            print(f"❌ 総エラー数: {error_stats['total_errors']}")

            # カテゴリ別エラー
            error_by_category = error_stats.get('errors_by_category', {})
            if error_by_category:
                print("📋 エラーカテゴリ別:")
                for category, count in error_by_category.items():
                    print(f"  - {category}: {count}件")

        print(f"{'='*60}")

def run_async_main(args) -> bool:
    """非同期メイン処理"""
    async def _async_main():
        try:
            # 環境ファイル読み込み
            _load_environment_file(args.env_file)

            # 設定とコンテナ初期化
            config = ScraperConfig.from_environment()
            container = create_container(config)
            cli = ScraperCLI(config, container)

            # 環境検証
            if not cli.validate_environment():
                return False

            # 非同期処理実行
            return await cli.run_unified_processing_async(
                target=args.target,
                mode=args.mode,
                dry_run=args.dry_run,
                separate_location=not args.no_separate_location
            )

        except Exception as e:
            print(f"❌ 非同期実行エラー: {str(e)}")
            return False

    # 非同期実行
    return asyncio.run(_async_main())

def _load_environment_file(env_file_path: Optional[str]) -> None:
    """環境ファイルの読み込み（共通化）"""
    if env_file_path:
        from shared.config import load_env_to_os
        load_env_to_os(env_file_path)

def _handle_config_check(args) -> None:
    """環境変数設定チェックを実行"""
    from shared.config import validate_environment_setup, check_config_creation

    print("🔍 環境変数設定検証")
    print("=" * 60)

    # 環境ファイルの内容をOSの環境変数に読み込み
    _load_environment_file(args.env_file)

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
        # 環境ファイル読み込み（デフォルトで config/.env を使用）
        _load_environment_file(ScraperConstants.DEFAULT_ENV_FILE)

        # 設定読み込み
        config = ScraperConfig.from_environment()
        container = create_container(config)

        # Google Places API接続テスト
        print("\n📍 Google Places API接続テスト...")

        from infrastructure.external.places_api_adapter import PlacesAPIAdapter
        places_client = container.get(PlacesAPIAdapter)

        # 簡単なAPI キー検証を実行
        test_place_id = "ChIJN1t_tDeuEmsRUsoyG83frY4"  # 有名な場所のPlace ID
        test_result = places_client.fetch_place_details(test_place_id)

        if test_result and test_result.get('id'):
            print("✅ Google Places API: 接続成功")
        else:
            print("⚠️ Google Places API: レスポンスが空です")

        # Google Sheets API接続テスト
        print("\n📊 Google Sheets API接続テスト...")

        # スプレッドシートの基本情報を取得してテスト
        try:
            from infrastructure.storage.sheets_storage_adapter import SheetsStorageAdapter
            sheets_client = container.get(SheetsStorageAdapter)

            # 実際にスプレッドシートの存在確認を実行
            if config.google_api.spreadsheet_id:
                sheets_info = sheets_client.test_connection()
                if sheets_info:
                    print("✅ Google Sheets API: 接続成功")
                    print(f"   スプレッドシート: {sheets_info.get('title', 'Unknown')}")
                else:
                    print("⚠️ Google Sheets API: スプレッドシートにアクセスできません")
            else:
                print("⚠️ Google Sheets API: スプレッドシートIDが未設定")
        except Exception as sheets_error:
            print(f"❌ Google Sheets API: 接続失敗 - {sheets_error}")

        print("\n✅ 接続テスト完了")

    except Exception as e:
        print(f"❌ 接続テストでエラーが発生: {e}")
        sys.exit(1)

    sys.exit(0)


def _handle_separate_only(args) -> None:
    """データ分離のみ実行"""
    print("📂 データ分離処理")
    print("=" * 60)

    try:
        # 環境ファイル読み込み
        _load_environment_file(args.env_file)

        config = ScraperConfig.from_environment()
        container = create_container(config)

        from core.processors.data_processor import DataProcessor
        processor = container.get(DataProcessor)

        # 既存の結果データがある場合にのみ分離実行
        if processor.results:
            print(f"📊 {len(processor.results)}件のデータを分離中...")
            sado_results, outside_results = processor.separate_sado_data(processor.results)

            print("✅ 分離完了:")
            print(f"   佐渡市内: {len(sado_results)}件")
            print(f"   佐渡市外: {len(outside_results)}件")
        else:
            print("⚠️ 分離対象のデータが見つかりません")
            print("   まず通常の処理を実行してデータを取得してください")

    except Exception as e:
        print(f"❌ データ分離処理エラー: {e}")
        sys.exit(1)

    sys.exit(0)


def _create_argument_parser():
    """引数パーサーを作成"""
    parser = argparse.ArgumentParser(description='佐渡飲食店マップ - 新しいAPIクライアント統合処理 (Phase 2改善版)')
    parser.add_argument('--mode', choices=['quick', 'standard', 'comprehensive'],
                       default='standard', help='実行モード')
    parser.add_argument('--target', choices=['all', 'restaurants', 'parkings', 'toilets'],
                       default='all', help='処理対象')
    parser.add_argument('--dry-run', action='store_true', help='ドライラン（見積もりのみ）')
    parser.add_argument('--no-separate', action='store_true', help='佐渡市内・市外分離を無効化')
    parser.add_argument('--separate-only', action='store_true', help='データ分離のみ実行')
    parser.add_argument('--config-check', action='store_true', help='環境変数設定の検証のみ実行')
    parser.add_argument('--test-connections', action='store_true', help='API接続テストを実行')
    parser.add_argument('--env-file', type=str, default=ScraperConstants.DEFAULT_ENV_FILE,
                       help='環境ファイルのパス（.env.production等）')
    # Phase 2改善: 非同期処理オプション
    parser.add_argument('--async-mode', action='store_true', help='非同期処理を有効化（Phase 2改善）')
    parser.add_argument('--sync', action='store_true', help='同期処理を強制（デバッグ用）')
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

    # 環境ファイルの読み込み
    _load_environment_file(args.env_file)

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
    """メイン処理 - Phase 2改善版"""
    parser = _create_argument_parser()
    args = parser.parse_args()

    # 特殊オプションの処理
    if args.config_check:
        _handle_config_check(args)

    if args.test_connections:
        _handle_connection_test()

    if args.separate_only:
        _handle_separate_only(args)

    # ヘッダー表示
    _show_header()

    # Phase 2改善: 非同期/同期処理の選択
    if hasattr(args, 'async_mode') and args.async_mode and not args.sync:
        print("🚀 非同期処理モードで実行中...")
        success = run_async_main(args)
        sys.exit(0 if success else 1)
    else:
        # 従来の同期処理
        if hasattr(args, 'sync') and args.sync:
            print("🔄 同期処理モード（強制）で実行中...")
        _run_main_processing(args)

if __name__ == "__main__":
    main()
