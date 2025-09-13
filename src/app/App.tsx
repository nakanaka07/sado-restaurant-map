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
import { CustomMapControls } from "../components/map/CustomMapControls"; // NEW: CustomMapControls 追加
import { FilterPanel } from "../components/restaurant";
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
      const isFullscreen = !!fullscreenElement;

      // CSS classによる配置制御（DOM移動なし）
      document.documentElement.classList.toggle(
        "fullscreen-active",
        isFullscreen
      );
      document.body.classList.toggle("fullscreen-active", isFullscreen);

      if (isFullscreen) {
        console.log(
          "🎯 フルスクリーンモードが有効になりました - カスタムコントロール配置"
        );

        // より確実な表示確保（補強策）
        setTimeout(() => {
          const filterBtn = document.querySelector(
            ".filter-trigger-btn"
          ) as HTMLElement;
          if (filterBtn && filterBtn.style.display === "none") {
            filterBtn.style.position = "fixed";
            filterBtn.style.zIndex = "2147483647";
            filterBtn.style.bottom = "20px";
            filterBtn.style.left = "20px";
            filterBtn.style.display = "flex";
            filterBtn.style.visibility = "visible";
            filterBtn.style.opacity = "1";
            console.log("🔧 フィルターボタンの強制表示を適用しました");
          }
        }, 100);
      } else {
        console.log("🔄 通常モードに戻りました");
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
        // 型ガード：料理タイプのバリデーション
        if (cuisine !== "" && typeof cuisine !== "string") {
          console.warn("無効な料理タイプが指定されました");
          return;
        }

        updateFilters({
          cuisineTypes: cuisine ? [cuisine] : [],
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`料理タイプフィルターエラー: ${errorMessage}`);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [updateFilters]
  );

  const handlePriceFilter = useCallback(
    (price: PriceRange | "") => {
      try {
        // 型ガード：価格範囲のバリデーション
        if (price !== "" && typeof price !== "string") {
          console.warn("無効な価格範囲が指定されました");
          return;
        }

        updateFilters({
          priceRanges: price ? [price] : [],
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`価格フィルターエラー: ${errorMessage}`);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [updateFilters]
  );

  const handleDistrictFilter = useCallback(
    (districts: SadoDistrict[]) => {
      try {
        // 型ガード：地区配列のバリデーション
        if (!Array.isArray(districts)) {
          console.warn("地区フィルターは配列である必要があります");
          return;
        }

        // 地区数の制限チェック
        if (districts.length > 10) {
          console.warn("選択できる地区数が多すぎます");
          setAppError("地区は10個以下で選択してください");
          return;
        }

        updateFilters({
          districts,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`地区フィルターエラー: ${errorMessage}`);
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
        // 型ガード：検索クエリのバリデーション（型安全性強化）
        if (typeof search !== "string") {
          console.warn("検索クエリは文字列である必要があります");
          return;
        }

        // セキュリティ: 検索クエリのサニタイズ・バリデーション
        const sanitizedSearch = sanitizeInput(search);

        // 不適切なクエリの検出
        if (sanitizedSearch.length > 100) {
          console.warn("検索クエリが長すぎます");
          setAppError("検索クエリは100文字以下で入力してください");
          return;
        }

        updateFilters({
          searchQuery: sanitizedSearch,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`検索フィルターエラー: ${errorMessage}`);
        setAppError("検索中にエラーが発生しました");
      }
    },
    [updateFilters]
  );

  const handleFeatureFilter = useCallback(
    (features: string[]) => {
      try {
        // 型ガード：特徴配列のバリデーション（型安全性強化）
        if (!Array.isArray(features)) {
          console.warn("特徴フィルターは配列である必要があります");
          return;
        }

        // セキュリティ: 特徴フィルターの検証・サニタイズ
        const sanitizedFeatures = features
          .filter((feature): feature is string => typeof feature === "string")
          .map(feature => {
            const sanitized = sanitizeInput(feature);
            if (sanitized.length > 50) {
              console.warn(`特徴アイテムが長すぎます: ${feature}`);
              return sanitized.slice(0, 50);
            }
            return sanitized;
          })
          .filter(feature => feature.length > 0);

        // 特徴数の制限チェック
        if (sanitizedFeatures.length > 20) {
          console.warn("特徴フィルターの数が多すぎます");
          setAppError("特徴フィルターは20個以下で選択してください");
          return;
        }

        updateFilters({
          features: sanitizedFeatures,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`特徴フィルターエラー: ${errorMessage}`);
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
              {/* Desktop Filter Panel - デスクトップ用のフローティングフィルター */}
              {!isMobile && (
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

              {/* Fullscreen Map with Custom Controls */}
              <MapView
                mapPoints={filteredMapPoints}
                center={SADO_CENTER}
                loading={loading}
                error={error}
                customControls={
                  isMobile ? (
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
                      position={
                        window.google?.maps?.ControlPosition?.BOTTOM_LEFT || 10
                      }
                    />
                  ) : null
                }
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
