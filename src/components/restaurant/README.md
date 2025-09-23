# Restaurant Components

> 🎯 **目的**: レストラン情報の表示・検索・フィルタリング・ソート機能
> **対象**: レストラン機能を実装・保守する開発者
> **最終更新**: 2025 年 8 月 30 日

## 🔧 主要コンポーネント

| コンポーネント     | 機能                   | 説明                                               |
| ------------------ | ---------------------- | -------------------------------------------------- |
| **FilterPanel**    | 統合フィルターシステム | 検索・料理ジャンル・価格帯・地区・特徴での絞り込み |
| **SearchFilter**   | 自由検索               | レストラン名・説明文での検索                       |
| **CuisineFilter**  | 料理ジャンル絞り込み   | 18 種類の料理カテゴリ                              |
| **PriceFilter**    | 価格帯絞り込み         | 4 段階の価格レンジ                                 |
| **DistrictFilter** | 地区絞り込み           | 佐渡島 11 地区                                     |
| **FeatureFilter**  | 特徴絞り込み           | 30 種類以上の設備・サービス                        |

## 🚀 クイックスタート

### 基本的な使用方法

```tsx
import { FilterPanel } from "@/components/restaurant";
import type { FilterHandlers } from "@/components/restaurant";

const filterHandlers: FilterHandlers = {
  onCuisineFilter: cuisine => applyFilters({ cuisine }),
  onPriceFilter: price => applyFilters({ price }),
  onDistrictFilter: districts => applyFilters({ districts }),
  onSearchFilter: search => applyFilters({ search }),
  onFeatureFilter: features => applyFilters({ features }),
  onResetFilters: () => resetAllFilters(),
};

<FilterPanel {...filterHandlers} loading={loading} resultCount={filteredRestaurants.length} />;
```

## 🏗️ データフロー

```text
Parent Component → FilterPanel → Filter Events → State Management → Map/List Components
```

## 🔍 トラブルシューティング

- **フィルターが動作しない**: `filterHandlers` の実装を確認
- **パフォーマンス問題**: `useMemo`、`useCallback` でメモ化を実装
- **状態同期問題**: フィルター状態とレストランデータの整合性を確認

## 📚 関連ドキュメント

- [地図コンポーネント](../map/README.md)
- [型定義](../../types/README.md)

---

**アーキテクチャ**: 単一責任・型安全性・パフォーマンス最適化・アクセシビリティ対応

## 📁 ディレクトリ構成

````text
src/components/restaurant/
├── FilterPanel/               # フィルタリング機能コンポーネント群
│   ├── FilterPanel.tsx       # メインフィルターパネル
│   ├── useFilterState.ts     # フィルター状態管理フック
│   ├── SearchFilter.tsx      # 検索フィルター
│   ├── CuisineFilter.tsx     # 料理ジャンルフィルター
│   ├── PriceFilter.tsx       # 価格帯フィルター
│   ├── DistrictFilter.tsx    # 佐渡地区フィルター
│   ├── FeatureFilter.tsx     # 特徴・設備フィルター
│   ├── MapLegend.tsx         # マップ凡例表示
│   ├── index.ts              # バレルエクスポート
│   └── README.md             # FilterPanel詳細ドキュメント
├── index.ts                  # ディレクトリのバレルエクスポート
└── README.md                 # このファイル
```text

## 🎯 主要機能

### 1. **フィルタリングシステム**

レストラン検索と絞り込み機能の中核を担う統合システム

- **多次元フィルタリング**: 料理ジャンル、価格帯、地区、特徴による複合検索
- **リアルタイム検索**: 入力に応じた即座の結果更新
- **状態管理**: 型安全で効率的なフィルター状態の管理
- **アクセシビリティ**: WCAG 2.1 AA準拠のユーザーインターフェース

### 2. **検索機能**

- **自由検索**: レストラン名、説明文での柔軟な検索
- **オートコンプリート**: 検索候補の提案（将来実装予定）
- **検索履歴**: ユーザーの検索履歴管理（将来実装予定）

### 3. **カテゴリ分類**

- **料理ジャンル**: 18種類の詳細な料理カテゴリ
- **価格帯**: 4段階の価格レンジ分類
- **地理的分類**: 佐渡島の11地区による地域分け
- **特徴分類**: 30種類以上の設備・サービス特徴

## 🔧 コンポーネント詳細

### FilterPanel - 統合フィルターシステム

レストラン検索・絞り込み機能の中核コンポーネント群

```typescript
// 基本的な使用方法
import { FilterPanel } from '@/components/restaurant';
import type { FilterHandlers } from '@/components/restaurant';

