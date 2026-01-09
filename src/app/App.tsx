import { SADO_CENTER } from "@/config";
import { useAppInitialization, useFullscreen, useIsMobile } from "@/hooks/app";
import { useMapPoints } from "@/hooks/map/useMapPoints";
import { useFilterHandlers } from "@/hooks/ui/useFilterHandlers";
import {
  logUnknownAddressStats,
  testDistrictAccuracy,
} from "@/utils/districtUtils";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { SkipLink } from "../components/common/AccessibilityComponents";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { DEFAULT_CONTROL_POSITION } from "../components/map/constants";

// 動的import: 重量Google Maps関連コンポーネントのみ (Phase 4.5最適化)
const APIProvider = lazy(() =>
  import("@vis.gl/react-google-maps").then(module => ({
    default: module.APIProvider,
  }))
);
const IntegratedMapView = lazy(() =>
  import("../components/map/MapView/IntegratedMapView").then(module => ({
    default: module.IntegratedMapView,
  }))
);

// Phase 8 Task 2.3: FilterPanelとCustomMapControlsを動的import化して初期バンドル削減
const FilterPanel = lazy(() =>
  import("../components/restaurant").then(module => ({
    default: module.FilterPanel,
  }))
);
const CustomMapControls = lazy(() =>
  import("../components/map/CustomMapControls").then(module => ({
    default: module.CustomMapControls,
  }))
);

// Week 2-3: Google Maps API遅延読み込みコンテナ
const LazyMapContainer = lazy(() =>
  import("../components/map/LazyMapContainer").then(module => ({
    default: module.LazyMapContainer,
  }))
);

// 条件付きPWABadgeコンポーネント（軽量・遅延ロード）
const ConditionalPWABadge = lazy(() =>
  import("../components/layout/PWABadge").then(module => ({
    default: () => {
      const isPWAEnabled =
        import.meta.env.PROD || import.meta.env.ENABLE_PWA_DEV === "true";
      return isPWAEnabled ? <module.default /> : null;
    },
  }))
);

// エラー表示コンポーネント
const ErrorDisplay = ({
  title,
  message,
}: {
  title: string;
  message: string;
}) => (
  <div className="error-container" role="alert" aria-live="assertive">
    <h1>{title}</h1>
    <p>{message}</p>
  </div>
);

