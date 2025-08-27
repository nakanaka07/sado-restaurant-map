#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
URL→CID変換処理クラス
Google Maps URLをCID形式に変換

機能:
- Google Maps URLからCIDを抽出
- 長いURLをCID形式に変換
- 統合ファイルの一括変換
- バックアップ作成機能

使用例:
    from processors.url_converter import URLConverter
    converter = URLConverter()
    converter.convert_file('data/urls/restaurants_merged.txt')
"""

import os
import re
import shutil
import urllib.parse
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Optional

class URLConverter:
    """URL→CID変換処理クラス"""
    
    def __init__(self):
        # CIDパターン（15-25桁の数字）
        self.cid_pattern = re.compile(r'cid=(\d{15,25})')
        
        # Google Maps URLパターン
        self.maps_url_pattern = re.compile(r'https://www\.google\.com/maps/place/([^/@]+)/@([^/]+)/.*')
        
        # Place IDパターン（Google Maps URL内）
        self.place_id_pattern = re.compile(r'!1s0x[a-f0-9]+:0x([a-f0-9]+)')
        
    def extract_cid_from_url(self, url: str) -> Optional[str]:
        """
        URLからCIDを抽出
        
        Args:
            url: Google Maps URL
            
        Returns:
            CID文字列（見つからない場合はNone）
        """
        # 既にCID形式の場合
        cid_match = self.cid_pattern.search(url)
        if cid_match:
            return cid_match.group(1)
        
        # Google Maps URLからPlace IDを抽出してCIDに変換
        place_id_match = self.place_id_pattern.search(url)
        if place_id_match:
            hex_id = place_id_match.group(1)
            try:
                # 16進数を10進数（CID）に変換
                cid = str(int(hex_id, 16))
                return cid
            except ValueError:
                pass
        
        return None
    
    def extract_place_name_from_url(self, url: str) -> Optional[str]:
        """
        URLから施設名を抽出
        
        Args:
            url: Google Maps URL
            
        Returns:
            施設名（見つからない場合はNone）
        """
        maps_match = self.maps_url_pattern.search(url)
        if maps_match:
            encoded_name = maps_match.group(1)
            try:
                # URLデコード
                decoded_name = urllib.parse.unquote(encoded_name, encoding='utf-8')
                # 余分な文字を除去
                decoded_name = re.sub(r'[+\-_]', ' ', decoded_name)
                return decoded_name.strip()
            except Exception:
                pass
        
        return None
    
    def convert_line(self, line: str) -> str:
        """
        1行をCID形式に変換
        
        Args:
            line: 変換対象の行
            
        Returns:
            変換後の行
        """
        line = line.strip()
        
        # コメント行や空行はそのまま
        if not line or line.startswith('#'):
            return line
        
        # 既にCID形式の場合はそのまま
        if 'maps.google.com/place?cid=' in line:
            return line
        
        # Google Maps URLを検出
        if 'google.com/maps/place/' in line:
            cid = self.extract_cid_from_url(line)
            place_name = self.extract_place_name_from_url(line)
            
            if cid and place_name:
                # CID形式に変換
                return f"https://maps.google.com/place?cid={cid}    # {place_name}"
            elif place_name:
                # CIDが取得できない場合は施設名のみ
                return place_name
        
        # その他の場合はそのまま
        return line
    
    def convert_file(self, file_path: str, backup: bool = True) -> bool:
        """
        ファイル全体をCID形式に変換
        
        Args:
            file_path: 変換対象ファイルパス
            backup: バックアップ作成するか
            
        Returns:
            変換成功フラグ
        """
        path = Path(file_path)
        
        if not path.exists():
            print(f"❌ ファイルが見つかりません: {file_path}")
            return False
        
        # バックアップ作成
        if backup:
            backup_path = path.with_suffix(f'.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt')
            shutil.copy2(path, backup_path)
            print(f"📄 バックアップ作成: {backup_path.name}")
        
        try:
            # ファイル読み込み
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # 各行を変換
            converted_lines = []
            conversion_count = 0
            
            for line_num, line in enumerate(lines, 1):
                original_line = line.rstrip()
                converted_line = self.convert_line(original_line)
                
                if converted_line != original_line:
                    conversion_count += 1
                    print(f"🔄 {line_num:3d}: {original_line[:50]}... → CID形式")
                
                converted_lines.append(converted_line + '\n')
            
            # ファイル書き込み
            with open(path, 'w', encoding='utf-8') as f:
                f.writelines(converted_lines)
            
            print(f"✅ 変換完了: {conversion_count}件のURLをCID形式に変換")
            return True
            
        except Exception as e:
            print(f"❌ 変換エラー: {e}")
            return False
    
    def convert_all_files(self, data_dir: str = "data/urls") -> dict:
        """
        指定ディレクトリの全ファイルを変換
        
        Args:
            data_dir: データディレクトリパス
            
        Returns:
            変換結果辞書
        """
        script_dir = Path(__file__).parent.parent
        data_path = script_dir / data_dir
        
        results = {}
        
        # 統合ファイルを検索
        merged_files = list(data_path.glob("*_merged.txt"))
        
        if not merged_files:
            print(f"⚠️ 統合ファイルが見つかりません: {data_path}")
            return results
        
        print(f"🔄 URL→CID変換開始: {len(merged_files)}ファイル")
        print("=" * 50)
        
        for file_path in merged_files:
            print(f"\n📁 処理中: {file_path.name}")
            success = self.convert_file(str(file_path))
            results[file_path.name] = success
        
        # 結果サマリー
        successful = sum(results.values())
        total = len(results)
        
        print("\n" + "=" * 50)
        print(f"🎯 変換結果: {successful}/{total}ファイル成功")
        
        for filename, success in results.items():
            status = "✅" if success else "❌"
            print(f"   {status} {filename}")
        
        return results

def main():
    """メイン処理"""
    converter = URLConverter()
    
    # 全統合ファイルを変換
    results = converter.convert_all_files()
    
    if all(results.values()):
        print("\n🎉 全ファイルの変換が完了しました！")
    else:
        print("\n⚠️ 一部のファイルで変換に失敗しました。")

if __name__ == '__main__':
    main()
