#!/usr/bin/env python3
"""
カテゴリ判別問題の簡易調査
問題のPlace IDが実際にどのようなtypesを返すかを確認
"""

import sys
import os

# パスの設定
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(current_dir)
sys.path.append(parent_dir)

from processors.places_api_client import PlacesAPIClient
from utils.google_auth import validate_environment

def quick_category_check():
    """カテゴリ判別の簡易チェック"""
    
    print("🔍 カテゴリ判別問題簡易調査")
    
    # 環境確認
    if not validate_environment():
        print("❌ 環境変数が正しく設定されていません")
        return
    
    # APIクライアント初期化
    client = PlacesAPIClient()
    
    # 問題のPlace ID
    place_ids = [
        "ChIJs3wRb_xl818RocXP5tOD-YI",  # 駐車場として表示されている
        "ChIJ7QAUpEx_9F8RVLJwVZaAiKo"   # 駐車場として表示されている
    ]
    
    for i, place_id in enumerate(place_ids, 1):
        print(f"\n{'='*50}")
        print(f"調査 {i}: {place_id}")
        print(f"{'='*50}")
        
        try:
            # トイレカテゴリで取得
            result = client.get_place_details(place_id, 'toilets')
            
            if result:
                name = result.get('displayName', {}).get('text', 'N/A')
                primary_type = result.get('primaryType', 'N/A')
                types = result.get('types', [])
                
                print(f"施設名: {name}")
                print(f"プライマリタイプ: {primary_type}")
                print(f"全タイプ: {types}")
                
                # カテゴリ判別
                print(f"\n🔍 カテゴリ分析:")
                
                # 駐車場キーワード
                parking_types = ['parking', 'parking_lot', 'parking_garage']
                has_parking_type = any(ptype in types for ptype in parking_types)
                
                # トイレキーワード
                toilet_types = ['toilet', 'restroom', 'public_bathroom']
                has_toilet_type = any(ttype in types for ttype in toilet_types)
                
                print(f"駐車場タイプを含む: {has_parking_type}")
                print(f"トイレタイプを含む: {has_toilet_type}")
                print(f"プライマリタイプ判定: {primary_type}")
                
                # 名前による判定
                name_lower = name.lower()
                has_parking_in_name = any(word in name_lower for word in ['parking', '駐車', 'パーキング'])
                has_toilet_in_name = any(word in name_lower for word in ['toilet', 'トイレ', '便所', 'restroom'])
                
                print(f"名前に駐車場関連: {has_parking_in_name}")
                print(f"名前にトイレ関連: {has_toilet_in_name}")
                
                # 結論
                print(f"\n📊 判定結果:")
                if has_parking_type or has_parking_in_name:
                    print("⚠️  この施設は駐車場の可能性が高い")
                    print("❌ トイレシートに駐車場データが混入")
                elif has_toilet_type or has_toilet_in_name:
                    print("✅ この施設は正しくトイレ")
                else:
                    print("❓ カテゴリ不明確")
                    
                # 所在地確認
                address = result.get('shortFormattedAddress', result.get('formattedAddress', 'N/A'))
                print(f"所在地: {address}")
                
            else:
                print("❌ データ取得失敗")
                
        except Exception as e:
            print(f"❌ エラー: {e}")
    
    print(f"\n{'='*50}")
    print("🧐 カテゴリ判別問題の可能性:")
    print("1. Google Places APIが同じ場所で複数タイプを返している")
    print("2. トイレファイルに駐車場のCIDが間違って含まれている") 
    print("3. API呼び出し時のカテゴリ指定が無視されている")
    print("4. データ処理時にカテゴリフィルタリングが不十分")

if __name__ == "__main__":
    quick_category_check()
