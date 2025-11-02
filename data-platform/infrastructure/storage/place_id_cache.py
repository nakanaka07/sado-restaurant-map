#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Place ID キャッシュ管理システム

CID ⇔ Place ID のマッピングを永続化し、
API呼び出しコストを削減するためのキャッシュ機構
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from pathlib import Path

from shared.logger import get_logger


class PlaceIdCache:
    """Place ID キャッシュマネージャー"""

    def __init__(self, cache_file_path: Optional[str] = None):
        """
        初期化

        Args:
            cache_file_path: キャッシュファイルのパス（Noneの場合はデフォルトパス使用）
        """
        self._logger = get_logger(__name__)

        # デフォルトパス: data-platform/data/place_id_mapping.json
        if cache_file_path is None:
            base_dir = Path(__file__).parent.parent.parent  # data-platform/
            cache_file_path = str(base_dir / "data" / "place_id_mapping.json")

        self._cache_file_path = cache_file_path
        self._cache_data: Dict[str, Any] = {
            "cid_to_place_id": {},
            "metadata": {
                "version": "1.0",
                "last_full_update": None
            }
        }

        # キャッシュファイルをロード
        self._load_cache()

    @property
    def cache_file_path(self) -> str:
        """キャッシュファイルパスを取得"""
        return self._cache_file_path

    def _load_cache(self) -> None:
        """キャッシュファイルから読み込み"""
        try:
            if os.path.exists(self._cache_file_path):
                with open(self._cache_file_path, 'r', encoding='utf-8') as f:
                    loaded_data = json.load(f)
                    # データ構造検証
                    if self._validate_cache_structure(loaded_data):
                        self._cache_data = loaded_data
                        self._logger.info("キャッシュ読み込み成功",
                                        count=len(self._cache_data['cid_to_place_id']))
                    else:
                        self._logger.warning("キャッシュ構造が不正です。初期化します")
            else:
                self._logger.info("キャッシュファイルが存在しません。新規作成します")
                self._ensure_cache_directory()
        except Exception as e:
            self._logger.error("キャッシュ読み込みエラー", error=str(e))

    def _validate_cache_structure(self, data: Dict) -> bool:
        """キャッシュデータ構造の検証"""
        return (
            isinstance(data, dict) and
            "cid_to_place_id" in data and
            "metadata" in data and
            isinstance(data["cid_to_place_id"], dict) and
            isinstance(data["metadata"], dict)
        )

    def _ensure_cache_directory(self) -> None:
        """キャッシュディレクトリの存在確認・作成"""
        cache_dir = os.path.dirname(self._cache_file_path)
        os.makedirs(cache_dir, exist_ok=True)

    def _save_cache(self) -> bool:
        """キャッシュファイルに保存"""
        try:
            self._ensure_cache_directory()

            with open(self._cache_file_path, 'w', encoding='utf-8') as f:
                json.dump(self._cache_data, f, ensure_ascii=False, indent=2)

            self._logger.debug("キャッシュ保存成功",
                             count=len(self._cache_data['cid_to_place_id']))
            return True
        except Exception as e:
            self._logger.error("キャッシュ保存エラー", error=str(e))
            return False

    def get(self, cid: str) -> Optional[str]:
        """
        CIDからPlace IDを取得

        Args:
            cid: Google Maps CID

        Returns:
            Place ID（存在しない場合はNone）
        """
        entry = self._cache_data['cid_to_place_id'].get(cid)
        if entry and isinstance(entry, dict):
            return entry.get('place_id')
        return None

    def get_entry(self, cid: str) -> Optional[Dict[str, Any]]:
        """
        CIDの完全なエントリを取得

        Args:
            cid: Google Maps CID

        Returns:
            エントリ辞書（存在しない場合はNone）
        """
        return self._cache_data['cid_to_place_id'].get(cid)

    def save(self, cid: str, place_id: str, store_name: str = "") -> bool:
        """
        CIDとPlace IDのマッピングを保存

        Args:
            cid: Google Maps CID
            place_id: Places API Place ID
            store_name: 店舗名（オプション）

        Returns:
            保存成功可否
        """
        now = datetime.now().isoformat()
        refresh_due = (datetime.now() + timedelta(days=365)).isoformat()

        self._cache_data['cid_to_place_id'][cid] = {
            "place_id": place_id,
            "store_name": store_name,
            "last_updated": now,
            "refresh_due": refresh_due
        }

        # メタデータ更新
        if self._cache_data['metadata']['last_full_update'] is None:
            self._cache_data['metadata']['last_full_update'] = now

        self._logger.debug("マッピング保存", cid=cid, place_id=place_id)

        return self._save_cache()

    def update(self, cid: str, new_place_id: str) -> bool:
        """
        既存のPlace IDを更新（リフレッシュ）

        Args:
            cid: Google Maps CID
            new_place_id: 更新後のPlace ID

        Returns:
            更新成功可否
        """
        entry = self._cache_data['cid_to_place_id'].get(cid)

        if entry:
            now = datetime.now().isoformat()
            refresh_due = (datetime.now() + timedelta(days=365)).isoformat()

            entry['place_id'] = new_place_id
            entry['last_updated'] = now
            entry['refresh_due'] = refresh_due

            self._logger.info("Place ID更新", cid=cid, new_place_id=new_place_id)
            return self._save_cache()
        else:
            self._logger.warning("更新対象のエントリが存在しません", cid=cid)
            return False

    def needs_refresh(self, cid: str) -> bool:
        """
        Place IDの更新が必要かチェック（12ヶ月経過判定）

        Args:
            cid: Google Maps CID

        Returns:
            更新が必要な場合はTrue
        """
        entry = self._cache_data['cid_to_place_id'].get(cid)

        if not entry:
            return False

        try:
            last_updated_str = entry.get('last_updated')
            if not last_updated_str:
                return True  # タイムスタンプがない場合は更新必要

            last_updated = datetime.fromisoformat(last_updated_str)
            age = datetime.now() - last_updated

            # 12ヶ月（365日）経過判定
            needs_refresh = age > timedelta(days=365)

            if needs_refresh:
                self._logger.info("Place ID更新が必要",
                                cid=cid,
                                age_days=age.days)

            return needs_refresh

        except (ValueError, TypeError) as e:
            self._logger.warning("日付解析エラー", cid=cid, error=str(e))
            return True  # エラー時は安全側に倒して更新推奨

    def delete(self, cid: str) -> bool:
        """
        エントリを削除

        Args:
            cid: Google Maps CID

        Returns:
            削除成功可否
        """
        if cid in self._cache_data['cid_to_place_id']:
            del self._cache_data['cid_to_place_id'][cid]
            self._logger.info("エントリ削除", cid=cid)
            return self._save_cache()
        return False

    def clear_all(self) -> bool:
        """
        全エントリをクリア

        Returns:
            クリア成功可否
        """
        self._cache_data['cid_to_place_id'] = {}
        self._cache_data['metadata']['last_full_update'] = None
        self._logger.warning("全キャッシュクリア")
        return self._save_cache()

    def get_statistics(self) -> Dict[str, Any]:
        """
        キャッシュ統計情報を取得

        Returns:
            統計情報辞書
        """
        total_entries = len(self._cache_data['cid_to_place_id'])
        needs_refresh_count = sum(
            1 for cid in self._cache_data['cid_to_place_id'].keys()
            if self.needs_refresh(cid)
        )

        return {
            "total_entries": total_entries,
            "needs_refresh": needs_refresh_count,
            "up_to_date": total_entries - needs_refresh_count,
            "cache_file": self._cache_file_path,
            "version": self._cache_data['metadata']['version'],
            "last_full_update": self._cache_data['metadata']['last_full_update']
        }

    def export_for_backup(self) -> Dict[str, Any]:
        """
        バックアップ用にキャッシュデータをエクスポート

        Returns:
            キャッシュデータのコピー
        """
        return self._cache_data.copy()

    def import_from_backup(self, backup_data: Dict[str, Any]) -> bool:
        """
        バックアップからキャッシュデータをインポート

        Args:
            backup_data: バックアップデータ

        Returns:
            インポート成功可否
        """
        if self._validate_cache_structure(backup_data):
            self._cache_data = backup_data
            self._logger.info("バックアップからインポート成功")
            return self._save_cache()
        else:
            self._logger.error("バックアップデータの構造が不正です")
            return False
