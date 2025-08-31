# 🛠️ Tools - 開発・運用支援ツール

> 🎯 **目的**: 佐渡飲食店マップアプリケーションの開発効率化・品質保証・データ管理
> **対象**: 開発チーム・データ管理者・システム運用者
> **最終更新**: 2025 年 8 月 31 日

## 📁 ディレクトリ構成

```text
tools/
├── automation/          # 自動化システム統合
│   ├── readme/         # README品質管理・自動化
│   │   ├── automation-system.ts    # 統合自動化システム
│   │   ├── tech-stack-sync.ts      # 技術スタック同期
│   │   ├── link-validator.ts       # リンク検証
│   │   └── quality-checker.ts      # 品質評価
│   └── reports/        # 自動化レポート・週次処理
│       └── weekly-quality-report.ps1  # 週次品質レポート
├── scraper/             # データ収集システム（Clean Architecture）
│   ├── README.md        # 詳細なセットアップ・使用方法
│   ├── application/     # アプリケーション層
│   ├── core/           # ドメイン・ビジネスロジック層
│   ├── infrastructure/ # インフラストラクチャ層
│   ├── interface/      # インターフェース層
│   ├── config/         # 設定ファイル
│   ├── data/          # データファイル
│   └── tests/         # テストスイート
├── analysis/           # コード品質分析ツール
│   ├── check-circular-deps.cjs  # 循環依存検出
│   └── analyze-coupling.cjs     # 結合度分析
├── markdown/           # Markdownファイル品質管理ツール
│   ├── README.md       # Markdown linting ツールの使用方法
│   ├── index.js        # メインスクリプト
│   ├── rules/          # カスタムルール定義
│   └── utils/          # ユーティリティ関数
├── testing/            # 環境診断・統合テストツール
│   ├── README.md       # テストツールの使用方法
│   ├── check-environment.ps1   # 環境変数チェック
│   └── test-integration.ps1    # 統合テスト実行
├── reports/            # 自動生成レポート・ログ
│   ├── README.md       # レポート管理ガイド
│   ├── automation-result.json  # 自動化実行結果
│   ├── link-validation-report.md  # リンク検証レポート
│   ├── readme-quality-report.md   # README品質レポート
│   └── weekly/         # 週次品質レポート
└── README.md          # このファイル
```

## 🎯 各ツールの用途

### 1. Automation - 自動化システム統合

**用途**: プロジェクト品質管理・ドキュメント自動化の統合システム

**主要機能**:

- 📝 README 品質管理・技術スタック同期
- 🔗 リンク検証・自動修正
- 📊 品質評価・レポート生成
- ⏰ 週次品質監視・アラート

**使用場面**:

- 日次の品質チェック
- ドキュメント自動更新
- 週次品質レビュー

### 2. Scraper - データ収集システム

**用途**: Google Places API から飲食店データを収集して Google Sheets に保存

**主要機能**:

- 🍽️ 飲食店・駐車場・トイレ施設の自動データ収集
- 🏗️ Clean Architecture による高い保守性
- 📊 Google Sheets との自動連携
- ⚡ 高性能な並列処理・エラーハンドリング

**使用場面**:

- データベースの初期構築
- 定期的な店舗情報更新
- 新規エリアのデータ追加

### 3. Analysis - コード品質分析

**用途**: TypeScript/TSX コードの品質分析・依存関係チェック

**主要機能**:

- 🔄 循環依存の検出・可視化
- 📈 モジュール結合度の測定
- 🏗️ Clean Architecture レイヤー違反検出

**使用場面**:

- コードレビュー前の品質チェック
- リファクタリング計画の策定
- 技術的負債の定量評価

### 3. Markdown - ドキュメント品質管理

**用途**: プロジェクト内 Markdown ファイルの品質向上・統一

**主要機能**:

- 📝 Markdown lint ルールの自動適用
- 🔧 コードブロック言語指定の自動修正
- 📋 順序付きリスト番号の統一
- 🎯 見出し構造の最適化

**使用場面**:

- ドキュメント品質チェック
- README.md の自動整形
- プロジェクト全体の文書統一

### 4. Testing - 環境診断・統合テスト

**用途**: 開発環境の設定確認・エンドツーエンドテスト

**主要機能**:

- 🔧 環境変数設定の検証
- 🔗 Google APIs 接続テスト
- 📊 データフロー統合テスト

**使用場面**:

- 新規開発者のオンボーディング
- 本番デプロイ前の環境確認
- CI/CD パイプラインでの自動チェック

### 5. Reports - レポート管理・自動化ログ

**用途**: 自動化処理の結果管理・品質監視

**主要機能**:

- 📊 自動化実行結果の記録
- 🔗 リンク検証レポートの生成
- 📋 README 品質スコアの追跡
- 📈 週次品質トレンドの可視化

**使用場面**:

- 品質改善の進捗追跡
- 自動化処理の監視
- 定期的な品質レビュー

## 🚀 クイックスタート

### データ収集（Scraper）

```bash
# 環境設定・依存関係インストール
cd tools/scraper
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r config/requirements.txt

# 基本実行
python interface/cli/main.py --target restaurants --mode standard
```

### コード品質分析（Analysis）

```bash
# 循環依存チェック
pnpm run analyze:deps

# 結合度分析
pnpm run analyze:coupling

# 一括分析
pnpm run analyze:all
```

### 環境診断（Testing）

```powershell
# 環境変数チェック
.\tools\testing\check-environment.ps1

# 統合テスト実行
.\tools\testing\test-integration.ps1

# または package.json scripts 経由
pnpm run data:update
pnpm run test:integration
```

## 📋 使用頻度・優先度

| ツール         | 使用頻度 | 優先度    | 説明                                   |
| -------------- | -------- | --------- | -------------------------------------- |
| **Automation** | 日次     | 🔥 **高** | ドキュメント品質・自動化の中核システム |
| **Scraper**    | 週次     | 🔥 **高** | データベース更新・新規データ収集に必須 |
| **Testing**    | 日次     | 🔥 **高** | 開発環境の安定性確保に重要             |
| **Analysis**   | 月次     | ⚡ 中     | コード品質保証・技術的負債管理         |
| **Markdown**   | 日次     | ⚡ **中** | ドキュメント品質保証・統一性確保       |
| **Reports**    | 週次     | 📊 低     | 品質監視・進捗追跡（自動生成）         |

## 🔧 メンテナンス・アップデート

### 定期メンテナンス

- **Scraper**: Google APIs の変更対応、データスキーマ更新
- **Analysis**: TypeScript バージョンアップ対応、ルール調整
- **Markdown**: Markdownlint ルール更新、新規ルール追加
- **Testing**: 新しい環境変数・API の追加対応
- **Reports**: レポート形式の改善、新規指標の追加

### アップデート手順

1. **依存関係更新**: 各ディレクトリの requirements.txt / package.json 更新
2. **テスト実行**: 変更後の動作確認・回帰テスト
3. **ドキュメント更新**: README.md の情報同期

## 📚 詳細ドキュメント

各ツールの詳細な使用方法・設定については、それぞれのディレクトリ内の README.md を参照してください：

- [Scraper 詳細ガイド](./scraper/README.md)
- [Analysis ツール詳細](./analysis/README.md)
- [Markdown ツール詳細](./markdown/README.md)
- [Testing ツール詳細](./testing/README.md)
- [Reports 管理ガイド](./reports/README.md)

## 🔗 関連リソース

### プロジェクト全体

- [開発環境セットアップガイド](../docs/development/environment-setup-guide.md)
- [Copilot 開発指示書](../docs/development/copilot-instructions.md)

### アーキテクチャ

- [ADR-003: Scraper Architecture Redesign](../docs/architecture/ADR-003-scraper-architecture-redesign.md)
- [Clean Architecture Migration Plan](scraper)

---

**🎯 このツール群により、佐渡飲食店マップアプリケーションの高品質な開発・運用を支援します。**
