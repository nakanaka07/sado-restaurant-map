#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google Maps URLからPlace IDを抽出してPlace APIで詳細情報を取得するユーティリティ

対応URL形式:
1. https://www.google.com/maps/place/店舗名/@緯度,経度,zoom/data=...
2. https://maps.google.com/place?cid=数値
3. https://www.google.com/maps/place/店舗名/data=...
4. https://goo.gl/maps/短縮URL
5. https://maps.app.goo.gl/短縮URL

使用例:
    python -m scripts.utilities.url_extractor --url "https://www.google.com/maps/place/..."
    python -m scripts.utilities.url_extractor --file manual_urls.txt
    python -m scripts.utilities.url_extractor --test
"""

import os
import re
import argparse
import requests
import time
from urllib.parse import unquote, parse_qs, urlparse
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️ python-dotenv not installed. Using environment variables directly.")

# 定数定義
PLACES_API_KEY = os.environ.get('PLACES_API_KEY')
TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
SADO_CENTER_COORDS = "38.018827,138.367398"  # 佐渡島中心座標

class URLToPlaceExtractor:
    """Google Maps URLからPlace ID抽出・詳細取得クラス"""

    def __init__(self):
        self.api_key = PLACES_API_KEY
        self.session = requests.Session()

    def extract_place_id_from_url(self, url):
        """様々な形式のGoogle Maps URLからPlace IDを抽出"""
        print(f"🔍 URL解析中: {url[:80]}...")

        # 1. 短縮URLの場合は展開
        if 'goo.gl' in url or 'maps.app.goo.gl' in url:
            url = self.expand_short_url(url)
            if not url:
                return None, "短縮URL展開失敗"

        # 2. data= パラメータからPlace IDを抽出
        place_id = self.extract_from_data_param(url)
        if place_id:
            return place_id, "data パラメータから抽出"

        # 3. CIDからPlace IDへの変換を試行
        cid = self.extract_cid_from_url(url)
        if cid:
            place_id = self.convert_cid_to_place_id(cid)
            if place_id:
                return place_id, f"CID {cid} から変換"

        # 4. 座標とText Searchで検索
        coords, name = self.extract_coords_and_name(url)
        if coords and name:
            place_id = self.search_by_coords_and_name(coords, name)
            if place_id:
                return place_id, f"座標 {coords} と店舗名 '{name}' で検索"

        # 5. 店舗名のみでText Search
        if name:
            place_id = self.search_by_name_only(name)
            if place_id:
                return place_id, f"店舗名 '{name}' で検索"

        return None, "Place ID抽出失敗"

    def expand_short_url(self, short_url):
        """短縮URLを展開"""
        try:
            response = self.session.head(short_url, allow_redirects=True, timeout=10)
            expanded_url = response.url
            print(f"   📎 短縮URL展開: {expanded_url[:80]}...")
            return expanded_url
        except Exception as e:
            print(f"   ❌ 短縮URL展開エラー: {e}")
            return None

    def extract_from_data_param(self, url):
        """dataパラメータからPlace IDを抽出"""
        data_match = re.search(r'data=([^&]+)', url)
        if not data_match:
            return None

        data_encoded = data_match.group(1)

        try:
            # URLデコード
            data_decoded = unquote(data_encoded)

            # Place IDパターンを検索 (ChIJ で始まる場合が多い)
            place_id_patterns = [
                r'ChIJ[a-zA-Z0-9_-]+',
                r'0x[0-9a-fA-F]+:[0-9a-fA-F]+',
                r'!1s(ChIJ[a-zA-Z0-9_-]+)',
                r'!3m1!4b1!4m[0-9]+!3m[0-9]+!1s(ChIJ[a-zA-Z0-9_-]+)'
            ]

            for pattern in place_id_patterns:
                match = re.search(pattern, data_decoded)
                if match:
                    if match.groups():
                        place_id = match.group(1)
                    else:
                        place_id = match.group(0)

                    if place_id.startswith('ChIJ'):
                        print(f"   ✅ Place ID発見: {place_id}")
                        return place_id

            print("   ⚠️ data パラメータにPlace IDが見つかりません")
            return None

        except Exception as e:
            print(f"   ❌ data パラメータ解析エラー: {e}")
            return None

    def extract_cid_from_url(self, url):
        """URLからCIDを抽出"""
        cid_match = re.search(r'cid=(\d+)', url)
        if cid_match:
            cid = cid_match.group(1)
            print(f"   📍 CID発見: {cid}")
            return cid
        return None

    def convert_cid_to_place_id(self, cid):
        """CIDからPlace IDへの変換（実験的）"""
        print(f"   🔄 CID {cid} からPlace ID変換を試行中...")

        # CIDを含むURLでText Search（実験的）
        params = {
            'query': f"site:google.com/maps cid:{cid}",
            'language': 'ja',
            'key': self.api_key
        }

        try:
            response = self.session.get(TEXT_SEARCH_URL, params=params)
            data = response.json()

            if data.get('status') == 'OK' and data.get('results'):
                place_id = data['results'][0].get('place_id')
                if place_id:
                    print(f"   ✅ CID変換成功: {place_id}")
                    return place_id

            print("   ❌ CID変換失敗")
            return None

        except Exception as e:
            print(f"   ❌ CID変換エラー: {e}")
            return None    def extract_coords_and_name(self, url):
        """URLから座標と店舗名を抽出"""
        coords = None
        name = None

        # 座標パターン (@緯度,経度,zoom)
        coord_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+),(\d+)', url)
        if coord_match:
            lat, lng = coord_match.group(1), coord_match.group(2)
            coords = f"{lat},{lng}"
            print(f"   📍 座標発見: {coords}")

        # 店舗名パターン
        name_patterns = [
            r'/place/([^/@]+)',
            r'/place/([^/]+)/@',
            r'place/([^/]+)/data'
        ]

        for pattern in name_patterns:
            name_match = re.search(pattern, url)
            if name_match:
                encoded_name = name_match.group(1)
                name = unquote(encoded_name).replace('+', ' ')
                print(f"   🏪 店舗名発見: {name}")
                break

        return coords, name

    def search_by_coords_and_name(self, coords, name):
        """座標と店舗名でPlace IDを検索"""

        params = {
            'query': name,
            'location': coords,
            'radius': 1000,  # 1km範囲
            'language': 'ja',
            'key': self.api_key
        }

        try:
            response = self.session.get(TEXT_SEARCH_URL, params=params)
            data = response.json()

            if data.get('status') == 'OK' and data.get('results'):
                place_id = data['results'][0].get('place_id')
                if place_id:
                    print(f"   ✅ 座標+店舗名検索成功: {place_id}")
                    return place_id

            print("   ❌ 座標+店舗名検索失敗")
            return None

        except Exception as e:
            print(f"   ❌ 座標+店舗名検索エラー: {e}")
            return None

    def search_by_name_only(self, name):
        """店舗名のみでPlace IDを検索"""
        # 佐渡関連キーワードを追加
        enhanced_query = f"{name} 佐渡"

        params = {
            'query': enhanced_query,
            'location': SADO_CENTER_COORDS,  # 佐渡島中心座標
            'radius': 50000,  # 50km範囲
            'language': 'ja',
            'key': self.api_key
        }

        try:
            response = self.session.get(TEXT_SEARCH_URL, params=params)
            data = response.json()

            if data.get('status') == 'OK' and data.get('results'):
                place_id = data['results'][0].get('place_id')
                if place_id:
                    print(f"   ✅ 店舗名検索成功: {place_id}")
                    return place_id

            print("   ❌ 店舗名検索失敗")
            return None

        except Exception as e:
            print(f"   ❌ 店舗名検索エラー: {e}")
            return None

    def get_place_details(self, place_id):
        """Place IDから詳細情報を取得"""

        params = {
            'place_id': place_id,
            'fields': ','.join([
                'place_id',
                'name',
                'formatted_address',
                'geometry',
                'rating',
                'user_ratings_total',
                'business_status',
                'opening_hours',
                'formatted_phone_number',
                'website',
                'price_level',
                'types'
            ]),
            'language': 'ja',
            'key': self.api_key
        }

        try:
            response = self.session.get(PLACE_DETAILS_URL, params=params)
            data = response.json()

            if data.get('status') == 'OK':
                return data.get('result')
            else:
                print(f"❌ 詳細取得エラー: {data.get('status')}")
                return None

        except Exception as e:
            print(f"❌ 詳細取得例外: {e}")
            return None    def process_url(self, url):
        """URLを処理してPlace情報を取得"""
        print(f"\n{'='*80}")
        print(f"🎯 処理中: {url}")

        # Place IDを抽出
        place_id, method = self.extract_place_id_from_url(url)

        if not place_id:
            print(f"❌ Place ID抽出失敗: {method}")
            return None

        print(f"✅ Place ID取得成功: {place_id} ({method})")

        # API制限対応
        time.sleep(1)

        # 詳細情報を取得
        details = self.get_place_details(place_id)

        if details:
            print(f"🏪 店舗名: {details.get('name', 'Unknown')}")
            print(f"📍 住所: {details.get('formatted_address', 'Unknown')}")
            print(f"⭐ 評価: {details.get('rating', 'N/A')} ({details.get('user_ratings_total', 0)} reviews)")
            print(f"🔗 Place ID: {place_id}")

            return {
                'url': url,
                'place_id': place_id,
                'extraction_method': method,
                'details': details
            }
        else:
            print("❌ 詳細情報取得失敗")
            return None

def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(description='Google Maps URLからPlace情報を抽出')
    parser.add_argument('--url', help='処理する単一のURL')
    parser.add_argument('--file', help='URLリストファイル')
    parser.add_argument('--test', action='store_true', help='テスト用サンプルURLで実行')

    args = parser.parse_args()

    if not PLACES_API_KEY:
        print("❌ Error: PLACES_API_KEY が設定されていません")
        return

    extractor = URLToPlaceExtractor()

    if args.test:
        # テスト用サンプルURL
        test_urls = [
            "https://www.google.com/maps/place/%E4%BD%90%E6%B8%A1%E3%82%A2%E3%82%A6%E3%83%88%E3%83%89%E3%82%A2%E3%83%99%E3%83%BC%E3%82%B9/@38.0188333,138.3673889,17z/data=!3m1!4b1!4m6!3m5!1s0x5ff8e23000000000:0x4f0a1b7c8e9f0000!8m2!3d38.0188333!4d138.3673889!16s%2Fg%2F11c123456?entry=ttu",
            "https://maps.google.com/place?cid=5696967649906802702",
            "https://goo.gl/maps/abc123"
        ]

        print("🧪 テストモードで実行中...")
        for url in test_urls:
            extractor.process_url(url)

    elif args.url:
        extractor.process_url(args.url)    elif args.file:
        if not os.path.exists(args.file):
            print(f"❌ ファイルが見つかりません: {args.file}")
            return

        with open(args.file, 'r', encoding='utf-8') as f:
            urls = [line.strip() for line in f if line.strip() and not line.startswith('#')]

        print(f"📋 {len(urls)}個のURLを処理中...")
        results = []

        for i, url in enumerate(urls, 1):
            print(f"\n[{i}/{len(urls)}]")
            result = extractor.process_url(url)
            if result:
                results.append(result)

        print(f"\n📊 処理完了: {len(results)}/{len(urls)} 成功")

    else:
        print("❌ --url, --file, または --test オプションを指定してください")
        parser.print_help()

if __name__ == '__main__':
    main()
