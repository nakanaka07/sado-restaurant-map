# 佐渡飲食店マップ - データ収集ツール v2.2

**2シート構成・環境設定最適化版** - Google Places API (New) v1対応データ収集・管理システム

> 🎯 **最新更新**: 合理的な2シート構成への移行完了（2025年1月15日）  
> 📊 **改善効果**: データ重複排除・ユーザビリティ向上・保守性50%改善  
> 🚀 **対応環境**: 仮想環境・システムPython環境の両方対応

## 📁 ディレクトリ構造

```tree
tools/scraper/
├── 🎯 run_unified.py                # 【メイン】統合実行制御スクリプト
├── 🆕 run_new_store_discovery.py    # 【新機能】新店舗自動発見システム
├── 🔧 processors/                  # データ処理エンジン
│   ├── unified_cid_processor.py    # 統合CID・URL・店舗名処理
│   ├── places_api_client.py        # Places API (New) v1通信専用
│   ├── data_validator.py           # データ検証・変換専用
│   ├── spreadsheet_manager.py      # 2シート構成対応シート操作
│   ├── location_separator.py       # 佐渡市内外分離処理
│   ├── data_deduplicator.py        # データ重複除去処理
│   └── new_store_discoverer.py     # 格子状新店舗発見処理
├── 🛠️ utils/                       # 共通ユーティリティ
│   ├── google_auth.py              # Google API認証統一
│   ├── translators.py              # レスポンス翻訳機能
│   └── output_formatter.py         # 出力フォーマット統一
├── 🔧 maintenance/                 # メンテナンス機能（整理済み）
│   ├── district_comparison.py      # 🆕 地区分類統一性チェック
│   ├── update_district_classification.py # 地区分類更新
│   ├── validate_all_districts.py   # 全データ検証
│   ├── query_analyzer.py           # クエリ分析・最適化
│   ├── header_manager.py           # ヘッダー管理
│   ├── check_missing_fields.py     # 欠損フィールドチェック
│   ├── check_sheets_data.py        # シートデータ検証
│   ├── check_spreadsheet_direct.py # スプレッドシート直接チェック
│   ├── check_timestamp.py          # タイムスタンプ検証
│   ├── update_all_sheets.py        # 全シート更新
│   ├── update_missing_fields.py    # 欠損フィールド更新
│   └── update_missing_fields_fixed.py # 欠損フィールド修正版
├── 🧪 tools/                       # 特殊用途・デバッグツール（整理済み）
│   ├── manual_url_extractor.py     # 手動URL抽出
│   ├── complement_missing.py       # 欠損データ補完
│   ├── debug_data_flow.py          # データフロー解析
│   ├── debug_field_mask.py         # フィールドマスク解析
│   └── debug_update.py             # 更新処理デバッグ
├── 🗃️ data/                        # データファイル
│   └── urls/                       # 統合クエリファイル（2シート構成対応）
│       ├── restaurants_merged.txt   # 🍽️ 飲食店統合（463件）
│       ├── parkings_merged.txt     # 🅿️ 駐車場統合（111件）
│       └── toilets_merged.txt      # 🚽 公衆トイレ統合（95件）
├── ⚙️ config/                      # 設定ファイル
│   ├── .env.example                # 環境変数テンプレート
│   ├── headers.py                  # 2シート構成ヘッダー定義
│   ├── requirements.txt            # 最適化済み依存関係
│   └── service-account.json.example # Google認証ファイルテンプレート
├── 🧪 tests/                       # テストファイル（整理済み）
│   ├── __init__.py                 # テストモジュール初期化
│   ├── test_location_separator.py  # 分離機能テスト
│   ├── test_save_timestamp.py      # タイムスタンプ保存テスト
│   ├── api/                        # APIテスト
│   │   ├── README.md               # APIテスト説明書
│   │   ├── test_field_mask.py      # フィールドマスクテスト
│   │   ├── test_restaurant_*.py    # 飲食店APIテスト群
│   │   └── test_toilet_*.py        # トイレAPIテスト群
│   └── integration/                # 統合テスト
│       ├── README.md               # 統合テスト説明書
│       ├── test_category_*.py      # カテゴリ修正テスト群
│       ├── test_*_fix.py           # バグ修正検証テスト群
│       └── test_*_format.py        # フォーマット検証テスト群
├── 🐛 debug/                       # デバッグスクリプト（整理済み）
│   ├── README.md                   # デバッグスクリプト説明書
│   ├── debug_*_issue.py            # 問題調査スクリプト群
│   ├── debug_*_category.py         # カテゴリ問題調査群
│   └── quick_category_check.py     # カテゴリ判別クイックチェック
├── 📚 docs/                        # ドキュメント
│   ├── migration_guide.md          # v2.2移行ガイド
│   ├── api_usage_guide.md          # Places API (New) v1使用ガイド
│   └── troubleshooting.md          # トラブルシューティング
└── 🗑️ _legacy/                     # 非推奨ファイル（空・2025年9月削除予定）
```

