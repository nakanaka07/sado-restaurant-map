# Phase 1 実装計画書：緊急クリーンアップ

**作成日**: 2025年10月5日
**期間**: 7日間
**目標**: パフォーマンス回復とマーカー表示問題の根本解決

---

## 🎯 Phase 1 の目標

### 主要目標

1. **A/Bテスト機構の完全削除** (3日)
2. **マーカーシステムの単一化** (2日)
3. **App.tsx の初期リファクタリング** (2日)

### 成功指標

- ✅ バンドルサイズ: -90KB以上削減
- ✅ 初回読み込み: -1秒改善
- ✅ マーカー表示: 100%正常動作
- ✅ 全テスト: グリーン維持

---

## 📅 Day 1-2: A/Bテスト完全削除

### Step 1.1: 影響範囲の確認

**調査対象**:

```bash
# A/Bテスト関連ファイルを検索
grep -r "abTestConfig" src/
grep -r "ABTest" src/
grep -r "UserClassification" src/
```

**確認済み依存**:

- `src/config/abTestConfig.ts` (800行)
- `src/components/map/MapView/IntegratedMapView.tsx`
- `src/components/map/MapView/EnhancedMapContainer.tsx`
- `src/app/App.tsx` (userId prop)

### Step 1.2: 削除手順

#### 1.2.1 バックアップ作成

```bash
# A/Bテスト関連コードをアーカイブ
mkdir -p archive/abtest-removed-2025-10-05
cp src/config/abTestConfig.ts archive/abtest-removed-2025-10-05/
cp src/components/map/MapView/IntegratedMapView.tsx archive/abtest-removed-2025-10-05/
```

#### 1.2.2 IntegratedMapView.tsx の簡素化

**Before** (200行):

```typescript
export function IntegratedMapView({
  mapPoints,
  center,
  loading,
  error,
  customControls,
  userId,
  forceVariant, // ← 削除
}: IntegratedMapViewProps) {
  const [userClassification, setUserClassification] = useState();
  const [currentVariant, setCurrentVariant] = useState();
  const [markerType, setMarkerType] = useState();
  // ... A/Bテスト初期化処理 (50行)
  // ... バリアント切り替えロジック (30行)
  // ... 統計パネルUI (40行)
}
```

**After** (80行):

```typescript
export function MapView({
  mapPoints,
  center,
  loading,
  error,
  customControls,
}: MapViewProps) {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  const handleMarkerClick = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
    // 分析イベント
    if (point.type === "restaurant") {
      trackRestaurantClick({ id: point.id, name: point.name, ... });
    }
    trackMapInteraction("marker_click");
  }, []);

  const handleCloseInfoWindow = useCallback(() => {
    setSelectedPoint(null);
  }, []);

  if (loading) return <MapLoadingSpinner />;
  if (error || !mapId) return <MapErrorFallback mapId={mapId} error={error} />;

  return (
    <MapErrorBoundary>
      <MapContainer
        mapPoints={mapPoints}
        center={center}
        mapId={mapId}
        selectedPoint={selectedPoint}
        onMarkerClick={handleMarkerClick}
        onCloseInfoWindow={handleCloseInfoWindow}
      />
      {customControls}
    </MapErrorBoundary>
  );
}
```

#### 1.2.3 EnhancedMapContainer.tsx → MapContainer.tsx へリネーム・簡素化

**削除要素**:

- [ ] A/Bテスト分類ロジック
- [ ] バリアント選択パネル（150行）
- [ ] 統計情報パネル（開発環境用、80行）
- [ ] `initialMarkerType` prop
- [ ] `onMarkerTypeChange` callback
- [ ] `showSelectionPanel` prop

**単純化後の MapContainer.tsx** (120行):

