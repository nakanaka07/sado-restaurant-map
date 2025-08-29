#!/usr/bin/env python3
"""Google Sheetsの内容確認スクリプト"""

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

        # Check toilets sheet
        print("=== Toilets シート ===")
        toilets_data = sheets_service.get_all_data('toilets')
        print(f'Toilets データ行数: {len(toilets_data)}')

        if toilets_data:
            print(f'最初のデータサンプル: {list(toilets_data[0].keys())[:5]}...')
            print(f'最新データのPlace ID: {toilets_data[-1].get("Place ID", "N/A")}')

        # Check summary
        print("\n=== 各カテゴリのサマリー ===")
        for category in ['toilets', 'parkings', 'restaurants']:
            try:
                summary = sheets_service.get_summary(category)
                print(f'{category}: {summary.get("total_records", 0)} レコード')
                print(f'  - 最終更新: {summary.get("last_updated", "N/A")}')
            except Exception as e:
                print(f'{category} サマリーエラー: {e}')

        # Check direct worksheet access
        print("\n=== ワークシート直接アクセス ===")
        try:
            spreadsheet = sheets_service._get_spreadsheet()
            worksheets = spreadsheet.worksheets()
            print(f'利用可能なワークシート数: {len(worksheets)}')
            for ws in worksheets:
                try:
                    row_count = ws.row_count
                    print(f'  - {ws.title}: {row_count} 行')
                except Exception as e:
                    print(f'  - {ws.title}: エラー {e}')
        except Exception as e:
            print(f'ワークシート取得エラー: {e}')

    except Exception as e:
        print(f'エラー: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
