import { SADO_CENTER } from "@/config";
import { useMapPoints } from "@/hooks/map/useMapPoints";
import { useFilterHandlers } from "@/hooks/ui/useFilterHandlers";
import { checkGAStatus, initGA, initializeDevLogging } from "@/utils";
import {
  logUnknownAddressStats,
  testDistrictAccuracy,
} from "@/utils/districtUtils";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SkipLink } from "../components/common/AccessibilityComponents";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { DEFAULT_CONTROL_POSITION } from "../components/map/constants";
import { validateApiKey } from "../utils/securityUtils";

// ---- Idle helper & deferred GA initialization (to reduce nesting) ----
const deferToIdle = (cb: () => void): void => {
  const ric = (
    window as unknown as {
      requestIdleCallback?: (cb: () => void) => void;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") ric(cb);
  else setTimeout(cb, 0);
};

async function initGADeferred(): Promise<void> {
  return new Promise<void>(resolve => {
    deferToIdle(() => {
      void initGA()
        .catch(err => {
          console.warn("initGA failed (deferred):", err);
        })
        .finally(() => resolve());
    });
  });
}

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

// 条件付きPWABadgeコンポーネント
const ConditionalPWABadge = () => {
  const [PWABadge, setPWABadge] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // 本番環境またはENABLE_PWA_DEV=trueの場合のみPWABadgeを読み込み
    const isPWAEnabled =
      import.meta.env.PROD || import.meta.env.ENABLE_PWA_DEV === "true";

    if (isPWAEnabled) {
      import("../components/layout/PWABadge")
        .then(module => setPWABadge(() => module.default))
        .catch(error => {
          console.warn("PWABadge could not be loaded:", error);
        });
    }
  }, []);

  if (!PWABadge) return null;

  return <PWABadge />;
};

// モバイル検出用のカスタムフック
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // テスト環境ではmatchMediaがundefinedの可能性があるためフォールバックを追加
      if (typeof window !== "undefined" && window.matchMedia) {
        const mobile = window.matchMedia("(max-width: 768px)").matches;
        if (import.meta.env.DEV) {
          console.log("🔍 Mobile Detection Debug:", {
            windowWidth: window.innerWidth,
            mediaQueryMatches: mobile,
            isMobile: mobile,
          });
        }
        setIsMobile(mobile);
      } else {
        // テスト環境等でmatchMediaが利用できない場合のデフォルト値
        if (import.meta.env.DEV) {
          console.log("⚠️ matchMedia not available, defaulting to desktop");
        }
        setIsMobile(false);
      }
    };

    checkMobile();

    // matchMediaが利用可能な場合のみリスナーを設定
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(max-width: 768px)");
      mediaQuery.addEventListener("change", checkMobile);
      return () => mediaQuery.removeEventListener("change", checkMobile);
    }

    // matchMediaが利用できない場合は何もしない
    return undefined;
  }, []);

  return isMobile;
}
// App.cssは main.tsx で読み込み済み

// 佐渡島の中心座標（設定ファイルから取得）

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
  const isMobile = useIsMobile(); // モバイル検出

  // 地図表示開始時にデータ取得をトリガー
  const handleMapLoad = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log("🚀 Map load triggered, starting data fetch...");
    }
    triggerFetch();
  }, [triggerFetch]);

  const [appError, setAppError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // フルスクリーン状態管理

  // 一度だけ生成される簡易ユーザーID（再レンダーで変わらない）
  const userId = useMemo(() => `user_${Date.now()}`, []);

  // フィルターハンドラーをカスタムフックで統合管理
  const filterHandlers = useFilterHandlers({
    filters,
    updateFilters,
    onError: (error: string) => setAppError(error || null),
  });

  // フルスクリーン要素の検出を関数化して複雑度を削減
  const getFullscreenElement = () => {
    return (
      document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element })
        .webkitFullscreenElement ||
      (document as Document & { mozFullScreenElement?: Element })
        .mozFullScreenElement ||
      (document as Document & { msFullscreenElement?: Element })
        .msFullscreenElement
    );
  };

  // フルスクリーン状態の検出とクラス付与（Level 2: CSS配置による非侵入的対応）
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = getFullscreenElement();
      const isFullscreenActive = !!fullscreenElement;

      // React state更新
      setIsFullscreen(isFullscreenActive);

      // CSS classによる配置制御（DOM移動なし）
      document.documentElement.classList.toggle(
        "fullscreen-active",
        isFullscreenActive
      );
      document.body.classList.toggle("fullscreen-active", isFullscreenActive);

      if (isFullscreenActive) {
        if (import.meta.env.DEV) {
          console.log(
            "🎯 フルスクリーンモードが有効になりました - カスタムコントロール配置"
          );
        }
      } else if (import.meta.env.DEV) {
        console.log("🔄 通常モードに戻りました");
      }
    };

    // フルスクリーン変更イベントの監視
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // 初回実行
    handleFullscreenChange();

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
      // クリーンアップ時にクラスも削除
      document.documentElement.classList.remove("fullscreen-active");
      document.body.classList.remove("fullscreen-active");
    };
  }, []);

  // セキュリティ強化: APIキーのバリデーション
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // ヘルパー: GA状態チェック（ネスト削減）
  const scheduleGAStatusCheck = useCallback(() => {
    if (!import.meta.env.DEV || typeof checkGAStatus !== "function") {
      return;
    }

    setTimeout(() => {
      const result = checkGAStatus();
      // Promise型ガード: thenableチェック
      const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
        return (
          value !== null &&
          typeof value === "object" &&
          "catch" in value &&
          typeof (value as { catch: unknown }).catch === "function"
        );
      };

      if (isPromiseLike(result)) {
        void result.catch(console.warn);
      }
    }, 3000);
  }, []);

  // 初期化処理（エラーハンドリング強化）
  useEffect(() => {
    let canceled = false;

    const initializeApp = async () => {
      try {
        // 🔧 開発環境でのログフィルタリング初期化
        initializeDevLogging();

        // APIキーのバリデーション
        if (!validateApiKey(apiKey)) {
          throw new Error("無効なGoogle Maps APIキーです");
        }

        // Google Analytics 初期化はアイドルタイムに遅延
        await initGADeferred();

        if (canceled) return;

        // 開発環境でのみデバッグ情報を表示
        scheduleGAStatusCheck();

        setIsInitialized(true);
      } catch (error) {
        console.error("アプリケーション初期化エラー:", error);
        setAppError(
          error instanceof Error
            ? error.message
            : "アプリケーションの初期化に失敗しました"
        );
      }
    };

    void initializeApp();

    // cleanup function
    return () => {
      canceled = true;
    };
  }, [apiKey, scheduleGAStatusCheck]);

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
                    error={error}
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

        <ConditionalPWABadge />
      </div>
    </>
  );
}

export default App;
