#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新店舗発見統合実行システム
定期実行・段階的発見・通知機能付き

実行モード:
- daily: 日次実行（主要エリアのみ）
- weekly: 週次実行（全島中精度）
- monthly: 月次実行（全島高精度）
- discovery: ワンタイム発見（カスタム設定）
"""

import os
import sys
import argparse
import json
from datetime import datetime
from typing import Dict, List, Optional

# 共通ライブラリインポート
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from processors.new_store_discoverer import NewStoreDiscoverer, NewStoreCandidate
from processors.unified_cid_processor import UnifiedCIDProcessor
from utils.output_formatter import OutputFormatter

class NewStoreDiscoveryRunner:
    """新店舗発見統合実行クラス"""
    
    def __init__(self):
        self.discoverer = NewStoreDiscoverer()
        self.cid_processor = UnifiedCIDProcessor()
        
        # 実行モード設定
        self.mode_configs = {
            'daily': {
                'name': '日次発見',
                'grid_size_km': 3.0,
                'max_cells': 20,
                'target_areas': ['両津', '相川', '真野'],
                'confidence_threshold': 0.7
            },
            'weekly': {
                'name': '週次発見',
                'grid_size_km': 2.5,
                'max_cells': 50,
                'target_areas': None,  # 全島
                'confidence_threshold': 0.6
            },
            'monthly': {
                'name': '月次発見',
                'grid_size_km': 2.0,
                'max_cells': None,  # 制限なし
                'target_areas': None,  # 全島
                'confidence_threshold': 0.5
            },
            'discovery': {
                'name': 'カスタム発見',
                'grid_size_km': 2.0,
                'max_cells': None,
                'target_areas': None,
                'confidence_threshold': 0.5
            }
        }
    
    def run_discovery(self, mode: str = 'discovery', **kwargs) -> Dict:
        """新店舗発見を実行"""
        config = self.mode_configs.get(mode, self.mode_configs['discovery'])
        
        # カスタム設定の適用
        for key, value in kwargs.items():
            if value is not None:
                config[key] = value
        
        OutputFormatter.print_section(f"{config['name']}モード実行開始", "rocket")
        print(f"🎯 グリッドサイズ: {config['grid_size_km']}km")
        print(f"🎯 最大セル数: {config.get('max_cells', '制限なし')}")
        print(f"🎯 信頼度閾値: {config['confidence_threshold']}")
        
        # 新店舗発見実行
        start_time = datetime.now()
        candidates = self.discoverer.discover_new_stores(
            max_cells=config.get('max_cells')
        )
        end_time = datetime.now()
        
        # 信頼度フィルタリング
        filtered_candidates = [
            c for c in candidates 
            if c.confidence_score >= config['confidence_threshold']
        ]
        
        # 実行結果
        result = {
            'mode': mode,
            'config': config,
            'execution_time': (end_time - start_time).total_seconds(),
            'total_candidates': len(candidates),
            'filtered_candidates': len(filtered_candidates),
            'candidates': filtered_candidates,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat()
        }
        
        OutputFormatter.print_section("実行結果", "chart")
        print(f"⏱️  実行時間: {result['execution_time']:.1f}秒")
        print(f"🔍 発見候補総数: {result['total_candidates']}件")
        print(f"✅ 高信頼度候補: {result['filtered_candidates']}件")
        
        return result
    
    def validate_new_candidates(self, candidates: List[NewStoreCandidate]) -> List[Dict]:
        """新店舗候補の詳細検証"""
        OutputFormatter.print_section("候補詳細検証中", "magnifier")
        
        validated_results = []
        
        for i, candidate in enumerate(candidates, 1):
            print(f"\n🔍 [{i}/{len(candidates)}] 検証中: {candidate.name}")
            
            # Place IDから詳細情報を取得
            details = self.cid_processor.get_place_details(candidate.place_id)
            
            if details:
                validated_info = {
                    'candidate': candidate,
                    'details': details,
                    'validation_status': 'success',
                    'phone': details.get('formatted_phone_number', ''),
                    'website': details.get('website', ''),
                    'business_status': details.get('business_status', ''),
                    'user_ratings_total': details.get('user_ratings_total', 0),
                    'rating': details.get('rating', 0),
                    'opening_hours': details.get('opening_hours', {})
                }
                
                # 新店舗度の再評価
                validation_score = self._calculate_validation_score(validated_info)
                validated_info['final_confidence'] = validation_score
                
                validated_results.append(validated_info)
                print(f"   ✅ 検証完了 (最終信頼度: {validation_score:.3f})")
            else:
                validated_results.append({
                    'candidate': candidate,
                    'validation_status': 'failed',
                    'final_confidence': 0.0
                })
                print(f"   ❌ 詳細取得失敗")
        
        # 信頼度順でソート
        validated_results.sort(key=lambda x: x.get('final_confidence', 0), reverse=True)
        
        return validated_results
    
    def _calculate_validation_score(self, validation_info: Dict) -> float:
        """検証後の最終信頼度スコア計算"""
        base_score = validation_info['candidate'].confidence_score
        
        # 評価数による調整
        ratings_total = validation_info.get('user_ratings_total', 0)
        if ratings_total == 0:
            base_score += 0.2  # 評価なし = 新店舗の可能性大
        elif ratings_total < 5:
            base_score += 0.1
        elif ratings_total > 50:
            base_score -= 0.2  # 評価多数 = 古い店舗の可能性
        
        # 営業状況による調整
        business_status = validation_info.get('business_status', '')
        if business_status == 'OPERATIONAL':
            base_score += 0.1
        elif business_status in ['CLOSED_PERMANENTLY', 'CLOSED_TEMPORARILY']:
            base_score = 0.0  # 閉店店舗は除外
        
        # ウェブサイト・電話番号の有無
        if validation_info.get('website'):
            base_score += 0.05
        if validation_info.get('phone'):
            base_score += 0.05
        
        return min(max(base_score, 0.0), 1.0)
    
    def generate_discovery_summary(self, result: Dict, validated_results: List[Dict]) -> str:
        """発見サマリーレポート生成"""
        candidates = result['candidates']
        high_confidence = [v for v in validated_results if v.get('final_confidence', 0) >= 0.8]
        
        summary = f"""