```typescript
interface MapContainerProps {
  readonly mapPoints: readonly MapPoint[];
  readonly center: { lat: number; lng: number };
  readonly mapId: string;
  readonly selectedPoint: MapPoint | null;
  readonly onMarkerClick: (point: MapPoint) => void;
  readonly onCloseInfoWindow: () => void;
}

export function MapContainer({
  mapPoints, center, mapId,
  selectedPoint, onMarkerClick, onCloseInfoWindow
}: MapContainerProps) {

  // 重複排除（キー重複エラー防止）
  const dedupedPoints = useMemo(() => {
    const seen = new Set<string>();
    return mapPoints.filter(p => {
      const key = `${p.type}-${p.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [mapPoints]);

  return (
    <div className="map-container">
      <Map
        defaultCenter={center}
        defaultZoom={11}
        mapTypeId="hybrid"
        mapId={mapId}
        gestureHandling="greedy"
        {...mapControlOptions}
      >
        {/* 単一マーカーシステム */}
        <CircularMarkerContainer
          points={dedupedPoints}
          markerSize="medium"
          onPointClick={onMarkerClick}
          showInfoWindow={!!selectedPoint}
          selectedPoint={selectedPoint}
          onInfoWindowClose={onCloseInfoWindow}
        />
      </Map>
    </div>
  );
}
```

#### 1.2.4 App.tsx の更新

**変更箇所**:

```typescript
// Before
const IntegratedMapView = lazy(() =>
  import("../components/map/MapView/IntegratedMapView").then(...)
);

<IntegratedMapView
  userId={`user_${Date.now()}`}  // ← 削除
  customControls={...}
/>

// After
const MapView = lazy(() =>
  import("../components/map/MapView").then(module => ({
    default: module.MapView,
  }))
);

<MapView
  mapPoints={filteredMapPoints}
  center={SADO_CENTER}
  loading={loading}
  error={error}
  customControls={isMobile || isFullscreen ? <CustomMapControls {...} /> : null}
/>
```

#### 1.2.5 ファイル削除

```bash
# 削除対象
rm src/config/abTestConfig.ts
rm src/components/map/MapView/IntegratedMapView.tsx
mv src/components/map/MapView/EnhancedMapContainer.tsx \
   src/components/map/MapView/MapContainer.tsx
```

#### 1.2.6 型定義の更新

**削除する型**:

```typescript
// types/index.ts から削除
-ABTestVariant - UserClassification - ABTestConfig;
```

### Step 1.3: テスト・検証

```bash
# 1. 型チェック
pnpm type-check

# 2. Lint
pnpm lint

# 3. ユニットテスト
pnpm test:run

# 4. ビルド
pnpm build

# 5. プレビュー
pnpm preview
```

**手動テスト項目**:

- [ ] マーカーが正常に表示される
- [ ] マーカークリックでInfoWindow表示
- [ ] フィルター動作確認
- [ ] モバイル/デスクトップ両方で動作確認

---

## 📅 Day 3-4: マーカーシステムの単一化

### Step 2.1: 削除対象の確認

**削除ファイル**:

```
src/components/map/UnifiedMarker.tsx
src/components/map/markers/PinMarker.tsx
src/components/map/markers/IconMarker.tsx
src/components/map/markers/SVGMarker.tsx
src/components/map/markers/ClusterMarker.tsx (未使用)
```

**保持ファイル**:

```
src/components/map/MapView/CircularMarkerContainer.tsx ✅
src/components/map/markers/CircularMarker.tsx ✅
```

### Step 2.2: 依存関係の確認

```bash
# UnifiedMarker の使用箇所を検索
grep -r "UnifiedMarker" src/

# 期待される結果: EnhancedMapContainer.tsx のみ (Day 1-2で削除済み)
```

### Step 2.3: マーカーユーティリティの整理

**削除対象**:

```typescript
// utils/markerColorUtils.ts (UnifiedMarker専用)
// utils/hybridMarkerUtils.ts (A/Bテスト専用)
```

**確認**:

```bash
# 使用箇所チェック
grep -r "markerColorUtils" src/
grep -r "hybridMarkerUtils" src/
```

### Step 2.4: 削除実行

```bash
# アーカイブ
mkdir -p archive/unified-marker-removed-2025-10-05
cp -r src/components/map/markers/ archive/unified-marker-removed-2025-10-05/

# 削除
rm src/components/map/UnifiedMarker.tsx
rm src/components/map/markers/PinMarker.tsx
rm src/components/map/markers/IconMarker.tsx
rm src/components/map/markers/SVGMarker.tsx
rm src/components/map/markers/ClusterMarker.tsx
rm src/utils/markerColorUtils.ts
rm src/utils/hybridMarkerUtils.ts
```

### Step 2.5: インポートの整理

**components/map/index.ts**:

```typescript
// Before
export { UnifiedMarker } from "./UnifiedMarker";
export { CircularMarkerContainer } from "./MapView/CircularMarkerContainer";

