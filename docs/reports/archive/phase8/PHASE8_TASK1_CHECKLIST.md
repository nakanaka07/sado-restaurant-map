# Phase 8: Task 1 - Code Splitting 強化

**タスク**: P0 Code Splitting
**工数**: 4時間 (残り約 2-3時間)
**目標**: メインチャンク削減 (-43%), TBT -3,000ms
**ステータス**: 部分実装済み (Phase 4.5にてAPIProvider/IntegratedMapView lazy化完了)

---

## ✅ 実装チェックリスト

### Task 1.1: vite.config.ts 更新 (1時間)

- [ ] **Step 1**: 現状の `manualChunks` 確認

  ```bash
  code vite.config.ts
  ```

- [ ] **Step 2**: Bundle Analyzer で現状分析

  ```bash
  ANALYZE=true pnpm build
  # または
  pnpm analyze
  ```

  - [ ] Main chunk サイズ確認: **\_** KB
  - [ ] 大きなライブラリ特定: **\_**
  - [ ] 重複コード確認

- [ ] **Step 3**: `manualChunks` 関数実装

  ```typescript
  manualChunks(id) {
    // React core
    if (id.includes('react') || id.includes('react-dom')) {
      return 'react-vendor';
    }
    // ... (その他の分割ロジック)
  }
  ```

- [ ] **Step 4**: ビルド & 検証

  ```bash
  pnpm build
  pnpm analyze
  ```

  - [ ] Chunk数確認: 4 → \_\_\_
  - [ ] Main chunk削減: 175KB → \_\_\_ KB
  - [ ] 各チャンクサイズ記録

- [ ] **Step 5**: Quality gates

  ```bash
  pnpm type-check
  pnpm lint
  pnpm test
  ```

---

### Task 1.2: React.lazy() 導入 (3時間)

**既実装コンポーネント** ✅:

- APIProvider (`@vis.gl/react-google-maps`) - Phase 4.5でlazy化済み
- IntegratedMapView - Phase 4.5でlazy化済み (53.93 KB)

**未実装コンポーネント**:

- LoadingSpinner (基盤コンポーネント)
- ErrorBoundary (基盤コンポーネント)
- Dashboard, Analytics, Settings, Help等

#### Subtask 1.2.1: LoadingSpinner 作成 (30分)

- [ ] **Step 1**: ファイル作成

  ```bash
  mkdir -p src/components/common
  touch src/components/common/LoadingSpinner.tsx
  ```

- [ ] **Step 2**: コンポーネント実装
  - [ ] Spinner UI
  - [ ] Accessibility (role="status", aria-label)
  - [ ] CSS animations

- [ ] **Step 3**: テスト作成

  ```bash
  touch src/components/common/__tests__/LoadingSpinner.test.tsx
  ```

- [ ] **Step 4**: ストーリー作成 (optional)

---

#### Subtask 1.2.2: ErrorBoundary 作成 (30分)

- [ ] **Step 1**: ファイル作成

  ```bash
  touch src/components/common/ErrorBoundary.tsx
  ```

- [ ] **Step 2**: Class component実装
  - [ ] getDerivedStateFromError
  - [ ] componentDidCatch
  - [ ] Error fallback UI

- [ ] **Step 3**: テスト作成

  ```bash
  touch src/components/common/__tests__/ErrorBoundary.test.tsx
  ```

---

#### Subtask 1.2.3: IntegratedMapView 遅延化 (1時間) ✅ **実装済み (Phase 4.5)**

- [x] **Step 1**: 現状確認

  ```bash
  grep -r "import.*IntegratedMapView" src/
  # Result: src/app/App.tsx:31 (lazy import)
  ```

- [x] **Step 2**: App.tsx 修正

  ```typescript
  const IntegratedMapView = lazy(() =>
    import("../components/map/MapView/IntegratedMapView").then(module => ({
      default: module.IntegratedMapView,
    }))
  );
  ```

- [x] **Step 3**: Suspense でラップ

  ```typescript
  <Suspense fallback={<div className="loading-container">
    <span>地図を読み込み中...</span>
  </div>}>
    <APIProvider>
      <IntegratedMapView />
    </APIProvider>
  </Suspense>
  ```

- [ ] **Step 4**: ErrorBoundary でラップ (未実装)

  ```typescript
  # TODO: ErrorBoundaryコンポーネント作成後に実装
  ```

- [x] **Step 5**: 動作確認

  ```bash
  pnpm preview
  # Network タブで確認:
  # - IntegratedMapView-Oe6c_4_2.js: 53.93 KB (別チャンク)
  # - 初期ロードで遅延読み込み確認済み
  ```

---

#### Subtask 1.2.4: Dashboard 遅延化 (30分)

- [ ] **Step 1**: lazy import 追加
- [ ] **Step 2**: Route に Suspense 追加
- [ ] **Step 3**: 動作確認

---

#### Subtask 1.2.5: その他コンポーネント検討 (30分)

**候補**:

- [ ] Analytics dashboard
- [ ] Settings panel
- [ ] About page
- [ ] Help modal

**判断基準**:

- サイズ > 20KB
- 初期表示に不要
- ユーザーアクション後に表示

