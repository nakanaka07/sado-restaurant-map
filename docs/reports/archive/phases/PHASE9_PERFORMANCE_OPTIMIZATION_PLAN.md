# Phase 9: パフォーマンス最適化実行計画

**作成日**: 2025年12月8日
**目標**: TBT大幅削減とCore Web Vitals改善
**前提**: Phase 8完了（バンドル最適化済み、カバレッジ75.88%達成）

---

## 📋 Executive Summary

### 現状分析

**Phase 8完了時点の状況** (2025-10-19測定):

| 指標              | Mobile       | Desktop     | 目標   | 状態    |
| ----------------- | ------------ | ----------- | ------ | ------- |
| Performance Score | 60/100       | 61/100      | 90+    | ❌ 未達 |
| **TBT**           | **12,670ms** | **2,910ms** | <500ms | ❌ 深刻 |
| LCP               | 1.9s         | 0.5s        | <2.5s  | ✅ 良好 |
| FCP               | 1.8s         | 0.5s        | <1.8s  | ✅ 良好 |
| Long Tasks        | 20個         | 14個        | <5個   | ❌ 多い |

**Phase 8の教訓**:

- ✅ バンドルサイズ削減成功（App.js -43%）
- ❌ TBT改善はわずか-0.8%（目標未達）
- 🔍 **根本原因特定**: 同期的な大量データ処理がボトルネック

### Phase 9の戦略

**重点**: バンドル最適化 → **実行時パフォーマンス最適化**

1. ✅ **既に最適化済み**: チャンク分割、動的import、Terser圧縮
2. 🎯 **Phase 9の焦点**: メインスレッド処理の分割と非同期化

---

## 🎯 Phase 9 目標

### パフォーマンス指標目標

| 指標               | 現状 (Mobile) | Phase 9目標  | 最終目標 |
| ------------------ | ------------- | ------------ | -------- |
| Performance Score  | 60            | **75+**      | 90+      |
| **TBT**            | 12,670ms      | **<8,000ms** | <500ms   |
| Long Tasks         | 20個          | **<10個**    | <5個     |
| メインスレッド処理 | 24.7s         | **<15s**     | <5s      |

### 成功基準

**Minimum (必達)**:

- ✅ TBT: -4,000ms以上削減（-32%）
- ✅ Long Tasks: 20 → 10以下（-50%）
- ✅ Performance Score: +15点以上

**Target (目標)**:

- 🎯 TBT: -6,000ms削減（-47%）
- 🎯 Long Tasks: <8個
- 🎯 Performance Score: 75+

**Stretch (理想)**:

- 🚀 TBT: <5,000ms（-60%）
- 🚀 Performance Score: 80+

---

## 🔧 実装タスク

### P0: Long Tasks分割（Week 1 - 5日間）

**目標**: TBT -3,000ms〜-4,000ms

#### Task 1.1: processInChunks ユーティリティ実装（1日）

**対象ファイル**: `src/utils/performanceUtils.ts`（新規作成）

**実装内容**:

```typescript
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
    await yieldToMain();
  }
}

/**
 * scheduler.yield() または setTimeout() でメインスレッドに制御を返す
 */
export async function yieldToMain(): Promise<void> {
  if ("scheduler" in window && "yield" in (window.scheduler as any)) {
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
      requestIdleCallback(() => resolve(callback()), {
        timeout: options.timeout || 2000,
      });
    } else {
      setTimeout(() => resolve(callback()), 0);
    }
  });
}

/**
 * 同期版（useMemo内で使用可能）
 */
export function processInChunksSync<T, R>(items: T[], chunkSize: number, processor: (item: T) => R): R[] {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    results.push(...chunk.map(processor));

    // 注: 同期版のためyieldできない
    // 代わりにchunkSizeを調整して1チャンクの処理時間を<50msに
  }

  return results;
}
```

**テスト要件**:

- ✅ 全件処理の正確性
- ✅ チャンク境界のエッジケース
- ✅ エラーハンドリング
- ✅ パフォーマンス測定（処理時間<50ms/chunk）

**AC**:

