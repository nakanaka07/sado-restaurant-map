#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
コスト最適化機能のテストスクリプト

Usage:
    python scripts/test_cost_optimization.py [--count N]

Options:
    --count N  テストするクエリ数 (デフォルト: 5)
"""

import sys
import os
import argparse
from pathlib import Path
from dotenv import load_dotenv

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# .envファイル読み込み（複数の場所を確認）
env_paths = [
    project_root / 'config' / '.env',  # config/.env
    project_root / '.env',              # ルート直下
    project_root / '.env.example'       # フォールバック
]

for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break

from infrastructure.storage.place_id_cache import PlaceIdCache
from infrastructure.external.places_api_adapter import PlacesAPIAdapter
from shared.logger import get_logger

def main():
    parser = argparse.ArgumentParser(description='コスト最適化機能テスト')
    parser.add_argument('--count', type=int, default=5, help='テストするクエリ数')
    args = parser.parse_args()

    logger = get_logger(__name__)
    logger.info("=" * 80)
    logger.info("コスト最適化機能 簡易テスト開始")
    logger.info(f"テストクエリ数: {args.count}")
    logger.info("=" * 80)

    # API Key取得
    api_key = os.getenv('PLACES_API_KEY')
    if not api_key:
        logger.error("PLACES_API_KEY環境変数が設定されていません")
        sys.exit(1)

    # コンポーネント初期化
    api_client = PlacesAPIAdapter(api_key)
    cache = PlaceIdCache()

    logger.info(f"API Adapter初期化完了")
    logger.info(f"Place IDキャッシュ初期化完了: {cache.cache_file_path}")

    # キャッシュ統計 (初期状態)
    cache_stats_before = cache.get_statistics()
    logger.info("-" * 80)
    logger.info("キャッシュ統計 (処理前):")
    logger.info(f"  総エントリ数: {cache_stats_before['total_entries']}")
    logger.info(f"  更新が必要: {cache_stats_before['needs_refresh']}")
    logger.info("-" * 80)

    # テストケース
    test_cases = [
        {
            'cid': '10379995094735024660',
            'store_name': '長三郎鮨',
            'expected_place_id': 'ChIJGSRiibZd818RZNmTr_4O8Yg'
        },
        {
            'cid': '1234567890123456789',
            'store_name': 'すしや まるいし',
            'expected_place_id': None  # 未知のテストケース
        },
    ]

    test_cases = test_cases[:args.count]

    logger.info(f"テストケース数: {len(test_cases)}件")
    logger.info("")

    # 処理実行
    results = []
    for i, test_case in enumerate(test_cases, 1):
        cid = test_case['cid']
        store_name = test_case['store_name']

        logger.info(f"[{i}/{len(test_cases)}] テスト開始:")
        logger.info(f"  CID: {cid}")
        logger.info(f"  店舗名: {store_name}")

        place_id = None

        # Step 1: キャッシュチェック
        cached_place_id = cache.get(cid)
        if cached_place_id:
            logger.info(f"  キャッシュヒット: {cached_place_id}")

            # 更新判定
            if cache.needs_refresh(cid):
                logger.info("  → 12ヶ月以上経過、ID更新が必要")
                new_id = api_client.refresh_place_id(cached_place_id)
                if new_id:
                    cache.update(cid, new_id)
                    place_id = new_id
                    logger.info(f"  ✅ ID更新成功 (無料SKU): {new_id}")
                else:
                    place_id = cached_place_id
                    logger.warning("  ⚠️ ID更新失敗、古いIDを使用")
            else:
                place_id = cached_place_id
                logger.info("  → キャッシュが新しい、そのまま使用")
        else:
            logger.info("  キャッシュミス")

            # Step 2: Text Search ID Only (無料SKU)
            place_id = api_client.search_text_id_only(store_name)
            if place_id:
                cache.save(cid, place_id, store_name)
                logger.info(f"  ✅ Place ID取得成功 (無料SKU): {place_id}")
                logger.info(f"  キャッシュ保存完了")
            else:
                logger.warning(f"  ❌ Place ID取得失敗")

        # Step 3: Place Details取得 (有料SKU: $17/1000)
        if place_id:
            place_data = api_client.fetch_place_details(place_id)
            if place_data:
                results.append(place_data)
                display_name = place_data.get('displayName', {}) if isinstance(place_data, dict) else {}
                name = display_name.get('text', 'N/A') if isinstance(display_name, dict) else 'N/A'
                logger.info(f"  ✅ 詳細取得成功 (Pro SKU): {name}")
            else:
                logger.warning("  ❌ 詳細取得失敗")

        logger.info("")

    # 結果サマリー
    logger.info("=" * 80)
    logger.info("テスト結果サマリー")
    logger.info("=" * 80)
    logger.info(f"処理数: {len(test_cases)}件")
    logger.info(f"成功: {len(results)}件")
    logger.info(f"失敗: {len(test_cases) - len(results)}件")
    logger.info(f"成功率: {len(results) / len(test_cases) * 100:.1f}%")
    logger.info("-" * 80)

    # キャッシュ統計 (処理後)
    cache_stats_after = cache.get_statistics()
    logger.info("キャッシュ統計 (処理後):")
    logger.info(f"  総エントリ数: {cache_stats_after['total_entries']}")
    logger.info(f"  更新が必要: {cache_stats_after['needs_refresh']}")
    logger.info(f"  新規追加: {cache_stats_after['total_entries'] - cache_stats_before['total_entries']}")
    logger.info("-" * 80)

    # コスト分析
    logger.info("コスト分析 (推定):")

    new_cache_entries = cache_stats_after['total_entries'] - cache_stats_before['total_entries']
    cache_hits = len(test_cases) - new_cache_entries
    place_details_calls = len(results)

    logger.info(f"  Text Search ID Only (無料): {new_cache_entries}回")
    logger.info(f"  キャッシュヒット (無料): {cache_hits}回")
    logger.info(f"  Place Details Pro ($17/1000): {place_details_calls}回")
    logger.info("")

    old_cost_per_1000 = 49
    new_cost_per_1000 = 17

    queries_count = len(test_cases)
    old_cost = (old_cost_per_1000 / 1000) * queries_count
    new_cost = (new_cost_per_1000 / 1000) * place_details_calls

    logger.info(f"  従来コスト: ${old_cost:.4f} ({queries_count}クエリ × ${old_cost_per_1000}/1000)")
    logger.info(f"  最適化コスト: ${new_cost:.4f} ({place_details_calls}クエリ × ${new_cost_per_1000}/1000)")
    logger.info(f"  削減額: ${old_cost - new_cost:.4f}")
    logger.info(f"  削減率: {(old_cost - new_cost) / old_cost * 100:.1f}%")
    logger.info("=" * 80)

    # 注意事項
    logger.info("⚠️  注意:")
    logger.info("  - 上記は推定コストです")
    logger.info("  - 実際のSKU課金はGoogle Cloud Consoleで確認してください")
    logger.info("  - Field Maskが正しく適用されているか必ず検証してください")
    logger.info("=" * 80)

if __name__ == "__main__":
    main()
