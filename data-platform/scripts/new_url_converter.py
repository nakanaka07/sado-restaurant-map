#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新しいURL変換システム - Google Maps URL to CID Converter
高度なURL変換・CID抽出機能を提供します。

使用例:
    python tools/scraper/scripts/new_url_converter.py --url "https://www.google.com/maps/place/..."
    python tools/scraper/scripts/new_url_converter.py --file data/new_urls_to_convert.txt
    python tools/scraper/scripts/new_url_converter.py --convert-file data/restaurants_merged.txt
"""

import re
import urllib.parse
import argparse
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple, List, Dict, Any


class AdvancedURLConverter:
    """高度なGoogle Maps URL → CID変換クラス"""

    def __init__(self):
        # CIDパターン (15-25桁の数字)
        self.cid_pattern = re.compile(r'cid=(\d{15,25})')

        # Place IDパターン (16進数 → 10進数CID変換用)
        self.place_id_hex_pattern = re.compile(r'!1s0x[a-f0-9]+:0x([a-f0-9]+)')

        # dataパラメータ内のPlace IDパターン
        self.data_place_id_patterns = [
            re.compile(r'!1s0x[a-f0-9]+:0x([a-f0-9]+)'),
            re.compile(r'0x[a-f0-9]+:0x([a-f0-9]+)'),
            re.compile(r'!3m1!4b1!4m\d+!3m\d+!1s0x[a-f0-9]+:0x([a-f0-9]+)'),
        ]

        # 店舗名抽出パターン
        self.name_patterns = [
            re.compile(r'/place/([^/@?]+)'),
            re.compile(r'/place/([^/]+)/@'),
            re.compile(r'place/([^/]+)/data'),
        ]

    def extract_cid_from_url(self, url: str) -> Optional[str]:
        """URLからCIDを抽出 (最も確実な方法)"""

        # 1. 既にCID形式の場合
        cid_match = self.cid_pattern.search(url)
        if cid_match:
            return cid_match.group(1)

        # 2. dataパラメータから16進数Place ID抽出・CID変換
        data_match = re.search(r'data=([^&]+)', url)
        if data_match:
            data_decoded = urllib.parse.unquote(data_match.group(1))

            for pattern in self.data_place_id_patterns:
                match = pattern.search(data_decoded)
                if match:
                    hex_id = match.group(1)
                    try:
                        # 16進数 → 10進数(CID)変換
                        cid = str(int(hex_id, 16))
                        return cid
                    except ValueError:
                        continue

        # 3. URLパス内の16進数Place ID抽出・CID変換
        hex_match = self.place_id_hex_pattern.search(url)
        if hex_match:
            hex_id = hex_match.group(1)
            try:
                cid = str(int(hex_id, 16))
                return cid
            except ValueError:
                pass

        return None

    def extract_place_name_from_url(self, url: str) -> Optional[str]:
        """URLから店舗名を抽出"""
        for pattern in self.name_patterns:
            match = pattern.search(url)
            if match:
                encoded_name = match.group(1)
                try:
                    # URLデコード
                    decoded_name = urllib.parse.unquote(encoded_name, encoding='utf-8')
                    # 特殊文字を空白に置換
                    decoded_name = re.sub(r'[+\-_]', ' ', decoded_name)
                    # 余分な空白を削除
                    decoded_name = re.sub(r'\s+', ' ', decoded_name).strip()
                    return decoded_name
                except Exception:
                    continue

        return None

    def _handle_existing_cid_url(self, url: str) -> Tuple[bool, str, Optional[str], Optional[str]]:
        """既にCID形式のURLを処理"""
        cid_match = self.cid_pattern.search(url)
        cid = cid_match.group(1) if cid_match else None
        # コメント部分から店舗名を抽出
        name_match = re.search(r'#\s*(.+)', url)
        name = name_match.group(1).strip() if name_match else None
        return True, url, cid, name

    def _handle_google_maps_url(self, url: str) -> Tuple[bool, str, Optional[str], Optional[str]]:
        """Google Maps URLを処理してCID形式に変換"""
        cid = self.extract_cid_from_url(url)
        place_name = self.extract_place_name_from_url(url)

        if cid:
            if place_name:
                result = f"https://maps.google.com/place?cid={cid}  # {place_name}"
            else:
                result = f"https://maps.google.com/place?cid={cid}"
            return True, result, cid, place_name
        else:
            # CIDが抽出できない場合は店舗名のみ
            if place_name:
                return True, place_name, None, place_name
            else:
                return False, f"# ❌ 変換失敗: {url}", None, None

    def convert_url_to_cid_format(self, url: str) -> Tuple[bool, str, Optional[str], Optional[str]]:
        """
        URLをCID形式に変換

        Returns:
            Tuple[成功フラグ, 結果文字列, CID, 店舗名]
        """
        url = url.strip()

        # 空行・コメント行はそのまま
        if not url or url.startswith('#'):
            return True, url, None, None

        # 既にCID形式の場合はそのまま
        if 'maps.google.com/place?cid=' in url:
            return self._handle_existing_cid_url(url)

        # Google Maps URLかチェック
        if not ('google.com/maps/place/' in url or 'maps.google.com/place' in url):
            # Google MapsのURLでない場合はそのまま返す
            return True, url, None, None

        # Google Maps URLを処理
        return self._handle_google_maps_url(url)

    def convert_single_url(self, url: str) -> Dict[str, Any]:
        """単一URLの変換"""
        result = {
            'original_url': url,
            'success': False,
            'converted': None,
            'cid': None,
            'place_name': None,
            'error': None
        }

        try:
            success, converted, cid, place_name = self.convert_url_to_cid_format(url)
            result.update({
                'success': success,
                'converted': converted,
                'cid': cid,
                'place_name': place_name
            })
        except Exception as e:
            result['error'] = str(e)

        return result

    def convert_file(self, file_path: str, backup: bool = True) -> Dict[str, Any]:
        """ファイル全体の変換"""
        path = Path(file_path)

        if not path.exists():
            return {'success': False, 'error': f'ファイルが見つかりません: {file_path}'}

        # バックアップ作成
        if backup:
            backup_path = path.with_suffix(f'.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt')
            backup_path.write_text(path.read_text(encoding='utf-8'), encoding='utf-8')
            print(f"📄 バックアップ作成: {backup_path.name}")

        try:
            lines = path.read_text(encoding='utf-8').splitlines()
            converted_lines = []
            conversion_count = 0
            cid_extractions = []

            for line_num, line in enumerate(lines, 1):
                _, converted, cid, place_name = self.convert_url_to_cid_format(line)

                if converted != line.rstrip():
                    conversion_count += 1
                    print(f"🔄 {line_num:3d}: {line[:50]}...")
                    print(f"     → {converted}")

                    if cid and place_name:
                        cid_extractions.append({
                            'line': line_num,
                            'cid': cid,
                            'name': place_name,
                            'converted': converted
                        })

                converted_lines.append(converted)

            # ファイル書き込み
            path.write_text('\n'.join(converted_lines), encoding='utf-8')

            return {
                'success': True,
                'file_path': str(path),
                'total_lines': len(lines),
                'conversions': conversion_count,
                'cid_extractions': cid_extractions,
                'backup_path': str(backup_path) if backup else None
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    def generate_conversion_report(self, results: Dict[str, Any]) -> str:
        """変換レポート生成"""
        if not results['success']:
            return f"❌ 変換失敗: {results['error']}"

        report = [
            f"✅ ファイル変換完了: {Path(results['file_path']).name}",
            "📊 統計:",
            f"   - 総行数: {results['total_lines']}",
            f"   - 変換数: {results['conversions']}",
            f"   - CID抽出数: {len(results['cid_extractions'])}",
        ]

        if results.get('backup_path'):
            report.append(f"   - バックアップ: {Path(results['backup_path']).name}")

        if results['cid_extractions']:
            report.append("\n📍 抽出されたCID:")
            for item in results['cid_extractions']:
                report.append(f"   {item['line']:3d}: {item['name']} (CID: {item['cid']})")

        return '\n'.join(report)


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description='Google Maps URL → CID変換ツール',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--url', help='単一URLの変換テスト')
    group.add_argument('--file', help='ファイル全体の変換')
    group.add_argument('--convert-file', help='既存データファイルの変換')

    parser.add_argument('--no-backup', action='store_true', help='バックアップを作成しない')

    args = parser.parse_args()

    converter = AdvancedURLConverter()

    if args.url:
        # 単一URL変換テスト
        print("🔄 単一URL変換テスト")
        print(f"📥 入力: {args.url}")

        result = converter.convert_single_url(args.url)

        if result['success']:
            print(f"✅ 変換成功: {result['converted']}")
            if result['cid']:
                print(f"📍 CID: {result['cid']}")
            if result['place_name']:
                print(f"🏪 店舗名: {result['place_name']}")
        else:
            print(f"❌ 変換失敗: {result.get('error', '不明なエラー')}")

    elif args.file or args.convert_file:
        # ファイル変換
        file_path = args.file or args.convert_file

        print(f"🔄 ファイル変換開始: {Path(file_path).name}")

        results = converter.convert_file(file_path, backup=not args.no_backup)
        report = converter.generate_conversion_report(results)
        print(report)


if __name__ == '__main__':
    main()
