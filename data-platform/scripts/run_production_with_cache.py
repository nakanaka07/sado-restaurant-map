#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本番データ処理スクリプト (コスト最適化版)

restaurants_merged.txtを処理し、キャッシュ効果を測定します。

Usage:
    python scripts/run_production_with_cache.py [options]

Options:
    --dry-run         実際のAPI呼び出しをせず、統計のみ表示
    --limit N         処理するクエリ数を制限（テスト用）
    --skip-existing   既にキャッシュにあるクエリをスキップ
"""

import sys
import os
import argparse
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# .envファイル読み込み
env_paths = [
    project_root / 'config' / '.env',
    project_root / '.env',
    project_root / '.env.example'
]

for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path)
        break

from infrastructure.storage.place_id_cache import PlaceIdCache
from infrastructure.external.places_api_adapter import PlacesAPIAdapter
from shared.logger import get_logger


def parse_query_file(file_path: str) -> List[Dict[str, str]]:
    """クエリファイルを解析してCID情報を抽出"""
    queries = []
    cid_pattern = re.compile(r'cid=(\d+)')
    store_name_pattern = re.compile(r'#\s*(.+?)$')

    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()

            # コメント行・空行をスキップ
            if not line or line.startswith('# ---') or line.startswith('# ==='):
                continue

            # CID URLの解析
            cid_match = cid_pattern.search(line)
            if cid_match:
                cid = cid_match.group(1)

                # 店舗名を抽出（コメント部分）
                store_name_match = store_name_pattern.search(line)
                store_name = store_name_match.group(1).strip() if store_name_match else f"店舗_{cid}"

                queries.append({
                    'cid': cid,
                    'store_name': store_name,
                    'url': line.split()[0],
                    'line_num': line_num
                })

    return queries


def main():
    parser = argparse.ArgumentParser(description='本番データ処理 (コスト最適化版)')
    parser.add_argument('--dry-run', action='store_true', help='統計のみ表示（API呼び出しなし）')
    parser.add_argument('--limit', type=int, help='処理するクエリ数を制限')
    parser.add_argument('--skip-existing', action='store_true', help='キャッシュ済みをスキップ')
    args = parser.parse_args()

    logger = get_logger(__name__)

    # ヘッダー
    logger.info("=" * 80)
    logger.info("本番データ処理開始 (コスト最適化版)")
    logger.info(f"実行時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    if args.dry_run:
        logger.info("モード: DRY RUN (API呼び出しなし)")
    logger.info("=" * 80)

    # データファイル
    query_file = project_root / "data" / "restaurants_merged.txt"
    if not query_file.exists():
        logger.error(f"クエリファイルが見つかりません: {query_file}")
        sys.exit(1)

    # クエリ解析
    all_queries = parse_query_file(str(query_file))
    logger.info(f"総クエリ数: {len(all_queries)}件")

    if args.limit:
        all_queries = all_queries[:args.limit]
        logger.info(f"処理制限: {len(all_queries)}件")

    # キャッシュ初期化
    cache = PlaceIdCache()
    cache_stats_before = cache.get_statistics()

    logger.info("-" * 80)
    logger.info("キャッシュ統計 (処理前):")
    logger.info(f"  総エントリ数: {cache_stats_before['total_entries']}")
    logger.info(f"  更新が必要: {cache_stats_before['needs_refresh']}")
    logger.info("-" * 80)

    # 処理対象を分類
    cached_queries = []
    new_queries = []
    refresh_queries = []

    for query in all_queries:
        cid = query['cid']
        cached_place_id = cache.get(cid)

        if cached_place_id:
            if cache.needs_refresh(cid):
                refresh_queries.append(query)
            else:
                cached_queries.append(query)
        else:
            new_queries.append(query)

    logger.info("クエリ分類:")
    logger.info(f"  キャッシュヒット: {len(cached_queries)}件 (Text Search不要)")
    logger.info(f"  ID更新が必要: {len(refresh_queries)}件 (無料ID Refresh)")
    logger.info(f"  新規取得: {len(new_queries)}件 (無料Text Search ID Only)")
    logger.info("-" * 80)

    # コスト推定
    # Text Search ID Only: 無料 (新規取得)
    # ID Refresh: 無料 (更新)
    # Place Details Pro: $17/1000 (全クエリ)

    total_queries = len(all_queries)
    free_operations = len(new_queries) + len(refresh_queries)  # 無料API呼び出し
    paid_operations = total_queries  # Place Details Pro

    old_cost_per_1000 = 49  # Text Search Pro + Place Details Pro
    new_cost_per_1000 = 17  # Place Details Pro only

    old_cost = (old_cost_per_1000 / 1000) * total_queries
    new_cost = (new_cost_per_1000 / 1000) * paid_operations
    savings = old_cost - new_cost
    savings_rate = (savings / old_cost * 100) if old_cost > 0 else 0

    logger.info("コスト分析 (推定):")
    logger.info(f"  Text Search ID Only (無料): {len(new_queries)}回")
    logger.info(f"  ID Refresh (無料): {len(refresh_queries)}回")
    logger.info(f"  キャッシュヒット (無料): {len(cached_queries)}回")
    logger.info(f"  Place Details Pro ($17/1000): {paid_operations}回")
    logger.info("")
    logger.info(f"  従来コスト: ${old_cost:.4f} ({total_queries}クエリ × ${old_cost_per_1000}/1000)")
    logger.info(f"  最適化コスト: ${new_cost:.4f} ({paid_operations}クエリ × ${new_cost_per_1000}/1000)")
    logger.info(f"  削減額: ${savings:.4f}")
    logger.info(f"  削減率: {savings_rate:.1f}%")
    logger.info("=" * 80)

    if args.dry_run:
        logger.info("DRY RUNモード: 実際の処理はスキップします")
        logger.info("=" * 80)
        return

    # 実際の処理
    api_key = os.getenv('PLACES_API_KEY')
    if not api_key:
        logger.error("PLACES_API_KEY環境変数が設定されていません")
        sys.exit(1)

    api_client = PlacesAPIAdapter(api_key)

    logger.info("処理開始...")
    logger.info("-" * 80)

    results = []
    errors = []

    # 処理対象を決定
    if args.skip_existing:
        process_queries = new_queries + refresh_queries
        logger.info(f"既存キャッシュをスキップ: {len(process_queries)}件を処理")
    else:
        process_queries = all_queries
        logger.info(f"全クエリを処理: {len(process_queries)}件")

    for i, query in enumerate(process_queries, 1):
        cid = query['cid']
        store_name = query['store_name']

        if i % 10 == 0 or i == 1:
            logger.info(f"[{i}/{len(process_queries)}] 処理中... (成功: {len(results)}, 失敗: {len(errors)})")

        place_id = None

        # キャッシュチェック
        cached_place_id = cache.get(cid)
        if cached_place_id:
            if cache.needs_refresh(cid):
                # ID更新 (無料)
                new_id = api_client.refresh_place_id(cached_place_id)
                if new_id:
                    cache.update(cid, new_id)
                    place_id = new_id
                else:
                    place_id = cached_place_id  # フォールバック
            else:
                place_id = cached_place_id
        else:
            # 新規取得 (無料)
            place_id = api_client.search_text_id_only(store_name)
            if place_id:
                cache.save(cid, place_id, store_name)

        # Place Details取得 (有料)
        if place_id:
            place_data = api_client.fetch_place_details(place_id)
            if place_data:
                results.append({
                    'cid': cid,
                    'store_name': store_name,
                    'place_id': place_id,
                    'place_data': place_data
                })
            else:
                errors.append({'cid': cid, 'store_name': store_name, 'error': 'Place Details取得失敗'})
        else:
            errors.append({'cid': cid, 'store_name': store_name, 'error': 'Place ID取得失敗'})

    # 最終結果
    logger.info("=" * 80)
    logger.info("処理完了")
    logger.info("=" * 80)
    logger.info(f"処理数: {len(process_queries)}件")
    logger.info(f"成功: {len(results)}件")
    logger.info(f"失敗: {len(errors)}件")
    logger.info(f"成功率: {len(results) / len(process_queries) * 100:.1f}%")
    logger.info("-" * 80)

    # キャッシュ統計 (処理後)
    cache_stats_after = cache.get_statistics()
    logger.info("キャッシュ統計 (処理後):")
    logger.info(f"  総エントリ数: {cache_stats_after['total_entries']}")
    logger.info(f"  更新が必要: {cache_stats_after['needs_refresh']}")
    logger.info(f"  新規追加: {cache_stats_after['total_entries'] - cache_stats_before['total_entries']}")
    logger.info("-" * 80)

    # 実際のコスト
    actual_free_calls = len([q for q in process_queries if cache.get(q['cid']) is None or cache.needs_refresh(q['cid'])])
    actual_paid_calls = len(results)
    actual_cost = (new_cost_per_1000 / 1000) * actual_paid_calls

    logger.info("実際のコスト:")
    logger.info(f"  無料API呼び出し: {actual_free_calls}回")
    logger.info(f"  有料API呼び出し: {actual_paid_calls}回")
    logger.info(f"  総コスト: ${actual_cost:.4f}")
    logger.info("=" * 80)

    if errors:
        logger.warning(f"エラーが発生しました ({len(errors)}件):")
        for error in errors[:10]:  # 最初の10件のみ表示
            logger.warning(f"  CID: {error['cid']}, 店舗名: {error['store_name']}, エラー: {error['error']}")
        if len(errors) > 10:
            logger.warning(f"  ... 他 {len(errors) - 10}件")

    logger.info("=" * 80)
    logger.info("⚠️  注意:")
    logger.info("  - 実際のSKU課金はGoogle Cloud Consoleで確認してください")
    logger.info("  - キャッシュファイル: data/place_id_mapping.json")
    logger.info("=" * 80)


if __name__ == "__main__":
    main()