const RestaurantPage = () => {
  const filterHandlers: FilterHandlers = {
    onCuisineFilter: (cuisine) => {
      // 料理ジャンルフィルター処理
    },
    onPriceFilter: (price) => {
      // 価格帯フィルター処理
    },
    onDistrictFilter: (districts) => {
      // 地区フィルター処理
    },
    onSearchFilter: (search) => {
      // 検索フィルター処理
    },
    onFeatureFilter: (features) => {
      // 特徴フィルター処理
    },
    onResetFilters: () => {
      // フィルターリセット処理
    },
  };

  return (
    <FilterPanel
      {...filterHandlers}
      loading={loading}
      resultCount={restaurants.length}
    />
  );
};
```text

**主要機能**:

- **SearchFilter**: 自由検索入力フィールド
- **CuisineFilter**: 料理ジャンル選択ドロップダウン
- **PriceFilter**: 価格帯選択ドロップダウン
- **DistrictFilter**: 佐渡地区複数選択チェックボックス
- **FeatureFilter**: 特徴・設備複数選択チェックボックス
- **MapLegend**: 地図マーカーの凡例表示

詳細は [`FilterPanel/README.md`](README.md) を参照してください。

## 🎨 使用方法

### 基本的なインポート

```typescript
// メインコンポーネント
import { FilterPanel } from '@/components/restaurant';

// 個別コンポーネント（必要に応じて）
import {
  SearchFilter,
  CuisineFilter,
  PriceFilter,
  DistrictFilter,
  FeatureFilter,
  MapLegend,
  useFilterState,
} from '@/components/restaurant/FilterPanel';

// 型定義
import type { FilterHandlers } from '@/components/restaurant';
```text

### 完全な実装例

```tsx
import React, { useState, useCallback, useMemo } from 'react';
import { FilterPanel } from '@/components/restaurant';
import { MapView } from '@/components/map';
import type { Restaurant, MapPoint, FilterHandlers } from '@/types';

const RestaurantMapPage = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  // フィルター処理の実装
  const applyFilters = useCallback((filters: any) => {
    let filtered = [...restaurants];

    // 検索フィルター
    if (filters.search) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // 料理ジャンルフィルター
    if (filters.cuisine) {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisineType === filters.cuisine
      );
    }

    // 価格帯フィルター
    if (filters.price) {
      filtered = filtered.filter(restaurant =>
        restaurant.priceRange === filters.price
      );
    }

    // 地区フィルター
    if (filters.districts.length > 0) {
      filtered = filtered.filter(restaurant =>
        filters.districts.includes(restaurant.district)
      );
    }

    // 特徴フィルター
    if (filters.features.length > 0) {
      filtered = filtered.filter(restaurant =>
        filters.features.every(feature =>
          restaurant.features?.includes(feature)
        )
      );
    }

    setFilteredRestaurants(filtered);
  }, [restaurants]);

  // フィルターハンドラーの定義
  const filterHandlers: FilterHandlers = {
    onCuisineFilter: useCallback((cuisine) => {
      applyFilters({ ...currentFilters, cuisine });
    }, [applyFilters]),

    onPriceFilter: useCallback((price) => {
      applyFilters({ ...currentFilters, price });
    }, [applyFilters]),

    onDistrictFilter: useCallback((districts) => {
      applyFilters({ ...currentFilters, districts });
    }, [applyFilters]),

    onSearchFilter: useCallback((search) => {
      applyFilters({ ...currentFilters, search });
    }, [applyFilters]),

    onFeatureFilter: useCallback((features) => {
      applyFilters({ ...currentFilters, features });
    }, [applyFilters]),

    onResetFilters: useCallback(() => {
      setFilteredRestaurants(restaurants);
    }, [restaurants]),
  };

  // 地図用のポイントデータ変換
  const mapPoints: MapPoint[] = useMemo(() => {
    return filteredRestaurants.map(restaurant => ({
      ...restaurant,
      type: 'restaurant' as const,
    }));
  }, [filteredRestaurants]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* フィルターパネル */}
      <div style={{ width: '320px', borderRight: '1px solid #e5e7eb' }}>
        <FilterPanel
          {...filterHandlers}
          loading={loading}
          resultCount={filteredRestaurants.length}
        />
      </div>

      {/* メインコンテンツ */}
      <div style={{ flex: 1 }}>
        <MapView
          points={mapPoints}
          center={{ lat: 38.0186, lng: 138.3669 }}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default RestaurantMapPage;
