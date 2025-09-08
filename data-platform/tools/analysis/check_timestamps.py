#!/usr/bin/env python3
"""最終更新日時カラムの詳細確認"""

import sys
sys.path.append('.')

from shared.config import ScraperConfig
from shared.container import create_container
from infrastructure.storage.sheets_storage_adapter import SheetsStorageAdapter


def get_worksheet_data(sheets_service):
    """Get the worksheet data."""
    spreadsheet = sheets_service._get_spreadsheet()
    toilets_ws = spreadsheet.worksheet('toilets')
    return toilets_ws.get_all_values()


def print_headers(headers):
    """Print header information."""
    print(f'ヘッダー行（列数: {len(headers)}）:')
    for i, header in enumerate(headers):
        print(f'列{i+1} ({chr(65+i)}): {header}')


def find_last_updated_column(headers):
    """Find the last updated column index."""
    for i, header in enumerate(headers):
        if '最終更新' in header or '更新日時' in header:
            print(f'\n最終更新日時カラム発見: 列{i+1} ({chr(65+i)}) = {header}')
            return i
    return -1


def print_first_rows_data(all_values, last_updated_col_idx):
    """Print sample data from first rows."""
    print('\n最初の5行のデータ:')
    for i, row in enumerate(all_values[1:6], 1):
        if len(row) > last_updated_col_idx:
            timestamp = row[last_updated_col_idx] if row[last_updated_col_idx] else 'なし'
            place_name = row[1] if len(row) > 1 else 'なし'
            print(f'行{i}: {place_name} -> {timestamp}')


def print_last_rows_data(all_values, last_updated_col_idx):
    """Print sample data from last rows."""
    print('\n最後の5行のデータ:')
    for i in range(max(1, len(all_values)-5), len(all_values)):
        row = all_values[i]
        if len(row) > last_updated_col_idx:
            timestamp = row[last_updated_col_idx] if row[last_updated_col_idx] else 'なし'
            place_name = row[1] if len(row) > 1 else 'なし'
            print(f'行{i}: {place_name} -> {timestamp}')


def count_today_updates(all_values, last_updated_col_idx):
    """Count rows updated today."""
    today_count = 0
    total_data_rows = 0
    for row in all_values[1:]:
        if any(cell.strip() for cell in row):  # Non-empty row
            total_data_rows += 1
            if (len(row) > last_updated_col_idx and row[last_updated_col_idx]
                and '2025-08-29' in row[last_updated_col_idx]):
                today_count += 1
    return today_count, total_data_rows


def print_statistics(today_count, total_data_rows):
    """Print update statistics."""
    print('\n統計:')
    print(f'総データ行数: {total_data_rows}')
    print(f'今日(2025-08-29)更新された行数: {today_count}')
    print(f'今日更新されていない行数: {total_data_rows - today_count}')


def main():
    """Main function to check timestamps."""
    try:
        config = ScraperConfig.from_environment()
        container = create_container(config)
        sheets_service = container.get(SheetsStorageAdapter)

        all_values = get_worksheet_data(sheets_service)
        print(f'総行数: {len(all_values)}')

        if len(all_values) > 0:
            headers = all_values[0]
            print_headers(headers)

            last_updated_col_idx = find_last_updated_column(headers)

            if last_updated_col_idx >= 0 and len(all_values) > 1:
                print_first_rows_data(all_values, last_updated_col_idx)
                print_last_rows_data(all_values, last_updated_col_idx)
                today_count, total_data_rows = count_today_updates(all_values, last_updated_col_idx)
                print_statistics(today_count, total_data_rows)
            else:
                print('最終更新日時カラムが見つかりません')

    except Exception as e:
        print(f'エラー: {e}')
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
