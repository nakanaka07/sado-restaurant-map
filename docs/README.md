# 📚 プロジェクトドキュメント

> 🎯 **目的**: 佐渡飲食店マップ プロジェクトの包括的ドキュメント集
> **対象**: 開発チーム・新規参加者・技術レビュアー
> **最終更新**: 2025 年 8 月 31 日

佐渡飲食店マップ プロジェクトの包括的ドキュメント集です。

## 📁 ディレクトリ構造

### 🏗️ [`architecture/`](architecture/) - システム設計・技術決定

アーキテクチャ決定記録 (ADR) とシステム設計ドキュメント

- **[`ADR-001-frontend-architecture.md`](architecture/ADR-001-frontend-architecture.md)** - フロントエンドアーキテクチャ設計決定
- **[`ADR-002-google-maps-integration.md`](architecture/ADR-002-google-maps-integration.md)** - Google Maps 統合アーキテクチャ
- **[`ADR-003-scraper-architecture-redesign.md`](architecture/ADR-003-scraper-architecture-redesign.md)** -
  スクレイパー Clean Architecture 設計

### 🛠️ [`development/`](development/) - 開発環境・ツール

開発環境構築、API 設定、開発ツールの使用方法

- **[`environment-setup-guide.md`](development/environment-setup-guide.md)** - 開発環境セットアップガイド
- **[`google-maps-api-setup.md`](development/google-maps-api-setup.md)** - Google Maps API 設定手順
- **[`pwa-configuration-guide.md`](development/pwa-configuration-guide.md)** - PWA 設定・実装ガイド
- **[`copilot-instructions.md`](development/copilot-instructions.md)** - GitHub Copilot 開発指針
- **[`ai-prompts.md`](development/ai-prompts.md)** - AI 活用プロンプト集
- **[`workbox-logging-control.md`](development/workbox-logging-control.md)** - Workbox ログ制御設定

### 📊 [`analysis/`](analysis/) - システム分析・技術レポート

実装分析、問題調査、改善レポート、技術調査結果

- **[`data-flow-analysis.md`](analysis/data-flow-analysis.md)** - スクレイパーデータ処理フロー詳細分析
- **[`critical-issues-analysis.md`](analysis/critical-issues-analysis.md)** - システム重要問題分析レポート
- **[`improvements-implemented.md`](analysis/improvements-implemented.md)** - 実装済み改善項目詳細レポート

### 🎯 [`planning/`](planning/) - 企画・計画・ロードマップ

プロジェクト企画、機能計画、改善ロードマップ

#### マーカー改善プロジェクト

- **[`MARKER_IMPROVEMENT_ROADMAP.md`](planning/MARKER_IMPROVEMENT_ROADMAP.md)** - マーカー改善全体ロードマップ (6 ヶ月計画)
- **[`MARKER_IMPROVEMENT_INVESTIGATION.md`](planning/MARKER_IMPROVEMENT_INVESTIGATION.md)** - マーカー改善調査・検討記録
- **[`ICON_SELECTION_GUIDELINES.md`](planning/ICON_SELECTION_GUIDELINES.md)** - アイコン選定・設計指針

#### システム拡張計画

- **[`PHASE3_FULL_IMPLEMENTATION_PLAN.md`](planning/PHASE3_FULL_IMPLEMENTATION_PLAN.md)** -
  Phase 3-Full: スクレイパー高度拡張計画 (3 ヶ月実装プラン)

### 🎯 [`reports/`](reports/) - 実装完了レポート

各 Phase・機能の実装完了報告書

- **[`MARKER_ENHANCEMENT_PHASE1_REPORT.md`](reports/MARKER_ENHANCEMENT_PHASE1_REPORT.md)** - マーカー改善 Phase 1 実装完了レポート

### 🔒 [`security/`](security/) - セキュリティ・品質管理

セキュリティポリシー、脆弱性報告、品質管理ガイドライン

- **[`SECURITY.md`](security/SECURITY.md)** - セキュリティポリシー・脆弱性報告ガイド

---

## 📊 ドキュメント構造分析

### 📈 ディレクトリ別ファイル数

| ディレクトリ    | ファイル数 | 主要な役割           | 管理状況    |
| --------------- | ---------- | -------------------- | ----------- |
| `development/`  | 7 ファイル | 開発環境・ツール     | ✅ 完璧     |
| `architecture/` | 4 ファイル | 技術設計・ADR        | ✅ 完璧     |
| `planning/`     | 5 ファイル | 企画・ロードマップ   | ✅ 良好     |
| `analysis/`     | 3 ファイル | 技術分析・レポート   | ✅ 完璧     |
| `security/`     | 1 ファイル | セキュリティポリシー | ✅ 完璧     |
| `reports/`      | 1 ファイル | 実装完了レポート     | ✅ 拡張可能 |

**総計**: **21 ファイル** (README.md 含む)

### 🎯 ドキュメント品質評価

#### ✅ 高品質なディレクトリ構造

1. **標準準拠**: ADR (Architecture Decision Records) の適切な配置
2. **役割明確**: 各ディレクトリの責任が明確に分離
3. **拡張性**: 新しいドキュメントの配置先が明確
4. **発見しやすさ**: 論理的な分類による情報検索の容易さ

#### 📋 管理原則の徹底

- **個別 README**: 各ディレクトリの操作・開発方法に特化 → `tools/scraper/README.md`等
- **プロジェクト全体**: `docs/`による一括管理の実現
- **重複回避**: 同一内容の複数配置を排除
- **構造化**: カテゴリ別の論理的整理