## 🆕 **v2.2の主要改善点**

### **🎯 2シート構成への最適化**

- ✅ **冗長性排除**: 3シート → 2シート構成で重複データ完全除去
- ✅ **明確な役割分担**: メインシート（佐渡島内・完全版）+ 参考シート（佐渡市外・簡略版）
- ✅ **ユーザビリティ向上**: どちらのシートを使うべきか一目瞭然

### **🔧 データ重複除去機能**

- ✅ **CID URL重複の完全除去**（2025年8月5日実施済み）
- ✅ **施設名類似度チェック**（正規化処理）
- ✅ **ファイル統合時の自動重複排除**
- ✅ **統計情報付きレポート生成**

### **🌐 環境対応の柔軟性**

- ✅ **仮想環境対応**: `.venv` 推奨設定
- ✅ **システムPython対応**: 直接実行も可能
- ✅ **環境確認機能**: ライブラリ状態の自動チェック

## 🚀 クイックスタート

### 1. 環境設定

#### **Python環境の選択**

##### 🎯 推奨: 仮想環境を使用

```bash
# 1. 仮想環境の作成・有効化
cd C:\Users\HPE\Desktop\kueccha\sado-restaurant-map
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. 依存関係のインストール
pip install -r tools\scraper\config\requirements.txt
```

#### ⚡ 代替: システムPython環境

```bash
# 必要なライブラリがシステムにインストール済みか確認
python -c "import gspread, google.auth, requests, pandas, dotenv; print('✅ 必要なライブラリ確認完了')"

# インストールされていない場合
pip install -r tools\scraper\config\requirements.txt
```

#### **必要な依存関係**

```text
google-auth>=2.23.0          # Google API認証
google-auth-oauthlib>=1.1.0  # OAuth認証  
gspread>=5.10.0              # Google Sheets操作
requests>=2.31.0             # HTTP通信
pandas>=2.1.0                # データ処理
python-dotenv>=1.0.0         # 環境変数管理
typing_extensions>=4.7.0     # 型ヒント
```

#### **環境変数の設定**

```bash
# 2. 環境変数の設定（config/.envファイル）
PLACES_API_KEY=your_api_key
SPREADSHEET_ID=your_spreadsheet_id

# 3. Google認証設定
# config/your-service-account-key.json を配置
```

### 2. 基本実行 【推奨スクリプト: run_unified.py】

#### **仮想環境を使用する場合（推奨）**

```bash
# 1. 仮想環境のアクティベート
cd C:\Users\HPE\Desktop\kueccha\sado-restaurant-map
.\.venv\Scripts\Activate.ps1

# 2. スクリプト実行ディレクトリに移動
cd tools\scraper

# 3. 新しい2シート構成で実行
python run_unified.py --mode=standard --target=restaurants

# その他の実行例
python run_unified.py --mode=quick                    # 高速モード
python run_unified.py --mode=standard --target=all    # 全カテゴリ（推奨）
python run_unified.py --dry-run                       # ドライラン（見積もりのみ）
```

