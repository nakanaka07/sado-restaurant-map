#!/usr/bin/env python3
"""
実際の座標データを調査するスクリプト
71件すべてが佐渡島外と判定される問題を解明します
"""

import os
import sys
import traceback
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dotenv import load_dotenv

# プロジェクトルートのパスを安全に追加
script_dir = Path(__file__).parent.absolute()
scraper_root = script_dir.parent.parent
sys.path.insert(0, str(scraper_root))

# 環境変数を安全に読み込み
env_path = scraper_root / 'config' / '.env'
if env_path.exists():
    load_dotenv(env_path)

try:
    from shared.config import ScraperConfig
    from shared.container import create_container
    from infrastructure.external.places_api_adapter import PlacesAPIAdapter
except ImportError as e:
    print(f"❌ インポートエラー: {e}")
    print(f"   スクリプトパス: {script_dir}")
    print(f"   scraperルート: {scraper_root}")
    sys.exit(1)


def _read_file_with_encoding(data_file: Path) -> List[str]:
    """ファイルを適切なエンコーディングで読み込み"""
    encodings = ['utf-8', 'cp932', 'shift_jis']

    for encoding in encodings:
        try:
            with open(data_file, 'r', encoding=encoding) as f:
                return f.readlines()
        except UnicodeDecodeError:
            continue

    raise UnicodeDecodeError(f"サポートされたエンコーディングでファイルを読み込めません: {data_file}")


def _extract_cid_from_line(line: str) -> Optional[str]:
    """行からCIDを安全に抽出"""
    try:
        cid = line.split('cid=')[1].split()[0]
        return cid if cid.isdigit() else None
    except (IndexError, ValueError):
        return None


def _get_sample_cids(data_file: Path) -> List[str]:
    """データファイルからサンプルCIDを安全に取得（認知的複雑度を削減）"""
    if not data_file.exists():
        raise FileNotFoundError(f"データファイルが見つかりません: {data_file}")

    lines = _read_file_with_encoding(data_file)
    sample_cids = []

    for line in lines:
        line = line.strip()

        # コメント行や無効行をスキップ
        if not line or line.startswith('#') or 'cid=' not in line:
            continue

        # CIDを抽出
        cid = _extract_cid_from_line(line)
        if cid:
            sample_cids.append(cid)
            if len(sample_cids) >= 5:  # 最初の5件のみ
                break
        else:
            print(f"   ⚠️ CID抽出エラー（スキップ）: {line[:50]}...")

    if not sample_cids:
        raise ValueError("有効なCIDが見つかりませんでした")

    return sample_cids


def _check_coordinate_bounds(lat: float, lng: float, bounds: Dict[str, float]) -> bool:
    """座標が境界内かチェック（型安全）"""
    try:
        return (bounds['south'] <= lat <= bounds['north'] and
                bounds['west'] <= lng <= bounds['east'])
    except (KeyError, TypeError):
        return False


def _extract_coordinates(place_details: Dict[str, Any]) -> Tuple[float, float]:
    """Place詳細から座標を安全に抽出"""
    # 複数の座標フィールドパターンを試行
    coordinate_paths = [
        ('latitude', 'longitude'),
        ('location.latitude', 'location.longitude'),
        ('geometry.location.lat', 'geometry.location.lng'),
    ]

    for lat_path, lng_path in coordinate_paths:
        try:
            lat = _get_nested_value(place_details, lat_path)
            lng = _get_nested_value(place_details, lng_path)

            if lat is not None and lng is not None:
                lat_float = float(lat)
                lng_float = float(lng)

                # 有効な座標範囲チェック（世界座標範囲）
                if -90 <= lat_float <= 90 and -180 <= lng_float <= 180:
                    return lat_float, lng_float
        except (ValueError, TypeError):
            continue

    return 0.0, 0.0


def _get_nested_value(data: Dict[str, Any], path: str) -> Any:
    """ネストされた辞書から値を安全に取得"""
    keys = path.split('.')
    current = data

    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return None

    return current


def _extract_place_name(place_details: Dict[str, Any]) -> str:
    """Place詳細から名前を安全に抽出"""
    name_paths = [
        'name',
        'displayName.text',
        'displayName',
        'formatted_address'
    ]

    for path in name_paths:
        name = _get_nested_value(place_details, path)
        if name and isinstance(name, str) and name.strip():
            return name.strip()

    return '名前不明'


def _fetch_place_details_safely(places_api: PlacesAPIAdapter, cid: str) -> Optional[Dict[str, Any]]:
    """Place詳細を安全に取得（複数方法試行）"""
    methods = [
        ('fetch_place_details', lambda: places_api.fetch_place_details(cid)),
        ('search_by_cid', lambda: places_api.search_by_cid(f"https://maps.google.com/place?cid={cid}"))
    ]

    for method_name, method_func in methods:
        try:
            result = method_func()
            if result and isinstance(result, dict):
                print(f"   ✅ {method_name}で成功")
                return result
            else:
                print(f"   ❌ {method_name}で失敗")
        except Exception as e:
            print(f"   ❌ {method_name}でエラー: {e}")

    return None


