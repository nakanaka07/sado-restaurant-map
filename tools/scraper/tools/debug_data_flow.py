#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
データ変換フロー確認ツール

unified_cid_processor → spreadsheet_manager の
データ変換フローで最終更新日時が正しく設定されているかを確認します。
"""

import os
import sys
from pathlib import Path
import json

# パスを追加
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from processors.unified_cid_processor import UnifiedCIDProcessor
from processors.data_validator import DataValidator
from config.headers import get_unified_header
from utils.google_auth import validate_environment

def test_data_conversion():
    """データ変換フローのテスト"""
    
    print("🔄 データ変換フロー確認ツール")
    print("=" * 60)
    
    # 環境変数の確認
    if not validate_environment():
        print("❌ 環境変数が設定されていません")
        return
    
    # テスト用のサンプルデータを作成
    processor = UnifiedCIDProcessor()
    validator = DataValidator()
    
    # サンプルクエリデータ
    test_query = {
        'type': 'store_name',
        'store_name': 'ma_ma 佐渡市',
        'category': 'restaurants'
    }
    
    print(f"🔍 テストクエリ: {test_query['store_name']}")
    
    try:
        # 1. unified_cid_processor での処理
        print(f"\n📋 ステップ1: unified_cid_processor での処理")
        result = processor.process_store_name(test_query)
        
        if result:
            print(f"✅ 処理成功")
            print(f"📊 返されたフィールド数: {len(result)}")
            
            # 最終更新日時の確認
            timestamp_field = result.get('最終更新日時', 'NOT_FOUND')
            print(f"🕐 最終更新日時: {timestamp_field}")
            
            # 主要フィールドの確認
            print(f"\n📋 主要フィールド:")
            key_fields = ['店舗名', '所在地', '緯度', '経度', '取得方法', '最終更新日時']
            for field in key_fields:
                value = result.get(field, 'N/A')
                print(f"   {field}: {value}")
            
            # 2. data_validator での検証 (Places APIデータを模擬)
            print(f"\n📋 ステップ2: data_validator での検証")
            
            # unified_cid_processor の結果を Places API 形式に変換 (模擬)
            mock_place_data = {
                'id': result.get('Place ID', ''),
                'displayName': {'text': result.get('店舗名', '')},
                'shortFormattedAddress': result.get('所在地', ''),
                'location': {
                    'latitude': float(result.get('緯度', 0)),
                    'longitude': float(result.get('経度', 0))
                },
                'primaryType': 'restaurant',
                'primaryTypeDisplayName': {'text': 'レストラン'},
                'businessStatus': 'OPERATIONAL'
            }
            
            validation_result = validator.validate_place_data(mock_place_data, 'restaurants')
            
            if validation_result.is_valid:
                print(f"✅ 検証成功")
                print(f"📊 検証済みデータフィールド数: {len(validation_result.data)}")
                
                # タイムスタンプの確認
                timestamp_field = validation_result.data.get('timestamp', 'NOT_FOUND')
                print(f"🕐 検証後タイムスタンプ: {timestamp_field}")
                
                # 3. ヘッダーマッピングの確認
                print(f"\n📋 ステップ3: ヘッダーマッピング確認")
                headers = get_unified_header('restaurants')
                print(f"📝 期待ヘッダー数: {len(headers)}")
                
                # 最終更新日時フィールドの位置確認
                if '最終更新日時' in headers:
                    timestamp_index = headers.index('最終更新日時') + 1
                    print(f"🕐 '最終更新日時'フィールド位置: 列{timestamp_index}")
                else:
                    print(f"❌ '最終更新日時'フィールドがヘッダーに見つかりません")
                
                # 4. 行データフォーマット変換のテスト
                print(f"\n📋 ステップ4: 行データフォーマット変換")
                try:
                    row_data = validator.extract_to_row_format_simplified(validation_result, 'restaurants', headers)
                    print(f"📊 行データ長: {len(row_data)}")
                    print(f"📊 ヘッダー長: {len(headers)}")
                    
                    if len(row_data) == len(headers):
                        print(f"✅ データ長一致")
                        # 最終更新日時の値を確認
                        if '最終更新日時' in headers:
                            timestamp_index = headers.index('最終更新日時')
                            timestamp_value = row_data[timestamp_index] if len(row_data) > timestamp_index else 'INDEX_ERROR'
                            print(f"🕐 行データの最終更新日時: '{timestamp_value}'")
                        else:
                            print(f"❌ 最終更新日時フィールドが見つかりません")
                    else:
                        print(f"⚠️ データ長不一致: データ{len(row_data)} vs ヘッダー{len(headers)}")
                        
                        # 不足している部分を特定
                        if len(row_data) < len(headers):
                            missing_count = len(headers) - len(row_data)
                            print(f"   📋 不足フィールド数: {missing_count}")
                            print(f"   📋 不足フィールド: {headers[len(row_data):]}")
                        
                except Exception as e:
                    print(f"❌ 行データフォーマット変換エラー: {e}")
            
            else:
                print(f"❌ 検証失敗: {validation_result.errors}")
        
        else:
            print(f"❌ unified_cid_processor での処理失敗")
    
    except Exception as e:
        print(f"❌ テストエラー: {e}")

def main():
    """メイン実行"""
    test_data_conversion()

if __name__ == "__main__":
    main()