- [ ] `processInChunks` 実装完了
- [ ] テストカバレッジ 100%
- [ ] ドキュメント作成

**工数**: 8時間

---

#### Task 1.2: useMapPoints フィルタリング最適化（1.5日）

**対象ファイル**: `src/hooks/map/useMapPoints.ts`

**現状の問題**:

```typescript
// 🔴 ボトルネック: 623件を同期的に処理
const filteredMapPoints = useMemo(() => {
  if (!state.data) return [];
  return state.data.filter(point => {
    return isPointMatchingFilters(point, filters);
  });
}, [state.data, filters]);
```

**改善案1: チャンク処理（段階的レンダリング）**:

```typescript
import { processInChunksSync } from "@/utils/performanceUtils";

const filteredMapPoints = useMemo(() => {
  if (!state.data) return [];

  // 50件ずつ処理（1チャンク<10ms目標）
  return processInChunksSync(state.data, 50, point => (isPointMatchingFilters(point, filters) ? point : null)).filter(
    (point): point is MapPoint => point !== null
  );
}, [state.data, filters]);
```

**改善案2: 段階的State更新（Progressive Enhancement）**:

```typescript
const [filteredMapPoints, setFilteredMapPoints] = useState<MapPoint[]>([]);

useEffect(() => {
  if (!state.data) {
    setFilteredMapPoints([]);
    return;
  }

  let isCancelled = false;

  async function filterAsync() {
    const results: MapPoint[] = [];

    for (let i = 0; i < state.data.length; i += 50) {
      if (isCancelled) break;

      const chunk = state.data.slice(i, i + 50);
      const filtered = chunk.filter(point => isPointMatchingFilters(point, filters));

      results.push(...filtered);

      // 段階的に結果を反映（ユーザーに進捗を見せる）
      startTransition(() => {
        setFilteredMapPoints([...results]);
      });

      await yieldToMain();
    }
  }

  void filterAsync();

  return () => {
    isCancelled = true;
  };
}, [state.data, filters]);
```

**選択基準**:

- 改善案1: シンプル、useMemo維持（推奨）
- 改善案2: より細かい制御、段階的レンダリング

**テスト要件**:

- ✅ フィルタリング精度維持
- ✅ 大量データ（1000件）でのパフォーマンス
- ✅ フィルター変更時の応答性

**AC**:

- [ ] フィルタリング処理最適化完了
- [ ] 既存テスト全通過
- [ ] パフォーマンス測定: フィルタリング時間<100ms（623件）

**工数**: 12時間

---

#### Task 1.3: useMarkerOptimization 改善（1日）

**対象ファイル**: `src/hooks/map/useMarkerOptimization.ts`

**改善箇所**:

1. **ビューポートフィルタリング**（L132-141）:

```typescript
// Before
const filterByViewport = useCallback(
  (restaurants: readonly Restaurant[]): Restaurant[] => {
    if (!viewportBounds) return restaurants.slice();

    return restaurants.filter(restaurant => {
      // 623件を同期処理
      const { lat, lng } = restaurant.coordinates;
      // ...
    });
  },
  [viewportBounds, isValidCoordinates]
);

// After: チャンク処理
const filterByViewport = useCallback(
  (restaurants: readonly Restaurant[]): Restaurant[] => {
    if (!viewportBounds) return restaurants.slice();

    return processInChunksSync(
      restaurants,
      100, // 100件ずつ
      restaurant => {
        const { lat, lng } = restaurant.coordinates;
        if (!isValidCoordinates(lat, lng)) return null;

        return lat <= viewportBounds.north &&
          lat >= viewportBounds.south &&
          lng <= viewportBounds.east &&
          lng >= viewportBounds.west
          ? restaurant
          : null;
      }
    ).filter((r): r is Restaurant => r !== null);
  },
  [viewportBounds, isValidCoordinates]
);
```

1. **優先度計算の最適化**（L303-335）:

