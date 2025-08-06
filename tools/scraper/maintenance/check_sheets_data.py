#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google Sheetsデータ確認ツール

フィールドマスクが正しく機能してるかSpreadsheetの内容を確認します。
"""

import os
import sys
from pathlib import Path
import gspread
from google.oauth2.service_account import Credentials

# パスを追加
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from utils.google_auth import authenticate_google_sheets, validate_environment

def check_spreadsheet_data():
    """Spreadsheetのデータ確認"""
    
    print("📊 Google Sheets データ確認ツール")
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
        
        # 全シートの確認
        worksheets = spreadsheet.worksheets()
        print(f"📋 シート数: {len(worksheets)}")
        
        for sheet in worksheets:
            print(f"\n📄 シート: {sheet.title}")
            print("-" * 40)
            
            try:
                # ヘッダー行を取得
                headers = sheet.row_values(1)
                print(f"📝 フィールド数: {len(headers)}")
                
                # データ行数を確認
                all_values = sheet.get_all_values()
                data_rows = len(all_values) - 1  # ヘッダー行を除く
                print(f"📊 データ行数: {data_rows}")
                
                if headers and len(headers) > 0:
                    print(f"📋 ヘッダーサンプル:")
                    for i, header in enumerate(headers[:10], 1):
                        print(f"   {i:2d}. {header}")
                    if len(headers) > 10:
                        print(f"   ... 他 {len(headers) - 10}フィールド")
                
                # 拡張フィールドの確認（restaurantsシートの場合）
                if sheet.title in ['restaurants', 'restaurants_統合処理']:
                    print(f"\n🆕 拡張フィールドの確認:")
                    extended_fields = [
                        'テイクアウト', 'デリバリー', '店内飲食', 
                        '朝食提供', '昼食提供', '夕食提供',
                        'ビール提供', 'ワイン提供', 'カクテル提供', 'コーヒー提供',
                        'ベジタリアン対応', 'デザート提供', '子供向けメニュー',
                        '屋外席', 'ライブ音楽', 'トイレ完備',
                        '子供連れ歓迎', 'ペット同伴可', 'グループ向け', 'スポーツ観戦向け',
                        '支払い方法', '駐車場情報', 'アクセシビリティ'
                    ]
                    
                    for field in extended_fields:
                        status = "✅" if field in headers else "❌"
                        print(f"   {status} {field}")
                
                # サンプルデータの確認（最初の数行）
                if data_rows > 0:
                    print(f"\n📄 サンプルデータ（最初の3行）:")
                    sample_rows = all_values[1:4]  # ヘッダー行の次から3行
                    for i, row in enumerate(sample_rows, 1):
                        print(f"   📝 行{i}: {row[1] if len(row) > 1 else 'N/A'}")  # 店舗名
                        if len(row) > 20:  # 拡張フィールドがある場合
                            # テイクアウト、デリバリー、店内飲食の値をチェック
                            takeout_idx = headers.index('テイクアウト') if 'テイクアウト' in headers else -1
                            delivery_idx = headers.index('デリバリー') if 'デリバリー' in headers else -1
                            dine_in_idx = headers.index('店内飲食') if '店内飲食' in headers else -1
                            
                            if takeout_idx >= 0:
                                takeout_val = row[takeout_idx] if len(row) > takeout_idx else 'N/A'
                                print(f"       テイクアウト: {takeout_val}")
                            if delivery_idx >= 0:
                                delivery_val = row[delivery_idx] if len(row) > delivery_idx else 'N/A'
                                print(f"       デリバリー: {delivery_val}")
                            if dine_in_idx >= 0:
                                dine_in_val = row[dine_in_idx] if len(row) > dine_in_idx else 'N/A'
                                print(f"       店内飲食: {dine_in_val}")
                
            except Exception as e:
                print(f"❌ シート読み込みエラー: {e}")
        
    except Exception as e:
        print(f"❌ スプレッドシート接続エラー: {e}")

def main():
    """メイン実行"""
    check_spreadsheet_data()

if __name__ == "__main__":
    main()
