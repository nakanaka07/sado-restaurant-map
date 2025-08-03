#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
佐渡飲食店マップ - 改善された検索戦略
検索効率とAPI利用料金の最適化
"""

import re
from typing import List, Dict, Tuple, Optional

class ImprovedSearchStrategy:
    """改善された検索戦略クラス"""
    
    def __init__(self):
        # 佐渡の主要地域（検索に使用）
        self.sado_areas = [
            "両津", "相川", "佐和田", "金井", "新穂", "畑野", "真野", "小木", "羽茂", "赤泊"
        ]
        
        # 検索対象外キーワード（存在確率が低い店舗）
        self.exclude_keywords = [
            "移転", "閉店", "現：", "旧：", "（", "）", "#", 
            "廃業", "休業", "一時閉店", "建て替え"
        ]
        
        # カテゴリ別の検索強化キーワード
        self.category_keywords = {
            "飲食店": ["レストラン", "食堂", "カフェ", "居酒屋", "寿司", "ラーメン", "そば", "うどん"],
            "駐車場": ["駐車場", "パーキング", "駐車"],
            "公衆トイレ": ["トイレ", "公衆トイレ", "便所"]
        }
    
    def should_skip_search(self, query: str) -> bool:
        """検索をスキップすべきクエリかどうかを判定"""
        return any(keyword in query for keyword in self.exclude_keywords)
    
    def extract_business_name(self, query: str) -> str:
        """店舗名から不要な情報を除去"""
        # 括弧内の情報を除去
        cleaned = re.sub(r'[（(].*?[）)]', '', query)
        
        # 特殊記号を除去
        cleaned = re.sub(r'[・＆&]', ' ', cleaned)
        
        # 余分なスペースを除去
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        return cleaned
    
    def generate_smart_search_queries(self, original_query: str, category: str) -> List[str]:
        """スマートな検索クエリ生成"""
        if self.should_skip_search(original_query):
            return []
        
        base_name = self.extract_business_name(original_query)
        queries = []
        
        # 1. 基本検索: 「店舗名 佐渡」
        if base_name and "佐渡" not in base_name:
            queries.append(f"{base_name} 佐渡")
        
        # 2. 短い英数字名の場合の特別処理
        if len(base_name) <= 5 and re.match(r'^[a-zA-Z0-9_]+$', base_name):
            # 英数字のみの短い名前（ma_ma, T's, etc.）
            if category == "飲食店":
                queries.extend([
                    f"{base_name} restaurant 佐渡",
                    f"{base_name} cafe 佐渡",
                    f"{base_name} 両津"
                ])
        
        # 3. カテゴリ特化検索（短縮名の場合）
        elif len(base_name) <= 4 and category in self.category_keywords:
            for keyword in self.category_keywords[category][:2]:  # 上位2つまで
                queries.append(f"{base_name} {keyword} 佐渡")
        
        # 4. 地域特化検索（有名店舗の場合）
        if self._is_likely_famous_place(base_name):
            for area in self.sado_areas[:3]:  # 主要3地域
                queries.append(f"{base_name} {area}")
        
        # 5. 部分一致検索（複合語の場合）
        words = base_name.split()
        if len(words) > 1:
            # 最も重要そうな単語で検索
            main_word = max(words, key=len)
            if len(main_word) >= 3:
                queries.append(f"{main_word} 佐渡")
        
        # 重複除去と最大5つまで制限
        unique_queries = list(dict.fromkeys(queries))
        return unique_queries[:5]
    
    def _is_likely_famous_place(self, name: str) -> bool:
        """有名な場所かどうかを推定"""
        famous_indicators = [
            "ホテル", "旅館", "温泉", "観光", "名物", "老舗", "本店", "総本店",
            "金山", "トキ", "両津", "相川", "佐渡"
        ]
        return any(indicator in name for indicator in famous_indicators)
    
    def optimize_search_order(self, queries: List[str]) -> List[str]:
        """検索クエリの優先順位を最適化"""
        def priority_score(query: str) -> int:
            score = 0
            
            # 「佐渡」が含まれている場合は高優先度
            if "佐渡" in query:
                score += 10
            
            # 地域名が含まれている場合
            if any(area in query for area in self.sado_areas):
                score += 5
            
            # 短すぎるクエリは低優先度
            if len(query.replace("佐渡", "").strip()) < 3:
                score -= 5
            
            return score
        
        return sorted(queries, key=priority_score, reverse=True)

class SearchResultAnalyzer:
    """検索結果分析クラス"""
    
    def __init__(self):
        self.success_patterns = {}
        self.failure_patterns = {}
    
    def analyze_successful_query(self, original_query: str, successful_query: str, category: str):
        """成功したクエリパターンを分析"""
        pattern = self._extract_pattern(original_query, successful_query)
        if pattern:
            key = (category, pattern)
            self.success_patterns[key] = self.success_patterns.get(key, 0) + 1
    
    def analyze_failed_query(self, query: str, category: str):
        """失敗したクエリパターンを分析"""
        pattern = self._extract_failure_pattern(query)
        if pattern:
            key = (category, pattern)
            self.failure_patterns[key] = self.failure_patterns.get(key, 0) + 1
    
    def _extract_pattern(self, original: str, successful: str) -> Optional[str]:
        """成功パターンを抽出"""
        if " 佐渡" in successful:
            return "name_sado"
        elif any(area in successful for area in ["両津", "相川", "佐和田", "金井", "新穂", "畑野", "真野", "小木", "羽茂", "赤泊"]):
            return "name_area"
        elif any(cat in successful for cat in ["レストラン", "食堂", "カフェ", "居酒屋"]):
            return "name_category"
        return "other"
    
    def _extract_failure_pattern(self, query: str) -> Optional[str]:
        """失敗パターンを抽出"""
        if len(query) < 3:
            return "too_short"
        elif "(" in query or "（" in query:
            return "has_parentheses"
        elif any(char in query for char in ["・", "＆", "&"]):
            return "has_symbols"
        return "unknown"
    
    def get_recommendations(self) -> Dict[str, str]:
        """改善提案を生成"""
        recommendations = {}
        
        # 成功パターンの分析
        if self.success_patterns:
            best_pattern = max(self.success_patterns.items(), key=lambda x: x[1])
            recommendations["best_pattern"] = f"最も成功率が高いパターン: {best_pattern[0][1]} (成功回数: {best_pattern[1]})"
        
        # 失敗パターンの分析
        if self.failure_patterns:
            worst_pattern = max(self.failure_patterns.items(), key=lambda x: x[1])
            recommendations["worst_pattern"] = f"最も失敗しやすいパターン: {worst_pattern[0][1]} (失敗回数: {worst_pattern[1]})"
        
        return recommendations

# 使用例とテスト
def test_improved_search():
    """改善された検索戦略のテスト"""
    strategy = ImprovedSearchStrategy()
    analyzer = SearchResultAnalyzer()
    
    test_queries = [
        "四季彩 味よし",
        "café 丘の上の雲の向こう", 
        "ショッピングプラザ キング 両津店",
        "(現：愛之助)海の見えるレストラン【らぶじゃん】",
        "蛇の目寿司 佐和田店",
        "ふわりと"
    ]
    
    print("=== 改善された検索戦略テスト ===")
    
    for query in test_queries:
        print(f"\n元クエリ: {query}")
        
        if strategy.should_skip_search(query):
            print("  → スキップ（除外キーワード検出）")
            continue
        
        generated = strategy.generate_smart_search_queries(query, "飲食店")
        optimized = strategy.optimize_search_order(generated)
        
        print(f"  生成クエリ: {generated}")
        print(f"  最適化後: {optimized}")

if __name__ == "__main__":
    test_improved_search()
