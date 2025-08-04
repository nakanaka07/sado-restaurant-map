#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
佐渡飲食店マップ - クエリファイル分析ツール
検索効率の問題点を特定し、改善提案を生成
"""

import os
import re
from collections import Counter, defaultdict

class QueryAnalyzer:
    """クエリファイル分析クラス"""
    
    def __init__(self, script_dir):
        self.script_dir = script_dir
        self.problematic_patterns = {
            'has_parentheses': r'[（(].*?[）)]',
            'has_brackets': r'[【『].*?[】』]', 
            'has_status_info': r'(現：|旧：|移転|閉店|廃業)',
            'has_symbols': r'[・＆&]',
            'very_long': lambda x: len(x) > 20,
            'very_short': lambda x: len(x.replace(' ', '')) < 3,
            'has_store_suffix': r'(店|支店|本店|分店)$'
        }
    
    def analyze_query_file(self, filename, category):
        """クエリファイルを分析"""
        file_path = os.path.join(self.script_dir, filename)
        
        if not os.path.exists(file_path):
            return None
        
        with open(file_path, 'r', encoding='utf-8') as f:
            queries = [line.strip() for line in f 
                      if line.strip() and not line.strip().startswith('#')]
        
        analysis = {
            'category': category,
            'total_queries': len(queries),
            'problematic_queries': defaultdict(list),
            'suggestions': [],
            'skip_candidates': [],
            'optimization_candidates': []
        }
        
        for query in queries:
            # 問題パターンの検出
            for pattern_name, pattern in self.problematic_patterns.items():
                if callable(pattern):
                    if pattern(query):
                        analysis['problematic_queries'][pattern_name].append(query)
                else:
                    if re.search(pattern, query):
                        analysis['problematic_queries'][pattern_name].append(query)
            
            # スキップ候補の特定
            if any(keyword in query for keyword in ['現：', '旧：', '移転', '閉店']):
                analysis['skip_candidates'].append(query)
            
            # 最適化候補の特定
            if len(query) > 15 and any(char in query for char in ['・', '＆']):
                analysis['optimization_candidates'].append(query)
        
        # 改善提案の生成
        analysis['suggestions'] = self._generate_suggestions(analysis)
        
        return analysis
    
    def _generate_suggestions(self, analysis):
        """改善提案を生成"""
        suggestions = []
        
        # スキップ提案
        if analysis['skip_candidates']:
            suggestions.append({
                'type': 'skip',
                'count': len(analysis['skip_candidates']),
                'description': f"{len(analysis['skip_candidates'])}個のクエリをスキップしてAPI呼び出しを削減できます",
                'examples': analysis['skip_candidates'][:3]
            })
        
        # 括弧除去提案
        parentheses_count = len(analysis['problematic_queries']['has_parentheses'])
        if parentheses_count > 0:
            suggestions.append({
                'type': 'clean_parentheses',
                'count': parentheses_count,
                'description': f"{parentheses_count}個のクエリで括弧内情報を除去して検索精度を向上できます",
                'examples': analysis['problematic_queries']['has_parentheses'][:3]
            })
        
        # 複合語分割提案
        symbols_count = len(analysis['problematic_queries']['has_symbols'])
        if symbols_count > 0:
            suggestions.append({
                'type': 'split_compounds',
                'count': symbols_count,
                'description': f"{symbols_count}個のクエリで複合語を分割して検索バリエーションを増やせます",
                'examples': analysis['problematic_queries']['has_symbols'][:3]
            })
        
        return suggestions
    
    def generate_optimized_query_file(self, filename, category):
        """最適化されたクエリファイルを生成"""
        analysis = self.analyze_query_file(filename, category)
        if not analysis:
            return None
        
        original_path = os.path.join(self.script_dir, filename)
        optimized_path = os.path.join(self.script_dir, f"optimized_{filename}")
        
        with open(original_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        optimized_lines = []
        skip_count = 0
        clean_count = 0
        
        for line in lines:
            stripped = line.strip()
            
            # コメント行はそのまま保持
            if not stripped or stripped.startswith('#'):
                optimized_lines.append(line)
                continue
            
            # スキップ対象かチェック
            if any(keyword in stripped for keyword in ['現：', '旧：', '移転', '閉店', '廃業']):
                optimized_lines.append(f"# SKIPPED: {line}")
                skip_count += 1
                continue
            
            # クリーニング処理
            cleaned = stripped
            
            # 括弧内情報を除去
            cleaned = re.sub(r'[（(].*?[）)]', '', cleaned)
            
            # 記号を空白に置換
            cleaned = re.sub(r'[・＆&]', ' ', cleaned)
            
            # 余分な空白を除去
            cleaned = re.sub(r'\s+', ' ', cleaned).strip()
            
            if cleaned != stripped:
                optimized_lines.append(f"{cleaned}\n")
                clean_count += 1
            else:
                optimized_lines.append(line)
        
        # 最適化されたファイルを保存
        with open(optimized_path, 'w', encoding='utf-8') as f:
            f.writelines(optimized_lines)
        
        return {
            'original_file': filename,
            'optimized_file': f"optimized_{filename}",
            'skip_count': skip_count,
            'clean_count': clean_count,
            'analysis': analysis
        }

def main():
    """メイン分析処理"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    analyzer = QueryAnalyzer(script_dir)
    
    query_files = {
        'restaurants.txt': '飲食店',
        'parkings.txt': '駐車場', 
        'toilets.txt': '公衆トイレ'
    }
    
    print("=== 佐渡飲食店マップ クエリファイル分析 ===\n")
    
    total_savings = 0
    
    for filename, category in query_files.items():
        print(f"📋 分析中: {filename} ({category})")
        
        # 分析実行
        analysis = analyzer.analyze_query_file(filename, category)
        if not analysis:
            print(f"  ❌ ファイルが見つかりません: {filename}\n")
            continue
        
        print(f"  📊 総クエリ数: {analysis['total_queries']}")
        
        # 問題パターンの報告
        for pattern, queries in analysis['problematic_queries'].items():
            if queries:
                print(f"    - {pattern}: {len(queries)}個")
        
        # 改善提案の表示
        if analysis['suggestions']:
            print(f"  💡 改善提案:")
            for suggestion in analysis['suggestions']:
                print(f"    - {suggestion['description']}")
                if suggestion['examples']:
                    print(f"      例: {', '.join(suggestion['examples'])}")
        
        # 最適化ファイル生成
        optimization_result = analyzer.generate_optimized_query_file(filename, category)
        if optimization_result:
            print(f"  ✅ 最適化ファイル生成: {optimization_result['optimized_file']}")
            print(f"    - スキップ: {optimization_result['skip_count']}個")
            print(f"    - クリーニング: {optimization_result['clean_count']}個")
            
            # API呼び出し削減効果を計算
            saved_calls = optimization_result['skip_count']
            saved_cost = saved_calls * 0.017  # Text Search API料金
            total_savings += saved_cost
            
            print(f"    - 削減API呼び出し: {saved_calls}回")
            print(f"    - 削減コスト: ${saved_cost:.3f} USD")
        
        print()
    
    print(f"💰 総削減コスト見込み: ${total_savings:.3f} USD")
    print(f"📈 改善効果: API呼び出し効率の向上とコスト削減")

if __name__ == "__main__":
    main()
