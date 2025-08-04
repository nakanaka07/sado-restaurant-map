#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
佐渡飲食店マップ - 統合実行スクリプト
新しいディレクトリ構造に対応した最適化済み実行制御

機能:
- 統合CID処理による高効率データ取得
- コスト最適化実行モード
- 佐渡市内・佐渡市外データの自動分離
- 段階的実行による安全性確保

使用例:
    python run_unified.py --mode=standard --target=restaurants
    python run_unified.py --mode=quick --dry-run
    python run_unified.py --separate-only
"""

import os
import sys
import argparse
from datetime import datetime

# パス設定
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# 環境変数の明示的読み込み
from dotenv import load_dotenv
config_dir = os.path.join(current_dir, 'config')
config_env_path = os.path.join(config_dir, '.env')
if os.path.exists(config_env_path):
    load_dotenv(config_env_path)
    print(f"📄 環境変数を読み込み: {config_env_path}")
else:
    load_dotenv()
    print("📄 デフォルト.envファイルを読み込み")

# 統合処理クラスをインポート
from processors.unified_cid_processor import UnifiedCIDProcessor
from utils.google_auth import validate_environment
from utils.output_formatter import OutputFormatter

# 旧スクリプトとの互換性のため
try:
    from run_optimized import CostOptimizedRunner
except ImportError:
    print("⚠️ run_optimized.py が見つかりません。基本機能のみ使用します。")
    CostOptimizedRunner = None

class UnifiedRunner:
    """統合実行制御クラス"""
    
    def __init__(self):
        self.data_files = {
            'restaurants': 'data/urls/restaurants_merged.txt',  # 🆕 統合ファイルを使用
            'parkings': 'data/queries/parkings.txt',
            'toilets': 'data/queries/toilets.txt'
        }
        
        # 旧ファイル構造との互換性（非推奨）
        self.legacy_files = {
            'restaurants_txt': 'data/queries/restaurants.txt',
            'restaurants_urls': 'data/urls/restaurants_urls.txt'
        }
        
        # 実行モード設定
        self.modes = {
            'quick': {
                'description': '高速モード（CID URLのみ処理）',
                'cost_multiplier': 0.3,
                'filter_strategy': 'cid_only'
            },
            'standard': {
                'description': '標準モード（CID URL + 高精度店舗名）',
                'cost_multiplier': 0.7,
                'filter_strategy': 'cid_and_high_confidence'
            },
            'comprehensive': {
                'description': '包括モード（全データ処理）',
                'cost_multiplier': 1.0,
                'filter_strategy': 'all'
            }
        }
    
    def estimate_cost(self, mode: str, target_data: str = 'all') -> dict:
        """処理コストを見積もり"""
        total_queries = 0
        file_details = {}
        
        # 対象ファイルの決定
        if target_data == 'all':
            target_files = self.data_files
        else:
            target_files = {target_data: self.data_files.get(target_data)}
            if not target_files[target_data]:
                print(f"❌ 不明なターゲット: {target_data}")
                return {}
        
        # 各ファイルのクエリ数をカウント
        for category, file_path in target_files.items():
            if not file_path:
                continue
                
            full_path = os.path.join(current_dir, file_path)
            if os.path.exists(full_path):
                with open(full_path, 'r', encoding='utf-8') as f:
                    lines = [line.strip() for line in f if line.strip() and not line.startswith('#')]
                    file_details[category] = len(lines)
                    total_queries += len(lines)
            else:
                print(f"⚠️ ファイルが見つかりません: {file_path}")
                file_details[category] = 0
        
        # モード設定を適用
        mode_config = self.modes.get(mode, self.modes['standard'])
        estimated_api_calls = int(total_queries * mode_config['cost_multiplier'])
        estimated_cost = estimated_api_calls * 0.017  # Places API価格
        estimated_time = estimated_api_calls * 1.0 / 60  # 1秒間隔想定
        
        return {
            'mode': mode,
            'mode_description': mode_config['description'],
            'total_queries': total_queries,
            'estimated_api_calls': estimated_api_calls,
            'estimated_cost_usd': estimated_cost,
            'estimated_time_minutes': estimated_time,
            'file_details': file_details,
            'filter_strategy': mode_config['filter_strategy']
        }
    
    def run_unified_processing(self, mode: str = 'standard', target_data: str = 'all', 
                             dry_run: bool = False, separate_location: bool = True):
        """統合処理実行"""
        
        # 統一ヘッダー出力
        script_name = "統合処理実行"
        mode_descriptions = {
            'quick': '高速モード',
            'standard': '標準モード', 
            'comprehensive': '包括モード'
        }
        mode_desc = mode_descriptions.get(mode, mode)
        
        OutputFormatter.print_header(script_name, mode_desc)
        
        # 環境変数検証
        if not validate_environment():
            OutputFormatter.print_footer(False, "環境変数の設定を確認してください")
            return False
        
        # コスト見積もり
        cost_info = self.estimate_cost(mode, target_data)
        if not cost_info:
            OutputFormatter.print_footer(False, "コスト見積もりに失敗しました")
            return False
        
        # 実行計画表示
        OutputFormatter.print_execution_plan(
            mode=cost_info['mode_description'],
            target=target_data,
            total_queries=cost_info['total_queries'],
            estimated_cost=cost_info['estimated_cost_usd'],
            estimated_time=cost_info['estimated_time_minutes']
        )
        
        print(f"\n📁 ファイル詳細:")
        for category, count in cost_info['file_details'].items():
            emoji = OutputFormatter.EMOJI.get(category, '📄')
            print(f"   {emoji} {category}: {count}件")
        
        if dry_run:
            OutputFormatter.print_footer(True, "ドライラン完了（実際の処理は行いませんでした）")
            return True
        
        # 実行確認
        user_input = input(f"\n実行を続けますか？ (y/N): ")
        if user_input.lower() not in ['y', 'yes']:
            print("❌ 実行をキャンセルしました")
            return False
        
        # 処理実行
        results = {}
        
        # 対象ファイルの決定
        if target_data == 'all':
            target_files = self.data_files
        else:
            target_files = {target_data: self.data_files.get(target_data)}
        
        # 各カテゴリを処理
        for category, file_path in target_files.items():
            if not file_path:
                continue
                
            full_path = os.path.join(current_dir, file_path)
            if not os.path.exists(full_path):
                print(f"⚠️ スキップ: {file_path}")
                continue
            
            print(f"\n🔄 {category}データを処理中...")
            
            # 統合CID処理を実行
            processor = UnifiedCIDProcessor()
            queries_data = processor.parse_query_file(full_path)
            
            if queries_data:
                # モードに応じてフィルタリング
                filtered_queries = self.filter_queries_by_mode(queries_data, mode)
                
                if filtered_queries:
                    processed_results = processor.process_all_queries(filtered_queries)
                    
                    if processed_results:
                        # 結果を保存
                        sheet_name = f"{category}_統合処理"
                        if processor.save_to_spreadsheet(sheet_name):
                            results[category] = len(processed_results)
                        else:
                            print(f"❌ {category}の保存に失敗")
                    else:
                        print(f"❌ {category}の処理結果が空です")
                else:
                    print(f"⚠️ {category}: フィルタリング後のクエリが0件")
            else:
                print(f"❌ {category}: クエリの解析に失敗")
        
        # 実行結果サマリー
        OutputFormatter.print_results_summary(results)
        
        # 佐渡市内・市外分離（オプション）
        if separate_location and CostOptimizedRunner:
            OutputFormatter.print_section("佐渡市内・市外データ分離", "map")
            try:
                optimizer = CostOptimizedRunner()
                optimizer.separate_by_location()
            except Exception as e:
                print(f"⚠️ データ分離処理でエラー: {e}")
        
        # 統一フッター出力
        success = len(results) > 0
        message = f"総処理件数: {sum(results.values())}件" if success else "処理対象データが見つかりませんでした"
        OutputFormatter.print_footer(success, message)
        
        return success
    
    def filter_queries_by_mode(self, queries_data: list, mode: str) -> list:
        """モードに応じてクエリをフィルタリング"""
        mode_config = self.modes.get(mode, self.modes['standard'])
        strategy = mode_config['filter_strategy']
        
        if strategy == 'cid_only':
            # CID URLのみ
            return [q for q in queries_data if q['type'] == 'cid_url']
        
        elif strategy == 'cid_and_high_confidence':
            # CID URL + 短い店舗名（高精度）
            filtered = []
            for q in queries_data:
                if q['type'] == 'cid_url':
                    filtered.append(q)
                elif q['type'] == 'store_name' and len(q['store_name']) <= 15:
                    filtered.append(q)
                elif q['type'] == 'maps_url':
                    filtered.append(q)
            return filtered
        
        else:  # 'all'
            return queries_data

def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(description='佐渡飲食店マップ - 統合実行制御')
    parser.add_argument('--mode', choices=['quick', 'standard', 'comprehensive'], 
                       default='standard', help='実行モード')
    parser.add_argument('--target', choices=['all', 'restaurants', 'parkings', 'toilets'],
                       default='all', help='対象データ')
    parser.add_argument('--dry-run', action='store_true', help='ドライラン（見積もりのみ）')
    parser.add_argument('--estimate-only', action='store_true', help='コスト見積もりのみ表示')
    parser.add_argument('--no-separate', action='store_true', help='佐渡市内・佐渡市外の自動分離を無効化')
    parser.add_argument('--separate-only', action='store_true', help='データ分離のみ実行')
    
    args = parser.parse_args()
    
    runner = UnifiedRunner()
    
    # データ分離のみ実行
    if args.separate_only:
        if CostOptimizedRunner:
            OutputFormatter.print_header("データ分離実行", "市内・市外分離")
            optimizer = CostOptimizedRunner()
            optimizer.separate_by_location()
            OutputFormatter.print_footer(True, "データ分離処理完了")
        else:
            print("❌ データ分離機能が利用できません")
        return
    
    # 見積もりのみ表示
    if args.estimate_only:
        OutputFormatter.print_header("コスト見積もり", args.mode)
        cost_info = runner.estimate_cost(args.mode, args.target)
        if cost_info:
            OutputFormatter.print_execution_plan(
                mode=cost_info['mode_description'],
                target=args.target,
                total_queries=cost_info['total_queries'],
                estimated_cost=cost_info['estimated_cost_usd'],
                estimated_time=cost_info['estimated_time_minutes']
            )
            OutputFormatter.print_footer(True, "見積もり完了")
        else:
            OutputFormatter.print_footer(False, "見積もり計算に失敗")
        return
    
    # 統合処理実行
    success = runner.run_unified_processing(
        mode=args.mode,
        target_data=args.target,
        dry_run=args.dry_run,
        separate_location=not args.no_separate
    )
    
    # 最終処理は run_unified_processing 内で OutputFormatter が実行

if __name__ == '__main__':
    main()
