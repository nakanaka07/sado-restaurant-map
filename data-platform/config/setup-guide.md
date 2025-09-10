# 🚀 data-platform 環境設定ガイド

## 📋 概要

このガイドでは、data-platform（佐渡飲食店マップのデータ収集システム）の環境設定を詳しく説明します。

## 🏗️ システム要件

### 必須要件

- **Python**: 3.9+ (推奨: 3.11)
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **メモリ**: 最低 4GB, 推奨 8GB+
- **ストレージ**: 最低 2GB の空き容量

### API アクセス

- **Google Places API** キー（必須）
- **Google Sheets API** サービスアカウント（必須）
- **Google Drive API** アクセス権限（必須）

## 🔧 ステップ 1: Python 環境準備

### 1.1 Python バージョン確認

```bash
python --version
# または
python3 --version
```

### 1.2 仮想環境作成

```bash
# プロジェクトディレクトリに移動
cd data-platform

# 仮想環境作成
python -m venv .venv

# 仮想環境有効化
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (Command Prompt)
.venv\Scripts\activate.bat

# macOS/Linux
source .venv/bin/activate
```

### 1.3 依存関係インストール

```bash
# 基本依存関係インストール
pip install -r config/requirements.txt

# Phase 3 高度機能も使用する場合
pip install scikit-learn redis celery
```

## 🔑 ステップ 2: Google API 設定

### 2.1 Google Cloud Console 設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存プロジェクトを選択
3. 以下の API を有効化:
   - **Places API (New)**
   - **Google Sheets API**
   - **Google Drive API**

### 2.2 Places API キー取得

1. 「認証情報」→「認証情報を作成」→「API キー」
2. API キー制限を設定（推奨）:
   - **アプリケーションの制限**: なし（テスト時）
   - **API の制限**: Places API のみ
3. 取得したキーを記録

### 2.3 サービスアカウント作成

1. 「認証情報」→「認証情報を作成」→「サービス アカウント」
2. サービスアカウント情報を入力:
   - **名前**: sado-restaurant-map-service
   - **説明**: Data collection service account
3. 「完了」をクリック

### 2.4 サービスアカウントキー生成

1. 作成したサービスアカウントをクリック
2. 「キー」タブ→「鍵を追加」→「新しい鍵を作成」
3. **JSON** 形式を選択してダウンロード
4. ファイルを `config/service-account.json` に配置

## 📊 ステップ 3: Google Sheets 設定

### 3.1 スプレッドシート作成

1. [Google Sheets](https://sheets.google.com/) でスプレッドシートを新規作成
2. 名前を「佐渡飲食店データ」などに変更
3. URL から **SPREADSHEET_ID** を取得:

   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

### 3.2 共有設定

1. スプレッドシートの「共有」ボタンをクリック
2. サービスアカウントのメールアドレスを追加:
   - アドレス: `service-account-name@project-id.iam.gserviceaccount.com`
   - 権限: **編集者**

## ⚙️ ステップ 4: 環境変数設定

### 4.1 環境ファイル作成

```bash
# .env ファイルを作成
cp .env.example .env
```

### 4.2 .env ファイル編集

```env
# 必須設定
PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_SERVICE_ACCOUNT_PATH=config/service-account.json
SPREADSHEET_ID=1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# オプション設定
API_DELAY=1.0
MAX_WORKERS=3
LOG_LEVEL=INFO
```

## 🧪 ステップ 5: 動作確認

### 5.1 設定テスト

```bash
# ドライラン実行（実際のAPI呼び出しなし）
python interface/cli/main.py --dry-run
```

### 5.2 小規模テスト

```bash
# 少数データでテスト
python interface/cli/main.py --target toilets --mode quick
```

### 5.3 完全テスト

```bash
# 全データ処理テスト（注意: API使用量消費）
python interface/cli/main.py --target all --mode standard
```

## 🛠️ トラブルシューティング

### よくある問題

#### 1. `ImportError: No module named 'XXX'`

**解決方法**:

```bash
# 仮想環境が有効化されているか確認
which python  # macOS/Linux
where python  # Windows

# 依存関係を再インストール
pip install -r config/requirements.txt
```

#### 2. `google.auth.exceptions.DefaultCredentialsError`

**原因**: サービスアカウントファイルが見つからない

**解決方法**:

```bash
# ファイルパスを確認
ls -la config/service-account.json  # macOS/Linux
dir config\service-account.json     # Windows

# パーミッション確認（macOS/Linux）
chmod 600 config/service-account.json
```

#### 3. `403 Forbidden` エラー

**原因**: API権限または使用量制限

**解決方法**:

1. Google Cloud Console で API が有効化されているか確認
2. 課金アカウントが設定されているか確認
3. API使用量制限を確認

#### 4. `400 Bad Request` エラー

**原因**: スプレッドシートアクセス権限不足

**解決方法**:

1. スプレッドシートでサービスアカウントが共有されているか確認
2. SPREADSHEET_ID が正しいか確認

## 🔍 デバッグ設定

### デバッグモード有効化

```env
# .env ファイルに追加
DEBUG_MODE=true
LOG_LEVEL=DEBUG
VERBOSE_LOGGING=true
```

### ログ確認

```bash
# 詳細ログで実行
python interface/cli/main.py --target toilets --mode quick
```

## 📈 パフォーマンス最適化

### 推奨設定

```env
# 効率的な設定例
API_DELAY=1.0                    # API制限内で最適化
MAX_WORKERS=3                    # 並列処理最適化
RATE_LIMIT_PER_SECOND=10.0       # レート制限遵守
ENABLE_PERFORMANCE_MONITORING=true
```

### Phase 3 高度機能

```env
# Redis Cache（オプション）
REDIS_URL=redis://localhost:6379
CACHE_TTL=86400

# Celery分散処理（オプション）
CELERY_BROKER_URL=redis://localhost:6379/1
```

## 📞 サポート

### ヘルプ情報

```bash
# コマンドヘルプ
python interface/cli/main.py --help

# バージョン情報
python interface/cli/main.py --version
```

### 問題報告

問題が解決しない場合は、以下の情報と共に GitHub Issues で報告してください:

1. **環境情報**: OS, Python バージョン
2. **エラーメッセージ**: 完全なスタックトレース
3. **実行コマンド**: 実行したコマンド
4. **設定ファイル**: .env の設定（APIキーは除く）

---

## 📚 関連ドキュメント

- [README.md](../README.md) - プロジェクト概要
- [requirements.txt](requirements.txt) - 依存関係一覧
- [pytest.ini](pytest.ini) - テスト設定

---

**最終更新**: 2025年9月10日