// After
export { CircularMarkerContainer } from "./MapView/CircularMarkerContainer";
export { MapView } from "./MapView";
export { MapContainer } from "./MapView/MapContainer";
```

### Step 2.6: テスト・検証

```bash
pnpm type-check
pnpm lint
pnpm test:run
pnpm build
```

**期待される結果**:

- ✅ バンドルサイズ削減: ~40KB
- ✅ markers chunk 削減: 削除
- ✅ 全テストグリーン

---

## 📅 Day 5: App.tsx の初期リファクタリング

### Step 3.1: カスタムHookの抽出

#### 3.1.1 useFullscreenDetection.ts

**新規ファイル**: `src/hooks/ui/useFullscreenDetection.ts`

```typescript
import { useEffect, useState } from "react";

export function useFullscreenDetection() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const getFullscreenElement = () => {
      return (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
    };

    const handleFullscreenChange = () => {
      const isActive = !!getFullscreenElement();
      setIsFullscreen(isActive);

      document.documentElement.classList.toggle("fullscreen-active", isActive);
      document.body.classList.toggle("fullscreen-active", isActive);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);

    handleFullscreenChange(); // 初回実行

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.documentElement.classList.remove("fullscreen-active");
    };
  }, []);

  return isFullscreen;
}
```

#### 3.1.2 useMobileDetection.ts

**新規ファイル**: `src/hooks/ui/useMobileDetection.ts`

```typescript
import { useEffect, useState } from "react";

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined" && window.matchMedia) {
        setIsMobile(window.matchMedia("(max-width: 768px)").matches);
      }
    };

    checkMobile();

    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(max-width: 768px)");
      mediaQuery.addEventListener("change", checkMobile);
      return () => mediaQuery.removeEventListener("change", checkMobile);
    }
  }, []);

  return isMobile;
}
```

#### 3.1.3 useAppInitialization.ts

**新規ファイル**: `src/hooks/app/useAppInitialization.ts`

```typescript
import { checkGAStatus, initGA, initializeDevLogging, validateApiKey } from "@/utils";
import { useCallback, useEffect, useState } from "react";

interface InitializationState {
  isInitialized: boolean;
  error: string | null;
}

export function useAppInitialization(apiKey: string) {
  const [state, setState] = useState<InitializationState>({
    isInitialized: false,
    error: null,
  });

  const scheduleGAStatusCheck = useCallback(() => {
    if (!import.meta.env.DEV) return;

    setTimeout(() => {
      const result = checkGAStatus();
      if (result && typeof result.catch === "function") {
        void result.catch(console.warn);
      }
    }, 3000);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        initializeDevLogging();

        if (!validateApiKey(apiKey)) {
          throw new Error("無効なGoogle Maps APIキーです");
        }

        await initGA();
        scheduleGAStatusCheck();

        setState({ isInitialized: true, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : "アプリケーションの初期化に失敗しました";
        setState({ isInitialized: false, error: message });
      }
    };

    void initialize();
  }, [apiKey, scheduleGAStatusCheck]);

  return state;
}
```

### Step 3.2: App.tsx の更新

**Before** (500行):

```typescript
function App() {
  const [appError, setAppError] = useState();
  const [isInitialized, setIsInitialized] = useState();
  const [isFullscreen, setIsFullscreen] = useState();
  const isMobile = useIsMobile(); // カスタムHook (100行)

  useEffect(() => { /* フルスクリーン検出 (50行) */ }, []);
  useEffect(() => { /* 初期化処理 (40行) */ }, []);
  useEffect(() => { /* 統計表示 (30行) */ }, []);

  const handleCuisineFilter = useCallback(...); // (20行)
  const handlePriceFilter = useCallback(...); // (20行)
  // ... 10個のフィルターハンドラー

  return <div>...</div>
}
```

**After** (200行):

```typescript
function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // カスタムHooks
  const { isInitialized, error: initError } = useAppInitialization(apiKey);
  const isFullscreen = useFullscreenDetection();
  const isMobile = useMobileDetection();

  // データ管理
  const {
    mapPoints: filteredMapPoints,
    loading,
    error,
    updateFilters,
    updateSortOrder,
    stats,
  } = useMapPoints();

  // 初期化エラー
  if (initError) {
    return <ErrorDisplay title="アプリケーションエラー" message={initError} />;
  }

  // APIキー未設定
  if (!apiKey) {
    return <ErrorDisplay title="設定エラー" message="Google Maps APIキーが設定されていません。" />;
  }

  // 初期化中
  if (!isInitialized) {
    return <LoadingSpinner message="アプリケーションを初期化中..." />;
  }

  return (
    <>
      <SkipLink href="#main-content">メインコンテンツにスキップ</SkipLink>
      <div className="app">
        <main id="main-content" className="app-main">
          <Suspense fallback={<LoadingSpinner message="地図を読み込み中..." />}>
            <APIProvider apiKey={apiKey} libraries={["maps", "marker", "geometry"]}>
              <div className="app-content">
                {/* Desktop Filter */}
                {!isMobile && !isFullscreen && (
                  <FilterPanel
                    loading={loading}
                    resultCount={filteredMapPoints.length}
                    stats={stats}
                    onCuisineFilter={cuisine => updateFilters({ cuisineTypes: cuisine ? [cuisine] : [] })}
                    onPriceFilter={price => updateFilters({ priceRanges: price ? [price] : [] })}
                    onDistrictFilter={districts => updateFilters({ districts })}
                    onRatingFilter={minRating => updateFilters({ minRating })}
                    onOpenNowFilter={openNow => updateFilters({ openNow })}
                    onSearchFilter={searchQuery => updateFilters({ searchQuery })}
                    onSortChange={updateSortOrder}
                    onFeatureFilter={features => updateFilters({ features })}
                    onPointTypeFilter={pointTypes => updateFilters({ pointTypes })}
                    onResetFilters={() => updateFilters(INITIAL_FILTERS)}
                  />
                )}

                {/* Map View */}
                <MapView
                  mapPoints={filteredMapPoints}
                  center={SADO_CENTER}
                  loading={loading}
                  error={error}
                  customControls={
                    isMobile || isFullscreen ? (
                      <CustomMapControls
                        loading={loading}
                        resultCount={filteredMapPoints.length}
                        stats={stats}
                        onCuisineFilter={...}
                        {...filterHandlers}
                      />
                    ) : null
                  }
                />
              </div>
            </APIProvider>
          </Suspense>
        </main>
        <ConditionalPWABadge />
      </div>
    </>
  );
}
```

### Step 3.3: フィルターハンドラーの簡素化

**新規ヘルパー関数**:

```typescript
// 汎用フィルター更新関数（型安全）
function createFilterHandler<T extends keyof ExtendedMapFilters>(
  filterKey: T,
  updateFilters: (filters: Partial<ExtendedMapFilters>) => void
) {
  return (value: ExtendedMapFilters[T]) => {
    updateFilters({ [filterKey]: value });
  };
}

