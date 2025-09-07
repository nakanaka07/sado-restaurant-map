# 🛠️ 開発支援ドキュメント

> **目的**: 佐渡飲食店マップの効率的な開発をサポートするガイド集
> **対象**: 開発者・チームメンバー・AI 支援
> **最終更新**: 2025 年 9 月 7 日

## � ディレクトリ構造

### 🤖 [`ai-assistant/`](./ai-assistant/)

AI 開発支援ツール・プロンプト管理

- GitHub Copilot 設定
- AI プロンプト集
- 分析精度向上プロンプト

### ⚙️ [`automation/`](./automation/)

CI/CD・自動化・デプロイ戦略

- パイプライン設計
- 品質ゲート設定
- 監視・アラート
- デプロイ戦略

### 📋 [`documentation/`](./documentation/)

ドキュメント管理・保守プロセス

- README 管理ワークフロー
- 文書規約・標準化
- タスクマトリックス操作

### 🛠️ [`guides/`](./guides/)

環境構築・設定ガイド

- 開発環境セットアップ
- Google Maps API 設定
- PWA 設定
- Workbox ログ制御

### 🔒 [`security/`](./security/)

セキュリティガイドライン・修正管理

- セキュリティガイドライン
- 修正レポート・履歴

## 🎯 用途別ガイド

### 🆕 新規開発者向け

1. **環境構築**: [`guides/environment-setup.md`](./guides/environment-setup.md)
2. **API 設定**: [`guides/google-maps-api.md`](./guides/google-maps-api.md)
3. **AI 活用**: [`ai-assistant/copilot-instructions.md`](./ai-assistant/copilot-instructions.md)

### 🔧 機能開発者向け

- **プロンプト活用**: [`ai-assistant/ai-prompts.md`](./ai-assistant/ai-prompts.md)
- **PWA 設定**: [`guides/pwa-configuration.md`](./guides/pwa-configuration.md)
- **品質管理**: [`automation/quality-gates.md`](./automation/quality-gates.md)

### 🚀 DevOps 担当者向け

- **CI/CD 設計**: [`automation/ci-cd-pipeline-design.md`](./automation/ci-cd-pipeline-design.md)
- **監視設定**: [`automation/monitoring-alerting.md`](./automation/monitoring-alerting.md)
- **デプロイ戦略**: [`automation/deployment-strategies.md`](./automation/deployment-strategies.md)

### 📚 ドキュメント管理者向け

- **保守ワークフロー**: [`documentation/readme-maintenance-workflow.md`](./documentation/readme-maintenance-workflow.md)
- **管理ガイド**: [`documentation/readme-management-guide.md`](./documentation/readme-management-guide.md)

## � 関連ディレクトリ

- [`../planning/`](../planning/) - プロジェクト計画・Phase3
- [`../testing/`](../testing/) - テスト管理・統合テスト
- [`../reports/`](../reports/) - 実行レポート・進捗
- [`../architecture/`](../architecture/) - アーキテクチャ決定記録

## 💡 使い方のコツ

### 📋 効率的なナビゲーション

- 各サブディレクトリの README.md で詳細確認
- 目的に応じたディレクトリへ直接アクセス
- 関連ディレクトリのクロスリファレンス活用

### 🎯 開発フロー

1. **計画確認**: [`../planning/`](../planning/)で要件・計画確認
2. **環境準備**: [`guides/`](./guides/)で環境セットアップ
3. **開発実行**: [`ai-assistant/`](./ai-assistant/)で AI 活用
4. **品質確保**: [`automation/`](./automation/)で品質・CI/CD 確認
5. **文書化**: [`documentation/`](./documentation/)で成果物文書化

---

📅 **最終更新**: 2025 年 9 月 7 日 | 🔧 **メンテナー**: Development Team
