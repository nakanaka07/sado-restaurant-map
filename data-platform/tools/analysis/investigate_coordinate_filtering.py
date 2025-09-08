#!/usr/bin/env python3
"""
佐渡島内外データ分離の詳細調査スクリプト
"""

import os
import sys
from dotenv import load_dotenv

# プロジェクトルートのパスを追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 環境変数を読み込み
load_dotenv(os.path.join(os.path.dirname(__file__), 'config', '.env'))

from shared.config import ScraperConfig
from shared.container import create_container
from core.processors.data_processor import DataProcessor


def investigate_coordinate_filtering():
    """座標フィルタリングの詳細調査"""
    print("🔍 佐渡島内外データ分離調査ツール")
    print("=" * 50)

    # 佐渡島の境界を表示
    SADO_BOUNDS = {
        'north': 38.39,
        'south': 37.74,
        'east': 138.62,
        'west': 137.85
    }

    print("📍 佐渡島の境界設定:")
    print(f"   北緯: {SADO_BOUNDS['south']} - {SADO_BOUNDS['north']}度")
    print(f"   東経: {SADO_BOUNDS['west']} - {SADO_BOUNDS['east']}度")

    # 実際のテスト座標を検証
    test_coordinates = [
        ("佐渡市中心部", 38.0, 138.0),
        ("新潟市", 37.9, 139.0),  # 範囲外
        ("佐渡市北部", 38.3, 138.4),
        ("佐渡市南部", 37.8, 138.2),
        ("範囲外東", 38.0, 139.0),  # 範囲外
        ("範囲外西", 38.0, 137.0),  # 範囲外
    ]

    print("\n🧪 座標テスト:")
    for name, lat, lng in test_coordinates:
        is_in_sado = (SADO_BOUNDS['south'] <= lat <= SADO_BOUNDS['north'] and
                     SADO_BOUNDS['west'] <= lng <= SADO_BOUNDS['east'])
        status = "✅ 佐渡島内" if is_in_sado else "❌ 範囲外"
        print(f"   {name}: ({lat}, {lng}) → {status}")

    # 実際のデータ処理結果を模擬調査
    print("\n🔄 実際の処理を模擬して調査します...")

    try:
        config = ScraperConfig.from_environment()
        container = create_container(config)
        processor = container.get(DataProcessor)

        # テストデータを作成（71件の処理を模擬）
        mock_results = []
        for i in range(71):
            # 実際のGoogle Places APIが返す可能性のある座標範囲
            # （佐渡島周辺だが、境界条件から外れる可能性のある座標）
            lat = 37.7 + (i * 0.01)  # 37.7 から 38.4 まで
            lng = 137.8 + (i * 0.01)  # 137.8 から 138.5 まで

            mock_results.append({
                'Place ID': f'TEST_PLACE_{i:03d}',
                '施設名': f'テスト施設{i:03d}',
                '緯度': lat,
                '経度': lng,
                '住所': f'新潟県佐渡市テスト町{i}',
            })

        # 分離処理を実行
        sado_results, outside_results = processor.separate_sado_data(mock_results)

        print("\n📊 分離結果:")
        print(f"   総データ数: {len(mock_results)}件")
        print(f"   佐渡島内: {len(sado_results)}件")
        print(f"   佐渡島外: {len(outside_results)}件")

        if outside_results:
            print("\n❌ 佐渡島外と判定されたデータの例:")
            for i, result in enumerate(outside_results[:5]):  # 最初の5件
                lat = result.get('緯度', 0)
                lng = result.get('経度', 0)
                print(f"   {i+1}. {result.get('施設名', 'N/A')}: ({lat}, {lng})")

        if sado_results:
            print("\n✅ 佐渡島内と判定されたデータの例:")
            for i, result in enumerate(sado_results[:5]):  # 最初の5件
                lat = result.get('緯度', 0)
                lng = result.get('経度', 0)
                print(f"   {i+1}. {result.get('施設名', 'N/A')}: ({lat}, {lng})")

    except Exception as e:
        print(f"❌ エラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit(investigate_coordinate_filtering())
