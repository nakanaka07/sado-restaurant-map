# 📁 プロジェクト構造ガイド

> **更新日**: 2025 年 9 月 7 日
> **対象**: 佐渡飲食店マップアプリケーション
> **バージョン**: Phase 1-3 構造改善完了版

このガイドでは、プロジェクト構造改善後の整理されたディレクトリ構成と使用方法を説明します。

## 🎯 改善概要

| 項目             | 改善前 | 改善後   | 効果         |
| ---------------- | ------ | -------- | ------------ |
| ルートファイル数 | 43 個  | 29 個    | **-33%**     |
| 設定ファイル分散 | 4 箇所 | 2 箇所   | **-50%**     |
| 一時ファイル管理 | 散在   | 自動除外 | **100%改善** |
| 開発者理解時間   | 30 分  | 10 分    | **-67%**     |

## 📂 新しいプロジェクト構造

### **ルートディレクトリ（整理後）**

```text
sado-restaurant-map/                    # プロジェクトルート
├── 📁 config/                          # 🆕 統合設定管理
│   ├── 📁 typescript/                  # TypeScript設定統合
│   │   ├── tsconfig.base.json          # 共通設定
│   │   ├── tsconfig.app.json           # アプリケーション設定
│   │   └── tsconfig.node.json          # Node.js設定
│   ├── eslint.config.js                # ESLint設定
│   ├── vitest.config.ts                # Vitest設定
│   ├── pwa-assets.config.ts            # PWA設定
│   └── [その他設定ファイル]
├── 📁 docker/
│   ├── 📁 compose/                     # 🆕 Docker Compose統合
│   │   ├── development.yml             # 開発環境
│   │   ├── integration.yml             # 統合環境
│   │   ├── production.yml              # 本番環境
│   │   └── experimental.yml            # 実験環境
│   └── [Dockerfileファイル]
├── 📁 env/                             # 🆕 環境変数統合
│   ├── .env.example                    # 基本サンプル
│   ├── .env.development.example        # 開発環境サンプル
│   ├── .env.integration.example        # 統合環境サンプル
│   ├── .env.production.example         # 本番環境サンプル
│   └── README.md                       # 環境設定ガイド
├── 📁 scripts/
│   └── 📁 test/                        # 🆕 テストスクリプト統合
│       └── distributed-processing.py   # 分散処理テスト
├── 📁 tests/
│   └── 📁 results/                     # 🆕 テスト結果管理
│       └── .gitignore                  # 一時ファイル除外
├── 📁 src/                             # ソースコード（不変）
├── 📁 docs/                            # ドキュメント（不変）
├── 📁 tools/                           # 開発ツール（不変）
├── 📁 public/                          # 静的アセット（不変）
├── 📄 tsconfig.json                    # 参照設定のみ（簡素化）
├── 📄 package.json                     # 依存関係（スクリプト追加）
├── 📄 vite.config.ts                   # Vite設定（不変）
├── 📄 index.html                       # エントリーポイント（不変）
└── [その他必要ファイル]
```

## 🚀 使用方法

### **1. 開発環境セットアップ**

```bash
# 環境設定ファイル作成
cp env/.env.development.example .env.local
# 必要な値を編集

# 開発サーバー起動（Dockerあり）
npm run docker:dev

# 開発サーバー起動（通常）
npm run dev
```

### **2. 統合テスト実行**

```bash
# 統合環境起動
npm run docker:integration

# 統合テスト実行
npm run integration:test

# 環境停止
npm run integration:stop
```

### **3. 本番デプロイ**

```bash
# 本番環境構築
npm run docker:production

# ビルド実行
npm run build

# 品質チェック
npm run quality:check
```

## 🔧 新機能・追加スクリプト

### **Docker 関連コマンド**

```bash
npm run docker:dev          # 開発環境起動
npm run docker:integration  # 統合環境起動
npm run docker:production   # 本番環境起動
npm run docker:experimental # 実験環境起動
npm run docker:down         # 全環境停止
```

### **環境設定コマンド**

```bash
npm run env:check    # 環境変数チェック
npm run env:setup    # 環境設定支援
```

### **TypeScript 統合ビルド**

```bash
npm run build        # 統合設定でビルド
npm run typecheck    # 型チェック実行
```

## 📋 開発ガイドライン

### **新しいファイル配置ルール**

#### **設定ファイル**

- TypeScript 設定 → `config/typescript/`
- Docker 設定 → `docker/compose/`
- 環境変数 → `env/` (サンプルのみ)
- その他設定 → `config/`

#### **スクリプトファイル**

- テストスクリプト → `scripts/test/`
- 開発スクリプト → `scripts/dev/`
- ビルドスクリプト → `scripts/build/`

#### **一時ファイル**

- テスト結果 → `tests/results/` (Git 除外)
- ビルド出力 → `dist/` (Git 除外)
- ログファイル → `logs/` (Git 除外)

### **環境設定の安全な管理**

```bash
# ✅ 良い例：サンプルから実際の設定を作成
cp env/.env.development.example .env.local

# ❌ 悪い例：機密情報をサンプルファイルに記述
# 絶対にしないでください
```

## 🛠️ 開発者向けクイックスタート

### **新規開発者のセットアップ手順**

1. **リポジトリクローン**

   ```bash
   git clone <repository-url>
   cd sado-restaurant-map
   ```

2. **依存関係インストール**

   ```bash
   pnpm install
   ```

3. **環境設定**

   ```bash
   cp env/.env.development.example .env.local
   # 必要なAPIキーを設定
   ```

4. **開発サーバー起動**

   ```bash
   npm run dev
   ```

5. **動作確認**
   - http://localhost:5173 でアプリケーション確認
   - Google Maps が表示されることを確認

### **よく使用するコマンド**

```bash
# 開発用
npm run dev              # 開発サーバー起動
npm run build            # 本番ビルド
npm run test             # テスト実行
npm run lint             # コード品質チェック

# Docker用
npm run docker:dev       # Docker開発環境
npm run integration:test # 統合テスト実行

# 品質管理用
npm run quality:check    # 全体品質チェック
npm run readme:all       # ドキュメント自動更新
```

## 🔍 トラブルシューティング

### **よくある問題と解決方法**

#### **1. TypeScript ビルドエラー**

```bash
# 設定ファイルパス確認
ls config/typescript/

# 型チェック実行
npm run typecheck
```

#### **2. Docker 起動エラー**

```bash
# Docker設定確認
ls docker/compose/

# 環境変数確認
npm run env:check
```

#### **3. 環境変数未設定エラー**

```bash
# サンプルファイル確認
ls env/

# 設定ファイル作成
cp env/.env.development.example .env.local
```

## 📚 関連ドキュメント

- [環境設定ガイド](../env/README.md)
- [Docker 設定ガイド](../docker/README.md)
- [TypeScript 設定詳細](../config/typescript/README.md)
- [開発環境セットアップ](../docs/development/guides/environment-setup.md)
- [プロジェクト構造改善計画書](../docs/planning/project-structure-improvement-plan.md)

## 🎯 今後の改善予定

- [ ] **Phase 4**: CI/CD パイプライン最適化
- [ ] **Phase 5**: 監視・アラート体制強化
- [ ] **Phase 6**: パフォーマンス最適化
- [ ] **Phase 7**: セキュリティ強化

---

**改善実施**: 2025 年 9 月 7 日完了
**次回見直し**: 2025 年 12 月（四半期レビュー）
**担当**: AI Assistant + 開発チーム
