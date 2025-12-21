import {
  createMarkerInteraction,
  useABTestIntegration,
} from "@/hooks/map/useABTestIntegration";
import { useMapDebugging } from "@/hooks/map/useMapDebugging";
import { useSimpleMarkerOptimization } from "@/hooks/map/useMarkerOptimization";
import type { Restaurant } from "@/types";
import type { MigrationConfig } from "@/types/migration";
import { trackMapInteraction, trackRestaurantClick } from "@/utils/analytics";
import { yieldToMain } from "@/utils/performanceUtils";
import { Map } from "@vis.gl/react-google-maps";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
// Legacy marker has been removed; keep only new migration system path usage
import { MapErrorBoundary } from "./MapErrorBoundary";
import { MarkerMigrationSystem } from "./migration/MarkerMigration";
import { OptimizedInfoWindow } from "./OptimizedInfoWindow";
import { UnifiedMarker } from "./UnifiedMarker";

interface RestaurantMapProps {
  readonly restaurants: readonly Restaurant[];
  readonly center: { lat: number; lng: number };
  readonly loading: boolean;
}

export default function RestaurantMap({
  restaurants,
  center,
  loading,
}: RestaurantMapProps) {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [visibleRestaurants, setVisibleRestaurants] = useState<
    readonly Restaurant[]
  >([]);
  const [renderProgress, setRenderProgress] = useState(0);

  // 🚀 高速化: 最適化されたマーカー表示
  const optimizedRestaurants = useSimpleMarkerOptimization(restaurants, 200);

  // 🧪 A/Bテスト: マーカーシステム移行設定
  const migrationConfig = useMemo(
    (): MigrationConfig => ({
      enabled: true, // 移行機能有効
      rolloutPercentage: 50, // Phase 2: 50%ロールアウト
      useNewSystemForced: false, // デバッグ用強制設定
      enableFallback: true, // フォールバック有効
      enablePerformanceMonitoring: true,
      enableUserFeedback: false, // 初期段階では無効
      debugMode: process.env.NODE_ENV === "development",
    }),
    []
  );

  // 🔄 移行判定: ユーザーIDベースの一貫した振り分け
  // セッションseedは初回マウント時にのみ生成 (react-hooks impure function 対応)
  const [userSeedState] = useState(() => {
    const stored = sessionStorage.getItem("markerSystemSeed");
    if (stored) return stored;
    const newSeed = String(Date.now() + Math.random());
    sessionStorage.setItem("markerSystemSeed", newSeed);
    return newSeed;
  });

  const shouldUseNewMarkerSystem = useMemo(() => {
    if (migrationConfig.useNewSystemForced !== undefined) {
      return migrationConfig.useNewSystemForced;
    }

    const hash = userSeedState.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) & 0x7fffffff;
    }, 0);

    return hash % 100 < migrationConfig.rolloutPercentage;
  }, [
    migrationConfig.rolloutPercentage,
    migrationConfig.useNewSystemForced,
    userSeedState,
  ]);

  // 📊 A/Bテスト統合: 分析・監視機能
  const abTestIntegration = useABTestIntegration({
    variant: shouldUseNewMarkerSystem ? "enhanced-png" : "original",
    segment: "general",
    enableTracking: true,
    debugMode: process.env.NODE_ENV === "development",
  });

  // 🔧 デバッグ: 開発者体験向上
  const debugging = useMapDebugging(restaurants, {
    trackPerformance: true,
    trackMemory: true,
  });

  // 🧠 メモ化: アナリティクス関数を最適化
  const trackingFunctions = useMemo(
    () => ({
      trackRestaurantClick: (restaurant: Restaurant) => {
        trackRestaurantClick({
          id: restaurant.id,
          name: restaurant.name,
          category: restaurant.cuisineType,
          priceRange: restaurant.priceRange,
        });
      },
      trackMapInteraction: () => {
        trackMapInteraction("marker_click");
      },
    }),
    []
  );

  // レストランマーカークリック時の処理（メモ化）
  const handleMarkerClick = useCallback(
    (restaurant: Restaurant) => {
      const startTime = performance.now();
      debugging.startPerformanceTimer("marker_click");

      setSelectedRestaurant(restaurant);
      trackingFunctions.trackRestaurantClick(restaurant);
      trackingFunctions.trackMapInteraction();

      // A/Bテストイベント追跡
      const renderTime = performance.now() - startTime;
      abTestIntegration.trackMarkerInteraction(
        createMarkerInteraction(restaurant, "click", renderTime)
      );

      debugging.endPerformanceTimer("marker_click", {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      });

      debugging.logEvent("marker_click", {
        restaurant: restaurant.name,
        cuisine: restaurant.cuisineType,
      });
    },
    [trackingFunctions, debugging, abTestIntegration]
  );

  // InfoWindow閉じるハンドラー（メモ化）
  const handleCloseInfoWindow = useCallback(() => {
    setSelectedRestaurant(null);
    debugging.logEvent("marker_click", { action: "close_info_window" });
  }, [debugging]);

  // 段階的マーカーレンダリング
  // 空配列の場合は初期値で処理されるためeffect内での同期setStateは不要
  useEffect(() => {
    // 空配列の場合は何もしない (react-hooks/set-state-in-effect 対応)
    if (optimizedRestaurants.length === 0) {
      return;
    }

    let isCancelled = false;
    const rendered: Restaurant[] = [];

    async function renderMarkersInChunks() {
      const chunkSize = 50; // 50件ずつ段階的に表示

      for (let i = 0; i < optimizedRestaurants.length; i += chunkSize) {
        if (isCancelled) break;

        const chunk = optimizedRestaurants.slice(i, i + chunkSize);
        rendered.push(...chunk);

        startTransition(() => {
          setVisibleRestaurants([...rendered]);
          const progress = Math.min(
            100,
            ((i + chunkSize) / optimizedRestaurants.length) * 100
          );
          setRenderProgress(progress);
        });

        await yieldToMain();
      }

      if (!isCancelled) {
        startTransition(() => {
          setRenderProgress(100);
        });
      }
    }

    void renderMarkersInChunks();

    return () => {
      isCancelled = true;
    };
  }, [optimizedRestaurants]);

  // パフォーマンス統計の更新
  useEffect(() => {
    debugging.updateDebugStats(
      optimizedRestaurants.length,
      optimizedRestaurants.length,
      0 // レンダリング時間は別途測定
    );
  }, [optimizedRestaurants.length, debugging]);

  if (loading) {
    return (
      <div className="map-loading" style={{ height: "500px" }}>
        <p>🗺️ 地図を読み込み中...</p>
      </div>
    );
  }

  if (!mapId) {
    return (
      <div className="map-error" style={{ height: "500px" }}>
        <p style={{ color: "#d63031", fontSize: "18px", marginBottom: "12px" }}>
          ❌ Map ID が設定されていません
        </p>
        <p style={{ color: "#636e72", fontSize: "14px", marginBottom: "16px" }}>
          Google Maps API の Map ID を設定してください
        </p>
        <div style={{ fontSize: "12px", color: "#636e72" }}>
          <p>
            環境変数: <code>VITE_GOOGLE_MAPS_MAP_ID</code>
          </p>
          <p>
            現在の値: <code>{mapId ?? "未設定"}</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <MapErrorBoundary
      onError={errorInfo => {
        debugging.logError(
          errorInfo.originalError || new Error(errorInfo.message),
          "RestaurantMap"
        );

        // A/Bテストエラー追跡
        abTestIntegration.trackError(
          errorInfo.originalError || new Error(errorInfo.message),
          "RestaurantMap"
        );
      }}
    >
      <div className="map-container">
        {/* ローディングインジケーター（ARIA対応） */}
        {renderProgress > 0 && renderProgress < 100 && (
          <div
            className="marker-loading-indicator"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1002,
              background: "rgba(0,0,0,0.85)",
              color: "white",
              padding: "16px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: "8px" }}>🗺️ マーカー読み込み中...</div>
            <div style={{ fontSize: "12px", color: "#aaa" }}>
              {Math.round(renderProgress)}% ({visibleRestaurants.length}/
              {optimizedRestaurants.length}件)
            </div>
          </div>
        )}

        {/* 🎯 デバッグ情報表示（開発環境のみ） */}
        {process.env.NODE_ENV === "development" && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              zIndex: 1000,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "monospace",
              border: "1px solid #ddd",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div>
              📊 表示中: {visibleRestaurants.length}/
              {optimizedRestaurants.length} (元: {restaurants.length})
            </div>
            <div>
              ⏱️ レンダリング: {debugging.debugStats.renderTime.toFixed(1)}ms
            </div>
            {debugging.debugStats.memoryUsage && (
              <div>
                💾 メモリ: {debugging.debugStats.memoryUsage.toFixed(1)}MB
              </div>
            )}
            <div>
              🎯 マーカー: {shouldUseNewMarkerSystem ? "v2(新)" : "v1(旧)"}
            </div>
            <div>
              📈 インタラクション: {abTestIntegration.totalInteractions}
            </div>
            <div>⏱️ セッション: {abTestIntegration.sessionDuration}秒</div>
            <div>🔄 読込進捗: {Math.round(renderProgress)}%</div>
          </div>
        )}

        <Map
          defaultCenter={center}
          defaultZoom={11}
          mapId={mapId}
          style={{ width: "100%", height: "100%" }}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={true}
          fullscreenControl={true}
          streetViewControl={true}
          zoomControl={true}
        >
          {/* 🎯 段階的マーカー表示 - A/Bテスト対応 */}
          {shouldUseNewMarkerSystem
            ? visibleRestaurants.map(restaurant => (
                <MarkerMigrationSystem
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={handleMarkerClick}
                  config={migrationConfig}
                />
              ))
            : visibleRestaurants.map(restaurant => (
                <UnifiedMarker
                  key={restaurant.id}
                  point={restaurant}
                  onClick={() => handleMarkerClick(restaurant)}
                  variant="icon"
                  size="medium"
                />
              ))}

          {selectedRestaurant && (
            <OptimizedInfoWindow
              restaurant={selectedRestaurant}
              onClose={handleCloseInfoWindow}
            />
          )}
        </Map>
      </div>
    </MapErrorBoundary>
  );
}

export { RestaurantMap };
