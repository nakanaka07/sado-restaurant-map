# 🛠️ Tools - 開発・運用支援ツール

> **目的**: 佐渡飲食店マップアプリケーションの開発効率化・品質保証・データ管理
> **最終更新**: 2025 年 8 月 28 日

## 📁 ディレクトリ構成

```text
tools/
├── scraper/              # データ収集システム（Clean Architecture）
│   ├── README.md         # 詳細なセットアップ・使用方法
│   ├── application/      # アプリケーション層
│   ├── core/            # ドメイン・ビジネスロジック層
│   ├── infrastructure/  # インフラストラクチャ層
│   ├── interface/       # インターフェース層
│   ├── config/          # 設定ファイル
│   ├── data/           # データファイル
│   └── tests/          # テストスイート
├── analysis/            # コード品質分析ツール
│   ├── README.md        # 分析ツールの使用方法
│   ├── check-circular-deps.cjs  # 循環依存検出
│   └── analyze-coupling.cjs     # 結合度分析
├── testing/             # 環境診断・統合テストツール
│   ├── README.md        # テストツールの使用方法
│   ├── check-environment.ps1   # 環境変数チェック
│   └── test-integration.ps1    # 統合テスト実行
└── README.md           # このファイル
```

## 🎯 各ツールの用途

### 1. Scraper - データ収集システム

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

### 2. Analysis - コード品質分析

**用途**: TypeScript/TSX コードの品質分析・依存関係チェック

**主要機能**:

- 🔄 循環依存の検出・可視化
- 📈 モジュール結合度の測定
- 🏗️ Clean Architecture レイヤー違反検出

**使用場面**:

- コードレビュー前の品質チェック
- リファクタリング計画の策定
- 技術的負債の定量評価

### 3. Testing - 環境診断・統合テスト

**用途**: 開発環境の設定確認・エンドツーエンドテスト

**主要機能**:

- 🔧 環境変数設定の検証
- 🔗 Google APIs 接続テスト
- 📊 データフロー統合テスト

**使用場面**:

- 新規開発者のオンボーディング
- 本番デプロイ前の環境確認
- CI/CD パイプラインでの自動チェック

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

| ツール       | 使用頻度 | 優先度    | 説明                                   |
| ------------ | -------- | --------- | -------------------------------------- |
| **Scraper**  | 週次     | 🔥 **高** | データベース更新・新規データ収集に必須 |
| **Testing**  | 日次     | 🔥 **高** | 開発環境の安定性確保に重要             |
| **Analysis** | 月次     | ⚡ 中     | コード品質保証・技術的負債管理         |

## 🔧 メンテナンス・アップデート

### 定期メンテナンス

- **Scraper**: Google APIs の変更対応、データスキーマ更新
- **Analysis**: TypeScript バージョンアップ対応、ルール調整
- **Testing**: 新しい環境変数・API の追加対応

### アップデート手順

1. **依存関係更新**: 各ディレクトリの requirements.txt / package.json 更新
2. **テスト実行**: 変更後の動作確認・回帰テスト
3. **ドキュメント更新**: README.md の情報同期

## 📚 詳細ドキュメント

各ツールの詳細な使用方法・設定については、それぞれのディレクトリ内の README.md を参照してください：

- [Scraper 詳細ガイド](./scraper/README.md)
- [Analysis ツール詳細](./analysis/README.md)
- [Testing ツール詳細](./testing/README.md)

## 🔗 関連リソース

### プロジェクト全体

- [開発環境セットアップガイド](../docs/development/environment-setup-guide.md)
- [Copilot 開発指示書](../docs/development/copilot-instructions.md)

### アーキテクチャ

- [ADR-003: Scraper Architecture Redesign](../docs/architecture/ADR-003-scraper-architecture-redesign.md)
- [Clean Architecture Migration Plan](../docs/planning/SCRAPER_CLEAN_ARCHITECTURE_MIGRATION_PLAN.md)

---

**🎯 このツール群により、佐渡飲食店マップアプリケーションの高品質な開発・運用を支援します。**
