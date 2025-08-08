# ルートディレクトリ整理ロードマップ

> 🎯 **目的**: プロジェクトルートの散在ファイルを適切に整理し、保守性・可読性を向上  
> **作成日**: 2025 年 8 月 8 日  
> **対象**: 佐渡飲食店マップ プロジェクト

## 📋 現状分析

### 🔍 整理対象ファイル（優先度順）

#### 🚨 **High Priority - 即座に整理**

```text
analyze-cuisine-detailed.js     → tools/analysis/
analyze-cuisine.js             → tools/analysis/
analyze-data.js               → tools/analysis/
investigate-sheets.js         → tools/data/
test-improved-classification.js → tools/testing/
test-integration.js           → tools/testing/
coupling-analysis-report.json → docs/reports/
dependency-graph.json         → docs/reports/
```

#### ⚠️ **Medium Priority - 段階的に整理**

```text
ai-prompts.md                 → docs/development/
copilot-instructions.md       → docs/development/
ARCHITECTURE_DECISIONS.md    → docs/architecture/
DEVELOPMENT_ROADMAP.md        → docs/planning/
SECURITY.md                   → docs/security/
PROJECT_STRUCTURE_OPTIMIZATION_ROADMAP.md → docs/planning/
```

#### ✅ **Low Priority - 現状維持**

```text
package.json                  → ルート維持（必須）
pnpm-lock.yaml               → ルート維持（必須）
pnpm-workspace.yaml          → ルート維持（必須）
README.md                    → ルート維持（エントリーポイント）
.gitignore                   → ルート維持（Git設定）
index.html                   → ルート維持（Vite エントリー）
vite.config.ts              → ルート維持（ビルド設定）
tsconfig.*.json             → ルート維持（TypeScript設定）
```

## 🏗️ 目標ディレクトリ構造

### 📁 **整理後の理想構造**

```text
sado-restaurant-map/
├── 📄 package.json                 # プロジェクト設定（必須）
├── 📄 pnpm-lock.yaml              # 依存関係ロック（必須）
├── 📄 pnpm-workspace.yaml         # ワークスペース設定（必須）
├── 📄 README.md                   # プロジェクト説明（エントリーポイント）
├── 📄 .gitignore                  # Git除外設定（必須）
├── 📄 index.html                  # HTML エントリーポイント（Vite）
├── 📄 vite.config.ts              # Vite設定（ビルド）
├── 📄 tsconfig.json               # TypeScript基本設定
├── 📄 tsconfig.app.json           # アプリ用TypeScript設定
├── 📄 tsconfig.node.json          # Node用TypeScript設定
│
├── 📁 src/                        # ✅ 既に整理済み
├── 📁 public/                     # ✅ 静的アセット（適切）
├── 📁 config/                     # ✅ 設定ファイル（適切）
├── 📁 scripts/                    # ✅ スクリプト（適切）
│
├── 📁 docs/                       # 📝 ドキュメント統合（新規作成）
│   ├── 📁 development/            # 開発支援ドキュメント
│   │   ├── 📄 ai-prompts.md
│   │   └── 📄 copilot-instructions.md
│   ├── 📁 architecture/           # アーキテクチャドキュメント
│   │   └── 📄 ARCHITECTURE_DECISIONS.md
│   ├── 📁 planning/               # 計画・ロードマップ
│   │   ├── 📄 DEVELOPMENT_ROADMAP.md
│   │   └── 📄 PROJECT_STRUCTURE_OPTIMIZATION_ROADMAP.md
│   ├── 📁 security/               # セキュリティドキュメント
│   │   └── 📄 SECURITY.md
│   └── 📁 reports/                # 分析レポート
│       ├── 📄 coupling-analysis-report.json
│       └── 📄 dependency-graph.json
│
├── 📁 tools/                      # 🛠️ 開発ツール統合（拡張）
│   ├── 📁 analysis/               # データ分析スクリプト
│   │   ├── 📄 analyze-cuisine-detailed.js
│   │   ├── 📄 analyze-cuisine.js
│   │   └── 📄 analyze-data.js
│   ├── 📁 data/                   # データ調査ツール
│   │   └── 📄 investigate-sheets.js
│   ├── 📁 testing/                # テストユーティリティ
│   │   ├── 📄 test-improved-classification.js
│   │   └── 📄 test-integration.js
│   └── 📁 scraper/                # ✅ 既存（適切）
│
├── 📁 .vscode/                    # VS Code設定（適切）
├── 📁 .github/                    # GitHub設定（適切）
├── 📁 .env.local                  # 環境変数（適切）
├── 📁 .env.local.example          # 環境変数例（適切）
├── 📁 node_modules/               # 依存関係（自動生成）
├── 📁 dist/                       # ビルド成果物（自動生成）
└── 📁 dev-dist/                   # 開発ビルド（自動生成）
```

## 🚀 実行計画

### Phase 1: ディレクトリ準備（即座実行）

#### 1.1 新規ディレクトリ作成

```bash
# docs配下のディレクトリ構造作成
mkdir -p docs/development docs/architecture docs/planning docs/security docs/reports

# tools配下のディレクトリ構造作成
mkdir -p tools/analysis tools/data tools/testing
```

#### 1.2 .gitignore 更新

ビルド成果物、一時ファイルの適切な除外設定を追加

### Phase 2: ファイル移動（段階的実行）

#### 2.1 分析・テストスクリプトの移動（High Priority）