// 使用例
const handleCuisineFilter = createFilterHandler("cuisineTypes", updateFilters);
const handlePriceFilter = createFilterHandler("priceRanges", updateFilters);
```

---

## 📅 Day 6-7: テスト・検証・デプロイ

### Step 4.1: 包括的テスト

```bash
# 1. 型チェック
pnpm type-check

# 2. Lint
pnpm lint

# 3. ユニットテスト（カバレッジ付き）
pnpm test:coverage

# 4. アクセシビリティテスト
pnpm test:accessibility

# 5. ビルド
pnpm build

# 6. バンドルサイズ確認
pnpm size-limit

# 7. プレビュー
pnpm preview
```

### Step 4.2: パフォーマンス測定

```bash
# Lighthouse CI実行
pnpm lhci autorun
```

**期待値**:

- Performance Score: 85+
- FCP: <1.5s
- LCP: <2.5s
- TBT: <300ms

### Step 4.3: 手動テスト

**テストシナリオ**:

1. [ ] デスクトップ - Chrome
   - [ ] マーカー表示確認
   - [ ] フィルター動作
   - [ ] InfoWindow表示
2. [ ] デスクトップ - Firefox
3. [ ] デスクトップ - Edge
4. [ ] モバイル - Chrome (実機)
5. [ ] モバイル - Safari (iOS実機)
6. [ ] フルスクリーンモード動作確認

### Step 4.4: デプロイ前チェックリスト

- [ ] 全テストグリーン
- [ ] バンドルサイズ削減確認
- [ ] Lighthouse Score確認
- [ ] 実機テスト完了
- [ ] CHANGELOGの更新
- [ ] ドキュメント更新

### Step 4.5: デプロイ

```bash
# Production デプロイ
pnpm deploy
```

**ロールバック手順**:

```bash
# もし問題が発生した場合
git revert HEAD
git push origin main
pnpm deploy
```

---

## 📊 検証指標

### ビルド成果物

| 指標             | Before | Target         | 測定方法                       |
| ---------------- | ------ | -------------- | ------------------------------ |
| **Total Bundle** | 1.77MB | <1.50MB        | `dist/` folder size            |
| **Main Chunk**   | 250KB  | <180KB         | `dist/assets/index-*.js`       |
| **Google Maps**  | 40KB   | 40KB           | `dist/assets/google-maps-*.js` |
| **Markers**      | 45KB   | **0KB (削除)** | chunk analysis                 |

### パフォーマンス

| 指標    | Before | Target | 測定方法   |
| ------- | ------ | ------ | ---------- |
| **FCP** | 2.0s   | <1.5s  | Lighthouse |
| **LCP** | 3.5s   | <2.5s  | Lighthouse |
| **TTI** | 4.0s   | <3.0s  | Lighthouse |
| **TBT** | 400ms  | <300ms | Lighthouse |

### コード品質

| 指標              | Before | Target | 測定方法             |
| ----------------- | ------ | ------ | -------------------- |
| **Total Lines**   | ~3000  | <2500  | `cloc src/`          |
| **App.tsx Lines** | 500    | <250   | Line count           |
| **Test Coverage** | 50%    | 50%+   | `pnpm test:coverage` |
| **Type Errors**   | 0      | 0      | `pnpm type-check`    |

---

## 🚨 トラブルシューティング

### 問題 1: 型エラーが発生

**症状**:

```
TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**対処**:

