# scripts/ ディレクトリ

佐渡飲食店マップ - React 19 + TypeScript 5.7 + Vite 7 環境向けの運用・開発支援スクリプト集

## 📁 構成

```
scripts/
├── setup-dev.ps1           # 開発環境セットアップ（PowerShell）
├── deploy-production.ps1   # GitHub Pages デプロイ（PowerShell）
├── health-check.ps1        # システムヘルスチェック（PowerShell）
├── run-security-tests.ps1  # セキュリティテスト（PowerShell）
├── test/
│   └── system-test.py      # システム統合テスト（Python）
└── README.md               # このファイル
```

## 🚀 スクリプト一覧

### 1. 開発環境セットアップ

```powershell
.\scripts\setup-dev.ps1
```

**機能**:

- Node.js、pnpm、Git の前提条件確認
- 依存関係の自動インストール
- 環境変数ファイル（.env.local）のテンプレート作成
- TypeScript・PWA設定の確認
- 開発サーバーの起動オプション

**オプション**:

- `-Clean`: プロジェクトクリーンアップ実行
- `-SkipInstall`: 依存関係インストールをスキップ
- `-Verbose`: 詳細ログ出力

### 2. GitHub Pages デプロイ

```powershell
.\scripts\deploy-production.ps1
```

**機能**:

- Git状態・ブランチ確認
- TypeScript・ESLint・テストの品質チェック
- Vite本番ビルド実行
- PWA設定の確認
- GitHub Pagesへの自動デプロイ

**オプション**:

- `-SkipBuild`: ビルドをスキップ（既存distを使用）
- `-DryRun`: 実際のデプロイは行わず、コマンド確認のみ
- `-Verbose`: 詳細ログ出力

### 3. システムヘルスチェック

```powershell
.\scripts\health-check.ps1
```

**機能**:

- システムリソース（CPU・メモリ・ディスク）監視
- 開発ツール（Node.js・pnpm・Git）確認
- プロジェクト構造・設定ファイル確認
- 依存関係の状態確認
- ビルドシステムの簡易チェック

**オプション**:

- `-Verbose`: 詳細な診断情報表示
- `-Json`: JSON形式でレポート出力
- `-Quick`: 高速チェック（ビルドテストをスキップ）

### 4. セキュリティテスト

```powershell
.\scripts\run-security-tests.ps1
```

**機能**:

- npm audit による依存関係脆弱性スキャン
- ESLint・TypeScriptセキュリティチェック
- 設定ファイル（.env、vite.config.ts等）のセキュリティ確認
- Webセキュリティヘッダーの確認（開発サーバー対象）

**オプション**:

- `-TargetUrl`: テスト対象URL（デフォルト: <http://localhost:5173）>
- `-SkipDependencyCheck`: 依存関係チェックをスキップ
- `-Json`: JSON形式でレポート出力
- `-Verbose`: 詳細な診断情報表示

### 5. システム統合テスト

```bash
python scripts/test/system-test.py
```

**機能**:

- システムヘルスチェック（CPU・メモリ・ディスク）
- 開発環境の包括確認
- プロジェクト構造の妥当性検証
- package.json設定の確認
- ビルドプロセステスト
- Google Maps API設定確認

## 📋 使用方法

### 🔧 初回セットアップ

```powershell
# 1. 開発環境セットアップ
.\scripts\setup-dev.ps1

# 2. システム確認
.\scripts\health-check.ps1 -Verbose

# 3. セキュリティチェック
.\scripts\run-security-tests.ps1
```

### 🚀 日常的な開発フロー

```powershell
# 開発開始前のヘルスチェック
.\scripts\health-check.ps1 -Quick

# 開発サーバー起動
pnpm run dev

# デプロイ前チェック
.\scripts\run-security-tests.ps1

# GitHub Pagesデプロイ
.\scripts\deploy-production.ps1
```

### 🐛 トラブルシューティング

```powershell
# 詳細システム診断
.\scripts\health-check.ps1 -Verbose -Json

# プロジェクトクリーンアップ & 再セットアップ
.\scripts\setup-dev.ps1 -Clean

# Python統合テスト（詳細確認）
python scripts/test/system-test.py
```

## ⚙️ 環境要件

### 必須

- **Windows PowerShell** 5.1+ または PowerShell Core 7.0+
- **Node.js** 20.19+
- **pnpm** 8.0+
- **Git** 2.40+

### オプション（テスト用）

- **Python** 3.8+ （system-test.py用）
- **psutil** （システム監視用）: `pip install psutil`
- **requests** （HTTP確認用）: `pip install requests`

## 🔐 セキュリティ考慮事項

- スクリプトは `.env.local` 内の機密情報をチェックしますが、実際の値は表示しません
- 依存関係の脆弱性は自動で検出・報告されます
- セキュリティテスト結果は `logs/security-tests/` に保存されます
- すべてのスクリプトは読み取り専用操作で、破壊的変更は確認後に実行されます

## 📊 ログ・レポート

スクリプト実行結果は以下に保存されます：

- `logs/health-check-YYYYMMDD-HHMMSS.json` - ヘルスチェック結果
- `logs/security-tests/` - セキュリティテスト結果
- 標準出力 - リアルタイム実行状況

## 🤝 トラブルシューティングガイド

### よくある問題と解決方法

1. **PowerShell実行ポリシーエラー**

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Node.js/pnpmが見つからない**
   - Node.js: <https://nodejs.org> からインストール
   - pnpm: `npm install -g pnpm`

3. **Git認証エラー（デプロイ時）**
   - GitHub PAT設定確認
   - SSH鍵設定確認

4. **依存関係エラー**

   ```powershell
   .\scripts\setup-dev.ps1 -Clean
   ```

## 📚 関連ドキュメント

- [docs/development/](../docs/development/) - 開発ガイド
- [docs/MAINTENANCE.md](../docs/MAINTENANCE.md) - メンテナンス手順
- [package.json](../package.json) - プロジェクト設定
- [README.md](../README.md) - プロジェクト概要

---

**最終更新**: 2025年9月9日
**対応プロジェクト**: 佐渡飲食店マップ v0.0.0
**技術スタック**: React 19 + TypeScript 5.7 + Vite 7 + GitHub Pages
