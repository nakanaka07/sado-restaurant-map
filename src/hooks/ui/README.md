# src/hooks/ui - UI関連フック

佐渡島レストランマップアプリケーションのユーザーインターフェース機能に特化したカスタムフック群を管理するディレクトリです。アナリティクス、エラーハンドリング、ユーザー体験の向上を担当します。

## 📁 ディレクトリ構成

```text
src/hooks/ui/
├── index.ts                    # バレルエクスポート
├── useAnalytics.ts            # Google Analytics統合フック
├── useErrorHandler.ts         # エラーハンドリング統合フック
└── useErrorHandler.test.ts    # useErrorHandlerテストファイル
```text

## 🎯 概要

このディレクトリは、ユーザーインターフェースに関連する機能を提供するフック群を管理します。ユーザー行動の追跡、エラーの統合管理、UX向上のための機能を提供し、アプリケーションの品質と使いやすさを向上させます。

### 主要な責務

- **アナリティクス統合**: Google Analyticsによるユーザー行動追跡
- **エラーハンドリング**: 統合的なエラー管理と報告
- **ユーザー体験向上**: パフォーマンス監視とUX最適化
- **開発支援**: デバッグとトラブルシューティング機能
- **品質保証**: エラー追跡と品質メトリクス収集

## 🔧 主要フック

### useAnalytics

Google Analyticsと統合したユーザー行動追跡フックです。

#### 基本的な使用方法

```typescript
import { useAnalytics } from '@/hooks/ui';

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const {
    trackRestaurantView,
    trackSearchQuery,
    trackFilterUsage,
    trackMapInteraction,
    trackPWAEvent
  } = useAnalytics();

  const handleClick = () => {
    trackRestaurantView(restaurant);
    // レストラン詳細画面へ遷移
    navigateToRestaurant(restaurant.id);
  };

  return (
    <div onClick={handleClick}>
      <h3>{restaurant.name}</h3>
      <p>{restaurant.cuisineType}</p>
    </div>
  );
}
```text

#### 検索・フィルター追跡

```typescript
function SearchAndFilter() {
  const { trackSearchQuery, trackFilterUsage } = useAnalytics();

  const handleSearch = (query: string) => {
    trackSearchQuery(query);
    performSearch(query);
  };

  const handleFilterChange = (filterType: string, value: any) => {
    trackFilterUsage(filterType, value);
    applyFilter(filterType, value);
  };

  return (
    <div>
      <SearchInput onSearch={handleSearch} />
      <FilterPanel onFilterChange={handleFilterChange} />
    </div>
  );
}
```text

#### 地図インタラクション追跡

```typescript
function MapComponent() {
  const { trackMapInteraction } = useAnalytics();

  const handleMapClick = (coordinates: { lat: number; lng: number }) => {
    trackMapInteraction('map_click', {
      coordinates,
      zoomLevel: map.getZoom()
    });
  };

  const handleMarkerClick = (restaurant: Restaurant) => {
    trackMapInteraction('marker_click', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      coordinates: restaurant.coordinates
    });
  };

  return (
    <GoogleMap
      onClick={handleMapClick}
      onMarkerClick={handleMarkerClick}
    />
  );
}
```text

### useErrorHandler

アプリケーション全体のエラーを統合管理するフックです。

#### 基本的な使用方法

```typescript
import { useErrorHandler } from '@/hooks/ui';

function DataFetchingComponent() {
  const { handleError, clearError, error } = useErrorHandler();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchRestaurants();
      setData(result);
      clearError(); // 成功時はエラーをクリア
    } catch (error) {
      handleError({
        error,
        context: 'レストランデータ取得',
        severity: 'high'
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} />;
  }

  return (
    <div>
      {loading ? <LoadingSpinner /> : <DataDisplay data={data} />}
    </div>
  );
}
```text

#### 高度なエラーハンドリング

```typescript
function AdvancedErrorHandling() {
  const { 
    handleError, 
    clearError, 
    clearErrorHistory, 
    error, 
    errorHistory 
  } = useErrorHandler();

  // API エラーの処理
  const handleApiError = (error: Error, endpoint: string) => {
    handleError({
      error,
      context: `API呼び出し: ${endpoint}`,
      severity: 'high',
      metadata: {
        endpoint,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });
  };

  // バリデーションエラーの処理
  const handleValidationError = (field: string, value: any) => {
    handleError({
      error: new Error(`不正な値: ${field}`),
      context: 'フォームバリデーション',
      severity: 'medium',
      metadata: { field, value }
    });
  };

  // ネットワークエラーの処理
  const handleNetworkError = (error: Error) => {
    handleError({
      error,
      context: 'ネットワーク接続',
      severity: 'high',
      metadata: {
        online: navigator.onLine,
        connectionType: (navigator as any).connection?.effectiveType
      }
    });
  };

  return (
    <div>
      {error && (
        <ErrorBanner 
          error={error}
          onDismiss={clearError}
          onViewHistory={() => console.log(errorHistory)}
        />
      )}
      
      <ErrorHistoryPanel 
        errors={errorHistory}
        onClear={clearErrorHistory}
      />
    </div>
  );
}
```text

