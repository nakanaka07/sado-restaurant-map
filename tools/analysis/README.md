# Analysis Tools - コード品質分析ツール

佐渡島レストランマップアプリケーションのコード品質と依存関係を分析するためのツール群です。Clean Architectureの原則に基づいた設計品質の維持と最適化を支援します。

## 📁 ツール構成

```
tools/analysis/
├── analyze-coupling.cjs     # 結合度分析・レイヤー違反検出
├── check-circular-deps.cjs  # 循環依存検出
└── README.md               # このファイル
```

## 🔧 分析ツール詳細

### **analyze-coupling.cjs** - 結合度分析ツール

モジュール間の結合度を測定し、Clean Architectureの原則に基づいてレイヤー違反を検出します。

#### **主要機能**

**1. 結合度測定**
- **出力結合度 (Efferent Coupling)**: モジュールが依存する他のモジュール数
- **入力結合度 (Afferent Coupling)**: このモジュールに依存する他のモジュール数
- **不安定性指標 (Instability)**: `Ce / (Ca + Ce)` による安定性評価
- **総結合度**: 入力結合度と出力結合度の合計

**2. レイヤー違反検出**
Clean Architectureのレイヤー構造に基づく依存関係の検証：

```typescript
// レイヤー定義
const layers = {
  ui: ['components'],           // UIレイヤー
  application: ['app', 'hooks'], // アプリケーションレイヤー
  domain: ['types'],            // ドメインレイヤー
  infrastructure: ['services', 'utils'], // インフラストラクチャレイヤー
  config: ['config', 'data']    // 設定レイヤー
};
```

**禁止された依存関係:**
- **Domain → UI/Application/Infrastructure**: ドメインは他レイヤーに依存すべきではない
- **Infrastructure → UI/Application**: インフラは上位レイヤーに依存すべきではない

**3. インターフェース分離機会の検出**
- 高結合モジュールの特定（総結合度 > 5）
- コンポーネントのPropsインターフェース抽出提案
- フックのインターフェース定義によるデカップリング提案
- ユーティリティ関数の機能別分割提案

**4. 最適化レポート生成**
- 高結合モジュールのランキング
- レイヤー違反の詳細リスト
- 優先度付き改善推奨事項

#### **使用方法**

```bash
# 結合度分析実行
node tools/analysis/analyze-coupling.cjs

# 出力例
📊 依存関係分析を開始...
📁 依存関係グラフを読み込みました
🔍 結合度を計算中...
⚠️  高結合モジュール検出: 3件
🚨 レイヤー違反検出: 2件
💡 最適化機会: 5件
```

### **check-circular-deps.cjs** - 循環依存検出ツール

TypeScript/TSXファイル間の循環依存を検出し、依存関係グラフを生成します。

#### **主要機能**

**1. Import文解析**
- `@/`エイリアスを使用したimport文の抽出
- TypeScript/TSXファイルの再帰的スキャン
- テストファイル（`.test.`）と型定義ファイル（`.d.ts`）の除外

**2. 循環依存検出**
- **深度優先探索 (DFS)** アルゴリズムによる循環検出
- 再帰スタックを使用した効率的な循環パス特定
- 複数の循環依存パターンの同時検出

**3. パス正規化**
ファイル拡張子とindex.tsファイルの自動解決：
```typescript
const possiblePaths = [
  `${importPath}.ts`,
  `${importPath}.tsx`,
  `${importPath}/index.ts`,
  `${importPath}/index.tsx`,
];
```

**4. 依存関係グラフ生成**
- JSON形式での依存関係マップ出力
- 他の分析ツールとの連携用データ生成
- `../dependency-graph.json`への自動保存

#### **使用方法**

```bash
# 循環依存検出実行
node tools/analysis/check-circular-deps.cjs

# 出力例
🔍 循環依存検出を開始...
📁 142 ファイルをスキャンしました
✅ 循環依存は検出されませんでした
📊 dependency-graph.json を生成しました

# 循環依存が検出された場合
🚨 2 個の循環依存が検出されました:

1. components/map/MapView.tsx → hooks/useMapPoints.ts → services/sheets/SheetsService.ts → components/map/MapView.tsx
2. utils/analytics.ts → hooks/useAnalytics.ts → utils/analytics.ts
```

