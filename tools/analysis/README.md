# Analysis Tools - コード品質分析ツール

> 🎯 **目的**: 佐渡飲食店マップアプリケーションのコード品質・依存関係分析
> **技術**: Node.js + JavaScript (ES6+)
> **最終更新**: 2025 年 8 月 27 日

## 📁 ツール構成

```text
tools/analysis/
├── check-circular-deps.cjs  # 循環依存検出ツール
├── analyze-coupling.cjs     # 結合度・レイヤー違反分析ツール
└── README.md               # このファイル
```

## 🚀 実行方法

### 推奨実行順序

```bash
# 1. 循環依存検出（依存関係グラフ生成）
pnpm run analyze:deps

# 2. 結合度分析（依存関係グラフ使用）
pnpm run analyze:coupling

# 3. 一括実行
pnpm run analyze:all
```

### 個別実行

```bash
# 循環依存検出のみ
node tools/analysis/check-circular-deps.cjs

# 結合度分析のみ（要：事前にdeps実行）
node tools/analysis/analyze-coupling.cjs
```

## 🔧 ツール詳細

### check-circular-deps.cjs

- **機能**: TypeScript/TSX ファイル間の循環依存検出
- **スキャン対象**: `src/`ディレクトリの`.ts`、`.tsx`ファイル
- **除外**: テストファイル（`.test.`）、型定義ファイル（`.d.ts`）
- **出力**: `tools/analysis/output/dependency-graph.json`（他ツールで使用）

### analyze-coupling.cjs

- **機能**: モジュール結合度測定・Clean Architecture レイヤー違反検出
- **指標**: 入力/出力結合度、不安定性、総結合度
- **レイヤー**: UI、Application、Domain、Infrastructure、Config
- **出力**: `tools/analysis/output/coupling-analysis-report.json`

## 📊 分析結果の見方

### 循環依存

- ✅ **0 件**: 理想的な状態
- ⚠️ **1-2 件**: 要注意、リファクタリング検討
- 🚨 **3 件以上**: 緊急対応が必要

### 結合度スコア

| スコア | 評価 | 対応                 |
| ------ | ---- | -------------------- |
| 0-2    | 良好 | 現状維持             |
| 3-5    | 注意 | リファクタリング検討 |
| 6+     | 危険 | 即座に対応           |

### レイヤー違反

- **HIGH**: Domain→ 他レイヤー、Infrastructure→UI 依存
- **MEDIUM**: その他のアーキテクチャ違反

## 🎯 最適化ガイド

### 循環依存解決

1. **インターフェース抽出**: 共通インターフェースで依存を分離
2. **依存関係逆転**: 抽象化による具象依存の排除

### 高結合度解決

1. **インターフェース分離**: 大きなインターフェースを機能別に分割
2. **単一責任原則**: コンポーネント・フックの責任明確化

## 🔍 トラブルシューティング

### よくある問題

- **dependency-graph.json 未生成**: `pnpm run analyze:deps`を先に実行
- **パス解決エラー**: `tsconfig.json`の`@/*`エイリアス設定を確認

## 📈 品質目標

- **循環依存**: 0 件維持
- **レイヤー違反**: 0 件維持
- **平均結合度**: 3.0 未満
- **高結合モジュール**: 全体の 5%未満

---

**開発支援**: プロジェクトの技術的負債管理・Clean Architecture 実践
**連携**: package.json scripts、CI/CD パイプライン
