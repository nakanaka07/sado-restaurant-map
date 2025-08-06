#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
地区分類設定の統一性チェックスクリプト
3つのファイル間で地区分類の一貫性を確認する
"""

import os
import sys
from typing import Any

# パス設定
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

# 絶対パスでの直接インポート
def import_from_path(module_name: str, file_path: str) -> Any:
    """指定されたパスからモジュールをインポート"""
    import importlib.util
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None:
        raise ImportError(f"Could not load spec for {module_name} from {file_path}")
    module = importlib.util.module_from_spec(spec)
    if spec.loader:
        spec.loader.exec_module(module)
    return module

# 各ファイルから地区分類を取得
maintenance_module = import_from_path(
    "update_district_classification", 
    os.path.join(current_dir, "update_district_classification.py")
)
SADO_DISTRICTS = maintenance_module.SADO_DISTRICTS

data_validator_module = import_from_path(
    "data_validator", 
    os.path.join(parent_dir, "processors", "data_validator.py")
)
DataValidator = data_validator_module.DataValidator  # type: ignore

unified_processor_module = import_from_path(
    "unified_cid_processor", 
    os.path.join(parent_dir, "processors", "unified_cid_processor.py")
)
UnifiedCIDProcessor = unified_processor_module.UnifiedCIDProcessor  # type: ignore

def compare_district_settings():
    """3つのファイルの地区分類設定を比較"""
    
    print("🔍 佐渡島地区分類設定の統一性チェック")
    print("=" * 60)
    
    # 1. update_district_classification.py の設定
    print("\n📄 1. update_district_classification.py")
    print(f"   地区数: {len(SADO_DISTRICTS)}")
    maintenance_districts = set(SADO_DISTRICTS.keys())
    print(f"   地区名: {sorted(maintenance_districts)}")
    
    # 2. data_validator.py の設定
    print("\n📄 2. data_validator.py")
    validator = DataValidator()
    validator_mapping = validator._load_district_mapping()
    validator_districts = set(validator_mapping.keys())
    print(f"   地区数: {len(validator_districts)}")
    print(f"   地区名: {sorted(validator_districts)}")
    
    # 3. unified_cid_processor.py の設定（実際のメソッドから抽出）
    print("\n📄 3. unified_cid_processor.py")
    processor = UnifiedCIDProcessor()
    # _determine_district メソッドをテスト呼び出しして地区名を取得
    # district_mapping が直接アクセスできないため、サンプル住所でテスト
    test_addresses = [
        '佐渡市両津夷', '佐渡市相川', '佐渡市佐和田', '佐渡市金井',
        '佐渡市新穂', '佐渡市畑野', '佐渡市真野', '佐渡市小木',
        '佐渡市羽茂', '佐渡市赤泊'
    ]
    processor_districts = set()
    for addr in test_addresses:
        district = processor._determine_district(addr)
        if district:
            processor_districts.add(district)
    
    print(f"   地区数: {len(processor_districts)}")
    print(f"   地区名: {sorted(processor_districts)}")
    
    # 統一性チェック
    print("\n🔍 統一性チェック結果")
    print("=" * 40)
    
    # 地区名の一致確認
    all_equal = maintenance_districts == validator_districts == processor_districts
    
    if all_equal:
        print("✅ 全ファイルの地区名が一致しています")
    else:
        print("❌ 地区名に不一致があります")
        
        # 差分を詳細表示
        print("\n📊 詳細比較:")
        print(f"   maintenance のみ: {maintenance_districts - validator_districts - processor_districts}")
        print(f"   validator のみ: {validator_districts - maintenance_districts - processor_districts}")
        print(f"   processor のみ: {processor_districts - maintenance_districts - validator_districts}")
        
        print(f"\n   maintenance ∩ validator: {maintenance_districts & validator_districts}")
        print(f"   maintenance ∩ processor: {maintenance_districts & processor_districts}")
        print(f"   validator ∩ processor: {validator_districts & processor_districts}")
    
    # 各地区の地名数比較
    print("\n📊 各地区の地名数比較")
    print("-" * 40)
    
    all_districts = maintenance_districts | validator_districts | processor_districts
    
    for district in sorted(all_districts):
        maintenance_count = len(SADO_DISTRICTS.get(district, []))
        validator_count = len(validator_mapping.get(district, []))
        
        # processor の地名数は直接取得できないため、推定表示
        processor_note = "✓" if district in processor_districts else "✗"
        
        print(f"   {district}:")
        print(f"     maintenance: {maintenance_count}地名")
        print(f"     validator:   {validator_count}地名")
        print(f"     processor:   {processor_note}")
        
        if maintenance_count != validator_count:
            print(f"     ⚠️  地名数に差異あり")
    
    # 推奨事項
    print("\n💡 推奨事項")
    print("-" * 20)
    if not all_equal:
        print("1. unified_cid_processor.py の地区名を「～地区」形式に統一")
        print("2. 各ファイルの地名リストを SADO_DISTRICTS と同期")
        print("3. 統一後の整合性テストを実行")
    else:
        print("✅ 地区名は統一されています")
        print("✅ 定期的な整合性チェックを継続してください")

if __name__ == '__main__':
    compare_district_settings()
