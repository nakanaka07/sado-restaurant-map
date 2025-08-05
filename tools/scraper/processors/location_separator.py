#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Location Separator - 位置による自動データ分離

このモジュールはスプレッドシートのデータを佐渡島内外で自動分離します。
旧run_optimizedから抽出された分離機能を新アーキテクチャで再実装。

Features:
- スプレッドシートからのデータ読み取り
- 緯度経度による佐渡島内外判定
- 自動シート作成・データ振り分け
- 統計情報の提供
- バックアップ機能
"""

import os
import time
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime

from .data_validator import DataValidator, SadoBounds
from .spreadsheet_manager import SpreadsheetManager, create_manager
from utils.output_formatter import OutputFormatter


@dataclass
class SeparationResult:
    """分離結果クラス"""
    category: str
    sado_count: int
    outside_count: int
    total_count: int
    sado_sheet_name: str
    outside_sheet_name: str
    errors: List[str]
    processing_time: float


@dataclass
class SeparationStats:
    """分離統計クラス"""
    total_processed: int
    total_sado: int
    total_outside: int
    categories: Dict[str, SeparationResult]
    execution_time: float


class LocationSeparator:
    """位置による自動データ分離クラス"""
    
    def __init__(self, spreadsheet_id: Optional[str] = None):
        """初期化"""
        self.data_validator = DataValidator()
        self.spreadsheet_manager = create_manager(spreadsheet_id)
        self.bounds = SadoBounds()
        
        # 分離対象カテゴリ設定
        self.categories = {
            'restaurants': {
                'display_name': '飲食店',
                'emoji': '🍽️',
                'lat_col': 3,  # 緯度の列番号（0ベース）
                'lng_col': 4,  # 経度の列番号（0ベース）
                'name_col': 1   # 店舗名の列番号
            },
            'parkings': {
                'display_name': '駐車場',
                'emoji': '🅿️',
                'lat_col': 3,
                'lng_col': 4,
                'name_col': 1
            },
            'toilets': {
                'display_name': '公衆トイレ',
                'emoji': '🚻',
                'lat_col': 3,
                'lng_col': 4,
                'name_col': 1
            }
        }
    
    def separate_category(self, category: str, backup: bool = True) -> SeparationResult:
        """単一カテゴリのデータ分離実行"""
        start_time = time.time()
        
        if category not in self.categories:
            raise ValueError(f"サポートされていないカテゴリ: {category}")
        
        config = self.categories[category]
        display_name = config['display_name']
        emoji = config['emoji']
        
        print(f"\n{emoji} {display_name}データの分離を開始...")
        
        errors = []
        
        try:
            # 1. 元データの読み取り
            worksheet_name = category
            if not self.spreadsheet_manager.worksheet_exists(worksheet_name):
                # 複数の可能な名前を試す
                possible_names = [category, display_name, f"{category}_統合処理"]
                worksheet_name = None
                for name in possible_names:
                    if self.spreadsheet_manager.worksheet_exists(name):
                        worksheet_name = name
                        break
                
                if not worksheet_name:
                    error_msg = f"ワークシート '{category}' が見つかりません"
                    errors.append(error_msg)
                    return SeparationResult(
                        category=category,
                        sado_count=0,
                        outside_count=0,
                        total_count=0,
                        sado_sheet_name="",
                        outside_sheet_name="",
                        errors=errors,
                        processing_time=time.time() - start_time
                    )
            
            # データ取得
            all_data = self.spreadsheet_manager.get_all_records(worksheet_name)
            if not all_data:
                error_msg = f"ワークシート '{worksheet_name}' にデータがありません"
                errors.append(error_msg)
                return SeparationResult(
                    category=category,
                    sado_count=0,
                    outside_count=0,
                    total_count=len(all_data) if all_data else 0,
                    sado_sheet_name="",
                    outside_sheet_name="",
                    errors=errors,
                    processing_time=time.time() - start_time
                )
            
            print(f"   📊 読み取り完了: {len(all_data)}件")
            
            # 2. バックアップ作成（オプション）
            if backup:
                backup_name = f"{worksheet_name}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                try:
                    self.spreadsheet_manager.duplicate_worksheet(worksheet_name, backup_name)
                    print(f"   💾 バックアップ作成: {backup_name}")
                except Exception as e:
                    errors.append(f"バックアップ作成エラー: {e}")
            
            # 3. データ分離
            sado_data = []
            outside_data = []
            
            for i, row in enumerate(all_data):
                try:
                    # 緯度経度を取得
                    lat_str = str(row.get('緯度', '') or row.get('latitude', ''))
                    lng_str = str(row.get('経度', '') or row.get('longitude', ''))
                    
                    if not lat_str or not lng_str:
                        errors.append(f"行{i+2}: 緯度経度が不正 (lat={lat_str}, lng={lng_str})")
                        outside_data.append(row)  # 不正データは外部として扱う
                        continue
                    
                    try:
                        lat = float(lat_str)
                        lng = float(lng_str)
                    except ValueError:
                        errors.append(f"行{i+2}: 緯度経度の変換エラー (lat={lat_str}, lng={lng_str})")
                        outside_data.append(row)
                        continue
                    
                    # 佐渡島内判定
                    if self.data_validator.is_within_sado_bounds(lat, lng):
                        sado_data.append(row)
                    else:
                        outside_data.append(row)
                        
                except Exception as e:
                    errors.append(f"行{i+2}: 処理エラー - {e}")
                    outside_data.append(row)
            
            print(f"   ✅ 分離完了: 佐渡島内 {len(sado_data)}件、佐渡島外 {len(outside_data)}件")
            
            # 4. 新しいシートに保存（2シート構成）
            sado_sheet_name = category  # メインシート（佐渡島内・完全版）
            outside_sheet_name = f"{category}_佐渡市外"  # 参考シート（佐渡市外・簡略版）
            
            # 佐渡島内データ保存（メインシート・完全版）
            try:
                if sado_data:
                    self.spreadsheet_manager.create_or_update_worksheet(
                        sado_sheet_name, sado_data, category
                    )
                    print(f"   💾 佐渡島内データ保存: {sado_sheet_name}（完全版・{len(sado_data)}件）")
                else:
                    print(f"   ⚠️ 佐渡島内データなし")
            except Exception as e:
                errors.append(f"佐渡島内データ保存エラー: {e}")
            
            # 佐渡島外データ保存（参考シート・簡略版）
            try:
                if outside_data:
                    self.spreadsheet_manager.create_or_update_worksheet(
                        outside_sheet_name, outside_data, category
                    )
                    print(f"   💾 佐渡島外データ保存: {outside_sheet_name}（簡略版・{len(outside_data)}件）")
                else:
                    print(f"   ⚠️ 佐渡島外データなし")
            except Exception as e:
                errors.append(f"佐渡島外データ保存エラー: {e}")
            
            return SeparationResult(
                category=category,
                sado_count=len(sado_data),
                outside_count=len(outside_data),
                total_count=len(all_data),
                sado_sheet_name=sado_sheet_name,
                outside_sheet_name=outside_sheet_name,
                errors=errors,
                processing_time=time.time() - start_time
            )
            
        except Exception as e:
            errors.append(f"分離処理の致命的エラー: {e}")
            return SeparationResult(
                category=category,
                sado_count=0,
                outside_count=0,
                total_count=0,
                sado_sheet_name="",
                outside_sheet_name="",
                errors=errors,
                processing_time=time.time() - start_time
            )
    
    def separate_all_categories(self, categories: Optional[List[str]] = None, 
                               backup: bool = True) -> SeparationStats:
        """全カテゴリまたは指定カテゴリのデータ分離実行"""
        start_time = time.time()
        
        if categories is None:
            categories = list(self.categories.keys())
        
        OutputFormatter.print_header("データ分離実行", "佐渡島内外の自動分離")
        
        results = {}
        total_sado = 0
        total_outside = 0
        total_processed = 0
        
        for category in categories:
            if category not in self.categories:
                print(f"⚠️ スキップ: 未対応カテゴリ '{category}'")
                continue
            
            result = self.separate_category(category, backup)
            results[category] = result
            
            total_sado += result.sado_count
            total_outside += result.outside_count
            total_processed += result.total_count
            
            # エラー表示
            if result.errors:
                print(f"   ⚠️ エラー {len(result.errors)}件:")
                for error in result.errors[:5]:  # 最初の5件のみ表示
                    print(f"      - {error}")
                if len(result.errors) > 5:
                    print(f"      ... 他{len(result.errors)-5}件")
        
        execution_time = time.time() - start_time
        
        # 統計表示
        OutputFormatter.print_section("分離結果統計", "chart_with_upwards_trend")
        
        print(f"📊 総合統計:")
        print(f"   - 総処理件数: {total_processed:,}件")
        print(f"   - メインシート（佐渡島内・完全版）: {total_sado:,}件 ({total_sado/total_processed*100:.1f}%)" if total_processed > 0 else "   - 佐渡島内: 0件")
        print(f"   - 参考シート（佐渡市外・簡略版）: {total_outside:,}件 ({total_outside/total_processed*100:.1f}%)" if total_processed > 0 else "   - 佐渡島外: 0件")
        print(f"   - 実行時間: {execution_time:.2f}秒")
        
        print(f"\n📁 カテゴリ別統計:")
        for category, result in results.items():
            config = self.categories[category]
            emoji = config['emoji']
            name = config['display_name']
            print(f"   {emoji} {name}:")
            print(f"      - メインシート（佐渡島内）: {result.sado_count}件")
            print(f"      - 参考シート（佐渡市外）: {result.outside_count}件")
            print(f"      - 処理時間: {result.processing_time:.2f}秒")
            if result.errors:
                print(f"      - エラー: {len(result.errors)}件")
        
        success = total_processed > 0 and len([r for r in results.values() if r.errors]) == 0
        message = f"2シート構成分離完了: メインシート{total_sado}件、参考シート{total_outside}件"
        OutputFormatter.print_footer(success, message)
        
        return SeparationStats(
            total_processed=total_processed,
            total_sado=total_sado,
            total_outside=total_outside,
            categories=results,
            execution_time=execution_time
        )
    
    def get_boundary_info(self) -> Dict[str, Any]:
        """佐渡島境界情報を取得"""
        return {
            'bounds': {
                'north': self.bounds.north,
                'south': self.bounds.south,
                'east': self.bounds.east,
                'west': self.bounds.west
            },
            'center': {
                'latitude': (self.bounds.north + self.bounds.south) / 2,
                'longitude': (self.bounds.east + self.bounds.west) / 2
            },
            'area_info': {
                'description': '佐渡島の概算境界座標',
                'data_source': '地理院地図・OpenStreetMap参考',
                'accuracy': '市町村境界レベル',
                'note': '海岸線・離島は含まない概算'
            }
        }
    
    def validate_coordinates(self, lat: float, lng: float) -> Dict[str, Any]:
        """座標の詳細検証"""
        is_in_sado = self.data_validator.is_within_sado_bounds(lat, lng)
        district = self.data_validator.classify_district_by_coordinates(lat, lng)
        
        return {
            'coordinates': {'latitude': lat, 'longitude': lng},
            'is_in_sado': is_in_sado,
            'district': district,
            'bounds_check': {
                'within_north': lat <= self.bounds.north,
                'within_south': lat >= self.bounds.south,
                'within_east': lng <= self.bounds.east,
                'within_west': lng >= self.bounds.west
            },
            'distance_from_center': self._calculate_distance_from_center(lat, lng)
        }
    
    def _calculate_distance_from_center(self, lat: float, lng: float) -> float:
        """佐渡島中心からの概算距離（km）"""
        center_lat = (self.bounds.north + self.bounds.south) / 2
        center_lng = (self.bounds.east + self.bounds.west) / 2
        
        # 簡易距離計算（正確な測地線距離ではない）
        lat_diff = lat - center_lat
        lng_diff = lng - center_lng
        
        # 緯度1度 ≈ 111km、経度1度 ≈ 111km * cos(緯度)
        lat_km = lat_diff * 111
        lng_km = lng_diff * 111 * abs(center_lat * 0.0174533)  # ラジアン変換
        
        distance = (lat_km**2 + lng_km**2)**0.5
        return round(distance, 2)


def create_location_separator(spreadsheet_id: Optional[str] = None) -> LocationSeparator:
    """LocationSeparatorインスタンスを作成"""
    return LocationSeparator(spreadsheet_id)


# CLI実行サポート
if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='佐渡島内外データ分離ツール')
    parser.add_argument('--category', choices=['all', 'restaurants', 'parkings', 'toilets'],
                       default='all', help='分離対象カテゴリ')
    parser.add_argument('--no-backup', action='store_true', help='バックアップを作成しない')
    parser.add_argument('--test-coords', nargs=2, type=float, 
                       help='座標テスト (緯度 経度)')
    parser.add_argument('--boundary-info', action='store_true', help='境界情報を表示')
    
    args = parser.parse_args()
    
    separator = create_location_separator()
    
    if args.boundary_info:
        import json
        info = separator.get_boundary_info()
        print("🗾 佐渡島境界情報:")
        print(json.dumps(info, indent=2, ensure_ascii=False))
    
    elif args.test_coords:
        lat, lng = args.test_coords
        result = separator.validate_coordinates(lat, lng)
        print(f"📍 座標検証結果 ({lat}, {lng}):")
        import json
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    else:
        categories = None if args.category == 'all' else [args.category]
        stats = separator.separate_all_categories(
            categories=categories, 
            backup=not args.no_backup
        )
        print(f"\n✅ 分離処理完了")
