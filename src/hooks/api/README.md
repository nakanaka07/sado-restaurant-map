# src/hooks/api - API関連フック

佐渡島レストランマップアプリケーションのAPI関連カスタムフック群を管理するディレクトリです。外部APIとの通信、データ取得、キャッシュ管理を担当します。

## 📁 ディレクトリ構成

```text
src/hooks/api/
├── index.ts                    # バレルエクスポート
├── useRestaurants.ts          # レストランデータ管理フック
└── useRestaurants.test.ts     # useRestaurantsテストファイル
```text

## 🎯 概要

このディレクトリは、アプリケーションの外部API通信を担当するフック群を提供します。現在は主にGoogle Sheets APIを使用したレストランデータの取得・管理を行っています。

### 主要な責務

- **データ取得**: 外部APIからのデータフェッチング
- **キャッシュ管理**: ローカルストレージを活用した効率的なデータキャッシュ
- **状態管理**: 非同期データの状態（ローディング、エラー、成功）管理
- **フィルタリング**: 取得したデータのリアルタイムフィルタリング
- **パフォーマンス最適化**: React 19のConcurrent Featuresを活用

## 🔧 主要フック

### useRestaurants

レストランデータの包括的な管理を行うメインフックです。

#### 基本的な使用方法

```typescript
import { useRestaurants } from '@/hooks/api';

function RestaurantList() {
  const {
    restaurants,
    filteredRestaurants,
    loading,
    error,
    filters,
    setFilters,
    selectedRestaurant,
    setSelectedRestaurant,
    refreshData
  } = useRestaurants();

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return (
    <div>
      {filteredRestaurants.map(restaurant => (
        <RestaurantCard 
          key={restaurant.id} 
          restaurant={restaurant}
          onClick={() => setSelectedRestaurant(restaurant)}
        />
      ))}
    </div>
  );
}
```text

#### 初期フィルター付きの使用

```typescript
function FilteredRestaurantMap() {
  const initialFilters = {
    cuisineTypes: ['和食', 'イタリアン'],
    priceRanges: ['¥¥'],
    districts: ['両津市'],
    features: ['駐車場あり', 'テラス席'],
    searchQuery: ''
  };

  const { 
    filteredRestaurants, 
    filters, 
    setFilters 
  } = useRestaurants(initialFilters);

  return (
    <div>
      <FilterPanel 
        filters={filters}
        onFiltersChange={setFilters}
      />
      <RestaurantGrid restaurants={filteredRestaurants} />
    </div>
  );
}
```text

#### 高度な使用例

```typescript
function AdvancedRestaurantManager() {
  const {
    restaurants,
    filteredRestaurants,
    loading,
    error,
    filters,
    setFilters,
    selectedRestaurant,
    setSelectedRestaurant,
    refreshData,
    clearCache
  } = useRestaurants();

  // 検索機能
  const handleSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, [setFilters]);

  // フィルターリセット
  const handleResetFilters = useCallback(() => {
    setFilters({
      cuisineTypes: [],
      priceRanges: [],
      districts: [],
      features: [],
      searchQuery: ''
    });
  }, [setFilters]);

  // データ更新
  const handleRefresh = useCallback(async () => {
    try {
      await refreshData();
      console.log('データが更新されました');
    } catch (error) {
      console.error('更新に失敗しました:', error);
    }
  }, [refreshData]);

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <FilterControls 
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleResetFilters}
      />
      <RefreshButton onClick={handleRefresh} loading={loading} />
      
      {error && <ErrorMessage error={error} />}
      
      <RestaurantList 
        restaurants={filteredRestaurants}
        selectedRestaurant={selectedRestaurant}
        onRestaurantSelect={setSelectedRestaurant}
      />
    </div>
  );
}
```text

## 📊 型定義

### MapFilters

```typescript
interface MapFilters {
  cuisineTypes: CuisineType[];
  priceRanges: PriceRange[];
  districts: District[];
  features: Feature[];
  searchQuery: string;
}
```text

### UseRestaurantsResult

