#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
データ分離機能 テスト・デモスクリプト

新しく実装されたLocationSeparatorの機能をテスト・デモするスクリプト
"""

import os
import sys

# パス設定
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)  # tools/scraper ディレクトリ
sys.path.append(parent_dir)

from processors.location_separator import create_location_separator


def test_boundary_info():
    """境界情報のテスト"""
    print("🗾 佐渡島境界情報テスト")
    print("=" * 50)
    
    separator = create_location_separator()
    info = separator.get_boundary_info()
    
    print(f"📍 境界座標:")
    print(f"   北: {info['bounds']['north']}")
    print(f"   南: {info['bounds']['south']}")
    print(f"   東: {info['bounds']['east']}")
    print(f"   西: {info['bounds']['west']}")
    
    print(f"\n📍 中心座標:")
    print(f"   緯度: {info['center']['latitude']:.4f}")
    print(f"   経度: {info['center']['longitude']:.4f}")


def test_coordinate_validation():
    """座標検証のテスト"""
    print("\n📍 座標検証テスト")
    print("=" * 50)
    
    separator = create_location_separator()
    
    # テスト座標
    test_coordinates = [
        (38.2478, 138.3661, "両津港（佐渡島内）"),
        (38.0158, 138.2408, "相川（佐渡島内）"),
        (37.8756, 138.4234, "真野（佐渡島内）"),
        (37.9012, 139.0234, "新潟市（佐渡島外）"),
        (35.6762, 139.6503, "東京（佐渡島外）")
    ]
    
    for lat, lng, description in test_coordinates:
        result = separator.validate_coordinates(lat, lng)
        status = "✅ 佐渡島内" if result['is_in_sado'] else "❌ 佐渡島外"
        district = result['district'] or "不明"
        distance = result['distance_from_center']
        
        print(f"{description}:")
        print(f"   座標: ({lat}, {lng})")
        print(f"   判定: {status}")
        print(f"   地区: {district}")
        print(f"   中心からの距離: {distance}km")
        print()


def demo_separation_dry_run():
    """分離機能のドライラン（実際のスプレッドシートは使用しない）"""
    print("🔄 データ分離機能デモ")
    print("=" * 50)
    
    print("💡 この機能の使用方法:")
    print()
    print("1. 全カテゴリの分離:")
    print("   python run_unified.py --separate-only")
    print()
    print("2. 特定カテゴリの分離:")
    print("   python run_unified.py --separate-only --target=restaurants")
    print()
    print("3. 通常処理 + 自動分離:")
    print("   python run_unified.py --mode=standard")
    print()
    print("4. 分離無効化:")
    print("   python run_unified.py --mode=standard --no-separate")
    print()
    print("5. 座標テスト:")
    print("   python processors/location_separator.py --test-coords 38.2478 138.3661")
    print()
    print("6. 境界情報表示:")
    print("   python processors/location_separator.py --boundary-info")


def main():
    """メインテスト実行"""
    print("🚀 データ分離機能テスト開始")
    print("=" * 60)
    
    try:
        # 境界情報テスト
        test_boundary_info()
        
        # 座標検証テスト
        test_coordinate_validation()
        
        # デモ情報表示
        demo_separation_dry_run()
        
        print("✅ テスト完了")
        print("\n💡 実際の分離処理を実行するには:")
        print("   python run_unified.py --separate-only")
        
    except Exception as e:
        print(f"❌ テストエラー: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
