#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
共通出力フォーマット機能
スクリプト群で統一されたヘッダー・メッセージ出力
"""

from datetime import datetime

class OutputFormatter:
    """統一出力フォーマッター"""
    
    # 共通設定
    HEADER_WIDTH = 60
    APP_NAME = "佐渡飲食店マップ"
    VERSION = "v2.0"
    
    # 絵文字定数
    EMOJI = {
        'rocket': '🚀',
        'gear': '⚙️', 
        'chart': '📊',
        'check': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️',
        'map': '🗺️',
        'restaurant': '🍽️',
        'parking': '🅿️',
        'toilet': '🚻',
        'debug': '🔍',
        'time': '⏱️',
        'money': '💰',
        'success': '🎉'
    }
    
    @classmethod
    def print_header(cls, script_name: str, mode: str = None):
        """統一ヘッダーを出力"""
        title = f"{cls.EMOJI['rocket']} {cls.APP_NAME} - {script_name}"
        if mode:
            title += f" ({mode})"
        
        print(title)
        print("=" * cls.HEADER_WIDTH)
        print(f"🕐 開始時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📦 バージョン: {cls.VERSION}")
        print("-" * cls.HEADER_WIDTH)
    
    @classmethod
    def print_footer(cls, success: bool = True, message: str = None):
        """統一フッターを出力"""
        print("\n" + "=" * cls.HEADER_WIDTH)
        
        if success:
            print(f"{cls.EMOJI['success']} 処理が正常に完了しました！")
        else:
            print(f"{cls.EMOJI['error']} 処理中にエラーが発生しました。")
        
        if message:
            print(f"📝 {message}")
        
        print(f"🕐 終了時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    @classmethod
    def print_section(cls, title: str, emoji_key: str = 'info'):
        """セクションヘッダーを出力"""
        emoji = cls.EMOJI.get(emoji_key, cls.EMOJI['info'])
        print(f"\n{emoji} {title}")
    
    @classmethod
    def print_execution_plan(cls, mode: str, target: str, total_queries: int, 
                           estimated_cost: float, estimated_time: float):
        """実行計画を統一フォーマットで出力"""
        cls.print_section("実行計画", "chart")
        print(f"   モード: {mode}")
        print(f"   対象データ: {target}")
        print(f"   総クエリ数: {total_queries}件")
        print(f"   推定コスト: ${estimated_cost:.3f} USD")
        print(f"   推定実行時間: {estimated_time:.1f} 分")
    
    @classmethod
    def print_results_summary(cls, results: dict):
        """結果サマリーを統一フォーマットで出力"""
        cls.print_section("処理結果", "chart")
        total_processed = 0
        
        for category, count in results.items():
            emoji = cls.EMOJI.get(category, cls.EMOJI['info'])
            print(f"   {emoji} {category}: {count}件")
            total_processed += count
        
        print(f"\n🎯 総処理件数: {total_processed}件")
    
    @classmethod
    def print_environment_status(cls, api_key_ok: bool, spreadsheet_ok: bool):
        """環境変数ステータスを出力"""
        cls.print_section("環境変数確認", "gear")
        
        api_status = cls.EMOJI['check'] if api_key_ok else cls.EMOJI['error']
        sheet_status = cls.EMOJI['check'] if spreadsheet_ok else cls.EMOJI['error']
        
        print(f"   {api_status} PLACES_API_KEY")
        print(f"   {sheet_status} SPREADSHEET_ID")
        
        if api_key_ok and spreadsheet_ok:
            print(f"   {cls.EMOJI['check']} 全ての環境変数が正常に設定されています")
        else:
            print(f"   {cls.EMOJI['error']} 一部の環境変数が不正または未設定です")

# 便利な関数エイリアス
def print_header(script_name: str, mode: str = None):
    """ヘッダー出力のエイリアス"""
    OutputFormatter.print_header(script_name, mode)

def print_footer(success: bool = True, message: str = None):
    """フッター出力のエイリアス"""
    OutputFormatter.print_footer(success, message)

def print_section(title: str, emoji_key: str = 'info'):
    """セクション出力のエイリアス"""
    OutputFormatter.print_section(title, emoji_key)
