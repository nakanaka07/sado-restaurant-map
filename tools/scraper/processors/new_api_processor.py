#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新しいAPIクライアント対応 統合プロセッサー

Places API (New) v1を使用した最新版処理システム
バージョン: v3.0 (2025年8月9日)
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
from utils.translators import translate_business_status, translate_types

class NewAPIProcessor:
    """新しいAPIクライアント対応統合プロセッサー"""
    
    def __init__(self):
        """初期化"""
        self.api_key = get_places_api_key()
        self.spreadsheet_id = get_spreadsheet_id()
        self.client = PlacesAPIClient(self.api_key)
        self.spreadsheet_manager = SpreadsheetManager(self.spreadsheet_id)
        self.results = []
        self.failed_queries = []
        
        print(f"✅ API Key: ***{self.api_key[-4:]} (末尾4文字)")
        print(f"✅ Spreadsheet ID: ***{self.spreadsheet_id[-4:]} (末尾4文字)")
        
        # 佐渡島の境界
        self.SADO_BOUNDS = {
            'north': 38.39,
            'south': 37.74,
            'east': 138.62,
            'west': 137.85
        }
    
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
            '電話番号': place.get('nationalPhoneNumber', '情報なし'),
            'ウェブサイト': place.get('websiteUri', '公式サイトなし'),
            '価格帯': self.translate_price_level(place.get('priceLevel')) or '価格情報なし',
            '店舗タイプ': ', '.join(translate_types(place.get('types', []))),
            '店舗説明': self.get_store_description(place),
            'テイクアウト': '可' if place.get('takeout') else '不可',
            'デリバリー': '可' if place.get('delivery') else '不可',
            '店内飲食': '可' if place.get('dineIn') else '不可',
            '朝食提供': '可' if place.get('servesBreakfast') else '不可',
            '昼食提供': '可' if place.get('servesLunch') else '不可',
            '夕食提供': '可' if place.get('servesDinner') else '不可',
            '地区': '未分類',  # 後で分類
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
    
    def format_editorial_summary(self, editorial_summary: Optional[Dict]) -> str:
        """店舗説明をフォーマット"""
        if not editorial_summary:
            return ''
        
        # editorialSummaryは通常 {'text': '説明文', 'languageCode': 'ja'} の形式
        if isinstance(editorial_summary, dict):
            return editorial_summary.get('text', '')
        elif isinstance(editorial_summary, str):
            return editorial_summary
        else:
            return ''
    
    def generate_description_from_data(self, place: Dict) -> str:
        """店舗データから説明文を生成（editorialSummaryが空の場合の代替）"""
        try:
            parts = []
            
            # 店舗タイプから説明
            types = place.get('types', [])
            translated_types = translate_types(types)
            if translated_types:
                main_type = translated_types[0]
                parts.append(f"{main_type}です")
            
            # 評価情報
            rating = place.get('rating')
            review_count = place.get('userRatingCount')
            if rating and review_count:
                parts.append(f"評価{rating}（{review_count}件のレビュー）")
            
            # 価格帯
            price_level = self.translate_price_level(place.get('priceLevel'))
            if price_level:
                parts.append(f"価格帯は{price_level}です")
            
            # 営業形態
            services = []
            if place.get('dineIn'):
                services.append('店内飲食')
            if place.get('takeout'):
                services.append('テイクアウト')
            if place.get('delivery'):
                services.append('デリバリー')
            
            if services:
                parts.append(f"{', '.join(services)}に対応")
            
            # 住所から地区情報
            address = place.get('formattedAddress', '')
            if '佐渡' in address:
                parts.append("佐渡島にあります")
            
            return '。'.join(parts) + '。' if parts else ''
            
        except Exception:
            return ''
    
    def get_store_description(self, place: Dict) -> str:
        """店舗説明を取得（優先順位付き）"""
        # 1. Google編集者による説明（最優先）
        editorial = self.format_editorial_summary(place.get('editorialSummary'))
        if editorial:
            return editorial
        
        # 2. 自動生成説明（代替）
        generated = self.generate_description_from_data(place)
        if generated:
            return generated
        
        # 3. 最低限の情報
        store_name = place.get('displayName', {}).get('text', '')
        types = place.get('types', [])
        if types:
            translated_types = translate_types(types)
            if translated_types:
                return f"{store_name}は{translated_types[0]}です。"
        
        return f"{store_name}の詳細情報。"
    
    def separate_sado_data(self, results: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """佐渡市内・市外データを分離"""
        sado_results = []
        outside_results = []
        
        for result in results:
            try:
                lat = float(result.get('緯度', 0))
                lng = float(result.get('経度', 0))
                
                # 佐渡島内判定
                if (self.SADO_BOUNDS['south'] <= lat <= self.SADO_BOUNDS['north'] and
                    self.SADO_BOUNDS['west'] <= lng <= self.SADO_BOUNDS['east']):
                    
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
            print("❌ 保存するデータがありません")
            return False
        
        try:
            if separate_location:
                # 地区分類処理
                print("🗾 佐渡市内・市外データ分離を実行中...")
                sado_results, outside_results = self.separate_sado_data(self.results)
                
                # メインシート（佐渡島内）
                if sado_results:
                    success_main = self.save_data_to_sheet(sado_results, sheet_name)
                    if success_main:
                        print(f"   ✅ {sheet_name}: {len(sado_results)}件保存完了")
                    else:
                        print(f"   ❌ {sheet_name}: 保存失敗")
                
                # 佐渡市外シート
                if outside_results:
                    outside_sheet_name = f"{sheet_name}_佐渡市外"
                    success_outside = self.save_data_to_sheet(outside_results, outside_sheet_name)
                    if success_outside:
                        print(f"   ✅ {outside_sheet_name}: {len(outside_results)}件保存完了")
                    else:
                        print(f"   ❌ {outside_sheet_name}: 保存失敗")
                
                return (sado_results and success_main) or (outside_results and success_outside)
            else:
                # 分離なしで保存
                success = self.save_data_to_sheet(self.results, sheet_name)
                if success:
                    print(f"   ✅ {sheet_name}: {len(self.results)}件保存完了")
                else:
                    print(f"   ❌ {sheet_name}: 保存失敗")
                return success
            
        except Exception as e:
            print(f"❌ スプレッドシート保存エラー: {e}")
            return False
    
    def save_data_to_sheet(self, data: List[Dict], sheet_name: str) -> bool:
        """データをシートに保存"""
        if not data:
            print(f"   ⚠️ {sheet_name}: 保存データなし")
            return False
        
        try:
            # DataFrame作成
            df = pd.DataFrame(data)
            
            # スプレッドシートマネージャーの保存メソッドを呼び出し
            try:
                # 既存メソッドを確認して使用
                if hasattr(self.spreadsheet_manager, 'save_unified_data'):
                    self.spreadsheet_manager.save_unified_data(data, sheet_name, clear_existing=True)
                    return True
                elif hasattr(self.spreadsheet_manager, 'save_to_sheet'):
                    self.spreadsheet_manager.save_to_sheet(data, sheet_name, clear_existing=True)
                    return True
                else:
                    # 代替保存処理
                    print(f"   ⚠️ {sheet_name}: 標準保存メソッドが見つかりません")
                    return self.save_data_alternative(data, sheet_name)
                    
            except Exception as save_error:
                print(f"   ❌ {sheet_name} 保存エラー: {save_error}")
                return False
                
        except Exception as e:
            print(f"   ❌ {sheet_name} データ処理エラー: {e}")
            return False
    
    def save_data_alternative(self, data: List[Dict], sheet_name: str) -> bool:
        """代替保存処理"""
        try:
            # CSV形式で一時保存（デバッグ用）
            df = pd.DataFrame(data)
            csv_path = f"output_{sheet_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            df.to_csv(csv_path, index=False, encoding='utf-8-sig')
            print(f"   📁 CSV保存: {csv_path}")
            return True
        except Exception as e:
            print(f"   ❌ CSV保存エラー: {e}")
            return False
