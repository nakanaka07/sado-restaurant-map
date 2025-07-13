import { APIProvider } from "@vis.gl/react-google-maps";
import { useRestaurants } from "./hooks/useRestaurants";
import { RestaurantMap } from "./components/map/RestaurantMap";
import { FilterPanel } from "./components/restaurant/FilterPanel";
import { SkipLink } from "./components/common/AccessibilityComponents";
import PWABadge from "./PWABadge";
import "./App.css";

// 佐渡島の中心座標
const SADO_CENTER = { lat: 38.018611, lng: 138.367222 };

function App() {
  const { restaurants, asyncState } = useRestaurants();

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
          <APIProvider apiKey={apiKey} libraries={["marker", "geometry"]}>
            <div className="app-content">
              <FilterPanel loading={asyncState.loading} />

              <RestaurantMap
                restaurants={restaurants}
                center={SADO_CENTER}
                loading={asyncState.loading}
                error={asyncState.error}
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
