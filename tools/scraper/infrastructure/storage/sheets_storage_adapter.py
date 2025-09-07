#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sheets Storage Adapter - 新しいアーキテクチャ対応版

Google Sheetsストレージの実装クラス
"""

import time
import os
import gspread
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from google.oauth2.service_account import Credentials

from core.domain.interfaces import DataStorage
from infrastructure.auth.google_auth_service import GoogleAuthService
from shared.exceptions import ConfigurationError, ValidationError
from shared.logger import get_logger


# 共通定数
PLACE_ID_HEADER = 'Place ID'
PLACE_ID_JP_HEADER = 'プレイスID'
REVIEW_COUNT_HEADER = 'レビュー数'
MAPS_URL_HEADER = 'GoogleマップURL'
LAST_UPDATED_HEADER = '最終更新日時'
WEBSITE_HEADER = 'ウェブサイト'
UNKNOWN_CATEGORY_MSG = "Unknown category"

# フィールドマッピング用の定数
PLACE_ID_FIELD = PLACE_ID_HEADER  # 重複を避けるための統一

# 共通ヘッダー定数
RESTAURANT_HEADERS = [
    PLACE_ID_HEADER, '店舗名', '所在地', '緯度', '経度', '評価', REVIEW_COUNT_HEADER,
    '営業状況', '営業時間', '電話番号', WEBSITE_HEADER, '価格帯', '店舗タイプ',
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

TOILET_HEADERS = [
    PLACE_ID_HEADER, '施設名', '所在地', '緯度', '経度', 'カテゴリ', 'カテゴリ詳細',
    '営業状況', '施設説明', '完全住所', '詳細営業時間', 'バリアフリー対応',
    '子供連れ対応', '駐車場併設', '施設評価', REVIEW_COUNT_HEADER,
    '地区', MAPS_URL_HEADER, '取得方法', LAST_UPDATED_HEADER
]


class SheetsStorageAdapter(DataStorage):
    """Sheets storage adapter for new architecture"""

    def __init__(self, auth_service: GoogleAuthService, spreadsheet_id: str):
        """
        Initialize sheets storage adapter.

        Args:
            auth_service: Google authentication service
            spreadsheet_id: Google Sheets spreadsheet ID
        """
        self._auth_service = auth_service
        self._spreadsheet_id = spreadsheet_id
        self._logger = get_logger(__name__)
        self._gc: Optional[gspread.Client] = None
        self._spreadsheet: Optional[gspread.Spreadsheet] = None
        self.request_delay = 1.5
        self.last_request_time = 0

        if not spreadsheet_id:
            raise ConfigurationError("Spreadsheet ID is required")

        # ワークシート設定
        self.worksheet_configs = {
            'restaurants': {
                'name': 'restaurants',
                'outside_name': 'restaurants_佐渡市外',
                'headers': RESTAURANT_HEADERS
            },
            'parkings': {
                'name': 'parkings',
                'outside_name': 'parkings_佐渡市外',
                'headers': PARKING_HEADERS
            },
            'toilets': {
                'name': 'toilets',
                'outside_name': 'toilets_佐渡市外',
                'headers': TOILET_HEADERS
            }
        }

    def _wait_for_rate_limit(self) -> None:
        """Google Sheets APIレート制限に従って待機"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.request_delay:
            time.sleep(self.request_delay - elapsed)
        self.last_request_time = time.time()

    def test_connection(self) -> Optional[Dict[str, Any]]:
        """
        Google Sheets API接続テスト

        Returns:
            スプレッドシート情報辞書またはNone
        """
        try:
            # 認証確認
            if not self._auth_service.is_authenticated():
                self._auth_service.authenticate()

            # クライアント取得
            gc = self._get_gspread_client()

            # スプレッドシート存在確認
            self._wait_for_rate_limit()
            spreadsheet = gc.open_by_key(self._spreadsheet_id)

            # 基本情報取得
            spreadsheet_info = {
                'title': spreadsheet.title,
                'id': spreadsheet.id,
                'url': spreadsheet.url,
                'sheet_count': len(spreadsheet.worksheets()),
                'locale': getattr(spreadsheet, 'locale', 'unknown')
            }

            self._logger.info("Google Sheets接続テスト成功", **spreadsheet_info)
            return spreadsheet_info

        except Exception as e:
            self._logger.error("Google Sheets接続テスト失敗", error=str(e))
            return None

    def _get_gspread_client(self) -> gspread.Client:
        """Get or create gspread client"""
        if self._gc is None:
            if not self._auth_service.is_authenticated():
                self._auth_service.authenticate()

            self._gc = self._auth_service.get_gspread_client()
            if self._gc is None:
                raise ConfigurationError("Failed to get gspread client")

        return self._gc

    def _get_spreadsheet(self) -> gspread.Spreadsheet:
        """Get or create spreadsheet"""
        if self._spreadsheet is None:
            self._wait_for_rate_limit()
            gc = self._get_gspread_client()
            self._spreadsheet = gc.open_by_key(self._spreadsheet_id)

        return self._spreadsheet

    def get_or_create_worksheet(self, worksheet_name: str, headers: List[str]) -> gspread.Worksheet:
        """ワークシートを取得または作成"""
        spreadsheet = self._get_spreadsheet()

        try:
            self._wait_for_rate_limit()
            worksheet = spreadsheet.worksheet(worksheet_name)

            # ヘッダーチェック
            try:
                existing_headers = worksheet.row_values(1)
                if existing_headers != headers:
                    self._wait_for_rate_limit()
                    worksheet.update('A1', [headers])
            except Exception as e:
                self._logger.warning("Header check failed", error=str(e))

            return worksheet

        except gspread.WorksheetNotFound:
            # 新規ワークシート作成
            self._wait_for_rate_limit()
            worksheet = spreadsheet.add_worksheet(title=worksheet_name, rows=1000, cols=20)

            if headers:
                self._wait_for_rate_limit()
                worksheet.update('A1', [headers])

            return worksheet

    def save(self, data: List[Dict[str, Any]], category: str) -> bool:
        """
        Save data to Google Sheets.

        Args:
            data: List of data items to save (already processed with location info)
            category: The category/type of data

        Returns:
            True if successful, False otherwise
        """
        try:
            if not data:
                self._logger.warning("No data to save", category=category)
                return True

            # カテゴリ名を小文字に正規化
            normalized_category = category.lower()
            config = self.worksheet_configs.get(normalized_category)
            if not config:
                self._logger.error(UNKNOWN_CATEGORY_MSG, category=category)
                return False

            # データをそのまま使用（既にformat_resultでLocationServiceによる処理済み）
            sado_data = []
            outside_data = []

            for item in data:
                # データが既にis_in_sadoフラグを持っている前提
                if item.get('is_in_sado', False):
                    sado_data.append(item)
                else:
                    outside_data.append(item)

            success = True

            # 佐渡島内データを保存
            if sado_data:
                success &= self._update_single_worksheet(config['name'], config['headers'], sado_data)

            # 佐渡島外データを保存
            if outside_data and config.get('outside_name'):
                success &= self._update_single_worksheet(config['outside_name'], config['headers'], outside_data)

            if success:
                self._logger.info("Data saved successfully",
                                category=normalized_category,
                                sado_count=len(sado_data),
                                outside_count=len(outside_data))

            return success

        except Exception as e:
            self._logger.error("Save operation failed", category=category, error=str(e))
            return False

    def _update_single_worksheet(self, worksheet_name: str, headers: List[str], data_items: List[Dict[str, Any]]) -> bool:
        """単一ワークシートの更新"""
        try:
            worksheet = self.get_or_create_worksheet(worksheet_name, headers)
            existing_data = self._get_existing_data_map(worksheet, headers)
            updates, appends = self._prepare_update_data(data_items, existing_data, headers)
            return self._execute_updates(worksheet, updates, appends)

        except Exception as e:
            self._logger.error("Worksheet update failed", worksheet_name=worksheet_name, error=str(e))
            return False

    def _get_existing_data_map(self, worksheet: gspread.Worksheet, headers: List[str]) -> Dict[str, Dict]:
        """既存データのマップを取得"""
        self._wait_for_rate_limit()
        all_records = worksheet.get_all_records(expected_headers=headers)

        existing_data = {}
        for i, record in enumerate(all_records):
            place_id = record.get(PLACE_ID_FIELD)
            if place_id:
                existing_data[place_id] = {
                    'data': record,
                    'row': i + 2
                }
        return existing_data

    def _prepare_update_data(self, data_items: List[Dict[str, Any]], existing_data: Dict, headers: List[str]) -> Tuple[List[Dict], List[List[str]]]:
        """更新・追加データを準備（スマート更新対応）"""
        updates = []
        appends = []

        # スマート更新設定の初期化
        update_policy = os.getenv('UPDATE_POLICY', 'smart')
        force_update_days = int(os.getenv('UPDATE_THRESHOLD_DAYS', '7'))

        for data_item in data_items:
            place_id = data_item.get(PLACE_ID_FIELD, '')
            if not place_id:
                continue

            row_data = self._extract_row_data(data_item, headers)

            if place_id in existing_data:
                # 既存データがある場合、スマート更新判定を実行
                existing_record = existing_data[place_id]['data']
                should_update, reason = self._should_update_record(
                    data_item, existing_record, update_policy, force_update_days
                )

                if should_update:
                    existing_row = existing_data[place_id]['row']
                    updates.append({
                        'range': f'A{existing_row}',
                        'values': [row_data]
                    })
                    self._logger.info("Record updated",
                                    place_id=place_id,
                                    reason=reason)
                else:
                    self._logger.debug("Record skipped",
                                     place_id=place_id,
                                     reason=reason)
            else:
                # 新規データは常に追加
                appends.append(row_data)
                self._logger.info("New record added", place_id=place_id)

        return updates, appends

    def _execute_updates(self, worksheet: gspread.Worksheet, updates: List[Dict], appends: List[List[str]]) -> bool:
        """更新処理を実行"""
        try:
            if updates:
                for update in updates:
                    self._wait_for_rate_limit()
                    worksheet.update(update['range'], update['values'])

            if appends:
                self._wait_for_rate_limit()
                worksheet.append_rows(appends)

            return True
        except Exception as e:
            self._logger.error("Update execution failed", error=str(e))
            return False

    def _extract_row_data(self, data_item: Dict[str, Any], headers: List[str]) -> List[str]:
        """結果データから行データを抽出"""
        row_data = []

        # 基本的なフィールドマッピング
        field_mapping = {
            PLACE_ID_FIELD: 'Place ID',
            '店舗名': '店舗名',
            '施設名': '店舗名',  # 店舗名をフォールバック
            '駐車場名': '店舗名',  # 店舗名をフォールバック
            # '所在地': '住所',  # 削除: 直接フィールドを優先
            '緯度': '緯度',
            '経度': 'longitude',
            '評価': 'rating',
            REVIEW_COUNT_HEADER: 'review_count',
            '営業状況': 'business_status',
            '営業時間': 'opening_hours',
            '電話番号': 'phone',
            WEBSITE_HEADER: 'website',
            '地区': 'district',
            MAPS_URL_HEADER: 'google_maps_url',
            LAST_UPDATED_HEADER: 'timestamp'
        }

        for header in headers:
            value = ''

            # 直接のフィールドチェック
            if header in data_item:
                value = data_item[header]
            # フィールドマッピングチェック
            elif header in field_mapping and field_mapping[header] in data_item:
                value = data_item[field_mapping[header]]
            # 特別処理が必要なフィールド
            elif header == '所在地':
                # 新しい所在地フィールドを優先、フォールバックとして住所を使用
                value = data_item.get('所在地', data_item.get('住所', ''))
            elif header == '地区':
                # location_info.district または既存のdistrictフィールドから取得
                location_info = data_item.get('location_info', {})
                value = location_info.get('district', data_item.get('district', '佐渡市内'))
            elif header == MAPS_URL_HEADER:
                # cid_url または google_maps_url から取得
                value = data_item.get('cid_url', data_item.get('google_maps_url', ''))
            elif header == LAST_UPDATED_HEADER:
                # timestamp または現在時刻を設定
                value = data_item.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

            row_data.append(str(value) if value is not None else '')

        return row_data

    def _should_update_record(self, new_data: Dict[str, Any], existing_data: Dict[str, Any],
                             update_policy: str, force_update_days: int) -> Tuple[bool, str]:
        """
        レコードを更新すべきかを判定（スマート更新）

        Args:
            new_data: 新しいデータ
            existing_data: 既存のデータ
            update_policy: 更新ポリシー (smart/always/never)
            force_update_days: 強制更新日数

        Returns:
            (更新すべきか, 理由)
        """

        # ポリシーチェック
        if update_policy == 'always':
            return True, "UPDATE_POLICY=always"
        elif update_policy == 'never':
            return False, "UPDATE_POLICY=never"

        # smart ポリシーの場合の詳細判定
        return self._smart_update_check(new_data, existing_data, force_update_days)

    def _smart_update_check(self, new_data: Dict[str, Any], existing_data: Dict[str, Any],
                           force_update_days: int) -> Tuple[bool, str]:
        """スマート更新判定の詳細ロジック"""

        # 1. 強制更新日数チェック
        last_updated = existing_data.get('timestamp', existing_data.get('最終更新日時', ''))
        if last_updated:
            try:
                last_update_date = datetime.strptime(last_updated.split()[0], '%Y-%m-%d')
                days_since_update = (datetime.now() - last_update_date).days

                if days_since_update >= force_update_days:
                    return True, f"強制更新: {days_since_update}日経過"
            except (ValueError, AttributeError):
                pass

        # 2. 重要フィールドの変化チェック
        important_fields = ['name', 'address', 'rating', 'review_count', 'business_status',
                           'opening_hours', 'phone', 'website', 'category', 'description']
        changes = []

        for field in important_fields:
            old_value = self._normalize_value(existing_data.get(field, ''))
            new_value = self._normalize_value(new_data.get(field, ''))

            if old_value != new_value:
                changes.append(f"{field}: '{old_value}' → '{new_value}'")

        if changes:
            return True, f"重要フィールド変更: {', '.join(changes[:2])}"

        # 3. 評価・レビュー数の改善チェック
        if self._has_rating_improvement(new_data, existing_data):
            return True, "評価・レビュー数の改善"

        # 4. 営業状況の変化チェック
        old_status = existing_data.get('business_status', existing_data.get('営業状況', ''))
        new_status = new_data.get('business_status', '')
        if old_status != new_status and new_status:
            return True, f"営業状況変更: {old_status} → {new_status}"

        # 5. 空フィールドの補完チェック
        if self._can_fill_empty_fields(new_data, existing_data):
            return True, "空フィールドの補完"

        return False, "変更なし"

    def _normalize_value(self, value: Any) -> str:
        """値を正規化して比較用に変換"""
        if value is None:
            return ""
        return str(value).strip()

    def _has_rating_improvement(self, new_data: Dict[str, Any], existing_data: Dict[str, Any]) -> bool:
        """評価・レビュー数の改善があるかチェック"""
        try:
            # 評価の改善
            old_rating = float(existing_data.get('rating', existing_data.get('評価', 0)) or 0)
            new_rating = float(new_data.get('rating', 0) or 0)

            # レビュー数の増加
            old_reviews = int(existing_data.get('review_count', existing_data.get('レビュー数', 0)) or 0)
            new_reviews = int(new_data.get('review_count', 0) or 0)

            return new_rating > old_rating or new_reviews > old_reviews

        except (ValueError, TypeError):
            return False

    def _can_fill_empty_fields(self, new_data: Dict[str, Any], existing_data: Dict[str, Any]) -> bool:
        """空のフィールドを新しいデータで補完できるかチェック"""
        useful_fields = ['phone', 'website', 'opening_hours', 'description',
                        '電話番号', WEBSITE_HEADER, '営業時間', '施設説明']

        for field in useful_fields:
            old_value = self._normalize_value(existing_data.get(field, ''))
            new_value = self._normalize_value(new_data.get(field, ''))

            # 既存が空で新しいデータに値がある場合
            if not old_value and new_value:
                return True

        return False

    def load(self, identifier: str, category: str) -> Optional[Dict[str, Any]]:
        """
        Load data from Google Sheets.

        Args:
            identifier: Unique identifier for the data (place_id)
            category: The category/type of data

        Returns:
            The loaded data or None if not found
        """
        try:
            config = self.worksheet_configs.get(category)
            if not config:
                self._logger.error(UNKNOWN_CATEGORY_MSG, category=category)
                return None

            # メインワークシートから検索
            worksheet = self.get_or_create_worksheet(config['name'], config['headers'])
            all_records = worksheet.get_all_records()

            for record in all_records:
                if record.get(PLACE_ID_HEADER) == identifier:
                    return record

            # 佐渡市外ワークシートからも検索
            if config.get('outside_name'):
                try:
                    outside_worksheet = self.get_or_create_worksheet(config['outside_name'], config['headers'])
                    outside_records = outside_worksheet.get_all_records()

                    for record in outside_records:
                        if record.get(PLACE_ID_HEADER) == identifier:
                            return record
                except Exception as e:
                    self._logger.warning("Failed to check outside worksheet", error=str(e))

            return None

        except Exception as e:
            self._logger.error("Load operation failed", identifier=identifier, category=category, error=str(e))
            return None

    def exists(self, identifier: str, category: str) -> bool:
        """
        Check if data exists in Google Sheets.

        Args:
            identifier: Unique identifier for the data
            category: The category/type of data

        Returns:
            True if data exists, False otherwise
        """
        return self.load(identifier, category) is not None

    def delete(self, identifier: str, category: str) -> bool:
        """
        Delete data from Google Sheets.

        Note: Row-level deletion is not implemented for safety reasons.

        Args:
            identifier: Unique identifier for the data
            category: The category/type of data

        Returns:
            False - deletion not supported
        """
        self._logger.warning("Delete operation not supported",
                           identifier=identifier,
                           category=category,
                           reason="Row-level deletion not implemented for safety")
        return False

    def load(self, identifier: str, category: str) -> Optional[Dict[str, Any]]:
        """
        Load data from Google Sheets.

        Args:
            identifier: Unique identifier for the data (place_id)
            category: The category/type of data

        Returns:
            The loaded data or None if not found
        """
        try:
            config = self.worksheet_configs.get(category)
            if not config:
                self._logger.error(UNKNOWN_CATEGORY_MSG, category=category)
                return None

            # メインワークシートから検索
            worksheet = self.get_or_create_worksheet(config['name'], config['headers'])
            all_records = worksheet.get_all_records()

            for record in all_records:
                if record.get(PLACE_ID_HEADER) == identifier or record.get(PLACE_ID_JP_HEADER) == identifier:
                    return record

            # 佐渡市外ワークシートからも検索
            if config.get('outside_name'):
                return self._search_outside_worksheet(config, identifier)

            return None

        except Exception as e:
            self._logger.error("Load operation failed", identifier=identifier, category=category, error=str(e))
            return None

    def _search_outside_worksheet(self, config: Dict[str, Any], identifier: str) -> Optional[Dict[str, Any]]:
        """佐渡市外ワークシートを検索"""
        try:
            outside_worksheet = self.get_or_create_worksheet(config['outside_name'], config['headers'])
            outside_records = outside_worksheet.get_all_records()

            for record in outside_records:
                if record.get(PLACE_ID_HEADER) == identifier or record.get(PLACE_ID_JP_HEADER) == identifier:
                    return record
            return None
        except Exception as e:
            self._logger.warning("Failed to check outside worksheet", error=str(e))
            return None

    def delete(self, identifier: str, category: str) -> bool:
        """
        Delete data from Google Sheets.

        Args:
            identifier: Unique identifier for the data
            category: The category/type of data

        Returns:
            False - deletion not currently supported
        """
        # Note: Row-level deletion is not implemented in this version
        # for data integrity and safety reasons. Use clear() to remove all data
        # or implement specific deletion logic as needed.
        self._logger.warning("Delete operation not supported",
                           identifier=identifier,
                           category=category,
                           reason="Row-level deletion not implemented for safety")

        return False

    def get_all_data(self, category: str) -> List[Dict[str, Any]]:
        """
        Get all data for a category.

        Args:
            category: The category/type of data

        Returns:
            List of all data items
        """
        try:
            config = self.worksheet_configs.get(category)
            if not config:
                self._logger.error(UNKNOWN_CATEGORY_MSG, category=category)
                return []

            all_data = []

            # メインワークシートからデータを取得
            try:
                worksheet = self.get_or_create_worksheet(config['name'], config['headers'])
                main_records = worksheet.get_all_records()
                all_data.extend(main_records)
            except Exception as e:
                self._logger.warning("Failed to get main worksheet data", error=str(e))

            # 佐渡市外ワークシートからデータを取得
            if config.get('outside_name'):
                try:
                    outside_worksheet = self.get_or_create_worksheet(config['outside_name'], config['headers'])
                    outside_records = outside_worksheet.get_all_records()
                    all_data.extend(outside_records)
                except Exception as e:
                    self._logger.warning("Failed to get outside worksheet data", error=str(e))

            return all_data

        except Exception as e:
            self._logger.error("Get all data failed", category=category, error=str(e))
            return []

    def get_summary(self, category: str) -> Dict[str, Any]:
        """
        Get summary information for a category.

        Args:
            category: The category/type of data

        Returns:
            Summary information
        """
        try:
            config = self.worksheet_configs.get(category)
            if not config:
                self._logger.error(UNKNOWN_CATEGORY_MSG, category=category)
                return {"error": f"Unknown category: {category}"}

            all_data = self.get_all_data(category)

            # 基本的なサマリー情報を作成
            summary = {
                "category": category,
                "total_count": len(all_data),
                "main_count": 0,
                "outside_count": 0,
                "last_updated": time.strftime('%Y-%m-%d %H:%M:%S')
            }

            # 地区別統計
            for record in all_data:
                district = record.get('地区', '不明')
                if district == '市外':
                    summary["outside_count"] += 1
                else:
                    summary["main_count"] += 1

            return summary

        except Exception as e:
            self._logger.error("Get summary failed", category=category, error=str(e))
            return {"error": str(e)}


def create_sheets_storage(auth_service: GoogleAuthService, spreadsheet_id: str) -> SheetsStorageAdapter:
    """
    Create sheets storage adapter.

    Args:
        auth_service: Google authentication service
        spreadsheet_id: Google Sheets spreadsheet ID

    Returns:
        SheetsStorageAdapter instance
    """
    return SheetsStorageAdapter(auth_service, spreadsheet_id)
