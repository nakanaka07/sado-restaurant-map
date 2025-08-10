# 佐渡飲食店マップ | Sado Restaurant Map

佐渡島の飲食店、駐車場、トイレを地図から簡単に見つけられるインタラクティブなウェブアプリケーション。Google Places APIとGoogle Sheets APIを活用した、観光客と地元の方のためのマップサービスです。

## 🌟 主な機能

- **インタラクティブマップ**: Google Maps APIを使用した高性能な地図表示
- **多様な施設検索**: 飲食店（450+）、駐車場（130+）、トイレ（95+）の情報を提供
- **地区別フィルタリング**: 佐渡島の11地区による詳細な地域検索
- **リアルタイムデータ**: Google Places APIからの最新情報を自動取得
- **PWA対応**: オフライン機能とアプリライクな体験
- **レスポンシブデザイン**: モバイル・デスクトップ両対応
- **アクセシビリティ**: WCAG準拠のユーザビリティ設計

## 🚀 デモ・本番環境

- **本番サイト**: [https://nakanaka07.github.io/sado-restaurant-map/](https://nakanaka07.github.io/sado-restaurant-map/)
- **開発環境**: `pnpm dev` でローカル起動

## 🏗️ アーキテクチャ概要

### フロントエンド (React + TypeScript)

```
src/
├── app/           # アプリケーション層・エントリーポイント
├── components/    # UIコンポーネント層
├── hooks/         # カスタムReactフック
├── services/      # 外部API統合サービス層
├── types/         # TypeScript型定義システム
├── utils/         # ユーティリティ関数層
├── styles/        # CSSスタイル管理
└── test/          # テストインフラストラクチャ
```

### バックエンド・データ処理 (Python)

```
tools/scraper/
├── config/        # 設定管理（環境変数、認証）
├── data/          # データソース（URL、検索クエリ）
├── processors/    # Google Places API処理パイプライン
├── src/           # メイン実行スクリプト
├── utils/         # 共有ユーティリティライブラリ
├── debug/         # デバッグ・診断ツール
├── maintenance/   # データメンテナンス・品質管理
└── tools/         # 専用ユーティリティツール
```

### 開発・運用ツール

```
tools/
├── analysis/      # コード品質分析（結合度、循環依存）
├── data/          # データベース操作（PowerShell）
├── testing/       # テスト・診断インフラ
└── scraper/       # Google Places APIデータ収集システム
```

## 🛠️ 技術スタック

### フロントエンド

- **React 19** - UIフレームワーク
- **TypeScript** - 型安全性
- **Vite** - ビルドツール・開発サーバー
- **Google Maps API** - 地図表示
- **PWA** - プログレッシブウェブアプリ
- **Vitest** - テストフレームワーク

### バックエンド・データ処理

- **Python 3.x** - データ処理・API統合
- **Google Places API** - 施設情報取得
- **Google Sheets API** - データストレージ
- **PowerShell** - 運用スクリプト

### 開発・CI/CD

- **GitHub Actions** - 自動デプロイメント
- **ESLint + TypeScript ESLint** - コード品質
- **pnpm** - パッケージ管理
- **GitHub Pages** - ホスティング

## 📦 セットアップ・インストール

### 前提条件

- Node.js 18+
- pnpm
- Python 3.8+
- PowerShell（Windows環境）

### 1. リポジトリクローン

```bash
git clone https://github.com/nakanaka07/sado-restaurant-map.git
cd sado-restaurant-map
```

### 2. 依存関係インストール

```bash
# フロントエンド依存関係
pnpm install

# Python依存関係（データ処理用）
pip install -r tools/scraper/config/requirements.txt
```

### 3. 環境変数設定

```bash
# .env.localファイルを作成
cp .env.local.example .env.local

# 必要なAPIキーを設定
# - VITE_GOOGLE_MAPS_API_KEY
# - VITE_GOOGLE_SHEETS_ID
# - PLACES_API_KEY（データ更新用）
```

### 4. 開発サーバー起動

```bash
pnpm dev
```

## 🎯 使用方法

### 基本操作

1. **地図表示**: ブラウザで地図が自動表示
2. **施設検索**: サイドバーから施設タイプを選択
3. **地区フィルタ**: 佐渡島の11地区で絞り込み
4. **詳細表示**: マーカークリックで施設詳細を確認

### 開発者向けコマンド

```bash
# 開発サーバー起動
pnpm dev

# プロダクションビルド
pnpm build

# テスト実行
pnpm test

# リンティング
pnpm lint

# データ更新（要認証設定）
pnpm run data:update

# 統合テスト
pnpm run test:integration
```

## 📊 データ管理システム

### データ収集・更新

- **自動データ収集**: Google Places APIから最新情報を取得
- **品質管理**: データ検証・重複排除・地区分類の自動化
- **コスト管理**: API使用量の監視・制御機能

### データ統計（2024年現在）

- **飲食店**: 450+ 件（98% CID変換済み）
- **駐車場**: 130+ 件（95% CID変換済み）
- **トイレ**: 95+ 件（90% CID変換済み）
- **カバレッジ**: 佐渡島全域

## 🧪 テスト・品質管理

### テスト戦略

- **単体テスト**: Vitest + React Testing Library
- **統合テスト**: Google Sheets API連携テスト
- **E2Eテスト**: ブラウザ自動化テスト
- **型チェック**: TypeScript厳密モード

### コード品質

- **Clean Architecture**: 依存性逆転原則の適用
- **結合度分析**: 自動化された結合度測定
- **循環依存検出**: 依存関係の健全性チェック
- **セキュリティ**: XSS保護・入力サニタイゼーション

## 🚀 デプロイメント

### 自動デプロイ

```bash
# GitHub Pagesへの自動デプロイ
pnpm run deploy
```

### CI/CD パイプライン

- **GitHub Actions**: 自動ビルド・テスト・デプロイ
- **品質ゲート**: テスト通過・リンティング成功が必須
- **環境分離**: 開発・ステージング・本番環境

## 📁 プロジェクト構造詳細

### 主要ディレクトリ

- **`src/`** - [フロントエンドソースコード](src/README.md)
- **`tools/scraper/`** - [データ収集・処理システム](tools/scraper/README.md)
- **`tools/analysis/`** - [コード品質分析ツール](tools/analysis/README.md)
- **`tools/data/`** - [データベース操作ツール](tools/data/README.md)
- **`tools/testing/`** - [テスト・診断ツール](tools/testing/README.md)
- **`config/`** - 設定ファイル（ESLint、Vitest、PWA）
- **`docs/`** - プロジェクトドキュメント

### 設定ファイル

- **`package.json`** - NPMパッケージ・スクリプト定義
- **`vite.config.ts`** - Viteビルド設定・PWA設定
- **`tsconfig.json`** - TypeScript設定
- **`.env.local.example`** - 環境変数テンプレート

## 🤝 コントリビューション

### 開発フロー

1. **Issue作成**: 機能要求・バグ報告
2. **ブランチ作成**: `feature/` または `bugfix/` プレフィックス
3. **開発・テスト**: ローカル環境での開発・テスト実行
4. **プルリクエスト**: コードレビュー・CI通過後マージ

### コーディング規約

- **TypeScript**: 厳密な型チェック必須
- **ESLint**: 設定済みルールの遵守
- **Clean Architecture**: レイヤー分離の維持
- **テストカバレッジ**: 新機能には適切なテスト追加

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙋‍♂️ サポート・お問い合わせ

- **GitHub Issues**: [バグ報告・機能要求](https://github.com/nakanaka07/sado-restaurant-map/issues)
- **プロジェクト管理者**: [@nakanaka07](https://github.com/nakanaka07)

## 🔄 更新履歴

### 最新の主要更新

- **データ処理システム**: Google Places API New v1対応
- **PWA機能**: オフライン対応・アプリインストール
- **パフォーマンス最適化**: 遅延読み込み・コード分割
- **アクセシビリティ**: WCAG準拠の改善
- **セキュリティ強化**: XSS保護・入力検証

---

**佐渡島の魅力を地図で発見しよう！** 🗾✨