```typescript
interface UseRestaurantsResult {
  restaurants: Restaurant[];
  filteredRestaurants: Restaurant[];
  loading: boolean;
  error: Error | null;
  filters: MapFilters;
  setFilters: (filters: MapFilters | ((prev: MapFilters) => MapFilters)) => void;
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  refreshData: () => Promise<void>;
  clearCache: () => void;
}
```text

### Restaurant

```typescript
interface Restaurant {
  id: string;
  name: string;
  cuisineType: CuisineType;
  priceRange: PriceRange;
  district: District;
  address: string;
  phone?: string;
  website?: string;
  features: Feature[];
  rating?: number;
  reviewCount?: number;
  openingHours?: OpeningHours;
  coordinates: {
    lat: number;
    lng: number;
  };
  images?: string[];
  description?: string;
  lastUpdated: Date;
}
```text

## 🏗️ アーキテクチャ

### データフロー

```text
Google Sheets API → useRestaurants → キャッシュ → フィルタリング → UI
                                  ↓
                            ローカルストレージ
```text

### 状態管理パターン

```typescript
// 1. 初期状態
const [state, setState] = useState<AsyncState<Restaurant[]>>({
  data: null,
  loading: true,
  error: null
});

// 2. データ取得
const fetchData = useCallback(async () => {
  startTransition(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
  });

  try {
    const data = await fetchRestaurants();
    setState({ data, loading: false, error: null });
  } catch (error) {
    setState(prev => ({ 
      ...prev, 
      loading: false, 
      error: error as Error 
    }));
  }
}, []);

// 3. フィルタリング
const filteredData = useMemo(() => {
  if (!state.data) return [];
  return applyFilters(state.data, filters);
}, [state.data, filters]);
```text

### キャッシュ戦略

```typescript
// キャッシュキー生成
const getCacheKey = (type: string) => `sado-restaurant-${type}`;

// キャッシュ保存
const saveToCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    }));
  } catch (error) {
    console.warn('キャッシュ保存に失敗:', error);
  }
};

// キャッシュ取得
const getFromCache = (key: string, maxAge: number = CACHE_DURATION) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp, version } = JSON.parse(cached);
    
    if (version !== CACHE_VERSION) return null;
    if (Date.now() - timestamp > maxAge) return null;
    
    return data;
  } catch (error) {
    console.warn('キャッシュ取得に失敗:', error);
    return null;
  }
};
```text

## 🧪 テスト

### テストファイル構成

- `useRestaurants.test.ts`: useRestaurantsフックの包括的テスト

### テスト戦略

#### 1. 基本機能テスト

```typescript
describe('useRestaurants - 基本機能', () => {
  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useRestaurants());
    
    expect(result.current.restaurants).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('データ取得が正常に動作する', async () => {
    const mockData = [createMockRestaurant()];
    vi.mocked(fetchRestaurants).mockResolvedValue(mockData);

    const { result } = renderHook(() => useRestaurants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.restaurants).toEqual(mockData);
  });
});
```text

#### 2. フィルタリングテスト

```typescript
describe('useRestaurants - フィルタリング', () => {
  it('料理タイプでフィルタリングできる', async () => {
    const mockRestaurants = [
      createMockRestaurant({ cuisineType: '和食' }),
      createMockRestaurant({ cuisineType: 'イタリアン' })
    ];

    const { result } = renderHook(() => useRestaurants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({
        cuisineTypes: ['和食'],
        priceRanges: [],
        districts: [],
        features: [],
        searchQuery: ''
      });
    });

    expect(result.current.filteredRestaurants).toHaveLength(1);
    expect(result.current.filteredRestaurants[0].cuisineType).toBe('和食');
  });
});
```text

#### 3. キャッシュテスト