def _calculate_boundary_distance(lat: float, lng: float, bounds: Dict[str, float]) -> Tuple[float, float]:
    """境界からの距離を計算"""
    lat_diff = min(abs(lat - bounds['south']), abs(lat - bounds['north']))
    lng_diff = min(abs(lng - bounds['west']), abs(lng - bounds['east']))
    return lat_diff, lng_diff


def _process_place_sample(places_api: PlacesAPIAdapter, cid: str, i: int, bounds: Dict[str, float]) -> bool:
    """個別のPlace情報を処理（認知的複雑度を削減）"""
    print(f"\n--- サンプル {i}: CID {cid} ---")

    try:
        # CID URLを構築
        cid_url = f"https://maps.google.com/place?cid={cid}"
        print(f"   使用するCID URL: {cid_url}")

        # Place詳細を安全に取得
        place_details = _fetch_place_details_safely(places_api, cid)

        if not place_details:
            print("   ❌ すべての方法でPlace詳細取得失敗")
            return False

        # 座標と名前を安全に抽出
        lat, lng = _extract_coordinates(place_details)
        name = _extract_place_name(place_details)

        print(f"   施設名: {name}")
        print(f"   座標: ({lat}, {lng})")
        print(f"   取得データ構造: {list(place_details.keys())}")

        # 境界チェック
        is_in_bounds = _check_coordinate_bounds(lat, lng, bounds)
        status = "✅ 佐渡島内" if is_in_bounds else "❌ 範囲外"
        print(f"   判定: {status}")

        if not is_in_bounds:
            # 範囲外の場合、距離を表示
            lat_diff, lng_diff = _calculate_boundary_distance(lat, lng, bounds)
            print(f"   境界からの距離: 緯度差{lat_diff:.4f}°, 経度差{lng_diff:.4f}°")

        return is_in_bounds

    except Exception as e:
        print(f"   ❌ エラー: {str(e)}")
        return False
def _print_analysis_results(in_bounds_count: int, out_of_bounds_count: int) -> None:
    """分析結果を出力"""
    total_count = in_bounds_count + out_of_bounds_count

    print("\n📊 サンプル調査結果:")
    print(f"   佐渡島内: {in_bounds_count}件 ({in_bounds_count/total_count*100:.1f}%)")
    print(f"   佐渡島外: {out_of_bounds_count}件 ({out_of_bounds_count/total_count*100:.1f}%)")

    if out_of_bounds_count > in_bounds_count:
        print("\n🚨 重要な発見:")
        print("   ★ 実際のデータの多くが現在の境界設定外にあります")
        print("   ★ これが71件すべてがヘッダーのみになる根本原因です")
        print("\n💡 解決策:")
        print("   1. 境界設定を緩和する（推奨）")
        print("   2. 座標フィルタリングを一時無効化する")
        print("   3. 座標精度の確認・改善")
    elif in_bounds_count > 0:
        print("\n✅ 一部データは境界内です")
        print("   他の原因（スマート更新ロジック等）を調査が必要")
    else:
        print("\n⚠️ すべてのサンプルで問題が発生")
        print("   API接続・認証・データ形式を確認してください")


def _validate_bounds(bounds: Dict[str, float]) -> bool:
    """境界設定の妥当性をチェック"""
    required_keys = ['north', 'south', 'east', 'west']

    if not all(key in bounds for key in required_keys):
        return False

    # 論理的な境界チェック
    if bounds['north'] <= bounds['south'] or bounds['east'] <= bounds['west']:
        return False

    # 日本周辺の妥当な範囲チェック
    if not (30 <= bounds['south'] <= 50 and 125 <= bounds['west'] <= 150):
        return False

    return True


def investigate_actual_coordinates() -> int:
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

    # 境界設定の妥当性チェック
    if not _validate_bounds(SADO_BOUNDS):
        print("❌ 境界設定に問題があります")
        return 1

    print("📍 現在の佐渡島境界設定:")
    print(f"   北緯: {SADO_BOUNDS['south']} - {SADO_BOUNDS['north']}度")
    print(f"   東経: {SADO_BOUNDS['west']} - {SADO_BOUNDS['east']}度")

    try:
        # 設定とコンテナの初期化
        config = ScraperConfig.from_environment()
        container = create_container(config)
        places_api = container.get(PlacesAPIAdapter)

        # データファイルパスの安全な構築
        data_file = script_dir.parent.parent / 'data' / 'toilets_merged.txt'
        print(f"\n📄 データファイル: {data_file}")

        # サンプルCIDを取得
        sample_cids = _get_sample_cids(data_file)
        print(f"\n🧪 サンプル調査: {len(sample_cids)}件")

        # 各サンプルを処理
        in_bounds_count = 0
        out_of_bounds_count = 0

        for i, cid in enumerate(sample_cids, 1):
            if _process_place_sample(places_api, cid, i, SADO_BOUNDS):
                in_bounds_count += 1
            else:
                out_of_bounds_count += 1

        # 結果分析
        _print_analysis_results(in_bounds_count, out_of_bounds_count)

    except FileNotFoundError as e:
        print(f"❌ ファイルエラー: {e}")
        return 1
    except ValueError as e:
        print(f"❌ データエラー: {e}")
        return 1
    except Exception as e:
        print(f"❌ 調査エラー: {str(e)}")
        print("\n🔍 詳細エラー情報:")
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit(investigate_actual_coordinates())
