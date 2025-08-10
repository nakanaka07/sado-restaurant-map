# FilterPanel Directory

このディレクトリには、佐渡島レストランマップアプリケーションのフィルタリング機能に関連するすべてのコンポーネントが含まれています。レストランや地図ポイントの検索・絞り込み・ソート機能を提供し、ユーザーが効率的に目的の情報を見つけられるようにします。

## 📁 ディレクトリ構成

```
src/components/restaurant/FilterPanel/
├── FilterPanel.tsx            # メインフィルターパネルコンポーネント
├── useFilterState.ts          # フィルター状態管理カスタムフック
├── SearchFilter.tsx           # 検索フィルター
├── CuisineFilter.tsx          # 料理ジャンルフィルター
├── PriceFilter.tsx            # 価格帯フィルター
├── DistrictFilter.tsx         # 佐渡地区フィルター
├── FeatureFilter.tsx          # 特徴・設備フィルター
├── MapLegend.tsx              # マップ凡例表示
├── index.ts                   # バレルエクスポート
└── README.md                  # このファイル
```

## 🎯 主要コンポーネント

### 1. **FilterPanel** - メインコンポーネント
統合されたフィルターパネルの中核コンポーネント。すべてのフィルター機能を統合し、レスポンシブなUIを提供します。

```typescript
interface FilterPanelProps extends FilterHandlers {
  readonly loading?: boolean;
  readonly resultCount?: number;
}
```

### 2. **useFilterState** - 状態管理フック
フィルター状態の管理とイベントハンドリングを担当するカスタムフック。型安全性とパフォーマンスを重視した設計です。

```typescript
interface FilterState {
  searchQuery: string;
  selectedCuisine: CuisineType | "";
  selectedPrice: PriceRange | "";
  selectedDistricts: SadoDistrict[];
  selectedRating: number | undefined;
  openNow: boolean;
  selectedSort: SortOrder;
  selectedFeatures: string[];
  selectedPointTypes: MapPointType[];
  isExpanded: boolean;
}
```

## 🔧 フィルターコンポーネント

### SearchFilter - 検索フィルター
レストラン名や説明文での自由検索機能を提供

```tsx
interface SearchFilterProps {
  readonly value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly placeholder?: string;
}

// 使用例
<SearchFilter
  value={searchQuery}
  onChange={handleSearchChange}
  placeholder="レストラン名で検索..."
/>
```

### CuisineFilter - 料理ジャンルフィルター
18種類の料理ジャンルによる絞り込み機能

```tsx
const CUISINE_OPTIONS = [
  "日本料理", "寿司", "海鮮", "焼肉・焼鳥", "ラーメン",
  "そば・うどん", "中華", "イタリアン", "フレンチ",
  "カフェ・喫茶店", "バー・居酒屋", "ファストフード",
  "デザート・スイーツ", "カレー・エスニック", "ステーキ・洋食",
  "弁当・テイクアウト", "レストラン", "その他"
];

// 使用例
<CuisineFilter
  value={selectedCuisine}
  onChange={handleCuisineChange}
/>
```

### PriceFilter - 価格帯フィルター
4段階の価格帯による絞り込み機能

```tsx
const PRICE_OPTIONS = [
  "～1000円",
  "1000-2000円", 
  "2000-3000円",
  "3000円～"
];

// 使用例
<PriceFilter
  value={selectedPrice}
  onChange={handlePriceChange}
/>
```

### DistrictFilter - 佐渡地区フィルター
佐渡島の11地区による複数選択フィルター

```tsx
const DISTRICTS = [
  "両津", "相川", "佐和田", "金井", "新穂",
  "畑野", "真野", "小木", "羽茂", "赤泊", "その他"
];

interface DistrictFilterProps {
  readonly selectedDistricts: SadoDistrict[];
  onToggle: (district: SadoDistrict) => void;
  readonly isExpanded: boolean;
  onToggleExpanded: () => void;
}

// 使用例
<DistrictFilter
  selectedDistricts={selectedDistricts}
  onToggle={handleDistrictToggle}
  isExpanded={isDistrictExpanded}
  onToggleExpanded={toggleDistrictExpanded}
/>
```

