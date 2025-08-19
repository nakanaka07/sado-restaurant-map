#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Spreadsheet Manager - Google Sheets操作専用クラス

このモジュールはGoogle Sheetsとの連携を管理します。
places_data_updater.py から抽出されたシート操作機能を統合・最適化。

Features:
- Google Sheets認証
- ワークシート作成・更新
- データの佐渡島内外振り分け
- ヘッダー管理
- 一括更新・追加
- データ重複チェック
"""

import os
import time
import gspread
from typing import List, Dict, Tuple, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime

# 共通認証モジュールをインポート
try:
    from utils.google_auth import authenticate_google_sheets, validate_environment
except ImportError:
    # フォールバック
    import json
    from google.oauth2.service_account import Credentials

    def authenticate_google_sheets():
        """フォールバック認証"""
        service_account_path = os.environ.get('GOOGLE_SERVICE_ACCOUNT_PATH',
                                            'config/your-service-account-key.json')
        if 'GOOGLE_SERVICE_ACCOUNT_KEY' in os.environ:
            # GitHub Actions環境
            with open('temp-service-account.json', 'w') as f:
                f.write(os.environ['GOOGLE_SERVICE_ACCOUNT_KEY'])
            service_account_path = 'temp-service-account.json'

        credentials = Credentials.from_service_account_file(service_account_path)
        return gspread.authorize(credentials)


@dataclass
class WorksheetConfig:
    """ワークシート設定"""
    name: str
    headers: List[str]
    outside_name: Optional[str] = None


@dataclass
class UpdateResult:
    """更新結果"""
    worksheet_name: str
    updated_count: int
    appended_count: int
    skipped_count: int
    errors: List[str]


class SpreadsheetManager:
    """Google Sheets管理クラス"""

    def __init__(self, spreadsheet_id: Optional[str] = None):
        """
        初期化

        Args:
            spreadsheet_id: Google Sheets スプレッドシートID
        """
        self.spreadsheet_id = spreadsheet_id or os.environ.get('SPREADSHEET_ID', '')
        if not self.spreadsheet_id:
            raise ValueError("SPREADSHEET_ID が設定されていません")

        self.gc = authenticate_google_sheets()
        self.spreadsheet = None
        self.request_delay = 1.5  # Google Sheets API制限対応
        self.last_request_time = 0

        # カテゴリ別設定（2シート構成）
        self.worksheet_configs = {
            'restaurants': WorksheetConfig(
                name='restaurants',  # メインシート（佐渡島内・完全版）
                outside_name='restaurants_佐渡市外',  # 参考シート（佐渡市外・簡略版）
                headers=[
                    'Place ID', '店舗名', '所在地', '緯度', '経度', '評価', 'レビュー数',
                    '営業状況', '営業時間', '電話番号', 'ウェブサイト', '価格帯', '店舗タイプ',
                    '店舗説明', 'テイクアウト', 'デリバリー', '店内飲食', 'カーブサイドピックアップ',
                    '予約可能', '朝食提供', '昼食提供', '夕食提供', 'ビール提供', 'ワイン提供',
                    'カクテル提供', 'コーヒー提供', 'ベジタリアン対応', 'デザート提供',
                    '子供向けメニュー', '屋外席', 'ライブ音楽', 'トイレ完備', '子供連れ歓迎',
                    'ペット同伴可', 'グループ向け', 'スポーツ観戦向け', '支払い方法', '駐車場情報',
                    'アクセシビリティ', '地区', 'GoogleマップURL', '取得方法', '最終更新日時'
                ]
            ),
            'parkings': WorksheetConfig(
                name='parkings',  # メインシート（佐渡島内・完全版）
                outside_name='parkings_佐渡市外',  # 参考シート（佐渡市外・簡略版）
                headers=[
                    'Place ID', '駐車場名', '所在地', '緯度', '経度', 'カテゴリ', 'カテゴリ詳細',
                    '営業状況', '施設説明', '完全住所', '詳細営業時間', 'バリアフリー対応',
                    '支払い方法', '料金体系', 'トイレ設備', '施設評価', 'レビュー数',
                    '地区', 'GoogleマップURL', '取得方法', '最終更新日時'
                ]
            ),
            'toilets': WorksheetConfig(
                name='toilets',  # メインシート（佐渡島内・完全版）
                outside_name='toilets_佐渡市外',  # 参考シート（佐渡市外・簡略版）
                headers=[
                    'Place ID', '施設名', '所在地', '緯度', '経度', 'カテゴリ', 'カテゴリ詳細',
                    '営業状況', '施設説明', '完全住所', '詳細営業時間', 'バリアフリー対応',
                    '子供連れ対応', '駐車場併設', '施設評価', 'レビュー数',
                    '地区', 'GoogleマップURL', '取得方法', '最終更新日時'
                ]
            ),
            'not_found': WorksheetConfig(
                name='見つからないデータ',
                headers=[
                    'カテゴリ', 'クエリ', 'タイムスタンプ', '理由'
                ]
            )
        }

    def _wait_for_rate_limit(self) -> None:
        """Google Sheets APIレート制限に従って待機"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.request_delay:
            time.sleep(self.request_delay - elapsed)
        self.last_request_time = time.time()

    def _get_spreadsheet(self) -> gspread.Spreadsheet:
        """スプレッドシートを取得（キャッシュ付き）"""
        if self.spreadsheet is None:
            self._wait_for_rate_limit()
            self.spreadsheet = self.gc.open_by_key(self.spreadsheet_id)
        return self.spreadsheet

    def get_or_create_worksheet(self, worksheet_name: str, headers: Optional[List[str]] = None) -> gspread.Worksheet:
        """ワークシートを取得または作成"""
        spreadsheet = self._get_spreadsheet()

        try:
            # 既存ワークシートを取得
            self._wait_for_rate_limit()
            worksheet = spreadsheet.worksheet(worksheet_name)

            # ヘッダーチェック
            if headers:
                try:
                    existing_headers = worksheet.row_values(1)
                    if existing_headers != headers:
                        print(f"📝 ヘッダー更新: {worksheet_name}")
                        self._wait_for_rate_limit()
                        worksheet.update('A1', [headers])
                except Exception as e:
                    print(f"⚠️ ヘッダー確認エラー: {e}")

            return worksheet

        except gspread.WorksheetNotFound:
            # 新規ワークシート作成
            print(f"📄 新規ワークシート作成: {worksheet_name}")
            self._wait_for_rate_limit()
            worksheet = spreadsheet.add_worksheet(title=worksheet_name, rows=1000, cols=20)

            # ヘッダー設定
            if headers:
                self._wait_for_rate_limit()
                worksheet.update('A1', [headers])

            return worksheet

    def get_existing_data(self, worksheet: gspread.Worksheet, headers: List[str]) -> Dict[str, Dict]:
        """既存データを取得してマップ化"""
        try:
            self._wait_for_rate_limit()
            all_records = worksheet.get_all_records(expected_headers=headers)

            # プレイスIDをキーとしたマップを作成
            existing_data = {}
            for i, record in enumerate(all_records):
                place_id = record.get('プレイスID')
                if place_id:
                    existing_data[place_id] = {
                        'data': record,
                        'row': i + 2  # ヘッダーが1行目なので+2
                    }

            return existing_data

        except Exception as e:
            print(f"⚠️ 既存データ取得エラー: {e}")
            return {}

    def update_single_worksheet(self, category: str, validation_results: List,
                              is_sado: bool = True) -> UpdateResult:
        """単一ワークシートの更新（2シート構成対応）"""
        config = self.worksheet_configs[category]

        # シート名とヘッダーの決定
        if is_sado:
            worksheet_name = config.name  # メインシート（佐渡島内・完全版）
            headers = config.headers  # 完全版ヘッダー
        else:
            worksheet_name = config.outside_name  # 参考シート（佐渡市外・簡略版）
            # 佐渡市外用の簡略ヘッダーを取得
            from config.headers import get_outside_category_header
            outside_headers = get_outside_category_header(category)
            headers = outside_headers if outside_headers else config.headers

        if not worksheet_name:
            return UpdateResult(worksheet_name="", updated_count=0, appended_count=0,
                              skipped_count=0, errors=["ワークシート名が設定されていません"])

        print(f"📊 ワークシート更新開始: {worksheet_name}")
        print(f"   📋 ヘッダー数: {len(headers)}項目")
        print(f"   🎯 対象: {'佐渡島内（完全版）' if is_sado else '佐渡市外（簡略版）'}")

        # ワークシート取得・作成
        worksheet = self.get_or_create_worksheet(worksheet_name, headers)

        # 既存データ取得
        existing_data = self.get_existing_data(worksheet, headers)

        # 更新・追加データの準備
        updates = []
        appends = []
        skipped = 0
        errors = []

        for result in validation_results:
            if not result.is_valid:
                skipped += 1
                errors.extend(result.errors)
                continue

            place_id = result.data.get('place_id', '')
            if not place_id:
                skipped += 1
                errors.append("プレイスIDがありません")
                continue

            # 佐渡市外の場合、地区を「市外」に設定
            if not is_sado:
                result.data['district'] = '市外'

            # 行データ作成（ヘッダーに応じて調整）
            from processors.data_validator import DataValidator
            validator = DataValidator()

            if is_sado:
                # 完全版データ（43フィールド）- SpreadsheetManagerヘッダー完全対応
                row_data = validator.extract_to_row_format_full(result, category, headers)
            else:
                # 簡略版データ（基本フィールドのみ）
                row_data = validator.extract_to_row_format_simplified(result, category, headers)

            # 既存データとの比較
            if place_id in existing_data:
                existing_row = existing_data[place_id]['row']
                updates.append({
                    'range': f'A{existing_row}',
                    'values': [row_data]
                })
            else:
                appends.append(row_data)

        # 一括更新実行
        updated_count = 0
        appended_count = 0

        try:
            # 既存データ更新
            if updates:
                print(f"🔄 既存データ更新: {len(updates)}件")
                for update in updates:
                    self._wait_for_rate_limit()
                    worksheet.update(update['range'], update['values'])
                    updated_count += 1

            # 新規データ追加
            if appends:
                print(f"➕ 新規データ追加: {len(appends)}件")
                self._wait_for_rate_limit()
                worksheet.append_rows(appends)
                appended_count = len(appends)

            print(f"✅ {worksheet_name} 更新完了: 更新{updated_count}件, 追加{appended_count}件, スキップ{skipped}件")

        except Exception as e:
            error_msg = f"ワークシート更新エラー: {e}"
            errors.append(error_msg)
            print(f"❌ {error_msg}")

        return UpdateResult(
            worksheet_name=worksheet_name,
            updated_count=updated_count,
            appended_count=appended_count,
            skipped_count=skipped,
            errors=errors
        )

    def update_category_data(self, category: str, validation_results: List) -> Tuple[UpdateResult, UpdateResult]:
        """カテゴリデータを佐渡島内外に振り分けて更新"""

        # 佐渡島内外に振り分け
        sado_results = [r for r in validation_results if r.data.get('is_in_sado', False)]
        outside_results = [r for r in validation_results if not r.data.get('is_in_sado', False)]

        print(f"📊 データ振り分け完了: 佐渡島内 {len(sado_results)}件, 佐渡島外 {len(outside_results)}件")

        # 佐渡島内データ更新
        sado_result = UpdateResult("", 0, 0, 0, [])
        if sado_results:
            sado_result = self.update_single_worksheet(category, sado_results, is_sado=True)

        # 佐渡島外データ更新
        outside_result = UpdateResult("", 0, 0, 0, [])
        if outside_results:
            outside_result = self.update_single_worksheet(category, outside_results, is_sado=False)

        return sado_result, outside_result

    def update_not_found_data(self, not_found_queries: List[Dict[str, str]]) -> UpdateResult:
        """見つからないデータワークシートの更新"""
        config = self.worksheet_configs['not_found']
        worksheet = self.get_or_create_worksheet(config.name, config.headers)

        if not not_found_queries:
            return UpdateResult(config.name, 0, 0, 0, [])

        # データ形式変換
        append_data = []
        for item in not_found_queries:
            timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
            append_data.append([
                item.get('category', ''),
                item.get('query', ''),
                timestamp,
                item.get('reason', 'データが見つかりませんでした')
            ])

        try:
            print(f"📝 見つからないデータ記録: {len(append_data)}件")
            self._wait_for_rate_limit()
            worksheet.append_rows(append_data)

            return UpdateResult(config.name, 0, len(append_data), 0, [])

        except Exception as e:
            error_msg = f"見つからないデータ更新エラー: {e}"
            print(f"❌ {error_msg}")
            return UpdateResult(config.name, 0, 0, 0, [error_msg])

    def get_worksheet_summary(self, category: str) -> Dict[str, Any]:
        """ワークシートのサマリー情報を取得"""
        config = self.worksheet_configs[category]

        try:
            # メインワークシート
            main_worksheet = self.get_or_create_worksheet(config.name, config.headers)
            self._wait_for_rate_limit()
            main_records = main_worksheet.get_all_records()

            # 佐渡市外ワークシート
            outside_count = 0
            if config.outside_name:
                try:
                    outside_worksheet = self.get_or_create_worksheet(config.outside_name, config.headers)
                    self._wait_for_rate_limit()
                    outside_records = outside_worksheet.get_all_records()
                    outside_count = len(outside_records)
                except:
                    pass

            # 地区別統計
            district_counts = {}
            for record in main_records:
                district = record.get('地区', 'その他')
                district_counts[district] = district_counts.get(district, 0) + 1

            return {
                "category": category,
                "main_count": len(main_records),
                "outside_count": outside_count,
                "total_count": len(main_records) + outside_count,
                "district_distribution": district_counts,
                "last_updated": datetime.now().isoformat()
            }

        except Exception as e:
            print(f"❌ サマリー取得エラー: {e}")
            return {"error": str(e)}

    def cleanup_temp_files(self) -> None:
        """一時ファイルのクリーンアップ"""
        temp_files = ['temp-service-account.json']
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                    print(f"🗑️ 一時ファイル削除: {temp_file}")
                except Exception as e:
                    print(f"⚠️ 一時ファイル削除エラー: {e}")

    def worksheet_exists(self, worksheet_name: str) -> bool:
        """ワークシートの存在確認"""
        try:
            spreadsheet = self._get_spreadsheet()
            spreadsheet.worksheet(worksheet_name)
            return True
        except gspread.exceptions.WorksheetNotFound:
            return False

    def get_all_records(self, worksheet_name: str) -> List[Dict[str, Any]]:
        """ワークシートの全レコードを取得"""
        try:
            spreadsheet = self._get_spreadsheet()
            worksheet = spreadsheet.worksheet(worksheet_name)
            records = worksheet.get_all_records()
            return records
        except Exception as e:
            print(f"❌ レコード取得エラー ({worksheet_name}): {e}")
            return []

    def duplicate_worksheet(self, source_name: str, target_name: str) -> bool:
        """ワークシートを複製"""
        try:
            spreadsheet = self._get_spreadsheet()
            source_worksheet = spreadsheet.worksheet(source_name)
            # 新しいワークシートを作成
            target_worksheet = spreadsheet.add_worksheet(
                title=target_name,
                rows=source_worksheet.row_count,
                cols=source_worksheet.col_count
            )

            # データをコピー
            all_values = source_worksheet.get_all_values()
            if all_values:
                target_worksheet.update(
                    range_name=f"A1:{gspread.utils.rowcol_to_a1(len(all_values), len(all_values[0]))}",
                    values=all_values
                )

            print(f"✅ ワークシート複製完了: {source_name} → {target_name}")
            return True

        except Exception as e:
            print(f"❌ ワークシート複製エラー: {e}")
            return False

    def _get_headers_for_category(self, category: str) -> List[str]:
        """カテゴリに対応するヘッダーを取得"""
        if category in self.worksheet_configs:
            return self.worksheet_configs[category].headers
        else:
            # デフォルトヘッダー
            return ['Place ID', '名称', '住所', '緯度', '経度', '評価', 'レビュー数',
                   '営業状況', '営業時間', '電話番号', 'ウェブサイト', '最終更新日時']

    def create_or_update_worksheet(self, worksheet_name: str, data: List[Dict[str, Any]],
                                  category: str) -> bool:
        """ワークシートを作成または更新"""
        try:
            if not data:
                print(f"⚠️ データが空のため、{worksheet_name} は作成されませんでした")
                return False

            # ワークシートの存在確認
            if self.worksheet_exists(worksheet_name):
                # 既存ワークシートを更新
                spreadsheet = self._get_spreadsheet()
                worksheet = spreadsheet.worksheet(worksheet_name)
                worksheet.clear()
            else:
                # 新規ワークシートを作成
                spreadsheet = self._get_spreadsheet()
                worksheet = spreadsheet.add_worksheet(
                    title=worksheet_name,
                    rows=len(data) + 10,  # 余裕を持たせる
                    cols=20
                )

            # ヘッダーを設定
            headers = self._get_headers_for_category(category)

            # データを準備
            values = [headers]
            for record in data:
                row = []
                for header in headers:
                    # ヘッダーの日本語名から対応する値を取得
                    if header in record:
                        value = record[header]
                    else:
                        # 英語キーから日本語ヘッダーへのマッピング
                        key_mapping = {
                            'プレイスID': 'place_id',
                            '店舗名': 'name',
                            '名前': 'name',
                            '住所': 'address',
                            '緯度': 'latitude',
                            '経度': 'longitude',
                            'プライマリタイプ': 'primary_type',
                            'プライマリタイプ表示名': 'primary_type_display',
                            '電話番号': 'phone',
                            '営業時間': 'opening_hours',
                            '評価': 'rating',
                            'レビュー数': 'review_count',
                            '地区': 'district',
                            'GoogleマップURL': 'google_maps_url',
                            'タイムスタンプ': 'timestamp'
                        }
                        eng_key = key_mapping.get(header, header.lower().replace(' ', '_'))
                        value = record.get(eng_key, '')

                    row.append(str(value) if value is not None else '')
                values.append(row)

            # データを書き込み
            worksheet.update(
                range_name=f"A1:{gspread.utils.rowcol_to_a1(len(values), len(headers))}",
                values=values
            )

            print(f"✅ ワークシート更新完了: {worksheet_name} ({len(data)}件)")
            return True

        except Exception as e:
            print(f"❌ ワークシート作成/更新エラー ({worksheet_name}): {e}")
            return False


