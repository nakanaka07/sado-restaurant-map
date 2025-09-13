# 🏗️ Architecture Documentation

> **プロジェクト**: 佐渡飲食店マップ - アーキテクチャ設計書
> **最終更新**: 2025年9月14日
> **管理者**: [@nakanaka07](https://github.com/nakanaka07)

## 📖 概要

このディレクトリには、佐渡飲食店マップのシステムアーキテクチャに関する重要な設計決定記録（ADR: Architecture Decision Records）が格納されています。各ADRは技術選択の背景・理由・影響を明確に文書化し、将来の開発・保守を支援します。

### 🔗 **関連ドキュメント**

- **[📚 ドキュメントハブ](../README.md)** - 全体ナビゲーション
- **[🛠️ 開発ガイド](../development/README.md)** - 環境構築・技術スタック
- **[🤖 AI開発支援](../ai-assistant/ai-prompts.md)** - プロンプト集・効率化
- **[📋 プロジェクト計画](../planning/README.md)** - 計画・管理

## 📁 Architecture Decision Records (ADR)

### 🎯 **フロントエンド・UI/UX**

| ADR         | ドキュメント                                                       | 決定内容                                     | ステータス | 更新日    |
| ----------- | ------------------------------------------------------------------ | -------------------------------------------- | ---------- | --------- |
| **ADR-001** | [フロントエンドアーキテクチャ](./ADR-001-frontend-architecture.md) | React 19 + TypeScript 5.7 + Vite 7           | ✅ 採用    | 2025年9月 |
| **ADR-002** | [Google Maps統合](./ADR-002-google-maps-integration.md)            | @vis.gl/react-google-maps + Advanced Markers | ✅ 採用    | 2025年9月 |

### 🔧 **バックエンド・データ処理**

| ADR         | ドキュメント                                                                   | 決定内容                    | ステータス | 更新日    |
| ----------- | ------------------------------------------------------------------------------ | --------------------------- | ---------- | --------- |
| **ADR-003** | [スクレイパーアーキテクチャ再設計](./ADR-003-scraper-architecture-redesign.md) | Python + Celery + ML Engine | ✅ 採用    | 2025年9月 |

## 🎯 アーキテクチャ概要

### 🏗️ **システム全体構成**

```text
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Data Platform  │    │  External APIs  │
│   (React 19)    │───▶│   (Python)       │───▶│  (Google Maps)  │
│                 │    │                  │    │                 │
│ • PWA対応       │    │ • データ収集     │    │ • Maps API      │
│ • TypeScript    │    │ • ML処理         │    │ • Places API    │
│ • Vite 7        │    │ • キャッシュ     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ GitHub Pages    │    │   Local Storage  │    │   CDN Assets    │
│ (静的ホスティング)│    │   (データ永続化) │    │   (画像・アイコン)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 🎨 **フロントエンドアーキテクチャ**

```text
src/
├── app/           # アプリケーション層（ルーティング・状態管理）
├── components/    # プレゼンテーション層（再利用可能UI）
├── hooks/         # ビジネスロジック層（カスタムフック）
├── services/      # データアクセス層（API・外部サービス）
├── types/         # 型定義（ドメインモデル）
└── utils/         # 共通ユーティリティ
```

### 🔧 **データプラットフォーム**

```text
data-platform/
├── core/          # ドメイン層（ビジネスロジック）
├── infrastructure/ # インフラ層（データベース・外部API）
├── application/   # アプリケーション層（ユースケース）
└── interface/     # インターフェース層（API・CLI）
```

## 🎯 設計原則

### 🏗️ **アーキテクチャ原則**

1. **関心の分離（Separation of Concerns）**
   - 各レイヤーが明確な責任を持つ
   - 依存関係の方向性を統一（上位→下位）

2. **依存性逆転の原則（Dependency Inversion）**
   - 抽象に依存し、具象に依存しない
   - インターフェースによる疎結合

3. **単一責任の原則（Single Responsibility）**
   - 各コンポーネント・モジュールは一つの責任のみ
   - 変更理由は一つだけ

4. **オープン・クローズドの原則**
   - 拡張に開いて、修正に閉じる
   - プラグイン・拡張可能な設計

### 🔧 **技術選択原則**

1. **開発効率性**
   - 学習コストが低い
   - 豊富なエコシステム
   - 優秀な開発体験

2. **長期保守性**
   - 安定したAPI・バージョン管理
   - 活発なコミュニティ
   - 明確なアップグレードパス

3. **パフォーマンス**
   - バンドルサイズ最小化
   - 実行時パフォーマンス最適化
   - Web Vitals指標への配慮

4. **セキュリティ**
   - 定期的なセキュリティ更新
   - ベストプラクティス準拠
   - 脆弱性対応の迅速性

## 🎯 品質保証

### 📊 **品質メトリクス**

| 項目                 | 目標値      | 測定方法               |
| -------------------- | ----------- | ---------------------- |
| **型安全性**         | 100%        | TypeScript strict mode |
| **テストカバレッジ** | 90%以上     | Vitest coverage        |
| **Core Web Vitals**  | 良好        | Lighthouse CI          |
| **アクセシビリティ** | WCAG 2.2 AA | axe-core               |
| **セキュリティ**     | 脆弱性0件   | npm audit, Snyk        |

### 🧪 **テスト戦略**

1. **ユニットテスト** - 関数・コンポーネント単位
2. **統合テスト** - モジュール間連携
3. **E2Eテスト** - ユーザーシナリオ
4. **ビジュアル回帰テスト** - UI一貫性
5. **パフォーマンステスト** - 負荷・応答時間

## 🚀 技術スタック詳細

### 🎨 **フロントエンド技術**

| 技術                          | バージョン | 役割           | 選択理由               |
| ----------------------------- | ---------- | -------------- | ---------------------- |
| **React**                     | 19.1.1     | UIライブラリ   | 最新機能・エコシステム |
| **TypeScript**                | 5.7.3      | 型システム     | 開発効率・品質向上     |
| **Vite**                      | 7.1.4      | ビルドツール   | 高速開発・最適化       |
| **@vis.gl/react-google-maps** | 1.5.5      | 地図表示       | 公式推奨・高機能       |
| **Vitest**                    | 3.2        | テストランナー | Vite統合・高速         |

### 🔧 **開発ツール**

| ツール          | バージョン | 役割         | 設定               |
| --------------- | ---------- | ------------ | ------------------ |
| **ESLint**      | 9.x        | 静的解析     | strict rules       |
| **Prettier**    | 3.x        | フォーマッタ | 統一スタイル       |
| **Husky**       | 9.x        | Git hooks    | 品質ゲート         |
| **lint-staged** | 15.x       | 段階的リント | 効率的品質チェック |

### 🏗️ **インフラ・デプロイ**

| 技術               | 役割         | 特徴                         |
| ------------------ | ------------ | ---------------------------- |
| **GitHub Pages**   | ホスティング | 無料・簡単・高可用性         |
| **GitHub Actions** | CI/CD        | 自動化・品質保証             |
| **PWA**            | アプリ化     | オフライン・インストール可能 |
| **CDN**            | アセット配信 | 高速・グローバル配信         |

## 📚 関連リソース

### 🔗 **内部ドキュメント**

- **[開発ガイド](../development/README.md)** - 開発手順・環境構築
- **[プランニング](../planning/README.md)** - プロジェクト計画・管理
- **[AI Assistant](../ai-assistant/README.md)** - AI開発支援ツール

### 📖 **外部リファレンス**

- **[Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)** - アーキテクチャ設計原則
- **[React Architecture Guide](https://react.dev/learn/thinking-in-react)** - React設計思想
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript公式ガイド
- **[Web Architecture 101](https://engineering.videoblocks.com/web-architecture-101-a3224e126947)** - Web全般アーキテクチャ

### 🛠️ **開発支援**

```bash
# アーキテクチャ検証
pnpm run arch:validate        # 設計原則準拠チェック
pnpm run arch:analyze         # 依存関係・メトリクス分析

# 品質保証
pnpm run quality:check        # 総合品質チェック
pnpm run security:audit       # セキュリティ監査
```

---

## 📞 サポート・連絡先

### 👨‍💻 **アーキテクチャサポート**

**システムアーキテクト**: [@nakanaka07](https://github.com/nakanaka07)

### 🐛 **技術課題・提案**

- **ADR提案**: [新しいADR Issue](https://github.com/nakanaka07/sado-restaurant-map/issues/new?template=adr_proposal.md)
- **アーキテクチャ議論**: [GitHub Discussions](https://github.com/nakanaka07/sado-restaurant-map/discussions/categories/architecture)

---

**🏗️ 堅牢なアーキテクチャで、持続可能な開発を実現しよう！**