## 📊 型定義

### AnalyticsEvent

```typescript
interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
}

interface RestaurantAnalytics {
  id: string;
  name: string;
  category: string;
  priceRange: string;
  district?: string;
}

interface MapInteractionData {
  coordinates?: { lat: number; lng: number };
  zoomLevel?: number;
  restaurantId?: string;
  restaurantName?: string;
}
```text

### ErrorDetails

```typescript
interface ErrorDetails {
  error: Error;
  context: string;
  severity: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface ErrorState {
  message: string;
  code?: string;
  timestamp: Date;
  context: string;
  severity: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface UseErrorHandlerResult {
  error: ErrorState | null;
  errorHistory: ErrorState[];
  handleError: (details: ErrorDetails) => void;
  clearError: () => void;
  clearErrorHistory: () => void;
}
```text

### UseAnalyticsResult

```typescript
interface UseAnalyticsResult {
  trackRestaurantView: (restaurant: Restaurant) => void;
  trackSearchQuery: (query: string) => void;
  trackFilterUsage: (filterType: string, value: any) => void;
  trackMapInteraction: (action: string, data?: MapInteractionData) => void;
  trackPWAEvent: (event: string, data?: Record<string, any>) => void;
}
```text

## 🏗️ アーキテクチャ

### アナリティクスフロー

```text
ユーザーアクション → useAnalytics → Google Analytics → データ分析
                                  ↓
                            ローカルデバッグログ
```text

### エラーハンドリングフロー

```text
エラー発生 → useErrorHandler → エラー分類 → 表示/報告 → ログ保存
                            ↓
                      開発環境: コンソール出力
                      本番環境: エラー報告サービス
```text

### アナリティクス実装パターン

```typescript
// Google Analytics 4 統合
const trackEvent = (event: AnalyticsEvent) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      custom_parameters: event.customParameters
    });
  }

  // 開発環境でのデバッグ
  if (process.env.NODE_ENV === 'development') {
    console.group('Analytics Event');
    console.log('Action:', event.action);
    console.log('Category:', event.category);
    console.log('Data:', event);
    console.groupEnd();
  }
};
```text

### エラー管理パターン

```typescript
const useErrorHandler = (): UseErrorHandlerResult => {
  const [error, setError] = useState<ErrorState | null>(null);
  const [errorHistory, setErrorHistory] = useState<ErrorState[]>([]);

  const handleError = useCallback((details: ErrorDetails) => {
    const errorState: ErrorState = {
      message: details.error.message,
      code: 'code' in details.error ? String(details.error.code) : undefined,
      timestamp: new Date(),
      context: details.context,
      severity: details.severity,
      metadata: details.metadata
    };

    setError(errorState);
    setErrorHistory(prev => [errorState, ...prev.slice(0, 9)]); // 最新10件保持

    // 開発環境での詳細ログ
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${details.severity}]`);
      console.log('Context:', details.context);
      console.log('Message:', details.error.message);
      console.log('Stack:', details.error.stack);
      console.log('Metadata:', details.metadata);
      console.groupEnd();
    }

    // 本番環境でのエラー報告
    if (process.env.NODE_ENV === 'production' && details.severity === 'high') {
      reportErrorToService(errorState);
    }
  }, []);

  return {
    error,
    errorHistory,
    handleError,
    clearError: () => setError(null),
    clearErrorHistory: () => setErrorHistory([])
  };
};
```text

## 🧪 テスト

### テスト戦略

#### 1. useErrorHandler テスト

```typescript
describe('useErrorHandler', () => {
  it('エラーを正しく処理する', () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = new Error('テストエラー');
    act(() => {
      result.current.handleError({
        error: testError,
        context: 'テストコンテキスト',
        severity: 'medium'
      });
    });

    expect(result.current.error).toMatchObject({
      message: 'テストエラー',
      context: 'テストコンテキスト',
      severity: 'medium'
    });
  });

  it('エラー履歴を管理する', () => {
    const { result } = renderHook(() => useErrorHandler());

    // 複数のエラーを追加
    act(() => {
      result.current.handleError({
        error: new Error('エラー1'),
        context: 'コンテキスト1',
        severity: 'low'
      });
    });

    act(() => {
      result.current.handleError({
        error: new Error('エラー2'),
        context: 'コンテキスト2',
        severity: 'high'
      });
    });

    expect(result.current.errorHistory).toHaveLength(2);
    expect(result.current.errorHistory[0].message).toBe('エラー2');
    expect(result.current.errorHistory[1].message).toBe('エラー1');
  });

  it('エラーをクリアできる', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError({
        error: new Error('テストエラー'),
        context: 'テスト',
        severity: 'medium'
      });
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
```text

#### 2. useAnalytics テスト

```typescript
describe('useAnalytics', () => {
  beforeEach(() => {
    // gtag モックのセットアップ
    global.gtag = vi.fn();
  });

  it('レストラン表示を追跡する', () => {
    const { result } = renderHook(() => useAnalytics());
    const mockRestaurant = createMockRestaurant();

    act(() => {
      result.current.trackRestaurantView(mockRestaurant);
    });

    expect(global.gtag).toHaveBeenCalledWith('event', 'restaurant_view', {
      event_category: 'restaurant',
      restaurant_id: mockRestaurant.id,
      restaurant_name: mockRestaurant.name,
      cuisine_type: mockRestaurant.cuisineType
    });
  });

  it('検索クエリを追跡する', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackSearchQuery('寿司');
    });

    expect(global.gtag).toHaveBeenCalledWith('event', 'search', {
      event_category: 'search',
      search_term: '寿司'
    });
  });
});
```text

### テスト実行

```bash
# 単体テスト実行
npm run test src/hooks/ui

