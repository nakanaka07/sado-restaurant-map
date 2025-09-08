#!/usr/bin/env python3
"""Google Sheetsのワークシート詳細確認"""

import sys
sys.path.append('.')

from shared.config import ScraperConfig
from shared.container import create_container
from infrastructure.storage.sheets_storage_adapter import SheetsStorageAdapter


def get_worksheet_info(sheets_service):
    """Get worksheet and basic info."""
    spreadsheet = sheets_service._get_spreadsheet()
    toilets_ws = spreadsheet.worksheet('toilets')
    all_values = toilets_ws.get_all_values()
    return toilets_ws, all_values


def print_basic_info(all_values):
    """Print basic worksheet information."""
    print(f"総行数（ヘッダー含む）: {len(all_values)}")
    if all_values:
        print(f"ヘッダー行: {all_values[0][:5]}...")


def analyze_data_rows(all_values):
    """Analyze and print data row information."""
    non_empty_rows = 0
    for i, row in enumerate(all_values[1:], 1):  # Skip header
        if any(cell.strip() for cell in row):  # Check if any cell has content
            non_empty_rows += 1
            if i <= 3:  # Show first few data rows
                print(f"データ行{i}: {row[:3]}...")
        elif i <= 5:  # Show first few empty rows for debugging
            print(f"空行{i}: {row[:3] if row else '完全に空'}")

    print(f"非空データ行数: {non_empty_rows}")
    return non_empty_rows


def print_last_rows(all_values):
    """Print information about the last few rows."""
    print("\n最後の5行の確認:")
    for i in range(max(0, len(all_values)-5), len(all_values)):
        row = all_values[i]
        has_content = any(cell.strip() for cell in row)
        print(f"行{i+1}: {has_content} - {row[:3] if len(row) >= 3 else row}...")


def print_worksheet_properties(toilets_ws, sheets_service, config):
    """Print worksheet and spreadsheet properties."""
    print("\nワークシート情報:")
    print(f"タイトル: {toilets_ws.title}")
    print(f"行数: {toilets_ws.row_count}")
    print(f"列数: {toilets_ws.col_count}")

    spreadsheet_info = sheets_service._get_gspread_client().open_by_key(config.spreadsheet_id)
    print(f"スプレッドシートタイトル: {spreadsheet_info.title}")
    print(f"スプレッドシートID: {spreadsheet_info.id}")


def main():
    """Main function to check sheet details."""
    try:
        config = ScraperConfig.from_environment()
        container = create_container(config)
        sheets_service = container.get(SheetsStorageAdapter)

        print("=== Toilets ワークシート詳細確認 ===")

        toilets_ws, all_values = get_worksheet_info(sheets_service)
        print_basic_info(all_values)

        if all_values:
            analyze_data_rows(all_values)
            print_last_rows(all_values)

        print_worksheet_properties(toilets_ws, sheets_service, config)

    except Exception as e:
        print(f'エラー: {e}')
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
