#!/usr/bin/env python3
"""スマート更新システムの詳細調査・修復スクリプト - スプレッドシートにヘッダーのみが出力される問題の根本原因を特定し、解決策を提供"""

import os
import sys
from dotenv import load_dotenv
import gspread

# プロジェクトルートのパスを追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 環境変数を読み込み
load_dotenv(os.path.join(os.path.dirname(__file__), 'config', '.env'))

from infrastructure.storage.sheets_storage_adapter import SheetsStorageAdapter
from infrastructure.auth.google_auth_service import GoogleAuthService
from shared.config import ScraperConfig
from shared.container import create_container


def _get_worksheet_info(spreadsheet):
    """ワークシート情報を取得"""
    all_worksheets = [ws.title for ws in spreadsheet.worksheets()]
    print(f"✅ 検出されたワークシート: {len(all_worksheets)}個")
    for i, ws_name in enumerate(all_worksheets, 1):
        print(f"   {i}. {ws_name}")
    return all_worksheets


def _get_worksheet_status(values):
    """ワークシートの状態を判定"""
    if not values:
        return "❌ 完全に空", "データなし"
    elif len(values) == 1:
        return "⚠️  ヘッダーのみ", f"ヘッダー: {len(values[0])}列"
    else:
        return "✅ データあり", f"データ行: {len(values)-1}行, 列: {len(values[0])}列"


def _check_last_update(values):
    """最終更新時刻をチェック"""
    if len(values) > 1 and len(values[0]) > 0:
        header = values[0]
        if '最終更新日時' in header:
            timestamp_col = header.index('最終更新日時')
            if len(values) > 1 and len(values[1]) > timestamp_col:
                last_update = values[1][timestamp_col] if values[1][timestamp_col] else "未設定"
                print(f"      最新データの更新時刻: {last_update}")


def _analyze_worksheet_data(spreadsheet, category):
    """個別ワークシートのデータ分析"""
    try:
        worksheet = spreadsheet.worksheet(category)
        values = worksheet.get_all_values()

        status, detail = _get_worksheet_status(values)
        print(f"   {category}: {status} ({detail})")

        _check_last_update(values)

        return len(values) > 1  # データがあるかどうか

    except Exception as e:
        print(f"   {category}: ❌ アクセスエラー ({str(e)})")
        return False


def _analyze_worksheets(storage):
    """全ワークシートの分析"""
    spreadsheet = storage._get_spreadsheet()
    all_worksheets = _get_worksheet_info(spreadsheet)

    main_categories = ['restaurants', 'parkings', 'toilets']
    outside_categories = ['restaurants_佐渡市外', 'parkings_佐渡市外', 'toilets_佐渡市外']

    print("\n� ワークシート詳細分析:")

    results = {}
    for category in main_categories + outside_categories:
        if category in all_worksheets:
            results[category] = _analyze_worksheet_data(spreadsheet, category)
        else:
            print(f"   {category}: ❌ ワークシート未作成")
            results[category] = False

    return results, all_worksheets


def _analyze_problem_causes(_storage, results, all_worksheets):
    """問題原因の分析"""
    toilets_has_data = results.get('toilets', False)
    toilets_outside_exists = 'toilets_佐渡市外' in all_worksheets

    print("\n📋 分析結果:")
    print(f"   toiletsワークシート: {'✅ データあり' if toilets_has_data else '⚠️  ヘッダーのみ/空'}")
    print(f"   toilets_佐渡市外ワークシート: {'✅ 存在' if toilets_outside_exists else '❌ 不存在'}")

    print("\n🎯 問題の根本原因推定:")

    if not toilets_has_data and not toilets_outside_exists:
        print("   ❌ 重大な問題: 71件のデータが完全に消失")
        print("      推定原因:")
        print("      1. スマート更新システムがデータを「重複」として判定し削除")
        print("      2. 座標フィルタリングで全データが範囲外と判定")
        print("      3. 保存処理中のエラーで実際にはデータが保存されていない")

        print("\n🛠️  推奨解決策:")
        print("   1. 【緊急対応】toiletsワークシートを完全クリアして再実行")
        print("   2. 【根本対策】スマート更新システムを一時無効化")
        print("   3. 【検証】座標境界条件の緩和")

        return True  # 重大な問題あり

    elif toilets_has_data and not toilets_outside_exists:
        print("   ⚠️  部分的問題: 佐渡島内データは存在、島外データが不明")
        print("      推定原因: 佐渡島外データが境界条件で全て除外された可能性")

    return False  # 重大な問題なし


