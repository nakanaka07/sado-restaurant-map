# 佐渡飲食店マップ

> 🗾 佐渡島の飲食店、駐車場、トイレをインタラクティブマップで簡単発見
> 観光客と地元の方のための、モダンな Web マップアプリケーション

[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://nakanaka07.github.io/sado-restaurant-map/)
[![React](https://img.shields.io/badge/React-19.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple)](https://web.dev/progressive-web-apps/)

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

### フロントエンド

- React 19.0 + TypeScript 5.7
- Vite 6.0 (ビルドツール)
- Google Maps JavaScript API + @vis.gl/react-google-maps v1.5
- PWA (vite-plugin-pwa)

### データ処理

- Python 3.x + Google Places API
- Google Sheets API (データストレージ)
- GitHub Actions (自動データ更新)

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
├── analysis/      # コード品質分析
└── testing/       # テスト・診断

docs/              # プロジェクトドキュメント
├── development/   # 開発ガイド
├── architecture/  # 設計書・ADR
└── planning/      # ロードマップ
```

## 🔧 環境設定

### 必要な環境変数

```bash
# .env.local ファイルを作成
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_GOOGLE_SHEETS_ID=your_sheets_id
```

### 前提条件

- Node.js 18+
- pnpm
- Google Maps API キー
- Google Sheets API アクセス

## 📄 ライセンス・サポート

- **ライセンス**: MIT License
- **バグ報告**: [GitHub Issues](https://github.com/nakanaka07/sado-restaurant-map/issues)
- **開発者**: [@nakanaka07](https://github.com/nakanaka07)

---

**🗾 佐渡島の魅力を地図で発見しよう！**