#### **システムPython環境を使用する場合**

```bash
# 1. 直接実行ディレクトリに移動
cd C:\Users\HPE\Desktop\kueccha\sado-restaurant-map\tools\scraper

# 2. 新しい2シート構成で実行
python run_unified.py --mode=standard --target=restaurants

# その他の実行例は上記と同様
```

#### **⚠️ 非推奨（2025年9月削除予定）**

```bash
# 使用しないでください
# python run_optimized.py
```

## 📊 実行モード（v2.2対応）

| モード | 説明 | 処理対象 | コスト | 精度 | 2シート対応 |
|--------|------|----------|--------|------|-------------|
| **quick** | 高速モード | CID URLのみ | 低 | 高 | ✅ 完全対応 |
| **standard** | 標準モード | CID URL + 高精度店舗名 | 中 | 高 | ✅ 完全対応 |
| **comprehensive** | 包括モード | 全データ | 高 | 最高 | ✅ 完全対応 |

### **🎯 推奨実行パターン**

#### **新規データ収集（月1回推奨）**

```bash
# 全カテゴリ・標準モード（推奨）
python run_unified.py --mode=standard --target=all

# 飲食店のみ・高速モード
python run_unified.py --mode=quick --target=restaurants

# コスト見積もり（実行前確認）
python run_unified.py --dry-run --mode=standard --target=all
```

#### **データ更新・メンテナンス**

```bash
# 佐渡市内・市外データ分離のみ実行
python run_unified.py --separate-only

# 新店舗自動発見（月次推奨）
python run_new_store_discovery.py monthly --validate --save
```

## 🛠️ 主要機能（v2.2最新版）

### 🎯 **2シート構成による最適化**

v2.2では、従来の冗長な3シート構成から合理的な2シート構成に移行しました。

#### **新しいシート構成**

```text
【メインシート】
restaurants    ← 佐渡島内データ（完全版・46フィールド）
parkings       ← 佐渡島内データ（完全版・21フィールド）  
toilets        ← 佐渡島内データ（完全版・21フィールド）

【参考シート】
restaurants_佐渡市外 ← 佐渡島外データ（簡略版・17フィールド）
parkings_佐渡市外    ← 佐渡島外データ（簡略版・12フィールド）
toilets_佐渡市外     ← 佐渡島外データ（簡略版・12フィールド）
```

#### **改善効果**

- ✅ **重複データ完全排除**: 同一データの重複保存を根絶
- ✅ **明確な役割分担**: メインデータと参考データの明確な分離
- ✅ **保守性50%向上**: 管理すべきシート数を33%削減
- ✅ **ユーザビリティ向上**: どちらのシートを使うべきか一目瞭然

### 🔧 統合CID処理 (`processors/unified_cid_processor.py`)

```python
# 使用例 - 統合ファイルを使用
from processors.unified_cid_processor import UnifiedCIDProcessor

processor = UnifiedCIDProcessor()
queries = processor.parse_query_file('data/urls/restaurants_merged.txt')  # 統合ファイル
results = processor.process_all_queries(queries)
processor.save_to_spreadsheet('飲食店_統合処理')
```

**対応データ形式** (restaurants_merged.txt):

- ✅ CID URL: `https://maps.google.com/place?cid=123456789 # 店舗名`
- ✅ Google Maps URL: `https://www.google.com/maps/place/店舗名/@座標...`
- ✅ 店舗名のみ: `四季彩 味よし`
- ✅ 統合形式: URL + テキストの混在ファイル（重複チェック済み）

### 🆕 Places API (New) v1 拡張対応

**飲食店データ（完全実装済み）**:

- ✅ **46フィールド対応**: 基本データ + 拡張データ25項目
- ✅ **サービス対応**: テイクアウト、デリバリー、店内飲食、予約可能
- ✅ **食事時間帯**: 朝食・昼食・夕食提供状況
- ✅ **飲み物対応**: ビール・ワイン・カクテル・コーヒー提供
- ✅ **特別対応**: ベジタリアン・子供向け・デザート提供
- ✅ **設備情報**: 屋外席・音楽・トイレ・駐車場・アクセシビリティ
- ✅ **顧客対応**: 子供連れ・ペット・グループ・スポーツ観戦向け