# カバレッジ付きテスト
npm run test:coverage src/hooks/ui

# ウォッチモード
npm run test:watch src/hooks/ui
```text

## 🚀 開発ガイドライン

### 新しいUIフックの追加

#### 1. フックファイル作成

```typescript
// src/hooks/ui/useNotifications.ts
import { useState, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

interface UseNotificationsResult {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);

    // 自動削除
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
}
```text

#### 2. テストファイル作成

```typescript
// src/hooks/ui/useNotifications.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from './useNotifications';

describe('useNotifications', () => {
  it('通知を追加できる', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        type: 'success',
        title: '成功',
        message: 'データが保存されました'
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('success');
  });
});
```text

#### 3. バレルエクスポート更新

```typescript
// src/hooks/ui/index.ts
export { useAnalytics } from "./useAnalytics";
export { useErrorHandler } from "./useErrorHandler";
export { useNotifications } from "./useNotifications";
```text

### パフォーマンス最適化

#### 1. アナリティクスイベントの最適化

```typescript
// イベントのバッチ処理
const useBatchedAnalytics = () => {
  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const flushTimeout = useRef<NodeJS.Timeout>();

  const queueEvent = useCallback((event: AnalyticsEvent) => {
    eventQueue.current.push(event);

    // バッチ送信のスケジュール
    if (flushTimeout.current) {
      clearTimeout(flushTimeout.current);
    }

    flushTimeout.current = setTimeout(() => {
      flushEvents();
    }, 1000); // 1秒後にまとめて送信
  }, []);

  const flushEvents = useCallback(() => {
    if (eventQueue.current.length > 0) {
      eventQueue.current.forEach(event => {
        gtag('event', event.action, event);
      });
      eventQueue.current = [];
    }
  }, []);

  return { queueEvent, flushEvents };
};
```text

#### 2. エラーハンドリングの最適化

```typescript
// エラーの重複除去
const useDedupedErrorHandler = () => {
  const recentErrors = useRef<Set<string>>(new Set());

  const handleError = useCallback((details: ErrorDetails) => {
    const errorKey = `${details.context}-${details.error.message}`;
    
    // 同じエラーが短時間で複数回発生した場合は無視
    if (recentErrors.current.has(errorKey)) {
      return;
    }

    recentErrors.current.add(errorKey);
    
    // 5秒後にキーを削除
    setTimeout(() => {
      recentErrors.current.delete(errorKey);
    }, 5000);

    // 実際のエラー処理
    processError(details);
  }, []);

  return { handleError };
};
```text

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. アナリティクスが動作しない

**症状**: Google Analyticsにデータが送信されない

**解決方法**:

```typescript
// Google Analytics の初期化確認
const checkAnalyticsSetup = () => {
  if (typeof gtag === 'undefined') {
    console.error('Google Analytics が読み込まれていません');
    return false;
  }

  if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
    console.error('GA_MEASUREMENT_ID が設定されていません');
    return false;
  }

  return true;
};