```typescript
describe('useRestaurants - キャッシュ', () => {
  it('データがキャッシュされる', async () => {
    const mockData = [createMockRestaurant()];
    vi.mocked(fetchRestaurants).mockResolvedValue(mockData);

    renderHook(() => useRestaurants());

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('restaurants'),
        expect.any(String)
      );
    });
  });

  it('キャッシュからデータを読み込む', () => {
    const cachedData = [createMockRestaurant()];
    localStorage.setItem(
      'sado-restaurant-restaurants',
      JSON.stringify({
        data: cachedData,
        timestamp: Date.now(),
        version: '1.0.0'
      })
    );

    const { result } = renderHook(() => useRestaurants());

    expect(result.current.restaurants).toEqual(cachedData);
    expect(result.current.loading).toBe(false);
  });
});
```text

#### 4. エラーハンドリングテスト

```typescript
describe('useRestaurants - エラーハンドリング', () => {
  it('API エラーを適切に処理する', async () => {
    const mockError = new Error('API Error');
    vi.mocked(fetchRestaurants).mockRejectedValue(mockError);

    const { result } = renderHook(() => useRestaurants());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.restaurants).toEqual([]);
  });
});
```text

### テスト実行

```bash
# 単体テスト実行
npm run test src/hooks/api

# カバレッジ付きテスト
npm run test:coverage src/hooks/api

# ウォッチモード
npm run test:watch src/hooks/api
```text

## 🚀 開発ガイドライン

### 新しいAPIフックの追加

#### 1. フックファイル作成

```typescript
// src/hooks/api/useNewAPI.ts
import { useState, useEffect, useCallback } from 'react';
import { startTransition } from 'react';

interface UseNewAPIResult {
  data: DataType[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useNewAPI(): UseNewAPIResult {
  const [state, setState] = useState<AsyncState<DataType[]>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    startTransition(() => {
      setState(prev => ({ ...prev, loading: true, error: null }));
    });

    try {
      const data = await fetchFromAPI();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchData
  };
}
```text

#### 2. テストファイル作成

```typescript
// src/hooks/api/useNewAPI.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNewAPI } from './useNewAPI';

describe('useNewAPI', () => {
  it('データを正常に取得する', async () => {
    const { result } = renderHook(() => useNewAPI());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});
```text

#### 3. バレルエクスポート更新

```typescript
// src/hooks/api/index.ts
export { useRestaurants } from "./useRestaurants";
export { useNewAPI } from "./useNewAPI";
```text

### 命名規則

- **フック名**: `use` + `API名` + `機能` (例: `useRestaurants`, `useGoogleMaps`)
- **ファイル名**: フック名と同じ (例: `useRestaurants.ts`)
- **テストファイル名**: フック名 + `.test.ts` (例: `useRestaurants.test.ts`)

### パフォーマンス最適化

#### 1. React 19 Concurrent Features

```typescript
import { startTransition } from 'react';

// 非ブロッキング更新
const updateState = (newData: DataType[]) => {
  startTransition(() => {
    setState({ data: newData, loading: false, error: null });
  });
};
```text

#### 2. メモ化の活用

```typescript
// フィルタリング結果のメモ化
const filteredData = useMemo(() => {
  if (!data) return [];
  return applyFilters(data, filters);
}, [data, filters]);

// コールバックのメモ化
const handleRefresh = useCallback(async () => {
  await fetchData();
}, [fetchData]);
```text

#### 3. キャッシュ戦略

```typescript
// キャッシュ有効期限設定
const CACHE_DURATION = 5 * 60 * 1000; // 5分

// キャッシュバージョン管理
const CACHE_VERSION = '1.0.0';

// キャッシュ無効化
const invalidateCache = (key: string) => {
  localStorage.removeItem(key);
};
```text

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. データが取得できない

**症状**: `loading` が `true` のまま変わらない

**原因と解決方法**:

```typescript
// 原因: API キーが設定されていない
// 解決: 環境変数を確認
console.log('API Key:', import.meta.env.VITE_GOOGLE_SHEETS_API_KEY);

// 原因: ネットワークエラー
// 解決: エラーハンドリングを確認
useEffect(() => {
  fetchData().catch(error => {
    console.error('データ取得エラー:', error);
  });
}, []);
```text

