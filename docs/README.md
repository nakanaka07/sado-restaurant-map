# 📚 プロジェクトドキュメント

> 🎯 **目的**: 佐渡飲食店マップ - React 19.1 + TypeScript 5.7 + Vite 7.1
> **| 目的 | 推奨ドキュメント | 概要 |
> |------|------------------|------|
> | **開発効率化** | [`ai-prompts.md`](development/ai-assistant/ai-prompts.md) | プロンプト集（#1-#6、#D1-#D6、#P1-#P6） |
> | **AI設定** | [`copilot-instructions.md`](development/ai-assistant/copilot-instructions.md) | GitHub Copilot統合設定 |
> | **技術理解** | [`architecture/`](architecture/) | 技術選定理由・設計決定・ADR |
> |**機能計画\*\* | [`planning/`](planning/) | ロードマップ・改善計画・調査結果 |: 2025年9月9日

## 📁 ディレクトリ構造

```text
docs/
├── architecture/       # システム設計・ADR
├── development/        # 開発支援ツール
│   └── ai-assistant/   # AIプロンプト・Copilot設定
└── planning/           # プロジェクト計画書
```

## 🎯 核となる機能

- 🍽️ **Google Maps Advanced Markers**: 飲食店マップ表示
- 🏪 **店舗詳細・フィルタリング**: 検索・絞り込み機能
- 📱 **PWA対応**: オフライン機能・モバイル最適化
- 🔍 **TypeScript型安全性**: 厳格な型チェック

**プロジェクト**: 佐渡飲食店マップ
**技術スタック**: React 19.1 + TypeScript 5.7 + Vite 7.1 + PWA

## 📂 主要ドキュメント

### 🤖 AI開発支援（development/ai-assistant/）

| ドキュメント                                                                          | 概要                                     | 使用場面                       |
| ------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------ |
| [`copilot-instructions.md`](development/ai-assistant/copilot-instructions.md)         | GitHub Copilot設定・プロジェクト固有指針 | ペアプログラミング・コード生成 |
| [`ai-prompts.md`](development/ai-assistant/ai-prompts.md)                             | プロンプト集（#1-#6、#D1-#D6、#P1-#P6）  | 日常開発・問題解決             |
| [`analysis-accuracy-prompt.md`](development/ai-assistant/analysis-accuracy-prompt.md) | 正確な実装分析のための指針               | コード解析・レビュー           |

### 🏗️ システム設計（architecture/）

| ADR                                                                                                 | 概要                                 | 決定事項                               |
| --------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------- |
| [`ADR-001-frontend-architecture.md`](architecture/ADR-001-frontend-architecture.md)                 | フロントエンド技術スタック選定       | React 19.1 + TypeScript 5.7 + Vite 7.1 |
| [`ADR-002-google-maps-integration.md`](architecture/ADR-002-google-maps-integration.md)             | Google Maps Advanced Markers統合設計 | @vis.gl/react-google-maps v1.5         |
| [`ADR-003-scraper-architecture-redesign.md`](architecture/ADR-003-scraper-architecture-redesign.md) | データプラットフォーム設計           | クリーンアーキテクチャ採用             |

### 🎯 プロジェクト計画（planning/）

| 計画書                                                                                | 概要                       | ステータス |
| ------------------------------------------------------------------------------------- | -------------------------- | ---------- |
| [`marker-improvement-roadmap.md`](planning/marker-improvement-roadmap.md)             | マーカー改善ロードマップ   | 進行中     |
| [`icon-selection-guidelines.md`](planning/icon-selection-guidelines.md)               | アイコン選定・設計指針     | 完了       |
| [`marker-improvement-investigation.md`](planning/marker-improvement-investigation.md) | マーカー改善調査・検討記録 | 完了       |

## 🚀 開発開始のクイックガイド

### 🎯 まず最初に読むべきドキュメント

