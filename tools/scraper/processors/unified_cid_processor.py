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
        """最適な検索結果を選択（Places API (New) v1対応）"""
        
        def get_result_name(result):
            """結果から店舗名を取得（Places API (New) v1対応）"""
            if 'displayName' in result and isinstance(result['displayName'], dict):
                return result['displayName'].get('text', '')
            return result.get('name', '')
        
        # 1. 名前の完全一致
        for result in results:
            result_name = get_result_name(result)
            if result_name.lower() == target_name.lower():
                return result
        
        # 2. 名前の部分一致
        for result in results:
            result_name = get_result_name(result).lower()
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
        
        # 座標の取得（Places API (New) v1対応）
        lat, lng = 0.0, 0.0
        if 'location' in details:
            # Places API (New) v1形式
            location = details['location']
            lat = location.get('latitude', 0.0)
            lng = location.get('longitude', 0.0)
        elif 'geometry' in details and 'location' in details['geometry']:
            # Legacy Places API形式
            lat, lng = format_location_data(details['geometry']['location'])
        
        hours_text = format_opening_hours(details.get('opening_hours', {}))
        japanese_types = translate_types(details.get('types', []))
        
        # 施設タイプを判定（フィールド名決定のため）
        is_restaurant = self._is_restaurant_data(details)
        is_parking = self._is_parking_data(details)
        is_toilet = self._is_toilet_data(details)
        
        # 適切な名称フィールド名を決定
        name_field = '店舗名'  # デフォルト（飲食店用）
        if is_parking:
            name_field = '駐車場名'
        elif is_toilet:
            name_field = '施設名'
        
        # 店舗名の取得（Places API (New) v1対応）
        store_name = ''
        if 'displayName' in details and isinstance(details['displayName'], dict):
            store_name = details['displayName'].get('text', '')
        elif 'name' in details:
            store_name = details.get('name', '')
        
        # 基本データ（共通フィールド）
        result = {
            'Place ID': details.get('id', details.get('place_id', '')),  # Places API (New) v1対応: id優先、place_id代替
            name_field: store_name,                      # 施設タイプに応じた名称フィールド（Places API (New) v1対応）
            '所在地': details.get('formattedAddress', details.get('formatted_address', '')),  # Places API (New) v1対応
            '緯度': lat,
            '経度': lng,
        }
        
        # 施設タイプ別の基本フィールド追加（優先順位: 駐車場/トイレ > 飲食店）
        if is_parking or is_toilet:
            # 駐車場・トイレの基本フィールド（headers.py定義に合わせて）
            result.update({
                '営業状況': translate_business_status(details.get('businessStatus', details.get('business_status', ''))),
            })
            # 駐車場・トイレ拡張フィールド（評価、レビュー数なども含む）
            result.update(self._format_extended_parking_toilet_data(details))
            
        elif is_restaurant:
            # 飲食店の基本フィールド
            result.update({
                '評価': details.get('rating', ''),
                'レビュー数': details.get('user_ratings_total', ''),
                '営業状況': translate_business_status(details.get('business_status', '')),
                '営業時間': hours_text,
                '電話番号': details.get('formatted_phone_number', ''),
                'ウェブサイト': details.get('website', ''),
                '価格帯': translate_price_level(details.get('price_level')),
                '店舗タイプ': ', '.join(japanese_types),
            })
            # 飲食店拡張フィールド
            result.update(self._format_extended_restaurant_data(details))
        
        # 地区とGoogleマップURLを自動設定
        result.update({
            '地区': self._determine_district(details.get('formatted_address', '')),
            'GoogleマップURL': self._generate_google_maps_url(details.get('place_id', ''))
        })
        
        # 共通メタデータ
        result.update({
            '取得方法': method,
            '最終更新日時': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
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
    
    def _is_parking_data(self, details: Dict) -> bool:
        """駐車場データかどうかを判定（Places API (New) v1対応）"""
        types = details.get('types', [])
        
        # 店舗名の取得（Places API (New) v1対応）
        name = ''
        if 'displayName' in details and isinstance(details['displayName'], dict):
            name = details['displayName'].get('text', '').lower()
        else:
            name = details.get('name', '').lower()
            
        primary_type = details.get('primaryType', '')
        
        # プライマリタイプを最優先で判定
        if primary_type == 'public_bathroom':
            return False  # トイレが主機能の場合は駐車場ではない
        if primary_type == 'parking':
            return True  # 駐車場が主機能
            
        # 飲食店・カフェタイプが含まれている場合は駐車場ではない（優先判定）
        restaurant_types = ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar', 'bakery', 'meal_delivery']
        if any(rtype in types for rtype in restaurant_types):
            return False
        
        # タイプで判定
        parking_types = ['parking']
        if any(ptype in types for ptype in parking_types):
            return True
        
        # 名称で判定（駐車場関連キーワード）- 飲食店判定後のみ
        parking_keywords = ['駐車場', 'パーキング', 'parking', '駐車']
        if any(keyword in name for keyword in parking_keywords):
            # ただし、トイレ関連キーワードや飲食関連キーワードも含む場合は慎重に判定
            toilet_keywords = ['トイレ', '公衆トイレ', '便所', 'toilet', 'restroom']
            food_keywords = ['カフェ', 'cafe', 'レストラン', 'restaurant', '店', '食堂', 'グルメ']
            has_toilet_keyword = any(keyword in name for keyword in toilet_keywords)
            has_food_keyword = any(keyword in name for keyword in food_keywords)
            if has_toilet_keyword or has_food_keyword:
                return False  # 複合施設や説明文の場合は駐車場ではない
            return True
        
        return False
    
    def _is_toilet_data(self, details: Dict) -> bool:
        """公衆トイレデータかどうかを判定（Places API (New) v1対応）"""
        types = details.get('types', [])
        
        # 店舗名の取得（Places API (New) v1対応）
        name = ''
        if 'displayName' in details and isinstance(details['displayName'], dict):
            name = details['displayName'].get('text', '').lower()
        else:
            name = details.get('name', '').lower()
            
        primary_type = details.get('primaryType', '')
        
        # プライマリタイプを最優先で判定
        if primary_type == 'public_bathroom':
            return True  # トイレが主機能
        
        # タイプで判定
        toilet_types = ['public_bathroom', 'restroom', 'toilet']
        if any(ttype in types for ttype in toilet_types):
            return True
        
        # 名称で判定（トイレ関連キーワード）
        toilet_keywords = ['トイレ', '公衆トイレ', '便所', 'toilet', 'restroom']
        if any(keyword in name for keyword in toilet_keywords):
            return True
        
        # その他の公共施設タイプ（トイレの可能性が高い）
        if 'tourist_attraction' in types and any(keyword in name for keyword in toilet_keywords):
            return True
        
        return False
    
    def _is_parking_or_toilet_data(self, details: Dict) -> bool:
        """駐車場・公衆トイレデータかどうかを判定（旧メソッド・互換性保持）"""
        return self._is_parking_data(details) or self._is_toilet_data(details)
    
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
        """Places API (New) v1 拡張データを整形（駐車場・公衆トイレ用）
        headers.pyの駐車場・トイレフィールドに完全対応
        """
        extended_data = {}
        
        # カテゴリとカテゴリ詳細を設定
        types = details.get('types', [])
        if self._is_parking_data(details):
            extended_data['カテゴリ'] = '駐車場'
            extended_data['カテゴリ詳細'] = self._get_parking_category_detail(types)
        elif self._is_toilet_data(details):
            extended_data['カテゴリ'] = '公衆トイレ'
            extended_data['カテゴリ詳細'] = self._get_toilet_category_detail(types)
        else:
            # デフォルト
            japanese_types = translate_types(types)
            if japanese_types:
                extended_data['カテゴリ'] = japanese_types[0]
                extended_data['カテゴリ詳細'] = ', '.join(japanese_types[1:]) if len(japanese_types) > 1 else ''
        
        # 施設説明
        editorial_summary = details.get('editorialSummary', {})
        if editorial_summary:
            extended_data['施設説明'] = editorial_summary.get('text', '')
        
        # 完全住所（より詳細な住所情報）
        formatted_address = details.get('formattedAddress', '')
        short_address = details.get('shortFormattedAddress', '')
        if formatted_address and formatted_address != short_address:
            extended_data['完全住所'] = formatted_address
        elif formatted_address:
            extended_data['完全住所'] = formatted_address
        
        # 詳細営業時間（営業/開放時間の詳細処理）
        opening_hours = details.get('regularOpeningHours', {})
        if opening_hours:
            weekday_text = opening_hours.get('weekdayText', [])
            if weekday_text:
                extended_data['詳細営業時間'] = '\n'.join(weekday_text)
        
        # バリアフリー対応（アクセシビリティ対応）
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
        
        # 料金体系（駐車場向け）
        if payment_options:
            if payment_options.get('acceptsCashOnly') or payment_options.get('acceptsCreditCards'):
                extended_data['料金体系'] = '有料'
            else:
                extended_data['料金体系'] = '詳細不明'
        
        # トイレ設備（駐車場向け）
        restroom = details.get('restroom')
        if restroom is not None:
            extended_data['トイレ設備'] = 'あり' if restroom else 'なし'
        
        # 施設評価（評価情報を統一フィールド名で）
        rating = details.get('rating')
        if rating:
            extended_data['施設評価'] = f"{rating} / 5.0"
        
        # レビュー数（件数フィールド）
        review_count = details.get('userRatingCount', '') or details.get('user_ratings_total', '')
        if review_count:
            extended_data['レビュー数'] = f"{review_count}件"
        
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
        
        return extended_data
    
    def _get_parking_category_detail(self, types: list) -> str:
        """駐車場のカテゴリ詳細を取得"""
        if 'tourist_attraction' in types:
            return '観光地駐車場'
        elif 'establishment' in types:
            return '一般駐車場'
        else:
            return '駐車場'
    
    def _get_toilet_category_detail(self, types: list) -> str:
        """公衆トイレのカテゴリ詳細を取得"""
        if 'tourist_attraction' in types:
            return '観光地公衆トイレ'
        elif 'point_of_interest' in types:
            return '公共公衆トイレ'
        else:
            return '公衆トイレ'
    
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
                    cols=len(self.results[0]) if self.results else 50
                )
                print(f"✨ 新規シート '{sheet_name}' を作成")
            
            # ヘッダーの順序を明示的に定義
            from config.headers import get_unified_header
            
            # シート名からカテゴリを推定してヘッダーを取得
            category = self._determine_category_from_sheet_name(sheet_name)
            expected_headers = get_unified_header(category)
            
            if not expected_headers:
                # デフォルトヘッダー（restaurants用）
                expected_headers = [
                    'Place ID', '店舗名', '所在地', '緯度', '経度', '評価', 'レビュー数', 
                    '営業状況', '営業時間', '電話番号', 'ウェブサイト', '価格帯', '店舗タイプ',
                    '店舗説明', 'テイクアウト', 'デリバリー', '店内飲食', 'カーブサイドピックアップ',
                    '予約可能', '朝食提供', '昼食提供', '夕食提供', 'ビール提供', 'ワイン提供',
                    'カクテル提供', 'コーヒー提供', 'ベジタリアン対応', 'デザート提供', '子供向けメニュー',
                    '屋外席', 'ライブ音楽', 'トイレ完備', '子供連れ歓迎', 'ペット同伴可',
                    'グループ向け', 'スポーツ観戦向け', '支払い方法', '駐車場情報', 'アクセシビリティ',
                    '地区', 'GoogleマップURL', '取得方法', '最終更新日時'
                ]
            
            # ヘッダーを設定
            data_to_write = [expected_headers]
            
            # データを適切な順序で並べ替え
            for result in self.results:
                row = []
                for header in expected_headers:
                    value = result.get(header, '')
                    # None値を空文字に変換
                    row.append(str(value) if value is not None else '')
                data_to_write.append(row)
            
            # 一括でシートに書き込み
            worksheet.update(values=data_to_write, range_name='A1')
            
            print(f"✅ {len(self.results)}件のデータを{sheet_name}に保存")
            print(f"📊 フィールド数: {len(expected_headers)}")
            print(f"🕐 最終更新日時フィールド位置: 列{len(expected_headers)}")
            print(f"🔗 Spreadsheet: https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}")
            
            return True
            
        except Exception as e:
            print(f"❌ Google Sheets保存エラー: {e}")
            return False
    
    def _determine_category_from_sheet_name(self, sheet_name: str) -> str:
        """シート名からカテゴリを推定"""
        sheet_lower = sheet_name.lower()
        
        # 駐車場関連
        if any(keyword in sheet_lower for keyword in ['parking', '駐車場', 'パーキング']):
            return 'parkings'
        
        # 公衆トイレ関連
        if any(keyword in sheet_lower for keyword in ['toilet', 'トイレ', '便所']):
            return 'toilets'
        
        # 飲食店関連（デフォルト）
        return 'restaurants'
    
    def _determine_district(self, address: str) -> str:
        """住所から佐渡市の地区を判定"""
        if not address:
            return ''
        
        # 佐渡市の公式地区分類（佐渡市公式サイト基準）
        # 参考: https://www.city.sado.niigata.jp/soshiki/2002/2359.html
        district_mapping = {
            '両津地区': [
                '両津', '河崎', '秋津', '梅津', '湊', '原黒', '北田野浦', '春日', '浜田', '加茂歌代',
                '羽吉', '椿', '北五十里', '白瀬', '玉崎', '和木', '馬首', '北松ケ崎', '平松',
                '浦川', '歌見', '黒姫', '虫崎', '両津大川', '羽二生', '両尾', '椎泊', '真木',
                '下久知', '久知河内', '城腰', '住吉', '吾潟', '立野', '上横山', '長江',
                '潟端', '下横山', '旭', '水津', '片野尾', '月布施', '野浦', '東強清水',
                '東立島', '岩首', '東鵜島', '柿野浦', '豊岡', '立間', '赤玉', '蚫',
                '北小浦', '見立', '鷲崎', '願', '北鵜島', '真更川', '両津福浦', '藻浦',
                '両津夷', '両津夷新', '両津湊', '吉井', '吉井本郷', '小田', '玉川'
            ],
            '相川地区': [
                '相川', '戸中', '北立島', '達者', '入川', '北片辺', '関', '高瀬', '橘', '稲鯨',
                '米郷', '二見', '下相川', '小川', '姫津', '北狄', '戸地', '南片辺', '石花',
                '後尾', '北川内', '高千', '小野見', '石名', '小田', '大倉', '矢柄',
                '五十浦', '岩谷口', '相川大浦',
                # 相川町内の詳細地名
                '相川水金町', '相川柴町', '相川大間町', '相川紙屋町', '相川炭屋町', '相川濁川町',
                '相川坂下町', '相川北沢町', '相川下山之神町', '相川柄杓町', '相川奈良町', '奈良町',
                '相川嘉左衛門町', '相川清右衛門町', '相川銀山町', '相川小右衛門町', '相川勘四郎町',
                '上相川町', '相川五郎右衛門町', '相川宗徳町', '相川庄右衛門町', '相川次助町',
                '相川諏訪町', '相川大工町', '相川新五郎町', '相川六右衛門町', '相川上京町',
                '相川左門町', '相川大床屋町', '相川中京町', '相川下京町', '相川八百屋町',
                '相川会津町', '相川味噌屋町', '相川米屋町', '相川夕白町', '相川弥十郎町',
                '相川四十物町', '相川広間町', '相川西坂町', '相川長坂町', '相川上寺町',
                '相川中寺町', '相川下寺町', '相川南沢町', '相川小六町', '相川新西坂町',
                '相川石扣町', '相川塩屋町', '相川板町', '相川材木町', '相川新材木町',
                '相川羽田町', '相川江戸沢町', '相川一町目', '相川一町目裏町', '相川一町目浜町',
                '相川二町目', '相川五郎左衛門町', '相川二町目浜町', '相川二町目新浜町',
                '相川三町目', '相川三町目浜町', '相川三町目新浜町', '相川四町目',
                '相川四町目浜町', '相川市町', '相川新浜町', '相川馬町', '相川羽田村',
                '相川下戸町', '相川下戸浜町', '相川下戸炭屋町', '相川下戸炭屋裏町',
                '相川下戸炭屋浜町', '相川海士町', '相川下戸村', '相川鹿伏', '相川栄町'
            ],
            '佐和田地区': [
                '佐和田', '沢根', '窪田', '中原', '河原田', '八幡', '八幡新町', '八幡町',
                '河原田本町', '河原田諏訪町', '鍛冶町', '石田', '上長木', '下長木', '長木',
                '上矢馳', '二宮', '市野沢', '真光寺', '山田', '青野', '東大通', 
                '沢根五十里', '沢根篭町', '沢根炭屋町', '沢根町'
            ],
            '金井地区': [
                '金井', '千種', '吉井', '泉', '中興', '平清水', '金井新保', '貝塚',
                '大和', '吉井本郷', '安養寺', '三瀬川', '水渡田'
            ],
            '新穂地区': [
                '新穂', '新穗', '大野', '下新穂', '舟下', '皆川', '新穂皆川', '新穂舟下', '新穂武井',
                '新穂大野', '新穂井内', '上新穂', '新穂瓜生屋', '新穂正明寺', '新穂田野沢',
                '新穂潟上', '新穂青木', '新穂長畝', '新穂北方'
            ],
            '畑野地区': [
                '畑野', '宮川', '栗野江', '目黒町', '三宮', '松ケ崎', '多田', '寺田', '飯持',
                '畉田', '大久保', '猿八', '小倉', '長谷', '坊ケ浦', '浜河内', '丸山'
            ],
            '真野地区': [
                '真野', '豊田', '四日町', '吉岡', '大小', '金丸', '長石', '真野新町', '滝脇',
                '背合', '大須', '静平', '下黒山', '真野大川', '名古屋', '国分寺', '竹田',
                '阿仏坊', '阿佛坊', '大倉谷', '田切須', '西三川', '椿尾'
            ],
            '小木地区': [
                '小木', '宿根木', '深浦', '田野浦', '強清水', '小木町', '小木木野浦', '小比叡',
                '小木堂釜', '井坪', '小木大浦', '木流', '江積', '沢崎', '犬神平',
                '小木強清水', '琴浦', '小木金田新田'
            ],
            '羽茂地区': [
                '羽茂', '大石', '羽茂本郷', '羽茂三瀬', '亀脇', '羽茂滝平', '羽茂大崎',
                '羽茂飯岡', '羽茂上山田', '羽茂大橋', '羽茂大石', '羽茂村山', '羽茂亀脇',
                '羽茂小泊'
            ],
            '赤泊地区': [
                '赤泊', '徳和', '柳沢', '莚場', '大杉', '杉野浦', '南新保', '真浦', 
                '三川', '外山', '上川茂', '下川茂'
            ]
        }
        
        # 住所から地区を判定
        for district, areas in district_mapping.items():
            for area in areas:
                if area in address:
                    return district
        
        # 佐渡市以外の場合は「市外」
        if '佐渡市' not in address:
            return '市外'
        
        # 判定できない場合は空文字
        return ''
    
    def _generate_google_maps_url(self, place_id: str) -> str:
        """Place IDからGoogleマップURLを生成"""
        if not place_id:
            return ''
        
        # GoogleマップのPlace ID URL形式（確実に場所に移動する形式）
        return f"https://www.google.com/maps/place/?q=place_id:{place_id}"
