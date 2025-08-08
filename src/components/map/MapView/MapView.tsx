/**
 * @fileoverview Main MapView component
 * メインの地図表示コンポーネント（分割後）
 */

import { useState, useCallback } from "react";
import type { MapPoint, Restaurant } from "@/types";
import { trackRestaurantClick, trackMapInteraction } from "@/utils/analytics";
import { MapContainer } from "./MapContainer";
import { MapErrorFallback } from "./MapErrorFallback";

interface MapViewProps {
  mapPoints: readonly MapPoint[];
  center: { lat: number; lng: number };
  loading: boolean;
  error?: string | null;
}

export function MapView({ mapPoints, center, loading, error }: MapViewProps) {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // マーカークリックハンドラー
  const handleMarkerClick = useCallback((point: MapPoint) => {
    setSelectedPoint(point);

    // 飲食店の場合はクリック分析を追跡
    if (point.type === "restaurant") {
      const restaurant = point as Restaurant;
      trackRestaurantClick({
        id: restaurant.id,
        name: restaurant.name,
        category: restaurant.cuisineType,
        priceRange: restaurant.priceRange || "不明",
      });
    }

    // 地図インタラクション分析
    trackMapInteraction("marker_click");
  }, []);

  // InfoWindow閉じるハンドラー
  const handleCloseInfoWindow = useCallback(() => {
    setSelectedPoint(null);
  }, []);

  // ローディング状態
  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: "500px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          border: "1px solid #e0e0e0",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔄</div>
          <p style={{ color: "#6c757d" }}>地図を読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー状態またはMap ID未設定
  if (error || !mapId) {
    return <MapErrorFallback mapId={mapId} error={error} />;
  }

  return (
    <MapContainer
      mapPoints={mapPoints}
      center={center}
      mapId={mapId}
      selectedPoint={selectedPoint}
      onMarkerClick={handleMarkerClick}
      onCloseInfoWindow={handleCloseInfoWindow}
    />
  );
}
