#!/usr/bin/env python3
"""
Google Sheetsの実際のデータを確認するスクリプト
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


def _check_worksheet_data(storage, worksheet_name):
    """個別ワークシートのデータ確認"""
    print(f"\n📋 {worksheet_name}ワークシートの確認")
    print("-" * 30)

    try:
        # ワークシートの全データを取得（gspreadを使用）
        spreadsheet = storage._get_spreadsheet()
        try:
            worksheet = spreadsheet.worksheet(worksheet_name)
            values = worksheet.get_all_values()
        except gspread.WorksheetNotFound:
            print(f"❌ ワークシート'{worksheet_name}'が見つかりません")
            return

        if not values:
            print("❌ データが見つかりません")
        elif len(values) == 1:
            print("⚠️  ヘッダーのみ存在（データ行なし）")
            print(f"   ヘッダー: {values[0]}")
        else:
            print(f"✅ データ行数: {len(values) - 1}行")
            print(f"   ヘッダー: {values[0]}")
            print(f"   最初のデータ行: {values[1][:5] if len(values[1]) >= 5 else values[1]}")
            if len(values) > 2:
                print(f"   最後のデータ行: {values[-1][:5] if len(values[-1]) >= 5 else values[-1]}")

    except Exception as e:
        print(f"❌ ワークシート'{worksheet_name}'のアクセスエラー: {str(e)}")


def main():
    """メイン関数"""
    print("🔍 Google Sheetsデータ確認ツール")
    print("=" * 50)

    try:
        # 設定読み込み
        config = ScraperConfig.from_environment()
        print(f"📊 スプレッドシートID: {config.google_api.spreadsheet_id}")

        # DIコンテナを使用してSheetsStorageAdapterを初期化
        container = create_container(config)
        storage = container.get(SheetsStorageAdapter)

        # 各ワークシートのデータを確認
        worksheets = ['restaurants', 'parkings', 'toilets', 'restaurants_佐渡市外', 'parkings_佐渡市外', 'toilets_佐渡市外']

        for worksheet_name in worksheets:
            _check_worksheet_data(storage, worksheet_name)

        print("\n" + "=" * 50)
        print("✅ データ確認完了")

    except Exception as e:
        print(f"❌ エラー: {str(e)}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
