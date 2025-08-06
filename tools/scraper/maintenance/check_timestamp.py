#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最終更新日時フィールドの詳細確認ツール

データの最終更新日時フィールドが正しく設定されているかを詳細確認します。
"""

import os
import sys
from pathlib import Path

# パスを追加
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from utils.google_auth import authenticate_google_sheets, validate_environment

def check_timestamp_fields():
    """最終更新日時フィールドの詳細確認"""
    
    print("🕐 最終更新日時フィールド確認ツール")
    print("=" * 60)
    
    # 環境変数の確認
    if not validate_environment():
        print("❌ 環境変数が設定されていません")
        return
    
    # Google Sheets認証
    gc = authenticate_google_sheets()
    spreadsheet_id = os.getenv('SPREADSHEET_ID')
    
    try:
        spreadsheet = gc.open_by_key(spreadsheet_id)
        print(f"✅ スプレッドシート接続成功: {spreadsheet.title}")
        
        # restaurantsシートを詳細確認
        sheet = spreadsheet.worksheet('restaurants')
        print(f"\n📄 対象シート: {sheet.title}")
        print("-" * 40)
        
        # ヘッダー行を取得
        headers = sheet.row_values(1)
        print(f"📝 フィールド数: {len(headers)}")
        
        # 最終更新日時フィールドの位置を確認
        timestamp_fields = []
        for i, header in enumerate(headers):
            if '更新' in header or 'timestamp' in header.lower() or '日時' in header:
                timestamp_fields.append((i + 1, header))  # 1-based index
        
        print(f"\n🕐 更新日時関連フィールド:")
        if timestamp_fields:
            for col_index, field_name in timestamp_fields:
                print(f"   📍 列{col_index}: {field_name}")
        else:
            print("   ❌ 更新日時関連フィールドが見つかりません")
        
        # 全ヘッダーリストを表示
        print(f"\n📋 全ヘッダー一覧:")
        for i, header in enumerate(headers, 1):
            marker = "🕐" if any(field[0] == i for field in timestamp_fields) else "📝"
            print(f"   {marker} {i:2d}. {header}")
        
        # 実際のデータサンプルを確認
        print(f"\n📊 データサンプル確認:")
        if timestamp_fields:
            for col_index, field_name in timestamp_fields:
                print(f"   🔍 {field_name} (列{col_index}):")
                
                # 最初の5行のデータを取得
                column_letter = chr(64 + col_index)  # A=65, so 64+1=A
                range_name = f"{column_letter}2:{column_letter}6"  # 2-6行目
                try:
                    response = sheet.get(range_name)
                    values = response.get('values', []) if hasattr(response, 'get') else response['values'] if 'values' in response else []
                    
                    for i, value in enumerate(values, 2):  # 2行目から開始
                        data_value = value[0] if value and len(value) > 0 else "（空）"
                        print(f"      行{i}: {data_value}")
                except Exception as e:
                    print(f"      ❌ データ取得エラー: {e}")
                    
                    # 代替方法：all_valuesから取得
                    try:
                        all_data = sheet.get_all_values()
                        if len(all_data) > 1:
                            print(f"      📋 代替方法でのデータ確認:")
                            for row_idx in range(1, min(6, len(all_data))):  # 最大5行
                                if len(all_data[row_idx]) >= col_index:
                                    value = all_data[row_idx][col_index - 1]  # 0-based
                                    print(f"        行{row_idx + 1}: {value}")
                                else:
                                    print(f"        行{row_idx + 1}: （列データなし）")
                    except Exception as e2:
                        print(f"      ❌ 代替方法もエラー: {e2}")
        
        # 最新データの確認
        print(f"\n🆕 最新データ確認:")
        all_data = sheet.get_all_values()
        if len(all_data) > 1:
            latest_row = all_data[-1]  # 最後の行
            print(f"   📍 最後の行（行{len(all_data)}）:")
            
            for col_index, field_name in timestamp_fields:
                if len(latest_row) >= col_index:
                    value = latest_row[col_index - 1]  # 0-based index
                    print(f"      {field_name}: {value}")
                else:
                    print(f"      {field_name}: （データなし）")
        
    except Exception as e:
        print(f"❌ エラー: {e}")

def main():
    """メイン実行"""
    check_timestamp_fields()

if __name__ == "__main__":
    main()