| 役割                     | 必読ドキュメント                                                                                                 | 所要時間 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------- |
| **新規参加者**           | [`planning/marker-improvement-roadmap.md`](planning/marker-improvement-roadmap.md)                               | 5分      |
| **フロントエンド開発者** | [`architecture/ADR-001-frontend-architecture.md`](architecture/ADR-001-frontend-architecture.md)                 | 10分     |
| **AI活用開発者**         | [`development/ai-assistant/copilot-instructions.md`](development/ai-assistant/copilot-instructions.md)           | 3分      |
| **データ基盤開発者**     | [`architecture/ADR-003-scraper-architecture-redesign.md`](architecture/ADR-003-scraper-architecture-redesign.md) | 15分     |

### 🔧 開発環境セットアップ（3ステップ）

1. **前提条件確認**:
   - Node.js 20.19+
   - pnpm（推奨パッケージマネージャー）
   - Google Maps API キー

2. **AIアシスタント設定**:
   [`development/ai-assistant/copilot-instructions.md`](development/ai-assistant/copilot-instructions.md)

3. **開発効率化プロンプト**:
   [`development/ai-assistant/ai-prompts.md`](development/ai-assistant/ai-prompts.md)

### 💡 問題解決フロー

| 問題                   | 解決ドキュメント                                                                   | プロンプト      |
| ---------------------- | ---------------------------------------------------------------------------------- | --------------- |
| **バグ・エラー**       | [`development/ai-assistant/ai-prompts.md`](development/ai-assistant/ai-prompts.md) | `#1 修正・強化` |
| **コード品質改善**     | [`development/ai-assistant/ai-prompts.md`](development/ai-assistant/ai-prompts.md) | `#2 整理・清掃` |
| **パフォーマンス問題** | [`development/ai-assistant/ai-prompts.md`](development/ai-assistant/ai-prompts.md) | `#3 最適化`     |
| **設計変更**           | [`architecture/`](architecture/)                                                   | `#4 リファクタ` |

## 📋 ドキュメント使用ガイド

### 🎯 目的別ドキュメント選択

| 目的           | 推奨ドキュメント                                                              | 概要                                    |
| -------------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| **開発効率化** | [`ai-prompts.md`](development/ai-assistant/ai-prompts.md)                     | プロンプト集（#1-#6、#D1-#D6、#P1-#P6） |
| **AI設定**     | [`copilot-instructions.md`](development/ai-assistant/copilot-instructions.md) | GitHub Copilot統合設定                  |
| **技術理解**   | [`architecture/`](architecture/)                                              | 技術選定理由・設計決定・ADR             |
| **機能計画**   | [`planning/`](planning/)                                                      | ロードマップ・改善計画・調査結果        |

### 🔍 開発フロー別ガイダンス

#### 🆕 新規開発者

1. **全体把握**:
   [`planning/marker-improvement-roadmap.md`](planning/marker-improvement-roadmap.md)

2. **技術理解**:
   [`architecture/ADR-001-frontend-architecture.md`](architecture/ADR-001-frontend-architecture.md)

3. **AI活用**:
   [`development/ai-assistant/copilot-instructions.md`](development/ai-assistant/copilot-instructions.md)

#### 🔧 機能開発者

1. **要件確認**: [`planning/`](planning/) で機能計画確認
2. **設計理解**: [`architecture/`](architecture/) でアーキテクチャ学習
3. **効率化**:
   [`development/ai-assistant/ai-prompts.md`](development/ai-assistant/ai-prompts.md) でプロンプト活用

### 📚 ドキュメント更新方針

- **実用性優先**: 実際に使用・参照される情報のみ維持
- **最新性確保**: 技術スタック変更時は即座に更新
- **30秒理解**: 読み手が30秒で要点を把握できる構成
- **具体性重視**: 抽象的でなく実行可能な情報

---

> **📅 最終更新**: 2025年9月9日
> **👥 管理者**: 佐渡飲食店マップ開発チーム
> **🚀 プロジェクト進捗**: React 19.1 + TypeScript 5.7 + Vite 7.1 基盤完成
> **📋 次回レビュー**: 2025年10月1日
