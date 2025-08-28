#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
データ重複除去処理クラス
CIDとテキスト検索項目の重複排除処理

機能:
- CID付き施設データの重複除去
- テキスト検索項目の類似度チェック
- ファイル統合時の重複排除
- 施設名の正規化・比較処理

使用例:
    from core.processors.deduplicator import DataDeduplicator
    deduplicator = DataDeduplicator()
    deduplicator.remove_duplicates('data/urls/restaurants_merged.txt')
"""

import re
import urllib.parse
from pathlib import Path
from typing import Set, List, Tuple
from difflib import SequenceMatcher

def normalize_facility_name(name: str) -> str:
    """
    施設名を正規化（比較用）

    Args:
        name: 施設名

    Returns:
        正規化された施設名
    """
    # 不要な文字を除去し、統一化
    normalized = name.lower()
    normalized = re.sub(r'[+＋\s\-－・]', '', normalized)
    normalized = re.sub(r'駐車場$', '', normalized)
    normalized = re.sub(r'公衆トイレ$', '', normalized)
    normalized = re.sub(r'トイレ$', '', normalized)
    return normalized

def similarity(a: str, b: str) -> float:
    """
    文字列の類似度を計算

    Args:
        a, b: 比較する文字列

    Returns:
        類似度 (0.0-1.0)
    """
    return SequenceMatcher(None, a, b).ratio()

def extract_cid_facilities(file_path: Path) -> List[Tuple[str, str]]:
    """
    ファイルからCID付き施設を抽出

    Args:
        file_path: 対象ファイル

    Returns:
        (CID, 施設名)のリスト
    """
    cid_facilities = []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')

        for line in lines:
            line = line.strip()

            # CID付きURLを検索
            if 'cid=' in line:
                cid_match = re.search(r'cid=(\d+)', line)
                comment_match = re.search(r'#\s*(.+)$', line)

                if cid_match and comment_match:
                    cid = cid_match.group(1)
                    facility_name = comment_match.group(1).strip()
                    cid_facilities.append((cid, facility_name))

    except Exception as e:
        print(f"エラー: {file_path.name} - {e}")

    return cid_facilities

def extract_text_facilities(file_path: Path) -> List[str]:
    """
    ファイルからテキスト検索項目を抽出

    Args:
        file_path: 対象ファイル

    Returns:
        テキスト検索項目のリスト
    """
    text_facilities = []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')
        in_text_section = False

        for line in lines:
            line = line.strip()

            # テキスト検索セクションの開始を検出
            if 'テキスト検索' in line:
                in_text_section = True
                continue

            # セクション内で、コメント行や空行以外を収集
            if in_text_section:
                if line and not line.startswith('#') and not line.startswith('='):
                    text_facilities.append(line)

    except Exception as e:
        print(f"エラー: {file_path.name} - {e}")

    return text_facilities

def find_duplicates(cid_facilities: List[Tuple[str, str]], text_facilities: List[str]) -> Tuple[List[str], List[Tuple[str, str, float]]]:
    """
    CIDとテキスト項目の重複を検出

    Args:
        cid_facilities: (CID, 施設名)のリスト
        text_facilities: テキスト検索項目のリスト

    Returns:
        (完全重複リスト, 類似重複リスト)
    """
    exact_duplicates = []
    similar_duplicates = []

    # CID施設名の正規化マップを作成
    cid_normalized = {}
    for cid, name in cid_facilities:
        normalized = normalize_facility_name(name)
        cid_normalized[normalized] = (cid, name)

    for text_item in text_facilities:
        text_normalized = normalize_facility_name(text_item)

        # 完全一致チェック
        if text_normalized in cid_normalized:
            exact_duplicates.append(text_item)
        else:
            # 類似度チェック
            for cid_norm, (cid, cid_name) in cid_normalized.items():
                sim = similarity(text_normalized, cid_norm)
                if sim >= 0.8:  # 80%以上の類似度
                    similar_duplicates.append((text_item, cid_name, sim))

    return exact_duplicates, similar_duplicates

def remove_duplicates_from_file(file_path: Path, duplicates_to_remove: List[str]) -> int:
    """
    ファイルから重複項目を削除

    Args:
        file_path: 対象ファイル
        duplicates_to_remove: 削除する項目のリスト

    Returns:
        削除された項目数
    """
    if not duplicates_to_remove:
        return 0

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        new_lines = []
        removed_count = 0
        in_text_section = False

        for line in lines:
            original_line = line.rstrip('\n')
            stripped_line = line.strip()

            # テキスト検索セクションの検出
            if 'テキスト検索' in stripped_line:
                in_text_section = True
                new_lines.append(original_line)
                continue

            # テキストセクション内で重複項目をチェック
            if in_text_section and stripped_line in duplicates_to_remove:
                removed_count += 1
                print(f"  🗑️  削除: {stripped_line}")
                continue

            new_lines.append(original_line)

        # ファイルに書き戻し
        with open(file_path, 'w', encoding='utf-8') as f:
            for line in new_lines:
                f.write(line + '\n')

        return removed_count

    except Exception as e:
        print(f"エラー: {file_path.name} - {e}")
        return 0

def process_file(file_path: Path) -> None:
    """
    ファイルの重複排除を実行

    Args:
        file_path: 処理対象ファイル
    """
    print(f"\n🔍 処理中: {file_path.name}")

    # CIDとテキスト項目を抽出
    cid_facilities = extract_cid_facilities(file_path)
    text_facilities = extract_text_facilities(file_path)

    print(f"  📊 CID付き施設: {len(cid_facilities)}件")
    print(f"  📊 テキスト検索項目: {len(text_facilities)}件")

    # 重複を検出
    exact_duplicates, similar_duplicates = find_duplicates(cid_facilities, text_facilities)

    if exact_duplicates:
        print(f"  ⚠️  完全重複: {len(exact_duplicates)}件")
        for item in exact_duplicates:
            print(f"    - {item}")

    if similar_duplicates:
        print(f"  ⚠️  類似重複: {len(similar_duplicates)}件")
        for text_item, cid_name, sim in similar_duplicates:
            print(f"    - {text_item} ≈ {cid_name} ({sim:.2f})")

    # 重複を削除
    all_duplicates = exact_duplicates + [item[0] for item in similar_duplicates]

    if all_duplicates:
        removed_count = remove_duplicates_from_file(file_path, all_duplicates)
        print(f"  ✅ {removed_count}件の重複項目を削除しました")
    else:
        print("  ✅ 重複項目はありませんでした")

def main():
    """メイン処理"""
    print("=== CID・テキスト検索 重複排除 ===")

    # 処理対象ファイル
    base_dir = Path(r"c:\Users\HPE\Desktop\kueccha\sado-restaurant-map\tools\scraper\data\urls")
    target_files = [
        base_dir / "toilets_merged.txt",
        base_dir / "parkings_merged.txt"
    ]

    total_removed = 0

    for file_path in target_files:
        if file_path.exists():
            process_file(file_path)
        else:
            print(f"❌ ファイルが存在しません: {file_path}")

    print(f"\n🎯 完了: 重複排除処理が終了しました")

if __name__ == "__main__":
    main()