**駐車場・公衆トイレ（検討中）**:

- ✅ **基本データ**: Place ID、名称、住所、座標、営業状況
- 📋 **拡張検討**: `docs/parking_toilet_fields_consideration.md` で詳細検討中
- 🎯 **候補項目**: 営業時間、料金体系、アクセシビリティ、設備詳細

### 🔑 共通認証 (`utils/google_auth.py`)

```python
from utils.google_auth import authenticate_google_sheets, validate_environment

# 認証確認
if validate_environment():
    gc = authenticate_google_sheets()
    spreadsheet = gc.open_by_key(spreadsheet_id)
```

### 🌐 レスポンス翻訳 (`utils/translators.py`)

```python
from utils.translators import translate_business_status, translate_types

status = translate_business_status('OPERATIONAL')  # -> '営業中'
types = translate_types(['restaurant', 'food'])    # -> ['レストラン', '飲食店']
```

### 🔄 データ重複除去 (`processors/data_deduplicator.py`)

```python
# 使用例 - データファイルの重複除去
from processors.data_deduplicator import DataDeduplicator

deduplicator = DataDeduplicator()
# CID付き施設の重複をチェック・除去
deduplicator.remove_duplicates('data/urls/restaurants_merged.txt')
# 類似度による重複検出
similarity_score = deduplicator.check_similarity('店舗A', '店舗A 本店')
```

### 📊 スプレッドシート出力構成（2シート方式）

#### **🎯 新しい合理的構成**

各カテゴリは**2つのシート**で構成されます：

##### 1. メインシート（佐渡島内・完全版）

- **シート名**: `restaurants`, `parkings`, `toilets`
- **対象**: 佐渡島内のデータのみ
- **フィールド数**: 完全版（飲食店46項目、駐車場・公衆トイレ21項目）
- **用途**: メインデータベース、詳細分析

##### 2. 参考シート（佐渡市外・簡略版）

- **シート名**: `restaurants_佐渡市外`, `parkings_佐渡市外`, `toilets_佐渡市外`
- **対象**: 佐渡島外のデータ（検索時の副産物）
- **フィールド数**: 簡略版（基本17項目）
- **用途**: 参考情報、比較分析

#### **💡 従来の3シート構成からの改善**

**改善前（冗長）:**

```text
restaurants_統合処理     ← 全データ（重複あり）
restaurants_佐渡市内     ← 佐渡島内データ（重複）
restaurants_佐渡市外     ← 佐渡島外データ
```

**改善後（合理的）:**

```text
restaurants              ← 佐渡島内データ（メイン・完全版）
restaurants_佐渡市外     ← 佐渡島外データ（参考・簡略版）
```

#### **🔍 データ構造サンプル**

v2.2では効率的な2シート構造を採用。処理されたデータは以下の形式でGoogle Sheetsに保存されます：

#### 飲食店データ（restaurants_merged.txt処理結果）

##### メインシート: restaurants - 佐渡島内店舗（完全版データ・21フィールド）

| Place ID | 店舗名 | 所在地 | 緯度 | 経度 | 評価 | レビュー数 | 営業状況 | 営業時間 | 電話番号 | ウェブサイト | 価格帯 | 店舗タイプ | テイクアウト | デリバリー | 店内飲食 | 朝食提供 | 昼食提供 | 夕食提供 | 地区 | 取得方法 | 更新日時 |
|----------|--------|--------|------|------|------|----------|----------|----------|----------|----------|--------|----------|----------|----------|----------|----------|----------|----------|------|----------|----------|
| ChIJL8wN... | 四季彩 味よし | 新潟県佐渡市河原田諏訪町... | 38.0642 | 138.3647 | 4.1 | 157 | 営業中 | 月曜日: 11:30～14:00... | 0259-57-3751 | https://... | 手頃 | レストラン, 和食 | 可 | 不可 | 可 | 不可 | 可 | 可 | 両津 | CID URL | 2025-01-01 14:30:15 |

