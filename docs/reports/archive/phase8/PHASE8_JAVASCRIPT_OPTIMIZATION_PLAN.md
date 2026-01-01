# Phase 8: JavaScript 最適化 - 実装プラン

**作成日**: 2025-10-05
**目標**: Performance 53/58 → 75+ (Mobile/Desktop)
**重点**: Total Blocking Time削減 (12,770ms → <3,000ms)

---

## 🎯 目標設定

### Performance Score

| デバイス | 現状 | Week 1 | Week 2 | 最終目標 |
| -------- | ---- | ------ | ------ | -------- |
| Mobile   | 53   | 65     | 75     | 85+      |
| Desktop  | 58   | 70     | 80     | 90+      |

### Core Web Vitals

| 指標    | 現状 (Mobile) | 目標 (Week 2) | 最終目標 |
| ------- | ------------- | ------------- | -------- |
| **TBT** | 12,770 ms     | <3,000 ms     | <500 ms  |
| **LCP** | 3.1 s         | <2.5 s        | <2.0 s   |
| **FCP** | 1.8 s         | <1.5 s        | <1.2 s   |
| **SI**  | 11.4 s        | <5.0 s        | <3.4 s   |

---

## 📊 現状分析 (Phase 7測定結果から)

### ボトルネックの定量化

#### Mobile (Slow 4G)

| 項目                        | 実測値   | 影響度   | 優先度 |
| --------------------------- | -------- | -------- | ------ |
| Minimize main-thread work   | 24.7 s   | Critical | P0     |
| Reduce JavaScript execution | 11.4 s   | Critical | P0     |
| Reduce unused JavaScript    | 359 KiB  | High     | P0     |
| Long main-thread tasks      | 20 tasks | High     | P1     |
| Minify JavaScript           | 25 KiB   | Low      | P2     |

#### Desktop (Custom throttling)

| 項目                        | 実測値   | 影響度 | 優先度 |
| --------------------------- | -------- | ------ | ------ |
| Minimize main-thread work   | 6.4 s    | High   | P0     |
| Reduce JavaScript execution | 2.7 s    | High   | P0     |
| Reduce unused JavaScript    | 345 KiB  | High   | P0     |
| Long main-thread tasks      | 13 tasks | Medium | P1     |
| Minify JavaScript           | 25 KiB   | Low    | P2     |

---

## 🔧 実装タスク

### P0: Code Splitting 強化 (Day 1 - 4時間)

#### 目標

- メインチャンク削減: 推定 300KB → 150KB
- TBT削減: -3,000ms (Mobile), -1,000ms (Desktop)
- 初期ロード高速化: FCP -300ms

#### 実装内容

##### Task 1.1: vite.config.ts 更新 (1時間)

**現状**:

```typescript
// vite.config.ts
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'google-maps': ['@googlemaps/js-api-loader'],
}
```

**改善案**:

```typescript
// vite.config.ts
manualChunks(id) {
  // React core
  if (id.includes('react') || id.includes('react-dom')) {
    return 'react-vendor';
  }

  // Google Maps (大きい)
  if (id.includes('@googlemaps') || id.includes('google-maps')) {
    return 'google-maps';
  }

  // UI ライブラリ
  if (id.includes('@radix-ui')) {
    return 'ui-vendor';
  }

  // Markers (遅延ロード候補)
  if (id.includes('/markers/')) {
    return 'markers';
  }

  // データ処理
  if (id.includes('/services/sheets') || id.includes('restaurantService')) {
    return 'data-processing';
  }

  // A/B test (小さいが分離)
  if (id.includes('/abtest/')) {
    return 'abtest';
  }

  // Analytics (遅延可能)
  if (id.includes('analytics')) {
    return 'analytics';
  }

  // node_modules の残り
  if (id.includes('node_modules')) {
    return 'vendor';
  }
}
```

**検証**:

```bash
pnpm build
pnpm analyze  # bundle size確認
```

**期待結果**:

- Main chunk: 175KB → 100KB (-43%)
- Chunks数: 4 → 8-10
- Parallel loading 効果

---

##### Task 1.2: React.lazy() 導入 (3時間)

**対象コンポーネント**:

1. **IntegratedMapView** (最優先)
   - サイズ: 推定 50-70KB
   - Google Maps API含む
   - Above-the-fold ではない

2. **Dashboard** (高優先)
   - サイズ: 推定 20-30KB
   - レポート画面のみで使用

