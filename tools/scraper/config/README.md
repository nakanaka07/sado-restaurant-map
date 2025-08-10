# 🔧 Scraper Configuration Directory

佐渡飲食店マップ - スクレイパー設定ファイル管理

## 📋 概要

このディレクトリは、Google Places APIからのデータ収集とGoogle Sheetsへの書き込みに必要な設定ファイルを管理します。環境変数、ヘッダー定義、依存関係、認証情報の統一管理により、安全で効率的なデータ収集を実現します。

## 📁 ファイル構成

```
config/
├── .env.example              # 環境変数テンプレート
├── .env                      # 実際の環境変数（gitignore対象）
├── headers.py                # スプレッドシートヘッダー統一定義
├── requirements.txt          # 基本依存関係
├── requirements.optimized.txt # 最適化済み依存関係
├── service-account.json.example # Google認証設定テンプレート
└── your-service-account-key.json # 実際の認証キー（gitignore対象）
```

## 🔐 環境変数設定

### セットアップ手順

1. **テンプレートファイルのコピー**
   ```bash
   cp .env.example .env
   ```

2. **必須環境変数の設定**
   ```env
   # Google Places API
   PLACES_API_KEY=your_google_places_api_key_here
   
   # Google Sheets
   SPREADSHEET_ID=your_google_sheets_spreadsheet_id_here
   
   # Google認証（ローカル開発）
   GOOGLE_SERVICE_ACCOUNT_PATH=config/your-service-account-key.json
   ```

### 環境変数一覧

#### 🔑 必須設定
- **`PLACES_API_KEY`** - Google Places API キー
- **`SPREADSHEET_ID`** - Google Sheets スプレッドシート ID
- **`GOOGLE_SERVICE_ACCOUNT_PATH`** - サービスアカウントファイルパス

#### ⚙️ API制限設定
- **`API_DELAY`** - APIリクエスト間隔（秒）- デフォルト: 1.0
- **`SHEETS_API_DELAY`** - Google Sheets APIリクエスト間隔（秒）- デフォルト: 1.5

#### 🎯 実行設定
- **`TARGET_DATA`** - 更新対象データ（'all', 'restaurants', 'parkings', 'toilets'）
- **`DEFAULT_MODE`** - 実行モード（'quick', 'standard', 'comprehensive'）

#### 🚀 Phase 2 新機能設定
- **`USE_NEW_PROCESSORS`** - 新プロセッサー使用（true/false）
- **`DEBUG_MODE`** - デバッグモード（true/false）
- **`MAX_WORKERS`** - 並列処理数（デフォルト: 3）
- **`ENABLE_SMART_SKIP`** - スマートスキップ機能（true/false）
- **`ENABLE_LOCATION_SEPARATION`** - 佐渡市内・市外自動分離（true/false）

## 📊 ヘッダー定義システム

### `headers.py` の役割

Google Sheetsの列構成を統一管理し、データの整合性を保証します。

#### 主要機能

1. **統一ヘッダー定義**
   - レストラン、駐車場、トイレの各カテゴリ
   - 佐渡島内（完全版）と佐渡市外（簡略版）の2シート構成

2. **Places API (New) v1 対応**
   ```python
   # 拡張データフィールド
   "店舗説明",           # editorialSummary
   "テイクアウト",       # takeout
   "デリバリー",         # delivery
   "店内飲食",           # dineIn
   "予約可能",           # reservable
   ```

3. **ヘッダー取得関数**
   ```python
   get_unified_header(category)        # 統一ヘッダー取得
   get_main_category_header(category)  # メインシート用
   get_outside_category_header(category) # 佐渡市外シート用
   ```

### ヘッダー構成例

#### レストラン（完全版）
```python
[
    "Place ID", "店舗名", "所在地", "緯度", "経度",
    "評価", "レビュー数", "営業状況", "営業時間",
    "電話番号", "ウェブサイト", "価格帯", "店舗タイプ",
    "主要業種", "主要業種（原文）",
    # Places API v1 拡張データ
    "店舗説明", "テイクアウト", "デリバリー", "店内飲食",
    "カーブサイドピックアップ", "予約可能",
    # サービス詳細
    "朝食提供", "昼食提供", "夕食提供",
    "ビール提供", "ワイン提供", "カクテル提供",
    # 設備・環境
    "屋外席", "ライブ音楽", "トイレ完備",
    # 顧客対応
    "子供連れ歓迎", "ペット同伴可", "グループ向け",
    # メタデータ
    "地区", "GoogleマップURL", "取得方法", "最終更新日時"
]
```

## 📦 依存関係管理

### 基本依存関係（`requirements.txt`）

最小限の必須ライブラリのみ：

```txt
# Google API関連（必須）
google-auth>=2.23.0
google-auth-oauthlib>=1.1.0
gspread>=5.10.0

# HTTP通信・API呼び出し（必須）
requests>=2.31.0

# データ処理（必須）
pandas>=2.1.0

# 環境変数管理（必須）
python-dotenv>=1.0.0

# 型ヒント（開発効率向上）
typing_extensions>=4.7.0
```

### 最適化済み依存関係（`requirements.optimized.txt`）

