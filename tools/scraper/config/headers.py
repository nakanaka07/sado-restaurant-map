"""
スプレッドシートヘッダー統一定義
Google Sheets の列構成を統一管理
"""

# 共通ヘッダー定数（重複排除・保守性向上）
PLACE_ID = "Place ID"
REVIEW_COUNT = "レビュー数"
PRIMARY_TYPE_ORIGINAL = "主要業種（原文）"
GOOGLE_MAP_URL = "GoogleマップURL"
LAST_UPDATED = "最終更新日時"
CATEGORY_DETAIL = "カテゴリ詳細"

# 統一ヘッダー定義（Places API New v1 対応）
# 2シート構成: メインシート（佐渡島内）+ 佐渡市外シート（参考用）
UNIFIED_HEADERS = {
    # メインシート（佐渡島内データ）
    "restaurants": [
        # 基本データ
        PLACE_ID,               # 統一：英語表記
        "店舗名",
        "所在地",               # 統一：所在地
        "緯度",
        "経度",
        "評価",
        REVIEW_COUNT,
        "営業状況",
        "営業時間",
        "電話番号",
        "ウェブサイト",
        "価格帯",
        "店舗タイプ",
        "主要業種",             # 🆕 primary_type翻訳後
        PRIMARY_TYPE_ORIGINAL,  # 🆕 primary_type原文

        # Places API (New) v1 拡張データ
        "店舗説明",             # editorialSummary

        # サービス対応
        "テイクアウト",         # takeout
        "デリバリー",           # delivery
        "店内飲食",             # dineIn
        "カーブサイドピックアップ", # curbsidePickup
        "予約可能",             # reservable

        # 食事時間帯
        "朝食提供",             # servesBreakfast
        "昼食提供",             # servesLunch
        "夕食提供",             # servesDinner

        # アルコール・飲み物
        "ビール提供",           # servesBeer
        "ワイン提供",           # servesWine
        "カクテル提供",         # servesCocktails
        "コーヒー提供",         # servesCoffee

        # 特別対応・メニュー
        "ベジタリアン対応",     # servesVegetarianFood
        "デザート提供",         # servesDessert
        "子供向けメニュー",     # menuForChildren

        # 設備・環境
        "屋外席",               # outdoorSeating
        "ライブ音楽",           # liveMusic
        "トイレ完備",           # restroom

        # 顧客対応
        "子供連れ歓迎",         # goodForChildren
        "ペット同伴可",         # allowsDogs
        "グループ向け",         # goodForGroups
        "スポーツ観戦向け",     # goodForWatchingSports

        # インフラ
        "支払い方法",           # paymentOptions
        "駐車場情報",           # parkingOptions
        "アクセシビリティ",     # accessibilityOptions

        # メタデータ
        "地区",
        GOOGLE_MAP_URL,
        "取得方法",
        LAST_UPDATED
    ],

    # 参考シート（佐渡市外データ）
    "restaurants_佐渡市外": [
        # 基本データ
        PLACE_ID,
        "店舗名",
        "所在地",
        "緯度",
        "経度",
        "評価",
        REVIEW_COUNT,
        "営業状況",
        "営業時間",
        "電話番号",
        "ウェブサイト",
        "価格帯",
        "店舗タイプ",
        "主要業種",             # 🆕 primary_type翻訳後
        PRIMARY_TYPE_ORIGINAL,  # 🆕 primary_type原文
        "地区",
        GOOGLE_MAP_URL,
        "取得方法",
        LAST_UPDATED
    ],

    "parkings": [
        # 基本データ
        PLACE_ID,               # 統一：英語表記
        "駐車場名",
        "所在地",               # 統一：所在地
        "緯度",
        "経度",
        "カテゴリ",
        CATEGORY_DETAIL,
        "営業状況",
        "主要業種",             # 🆕 primary_type翻訳後
        PRIMARY_TYPE_ORIGINAL,  # 🆕 primary_type原文

        # Places API (New) v1 拡張データ（Phase 1実装）
        "施設説明",             # editorialSummary
        "完全住所",             # formattedAddress
        "詳細営業時間",         # regularOpeningHours
        "バリアフリー対応",     # accessibilityOptions
        "支払い方法",           # paymentOptions
        "料金体系",             # paymentOptions詳細
        "トイレ設備",           # restroom
        "施設評価",             # rating
        REVIEW_COUNT,           # userRatingCount

        # メタデータ
        "地区",
        GOOGLE_MAP_URL,
        "取得方法",
        LAST_UPDATED
    ],

    "parkings_佐渡市外": [
        # 基本データ
        PLACE_ID,
        "駐車場名",
        "所在地",
        "緯度",
        "経度",
        "カテゴリ",
        CATEGORY_DETAIL,
        "営業状況",
        "主要業種",             # 🆕 primary_type翻訳後
        PRIMARY_TYPE_ORIGINAL,  # 🆕 primary_type原文
        "地区",
        GOOGLE_MAP_URL,
        "取得方法",
        LAST_UPDATED
    ],

    "toilets": [
        # 基本データ
        PLACE_ID,               # 統一：英語表記
        "施設名",
        "所在地",               # 統一：所在地
        "緯度",
        "経度",
        "カテゴリ",
        CATEGORY_DETAIL,
        "営業状況",
        "主要業種",             # 🆕 primary_type翻訳後
        PRIMARY_TYPE_ORIGINAL,  # 🆕 primary_type原文

        # Places API (New) v1 拡張データ（Phase 1実装）
        "施設説明",             # editorialSummary
        "完全住所",             # formattedAddress
        "詳細営業時間",         # regularOpeningHours (開放時間)
        "バリアフリー対応",     # accessibilityOptions
        "子供連れ対応",         # goodForChildren
        "駐車場併設",           # parkingOptions
        "施設評価",             # rating
        REVIEW_COUNT,           # userRatingCount

        # メタデータ
        "地区",
        GOOGLE_MAP_URL,
        "取得方法",
        LAST_UPDATED
    ],

    "toilets_佐渡市外": [
        # 基本データ
        PLACE_ID,
        "施設名",
        "所在地",
        "緯度",
        "経度",
        "カテゴリ",
        CATEGORY_DETAIL,
        "営業状況",
        "主要業種",             # 🆕 primary_type翻訳後
        PRIMARY_TYPE_ORIGINAL,  # 🆕 primary_type原文
        "地区",
        GOOGLE_MAP_URL,
        "取得方法",
        LAST_UPDATED
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
    "プレイスID": PLACE_ID,
    "住所": "所在地"
}

def get_unified_header(category: str) -> list:
    """統一ヘッダーを取得（2シート構成対応）"""
    return UNIFIED_HEADERS.get(category, [])

def get_main_category_header(category: str) -> list:
    """メインカテゴリのヘッダーを取得（佐渡島内・完全版）"""
    return UNIFIED_HEADERS.get(category, [])

def get_outside_category_header(category: str) -> list:
    """佐渡市外シートのヘッダーを取得（簡略版）"""
    outside_key = f"{category}_佐渡市外"
    return UNIFIED_HEADERS.get(outside_key, [])

def get_not_found_header() -> list:
    """検索失敗ヘッダーを取得"""
    return NOT_FOUND_HEADERS.copy()

def migrate_header_name(old_name: str) -> str:
    """旧ヘッダー名を新ヘッダー名に変換"""
    return HEADER_MIGRATION_MAP.get(old_name, old_name)