3. **Markers** (中優先)
   - 複数のマーカーコンポーネント
   - 地図表示後に必要

**実装例**:

```typescript
// src/app/App.tsx
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// 遅延読み込み
const IntegratedMapView = lazy(() =>
  import('./pages/IntegratedMapView').then(m => ({ default: m.IntegratedMapView }))
);

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then(m => ({ default: m.Dashboard }))
);

export function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <IntegratedMapView />
              </Suspense>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

**LoadingSpinner コンポーネント**:

```typescript
// src/components/common/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div
      role="status"
      aria-label="読み込み中"
      className="loading-spinner"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <div className="spinner" />
      <span className="sr-only">読み込み中...</span>
    </div>
  );
}
```

**ErrorBoundary**:

```typescript
// src/components/common/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>コンポーネントの読み込みに失敗しました</h2>
          <button onClick={() => window.location.reload()}>
            リロード
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**検証**:

```bash
pnpm type-check
pnpm test
pnpm build
pnpm preview

# Network タブで確認:
# - IntegratedMapView.js が別チャンクになっているか
# - 初期ロードで読み込まれないか
```

---

### P0: Google Maps API 最適化 (Day 1-2 - 3時間)

#### 目標

- Google Maps ロード遅延
- TBT削減: -5,000ms (Mobile), -1,500ms (Desktop)
- FCP改善: -400ms

#### 実装内容

##### Task 2.1: Loader 遅延化 (2時間)

**現状問題**: Google Maps API がアプリ起動時に即ロード

**改善案**: ユーザーがマップを見るまで遅延

```typescript
// src/hooks/useGoogleMapsLoader.ts
import { useEffect, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface UseGoogleMapsLoaderOptions {
  apiKey: string;
  version?: string;
  libraries?: string[];
}

export function useGoogleMapsLoader(options: UseGoogleMapsLoaderOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // すでにロード済み
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    setIsLoading(true);

    const loader = new Loader({
      apiKey: options.apiKey,
      version: options.version || "weekly",
      libraries: options.libraries || ["maps", "marker"],
    });

    loader
      .load()
      .then(() => {
        setIsLoaded(true);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
        console.error("Google Maps loading failed:", err);
      });
  }, [options.apiKey, options.version]);

  return { isLoaded, isLoading, error };
}
```

**使用例**:

```typescript
// src/pages/IntegratedMapView.tsx
import { useGoogleMapsLoader } from '@hooks/useGoogleMapsLoader';
import { GOOGLE_MAPS_API_KEY } from '@config/environment';

export function IntegratedMapView() {
  const { isLoaded, isLoading, error } = useGoogleMapsLoader({
    apiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['maps', 'marker'],
  });

  if (isLoading) {
    return <LoadingSpinner message="地図を読み込んでいます..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!isLoaded) {
    return null;
  }

  return <RestaurantMap />;
}
```

---

##### Task 2.2: Intersection Observer によるマップ遅延 (1時間)

**さらなる最適化**: マップが viewport に入るまで遅延

```typescript
// src/hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useIntersectionObserver(options: UseIntersectionObserverOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || "100px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return { ref, isVisible };
}
```

**使用例**:

```typescript
// src/pages/IntegratedMapView.tsx (改善版)
export function IntegratedMapView() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  const { isLoaded, isLoading } = useGoogleMapsLoader({
    apiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['maps', 'marker'],
  });

  return (
    <div ref={ref} className="map-container">
      {isVisible && isLoaded ? (
        <RestaurantMap />
      ) : (
        <div className="map-placeholder">
          地図を表示する準備をしています...
        </div>
      )}
    </div>
  );
}
```

---

### P0: Unused JavaScript 削減 (Day 2-3 - 1日)

#### 目標

- 未使用コード削減: 345-359 KiB
- TBT削減: -2,000ms (Mobile), -500ms (Desktop)

#### 実装内容

##### Task 3.1: Bundle Analyzer で特定 (1時間)

```bash
ANALYZE=true pnpm build

# または
pnpm analyze
```

**確認項目**:

1. 大きなライブラリの使用状況
2. Tree-shaking されていない import
3. 重複コード

##### Task 3.2: Import 最適化 (3時間)

**パターン1**: Named import 使用

```typescript
// ❌ 悪い例: 全体 import
import * as RadixDialog from "@radix-ui/react-dialog";

// ✅ 良い例: 必要なもののみ
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";
```

