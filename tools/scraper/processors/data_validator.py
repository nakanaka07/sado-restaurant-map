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
        # 佐渡市公式サイト基準: https://www.city.sado.niigata.jp/soshiki/2002/2359.html
        return {
            '両津地区': [
                '両津', '河崎', '秋津', '梅津', '湊', '原黒', '北田野浦', '春日', '浜田', '加茂歌代',
                '羽吉', '椿', '北五十里', '白瀬', '玉崎', '和木', '馬首', '北松ケ崎', '平松',
                '浦川', '歌見', '黒姫', '虫崎', '両津大川', '羽二生', '両尾', '椎泊', '真木',
                '下久知', '久知河内', '城腰', '住吉', '吾潟', '立野', '上横山', '長江',
                '潟端', '下横山', '旭', '水津', '片野尾', '月布施', '野浦', '東強清水',
                '東立島', '岩首', '東鵜島', '柿野浦', '豊岡', '立間', '赤玉', '蚫',
                '北小浦', '見立', '鷲崎', '願', '北鵜島', '真更川', '両津福浦', '藻浦'
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
        if not opening_hours_data:
            return ""
        
        # weekdayDescriptions または periods のいずれかが存在する場合
        descriptions = opening_hours_data.get('weekdayDescriptions', [])
        if descriptions:
            # 曜日順に並び替え（月火水木金土日）
            weekday_order = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日']
            sorted_descriptions = []
            
            for day in weekday_order:
                for desc in descriptions:
                    if desc.startswith(day):
                        sorted_descriptions.append(desc)
                        break
            
            return '\n'.join(sorted_descriptions)
        
        # periods データがある場合
        periods = opening_hours_data.get('periods', [])
        if periods:
            # periods を weekdayDescriptions 形式に変換
            weekday_names = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日']
            formatted_periods = []
            
            for period in periods:
                if 'open' in period:
                    day = period['open'].get('day', 0)
                    time = period['open'].get('time', '0000')
                    if day < len(weekday_names):
                        formatted_periods.append(f"{weekday_names[day]}: {time[:2]}:{time[2:]}～")
            
            return '\n'.join(formatted_periods)
        
        return ""
    
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
        if not raw_address:
            raw_address = place.get('formattedAddress', '')
        normalized_address = self.normalize_address(raw_address)
        
        # 名前の取得
        if isinstance(name, dict) and 'text' in name:
            name = name['text']
        
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
        if 'googleMapsUri' in place:
            google_maps_url = place['googleMapsUri']
        elif place_id:
            google_maps_url = f"https://www.google.com/maps/place/?q=place_id:{place_id}"
        
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
                'primary_type_display': place.get('primaryTypeDisplayName', {}).get('text', '') if isinstance(place.get('primaryTypeDisplayName'), dict) else place.get('primaryTypeDisplayName', ''),
                'phone': place.get('nationalPhoneNumber', ''),
                'opening_hours': self.format_opening_hours(place.get('regularOpeningHours')),
                'rating': place.get('rating', ''),
                'review_count': place.get('userRatingCount', ''),
                'business_status': place.get('businessStatus', ''),
                'types': place.get('types', []),
                'website': place.get('websiteUri', ''),
                'price_level': place.get('priceLevel', ''),
                'editorial_summary': place.get('editorialSummary', {}).get('text', '') if isinstance(place.get('editorialSummary'), dict) else place.get('editorialSummary', ''),
                'formatted_address': place.get('formattedAddress', ''),
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
                'primary_type_display': place.get('primaryTypeDisplayName', {}).get('text', '') if isinstance(place.get('primaryTypeDisplayName'), dict) else place.get('primaryTypeDisplayName', ''),
                'business_status': place.get('businessStatus', ''),
                'types': place.get('types', []),
                'rating': place.get('rating', ''),
                'review_count': place.get('userRatingCount', ''),
                'opening_hours': self.format_opening_hours(place.get('regularOpeningHours')),
                'editorial_summary': place.get('editorialSummary', {}).get('text', '') if isinstance(place.get('editorialSummary'), dict) else place.get('editorialSummary', ''),
                'formatted_address': place.get('formattedAddress', ''),
                'payment_options': place.get('paymentOptions', {}),
                'accessibility_options': place.get('accessibilityOptions', {}),
                'restroom': place.get('restroom', ''),
                'good_for_children': place.get('goodForChildren', ''),
                'parking_options': place.get('parkingOptions', {}),
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
