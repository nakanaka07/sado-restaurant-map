# Data Management Tools - データ管理ツール

佐渡島レストランマップアプリケーションのデータベース運用とデータ更新を管理するためのツール群です。Google Places APIを使用したデータ収集とコスト管理機能を提供します。

## 📁 ツール構成

```
tools/data/
├── database-operations.ps1  # データベース運用スクリプト（PowerShell）
└── README.md               # このファイル
```

## 🔧 主要ツール詳細

### **database-operations.ps1** - データベース運用スクリプト

Google Places APIを使用したデータ更新とコスト管理を行うPowerShellスクリプトです。API料金の透明性と手動実行による料金コントロールを重視した設計になっています。

#### **主要機能**

**1. 開発サーバー起動（料金なし）**
- 既存のスプレッドシートデータを使用
- API呼び出しなしでの開発環境提供
- ローカル開発での料金発生防止

**2. データ更新機能（料金発生）**
- **段階的更新**: テスト実行→全更新の安全なワークフロー
- **選択的更新**: 飲食店・駐車場・公衆トイレの個別更新
- **コスト表示**: 実行前の推定料金表示と確認プロンプト

**3. データベース状態確認**
- 環境設定の検証
- スプレッドシート接続状態確認
- 最終データ更新日の推定

**4. 地区分類修正（料金なし）**
- 既存データの地区分類再判定
- 佐渡市公式住所表記に基づく更新
- API呼び出しなしでの分類改善

#### **利用可能なアクション**

| アクション | 説明 | 推定料金 | API使用 |
|-----------|------|---------|---------|
| `dev` | 開発サーバー起動 | $0 | なし |
| `status` | データベース状態確認 | $0 | なし |
| `update-test` | 小規模テスト実行（飲食店のみ） | ~$4-5 | あり |
| `update-all` | 全データ更新 | ~$7-10 | あり |
| `restaurants` | 飲食店データのみ更新 | ~$4-5 | あり |
| `parkings` | 駐車場データのみ更新 | ~$1-2 | あり |
| `toilets` | 公衆トイレデータのみ更新 | ~$1-2 | あり |
| `fix-districts` | 地区分類修正 | $0 | なし |
| `help` | ヘルプ表示 | $0 | なし |

#### **環境チェック機能**

スクリプト実行前に以下の環境要件を自動確認：

- `.env.local`ファイルの存在
- Python仮想環境（`.venv`）の設定
- スクレイパーファイルの存在
- Node.js依存関係のインストール状況

## 🚀 使用方法

### **基本的な実行方法**

```powershell
# ヘルプ表示
.\database-operations.ps1 help

# 開発サーバー起動（料金なし）
.\database-operations.ps1 dev

# データベース状態確認
.\database-operations.ps1 status
```

### **データ更新ワークフロー**

**推奨手順: 段階的更新**

```powershell
# 1. まず小規模テストを実行
.\database-operations.ps1 update-test

# 2. 結果を確認後、全データ更新
.\database-operations.ps1 update-all

# 3. 開発サーバーで結果確認
.\database-operations.ps1 dev
```

**個別データ更新**

```powershell
# 飲食店データのみ更新
.\database-operations.ps1 restaurants

# 駐車場データのみ更新
.\database-operations.ps1 parkings

# 公衆トイレデータのみ更新
.\database-operations.ps1 toilets
```

### **オプション**

```powershell
# 確認プロンプトをスキップ
.\database-operations.ps1 update-test -SkipConfirm

# 強制実行（キャッシュクリア等）
.\database-operations.ps1 update-all -Force

# 複数オプション組み合わせ
.\database-operations.ps1 restaurants -SkipConfirm -Force
```

## 💰 コスト管理

### **API料金体系**

- **Google Places Text Search (New)**: $0.017 USD/リクエスト
- **推定リクエスト数**:
  - 飲食店: ~250-300件
  - 駐車場: ~50-100件
  - 公衆トイレ: ~50-100件

### **料金最適化機能**

**1. 事前コスト表示**
```powershell
⚠️  API利用料金に関する注意
========================================
  アクション: 全データ更新
  推定料金: ~$7-10 USD
  API: Google Places Text Search (New)
  料金体系: $0.017 USD/リクエスト
========================================
実行しますか？ (y/N)
```