**パターン2**: Dynamic import for heavy utils

```typescript
// ❌ 悪い例: 重い関数を常にロード
import { complexAnalysis } from "@utils/analytics";

// ✅ 良い例: 使用時のみロード
async function runAnalysis() {
  const { complexAnalysis } = await import("@utils/analytics");
  return complexAnalysis(data);
}
```

**パターン3**: Conditional imports

```typescript
// src/config/environment.ts
export const isDevelopment = import.meta.env.DEV;

// src/app/App.tsx
if (isDevelopment) {
  // Development のみロード
  import("./utils/devTools").then(({ initDevTools }) => {
    initDevTools();
  });
}
```

##### Task 3.3: Package 見直し (2時間)

**候補**:

1. **lodash → lodash-es**

   ```bash
   pnpm remove lodash
   pnpm add lodash-es
   ```

2. **moment → date-fns** (もし使用中なら)
   - moment: 約 230KB
   - date-fns: 約 13KB (tree-shakable)

3. **不要な polyfill削除**

---

### P1: Long Tasks 分割 (Day 4 - 4時間)

#### 目標

- Long tasks削減: Mobile 20 → <10, Desktop 13 → <5
- TBT削減: -2,000ms (Mobile), -500ms (Desktop)

#### 実装内容

##### Task 4.1: processInChunks ユーティリティ (1時間)

```typescript
// src/utils/performanceUtils.ts

/**
 * 大量データを chunk に分けて処理し、メインスレッドをブロックしない
 */
export async function processInChunks<T>(
  items: T[],
  chunkSize: number,
  processor: (item: T, index: number) => void | Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    await Promise.all(chunk.map((item, idx) => processor(item, i + idx)));

    // メインスレッドに制御を返す
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

/**
 * scheduler.yield() が使える環境では使用 (Chrome 115+)
 */
export async function yieldToMain(): Promise<void> {
  if ("scheduler" in window && "yield" in window.scheduler) {
    return (window.scheduler as any).yield();
  }
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * requestIdleCallback を使った遅延処理
 */
export function processWhenIdle<T>(callback: () => T, options: { timeout?: number } = {}): Promise<T> {
  return new Promise(resolve => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => resolve(callback()), { timeout: options.timeout || 2000 });
    } else {
      // Fallback
      setTimeout(() => resolve(callback()), 0);
    }
  });
}
```

##### Task 4.2: マーカー描画の最適化 (2時間)

```typescript
// src/components/map/RestaurantMap.tsx (改善版)
import { processInChunks, yieldToMain } from '@utils/performanceUtils';

export function RestaurantMap({ restaurants }: Props) {
  const [visibleMarkers, setVisibleMarkers] = useState<Marker[]>([]);

  useEffect(() => {
    async function renderMarkers() {
      const markers: Marker[] = [];

      // 50件ずつ処理
      await processInChunks(restaurants, 50, async (restaurant) => {
        const marker = createMarker(restaurant);
        markers.push(marker);

        // 10件ごとに UI 更新
        if (markers.length % 10 === 0) {
          setVisibleMarkers([...markers]);
          await yieldToMain();
        }
      });

      setVisibleMarkers(markers);
    }

    renderMarkers();
  }, [restaurants]);

  return (
    <GoogleMap>
      {visibleMarkers.map(marker => (
        <Marker key={marker.id} {...marker} />
      ))}
    </GoogleMap>
  );
}
```

##### Task 4.3: データ処理の非同期化 (1時間)

```typescript
// src/services/sheets/restaurantService.ts (改善版)
import { processWhenIdle } from "@utils/performanceUtils";

export async function fetchAndProcessRestaurants(): Promise<Restaurant[]> {
  // Fetch は通常通り
  const rawData = await fetchRestaurantsFromSheets();

  // 重い変換処理は idle時に
  const processed = await processWhenIdle(() => {
    return rawData.map(transformRestaurantData);
  });

  return processed;
}
```

---

### P2: その他最適化 (Day 5 - 2時間)

#### Task 5.1: JavaScript Minify 強化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // console.log削除
        drop_debugger: true,
        pure_funcs: ["console.info", "console.debug"],
      },
      mangle: {
        safari10: true,
      },
    },
  },
});
```

#### Task 5.2: Render Blocking 解消

```html
<!-- index.html -->
<head>
  <!-- 非同期読み込み -->
  <link rel="preload" href="/assets/critical.css" as="style" />
  <link rel="stylesheet" href="/assets/critical.css" />

  <!-- 遅延読み込み -->
  <link rel="stylesheet" href="/assets/non-critical.css" media="print" onload="this.media='all'" />