### FeatureFilter - 特徴・設備フィルター
30種類以上の特徴・設備による複数選択フィルター

```tsx
const AVAILABLE_FEATURES = [
  "駐車場あり", "テラス席", "海が見える", "山が見える",
  "個室あり", "カウンター席", "座敷", "禁煙", "分煙",
  "Wi-Fi", "電源コンセント", "クレジットカード対応",
  "PayPay対応", "テイクアウト可能", "デリバリー対応",
  "予約可能", "24時間営業", "深夜営業", "朝食営業",
  "ランチ営業", "ディナー営業", "バリアフリー",
  "子供連れ歓迎", "ペット同伴可", "団体対応", "貸切可能",
  "ライブ・イベント", "カラオケ", "ビアガーデン", "BBQ可能"
];

interface FeatureFilterProps {
  readonly selectedFeatures: string[];
  onToggle: (feature: string) => void;
  readonly isExpanded: boolean;
  onToggleExpanded: () => void;
}

// 使用例
<FeatureFilter
  selectedFeatures={selectedFeatures}
  onToggle={handleFeatureToggle}
  isExpanded={isFeatureExpanded}
  onToggleExpanded={toggleFeatureExpanded}
/>
```

### MapLegend - マップ凡例
地図マーカーの色分けと意味を説明する凡例コンポーネント

```tsx
interface MapLegendProps {
  readonly isExpanded: boolean;
  onToggleExpanded: () => void;
}

// 使用例
<MapLegend
  isExpanded={isLegendExpanded}
  onToggleExpanded={toggleLegendExpanded}
/>
```

## 🎨 使用方法

### 基本的なインポート
```typescript
// メインコンポーネント
import { FilterPanel } from '@/components/restaurant/FilterPanel';

// 個別コンポーネント
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
import type { FilterHandlers } from '@/components/restaurant/FilterPanel';
```

### FilterPanel の基本使用
```tsx
import { FilterPanel } from '@/components/restaurant/FilterPanel';
import type { FilterHandlers } from '@/components/restaurant/FilterPanel';

const RestaurantPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  const filterHandlers: FilterHandlers = {
    onCuisineFilter: (cuisine) => {
      // 料理ジャンルフィルター処理
      console.log('Cuisine filter:', cuisine);
    },
    onPriceFilter: (price) => {
      // 価格帯フィルター処理
      console.log('Price filter:', price);
    },
    onDistrictFilter: (districts) => {
      // 地区フィルター処理
      console.log('District filter:', districts);
    },
    onSearchFilter: (search) => {
      // 検索フィルター処理
      console.log('Search filter:', search);
    },
    onFeatureFilter: (features) => {
      // 特徴フィルター処理
      console.log('Feature filter:', features);
    },
    onResetFilters: () => {
      // フィルターリセット処理
      console.log('Reset filters');
    },
  };

  return (
    <div style={{ display: 'flex' }}>
      <FilterPanel
        {...filterHandlers}
        loading={loading}
        resultCount={restaurants.length}
      />
      <div style={{ flex: 1 }}>
        {/* メインコンテンツ */}
      </div>
    </div>
  );
};
```

### カスタムフィルター実装
```tsx
import { useFilterState } from '@/components/restaurant/FilterPanel';
import type { FilterHandlers } from '@/components/restaurant/FilterPanel';

const CustomFilterComponent = () => {
  const filterHandlers: FilterHandlers = {
    onCuisineFilter: (cuisine) => {
      // カスタム処理
    },
    // その他のハンドラー
  };

  const filterState = useFilterState(filterHandlers);

  return (
    <div>
      <h3>カスタムフィルター</h3>
      <p>検索クエリ: {filterState.searchQuery}</p>
      <p>選択された料理: {filterState.selectedCuisine}</p>
      <p>選択された地区: {filterState.selectedDistricts.join(', ')}</p>
      
      <button onClick={filterState.handleResetFilters}>
        フィルターをリセット
      </button>
    </div>
  );
};
```

## 🏗️ アーキテクチャ

### 設計原則

