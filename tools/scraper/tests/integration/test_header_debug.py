"""
ヘッダー取得と並び替えのデバッグテスト
駐車場データ処理時にヘッダーが正しく取得されているかを確認
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.headers import get_unified_header

def test_header_detection():
    """ヘッダー取得のテスト"""
    
    print("=== ヘッダー取得テスト ===")
    
    # 各カテゴリのヘッダーを確認
    categories = ['restaurants', 'parkings', 'toilets']
    
    for category in categories:
        headers = get_unified_header(category)
        print(f"\n📋 {category}:")
        print(f"   フィールド数: {len(headers) if headers else 0}")
        if headers:
            print("   フィールド順序:")
            for i, field in enumerate(headers, 1):
                print(f"     {i:2d}. {field}")
        else:
            print("   ヘッダーが取得できませんでした")
    
    print("\n=== シート名からカテゴリ推定テスト ===")
    
    test_sheet_names = [
        '駐車場_統合処理',
        'parkings_unified',
        'parking_data',
        'トイレ_統合処理', 
        'toilets_unified',
        'toilet_data',
        '飲食店_統合処理',
        'restaurants_unified'
    ]
    
    def determine_category_from_sheet_name(sheet_name: str) -> str:
        """シート名からカテゴリを推定（unified_cid_processorから複製）"""
        sheet_lower = sheet_name.lower()
        
        # 駐車場関連
        if any(keyword in sheet_lower for keyword in ['parking', '駐車場', 'パーキング']):
            return 'parkings'
        
        # 公衆トイレ関連
        if any(keyword in sheet_lower for keyword in ['toilet', 'トイレ', '便所']):
            return 'toilets'
        
        # 飲食店関連（デフォルト）
        return 'restaurants'
    
    for sheet_name in test_sheet_names:
        category = determine_category_from_sheet_name(sheet_name)
        headers = get_unified_header(category)
        print(f"'{sheet_name}' → '{category}' → {len(headers) if headers else 0}フィールド")

def test_parking_data_structure():
    """駐車場データの構造テスト"""
    print("\n=== 駐車場データ構造テスト ===")
    
    # 実際の駐車場データ例
    sample_parking_data = {
        'Place ID': 'ChIJ123example',
        '駐車場名': 'サンプル駐車場',
        '所在地': '佐渡市両津夷12-3',
        '緯度': 38.0452,
        '経度': 138.3626,
        '評価': 4.2,
        'カテゴリ': '駐車場',
        'カテゴリ詳細': '一般駐車場',
        '営業時間': '24時間営業',
        '電話番号': '0259-12-3456',
        'ウェブサイト': 'https://example.com',
        '料金情報': '無料',
        '台数': '50台',
        '車体制限': '高さ2.1m以下',
        '施設タイプ': '屋外駐車場',
        '利用可能時間': '24時間',
        '特記事項': '大型車可',
        '管理者': 'サンプル管理株式会社',
        'GoogleマップURL': 'https://maps.google.com/?cid=123456789',
        '取得方法': 'Google Places API',
        '最終更新日時': '2024-01-15 12:30:45',
        '地区': '両津地区'
    }
    
    # 駐車場ヘッダーを取得
    parking_headers = get_unified_header('parkings')
    
    print(f"サンプルデータフィールド数: {len(sample_parking_data)}")
    print(f"駐車場ヘッダーフィールド数: {len(parking_headers) if parking_headers else 0}")
    
    if parking_headers:
        print("\n🔍 フィールド対応確認:")
        for i, header in enumerate(parking_headers, 1):
            value = sample_parking_data.get(header, '❌ なし')
            status = "✅" if header in sample_parking_data else "❌"
            print(f"  {i:2d}. {header} {status} → {value}")
        
        print("\n📝 サンプルデータにあるがヘッダーにない項目:")
        for key in sample_parking_data:
            if key not in parking_headers:
                print(f"     - {key}: {sample_parking_data[key]}")

if __name__ == "__main__":
    test_header_detection()
    test_parking_data_structure()
