/**
 * @fileoverview MapContainer component
 * 地図コンテナコンポーネント
 */

import type { MapPoint } from "@/types";
import { InfoWindow, Map } from "@vis.gl/react-google-maps";
import { useCallback } from "react";
import { MapInfoWindow } from "./MapInfoWindow";
import { MapMarker } from "./MapMarker";

interface MapContainerProps {
  readonly mapPoints: readonly MapPoint[];
  readonly center: { lat: number; lng: number };
  readonly mapId: string;
  readonly selectedPoint: MapPoint | null;
  readonly onMarkerClick: (point: MapPoint) => void;
  readonly onCloseInfoWindow: () => void;
}

export function MapContainer({
  mapPoints,
  center,
  mapId,
  selectedPoint,
  onMarkerClick,
  onCloseInfoWindow,
}: MapContainerProps) {
  // エラー防止のためのクリックハンドラーをメモ化
  const handleMarkerClick = useCallback((point: MapPoint) => {
    try {
      onMarkerClick(point);
    } catch (error) {
      console.error("マーカークリック時エラー:", error);
    }
  }, [onMarkerClick]);

  const handleInfoWindowClose = useCallback(() => {
    try {
      onCloseInfoWindow();
    } catch (error) {
      console.error("InfoWindow閉じる時エラー:", error);
    }
  }, [onCloseInfoWindow]);

  return (
    <div className="map-container">
      <Map
        defaultCenter={center}
        defaultZoom={11}
        mapTypeId="terrain" // 🗻 初期表示を地形図（TERRAIN）に設定
        mapId={mapId}
        style={{ width: "100%", height: "100%" }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={true}
        fullscreenControl={true}
        streetViewControl={true}
        zoomControl={true}
        // コントロールの位置を調整してフィルターパネルとの重複を回避
        mapTypeControlOptions={{
          position: window.google?.maps?.ControlPosition?.TOP_RIGHT || 1,
          style: window.google?.maps?.MapTypeControlStyle?.DROPDOWN_MENU || 1 // 🎯 プルダウンメニュー形式に変更
        }}
        zoomControlOptions={{
          position: window.google?.maps?.ControlPosition?.RIGHT_CENTER || 6
        }}
        fullscreenControlOptions={{
          position: window.google?.maps?.ControlPosition?.TOP_RIGHT || 1
        }}
        streetViewControlOptions={{
          position: window.google?.maps?.ControlPosition?.RIGHT_CENTER || 6
        }}
      >
        {/* マーカー表示 */}
        {mapPoints.map((point, index) => (
          <MapMarker
            key={`${point.type}-${point.id}-${index}`}
            point={point}
            onClick={handleMarkerClick}
          />
        ))}

        {/* 選択されたポイントのInfoWindow */}
        {selectedPoint && (
          <InfoWindow
            position={selectedPoint.coordinates}
            onCloseClick={handleInfoWindowClose}
            maxWidth={400}
          >
            <MapInfoWindow point={selectedPoint} />
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
