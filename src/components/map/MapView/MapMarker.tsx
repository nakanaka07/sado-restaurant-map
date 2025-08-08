/**
 * @fileoverview MapMarker component
 * 地図マーカーコンポーネント
 */

import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import type { MapPoint } from "@/types";
import { getMarkerIcon, getMarkerSize } from "../utils";

interface MapMarkerProps {
  point: MapPoint;
  index: number;
  onClick: (point: MapPoint) => void;
}

export function MapMarker({ point, index, onClick }: MapMarkerProps) {
  const { background, glyph } = getMarkerIcon(point);
  const size = getMarkerSize(point);

  return (
    <AdvancedMarker
      key={`${point.type}-${point.id}-${index}`}
      position={point.coordinates}
      title={point.name}
      onClick={() => onClick(point)}
    >
      <Pin
        background={background}
        borderColor="#fff"
        glyphColor="white"
        scale={size / 35} // 基準サイズ35に対する倍率
      >
        {glyph}
      </Pin>
    </AdvancedMarker>
  );
}
