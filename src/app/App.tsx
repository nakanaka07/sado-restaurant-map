import { SADO_CENTER } from "@/config";
import { useMapPoints } from "@/hooks";
import type {
  CuisineType,
  MapPointType,
  PriceRange,
  SadoDistrict,
} from "@/types";
import { checkGAStatus, initGA, initializeDevLogging, sanitizeInput } from "@/utils";
import { logUnknownAddressStats, testDistrictAccuracy } from "@/utils/districtUtils";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useState } from "react";
import { SkipLink } from "../components/common/AccessibilityComponents";
import PWABadge from "../components/layout/PWABadge";
import { MapView } from "../components/map";
import { FilterPanel } from "../components/restaurant";
import { validateApiKey } from "../utils/securityUtils";
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
              {/* Floating Filter Panel */}
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