```text

## 🏗️ アーキテクチャ

### 設計原則

1. **単一責任の原則**
   - 各コンポーネントは特定のフィルタリング機能に特化
   - 明確な責任分界の維持
   - 再利用可能な設計

1. **型安全性**
   - TypeScriptによる厳密な型定義
   - ランタイムエラーの最小化
   - 開発時の型チェック

1. **パフォーマンス最適化**
   - React.memoによる不要な再レンダリング防止
   - useCallbackによるイベントハンドラーの最適化
   - useMemoによる計算結果のキャッシュ

1. **アクセシビリティ**
   - WCAG 2.1 AA準拠
   - キーボードナビゲーション対応
   - スクリーンリーダー対応

### データフロー

```text
Parent Component (App/Page)
    ↓ (FilterHandlers)
Restaurant Components
    ↓ (Filter Events)
Filter State Management
    ↓ (Filtered Data)
Map/List Components
    ↓ (User Interactions)
Analytics Tracking
```text

### 状態管理パターン

```typescript
// フィルター状態の型定義
interface RestaurantFilters {
  search: string;
  cuisine: CuisineType | "";
  price: PriceRange | "";
  districts: SadoDistrict[];
  features: string[];
  rating: number | undefined;
  openNow: boolean;
}

// 状態更新パターン
const updateFilters = useCallback((newFilters: Partial<RestaurantFilters>) => {
  setFilters(prevFilters => ({
    ...prevFilters,
    ...newFilters,
  }));
}, []);
```text

## 🔧 開発ガイドライン

### 新しいレストランコンポーネントの追加

1. **コンポーネント作成**

```typescript
// NewRestaurantComponent.tsx
import React, { memo } from 'react';
import type { Restaurant } from '@/types';

interface NewRestaurantComponentProps {
  restaurants: Restaurant[];
  onSelect?: (restaurant: Restaurant) => void;
}

export const NewRestaurantComponent = memo<NewRestaurantComponentProps>(
  function NewRestaurantComponent({ restaurants, onSelect }) {
    return (
      <div>
        {restaurants.map(restaurant => (
          <div
            key={restaurant.id}
            onClick={() => onSelect?.(restaurant)}
          >
            {restaurant.name}
          </div>
        ))}
      </div>
    );
  }
);
```text

1. **エクスポートの追加**

```typescript
// index.ts に追加
export { NewRestaurantComponent } from './NewRestaurantComponent';
```text

1. **テストの作成**

```typescript
// NewRestaurantComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NewRestaurantComponent } from './NewRestaurantComponent';

describe('NewRestaurantComponent', () => {
  test('renders restaurant list', () => {
    // テスト実装
  });
});
```text

### レストランデータの型定義

```typescript
// types/restaurant.types.ts
export interface Restaurant {
  readonly id: string;
  readonly name: string;
  readonly cuisineType: CuisineType;
  readonly priceRange: PriceRange;
  readonly district: SadoDistrict;
  readonly coordinates: {
    readonly lat: number;
    readonly lng: number;
  };
  readonly address: string;
  readonly phone?: string;
  readonly website?: string;
  readonly description?: string;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly features?: readonly string[];
  readonly openingHours?: OpeningHours;
  readonly images?: readonly string[];
}
```text

## 🧪 テスト

### テスト構成

- **Unit Tests**: 個別コンポーネントのテスト
- **Integration Tests**: コンポーネント間の連携テスト
- **E2E Tests**: ユーザーフローの統合テスト

### テスト例

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RestaurantMapPage } from './RestaurantMapPage';

describe('Restaurant Components Integration', () => {
  test('filters restaurants by cuisine type', async () => {
    render(<RestaurantMapPage />);

    // 料理ジャンルフィルターを選択
    const cuisineFilter = screen.getByLabelText('料理ジャンル');
    fireEvent.change(cuisineFilter, { target: { value: '日本料理' } });

    // フィルター結果を確認
    await waitFor(() => {
      expect(screen.getByText(/日本料理のレストランが表示されています/)).toBeInTheDocument();
    });
  });

  test('searches restaurants by name', async () => {
    render(<RestaurantMapPage />);

    // 検索フィールドに入力
    const searchInput = screen.getByPlaceholderText('レストラン名で検索...');
    fireEvent.change(searchInput, { target: { value: '寿司' } });

    // 検索結果を確認
    await waitFor(() => {
      const results = screen.getAllByText(/寿司/);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  test('resets all filters', () => {
    render(<RestaurantMapPage />);

    // フィルターを設定
    fireEvent.change(screen.getByLabelText('料理ジャンル'), {
      target: { value: '日本料理' }
    });

    // リセットボタンをクリック
    fireEvent.click(screen.getByText('フィルターをリセット'));

    // フィルターがリセットされたことを確認
    expect(screen.getByLabelText('料理ジャンル')).toHaveValue('');
  });
});
```text