```bash
# 分析スクリプト
mv analyze-cuisine-detailed.js tools/analysis/
mv analyze-cuisine.js tools/analysis/
mv analyze-data.js tools/analysis/

# データ調査
mv investigate-sheets.js tools/data/

# テストファイル
mv test-improved-classification.js tools/testing/
mv test-integration.js tools/testing/

# レポートファイル
mv coupling-analysis-report.json docs/reports/
mv dependency-graph.json docs/reports/
```

#### 2.2 ドキュメントファイルの移動（Medium Priority）

```bash
# 開発支援ドキュメント
mv ai-prompts.md docs/development/
mv copilot-instructions.md docs/development/

# アーキテクチャドキュメント
mv ARCHITECTURE_DECISIONS.md docs/architecture/

# 計画ドキュメント
mv DEVELOPMENT_ROADMAP.md docs/planning/
mv PROJECT_STRUCTURE_OPTIMIZATION_ROADMAP.md docs/planning/

# セキュリティドキュメント
mv SECURITY.md docs/security/
```

### Phase 3: 参照更新（重要）

#### 3.1 package.json スクリプト更新

移動したファイルへのパスを更新

#### 3.2 README.md リンク更新

ドキュメントへのリンクパスを更新

#### 3.3 VS Code 設定更新

移動したファイルへの参照を更新

#### 3.4 GitHub Actions 更新

CI/CD パイプラインでの参照パス更新

## 📊 整理による効果

### ✅ **メリット**

1. **可読性向上**

   - ルートディレクトリがスッキリ
   - ファイルの目的が明確化
   - 新規開発者のオンボーディング効率化

2. **保守性向上**

   - 関連ファイルのグループ化
   - 変更影響範囲の明確化
   - ドキュメント管理の効率化

3. **開発効率向上**
   - ファイル検索の高速化
   - IDE のナビゲーション改善
   - ビルド時間の短縮（除外設定最適化）

### ⚠️ **注意点・リスク**

1. **参照エラーのリスク**

   - 移動後のパス更新漏れ
   - import/require 文の修正必要
   - スクリプト・設定ファイルの更新必要

2. **チーム連携への影響**
   - Git 履歴の一時的な複雑化
   - 開発中のブランチでのコンフリクト可能性
   - ドキュメントリンクの一時的な無効化

## 🔄 移行戦略

### 段階的移行アプローチ

#### ステップ 1: 非クリティカルファイルから開始

```text
tools/analysis/ → 分析スクリプト（開発時のみ使用）
docs/reports/   → レポートファイル（参照のみ）
```

#### ステップ 2: 中程度の影響ファイル

```text
tools/testing/  → テストファイル（CI/CD更新必要）
docs/development/ → 開発ドキュメント（README更新必要）
```

#### ステップ 3: 高影響ファイル

```text
docs/architecture/ → アーキテクチャドキュメント（多数リンク）
docs/planning/     → 計画ドキュメント（プロジェクト管理）
```

### 安全な実行手順

1. **事前バックアップ**

   ```bash
   git add . && git commit -m "backup: before root directory reorganization"
   ```

2. **段階的実行**

   - 1 つのディレクトリずつ移動
   - 各段階でテスト実行
   - 問題があれば即座にロールバック

3. **検証ポイント**
   - ビルドが正常に完了するか
   - テストが全て通るか
   - 開発サーバーが起動するか
   - ドキュメントリンクが正常か

## 📝 実行チェックリスト

### Phase 1: 準備

- [ ] ディレクトリ構造作成
- [ ] .gitignore 更新
- [ ] バックアップコミット作成

### Phase 2: ファイル移動

- [ ] 分析スクリプト移動 (`tools/analysis/`)
- [ ] データツール移動 (`tools/data/`)
- [ ] テストファイル移動 (`tools/testing/`)
- [ ] レポート移動 (`docs/reports/`)
- [ ] 開発ドキュメント移動 (`docs/development/`)
- [ ] アーキテクチャドキュメント移動 (`docs/architecture/`)
- [ ] 計画ドキュメント移動 (`docs/planning/`)
- [ ] セキュリティドキュメント移動 (`docs/security/`)

### Phase 3: 参照更新

- [ ] package.json スクリプト更新
- [ ] README.md リンク更新
- [ ] VS Code 設定更新
- [ ] GitHub Actions 更新
- [ ] copilot-instructions.md パス更新
- [ ] ai-prompts.md パス更新

### Phase 4: 検証

- [ ] ビルド正常性確認 (`pnpm build`)
- [ ] テスト実行確認 (`pnpm test`)
- [ ] 開発サーバー確認 (`pnpm dev`)
- [ ] リンク確認（README 等）
- [ ] Git 履歴確認

## 🎯 推奨実行タイミング

### 最適なタイミング

1. **機能開発の区切り**

   - 新機能完了後
   - リリース直後

2. **チーム活動の調整**

   - 並行開発ブランチが少ない時
   - 週末・休暇前

3. **プロジェクトの節目**
   - マイルストーン達成後
   - 大きなリファクタリング前

### 避けるべきタイミング

- 緊急バグ修正中
- 重要なリリース直前
- 複数人が同時並行開発中

---

**作成**: 2025 年 8 月 8 日  
**最終更新**: 2025 年 8 月 8 日  
**実行責任者**: プロジェクトリード  
**レビュー**: チーム全体で事前確認推奨
