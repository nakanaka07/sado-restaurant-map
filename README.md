# 佐渡飲食店マップ

> 🎯 **目的**: 佐渡島の飲食店、駐車場、トイレをインタラクティブマップで簡単発見
> **対象**: 観光客・地元の方・開発者
> **最終更新**: 2025 年 9 月 2 日

🗾 観光客と地元の方のための、モダンな Web マップアプリケーション

[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://nakanaka07.github.io/sado-restaurant-map/)
[![React](https://img.shields.io/badge/React-19.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple)](https://web.dev/progressive-web-apps/)
[![Phase 3](https://img.shields.io/badge/Phase%203-75%25-orange)](./docs/reports/TASK_STATUS_MATRIX.md)
[![Security](https://img.shields.io/badge/Security-Policy-red)](./docs/security/SECURITY.md)

## ✨ 主な機能

🗺️ **インタラクティブマップ** - Google Maps API による高性能地図表示
🍽️ **飲食店情報** - 450+ 店舗の詳細情報とフィルタリング機能
🚗 **駐車場・トイレ** - 130+ 駐車場、95+ トイレの位置情報
📱 **PWA 対応** - オフライン機能とアプリインストール対応
🌐 **レスポンシブ** - スマートフォン・デスクトップ完全対応
♿ **アクセシブル** - WCAG 準拠のユニバーサルデザイン

## 🚀 クイックスタート

### 本番サイト

**[https://nakanaka07.github.io/sado-restaurant-map/](https://nakanaka07.github.io/sado-restaurant-map/)**

### ローカル開発

```bash
# リポジトリクローン
git clone https://github.com/nakanaka07/sado-restaurant-map.git
cd sado-restaurant-map

# 依存関係インストール
pnpm install

# 開発サーバー起動
pnpm dev
```

## 🛠️ 技術スタック

### 🎯 コアテクノロジー

- **フレームワーク**: React 19.0.0
- **言語**: TypeScript 5.7.2
- **ランタイム**: Node.js (Latest LTS)
- **ビルドツール**: Vite 6.0.11

### 🔧 開発ツール

- **テスト**: Vitest 3.2.4, React Testing Library 16.3.0
- **リンティング**: ESLint 9.18.0, TypeScript ESLint 8.20.0
- **品質管理**: Markdownlint 0.42.0

### 🌐 API・データ管理

- **HTTP クライアント**: Axios 1.11.0
- **Maps API**: Google Maps JavaScript API v3, @vis.gl/react-google-maps 1.5.4
- **PWA**: Vite PWA Plugin 0.21.1, Workbox Core 7.3.0

### 🚀 **data-platform** 実装状況（2025年9月10日調査結果）

#### ✅ 高度に完成されたシステム（98%実装済み）

- **ML Engine**: **2,680行実装** _(データ品質分析・異常検知・Scikit-learn統合)_
- **Cache Service**: **869行実装** _(Redis分散キャッシュ・インテリジェントTTL)_
- **Smart Orchestrator**: **完全実装** _(分散制御・自動フェイルオーバー)_
- **分散タスク処理**: **完全実装** _(Celery・非同期バッチ処理)_
- **Clean Architecture**: **19,536行** _(企業レベル本格実装)_

#### **総合実装規模: 19,536行** | **完成度: 98%**

## 📋 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# プロダクションビルド
pnpm build

# テスト実行
pnpm test

# リンティング・型チェック
pnpm lint

# 品質チェック（包括的）
pnpm run quality:check

# 自動化システム実行
pnpm run automation:integrated

# 統合テスト実行
pnpm run integration:full

# データ更新（要環境設定）
pnpm run data:update
```

## 📁 プロジェクト構造

```text
src/               # フロントエンドソースコード
├── components/    # React UIコンポーネント
├── hooks/         # カスタムReactフック
├── services/      # API統合サービス
├── types/         # TypeScript型定義
└── utils/         # ユーティリティ関数

tools/             # 開発・運用ツール
├── scraper/       # データ収集システム (Python)
│   └── shared/    # Phase 3分散処理コンポーネント
├── automation/    # 自動化・品質管理システム
├── analysis/      # コード品質分析
└── testing/       # テスト・診断

data-platform/     # データ収集・管理システム (19,536行)
├── shared/        # Phase 3分散処理コンポーネント (ML Engine, Cache等)
├── core/          # Clean Architecture ドメイン層
├── application/   # アプリケーション層・ワークフロー
├── infrastructure/ # 外部API・ストレージ統合
├── interface/     # CLI・ユーザーインターフェース
├── tests/         # 包括的テストスイート
└── config/        # 設定・環境管理

docs/              # プロジェクトドキュメント
├── development/   # 開発ガイド・技術調査
├── architecture/  # 設計書・ADR
├── planning/      # ロードマップ・実装計画
├── reports/       # 実績レポート・進捗管理
└── security/      # セキュリティポリシー

config/            # 設定ファイル
├── eslint.config.js      # ESLint設定
├── vitest.config.ts      # テスト設定
└── pwa-assets.config.ts  # PWA設定
```

## 🔧 環境設定

詳細な環境設定については、[環境設定ガイド](docs/development/environment-setup-guide.md)をご覧ください。

### クイック設定

```bash
# 1. 環境変数ファイル作成
cp .env.local.example .env.local

# 2. 必要なAPIキーを設定
# - VITE_GOOGLE_MAPS_API_KEY (必須)
# - VITE_GOOGLE_SHEETS_ID (必須)
# 詳細: docs/development/environment-setup-guide.md

# 3. 設定確認
pnpm run env:check
```

## 📄 ライセンス・サポート

- **ライセンス**: MIT License
- **セキュリティ**: [セキュリティポリシー](docs/security/SECURITY.md)
- **バグ報告**: [GitHub Issues](https://github.com/nakanaka07/sado-restaurant-map/issues)
- **開発ドキュメント**: [docs/](docs/README.md)
- **開発者**: [@nakanaka07](https://github.com/nakanaka07)

---

**🗾 佐渡島の魅力を地図で発見しよう！**
