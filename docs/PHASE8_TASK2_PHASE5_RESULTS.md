# Phase 8 Task 2 - Phase 5 (Minification) Results

**Date**: 2025-10-05
**Optimization**: Terser設定強化（console.log削除、デッドコード除去、条件式最適化）
**Branch**: main
**Commit**: TBD

---

## Executive Summary

### 🎯 Goal vs. Reality

| Metric                         | Baseline  | Target (Phase 5) | Actual        | Status        |
| ------------------------------ | --------- | ---------------- | ------------- | ------------- |
| **Bundle Size (raw)**          | 352.34 KB | ~340 KB (-3%)    | **345.14 KB** | ✅ **-2.0%**  |
| **Bundle Size (gzip)**         | 113.89 KB | ~108 KB (-5%)    | **111.00 KB** | ✅ **-2.5%**  |
| **Performance Score (Mobile)** | 53        | 55+              | **60**        | ✅ **+13%**   |
| **TBT (Mobile)**               | 12,770 ms | <12,000 ms       | **14,240 ms** | ❌ **+11.5%** |
| **Unused JS (Mobile)**         | 359 KiB   | <350 KiB         | **381 KiB**   | ❌ **+6.1%**  |

**結論**: Bundle Size削減成功（-7.20 KB）、しかし**TBT悪化+1,470ms**、**Unused JS増加+22 KiB**。Terser最適化だけでは不十分。

---

## 1. Bundle Size Analysis

### Before vs. After (Terser Optimization)

| Chunk                 | Before (raw/gzip)         | After (raw/gzip)          | 削減量                  | 削減率              |
| --------------------- | ------------------------- | ------------------------- | ----------------------- | ------------------- |
| **react-vendor**      | 210.54 KB / 67.49 KB      | **208.71 KB / 66.81 KB**  | -1.83 KB / -0.68 KB     | **-0.9% / -1.0%**   |
| **data-processing**   | 36.82 KB / 12.80 KB       | **34.82 KB / 12.33 KB**   | -2.00 KB / -0.47 KB     | **-5.4% / -3.7%**   |
| **ui-components**     | 34.72 KB / 9.47 KB        | **34.41 KB / 9.34 KB**    | -0.31 KB / -0.13 KB     | **-0.9% / -1.4%**   |
| **App**               | 21.72 KB / 7.00 KB        | **18.92 KB / 6.10 KB**    | -2.80 KB / -0.90 KB     | **-12.9% / -12.9%** |
| **IntegratedMapView** | 20.11 KB / 6.39 KB        | **19.77 KB / 6.27 KB**    | -0.34 KB / -0.12 KB     | **-1.7% / -1.9%**   |
| **markers**           | 15.87 KB / 5.05 KB        | **15.87 KB / 5.05 KB**    | ±0 KB                   | **0%**              |
| **Total JavaScript**  | **352.34 KB / 113.89 KB** | **345.14 KB / 111.00 KB** | **-7.20 KB / -2.89 KB** | **-2.0% / -2.5%**   |

### Key Observations

1. **最大削減**: `App.js` -12.9% (console.log除去効果顕著)
2. **data-processing削減**: -5.4% (開発環境デバッグコード除去)
3. **react-vendor削減**: -0.9% (React本体への影響は軽微)
4. **Build時間**: 7.20s (前回7.81s → -0.61s高速化)

---

## 2. Lighthouse Results

### 2.1 Mobile (Slow 4G)

#### Performance Metrics

| Metric                | Baseline  | After Phase 5 | 変化量                 | 評価        |
| --------------------- | --------- | ------------- | ---------------------- | ----------- |
| **Performance Score** | 53        | **60**        | **+7 (+13%)**          | ✅ 改善     |
| **FCP**               | 1.9 s     | **1.8 s**     | **-0.1 s**             | ✅ 改善     |
| **LCP**               | 2.1 s     | **1.9 s**     | **-0.2 s**             | ✅ 改善     |
| **TBT**               | 12,770 ms | **14,240 ms** | **+1,470 ms (+11.5%)** | ❌ **悪化** |
| **CLS**               | 0         | **0**         | ±0                     | ✅ 維持     |
| **SI**                | 9.7 s     | **9.6 s**     | **-0.1 s**             | ✅ 改善     |

#### Key Diagnostics

