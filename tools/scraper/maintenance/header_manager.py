#!/usr/bin/env python3
"""
スプレッドシートヘッダー統一ツール
既存のスプレッドシートのヘッダーを統一形式に修正
"""

import os
import sys
import pandas as pd
from datetime import datetime

# パス設定
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.google_auth import authenticate_google_sheets
from config.headers import get_unified_header, HEADER_MIGRATION_MAP
from utils.output_formatter import OutputFormatter

def check_header_consistency():
    """全シートのヘッダー統一性をチェック"""
    formatter = OutputFormatter()
    formatter.print_header("スプレッドシートヘッダー統一チェック")
    
    try:
        # Google Sheets認証
        gc = authenticate_google_sheets()
        if not gc:
            print("❌ Google Sheets認証に失敗しました")
            return False
        
        # スプレッドシートを開く
        from utils.google_auth import get_spreadsheet_id
        spreadsheet_id = get_spreadsheet_id()
        if not spreadsheet_id:
            print("❌ スプレッドシートIDが取得できません")
            return False
            
        sheet = gc.open_by_key(spreadsheet_id)
        
        categories = ["飲食店", "駐車場", "公衆トイレ"]
        issues_found = False
        
        for category in categories:
            print(f"\n📋 {category}シートを確認中...")
            
            try:
                # 現在のヘッダーを取得
                worksheet = sheet.worksheet(category)
                current_headers = worksheet.row_values(1) if worksheet.row_count > 0 else []
                
                # 期待されるヘッダー
                expected_headers = get_unified_header(category)
                
                print(f"   現在のヘッダー数: {len(current_headers)}")
                print(f"   期待ヘッダー数: {len(expected_headers)}")
                
                # ヘッダー比較
                if current_headers != expected_headers:
                    issues_found = True
                    print(f"   ❌ ヘッダーが統一形式と異なります")
                    
                    # 差異を詳細表示
                    for i, (current, expected) in enumerate(zip(current_headers, expected_headers)):
                        if current != expected:
                            print(f"      列{i+1}: '{current}' → '{expected}'")
                    
                    # 長さの違いをチェック
                    if len(current_headers) != len(expected_headers):
                        print(f"      列数の違い: {len(current_headers)} → {len(expected_headers)}")
                else:
                    print(f"   ✅ ヘッダーは統一形式です")
                    
            except Exception as e:
                print(f"   ⚠️ シート確認エラー: {e}")
        
        if issues_found:
            print(f"\n🔧 ヘッダー修正が必要です。fix_headers()を実行してください。")
        else:
            print(f"\n🎉 全てのヘッダーが統一されています！")
        
        formatter.print_footer("ヘッダーチェック完了")
        return not issues_found
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def fix_headers():
    """ヘッダーを統一形式に修正"""
    formatter = OutputFormatter()
    formatter.print_header("スプレッドシートヘッダー統一修正")
    
    try:
        # Google Sheets認証
        gc = authenticate_google_sheets()
        if not gc:
            print("❌ Google Sheets認証に失敗しました")
            return False
        
        # スプレッドシートを開く
        from utils.google_auth import get_spreadsheet_id
        spreadsheet_id = get_spreadsheet_id()
        if not spreadsheet_id:
            print("❌ スプレッドシートIDが取得できません")
            return False
            
        sheet = gc.open_by_key(spreadsheet_id)
        
        categories = ["飲食店", "駐車場", "公衆トイレ"]
        
        for category in categories:
            print(f"\n📋 {category}シートを修正中...")
            
            try:
                # 現在のヘッダーを取得
                worksheet = sheet.worksheet(category)
                current_headers = worksheet.row_values(1) if worksheet.row_count > 0 else []
                
                # 期待されるヘッダー
                expected_headers = get_unified_header(category)
                
                if current_headers != expected_headers:
                    # バックアップ情報を記録
                    print(f"   💾 修正前ヘッダー: {current_headers}")
                    print(f"   🔄 修正後ヘッダー: {expected_headers}")
                    
                    # ヘッダー行を更新
                    worksheet.update('1:1', [expected_headers])
                    print(f"   ✅ ヘッダーを更新しました")
                    
                    # 更新記録を追加（最後の列に記録）
                    last_col = len(expected_headers) + 1
                    update_note = f"ヘッダー統一: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                    worksheet.update_cell(1, last_col, f"備考: {update_note}")
                    
                else:
                    print(f"   ✅ 修正不要です")
                    
            except Exception as e:
                print(f"   ❌ シート修正エラー: {e}")
        
        formatter.print_footer("ヘッダー修正完了")
        
    except Exception as e:
        print(f"❌ エラー: {e}")

def show_header_mapping():
    """ヘッダーマッピング表を表示"""
    formatter = OutputFormatter()
    formatter.print_header("統一ヘッダーマッピング")
    
    print("🔄 旧ヘッダー → 新ヘッダー マッピング:")
    for old, new in HEADER_MIGRATION_MAP.items():
        print(f"   {old} → {new}")
    
    print("\n📋 カテゴリ別統一ヘッダー:")
    categories = ["飲食店", "駐車場", "公衆トイレ"]
    
    for category in categories:
        headers = get_unified_header(category)
        print(f"\n   {category}:")
        for i, header in enumerate(headers, 1):
            print(f"     {i:2d}. {header}")
    
    formatter.print_footer("マッピング表示完了")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="スプレッドシートヘッダー統一ツール")
    parser.add_argument("--check", action="store_true", help="ヘッダー統一性をチェック")
    parser.add_argument("--fix", action="store_true", help="ヘッダーを統一形式に修正")
    parser.add_argument("--show-mapping", action="store_true", help="ヘッダーマッピングを表示")
    
    args = parser.parse_args()
    
    if args.check:
        check_header_consistency()
    elif args.fix:
        fix_headers()
    elif args.show_mapping:
        show_header_mapping()
    else:
        print("使用方法:")
        print("  python header_unifier.py --check          # ヘッダーチェック")
        print("  python header_unifier.py --fix            # ヘッダー修正")
        print("  python header_unifier.py --show-mapping   # マッピング表示")
