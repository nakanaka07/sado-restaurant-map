#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sheets Storage Adapter - 新しいアーキテクチャ対応版

Google Sheetsストレージの実装クラス
"""

import time
import os
import gspread
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
UNKNOWN_CATEGORY_MSG = "Unknown category"

# 共通ヘッダー定数
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
            data: List of data items to save
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

            # 佐渡島内外に振り分け
            sado_data = []
            outside_data = []

            for item in data:
                validation_result = MockValidationResult(item)
                if validation_result.data.get('is_in_sado', False):
                    sado_data.append(validation_result)
                else:
                    outside_data.append(validation_result)

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

    def _update_single_worksheet(self, worksheet_name: str, headers: List[str], validation_results: List) -> bool:
        """単一ワークシートの更新"""
        try:
            worksheet = self.get_or_create_worksheet(worksheet_name, headers)
            existing_data = self._get_existing_data_map(worksheet, headers)
            updates, appends = self._prepare_update_data(validation_results, existing_data, headers)
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
            place_id = record.get(PLACE_ID_HEADER)
            if place_id:
                existing_data[place_id] = {
                    'data': record,
                    'row': i + 2
                }
        return existing_data

    def _prepare_update_data(self, validation_results: List, existing_data: Dict, headers: List[str]) -> Tuple[List[Dict], List[List[str]]]:
        """更新・追加データを準備"""
        updates = []
        appends = []

        for result in validation_results:
            if not result.is_valid:
                continue

            place_id = result.data.get('place_id', '')
            if not place_id:
                continue

            row_data = self._extract_row_data(result, headers)

            if place_id in existing_data:
                existing_row = existing_data[place_id]['row']
                updates.append({
                    'range': f'A{existing_row}',
                    'values': [row_data]
                })
            else:
                appends.append(row_data)

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

    def _extract_row_data(self, result, headers: List[str]) -> List[str]:
        """結果データから行データを抽出"""
        row_data = []
        data = result.data

        # 基本的なフィールドマッピング
        field_mapping = {
            PLACE_ID_HEADER: 'place_id',
            '店舗名': 'name',
            '施設名': 'name',
            '駐車場名': 'name',
            '所在地': 'address',
            '緯度': 'latitude',
            '経度': 'longitude',
            '評価': 'rating',
            REVIEW_COUNT_HEADER: 'review_count',
            '営業状況': 'business_status',
            '営業時間': 'opening_hours',
            '電話番号': 'phone',
            'ウェブサイト': 'website',
            '地区': 'district',
            MAPS_URL_HEADER: 'google_maps_url',
            LAST_UPDATED_HEADER: 'timestamp'
        }

        for header in headers:
            value = ''
            if header in data:
                value = data[header]
            elif header in field_mapping and field_mapping[header] in data:
                value = data[field_mapping[header]]

            row_data.append(str(value) if value is not None else '')

        return row_data

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


class MockValidationResult:
    """Mock validation result for bridging old and new architectures"""

    def __init__(self, data: Dict[str, Any]):
        self.data = data.copy()  # データのコピーを作成
        self.is_valid = True
        self.errors = []

        # is_in_sadoフィールドが設定されていない場合は判定を行う
        if 'is_in_sado' not in self.data:
            self._set_is_in_sado()

    def _set_is_in_sado(self):
        """佐渡島内判定を実行してis_in_sadoフィールドを設定"""
        try:
            lat, lng = self._extract_coordinates()

            if lat is not None and lng is not None:
                self._set_location_by_coordinates(lat, lng)
            else:
                self._set_location_by_address()

        except Exception:
            # エラーの場合は市外として扱う
            self.data['is_in_sado'] = False
            self.data['district'] = '市外'

    def _extract_coordinates(self) -> Tuple[Optional[float], Optional[float]]:
        """データから緯度経度を抽出"""
        lat = self._extract_coordinate(['latitude', '緯度', 'lat'])
        lng = self._extract_coordinate(['longitude', '経度', 'lng', 'lon'])
        return lat, lng

    def _extract_coordinate(self, key_names: List[str]) -> Optional[float]:
        """指定されたキー名から座標値を抽出"""
        for key in key_names:
            if key in self.data and self.data[key] is not None:
                try:
                    return float(self.data[key])
                except (ValueError, TypeError):
                    continue
        return None

    def _set_location_by_coordinates(self, lat: float, lng: float) -> None:
        """座標による佐渡島内判定"""
        SADO_BOUNDS = {
            'north': 38.39, 'south': 37.74,
            'east': 138.62, 'west': 137.85
        }

        is_in_sado = (SADO_BOUNDS['south'] <= lat <= SADO_BOUNDS['north'] and
                     SADO_BOUNDS['west'] <= lng <= SADO_BOUNDS['east'])

        self.data['is_in_sado'] = is_in_sado

        if is_in_sado:
            if 'district' not in self.data or not self.data['district']:
                self.data['district'] = self._classify_district(lat, lng)
        else:
            self.data['district'] = '市外'

    def _set_location_by_address(self) -> None:
        """住所による佐渡島内判定"""
        address = (self.data.get('address', '') or
                  self.data.get('住所', '') or
                  self.data.get('所在地', ''))

        self.data['is_in_sado'] = self._is_sado_by_address(address)
        self.data['district'] = '市外' if not self.data['is_in_sado'] else '佐渡市内'

    def _classify_district(self, lat: float, lng: float) -> str:
        """簡易的な地区分類"""
        # 中心部の大まかな分類
        if lat > 38.0:
            return '両津'
        elif lng < 138.0:
            return '相川'
        elif lat < 37.9:
            return '小木・羽茂'
        else:
            return '佐和田・金井'

    def _is_sado_by_address(self, address: str) -> bool:
        """住所による佐渡島判定"""
        if not address:
            return False

        sado_keywords = ['佐渡', '新潟県佐渡市', '両津', '相川', '佐和田', '金井', '新穂', '畑野', '真野', '小木', '羽茂', '赤泊']
        return any(keyword in address for keyword in sado_keywords)

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
