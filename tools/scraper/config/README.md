# 🔧 Scraper Configuration

佐渡飲食店マップのデータ収集システム設定管理

## 📁 ファイル構成

```text
config/
├── .env.example              # 環境変数テンプレート
├── .env                      # 実際の環境変数（gitignore対象）
├── headers.py                # スプレッドシートヘッダー統一定義
├── requirements.txt          # 依存関係
├── service-account.json.example # Google認証設定テンプレート
└── your-service-account-key.json # 実際の認証キー（gitignore対象）
```

## 🚀 セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集して実際の値を設定
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 3. Google 認証の設定

```bash
cp service-account.json.example your-service-account-key.json
# 認証ファイルを編集して実際の値を設定
```

## 🔐 環境変数

### 必須設定

- `PLACES_API_KEY` - Google Places API キー
- `SPREADSHEET_ID` - Google Sheets スプレッドシート ID
- `GOOGLE_SERVICE_ACCOUNT_PATH` - サービスアカウントファイルパス

### オプション設定

- `API_DELAY` - API リクエスト間隔（デフォルト: 1.0 秒）
- `TARGET_DATA` - 更新対象データ（'all', 'restaurants', 'parkings', 'toilets'）
- `MAX_WORKERS` - 並列処理数（デフォルト: 3）

## 📊 ヘッダー定義（headers.py）

スプレッドシートの列構成を統一管理：

```python
from config.headers import get_unified_header

# メインシート用ヘッダー取得
restaurant_headers = get_unified_header('restaurants')

# 佐渡市外シート用ヘッダー取得
outside_headers = get_outside_category_header('restaurants')
```

### 対応カテゴリ

- `restaurants` / `restaurants_佐渡市外`
- `parkings` / `parkings_佐渡市外`
- `toilets` / `toilets_佐渡市外`

## 🔒 セキュリティ

### 機密ファイルの管理

```bash
# ファイル権限設定
chmod 600 .env
chmod 600 config/your-service-account-key.json

# .gitignore確認
echo ".env" >> .gitignore
echo "config/your-service-account-key.json" >> .gitignore
```

## 🔧 トラブルシューティング

### 設定確認

```python
# 環境変数の確認
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('PLACES_API_KEY'))"

# ヘッダー定義の確認
python -c "from config.headers import get_unified_header; print(len(get_unified_header('restaurants')))"
```

### よくある問題

1. **環境変数エラー** → `.env`ファイルの存在・構文確認
2. **認証エラー** → サービスアカウントファイルのパス・権限確認
3. **依存関係エラー** → Python 環境・仮想環境の確認

## 📚 関連ドキュメント

- [../data/README.md](../data/README.md) - データ管理
- [../processors/README.md](../processors/README.md) - データ処理システム
- [../src/README.md](../src/README.md) - 実行スクリプト
