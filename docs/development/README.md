# 🛠️ Development Documentation

> **プロジェクト**: 佐渡飲食店マップ - 開発ガイド
> **最終更新**: 2025年9月14日
> **管理者**: [@nakanaka07](https://github.com/nakanaka07)

## 📖 概要

このディレクトリには、佐渡飲食店マップの開発に関する重要な情報が格納されています。環境構築から実装・テスト・デプロイまで、開発者が効率的に作業するための包括的なガイドを提供します。

### 🔗 **関連ドキュメント**

- **[📚 ドキュメントハブ](../README.md)** - 全体ナビゲーション
- **[🤖 AI開発支援](../ai-assistant/ai-prompts.md)** - プロンプト集・効率化
- **[🏗️ システム設計](../architecture/README.md)** - ADR・技術選定
- **[📋 プロジェクト計画](../planning/README.md)** - 計画・管理

## 🚀 クイックスタート

### 📋 **必要な環境**

- **Node.js**: 20.19+ (ESM-only対応)
- **pnpm**: 9.0+ (パッケージマネージャー)
- **Git**: 2.40+ (バージョン管理)
- **VS Code**: 最新版 (推奨エディタ)

### ⚡ **環境構築**

```bash
# リポジトリのクローン
git clone https://github.com/nakanaka07/sado-restaurant-map.git
cd sado-restaurant-map

# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# ブラウザで確認
# http://localhost:5173
```

### 🔧 **開発用スクリプト**

```bash
# 開発
pnpm dev              # 開発サーバー起動
pnpm dev:host         # 外部アクセス可能で起動

# ビルド・テスト
pnpm build            # プロダクションビルド
pnpm preview          # ビルド結果プレビュー
pnpm test             # ユニットテスト実行
pnpm test:e2e         # E2Eテスト実行

# 品質保証
pnpm lint             # ESLintチェック
pnpm lint:fix         # ESLint自動修正
pnpm format           # Prettier実行
pnpm typecheck        # TypeScript型チェック

# 分析・最適化
pnpm analyze          # バンドル分析
pnpm lighthouse       # パフォーマンス測定
```

## 🏗️ プロジェクト構造

### 📁 **ディレクトリ構成**

```text
sado-restaurant-map/
├── 📄 設定ファイル
│   ├── package.json              # プロジェクト設定
│   ├── tsconfig.json             # TypeScript設定
│   ├── vite.config.ts            # Vite設定
│   └── eslint.config.js          # ESLint設定
├── 🎨 フロントエンド
│   ├── src/                      # ソースコード
│   ├── public/                   # 静的ファイル
│   └── index.html               # エントリポイント
├── 🤖 データプラットフォーム
│   └── data-platform/           # Python データ処理
├── 📚 ドキュメント
│   └── docs/                    # プロジェクト文書
└── 🛠️ ツール・スクリプト
    ├── scripts/                 # 自動化スクリプト
    └── config/                  # 設定ファイル
```

### 🎨 **src/ ディレクトリ詳細**

```text
src/
├── app/              # アプリケーション層
│   ├── App.tsx       # ルートコンポーネント
│   ├── router.tsx    # ルーティング設定
│   └── store/        # グローバル状態管理
├── components/       # プレゼンテーション層
│   ├── ui/           # 基本UIコンポーネント
│   ├── features/     # 機能別コンポーネント
│   └── layout/       # レイアウトコンポーネント
├── hooks/            # ビジネスロジック層
│   ├── useRestaurants.ts    # 飲食店データ管理
│   ├── useGeolocation.ts    # 位置情報取得
│   └── useFilters.ts        # フィルタリング機能
├── services/         # データアクセス層
│   ├── api/          # API呼び出し
│   ├── maps/         # Google Maps連携
│   └── storage/      # ローカルストレージ
├── types/            # 型定義
│   ├── restaurant.ts # 飲食店データ型
│   ├── map.ts        # 地図関連型
│   └── api.ts        # API応答型
├── utils/            # 共通ユーティリティ
│   ├── constants.ts  # 定数定義
│   ├── helpers.ts    # ヘルパー関数
│   └── validation.ts # バリデーション
├── assets/           # アセット
│   ├── images/       # 画像ファイル
│   ├── icons/        # アイコンファイル
│   └── fonts/        # フォントファイル
└── styles/           # スタイル
    ├── globals.css   # グローバルCSS
    ├── variables.css # CSS変数
    └── components/   # コンポーネント別CSS
```

## 🎯 開発ワークフロー

### 🔄 **開発フロー**

1. **🌟 機能開発**

   ```bash
   # フィーチャーブランチ作成
   git checkout -b feature/new-feature

   # 開発・テスト
   pnpm dev
   pnpm test

   # 品質チェック
   pnpm lint
   pnpm typecheck
   ```

2. **🧪 品質保証**

   ```bash
   # 包括的テスト実行
   pnpm test:all
   pnpm test:e2e

   # パフォーマンス測定
   pnpm lighthouse

   # セキュリティ監査
   pnpm audit
   ```

3. **📝 コミット・PR**

   ```bash
   # Conventional Commits準拠
   git commit -m "feat: add restaurant filtering feature"

   # プッシュ・PR作成
   git push origin feature/new-feature
   ```

### 📊 **品質基準**

| 項目                 | 基準値      | 測定ツール        |
| -------------------- | ----------- | ----------------- |
| **型安全性**         | 100%        | TypeScript strict |
| **テストカバレッジ** | 90%以上     | Vitest coverage   |
| **ESLintエラー**     | 0件         | ESLint            |
| **Core Web Vitals**  | 良好        | Lighthouse        |
| **アクセシビリティ** | WCAG 2.2 AA | axe-core          |
| **セキュリティ**     | 脆弱性0件   | npm audit         |

## 🔧 技術スタック

### 🎨 **フロントエンド**

| 技術                          | バージョン | 役割               | 設定ファイル          |
| ----------------------------- | ---------- | ------------------ | --------------------- |
| **React**                     | 19.1.1     | UIライブラリ       | `src/app/`            |
| **TypeScript**                | 5.7.3      | 型システム         | `tsconfig.json`       |
| **Vite**                      | 7.1.4      | ビルドツール       | `vite.config.ts`      |
| **@vis.gl/react-google-maps** | 1.5.5      | 地図コンポーネント | `src/components/Map/` |

### 🧪 **テスト・品質**

| ツール              | バージョン | 役割           | 設定ファイル       |
| ------------------- | ---------- | -------------- | ------------------ |
| **Vitest**          | 3.2        | テストランナー | `vitest.config.ts` |
| **Testing Library** | 16.x       | Reactテスト    | `src/test/`        |
| **ESLint**          | 9.x        | 静的解析       | `eslint.config.js` |
| **Prettier**        | 3.x        | フォーマッタ   | `.prettierrc`      |

### 🏗️ **開発・デプロイ**

| ツール             | 役割           | 設定                 |
| ------------------ | -------------- | -------------------- |
| **GitHub Actions** | CI/CD          | `.github/workflows/` |
| **GitHub Pages**   | ホスティング   | `gh-pages`           |
| **PWA Workbox**    | Service Worker | `vite-plugin-pwa`    |

## 🚀 デプロイメント

### 📦 **ビルド・デプロイ**

```bash
# プロダクションビルド
pnpm build

# デプロイプレビュー
pnpm preview

# GitHub Pagesデプロイ（自動）
git push origin main  # CI/CDが自動実行
```

### 🌐 **環境**

| 環境           | URL                                                 | 用途               |
| -------------- | --------------------------------------------------- | ------------------ |
| **本番**       | <https://nakanaka07.github.io/sado-restaurant-map/> | エンドユーザー向け |
| **プレビュー** | GitHub Actions PR Preview                           | 機能確認・レビュー |
| **ローカル**   | <http://localhost:5173>                             | 開発・デバッグ     |

## 🔍 トラブルシューティング

### ⚠️ **よくある問題**

#### **Google Maps API エラー**

```bash
# API キー確認
echo $VITE_GOOGLE_MAPS_API_KEY

# 環境変数設定
cp .env.example .env.local
# VITE_GOOGLE_MAPS_API_KEY=your-api-key を設定
```

#### **ビルドエラー**

```bash
# 依存関係リセット
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 型チェック
pnpm typecheck
```

#### **テスト失敗**

```bash
# テストファイル更新
pnpm test --run --reporter=verbose

# カバレッジ詳細確認
pnpm test:coverage
```

### 🐛 **デバッグ**

```bash
# デバッグモード起動
pnpm dev --debug

# ソースマップ確認
pnpm build --sourcemap

# バンドル分析
pnpm analyze
```

## 📚 参考リソース

### 🔗 **公式ドキュメント**

- **[React 19](https://react.dev/)** - 最新機能・ベストプラクティス
- **[TypeScript 5.7](https://www.typescriptlang.org/docs/)** - 型システム・高度な機能
- **[Vite 7](https://vitejs.dev/)** - ビルドツール・設定
- **[Google Maps Platform](https://developers.google.com/maps)** - API仕様・ガイドライン

### 🛠️ **開発ツール**

- **[VS Code Extensions](https://code.visualstudio.com/docs/editor/extension-marketplace)** - 推奨拡張機能
- **[Chrome DevTools](https://developer.chrome.com/docs/devtools/)** - デバッグ・パフォーマンス
- **[React Developer Tools](https://react.dev/learn/react-developer-tools)** - React専用デバッグ

### 📖 **学習リソース**

- **[React 19 Migration Guide](https://react.dev/blog)** - アップデート情報
- **[TypeScript Best Practices](https://typescript-eslint.io/docs/)** - 型安全性向上
- **[Web Vitals Guide](https://web.dev/vitals/)** - パフォーマンス最適化

---

## 📞 サポート・連絡先

### 👨‍💻 **開発サポート**

**テックリード**: [@nakanaka07](https://github.com/nakanaka07)

### 🐛 **バグ報告・機能要望**

- **バグ報告**: [Bug Report Issue](https://github.com/nakanaka07/sado-restaurant-map/issues/new?template=bug_report.md)
- **機能要望**: [Feature Request Issue](https://github.com/nakanaka07/sado-restaurant-map/issues/new?template=feature_request.md)
- **開発議論**: [GitHub Discussions](https://github.com/nakanaka07/sado-restaurant-map/discussions)

---

**🛠️ 効率的な開発環境で、品質の高いコードを書こう！**
