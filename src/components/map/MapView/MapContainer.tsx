/**
 * @fileoverview MapContainer component
 * 地図コンテナコンポーネント
 */

import { DEFAULT_MAP_TYPE } from "@/config";
import type { MapPoint } from "@/types";
import { InfoWindow, Map } from "@vis.gl/react-google-maps";
import { ReactNode, useCallback } from "react";
import { UnifiedMarker } from "../UnifiedMarker";
import { MapInfoWindow } from "./MapInfoWindow";

interface MapContainerProps {
  readonly mapPoints: readonly MapPoint[];
  readonly center: { lat: number; lng: number };
  readonly mapId: string;
  readonly selectedPoint: MapPoint | null;
  readonly onMarkerClick: (point: MapPoint) => void;
  readonly onCloseInfoWindow: () => void;
  readonly customControls?: ReactNode; // CustomMapControlsを受け取るプロパティ
}

export function MapContainer({
  mapPoints,
  center,
  mapId,
  selectedPoint,
  onMarkerClick,
  onCloseInfoWindow,
  customControls,
}: MapContainerProps) {
  // エラー防止のためのクリックハンドラーをメモ化
  const handleMarkerClick = useCallback(
    (point: MapPoint) => {
      try {
        onMarkerClick(point);
      } catch (error) {
        console.error("マーカークリック時エラー:", error);
      }
    },
    [onMarkerClick]
  );

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
        mapTypeId={DEFAULT_MAP_TYPE} // 🗻 設定ファイルから読み込み
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
          position: window.google?.maps?.ControlPosition?.TOP_RIGHT ?? 1,
          style: window.google?.maps?.MapTypeControlStyle?.DROPDOWN_MENU ?? 1, // 🎯 プルダウンメニュー形式に変更
        }}
        zoomControlOptions={{
          position: window.google?.maps?.ControlPosition?.RIGHT_CENTER ?? 6,
        }}
        fullscreenControlOptions={{
          position: window.google?.maps?.ControlPosition?.TOP_RIGHT ?? 1,
        }}
        streetViewControlOptions={{
          position: window.google?.maps?.ControlPosition?.RIGHT_CENTER ?? 6,
        }}
      >
        {/* マーカー表示 */}
        {mapPoints.map((point, index) => (
          <UnifiedMarker
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

        {/* カスタムコントロール（フィルターボタンなど）*/}
        {customControls}
      </Map>
    </div>
  );
}