| Item                  | Baseline | After Phase 5 | 変化量              |
| --------------------- | -------- | ------------- | ------------------- |
| **Main-thread Work**  | 26.1 s   | **26.4 s**    | **+0.3 s**          |
| **Unused JavaScript** | 359 KiB  | **381 KiB**   | **+22 KiB (+6.1%)** |
| **JS Execution Time** | 11.4 s   | **11.9 s**    | **+0.5 s**          |
| **Long Tasks**        | 18 tasks | **20 tasks**  | **+2 tasks**        |

### 2.2 Desktop (Custom Throttling)

#### Performance Metrics

| Metric                | Baseline | After Phase 5 | 変化量               | 評価            |
| --------------------- | -------- | ------------- | -------------------- | --------------- |
| **Performance Score** | 58       | **60**        | **+2 (+3%)**         | ✅ 改善         |
| **FCP**               | 0.7 s    | **0.5 s**     | **-0.2 s**           | ✅ 改善         |
| **LCP**               | 1.5 s    | **0.5 s**     | **-1.0 s**           | ✅ **大幅改善** |
| **TBT**               | 2,630 ms | **2,970 ms**  | **+340 ms (+12.9%)** | ❌ **悪化**     |
| **CLS**               | 0        | **0**         | ±0                   | ✅ 維持         |
| **SI**                | 2.4 s    | **5.1 s**     | **+2.7 s (+112%)**   | ❌ **大幅悪化** |

#### Key Diagnostics

| Item                  | Baseline        | After Phase 5 | 変化量              |
| --------------------- | --------------- | ------------- | ------------------- |
| **Main-thread Work**  | ~7.0 s (推定)   | **6.9 s**     | **-0.1 s**          |
| **Unused JavaScript** | 345 KiB         | **373 KiB**   | **+28 KiB (+8.1%)** |
| **JS Execution Time** | ~3.0 s (推定)   | **3.1 s**     | **+0.1 s**          |
| **Long Tasks**        | 12 tasks (推定) | **14 tasks**  | **+2 tasks**        |

---

## 3. Critical Analysis: Why Performance Degraded?

### 🔍 Key Findings

#### Mobile & Desktop共通の傾向

1. **TBT悪化**:
   - Mobile: +1,470 ms (+11.5%)
   - Desktop: +340 ms (+12.9%)
   - → **両環境で一貫して悪化**

2. **Unused JavaScript増加**:
   - Mobile: +22 KiB (+6.1%)
   - Desktop: +28 KiB (+8.1%)
   - → **圧縮しても未使用コードは残存**

3. **Long Tasks増加**:
   - 両環境で +2 tasks
   - → **コード密度上昇の証拠**

#### Desktop特有の問題

1. **Speed Index大幅悪化**: 2.4s → 5.1s (+112%)
   - 原因: FCP/LCPは改善したが、視覚的進行が遅延
   - 仮説: 初期レンダリング後のJavaScript実行が重くなった

### 🔬 Root Cause Analysis

#### Terser最適化の副作用

1. **コード密度の上昇**:
   - `collapse_vars`, `reduce_vars` により変数インライン化
   - 1つのJavaScript Taskがより多くの処理を含むように変化
   - → Long Task数増加（18→20, 12→14）

2. **未使用コード削除の限界**:
   - Terser: **圧縮** はするが、**削除** はしない
   - Google Maps API未使用機能、React内部機能が残存
   - Tree-Shaking不足

3. **実行時オーバーヘッド**:
   - 圧縮されたコードは人間には読みにくいが、**ブラウザ解析コストは変わらない**
   - むしろ、変数名短縮によりGC負荷が増加する可能性

### 📊 Performance Score改善の矛盾

| Environment | Score     | FCP/LCP     | TBT     | 総合評価                        |
| ----------- | --------- | ----------- | ------- | ------------------------------- |
| Mobile      | +7 (+13%) | ✅ 改善     | ❌ 悪化 | ⚠️ Score改善はFCP/LCP重視の結果 |
| Desktop     | +2 (+3%)  | ✅ 大幅改善 | ❌ 悪化 | ⚠️ SI大幅悪化がScore改善を相殺  |

**結論**: Performance Score改善は**初期表示高速化（FCP/LCP）**によるもので、**実行時パフォーマンス（TBT）は悪化**。

### 🎯 Phase 5の限界

- **Minification = コード圧縮** だけでは、実行時パフォーマンス改善に不十分
- **Tree-Shaking** (未使用コード削除) が必要
- **Dynamic Imports** (遅延ロード) が必要
- **Code Splitting** (精密な分割) が必要

---

