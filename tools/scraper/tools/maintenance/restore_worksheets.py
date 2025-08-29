#!/usr/bin/env python3
"""ワークシート構造の復元"""

import sys
sys.path.append('.')

import gspread
from shared.config import ScraperConfig
from shared.container import create_container
from infrastructure.storage.sheets_storage_adapter import SheetsStorageAdapter

# ヘッダー定数の定義
PLACE_ID_HEADER = 'Place ID'
REVIEW_COUNT_HEADER = 'レビュー数'
MAPS_URL_HEADER = 'GoogleマップURL'
LAST_UPDATED_HEADER = '最終更新日時'

TOILET_HEADERS = [
    PLACE_ID_HEADER, '施設名', '所在地', '緯度', '経度', 'カテゴリ', 'カテゴリ詳細',
    '営業状況', '施設説明', '完全住所', '詳細営業時間', 'バリアフリー対応',
    '子供連れ対応', '駐車場併設', '施設評価', REVIEW_COUNT_HEADER,
    '地区', MAPS_URL_HEADER, '取得方法', LAST_UPDATED_HEADER
]

RESTAURANT_HEADERS = [
    PLACE_ID_HEADER, '店舗名', '所在地', '緯度', '経度', '評価', REVIEW_COUNT_HEADER,
    '営業状況', '営業時間', '電話番号', 'ウェブサイト', '価格帯', '店舗タイプ',
    '店舗説明', 'テイクアウト', 'デリバリー', '店内飲食', 'カーブサイドピックアップ',
    '予約可能', '朝食提供', '昼食提供', '夕食提供', 'ビール提供', 'ワイン提供',
    'カクテル提供', 'コーヒー提供', 'ベジタリアン対応', 'デザート提供',
    '子供向けメニュー', '屋外席', 'ライブ音楽', 'トイレ完備', '子供連れ歓迎',
    'ペット同伴可', 'グループ向け', 'スポーツ観戦向け', '支払い方法', '駐車場情報',
    'アクセシビリティ', '地区', MAPS_URL_HEADER, '取得方法', LAST_UPDATED_HEADER
]

PARKING_HEADERS = [
    PLACE_ID_HEADER, '駐車場名', '所在地', '緯度', '経度', 'カテゴリ', 'カテゴリ詳細',
    '営業状況', '施設説明', '完全住所', '詳細営業時間', 'バリアフリー対応',
    '支払い方法', '料金体系', 'トイレ設備', '施設評価', REVIEW_COUNT_HEADER,
    '地区', MAPS_URL_HEADER, '取得方法', LAST_UPDATED_HEADER
]


def main():
    try:
        config = ScraperConfig.from_environment()
        container = create_container(config)
        sheets_service = container.get(SheetsStorageAdapter)

        # Get spreadsheet
        spreadsheet = sheets_service._get_spreadsheet()

        # Get headers from existing sheet structure
        category_configs = {
            'toilets': {
                'backup_sheet': 'バックアップtoilets',
                'headers': TOILET_HEADERS
            },
            'restaurants': {
                'backup_sheet': 'バックアップrestaurants',
                'headers': RESTAURANT_HEADERS
            },
            'parkings': {
                'backup_sheet': 'バックアップparkings',
                'headers': PARKING_HEADERS
            }
        }

        print("=== メインワークシートの作成 ===")

        for category, config_data in category_configs.items():
            backup_sheet = config_data['backup_sheet']
            headers = config_data['headers']

            print(f"\n{category} シートの作成...")

            # Check if backup sheet exists
            try:
                backup_ws = spreadsheet.worksheet(backup_sheet)
                print(f"✅ バックアップシート '{backup_sheet}' 確認済み")

                # Get backup data
                backup_data = backup_ws.get_all_values()
                data_rows = len([row for row in backup_data if any(cell.strip() for cell in row)])
                print(f"   バックアップデータ行数: {data_rows}")

                # Create main sheet
                try:
                    main_ws = spreadsheet.worksheet(category)
                    print(f"   メインシート '{category}' は既に存在")
                except gspread.WorksheetNotFound:
                    print(f"   メインシート '{category}' を作成中...")
                    main_ws = spreadsheet.add_worksheet(title=category, rows=1000, cols=len(headers))

                    # Set headers
                    main_ws.update('A1', [headers])
                    print("   ✅ ヘッダー設定完了")

                    # Copy data from backup (excluding header)
                    if len(backup_data) > 1:
                        data_to_copy = backup_data[1:]  # Skip header
                        if data_to_copy:
                            # Batch update for better performance
                            main_ws.update('A2', data_to_copy)
                            print(f"   ✅ バックアップデータコピー完了 ({len(data_to_copy)}行)")

                print(f"✅ {category} シート準備完了")

            except Exception as e:
                print(f"❌ {category} シート作成エラー: {e}")

        print("\n=== 最終確認 ===")
        worksheets = spreadsheet.worksheets()
        main_sheets = [ws.title for ws in worksheets if ws.title in ['toilets', 'restaurants', 'parkings']]
        print(f"メインシート: {main_sheets}")

        if len(main_sheets) == 3:
            print("✅ すべてのメインシートが作成されました")
            print("   これでスクレイパーが正常に動作するはずです")
        else:
            print(f"⚠️ 一部のシートが不足: {set(['toilets', 'restaurants', 'parkings']) - set(main_sheets)}")

    except Exception as e:
        print(f'エラー: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
