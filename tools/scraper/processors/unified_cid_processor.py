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
        """結果を整形（Places API New v1 拡張フィールド対応）"""
        lat, lng = format_location_data(details.get('geometry', {}).get('location', {}))
        hours_text = format_opening_hours(details.get('opening_hours', {}))
        japanese_types = translate_types(details.get('types', []))
        
        # 基本データ
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
        }
        
        # Places API (New) v1 拡張フィールド（飲食店のみ）
        if self._is_restaurant_data(details):
            result.update(self._format_extended_restaurant_data(details))
        # 駐車場・公衆トイレの拡張フィールド
        elif self._is_parking_or_toilet_data(details):
            result.update(self._format_extended_parking_toilet_data(details))
        
        # 共通メタデータ
        result.update({
            '取得方法': method,
            '更新日時': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        
        # クエリデータに応じて追加情報を設定
        if query_data['type'] == 'cid_url':
            result['参考CID'] = query_data.get('cid', '')
            result['期待店舗名'] = query_data.get('store_name', '')
        elif query_data['type'] == 'maps_url':
            result['元URL'] = query_data.get('url', '')
        elif query_data['type'] == 'store_name':
            result['検索キーワード'] = query_data.get('store_name', '')
        
        return result
    
    def _is_restaurant_data(self, details: Dict) -> bool:
        """飲食店データかどうかを判定"""
        types = details.get('types', [])
        restaurant_types = [
            'restaurant', 'food', 'meal_takeaway', 'cafe', 'bar', 
            'bakery', 'meal_delivery', 'establishment'
        ]
        return any(rtype in types for rtype in restaurant_types)
    
    def _is_parking_or_toilet_data(self, details: Dict) -> bool:
        """駐車場・公衆トイレデータかどうかを判定"""
        types = details.get('types', [])
        parking_toilet_types = [
            'parking', 'tourist_attraction', 'point_of_interest', 
            'establishment', 'sublocality'
        ]
        return any(ptype in types for ptype in parking_toilet_types)
    
    def _format_extended_restaurant_data(self, details: Dict) -> Dict:
        """Places API (New) v1 拡張データを整形（飲食店用）"""
        extended_data = {}
        
        # 店舗説明
        editorial_summary = details.get('editorialSummary', {})
        if editorial_summary:
            extended_data['店舗説明'] = editorial_summary.get('text', '')
        
        # サービス対応状況（ブール値を日本語に変換）
        service_fields = {
            'takeout': 'テイクアウト',
            'delivery': 'デリバリー', 
            'dineIn': '店内飲食',
            'curbsidePickup': 'カーブサイドピックアップ',
            'reservable': '予約可能'
        }
        
        for field, japanese_name in service_fields.items():
            value = details.get(field)
            if value is not None:
                extended_data[japanese_name] = '可能' if value else '不可'
        
        # 食事時間帯対応
        meal_fields = {
            'servesBreakfast': '朝食提供',
            'servesLunch': '昼食提供', 
            'servesDinner': '夕食提供'
        }
        
        for field, japanese_name in meal_fields.items():
            value = details.get(field)
            if value is not None:
                extended_data[japanese_name] = '提供' if value else '非提供'
        
        # アルコール・飲み物対応
        beverage_fields = {
            'servesBeer': 'ビール提供',
            'servesWine': 'ワイン提供',
            'servesCocktails': 'カクテル提供',
            'servesCoffee': 'コーヒー提供'
        }
        
        for field, japanese_name in beverage_fields.items():
            value = details.get(field)
            if value is not None:
                extended_data[japanese_name] = '提供' if value else '非提供'
        
        # 特別対応・設備
        facility_fields = {
            'servesVegetarianFood': 'ベジタリアン対応',
            'servesDessert': 'デザート提供',
            'menuForChildren': '子供向けメニュー',
            'outdoorSeating': '屋外席',
            'liveMusic': 'ライブ音楽',
            'restroom': 'トイレ完備',
            'goodForChildren': '子供連れ歓迎',
            'allowsDogs': 'ペット同伴可',
            'goodForGroups': 'グループ向け',
            'goodForWatchingSports': 'スポーツ観戦向け'
        }
        
        for field, japanese_name in facility_fields.items():
            value = details.get(field)
            if value is not None:
                extended_data[japanese_name] = '対応' if value else '非対応'
        
        # 支払い方法（オブジェクト形式の場合）
        payment_options = details.get('paymentOptions', {})
        if payment_options:
            payment_methods = []
            if payment_options.get('acceptsCreditCards'):
                payment_methods.append('クレジットカード')
            if payment_options.get('acceptsDebitCards'):
                payment_methods.append('デビットカード')
            if payment_options.get('acceptsCashOnly'):
                payment_methods.append('現金のみ')
            if payment_options.get('acceptsNfc'):
                payment_methods.append('NFC決済')
            
            if payment_methods:
                extended_data['支払い方法'] = ', '.join(payment_methods)
        
        # 駐車場オプション
        parking_options = details.get('parkingOptions', {})
        if parking_options:
            parking_info = []
            if parking_options.get('freeParking'):
                parking_info.append('無料駐車場')
            if parking_options.get('paidParking'):
                parking_info.append('有料駐車場')
            if parking_options.get('valetParking'):
                parking_info.append('バレーパーキング')
            
            if parking_info:
                extended_data['駐車場情報'] = ', '.join(parking_info)
        
        # アクセシビリティ
        accessibility_options = details.get('accessibilityOptions', {})
        if accessibility_options:
            accessibility_info = []
            if accessibility_options.get('wheelchairAccessibleEntrance'):
                accessibility_info.append('車椅子対応入口')
            if accessibility_options.get('wheelchairAccessibleParking'):
                accessibility_info.append('車椅子対応駐車場')
            if accessibility_options.get('wheelchairAccessibleRestroom'):
                accessibility_info.append('車椅子対応トイレ')
            if accessibility_options.get('wheelchairAccessibleSeating'):
                accessibility_info.append('車椅子対応席')
            
            if accessibility_info:
                extended_data['アクセシビリティ'] = ', '.join(accessibility_info)
        
        return extended_data
    
    def _format_extended_parking_toilet_data(self, details: Dict) -> Dict:
        """Places API (New) v1 拡張データを整形（駐車場・公衆トイレ用）"""
        extended_data = {}
        
        # 施設説明
        editorial_summary = details.get('editorialSummary', {})
        if editorial_summary:
            extended_data['施設説明'] = editorial_summary.get('text', '')
        
        # 完全住所（より詳細な住所情報）
        formatted_address = details.get('formattedAddress', '')
        if formatted_address and formatted_address != details.get('shortFormattedAddress', ''):
            extended_data['完全住所'] = formatted_address
        
        # 営業/開放時間の詳細処理
        opening_hours = details.get('regularOpeningHours', {})
        if opening_hours:
            weekday_text = opening_hours.get('weekdayText', [])
            if weekday_text:
                extended_data['詳細営業時間'] = '\n'.join(weekday_text)
        
        # アクセシビリティ対応（駐車場・公衆トイレ特化）
        accessibility_options = details.get('accessibilityOptions', {})
        if accessibility_options:
            accessibility_info = []
            
            # 駐車場関連
            if accessibility_options.get('wheelchairAccessibleParking'):
                accessibility_info.append('車椅子対応駐車場')
            if accessibility_options.get('wheelchairAccessibleEntrance'):
                accessibility_info.append('車椅子対応入口')
            
            # トイレ関連
            if accessibility_options.get('wheelchairAccessibleRestroom'):
                accessibility_info.append('車椅子対応トイレ')
            
            if accessibility_info:
                extended_data['バリアフリー対応'] = ', '.join(accessibility_info)
        
        # 支払い方法（主に駐車場向け）
        payment_options = details.get('paymentOptions', {})
        if payment_options:
            payment_methods = []
            if payment_options.get('acceptsCreditCards'):
                payment_methods.append('クレジットカード')
            if payment_options.get('acceptsDebitCards'):
                payment_methods.append('デビットカード')
            if payment_options.get('acceptsCashOnly'):
                payment_methods.append('現金のみ')
            if payment_options.get('acceptsNfc'):
                payment_methods.append('NFC決済')
            
            if payment_methods:
                extended_data['支払い方法'] = ', '.join(payment_methods)
            elif payment_options:
                # 無料駐車場の場合
                extended_data['料金体系'] = '詳細不明'
        
        # トイレ設備（駐車場向け）
        restroom = details.get('restroom')
        if restroom is not None:
            extended_data['トイレ設備'] = 'あり' if restroom else 'なし'
        
        # 子供連れ対応（公衆トイレ向け）
        good_for_children = details.get('goodForChildren')
        if good_for_children is not None:
            extended_data['子供連れ対応'] = '対応' if good_for_children else '非対応'
        
        # 駐車場併設情報（公衆トイレ向け）
        parking_options = details.get('parkingOptions', {})
        if parking_options:
            parking_info = []
            if parking_options.get('freeParking'):
                parking_info.append('無料駐車場併設')
            if parking_options.get('paidParking'):
                parking_info.append('有料駐車場併設')
            
            if parking_info:
                extended_data['駐車場併設'] = ', '.join(parking_info)
        
        # 評価情報
        rating = details.get('rating')
        if rating:
            extended_data['施設評価'] = f"{rating} / 5.0"
        
        review_count = details.get('userRatingCount')
        if review_count:
            extended_data['レビュー数'] = f"{review_count}件"
        
        return extended_data
    
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