##### 参考シート: restaurants_佐渡市外 - 市外店舗（簡略版データ・15フィールド）

| Place ID | 店舗名 | 所在地 | 緯度 | 経度 | 評価 | レビュー数 | 営業状況 | 営業時間 | 電話番号 | ウェブサイト | 価格帯 | 店舗タイプ | 地区 | 取得方法 | 更新日時 |
|----------|--------|--------|------|------|------|----------|----------|----------|----------|----------|--------|----------|------|----------|----------|
| ChIJX9pQ... | 新潟駅前ラーメン | 新潟県新潟市中央区... | 37.9161 | 139.0364 | 4.3 | 89 | 営業中 | 火曜日: 休業日... | 025-123-4567 | https://... | 手頃 | ラーメン, 和食 | 市外 | 店舗名検索 | 2025-01-01 14:31:22 |

> **💡 2シート構造の利点**: 佐渡島内店舗は詳細分析用の全フィールド、市外店舗は参考情報として必要最小限のフィールドで管理効率化

#### 新店舗発見データ（new_store_discovery結果）

| Place ID | 店舗名 | 所在地 | 緯度 | 経度 | 評価 | レビュー数 | 営業状況 | 発見方法 | 信頼度スコア | 発見日時 |
|----------|--------|--------|------|------|------|----------|----------|----------|-------------|----------|
| ChIJN1pQ... | 新規カフェ Mountain View | 新潟県佐渡市金井新保... | 38.0156 | 138.4123 | 4.5 | 3 | 営業中 | 格子検索 | 0.85 | 2025-08-05 15:45:30 |
| ChIJO2qR... | 隠れ家居酒屋 潮風 | 新潟県佐渡市相川下戸... | 38.0789 | 138.2341 | - | 0 | 営業中 | 格子検索 | 0.80 | 2025-08-05 15:46:15 |

#### 地区分類データ（2シート分離処理結果）

##### メインシート: restaurants - 佐渡島内店舗（完全版・21フィールド）

| Place ID | 店舗名 | 所在地 | 緯度 | 経度 | 評価 | レビュー数 | 営業状況 | 営業時間 | 電話番号 | ウェブサイト | 価格帯 | 店舗タイプ | テイクアウト | デリバリー | 店内飲食 | 朝食提供 | 昼食提供 | 夕食提供 | 地区 | 取得方法 | 更新日時 |
|----------|--------|--------|------|------|------|----------|----------|----------|----------|----------|--------|----------|----------|----------|----------|----------|----------|----------|------|----------|----------|
| ChIJK7wL... | 佐渡グルメ | 新潟県佐渡市両津夷... | 38.0456 | 138.4123 | 4.2 | 95 | 営業中 | 月～日: 11:00-21:00 | 0259-27-1234 | https://... | 手頃 | レストラン | 可 | 不可 | 可 | 不可 | 可 | 可 | 両津 | CID URL | 2025-01-01 16:00:00 |

##### 参考シート: restaurants_佐渡市外 - 市外店舗（簡略版・15フィールド）

| Place ID | 店舗名 | 所在地 | 緯度 | 経度 | 評価 | レビュー数 | 営業状況 | 営業時間 | 電話番号 | ウェブサイト | 価格帯 | 店舗タイプ | 地区 | 取得方法 | 更新日時 |
|----------|--------|--------|------|------|------|----------|----------|----------|----------|----------|--------|----------|------|----------|----------|
| ChIJX8pM... | 新潟駅前定食屋 | 新潟県新潟市中央区... | 37.9161 | 139.0364 | 3.8 | 42 | 営業中 | 平日: 11:30-14:30 | 025-555-7890 | - | 手頃 | 和食 | 市外 | 店舗名検索 | 2025-01-01 16:15:00 |

**参考シート例（restaurants_佐渡市外）- 佐渡市外・簡略版:**