追加ライブラリを含む完全版：

```txt
# 基本依存関係 + 以下を追加
urllib3>=2.0.0           # HTTP通信強化
numpy>=1.24.0            # データ処理高速化
beautifulsoup4>=4.12.0   # HTMLパース
python-dateutil>=2.8.0   # 日付処理
pytz>=2023.3             # タイムゾーン処理
```

### インストール方法

```bash
# 基本版（推奨）
pip install -r requirements.txt

# 最適化版（フル機能）
pip install -r requirements.optimized.txt
```

## 🔐 Google認証設定

### サービスアカウント設定

1. **Google Cloud Console での設定**
   - Google Cloud プロジェクト作成
   - Places API と Sheets API の有効化
   - サービスアカウント作成
   - 認証キーファイルのダウンロード

2. **認証ファイルの配置**
   ```bash
   # テンプレートファイルを参考に設定
   cp service-account.json.example your-service-account-key.json
   # 実際の認証情報を入力
   ```

3. **環境変数での指定**
   ```env
   # ローカル開発
   GOOGLE_SERVICE_ACCOUNT_PATH=config/your-service-account-key.json
   
   # CI/CD環境
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```

### 認証ファイル構造

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

## 🛠️ 使用方法

### 基本的な設定手順

1. **環境変数の設定**
   ```bash
   cp .env.example .env
   # .envファイルを編集して実際の値を設定
   ```

2. **依存関係のインストール**
   ```bash
   pip install -r requirements.txt
   ```

3. **Google認証の設定**
   ```bash
   cp service-account.json.example your-service-account-key.json
   # 認証ファイルを編集して実際の値を設定
   ```

4. **設定の検証**
   ```bash
   python -c "from config.headers import get_unified_header; print('設定OK')"
   ```

### ヘッダー定義の使用例

```python
from config.headers import get_unified_header, get_outside_category_header

# メインシート用ヘッダー取得
restaurant_headers = get_unified_header('restaurants')

# 佐渡市外シート用ヘッダー取得
outside_headers = get_outside_category_header('restaurants')

# 検索失敗時のヘッダー取得
from config.headers import get_not_found_header
error_headers = get_not_found_header()
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. **環境変数エラー**
```bash
# 問題: 環境変数が読み込まれない
# 解決: .envファイルの存在確認
ls -la .env

# 解決: 環境変数の構文確認
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('PLACES_API_KEY'))"
```

#### 2. **Google認証エラー**
```bash
# 問題: サービスアカウントファイルが見つからない
# 解決: ファイルパスの確認
ls -la config/your-service-account-key.json

# 解決: 権限の確認
python -c "import json; print(json.load(open('config/your-service-account-key.json'))['client_email'])"
```

#### 3. **依存関係エラー**
```bash
# 問題: パッケージインストールエラー
# 解決: Python環境の確認
python --version
pip --version

# 解決: 仮想環境の使用
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 4. **ヘッダー定義エラー**
```python
# 問題: ヘッダーが取得できない
# 解決: カテゴリ名の確認
from config.headers import UNIFIED_HEADERS
print(list(UNIFIED_HEADERS.keys()))

# 解決: 正しい関数の使用
from config.headers import get_unified_header
headers = get_unified_header('restaurants')  # 正しい
```

## 📈 最適化のベストプラクティス

### 1. **コスト効率的な設定**
```env
# APIリクエスト間隔を調整してコスト削減
API_DELAY=1.5
SHEETS_API_DELAY=2.0

# ターゲットデータを限定
TARGET_DATA=restaurants  # 'all'の代わりに個別指定
```

### 2. **パフォーマンス最適化**
```env
# 並列処理数の調整
MAX_WORKERS=3  # CPUコア数に応じて調整

# スマート機能の活用
ENABLE_SMART_SKIP=true
ENABLE_LOCATION_SEPARATION=true
```

### 3. **セキュリティ強化**
```bash
# .envファイルの権限設定
chmod 600 .env
chmod 600 config/your-service-account-key.json

# gitignoreの確認
echo ".env" >> .gitignore
echo "config/your-service-account-key.json" >> .gitignore
```

## 🔄 設定の更新とメンテナンス

### 定期的なメンテナンス

1. **依存関係の更新**
   ```bash
   pip list --outdated
   pip install --upgrade package_name
   ```

2. **環境変数の見直し**
   - API制限値の調整
   - 新機能フラグの確認
   - セキュリティ設定の更新

3. **ヘッダー定義の拡張**
   - 新しいPlaces APIフィールドの追加
   - カテゴリの追加・変更
   - マイグレーション対応

## 📚 関連ドキュメント

- [tools/data/README.md](../data/README.md) - データベース操作とデータ管理
- [tools/testing/README.md](../testing/README.md) - テストと診断ツール
- [tools/analysis/README.md](../analysis/README.md) - コード品質分析ツール

## 🎯 まとめ

この設定ディレクトリは、佐渡飲食店マップのデータ収集システムの中核となる設定管理を担当します。環境変数、ヘッダー定義、依存関係、認証情報の統一管理により、安全で効率的なデータ収集を実現し、プロジェクトの品質と保守性を向上させます。
