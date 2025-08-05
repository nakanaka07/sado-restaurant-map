#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Data Validator - データ検証・変換専用クラス

このモジュールはGoogle Places APIレスポンスの検証・変換・正規化を管理します。
places_data_updater.py から抽出されたデータ処理機能を統合・最適化。

Features:
- Places APIレスポンス検証
- 住所正規化
- 地区分類（佐渡市公式基準）
- 緯度経度による佐渡島内判定
- データ品質チェック
- フォーマット統一
"""

import re
import time
from typing import List, Dict, Tuple, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ValidationResult:
    """検証結果クラス"""
    is_valid: bool
    data: Dict[str, Any]
    errors: List[str]
    warnings: List[str]
    district: str


@dataclass
class SadoBounds:
    """佐渡島の境界座標"""
    north: float = 38.39
    south: float = 37.74
    east: float = 138.62
    west: float = 137.85


class DataValidator:
    """Places APIデータ検証・変換クラス"""
    
    def __init__(self):
        """初期化"""
        self.bounds = SadoBounds()
        self.district_mapping = self._load_district_mapping()
        self.sado_keywords = [
            '佐渡市', '佐渡', '新潟県佐渡', '両津', '相川', '佐和田', '金井', 
            '新穂', '畑野', '真野', '小木', '羽茂', '赤泊'
        ]
    
    def _load_district_mapping(self) -> Dict[str, List[str]]:
        """佐渡市公式地区分類マッピングを読み込み"""
        return {
            '両津地区': [
                '両津', '河崎', '湊', '秋津', '和木', '原黒', '水津', '小川', '梅津',
                '東強清水', '小田', '両津福浦', '玉川', '立野', '両津夷', '両津夷新',
                '上横山', '中津', '下戸', '真木', '旭', '城腰', '中興乙', '青野', '蚫',
                '東立島', '浦川', '月布施', '北片辺', '南片辺', '北立島', '羽二生', '大川',
                '黒山', '湖畔', '野浦', '住吉', '下戸炭屋', '両津福浦一丁目', '両津福浦二丁目',
                '夷', '川茂', '山田', '久知河内', '両津湊', '古津'
            ],
            '相川地区': [
                '相川', '下相川', '相川一町目', '相川二町目', '相川三町目', '相川四町目',
                '相川五町目', '相川六町目', '相川栄町', '相川濁川町', '相川塩屋町',
                '相川上町', '高山', '北鵜島', '鷲崎', '関', '五十里', '下戸村',
                '大立', '小川', '北狄', '海士町', '姫津', '戸中', '石花', '稲鯨',
                '橘', '岩首', '戸地', '和田', '沢根', '沢根五十里', '入川', '相川下戸',
                '相川米屋町', '相川羽田町', '相川下戸炭屋二町目', '相川大浦', '小野見',
                '達者', '銀山町', '左沢', '相川材木町', '窪田', '相川諏訪町'
            ],
            '佐和田地区': [
                '佐和田', '市野沢', '真光寺', '西山', '中原', '沢根篭町', '八幡町',
                '八幡', '河原田', '河原田本町', '河原田諏訪町', '石田', '真野湾',
                '市野沢', '大和田', '二宮', '沢根', '沢根炭屋町', '窪田', '市野沢'
            ],
            '金井地区': [
                '金井', '千種', '吉井', '泉', '中興', '平清水', '金井新保', '貝塚',
                '大和', '吉井本郷', '安養寺', '三瀬川', '水渡田'
            ],
            '新穂地区': [
                '新穂', '新穗', '大野', '下新穂', '舟下', '皆川', '新穂皆川', '新穂舟下', 
                '新穂武井', '新穂大野', '新穂井内', '上新穂', '新穂瓜生屋', '新穂正明寺', 
                '新穂田野沢', '新穂潟上', '新穂青木', '新穂長畝', '新穂北方'
            ],
            '畑野地区': [
                '畑野', '宮川', '栗野江', '目黒町', '三宮', '松ケ崎', '多田', '寺田', 
                '飯持', '畉田', '大久保', '猿八', '小倉', '長谷', '坊ケ浦', '浜河内', '丸山'
            ],
            '真野地区': [
                '真野', '豊田', '四日町', '吉岡', '大小', '金丸', '長石', '真野新町', 
                '滝脇', '背合', '大須', '静平', '下黒山', '真野大川', '名古屋', '国分寺', 
                '竹田', '阿仏坊', '阿佛坊', '大倉谷', '田切須', '西三川', '椿尾'
            ],
            '小木地区': [
                '小木', '宿根木', '深浦', '田野浦', '強清水', '小木町', '小木木野浦', 
                '小比叡', '小木堂釜', '井坪', '小木大浦', '木流', '江積', '沢崎', 
                '犬神平', '小木強清水', '琴浦', '小木金田新田'
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
    
    def normalize_address(self, raw_address: str) -> str:
        """住所を正規化"""
        if not raw_address:
            return ""
        
        # 日本国表記の除去
        normalized = raw_address.replace('日本、', '').replace('日本 ', '').replace('Japan', '').strip()
        
        # 新潟県表記の統一
        normalized = re.sub(r'新潟県?\s*', '新潟県', normalized)
        
        # 佐渡市表記の統一
        normalized = re.sub(r'佐渡市?\s*', '佐渡市', normalized)
        
        # 余分な空白の除去
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized
    
    def classify_district_by_address(self, address: str) -> str:
        """住所による地区分類"""
        if not address:
            return 'その他'
        
        normalized_address = self.normalize_address(address)
        
        # 各地区の地名をチェック
        for district, locations in self.district_mapping.items():
            for location in locations:
                if location in normalized_address:
                    return district
        
        return 'その他'
    
    def classify_district_by_coordinates(self, lat: float, lng: float) -> Optional[str]:
        """緯度経度による地区分類（粗い分類）"""
        if not self.is_within_sado_bounds(lat, lng):
            return None
        
        # 佐渡島を大まかに地区分けする座標範囲
        # 実際の行政区画ではなく、おおよその地理的位置による分類
        
        if lat >= 38.15:  # 北部
            if lng <= 138.25:
                return '相川地区'  # 西北部
            else:
                return '両津地区'  # 東北部
        elif lat >= 37.95:  # 中北部
            if lng <= 138.15:
                return '佐和田地区'  # 西中部
            elif lng <= 138.35:
                return '金井地区'  # 中央部
            else:
                return '新穂地区'  # 東中部
        elif lat >= 37.85:  # 中南部
            if lng <= 138.15:
                return '真野地区'  # 西中南部
            else:
                return '畑野地区'  # 東中南部
        else:  # 南部
            if lng <= 138.25:
                return '小木地区'  # 西南部
            elif lng <= 138.35:
                return '羽茂地区'  # 中南部
            else:
                return '赤泊地区'  # 東南部
    
    def is_within_sado_bounds(self, lat: float, lng: float) -> bool:
        """緯度経度が佐渡島内かどうかを判定"""
        try:
            lat_f = float(lat)
            lng_f = float(lng)
            
            return (self.bounds.south <= lat_f <= self.bounds.north and 
                   self.bounds.west <= lng_f <= self.bounds.east)
        except (ValueError, TypeError):
            return False
    
    def is_within_sado_by_address(self, address: str) -> bool:
        """住所による佐渡島内判定"""
        if not address:
            return False
        
        normalized = self.normalize_address(address)
        return any(keyword in normalized for keyword in self.sado_keywords)
    
    def format_opening_hours(self, opening_hours_data: Optional[Dict]) -> str:
        """営業時間データをフォーマット"""
        if not opening_hours_data or 'weekdayDescriptions' not in opening_hours_data:
            return ""
        
        descriptions = opening_hours_data['weekdayDescriptions']
        if not descriptions:
            return ""
        
        # 曜日順に並び替え（月火水木金土日）
        weekday_order = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日']
        sorted_descriptions = []
        
        for day in weekday_order:
            for desc in descriptions:
                if desc.startswith(day):
                    sorted_descriptions.append(desc)
                    break
        
        return '\n'.join(sorted_descriptions)
    
    def validate_place_data(self, place: Dict[str, Any], category: str) -> ValidationResult:
        """Places APIレスポンスを検証・変換"""
        errors = []
        warnings = []
        
        # 必須フィールドの検証
        place_id = place.get('id', '')
        if not place_id:
            errors.append("Place ID がありません")
        
        name = place.get('displayName', {}).get('text', '')
        if not name:
            errors.append("店舗名がありません")
        
        # 住所の取得・正規化
        raw_address = place.get('shortFormattedAddress', '')
        normalized_address = self.normalize_address(raw_address)
        
        # 座標の取得
        location = place.get('location', {})
        lat = location.get('latitude', '')
        lng = location.get('longitude', '')
        
        # 地区分類
        district = self.classify_district_by_address(normalized_address)
        
        # 住所による分類が「その他」の場合、座標による分類を試行
        if district == 'その他' and lat and lng:
            coord_district = self.classify_district_by_coordinates(float(lat), float(lng))
            if coord_district:
                district = coord_district
                warnings.append(f"緯度経度により {district} に分類されました")
        
        # 佐渡島内判定
        is_in_sado = False
        if lat and lng:
            is_in_sado = self.is_within_sado_bounds(lat, lng)
        else:
            is_in_sado = self.is_within_sado_by_address(normalized_address)
            if not lat or not lng:
                warnings.append("緯度経度情報がありません")
        
        if not is_in_sado:
            warnings.append("佐渡島外の場所の可能性があります")
        
        # Google Maps URL の生成
        google_maps_url = ""
        if 'googleMapsLinks' in place and place['googleMapsLinks']:
            google_maps_url = place['googleMapsLinks'].get('directionsLink', 
                             place['googleMapsLinks'].get('searchLink', ''))
        
        if not google_maps_url and place_id:
            google_maps_url = f"https://www.google.com/maps/search/?api=1&query=Google&query_place_id={place_id}"
        
        # タイムスタンプ
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        
        # カテゴリ別データ構造
        if category == "restaurants" or category == "飲食店":
            data = {
                'place_id': place_id,
                'name': name,
                'address': normalized_address,
                'latitude': lat,
                'longitude': lng,
                'primary_type': place.get('primaryType', ''),
                'primary_type_display': place.get('primaryTypeDisplayName', {}).get('text', ''),
                'phone': place.get('nationalPhoneNumber', ''),
                'opening_hours': self.format_opening_hours(place.get('regularOpeningHours')),
                'rating': place.get('rating', ''),
                'review_count': place.get('userRatingCount', ''),
                'district': district,
                'google_maps_url': google_maps_url,
                'timestamp': timestamp,
                'is_in_sado': is_in_sado
            }
        else:
            # 駐車場・公衆トイレ
            data = {
                'place_id': place_id,
                'name': name,
                'address': normalized_address,
                'latitude': lat,
                'longitude': lng,
                'primary_type': place.get('primaryType', ''),
                'primary_type_display': place.get('primaryTypeDisplayName', {}).get('text', ''),
                'district': district,
                'google_maps_url': google_maps_url,
                'timestamp': timestamp,
                'is_in_sado': is_in_sado
            }
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            data=data,
            errors=errors,
            warnings=warnings,
            district=district
        )
    
    def extract_to_row_format_simplified(self, result: ValidationResult, category: str, headers: List[str]) -> List[str]:
        """検証結果から行データを抽出（簡略版・佐渡市外シート用）"""
        data = result.data
        row = []
        
        # ヘッダーに基づいて必要なフィールドのみ抽出
        for header in headers:
            value = ""
            
            if header == "Place ID":
                value = data.get('place_id', '')
            elif header in ["店舗名", "駐車場名", "施設名"]:
                value = data.get('name', '')
            elif header == "所在地":
                value = data.get('formatted_address', '')
            elif header == "緯度":
                value = str(data.get('latitude', ''))
            elif header == "経度":
                value = str(data.get('longitude', ''))
            elif header == "評価":
                rating = data.get('rating')
                value = str(rating) if rating is not None else ''
            elif header == "レビュー数":
                reviews = data.get('user_ratings_total')
                value = str(reviews) if reviews is not None else ''
            elif header == "営業状況":
                value = data.get('business_status_jp', '')
            elif header == "営業時間":
                hours = data.get('opening_hours')
                if hours and isinstance(hours, dict):
                    weekday_text = hours.get('weekday_text', [])
                    value = '; '.join(weekday_text) if weekday_text else ''
                else:
                    value = str(hours) if hours else ''
            elif header == "電話番号":
                value = data.get('formatted_phone_number', '')
            elif header == "ウェブサイト":
                value = data.get('website', '')
            elif header == "価格帯":
                price_level = data.get('price_level')
                if price_level is not None:
                    price_map = {0: '無料', 1: '安い', 2: '手頃', 3: '高い', 4: '非常に高い'}
                    value = price_map.get(price_level, '')
                else:
                    value = ''
            elif header == "店舗タイプ":
                types = data.get('types_jp', [])
                value = ', '.join(types) if types else ''
            elif header in ["カテゴリ", "カテゴリ詳細"]:
                types = data.get('types_jp', [])
                if header == "カテゴリ" and types:
                    value = types[0]  # 最初のタイプをカテゴリとする
                elif header == "カテゴリ詳細":
                    value = ', '.join(types) if types else ''
            elif header == "地区":
                value = result.district if result.district else 'その他'
            elif header == "GoogleマップURL":
                value = data.get('url', '')
            elif header == "取得方法":
                value = data.get('retrieval_method', 'API取得')
            elif header == "最終更新日時":
                value = data.get('timestamp', time.strftime('%Y-%m-%d %H:%M:%S'))
            
            # 値を文字列として追加（None の場合は空文字）
            row.append(str(value) if value is not None else '')
        
        return row

    def extract_to_row_format(self, result: ValidationResult, category: str) -> List[str]:
        """検証結果をスプレッドシート行形式に変換（完全版）"""
        data = result.data
        
        if category == "restaurants" or category == "飲食店":
            return [
                data['place_id'],
                data['name'],
                data['address'],
                str(data['latitude']),
                str(data['longitude']),
                data['primary_type'],
                data['primary_type_display'],
                data['phone'],
                data['opening_hours'],
                str(data['rating']),
                str(data['review_count']),
                data['district'],
                data['google_maps_url'],
                data['timestamp']
            ]
        else:
            return [
                data['place_id'],
                data['name'],
                data['address'],
                str(data['latitude']),
                str(data['longitude']),
                data['primary_type'],
                data['primary_type_display'],
                data['district'],
                data['google_maps_url'],
                data['timestamp']
            ]
    
    def batch_validate(self, places: List[Dict[str, Any]], category: str) -> List[ValidationResult]:
        """複数の場所データを一括検証"""
        results = []
        
        print(f"🔍 データ検証開始: {len(places)}件")
        
        for i, place in enumerate(places, 1):
            result = self.validate_place_data(place, category)
            results.append(result)
            
            # エラー・警告の表示
            if result.errors:
                print(f"❌ [{i}] エラー: {', '.join(result.errors)}")
            if result.warnings:
                print(f"⚠️ [{i}] 警告: {', '.join(result.warnings)}")
            
            # 進捗表示
            if i % 10 == 0:
                print(f"📊 検証進捗: {i}/{len(places)} 完了")
        
        # 統計情報
        valid_count = sum(1 for r in results if r.is_valid)
        error_count = len(places) - valid_count
        sado_count = sum(1 for r in results if r.data.get('is_in_sado', False))
        
        print(f"✅ 検証完了: 有効 {valid_count}件, エラー {error_count}件, 佐渡島内 {sado_count}件")
        
        return results
    
    def get_validation_stats(self, results: List[ValidationResult]) -> Dict[str, Any]:
        """検証統計情報を取得"""
        total = len(results)
        valid = sum(1 for r in results if r.is_valid)
        
        district_counts = {}
        for result in results:
            district = result.district
            district_counts[district] = district_counts.get(district, 0) + 1
        
        return {
            "total": total,
            "valid": valid,
            "invalid": total - valid,
            "success_rate": valid / total if total > 0 else 0,
            "district_distribution": district_counts,
            "sado_places": sum(1 for r in results if r.data.get('is_in_sado', False))
        }


# 利便性のための関数群
def validate_single_place(place: Dict[str, Any], category: str = 'restaurants') -> ValidationResult:
    """単一の場所データを検証"""
    validator = DataValidator()
    return validator.validate_place_data(place, category)


def quick_district_classification(address: str) -> str:
    """住所の地区分類のみ実行"""
    validator = DataValidator()
    return validator.classify_district_by_address(address)


if __name__ == "__main__":
    # テスト実行
    import sys
    
    if len(sys.argv) < 2:
        print("使用方法: python data_validator.py <住所または座標>")
        print("例: python data_validator.py '佐渡市両津夷261'")
        print("例: python data_validator.py '38.1234,138.1234'")
        sys.exit(1)
    
    input_str = sys.argv[1]
    validator = DataValidator()
    
    # 座標形式かどうかチェック
    if ',' in input_str:
        try:
            lat_str, lng_str = input_str.split(',')
            lat, lng = float(lat_str.strip()), float(lng_str.strip())
            
            is_in_sado = validator.is_within_sado_bounds(lat, lng)
            district = validator.classify_district_by_coordinates(lat, lng)
            
            print(f"=== 座標分析結果 ===")
            print(f"緯度: {lat}, 経度: {lng}")
            print(f"佐渡島内: {'はい' if is_in_sado else 'いいえ'}")
            print(f"推定地区: {district or ' 判定不可'}")
            
        except ValueError:
            print("❌ 無効な座標形式です")
            sys.exit(1)
    else:
        # 住所として処理
        normalized = validator.normalize_address(input_str)
        district = validator.classify_district_by_address(normalized)
        is_in_sado = validator.is_within_sado_by_address(normalized)
        
        print(f"=== 住所分析結果 ===")
        print(f"元の住所: {input_str}")
        print(f"正規化後: {normalized}")
        print(f"地区分類: {district}")
        print(f"佐渡島内: {'はい' if is_in_sado else 'いいえ'}")
