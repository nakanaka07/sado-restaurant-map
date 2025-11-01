# Scripts Directory

このディレクトリには、開発・デプロイ・分析・最適化に関する各種スクリプトが含まれています。

## 📋 スクリプト一覧

### 🚀 デプロイ・環境構築

#### `setup-dev.ps1`

**目的**: 開発環境の初期セットアップ
**実行タイミング**: プロジェクトクローン後の初回のみ
**前提条件**: Node.js 20.19+, pnpm, Git
**実行方法**:

```powershell
.\scripts\setup-dev.ps1
```

**機能**:

- 前提条件チェック（Node.js/pnpm/Git）
- 依存関係インストール
- .env.local テンプレート作成
- TypeScript/PWA設定確認
- 開発サーバー起動オプション

**オプション**:

- `-Clean`: node_modules等をクリーンアップ後セットアップ
- `-SkipInstall`: 依存関係インストールをスキップ
- `-Verbose`: 詳細ログ出力

---

#### `deploy-production.ps1`

**目的**: GitHub Pagesへの本番デプロイ
**実行タイミング**: リリース時（mainブランチ）
**前提条件**: ビルド成功、全テストパス、gh-pagesパッケージ
**実行方法**:

```powershell
.\scripts\deploy-production.ps1
```

**機能**:

- Git状態・ブランチ確認
- 環境変数設定（NODE_ENV=production）
- ビルド前チェック（TypeScript/ESLint/Tests）
- 本番ビルド実行
- PWA設定検証
- GitHub Pagesデプロイ

**オプション**:

- `-SkipBuild`: ビルドをスキップ（既存distを使用）
- `-DryRun`: デプロイコマンドを表示のみ（実行しない）
- `-Verbose`: 詳細ログ出力

---

### 🧪 テスト・品質保証

#### `regression-test.ps1`

**目的**: リグレッションテスト実行
**実行タイミング**: リリース前、大規模リファクタ後
**実行方法**:

```powershell
.\scripts\regression-test.ps1
```

**機能**:

- 全テストスイート実行
- 既存機能の破壊検出
- パフォーマンス比較

---

#### `run-security-tests.ps1`

**目的**: セキュリティテスト・脆弱性スキャン
**実行タイミング**: 週次、依存関係更新後
**実行方法**:

```powershell
.\scripts\run-security-tests.ps1
```

**機能**:

- npm audit実行
- 既知の脆弱性検出
- セキュリティレポート生成

---

#### `health-check.ps1`

**目的**: プロジェクト全体のヘルスチェック
**実行タイミング**: 定期（日次/週次）、デプロイ前
**実行方法**:

```powershell
.\scripts\health-check.ps1
```

**機能**:

- ビルド状態確認
- テストカバレッジチェック
- バンドルサイズ検証
- リンク切れ検出

---

### 📊 分析・モニタリング

#### `analyze-ab-test-results.js`

**目的**: A/Bテスト結果の統計分析
**実行タイミング**: ロールアウト判断時（20%→50%→100%）
**実行方法**:

```bash
node scripts/analyze-ab-test-results.js
```

**機能**:

- 統計的有意性検証（p値計算）
- パフォーマンス改善率算出
- ロールアウト推奨判定
- 詳細レポート生成

**出力例**:

```
📊 A/Bテスト結果分析レポート
- p値: 0.0032 (統計的有意)
- バンドルサイズ改善: 19.9%
- CTR改善: +28.7%
推奨: proceed_to_50 (高信頼度)
```

---

#### `check-contrast.js`

**目的**: WCAG AAコントラスト比検証
**実行タイミング**: 色変更時、アクセシビリティレビュー時
**実行方法**:

```bash
node scripts/check-contrast.js
```

**機能**:

- カテゴリ別色のコントラスト比計算
- WCAG 2.2 AA基準（4.5:1）チェック
- 合否判定レポート

**出力例**:

```
japanese:  #D32F2F -> 5.21:1 ✅ PASS
noodles:   #BF360C -> 6.20:1 ✅ PASS
```

---

### 🧹 test/ サブディレクトリ

#### `test/distributed-processing.py`

**目的**: 分散処理テスト（Python）
**実行タイミング**: data-platform統合テスト時
**実行方法**:

```bash
python scripts/test/distributed-processing.py
```

---

#### `test/system-test.py`

**目的**: システム全体統合テスト（Python）
**実行タイミング**: data-platform変更後
**実行方法**:

```bash
python scripts/test/system-test.py
```

---

## 🔄 実行頻度ガイド

| スクリプト                 | 頻度               | タイミング         |
| -------------------------- | ------------------ | ------------------ |
| setup-dev.ps1              | 1回                | 初回セットアップ時 |
| deploy-production.ps1      | リリース毎         | mainマージ後       |
| health-check.ps1           | 日次/週次          | 定期実行           |
| run-security-tests.ps1     | 週次               | 依存更新後         |
| regression-test.ps1        | リリース前         | 大規模変更後       |
| analyze-ab-test-results.js | ロールアウト判断時 | データ収集完了後   |
| check-contrast.js          | 色変更時           | デザイン更新後     |

