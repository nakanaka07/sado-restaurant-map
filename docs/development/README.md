# 開発支援ドキュメント

> 🎯 **目的**: 佐渡飲食店マップの効率的な開発をサポートするガイド集
> **対象**: 開発者・チームメンバー・AI 支援
> **最終更新**: 2025 年 9 月 2 日

## 📚 ドキュメント一覧

### 🤖 AI 開発支援・プロジェクト管理

| ファイル                                                                           | 用途                                | 更新頻度 |
| ---------------------------------------------------------------------------------- | ----------------------------------- | -------- |
| [`copilot-instructions.md`](./copilot-instructions.md)                             | GitHub Copilot 用の開発ガイドライン | 定期的   |
| [`ai-prompts.md`](./ai-prompts.md)                                                 | AI アシスタント向けプロンプト集     | 月次     |
| [`TASK_MATRIX_OPERATIONS_GUIDE.md`](./TASK_MATRIX_OPERATIONS_GUIDE.md)             | タスク状況マトリックス運用ガイド    | 週次     |
| [`PHASE3_TECHNICAL_RESEARCH.md`](./PHASE3_TECHNICAL_RESEARCH.md)                   | Phase 3-Full 技術調査レポート       | 実装時   |
| [`PHASE3_CICD_IMPLEMENTATION_SUMMARY.md`](./PHASE3_CICD_IMPLEMENTATION_SUMMARY.md) | Phase 3 CI/CD 実装サマリー          | 実装時   |

### ⚙️ 環境・設定

| ファイル                                                     | 用途                 | 更新頻度   |
| ------------------------------------------------------------ | -------------------- | ---------- |
| [`environment-setup-guide.md`](./environment-setup-guide.md) | 環境変数設定ガイド   | 機能追加時 |
| [`google-maps-api-setup.md`](./google-maps-api-setup.md)     | Google Maps API 設定 | API 変更時 |

### 🚀 PWA・パフォーマンス・品質管理

| ファイル                                                     | 用途                   | 更新頻度   |
| ------------------------------------------------------------ | ---------------------- | ---------- |
| [`pwa-configuration-guide.md`](./pwa-configuration-guide.md) | PWA 設定最適化ガイド   | 機能更新時 |
| [`workbox-logging-control.md`](./workbox-logging-control.md) | 開発環境でのログ制御   | 必要時     |
| [`quality-gates.md`](./quality-gates.md)                     | 品質ゲート・品質管理   | 定期的     |
| [`monitoring-alerting.md`](./monitoring-alerting.md)         | 監視・アラート設定     | 実装時     |
| [`deployment-strategies.md`](./deployment-strategies.md)     | デプロイメント戦略     | 実装時     |
| [`ci-cd-pipeline-design.md`](./ci-cd-pipeline-design.md)     | CI/CD パイプライン設計 | 実装時     |

## 🎯 用途別ガイド

### 🆕 新規開発者向け

1. **環境構築**: [`environment-setup-guide.md`](./environment-setup-guide.md) → [`google-maps-api-setup.md`](./google-maps-api-setup.md)
2. **AI 活用**: [`copilot-instructions.md`](./copilot-instructions.md) → [`ai-prompts.md`](./ai-prompts.md)
3. **開発体験**: [`workbox-logging-control.md`](./workbox-logging-control.md)

### 🔧 機能開発者向け

- **コード改善**: [`ai-prompts.md`](./ai-prompts.md) の `#1-#6` を活用
- **パフォーマンス**: [`pwa-configuration-guide.md`](./pwa-configuration-guide.md)
- **API 設定**: [`google-maps-api-setup.md`](./google-maps-api-setup.md)

### 🚨 トラブルシューティング

- **環境エラー**: [`environment-setup-guide.md`](./environment-setup-guide.md) → トラブルシューティング
- **ログ過多**: [`workbox-logging-control.md`](./workbox-logging-control.md)
- **PWA 問題**: [`pwa-configuration-guide.md`](./pwa-configuration-guide.md) → トラブルシューティング

## 📋 クイックリファレンス

### 🚀 開発開始

```bash
# 環境変数設定確認
ls .env.local
# 開発サーバー起動（Workboxログなし）
pnpm dev
```

### 🧪 PWA 機能テスト

```bash
# PWA機能を有効化してテスト
$env:ENABLE_PWA_DEV="true"; pnpm dev
```

### 🎯 AI 活用

```bash
# コード改善時
"#3 最適化してください" → パフォーマンス向上
"#10 プロジェクト診断" → 全体的な健康チェック
```

## 🔗 関連ディレクトリ

- [`../architecture/`](../architecture/) - アーキテクチャ決定記録（ADR）
- [`../planning/`](../planning/) - プロジェクト計画・ロードマップ
- [`../../config/`](../../config/) - ビルド・テスト設定
- [`../../tools/`](../../tools/) - 開発ツール・スクリプト

## 💡 メンテナンス

### 定期更新タスク

- **月次**: 技術スタックの最新化確認
- **機能追加時**: 環境変数・API 設定の更新
- **パフォーマンス問題時**: PWA・Workbox 設定の見直し

### 品質管理

- 新機能追加時にドキュメント更新を確認
- AI 指示の効果測定と改善
- 開発者フィードバックの収集・反映

---

**開発効率**: このディレクトリのガイドを活用することで、セットアップ時間を短縮し、一貫した高品質な開発を実現できます。
