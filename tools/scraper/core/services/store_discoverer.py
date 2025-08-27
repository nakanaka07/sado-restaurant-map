#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新店舗発見システム
Google Places API Nearby Search を活用した佐渡島新店舗自動発見

機能:
- 格子状地域分割による網羅的検索
- 既存データベースとの重複チェック
- 新店舗の自動特定と報告
- 発見店舗の詳細情報取得
"""

import os
import sys
import time
import json
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Set, Tuple, Optional
from dataclasses import dataclass
import math

# 共通ライブラリインポート
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config_dir = os.path.join(current_dir, 'config')
config_env_path = os.path.join(config_dir, '.env')
if os.path.exists(config_env_path):
    load_dotenv(config_env_path)

from utils.google_auth import get_places_api_key, authenticate_google_sheets, get_spreadsheet_id
from utils.translators import translate_business_status, translate_types
from processors.data_deduplicator import DataDeduplicator

@dataclass
class GridCell:
    """検索グリッドセル"""
    lat: float
    lng: float
    cell_id: str
    radius: int = 1000  # 1km

@dataclass
class NewStoreCandidate:
    """新店舗候補"""
    place_id: str
    name: str
    address: str
    lat: float
    lng: float
    types: List[str]
    rating: Optional[float]
    discovery_method: str
    discovery_date: str
    confidence_score: float

class NewStoreDiscoverer:
    """新店舗発見システム"""
    
    def __init__(self):
        self.api_key = get_places_api_key()
        self.spreadsheet_id = get_spreadsheet_id()
        self.deduplicator = DataDeduplicator()
        
        # 佐渡島の境界定義
        self.sado_bounds = {
            'north': 38.4,      # 最北端
            'south': 37.7,      # 最南端
            'east': 138.6,      # 最東端
            'west': 138.0       # 最西端
        }
        
        # 検索対象タイプ
        self.target_types = [
            'restaurant', 'food', 'meal_takeaway', 'meal_delivery',
            'cafe', 'bakery', 'bar', 'night_club',
            'convenience_store', 'grocery_or_supermarket'
        ]
        
        # API制限設定
        self.api_delay = 1.0
        self.max_requests_per_hour = 100
        
        # 既存店舗データ（重複チェック用）
        self.existing_places: Set[str] = set()
        self.load_existing_places()
    
    def load_existing_places(self):
        """既存の店舗Place IDを読み込み（重複チェック用）"""
        try:
            gc = authenticate_google_sheets()
            if gc:
                spreadsheet = gc.open_by_key(self.spreadsheet_id)
                
                # 既存のシートから店舗データを取得
                sheet_names = ['飲食店_統合処理', 'まとめータベース', '店舗リスト']
                
                for sheet_name in sheet_names:
                    try:
                        worksheet = spreadsheet.worksheet(sheet_name)
                        records = worksheet.get_all_records()
                        
                        for record in records:
                            place_id = record.get('Place ID') or record.get('PlaceID')
                            if place_id:
                                self.existing_places.add(place_id)
                        
                        print(f"📋 既存データ読み込み ({sheet_name}): {len(records)}件")
                    except:
                        continue
                
                print(f"✅ 重複チェック用データ準備完了: {len(self.existing_places)}件の既存店舗")
        
        except Exception as e:
            print(f"⚠️ 既存データ読み込みエラー: {e}")
    
    def generate_search_grid(self, grid_size_km: float = 2.0) -> List[GridCell]:
        """佐渡島を格子状に分割してSearchGridを生成"""
        cells = []
        
        # 緯度・経度の単位距離（概算）
        lat_per_km = 1 / 111.0  # 1度 ≈ 111km
        lng_per_km = 1 / (111.0 * math.cos(math.radians(38.0)))  # 佐渡緯度での補正
        
        grid_lat_step = grid_size_km * lat_per_km
        grid_lng_step = grid_size_km * lng_per_km
        
        lat = self.sado_bounds['south']
        cell_count = 0
        
        while lat <= self.sado_bounds['north']:
            lng = self.sado_bounds['west']
            
            while lng <= self.sado_bounds['east']:
                cell_id = f"GRID_{cell_count:03d}"
                cell = GridCell(
                    lat=lat,
                    lng=lng,
                    cell_id=cell_id,
                    radius=int(grid_size_km * 500)  # 半径はgrid_sizeの半分
                )
                cells.append(cell)
                
                lng += grid_lng_step
                cell_count += 1
            
            lat += grid_lat_step
        
        print(f"🗺️ 検索グリッド生成完了: {len(cells)}セル ({grid_size_km}km間隔)")
        return cells
    
    def search_nearby_places(self, cell: GridCell, place_type: str) -> List[Dict]:
        """指定セルで近傍検索実行"""
        nearby_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        
        params = {
            'location': f"{cell.lat},{cell.lng}",
            'radius': cell.radius,
            'type': place_type,
            'language': 'ja',
            'key': self.api_key
        }
        
        all_results = []
        next_page_token = None
        
        try:
            while True:
                if next_page_token:
                    params['pagetoken'] = next_page_token
                
                response = requests.get(nearby_url, params=params)
                data = response.json()
                
                if data.get('status') == 'OK':
                    results = data.get('results', [])
                    all_results.extend(results)
                    
                    next_page_token = data.get('next_page_token')
                    if not next_page_token:
                        break
                    
                    # ページトークン待機（必須）
                    time.sleep(2)
                
                elif data.get('status') == 'ZERO_RESULTS':
                    break
                else:
                    print(f"⚠️ API警告 ({cell.cell_id}): {data.get('status')}")
                    break
            
            return all_results
            
        except Exception as e:
            print(f"❌ 近傍検索エラー ({cell.cell_id}): {e}")
            return []
    
    def is_new_place(self, place: Dict) -> bool:
        """新店舗かどうかを判定"""
        place_id = place.get('place_id')
        
        # 既存Place IDチェック
        if place_id in self.existing_places:
            return False
        
        # 営業状況チェック
        business_status = place.get('business_status')
        if business_status in ['CLOSED_PERMANENTLY', 'CLOSED_TEMPORARILY']:
            return False
        
        # 最近開店チェック（ユーザー評価数が少ない場合は新店舗の可能性）
        user_ratings_total = place.get('user_ratings_total', 0)
        if user_ratings_total < 10:  # 評価数10未満は新店舗候補
            return True
        
        # 評価の投稿時期による判定（実装可能なら）
        return True
    
    def calculate_confidence_score(self, place: Dict, discovery_method: str) -> float:
        """新店舗の信頼度スコアを計算"""
        score = 0.5  # ベーススコア
        
        # 評価数による加点（少ないほど新店舗の可能性）
        ratings_total = place.get('user_ratings_total', 0)
        if ratings_total == 0:
            score += 0.3
        elif ratings_total < 5:
            score += 0.2
        elif ratings_total < 10:
            score += 0.1
        
        # 営業状況による加点
        if place.get('business_status') == 'OPERATIONAL':
            score += 0.1
        
        # 発見方法による加点
        if discovery_method == '格子検索':
            score += 0.1
        
        return min(score, 1.0)
    
    def discover_new_stores(self, max_cells: Optional[int] = None) -> List[NewStoreCandidate]:
        """新店舗発見の実行"""
        print("🔍 新店舗発見システム開始")
        
        # 検索グリッド生成
        grid_cells = self.generate_search_grid(grid_size_km=2.0)
        if max_cells:
            grid_cells = grid_cells[:max_cells]
            print(f"🎯 検索範囲制限: {max_cells}セル")
        
        new_candidates = []
        processed_place_ids = set()
        
        total_searches = len(grid_cells) * len(self.target_types)
        current_search = 0
        
        for cell in grid_cells:
            print(f"\n📍 検索中: {cell.cell_id} ({cell.lat:.4f}, {cell.lng:.4f})")
            
            for place_type in self.target_types:
                current_search += 1
                print(f"   🔎 [{current_search}/{total_searches}] タイプ: {place_type}")
                
                # 近傍検索実行
                places = self.search_nearby_places(cell, place_type)
                
                for place in places:
                    place_id = place.get('place_id')
                    
                    # 重複チェック
                    if place_id in processed_place_ids:
                        continue
                    processed_place_ids.add(place_id)
                    
                    # 新店舗判定
                    if self.is_new_place(place):
                        confidence = self.calculate_confidence_score(place, '格子検索')
                        
                        candidate = NewStoreCandidate(
                            place_id=place_id,
                            name=place.get('name', 'Unknown'),
                            address=place.get('vicinity', ''),
                            lat=place.get('geometry', {}).get('location', {}).get('lat', 0),
                            lng=place.get('geometry', {}).get('location', {}).get('lng', 0),
                            types=place.get('types', []),
                            rating=place.get('rating'),
                            discovery_method='格子検索',
                            discovery_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                            confidence_score=confidence
                        )
                        
                        new_candidates.append(candidate)
                        print(f"      ✨ 新店舗候補発見: {candidate.name} (信頼度: {confidence:.2f})")
                
                # API制限対応
                time.sleep(self.api_delay)
        
        print(f"\n🎉 新店舗発見完了: {len(new_candidates)}件の候補を発見")
        return new_candidates
    
    def save_discoveries_to_spreadsheet(self, candidates: List[NewStoreCandidate]) -> bool:
        """発見した新店舗をスプレッドシートに保存"""
        if not candidates:
            print("💾 保存する新店舗候補がありません")
            return False
        
        try:
            gc = authenticate_google_sheets()
            if not gc:
                return False
            
            spreadsheet = gc.open_by_key(self.spreadsheet_id)
            
            # 新店舗発見シートを作成または取得
            sheet_name = f'新店舗発見_{datetime.now().strftime("%Y%m%d")}'
            
            try:
                worksheet = spreadsheet.worksheet(sheet_name)
                worksheet.clear()
                print(f"📝 既存シート '{sheet_name}' を更新")
            except:
                worksheet = spreadsheet.add_worksheet(
                    title=sheet_name,
                    rows=len(candidates) + 10,
                    cols=15
                )
                print(f"✨ 新規シート '{sheet_name}' を作成")
            
            # データ準備
            headers = [
                'Place ID', '店舗名', '住所', '緯度', '経度', 
                '店舗タイプ', '評価', '発見方法', '発見日時', 
                '信頼度スコア', '検証状況', '備考'
            ]
            
            data_rows = [headers]
            
            for candidate in candidates:
                row = [
                    candidate.place_id,
                    candidate.name,
                    candidate.address,
                    candidate.lat,
                    candidate.lng,
                    ', '.join(translate_types(candidate.types)),
                    candidate.rating or '',
                    candidate.discovery_method,
                    candidate.discovery_date,
                    f"{candidate.confidence_score:.3f}",
                    '未検証',  # 検証状況
                    f'評価数確認要 | {len(candidate.types)}タイプ'  # 備考
                ]
                data_rows.append(row)
            
            # スプレッドシートに書き込み
            worksheet.update(values=data_rows, range_name='A1')
            
            print(f"✅ {len(candidates)}件の新店舗候補を{sheet_name}に保存")
            print(f"🔗 URL: https://docs.google.com/spreadsheets/d/{self.spreadsheet_id}")
            
            return True
            
        except Exception as e:
            print(f"❌ 保存エラー: {e}")
            return False
    
    def generate_discovery_report(self, candidates: List[NewStoreCandidate]) -> Dict:
        """発見レポートを生成"""
        if not candidates:
            return {'total': 0, 'summary': '新店舗候補なし'}
        
        # 信頼度別集計
        high_confidence = [c for c in candidates if c.confidence_score >= 0.8]
        medium_confidence = [c for c in candidates if 0.5 <= c.confidence_score < 0.8]
        low_confidence = [c for c in candidates if c.confidence_score < 0.5]
        
        # タイプ別集計
        type_counts = {}
        for candidate in candidates:
            for place_type in candidate.types:
                japanese_type = translate_types([place_type])[0] if translate_types([place_type]) else place_type
                type_counts[japanese_type] = type_counts.get(japanese_type, 0) + 1
        
        report = {
            'total': len(candidates),
            'high_confidence': len(high_confidence),
            'medium_confidence': len(medium_confidence),
            'low_confidence': len(low_confidence),
            'type_distribution': type_counts,
            'discovery_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'top_candidates': [
                {
                    'name': c.name,
                    'confidence': c.confidence_score,
                    'address': c.address
                }
                for c in sorted(candidates, key=lambda x: x.confidence_score, reverse=True)[:5]
            ]
        }
        
        return report

def main():
    """メイン実行関数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='佐渡島新店舗発見システム')
    parser.add_argument('--max-cells', type=int, help='最大検索セル数（テスト用）')
    parser.add_argument('--grid-size', type=float, default=2.0, help='グリッドサイズ（km）')
    parser.add_argument('--save', action='store_true', help='結果をスプレッドシートに保存')
    parser.add_argument('--report-only', action='store_true', help='レポートのみ出力')
    
    args = parser.parse_args()
    
    discoverer = NewStoreDiscoverer()
    
    if args.report_only:
        # 既存データの分析レポートのみ
        print("📊 既存データ分析中...")
        print(f"既存店舗数: {len(discoverer.existing_places)}")
        return
    
    # 新店舗発見実行
    candidates = discoverer.discover_new_stores(max_cells=args.max_cells)
    
    # レポート生成
    report = discoverer.generate_discovery_report(candidates)
    
    # 結果出力
    print(f"\n{'='*80}")
    print(f"📊 新店舗発見レポート")
    print(f"{'='*80}")
    print(f"🎯 発見候補総数: {report['total']}件")
    print(f"   🟢 高信頼度 (≥0.8): {report['high_confidence']}件")
    print(f"   🟡 中信頼度 (0.5-0.8): {report['medium_confidence']}件")
    print(f"   🔴 低信頼度 (<0.5): {report['low_confidence']}件")
    
    if report['top_candidates']:
        print(f"\n🏆 上位候補:")
        for i, candidate in enumerate(report['top_candidates'], 1):
            print(f"   {i}. {candidate['name']} (信頼度: {candidate['confidence']:.3f})")
            print(f"      📍 {candidate['address']}")
    
    # 保存
    if args.save and candidates:
        discoverer.save_discoveries_to_spreadsheet(candidates)

if __name__ == '__main__':
    main()
