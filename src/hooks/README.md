# 🪝 Custom Hooks Guide

> **目的**: 佐渡飲食店マップアプリケーションのカスタム Hooks 設計・使用ガイド  
> **更新日**: 2025 年 8 月 8 日

## 📁 ディレクトリ構造

```text
hooks/
├── api/                    # API関連hooks (将来実装)
├── ui/                     # UI状態管理hooks (将来実装)
├── map/                    # 地図関連hooks (将来実装)
├── useAnalytics.ts         # Google Analytics管理
├── useErrorHandler.ts      # エラーハンドリング
├── useMapPoints.ts         # 地図ポイント管理
├── useRestaurants.ts       # 飲食店データ管理
└── index.ts               # barrel export
```

## 🎯 設計原則

### 1. **単一責任原則**

各 Hook は 1 つの明確な責任を持つ

```typescript
// ✅ 良い例: 特定の機能に特化
const useRestaurants = () => {
  // 飲食店データの取得・管理のみ
};

// ❌ 悪い例: 複数の責任
const useAppData = () => {
  // 飲食店、地図、ユーザー設定を全て管理
};
```

### 2. **型安全性**

```typescript
// 厳格な型定義
interface UseRestaurantsReturn {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useRestaurants = (): UseRestaurantsReturn => {
  // 実装
};
```

### 3. **再利用性**

```typescript
// 汎用的なパラメータ化
const useLocalStorage = <T>(key: string, initialValue: T) => {
  // 型安全なlocalStorage管理
};
```

## 📚 既存 Hooks 詳細

### **useRestaurants.ts**

飲食店データの取得・管理を担当

```typescript
interface UseRestaurantsOptions {
  autoFetch?: boolean;
  cacheKey?: string;
}

const useRestaurants = (options: UseRestaurantsOptions = {}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    // Google Sheets APIからデータ取得
  }, []);

  return { restaurants, loading, error, fetchRestaurants };
};
```

**使用例:**

```typescript
const RestaurantApp = () => {
  const { restaurants, loading, error } = useRestaurants({ autoFetch: true });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <RestaurantList restaurants={restaurants} />;
};
```

### **useMapPoints.ts**

地図ポイントデータの変換・管理

```typescript
const useMapPoints = (restaurants: Restaurant[]) => {
  const mapPoints = useMemo(
    () =>
      restaurants.map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        position: restaurant.coordinates,
        type: "restaurant" as const,
        data: restaurant,
      })),
    [restaurants]
  );

  return { mapPoints };
};
```

### **useAnalytics.ts**

Google Analytics 連携

```typescript
const useAnalytics = () => {
  const trackEvent = useCallback((action: string, label?: string) => {
    if (typeof gtag !== "undefined") {
      gtag("event", action, { event_label: label });
    }
  }, []);

  return { trackEvent };
};
```

### **useErrorHandler.ts**

統一的なエラーハンドリング

```typescript
const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: unknown) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    setError(errorObj);
    console.error("Error handled:", errorObj);
  }, []);

  return { error, handleError, clearError: () => setError(null) };
};
```

## 🛠️ カスタム Hook 作成ガイド

### **1. 基本テンプレート**

```typescript
import { useState, useEffect, useCallback } from "react";

interface UseCustomHookOptions {
  // オプション定義
}

interface UseCustomHookReturn {
  // 戻り値の型定義
}

export const useCustomHook = (
  params: Parameters,
  options: UseCustomHookOptions = {}
): UseCustomHookReturn => {
  const [state, setState] = useState(initialState);

  const method = useCallback(() => {
    // メソッド実装
  }, [dependencies]);

  useEffect(() => {
    // 副作用処理
  }, [dependencies]);

  return {
    state,
    method,
    // その他の戻り値
  };
};
```

### **2. パフォーマンス最適化**

```typescript
// useCallback でメソッドをメモ化
const fetchData = useCallback(async () => {
  // 処理
}, [dependency1, dependency2]);

// useMemo で計算結果をメモ化
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// useEffect の依存配列を最小限に
useEffect(() => {
  // 必要最小限の依存関係のみ
}, [essentialDependency]);
```

### **3. エラーハンドリング**

```typescript
const useDataFetching = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, error, loading, fetchData };
};
```

## 🧪 テスト戦略

### **1. Hook 単体テスト**

```typescript
import { renderHook, act } from "@testing-library/react";
import { useRestaurants } from "./useRestaurants";

describe("useRestaurants", () => {
  test("初期状態が正しい", () => {
    const { result } = renderHook(() => useRestaurants());

    expect(result.current.restaurants).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("データ取得が正常に動作", async () => {
    const { result } = renderHook(() => useRestaurants());

    await act(async () => {
      await result.current.fetchRestaurants();
    });

    expect(result.current.restaurants).toHaveLength(444); // 期待値
    expect(result.current.loading).toBe(false);
  });
});
```

### **2. 統合テスト**

```typescript
test("複数Hookの連携", () => {
  const Component = () => {
    const { restaurants } = useRestaurants();
    const { mapPoints } = useMapPoints(restaurants);

    return <div data-testid="map-points">{mapPoints.length}</div>;
  };

  render(<Component />);

  // 期待される動作をテスト
});
```

## 📦 エクスポート規則

### **Barrel Exports**

```typescript
// hooks/index.ts
export { useRestaurants } from "./useRestaurants";
export { useMapPoints } from "./useMapPoints";
export { useAnalytics } from "./useAnalytics";
export { useErrorHandler } from "./useErrorHandler";

// 型定義もエクスポート
export type {
  UseRestaurantsReturn,
  UseMapPointsReturn,
  UseAnalyticsReturn,
} from "./types";
```

### **使用時**

```typescript
// ✅ 推奨
import { useRestaurants, useMapPoints } from "@/hooks";

// ❌ 非推奨
import { useRestaurants } from "@/hooks/useRestaurants";
```

## 🚀 将来の拡張予定

### **API 関連 (hooks/api/)**

```typescript
// hooks/api/useGoogleSheets.ts
export const useGoogleSheets = (spreadsheetId: string) => {
  // Google Sheets API専用Hook
};

// hooks/api/useGoogleMaps.ts
export const useGoogleMaps = (apiKey: string) => {
  // Google Maps API専用Hook
};
```

### **UI 状態管理 (hooks/ui/)**

```typescript
// hooks/ui/useFilters.ts
export const useFilters = (initialFilters: Filters) => {
  // フィルター状態管理Hook
};

// hooks/ui/useModal.ts
export const useModal = () => {
  // モーダル状態管理Hook
};
```

### **地図関連 (hooks/map/)**

```typescript
// hooks/map/useMapState.ts
export const useMapState = (initialCenter: LatLngLiteral) => {
  // 地図状態管理Hook
};

// hooks/map/useMarkers.ts
export const useMarkers = (points: MapPoint[]) => {
  // マーカー管理Hook
};
```

## 📚 参考資料

- [React Hooks Official Docs](https://react.dev/reference/react/hooks)
- [Custom Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Testing Custom Hooks](https://testing-library.com/docs/react-testing-library/api/#renderhook)
- [Hook Flow Diagram](https://github.com/donavon/hook-flow)

---

**📝 最終更新**: 2025 年 8 月 8 日  
**🔄 次回更新**: 新 Hook 追加時  
**👥 レビュー**: 開発チーム全体
