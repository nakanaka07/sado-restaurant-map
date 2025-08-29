#!/usr/bin/env python3
"""ワークシート状況の詳細確認"""

import sys
sys.path.append('.')

from shared.config import ScraperConfig
from shared.container import create_container
from infrastructure.storage.sheets_storage_adapter import SheetsStorageAdapter

def main():
    try:
        config = ScraperConfig.from_environment()
        container = create_container(config)
        sheets_service = container.get(SheetsStorageAdapter)

        # Get spreadsheet
        spreadsheet = sheets_service._get_spreadsheet()
        print(f"スプレッドシート名: {spreadsheet.title}")
        print(f"スプレッドシートID: {spreadsheet.id}")

        # List all worksheets
        worksheets = spreadsheet.worksheets()
        print(f"\n全ワークシート一覧 ({len(worksheets)}個):")
        for i, ws in enumerate(worksheets, 1):
            print(f"{i}. {ws.title} (ID: {ws.id})")
            try:
                row_count = ws.row_count
                col_count = ws.col_count
                print(f"   サイズ: {row_count}行 × {col_count}列")

                # Get first few rows to see if there's data
                try:
                    values = ws.get_all_values()
                    non_empty_rows = sum(1 for row in values if any(cell.strip() for cell in row))
                    print(f"   データ行数: {non_empty_rows}")
                    if values and any(cell.strip() for cell in values[0]):
                        print(f"   ヘッダー: {values[0][:3]}...")
                except Exception as e:
                    print(f"   データ取得エラー: {e}")
            except Exception as e:
                print(f"   ワークシート情報取得エラー: {e}")
            print()

        # Try to access toilets specifically
        print("=== toilets ワークシートへの直接アクセス試行 ===")
        try:
            toilets_ws = spreadsheet.worksheet('toilets')
            print("✅ toilets ワークシートアクセス成功")
            values = toilets_ws.get_all_values()
            print(f"データ行数: {len(values)}")
        except Exception as e:
            print(f"❌ toilets ワークシートアクセス失敗: {e}")

        # Check for case-sensitive issues
        print("\n=== 大文字小文字確認 ===")
        worksheet_titles = [ws.title for ws in worksheets]
        for title in worksheet_titles:
            if 'toilet' in title.lower():
                print(f"トイレ関連ワークシート発見: '{title}'")

    except Exception as e:
        print(f'エラー: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
