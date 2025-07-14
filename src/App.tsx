import { APIProvider } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { useRestaurants } from "./hooks/useRestaurants";
import { RestaurantMap } from "./components/map/RestaurantMap";
import { SimpleMapTest } from "./components/map/SimpleMapTest";
import { FilterPanel } from "./components/restaurant/FilterPanel";
import { SkipLink } from "./components/common/AccessibilityComponents";
import { initGA } from "./utils/analytics";
import PWABadge from "./PWABadge";
import type { CuisineType, PriceRange } from "./types";
import "./App.css";

// 佐渡島の中心座標
const SADO_CENTER = { lat: 38.018611, lng: 138.367222 };

function App() {
  const { filteredRestaurants, asyncState, setFilters, setSortOrder } =
    useRestaurants();

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Google Analytics初期化
  useEffect(() => {
    initGA();
  }, []);

  // フィルター関数
  const handleCuisineFilter = (cuisine: CuisineType | "") => {
    setFilters({
      cuisineTypes: cuisine ? [cuisine] : [],
    });
  };

  const handlePriceFilter = (price: PriceRange | "") => {
    setFilters({
      priceRanges: price ? [price] : [],
    });
  };

  const handleSearchFilter = (search: string) => {
    setFilters({
      searchQuery: search,
    });
  };

  const handleFeatureFilter = (features: string[]) => {
    setFilters({
      features,
    });
  };

  const handleResetFilters = () => {
    setFilters({
      cuisineTypes: [],
      priceRanges: [],
      features: [],
      searchQuery: "",
    });
  };

  if (!apiKey) {
    return (
      <div className="error-container">
        <h1>設定エラー</h1>
        <p>Google Maps APIキーが設定されていません。</p>
        <p>.env.localファイルにVITE_GOOGLE_MAPS_API_KEYを設定してください。</p>
      </div>
    );
  }

  return (
    <>
      <SkipLink href="#main-content">メインコンテンツにスキップ</SkipLink>

      <div className="app">
        <header className="app-header">
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

                <SimpleMapTest />

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
