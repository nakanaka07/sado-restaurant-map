#!/usr/bin/env python3
"""
ワークシートへの書き込み動作をデバッグするスクリプト
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


def debug_worksheet_write():
    """ワークシートへの書き込み機能をデバッグ"""
    print("🔧 ワークシート書き込みデバッグツール")
    print("=" * 50)

    try:
        # 設定読み込み
        config = ScraperConfig.from_environment()
        print(f"📊 スプレッドシートID: {config.google_api.spreadsheet_id}")

        # DIコンテナを使用してSheetsStorageAdapterを初期化
        container = create_container(config)
        storage = container.get(SheetsStorageAdapter)

        # toiletsワークシートに直接テストデータを書き込み
        test_data = [
            {
                'place_id': 'TEST_PLACE_ID_001',
                'name': 'テスト施設001',
                'address': '新潟県佐渡市テスト町1-1',
                'latitude': 38.0,
                'longitude': 138.0,
                'category': 'トイレ',
                'category_detail': '公衆トイレ',
                'business_status': 'OPERATIONAL',
                'description': 'テスト用の施設です',
                'formatted_address': '新潟県佐渡市テスト町1-1',
                'opening_hours': '24時間営業',
                'wheelchair_accessible': True,
                'good_for_children': True,
                'parking': False,
                'rating': 4.0,
                'user_ratings_total': 10,
                'district': '佐渡市',
                'maps_url': 'https://maps.google.com/place?cid=123456789',
                'source_method': 'TEST',
                'last_updated': '2025-08-29T11:40:00'
            }
        ]

        print("\n🧪 toiletsワークシートにテストデータを書き込み中...")
        print(f"   テストデータ: {len(test_data)}件")

        # 直接書き込み実行
        result = storage.save(test_data, 'toilets')
        print(f"✅ テストデータの書き込み完了: {result}")

        # 結果確認
        print("\n📋 書き込み後のワークシート確認...")
        spreadsheet = storage._get_spreadsheet()
        try:
            worksheet = spreadsheet.worksheet('toilets')
            values = worksheet.get_all_values()

            if not values:
                print("❌ データが見つかりません")
            elif len(values) == 1:
                print("⚠️  ヘッダーのみ存在（データ行なし）")
                print(f"   ヘッダー: {values[0]}")
            else:
                print(f"✅ データ行数: {len(values) - 1}行")
                print(f"   ヘッダー: {values[0]}")
                print(f"   最初のデータ行: {values[1][:5] if len(values[1]) >= 5 else values[1]}")
        except gspread.WorksheetNotFound:
            print("❌ ワークシート'toilets'が見つかりません")

    except Exception as e:
        print(f"❌ エラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit(debug_worksheet_write())