---

## 📦 アーカイブディレクトリ

`archive/` には、一度きりのセットアップや低頻度使用のスクリプトが含まれています。

### アーカイブ済みスクリプト

- **アイコン最適化関連** (5 スクリプト)
  - `download-phosphor-icons.ps1`
  - `download-convert-phosphor-icons.ps1`
  - `optimize-large-icons.ps1`
  - `simple-icon-optimize.ps1`
  - `resize-pwa-icons.ps1`

**詳細**: [`scripts/archive/README.md`](./archive/README.md) を参照

**使用方法**:

```powershell
# アーカイブから直接実行
.\scripts\archive\<script-name>.ps1
```

---

## � 共通ライブラリ (`lib/common.ps1`)

全スクリプトで使用可能なヘルパー関数を提供します。

### 使用方法

```powershell
# スクリプトの先頭に追加
. (Join-Path $PSScriptRoot "lib/common.ps1")

# カラー出力
Write-Success "成功メッセージ"
Write-Error "エラーメッセージ"
Write-Warning "警告メッセージ"
Write-Info "情報メッセージ"

# テスト結果管理
$results = New-TestResult
Add-TestResult -TestResults $results -TestName "テスト名" -Status "PASS"
$summary = Get-TestSummary -TestResults $results

# 環境確認
Test-Prerequisites
Test-NodeVersion -MinVersion "20.19.0"

# ビルド・テスト
Invoke-TypeScriptCheck -Verbose
Invoke-LintCheck
Invoke-TestSuite

# レポート保存
Save-JsonReport -Data $results -FilePath "logs/report.json"
```

### 主要関数

| 関数                               | 説明                           |
| ---------------------------------- | ------------------------------ |
| `Write-Success/Error/Warning/Info` | カラー出力                     |
| `New-TestResult`                   | テスト結果ハッシュテーブル作成 |
| `Add-TestResult`                   | テスト結果追加                 |
| `Get-TestSummary`                  | 成功率計算                     |
| `Test-Prerequisites`               | Node.js/pnpm/Git確認           |
| `Invoke-TypeScriptCheck`           | TypeScript型チェック           |
| `Invoke-LintCheck`                 | ESLint実行                     |
| `Invoke-TestSuite`                 | テストスイート実行             |
| `Save-JsonReport`                  | JSONレポート保存               |
| `Show-ScriptHelp`                  | ヘルプ表示                     |

---

## スクリプト追加ガイドライン

新規スクリプトを追加する際は、以下を含めてください：

1. **ヘルプオプション** (必須)

   ```powershell
   param(
     [switch]$Help
   )

   if ($Help) {
     @"
   🎯 スクリプト名
   ==================

   目的: スクリプトの説明

   パラメータ:
     -Help : このヘルプを表示

   使用例:
     .\scripts\script-name.ps1
   "@
     exit 0
   }
   ```

2. **共通ライブラリの読み込み**

   ```powershell
   . (Join-Path $PSScriptRoot "lib/common.ps1")
   ```

3. **エラーハンドリング**

   ```powershell
   $ErrorActionPreference = "Stop"
   try { ... } catch { ... }
   ```

4. **このREADME.mdへの追記**

---

## 🔄 最近の改善 (2025-11-01)

### ✅ 実装済み

1. **共通ライブラリ作成** (`lib/common.ps1`)
   - カラー出力関数の統一
   - テスト結果管理の標準化
   - 環境確認・ビルド関数の共通化

2. **ヘルプオプション追加**
   - 全スクリプトに`-Help`オプション実装
   - 使用方法・パラメータ説明を統一

3. **regression-test.ps1 強化**
   - カバレッジ閾値チェック追加 (50%基準)
   - 詳細カバレッジ情報表示 (statements/branches/functions)

4. **run-security-tests.ps1 強化**
   - CSPヘッダー詳細検証
   - `unsafe-inline`/`unsafe-eval`検出
   - `Referrer-Policy`/`Permissions-Policy`チェック追加

### 📋 使用例

```powershell
# ヘルプ表示
.\scripts\setup-dev.ps1 -Help
.\scripts\regression-test.ps1 -Help

# カバレッジ付きリグレッションテスト
pnpm test:coverage
.\scripts\regression-test.ps1 -Detailed

# セキュリティテスト (詳細モード)
.\scripts\run-security-tests.ps1 -Verbose -Json
```

---

## 🆘 トラブルシューティング

### PowerShell実行ポリシーエラー

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### pnpmが見つからない

```powershell
npm install -g pnpm
```

### ビルドエラー

```powershell
pnpm clean
pnpm install
pnpm build
```

---

Last Updated: 2025-11-01
