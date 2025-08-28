# 📊 Analysis Tools - コード品質分析ツール# 📊 Analysis Tools - コード品質分析ツール# 📊 Analysis Tools - コード品質分析ツール

> **目的**: TypeScript/TSX コードの品質分析・依存関係チェック・Clean Architecture 遵守確認 > **目的**: TypeScript/TSX コードの品質分析・依存関係チェック・Clean Architecture 遵守確認 > **目的**: TypeScript/TSX コードの品質分析・依存関係チェック・Clean Architecture 遵守確認
> **技術**: Node.js + JavaScript (ES6+) | AST 解析 | 依存関係グラフ
> **最終更新**: 2025 年 8 月 28 日> **技術**: Node.js + JavaScript (ES6+) | AST 解析 | 依存関係グラフ > **技術**: Node.js + JavaScript (ES6+) | AST 解析 | 依存関係グラフ

## 📁 ツール構成> **最終更新**: 2025 年 8 月 28 日> **最終更新**: 2025 年 8 月 28 日

````text## 📁 ツール構成## 📁 ツール構成

tools/analysis/

├── check-circular-deps.cjs  # 循環依存検出ツール```text```text

├── analyze-coupling.cjs     # 結合度・レイヤー違反分析ツール

├── output/                  # 分析結果出力ディレクトリ（.gitignore対象）tools/analysis/tools/analysis/

└── README.md               # このファイル

```├── check-circular-deps.cjs  # 循環依存検出ツール├── check-circular-deps.cjs  # 循環依存検出ツール



## 🚀 実行方法├── analyze-coupling.cjs     # 結合度・レイヤー違反分析ツール├── analyze-coupling.cjs     # 結合度・レイヤー違反分析ツール



### 推奨実行順序├── output/                  # 分析結果出力ディレクトリ（.gitignore対象）└── README.md               # このファイル



```bash└── README.md               # このファイル```

# 1. 循環依存検出（依存関係グラフ生成）

pnpm run analyze:deps```



# 2. 結合度分析（依存関係グラフ使用）## 🚀 実行方法

pnpm run analyze:coupling

## 🚀 実行方法

# 3. 一括実行

pnpm run analyze:all### 推奨実行順序

````

### 推奨実行順序

## 🔧 ツール機能

````bash

### check-circular-deps.cjs - 循環依存検出

```bash# 1. 循環依存検出（依存関係グラフ生成）

- **機能**: TypeScript/TSX ファイル間の循環依存検出

- **スキャン対象**: `src/`ディレクトリの`.ts`、`.tsx`ファイル# 1. 循環依存検出（依存関係グラフ生成）pnpm run analyze:deps

- **除外**: テストファイル（`.test.`）、型定義ファイル（`.d.ts`）

- **出力**: `tools/analysis/output/dependency-graph.json`pnpm run analyze:deps



### analyze-coupling.cjs - 結合度分析# 2. 結合度分析（依存関係グラフ使用）



- **機能**: モジュール結合度測定・Clean Architecture レイヤー違反検出# 2. 結合度分析（依存関係グラフ使用）pnpm run analyze:coupling

- **指標**: 入力/出力結合度、不安定性、総結合度

- **レイヤー**: UI、Application、Domain、Infrastructure、Configpnpm run analyze:coupling

- **出力**: `tools/analysis/output/coupling-analysis-report.json`

# 3. 一括実行

## 📊 分析結果の評価基準

# 3. 一括実行pnpm run analyze:all

| 項目 | 良好 | 注意 | 危険 | 対応 |

|------|------|------|------|------|pnpm run analyze:all```

| **循環依存** | 0件 | 1-2件 | 3件以上 | リファクタリング必須 |

| **結合度スコア** | 0-2 | 3-5 | 6+ | アーキテクチャ見直し |```

| **レイヤー違反** | 0件 | 軽微 | 重大 | 即座に修正 |

## 🔧 ツール詳細

## 🎯 品質目標

## 🔧 ツール詳細

- **循環依存**: 0件維持

- **レイヤー違反**: 0件維持  ### check-circular-deps.cjs

- **平均結合度**: 3.0未満

- **高結合モジュール**: 全体の5%未満### check-circular-deps.cjs - 循環依存検出



## 🔍 トラブルシューティング- **機能**: TypeScript/TSX ファイル間の循環依存検出



### よくある問題- **機能**: TypeScript/TSX ファイル間の循環依存検出- **スキャン対象**: `src/`ディレクトリの`.ts`、`.tsx`ファイル



- **dependency-graph.json 未生成**: `pnpm run analyze:deps`を先に実行- **スキャン対象**: `src/`ディレクトリの`.ts`、`.tsx`ファイル- **除外**: テストファイル（`.test.`）、型定義ファイル（`.d.ts`）

- **パス解析エラー**: `tsconfig.json`の`@/*`エイリアス設定を確認

- **除外**: テストファイル（`.test.`）、型定義ファイル（`.d.ts`）- **出力**: `tools/analysis/output/dependency-graph.json`（他ツールで使用）

---

- **出力**: `tools/analysis/output/dependency-graph.json`

**開発支援**: プロジェクトの技術的負債管理・Clean Architecture 実践
### analyze-coupling.cjs

### analyze-coupling.cjs - 結合度分析

- **機能**: モジュール結合度測定・Clean Architecture レイヤー違反検出

- **機能**: モジュール結合度測定・Clean Architecture レイヤー違反検出- **指標**: 入力/出力結合度、不安定性、総結合度

- **指標**: 入力/出力結合度、不安定性、総結合度- **レイヤー**: UI、Application、Domain、Infrastructure、Config

- **レイヤー**: UI、Application、Domain、Infrastructure、Config- **出力**: `tools/analysis/output/coupling-analysis-report.json`

- **出力**: `tools/analysis/output/coupling-analysis-report.json`

## 📊 分析結果の見方

## 📊 分析結果の評価基準

### 循環依存

| 項目 | 良好 | 注意 | 危険 | 対応 |

|------|------|------|------|------|- ✅ **0 件**: 理想的な状態

| **循環依存** | 0件 | 1-2件 | 3件以上 | リファクタリング必須 |- ⚠️ **1-2 件**: 要注意、リファクタリング検討

| **結合度スコア** | 0-2 | 3-5 | 6+ | アーキテクチャ見直し |- 🚨 **3 件以上**: 緊急対応が必要

| **レイヤー違反** | 0件 | 軽微 | 重大 | 即座に修正 |

### 結合度スコア

## 🎯 品質目標

| スコア | 評価 | 対応                 |

- **循環依存**: 0件維持| ------ | ---- | -------------------- |

- **レイヤー違反**: 0件維持  | 0-2    | 良好 | 現状維持             |

- **平均結合度**: 3.0未満| 3-5    | 注意 | リファクタリング検討 |

- **高結合モジュール**: 全体の5%未満| 6+     | 危険 | 即座に対応           |

## 🔍 トラブルシューティング### レイヤー違反

### よくある問題- **HIGH**: Domain→ 他レイヤー、Infrastructure→UI 依存

- **MEDIUM**: その他のアーキテクチャ違反

- **dependency-graph.json 未生成**: `pnpm run analyze:deps`を先に実行

- **パス解析エラー**: `tsconfig.json`の`@/*`エイリアス設定を確認## 🎯 最適化ガイド

---### 循環依存解決

**開発支援**: プロジェクトの技術的負債管理・Clean Architecture 実践1. **インターフェース抽出**: 共通インターフェースで依存を分離
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
````
