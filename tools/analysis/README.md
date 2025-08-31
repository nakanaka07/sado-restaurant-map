# 📊 Analysis Tools - コード品質分析

> 🎯 **目的**: TypeScript/TSX コードの品質分析・依存関係チェック
> **対象**: コードレビュー・リファクタリングを担当する開発者
> **最終更新**: 2025 年 8 月 31 日

## 🛠️ ツール構成

| ツール                    | 機能                 | 出力                            |
| ------------------------- | -------------------- | ------------------------------- |
| `check-circular-deps.cjs` | 循環依存検出         | `output/circular-deps.json`     |
| `analyze-coupling.cjs`    | モジュール結合度分析 | `output/coupling-analysis.json` |

## 🚀 使用方法

### 循環依存チェック

```bash
# 個別実行
node tools/analysis/check-circular-deps.cjs

# package.json経由
pnpm run analyze:deps
```

### 結合度分析

```bash
# 個別実行
node tools/analysis/analyze-coupling.cjs

# package.json経由
pnpm run analyze:coupling
```

### 一括分析

```bash
# 全分析実行
pnpm run analyze:all
```

## 📈 出力ファイル

### 循環依存レポート (`output/circular-deps.json`)

```json
{
  "timestamp": "2025-08-31T12:00:00.000Z",
  "totalFiles": 156,
  "circularDependencies": [
    {
      "cycle": ["src/components/A.tsx", "src/components/B.tsx"],
      "severity": "high"
    }
  ],
  "summary": {
    "cyclesFound": 0,
    "status": "✅ No circular dependencies found"
  }
}
```

### 結合度分析レポート (`output/coupling-analysis.json`)

```json
{
  "timestamp": "2025-08-31T12:00:00.000Z",
  "modules": [
    {
      "path": "src/components/restaurant/",
      "couplingScore": 0.3,
      "incomingDependencies": 5,
      "outgoingDependencies": 12,
      "recommendation": "Consider reducing outgoing dependencies"
    }
  ],
  "summary": {
    "averageCoupling": 0.25,
    "highCouplingModules": 2
  }
}
```

## 🎯 評価基準

### 循環依存

- ✅ **Good**: 循環依存なし
- ⚠️ **Warning**: 軽微な循環依存（2-3 ファイル）
- ❌ **Critical**: 複雑な循環依存（4 ファイル以上）

### 結合度

- ✅ **Low** (0.0-0.3): 良好な分離
- ⚠️ **Medium** (0.3-0.6): 注意が必要
- ❌ **High** (0.6-1.0): リファクタリング推奨

## 🔧 トラブルシューティング

### よくある問題

```bash
# Node.js バージョンエラー
node --version  # 18+ が必要

# 権限エラー（Windows）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 出力ディレクトリがない
mkdir tools/analysis/output
```

## 💡 推奨ワークフロー

```bash
# 1. 開発前の品質チェック
pnpm run analyze:all

# 2. レポート確認
cat tools/analysis/output/circular-deps.json
cat tools/analysis/output/coupling-analysis.json

# 3. 問題があれば修正
# - 循環依存の解消
# - 高結合モジュールのリファクタリング

# 4. 再チェック
pnpm run analyze:all
```

## 🔗 関連リソース

- [循環依存とは](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#circular_dependencies)
- [モジュラープログラミング](https://en.wikipedia.org/wiki/Modular_programming)
- [Clean Architecture 原則](../docs/architecture/)

---

**連携**: ESLint 設定、CI/CD パイプライン、コードレビュー