```typescript
// キャッシュ導入
const priorityCache = useRef(new Map<string, number>());

const calculatePriority = useCallback(
  (restaurant: Restaurant): number => {
    const cacheKey = `${restaurant.id}-${viewportBounds?.zoom}`;
    const cached = priorityCache.current.get(cacheKey);
    if (cached !== undefined) return cached;

    // 計算処理
    const priority = /* ... */;
    priorityCache.current.set(cacheKey, priority);

    return priority;
  },
  [viewportBounds]
);
```

**AC**:

- [ ] ビューポートフィルタリング最適化
- [ ] 優先度計算キャッシュ導入
- [ ] パフォーマンス測定: 処理時間<50ms

**工数**: 8時間

---

#### Task 1.4: マーカー描画の段階的レンダリング（1.5日）

**対象コンポーネント**:

- `src/components/map/MapView/IntegratedMapView.tsx`
- `src/components/map/RestaurantMap.tsx`

**実装アプローチ**: Virtualization + Progressive Rendering

```typescript
// IntegratedMapView.tsx
const [visibleMarkers, setVisibleMarkers] = useState<MapPoint[]>([]);
const [renderProgress, setRenderProgress] = useState(0);

useEffect(() => {
  if (mapPoints.length === 0) {
    setVisibleMarkers([]);
    return;
  }

  let isCancelled = false;
  const rendered: MapPoint[] = [];

  async function renderMarkersInChunks() {
    const chunkSize = 50;

    for (let i = 0; i < mapPoints.length; i += chunkSize) {
      if (isCancelled) break;

      const chunk = mapPoints.slice(i, i + chunkSize);
      rendered.push(...chunk);

      startTransition(() => {
        setVisibleMarkers([...rendered]);
        setRenderProgress(Math.min(100, (i / mapPoints.length) * 100));
      });

      await yieldToMain();
    }

    setRenderProgress(100);
  }

  void renderMarkersInChunks();

  return () => {
    isCancelled = true;
  };
}, [mapPoints]);
```

**ローディングインジケーター**:

```tsx
{
  renderProgress > 0 && renderProgress < 100 && (
    <div className="marker-loading" role="status" aria-live="polite">
      マーカー読み込み中... {Math.round(renderProgress)}%
    </div>
  );
}
```

**AC**:

- [ ] 段階的マーカー表示実装
- [ ] ローディングインジケーター追加
- [ ] アクセシビリティ対応（ARIA）

**工数**: 12時間

---

### P1: requestIdleCallback活用（Week 2 - 2日間）

**目標**: 非クリティカル処理の最適化、CPU使用率削減

#### Task 2.1: 統計計算の遅延実行（0.5日）

**対象ファイル**: `src/hooks/map/useMapPoints.ts`（L186-198）

**改善**:

```typescript
// 統計情報の計算（非クリティカル）
const stats = useMemo(() => {
  if (!state.data) return { restaurants: 0, parkings: 0, toilets: 0, total: 0 };

  // 初期値を即座に返す
  const initialStats = {
    restaurants: 0,
    parkings: 0,
    toilets: 0,
    total: state.data.length,
  };

  // 詳細計算はIdle時に
  processWhenIdle(() => {
    const restaurants = state.data.filter(p => p.type === "restaurant").length;
    const parkings = state.data.filter(p => p.type === "parking").length;
    const toilets = state.data.filter(p => p.type === "toilet").length;

    // State更新はstartTransition内で
    startTransition(() => {
      setStats({ restaurants, parkings, toilets, total: state.data.length });
    });
  });

  return initialStats;
}, [state.data]);
```

**AC**:

- [ ] 統計計算の遅延実行実装
- [ ] UI blocking解消確認

**工数**: 4時間

---

#### Task 2.2: ログ出力の最適化（0.5日）

**対象ファイル**: `src/app/App.tsx`（L343-372）

**改善**:

```typescript
useEffect(() => {
  if (!loading && mapPoints.length > 0 && import.meta.env.DEV) {
    // ログ出力をIdle時に遅延
    processWhenIdle(
      () => {
        logUnknownAddressStats();
        testDistrictAccuracy(testCases);
      },
      { timeout: 5000 }
    ); // 5秒以内に実行
  }
}, [loading, mapPoints.length]);
```

**AC**:

- [ ] ログ出力遅延化
- [ ] 初期ロードへの影響除去

