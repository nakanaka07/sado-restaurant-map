#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
手動URLによる補完更新スクリプト
通常検索で見つからない店舗を手動URLで補完

使用手順:
1. 通常のrun_optimized.pyを実行
2. 見つからない店舗を手動でGoogle Mapsで検索
3. URLを missing_restaurants_urls.txt に保存
4. このスクリプトで補完実行
"""

import os
import sys
import gspread
import pandas as pd
from datetime import datetime
from manual_url_extractor import URLToPlaceExtractor

def complement_missing_restaurants():
    """手動URLで見つからない店舗を補完"""
    
    # URLファイルの確認
    url_file = 'missing_restaurants_urls.txt'
    if not os.path.exists(url_file):
        print(f"❌ {url_file} が見つかりません")
        print("手動で検索した店舗のURLを以下の形式で保存してください：")
        print("https://www.google.com/maps/place/店舗名/@緯度,経度,zoom/data=...")
        return
    
    # URLを読み込み
    with open(url_file, 'r', encoding='utf-8') as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    
    if not urls:
        print(f"❌ {url_file} にURLが見つかりません")
        return
    
    print(f"📋 {len(urls)}個の手動URLを処理中...")
    
    # URL処理
    extractor = URLToPlaceExtractor()
    results = []
    
    for i, url in enumerate(urls, 1):
        print(f"\n[{i}/{len(urls)}]")
        result = extractor.process_url(url)
        if result and result.get('details'):
            # 結果を整形
            details = result['details']
            location = details.get('geometry', {}).get('location', {})
            
            formatted_result = {
                '店舗名': details.get('name', ''),
                '住所': details.get('formatted_address', ''),
                '緯度': location.get('lat', ''),
                '経度': location.get('lng', ''),
                '評価': details.get('rating', ''),
                'レビュー数': details.get('user_ratings_total', ''),
                '営業状況': translate_business_status(details.get('business_status', '')),
                '電話番号': details.get('formatted_phone_number', ''),
                'ウェブサイト': details.get('website', ''),
                'Place ID': details.get('place_id', ''),
                '取得方法': 'Manual URL',
                '元URL': url,
                '更新日時': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            results.append(formatted_result)
    
    if not results:
        print("❌ URLから店舗情報を取得できませんでした")
        return
    
    # Google Sheetsに追加
    save_to_sheets(results)

def translate_business_status(status):
    """営業状況を日本語に翻訳"""
    status_map = {
        'OPERATIONAL': '営業中',
        'CLOSED_TEMPORARILY': '一時休業',
        'CLOSED_PERMANENTLY': '閉店',
        '': '不明'
    }
    return status_map.get(status, status)

def save_to_sheets(results, sheet_name='飲食店_手動補完'):
    """Google Sheetsに結果を保存"""
    try:
        # 環境変数から設定取得
        from dotenv import load_dotenv
        load_dotenv()
        
        SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID')
        if not SPREADSHEET_ID:
            print("❌ SPREADSHEET_ID が設定されていません")
            return
        
        # Google Sheets認証
        gc = gspread.service_account()
        spreadsheet = gc.open_by_key(SPREADSHEET_ID)
        
        # シートを取得または作成
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
            print(f"📝 既存シート '{sheet_name}' に追加")
            
            # 既存データを取得
            existing_data = worksheet.get_all_records()
            df_existing = pd.DataFrame(existing_data) if existing_data else pd.DataFrame()
            
        except gspread.WorksheetNotFound:
            # 新しいシートを作成
            worksheet = spreadsheet.add_worksheet(
                title=sheet_name,
                rows=len(results) + 10,
                cols=len(results[0]) if results else 15
            )
            print(f"✨ 新規シート '{sheet_name}' を作成")
            df_existing = pd.DataFrame()
        
        # 新しいデータ
        df_new = pd.DataFrame(results)
        
        # データを結合
        if not df_existing.empty:
            # 重複チェック（Place IDベース）
            if 'Place ID' in df_existing.columns:
                existing_place_ids = set(df_existing['Place ID'].tolist())
                df_new = df_new[~df_new['Place ID'].isin(existing_place_ids)]
                print(f"📊 重複除去後: {len(df_new)}件の新規データ")
            
            if not df_new.empty:
                df_combined = pd.concat([df_existing, df_new], ignore_index=True)
            else:
                print("⚠️ 新規データはすべて重複していました")
                return
        else:
            df_combined = df_new
        
        # シートをクリアして全データを書き込み
        worksheet.clear()
        data_to_write = [list(df_combined.columns)] + df_combined.values.tolist()
        worksheet.update(values=data_to_write, range_name='A1')
        
        print(f"✅ {len(df_new)}件の新規データを{sheet_name}に保存")
        print(f"📊 総件数: {len(df_combined)}件")
        print(f"🔗 Spreadsheet: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}")
        
    except Exception as e:
        print(f"❌ Google Sheets保存エラー: {e}")

if __name__ == '__main__':
    complement_missing_restaurants()
