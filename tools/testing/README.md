# Testing Tools - テスト・診断ツール

佐渡島レストランマップアプリケーションの環境設定と統合テストを行うためのツール群です。

## 📁 ツール構成

```text
tools/testing/
├── check-environment.ps1    # 環境変数設定チェック
├── test-integration.ps1     # Google Sheets統合テスト
└── README.md               # このファイル
```

## 🔧 ツール詳細

### check-environment.ps1 - 環境変数設定チェックツール

開発環境の環境変数設定を検証し、問題があれば解決方法を提示します。

#### 必須環境変数

```typescript
VITE_GOOGLE_MAPS_API_KEY; // Google Maps JavaScript API キー
VITE_GOOGLE_MAPS_MAP_ID; // Google Maps Map ID
VITE_GOOGLE_SHEETS_API_KEY; // Google Sheets API v4 キー
VITE_SPREADSHEET_ID; // スプレッドシートID
```

#### 使用方法

```powershell
# 基本チェック
.\check-environment.ps1

# 詳細表示（環境変数値をマスクして表示）
.\check-environment.ps1 -Verbose

# 自動修正提案表示
.\check-environment.ps1 -Fix
```

### test-integration.ps1 - Google Sheets 統合テストツール

Google Sheets API との統合テストを実行し、データフローの動作確認を行います。

#### 主要機能

1. **環境準備** - `.env.local`ファイルと Python 仮想環境の確認
2. **データ統合テスト** - スクレイパーの実行と Google Sheets への書き込み確認
3. **フロントエンド検証** - TypeScript 型チェックと開発サーバーの起動

#### test-integration.ps1 使用方法

```powershell
# 統合テスト実行
.\test-integration.ps1
```

## 🚀 実行方法

### 開発環境セットアップ時

```powershell
# 1. 環境設定確認
.\check-environment.ps1 -Verbose

# 2. 統合テスト実行
.\test-integration.ps1
```

### 定期的な品質チェック

```powershell
# 週次環境チェック
.\check-environment.ps1

# 月次統合テスト
.\test-integration.ps1
```

## 📊 トラブルシューティング

### 環境変数未設定エラー

```powershell
# .env.localファイルを作成
Copy-Item .env.local.example .env.local
# 必要なAPIキー値を設定
```

### Python 環境エラー

```powershell
# 仮想環境作成
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r tools/scraper/requirements.txt
```

## 🔧 環境要件

- **PowerShell 5.1+** または **PowerShell Core 7.0+**
- **Python 3.8+** (仮想環境対応)
- **Node.js 18+** (pnpm 使用)

---

これらのテストツールを活用することで、開発環境の安定した品質保証を実現できます。