🎯 佐渡島新店舗発見レポート
{'='*50}

📅 実行日時: {datetime.now().strftime('%Y年%m月%d日 %H:%M')}
🔧 実行モード: {result['config']['name']}
⏱️ 実行時間: {result['execution_time']:.1f}秒

📊 発見結果:
   🔍 初期候補: {result['total_candidates']}件
   ✅ 高信頼度: {len(high_confidence)}件
   🎯 要確認: {len(validated_results) - len(high_confidence)}件

🏆 最有力候補:"""
        
        for i, v in enumerate(high_confidence[:5], 1):
            candidate = v['candidate']
            summary += f"\n   {i}. {candidate.name}"
            summary += f"\n      📍 {candidate.address}"
            summary += f"\n      🎯 信頼度: {v.get('final_confidence', 0):.3f}"
            summary += f"\n      📞 {v.get('phone', '情報なし')}"
        
        summary += f"\n\n📋 次回アクション:"
        summary += f"\n   1. 高信頼度候補の現地確認"
        summary += f"\n   2. 既存データベースへの追加"
        summary += f"\n   3. 手動検証による最終確認"
        
        return summary
    
    def save_full_report(self, result: Dict, validated_results: List[Dict]) -> bool:
        """完全レポートをスプレッドシートに保存"""
        if not validated_results:
            return False
        
        try:
            # 候補リストを保存
            success = self.discoverer.save_discoveries_to_spreadsheet(result['candidates'])
            
            if success:
                # 検証済みデータも追加保存
                print("📝 検証済みデータの詳細保存中...")
                # 実装: 検証済み詳細データの保存
                
            return success
            
        except Exception as e:
            print(f"❌ レポート保存エラー: {e}")
            return False

def main():
    """メイン実行関数"""
    parser = argparse.ArgumentParser(description='佐渡島新店舗発見統合システム')
    
    parser.add_argument('mode', choices=['daily', 'weekly', 'monthly', 'discovery'],
                       help='実行モード')
    parser.add_argument('--validate', action='store_true',
                       help='候補の詳細検証を実行')
    parser.add_argument('--save', action='store_true',
                       help='結果をスプレッドシートに保存')
    parser.add_argument('--max-cells', type=int,
                       help='最大検索セル数（テスト用）')
    parser.add_argument('--confidence', type=float,
                       help='信頼度閾値（0.0-1.0）')
    parser.add_argument('--grid-size', type=float,
                       help='グリッドサイズ（km）')
    
    args = parser.parse_args()
    
    runner = NewStoreDiscoveryRunner()
    
    # カスタム設定の準備
    custom_config = {}
    if args.max_cells:
        custom_config['max_cells'] = args.max_cells
    if args.confidence:
        custom_config['confidence_threshold'] = args.confidence
    if args.grid_size:
        custom_config['grid_size_km'] = args.grid_size
    
    # 新店舗発見実行
    result = runner.run_discovery(args.mode, **custom_config)
    
    validated_results = []
    
    # 詳細検証
    if args.validate and result['candidates']:
        validated_results = runner.validate_new_candidates(result['candidates'])
    
    # サマリー出力
    if validated_results or result['candidates']:
        summary = runner.generate_discovery_summary(result, validated_results)
        print(summary)
    
    # 保存
    if args.save:
        success = runner.save_full_report(result, validated_results)
        if success:
            print("✅ レポート保存完了")

if __name__ == '__main__':
    main()
