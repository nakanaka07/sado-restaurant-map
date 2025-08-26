# 📚 プロジェクトドキュメント

佐渡飲食店マップ プロジェクトの包括的ドキュメント集です。

## 📁 ディレクトリ構造

### 🎯 [`planning/`](planning/) - 企画・計画

プロジェクトの企画、設計、ロードマップに関するドキュメント

#### マーカー改善関連

- **[`MARKER_IMPROVEMENT_ROADMAP.md`](planning/MARKER_IMPROVEMENT_ROADMAP.md)** - マーカー改善の全体ロードマップ（6ヶ月計画）
- **[`MARKER_IMPROVEMENT_INVESTIGATION.md`](planning/MARKER_IMPROVEMENT_INVESTIGATION.md)** - マーカー改善の調査・検討記録
- **[`ICON_SELECTION_GUIDELINES.md`](planning/ICON_SELECTION_GUIDELINES.md)** - 🆕 アイコン選定・設計指針（Phase 1実装結果基準）

### 🏗️ [`architecture/`](architecture/) - システム設計

アーキテクチャ、技術設計に関するドキュメント

### 🛠️ [`development/`](development/) - 開発

開発環境、API設定、PWA設定などの技術ガイド

### 📊 [`reports/`](reports/) - 分析・レポート

実装レポート、分析結果、技術調査報告

### 🔒 [`security/`](security/) - セキュリティ

セキュリティガイドライン、脆弱性報告

---

## 🎨 マーカー改善プロジェクト - ドキュメント構成

### Phase 1 実装完了（2025年8月27日現在）

#### 📋 計画・設計

1. **[マーカー改善ロードマップ](planning/MARKER_IMPROVEMENT_ROADMAP.md)**
   - 6ヶ月の段階的改善計画
   - Phase 1～6の詳細スケジュール
   - 技術選択とKPI設定

2. **[マーカー改善調査記録](planning/MARKER_IMPROVEMENT_INVESTIGATION.md)**
   - 現状分析と問題特定
   - 技術調査結果
   - Phase 1実装結果・学習事項

#### 🎨 設計指針

1. **[アイコン選定・設計指針](planning/ICON_SELECTION_GUIDELINES.md)** 🆕
   - Phase 1実装フィードバックを基にした次回選定基準
   - 18料理ジャンル別の詳細要件
   - 品質保証チェックリスト
   - 技術仕様・デザイン指針

### 実装状況サマリー

```text
✅ Phase 1: PNG活用による即座改善（2025年8月完了）
   - 37%視認性向上（35px→48px）
   - 18料理ジャンル対応
   - ユーザーフィードバック収集完了

⏳ Phase 2: SVG基盤構築（2025年9月予定）
   - スケーラブルマーカーシステム
   - 50-70%軽量化目標

📅 Phase 3-6: 高度機能・UX最適化（2025年10月-2026年2月）
   - インタラクティブアニメーション
   - PWA統合・運用最適化
```

---

## 🔗 関連リンク

### プロジェクト関連

- [プロジェクトルートREADME](../README.md)
- [ソースコードドキュメント](../src/README.md)

### 技術ドキュメント

- [開発環境セットアップ](development/environment-setup-guide.md)
- [Google Maps API設定](development/google-maps-api-setup.md)
- [PWA設定ガイド](development/pwa-configuration-guide.md)

### 最新のレポート

- [SVG分析レポート](reports/SVG_ANALYSIS_REPORT.md)
- [SVGマーカー実装レポート](reports/SVG_MARKER_IMPLEMENTATION_REPORT.md)
- [PNG実装レポート](reports/ENHANCED_PNG_IMPLEMENTATION_REPORT.md)

---

## 📝 ドキュメント管理

### 更新頻度

- **計画ドキュメント**: Phase完了時に更新
- **実装ガイド**: 機能追加時に即座更新
- **分析レポート**: 実装完了後に作成

### 承認プロセス

1. 作成者による初稿作成
2. 技術レビュー（開発チーム）
3. プロジェクトマネージャー承認
4. 最終版として公開

### バージョン管理

- 各ドキュメントにバージョン情報記載
- 重要な変更時は改訂履歴を更新
- 関連ドキュメント間の整合性確保

---

> **最終更新**: 2025年8月27日
> **管理者**: 佐渡飲食店マップ開発チーム
> **次回レビュー**: 2025年9月1日（Phase 2開始時）