def investigate_smart_update_system():
    """スマート更新システムの詳細調査"""
    print("🔍 スマート更新システム詳細調査・修復ツール")
    print("=" * 60)

    try:
        # 設定読み込み
        config = ScraperConfig.from_environment()
        print(f"📊 スプレッドシートID: {config.google_api.spreadsheet_id}")

        # DIコンテナを使用してSheetsStorageAdapterを初期化
        container = create_container(config)
        storage = container.get(SheetsStorageAdapter)

        print("\n📋 現在のワークシート状況を調査...")

        # ワークシート分析
        results, all_worksheets = _analyze_worksheets(storage)

        print("\n🔧 問題の特定と解決策提案:")

        # 問題分析
        has_critical_problem = _analyze_problem_causes(storage, results, all_worksheets)

        if has_critical_problem:
            return suggest_solutions(storage, config)

        else:
            print("   ✅ データは正常に存在している可能性")

    except Exception as e:
        print(f"❌ 調査エラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


def suggest_solutions(storage, config):
    """具体的な解決策を提案・実行"""
    print("\n🚀 解決策の実行オプション:")
    print("=" * 40)

    solutions = [
        "1. toiletsワークシートをクリアして再実行",
        "2. スマート更新システムを無効化して強制上書き",
        "3. 座標境界条件を緩和して再処理",
        "4. デバッグモードで1件ずつ処理確認",
        "5. 何もせずに終了"
    ]

    for solution in solutions:
        print(f"   {solution}")

    print("\n実行したい解決策の番号を入力してください (1-5):")
    try:
        choice = input(">>> ").strip()

        if choice == "1":
            return clear_and_reprocess(storage, config)
        elif choice == "2":
            return disable_smart_update_and_reprocess(config)
        elif choice == "3":
            return adjust_coordinate_bounds_and_reprocess(config)
        elif choice == "4":
            return debug_process_step_by_step(storage, config)
        elif choice == "5":
            print("✅ 終了します")
            return 0
        else:
            print("❌ 無効な選択です")
            return 1

    except KeyboardInterrupt:
        print("\n❌ ユーザーによってキャンセルされました")
        return 1


def clear_and_reprocess(storage, _config):
    """toiletsワークシートをクリアして再実行"""
    print("\n🧹 toiletsワークシートのクリア実行...")

    try:
        spreadsheet = storage._get_spreadsheet()

        # toiletsワークシートのクリア
        if 'toilets' in [ws.title for ws in spreadsheet.worksheets()]:
            toilets_ws = spreadsheet.worksheet('toilets')
            toilets_ws.clear()
            print("✅ toiletsワークシートをクリアしました")

            print("\n🔄 再処理の実行コマンド:")
            print("   以下のコマンドを実行してください:")
            print("   python interface/cli/main.py --target toilets --mode standard")

        else:
            print("❌ toiletsワークシートが見つかりません")

    except Exception as e:
        print(f"❌ クリア処理エラー: {str(e)}")
        return 1

    return 0


def disable_smart_update_and_reprocess(_config):
    """スマート更新システムを無効化して強制上書き"""
    print("\n⚙️  スマート更新システム無効化の手順:")
    print("   1. shared/config.py または環境変数で SMART_UPDATE=false を設定")
    print("   2. または、SheetsStorageAdapter の smart update ロジックを一時コメントアウト")
    print("   3. 再実行: python interface/cli/main.py --target toilets --mode standard")

    return 0


def adjust_coordinate_bounds_and_reprocess(_config):
    """座標境界条件を緩和して再処理"""
    print("\n📍 座標境界条件の緩和提案:")
    print("   現在の境界:")
    print("   北緯: 37.74 - 38.39度")
    print("   東経: 137.85 - 138.62度")
    print("\n   緩和案:")
    print("   北緯: 37.70 - 38.45度 (+/-0.05度)")
    print("   東経: 137.80 - 138.70度 (+/-0.05度)")
    print("\n   修正ファイル: core/processors/data_processor.py の SADO_BOUNDS")

    return 0


def debug_process_step_by_step(storage, _config):
    """デバッグモードで1件ずつ処理確認"""
    print("\n🔍 デバッグモード処理...")
    print("   サンプルの1件のみ処理してログを詳細確認します")

    # サンプルデータで1件テスト
    sample_data = [
        {
            'place_id': 'DEBUG_TEST_001',
            'name': 'デバッグテスト施設',
            'address': '新潟県佐渡市両津福浦港1-1',
            'latitude': 38.08,  # 佐渡島内の確実な座標
            'longitude': 138.43,
            'category': 'トイレ',
            'category_detail': '公衆トイレ',
            'business_status': 'OPERATIONAL',
            'description': 'デバッグ用の施設です',
            'formatted_address': '新潟県佐渡市両津福浦港1-1',
            'opening_hours': '24時間営業',
            'wheelchair_accessible': True,
            'good_for_children': True,
            'parking': False,
            'rating': 4.0,
            'user_ratings_total': 5,
            'district': '佐渡市',
            'maps_url': 'https://maps.google.com/place?cid=123456789',
            'source_method': 'DEBUG',
            'last_updated': '2025-08-29T12:00:00'
        }
    ]

    print(f"📋 デバッグデータ: {len(sample_data)}件")
    print(f"   座標: ({sample_data[0]['latitude']}, {sample_data[0]['longitude']})")

    try:
        result = storage.save(sample_data, 'toilets')
        print(f"✅ デバッグデータ保存結果: {result}")

        # 保存後の確認
        spreadsheet = storage._get_spreadsheet()
        toilets_ws = spreadsheet.worksheet('toilets')
        values = toilets_ws.get_all_values()

        print("📊 保存後の状況:")
        print(f"   総行数: {len(values)}行")
        if len(values) > 1:
            print(f"   最新行: {values[-1][:3]}")  # 最初の3列のみ表示

    except Exception as e:
        print(f"❌ デバッグ処理エラー: {str(e)}")
        return 1

    return 0


if __name__ == "__main__":
    exit(investigate_smart_update_system())
