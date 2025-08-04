#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google認証共通ライブラリ
Google Sheets・Places API認証の統一処理
"""

import os
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

# 環境変数読み込み（複数のパスから読み込み）
current_dir = os.path.dirname(os.path.abspath(__file__))
config_dir = os.path.join(os.path.dirname(current_dir), 'config')

# config/.envファイルを優先して読み込み
config_env_path = os.path.join(config_dir, '.env')
if os.path.exists(config_env_path):
    load_dotenv(config_env_path)
    print(f"📄 環境変数を読み込み: {config_env_path}")
else:
    # フォールバック: ルートディレクトリの.env
    load_dotenv()
    print("📄 デフォルト.envファイルを読み込み")

def authenticate_google_sheets():
    """Google Sheets API認証"""
    try:
        # GitHub Actions環境での認証
        if 'GOOGLE_SERVICE_ACCOUNT_KEY' in os.environ:
            import json
            import tempfile
            
            service_account_info = json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT_KEY'])
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
                json.dump(service_account_info, temp_file)
                temp_file_path = temp_file.name
            
            try:
                gc = gspread.service_account(filename=temp_file_path)
                return gc
            finally:
                os.unlink(temp_file_path)
        
        # ローカル環境での認証
        else:
            # 新しいconfig/ディレクトリ構造に対応
            current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            config_dir = os.path.join(current_dir, 'config')
            service_account_file = os.path.join(config_dir, 'your-service-account-key.json')
            
            # 環境変数でのオーバーライドも対応
            env_path = os.environ.get('SERVICE_ACCOUNT_FILE_PATH')
            if env_path:
                service_account_file = env_path
            
            if os.path.exists(service_account_file):
                gc = gspread.service_account(filename=service_account_file)
                print(f"✅ ローカル認証成功: {service_account_file}")
                return gc
            else:
                print(f"❌ サービスアカウントキーファイルが見つかりません: {service_account_file}")
                return None
                
    except Exception as e:
        print(f"❌ Google Sheets認証エラー: {e}")
        return None

def get_places_api_key():
    """Places API キーを取得"""
    api_key = os.environ.get('PLACES_API_KEY')
    if not api_key:
        print("❌ PLACES_API_KEY環境変数が設定されていません")
        print(f"🔍 デバッグ: 利用可能な環境変数 = {list(os.environ.keys())[:10]}...")
        return None
    print(f"✅ PLACES_API_KEY取得成功 (文字数: {len(api_key)})")
    return api_key

def get_spreadsheet_id():
    """スプレッドシートIDを取得"""
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    if not spreadsheet_id:
        print("❌ SPREADSHEET_ID環境変数が設定されていません")
        print(f"🔍 デバッグ: 利用可能な環境変数 = {list(os.environ.keys())[:10]}...")
        return None
    print(f"✅ SPREADSHEET_ID取得成功 (文字数: {len(spreadsheet_id)})")
    return spreadsheet_id

def validate_environment():
    """環境変数の検証"""
    print("🔍 環境変数の検証を開始...")
    
    required_vars = ['PLACES_API_KEY', 'SPREADSHEET_ID']
    missing_vars = []
    
    for var in required_vars:
        value = os.environ.get(var)
        if not value:
            missing_vars.append(var)
            print(f"❌ {var} が設定されていません")
        else:
            print(f"✅ {var} = ***{value[-4:]} (末尾4文字)")
    
    if missing_vars:
        print(f"❌ 以下の環境変数が設定されていません: {', '.join(missing_vars)}")
        print(f"📁 設定ファイル確認: config/.env")
        
        # 設定ファイルの存在確認
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(current_dir, 'config', '.env')
        print(f"🔍 設定ファイルパス: {config_path}")
        print(f"📄 ファイル存在: {os.path.exists(config_path)}")
        
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                content = f.read()
                print(f"📝 ファイル内容プレビュー:")
                for line in content.split('\n')[:5]:
                    if line.strip() and not line.startswith('#'):
                        print(f"   {line}")
        
        return False
    
    print("✅ 全ての必要な環境変数が設定されています")
    return True
