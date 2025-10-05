# Phase 8 Task 2: Unused JavaScript削減 - Baseline測定

**作成日**: 2025年10月5日
**目標**: 378 KiB削減、TBT <8,000ms達成
**前提**: Task 1.1/1.2完了、Task 1.2.4スキップ

---

## 📊 Baseline Bundle Size (Task 2開始前)

### JavaScript Chunks

| Chunk                                 | Size      | Gzip     | Description                     |
| ------------------------------------- | --------- | -------- | ------------------------------- |
| `react-vendor-BsL71oEA.js`            | 210.54 KB | 67.49 KB | React core, react-dom, router   |
| `data-processing-DQM-0p3G.js`         | 36.82 KB  | 12.80 KB | Data processing, sheets service |
| `ui-components-6dF_RaOn.js`           | 34.72 KB  | 9.47 KB  | UI components                   |
| `App-AhyQiZuq.js`                     | 21.72 KB  | 7.00 KB  | Main app component              |
| `IntegratedMapView-DckkwVe_.js`       | 20.11 KB  | 6.39 KB  | Map view (lazy loaded)          |
| `markers-CYmXLegK.js`                 | 15.87 KB  | 5.05 KB  | Marker components               |
| `workbox-window.prod.es5-DMXp7Fa7.js` | 5.69 KB   | 2.29 KB  | PWA workbox                     |
| `index-DukbfJq-.js`                   | 3.12 KB   | 1.49 KB  | Entry point                     |
| `PWABadge-C0znFdN9.js`                | 2.00 KB   | 0.93 KB  | PWA badge                       |
| `virtual_pwa-register-BBZI0giH.js`    | 0.89 KB   | 0.52 KB  | PWA register                    |
| `PWARegister-1Dp8Ieej.js`             | 0.86 KB   | 0.46 KB  | PWA register wrapper            |

**Total JavaScript**: 352.34 KB (raw) / 113.89 KB (gzip)

### CSS

| File                    | Size     | Gzip    |
| ----------------------- | -------- | ------- |
| `index-j19ppTp0.css`    | 20.54 KB | 4.19 KB |
| `PWABadge-DqUK_xOX.css` | 0.40 KB  | 0.25 KB |

**Total CSS**: 20.94 KB (raw) / 4.44 KB (gzip)

### Images (Optimized)

**Total Images**: 560.81 KB (post-optimization)

- Category icons: ~50 KB (SVG + optimized PNG)
- PWA icons: ~40 KB (multi-format)
- Favicons: ~2 KB

---

## 🎯 Lighthouse Performance (Phase 8 Task 1.1完了後)

### Mobile (Slow 4G)

| Metric            | 値            | 目標          | Status        |
| ----------------- | ------------- | ------------- | ------------- |
| Performance Score | 53            | 75+           | ❌ 低い       |
| **TBT**           | **12,770 ms** | **<8,000 ms** | ❌ 重大       |
| LCP               | 3.1 s         | <2.5 s        | ❌ 遅い       |
| FCP               | 1.8 s         | <1.5 s        | ⚠️ 要改善     |
| SI                | 11.4 s        | <5.0 s        | ❌ 非常に遅い |
| CLS               | 0.002         | <0.1          | ✅ 良好       |

### Desktop (Custom throttling)

| Metric            | 値           | 目標          | Status    |
| ----------------- | ------------ | ------------- | --------- |
| Performance Score | 58           | 80+           | ❌ 低い   |
| **TBT**           | **2,630 ms** | **<1,000 ms** | ❌ 高い   |
| LCP               | 1.5 s        | <1.3 s        | ⚠️ 要改善 |
| FCP               | 0.7 s        | <1.0 s        | ✅ 良好   |
| SI                | 2.4 s        | <3.4 s        | ✅ 良好   |
| CLS               | 0.000        | <0.1          | ✅ 良好   |

---

## 🔍 Lighthouse診断 - Unused JavaScript

### Mobile

| Source                        | Transfer Size | Potential Savings |
| ----------------------------- | ------------- | ----------------- |
| `react-vendor-BsL71oEA.js`    | 67 KiB        | ~40 KiB (推定)    |
| `data-processing-DQM-0p3G.js` | 13 KiB        | ~5 KiB            |
| `ui-components-6dF_RaOn.js`   | 9 KiB         | ~3 KiB            |
| `App-AhyQiZuq.js`             | 7 KiB         | ~2 KiB            |
| **Total**                     | **96 KiB+**   | **~50 KiB+**      |

**Lighthouse報告**: "Reduce unused JavaScript: Save 359 KiB"

### Desktop

