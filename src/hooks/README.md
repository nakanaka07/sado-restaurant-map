# Hooks Directory

> 🎯 **目的**: React 19.1 カスタムフックアーキテクチャ
> **対象**: フロントエンド開発者・フック設計者
> **最終更新**: 2025 年 8 月 30 日

このディレクトリには、佐渡島レストランマップアプリケーションで使用されるすべてのカスタムフックが含まれています。React 19 の最新機能（Concurrent Features、startTransition 等）を活用し、型安全で再利用可能なロジックを提供します。

## 📁 ディレクトリ構成

````text
src/hooks/
├── api/                       # API関連フック
│   ├── useRestaurants.ts     # レストランデータ管理フック
│   ├── useRestaurants.test.ts # テストファイル
│   └── index.ts              # バレルエクスポート
├── map/                      # 地図関連フック
│   ├── useMapPoints.ts       # 統合マップポイント管理フック
│   ├── useMapPoints.test.ts  # テストファイル
│   └── index.ts              # バレルエクスポート
├── ui/                       # UI関連フック
│   ├── useAnalytics.ts       # アナリティクス追跡フック
│   ├── useErrorHandler.ts    # エラーハンドリングフック
│   ├── useErrorHandler.test.ts # テストファイル
│   └── index.ts              # バレルエクスポート
├── useAnalytics.ts           # レガシーファイル（ui/useAnalytics.tsを使用）
├── useMapPoints.ts           # レガシーファイル（map/useMapPoints.tsを使用）
├── useRestaurants.ts         # レガシーファイル（api/useRestaurants.tsを使用）
├── index.ts                  # ディレクトリのバレルエクスポート
└── README.md                 # このファイル
```text

## 🎯 フック分類

### 1. **API フック** (`api/`)

外部APIとの通信、データ取得・管理を担当

### 2. **地図フック** (`map/`)

地図表示、ポイント管理、地理的データ処理を担当

### 3. **UI フック** (`ui/`)

ユーザーインターフェース、アナリティクス、エラーハンドリングを担当

## 🔧 主要フック詳細

### useRestaurants - レストランデータ管理

レストラン情報の取得、フィルタリング、ソート機能を提供する統合フック

```typescript
interface UseRestaurantsResult {
  readonly restaurants: readonly Restaurant[];
  readonly filteredRestaurants: readonly Restaurant[];
  readonly selectedRestaurant: Restaurant | null;
  readonly asyncState: AsyncState<readonly Restaurant[]>;
  readonly setFilters: (filters: Partial<MapFilters>) => void;
  readonly setSortOrder: (order: SortOrder) => void;
  readonly selectRestaurant: (restaurant: Restaurant | null) => void;
  readonly refreshData: () => Promise<void>;
}

// 使用例
const {
  restaurants,
  filteredRestaurants,
  selectedRestaurant,
  asyncState,
  setFilters,
  setSortOrder,
  selectRestaurant,
  refreshData,
} = useRestaurants({
  cuisineTypes: ["日本料理"],
  priceRanges: ["2000-3000円"],
  districts: ["両津"],
  features: ["駐車場あり"],
  searchQuery: "",
});
```text

**主要機能**:

- **データ取得**: Google Sheets APIからレストランデータを取得
- **フィルタリング**: 料理ジャンル、価格帯、地区、特徴による絞り込み
- **検索**: 名前・説明文での自由検索
- **ソート**: 名前、評価、距離、価格による並び替え
- **状態管理**: 選択されたレストランの管理
- **キャッシュ**: データの効率的なキャッシュ機能
- **エラーハンドリング**: API エラーの適切な処理

### useMapPoints - 統合マップポイント管理

レストラン、駐車場、トイレなど全てのマップポイントを統合管理

```typescript
interface UseMapPointsResult {
  readonly points: readonly MapPoint[];
  readonly filteredPoints: readonly MapPoint[];
  readonly selectedPoint: MapPoint | null;
  readonly asyncState: AsyncState<MapPoint[]>;
  readonly setFilters: (filters: Partial<ExtendedMapFilters>) => void;
  readonly setSortOrder: (order: SortOrder) => void;
  readonly selectPoint: (point: MapPoint | null) => void;
  readonly refreshData: () => Promise<void>;
}

