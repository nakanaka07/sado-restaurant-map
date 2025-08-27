# 📚 プロジェクトドキュメント

佐渡飲食店マップ プロジェクトの包括的ドキュメント集です。

## 📁 ディレクトリ構造

### 🎯 [`planning/`](planning/) - 企画・計画

プロジェクトの企画、設計、ロードマップに関するドキュメント

#### マーカー改善関連

- **[`MARKER_IMPROVEMENT_ROADMAP.md`](planning/MARKER_IMPROVEMENT_ROADMAP.md)** - マーカー改善の全体ロードマップ（6 ヶ月計画）
- **[`MARKER_IMPROVEMENT_INVESTIGATION.md`](planning/MARKER_IMPROVEMENT_INVESTIGATION.md)** - マーカー改善の調査・検討記録
- **[`ICON_SELECTION_GUIDELINES.md`](planning/ICON_SELECTION_GUIDELINES.md)** - 🆕 アイコン選定・設計指針（Phase 1 実装結果基準）

### 🏗️ [`architecture/`](architecture/) - システム設計

アーキテクチャ、技術設計に関するドキュメント

### 🛠️ [`development/`](development/) - 開発

開発環境、API 設定、PWA 設定などの技術ガイド

### 📊 [`reports/`](reports/) - 分析・レポート

実装レポート、分析結果、技術調査報告

### 🔒 [`security/`](security/) - セキュリティ

セキュリティガイドライン、脆弱性報告プロセス

- **[`SECURITY.md`](security/SECURITY.md)** - セキュリティポリシー・脆弱性報告ガイド

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

### 🏗️ アーキテクチャ理解

- [フロントエンドアーキテクチャ](architecture/ADR-001-frontend-architecture.md)
- [Google Maps 統合設計](architecture/ADR-002-google-maps-integration.md)

### 🛡️ セキュリティ・品質

- [セキュリティポリシー](security/SECURITY.md)
- [PWA 設定ガイド](development/pwa-configuration-guide.md)

### 📈 プロジェクト状況

- [最新実装レポート](reports/MARKER_ENHANCEMENT_PHASE1_REPORT.md)
- [マーカー改善ロードマップ](planning/MARKER_IMPROVEMENT_ROADMAP.md)

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

> **最終更新**: 2025 年 8 月 27 日
> **管理者**: 佐渡飲食店マップ開発チーム
> **次回レビュー**: 2025 年 9 月 1 日（Phase 2 開始時）
