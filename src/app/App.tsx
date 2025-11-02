import { SADO_CENTER } from "@/config";
import { useMapPoints } from "@/hooks/map/useMapPoints";
import type {
  CuisineType,
  ExtendedMapFilters,
  MapPointType,
  PriceRange,
  SadoDistrict,
} from "@/types";
import {
  checkGAStatus,
  initGA,
  initializeDevLogging,
  sanitizeInput,
} from "@/utils";
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
  const {
    mapPoints,
    loading,
    error,
    filters,
    updateFilters,
    updateSortOrder,
    stats,
  } = useMapPoints();

  const filteredMapPoints = mapPoints; // フィルタリング済みのマップポイント
  const isMobile = useIsMobile(); // モバイル検出

  const [appError, setAppError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // フルスクリーン状態管理

  // 一度だけ生成される簡易ユーザーID（再レンダーで変わらない）
  const userId = useMemo(() => `user_${Date.now()}`, []);

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

  // 汎用フィルターエラーハンドラ
  const handleFilterError = useCallback((error: unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (import.meta.env.DEV) {
      console.error(`${context}エラー:`, errorMessage);
    }
    setAppError("フィルター設定中にエラーが発生しました");
  }, []);

  // 共通のフィルター更新ヘルパ（型/上限制約/サニタイズを集約）
  const updateFiltersSafe = useCallback(
    (partial: Partial<ExtendedMapFilters>) => {
      try {
        // 事前にサニタイズ/検証した partial を構築（不変）
        let sanitizedPartial: Partial<ExtendedMapFilters> = { ...partial };

        if (typeof partial.searchQuery === "string") {
          const sq = sanitizeInput(partial.searchQuery);
          if (sq.length > 100) {
            setAppError("検索クエリは100文字以下で入力してください");
            return;
          }
          sanitizedPartial = { ...sanitizedPartial, searchQuery: sq };
        }

        if (Array.isArray(sanitizedPartial.features)) {
          if (sanitizedPartial.features.length > 20) {
            setAppError("特徴フィルターは20個以下で選択してください");
            return;
          }
        }
        if (Array.isArray(sanitizedPartial.districts)) {
          if (sanitizedPartial.districts.length > 10) {
            setAppError("地区は10個以下で選択してください");
            return;
          }
        }
        // filters 全体は useMapPoints 側で保持しているためここでは使用しない
        // Hook 側で部分更新をマージするため、部分のみ渡す
        updateFilters(sanitizedPartial);
      } catch (e) {
        handleFilterError(e, "フィルター更新");
      }
    },
    [updateFilters, handleFilterError]
  );

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

  // セキュリティ強化: 入力サニタイズ付きフィルター関数
  const handleCuisineFilter = useCallback(
    (cuisine: CuisineType | "") => {
      try {
        if (cuisine !== "" && typeof cuisine !== "string") {
          if (import.meta.env.DEV) {
            console.warn("無効な料理タイプが指定されました");
          }
          return;
        }
        updateFiltersSafe({ cuisineTypes: cuisine ? [cuisine] : [] });
      } catch (error) {
        handleFilterError(error, "料理タイプフィルター");
      }
    },
    [updateFiltersSafe, handleFilterError]
  );

  const handlePriceFilter = useCallback(
    (price: PriceRange | "") => {
      try {
        if (price !== "" && typeof price !== "string") {
          if (import.meta.env.DEV) {
            console.warn("無効な価格範囲が指定されました");
          }
          return;
        }
        updateFiltersSafe({ priceRanges: price ? [price] : [] });
      } catch (error) {
        handleFilterError(error, "価格フィルター");
      }
    },
    [updateFiltersSafe, handleFilterError]
  );

  const handleDistrictFilter = useCallback(
    (districts: SadoDistrict[]) => {
      try {
        if (!Array.isArray(districts)) {
          if (import.meta.env.DEV) {
            console.warn("地区フィルターは配列である必要があります");
          }
          return;
        }
        if (districts.length > 10) {
          if (import.meta.env.DEV) {
            console.warn("選択できる地区数が多すぎます");
          }
          setAppError("地区は10個以下で選択してください");
          return;
        }
        updateFiltersSafe({ districts });
      } catch (error) {
        handleFilterError(error, "地区フィルター");
      }
    },
    [updateFiltersSafe, handleFilterError]
  );

  const handleRatingFilter = useCallback(
    (minRating: number | undefined) => {
      try {
        if (typeof minRating === "number") {
          updateFiltersSafe({ ...filters, minRating });
        } else {
          // minRatingを除外したフィルターでリセット
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { minRating, ...filtersWithoutRating } = filters;
          updateFiltersSafe(filtersWithoutRating);
        }
      } catch (error) {
        handleFilterError(error, "評価フィルター");
      }
    },
    [filters, updateFiltersSafe, handleFilterError]
  );

  const handleOpenNowFilter = useCallback(
    (openNow: boolean) => {
      try {
        updateFiltersSafe({ openNow });
      } catch (error) {
        handleFilterError(error, "営業中フィルター");
      }
    },
    [updateFiltersSafe, handleFilterError]
  );

  const handleSearchFilter = useCallback(
    (search: string) => {
      try {
        if (typeof search !== "string") {
          if (import.meta.env.DEV) {
            console.warn("検索クエリは文字列である必要があります");
          }
          return;
        }
        const sanitizedSearch = sanitizeInput(search);
        if (sanitizedSearch.length > 100) {
          if (import.meta.env.DEV) {
            console.warn("検索クエリが長すぎます");
          }
          setAppError("検索クエリは100文字以下で入力してください");
          return;
        }
        updateFiltersSafe({ searchQuery: sanitizedSearch });
      } catch (error) {
        handleFilterError(error, "検索フィルター");
      }
    },
    [updateFiltersSafe, handleFilterError]
  );

  const handleFeatureFilter = useCallback(
    (features: string[]) => {
      try {
        if (!Array.isArray(features)) {
          if (import.meta.env.DEV) {
            console.warn("特徴フィルターは配列である必要があります");
          }
          return;
        }
        const sanitizedFeatures = features
          .filter((feature): feature is string => typeof feature === "string")
          .map(feature => {
            const sanitized = sanitizeInput(feature);
            if (sanitized.length > 50) {
              if (import.meta.env.DEV) {
                console.warn(`特徴アイテムが長すぎます: ${feature}`);
              }
              return sanitized.slice(0, 50);
            }
            return sanitized;
          })
          .filter(feature => feature.length > 0);

        if (sanitizedFeatures.length > 20) {
          if (import.meta.env.DEV) {
            console.warn("特徴フィルターの数が多すぎます");
          }
          setAppError("特徴フィルターは20個以下で選択してください");
          return;
        }
        updateFiltersSafe({ features: sanitizedFeatures });
      } catch (error) {
        handleFilterError(error, "特徴フィルター");
      }
    },
    [updateFiltersSafe, handleFilterError]
  );

  const handlePointTypeFilter = useCallback(
    (pointTypes: MapPointType[]) => {
      try {
        updateFiltersSafe({ pointTypes });
      } catch (error) {
        handleFilterError(error, "ポイントタイプフィルター");
      }
    },
    [updateFiltersSafe, handleFilterError]
  );

  const handleResetFilters = useCallback(() => {
    try {
      const defaultPointTypes: MapPointType[] = [
        "restaurant",
        "parking",
        "toilet",
      ];
      const resetFilters: Partial<ExtendedMapFilters> = {
        cuisineTypes: [] as CuisineType[],
        priceRanges: [] as PriceRange[],
        districts: [] as SadoDistrict[],
        features: [] as string[],
        searchQuery: "",
        openNow: false,
        pointTypes: defaultPointTypes,
      };
      updateFiltersSafe(resetFilters);
      setAppError(null);
    } catch (error) {
      handleFilterError(error, "フィルターリセット");
    }
  }, [updateFiltersSafe, handleFilterError]);

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
            <APIProvider
              apiKey={apiKey}
              libraries={["maps", "marker", "geometry"]}
            >
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
                      onCuisineFilter={handleCuisineFilter}
                      onPriceFilter={handlePriceFilter}
                      onDistrictFilter={handleDistrictFilter}
                      onRatingFilter={handleRatingFilter}
                      onOpenNowFilter={handleOpenNowFilter}
                      onSearchFilter={handleSearchFilter}
                      onSortChange={updateSortOrder}
                      onFeatureFilter={handleFeatureFilter}
                      onPointTypeFilter={handlePointTypeFilter}
                      onResetFilters={handleResetFilters}
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
                          onCuisineFilter={handleCuisineFilter}
                          onPriceFilter={handlePriceFilter}
                          onDistrictFilter={handleDistrictFilter}
                          onRatingFilter={handleRatingFilter}
                          onOpenNowFilter={handleOpenNowFilter}
                          onSearchFilter={handleSearchFilter}
                          onSortChange={updateSortOrder}
                          onFeatureFilter={handleFeatureFilter}
                          onPointTypeFilter={handlePointTypeFilter}
                          onResetFilters={handleResetFilters}
                          position={DEFAULT_CONTROL_POSITION}
                        />
                      </Suspense>
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

export default App;
