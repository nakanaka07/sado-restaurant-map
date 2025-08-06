#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
スプレッドシート直接確認ツール

更新後のデータを直接確認して、更新が正しく反映されているかをチェックします。
"""

import os
import sys
from pathlib import Path

# パスを追加
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from utils.google_auth import authenticate_google_sheets, validate_environment

def check_spreadsheet_directly():
    """スプレッドシートの内容を直接確認"""
    
    print("🔍 スプレッドシート直接確認ツール")
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
        
        # restaurantsシートを詳しく確認
        sheet = spreadsheet.worksheet('restaurants')
        
        # ヘッダー行を取得
        headers = sheet.row_values(1)
        print(f"\n📋 ヘッダー情報:")
        for i, header in enumerate(headers, 1):
            if header in ['地区', 'GoogleマップURL']:
                print(f"   列{i:2d}: {header}")
        
        # 最初の5行のサンプルデータを取得
        print(f"\n📊 サンプルデータ（最初の5行）:")
        sample_data = sheet.get_values('A1:AQ6')  # A-AQ列（43列）まで
        
        # 地区とGoogleマップURLの列を特定
        district_col = None
        maps_url_col = None
        
        for i, header in enumerate(headers):
            if header == '地区':
                district_col = i
            elif header == 'GoogleマップURL':
                maps_url_col = i
        
        print(f"\n🎯 地区・GoogleマップURL確認:")
        print(f"   地区列: {district_col + 1 if district_col is not None else 'N/A'}")
        print(f"   GoogleマップURL列: {maps_url_col + 1 if maps_url_col is not None else 'N/A'}")
        
        if district_col is not None and maps_url_col is not None:
            for row_idx, row in enumerate(sample_data):
                if row_idx == 0:  # ヘッダー行
                    continue
                
                if len(row) > max(district_col, maps_url_col):
                    store_name = row[1] if len(row) > 1 else 'N/A'
                    district = row[district_col] if len(row) > district_col else ''
                    maps_url = row[maps_url_col] if len(row) > maps_url_col else ''
                    
                    print(f"   行{row_idx + 1}: {store_name[:20]:<20} | 地区: {district[:10]:<10} | URL: {maps_url[:30]:<30}")
        
        # 全データの統計を確認
        print(f"\n📈 全データ統計:")
        all_data = sheet.get_all_values()
        total_rows = len(all_data) - 1  # ヘッダー行を除く
        
        if district_col is not None and maps_url_col is not None:
            district_filled = 0
            maps_url_filled = 0
            
            for row in all_data[1:]:  # ヘッダー行をスキップ
                if len(row) > district_col and row[district_col].strip():
                    district_filled += 1
                if len(row) > maps_url_col and row[maps_url_col].strip():
                    maps_url_filled += 1
            
            print(f"   📊 総レコード数: {total_rows}")
            print(f"   🗺️ 地区入力済み: {district_filled}件 ({district_filled/total_rows*100:.1f}%)")
            print(f"   🔗 GoogleマップURL入力済み: {maps_url_filled}件 ({maps_url_filled/total_rows*100:.1f}%)")
        
        # 具体的な値のサンプルを表示
        print(f"\n📝 実際の値サンプル:")
        if len(all_data) > 1 and district_col is not None and maps_url_col is not None:
            for i in range(1, min(6, len(all_data))):  # 最初の5件
                row = all_data[i]
                if len(row) > max(district_col, maps_url_col):
                    store_name = row[1] if len(row) > 1 else 'N/A'
                    district = row[district_col] if len(row) > district_col else ''
                    maps_url = row[maps_url_col] if len(row) > maps_url_col else ''
                    
                    print(f"   行{i+1}: {store_name}")
                    print(f"      地区: '{district}'")
                    print(f"      URL:  '{maps_url}'")
                    print()
    
    except Exception as e:
        print(f"❌ エラー: {e}")

def main():
    """メイン実行"""
    check_spreadsheet_directly()

if __name__ == "__main__":
    main()