## 🔍 トラブルシューティング

### よくある問題

1. **フィルターが正常に動作しない**

   ```typescript
   // デバッグ用のログ出力
   const debugFilters = (filters: RestaurantFilters) => {
     console.log('Current filters:', filters);
     console.log('Filtered restaurants count:', filteredRestaurants.length);
   };
````

1. **パフォーマンスの問題**

   ```typescript
   // メモ化の確認
   const memoizedRestaurants = useMemo(() => {
     return restaurants.filter(restaurant => {
       // フィルタリングロジック
     });
   }, [restaurants, filters]);
   ```

1. **状態の同期問題**

   ```typescript
   // 状態の確認
   useEffect(() => {
     console.log("Restaurant state updated:", {
       totalRestaurants: restaurants.length,
       filteredRestaurants: filteredRestaurants.length,
       activeFilters: Object.keys(filters).filter(key => filters[key]),
     });
   }, [restaurants, filteredRestaurants, filters]);
   ```

### デバッグ方法

````typescript
// レストランコンポーネントのデバッグ
const debugRestaurantComponents = () => {
  console.log('Restaurant Components Debug:', {
    totalRestaurants: restaurants.length,
    filteredCount: filteredRestaurants.length,
    activeFilters: getActiveFilters(filters),
    renderTime: performance.now(),
  });
};

// パフォーマンス監視
const measureRestaurantPerformance = () => {
  console.time('Restaurant Filter Performance');
  // フィルタリング処理
  console.timeEnd('Restaurant Filter Performance');
};
```text

## 🚀 今後の改善予定

### 短期的な改善

- [ ] レストランリスト表示コンポーネントの追加
- [ ] レストラン詳細モーダルコンポーネント
- [ ] お気に入り機能の実装
- [ ] レビュー・評価システム

### 中期的な改善

- [ ] レストラン比較機能
- [ ] 予約システム統合
- [ ] ソーシャル共有機能
- [ ] オフライン対応

### 長期的な改善

- [ ] AI による推奨システム
- [ ] リアルタイム混雑状況表示
- [ ] AR メニュー表示機能
- [ ] 多言語対応

## 🔗 関連コンポーネント

### 内部依存

- **Map Components**: レストラン位置の地図表示
- **Common Components**: アクセシビリティ機能
- **Layout Components**: PWA機能統合

### 外部API連携

- **Google Maps API**: 地図表示と位置情報
- **Google Sheets API**: レストランデータ取得
- **Google Analytics**: ユーザー行動分析

### データソース

```typescript
// レストランデータの取得
import { useRestaurants } from '@/hooks/api/useRestaurants';

const RestaurantPage = () => {
  const {
    restaurants,
    loading,
    error,
    refetch
  } = useRestaurants();

  // コンポーネント実装
};
```text

## 📚 関連ドキュメント

- [FilterPanel詳細ドキュメント](README.md)
- [地図コンポーネント](../map/README.md)
- [アクセシビリティコンポーネント](README.md)
- [レストランデータ型定義](../../types/restaurant.types.ts)
- [レストランAPI フック](../../hooks/api/useRestaurants.ts)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [TypeScript](https://www.typescriptlang.org/docs/)
````
