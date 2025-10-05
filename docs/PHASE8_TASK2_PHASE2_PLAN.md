# Phase 8 Task 2 - Phase 2: Tree-Shaking改善計画

**作成日**: 2025年10月5日
**前提**: Phase 5 (Minification) 完了、TBT悪化判明、Phase 2優先実装決定
**目標**: Unused JavaScript -100~150 KiB、TBT改善開始

---

## Executive Summary

### Phase 5の結果と教訓

- ✅ Bundle Size削減: -7.20 KB (-2.0%)
- ❌ TBT悪化: Mobile +1,470ms, Desktop +340ms
- ❌ Unused JS増加: Mobile +22 KiB, Desktop +28 KiB
- **教訓**: **Minification ≠ Tree-Shaking**、未使用コード削除が必須

### Phase 2の戦略

**Target**: Unused JavaScript削減 100~150 KiB、TBT改善開始
**Approach**: 開発環境コード分離、package.json sideEffects設定
**Risk Level**: Low（ビルド時のみ影響、実行時副作用なし）

---

## 1. Current State Analysis

### 1.1 Named Imports状況

✅ **Already Optimized**: `import * as` 0件確認済み

```bash
# grep結果: No matches found
```

- React: Named imports使用済み（`import { useState, useEffect } from "react"`）
- Custom modules: Barrel exports最適化済み（Phase 4.5完了）
- → **Named Imports統一は不要、スキップ**

### 1.2 Conditional Imports候補

以下の開発環境コードが本番環境に含まれている（grep結果50+ matches）:

#### High Priority（推定-10~15 KiB削減）

1. **`src/utils/analytics.ts`** (推定-3~5 KiB):
   - `console.log` 10+ 箇所
   - `import.meta.env.DEV` 分岐多数
   - デバッグ用イベントログ

2. **`src/utils/districtUtils.ts`** (推定-2~3 KiB):
   - District計算デバッグログ
   - 開発環境検証コード

3. **`src/services/securityUtils.ts`** (推定-2~3 KiB):
   - セキュリティ検証ログ
   - 開発環境テストコード

4. **`src/utils/logFilter.ts`** (推定-1~2 KiB):
   - ログフィルタリングロジック
   - 開発環境専用機能

#### Medium Priority（推定-5~10 KiB削減）

1. **`src/hooks/map/useMapDebugging.ts`** (推定-3~5 KiB):
   - Map debugging hooks
   - 開発環境専用フック

2. **`src/hooks/map/useABTestIntegration.ts`** (推定-1~2 KiB):
   - A/B Test debug logs
   - 開発環境検証コード

3. **Various components** (推定-1~3 KiB):
   - FilterPanel, Markers等のデバッグログ

### 1.3 package.json sideEffects

**Current**: 未設定（デフォルト: すべてのモジュールがside effectsを持つと仮定）

**Impact**: Tree-Shaking最適化の妨げ

---

## 2. Implementation Plan

### Phase 2.1: Conditional Imports実装（推定-15~25 KiB）

#### 2.1.1 開発環境専用ユーティリティ分離

**Before**: 本番環境でも`console.log`が含まれる

```typescript
// src/utils/analytics.ts (現状)
export function trackEvent(eventName: string, data: unknown) {
  if (import.meta.env.DEV) {
    console.log("[Analytics Debug]", eventName, data);
  }
  // GA4送信処理
}
```

**After**: 開発環境デバッグを別ファイルに分離

```typescript
// src/utils/analytics.ts (本番用)
export function trackEvent(eventName: string, data: unknown) {
  // GA4送信処理のみ
}

// src/utils/analytics.dev.ts (開発環境用)
import { trackEvent as trackEventProd } from "./analytics";

export function trackEvent(eventName: string, data: unknown) {
  console.log("[Analytics Debug]", eventName, data);
  trackEventProd(eventName, data);
}
```

**Usage**: Conditional Import

```typescript
// App.tsx等
const trackEvent = import.meta.env.DEV
  ? (await import("./utils/analytics.dev")).trackEvent
  : (await import("./utils/analytics")).trackEvent;
```

**Expected Savings**: -3~5 KiB（analytics.dev.ts完全除去）