# 利便性のための関数群
def create_manager(spreadsheet_id: Optional[str] = None) -> SpreadsheetManager:
    """SpreadsheetManagerを作成"""
    return SpreadsheetManager(spreadsheet_id)


def quick_update(category: str, validation_results: List,
                spreadsheet_id: Optional[str] = None) -> Tuple[UpdateResult, UpdateResult]:
    """クイック更新（単発使用向け）"""
    manager = create_manager(spreadsheet_id)
    return manager.update_category_data(category, validation_results)


if __name__ == "__main__":
    # テスト実行
    import sys

    if len(sys.argv) < 2:
        print("使用方法: python spreadsheet_manager.py <action>")
        print("Action:")
        print("  summary <category>  - カテゴリのサマリーを表示")
        print("  test               - 認証テスト")
        sys.exit(1)

    action = sys.argv[1]

    try:
        if action == "test":
            print("🔐 認証テスト開始...")
            manager = create_manager()
            print("✅ 認証成功")
            print(f"📊 スプレッドシートID: {manager.spreadsheet_id}")

        elif action == "summary" and len(sys.argv) > 2:
            category = sys.argv[2]
            if category not in ['restaurants', 'parkings', 'toilets']:
                print("❌ 無効なカテゴリです: restaurants, parkings, toilets")
                sys.exit(1)

            manager = create_manager()
            summary = manager.get_worksheet_summary(category)

            print(f"=== {category} サマリー ===")
            for key, value in summary.items():
                print(f"{key}: {value}")

        else:
            print("❌ 無効なアクションです")
            sys.exit(1)

    except Exception as e:
        print(f"❌ エラー: {e}")
        sys.exit(1)