</head>
```

---

## 📋 実装スケジュール

### Week 1 (Day 1-5)

| Day | タスク                  | 工数 | 担当 | 完了 |
| --- | ----------------------- | ---- | ---- | ---- |
| 1   | Code Splitting (P0)     | 4h   | -    | ⬜   |
| 1-2 | Google Maps 最適化 (P0) | 3h   | -    | ⬜   |
| 2-3 | Unused JS削減 (P0)      | 8h   | -    | ⬜   |
| 4   | Long Tasks分割 (P1)     | 4h   | -    | ⬜   |
| 5   | その他最適化 (P2)       | 2h   | -    | ⬜   |
| 5   | 中間測定 & レポート     | 1h   | -    | ⬜   |

**合計**: 22時間 (約3日)

---

## ✅ 検証方法

### 各タスク完了時

```bash
# 1. Type check
pnpm type-check

# 2. Lint
pnpm lint

# 3. Tests
pnpm test

# 4. Build
pnpm build

# 5. Bundle size確認
pnpm analyze

# 6. Preview & Manual test
pnpm preview
```

### 中間測定 (Day 5)

```bash
# Lighthouse測定
pnpm preview

# Chrome DevTools:
# 1. Mobile 測定
# 2. Desktop 測定
# 3. Performance Profile 記録
```

**確認項目**:

- Performance スコア
- TBT
- LCP
- Long tasks 数
- Bundle size

---

## 🎯 成功基準

### Minimum (最低目標)

| 指標        | Mobile   | Desktop  |
| ----------- | -------- | -------- |
| Performance | 65+      | 70+      |
| TBT         | <5,000ms | <1,500ms |
| LCP         | <2.8s    | <1.5s    |

### Target (目標)

| 指標        | Mobile   | Desktop  |
| ----------- | -------- | -------- |
| Performance | 75+      | 80+      |
| TBT         | <3,000ms | <1,000ms |
| LCP         | <2.5s    | <1.3s    |

### Stretch (ストレッチ)

| 指標        | Mobile   | Desktop |
| ----------- | -------- | ------- |
| Performance | 85+      | 90+     |
| TBT         | <1,000ms | <500ms  |
| LCP         | <2.0s    | <1.0s   |

---

## 🚨 リスク管理

### 技術リスク

1. **React.lazy() による型エラー**
   - 対策: Default export 明示
   - 回避: Named export → Default export wrapper

2. **Code Splitting での依存関係エラー**
   - 対策: Rollup warnings確認
   - 回避: manualChunks 調整

3. **Google Maps 遅延による UX悪化**
   - 対策: LoadingSpinner 実装
   - 回避: Skeleton screen

### スケジュールリスク

- P0タスクが遅延 → P1/P2を Week 2へ
- Lighthouse スコア未達 → 追加最適化 Week 2

---

## 📈 測定 & レポート

### Day 5: 中間レポート

**テンプレート**: `docs/PHASE8_MIDTERM_RESULTS.md`

```markdown
## 実装完了タスク

- [x] Code Splitting
- [x] Google Maps 最適化
- [x] Unused JS削減
- [ ] Long Tasks分割
- [ ] その他最適化

## Lighthouse スコア

- Performance (Mobile): 53 → \_\_
- Performance (Desktop): 58 → \_\_
- TBT (Mobile): 12,770ms → \_\_ms
- TBT (Desktop): 2,630ms → \_\_ms

## 次のアクション

1. ...
2. ...
```

### Week 1 完了時: 最終レポート

**テンプレート**: `docs/PHASE8_COMPLETION_REPORT.md`

---

## 🎓 参考資料

- [Web.dev: Code Splitting](https://web.dev/code-splitting-suspense/)
- [React: Lazy Loading](https://react.dev/reference/react/lazy)
- [Long Tasks API](https://developer.mozilla.org/en-US/docs/Web/API/Long_Tasks_API)
- [Vite: Manual Chunking](https://vitejs.dev/guide/build.html#chunking-strategy)

---

**作成日**: 2025-10-05
**レビュー**: Phase 7完了後
**開始予定**: 即日
**完了予定**: 2025-10-10 (5営業日)