// 使用例
const {
  points,
  filteredPoints,
  selectedPoint,
  asyncState,
  setFilters,
  setSortOrder,
  selectPoint,
  refreshData,
} = useMapPoints();
```text

**主要機能**:

- **統合データ管理**: レストラン・駐車場・トイレの統合管理
- **多次元フィルタリング**: ポイントタイプ、地区、特徴による絞り込み
- **地理的計算**: 距離計算、範囲検索
- **パフォーマンス最適化**: React 19のConcurrent Featuresを活用
- **型安全性**: 厳密な型定義による安全性確保

### useAnalytics - アナリティクス追跡

ユーザー行動の追跡とGoogle Analyticsとの統合

```typescript
interface UseAnalyticsResult {
  readonly trackRestaurantView: (restaurant: Restaurant) => void;
  readonly trackSearchBehavior: (query: string, resultCount: number) => void;
  readonly trackFilterUsage: (filterType: string, value: string) => void;
  readonly trackMapUsage: (action: "zoom" | "pan" | "marker_click") => void;
  readonly trackPWAEvents: (action: "install" | "standalone_mode") => void;
  readonly trackPageView: (pageName: string) => void;
  readonly trackCustomEvent: (eventName: string, parameters?: Record<string, any>) => void;
}

// 使用例
const {
  trackRestaurantView,
  trackSearchBehavior,
  trackFilterUsage,
  trackMapUsage,
  trackPWAEvents,
  trackPageView,
  trackCustomEvent,
} = useAnalytics();

// レストラン表示追跡
trackRestaurantView(restaurant);

// 検索行動追跡
trackSearchBehavior("寿司", 15);

// フィルター使用追跡
trackFilterUsage("cuisine", "日本料理");
```text

**主要機能**:

- **レストラン追跡**: レストラン詳細表示の追跡
- **検索追跡**: 検索クエリと結果数の追跡
- **フィルター追跡**: フィルター使用状況の追跡
- **地図操作追跡**: ズーム、パン、マーカークリックの追跡
- **PWA追跡**: インストール、スタンドアローンモードの追跡
- **カスタムイベント**: 任意のイベント追跡

### useErrorHandler - エラーハンドリング

アプリケーション全体のエラー管理と報告

```typescript
interface UseErrorHandlerResult {
  readonly error: ErrorState | null;
  readonly errorHistory: ErrorState[];
  readonly handleError: (details: ErrorDetails) => void;
  readonly clearError: () => void;
  readonly clearErrorHistory: () => void;
  readonly retryLastAction: () => void;
}

// 使用例
const {
  error,
  errorHistory,
  handleError,
  clearError,
  clearErrorHistory,
  retryLastAction,
} = useErrorHandler();

// エラーハンドリング
try {
  await fetchData();
} catch (err) {
  handleError({
    error: err as Error,
    context: "データ取得",
    severity: "high",
    metadata: { userId: user.id, timestamp: Date.now() },
  });
}
```text

**主要機能**:

- **エラー状態管理**: エラー情報の構造化された管理
- **エラー履歴**: 過去のエラー履歴の保持
- **重要度分類**: エラーの重要度による分類
- **コンテキスト情報**: エラー発生箇所の詳細情報
- **開発支援**: 開発環境での詳細ログ出力
- **本番対応**: 本番環境でのエラー報告サービス統合準備

## 🎨 使用方法

### 基本的なインポート

```typescript
// 統一エクスポートからのインポート（推奨）
import {
  useRestaurants,
  useMapPoints,
  useAnalytics,
  useErrorHandler,
} from '@/hooks';

// 個別インポート
import { useRestaurants } from '@/hooks/api/useRestaurants';
import { useMapPoints } from '@/hooks/map/useMapPoints';
import { useAnalytics } from '@/hooks/ui/useAnalytics';
import { useErrorHandler } from '@/hooks/ui/useErrorHandler';
```text

### 統合使用例

```tsx
import React, { useEffect } from 'react';
import {
  useRestaurants,
  useMapPoints,
  useAnalytics,
  useErrorHandler,
} from '@/hooks';

