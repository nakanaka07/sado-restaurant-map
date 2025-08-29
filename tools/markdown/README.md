# Markdown Linting Tools

> 🎯 **目的**: プロジェクト内の Markdown ファイルの品質向上
> **場所**: `tools/markdown/`

## 📁 ディレクトリ構造

```text
tools/markdown/
├── index.js              # 統合Markdownリントツール（メイン）
├── rules/                # 各リントルールの実装
│   ├── codeBlocks.js     # MD040: コードブロックの言語指定
│   ├── orderedLists.js   # MD029: 順序付きリストの番号修正
│   └── emphasis.js       # MD036: 強調の見出し化
└── utils/                # 共通ユーティリティ
    └── fileUtils.js      # ファイル操作関数
```

## 🚀 使用方法

### 基本コマンド

```bash
# ドライラン（プレビューのみ）
node tools/markdown/index.js --dry-run

# 実際に修正を適用
node tools/markdown/index.js --fix

# 連続番号でリスト修正
node tools/markdown/index.js --sequential

# 静かに実行（詳細ログなし）
node tools/markdown/index.js --quiet
```

### オプション一覧

| オプション     | 説明                               |
| -------------- | ---------------------------------- |
| `--dry-run`    | 変更を実行せずにプレビューのみ表示 |
| `--fix`        | 実際にファイルを修正（デフォルト） |
| `--sequential` | 順序付きリストの番号を連続で修正   |
| `--quiet`      | 詳細ログを非表示                   |
| `--help`       | ヘルプメッセージを表示             |

## 📋 対応ルール

### MD040: コードブロックの言語指定

- 空の ` ``` ` を ` ```text ` に変更
- スペースのみの ` ``` ` を ` ```text ` に変更

### MD029: 順序付きリストの番号修正

- **シンプル版**: すべて `1.` から開始
- **連続版**: 正しい連続番号に修正

### MD036: 強調の見出し化

- `**text**` → `#### text` (独立行のみ)
- `__text__` → `#### text` (独立行のみ)

## 🔧 技術仕様

### 処理対象ディレクトリ

- `src/` - ソースコード内の Markdown
- `docs/` - ドキュメント
- `tools/` - ツール関連ドキュメント

### エラーハンドリング

- ファイル読み込み/書き込みエラーの適切な処理
- 権限不足、ファイルロック等への対応
- `.git`、`node_modules` の自動除外

### 統計情報

- 処理ファイル数、成功/失敗数
- 各ルールの修正箇所数
- 変更前後の比較情報

## 🔄 移行について

### 旧ファイルからの変更点

**統合前** (3 個のファイル):

- `tools/fix-markdown-simple.js`
- `tools/fix-markdown.js`
- `tools/fix-ordered-lists.js`

**統合後** (1 個のメインファイル + モジュール):

- `tools/markdown/index.js` - メインツール
- `tools/markdown/rules/` - ルール別モジュール
- `tools/markdown/utils/` - 共通機能

### 利点

- ✅ **重複排除**: 同じファイルを複数回処理しない
- ✅ **一貫性**: 統一されたオプション・エラーハンドリング
- ✅ **拡張性**: 新しいルールの追加が容易
- ✅ **保守性**: モジュール分割で理解・メンテナンスが簡単
- ✅ **効率性**: 1 回の実行ですべてのルールを適用

## 💡 推奨ワークフロー

### 日常的な使用

```bash
# 1. まずドライランで確認
node tools/markdown/index.js --dry-run

# 2. 問題なければ実際に修正
node tools/markdown/index.js --fix
```

### CI/CD 統合

```bash
# プルリクエスト時のチェック
node tools/markdown/index.js --dry-run --quiet
```

### カスタマイズ

ルールの有効/無効、対象ディレクトリの変更は `index.js` の `DEFAULT_CONFIG` で設定可能。

---

**作成日**: 2025 年 8 月 29 日
**対象プロジェクト**: 佐渡飲食店マップアプリケーション