**工数**: 2時間

---

#### Task 2.3: パフォーマンス測定の遅延（0.5日）

**対象**: `useMarkerOptimization.ts`（パフォーマンス統計更新）

**改善**:

```typescript
// パフォーマンス統計更新（非クリティカル）
useEffect(() => {
  processWhenIdle(() => {
    setPerformanceStats({
      totalMarkers: optimizedResult.stats.total,
      visibleMarkers: optimizedResult.stats.visible,
      // ...
    });
  });
}, [optimizedResult.stats]);
```

**AC**:

- [ ] パフォーマンス測定遅延化
- [ ] メインスレッド負荷軽減

**工数**: 2時間

---

### P2: Intersection Observer統合（Week 2-3 - 3日間）

**目標**: Google Maps APIの遅延初期化

#### Task 3.1: useIntersectionObserver Hook実装（1日）

**対象ファイル**: `src/hooks/ui/useIntersectionObserver.ts`（新規作成）

**実装**:

```typescript
import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (hasBeenVisible && options.freezeOnceVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        if (visible) {
          setHasBeenVisible(true);
        }
      },
      {
        threshold: options.threshold ?? 0.1,
        root: options.root,
        rootMargin: options.rootMargin ?? "0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.root, options.rootMargin, options.freezeOnceVisible, hasBeenVisible]);

  return [ref, isVisible || hasBeenVisible];
}
```

**テスト要件**:

- ✅ 可視性検出精度
- ✅ freezeOnceVisible動作
- ✅ クリーンアップ処理

**AC**:

- [ ] Hook実装完了
- [ ] テストカバレッジ 100%

**工数**: 8時間

---

#### Task 3.2: IntegratedMapView遅延初期化（1日）

**対象ファイル**: `src/components/map/MapView/IntegratedMapView.tsx`

**改善**:

```typescript
import { useIntersectionObserver } from '@/hooks/ui/useIntersectionObserver';

export function IntegratedMapView({ mapPoints, center, loading, error, userId, customControls }: Props) {
  const [mapContainerRef, isMapVisible] = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  return (
    <div ref={mapContainerRef} className="integrated-map-view">
      {isMapVisible ? (
        <Map
          mapId={mapId}
          defaultCenter={center}
          // ...
        >
          {/* マーカー等 */}
        </Map>
      ) : (
        <div className="map-placeholder" style={{ height: '100vh' }}>
          <LoadingSpinner message="地図を準備中..." />
        </div>
      )}
    </div>
  );
}
```

**AC**:

- [ ] Intersection Observer統合
- [ ] 遅延初期化動作確認
- [ ] プレースホルダーUI実装

**工数**: 8時間

---

#### Task 3.3: パフォーマンス測定・検証（1日）

**測定項目**:

- TBT削減量
- Long Tasks削減数
- Google Maps APIロード遅延効果
- ユーザー体験（体感速度）

**検証方法**:

1. Lighthouse CI実行（Mobile/Desktop）
2. Chrome DevTools Performance分析
3. Real User Monitoring（開発環境）

**AC**:

- [ ] TBT削減確認（-3,000ms以上）
- [ ] Performance Score向上（+10点以上）
- [ ] レポート作成

**工数**: 8時間

---

## 📊 測定・検証計画

### Before/After測定

**測定タイミング**:

- Baseline: Phase 9開始前（Phase 8完了時点のデータ使用）
- Checkpoint 1: Task 1.4完了後（Long Tasks分割完了）
- Checkpoint 2: Task 2.3完了後（requestIdleCallback統合完了）
- Final: Task 3.3完了後（全タスク完了）

**測定環境**:

- Lighthouse CI（Mobile: Slow 4G、Desktop: Custom throttling）
- Chrome DevTools Performance
- `pnpm build` + `pnpm preview`（本番ビルド）

**測定指標**:

| カテゴリ             | 指標                     | 現状     | Checkpoint 1 | Checkpoint 2 | Final目標 |
| -------------------- | ------------------------ | -------- | ------------ | ------------ | --------- |
| Core Web Vitals      | TBT (Mobile)             | 12,670ms | <10,000ms    | <9,000ms     | <8,000ms  |
|                      | TBT (Desktop)            | 2,910ms  | <2,500ms     | <2,000ms     | <1,500ms  |
|                      | Long Tasks (Mobile)      | 20個     | <15個        | <12個        | <10個     |
|                      | Long Tasks (Desktop)     | 14個     | <10個        | <8個         | <7個      |
| Performance Score    | Mobile                   | 60       | 65+          | 70+          | 75+       |
|                      | Desktop                  | 61       | 68+          | 73+          | 78+       |
| JavaScript Execution | メインスレッド (Mobile)  | 24.7s    | <20s         | <18s         | <15s      |
|                      | メインスレッド (Desktop) | 6.4s     | <5.5s        | <5.0s        | <4.5s     |

---

## 🎯 成功基準

### Minimum Success Criteria（必達）

- ✅ TBT削減: -4,000ms以上（Mobile）
- ✅ Long Tasks削減: 20 → 10以下（Mobile）
- ✅ Performance Score: +15点以上（Mobile）
- ✅ 全テスト通過（1797 tests）
- ✅ カバレッジ維持: 75%以上

### Target Success Criteria（目標）

- 🎯 TBT削減: -6,000ms（Mobile）
- 🎯 Performance Score: 75+（Mobile）
- 🎯 Long Tasks: <8個（Mobile）
- 🎯 Lighthouse CI自動化（PR毎）

### Stretch Goals（理想）

- 🚀 TBT: <5,000ms（-60%削減）
- 🚀 Performance Score: 80+
- 🚀 Desktop: Performance Score 85+

---

## 🗓️ スケジュール

### Week 1: Long Tasks分割（5日間）

| Day     | タスク                               | 工数 | 担当 |
| ------- | ------------------------------------ | ---- | ---- |
| Day 1   | Task 1.1: processInChunks実装        | 8h   | Dev  |
| Day 2-3 | Task 1.2: useMapPoints最適化         | 12h  | Dev  |
| Day 4   | Task 1.3: useMarkerOptimization改善  | 8h   | Dev  |
| Day 5-6 | Task 1.4: マーカー段階的レンダリング | 12h  | Dev  |

**Checkpoint 1**: Lighthouse測定（Day 6終了時）

### Week 2: requestIdleCallback + Intersection Observer（4日間）

| Day    | タスク                                | 工数 | 担当 |
| ------ | ------------------------------------- | ---- | ---- |
| Day 7  | Task 2.1-2.3: requestIdleCallback統合 | 8h   | Dev  |
| Day 8  | Task 3.1: useIntersectionObserver実装 | 8h   | Dev  |
| Day 9  | Task 3.2: IntegratedMapView遅延初期化 | 8h   | Dev  |
| Day 10 | Task 3.3: パフォーマンス測定・検証    | 8h   | Dev  |

**Final Checkpoint**: 総合パフォーマンス測定（Day 10終了時）

### Week 3: バッファ・文書化（2日間）

| Day    | タスク                  | 工数 | 担当 |
| ------ | ----------------------- | ---- | ---- |
| Day 11 | バグ修正・調整          | 8h   | Dev  |
| Day 12 | Phase 9完了レポート作成 | 4h   | Dev  |

**Total**: 12営業日（2.5週間）

---

## 🚨 リスク管理

### 想定リスクと対策

| リスク                             | 影響度 | 確率 | 対策                                                                     |
| ---------------------------------- | ------ | ---- | ------------------------------------------------------------------------ |
| **processInChunks実装の複雑化**    | 高     | 中   | シンプルな実装から開始、段階的に機能追加、既存ロジック維持               |
| **パフォーマンス改善効果が限定的** | 高     | 低   | Checkpoint毎に測定、効果が薄い場合は早期に方針転換、Phase 8の教訓を活用  |
| **既存機能のリグレッション**       | 中     | 中   | 全テスト実行（1797 tests）、手動テスト実施、段階的リリース               |
| **Intersection Observer互換性**    | 低     | 低   | Polyfill準備、フォールバック実装、ブラウザサポート確認                   |
| **ユーザー体験の悪化**             | 高     | 低   | ローディング状態の明示、段階的レンダリングのUX検証、アクセシビリティ対応 |

