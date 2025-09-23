/**
 * @fileoverview MapView with Marker Testing Mode
 * マーカーテストモード付きMapView
 */

import type { MapPoint } from "@/types";
import { trackMapInteraction, trackRestaurantClick } from "@/utils/analytics";
import { useCallback, useState } from "react";
import { EnhancedMapContainer } from "./EnhancedMapContainer";
import { MapContainer } from "./MapContainer";
import { MapErrorBoundary } from "./MapErrorBoundary";
import { MapErrorFallback } from "./MapErrorFallback";

interface MapViewWithTestingProps {
  readonly mapPoints: readonly MapPoint[];
  readonly center: { lat: number; lng: number };
  readonly loading: boolean;
  readonly error?: string | null;
  readonly testingMode?: boolean; // テストモードのフラグ
}

export function MapViewWithTesting({
  mapPoints,
  center,
  loading,
  error,
  testingMode = false,
}: MapViewWithTestingProps) {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // マーカークリックハンドラー
  const handleMarkerClick = useCallback((point: MapPoint) => {
    setSelectedPoint(point);

    // 飲食店の場合はクリック分析を追跡
    if (point.type === "restaurant" && "cuisineType" in point) {
      trackRestaurantClick({
        id: point.id,
        name: point.name,
        category: point.cuisineType,
        priceRange: point.priceRange || "不明",
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
      <div className="map-loading">
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
    <MapErrorBoundary>
      {testingMode ? (
        // テストモード: マーカータイプ選択機能付き
        <EnhancedMapContainer
          mapPoints={mapPoints}
          center={center}
          mapId={mapId}
          selectedPoint={selectedPoint}
          onMarkerClick={handleMarkerClick}
          onCloseInfoWindow={handleCloseInfoWindow}
        />
      ) : (
        // 通常モード: 従来のMapContainer
        <MapContainer
          mapPoints={mapPoints}
          center={center}
          mapId={mapId}
          selectedPoint={selectedPoint}
          onMarkerClick={handleMarkerClick}
          onCloseInfoWindow={handleCloseInfoWindow}
        />
      )}
    </MapErrorBoundary>
  );
}
