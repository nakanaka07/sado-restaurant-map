/**
 * @fileoverview PinMarker - Simple pin-style marker (Google Maps standard style)
 *
 * UnifiedMarker Strategy実装 #1: シンプルピン版
 *
 * 特徴:
 * - Google Maps標準ピン風デザイン
 * - 軽量・高速レンダリング
 * - @vis.gl/react-google-maps の Pin コンポーネント活用
 *
 * 用途:
 * - 大量マーカー表示時の軽量版
 * - シンプルなUI要求時
 * - パフォーマンス優先時
 */

import type { MapPoint } from "@/types";
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useCallback } from "react";
import type { MarkerStrategyProps } from "../UnifiedMarker";
import { getMarkerColor } from "./utils/markerColorUtils";

// ==============================
// Marker Size Configuration
// ==============================

const PIN_SIZES = {
  small: { scale: 0.8 },
  medium: { scale: 1.0 },
  large: { scale: 1.3 },
} as const;

// ==============================
// PinMarker Component
// ==============================

/**
 * PinMarker - Google Maps標準風シンプルピン
 *
 * @example
 * ```tsx
 * <PinMarker
 *   point={restaurant}
 *   onClick={handleClick}
 *   size="medium"
 * />
 * ```
 */
export function PinMarker({
  point,
  onClick,
  size,
  isSelected,
  ariaLabel,
}: Readonly<MarkerStrategyProps>) {
  // クリックハンドラー
  const handleClick = useCallback(() => {
    onClick(point);
  }, [onClick, point]);

  // サイズ設定
  const sizeConfig = PIN_SIZES[size];

  // カテゴリに応じた色取得
  const pinColor = getMarkerColor(point);

  // アクセシビリティラベル
  const label = ariaLabel ?? getDefaultAriaLabel(point);

  return (
    <AdvancedMarker
      position={{ lat: point.coordinates.lat, lng: point.coordinates.lng }}
      onClick={handleClick}
      title={label}
      zIndex={isSelected ? 1000 : null}
    >
      <Pin
        background={pinColor}
        borderColor={isSelected ? "#FFFFFF" : null}
        glyphColor="#FFFFFF"
        scale={sizeConfig.scale}
      />
    </AdvancedMarker>
  );
}

// ==============================
// Helpers
// ==============================

/**
 * ポイントタイプに応じたデフォルトARIAラベル生成
 */
function getDefaultAriaLabel(point: MapPoint): string {
  if ("cuisineType" in point) {
    return `レストラン: ${point.name}`;
  }
  if ("capacity" in point) {
    return `駐車場: ${point.name}`;
  }
  if ("isAccessible" in point) {
    return `トイレ: ${point.name}`;
  }
  return point.name;
}
