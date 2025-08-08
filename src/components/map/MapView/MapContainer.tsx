/**
 * @fileoverview MapContainer component
 * 地図コンテナコンポーネント
 */

import { Map, InfoWindow } from "@vis.gl/react-google-maps";
import type { MapPoint } from "@/types";
import { MapMarker } from "./MapMarker";
import { MapInfoWindow } from "./MapInfoWindow";

interface MapContainerProps {
  mapPoints: readonly MapPoint[];
  center: { lat: number; lng: number };
  mapId: string;
  selectedPoint: MapPoint | null;
  onMarkerClick: (point: MapPoint) => void;
  onCloseInfoWindow: () => void;
}

export function MapContainer({
  mapPoints,
  center,
  mapId,
  selectedPoint,
  onMarkerClick,
  onCloseInfoWindow,
}: MapContainerProps) {
  return (
    <div
      className="map-container"
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: "1px solid #e0e0e0",
      }}
    >
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
        {/* マーカー表示 */}
        {mapPoints.map((point, index) => (
          <MapMarker
            key={`${point.type}-${point.id}-${index}`}
            point={point}
            index={index}
            onClick={onMarkerClick}
          />
        ))}

        {/* 選択されたポイントのInfoWindow */}
        {selectedPoint && (
          <InfoWindow
            position={selectedPoint.coordinates}
            onCloseClick={onCloseInfoWindow}
            maxWidth={400}
          >
            <MapInfoWindow point={selectedPoint} />
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