**Lighthouse報告**: "Reduce unused JavaScript: Save 345 KiB"

---

## 📉 Main-Thread Work (Task 1.1後の状況)

### Mobile

| Category           | Time          | %        |
| ------------------ | ------------- | -------- |
| Script Evaluation  | 11,400 ms     | 46.2%    |
| Layout / Reflow    | 5,200 ms      | 21.1%    |
| Rendering          | 3,800 ms      | 15.4%    |
| Parsing HTML       | 2,100 ms      | 8.5%     |
| Garbage Collection | 1,200 ms      | 4.9%     |
| Style Calculation  | 1,000 ms      | 4.1%     |
| **Total**          | **24,700 ms** | **100%** |

**Long Tasks**: 20 tasks (Mobile)

### Desktop

| Category           | Time         | %        |
| ------------------ | ------------ | -------- |
| Script Evaluation  | 2,700 ms     | 42.2%    |
| Layout / Reflow    | 1,500 ms     | 23.4%    |
| Rendering          | 1,200 ms     | 18.8%    |
| Parsing HTML       | 600 ms       | 9.4%     |
| Garbage Collection | 400 ms       | 6.3%     |
| **Total**          | **6,400 ms** | **100%** |

**Long Tasks**: 13 tasks (Desktop)

---

## 🎯 Task 2の戦略

### Phase 1: Bundle Analysis & Identification (1-2時間)

**目的**: 未使用コードの特定

1. **Lighthouse Coverage Report確認**

   ```bash
   # Chrome DevTools → Coverage タブ
   # 未使用コード率を可視化
   ```

2. **Import分析**

   ```bash
   # 大きな依存関係の特定
   pnpm why <package-name>
   ```

3. **Dead Code検出**
   - ESLint unused vars
   - TypeScript unused exports

**期待結果**: 削減候補リスト作成

---

### Phase 2: Tree-Shaking改善 (2-3時間)

**目的**: 不要なコードの自動除去

#### 2.1 Named Imports優先

```typescript
// ❌ 悪い例: 全体import
import * as utils from "@/utils";

// ✅ 良い例: 必要なもののみ
import { sanitizeInput, validateEmail } from "@/utils";
```

#### 2.2 Barrel Export最適化

```typescript
// index.ts でsideEffectsを確認
// package.json: "sideEffects": false
```

#### 2.3 Conditional Imports

```typescript
// 開発環境のみロード
if (import.meta.env.DEV) {
  import("./devTools").then(({ init }) => init());
}
```

**期待削減**: -30~50 KiB

---

### Phase 3: Dynamic Imports強化 (3-4時間)

**目的**: 初期ロード削減

#### 3.1 Feature Modules遅延化

```typescript
// FilterPanel の一部機能を遅延化
const AdvancedFilters = lazy(() => import('./AdvancedFilters'));

// 使用時のみロード
<Suspense fallback={<LoadingSpinner size="small" />}>
  {showAdvanced && <AdvancedFilters />}
</Suspense>
```

#### 3.2 Icon Loading最適化

```typescript
// 大きなアイコンセットを動的ロード
const loadIcon = async (name: string) => {
  const module = await import(`@/assets/icons/${name}.svg`);
  return module.default;
};
```

#### 3.3 Analytics遅延化

```typescript
// Google Analytics を requestIdleCallback で遅延
requestIdleCallback(() => {
  import("./analytics").then(({ initGA }) => initGA());
});
```

**期待削減**: -50~100 KiB

---

### Phase 4: Code Splitting精密化 (2-3時間)

**目的**: チャンク最適化

#### 4.1 vite.config.ts 改善

```typescript
manualChunks(id) {
  // React core (critical)
  if (id.includes('react') || id.includes('react-dom')) {
    return 'react-vendor';
  }

  // Google Maps (large, lazy)
  if (id.includes('@googlemaps')) {
    return 'google-maps';
  }

  // UI library (medium, lazy)
  if (id.includes('@radix-ui')) {
    return 'ui-vendor';
  }

  // Analytics (small, lazy)
  if (id.includes('analytics')) {
    return 'analytics';
  }

  // Remaining node_modules
  if (id.includes('node_modules')) {
    return 'vendor';
  }
}
```

**期待削減**: チャンク数最適化、並列ロード改善

---

### Phase 5: Minification強化 (1時間)

**目的**: ファイルサイズ最小化

#### 5.1 Terser設定強化

```typescript
// vite.config.ts
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.info', 'console.debug', 'console.log'],
    },
    mangle: {
      safari10: true,
    },
  },
},
```

**期待削減**: -10~25 KiB

---

