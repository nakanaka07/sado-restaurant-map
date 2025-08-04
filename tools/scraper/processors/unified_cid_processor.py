#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
統合CID処理クラス
CIDベース・店舗名検索・URL抽出の統合処理

機能:
- CIDファイルからの店舗情報取得
- 店舗名による検索とPlace ID取得
- Google Maps URLからのPlace ID抽出
- 高精度な店舗データ取得
"""

import os
import re
import time
import requests
import pandas as pd
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from urllib.parse import unquote, parse_qs, urlparse

# 共通ライブラリをインポート
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 環境変数の明示的読み込み
from dotenv import load_dotenv
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config_dir = os.path.join(current_dir, 'config')
config_env_path = os.path.join(config_dir, '.env')
if os.path.exists(config_env_path):
    load_dotenv(config_env_path)

from utils.google_auth import get_places_api_key, authenticate_google_sheets, get_spreadsheet_id
from utils.translators import (
    translate_business_status, 
    translate_price_level, 
    translate_types,
    format_opening_hours,
    format_location_data
)
from utils.output_formatter import OutputFormatter

class UnifiedCIDProcessor:
    """統合CID処理クラス"""
    
    def __init__(self):
        self.api_key = get_places_api_key()
        self.spreadsheet_id = get_spreadsheet_id()
        self.results = []
        
        # 佐渡島の地理境界
        self.sado_center = "38.018827,138.367398"
        self.sado_radius = 50000  # 50km
        
        # API制限設定
        self.api_delay = float(os.environ.get('API_REQUEST_DELAY', '1.0'))
        
        # CIDパターン
        self.cid_pattern = re.compile(r'cid=(\d{15,25})')
    
    def parse_query_file(self, filename: str) -> List[Dict]:
        """クエリファイルを解析（CID URL・店舗名の両方に対応）"""
        queries_data = []
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(script_dir, filename)
        
        if not os.path.exists(file_path):
            print(f"❌ ファイルが見つかりません: {filename}")
            return []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    
                    # コメント行や空行をスキップ
                    if not line or line.startswith('#'):
                        continue
                    
                    # CID URL形式をチェック
                    if line.startswith('https://maps.google.com/place?cid='):
                        cid_match = self.cid_pattern.search(line)
                        if cid_match:
                            cid = cid_match.group(1)
                            # コメントから店舗名を抽出
                            comment_match = re.search(r'#\s*(.+)', line)
                            store_name = comment_match.group(1).strip() if comment_match else f"Store_{cid}"
                            
                            queries_data.append({
                                'type': 'cid_url',
                                'cid': cid,
                                'store_name': store_name,
                                'original_line': line,
                                'line_number': line_num
                            })
                    
                    # 通常のGoogle Maps URL
                    elif line.startswith('https://www.google.com/maps/place/'):
                        queries_data.append({
                            'type': 'maps_url',
                            'url': line,
                            'original_line': line,
                            'line_number': line_num
                        })
                    
                    # 店舗名のみ
                    else:
                        queries_data.append({
                            'type': 'store_name',
                            'store_name': line,
                            'original_line': line,
                            'line_number': line_num
                        })
            
            print(f"📋 {len(queries_data)}件のクエリを解析完了")
            return queries_data
            
        except Exception as e:
            print(f"❌ ファイル読み込みエラー: {e}")
            return []
    
    def process_cid_url(self, query_data: Dict) -> Optional[Dict]:
        """CID URLから店舗詳細を取得"""
        cid = query_data['cid']
        store_name = query_data['store_name']
        
        # Text Search で店舗を検索（CIDを使わず店舗名で検索）
        search_result = self.search_by_name(store_name)
        
        if search_result:
            place_id = search_result.get('place_id')
            if place_id:
                details = self.get_place_details(place_id)
                if details:
                    return self.format_result(details, query_data, 'CID URL検索')
        
        return None
    
    def process_maps_url(self, query_data: Dict) -> Optional[Dict]:
        """Google Maps URLからPlace ID抽出・詳細取得"""
        url = query_data['url']
        
        # URLからPlace IDを抽出
        place_id = self.extract_place_id_from_url(url)
        
        if place_id:
            details = self.get_place_details(place_id)
            if details:
                return self.format_result(details, query_data, 'Maps URL抽出')
        
        # Place ID抽出に失敗した場合、URLから店舗名と座標を抽出して検索
        coords, name = self.extract_coords_and_name_from_url(url)
        if name:
            search_result = self.search_by_name(name)
            if search_result:
                place_id = search_result.get('place_id')
                if place_id:
                    details = self.get_place_details(place_id)
                    if details:
                        return self.format_result(details, query_data, 'URL解析検索')
        
        return None
    
    def process_store_name(self, query_data: Dict) -> Optional[Dict]:
        """店舗名から検索"""
        store_name = query_data['store_name']
        
        search_result = self.search_by_name(store_name)
        
        if search_result:
            place_id = search_result.get('place_id')
            if place_id:
                details = self.get_place_details(place_id)
                if details:
                    return self.format_result(details, query_data, '店舗名検索')
        
        return None
    
    def search_by_name(self, store_name: str) -> Optional[Dict]:
        """店舗名でPlace IDを検索（佐渡地域限定）"""
        search_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        
        # 佐渡関連キーワードを追加した検索クエリ
        enhanced_queries = [
            f"{store_name} 佐渡",
            f"{store_name} 佐渡市",
            f"{store_name} 新潟県佐渡市",
            store_name
        ]
        
        for query in enhanced_queries:
            params = {
                'query': query,
                'location': self.sado_center,
                'radius': self.sado_radius,
                'language': 'ja',
                'key': self.api_key
            }
            
            try:
                response = requests.get(search_url, params=params)
                data = response.json()
                
                if data.get('status') == 'OK' and data.get('results'):
                    # 最も関連性の高い結果を選択
                    best_result = self.select_best_match(data['results'], store_name)
                    if best_result:
                        return best_result
                
                time.sleep(0.5)  # API制限対応
                
            except Exception as e:
                print(f"   ❌ 検索エラー ({query}): {e}")
                continue
        
        return None
    
    def select_best_match(self, results: List[Dict], target_name: str) -> Optional[Dict]:
        """最適な検索結果を選択"""
        # 1. 名前の完全一致
        for result in results:
            if result.get('name', '').lower() == target_name.lower():
                return result
        
        # 2. 名前の部分一致
        for result in results:
            result_name = result.get('name', '').lower()
            target_lower = target_name.lower()
            if target_lower in result_name or result_name in target_lower:
                return result
        
        # 3. 最初の結果を返す
        return results[0] if results else None
    
    def extract_place_id_from_url(self, url: str) -> Optional[str]:
        """URLからPlace IDを抽出"""
        # data パラメータから抽出
        if 'data=' in url:
            try:
                data_start = url.find('data=') + 5
                data_end = url.find('&', data_start)
                if data_end == -1:
                    data_end = len(url)
                
                data_param = url[data_start:data_end]
                decoded_data = unquote(data_param)
                
                # Place IDパターンを検索
                place_id_match = re.search(r'0x[0-9a-fA-F]+:0x[0-9a-fA-F]+', decoded_data)
                if place_id_match:
                    return place_id_match.group(0)
                    
            except Exception:
                pass
        
        return None
    
    def extract_coords_and_name_from_url(self, url: str) -> Tuple[Optional[str], Optional[str]]:
        """URLから座標と店舗名を抽出"""
        coords = None
        name = None
        
        # 座標抽出
        coord_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+),', url)
        if coord_match:
            lat, lng = coord_match.groups()
            coords = f"{lat},{lng}"
        
        # 店舗名抽出
        if '/maps/place/' in url:
            try:
                place_part = url.split('/maps/place/')[1].split('/')[0].split('@')[0]
                name = unquote(place_part).replace('+', ' ')
            except Exception:
                pass
        
        return coords, name
    
    def get_place_details(self, place_id: str) -> Optional[Dict]:
        """Place IDから詳細情報を取得"""
        details_url = "https://maps.googleapis.com/maps/api/place/details/json"
        
        params = {
            'place_id': place_id,
            'fields': ','.join([
                'place_id', 'name', 'formatted_address', 'geometry',
                'rating', 'user_ratings_total', 'business_status',
                'opening_hours', 'formatted_phone_number', 'website',
                'price_level', 'types'
            ]),
            'language': 'ja',
            'key': self.api_key
        }
        
        try:
            response = requests.get(details_url, params=params)
            data = response.json()
            
            if data.get('status') == 'OK':
                return data.get('result')
            else:
                print(f"❌ 詳細取得エラー: {data.get('status')}")
                return None
                
        except Exception as e:
            print(f"❌ 詳細取得例外: {e}")
            return None
    
    def format_result(self, details: Dict, query_data: Dict, method: str) -> Dict:
        """結果を整形"""
        lat, lng = format_location_data(details.get('geometry', {}).get('location', {}))
        hours_text = format_opening_hours(details.get('opening_hours', {}))
        japanese_types = translate_types(details.get('types', []))
        
        result = {
            'Place ID': details.get('place_id', ''),     # 統一：英語表記
            '店舗名': details.get('name', ''),
            '所在地': details.get('formatted_address', ''),  # 統一：所在地
            '緯度': lat,
            '経度': lng,
            '評価': details.get('rating', ''),
            'レビュー数': details.get('user_ratings_total', ''),
            '営業状況': translate_business_status(details.get('business_status', '')),
            '営業時間': hours_text,
            '電話番号': details.get('formatted_phone_number', ''),
            'ウェブサイト': details.get('website', ''),
            '価格帯': translate_price_level(details.get('price_level')),
            '店舗タイプ': ', '.join(japanese_types),
            '取得方法': method,
            '更新日時': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # クエリデータに応じて追加情報を設定
        if query_data['type'] == 'cid_url':
            result['参考CID'] = query_data.get('cid', '')
            result['期待店舗名'] = query_data.get('store_name', '')
        elif query_data['type'] == 'maps_url':
            result['元URL'] = query_data.get('url', '')
        elif query_data['type'] == 'store_name':
            result['検索キーワード'] = query_data.get('store_name', '')
        
        return result
    
    def process_all_queries(self, queries_data: List[Dict]) -> List[Dict]:
        """全クエリを処理"""
        OutputFormatter.print_section(f"{len(queries_data)}件のクエリ処理", "gear")
        
        successful = 0
        failed = 0
        
        for i, query_data in enumerate(queries_data, 1):
            query_type = query_data['type']
            
            if query_type == 'cid_url':
                store_name = query_data['store_name']
                print(f"\n📍 [{i}/{len(queries_data)}] CID URL処理: {store_name}")
                result = self.process_cid_url(query_data)
            
            elif query_type == 'maps_url':
                url = query_data['url'][:50] + '...'
                print(f"\n📍 [{i}/{len(queries_data)}] Maps URL処理: {url}")
                result = self.process_maps_url(query_data)
            
            elif query_type == 'store_name':
                store_name = query_data['store_name']
                print(f"\n📍 [{i}/{len(queries_data)}] 店舗名処理: {store_name}")
                result = self.process_store_name(query_data)
            
            else:
                print(f"\n⚠️ [{i}/{len(queries_data)}] 不明なタイプ: {query_type}")
                result = None
            
            if result:
                self.results.append(result)
                successful += 1
                actual_name = result.get('店舗名', 'Unknown')
                print(f"   ✅ 成功: {actual_name}")
            else:
                failed += 1
                print(f"   ❌ 失敗")
            
            # API制限対応
            time.sleep(self.api_delay)
        
        OutputFormatter.print_section("処理結果", "chart")
        print(f"   ✅ 成功: {successful}")
        print(f"   ❌ 失敗: {failed}")
        print(f"   📈 成功率: {successful/len(queries_data)*100:.1f}%")
        
        return self.results
    
    def save_to_spreadsheet(self, sheet_name: str = '飲食店_統合処理') -> bool:
        """結果をGoogle Sheetsに保存"""
        if not self.results:
            print("❌ 保存するデータがありません")
            return False
        
        try:
            gc = authenticate_google_sheets()
            if not gc:
                return False
                
            spreadsheet = gc.open_by_key(self.spreadsheet_id)
            
            # シートを取得または作成
            try:
                worksheet = spreadsheet.worksheet(sheet_name)
                worksheet.clear()
                print(f"📝 既存シート '{sheet_name}' を更新")
            except Exception:
                worksheet = spreadsheet.add_worksheet(
                    title=sheet_name,
                    rows=len(self.results) + 10,
                    cols=len(self.results[0]) if self.results else 20
                )
                print(f"✨ 新規シート '{sheet_name}' を作成")
            
            # DataFrameに変換して保存
            df = pd.DataFrame(self.results)
            data_to_write = [list(df.columns)] + df.values.tolist()
            worksheet.update(values=data_to_write, range_name='A1')
            
            print(f"✅ {len(self.results)}件のデータを{sheet_name}に保存")
            print(f"🔗 Spreadsheet: https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}")
            
            return True
            
        except Exception as e:
            print(f"❌ Google Sheets保存エラー: {e}")
            return False