1. 削除した型定義が残っていないか確認
2. `src/types/index.ts` から不要な型をexport削除
3. `pnpm type-check` で全体確認

### 問題 2: マーカーが表示されない

**症状**: 地図は表示されるがマーカーが出ない

**確認事項**:

1. `CircularMarkerContainer` が正しくimportされているか
2. `mapPoints` が正しく渡されているか
3. ブラウザコンソールでエラー確認

**デバッグ**:

```typescript
// MapContainer.tsx に追加
console.log("MapContainer rendered with points:", mapPoints.length);
console.log("Deduped points:", dedupedPoints.length);
```

### 問題 3: ビルドが失敗

**症状**:

```
Build failed with X errors
```

**対処**:

1. `pnpm clean` でキャッシュクリア
2. `pnpm install` で依存再インストール
3. `pnpm build` 再実行
4. エラーメッセージを詳細確認

---

## 📝 コミット戦略

### コミットの粒度

```bash
# Commit 1: A/Bテスト設定削除
git commit -m "refactor: remove A/B test config and utilities"

# Commit 2: IntegratedMapView簡素化
git commit -m "refactor: simplify IntegratedMapView to MapView"

# Commit 3: EnhancedMapContainer簡素化
git commit -m "refactor: simplify EnhancedMapContainer to MapContainer"

# Commit 4: App.tsx更新
git commit -m "refactor: update App.tsx to use simplified MapView"

# Commit 5: UnifiedMarker削除
git commit -m "refactor: remove UnifiedMarker and related markers"

# Commit 6: カスタムHook抽出
git commit -m "refactor: extract custom hooks from App.tsx"

# Commit 7: App.tsx最終簡素化
git commit -m "refactor: final App.tsx simplification"

# Commit 8: テスト・ドキュメント更新
git commit -m "docs: update documentation and test results"
```

---

## ✅ 完了チェックリスト

### Day 1-2: A/Bテスト削除

- [ ] バックアップ作成
- [ ] IntegratedMapView → MapView 簡素化
- [ ] EnhancedMapContainer → MapContainer 簡素化
- [ ] App.tsx 更新
- [ ] abTestConfig.ts 削除
- [ ] 型定義更新
- [ ] テスト実行・グリーン確認
- [ ] コミット・プッシュ

### Day 3-4: マーカー単一化

- [ ] アーカイブ作成
- [ ] UnifiedMarker関連ファイル削除
- [ ] インポート整理
- [ ] テスト実行・グリーン確認
- [ ] バンドルサイズ確認
- [ ] コミット・プッシュ

### Day 5: App.tsx リファクタリング

- [ ] useFullscreenDetection 作成
- [ ] useMobileDetection 作成
- [ ] useAppInitialization 作成
- [ ] App.tsx 更新
- [ ] テスト実行・グリーン確認
- [ ] コミット・プッシュ

### Day 6-7: テスト・デプロイ

- [ ] 全自動テスト実行
- [ ] Lighthouse測定
- [ ] 実機テスト
- [ ] ドキュメント更新
- [ ] デプロイ
- [ ] 本番環境確認

---

**次のステップ**: Day 1の実装開始
