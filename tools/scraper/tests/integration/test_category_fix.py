#!/usr/bin/env python3
"""
カテゴリ判別ロジック修正テスト
修正後の判別ロジックが正しく動作するかテスト
"""

import sys
import os

# パスの設定
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(current_dir)
sys.path.append(parent_dir)

from processors.unified_cid_processor import UnifiedCIDProcessor
from processors.places_api_client import PlacesAPIClient
from utils.google_auth import validate_environment

def test_category_logic_fix():
    """修正されたカテゴリ判別ロジックをテスト"""
    
    print("🔧 カテゴリ判別ロジック修正テスト")
    
    # 環境確認
    if not validate_environment():
        print("❌ 環境変数が正しく設定されていません")
        return
    
    # プロセッサ初期化
    processor = UnifiedCIDProcessor()
    client = PlacesAPIClient()
    
    # テスト用データ（問題のPlace ID）
    test_places = [
        "ChIJs3wRb_xl818RocXP5tOD-YI",  # 相川江戸沢町駐車場公衆トイレ
        "ChIJ7QAUpEx_9F8RVLJwVZaAiKo"   # 沢崎大橋パーキング公衆トイレ
    ]
    
    for i, place_id in enumerate(test_places, 1):
        print(f"\n{'='*60}")
        print(f"テスト {i}: {place_id}")
        print(f"{'='*60}")
        
        try:
            # 実際のAPI呼び出しでデータ取得
            result = client.get_place_details(place_id, 'toilets')
            
            if result:
                name = result.get('displayName', {}).get('text', 'N/A')
                primary_type = result.get('primaryType', 'N/A')
                types = result.get('types', [])
                
                print(f"施設名: {name}")
                print(f"プライマリタイプ: {primary_type}")
                print(f"全タイプ: {types}")
                
                # 修正前後の判別ロジックテスト
                print(f"\n🔍 カテゴリ判別テスト:")
                
                # 駐車場判別テスト
                is_parking = processor._is_parking_data(result)
                print(f"駐車場判別: {is_parking}")
                
                # トイレ判別テスト
                is_toilet = processor._is_toilet_data(result)
                print(f"トイレ判別: {is_toilet}")
                
                # 結果判定
                print(f"\n📊 判別結果:")
                if is_toilet and not is_parking:
                    print("✅ 正常: トイレとして正しく分類")
                elif is_parking and not is_toilet:
                    print("❌ 問題: 駐車場として誤分類")
                elif is_toilet and is_parking:
                    print("⚠️  注意: 両方に該当（複合施設）")
                else:
                    print("❓ 不明: どちらにも該当しない")
                
                # primaryTypeと判別結果の一致性確認
                expected_toilet = (primary_type == 'public_bathroom')
                actual_toilet = is_toilet
                
                print(f"\n🎯 一致性チェック:")
                print(f"primaryType期待値: トイレ={expected_toilet}")
                print(f"判別ロジック結果: トイレ={actual_toilet}")
                
                if expected_toilet == actual_toilet:
                    print("✅ 一致: primaryTypeと判別結果が一致")
                else:
                    print("❌ 不一致: primaryTypeと判別結果が異なる")
                    
            else:
                print("❌ データ取得失敗")
                
        except Exception as e:
            print(f"❌ エラー: {e}")
    
    print(f"\n{'='*60}")
    print("🎯 修正効果まとめ")
    print(f"{'='*60}")
    print("修正内容:")
    print("1. primaryType を最優先に判定")
    print("2. 複合施設の場合、主機能を優先")
    print("3. 名前だけでなくAPIの分類を重視")
    print("\n期待される効果:")
    print("- 駐車場付きトイレ → トイレとして正しく分類")
    print("- トイレシートの駐車場データ混入解消")

if __name__ == "__main__":
    test_category_logic_fix()
