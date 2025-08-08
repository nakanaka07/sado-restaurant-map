import { APIProvider } from "@vis.gl/react-google-maps";
import { useEffect, useState, useCallback } from "react";
import { useMapPoints } from "@/hooks";
import { MapView } from "../components/map";
import { ModernFilterPanel } from "../components/restaurant";
import { SkipLink } from "../components/common/AccessibilityComponents";
import { initGA, checkGAStatus } from "@/utils";
import { sanitizeInput } from "@/utils";
import { validateApiKey } from "../utils/securityUtils";
import PWABadge from "../components/layout/PWABadge";
import type {
  CuisineType,
  PriceRange,
  SadoDistrict,
  MapPointType,
} from "@/types";
import { SADO_CENTER } from "@/config";
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
  const { mapPoints, loading, error, updateFilters, updateSortOrder, stats } =
    useMapPoints();

  const filteredMapPoints = mapPoints; // フィルタリング済みのマップポイント

  const [appError, setAppError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // セキュリティ強化: APIキーのバリデーション
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 初期化処理（エラーハンドリング強化）
  useEffect(() => {
    const initializeApp = async () => {
      try {
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
  }, [apiKey]);

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
        updateFilters({
          minRating,
        });
      } catch (error) {
        console.error("評価フィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [updateFilters]
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
        const sanitizedFeatures = features.map((feature) =>
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
      updateFilters({
        cuisineTypes: [],
        priceRanges: [],
        districts: [],
        features: [],
        searchQuery: "",
        minRating: undefined,
        openNow: false,
        pointTypes: ["restaurant", "parking", "toilet"],
      });
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
      <div className="loading-container" role="status" aria-live="polite">
        <h1>🗺️ 佐渡飲食店マップ</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      <SkipLink href="#main-content">メインコンテンツにスキップ</SkipLink>

      <div className="app">
        {/* Floating Header */}
        <header className="app-header" role="banner">
          <div className="app-header-content">
            <h1>🗺️ 佐渡島マップ</h1>
            <p>飲食店・駐車場・トイレを探す</p>
          </div>
        </header>

        <main id="main-content" className="app-main">
          <APIProvider
            apiKey={apiKey}
            libraries={["maps", "marker", "geometry"]}
          >
            <div className="app-content">
              {/* Floating Filter Panel */}
              <ModernFilterPanel
                loading={loading}
                resultCount={filteredMapPoints.length}
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

              {/* Floating Results Status */}
              <div className="results-status" role="status" aria-live="polite">
                <h3>
                  📊 検索結果: {filteredMapPoints.length}件
                  {stats && (
                    <span style={{ fontSize: "0.75rem", fontWeight: "normal" }}>
                      （🍽️{stats.restaurants} 🅿️{stats.parkings} 🚽
                      {stats.toilets}）
                    </span>
                  )}
                </h3>
                <p>
                  {filteredMapPoints.length === 0
                    ? "条件に一致するポイントが見つかりませんでした"
                    : "フィルターでさらに絞り込み可能です"}
                </p>
              </div>

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
