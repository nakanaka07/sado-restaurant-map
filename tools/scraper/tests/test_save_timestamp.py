#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
保存メソッドの直接テスト

修正したsave_to_spreadsheetメソッドが正しく最終更新日時を保存するかテストします。
"""

import os
import sys
from pathlib import Path

# パスを追加
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from processors.unified_cid_processor import UnifiedCIDProcessor
from utils.google_auth import validate_environment

def test_save_method():
    """save_to_spreadsheetメソッドの直接テスト"""
    
    print("💾 保存メソッド直接テスト")
    print("=" * 60)
    
    # 環境変数の確認
    if not validate_environment():
        print("❌ 環境変数が設定されていません")
        return
    
    # プロセッサ初期化
    processor = UnifiedCIDProcessor()
    
    # テスト用のサンプルデータを作成
    test_data = {
        'Place ID': 'ChIJTest123',
        '店舗名': 'テスト店舗',
        '所在地': '新潟県佐渡市テスト町123',
        '緯度': 38.1234,
        '経度': 138.5678,
        '評価': 4.5,
        'レビュー数': 10,
        '営業状況': '営業中',
        '営業時間': '月～日: 10:00-22:00',
        '電話番号': '0259-12-3456',
        'ウェブサイト': 'https://test.example.com',
        '価格帯': '手頃',
        '店舗タイプ': 'レストラン',
        '店舗説明': 'テスト用店舗です',
        'テイクアウト': 'True',
        'デリバリー': 'False',
        '店内飲食': 'True',
        'カーブサイドピックアップ': 'False',
        '予約可能': 'True',
        '朝食提供': 'False',
        '昼食提供': 'True',
        '夕食提供': 'True',
        'ビール提供': 'True',
        'ワイン提供': 'False',
        'カクテル提供': 'False',
        'コーヒー提供': 'True',
        'ベジタリアン対応': 'False',
        'デザート提供': 'True',
        '子供向けメニュー': 'True',
        '屋外席': 'False',
        'ライブ音楽': 'False',
        'トイレ完備': 'True',
        '子供連れ歓迎': 'True',
        'ペット同伴可': 'False',
        'グループ向け': 'True',
        'スポーツ観戦向け': 'False',
        '支払い方法': 'カード対応',
        '駐車場情報': '専用駐車場あり',
        'アクセシビリティ': '車椅子対応',
        '地区': '両津',
        'GoogleマップURL': 'https://maps.google.com/test',
        '取得方法': 'テスト実行',
        '最終更新日時': '2025-08-06 02:05:00'
    }
    
    print(f"🔍 テストデータ準備完了")
    print(f"📊 フィールド数: {len(test_data)}")
    print(f"🕐 最終更新日時: {test_data['最終更新日時']}")
    
    # プロセッサにテストデータを設定
    processor.results = [test_data]
    
    # テスト用シート名
    test_sheet_name = "test_timestamp_verification"
    
    print(f"\n💾 テストシートに保存実行...")
    print(f"📄 シート名: {test_sheet_name}")
    
    # 保存メソッドをテスト実行
    success = processor.save_to_spreadsheet(test_sheet_name)
    
    if success:
        print(f"✅ 保存成功")
        print(f"🔗 確認URL: https://docs.google.com/spreadsheets/d/{processor.spreadsheet_id}")
        
        # 実際に保存されたデータを確認
        print(f"\n🔍 保存されたデータの確認...")
        try:
            from utils.google_auth import authenticate_google_sheets
            gc = authenticate_google_sheets()
            spreadsheet = gc.open_by_key(processor.spreadsheet_id)
            worksheet = spreadsheet.worksheet(test_sheet_name)
            
            # ヘッダー行を取得
            headers = worksheet.row_values(1)
            print(f"📋 ヘッダー数: {len(headers)}")
            
            # 最終更新日時の位置を確認
            if '最終更新日時' in headers:
                timestamp_index = headers.index('最終更新日時') + 1
                print(f"🕐 最終更新日時の列位置: {timestamp_index}")
                
                # 実際のデータを取得
                data_row = worksheet.row_values(2)  # 2行目（データ行）
                if len(data_row) >= timestamp_index:
                    saved_timestamp = data_row[timestamp_index - 1]
                    print(f"💾 保存された最終更新日時: '{saved_timestamp}'")
                    
                    if saved_timestamp == test_data['最終更新日時']:
                        print(f"✅ 最終更新日時が正しく保存されました！")
                    else:
                        print(f"❌ 最終更新日時が不一致")
                        print(f"   期待値: '{test_data['最終更新日時']}'")
                        print(f"   実際値: '{saved_timestamp}'")
                else:
                    print(f"❌ データ行が短すぎます: {len(data_row)} < {timestamp_index}")
            else:
                print(f"❌ '最終更新日時'フィールドがヘッダーに見つかりません")
                print(f"📋 存在するヘッダー: {headers}")
        
        except Exception as e:
            print(f"❌ 保存確認エラー: {e}")
    
    else:
        print(f"❌ 保存失敗")

def main():
    """メイン実行"""
    test_save_method()

if __name__ == "__main__":
    main()