---

## 🎨 マーカー改善プロジェクト（進行中）

### Phase 1 実装完了（2025 年 8 月 27 日現在）

✅ **PNG 活用による即座改善**

- 37%視認性向上（35px→48px）
- 18 料理ジャンル対応
- ユーザーフィードバック収集完了

### 次期 Phase 予定

⏳ **Phase 2**: SVG 基盤構築（2025 年 9 月予定）
📅 **Phase 3-6**: 高度機能・UX 最適化（2025 年 10 月-2026 年 2 月）

詳細は [`planning/MARKER_IMPROVEMENT_ROADMAP.md`](planning/MARKER_IMPROVEMENT_ROADMAP.md) を参照

---

## 🔗 クイックリンク

### 🚀 開発開始

- [開発環境セットアップ](development/environment-setup-guide.md)
- [Google Maps API 設定](development/google-maps-api-setup.md)
- [GitHub Copilot 開発指針](development/copilot-instructions.md)
- [AI 活用プロンプト集](development/ai-prompts.md)

### 🏗️ アーキテクチャ理解

- [フロントエンドアーキテクチャ](architecture/ADR-001-frontend-architecture.md)
- [Google Maps 統合設計](architecture/ADR-002-google-maps-integration.md)
- [スクレイパー Clean Architecture](architecture/ADR-003-scraper-architecture-redesign.md)

### 📊 技術分析・システム理解

- [データフロー詳細分析](analysis/data-flow-analysis.md)
- [システム重要問題分析](analysis/critical-issues-analysis.md)
- [実装済み改善レポート](analysis/improvements-implemented.md)

### 🎯 プロジェクト計画・ロードマップ

- [マーカー改善ロードマップ](planning/MARKER_IMPROVEMENT_ROADMAP.md)
- [Phase 3 拡張計画](planning/PHASE3_FULL_IMPLEMENTATION_PLAN.md)
- [アイコン選定指針](planning/ICON_SELECTION_GUIDELINES.md)

### 🛡️ セキュリティ・品質

- [セキュリティポリシー](security/SECURITY.md)
- [PWA 設定ガイド](development/pwa-configuration-guide.md)

### 📈 プロジェクト状況

- [マーカー改善 Phase 1 完了レポート](reports/MARKER_ENHANCEMENT_PHASE1_REPORT.md)
- [マーカー改善ロードマップ](planning/MARKER_IMPROVEMENT_ROADMAP.md)
- [システム分析・改善状況](analysis/)

### 📚 ドキュメント活用ガイド

#### 🔍 目的別ドキュメント検索

| 目的                       | 推奨ドキュメント                                                                   | 説明                       |
| -------------------------- | ---------------------------------------------------------------------------------- | -------------------------- |
| **開発環境構築**           | [`development/environment-setup-guide.md`](development/environment-setup-guide.md) | 初回セットアップ           |
| **API 設定**               | [`development/google-maps-api-setup.md`](development/google-maps-api-setup.md)     | Google Maps API 設定       |
| **アーキテクチャ理解**     | [`architecture/`](architecture/)                                                   | 技術設計・決定記録         |
| **問題調査・分析**         | [`analysis/`](analysis/)                                                           | システム分析・改善レポート |
| **機能計画・ロードマップ** | [`planning/`](planning/)                                                           | 企画・改善計画             |
| **実装結果確認**           | [`reports/`](reports/)                                                             | 完了レポート               |
| **セキュリティ**           | [`security/SECURITY.md`](security/SECURITY.md)                                     | 脆弱性報告・ポリシー       |

#### 🎯 ドキュメント更新ルール

- **即座更新**: 開発ガイド (機能追加・環境変更時)
- **Phase 完了時**: 計画ドキュメント・実装レポート
- **技術決定時**: アーキテクチャドキュメント (ADR)
- **定期レビュー**: セキュリティポリシー (3 ヶ月毎)

---

## 📚 外部リンク

### プロジェクト関連

- [プロジェクトルート README](../README.md) - プロジェクト全体概要
- [ソースコードドキュメント](../src/README.md) - 実装詳細

### 技術リファレンス

- [React 19 公式ドキュメント](https://react.dev)
- [TypeScript 5.7 ハンドブック](https://www.typescriptlang.org/docs)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps)
- [Vite 6.0 公式ガイド](https://vitejs.dev/guide)

---

## 📝 ドキュメント管理

### 更新ポリシー

- **アーキテクチャ**: 重要な技術決定時に更新
- **開発ガイド**: 機能追加・環境変更時に即座更新
- **計画ドキュメント**: Phase 完了時に更新
- **実装レポート**: 実装完了後に作成
- **セキュリティ**: 3 ヶ月毎定期レビュー

### 文書品質基準

- **明確性**: 目的と対象読者の明記
- **最新性**: 技術スタックとの整合性維持
- **実用性**: 実装・運用に直結する内容
- **相互参照**: 関連ドキュメント間の適切なリンク

### 承認プロセス

1. **作成者** - 初稿作成・技術的正確性確保
2. **技術レビュー** - 開発チームによる内容検証
3. **プロジェクト承認** - マネージャーによる最終承認
4. **公開・保守** - 継続的な更新・改善

---

> **最終更新**: 2025 年 8 月 30 日
> **管理者**: 佐渡飲食店マップ開発チーム
> **ドキュメント数**: 21 ファイル (6 ディレクトリ)
> **次回レビュー**: 2025 年 9 月 1 日 (Phase 2 開始時)