#### 2.1.2 Map Debugging分離

**Target**: `src/hooks/map/useMapDebugging.ts`

**Strategy**:

1. 開発環境専用フックを`useMapDebugging.dev.ts`に分離
2. 本番環境では空実装を返す
3. Conditional Importで切り替え

**Expected Savings**: -3~5 KiB

#### 2.1.3 その他デバッグコード分離

**Target**:

- `src/utils/districtUtils.ts`
- `src/services/securityUtils.ts`
- `src/utils/logFilter.ts`

**Strategy**: デバッグ関数を`.dev.ts`に分離、Conditional Import

**Expected Savings**: -9~15 KiB (合計)

### Phase 2.2: package.json sideEffects設定（推定-10~20 KiB）

#### 2.2.1 sideEffects追加

**Before**: 未設定

```json
{
  "name": "sado-restaurant-map",
  "version": "0.0.0"
  // sideEffects未設定
}
```

**After**: Pure modules明示

```json
{
  "name": "sado-restaurant-map",
  "version": "0.0.0",
  "sideEffects": ["*.css", "*.scss", "./src/main.tsx", "./src/utils/analytics.ts"]
}
```

**Explanation**:

- `*.css`, `*.scss`: スタイルファイルはside effectsあり
- `./src/main.tsx`: エントリーポイント
- `./src/utils/analytics.ts`: GA4初期化（window操作）
- **それ以外**: Pure modules（Tree-Shaking可能）

**Expected Savings**: -10~20 KiB（React未使用機能、lodash等の削減）

#### 2.2.2 検証方法

```bash
# Build後、Bundle Analyzerで確認
ANALYZE=true pnpm build

# Unused JS削減確認
# - react-vendor: 210 KB → 200 KB前後期待
# - data-processing: 35 KB → 30 KB前後期待
```

---

## 3. Implementation Checklist

### Phase 2.1: Conditional Imports

- [ ] **2.1.1 Analytics分離** (推定30分):
  - [ ] `src/utils/analytics.dev.ts` 作成
  - [ ] `src/utils/analytics.ts` デバッグコード削除
  - [ ] Conditional Import実装（App.tsx等）
  - [ ] Build → Bundle Size確認

- [ ] **2.1.2 Map Debugging分離** (推定30分):
  - [ ] `src/hooks/map/useMapDebugging.dev.ts` 作成
  - [ ] `src/hooks/map/useMapDebugging.ts` 空実装化
  - [ ] Conditional Import実装
  - [ ] Build → Bundle Size確認

- [ ] **2.1.3 その他デバッグコード分離** (推定60分):
  - [ ] districtUtils, securityUtils, logFilter分離
  - [ ] Conditional Import実装
  - [ ] Build → Bundle Size確認

### Phase 2.2: sideEffects設定

- [ ] **2.2.1 package.json設定** (推定15分):
  - [ ] sideEffects配列追加
  - [ ] Build → Bundle Size確認
  - [ ] Unused JS削減確認（Lighthouse）

### Phase 2.3: 測定・検証

- [ ] **Build & Bundle Analysis** (推定15分):
  - [ ] `pnpm build` 実行
  - [ ] Bundle Size比較（Before/After）
  - [ ] `ANALYZE=true pnpm build` 実行（optional）

- [ ] **Lighthouse測定** (推定15分):
  - [ ] Mobile測定（Slow 4G）
  - [ ] Desktop測定
  - [ ] Unused JS削減確認（期待: -100~150 KiB）
  - [ ] TBT改善確認（期待: -500~1,000ms）

- [ ] **品質ゲート** (推定10分):
  - [ ] `pnpm type-check` ✅
  - [ ] `pnpm lint` ✅
  - [ ] `pnpm test:run` ✅
  - [ ] Build成功 ✅

### Phase 2.4: ドキュメント更新

- [ ] **PHASE8_TASK2_PHASE2_RESULTS.md作成** (推定20分):
  - [ ] Bundle Size比較
  - [ ] Lighthouse結果記録
  - [ ] Conditional Imports実装詳細
  - [ ] 次フェーズ計画

- [ ] **TASKS.md更新** (推定5分):
  - [ ] Phase 2完了記録

