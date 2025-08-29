#!/usr/bin/env python3
"""
toiletsワークシートをクリアして再処理するスクリプト
"""

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


def clear_toilets_worksheet_and_reprocess():
    """toiletsワークシートをクリアして再処理の準備"""
    print("🧹 toiletsワークシート クリア & 再処理準備ツール")
    print("=" * 50)

    try:
        # 設定読み込み
        config = ScraperConfig.from_environment()
        print(f"📊 スプレッドシートID: {config.google_api.spreadsheet_id}")

        # DIコンテナを使用してSheetsStorageAdapterを初期化
        container = create_container(config)
        storage = container.get(SheetsStorageAdapter)

        # 現在の状況確認
        spreadsheet = storage._get_spreadsheet()
        print("\n📋 現在の状況:")

        try:
            toilets_ws = spreadsheet.worksheet('toilets')
            values = toilets_ws.get_all_values()
            print(f"   toiletsワークシート: {len(values)}行 (ヘッダー含む)")

            if len(values) > 1:
                print("   データ例:")
                for i, row in enumerate(values[:3], 1):  # 最初の3行を表示
                    row_type = "ヘッダー" if i == 1 else f"データ{i-1}"
                    print(f"     {row_type}: {row[:3]}...")  # 最初の3列のみ

        except gspread.WorksheetNotFound:
            print("   ❌ toiletsワークシートが見つかりません")
            return 1

        # ワークシートクリア実行
        print("\n🧹 toiletsワークシートをクリアします...")
        toilets_ws.clear()
        print("✅ toiletsワークシートをクリアしました")

        # クリア後の確認
        values_after = toilets_ws.get_all_values()
        print(f"   クリア後: {len(values_after)}行")

        print("\n🚀 次のステップ:")
        print("   以下のコマンドで再処理を実行してください:")
        print("   python interface/cli/main.py --target toilets --mode standard")
        print("")
        print("   これにより71件のtoiletsデータが正常に保存されるはずです。")

    except Exception as e:
        print(f"❌ エラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit(clear_toilets_worksheet_and_reprocess())