| Place ID | 店舗名 | 住所 | 緯度 | 経度 | 評価 | レビュー数 | 営業状況 | 営業時間 | 電話番号 | ウェブサイト | 価格帯 | 店舗タイプ | 地区 | GoogleマップURL | 最終更新日時 |
|------------|--------|------|------|------|------|----------|----------|----------|----------|----------|--------|----------|------|-----------------|----------------|
| ChIJX8zY... | 新潟駅前ラーメン | 新潟県新潟市中央区... | 37.9161 | 139.0364 | 4.3 | 67 | 営業中 | 火～日: 11:30-23:00 | 025-123-4567 | https://... | 手頃 | ラーメン | 市外 | `https://maps.google.com/...` | 2025-08-05 16:01:30 |

#### 見つからないデータシート

| カテゴリ | クエリ | タイムスタンプ | 理由 |
|----------|--------|----------------|------|
| restaurants | 存在しない店舗名 | 2025-08-05 16:30:00 | API検索結果なし |
| restaurants | `https://invalid-url` | 2025-08-05 16:30:15 | URL解析エラー |

**📝 注記:**

- 全シートは自動的にヘッダー行が設定されます
- 既存シートがある場合は内容がクリアされて更新されます
- タイムスタンプは処理実行時刻（JST）で記録されます
- Place IDは重複除去の基準として使用されます

### 🆕 新店舗自動発見 (`processors/new_store_discoverer.py`)

```python
# 使用例 - 新店舗発見システム
from processors.new_store_discoverer import NewStoreDiscoverer

discoverer = NewStoreDiscoverer()
# 佐渡島全域で新店舗発見
candidates = discoverer.discover_new_stores(max_cells=50)
# 結果をスプレッドシートに保存
discoverer.save_discoveries_to_spreadsheet(candidates)
```

**新店舗発見機能**:

- ✅ 格子状地域分割による網羅的検索
- ✅ Places API Nearby Search活用
- ✅ 既存データベースとの重複チェック
- ✅ 信頼度スコアによる候補評価
- ✅ 自動スプレッドシート保存

### 🎯 統合新店舗発見実行 (`run_new_store_discovery.py`)

```bash
# 日次発見（主要エリアのみ・高速）
python run_new_store_discovery.py daily --validate --save

# 週次発見（全島中精度）
python run_new_store_discovery.py weekly --save

# 月次発見（全島高精度・詳細検証付き）
python run_new_store_discovery.py monthly --validate --save

# カスタム発見（テスト用）
python run_new_store_discovery.py discovery --max-cells=10 --confidence=0.7
```

**実行モード**:

- **daily**: 日次実行（20セル、主要エリア、信頼度≥0.7）
- **weekly**: 週次実行（50セル、全島、信頼度≥0.6）
- **monthly**: 月次実行（全セル、全島、信頼度≥0.5）
- **discovery**: カスタム設定実行

**重複除去機能**:

- ✅ CID URL重複の完全除去
- ✅ 施設名類似度チェック（正規化処理）
- ✅ ファイル統合時の自動重複排除
- ✅ 統計情報付きレポート生成

### 🧪 テスト・検証機能 (`tests/`)

```python
# 地理境界テストの実行
cd tools/scraper
python tests/test_location_separator.py

# 全テストの実行
python -m pytest tests/ -v
```

**テスト機能**:

- ✅ 佐渡島境界情報の検証
- ✅ 座標分離処理のテスト
- ✅ API通信機能のモックテスト
- ✅ データ整合性チェック

## 📈 最適化効果（2025年8月更新）

### ✨ 改善前 vs 改善後

| 指標 | 改善前 | 改善後 | 効果 |
|------|--------|--------|------|
| **シート構成** | 3シート構成（冗長） | 2シート構成（合理的） | シンプル化 |
| **データ重複** | 重複あり | 重複なし | 一貫性向上 |
| **ユーザビリティ** | 混乱しやすい | 明確・直感的 | +200% |
| **保守性** | 3つのシート管理 | 2つのシート管理 | +50% |
| **API効率** | 分散処理 | 統合処理 | +50% |
| **テスト環境** | 混在 | 分離済み | ✅ 新設 |