### Phase 6: 測定 & 検証 (1-2時間)

**検証項目**:

1. **Bundle Size**

   ```bash
   pnpm build
   # dist/ サイズ比較
   ```

2. **Lighthouse Performance**

   ```bash
   pnpm preview
   # Mobile/Desktop 測定
   ```

3. **Tests**

   ```bash
   pnpm type-check
   pnpm lint
   pnpm test:run
   ```

4. **Manual Testing**
   - 地図表示
   - フィルタリング
   - マーカークリック
   - PWA機能

---

## 📈 成功基準

### Minimum (最低目標)

| 指標                      | Baseline  | 目標       | 削減量           |
| ------------------------- | --------- | ---------- | ---------------- |
| **Unused JS**             | 359 KiB   | <250 KiB   | -109 KiB (-30%)  |
| **TBT (Mobile)**          | 12,770 ms | <10,000 ms | -2,770 ms (-22%) |
| **TBT (Desktop)**         | 2,630 ms  | <2,000 ms  | -630 ms (-24%)   |
| **Performance (Mobile)**  | 53        | 60+        | +7               |
| **Performance (Desktop)** | 58        | 65+        | +7               |

### Target (推奨目標)

| 指標                      | Baseline  | 目標      | 削減量           |
| ------------------------- | --------- | --------- | ---------------- |
| **Unused JS**             | 359 KiB   | <200 KiB  | -159 KiB (-44%)  |
| **TBT (Mobile)**          | 12,770 ms | <8,000 ms | -4,770 ms (-37%) |
| **TBT (Desktop)**         | 2,630 ms  | <1,500 ms | -1,130 ms (-43%) |
| **Performance (Mobile)**  | 53        | 65+       | +12              |
| **Performance (Desktop)** | 58        | 70+       | +12              |

### Stretch (理想目標)

| 指標                      | Baseline  | 目標      | 削減量           |
| ------------------------- | --------- | --------- | ---------------- |
| **Unused JS**             | 359 KiB   | <150 KiB  | -209 KiB (-58%)  |
| **TBT (Mobile)**          | 12,770 ms | <5,000 ms | -7,770 ms (-61%) |
| **TBT (Desktop)**         | 2,630 ms  | <1,000 ms | -1,630 ms (-62%) |
| **Performance (Mobile)**  | 53        | 75+       | +22              |
| **Performance (Desktop)** | 58        | 80+       | +22              |

---

## 🚨 リスク & 対応

### 技術リスク

1. **Tree-shakingによる破壊的変更**
   - 対策: 段階的実装、各ステップで動作確認
   - 回避: テストカバレッジ維持

2. **Dynamic import による型エラー**
   - 対策: Default export wrapper使用
   - 回避: TypeScript strict mode検証

3. **Chunk分割によるロード遅延**
   - 対策: Preload hints追加
   - 回避: Critical path優先

### スケジュールリスク

- Phase 1-2 遅延 → Phase 3-4を簡略化
- 測定結果未達 → 追加最適化 Phase追加

---

## 📝 実装チェックリスト

### Phase 1: Analysis ✅

- [ ] Lighthouse Coverage Report確認
- [ ] Import依存関係分析
- [ ] Dead Code検出
- [ ] 削減候補リスト作成

### Phase 2: Tree-Shaking

- [ ] Named imports変換
- [ ] Barrel export確認
- [ ] Conditional imports追加
- [ ] Build & 検証

### Phase 3: Dynamic Imports

- [ ] Feature modules遅延化
- [ ] Icon loading最適化
- [ ] Analytics遅延化
- [ ] Build & 検証

### Phase 4: Code Splitting

- [ ] manualChunks精密化
- [ ] Chunk数最適化
- [ ] Preload hints追加
- [ ] Build & 検証

### Phase 5: Minification

- [ ] Terser設定強化
- [ ] console.log削除
- [ ] Build & 検証

### Phase 6: Validation

- [ ] Bundle size測定
- [ ] Lighthouse測定 (Mobile)
- [ ] Lighthouse測定 (Desktop)
- [ ] type-check ✅
- [ ] lint ✅
- [ ] test:run ✅
- [ ] Manual testing

---

## 📚 参考資料

- [Vite: Manual Chunking](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Web.dev: Reduce JavaScript Execution Time](https://web.dev/bootup-time/)
- [Web.dev: Remove Unused Code](https://web.dev/remove-unused-code/)
- [React: Code-Splitting](https://react.dev/reference/react/lazy)

---

**作成日**: 2025-10-05
**開始予定**: 即座
**完了予定**: 2025-10-06 (1-2日)
