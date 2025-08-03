#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
佐渡飲食店マップ - コスト最適化実行スクリプト
段階的実行モードによるAPI利用料金削減

🆕 新機能: 佐渡市内・佐渡市外データの自動分離
実行後に自動的に佐渡市外のデータを別シートに移動します。

使用例:
    # 通常実行（佐渡市内・佐渡市外分離あり）
    python run_optimized.py --mode=standard
    
    # 分離機能を無効化
    python run_optimized.py --mode=standard --no-separate
    
    # データ分離のみ実行（Places API は呼ばない）
    python run_optimized.py --separate-only
    
    # 特定カテゴリのみ処理
    python run_optimized.py --target=restaurants --mode=quick

作成されるシート:
    - 飲食店_佐渡市外
    - 駐車場_佐渡市外  
    - 公衆トイレ_佐渡市外
"""

import os
import sys
import argparse
import gspread
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

# 元のスクリプトをインポート
try:
    from places_data_updater import main as original_main, load_queries_from_file, authenticate_google_sheets
    from improved_search_strategy import ImprovedSearchStrategy
except ImportError:
    print("❌ 必要なモジュールが見つかりません")
    sys.exit(1)

class CostOptimizedRunner:
    """コスト最適化実行クラス"""
    
    def __init__(self):
        self.strategy = ImprovedSearchStrategy()
        
        # 実行モード設定
        self.execution_modes = {
            'quick': {
                'description': '高確率クエリのみ実行（約30%のコスト削減）',
                'max_queries_per_category': 50,
                'skip_difficult': True,
                'estimated_cost_usd': 3.00,
                'priority_keywords': ['佐渡', '両津', '相川', '本店', '老舗']
            },
            'standard': {
                'description': '最適化された全クエリ実行（推奨）',
                'max_queries_per_category': -1,
                'skip_difficult': True,
                'estimated_cost_usd': 7.95,
                'priority_keywords': []
            },
            'comprehensive': {
                'description': '従来通りの全件実行',
                'max_queries_per_category': -1,
                'skip_difficult': False,
                'estimated_cost_usd': 11.65,
                'priority_keywords': []
            }
        }
    
    def separate_by_location(self, spreadsheet_id=None):
        """
        データを佐渡市内・佐渡市外に分けて別シートに出力
        緯度経度による精密な地域判定を実装
        """
        print("\n🔄 データの地域別分離処理を開始...")
        print("📍 緯度経度による精密な佐渡島判定を使用")
        
        # 佐渡島内判定のためのインポート
        try:
            from places_data_updater import (
                is_within_sado_bounds, 
                classify_district_by_coordinates, 
                normalize_address, 
                classify_district
            )
        except ImportError:
            print("❌ 必要な判定関数をインポートできませんでした")
            return False
        
        # Google Sheets認証
        gc = authenticate_google_sheets()
        if not gc:
            print("❌ Google Sheets認証に失敗しました")
            return False
        
        try:
            if not spreadsheet_id:
                spreadsheet_id = os.environ.get('SPREADSHEET_ID')
            
            spreadsheet = gc.open_by_key(spreadsheet_id)
            
            # 対象シート名
            target_sheets = ['飲食店', '駐車場', '公衆トイレ']
            
            for sheet_name in target_sheets:
                try:
                    print(f"📊 {sheet_name}シートを処理中...")
                    
                    # 元のシートからデータを取得
                    try:
                        worksheet = spreadsheet.worksheet(sheet_name)
                    except gspread.WorksheetNotFound:
                        print(f"⚠️ {sheet_name}シートが見つかりません。スキップします。")
                        continue
                    
                    # データを取得
                    try:
                        data = worksheet.get_all_records()
                    except Exception as e:
                        if "duplicates" in str(e).lower():
                            print(f"⚠️ {sheet_name}シートでヘッダー重複エラー。スキップします。")
                            continue
                        else:
                            raise e
                    
                    if not data:
                        print(f"⚠️ {sheet_name}シートにデータがありません。スキップします。")
                        continue
                    
                    # DataFrameに変換
                    df = pd.DataFrame(data)
                    
                    # 住所列と緯度経度列の存在確認
                    address_column = None
                    for col in ['住所', '所在地', 'address']:
                        if col in df.columns:
                            address_column = col
                            break
                    
                    lat_column = None
                    lng_column = None
                    for col in ['緯度', 'latitude', 'lat']:
                        if col in df.columns:
                            lat_column = col
                            break
                    for col in ['経度', 'longitude', 'lng', 'lon']:
                        if col in df.columns:
                            lng_column = col
                            break
                    
                    if not address_column:
                        print(f"⚠️ {sheet_name}シートに住所情報がありません。スキップします。")
                        continue
                    
                    # 改良された佐渡島内判定
                    sado_indices = []
                    non_sado_indices = []
                    coord_fixed_count = 0
                    
                    for i, row in df.iterrows():
                        address = str(row.get(address_column, ''))
                        lat = row.get(lat_column, '') if lat_column else ''
                        lng = row.get(lng_column, '') if lng_column else ''
                        
                        is_sado = False
                        
                        # 緯度経度による判定（最優先）
                        if lat and lng:
                            try:
                                lat_float = float(lat)
                                lng_float = float(lng)
                                if is_within_sado_bounds(lat_float, lng_float):
                                    is_sado = True
                                    # 住所に佐渡市が含まれていないが緯度経度で佐渡島内と判定された場合
                                    if '佐渡市' not in address and '佐渡' not in address:
                                        coord_fixed_count += 1
                                        print(f"   📍 緯度経度により佐渡島内と判定: {row.get('店舗名', row.get('名称', 'unknown'))}")
                            except (ValueError, TypeError):
                                pass
                        
                        # 緯度経度がない/無効な場合は住所による判定
                        if not is_sado:
                            # 佐渡関連キーワードをチェック
                            sado_keywords = ['佐渡市', '佐渡', '新潟県佐渡', '両津', '相川', '佐和田', '金井', '新穂', '畑野', '真野', '小木', '羽茂', '赤泊']
                            is_sado = any(keyword in address for keyword in sado_keywords)
                        
                        if is_sado:
                            sado_indices.append(i)
                        else:
                            non_sado_indices.append(i)
                    
                    sado_data = df.iloc[sado_indices] if sado_indices else pd.DataFrame()
                    non_sado_data = df.iloc[non_sado_indices] if non_sado_indices else pd.DataFrame()
                    
                    print(f"   📊 佐渡市内: {len(sado_data)}件")
                    print(f"   📊 佐渡市外: {len(non_sado_data)}件")
                    if coord_fixed_count > 0:
                        print(f"   📍 緯度経度により修正: {coord_fixed_count}件")
                    
                    # 佐渡市外データがある場合のみ処理
                    if len(non_sado_data) > 0:
                        # 佐渡市外シートを作成または更新
                        non_sado_sheet_name = f"{sheet_name}_佐渡市外"
                        
                        try:
                            non_sado_worksheet = spreadsheet.worksheet(non_sado_sheet_name)
                            # 既存シートをクリア
                            non_sado_worksheet.clear()
                            print(f"   📝 既存の{non_sado_sheet_name}シートを更新")
                        except gspread.WorksheetNotFound:
                            # 新しいシートを作成
                            non_sado_worksheet = spreadsheet.add_worksheet(
                                title=non_sado_sheet_name, 
                                rows=len(non_sado_data) + 10, 
                                cols=len(df.columns)
                            )
                            print(f"   ✨ {non_sado_sheet_name}シートを新規作成")
                        
                        # 佐渡市外データを書き込み
                        if len(non_sado_data) > 0:
                            # ヘッダー行を含めてデータを準備
                            output_data = [list(df.columns)] + non_sado_data.values.tolist()
                            non_sado_worksheet.update(values=output_data, range_name='A1')
                            
                            print(f"   ✅ {len(non_sado_data)}件の佐渡市外データを{non_sado_sheet_name}シートに出力")
                            
                            # 佐渡市外の店舗リストを表示
                            print(f"   📍 佐渡市外の{sheet_name}:")
                            for idx, row in non_sado_data.iterrows():
                                name = row.get('店舗名', row.get('駐車場名', row.get('施設名', '名称不明')))
                                address = row.get(address_column, '住所不明')
                                print(f"      - {name} ({address})")
                        
                        # 元のシートを佐渡市内データのみに更新
                        if len(sado_data) > 0:
                            worksheet.clear()
                            sado_output_data = [list(df.columns)] + sado_data.values.tolist()
                            worksheet.update(values=sado_output_data, range_name='A1')
                            print(f"   🏠 元の{sheet_name}シートを佐渡市内データ({len(sado_data)}件)に更新")
                        else:
                            print(f"   ⚠️ {sheet_name}に佐渡市内データがありません")
                    else:
                        print(f"   ✅ {sheet_name}は全て佐渡市内データです")
                
                except Exception as e:
                    print(f"❌ {sheet_name}の処理中にエラーが発生: {e}")
                    continue
            
            print("\n✅ 地域別データ分離処理が完了しました！")
            return True
            
        except Exception as e:
            print(f"❌ データ分離処理でエラーが発生: {e}")
            return False
    
    def filter_queries_by_mode(self, queries, mode, category):
        """実行モードに基づいてクエリをフィルタリング"""
        config = self.execution_modes[mode]
        
        if not config['skip_difficult']:
            # comprehensive モード: フィルタリングなし
            return queries
        
        filtered_queries = []
        
        for query in queries:
            # スキップ対象チェック
            if self.strategy.should_skip_search(query):
                continue
            
            # quick モードの場合、追加フィルタリング
            if mode == 'quick':
                # 優先キーワードを含むクエリを優先
                has_priority = any(keyword in query for keyword in config['priority_keywords'])
                
                # 短すぎるクエリは除外
                if len(query.replace(' ', '')) < 3:
                    continue
                
                # 複雑すぎるクエリは除外（quick モードでは）
                if len(query) > 20 and not has_priority:
                    continue
                
                # 優先クエリまたは上位N件まで
                if has_priority or len(filtered_queries) < config['max_queries_per_category']:
                    filtered_queries.append(query)
            else:
                filtered_queries.append(query)
        
        # 最大件数制限
        max_queries = config['max_queries_per_category']
        if max_queries > 0:
            return filtered_queries[:max_queries]
        
        return filtered_queries
    
    def estimate_cost(self, mode, target_data='all'):
        """実行コストを見積もり"""
        query_files = {
            'restaurants': 'restaurants.txt',
            'parkings': 'parkings.txt', 
            'toilets': 'toilets.txt'
        }
        
        # TARGET_DATAによる絞り込み
        if target_data != 'all':
            category_mapping = {
                'restaurants': 'restaurants',
                'parkings': 'parkings',
                'toilets': 'toilets'
            }
            if target_data in category_mapping:
                query_files = {category_mapping[target_data]: query_files[category_mapping[target_data]]}
        
        total_queries = 0
        
        for category, filename in query_files.items():
            queries = load_queries_from_file(filename)
            filtered = self.filter_queries_by_mode(queries, mode, category)
            total_queries += len(filtered)
        
        # API呼び出し数を見積もり（平均2.1回/クエリ）
        estimated_api_calls = total_queries * 2.1
        estimated_cost = estimated_api_calls * 0.017  # Text Search API料金
        
        return {
            'total_queries': total_queries,
            'estimated_api_calls': int(estimated_api_calls),
            'estimated_cost_usd': estimated_cost,
            'mode_description': self.execution_modes[mode]['description']
        }
    
    def run_optimized(self, mode='standard', target_data='all', dry_run=False, separate_location=True):
        """最適化された実行"""
        print(f"🚀 コスト最適化実行モード: {mode}")
        
        # コスト見積もり
        estimation = self.estimate_cost(mode, target_data)
        print(f"📊 実行見積もり:")
        print(f"   - モード: {estimation['mode_description']}")
        print(f"   - 処理クエリ数: {estimation['total_queries']}")
        print(f"   - 予想API呼び出し: {estimation['estimated_api_calls']}")
        print(f"   - 予想コスト: ${estimation['estimated_cost_usd']:.3f} USD")
        
        if separate_location:
            print(f"   - 後処理: 佐渡市内・佐渡市外データの自動分離")
        
        if dry_run:
            print("💡 ドライラン完了（実際の実行は行いませんでした）")
            return
        
        # 実行確認
        user_input = input("\n実行を続けますか？ (y/N): ")
        if user_input.lower() not in ['y', 'yes']:
            print("❌ 実行をキャンセルしました")
            return
        
        # 環境変数を設定してモード情報を渡す
        os.environ['EXECUTION_MODE'] = mode
        os.environ['TARGET_DATA'] = target_data
        
        print(f"\n✅ 実行開始...")
        
        # 元のメイン処理を実行
        try:
            original_main()
            
            # 地域別データ分離処理
            if separate_location:
                self.separate_by_location()
                
        except Exception as e:
            print(f"❌ 実行エラー: {e}")

def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(description='佐渡飲食店マップ - コスト最適化実行')
    parser.add_argument('--mode', choices=['quick', 'standard', 'comprehensive'], 
                       default='standard', help='実行モード')
    parser.add_argument('--target', choices=['all', 'restaurants', 'parkings', 'toilets'],
                       default='all', help='対象データ')
    parser.add_argument('--dry-run', action='store_true', help='ドライラン（見積もりのみ）')
    parser.add_argument('--estimate-only', action='store_true', help='コスト見積もりのみ表示')
    parser.add_argument('--no-separate', action='store_true', help='佐渡市内・佐渡市外の自動分離を無効化')
    parser.add_argument('--separate-only', action='store_true', help='データ分離のみ実行（Places API は呼ばない）')
    
    args = parser.parse_args()
    
    runner = CostOptimizedRunner()
    
    if args.separate_only:
        # データ分離のみ実行
        print("🔄 データ分離処理のみ実行します...")
        runner.separate_by_location()
        return
    
    if args.estimate_only:
        # 全モードの見積もりを表示
        print("💰 実行モード別コスト見積もり\n")
        for mode in ['quick', 'standard', 'comprehensive']:
            estimation = runner.estimate_cost(mode, args.target)
            print(f"📋 {mode.upper()}モード:")
            print(f"   {estimation['mode_description']}")
            print(f"   クエリ数: {estimation['total_queries']}")
            print(f"   API呼び出し: {estimation['estimated_api_calls']}")
            print(f"   コスト: ${estimation['estimated_cost_usd']:.3f} USD\n")
    else:
        separate_location = not args.no_separate
        runner.run_optimized(args.mode, args.target, args.dry_run, separate_location)

if __name__ == '__main__':
    main()
