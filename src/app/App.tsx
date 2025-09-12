import { SADO_CENTER } from "@/config";
import { useMapPoints } from "@/hooks";
import type {
  CuisineType,
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
import { APIProvider } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useState } from "react";
import { SkipLink } from "../components/common/AccessibilityComponents";
import PWABadge from "../components/layout/PWABadge";
import { MapView } from "../components/map";
import { FilterPanel } from "../components/restaurant";
import { CompactModalFilter } from "../components/ui"; // NEW: CompactModalFilter 追加
import { validateApiKey } from "../utils/securityUtils";

// モバイル検出用のカスタムフック
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // テスト環境ではmatchMediaがundefinedの可能性があるためフォールバックを追加
      if (typeof window !== "undefined" && window.matchMedia) {
        const mobile = window.matchMedia("(max-width: 768px)").matches;
        console.log("🔍 Mobile Detection Debug:", {
          windowWidth: window.innerWidth,
          mediaQueryMatches: mobile,
          isMobile: mobile,
        });
        setIsMobile(mobile);
      } else {
        // テスト環境等でmatchMediaが利用できない場合のデフォルト値
        console.log("⚠️ matchMedia not available, defaulting to desktop");
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

  // フルスクリーン状態の検出とクラス付与（Level 2: 改良版DOM操作対応）
  useEffect(() => {
    const handleFullscreenChange = () => {
      // 🆕 最新仕様：Document.fullscreenElementを最優先
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;

      const isFullscreen = !!fullscreenElement;
      const filterBtn = document.querySelector(
        ".filter-trigger-btn"
      ) as HTMLElement;

      if (isFullscreen && filterBtn && fullscreenElement) {
        // ✅ 改善：元の位置を保存
        if (!filterBtn.dataset.originalParent) {
          filterBtn.dataset.originalParent =
            filterBtn.parentElement?.tagName || "BODY";
          filterBtn.dataset.originalPosition =
            getComputedStyle(filterBtn).position;
          filterBtn.dataset.originalZIndex = getComputedStyle(filterBtn).zIndex;
          console.log("🔧 フィルターボタンの元位置を保存しました", {
            parent: filterBtn.dataset.originalParent,
            position: filterBtn.dataset.originalPosition,
            zIndex: filterBtn.dataset.originalZIndex,
          });
        }

        // フルスクリーン要素直下に移動
        if (!fullscreenElement.contains(filterBtn)) {
          try {
            fullscreenElement.appendChild(filterBtn);
            filterBtn.style.position = "absolute";
            filterBtn.style.zIndex = "999999";
            filterBtn.style.inset = "auto auto 20px 20px";
            console.log("🎯 フルスクリーン要素直下にボタンを移動しました");
          } catch (error) {
            console.warn("⚠️ DOM移動に失敗しました:", error);
            // フォールバック：強制的にfixed配置
            filterBtn.style.position = "fixed";
            filterBtn.style.zIndex = "2147483647";
          }
        }
      } else if (!isFullscreen && filterBtn?.dataset.originalParent) {
        // 🔄 フルスクリーン終了時：元の場所に復元
        try {
          const originalParent =
            document.querySelector(
              filterBtn.dataset.originalParent.toLowerCase()
            ) || document.body;
          originalParent.appendChild(filterBtn);
          filterBtn.style.position = filterBtn.dataset.originalPosition || "";
          filterBtn.style.zIndex = filterBtn.dataset.originalZIndex || "";
          filterBtn.style.inset = "";

          // データ属性をクリーンアップ
          delete filterBtn.dataset.originalParent;
          delete filterBtn.dataset.originalPosition;
          delete filterBtn.dataset.originalZIndex;

          console.log("� フィルターボタンを元の場所に復元しました");
        } catch (error) {
          console.warn("⚠️ ボタン復元に失敗しました:", error);
        }
      }

      // CSS classの管理（既存コードとの互換性維持）
      document.documentElement.classList.toggle(
        "fullscreen-active",
        isFullscreen
      );

      if (isFullscreen) {
        console.log("🔍 フルスクリーンが有効になりました", {
          fullscreenElement: fullscreenElement?.tagName,
          filterBtnMoved: fullscreenElement?.contains(filterBtn),
        });
      } else {
        console.log("🔍 フルスクリーンが解除されました");
      }
    };

    // フルスクリーン変更イベントの監視
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);

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
      // クリーンアップ時にクラスも削除
      document.documentElement.classList.remove("fullscreen-active");
    };
  }, []);

  // セキュリティ強化: APIキーのバリデーション
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 初期化処理（エラーハンドリング強化）
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 🔧 開発環境でのログフィルタリング初期化
        initializeDevLogging();

        // APIキーのバリデーション
        if (!validateApiKey(apiKey)) {
          throw new Error("無効なGoogle Maps APIキーです");
        }

        // Google Analytics初期化（エラーハンドリング付き）
        await initGA();

        // 開発環境でのみデバッグ情報を表示
        if (import.meta.env.DEV) {
          setTimeout(() => {
            checkGAStatus().catch(console.warn);
          }, 3000);
        }

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

    // cleanup function (optional)
    return () => {
      // No cleanup needed for this effect
    };
  }, [apiKey]);

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
        updateFilters({
          cuisineTypes: cuisine ? [cuisine] : [],
        });
      } catch (error) {
        console.error("料理タイプフィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [updateFilters]
  );

  const handlePriceFilter = useCallback(
    (price: PriceRange | "") => {
      try {
        updateFilters({
          priceRanges: price ? [price] : [],
        });
      } catch (error) {
        console.error("価格フィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [updateFilters]
  );

  const handleDistrictFilter = useCallback(
    (districts: SadoDistrict[]) => {
      try {
        updateFilters({
          districts,
        });
      } catch (error) {
        console.error("地区フィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [updateFilters]
  );

  const handleRatingFilter = useCallback(
    (minRating: number | undefined) => {
      try {
        if (typeof minRating === "number") {
          updateFilters({
            ...filters,
            minRating,
          });
        } else {
          // minRatingを除外したフィルターでリセット
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { minRating, ...filtersWithoutRating } = filters;
          updateFilters(filtersWithoutRating);
        }
      } catch (error) {
        console.error("評価フィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [filters, updateFilters]
  );

  const handleOpenNowFilter = useCallback(
    (openNow: boolean) => {
      try {
        updateFilters({
          openNow,
        });
      } catch (error) {
        console.error("営業中フィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [updateFilters]
  );

  const handleSearchFilter = useCallback(
    (search: string) => {
      try {
        // セキュリティ: 検索クエリのサニタイズ
        const sanitizedSearch = sanitizeInput(search);
        updateFilters({
          searchQuery: sanitizedSearch,
        });
      } catch (error) {
        console.error("検索フィルターエラー:", error);
        setAppError("検索中にエラーが発生しました");
      }
    },
    [updateFilters]
  );

  const handleFeatureFilter = useCallback(
    (features: string[]) => {
      try {
        // セキュリティ: 特徴フィルターの検証
        const sanitizedFeatures = features.map(feature =>
          sanitizeInput(feature)
        );
        updateFilters({
          features: sanitizedFeatures,
        });
      } catch (error) {
        console.error("特徴フィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [updateFilters]
  );

  const handlePointTypeFilter = useCallback(
    (pointTypes: MapPointType[]) => {
      try {
        updateFilters({
          pointTypes,
        });
      } catch (error) {
        console.error("ポイントタイプフィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    try {
      // minRatingをundefinedで渡すとexactOptionalPropertyTypesエラーになるため除外
      const resetFilters = {
        cuisineTypes: [] as never[],
        priceRanges: [] as never[],
        districts: [] as never[],
        features: [] as never[],
        searchQuery: "",
        openNow: false,
        pointTypes: ["restaurant", "parking", "toilet"] as const,
      };

      updateFilters(resetFilters);
      // エラー状態もリセット
      setAppError(null);
    } catch (error) {
      console.error("フィルターリセットエラー:", error);
      setAppError("フィルターのリセット中にエラーが発生しました");
    }
  }, [updateFilters]);

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
    return (
      <output className="loading-container" aria-live="polite">
        <span>読み込み中...</span>
      </output>
    );
  }

  return (
    <>
      <SkipLink href="#main-content">メインコンテンツにスキップ</SkipLink>

      <div className="app">
        <main id="main-content" className="app-main">
          <APIProvider
            apiKey={apiKey}
            libraries={["maps", "marker", "geometry"]}
          >
            <div className="app-content">
              {/* Floating Filter Panel - Desktop or Compact Modal for Mobile */}
              {isMobile ? (
                <CompactModalFilter
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
              ) : (
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
              )}

              {/* Fullscreen Map */}
              <MapView
                mapPoints={filteredMapPoints}
                center={SADO_CENTER}
                loading={loading}
                error={error}
              />
            </div>
          </APIProvider>
        </main>

        <PWABadge />
      </div>
    </>
  );
}

export default App;