const RestaurantMapPage = () => {
  // フック初期化
  const {
    restaurants,
    filteredRestaurants,
    selectedRestaurant,
    asyncState: restaurantState,
    setFilters,
    selectRestaurant,
  } = useRestaurants();

  const {
    points,
    filteredPoints,
    asyncState: pointsState,
  } = useMapPoints();

  const {
    trackPageView,
    trackRestaurantView,
    trackFilterUsage,
  } = useAnalytics();

  const {
    error,
    handleError,
    clearError,
  } = useErrorHandler();

  // ページビュー追跡
  useEffect(() => {
    trackPageView('レストランマップ');
  }, [trackPageView]);

  // エラーハンドリング
  useEffect(() => {
    if (restaurantState.error) {
      handleError({
        error: restaurantState.error,
        context: 'レストランデータ取得',
        severity: 'high',
      });
    }
  }, [restaurantState.error, handleError]);

  // レストラン選択時の追跡
  const handleRestaurantSelect = (restaurant: Restaurant) => {
    selectRestaurant(restaurant);
    trackRestaurantView(restaurant);
  };

  // フィルター変更時の追跡
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters({ [filterType]: value });
    trackFilterUsage(filterType, value);
  };

  // ローディング状態
  if (restaurantState.loading || pointsState.loading) {
    return <div>読み込み中...</div>;
  }

  // エラー状態
  if (error) {
    return (
      <div>
        <p>エラーが発生しました: {error.message}</p>
        <button onClick={clearError}>エラーをクリア</button>
      </div>
    );
  }

  return (
    <div>
      {/* UI実装 */}
      <h1>佐渡島レストランマップ</h1>
      <p>レストラン数: {filteredRestaurants.length}</p>
      <p>全ポイント数: {filteredPoints.length}</p>

      {selectedRestaurant && (
        <div>
          <h2>{selectedRestaurant.name}</h2>
          <p>{selectedRestaurant.description}</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantMapPage;
```text

## 🏗️ アーキテクチャ

### 設計原則

1. **単一責任の原則**
   - 各フックは特定の責任領域に特化
   - 明確な境界線の維持
   - 再利用可能な設計

1. **型安全性**
   - TypeScript 5.9の厳密な型定義
   - ジェネリクスの積極活用
   - ランタイムエラーの最小化

1. **パフォーマンス最適化**
   - React 19のConcurrent Features活用
   - `startTransition`による非ブロッキング更新
   - `useMemo`、`useCallback`による最適化

1. **テスタビリティ**
   - 純粋関数による実装
   - モック可能な設計
   - 包括的なテストカバレッジ

### データフロー

```text
External APIs (Google Sheets, Maps)
    ↓
API Hooks (useRestaurants, useMapPoints)
    ↓
State Management (useState, useCallback)
    ↓
UI Components
    ↓
User Interactions
    ↓
Analytics Hooks (useAnalytics)
    ↓
Error Handling (useErrorHandler)
```text

### 状態管理パターン

```typescript
// 非同期状態の統一パターン
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// フィルター状態の統一パターン
interface FilterState {
  [key: string]: string | string[] | number | boolean;
}

// イベントハンドラーの統一パターン
type EventHandler<T> = (value: T) => void;
```text

## 🔧 開発ガイドライン

### 新しいフックの作成

1. **フック作成**

```typescript
// hooks/category/useNewHook.ts
import { useState, useCallback, useEffect } from 'react';

interface UseNewHookOptions {
  initialValue?: string;
  onValueChange?: (value: string) => void;
}

interface UseNewHookResult {
  readonly value: string;
  readonly setValue: (value: string) => void;
  readonly reset: () => void;
}

export function useNewHook(options: UseNewHookOptions = {}): UseNewHookResult {
  const { initialValue = '', onValueChange } = options;

  const [value, setValue] = useState(initialValue);

  const handleSetValue = useCallback((newValue: string) => {
    setValue(newValue);
    onValueChange?.(newValue);
  }, [onValueChange]);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    setValue: handleSetValue,
    reset,
  };
}
```text

1. **テスト作成**

```typescript
// hooks/category/useNewHook.test.ts
import { renderHook, act } from '@testing-library/react';
import { useNewHook } from './useNewHook';

describe('useNewHook', () => {
  test('初期値が正しく設定される', () => {
    const { result } = renderHook(() => useNewHook({ initialValue: 'test' }));
    expect(result.current.value).toBe('test');
  });

  test('値の更新が正しく動作する', () => {
    const { result } = renderHook(() => useNewHook());

    act(() => {
      result.current.setValue('new value');
    });

    expect(result.current.value).toBe('new value');
  });

  test('リセット機能が正しく動作する', () => {
    const { result } = renderHook(() => useNewHook({ initialValue: 'initial' }));

    act(() => {
      result.current.setValue('changed');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe('initial');
  });
});
```text

1. **エクスポート追加**

```typescript
// hooks/category/index.ts に追加
export { useNewHook } from './useNewHook';

// hooks/index.ts に追加
export { useNewHook } from './category/useNewHook';
```text

### フックの命名規則

- **プレフィックス**: 必ず `use` で始める
- **機能説明**: フックの主要機能を表現
- **一貫性**: 既存フックとの命名一貫性を保持

### パフォーマンス最適化

```typescript
// React 19のConcurrent Featuresを活用
import { startTransition } from 'react';

const updateData = useCallback((newData: Data[]) => {
  startTransition(() => {
    setData(newData);
  });
}, []);

// メモ化による最適化
const expensiveValue = useMemo(() => {
  return data.filter(item => item.active).sort((a, b) => a.name.localeCompare(b.name));
}, [data]);
```text

## 🧪 テスト

### テスト構成

- **Unit Tests**: 個別フックのロジックテスト
- **Integration Tests**: フック間の連携テスト
- **Performance Tests**: パフォーマンス回帰テスト

### テスト実行

```bash
# 全フックテスト実行
npm test hooks

# 特定カテゴリのテスト
npm test hooks/api
npm test hooks/map
npm test hooks/ui

# カバレッジ付きテスト
npm test hooks -- --coverage

# ウォッチモード
npm test hooks -- --watch
```text

### テストパターン

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRestaurants } from './useRestaurants';

describe('useRestaurants', () => {
  test('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useRestaurants());

    expect(result.current.restaurants).toEqual([]);
    expect(result.current.asyncState.loading).toBe(true);
    expect(result.current.asyncState.error).toBe(null);
  });

  test('フィルター機能が正しく動作する', async () => {
    const { result } = renderHook(() => useRestaurants());

    await waitFor(() => {
      expect(result.current.asyncState.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ cuisineTypes: ['日本料理'] });
    });

    expect(result.current.filteredRestaurants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cuisineType: '日本料理' })
      ])
    );
  });

  test('エラーハンドリングが正しく動作する', async () => {
    // モックでエラーを発生させる
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useRestaurants());

    // エラー状態の確認
    await waitFor(() => {
      expect(result.current.asyncState.error).toBeTruthy();
    });
  });
});
```text

## 🔍 トラブルシューティング

### よくある問題

1. **フックが再レンダリングを引き起こす**

   ```typescript
   // 問題: 依存配列の不適切な設定
   useEffect(() => {
     fetchData();
   }, [data]); // dataが変更されるたびに実行される

   // 解決: 適切な依存配列の設定
   useEffect(() => {
     fetchData();
   }, []); // 初回のみ実行

   // または: useCallbackでの最適化
   const fetchData = useCallback(async () => {
     // データ取得処理
   }, []);
````

1. **非同期処理のメモリリーク**

   ```typescript
   // 問題: コンポーネントアンマウント後の状態更新
   useEffect(() => {
     fetchData().then(setData);
   }, []);

   // 解決: クリーンアップ関数の使用
   useEffect(() => {
     let cancelled = false;

     fetchData().then((data) => {
       if (!cancelled) {
         setData(data);
       }
     });

     return () => {
       cancelled = true;
     };
   }, []);
   ```

1. **型エラーの解決**

   ```typescript
   // 問題: 型の不一致
   const [data, setData] = useState<Restaurant[]>();

   // 解決: 適切な初期値と型定義
   const [data, setData] = useState<Restaurant[]>([]);

   // または: nullableな型定義
   const [data, setData] = useState<Restaurant[] | null>(null);
   ```

### デバッグ方法

````typescript
// デバッグ用のログ出力
const debugHook = (hookName: string, state: any) => {
  if (import.meta.env.DEV) {
    console.group(`🔧 ${hookName} Debug`);
    console.log('State:', state);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

// パフォーマンス監視
const measureHookPerformance = (hookName: string, fn: () => void) => {
  if (import.meta.env.DEV) {
    console.time(`⚡ ${hookName} Performance`);
    fn();
    console.timeEnd(`⚡ ${hookName} Performance`);
  } else {
    fn();
  }
};
```text

## 🚀 今後の改善予定

### 短期的な改善

- [ ] より詳細なエラー分類とハンドリング
- [ ] オフライン対応フックの追加
- [ ] リアルタイム更新フックの実装

### 中期的な改善

- [ ] GraphQL対応フックの追加
- [ ] WebSocket統合フックの実装
- [ ] キャッシュ戦略の高度化

### 長期的な改善

- [ ] AI機能統合フックの追加
- [ ] マルチテナント対応
- [ ] マイクロフロントエンド対応

## 📚 関連ドキュメント

- [React 19 ドキュメント](https://react.dev/)
- [TypeScript 5.9 ドキュメント](https://www.typescriptlang.org/)
- [Testing Library](https://testing-library.com/)
- [Google Maps API](https://developers.google.com/maps)
- [Google Sheets API](https://developers.google.com/sheets)
- [Google Analytics](https://developers.google.com/analytics)
````