## 4. Terser Configuration Applied

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: isProduction, // ✅ console.log削除
        pure_funcs: isProduction ? ["console.log", "console.info", "console.debug", "console.trace"] : [],
        dead_code: true, // ✅ デッドコード除去
        unused: true, // ✅ 未使用変数除去
        conditionals: true, // ✅ 条件式最適化
        evaluate: true,
        collapse_vars: true, // ⚠️ 変数インライン化 → 密度上昇
        reduce_vars: true, // ⚠️ 変数削減 → 密度上昇
      },
      mangle: {
        safari10: true,
        toplevel: false,
      },
      format: {
        comments: /^!/, // ライセンスコメント保持
      },
    },
  },
});
```

### Verification

- ✅ **Build成功**: 7.20s、エラーなし
- ✅ **Bundle Size削減**: -7.20 KB (-2.0%)
- ✅ **PWA Precache削減**: -7.44 KiB
- ❌ **TBT改善**: 期待外れ（悪化+11.5%）

---

## 5. Insights Summary

### ✅ What Worked

1. **Bundle Size削減**: -7.20 KB (-2.0%) 達成
2. **Performance Score改善**:
   - Mobile: 53→60 (+13%)
   - Desktop: 58→60 (+3%)
3. **FCP/LCP改善**:
   - Mobile: FCP -0.1s, LCP -0.2s
   - Desktop: FCP -0.2s, LCP **-1.0s** (大幅改善)
4. **console.log削除**: App.js -12.9%削減効果
5. **Build時間短縮**: 7.81s → 7.20s (-0.61s)

### ❌ What Didn't Work

1. **TBT悪化（両環境）**:
   - Mobile: +1,470ms (+11.5%)
   - Desktop: +340ms (+12.9%)
   - → **実行時パフォーマンス悪化**

2. **Unused JS増加（両環境）**:
   - Mobile: +22 KiB (+6.1%)
   - Desktop: +28 KiB (+8.1%)
   - → **Tree-Shaking不足**

3. **Long Tasks増加（両環境）**:
   - Mobile: 18→20 tasks (+2)
   - Desktop: 12→14 tasks (+2)
   - → **コード密度上昇の副作用**

4. **Speed Index大幅悪化（Desktop）**:
   - 2.4s → 5.1s (+112%)
   - → **視覚的進行の遅延**

### 📊 Root Cause

- **Terser最適化 = 圧縮** であり、**削除ではない**
- Bundle Sizeは削減できたが、**ブラウザ実行コストは変わらない**
- **未使用コード削除** には以下が必要:
  1. **Tree-Shaking**: Named imports、Conditional imports
  2. **Dynamic Imports**: 遅延ロード（Google Maps、Analytics）
  3. **Code Splitting**: 精密なmanualChunks

### 🔄 Strategy Pivot Required

**Phase 5単体では目標達成不可**。Phase 2-4の並行実装が必須。

---

## 6. Next Steps: Phase 2-4 Implementation

### Phase 2: Tree-Shaking改善（推定-30~50 KiB）

1. **Named Imports統一**:

   ```typescript
   // Before: import * as utils from './utils'
   // After: import { districtUtils, securityUtils } from './utils'
   ```

2. **Conditional Imports実装**:

   ```typescript
   // 開発環境デバッグコードを本番で完全除外
   if (import.meta.env.DEV) {
     const { devTools } = await import("./devTools");
     devTools.init();
   }
   ```

3. **sideEffects設定**: package.json追加

### Phase 3: Dynamic Imports強化（推定-100~150 KiB）

1. **Google Maps API遅延化**:

   ```typescript
   // 初期ロード時は読み込まず、マップ表示時のみロード
   const { Loader } = await import("@googlemaps/js-api-loader");
   ```

2. **Icon loading最適化**:

   ```typescript
   // 623アイコンを初期ロード時に全読み込みしない
   const icon = await import(`./icons/${cuisineType}.svg`);
   ```

3. **Analytics遅延化**: 2秒後にロード

### Phase 4: Code Splitting精密化（推定-20~30 KiB）

1. **manualChunks改善**: google-maps専用チャンク分離
2. **Shared dependencies最適化**: react-vendor分割

---

## 7. Success Criteria (Updated)

### Minimum (Phase 5完了時点) - ❌ 未達成

| Metric            | Target    | Actual (Mobile) | Actual (Desktop) | Status        |
| ----------------- | --------- | --------------- | ---------------- | ------------- |
| TBT               | <12,000ms | **14,240ms**    | **2,970ms**      | ❌ Mobile悪化 |
| Performance Score | >55       | **60**          | **60**           | ✅ 達成       |
| Unused JS         | <350 KiB  | **381 KiB**     | **373 KiB**      | ❌ 増加       |

**結論**: Performance Score改善のみ達成、TBT・Unused JSは悪化。

### Target (Phase 2-4完了後)

| Metric                      | Baseline | Target    | 削減率 |
| --------------------------- | -------- | --------- | ------ |
| TBT (Mobile)                | 12,770ms | <10,000ms | -22%   |
| TBT (Desktop)               | 2,630ms  | <2,000ms  | -24%   |
| Performance Score (Mobile)  | 53       | >65       | +23%   |
| Performance Score (Desktop) | 58       | >70       | +21%   |
| Unused JS (Mobile)          | 359 KiB  | <250 KiB  | -30%   |
| Unused JS (Desktop)         | 345 KiB  | <240 KiB  | -30%   |

### Stretch (Phase 2-4最適化後)

| Metric                      | Baseline | Target   | 削減率 |
| --------------------------- | -------- | -------- | ------ |
| TBT (Mobile)                | 12,770ms | <8,000ms | -37%   |
| TBT (Desktop)               | 2,630ms  | <1,500ms | -43%   |
| Performance Score (Mobile)  | 53       | >70      | +32%   |
| Performance Score (Desktop) | 58       | >75      | +29%   |
| Unused JS (Mobile)          | 359 KiB  | <200 KiB | -44%   |
| Unused JS (Desktop)         | 345 KiB  | <180 KiB | -48%   |

---

## 8. Lessons Learned

1. **Terser最適化の限界**:
   - Bundle Size削減: ✅ -2.0%
   - TBT改善: ❌ 両環境で悪化（+11~13%）
   - Unused JS削減: ❌ 増加（+6~8%）
   - **結論**: **圧縮 ≠ 削除 ≠ 高速化**

2. **コード密度と実行時パフォーマンス**:
   - `collapse_vars`, `reduce_vars` → 変数インライン化
   - → 1 Task当たりの処理量増加
   - → Long Tasks増加（+2 tasks両環境）
   - → TBT悪化の主原因

3. **Performance Scoreの罠**:
   - Score改善 ≠ 実行時パフォーマンス改善
   - FCP/LCP改善がScoreを押し上げたが、TBTは悪化
   - → **総合的な指標確認が必須**

4. **Desktop特有の問題**:
   - Speed Index大幅悪化（+112%）
   - FCP/LCP改善にもかかわらず視覚的進行遅延
   - → 初期レンダリング後のJavaScript実行負荷増加

5. **測定環境の重要性**:
   - IndexedDB警告あり（キャッシュ影響）
   - Incognitoモード推奨
   - 複数回測定で平均値取得

6. **Phase 5単体では不十分**:
   - Minificationだけでは目標達成不可
   - Phase 2-4の並行実装が必須
   - 次回: Tree-Shaking優先実装

---

## 9. Implementation Checklist

### Phase 5 (Minification) - ✅ 完了

- [x] Terser設定追加（vite.config.ts）
- [x] Build実行、Bundle Size測定
- [x] Lighthouse Mobile測定
- [x] 結果ドキュメント作成

### Phase 2 (Tree-Shaking) - ⬜ 次回実装

- [ ] Named Imports統一（grep調査 → 修正）
- [ ] Conditional Imports実装（開発環境コード分離）
- [ ] package.json sideEffects設定
- [ ] Build → Lighthouse測定

### Phase 3 (Dynamic Imports) - ⬜ 次回実装

- [ ] Google Maps API遅延化
- [ ] Icon loading最適化
- [ ] Analytics遅延化
- [ ] Build → Lighthouse測定

### Phase 4 (Code Splitting) - ⬜ 次回実装

- [ ] manualChunks改善（google-maps分離）
- [ ] Shared dependencies最適化
- [ ] Build → Lighthouse測定

---

## 10. References

- **Baseline**: [PHASE8_TASK2_BASELINE.md](./PHASE8_TASK2_BASELINE.md)
- **Terser Docs**: <https://terser.org/docs/options/>
- **Vite Build Optimization**: <https://vite.dev/guide/build#build-optimizations>
- **Lighthouse Metrics**: <https://developer.chrome.com/docs/lighthouse/performance/>

---

**Next Action**: Desktop測定 → Phase 2実装計画策定 → Tree-Shaking実装開始