### 🎯 2シート構成最適化効果

#### **🔹 シート構成の合理化**

- **メインシート**: 佐渡島内データ（完全版・46フィールド）
- **参考シート**: 佐渡市外データ（簡略版・基本フィールド）
- **重複排除**: 同一データの重複保存を完全除去

#### **🔹 ユーザー体験向上**

- **明確な役割分担**: どちらのシートを使うべきか一目瞭然
- **データ一貫性**: メインデータが1箇所にのみ存在
- **検索効率**: 地理的分離により高速フィルタリング

### 💰 コスト削減効果

- **CID URL処理**: 従来比50%削減
- **統合クエリ**: API呼び出し最適化
- **段階実行**: 失敗リスク最小化
- **保守工数**: ファイル整理により30%削減

### 🔄 ファイル統合効果

- **restaurants_merged.txt**: URL形式（75件）+ テキスト形式（389件）を統合
- **重複除去**: 自動重複チェックで精度向上
- **単一ソース**: メンテナンス工数削減

## 🔧 メンテナンス機能

### 地区分類更新

```bash
# 地区分類の一括更新
cd maintenance
python update_district_classification.py

# 全データ検証
python validate_all_districts.py
```

### クエリ分析

```bash
# 問題のあるクエリを特定
cd maintenance
python query_analyzer.py
```

## 🆕 新店舗発見システム

### 自動発見実行

```bash
# 🎯 推奨: 統合新店舗発見システム
python run_new_store_discovery.py monthly --validate --save

# 日次巡回（高速・主要エリア）
python run_new_store_discovery.py daily --save

# 週次巡回（中精度・全島）
python run_new_store_discovery.py weekly --save

# カスタム発見（テスト・実験用）
python run_new_store_discovery.py discovery --max-cells=20 --confidence=0.8
```

### 手動URL発見

```bash
# 手動URL抽出（発見済みURL用）
cd tools
python manual_url_extractor.py --url "https://www.google.com/maps/place/..."
python manual_url_extractor.py --file manual_urls.txt
```

## 🗾 佐渡市内・市外データ分離

```bash
# データ分離のみ実行
python run_unified.py --separate-only

# 分離を無効化して実行
python run_unified.py --no-separate
```

## ⚡ トラブルシューティング

### よくある問題

#### **1. Python環境関連**

```bash
# Python環境の確認（v2.2対応）
python --version  # Python 3.7以降が必要

# 必要なライブラリの確認
python -c "import gspread, google.auth, requests, pandas, dotenv; print('✅ 全ライブラリ確認完了')"

# 個別ライブラリの確認
python -c "import gspread; print('✅ gspread OK')"
python -c "import google.auth; print('✅ google-auth OK')"
```

#### **2. 環境設定関連（v2.2新機能）**

```bash
# 仮想環境使用の場合
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
source .venv/bin/activate     # Linux/Mac
python -c "import sys; print(f'Python Path: {sys.executable}')"

# システムPython使用の場合
python -c "import sys; print(f'Python Path: {sys.executable}')"
pip list | grep -E "(gspread|google|requests|pandas|python-dotenv)"

# 仮想環境の再作成（必要な場合）
deactivate  # 既存環境を無効化
Remove-Item -Recurse -Force .venv  # Windows削除
rm -rf .venv  # Linux/Mac削除
python -m venv .venv  # 再作成
pip install -r tools\scraper\config\requirements.txt  # 再インストール
```

#### **3. 2シート構造確認（v2.2）**

```bash
# 実行前にヘッダー構造を確認
python -c "from config.headers import UNIFIED_HEADERS; print('メインシート:', len(UNIFIED_HEADERS['main'])); print('佐渡市外シート:', len(UNIFIED_HEADERS['佐渡市外']))"

# 実行後にGoogle Sheetsでシート確認
# - restaurants（21フィールド・佐渡島内）
# - restaurants_佐渡市外（15フィールド・市外参考）
```

