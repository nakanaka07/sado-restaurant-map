# 佐渡飲食店マップ

> 🍽️ **佐渡島の美味しい飲食店を発見できるインタラクティブマップアプリケーション**  
> **本番環境URL**: [https://nakanaka07.github.io/sado-restaurant-map/](https://nakanaka07.github.io/sado-restaurant-map/)

React 19, TypeScript, Google Maps API を活用した、モダンで高機能なWebアプリケーションです。

## ✨ 主な機能

- **🗺️ インタラクティブマップ**: Google Mapsと連携し、佐渡島の飲食店を地図上に表示します。
- **🔍 高機能検索**: 店名、料理ジャンル、価格帯、こだわり条件（駐車場など）で絞り込めます。
- **📱 レスポンシブデザイン**: PC、タブレット、スマートフォンに最適化されています。
- **⚡ 高速パフォーマンス**: ViteとReact 19の最新機能により、快適な操作性を実現しています。
- **🏃 PWA対応**: アプリのようにホーム画面にインストールして利用できます。

## 🚀 クイックスタート

### 🖼️ スクリーンショット
<!-- ここにアプリケーションのスクリーンショット画像を挿入 -->

### 📋 必要な環境

- Node.js 18.0以上
- pnpm (推奨) または npm

### ⚙️ 環境設定

#### 手順1: 環境変数ファイルの設定

```bash
# .env.local.example を .env.local にコピー
cp .env.local.example .env.local
```

#### 手順2: APIキーの設定

`.env.local` ファイルを開いて、以下の値を実際のAPIキーに置き換えてください：

```bash
# Google Maps API キー（必須）
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Google Sheets API キー（佐渡飲食店データ用）
VITE_GOOGLE_SHEETS_API_KEY=your_sheets_api_key_here
VITE_SPREADSHEET_ID=your_spreadsheet_id_here
```

#### 手順3: 依存関係のインストール

```bash
pnpm install
```

#### 手順4: 開発サーバーの起動

```bash
pnpm dev
```

## 🛠️ 技術スタック

- **フロントエンド**: React 19 + TypeScript 5.8
- **ビルドツール**: Vite 7.0
- **地図機能**: Google Maps JavaScript API + Advanced Markers
- **スタイリング**: CSS Modules + CSS Variables
- **PWA**: Service Worker + Manifest v3
- **テスト**: Vitest 3.2 + Testing Library

## 📁 プロジェクト構造

```text
src/
├── components/        # Reactコンポーネント
├── hooks/            # カスタムHooks
├── data/             # 静的データ・定数
├── types/            # TypeScript型定義
├── utils/            # ユーティリティ関数
├── styles/           # スタイル定義
└── assets/           # 画像・アイコン等
```

## 🔧 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# 本番ビルド
pnpm build

# プレビュー
pnpm preview

# テスト実行
pnpm test

# 型チェック
pnpm type-check
```

## 📖 詳細ドキュメント

- [開発ガイドライン](./copilot-instructions.md)
- [AIプロンプト集](./ai-prompts.md)

---

**技術サポート**: React 19 + TypeScript + Google Maps API