## 🚀 実行方法

### **個別実行**

```bash
# 循環依存検出
node tools/analysis/check-circular-deps.cjs

# 結合度分析（循環依存検出後に実行）
node tools/analysis/analyze-coupling.cjs
```

### **package.jsonスクリプト統合**

```json
{
  "scripts": {
    "analyze:deps": "node tools/analysis/check-circular-deps.cjs",
    "analyze:coupling": "node tools/analysis/analyze-coupling.cjs",
    "analyze:all": "npm run analyze:deps && npm run analyze:coupling"
  }
}
```

### **CI/CD統合**

```yaml
# GitHub Actions例
- name: Code Quality Analysis
  run: |
    npm run analyze:deps
    npm run analyze:coupling
  continue-on-error: false
```

## 📊 分析結果の解釈

### **結合度スコア**

| スコア範囲 | 評価 | 対応 |
|-----------|------|------|
| 0-2 | 良好 | 現状維持 |
| 3-5 | 注意 | リファクタリング検討 |
| 6+ | 危険 | 即座にリファクタリング |

### **不安定性指標**

| 値 | 意味 | 推奨アクション |
|----|------|----------------|
| 0.0 | 完全に安定 | 変更時は慎重に |
| 0.5 | バランス良好 | 理想的な状態 |
| 1.0 | 完全に不安定 | 依存関係の見直し |

### **レイヤー違反の重要度**

- **HIGH**: Domain層からの依存、Infrastructure→UI依存
- **MEDIUM**: その他のレイヤー違反
- **LOW**: 軽微な構造的問題

## 🎯 最適化ガイドライン

### **循環依存の解決**

**1. 共通インターフェースの抽出**
```typescript
// Before: 循環依存
// A.ts → B.ts → A.ts

// After: インターフェース分離
// A.ts → IB.ts ← B.ts
// A.ts ← IB.ts → B.ts
```

**2. 依存関係逆転の適用**
```typescript
// Before: 具象依存
import { ConcreteService } from './ConcreteService';

// After: 抽象依存
import { IService } from './abstractions/IService';
```

### **高結合度の解決**

**1. インターフェース分離原則 (ISP)**
```typescript
// Before: 大きなインターフェース
interface IMapService {
  renderMap(): void;
  addMarker(): void;
  handleClick(): void;
  validateData(): void;
  logAnalytics(): void;
}

// After: 分離されたインターフェース
interface IMapRenderer {
  renderMap(): void;
  addMarker(): void;
}

interface IMapInteraction {
  handleClick(): void;
}
```

**2. 単一責任原則 (SRP)**
```typescript
// Before: 多責任コンポーネント
const MapComponent = () => {
  // 地図レンダリング
  // データフェッチング
  // イベントハンドリング
  // 分析ロギング
};

// After: 責任分離
const MapRenderer = () => { /* レンダリングのみ */ };
const MapDataProvider = () => { /* データ管理のみ */ };
const MapEventHandler = () => { /* イベント処理のみ */ };
```

## 🔍 トラブルシューティング

### **よくある問題**

**1. dependency-graph.jsonが見つからない**
```bash
# 解決方法: 循環依存検出を先に実行
node tools/analysis/check-circular-deps.cjs
```

**2. パス解決エラー**
```bash
# tsconfig.jsonのpathsエイリアス設定を確認
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**3. 大量のレイヤー違反検出**
- 段階的リファクタリングを実施
- 優先度HIGHから順次対応
- インターフェース抽出による段階的改善

## 📈 継続的改善

### **定期実行の推奨**

- **毎日**: 循環依存検出
- **週次**: 結合度分析
- **リリース前**: 包括的品質チェック

### **品質メトリクス目標**

- 循環依存: **0件**
- レイヤー違反: **0件**
- 平均結合度: **< 3.0**
- 高結合モジュール: **< 5%**

### **チーム運用**

- コードレビュー時の品質チェック
- 新機能開発後の依存関係検証
- リファクタリング効果の定量的測定

---

これらの分析ツールを活用することで、Clean Architectureの原則に基づいた高品質なコードベースを維持し、技術的負債の蓄積を防ぐことができます。定期的な実行と継続的な改善により、保守性と拡張性の高いアプリケーションを構築できます。
