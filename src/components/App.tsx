import { APIProvider } from "@vis.gl/react-google-maps";
import { useEffect, useState, useCallback } from "react";
import { useRestaurants } from "../hooks/useRestaurants";
import { RestaurantMap } from "./map/RestaurantMap";
import { FilterPanel } from "./restaurant/FilterPanel";
import { SkipLink } from "./common/AccessibilityComponents";
import { initGA, checkGAStatus } from "../utils/analytics";
import { sanitizeInput, validateApiKey } from "../utils/securityUtils";
import PWABadge from "./PWABadge";
import type { CuisineType, PriceRange } from "../types/restaurant.types";
import { SADO_CENTER } from "../config/constants";
import "../styles/App.css";

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
  const { filteredRestaurants, asyncState, setFilters, setSortOrder } =
    useRestaurants();

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
        setFilters({
          cuisineTypes: cuisine ? [cuisine] : [],
        });
      } catch (error) {
        console.error("料理タイプフィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [setFilters]
  );

  const handlePriceFilter = useCallback(
    (price: PriceRange | "") => {
      try {
        setFilters({
          priceRanges: price ? [price] : [],
        });
      } catch (error) {
        console.error("価格フィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [setFilters]
  );

  const handleSearchFilter = useCallback(
    (search: string) => {
      try {
        // セキュリティ: 検索クエリのサニタイズ
        const sanitizedSearch = sanitizeInput(search);
        setFilters({
          searchQuery: sanitizedSearch,
        });
      } catch (error) {
        console.error("検索フィルターエラー:", error);
        setAppError("検索中にエラーが発生しました");
      }
    },
    [setFilters]
  );

  const handleFeatureFilter = useCallback(
    (features: string[]) => {
      try {
        // セキュリティ: 特徴フィルターの検証
        const sanitizedFeatures = features.map((feature) =>
          sanitizeInput(feature)
        );
        setFilters({
          features: sanitizedFeatures,
        });
      } catch (error) {
        console.error("特徴フィルターエラー:", error);
        setAppError("フィルター設定中にエラーが発生しました");
      }
    },
    [setFilters]
  );

  const handleResetFilters = useCallback(() => {
    try {
      setFilters({
        cuisineTypes: [],
        priceRanges: [],
        features: [],
        searchQuery: "",
      });
      // エラー状態もリセット
      setAppError(null);
    } catch (error) {
      console.error("フィルターリセットエラー:", error);
      setAppError("フィルターのリセット中にエラーが発生しました");
    }
  }, [setFilters]);

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
        <header className="app-header" role="banner">
          <h1>🗺️ 佐渡飲食店マップ</h1>
          <p>佐渡島のおいしいお店を見つけよう</p>
        </header>

        <main id="main-content" className="app-main">
          <APIProvider
            apiKey={apiKey}
            libraries={["maps", "marker", "geometry"]}
          >
            <div className="app-content">
              <FilterPanel
                loading={asyncState.loading}
                resultCount={filteredRestaurants.length}
                onCuisineFilter={handleCuisineFilter}
                onPriceFilter={handlePriceFilter}
                onSearchFilter={handleSearchFilter}
                onSortChange={setSortOrder}
                onFeatureFilter={handleFeatureFilter}
                onResetFilters={handleResetFilters}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#f0f9ff",
                    borderRadius: "8px",
                    border: "1px solid #bae6fd",
                  }}
                  role="status"
                  aria-live="polite"
                >
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "#0369a1" }}>
                    📊 検索結果: {filteredRestaurants.length}件
                    {filteredRestaurants.length > 0 && (
                      <span
                        style={{ fontSize: "0.875rem", fontWeight: "normal" }}
                      >
                        （全{asyncState.data?.length || 0}件中）
                      </span>
                    )}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "#0891b2",
                    }}
                  >
                    {filteredRestaurants.length === 0
                      ? "条件に一致するお店が見つかりませんでした。フィルターを調整してみてください。"
                      : "フィルターを使って、お探しのお店を見つけてください"}
                  </p>
                </div>

                <RestaurantMap
                  restaurants={filteredRestaurants}
                  center={SADO_CENTER}
                  loading={asyncState.loading}
                  error={asyncState.error}
                />
              </div>
            </div>
          </APIProvider>
        </main>

        <PWABadge />
      </div>
    </>
  );
}

export default App;
