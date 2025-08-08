# 🧩 Components Architecture

> **目的**: 佐渡飲食店マップアプリケーションの UI コンポーネント設計指針  
> **更新日**: 2025 年 8 月 8 日

## 📁 ディレクトリ構造

```tree
components/
├── common/           # 汎用UIコンポーネント
│   ├── AccessibilityComponents.tsx
│   └── index.ts
├── map/             # 地図関連コンポーネント
│   ├── RestaurantMap.tsx
│   ├── MapView/     # 地図表示の分割コンポーネント
│   └── index.ts
├── restaurant/      # 飲食店関連コンポーネント
│   ├── FilterPanel/     # フィルター機能（分割済み）
│   ├── ModernFilterPanel/ # モダンフィルター（分割済み）
│   └── index.ts
├── App.tsx          # メインアプリケーション
└── PWABadge.tsx     # PWA機能コンポーネント
```

## 🎯 設計原則

### 1. **単一責任原則 (SRP)**

- 各コンポーネントは 1 つの明確な責任を持つ
- 300 行を超える大型コンポーネントは分割対象

### 2. **コンポーネント分割戦略**

```typescript
// ✅ 推奨: 機能別分割
FilterPanel/
├── FilterPanel.tsx         # メインコンポーネント
├── SearchFilter.tsx        # 検索機能
├── CuisineFilter.tsx      # 料理タイプフィルター
├── useFilterState.ts      # 状態管理Hook
└── index.ts               # barrel export

// ❌ 非推奨: 巨大な単一ファイル
FilterPanel.tsx (891行) // 分割済み
```

### 3. **型安全性**

```typescript
// 厳格な型定義
interface RestaurantCardProps {
  restaurant: Restaurant;
  onSelect: (restaurant: Restaurant) => void;
  className?: string;
}

// Props の必須/オプションを明確化
const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onSelect,
  className,
}) => {
  // 実装
};
```

## 🔧 使用パターン

### **1. 汎用コンポーネント (common/)**

```typescript
import { AccessibleButton } from "@/components/common";

// WCAG 2.2 AA準拠のアクセシブルなボタン
<AccessibleButton
  variant="primary"
  size="medium"
  onClick={handleClick}
  ariaLabel="飲食店を検索"
>
  検索
</AccessibleButton>;
```

### **2. 地図コンポーネント (map/)**

```typescript
import { RestaurantMap } from "@/components/map";

// Google Maps統合コンポーネント
<RestaurantMap
  restaurants={filteredRestaurants}
  center={SADO_CENTER}
  zoom={DEFAULT_ZOOM}
  onRestaurantClick={handleRestaurantClick}
/>;
```

### **3. フィルターコンポーネント (restaurant/)**

```typescript
import { ModernFilterPanel } from "@/components/restaurant";

// 分割済みモダンフィルター
<ModernFilterPanel
  onFiltersChange={handleFiltersChange}
  initialFilters={defaultFilters}
  restaurants={allRestaurants}
/>;
```

## 🎨 スタイリング指針

### **1. CSS Variables 使用**

```css
/* App.css で定義済みのデザイントークン */
.component {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
```

### **2. レスポンシブ設計**

```css
/* モバイルファースト */
.filter-panel {
  width: 100%;
}

@media (min-width: 768px) {
  .filter-panel {
    width: 320px;
  }
}
```

## ♿ アクセシビリティ

### **必須要件**

- **WCAG 2.2 AA 準拠**
- **キーボードナビゲーション対応**
- **スクリーンリーダー対応**
- **適切な ARIA 属性**

### **実装例**

```typescript
// セマンティックHTML + ARIA
<section role="search" aria-label="飲食店検索フィルター">
  <h2 id="filter-heading">検索条件</h2>
  <div role="group" aria-labelledby="filter-heading">
    {/* フィルター要素 */}
  </div>
</section>
```

## 🧪 テスト方針

### **1. コンポーネントテスト**

```typescript
// Testing Library推奨パターン
import { render, screen, fireEvent } from "@testing-library/react";
import { RestaurantCard } from "./RestaurantCard";

test("飲食店名をクリックで詳細表示", () => {
  const mockRestaurant = createMockRestaurant();
  const onSelect = vi.fn();

  render(<RestaurantCard restaurant={mockRestaurant} onSelect={onSelect} />);

  fireEvent.click(screen.getByText(mockRestaurant.name));
  expect(onSelect).toHaveBeenCalledWith(mockRestaurant);
});
```

### **2. アクセシビリティテスト**

```typescript
import { axe, toHaveNoViolations } from "jest-axe";

test("アクセシビリティ違反なし", async () => {
  const { container } = render(<FilterPanel />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 📦 エクスポート規則

### **Barrel Exports**

```typescript
// components/restaurant/index.ts
export { FilterPanel } from "./FilterPanel";
export { ModernFilterPanel } from "./ModernFilterPanel";
export type { FilterPanelProps, FilterState } from "./FilterPanel/types";
```

### **使用時**

```typescript
// ✅ 推奨: barrel exportから
import { FilterPanel, ModernFilterPanel } from "@/components/restaurant";

// ❌ 非推奨: 直接パス
import { FilterPanel } from "@/components/restaurant/FilterPanel/FilterPanel";
```

## 🚀 パフォーマンス最適化

### **1. React.memo 使用**

```typescript
import { memo } from "react";

export const RestaurantCard = memo<RestaurantCardProps>(
  ({ restaurant, onSelect }) => {
    // 実装
  }
);
```

### **2. useCallback/useMemo**

```typescript
const expensiveValue = useMemo(
  () => calculateExpensiveValue(restaurants),
  [restaurants]
);

const handleClick = useCallback(
  (restaurant: Restaurant) => {
    onSelect(restaurant);
  },
  [onSelect]
);
```

## 📚 参考資料

- [React Component Patterns](https://reactpatterns.com/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/)

---

**📝 最終更新**: 2025 年 8 月 8 日  
**🔄 次回更新**: 新機能追加時  
**👥 レビュー**: 開発チーム全体
