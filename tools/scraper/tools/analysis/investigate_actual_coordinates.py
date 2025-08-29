#!/usr/bin/env python3
"""
実際の座標データを調査するスクリプト
71件すべてが佐渡島外と判定される問題を解明します
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
from infrastructure.external.places_api_adapter import PlacesAPIAdapter


def _get_sample_cids(data_file):
    """データファイルからサンプルCIDを取得"""
    sample_cids = []
    with open(data_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        if 'cid=' in line and not line.startswith('#'):
            # CIDを抽出
            cid = line.split('cid=')[1].split()[0]
            sample_cids.append(cid)
            if len(sample_cids) >= 5:  # 最初の5件のみ
                break

    return sample_cids


def _check_coordinate_bounds(lat, lng, bounds):
    """座標が境界内かチェック"""
    return (bounds['south'] <= lat <= bounds['north'] and
            bounds['west'] <= lng <= bounds['east'])


def _process_place_sample(places_api, cid, i, bounds):
    """個別のPlace情報を処理"""
    print(f"\n--- サンプル {i}: CID {cid} ---")

    try:
        # CID URLを構築
        cid_url = f"https://maps.google.com/place?cid={cid}"
        print(f"   使用するCID URL: {cid_url}")

        # まず fetch_place_details を試す（CID をPlace IDとして直接使用）
        try:
            place_details = places_api.fetch_place_details(cid)
            if place_details:
                print(f"   ✅ fetch_place_detailsで成功")
            else:
                print(f"   ❌ fetch_place_detailsで失敗")
                place_details = None
        except Exception as e:
            print(f"   ❌ fetch_place_detailsでエラー: {e}")
            place_details = None

        # fetch_place_detailsが失敗した場合、search_by_cidを試す
        if not place_details:
            try:
                place_details = places_api.search_by_cid(cid_url)
                if place_details:
                    print(f"   ✅ search_by_cidで成功")
                else:
                    print(f"   ❌ search_by_cidで失敗")
            except Exception as e:
                print(f"   ❌ search_by_cidでエラー: {e}")
                place_details = None

        if place_details:
            # 複数の座標フィールドを確認
            lat = (place_details.get('latitude') or
                  place_details.get('location', {}).get('latitude') or
                  place_details.get('geometry', {}).get('location', {}).get('lat', 0))
            lng = (place_details.get('longitude') or
                  place_details.get('location', {}).get('longitude') or
                  place_details.get('geometry', {}).get('location', {}).get('lng', 0))

            # 複数の名前フィールドを確認
            name = (place_details.get('name') or
                   place_details.get('displayName', {}).get('text') if isinstance(place_details.get('displayName'), dict) else place_details.get('displayName') or
                   '名前不明')

            print(f"   施設名: {name}")
            print(f"   座標: ({lat}, {lng})")
            print(f"   取得データ構造: {list(place_details.keys())}")

            # 境界チェック
            is_in_bounds = _check_coordinate_bounds(lat, lng, bounds)

            status = "✅ 佐渡島内" if is_in_bounds else "❌ 範囲外"
            print(f"   判定: {status}")

            if not is_in_bounds:
                # 範囲外の場合、どのくらい外れているかを表示
                lat_diff = min(abs(lat - bounds['south']), abs(lat - bounds['north']))
                lng_diff = min(abs(lng - bounds['west']), abs(lng - bounds['east']))
                print(f"   境界からの距離: 緯度差{lat_diff:.4f}°, 経度差{lng_diff:.4f}°")

            return is_in_bounds
        else:
            print("   ❌ すべての方法でPlace詳細取得失敗")
            return False

    except Exception as e:
        print(f"   ❌ エラー: {str(e)}")
        return False
def _print_analysis_results(in_bounds_count, out_of_bounds_count):
    """分析結果を出力"""
    print("\n📊 サンプル調査結果:")
    print(f"   佐渡島内: {in_bounds_count}件")
    print(f"   佐渡島外: {out_of_bounds_count}件")

    if out_of_bounds_count > in_bounds_count:
        print("\n🚨 重要な発見:")
        print("   ★ 実際のデータの多くが現在の境界設定外にあります")
        print("   ★ これが71件すべてがヘッダーのみになる根本原因です")
        print("\n💡 解決策:")
        print("   1. 境界設定を緩和する（推奨）")
        print("   2. 座標フィルタリングを一時無効化する")
    elif in_bounds_count > 0:
        print("\n✅ 一部データは境界内です")
        print("   他の原因（スマート更新ロジック等）を調査が必要")


def investigate_actual_coordinates():
    """実際のGoogle Places APIから取得される座標を調査"""
    print("🔍 実際の座標データ調査ツール")
    print("=" * 50)

    # 佐渡島の境界
    SADO_BOUNDS = {
        'north': 38.39,
        'south': 37.74,
        'east': 138.62,
        'west': 137.85
    }

    print("📍 現在の佐渡島境界設定:")
    print(f"   北緯: {SADO_BOUNDS['south']} - {SADO_BOUNDS['north']}度")
    print(f"   東経: {SADO_BOUNDS['west']} - {SADO_BOUNDS['east']}度")

    try:
        config = ScraperConfig.from_environment()
        container = create_container(config)
        places_api = container.get(PlacesAPIAdapter)

        # toiletsデータファイルから実際のURLを数件読み込み
        data_file = os.path.join(os.path.dirname(__file__), 'data', 'toilets_merged.txt')

        print(f"\n📄 データファイル: {data_file}")

        sample_cids = _get_sample_cids(data_file)
        print(f"\n🧪 サンプル調査: {len(sample_cids)}件")

        in_bounds_count = 0
        out_of_bounds_count = 0

        for i, cid in enumerate(sample_cids, 1):
            if _process_place_sample(places_api, cid, i, SADO_BOUNDS):
                in_bounds_count += 1
            else:
                out_of_bounds_count += 1

        _print_analysis_results(in_bounds_count, out_of_bounds_count)

    except Exception as e:
        print(f"❌ 調査エラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit(investigate_actual_coordinates())