1. **コンポーネント分離**
   - 各フィルターを独立したコンポーネントとして分離
   - 単一責任の原則に基づく設計
   - 再利用可能なコンポーネント構造

2. **状態管理の統一**
   - `useFilterState`フックによる中央集権的な状態管理
   - 型安全なイベントハンドラー
   - immutableな状態更新

3. **パフォーマンス最適化**
   - `memo`による不要な再レンダリング防止
   - `useCallback`によるイベントハンドラーの最適化
   - `useMemo`による計算結果のキャッシュ

4. **アクセシビリティ**
   - セマンティックなHTML要素の使用
   - 適切なARIA属性の設定
   - キーボードナビゲーション対応

### データフロー
```
Parent Component
    ↓ (FilterHandlers)
FilterPanel
    ↓ (state & handlers)
useFilterState Hook
    ↓ (individual handlers)
Individual Filter Components
    ↓ (user interactions)
Analytics Tracking
```

### 状態管理パターン
```typescript
// 状態の初期化
const initialState: FilterState = {
  searchQuery: "",
  selectedCuisine: "",
  selectedPrice: "",
  selectedDistricts: [],
  selectedRating: undefined,
  openNow: false,
  selectedSort: "relevance",
  selectedFeatures: [],
  selectedPointTypes: ["restaurant"],
  isExpanded: false,
};

// 状態更新パターン
const updateState = useCallback((updates: Partial<FilterState>) => {
  setState(prevState => ({
    ...prevState,
    ...updates,
  }));
}, []);
```

## 🔧 開発ガイドライン

### 新しいフィルターの追加

1. **フィルターコンポーネントの作成**
```typescript
// NewFilter.tsx
import { memo } from 'react';

interface NewFilterProps {
  readonly value: string;
  onChange: (value: string) => void;
}

export const NewFilter = memo<NewFilterProps>(function NewFilter({
  value,
  onChange,
}) {
  return (
    <div className="filter-section">
      <label className="filter-label">
        新しいフィルター
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">すべて</option>
        {/* オプション */}
      </select>
    </div>
  );
});
```

2. **状態管理の拡張**
```typescript
// useFilterState.ts に追加
export interface FilterState {
  // 既存の状態...
  newFilterValue: string;
}

export interface FilterHandlers {
  // 既存のハンドラー...
  readonly onNewFilter?: (value: string) => void;
}
```

3. **FilterPanelへの統合**
```typescript
// FilterPanel.tsx に追加
import { NewFilter } from './NewFilter';

// JSX内に追加
<NewFilter
  value={filterState.newFilterValue}
  onChange={filterState.handleNewFilter}
/>
```

4. **エクスポートの追加**
```typescript
// index.ts に追加
export { NewFilter } from './NewFilter';
```

### カスタムスタイリング
```tsx
// スタイル定数の定義
const FILTER_STYLES = {
  section: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
  },
} as const;

// コンポーネントでの使用
<div style={FILTER_STYLES.section}>
  <label style={FILTER_STYLES.label}>
    フィルターラベル
  </label>
  <select style={FILTER_STYLES.select}>
    {/* オプション */}
  </select>
</div>
```

## 🧪 テスト

### テスト構成
- **Unit Tests**: 個別フィルターコンポーネントのテスト
- **Integration Tests**: FilterPanelとフィルター間の連携テスト
- **Hook Tests**: useFilterStateフックのテスト

### テスト例
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from './FilterPanel';
import type { FilterHandlers } from './useFilterState';

const mockHandlers: FilterHandlers = {
  onCuisineFilter: jest.fn(),
  onPriceFilter: jest.fn(),
  onDistrictFilter: jest.fn(),
  onSearchFilter: jest.fn(),
  onResetFilters: jest.fn(),
};