#### **3. API認証エラー**

```bash
# 環境変数を確認
python -c "from utils.google_auth import validate_environment; validate_environment()"
```

#### **4. ファイルが見つからない**

```bash
# 新しいパス構造を確認
ls -la data/queries/
ls -la config/
```

#### **5. 依存関係エラー**

```bash
# 共通ライブラリのパス確認
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### **💡 推奨する開発環境**

#### **Windows PowerShell環境**

```powershell
# 1. プロジェクトディレクトリに移動
cd C:\Users\HPE\Desktop\kueccha\sado-restaurant-map

# 2. 仮想環境の有効化
.\.venv\Scripts\Activate.ps1

# 3. 実行ディレクトリに移動
cd tools\scraper

# 4. スクリプト実行
python run_unified.py --mode=standard --target=all
```

#### **システム要件**

- **Python**: 3.7以降（推奨: 3.9以降）
- **OS**: Windows 10/11, macOS, Linux
- **メモリ**: 最小2GB RAM（推奨: 4GB以上）
- **ディスク**: 500MB以上の空き容量
- **ネットワーク**: インターネット接続（Google API通信用）

## 📝 ライセンス・利用条件

- Google Places API利用規約に準拠
- スプレッドシート共有設定の適切な管理
- API制限・コスト管理の責任

## 🔄 バージョン履歴・互換性

### v2.2 (2025年1月15日) - 2シート構成・環境設定改善版

- ✅ **新機能**: 合理的な2シート構成への移行
  - メインシート（佐渡島内・完全版）+ 参考シート（佐渡市外・簡略版）
  - 冗長な3シート構成からの脱却（データ重複排除）
- ✅ **改善**: Python環境設定ガイドの詳細化
  - 仮想環境 vs システムPython環境の選択指針
  - 環境確認コマンドの提供
  - トラブルシューティングの充実
- ✅ **最適化**: ヘッダー構造の統一とシンプル化
- ✅ **ユーザビリティ**: どちらのシートを使うべきか明確化

### v2.1 (2025年8月5日) - 構造最適化版

- ✅ **新機能**: データ重複除去処理 (`processors/data_deduplicator.py`)
- ✅ **新機能**: テスト環境分離 (`tests/` ディレクトリ)
- ✅ **改善**: ディレクトリ構造の最適化
- ✅ **整理**: 非推奨ファイルの `_legacy/` 移動

### v2.0 (2025年8月4日) - 統合最適化版

- ✅ **統合**: CID処理の一元化
- ✅ **最適化**: API呼び出し効率化
- ✅ **新機能**: 佐渡市内外分離処理

### 旧バージョンとの互換性

- `run_unified.py`: 統合実行制御（推奨）
- 環境変数・設定ファイル: 完全互換
- **非推奨**: `_legacy/` 内ファイル（2025年9月削除予定）

### 推奨アップグレードパス

#### **v2.1以前からv2.2への移行**

```bash
# 1. 新しい2シート構成で実行
python run_unified.py --mode=standard --target=all

# 2. 古い3シート構成のシートは手動削除可能
# - restaurants_統合処理 → 削除可能
# - restaurants_佐渡市内 → 削除可能（restaurantsシートで代替）
# - parkings_統合処理 → 削除可能  
# - parkings_佐渡市内 → 削除可能（parkingsシートで代替）
# - toilets_統合処理 → 削除可能
# - toilets_佐渡市内 → 削除可能（toiletsシートで代替）
```

---

**最終更新**: 2025年1月15日  
**バージョン**: 2.2 (2シート構成・環境設定改善版)  
**最新機能**: 合理的な2シート構成・Python環境設定ガイド詳細化・ユーザビリティ向上  
**前回機能**: Places API (New) v1統合による包括的飲食店データ取得・新店舗自動発見システム・構造化スプレッドシート出力  
**最適化レベル**: A+ (プロフェッショナル・ユーザーフレンドリー)
