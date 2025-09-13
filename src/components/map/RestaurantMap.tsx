import { useMapDebugging } from "@/hooks/map/useMapDebugging";
import { useSimpleMarkerOptimization } from "@/hooks/map/useMarkerOptimization";
import type { Restaurant } from "@/types";
import { trackMapInteraction, trackRestaurantClick } from "@/utils/analytics";
import { Map } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapErrorBoundary } from "./MapErrorBoundary";
import { OptimizedInfoWindow } from "./OptimizedInfoWindow";
import { OptimizedRestaurantMarker } from "./OptimizedRestaurantMarker";

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

  // 🚀 高速化: 最適化されたマーカー表示
  const optimizedRestaurants = useSimpleMarkerOptimization(restaurants, 200);

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
      debugging.startPerformanceTimer("marker_click");

      setSelectedRestaurant(restaurant);
      trackingFunctions.trackRestaurantClick(restaurant);
      trackingFunctions.trackMapInteraction();

      debugging.endPerformanceTimer("marker_click", {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      });

      debugging.logEvent("marker_click", {
        restaurant: restaurant.name,
        cuisine: restaurant.cuisineType,
      });
    },
    [trackingFunctions, debugging]
  );

  // InfoWindow閉じるハンドラー（メモ化）
  const handleCloseInfoWindow = useCallback(() => {
    setSelectedRestaurant(null);
    debugging.logEvent("marker_click", { action: "close_info_window" });
  }, [debugging]);

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
      }}
    >
      <div className="map-container">
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
              📊 表示中: {optimizedRestaurants.length}/{restaurants.length}
            </div>
            <div>
              ⏱️ レンダリング: {debugging.debugStats.renderTime.toFixed(1)}ms
            </div>
            {debugging.debugStats.memoryUsage && (
              <div>
                💾 メモリ: {debugging.debugStats.memoryUsage.toFixed(1)}MB
              </div>
            )}
            <div style={{ marginTop: "4px", fontSize: "10px", color: "#666" }}>
              Console: window.mapDebug.showConsole()
            </div>
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
          {/* 🎯 最適化されたマーカー表示 */}
          {optimizedRestaurants.map(restaurant => (
            <OptimizedRestaurantMarker
              key={restaurant.id}
              restaurant={restaurant}
              onClick={handleMarkerClick}
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