### ロールバック計画

**各Taskにおける安全策**:

- ✅ Feature Flag導入検討（環境変数での切り替え）
- ✅ 既存コードを残してバックアップ（コメントアウト）
- ✅ Git commit単位を細かく（1 Task = 1 commit）

**緊急時の対応**:

1. `git revert` で該当コミット取り消し
2. Lighthouse再測定で影響確認
3. 代替アプローチを検討

---

## 📈 期待効果

### パフォーマンス改善効果（推定）

| 改善施策                  | TBT削減 (Mobile)       | TBT削減 (Desktop)      | 根拠                              |
| ------------------------- | ---------------------- | ---------------------- | --------------------------------- |
| **Long Tasks分割**        | -3,000ms〜-4,000ms     | -800ms〜-1,000ms       | Phase 8教訓: 実行時最適化が鍵     |
| **requestIdleCallback**   | -500ms〜-1,000ms       | -200ms〜-400ms         | 非クリティカル処理の遅延          |
| **Intersection Observer** | -1,000ms〜-2,000ms     | -300ms〜-500ms         | Google Maps API遅延効果（未測定） |
| **Total**                 | **-4,500ms〜-7,000ms** | **-1,300ms〜-1,900ms** | Phase 9全体                       |

**保守的見積もり**: TBT -4,500ms（Mobile）、-1,300ms（Desktop）
**楽観的見積もり**: TBT -7,000ms（Mobile）、-1,900ms（Desktop）

### ユーザー体験改善

- ✅ 初回ロード時の応答性向上
- ✅ フィルター操作時のスムーズな動作
- ✅ マーカー表示の段階的フィードバック
- ✅ 低スペック端末でのパフォーマンス向上

---

## 🔄 Phase 10への移行準備

### Phase 9完了後の次ステップ候補

1. **(P1) E2Eテスト導入** - Playwright統合
   - FilterModal skipped tests（4件）の解消
   - Critical user flowsの自動化
   - CI/CD統合

2. **(P2) Web Worker導入** - データ処理のバックグラウンド化
   - フィルタリング処理をWorkerへ
   - ソート処理のオフロード
   - ROI検証後に判断

3. **(P2) Render Blocking解消** - FCP最適化
   - フォント最適化（font-display: swap）
   - Critical CSS Inline化
   - Above-the-fold最適化

4. **(P3) Dashboard実装** - 新機能追加
   - 統計ダッシュボード
   - ユーザー設定画面
   - React.lazy適用

### Phase 9の学び

**成功要因の記録**:

- ✅ どの施策が最も効果的だったか
- ✅ 予想外の問題と解決策
- ✅ パフォーマンス測定のベストプラクティス

**Phase 10への提言**:

- 実測データに基づく優先度付け
- 早期の効果検証（Checkpoint導入）
- Phase 8/9の教訓活用

---

## 📚 参考資料

### 内部ドキュメント

- [Phase 8完了レポート](./phase8-completion-report.md)
- [Phase 8 Lighthouse Results](../phase8/PHASE8_LIGHTHOUSE_RESULTS.md)
- [Phase 8 Task 2 Baseline](../phase8/PHASE8_TASK2_BASELINE.md)
- [Shared Glossary](../../guidelines/SHARED_GLOSSARY.md)

### 外部リソース

- [Web.dev: Long Tasks](https://web.dev/long-tasks-devtools/)
- [Chrome Developers: Optimize LCP](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)
- [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Scheduler.yield()](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield)

---

## ✅ Approval

**作成者**: AI Programming Assistant
**レビュー**: Dev（プロジェクトオーナー）
**承認日**: 2025年12月8日

**Phase 9開始条件**:

- [x] Phase 8完了（バンドル最適化済み）
- [x] カバレッジ75%達成
- [x] 全テスト通過（1797 tests）
- [x] Phase 9計画レビュー完了

**Phase 9開始予定日**: TBD（Dev判断）

---

**Version**: 1.0
**Last Updated**: 2025年12月8日
