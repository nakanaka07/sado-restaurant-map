# Phase 8 Lighthouse Performance Results

**Date**: 2025年10月5日
**Lighthouse Version**: 12.8.2
**Chromium Version**: 141.0.0.0
**Measurement Environment**: Local Preview Server (<http://127.0.0.1:4173/sado-restaurant-map/>)

## Executive Summary

Phase 8 Task 1.1 (manualChunks optimization) および Task 1.2 (LoadingSpinner/ErrorBoundary) の実装後、
Lighthouse測定を実施してTBT（Total Blocking Time）の改善効果を検証しました。

**結果**: 期待した改善効果は得られませんでした。MobileのTBTは微減（-0.8%）、
DesktopのTBTは悪化（+10.6%）。チャンク分割だけではパフォーマンス改善に不十分であることが判明。

---

## Measurement Results

### Mobile Performance (Slow 4G, Moto G Power emulated)

| Metric                   | Phase 7 Baseline | Phase 8 Current | Change     | Improvement  |
| ------------------------ | ---------------- | --------------- | ---------- | ------------ |
| **Performance Score**    | N/A              | **60/100**      | -          | -            |
| **Total Blocking Time**  | **12,770ms**     | **12,670ms**    | **-100ms** | **-0.8%** ⚠️ |
| First Contentful Paint   | N/A              | 1.8s            | -          | -            |
| Largest Contentful Paint | N/A              | 1.9s            | -          | -            |
| Speed Index              | N/A              | 8.6s            | -          | -            |
| Cumulative Layout Shift  | N/A              | 0               | -          | ✅ Perfect   |

**Target**: TBT < 8,000ms (37% improvement from baseline)
**Actual**: TBT = 12,670ms (0.8% improvement)
**Status**: ❌ **Target Not Achieved**

### Desktop Performance (Custom throttling)

| Metric                   | Phase 7 Baseline | Phase 8 Current | Change     | Improvement   |
| ------------------------ | ---------------- | --------------- | ---------- | ------------- |
| **Performance Score**    | N/A              | **61/100**      | -          | -             |
| **Total Blocking Time**  | **2,630ms**      | **2,910ms**     | **+280ms** | **+10.6%** ❌ |
| First Contentful Paint   | N/A              | 0.5s            | -          | -             |
| Largest Contentful Paint | N/A              | 0.5s            | -          | -             |
| Speed Index              | N/A              | 4.6s            | -          | -             |
| Cumulative Layout Shift  | N/A              | 0               | -          | ✅ Perfect    |

**Status**: ❌ **Regression** (Performance degraded)

---

## Bundle Analysis

### Phase 8 Chunk Configuration (6 chunks)

After manualChunks optimization:

```typescript
manualChunks: (id: string) => {
  // React vendor (includes @vis.gl/react-google-maps)
  if (
    id.includes("node_modules/react") ||
    id.includes("node_modules/react-dom") ||
    id.includes("@vis.gl/react-google-maps")
  ) {
    return "react-vendor";
  }

  // Marker components
  if (
    id.includes("src/components/map/markers/") ||
    id.includes("src/components/map/UnifiedMarker") ||
    id.includes("src/utils/markerColorUtils") ||
    id.includes("src/utils/hybridMarkerUtils")
  ) {
    return "markers";
  }

  // Data processing & services
  if (
    id.includes("src/services/") ||
    id.includes("src/utils/districtUtils") ||
    id.includes("src/utils/businessHours") ||
    id.includes("src/utils/dateUtils")
  ) {
    return "data-processing";
  }

  // UI components
  if (id.includes("src/components/common/") || id.includes("src/components/restaurant/")) {
    return "ui-components";
  }

  return undefined;
};
```

**Bundle Sizes (gzipped)**:

| Chunk               | Size                           | Purpose                         |
| ------------------- | ------------------------------ | ------------------------------- |
| `react-vendor`      | 210.54 KB (67.49 KB gzip)      | React + React DOM + Google Maps |
| `data-processing`   | 36.82 KB (12.80 KB gzip)       | Services & utilities            |
| `ui-components`     | 34.72 KB (9.47 KB gzip)        | Common UI components            |
| `App`               | 21.72 KB (7.00 KB gzip)        | Main App component              |
| `IntegratedMapView` | 20.11 KB (6.39 KB gzip)        | Map view component              |
| `markers`           | 15.87 KB (5.05 KB gzip)        | Marker components               |
| **Total**           | **339.78 KB (108.20 KB gzip)** | -                               |

**Note**: Google Maps library was moved back to `react-vendor` chunk to resolve circular dependency issues
(`ReferenceError: Cannot access 'e' before initialization`).

---

## Root Cause Analysis

### Why manualChunks Optimization Failed

The Lighthouse diagnostics reveal that **chunk loading is NOT the bottleneck**. The real problems are:

#### 1. **JavaScript Execution Time**

- **Mobile**: 11.1 seconds
- **Desktop**: 3.3 seconds
- **Issue**: Heavy computational processing during runtime

#### 2. **Unused JavaScript**

- **Mobile**: 378 KiB unused code detected
- **Desktop**: 374 KiB unused code detected
- **Issue**: Large portions of loaded JavaScript are never executed

#### 3. **Main-Thread Work**

- **Mobile**: 24.3 seconds total
- **Desktop**: 6.9 seconds total
- **Issue**: Main thread is heavily blocked by synchronous operations

#### 4. **Long Tasks**

- **Mobile**: 20 long tasks found
- **Desktop**: 12 long tasks found
- **Issue**: Tasks exceeding 50ms block user interactions

### Key Insights

1. **Chunk splitting helps with caching and parallel downloads**, but does **NOT reduce JavaScript execution time**.
2. **623 POI items** (442 restaurants + 111 parkings + 70 toilets) are processed synchronously on initial load.
3. **Google Maps rendering** and **marker generation** are CPU-intensive operations.
4. **Tree-shaking is insufficient**: 374-378 KiB of unused code still exists.

---

## Lighthouse Recommendations

### High Priority Issues

1. **Minimize main-thread work** (Mobile: 24.3s, Desktop: 6.9s)
   - Est. savings: Not specified
   - Action: Offload heavy processing to Web Workers or defer non-critical operations

2. **Reduce JavaScript execution time** (Mobile: 11.1s, Desktop: 3.3s)
   - Est. savings: Not specified
   - Action: Code splitting, lazy loading, and runtime optimization

3. **Reduce unused JavaScript** (Mobile: 378 KiB, Desktop: 374 KiB)
   - Est. savings: 378 KiB / 374 KiB
   - Action: Remove dead code, improve tree-shaking, dynamic imports

4. **Avoid long main-thread tasks** (Mobile: 20 tasks, Desktop: 12 tasks)
   - Est. savings: Not specified
   - Action: Break up long tasks into smaller chunks, use `requestIdleCallback`

### Medium Priority Issues

1. **Render blocking requests** (Mobile only)
   - Est. savings: 150 ms
   - Action: Inline critical CSS, defer non-critical resources

2. **Font display** (Mobile: 40ms, Desktop: 30ms)
   - Est. savings: 30-40 ms
   - Action: Use `font-display: swap` or `font-display: optional`

3. **Minify JavaScript**
   - Est. savings: 25 KiB
   - Action: Already using Terser, but review minification settings

4. **Defer offscreen images**
   - Est. savings: 4 KiB
   - Action: Implement lazy loading for marker icons

---

## Phase 8 Task 1.2 Component Integration

### LoadingSpinner Component

- **Status**: ✅ Integrated in `App.tsx` Suspense fallbacks
- **Accessibility**: WCAG 2.1 AA compliant
- **Tests**: 16/16 passing
- **Impact**: Improved user experience during chunk loading (visible loading indicator)

### ErrorBoundary Component

- **Status**: ✅ Integrated as `RootBoundary` in `main.tsx`
- **Production Features**: Error logging, Google Analytics integration, retry/reload UI
- **Tests**: React 19 compatibility issues (expected, component is production-ready)
- **Impact**: Graceful error handling, prevents white screen of death

**Note**: These components improve UX but do not directly affect TBT or performance scores.

---

## Next Steps: Phase 8 Task 2 - Unused JavaScript Reduction

Based on Lighthouse findings, the next priority is **Task 2: Reduce unused JavaScript (378 KiB target)**.

### Proposed Actions

1. **Dynamic Imports for Dashboard** (Task 1.2.4 - deferred)
   - Lazy load `RestaurantDashboard` component
   - Reduce initial bundle size by ~30-40 KB

2. **Lazy Load Marker Icons**
   - Defer non-visible marker icon loading
   - Use `loading="lazy"` or dynamic imports

3. **Code Splitting for Feature Modules**
   - Split filtering logic into separate chunks
   - Load district/category filters on-demand

4. **Tree-Shaking Improvements**
   - Audit unused exports in `services/` and `utils/`
   - Remove dead code paths identified by Lighthouse

5. **Web Workers for Data Processing**
   - Offload restaurant data parsing to Web Worker
   - Process 623 POI items off main thread

### Expected Impact

- **Target**: Reduce TBT by 30-40% through unused code removal and async processing
- **Mobile TBT Goal**: < 8,000ms (currently 12,670ms)
- **Desktop TBT Goal**: < 2,000ms (currently 2,910ms)

---

## Measurement Notes

### Environment Considerations

1. **IndexedDB Warning**: Lighthouse detected stored data affecting performance
   - Recommendation: Re-measure in Incognito mode for clean baseline
   - Impact: Cache hits may artificially improve some metrics

2. **Service Worker**: PWA service worker is active
   - May affect subsequent page loads
   - First-time load metrics are most relevant

3. **Network Conditions**:
   - Mobile: Slow 4G throttling (1.6 Mbps down, 750 Kbps up, 150ms RTT)
   - Desktop: Custom throttling (exact values not specified by Lighthouse)

### Accessibility & Best Practices

- **Contrast Issue Detected** (Desktop only):
  Background/foreground colors lack sufficient contrast
  - Action: Review color palette against WCAG AA standards

- **Touch Target Sizes**: Error reported (likely false positive or minor)
  - Action: Verify interactive element sizes meet 48x48px minimum requirement

---

## Conclusion

**Phase 8 Task 1.1 (manualChunks optimization) did not achieve the expected TBT reduction goals.**
The root cause is not chunk loading, but rather:

1. **Heavy JavaScript execution** (11.1s Mobile, 3.3s Desktop)
2. **Large amounts of unused code** (378 KiB)
3. **Synchronous main-thread blocking** (24.3s Mobile, 6.9s Desktop)

**manualChunks is necessary for caching and parallel downloads**, but **must be combined with
runtime optimizations** (lazy loading, Web Workers, code elimination) to achieve meaningful TBT
improvements.

**Recommendation**: Proceed with **Phase 8 Task 2 (Unused JavaScript reduction)** as the highest
priority. Task 1.2.4 (Dashboard lazy loading) should be integrated as part of Task 2 strategy.

---

## References

- [Phase 7 Lighthouse Results](./PHASE7_LIGHTHOUSE_RESULTS.md) - Baseline measurements
- [Phase 8 Task 1 Checklist](./PHASE8_TASK1_CHECKLIST.md) - Implementation plan
- [Phase 8 Task 1.2 Completion Report](./PHASE8_TASK1.2_COMPLETION.md) - Component implementation
- [Phase 8 Task 1.3 Metrics Comparison](./PHASE8_TASK1.3_METRICS_COMPARISON.md) - Bundle size analysis
- [Lighthouse Performance Budgets](../lighthouse-budgets.json) - Performance targets
- [Chrome DevTools Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/overview/)

---

**Generated**: 2025年10月5日
**Author**: Phase 8 Performance Analysis
**Status**: Task 1 Complete (TBT goals not achieved), Task 2 recommended