---

## 🧪 テスト項目

### 単体テスト

- [ ] LoadingSpinner
  - [ ] 正しくレンダリング
  - [ ] Accessibility attributes

- [ ] ErrorBoundary
  - [ ] エラーキャッチ
  - [ ] Fallback UI表示
  - [ ] Reload機能

### 統合テスト

- [ ] **初期ロード**
  - [ ] LoadingSpinner 表示
  - [ ] IntegratedMapView 遅延ロード
  - [ ] エラーなく表示

- [ ] **ページ遷移**
  - [ ] Dashboard 遅延ロード
  - [ ] Back/Forward navigation

- [ ] **エラーハンドリング**
  - [ ] ネットワークエラー時
  - [ ] コンポーネントエラー時

### E2E テスト (manual)

- [ ] **Mobile (Slow 3G)**
  - [ ] 初期ロード時間
  - [ ] Spinner表示時間
  - [ ] 操作可能になるまで

- [ ] **Desktop**
  - [ ] 初期ロード時間
  - [ ] Chunk並列読み込み

---

## 📊 測定 & 記録

### Before (現状 - Phase 7完了時点)

**実測値** (2025-10-05):

```
Total Bundle: 1795.68 KB (65 files)
Main Chunk: 171.17 KB (gzip: 48.34 KB)
App Chunk: 66.43 KB (gzip: 16.72 KB)
IntegratedMapView: 53.93 KB (lazy loaded ✅)
Google Maps: 37.23 KB (gzip: 12.02 KB)

Tests: 416 passing
Type Errors: 0
Lint Errors: 0
```

**Phase 4.5で実装済み**:

- APIProvider: lazy import ✅
- IntegratedMapView: lazy import ✅
- Suspense fallback: シンプルなdiv (LoadingSpinner未使用)

### After (目標)

| 指標        | Mobile   | Desktop |
| ----------- | -------- | ------- |
| Performance | 53       | 58      |
| FCP         | 1.8s     | 0.5s    |
| LCP         | 3.1s     | 1.3s    |
| TBT         | 12,770ms | 2,630ms |
| Main chunk  | ~175KB   | ~175KB  |

### After (実測値記入)

| 指標         | Mobile    | Desktop   | 改善    |
| ------------ | --------- | --------- | ------- |
| Performance  | \_\_\_    | \_\_\_    | \_\_\_  |
| FCP          | \_\_\_    | \_\_\_    | \_\_\_  |
| LCP          | \_\_\_    | \_\_\_    | \_\_\_  |
| TBT          | \_\_\_    | \_\_\_    | \_\_\_  |
| Main chunk   | \_\_\_ KB | \_\_\_ KB | \_\_\_% |
| Total chunks | \_\_\_    | \_\_\_    | \_\_\_  |

### Bundle Analysis

**Before**:

```
Main chunk: _____ KB
react-vendor: _____ KB
google-maps: _____ KB
Total: _____ KB
```

**After**:

```
Main chunk: _____ KB
react-vendor: _____ KB
google-maps: _____ KB
markers: _____ KB
data-processing: _____ KB
ui-vendor: _____ KB
analytics: _____ KB
abtest: _____ KB
Total: _____ KB
```

---

## 🚨 トラブルシューティング

### Issue 1: Type error on lazy import

**Error**: `Property 'IntegratedMapView' does not exist`

**Solution**:

```typescript
// ❌ 悪い例
const IntegratedMapView = lazy(() => import("./pages/IntegratedMapView"));

// ✅ 良い例
const IntegratedMapView = lazy(() => import("./pages/IntegratedMapView").then(m => ({ default: m.IntegratedMapView })));
```

---

### Issue 2: Chunk loading failed

**Error**: `ChunkLoadError: Loading chunk X failed`

**Solution**:

1. ErrorBoundary でキャッチ
2. Retry logic追加
3. Fallback UI表示

```typescript
componentDidCatch(error: Error) {
  if (error.name === 'ChunkLoadError') {
    // Retry or show reload button
    this.setState({ showReload: true });
  }
}
```

---

### Issue 3: Flash of loading spinner

**Problem**: Spinner が一瞬表示されて消える

**Solution**: Minimum display time追加

```typescript
const [showSpinner, setShowSpinner] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setShowSpinner(true), 200);
  return () => clearTimeout(timer);
}, []);

return showSpinner ? <LoadingSpinner /> : null;
```

---

## ✅ 完了条件

- [ ] All subtasks complete
- [ ] All tests passing
- [ ] Main chunk < 120KB (目標: 100KB)
- [ ] Type check: 0 errors
- [ ] Lint: 0 warnings
- [ ] Manual test: No regressions
- [ ] Lighthouse測定完了
- [ ] Results documented

---

## 📝 Notes

**開始時刻**: **\_**
**完了時刻**: **\_**
**実工数**: **\_** 時間

#### 問題点

- (記入欄)

#### 学び

- (記入欄)

#### Next steps

- Task 2: Google Maps 最適化へ

---

**Status**: 🟡 Ready to start
**Assigned**: **\_**
**Due date**: Day 1 (2025-10-05)
