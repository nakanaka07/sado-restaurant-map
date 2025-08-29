#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
緊急対応スクリプト - 座標フィルタリング一時無効化版

Places API (New) v1の実装問題を回避し、
座標フィルタリングを無効化してデータ取得を確認
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv(os.path.join(os.path.dirname(__file__), 'config', '.env'))

# プロジェクトルートをパスに追加
project_root = Path(__file__).resolve().parents[0]
sys.path.insert(0, str(project_root))

from infrastructure.external.places_api_adapter import PlacesAPIAdapter
from infrastructure.storage.sheets_storage_adapter import SheetsStorageAdapter
from core.domain.place_validator import PlaceDataValidator
from shared.config import ScraperConfig
from shared.logger import get_logger

def emergency_bypass_test():
    """緊急バイパステスト - 座標フィルタリング無効化"""

    print("🚨 緊急対応テスト: 座標フィルタリング無効化版")
    print("=" * 60)

    # 設定初期化（環境変数から）
    config = ScraperConfig.from_environment()
    logger = get_logger(__name__)

    # Places API アダプター初期化
    places_api = PlacesAPIAdapter(
        api_key=config.google_api.places_api_key,
        logger=logger
    )

    # Sheets アダプター初期化
    sheets = SheetsStorageAdapter(
        credentials_path=config.google_api.service_account_path,
        spreadsheet_id=config.google_api.spreadsheet_id,
        logger=logger
    )

    # テスト用CIDサンプル（前回と同じ）
    test_cids = [
        "9043873394692063502",
        "8663781702274093103",
        "8040000169106885717",
        "8220464912214964562",
        "15761003696205715772"
    ]

    print(f"\n📍 テスト用CID: {len(test_cids)}件")

    successful_data = []

    for i, cid in enumerate(test_cids, 1):
        print(f"\n--- テスト {i}/{len(test_cids)}: CID {cid} ---")

        try:
            # fetch_place_details でテスト
            print("🔍 fetch_place_details で取得中...")
            place_data = places_api.fetch_place_details(cid)

            if place_data:
                print("✅ データ取得成功!")
                print(f"   名前: {place_data.get('名前', 'N/A')}")
                print(f"   住所: {place_data.get('住所', 'N/A')}")
                print(f"   緯度経度: {place_data.get('緯度', 'N/A')}, {place_data.get('経度', 'N/A')}")

                # 座標フィルタリングを意図的にスキップ
                print("⚠️  座標フィルタリングをスキップ（緊急バイパス）")

                # そのまま成功データに追加
                successful_data.append(place_data)

            else:
                print("❌ データ取得失敗（None）")

        except Exception as e:
            print(f"❌ エラー: {e}")

        print()

    print("\n📊 緊急バイパステスト結果:")
    print(f"   成功: {len(successful_data)}/{len(test_cids)}件")

    if successful_data:
        print("\n✅ 成功したデータをSheetsに書き込みテスト...")

        try:
            # 座標フィルタリングを強制スキップするために
            # データに is_in_sado=True を追加
            for data in successful_data:
                data['is_in_sado'] = True  # 強制的に佐渡島内扱い

            # Sheetsに書き込み
            sheets.save(successful_data, "restaurants")
            print("✅ Sheets書き込み成功!")

        except Exception as e:
            print(f"❌ Sheets書き込みエラー: {e}")

    else:
        print("❌ 取得成功データがありません")
        print("   → Places API (New) v1の実装に根本的な問題があります")

    print("\n🎯 次のステップ:")
    if successful_data:
        print("   1. API取得は成功 → 座標フィルタリングのロジック確認")
        print("   2. data_processor.py の separate_sado_data メソッド修正")
        print("   3. PlaceDataValidator の _analyze_location メソッド確認")
    else:
        print("   1. Places API (New) v1の設定・認証を確認")
        print("   2. API キー、権限、課金設定をチェック")
        print("   3. PlacesAPIAdapter の実装をデバッグ")

if __name__ == "__main__":
    try:
        emergency_bypass_test()
    except Exception as e:
        print(f"🚨 緊急テスト実行エラー: {e}")
        sys.exit(1)
