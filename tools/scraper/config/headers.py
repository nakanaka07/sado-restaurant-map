"""
スプレッドシートヘッダー統一定義
全スクリプトで共通して使用するヘッダー定義を管理
"""

# 統一されたヘッダー定義
UNIFIED_HEADERS = {
    "飲食店": [
        "Place ID",     # 統一：英語表記
        "店舗名", 
        "所在地",       # 統一：所在地
        "緯度", 
        "経度", 
        "カテゴリ", 
        "カテゴリ詳細", 
        "電話番号", 
        "営業時間", 
        "評価", 
        "レビュー数", 
        "営業状況",
        "ウェブサイト",
        "価格帯",
        "店舗タイプ",
        "地区", 
        "GoogleマップURL", 
        "最終更新日時"
    ],
    "駐車場": [
        "Place ID",     # 統一：英語表記
        "駐車場名", 
        "所在地",       # 統一：所在地
        "緯度", 
        "経度",
        "カテゴリ", 
        "カテゴリ詳細", 
        "地区", 
        "GoogleマップURL", 
        "最終更新日時"
    ],
    "公衆トイレ": [
        "Place ID",     # 統一：英語表記
        "施設名", 
        "所在地",       # 統一：所在地
        "緯度", 
        "経度", 
        "カテゴリ", 
        "カテゴリ詳細", 
        "地区", 
        "GoogleマップURL", 
        "最終更新日時"
    ]
}

# 検索失敗時のヘッダー（統一）
NOT_FOUND_HEADERS = [
    "検索語", 
    "実際の検索語", 
    "検索日", 
    "試行回数", 
    "カテゴリ", 
    "スキップ理由", 
    "改善提案"
]

# 旧ヘッダーから新ヘッダーへのマッピング（マイグレーション用）
HEADER_MIGRATION_MAP = {
    "プレイスID": "Place ID",
    "住所": "所在地"
}

def get_unified_header(category: str) -> list:
    """統一ヘッダーを取得"""
    return UNIFIED_HEADERS.get(category, [])

def get_not_found_header() -> list:
    """検索失敗ヘッダーを取得"""
    return NOT_FOUND_HEADERS.copy()

def migrate_header_name(old_name: str) -> str:
    """旧ヘッダー名を新ヘッダー名に変換"""
    return HEADER_MIGRATION_MAP.get(old_name, old_name)