#### 2. フィルタリングが動作しない

**症状**: フィルターを変更しても結果が変わらない

**原因と解決方法**:

```typescript
// 原因: 依存配列が正しくない
const filteredData = useMemo(() => {
  return applyFilters(data, filters);
}, [data, filters]); // filtersを依存配列に含める

// 原因: フィルター条件が正しくない
const applyFilters = (data: Restaurant[], filters: MapFilters) => {
  console.log('フィルター適用:', { data: data.length, filters });
  return data.filter(restaurant => {
    // フィルター条件をログ出力
    const matches = matchesFilters(restaurant, filters);
    console.log(`${restaurant.name}: ${matches}`);
    return matches;
  });
};
```text

#### 3. キャッシュが効かない

**症状**: 毎回APIからデータを取得している

**原因と解決方法**:

```typescript
// 原因: localStorage が利用できない
const isLocalStorageAvailable = () => {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// 原因: キャッシュキーが一致しない
const CACHE_KEY = 'sado-restaurant-restaurants'; // 一貫したキーを使用
```text

#### 4. メモリリークの発生

**症状**: アプリケーションが重くなる

**原因と解決方法**:

```typescript
// 原因: useEffectのクリーンアップが不適切
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal).catch(error => {
    if (error.name !== 'AbortError') {
      console.error(error);
    }
  });

  return () => {
    controller.abort(); // クリーンアップ
  };
}, []);
```text

### デバッグ方法

#### 1. 開発者ツールでの確認

```typescript
// デバッグ情報の出力
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.group('useRestaurants Debug');
    console.log('State:', { restaurants, loading, error });
    console.log('Filters:', filters);
    console.log('Filtered Count:', filteredRestaurants.length);
    console.groupEnd();
  }
}, [restaurants, loading, error, filters, filteredRestaurants]);
```text

#### 2. React Developer Tools

```typescript
// カスタムフック名の設定
useDebugValue(
  loading ? 'Loading...' : `${restaurants.length} restaurants loaded`
);
```text

#### 3. パフォーマンス監視

```typescript
// レンダリング回数の監視
const renderCount = useRef(0);
renderCount.current++;

useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`useRestaurants rendered ${renderCount.current} times`);
  }
});
```text

## 📈 パフォーマンス監視

### メトリクス

- **データ取得時間**: API レスポンス時間
- **フィルタリング時間**: 大量データでの処理時間
- **メモリ使用量**: キャッシュサイズとメモリ効率
- **レンダリング回数**: 不要な再レンダリングの検出

### 監視コード例

```typescript
const usePerformanceMonitoring = () => {
  const startTime = useRef<number>();
  
  const startMeasure = (label: string) => {
    startTime.current = performance.now();
    console.time(label);
  };
  
  const endMeasure = (label: string) => {
    console.timeEnd(label);
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }
  };
  
  return { startMeasure, endMeasure };
};
```text

## 🚀 今後の改善予定

### 短期的な改善

- [ ] GraphQL対応の検討
- [ ] リアルタイム更新機能の追加
- [ ] オフライン対応の強化

### 中期的な改善

- [ ] WebSocket統合
- [ ] 高度なキャッシュ戦略
- [ ] バックグラウンド同期

### 長期的な改善

- [ ] AI機能統合
- [ ] マルチテナント対応
- [ ] エッジコンピューティング対応

## 📚 関連ドキュメント

- [Google Sheets API ドキュメント](https://developers.google.com/sheets/api)
- [React 19 ドキュメント](https://react.dev/)
- [TypeScript ハンドブック](https://www.typescriptlang.org/docs/)
- [Vitest ドキュメント](https://vitest.dev/)
- [Testing Library ドキュメント](https://testing-library.com/)

## 🔗 関連ファイル

- `src/hooks/README.md` - フック全体の概要
- `src/hooks/map/README.md` - 地図関連フック
- `src/hooks/ui/README.md` - UI関連フック
- `src/types/restaurant.ts` - レストラン型定義
- `src/services/api.ts` - API サービス層
