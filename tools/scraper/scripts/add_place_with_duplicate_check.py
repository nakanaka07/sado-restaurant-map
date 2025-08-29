#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重複チェック機能付き店舗追加システム

新店舗追加時に既存データとの重複をチェックし、安全に追加を行います。

使用例:
    python scripts/add_place_with_duplicate_check.py --restaurant "https://www.google.com/maps/place/..."
    python scripts/add_place_with_duplicate_check.py --parking "https://www.google.com/maps/place/..."
    python scripts/add_place_with_duplicate_check.py --toilet "https://www.google.com/maps/place/..."
    python scripts/add_place_with_duplicate_check.py --check-all  # 全ファイルの重複チェック
"""

import argparse
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
from difflib import SequenceMatcher
from new_url_converter import AdvancedURLConverter


@dataclass
class PlaceEntry:
    """店舗・施設エントリー"""
    cid: Optional[str]
    name: Optional[str]
    original_line: str
    file_source: str
    line_number: int


class DuplicateChecker:
    """重複チェック機能クラス"""

    def __init__(self):
        self.converter = AdvancedURLConverter()
        self.data_dir = Path('data')

        # カテゴリファイルマッピング
        self.category_files = {
            'restaurants': self.data_dir / 'restaurants_merged.txt',
            'parkings': self.data_dir / 'parkings_merged.txt',
            'toilets': self.data_dir / 'toilets_merged.txt'
        }

    def parse_file_entries(self, file_path: Path) -> List[PlaceEntry]:
        """ファイルからエントリーを解析"""
        entries = []

        if not file_path.exists():
            return entries

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            for line_num, line in enumerate(lines, 1):
                entry = self._parse_single_line(line, line_num, file_path.name)
                if entry:
                    entries.append(entry)

        except Exception as e:
            print(f"❌ ファイル解析エラー {file_path.name}: {e}")

        return entries

    def _parse_single_line(self, line: str, line_num: int, file_name: str) -> Optional[PlaceEntry]:
        """単一行を解析してPlaceEntryを作成"""
        line = line.strip()

        # 空行やコメント行はスキップ
        if not line or line.startswith('#'):
            return None

        # CIDとnameを抽出
        cid, name = self._extract_cid_and_name(line)

        return PlaceEntry(
            cid=cid,
            name=name,
            original_line=line,
            file_source=file_name,
            line_number=line_num
        )

    def _extract_cid_and_name(self, line: str) -> Tuple[Optional[str], Optional[str]]:
        """行からCIDと名前を抽出"""
        cid = None
        name = None

        # CID URL形式の場合
        if 'maps.google.com/place?cid=' in line:
            cid_match = re.search(r'cid=(\d+)', line)
            if cid_match:
                cid = cid_match.group(1)

            # コメント部分から名前を抽出
            name_match = re.search(r'#\s*(.+)', line)
            if name_match:
                name = name_match.group(1).strip()

        # 通常のGoogle Maps URLの場合
        elif 'google.com/maps/place/' in line:
            # URL変換を試行
            _, _, extracted_cid, extracted_name = self.converter.convert_url_to_cid_format(line)
            cid = extracted_cid
            name = extracted_name

        # テキストのみの場合
        else:
            name = line

        return cid, name

    def get_all_entries(self) -> Dict[str, List[PlaceEntry]]:
        """全カテゴリのエントリーを取得"""
        all_entries = {}

        for category, file_path in self.category_files.items():
            entries = self.parse_file_entries(file_path)
            all_entries[category] = entries
            print(f"📊 {category}: {len(entries)}件のエントリーを読み込み")

        return all_entries

    def find_duplicates_by_cid(self, all_entries: Dict[str, List[PlaceEntry]]) -> List[Tuple[PlaceEntry, PlaceEntry]]:
        """CIDによる重複を検索"""
        duplicates = []
        cid_to_entry = {}

        for category, entries in all_entries.items():
            for entry in entries:
                if entry.cid:
                    if entry.cid in cid_to_entry:
                        # 重複発見
                        duplicates.append((cid_to_entry[entry.cid], entry))
                    else:
                        cid_to_entry[entry.cid] = entry

        return duplicates

    def find_duplicates_by_name(self, all_entries: Dict[str, List[PlaceEntry]], similarity_threshold: float = 0.8) -> List[Tuple[PlaceEntry, PlaceEntry]]:
        """名前による重複を検索（類似度ベース）"""
        duplicates = []
        all_entries_flat = self._flatten_entries(all_entries)

        # 各エントリーと他の全エントリーを比較
        for i, entry1 in enumerate(all_entries_flat):
            for entry2 in all_entries_flat[i+1:]:
                if self._are_names_similar(entry1, entry2, similarity_threshold):
                    duplicates.append((entry1, entry2))

        return duplicates

    def _flatten_entries(self, all_entries: Dict[str, List[PlaceEntry]]) -> List[PlaceEntry]:
        """全エントリーをフラット化"""
        all_entries_flat = []
        for category, entries in all_entries.items():
            for entry in entries:
                if entry.name:
                    all_entries_flat.append(entry)
        return all_entries_flat

    def _are_names_similar(self, entry1: PlaceEntry, entry2: PlaceEntry, threshold: float) -> bool:
        """2つのエントリーの名前が類似しているかチェック"""
        if not (entry1.name and entry2.name):
            return False

        similarity = SequenceMatcher(None, entry1.name.lower(), entry2.name.lower()).ratio()
        return similarity >= threshold

    def check_new_entry_duplicates(self, new_url: str, target_category: str) -> Dict[str, any]:
        """新エントリーの重複チェック"""
        result = self._initialize_duplicate_check_result()

        # 新エントリーを解析
        new_entry = self._create_new_entry(new_url, target_category, result)
        if 'error' in result:
            return result

        result['new_entry'] = new_entry

        # 既存データを取得して重複チェック実行
        all_entries = self.get_all_entries()
        self._check_cid_duplicates(new_entry, all_entries, result)
        self._check_name_duplicates(new_entry, all_entries, result)
        self._generate_recommendations(result)

        return result

    def _initialize_duplicate_check_result(self) -> Dict[str, any]:
        """重複チェック結果の初期化"""
        return {
            'has_duplicates': False,
            'cid_duplicates': [],
            'name_duplicates': [],
            'new_entry': None,
            'recommendations': []
        }

    def _create_new_entry(self, new_url: str, target_category: str, result: Dict[str, any]) -> Optional[PlaceEntry]:
        """新エントリーを作成"""
        conversion_result = self.converter.convert_single_url(new_url)

        if not conversion_result['success']:
            result['error'] = f"URL変換失敗: {conversion_result.get('error', '不明なエラー')}"
            return None

        return PlaceEntry(
            cid=conversion_result['cid'],
            name=conversion_result['place_name'],
            original_line=new_url,
            file_source=f"新規追加({target_category})",
            line_number=0
        )

    def _check_cid_duplicates(self, new_entry: PlaceEntry, all_entries: Dict[str, List[PlaceEntry]], result: Dict[str, any]) -> None:
        """CIDによる重複チェック"""
        if not new_entry.cid:
            return

        for category, entries in all_entries.items():
            for entry in entries:
                if entry.cid == new_entry.cid:
                    result['cid_duplicates'].append({
                        'category': category,
                        'entry': entry,
                        'match_type': 'CID完全一致'
                    })

    def _check_name_duplicates(self, new_entry: PlaceEntry, all_entries: Dict[str, List[PlaceEntry]], result: Dict[str, any]) -> None:
        """名前による重複チェック"""
        if not new_entry.name:
            return

        for category, entries in all_entries.items():
            for entry in entries:
                if entry.name:
                    similarity = SequenceMatcher(None, new_entry.name.lower(), entry.name.lower()).ratio()
                    if similarity >= 0.8:  # 80%以上の類似度
                        result['name_duplicates'].append({
                            'category': category,
                            'entry': entry,
                            'similarity': similarity,
                            'match_type': f'名前類似({similarity:.1%})'
                        })

    def _generate_recommendations(self, result: Dict[str, any]) -> None:
        """推奨アクションを生成"""
        result['has_duplicates'] = bool(result['cid_duplicates'] or result['name_duplicates'])

        if result['has_duplicates']:
            if result['cid_duplicates']:
                result['recommendations'].append("❌ 同じCIDのエントリーが既に存在します。追加を中止することを推奨します。")
            if result['name_duplicates']:
                result['recommendations'].append("⚠️ 類似する名前のエントリーが存在します。確認してから追加してください。")
        else:
            result['recommendations'].append("✅ 重複は検出されませんでした。安全に追加できます。")

    def generate_duplicate_report(self, all_entries: Dict[str, List[PlaceEntry]]) -> str:
        """重複レポート生成"""
        cid_duplicates = self.find_duplicates_by_cid(all_entries)
        name_duplicates = self.find_duplicates_by_name(all_entries)

        report = [
            "📊 重複チェック結果レポート",
            "=" * 50,
            f"📈 総エントリー数: {sum(len(entries) for entries in all_entries.values())}件",
            f"🔍 CID重複: {len(cid_duplicates)}組",
            f"📝 名前重複: {len(name_duplicates)}組",
        ]

        if cid_duplicates:
            report.append("\n🚨 CID重複（同じ場所）:")
            for i, (entry1, entry2) in enumerate(cid_duplicates, 1):
                report.append(f"  {i}. CID: {entry1.cid}")
                report.append(f"     - {entry1.file_source}:{entry1.line_number} → {entry1.name}")
                report.append(f"     - {entry2.file_source}:{entry2.line_number} → {entry2.name}")

        if name_duplicates:
            report.append("\n⚠️ 名前類似（要確認）:")
            for i, (entry1, entry2) in enumerate(name_duplicates, 1):
                from difflib import SequenceMatcher
                similarity = SequenceMatcher(None, entry1.name.lower(), entry2.name.lower()).ratio()
                report.append(f"  {i}. 類似度: {similarity:.1%}")
                report.append(f"     - {entry1.file_source}:{entry1.line_number} → {entry1.name}")
                report.append(f"     - {entry2.file_source}:{entry2.line_number} → {entry2.name}")

        if not cid_duplicates and not name_duplicates:
            report.append("\n✅ 重複は検出されませんでした。")

        return "\n".join(report)

    def add_with_duplicate_check(self, category: str, url: str, force: bool = False) -> bool:
        """重複チェック付きでエントリーを追加"""
        print(f"🔍 重複チェック実行中: {category}")

        # 重複チェック
        check_result = self.check_new_entry_duplicates(url, category)
        if 'error' in check_result:
            print(f"❌ {check_result['error']}")
            return False

        # 結果表示
        self._display_new_entry_info(check_result['new_entry'])

        # 重複処理
        if check_result['has_duplicates']:
            if not self._handle_duplicates(check_result, force):
                return False
        else:
            print("✅ 重複なし - 安全に追加可能")

        # ファイルに追加
        return self._add_to_file(category, check_result['new_entry'])

    def _display_new_entry_info(self, new_entry: PlaceEntry) -> None:
        """新エントリー情報を表示"""
        print(f"📥 新エントリー: {new_entry.name}")
        if new_entry.cid:
            print(f"📍 CID: {new_entry.cid}")

    def _handle_duplicates(self, check_result: Dict[str, any], force: bool) -> bool:
        """重複の処理"""
        print("\n🚨 重複が検出されました:")

        # CID重複表示
        for dup in check_result['cid_duplicates']:
            entry = dup['entry']
            print(f"  ❌ CID重複: {entry.file_source}:{entry.line_number} → {entry.name}")

        # 名前重複表示
        for dup in check_result['name_duplicates']:
            entry = dup['entry']
            print(f"  ⚠️ 名前類似({dup['similarity']:.1%}): {entry.file_source}:{entry.line_number} → {entry.name}")

        # 推奨アクション表示
        for rec in check_result['recommendations']:
            print(f"  {rec}")

        if not force:
            # ユーザー確認
            response = input("\n続行しますか？ (y/N): ").lower().strip()
            if response != 'y':
                print("❌ 追加をキャンセルしました。")
                return False

        return True

    def _add_to_file(self, category: str, new_entry: PlaceEntry) -> bool:
        """ファイルに追加"""
        file_path = self.category_files[category]

        if not file_path.exists():
            print(f"❌ ファイルが見つかりません: {file_path}")
            return False

        try:
            converted_line = new_entry.original_line
            if new_entry.cid and new_entry.name:
                converted_line = f"https://maps.google.com/place?cid={new_entry.cid}  # {new_entry.name}"

            with open(file_path, 'a', encoding='utf-8') as f:
                f.write(f"\n{converted_line}")

            print(f"✅ 追加完了: {file_path.name}")
            return True

        except Exception as e:
            print(f"❌ ファイル書き込みエラー: {e}")
            return False


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description='重複チェック付き新店舗追加ツール',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--restaurant', help='レストランURLを重複チェック付きで追加')
    group.add_argument('--parking', help='駐車場URLを重複チェック付きで追加')
    group.add_argument('--toilet', help='トイレURLを重複チェック付きで追加')
    group.add_argument('--check-all', action='store_true', help='全ファイルの重複チェック実行')
    group.add_argument('--check-url', help='新URLの重複チェックのみ実行（追加はしない）')

    parser.add_argument('--force', action='store_true', help='重複があっても強制追加')
    parser.add_argument('--category', help='--check-urlと組み合わせてカテゴリ指定')

    args = parser.parse_args()

    checker = DuplicateChecker()

    if args.check_all:
        # 全ファイルの重複チェック
        print("🔍 全ファイルの重複チェック実行中...")
        all_entries = checker.get_all_entries()
        report = checker.generate_duplicate_report(all_entries)
        print(report)

    elif args.check_url:
        # URL重複チェックのみ
        category = args.category or 'restaurants'
        if category not in checker.category_files:
            print(f"❌ 無効なカテゴリ: {category}")
            return

        print(f"🔍 URL重複チェック: {category}")
        result = checker.check_new_entry_duplicates(args.check_url, category)

        if 'error' in result:
            print(f"❌ {result['error']}")
            return

        new_entry = result['new_entry']
        print(f"📥 URL: {args.check_url[:80]}...")
        print(f"🏪 店舗名: {new_entry.name}")
        if new_entry.cid:
            print(f"📍 CID: {new_entry.cid}")

        if result['has_duplicates']:
            print("\n🚨 重複検出:")
            for dup in result['cid_duplicates']:
                entry = dup['entry']
                print(f"  ❌ CID重複: {entry.file_source}:{entry.line_number} → {entry.name}")
            for dup in result['name_duplicates']:
                entry = dup['entry']
                print(f"  ⚠️ 名前類似({dup['similarity']:.1%}): {entry.file_source}:{entry.line_number} → {entry.name}")
        else:
            print("✅ 重複なし")

    else:
        # 追加コマンドの処理
        _handle_add_commands(checker, args)

def _handle_add_commands(checker, args):
    """追加コマンドの処理"""
    if args.restaurant:
        checker.add_with_duplicate_check('restaurants', args.restaurant, args.force)
    elif args.parking:
        checker.add_with_duplicate_check('parkings', args.parking, args.force)
    elif args.toilet:
        checker.add_with_duplicate_check('toilets', args.toilet, args.force)


if __name__ == '__main__':
    main()
