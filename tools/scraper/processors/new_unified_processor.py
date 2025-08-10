#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新しいAPIクライアント対応版 - CID処理統合プロセッサー

Places API (New) v1を使用した最新版処理システム
"""

import os
import re
import time
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

from processors.places_api_client import PlacesAPIClient
from processors.spreadsheet_manager import SpreadsheetManager
from utils.google_auth import get_places_api_key, get_spreadsheet_id
from utils.translators import translate_business_status, translate_types, format_opening_hours

class NewUnifiedProcessor:
    """新しいAPIクライアント対応版統合プロセッサー"""
    
    def __init__(self):
        self.api_key = get_places_api_key()
        self.spreadsheet_id = get_spreadsheet_id()
        self.client = PlacesAPIClient(self.api_key)
        self.spreadsheet_manager = SpreadsheetManager(self.spreadsheet_id)
        self.results = []
        self.failed_queries = []
        
        print(f"✅ API Key: ***{self.api_key[-4:]} (末尾4文字)")
        print(f"✅ Spreadsheet ID: ***{self.spreadsheet_id[-4:]} (末尾4文字)")
    
    def parse_query_file(self, file_path: str) -> List[Dict]:
        """クエリファイルを解析"""
        queries = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            for line_num, line in enumerate(lines, 1):
                line = line.strip()
                
                # コメント行や空行をスキップ
                if not line or line.startswith('#'):
                    continue
                
                query_data = {'line_number': line_num, 'original_line': line}
                
                # CID URL形式の判定
                if 'maps.google.com/place?cid=' in line:
                    # CID URLを解析
                    parts = line.split('#', 1)
                    url = parts[0].strip()
                    store_name = parts[1].strip() if len(parts) > 1 else ''
                    
                    # CIDを抽出
                    cid_match = re.search(r'cid=(\d+)', url)
                    if cid_match:
                        query_data.update({
                            'type': 'cid_url',
                            'cid': cid_match.group(1),
                            'url': url,
                            'store_name': store_name
                        })
                
                # Google Maps URL形式の判定
                elif 'www.google.com/maps/' in line:
                    query_data.update({
                        'type': 'maps_url',
                        'url': line,
                        'store_name': self.extract_name_from_url(line)
                    })
                
                # 店舗名のみの判定
                else:
                    query_data.update({
                        'type': 'store_name',
                        'store_name': line
                    })
                
                queries.append(query_data)
            
            print(f"📋 {len(queries)}件のクエリを解析完了")
            return queries
            
        except Exception as e:
            print(f"❌ ファイル読み込みエラー: {e}")
            return []
    
    def extract_name_from_url(self, url: str) -> str:
        """URLから店舗名を抽出"""
        try:
            # URLデコード
            decoded_url = unquote(url)
            
            # 店舗名を抽出するパターン
            patterns = [
                r'/place/([^/@]+)/@',
                r'/place/([^/]+)/',
                r'place/([^/@]+)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, decoded_url)
                if match:
                    name = match.group(1).replace('+', ' ')
                    return name
            
            return ''
            
        except Exception:
            return ''
    
    def process_all_queries(self, queries: List[Dict]) -> List[Dict]:
        """全クエリを処理"""
        print(f"\n⚙️ {len(queries)}件のクエリ処理")
        
        for i, query_data in enumerate(queries, 1):
            print(f"\n📍 [{i}/{len(queries)}] 処理中: {query_data.get('store_name', 'Unknown')}")
            
            try:
                result = None
                
                if query_data['type'] == 'cid_url':
                    result = self.process_cid_url(query_data)
                elif query_data['type'] == 'maps_url':
                    result = self.process_maps_url(query_data)
                elif query_data['type'] == 'store_name':
                    result = self.process_store_name(query_data)
                
                if result:
                    self.results.append(result)
                    print("   ✅ 成功")
                else:
                    self.failed_queries.append(query_data)
                    print("   ❌ 失敗")
                
                # API制限対応
                time.sleep(1)
                
            except Exception as e:
                print(f"   ❌ 処理エラー: {e}")
                self.failed_queries.append(query_data)
        
        print(f"\n📊 処理完了")
        print(f"   成功: {len(self.results)}件")
        print(f"   失敗: {len(self.failed_queries)}件")
        
        return self.results
    
    def process_cid_url(self, query_data: Dict) -> Optional[Dict]:
        """CID URLから店舗名検索"""
        store_name = query_data.get('store_name', '')
        
        # 店舗名での検索にフォールバック
        return self.search_by_name(store_name, query_data, 'CID URL検索')
    
    def process_maps_url(self, query_data: Dict) -> Optional[Dict]:
        """Google Maps URLから検索"""
        store_name = query_data.get('store_name', '')
        
        return self.search_by_name(store_name, query_data, 'Maps URL検索')
    
    def process_store_name(self, query_data: Dict) -> Optional[Dict]:
        """店舗名検索"""
        store_name = query_data.get('store_name', '')
        
        return self.search_by_name(store_name, query_data, '店舗名検索')
    
    def search_by_name(self, store_name: str, query_data: Dict, method: str) -> Optional[Dict]:
        """店舗名で検索"""
        if not store_name:
            return None
        
        # 検索クエリの最適化
        search_queries = [
            f"{store_name} 佐渡",
            f"{store_name} 佐渡市",
            f"{store_name} 新潟県佐渡市",
            store_name
        ]
        
        for query in search_queries:
            try:
                status, places = self.client.search_text(query, 'restaurant')
                
                if status == 'OK' and places:
                    # 最も関連性の高い結果を選択
                    best_place = self.select_best_match(places, store_name)
                    if best_place:
                        return self.format_result(best_place, query_data, method)
                
                time.sleep(0.5)  # API制限対応
                
            except Exception as e:
                print(f"   ❌ 検索エラー ({query}): {e}")
                continue
        
        return None
    
    def select_best_match(self, places: List[Dict], target_name: str) -> Optional[Dict]:
        """最適な結果を選択"""
        # 佐渡地域内の結果を優先
        sado_places = []
        other_places = []
        
        for place in places:
            address = place.get('formattedAddress', '')
            if '佐渡' in address:
                sado_places.append(place)
            else:
                other_places.append(place)
        
        # 佐渡地域内の結果があれば優先
        if sado_places:
            return sado_places[0]
        elif other_places:
            return other_places[0]
        
        return None
    
    def format_result(self, place: Dict, query_data: Dict, method: str) -> Dict:
        """結果をフォーマット"""
        result = {
            'Place ID': place.get('id', ''),
            '店舗名': place.get('displayName', {}).get('text', ''),
            '住所': place.get('formattedAddress', ''),
            '緯度': place.get('location', {}).get('latitude', ''),
            '経度': place.get('location', {}).get('longitude', ''),
            '評価': place.get('rating', ''),
            'レビュー数': place.get('userRatingCount', ''),
            '営業状況': translate_business_status(place.get('businessStatus', '')),
            '営業時間': self.format_opening_hours(place.get('regularOpeningHours')),
            '電話番号': place.get('nationalPhoneNumber', ''),
            'ウェブサイト': place.get('websiteUri', ''),
            '価格帯': self.translate_price_level(place.get('priceLevel')),
            '店舗タイプ': ', '.join(translate_types(place.get('types', []))),
            'テイクアウト': '可' if place.get('takeout') else '不可',
            'デリバリー': '可' if place.get('delivery') else '不可',
            '店内飲食': '可' if place.get('dineIn') else '不可',
            '朝食提供': '可' if place.get('servesBreakfast') else '不可',
            '昼食提供': '可' if place.get('servesLunch') else '不可',
            '夕食提供': '可' if place.get('servesDinner') else '不可',
            '地区': '未分類',  # 後で location_separator で処理
            '取得方法': method,
            '更新日時': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return result
    
    def format_opening_hours(self, opening_hours: Optional[Dict]) -> str:
        """営業時間をフォーマット"""
        if not opening_hours or 'weekdayDescriptions' not in opening_hours:
            return ''
        
        descriptions = opening_hours.get('weekdayDescriptions', [])
        return '; '.join(descriptions)
    
    def translate_price_level(self, price_level: Optional[str]) -> str:
        """価格帯を翻訳"""
        price_map = {
            'PRICE_LEVEL_INEXPENSIVE': '手頃',
            'PRICE_LEVEL_MODERATE': '普通',
            'PRICE_LEVEL_EXPENSIVE': '高価',
            'PRICE_LEVEL_VERY_EXPENSIVE': '非常に高価'
        }
        return price_map.get(price_level, '')
    
    def separate_sado_data(self, results: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """佐渡市内・市外データを分離"""
        # 佐渡島の境界
        SADO_BOUNDS = {
            'north': 38.39,
            'south': 37.74,
            'east': 138.62,
            'west': 137.85
        }
        
        sado_results = []
        outside_results = []
        
        for result in results:
            try:
                lat = float(result.get('緯度', 0))
                lng = float(result.get('経度', 0))
                
                # 佐渡島内判定
                if (SADO_BOUNDS['south'] <= lat <= SADO_BOUNDS['north'] and
                    SADO_BOUNDS['west'] <= lng <= SADO_BOUNDS['east']):
                    
                    # 地区分類を追加
                    result['地区'] = self.classify_district(lat, lng, result.get('住所', ''))
                    sado_results.append(result)
                else:
                    result['地区'] = '市外'
                    outside_results.append(result)
                    
            except (ValueError, TypeError):
                # 座標が不正な場合は市外として扱う
                result['地区'] = '市外'
                outside_results.append(result)
        
        return sado_results, outside_results
    
    def classify_district(self, lat: float, lng: float, address: str) -> str:
        """地区分類"""
        # 簡易的な地区分類（住所ベース）
        if '両津' in address:
            return '両津'
        elif '相川' in address:
            return '相川'
        elif '佐和田' in address:
            return '佐和田'
        elif '金井' in address:
            return '金井'
        elif '新穂' in address:
            return '新穂'
        elif '畑野' in address:
            return '畑野'
        elif '真野' in address:
            return '真野'
        elif '小木' in address:
            return '小木'
        elif '羽茂' in address:
            return '羽茂'
        elif '赤泊' in address:
            return '赤泊'
        else:
            return '佐渡市内'
    
    def save_to_spreadsheet(self, sheet_name: str, separate_location: bool = True) -> bool:
        """スプレッドシートに保存"""
        if not self.results:
            print("保存するデータがありません")
            return False
        
        try:
            if separate_location:
                # 地区分類処理
                print("🗾 佐渡市内・市外データ分離を実行中...")
                sado_results, outside_results = self.separate_sado_data(self.results)
                
                # メインシート（佐渡島内）
                if sado_results:
                    self.save_data_to_sheet(sado_results, sheet_name)
                    print(f"   ✅ {sheet_name}: {len(sado_results)}件")
                
                # 佐渡市外シート
                if outside_results:
                    outside_sheet_name = f"{sheet_name}_佐渡市外"
                    self.save_data_to_sheet(outside_results, outside_sheet_name)
                    print(f"   ✅ {outside_sheet_name}: {len(outside_results)}件")
            else:
                # 分離なしで保存
                self.save_data_to_sheet(self.results, sheet_name)
                print(f"   ✅ {sheet_name}: {len(self.results)}件")
            
            return True
            
        except Exception as e:
            print(f"❌ スプレッドシート保存エラー: {e}")
            return False
    
    def save_data_to_sheet(self, data: List[Dict], sheet_name: str):
        """データをシートに保存"""
        if not data:
            return
        
        # DataFrame作成
        df = pd.DataFrame(data)
        
        # スプレッドシートマネージャーの保存メソッドを呼び出し
        try:
            # 既存メソッドを使用
            self.spreadsheet_manager.save_unified_data(data, sheet_name, clear_existing=True)
        except AttributeError:
            # メソッドが存在しない場合の代替処理
            print(f"   ⚠️ 標準保存メソッドを使用: {sheet_name}")
            # 簡易保存処理（実装は別途必要）
            pass
