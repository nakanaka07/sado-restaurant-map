# Markdown Linting Tools

> 🎯 **目的**: プロジェクト内の Markdown ファイルの品質向上
> **対象**: Markdown ファイルのメンテナンスを担当する開発者
> **最終更新**: 2025 年 8 月 30 日

## 🚀 使用方法

```bash
# プレビューのみ
node tools/markdown/index.js --dry-run

# 実際に修正を適用
node tools/markdown/index.js --fix

# 順序付きリストを連続番号で修正
node tools/markdown/index.js --sequential
```

## 🔧 対応ルール

| ルール    | 機能                     | 例                       |
| --------- | ------------------------ | ------------------------ |
| **MD040** | コードブロックの言語指定 | ` ``` ` → ` ```text `    |
| **MD029** | 順序付きリストの番号修正 | `1. 2. 3.` → `1. 1. 1.`  |
| **MD036** | 強調の見出し化           | `**text**` → `#### text` |

## 📁 処理対象

- `src/` - ソースコード内の Markdown
- `docs/` - ドキュメント
- `tools/` - ツール関連ドキュメント
- `README.md` - ルートドキュメント

## 💡 推奨ワークフロー

```bash
# 1. 修正箇所を確認
node tools/markdown/index.js --dry-run

# 2. 問題なければ修正実行
node tools/markdown/index.js --fix
```

---

**連携**: package.json scripts、CI/CD パイプライン
