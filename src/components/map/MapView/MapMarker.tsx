/**
 * @fileoverview MapMarker component
 * 地図マーカーコンポーネント
 */

import type { MapPoint } from "@/types";
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useCallback } from "react";
import { getMarkerIcon, getMarkerSize } from "../utils";

interface MapMarkerProps {
  readonly point: MapPoint;
  readonly onClick: (point: MapPoint) => void;
}

export function MapMarker({ point, onClick }: MapMarkerProps) {
  const { background, glyph } = getMarkerIcon(point);
  const size = getMarkerSize(point);

  // クリックハンドラーをメモ化してパフォーマンス最適化
  const handleClick = useCallback(() => {
    onClick(point);
  }, [onClick, point]);

  return (
    <AdvancedMarker
      position={point.coordinates}
      title={point.name}
      onClick={handleClick}
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
