# 🔍 自動化レポート

> 🎯 **目的**: 品質監視・運用管理の自動生成レポート
> **対象**: 開発チーム・品質管理担当者
> **更新**: 自動生成（手動編集非推奨）

## 📊 レポート概要

このディレクトリには、プロジェクトの品質・運用状況を監視するための自動生成レポートが格納されます。

### 🔧 レポート種別

| ファイル                     | 生成頻度 | 目的                 | 責任者           |
| ---------------------------- | -------- | -------------------- | ---------------- |
| `automation-result.json`     | 実行時   | 自動化タスク実行結果 | 自動化システム   |
| `readme-quality-report.md`   | 実行時   | README 品質評価      | 品質チェッカー   |
| `link-validation-report.md`  | 実行時   | リンク整合性検証     | リンクバリデータ |
| `weekly/quality-report-*.md` | 週次     | 週次品質サマリー     | 週次スクリプト   |

## 🚀 使用方法

### レポート生成

```bash
# 全自動化タスク実行
pnpm run readme:all

# 個別実行
pnpm run readme:check    # 品質評価のみ
pnpm run readme:links    # リンク検証のみ
pnpm run readme:fix      # 自動修正

# 週次レポート生成
./scripts/weekly-quality-report.ps1
```

### レポート確認

```bash
# 最新の品質状況確認
cat tools/reports/readme-quality-report.md

# 自動化実行結果確認
cat tools/reports/automation-result.json

# 週次レポート確認
ls tools/reports/weekly/
```

## 📋 品質基準・閾値

### 自動アラート条件

| 指標               | 閾値   | アクション        |
| ------------------ | ------ | ----------------- |
| テンプレート準拠率 | < 75%  | GitHub Issue 作成 |
| SCRAP 原則準拠率   | < 90%  | GitHub Issue 作成 |
| リンク切れ         | > 0 件 | 即座修正試行      |

### 品質グレード

- **Grade A**: SCRAP Score ≥ 90%
- **Grade B**: SCRAP Score 75-89%
- **要改善**: SCRAP Score < 75%

## 🔧 設定・カスタマイズ

### 自動化設定

```typescript
// scripts/readme-automation/automation-system.ts
interface AutomationConfig {
  enableTechStackSync: boolean; // 技術スタック同期
  enableLinkValidation: boolean; // リンク検証
  enableQualityCheck: boolean; // 品質評価
  enableAutoFix: boolean; // 自動修正
  generateReports: boolean; // レポート生成
}
```

### 週次アラート設定

```powershell
# アラート有効化で実行
./scripts/weekly-quality-report.ps1 -SendAlert
```

## 📁 ディレクトリ構造

```text
tools/reports/
├── automation-result.json      # 自動化実行結果 (JSON)
├── readme-quality-report.md    # README品質評価 (Markdown)
├── link-validation-report.md   # リンク検証結果 (Markdown)
└── weekly/                     # 週次レポート
    └── quality-report-*.md     # 日付別週次サマリー
```

## 🚨 トラブルシューティング

### よくある問題

#### レポート生成エラー

```bash
# 権限確認
ls -la tools/reports/

# ディレクトリ再作成
rm -rf tools/reports/
mkdir -p tools/reports/weekly
```

#### 古いパス参照エラー

```bash
# 旧パス削除確認
ls reports/  # 存在しないことを確認

# スクリプト更新確認
grep -r "reports/" scripts/
```

### 緊急時対応

#### 品質劣化検出時

1. **即座確認**: `tools/reports/readme-quality-report.md`
2. **自動修正**: `pnpm run readme:fix`
3. **手動修正**: 低評価ファイルの個別対応
4. **再検証**: `pnpm run readme:check`

#### システム障害時

1. **手動実行**: スクリプト個別実行
2. **ログ確認**: コンソール出力・エラーメッセージ
3. **設定確認**: `automation-system.ts` の設定値
4. **環境確認**: Node.js・依存関係のバージョン

## 📈 継続改善

### モニタリング指標

- **実行成功率**: 自動化タスクの完了率
- **検出精度**: 品質問題の早期発見率
- **修正効率**: 自動修正の成功率
- **運用負荷**: 手動介入の必要頻度

### 今後の拡張予定

- [ ] Slack 通知統合
- [ ] GitHub Actions 統合
- [ ] ダッシュボード機能
- [ ] 履歴トレンド分析

---

> **自動生成**: 手動編集非推奨
> **保持期間**: 週次レポートは 4 週間
> **アクセス**: 開発チーム全員読み取り可能
> **更新**: 2025 年 8 月 31 日 | **責任者**: 自動化システム