---

## 4. Success Criteria

### Minimum (Phase 2完了時点)

| Metric              | Phase 5後 | Phase 2目標 | 改善量              |
| ------------------- | --------- | ----------- | ------------------- |
| Bundle Size (raw)   | 345.14 KB | <330 KB     | **-15 KB (-4%)**    |
| Bundle Size (gzip)  | 111.00 KB | <105 KB     | **-6 KB (-5%)**     |
| Unused JS (Mobile)  | 381 KiB   | <300 KiB    | **-81 KiB (-21%)**  |
| Unused JS (Desktop) | 373 KiB   | <290 KiB    | **-83 KiB (-22%)**  |
| TBT (Mobile)        | 14,240 ms | <13,000 ms  | **-1,240 ms (-9%)** |
| TBT (Desktop)       | 2,970 ms  | <2,500 ms   | **-470 ms (-16%)**  |

### Target (Phase 2+3完了後)

| Metric                     | Baseline  | Target     | 改善量               |
| -------------------------- | --------- | ---------- | -------------------- |
| Unused JS (Mobile)         | 359 KiB   | <250 KiB   | **-109 KiB (-30%)**  |
| TBT (Mobile)               | 12,770 ms | <10,000 ms | **-2,770 ms (-22%)** |
| Performance Score (Mobile) | 53        | >65        | **+12 (+23%)**       |

---

## 5. Risk Assessment

### Low Risk

- ✅ **Conditional Imports**: ビルド時分岐、実行時エラーなし
- ✅ **sideEffects設定**: Tree-Shaking強化、副作用なし
- ✅ **開発環境デバッグ**: 本番環境に影響なし

### Mitigation

- **Build失敗**: 段階的実装、各ステップでBuild確認
- **機能退行**: テスト全通過確認、品質ゲート必須
- **測定誤差**: 複数回測定、平均値取得

---

## 6. Timeline

| Phase     | 作業内容           | 所要時間 | 累積時間      |
| --------- | ------------------ | -------- | ------------- |
| **2.1.1** | Analytics分離      | 30分     | 30分          |
| **2.1.2** | Map Debugging分離  | 30分     | 1時間         |
| **2.1.3** | その他デバッグ分離 | 60分     | 2時間         |
| **2.2**   | sideEffects設定    | 15分     | 2時間15分     |
| **2.3**   | 測定・検証         | 40分     | 2時間55分     |
| **2.4**   | ドキュメント更新   | 25分     | **3時間20分** |

**Total**: 約3.5時間（1セッション完結可能）

---

## 7. Alternative Approaches (Not Chosen)

### A. Webpack DefinePlugin代替

- **Pros**: ビルド時変数置換、完全除去
- **Cons**: Vite標準は`import.meta.env`、設定変更リスク
- **Decision**: Conditional Imports採用（Vite標準準拠）

### B. Dead Code Elimination Plugins

- **Pros**: 自動未使用コード削除
- **Cons**: 誤検知リスク、設定複雑
- **Decision**: 手動分離優先（精度重視）

---

## 8. Next Steps (Phase 3: Dynamic Imports)

Phase 2完了後、以下を実装予定:

1. **Google Maps API遅延化** (推定-50~80 KiB):
   - Intersection Observer使用
   - マップ表示時のみロード

2. **Icon loading最適化** (推定-20~40 KiB):
   - 動的import使用
   - 表示される料理アイコンのみロード

3. **Analytics遅延化** (推定-10~15 KiB):
   - 2秒後にロード
   - 初期レンダリング高速化

**Expected Total Savings (Phase 2+3)**: -180~260 KiB

---

## 9. References

- **Phase 5結果**: [PHASE8_TASK2_PHASE5_RESULTS.md](./PHASE8_TASK2_PHASE5_RESULTS.md)
- **Baseline**: [PHASE8_TASK2_BASELINE.md](./PHASE8_TASK2_BASELINE.md)
- **Vite Tree-Shaking**: <https://vite.dev/guide/features#build-optimizations>
- **package.json sideEffects**: <https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free>

---

**Recommendation**: Phase 2.1.1（Analytics分離）から開始、段階的実装を推奨。
