#!/usr/bin/env python3
"""更新プロセスの詳細トレース"""

import sys
sys.path.append('.')
from datetime import datetime

import gspread
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

        print("=== 現在のワークシート状況 ===")
        worksheets = spreadsheet.worksheets()
        for ws in worksheets:
            print(f"- {ws.title}")

        # Test with a simple data update
        print("\n=== テストデータで更新プロセス確認 ===")

        # Create test data
        test_data = [{
            'place_id': 'TEST_PLACE_ID_12345',
            'name': 'テスト施設',
            'address': '佐渡市テスト町123',
            'latitude': '38.0000',
            'longitude': '138.0000',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }]

        print(f"テストデータ: {test_data[0]}")

        # Try to save to toilets (if it exists) or create a test sheet
        try:
            # First check if toilets sheet exists
            toilets_ws = None
            try:
                toilets_ws = spreadsheet.worksheet('toilets')
                print("✅ toilets シートが存在します")
            except gspread.WorksheetNotFound:
                try:
                    toilets_ws = spreadsheet.worksheet('バックアップtoilets')
                    print("✅ バックアップtoilets シートを使用します")
                except gspread.WorksheetNotFound:
                    print("❌ どちらのシートも見つかりません")
                    return

            if toilets_ws:
                # Get headers
                headers = toilets_ws.row_values(1)
                print(f"ヘッダー: {headers[:5]}...")

                # Get existing data
                existing_data = sheets_service._get_existing_data_map(toilets_ws, headers)
                print(f"既存データ数: {len(existing_data)}")

                # Simulate what happens with existing Place ID
                existing_place_ids = list(existing_data.keys())
                if existing_place_ids:
                    test_existing_id = existing_place_ids[0]
                    print(f"既存Place ID例: {test_existing_id}")

                    # Create mock validation result
                    class MockResult:
                        def __init__(self, data):
                            self.is_valid = True
                            self.data = data

                    # Test with existing Place ID but new timestamp
                    updated_test_data = {
                        'place_id': test_existing_id,
                        'name': '更新されたテスト施設',
                        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }

                    mock_result = MockResult(updated_test_data)

                    # Prepare update data
                    updates, appends = sheets_service._prepare_update_data(
                        [mock_result], existing_data, headers
                    )

                    print(f"準備された更新: {len(updates)}件")
                    print(f"準備された新規追加: {len(appends)}件")

                    if updates:
                        print(f"更新内容例: {updates[0]}")
                        print("→ このデータが実際にGoogle Sheetsに送信されるはずです")

        except Exception as e:
            print(f"テスト実行エラー: {e}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f'エラー: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