describe('FilterPanel', () => {
  test('renders all filter components', () => {
    render(<FilterPanel {...mockHandlers} />);
    
    expect(screen.getByPlaceholderText('レストラン名で検索...')).toBeInTheDocument();
    expect(screen.getByLabelText('料理ジャンル')).toBeInTheDocument();
    expect(screen.getByLabelText('価格帯')).toBeInTheDocument();
  });

  test('handles search input', () => {
    render(<FilterPanel {...mockHandlers} />);
    
    const searchInput = screen.getByPlaceholderText('レストラン名で検索...');
    fireEvent.change(searchInput, { target: { value: '寿司' } });
    
    expect(mockHandlers.onSearchFilter).toHaveBeenCalledWith('寿司');
  });

  test('handles cuisine filter change', () => {
    render(<FilterPanel {...mockHandlers} />);
    
    const cuisineSelect = screen.getByLabelText('料理ジャンル');
    fireEvent.change(cuisineSelect, { target: { value: '日本料理' } });
    
    expect(mockHandlers.onCuisineFilter).toHaveBeenCalledWith('日本料理');
  });

  test('resets filters when reset button clicked', () => {
    render(<FilterPanel {...mockHandlers} />);
    
    const resetButton = screen.getByText('フィルターをリセット');
    fireEvent.click(resetButton);
    
    expect(mockHandlers.onResetFilters).toHaveBeenCalled();
  });
});
```

### フックのテスト
```typescript
import { renderHook, act } from '@testing-library/react';
import { useFilterState } from './useFilterState';
import type { FilterHandlers } from './useFilterState';

describe('useFilterState', () => {
  const mockHandlers: FilterHandlers = {
    onCuisineFilter: jest.fn(),
    onSearchFilter: jest.fn(),
  };

  test('initializes with default state', () => {
    const { result } = renderHook(() => useFilterState(mockHandlers));
    
    expect(result.current.searchQuery).toBe('');
    expect(result.current.selectedCuisine).toBe('');
    expect(result.current.selectedDistricts).toEqual([]);
  });

  test('updates search query', () => {
    const { result } = renderHook(() => useFilterState(mockHandlers));
    
    act(() => {
      const event = { target: { value: '寿司' } } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleSearchChange(event);
    });
    
    expect(result.current.searchQuery).toBe('寿司');
    expect(mockHandlers.onSearchFilter).toHaveBeenCalledWith('寿司');
  });
});
```

## 🔍 トラブルシューティング

### よくある問題

1. **フィルターが反映されない**
   ```typescript
   // イベントハンドラーの確認
   const handleCuisineFilter = useCallback((cuisine: CuisineType | "") => {
     console.log('Cuisine filter called:', cuisine);
     // 実際のフィルタリング処理を確認
   }, []);
   ```

2. **パフォーマンスの問題**
   ```typescript
   // メモ化の確認
   const memoizedOptions = useMemo(() => {
     return CUISINE_OPTIONS.map(option => ({
       value: option,
       label: option,
     }));
   }, []);
   ```

3. **状態の同期問題**
   ```typescript
   // 状態の確認
   useEffect(() => {
     console.log('Filter state updated:', {
       searchQuery,
       selectedCuisine,
       selectedDistricts,
     });
   }, [searchQuery, selectedCuisine, selectedDistricts]);
   ```

### デバッグ方法
```typescript
// デバッグ用のログ出力
const debugFilterState = (state: FilterState) => {
  console.log('Filter Debug Info:', {
    activeFilters: Object.entries(state)
      .filter(([key, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== '' && value !== undefined && value !== false;
      })
      .map(([key, value]) => ({ [key]: value })),
    totalActiveFilters: Object.values(state).filter(Boolean).length,
  });
};

// パフォーマンス監視
const measureFilterPerformance = () => {
  console.time('Filter Render');
  // フィルター処理
  console.timeEnd('Filter Render');
};
```

## 🚀 今後の改善予定

### 短期的な改善
- [ ] フィルター履歴機能の追加
- [ ] 保存されたフィルター設定
- [ ] フィルター結果のエクスポート機能

### 長期的な改善
- [ ] AI による推奨フィルター
- [ ] 地理的範囲フィルター
- [ ] リアルタイム営業状況フィルター

## 📚 関連ドキュメント

- [レストランコンポーネント全体](../README.md)
- [地図コンポーネント](../../map/README.md)
- [アクセシビリティコンポーネント](../../common/README.md)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [React Hooks](https://reactjs.org/docs/hooks-intro.html)