// 使用前にチェック
const { trackRestaurantView } = useAnalytics();
if (checkAnalyticsSetup()) {
  trackRestaurantView(restaurant);
}
```text

#### 2. エラーが正しく表示されない

**症状**: エラーハンドラーでキャッチしたエラーが表示されない

**解決方法**:

```typescript
// エラー状態の確認
const debugErrorHandler = () => {
  const { error, errorHistory, handleError } = useErrorHandler();

  useEffect(() => {
    console.log('Current error:', error);
    console.log('Error history:', errorHistory);
  }, [error, errorHistory]);

  // テストエラーの発生
  const triggerTestError = () => {
    handleError({
      error: new Error('テストエラー'),
      context: 'デバッグテスト',
      severity: 'medium'
    });
  };

  return { triggerTestError };
};
```text

#### 3. メモリリークの発生

**症状**: 長時間使用でメモリ使用量が増加

**解決方法**:

```typescript
// エラー履歴のサイズ制限
const useErrorHandlerWithLimit = (maxHistorySize: number = 10) => {
  const [errorHistory, setErrorHistory] = useState<ErrorState[]>([]);

  const addToHistory = useCallback((error: ErrorState) => {
    setErrorHistory(prev => {
      const newHistory = [error, ...prev];
      return newHistory.slice(0, maxHistorySize); // サイズ制限
    });
  }, [maxHistorySize]);

  return { errorHistory, addToHistory };
};

// アナリティクスイベントキューのクリーンアップ
useEffect(() => {
  return () => {
    // コンポーネントアンマウント時にキューをクリア
    eventQueue.current = [];
    if (flushTimeout.current) {
      clearTimeout(flushTimeout.current);
    }
  };
}, []);
```text

### デバッグ方法

#### 1. アナリティクスデバッグ

```typescript
// アナリティクスイベントの可視化
const useAnalyticsDebug = () => {
  const [debugEvents, setDebugEvents] = useState<AnalyticsEvent[]>([]);

  const trackWithDebug = useCallback((event: AnalyticsEvent) => {
    // 実際の追跡
    gtag('event', event.action, event);

    // デバッグ情報の保存
    setDebugEvents(prev => [
      { ...event, timestamp: new Date() },
      ...prev.slice(0, 19) // 最新20件保持
    ]);
  }, []);

  return { debugEvents, trackWithDebug };
};
```text

#### 2. エラーハンドリングデバッグ

```typescript
// エラー詳細情報の表示
const ErrorDebugPanel = () => {
  const { errorHistory } = useErrorHandler();

  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, background: '#f0f0f0' }}>
      <h4>エラーデバッグ情報</h4>
      {errorHistory.map((error, index) => (
        <div key={index} style={{ margin: '5px', padding: '5px', border: '1px solid #ccc' }}>
          <strong>{error.severity}</strong>: {error.message}
          <br />
          <small>{error.context} - {error.timestamp.toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
};
```text

## 📈 パフォーマンス監視

### メトリクス

- **アナリティクス送信時間**: イベント送信の効率性
- **エラー処理時間**: エラーハンドリングの応答性
- **メモリ使用量**: 履歴データの効率的な管理
- **イベント送信成功率**: アナリティクスの信頼性

### 監視コード例

```typescript
const useUIPerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState({
    analyticsEvents: 0,
    errorsHandled: 0,
    averageErrorProcessingTime: 0
  });

  const measureErrorHandling = useCallback((fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      errorsHandled: prev.errorsHandled + 1,
      averageErrorProcessingTime: (prev.averageErrorProcessingTime + (end - start)) / 2
    }));
  }, []);

  return { metrics, measureErrorHandling };
};
```text

## 🚀 今後の改善予定

### 短期的な改善

- [ ] 通知システムの追加
- [ ] A/Bテスト機能の統合
- [ ] パフォーマンス監視の強化

### 中期的な改善

- [ ] 高度なユーザー行動分析
- [ ] リアルタイムエラー報告
- [ ] カスタムメトリクス収集

### 長期的な改善

- [ ] AI による UX 最適化提案
- [ ] 予測的エラー防止
- [ ] 自動パフォーマンス調整

## 📚 関連ドキュメント

- [Google Analytics 4 ドキュメント](https://developers.google.com/analytics/devguides/collection/ga4)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Web Vitals](https://web.dev/vitals/)
- [User Experience Guidelines](https://developers.google.com/web/fundamentals/design-and-ux/ux-basics)

## 🔗 関連ファイル

- `src/hooks/README.md` - フック全体の概要
- `src/hooks/api/README.md` - API関連フック
- `src/hooks/map/README.md` - 地図関連フック
- `src/components/common/AccessibilityComponents.tsx` - アクセシビリティコンポーネント
- `src/config/analytics.ts` - アナリティクス設定
