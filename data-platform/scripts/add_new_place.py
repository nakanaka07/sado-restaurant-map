#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新店舗追加クイックツール（重複チェック機能付き）

使用例:
    python scripts/add_new_place.py --restaurant "https://www.google.com/maps/place/..."
    python scripts/add_new_place.py --parking "https://www.google.com/maps/place/..."
    python scripts/add_new_place.py --toilet "https://www.google.com/maps/place/..."
    python scripts/add_new_place.py --workflow  # ワークフローファイルを変換
    python scripts/add_new_place.py --check-duplicates  # 重複チェックのみ
"""

import argparse
import sys
from pathlib import Path
from new_url_converter import AdvancedURLConverter


class NewPlaceManager:
    """新店舗追加管理クラス"""

    def __init__(self):
        self.converter = AdvancedURLConverter()
        self.data_dir = Path('data')

        # カテゴリファイルマッピング
        self.category_files = {
            'restaurants': self.data_dir / 'restaurants_merged.txt',
            'parkings': self.data_dir / 'parkings_merged.txt',
            'toilets': self.data_dir / 'toilets_merged.txt'
        }

        self.workflow_file = self.data_dir / 'new_places_workflow.txt'

    def add_to_category(self, category: str, url: str, check_duplicates: bool = True) -> bool:
        """カテゴリファイルに直接追加（重複チェック付き）"""
        if category not in self.category_files:
            print(f"❌ 無効なカテゴリ: {category}")
            return False

        file_path = self.category_files[category]

        if not file_path.exists():
            print(f"❌ ファイルが見つかりません: {file_path}")
            return False

        # 重複チェック
        if check_duplicates:
            print("🔍 重複チェック実行中...")
            if self._check_for_duplicates(url):
                response = input("重複が検出されました。続行しますか？ (y/N): ").lower().strip()
                if response != 'y':
                    print("❌ 追加をキャンセルしました。")
                    return False

        # URL変換
        result = self.converter.convert_single_url(url)

        if not result['success']:
            print(f"❌ URL変換失敗: {result.get('error', '不明なエラー')}")
            return False

        converted_line = result['converted']

        print(f"🔄 カテゴリファイルに追加: {category}")
        print(f"📥 元URL: {url[:80]}...")
        print(f"📤 変換後: {converted_line}")

        # ファイルに追加
        try:
            with open(file_path, 'a', encoding='utf-8') as f:
                f.write(f"\n{converted_line}")

            print(f"✅ 追加完了: {file_path.name}")

            # 統計表示
            if result['cid']:
                print(f"📍 CID: {result['cid']}")
            if result['place_name']:
                print(f"🏪 店舗名: {result['place_name']}")

            return True

        except Exception as e:
            print(f"❌ ファイル書き込みエラー: {e}")
            return False

    def _check_for_duplicates(self, url: str) -> bool:
        """重複チェック（簡易版）"""
        # URL変換して CID と名前を取得
        result = self.converter.convert_single_url(url)
        if not result['success']:
            return False

        new_cid = result['cid']
        new_name = result['place_name']

        duplicates_found = False

        # 全カテゴリをチェック
        for check_category, file_path in self.category_files.items():
            if file_path.exists():
                if self._check_file_for_duplicates(file_path, check_category, new_cid, new_name):
                    duplicates_found = True

        return duplicates_found

    def _check_file_for_duplicates(self, file_path, category: str, new_cid: str, new_name: str) -> bool:
        """指定ファイル内での重複チェック"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            for line_num, line in enumerate(lines, 1):
                line = line.strip()
                if not line or line.startswith('#'):
                    continue

                # CID チェック
                if self._check_cid_duplicate(line, new_cid, category, line_num):
                    return True

                # 名前チェック
                if self._check_name_duplicate(line, new_name, category, line_num):
                    return True

            return False

        except Exception as e:
            print(f"⚠️ ファイル読み込みエラー {file_path.name}: {e}")
            return False

    def _check_cid_duplicate(self, line: str, new_cid: str, category: str, line_num: int) -> bool:
        """CID重複チェック"""
        import re

        if new_cid and 'maps.google.com/place?cid=' in line:
            cid_match = re.search(r'cid=(\d+)', line)
            if cid_match and cid_match.group(1) == new_cid:
                name_match = re.search(r'#\s*(.+)', line)
                existing_name = name_match.group(1).strip() if name_match else "不明"
                print(f"❌ CID重複: {category}:{line_num} → {existing_name}")
                return True
        return False

    def _check_name_duplicate(self, line: str, new_name: str, category: str, line_num: int) -> bool:
        """名前重複チェック"""
        from difflib import SequenceMatcher
        import re

        if not new_name:
            return False

        # 既存エントリーの名前を抽出
        existing_name = self._extract_name_from_line(line)

        if existing_name:
            similarity = SequenceMatcher(None, new_name.lower(), existing_name.lower()).ratio()
            if similarity >= 0.8:
                print(f"⚠️ 名前類似({similarity:.1%}): {category}:{line_num} → {existing_name}")
                return similarity >= 0.95  # 95%以上は確実に重複

        return False

    def _extract_name_from_line(self, line: str) -> str:
        """行から名前を抽出"""
        import re

        if '#' in line:
            name_match = re.search(r'#\s*(.+)', line)
            if name_match:
                return name_match.group(1).strip()
        elif not ('http' in line or 'maps.google.com' in line):
            # テキストのみの場合
            return line.strip()

        return ""

    def check_all_duplicates(self) -> None:
        """全ファイルの重複チェック"""
        print("🔍 全ファイルの重複チェック実行中...")

        # 専用の重複チェッカーを使用
        try:
            from add_place_with_duplicate_check import DuplicateChecker
            checker = DuplicateChecker()
            all_entries = checker.get_all_entries()
            report = checker.generate_duplicate_report(all_entries)
            print(report)
        except ImportError:
            print("❌ 詳細な重複チェック機能が見つかりません。")
            print("💡 python scripts/add_place_with_duplicate_check.py --check-all を使用してください。")

    def convert_workflow_file(self) -> bool:
        """ワークフローファイルを変換"""
        if not self.workflow_file.exists():
            print(f"❌ ワークフローファイルが見つかりません: {self.workflow_file}")
            return False

        print(f"🔄 ワークフローファイル変換: {self.workflow_file.name}")

        results = self.converter.convert_file(str(self.workflow_file))
        report = self.converter.generate_conversion_report(results)
        print(report)

        if results['success'] and results['cid_extractions']:
            print("\n📋 次のステップ:")
            print("1. 変換されたCID URLを適切なカテゴリファイルにコピー")
            print("2. データ収集を実行: python interface/cli/main.py --target [category] --mode standard")

        return results['success']

    def show_workflow_guide(self):
        """ワークフローガイドを表示"""
        guide = """
🎯 新店舗追加ワークフロー

【方法1: 直接追加（重複チェック付き）】
python scripts/add_new_place.py --restaurant "URL"
python scripts/add_new_place.py --parking "URL"
python scripts/add_new_place.py --toilet "URL"

【方法2: 重複チェックスキップで追加】
python scripts/add_new_place.py --restaurant "URL" --no-duplicate-check
python scripts/add_new_place.py --parking "URL" --no-duplicate-check
python scripts/add_new_place.py --toilet "URL" --no-duplicate-check

【方法3: ワークフローファイル使用】
1. data/new_places_workflow.txt にURLを追加
2. python scripts/add_new_place.py --workflow
3. 変換されたCIDを適切なカテゴリファイルにコピー

【重複チェック機能】
python scripts/add_new_place.py --check-duplicates  # 全ファイル重複チェック

🔍 重複チェック詳細:
- CIDベースの完全重複検出
- 名前ベースの類似度チェック（80%以上で警告、95%以上で重複判定）
- 全カテゴリを横断してチェック
- デフォルトで有効（--no-duplicate-checkで無効化可能）

【データ収集実行】
python interface/cli/main.py --target restaurants --mode standard
python interface/cli/main.py --target parkings --mode standard
python interface/cli/main.py --target toilets --mode standard

【対象ファイル】
- restaurants_merged.txt (飲食店)
- parkings_merged.txt (駐車場)
- toilets_merged.txt (トイレ)
"""
        print(guide)


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description='新店舗追加クイックツール',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--restaurant', help='レストランURLを直接追加')
    group.add_argument('--parking', help='駐車場URLを直接追加')
    group.add_argument('--toilet', help='トイレURLを直接追加')
    group.add_argument('--workflow', action='store_true', help='ワークフローファイルを変換')
    group.add_argument('--guide', action='store_true', help='使用ガイドを表示')
    group.add_argument('--check-duplicates', action='store_true', help='全ファイルの重複チェック実行')

    parser.add_argument('--no-duplicate-check', action='store_true',
                       help='重複チェックをスキップ（デフォルトでは重複チェックが有効）')

    args = parser.parse_args()

    manager = NewPlaceManager()

    # 重複チェック設定（デフォルトで有効、--no-duplicate-checkで無効化）
    check_duplicates = not args.no_duplicate_check

    if args.guide:
        manager.show_workflow_guide()
    elif args.workflow:
        manager.convert_workflow_file()
    elif args.check_duplicates:
        manager.check_all_duplicates()
    elif args.restaurant:
        manager.add_to_category('restaurants', args.restaurant, check_duplicates)
    elif args.parking:
        manager.add_to_category('parkings', args.parking, check_duplicates)
    elif args.toilet:
        manager.add_to_category('toilets', args.toilet, check_duplicates)


if __name__ == '__main__':
    main()
