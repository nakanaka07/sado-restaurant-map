# 📚 プロジェクトドキュメント

> **プロジェクト**: 佐渡飲食店マップ - React 19 + TypeScript 5.7 + Vite 7
> **最終更新**: 2025年9月14日
> **管理者**: [@nakanaka07](https://github.com/nakanaka07)

## 📖 概要

このディレクトリには、佐渡飲食店マップの開発・設計・運用に関する包括的なドキュメントが格納されています。効率的な開発とプロジェクトの成功を支援する構造化された情報を提供します。

## 📁 ドキュメント構造

```text
docs/
├── 📖 README.md                   # このファイル（ナビゲーションハブ）
├── 🤖 ai-assistant/              # AI開発支援ツール
│   ├── ai-prompts.md             # 実用プロンプト集（#1-#6、#D1-#D6、#P1-#P6）
│   ├── copilot-instructions.md   # GitHub Copilot統合設定
│   └── analysis-accuracy-prompt.md # 正確な実装分析指針
├── 🏗️ architecture/              # システム設計・ADR
│   ├── README.md                 # アーキテクチャ概要
│   ├── ADR-001-frontend-architecture.md
│   ├── ADR-002-google-maps-integration.md
│   └── ADR-003-scraper-architecture-redesign.md
├── 🛠️ development/               # 開発ガイド・環境構築
│   └── README.md                 # 開発手順・技術スタック
├── 📋 planning/                  # プロジェクト計画・管理
│   ├── README.md                 # 計画書ハブ
│   ├── project-completion-status.md # 完了状況管理
│   └── completed-projects/       # 完了済みプロジェクト
└── 🔧 MAINTENANCE.md             # 保守・運用ガイド
```

## 🚀 クイックスタート

### 🎯 **役割別スタートガイド**

| 役割                     | 推奨ドキュメント                                                             | 概要                        | 所要時間 |
| ------------------------ | ---------------------------------------------------------------------------- | --------------------------- | -------- |
| **新規参加者**           | [development/README.md](development/README.md)                               | 環境構築・開発フロー        | 10分     |
| **フロントエンド開発者** | [architecture/ADR-001](architecture/ADR-001-frontend-architecture.md)        | 技術スタック・設計思想      | 10分     |
| **AI活用開発者**         | [ai-assistant/copilot-instructions.md](ai-assistant/copilot-instructions.md) | Copilot統合・プロンプト活用 | 5分      |
| **プロジェクト管理者**   | [planning/README.md](planning/README.md)                                     | 計画管理・進捗確認          | 15分     |

### 💡 **問題解決フロー**

| 問題                  | 解決ドキュメント                                         | プロンプト      | 詳細                   |
| --------------------- | -------------------------------------------------------- | --------------- | ---------------------- |
| **🚨 エラー・バグ**   | [ai-assistant/ai-prompts.md](ai-assistant/ai-prompts.md) | `#1 修正・強化` | バグ修正・型エラー解決 |
| **🧹 コード品質**     | [ai-assistant/ai-prompts.md](ai-assistant/ai-prompts.md) | `#2 整理・清掃` | リーダビリティ向上     |
| **⚡ パフォーマンス** | [ai-assistant/ai-prompts.md](ai-assistant/ai-prompts.md) | `#3 最適化`     | 速度・メモリ最適化     |
| **🏗️ 設計変更**       | [architecture/](architecture/)                           | `#4 リファクタ` | アーキテクチャ改善     |

## 📂 主要ドキュメント詳細

### 🤖 **AI開発支援（ai-assistant/）**

AI支援による効率的な開発のためのツール群です。

| ドキュメント                                                                | 概要                 | 使用場面           |
| --------------------------------------------------------------------------- | -------------------- | ------------------ |
| **[ai-prompts.md](ai-assistant/ai-prompts.md)**                             | 18の実用プロンプト集 | 日常開発・問題解決 |
| **[copilot-instructions.md](ai-assistant/copilot-instructions.md)**         | GitHub Copilot設定   | ペアプログラミング |
| **[analysis-accuracy-prompt.md](ai-assistant/analysis-accuracy-prompt.md)** | 分析精度向上指針     | コードレビュー     |

**特徴**:

- **3レベル対応**: ファイル・ディレクトリ・プロジェクト
- **6つの基本プロンプト**: 修正・整理・最適化・リファクタ・更新・総合
- **実践的**: 実プロジェクトに基づく正確な技術情報

### 🏗️ **システム設計（architecture/）**

技術選定・設計決定の根拠を明確化したADR（Architecture Decision Records）です。

| ADR                                                                  | 概要                   | 決定事項                                     | ステータス |
| -------------------------------------------------------------------- | ---------------------- | -------------------------------------------- | ---------- |
| **[ADR-001](architecture/ADR-001-frontend-architecture.md)**         | フロントエンド技術選定 | React 19 + TypeScript 5.7 + Vite 7           | ✅ 採用    |
| **[ADR-002](architecture/ADR-002-google-maps-integration.md)**       | 地図統合設計           | @vis.gl/react-google-maps + Advanced Markers | ✅ 採用    |
| **[ADR-003](architecture/ADR-003-scraper-architecture-redesign.md)** | データ基盤設計         | Clean Architecture + Python                  | ✅ 採用    |

**設計原則**:

- **Clean Architecture**: 関心の分離・依存性逆転
- **型安全性**: TypeScript strict mode・enum安全性
- **パフォーマンス**: Core Web Vitals・PWA対応

### 🛠️ **開発ガイド（development/）**

開発環境構築から品質保証まで、開発者が効率的に作業するためのガイドです。

**主な内容**:

- **環境構築**: Node.js 20.19+、pnpm、VS Code設定
- **開発フロー**: Git ワークフロー・品質チェック
- **技術スタック**: React 19・TypeScript 5.7・Vite 7
- **テスト・品質**: Vitest・ESLint・Prettier

### 📋 **プロジェクト計画（planning/）**

プロジェクトの計画・管理・進捗追跡を行うドキュメント群です。

**構成**:

- **[project-completion-status.md](planning/project-completion-status.md)**: 完了状況一元管理
- **[completed-projects/](planning/completed-projects/)**: 完了済みプロジェクトアーカイブ

**管理対象**:

- アイコン最適化プロジェクト（完了）
- 情報ウィンドウ拡張（完了）
- データプラットフォーム構築（進行中）

## 🔧 技術スタック概要

### 🎨 **フロントエンド**

- **React 19**: Actions API、useActionState、use() hook
- **TypeScript 5.7**: enum安全性・型ガード・推論改善
- **Vite 7**: Environment API・ESM-only・高速ビルド
- **@vis.gl/react-google-maps**: Advanced Markers・高機能地図

### 🧪 **品質保証**

- **Vitest 3.2**: テストフレームワーク・カバレッジ
- **ESLint 9**: enum安全性・型安全性チェック
- **Prettier**: 統一フォーマット・自動整形
- **GitHub Actions**: CI/CD・自動化

### 🏗️ **アーキテクチャ**

- **Clean Architecture**: レイヤード設計・責任分離
- **PWA**: Service Worker・オフライン対応
- **GitHub Pages**: 静的ホスティング・CDN

## 📚 開発リソース

### 🔧 **開発コマンド**

```bash
# 環境構築
pnpm install          # 依存関係インストール
pnpm dev              # 開発サーバー起動

# 品質保証
pnpm test             # テスト実行
pnpm lint             # コード品質チェック
pnpm typecheck        # TypeScript型チェック

# ビルド・デプロイ
pnpm build            # プロダクションビルド
pnpm preview          # ビルド結果確認
```

### 🔗 **外部リファレンス**

- **[React 19](https://react.dev/)** - 最新機能・ベストプラクティス
- **[TypeScript 5.7](https://www.typescriptlang.org/docs/)** - 型システム・高度な機能
- **[Vite 7](https://vitejs.dev/)** - ビルドツール・設定ガイド
- **[Google Maps Platform](https://developers.google.com/maps)** - API仕様・実装ガイド

## 📞 サポート・連絡先

### 👨‍💻 **プロジェクトサポート**

**プロジェクトリード**: [@nakanaka07](https://github.com/nakanaka07)

### 🐛 **課題・提案**

- **バグ報告**: [Bug Report](https://github.com/nakanaka07/sado-restaurant-map/issues/new?template=bug_report.md)
- **機能要望**: [Feature Request](https://github.com/nakanaka07/sado-restaurant-map/issues/new?template=feature_request.md)
- **ドキュメント改善**: [Documentation](https://github.com/nakanaka07/sado-restaurant-map/issues/new?template=documentation.md)

---

## 🎯 ドキュメント品質指針

### 📝 **更新・保守ルール**

1. **正確性**: 実装と同期した正確な情報
2. **簡潔性**: 要点を明確に、冗長性を排除
3. **実用性**: 実際の開発で使いやすい形式
4. **一貫性**: 統一されたフォーマット・スタイル

### 🔄 **定期メンテナンス**

- **月次**: 技術スタック・依存関係の更新確認
- **四半期**: プロジェクト計画・ロードマップの見直し
- **年次**: アーキテクチャ・設計原則の包括レビュー

---

**📚 整理されたドキュメントで、効率的なプロジェクト運営を実現しよう！**
