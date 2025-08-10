# Components Directory

このディレクトリには、佐渡島レストランマップアプリケーションのすべてのReactコンポーネントが含まれています。

## 📁 ディレクトリ構成

```
src/components/
├── common/                 # 共通コンポーネント
├── layout/                 # レイアウト関連コンポーネント
├── map/                    # マップ関連コンポーネント
├── restaurant/             # レストラン関連コンポーネント
└── index.ts               # バレルエクスポート
```

## 🧩 コンポーネント分類

### 📋 Common Components (`common/`)
アプリケーション全体で使用される汎用的なコンポーネント群

#### `AccessibilityComponents.tsx`
アクセシビリティ対応のための専用コンポーネント集：
- **`VisuallyHidden`**: スクリーンリーダー専用テキスト
- **`SkipLink`**: キーボードナビゲーション用スキップリンク
- **`AccessibleButton`**: アクセシブルなボタンコンポーネント
- **`AccessibleInput`**: アクセシブルな入力フィールド
- **`LiveRegion`**: 動的コンテンツの読み上げ対応
- **`AccessibleLoadingSpinner`**: アクセシブルなローディング表示
- **`FocusTrap`**: フォーカス管理コンポーネント

### 🎨 Layout Components (`layout/`)
アプリケーションのレイアウトとUI構造を担当

#### `PWABadge.tsx`
- PWA（Progressive Web App）機能の表示・管理
- インストール促進とオフライン対応の通知

### 🗺️ Map Components (`map/`)
Google Mapsとマップ機能を担当する中核コンポーネント群

#### メインコンポーネント
- **`RestaurantMap.tsx`**: メインのマップコンポーネント
- **`RestaurantMap.test.tsx`**: マップコンポーネントのテスト

#### MapView サブコンポーネント (`MapView/`)
- **`MapView.tsx`**: マップビューのメインコンポーネント
- **`MapContainer.tsx`**: マップコンテナの管理
- **`MapMarker.tsx`**: マップマーカーの表示
- **`MapInfoWindow.tsx`**: 情報ウィンドウの表示・管理
- **`MapErrorFallback.tsx`**: マップエラー時のフォールバック表示

#### ユーティリティ (`utils/`)
- **`markerUtils.ts`**: マーカー関連のユーティリティ関数

### 🍽️ Restaurant Components (`restaurant/`)
レストラン情報の表示とフィルタリング機能を担当

#### FilterPanel サブコンポーネント (`FilterPanel/`)
- **`FilterPanel.tsx`**: メインのフィルターパネル
- **`CuisineFilter.tsx`**: 料理タイプフィルター
- **`DistrictFilter.tsx`**: 佐渡地区フィルター
- **`PriceFilter.tsx`**: 価格帯フィルター
- **`FeatureFilter.tsx`**: 特徴・設備フィルター
- **`SearchFilter.tsx`**: 検索フィルター
- **`MapLegend.tsx`**: マップ凡例表示
- **`useFilterState.ts`**: フィルター状態管理フック

## 🔄 エクスポート構造

### バレルエクスポート (`index.ts`)
すべてのコンポーネントは`index.ts`を通じて統一的にエクスポートされています：

```typescript
// メインアプリ
export { default as App } from "../app/App";

// レイアウト
export { default as PWABadge } from "./layout/PWABadge";

// 共通コンポーネント
export {
  VisuallyHidden,
  SkipLink,
  AccessibleButton,
  // ... その他のアクセシビリティコンポーネント
} from "./common/AccessibilityComponents";

// マップコンポーネント
export { MapView, RestaurantMap } from "./map";

// レストランコンポーネント
export { FilterPanel } from "./restaurant";
```

## 🎯 使用方法

### 基本的なインポート
```typescript
// 統一エクスポートからのインポート
import { MapView, FilterPanel, PWABadge } from '@/components';

// 個別インポート
import { MapView } from '@/components/map';
import { FilterPanel } from '@/components/restaurant';
```

### コンポーネント使用例
```typescript
function App() {
  return (
    <div>
      <PWABadge />
      <MapView />
      <FilterPanel />
    </div>
  );
}
```

## 🏗️ アーキテクチャ原則

### 1. **関心の分離**
- 各ディレクトリは明確な責務を持つ
- `common`: 汎用性の高い再利用可能コンポーネント
- `layout`: レイアウト・UI構造
- `map`: マップ機能特化
- `restaurant`: レストラン情報特化

### 2. **アクセシビリティファースト**
- WCAG 2.1 AA準拠
- スクリーンリーダー対応
- キーボードナビゲーション対応
- ARIA属性の適切な使用

### 3. **TypeScript型安全性**
- 厳密な型定義
- Props interfaceの明確化
- 型推論の活用

### 4. **テスト駆動開発**
- 各主要コンポーネントにテストファイル
- ユニットテストとインテグレーションテスト

### 5. **パフォーマンス最適化**
- React.memoの適切な使用
- useCallbackとuseMemoの活用
- 遅延ローディング対応

## 🔧 開発ガイドライン

### 新しいコンポーネントの追加
1. 適切なディレクトリに配置
2. TypeScript型定義を含める
3. アクセシビリティを考慮
4. テストファイルを作成
5. `index.ts`にエクスポートを追加

### コンポーネント命名規則
- **PascalCase**: コンポーネント名
- **camelCase**: Props、関数名
- **kebab-case**: CSS クラス名

### ファイル構成パターン
```
ComponentName/
├── ComponentName.tsx      # メインコンポーネント
├── ComponentName.test.tsx # テストファイル
├── index.ts              # エクスポート
└── types.ts              # 型定義（必要に応じて）
```

## 🚀 パフォーマンス考慮事項

- **コード分割**: React.lazyによる動的インポート
- **メモ化**: React.memo、useMemo、useCallbackの適切な使用
- **バンドルサイズ**: 不要なライブラリの除去
- **レンダリング最適化**: 不要な再レンダリングの防止

## 🔍 デバッグとトラブルシューティング

### よくある問題
1. **コンポーネントが表示されない**: インポートパスの確認
2. **型エラー**: Props interfaceの確認
3. **スタイルが適用されない**: CSS importの確認
4. **アクセシビリティ警告**: ARIA属性の確認

### 開発ツール
- React Developer Tools
- Accessibility Insights
- TypeScript Language Server
