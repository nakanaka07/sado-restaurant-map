#!/usr/bin/env python3
"""データ更新ロジックの詳細調査"""

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

        # Get toilets worksheet
        spreadsheet = sheets_service._get_spreadsheet()
        toilets_ws = spreadsheet.worksheet('toilets')

        # Get existing data map to understand the structure
        headers = toilets_ws.row_values(1)  # Get header row
        print(f"ヘッダー構造: {headers}")

        # Get existing data mapping
        existing_data = sheets_service._get_existing_data_map(toilets_ws, headers)
        print(f"既存データエントリ数: {len(existing_data)}")

        # Show sample existing data
        sample_place_ids = list(existing_data.keys())[:3]
        print("\nサンプル既存データ:")
        for place_id in sample_place_ids:
            data = existing_data[place_id]
            print(f"Place ID: {place_id}")
            print(f"行番号: {data['row']}")
            print(f"データ: {dict(list(data['data'].items())[:5])}...")  # First 5 fields
            print("---")

        # Check what happens when we simulate an update
        print("\n=== 更新ロジックの確認 ===")

        # Simulate processing a known Place ID
        test_place_id = sample_place_ids[0] if sample_place_ids else None
        if test_place_id:
            print(f"テスト対象Place ID: {test_place_id}")
            existing_record = existing_data[test_place_id]
            print(f"既存レコード内容: {existing_record['data']}")

            # Check timestamps
            last_updated = existing_record['data'].get('最終更新日時', 'なし')
            print(f"既存の最終更新日時: {last_updated}")

            # Simulate what would happen with new data
            print("\n新しいデータで更新した場合の挙動を確認...")

    except Exception as e:
        print(f'エラー: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
