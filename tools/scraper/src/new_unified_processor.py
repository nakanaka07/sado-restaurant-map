#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
統合プロセッサー

NewAPIProcessorを基盤とした統合処理システム
Legacy APIとNew APIの両方に対応
"""

import os
import sys
from typing import List, Dict, Optional

# 現在のディレクトリをパスに追加
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
sys.path.append(current_dir)

from processors.new_api_processor import NewAPIProcessor


class NewUnifiedProcessor(NewAPIProcessor):
    """統合プロセッサークラス（New API版）"""
    
    def __init__(self):
        """初期化"""
        super().__init__()
        self.processed_count = 0
        self.total_count = 0
        
        print("🔧 NewUnifiedProcessor 初期化完了")
        print("   - Places API (New) v1 対応")
        print("   - 佐渡地域特化検索")
        print("   - 自動地区分類")
    
    def run_unified_processing(self, 
                             input_file: str, 
                             sheet_name: str = None,
                             separate_location: bool = True,
                             dry_run: bool = False) -> Dict:
        """統合処理実行"""
        
        # ファイル存在確認
        if not os.path.exists(input_file):
            print(f"❌ ファイルが見つかりません: {input_file}")
            return {'status': 'error', 'message': 'File not found'}
        
        print(f"\n🚀 統合処理開始")
        print(f"   📄 入力ファイル: {input_file}")
        print(f"   📊 シート名: {sheet_name or '自動生成'}")
        print(f"   🌍 地域分離: {'有効' if separate_location else '無効'}")
        print(f"   🧪 ドライラン: {'有効' if dry_run else '無効'}")
        
        try:
            # Step 1: クエリファイル解析
            print(f"\n📋 Step 1: クエリファイル解析")
            queries = self.parse_query_file(input_file)
            if not queries:
                return {'status': 'error', 'message': 'No valid queries found'}
            
            self.total_count = len(queries)
            print(f"   解析完了: {self.total_count}件のクエリ")
            
            # ドライランの場合はここで終了
            if dry_run:
                print("\n🧪 ドライラン完了")
                print(f"   処理予定: {self.total_count}件")
                return {
                    'status': 'dry_run_success',
                    'queries_count': self.total_count,
                    'queries': queries[:5]  # 最初の5件のみ表示
                }
            
            # Step 2: API処理実行
            print(f"\n🔍 Step 2: Places API処理")
            results = self.process_all_queries(queries)
            
            if not results:
                return {'status': 'error', 'message': 'No data processed successfully'}
            
            self.processed_count = len(results)
            
            # Step 3: データ保存
            if not dry_run:
                print(f"\n💾 Step 3: データ保存")
                
                # シート名の自動生成
                if not sheet_name:
                    from datetime import datetime
                    sheet_name = f"restaurants_{datetime.now().strftime('%Y%m%d_%H%M')}"
                
                # スプレッドシート保存
                save_success = self.save_to_spreadsheet(sheet_name, separate_location)
                
                if save_success:
                    print(f"\n✅ 処理完了")
                    return {
                        'status': 'success',
                        'processed_count': self.processed_count,
                        'total_count': self.total_count,
                        'success_rate': f"{(self.processed_count/self.total_count)*100:.1f}%",
                        'sheet_name': sheet_name,
                        'failed_count': len(self.failed_queries)
                    }
                else:
                    print(f"\n⚠️ データ保存に失敗")
                    return {
                        'status': 'partial_success',
                        'processed_count': self.processed_count,
                        'message': 'Data processed but saving failed'
                    }
            
        except Exception as e:
            print(f"\n❌ 処理中にエラーが発生: {e}")
            import traceback
            traceback.print_exc()
            return {'status': 'error', 'message': str(e)}
    
    def process_restaurants(self, 
                          input_file: str = None, 
                          dry_run: bool = False) -> Dict:
        """レストランデータ処理（標準モード）"""
        
        # デフォルトファイルの設定
        if not input_file:
            input_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'restaurants_merged.txt')
        
        print(f"\n🍽️ レストランデータ処理開始")
        return self.run_unified_processing(
            input_file=input_file,
            sheet_name="restaurants_data",
            separate_location=True,
            dry_run=dry_run
        )
    
    def process_all_data(self, dry_run: bool = False) -> Dict:
        """全データ処理"""
        print(f"\n🌟 全データ処理開始")
        
        # レストランデータ処理
        result = self.process_restaurants(dry_run=dry_run)
        
        # 将来的に他のデータタイプも追加可能
        # - 観光地データ
        # - ホテル・宿泊施設データ
        # - ショッピング施設データ
        
        return result
    
    def get_processing_stats(self) -> Dict:
        """処理統計を取得"""
        return {
            'processed_count': self.processed_count,
            'total_count': self.total_count,
            'success_rate': f"{(self.processed_count/self.total_count)*100:.1f}%" if self.total_count > 0 else "0%",
            'failed_count': len(self.failed_queries),
            'successful_results': len(self.results)
        }
    
    def print_summary(self):
        """処理サマリーを出力"""
        stats = self.get_processing_stats()
        
        print(f"\n📊 処理サマリー")
        print(f"   総クエリ数: {stats['total_count']}")
        print(f"   成功数: {stats['processed_count']}")
        print(f"   失敗数: {stats['failed_count']}")
        print(f"   成功率: {stats['success_rate']}")
        
        if self.failed_queries:
            print(f"\n❌ 失敗したクエリ（最初の5件）:")
            for query in self.failed_queries[:5]:
                print(f"   - {query.get('store_name', 'Unknown')}")


# モジュールレベルでの直接実行テスト
if __name__ == "__main__":
    print("🧪 NewUnifiedProcessor テスト実行")
    
    processor = NewUnifiedProcessor()
    
    # 基本機能テスト
    test_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'restaurants_merged.txt')
    
    if os.path.exists(test_file):
        result = processor.process_restaurants(test_file, dry_run=True)
        print(f"\n✅ テスト結果: {result}")
    else:
        print(f"❌ テストファイルが見つかりません: {test_file}")
