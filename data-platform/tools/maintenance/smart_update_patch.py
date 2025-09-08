#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
スマート更新システムパッチ

現在の sheets_storage_adapter.py に適用できる改善案を実装し、
内容の変化を検知して必要な場合のみ更新を行うシステムです。
"""

import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple, Optional
import os


class SmartUpdateMixin:
    """スマート更新機能を追加するMixin"""

    def __init__(self):
        # 更新ポリシーの設定
        self.update_policy = os.getenv('UPDATE_POLICY', 'smart')  # smart, always, never
        self.force_update_days = int(os.getenv('UPDATE_THRESHOLD_DAYS', '7'))  # 強制更新日数

        # 重要フィールドの定義（カテゴリ別）
        self.important_fields = {
            'restaurants': [
                'name', 'address', 'rating', 'review_count', 'business_status',
                'opening_hours', 'phone', 'website', 'price_level'
            ],
            'parkings': [
                'name', 'address', 'category', 'business_status', 'description',
                'opening_hours', 'accessibility', 'payment_methods'
            ],
            'toilets': [
                'name', 'address', 'category', 'business_status', 'description',
                'opening_hours', 'accessibility', 'child_friendly'
            ]
        }

    def should_update_record(self, new_data: Dict[str, Any], existing_data: Dict[str, Any], category: str) -> Tuple[bool, str]:
        """
        レコードを更新すべきかを判定

        Args:
            new_data: 新しいデータ
            existing_data: 既存のデータ
            category: カテゴリ

        Returns:
            (更新すべきか, 理由)
        """

        # ポリシーチェック
        if self.update_policy == 'always':
            return True, "UPDATE_POLICY=always"
        elif self.update_policy == 'never':
            return False, "UPDATE_POLICY=never"

        # smart ポリシーの場合の詳細判定
        return self._smart_update_check(new_data, existing_data, category)

    def _smart_update_check(self, new_data: Dict[str, Any], existing_data: Dict[str, Any], category: str) -> Tuple[bool, str]:
        """スマート更新判定の詳細ロジック"""

        # 1. 強制更新日数チェック
        last_updated = existing_data.get('timestamp', existing_data.get('最終更新日時', ''))
        if last_updated:
            try:
                last_update_date = datetime.strptime(last_updated.split()[0], '%Y-%m-%d')
                days_since_update = (datetime.now() - last_update_date).days

                if days_since_update >= self.force_update_days:
                    return True, f"強制更新: {days_since_update}日経過"
            except (ValueError, AttributeError):
                pass

        # 2. 重要フィールドの変化チェック
        important_fields = self.important_fields.get(category, [])
        changes = []

        for field in important_fields:
            old_value = self._normalize_value(existing_data.get(field, ''))
            new_value = self._normalize_value(new_data.get(field, ''))

            if old_value != new_value:
                changes.append(f"{field}: '{old_value}' → '{new_value}'")

        if changes:
            return True, f"重要フィールド変更: {', '.join(changes[:3])}"

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
        useful_fields = ['phone', 'website', 'opening_hours', 'description', '電話番号', 'ウェブサイト', '営業時間', '施設説明']

        for field in useful_fields:
            old_value = self._normalize_value(existing_data.get(field, ''))
            new_value = self._normalize_value(new_data.get(field, ''))

            # 既存が空で新しいデータに値がある場合
            if not old_value and new_value:
                return True

        return False


# 使用例とテスト
def test_smart_update_system():
    """スマート更新システムのテスト"""

    class TestUpdater(SmartUpdateMixin):
        def __init__(self):
            super().__init__()

    updater = TestUpdater()

    # テストケース 1: 重要フィールドの変更
    existing_data = {
        'place_id': 'TEST_123',
        'name': '旧店舗名',
        'rating': '4.0',
        'review_count': '10',
        'timestamp': '2025-08-22'
    }

    new_data = {
        'place_id': 'TEST_123',
        'name': '新店舗名',  # 変更あり
        'rating': '4.0',
        'review_count': '10',
        'timestamp': '2025-08-29'
    }

    should_update, reason = updater.should_update_record(new_data, existing_data, 'restaurants')
    print(f"テスト1 - 名前変更: {should_update}, 理由: {reason}")

    # テストケース 2: 評価の改善
    new_data_improved = {
        'place_id': 'TEST_123',
        'name': '旧店舗名',
        'rating': '4.2',  # 改善
        'review_count': '15',  # 増加
        'timestamp': '2025-08-29'
    }

    should_update, reason = updater.should_update_record(new_data_improved, existing_data, 'restaurants')
    print(f"テスト2 - 評価改善: {should_update}, 理由: {reason}")

    # テストケース 3: 変更なし
    same_data = existing_data.copy()
    same_data['timestamp'] = '2025-08-29'

    should_update, reason = updater.should_update_record(same_data, existing_data, 'restaurants')
    print(f"テスト3 - 変更なし: {should_update}, 理由: {reason}")

    # テストケース 4: 強制更新（7日経過）
    old_existing_data = existing_data.copy()
    old_existing_data['timestamp'] = '2025-08-15'  # 2週間前

    should_update, reason = updater.should_update_record(same_data, old_existing_data, 'restaurants')
    print(f"テスト4 - 強制更新: {should_update}, 理由: {reason}")


if __name__ == "__main__":
    print("=== スマート更新システムのテスト ===")
    test_smart_update_system()

    print("\n=== 環境変数による設定例 ===")
    print("UPDATE_POLICY=smart    # デフォルト: 内容変更時のみ更新")
    print("UPDATE_POLICY=always   # 常に更新")
    print("UPDATE_POLICY=never    # 更新しない")
    print("UPDATE_THRESHOLD_DAYS=7  # 7日経過で強制更新")

    print("\n=== 更新判定の条件 ===")
    print("1. 強制更新日数の経過")
    print("2. 重要フィールド（名前、住所、評価等）の変更")
    print("3. 評価・レビュー数の改善")
    print("4. 営業状況の変化")
    print("5. 空フィールドの補完")