**2. API遅延制御**
- テスト実行: 2秒間隔（レート制限対応）
- 本番更新: 1秒間隔（効率重視）

**3. 段階的実行**
- 小規模テスト→結果確認→全更新の安全なワークフロー
- 問題発見時の早期停止による料金節約

## 🔧 環境設定

### **必要な環境**

**1. PowerShell実行ポリシー**
```powershell
# 実行ポリシー確認
Get-ExecutionPolicy

# 必要に応じて変更
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**2. Python環境**
```bash
# 仮想環境作成
python -m venv .venv

# 仮想環境アクティベート（Windows）
.venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt
```

**3. Node.js環境**
```bash
# 依存関係インストール
pnpm install
```

**4. 環境変数設定（`.env.local`）**
```env
# Google Maps API設定
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_GOOGLE_MAPS_MAP_ID=your_map_id

# Google Sheets API設定
VITE_GOOGLE_SHEETS_API_KEY=your_sheets_api_key
VITE_SPREADSHEET_ID=your_spreadsheet_id

# デバッグ設定
VITE_DEBUG_MODE=true
```

## 📊 データ管理ワークフロー

### **日常開発**
```powershell
# 開発時は既存データを使用（料金なし）
.\database-operations.ps1 dev
```

### **月次データ更新**
```powershell
# 1. 現在の状態確認
.\database-operations.ps1 status

# 2. 小規模テスト実行
.\database-operations.ps1 update-test

# 3. 結果確認後、全データ更新
.\database-operations.ps1 update-all

# 4. 開発サーバーで結果確認
.\database-operations.ps1 dev
```

### **緊急時の個別更新**
```powershell
# 特定カテゴリのみ更新
.\database-operations.ps1 restaurants -SkipConfirm
```

## 🔍 トラブルシューティング

### **よくある問題**

**1. 環境チェックエラー**
```powershell
❌ 環境に問題があります:
  • .env.localファイルが存在しません
  • Python仮想環境が見つかりません (.venv)
```

**解決方法:**
- `.env.local`ファイルを作成し、必要な環境変数を設定
- Python仮想環境を作成: `python -m venv .venv`

**2. API料金制限**
```powershell
# 料金を抑えたい場合は個別更新を使用
.\database-operations.ps1 restaurants  # 飲食店のみ
.\database-operations.ps1 parkings     # 駐車場のみ
```

**3. スクレイパー実行エラー**
- Python仮想環境がアクティベートされているか確認
- 必要なPythonパッケージがインストールされているか確認
- Google Sheets APIの認証情報が正しく設定されているか確認

### **ログとデバッグ**

**実行ログの確認**
```powershell
# スクレイパーログファイル確認
Get-ChildItem "scraper\*.log" | Sort-Object LastWriteTime -Descending
```

**デバッグモード**
```powershell
# 環境変数でデバッグ情報を有効化
$env:VITE_DEBUG_MODE = "true"
.\database-operations.ps1 dev
```

## 📈 運用ベストプラクティス

### **コスト効率的な運用**

**1. 定期更新スケジュール**
- **月1回**: 全データ更新（`update-all`）
- **週1回**: 飲食店データのみ更新（`restaurants`）
- **日常**: 開発サーバーのみ使用（`dev`）

**2. 段階的更新の徹底**
```powershell
# 必ずテスト→本番の順序で実行
.\database-operations.ps1 update-test    # まずテスト
# 結果確認後
.\database-operations.ps1 update-all     # 本番更新
```

**3. 料金監視**
- 月次API使用量の確認
- 予算上限の設定
- 不要な実行の回避

### **データ品質管理**

**1. 地区分類の定期メンテナンス**
```powershell
# 月1回実行推奨（料金なし）
.\database-operations.ps1 fix-districts
```

**2. データ整合性チェック**
```powershell
# 状態確認を定期実行
.\database-operations.ps1 status
```

**3. バックアップ戦略**
- Google Sheetsの版数管理
- 重要な更新前のデータエクスポート
- ローカルキャッシュの定期クリア

---

このデータ管理ツールを活用することで、コスト効率的かつ安全なデータ運用を実現できます。API料金の透明性と段階的更新により、予期しない高額請求を防ぎながら、最新のデータを維持できます。