function App() {
  // Week 2-3: 遅延データ取得（地図表示開始時にトリガー）
  const {
    mapPoints,
    loading,
    error,
    filters,
    updateFilters,
    updateSortOrder,
    stats,
    triggerFetch,
  } = useMapPoints({ deferFetch: true });

  const filteredMapPoints = mapPoints; // フィルタリング済みのマップポイント
  const isMobile = useIsMobile(); // モバイル検出（カスタムフック）
  const isFullscreen = useFullscreen(); // フルスクリーン検出（カスタムフック）

  // APIキー
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // アプリケーション初期化（カスタムフック）
  const { isInitialized, appError, setAppError } = useAppInitialization({
    apiKey,
  });

  // 地図表示開始時にデータ取得をトリガー
  const handleMapLoad = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log("🚀 Map load triggered, starting data fetch...");
    }
    triggerFetch();
  }, [triggerFetch]);

  // 一度だけ生成される簡易ユーザーID（再レンダーで変わらない）
  // useState初期値で生成することで、purity違反を回避
  const [userId] = useState(() => `user_${Date.now()}`);

  // フィルターハンドラーをカスタムフックで統合管理
  const filterHandlers = useFilterHandlers({
    filters,
    updateFilters,
    onError: (error: unknown) => {
      setAppError(typeof error === "string" ? error : null);
    },
  });

  // データロード完了時の統計表示（開発環境のみ）
  useEffect(() => {
    if (!loading && mapPoints.length > 0 && import.meta.env.DEV) {
      // データロード完了から少し遅らせて統計を表示
      const timer = setTimeout(() => {
        logUnknownAddressStats();

        // 公式データに基づくテストケース（サンプル）
        const testCases = [
          { address: "佐渡市西三川", expected: "真野" as const },
          { address: "佐渡市松ケ崎", expected: "畑野" as const },
          { address: "佐渡市寺田", expected: "畑野" as const },
          { address: "佐渡市虫崎", expected: "両津" as const },
          { address: "佐渡市両津湊", expected: "両津" as const },
          { address: "佐渡市相川", expected: "相川" as const },
          { address: "佐渡市八幡", expected: "佐和田" as const },
          { address: "佐渡市金井", expected: "金井" as const },
          { address: "佐渡市新穂", expected: "新穂" as const },
          { address: "佐渡市畑野", expected: "畑野" as const },
          { address: "佐渡市真野", expected: "真野" as const },
          { address: "佐渡市小木", expected: "小木" as const },
          { address: "佐渡市羽茂", expected: "羽茂" as const },
          { address: "佐渡市赤泊", expected: "赤泊" as const },
        ];

        testDistrictAccuracy(testCases);
      }, 2000);

      return () => clearTimeout(timer);
    }

    // この条件分岐でもreturnが必要
    return () => {
      // No cleanup needed when condition is false
    };
  }, [loading, mapPoints.length]);

  // アプリケーションエラー表示
  if (appError) {
    return <ErrorDisplay title="アプリケーションエラー" message={appError} />;
  }

  // APIキー未設定エラー
  if (!apiKey) {
    return (
      <ErrorDisplay
        title="設定エラー"
        message="Google Maps APIキーが設定されていません。.env.localファイルにVITE_GOOGLE_MAPS_API_KEYを設定してください。"
      />
    );
  }

  // 初期化中の表示
  if (!isInitialized) {
    return <LoadingSpinner message="アプリケーションを初期化中..." />;
  }

  return (
    <>
      <SkipLink href="#main-content">メインコンテンツにスキップ</SkipLink>

      <div className="app">
        <main id="main-content" className="app-main">
          {/* Suspense: Google Maps関連の動的import用フォールバック */}
          <Suspense fallback={<LoadingSpinner message="地図を読み込み中..." />}>
            {/* Week 2-3: Intersection Observer による遅延読み込み + データ取得トリガー */}
            <LazyMapContainer onLoad={handleMapLoad}>
              <APIProvider apiKey={apiKey} libraries={["maps", "marker"]}>
                <div className="app-content">
                  {/* Desktop Filter Panel - デスクトップ用のフローティングフィルター（フルスクリーン時は非表示） */}
                  {!isMobile && !isFullscreen && (
                    <Suspense
                      fallback={
                        <div style={{ width: "320px", height: "100%" }} />
                      }
                    >
                      <FilterPanel
                        loading={loading}
                        resultCount={filteredMapPoints.length}
                        stats={stats}
                        onCuisineFilter={filterHandlers.handleCuisineFilter}
                        onPriceFilter={filterHandlers.handlePriceFilter}
                        onDistrictFilter={filterHandlers.handleDistrictFilter}
                        onRatingFilter={filterHandlers.handleRatingFilter}
                        onOpenNowFilter={filterHandlers.handleOpenNowFilter}
                        onSearchFilter={filterHandlers.handleSearchFilter}
                        onSortChange={updateSortOrder}
                        onFeatureFilter={filterHandlers.handleFeatureFilter}
                        onPointTypeFilter={filterHandlers.handlePointTypeFilter}
                        onResetFilters={filterHandlers.handleResetFilters}
                      />
                    </Suspense>
                  )}

                  {/* Fullscreen Map with A/B Testing Integration */}
                  <IntegratedMapView
                    mapPoints={filteredMapPoints}
                    center={SADO_CENTER}
                    loading={loading}
                    error={error ?? undefined}
                    userId={userId}
                    customControls={
                      isMobile || isFullscreen ? (
                        <Suspense
                          fallback={
                            <div
                              style={{
                                position: "absolute",
                                top: "10px",
                                left: "10px",
                              }}
                            />
                          }
                        >
                          <CustomMapControls
                            loading={loading}
                            resultCount={filteredMapPoints.length}
                            stats={stats}
                            onCuisineFilter={filterHandlers.handleCuisineFilter}
                            onPriceFilter={filterHandlers.handlePriceFilter}
                            onDistrictFilter={
                              filterHandlers.handleDistrictFilter
                            }
                            onRatingFilter={filterHandlers.handleRatingFilter}
                            onOpenNowFilter={filterHandlers.handleOpenNowFilter}
                            onSearchFilter={filterHandlers.handleSearchFilter}
                            onSortChange={updateSortOrder}
                            onFeatureFilter={filterHandlers.handleFeatureFilter}
                            onPointTypeFilter={
                              filterHandlers.handlePointTypeFilter
                            }
                            onResetFilters={filterHandlers.handleResetFilters}
                            position={DEFAULT_CONTROL_POSITION}
                          />
                        </Suspense>
                      ) : null
                    }
                  />
                </div>
              </APIProvider>
            </LazyMapContainer>
          </Suspense>
        </main>

        <Suspense fallback={null}>
          <ConditionalPWABadge />
        </Suspense>
      </div>
    </>
  );
}

export default App;
