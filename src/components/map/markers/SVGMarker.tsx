/**
 * @fileoverview SVGMarker - Scalable vector-based marker
 *
 * UnifiedMarker Strategy実装 #3: スケーラブルSVG版
 *
 * 特徴:
 * - 完全SVG描画（画像依存なし）
 * - 無限スケーラブル（retina/4K対応）
 * - カスタマイズ可能なパス・グラデーション
 * - 動的テーマ切替対応
 *
 * 用途:
 * - 高解像度ディスプレイ対応
 * - ダイナミックスタイリング
 * - 将来のデザインシステム拡張
 */

import type { MapPoint } from "@/types";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useCallback } from "react";
import type { MarkerStrategyProps } from "../UnifiedMarker";
import { getMarkerColor } from "./utils/markerColorUtils";

// ==============================
// Marker Size Configuration
// ==============================

const SVG_SIZES = {
  small: { width: 32, height: 40 },
  medium: { width: 40, height: 50 },
  large: { width: 48, height: 60 },
} as const;

// ==============================
// SVGMarker Component
// ==============================

/**
 * SVGMarker - 完全スケーラブルSVGマーカー
 *
 * @example
 * ```tsx
 * <SVGMarker
 *   point={restaurant}
 *   onClick={handleClick}
 *   size="medium"
 * />
 * ```
 */
export function SVGMarker({
  point,
  onClick,
  size,
  isSelected,
  isHovered,
  ariaLabel,
}: Readonly<MarkerStrategyProps>) {
  // クリックハンドラー
  const handleClick = useCallback(() => {
    onClick(point);
  }, [onClick, point]);

  // サイズ設定
  const sizeConfig = SVG_SIZES[size];

  // カテゴリに応じた色取得
  const markerColor = getMarkerColor(point);

  // アクセシビリティラベル
  const label = ariaLabel ?? getDefaultAriaLabel(point);

  // フィルター・トランスフォーム値（ネストされた三項演算子を抽出）
  let filterValue: string;
  let transformValue: string;

  if (isSelected) {
    filterValue = "drop-shadow(0 4px 12px rgba(0,0,0,0.4))";
    transformValue = "scale(1.15)";
  } else if (isHovered) {
    filterValue = "drop-shadow(0 2px 8px rgba(0,0,0,0.3))";
    transformValue = "scale(1.05)";
  } else {
    filterValue = "drop-shadow(0 1px 4px rgba(0,0,0,0.2))";
    transformValue = "scale(1)";
  }

  // SVG描画スタイル
  const svgStyle: React.CSSProperties = {
    cursor: "pointer",
    filter: filterValue,
    transition: "filter 0.2s ease",
    transform: transformValue,
    transformOrigin: "bottom center",
  };

  return (
    <AdvancedMarker
      position={{ lat: point.coordinates.lat, lng: point.coordinates.lng }}
      onClick={handleClick}
      title={label}
      zIndex={isSelected ? 1000 : null}
    >
      <svg
        width={sizeConfig.width}
        height={sizeConfig.height}
        viewBox="0 0 40 50"
        style={svgStyle}
        role="img"
        aria-label={label}
      >
        <defs>
          {/* グラデーション定義 */}
          <linearGradient
            id={`gradient-${point.id}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={markerColor} stopOpacity={1} />
            <stop offset="100%" stopColor={markerColor} stopOpacity={0.85} />
          </linearGradient>
          {/* 選択時のグロー効果 */}
          {isSelected && (
            <filter id={`glow-${point.id}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* ピン本体（Google Maps風） */}
        <path
          d="M20 0C10.059 0 2 8.059 2 18c0 5.659 2.659 10.647 6.777 13.885L20 50l11.223-18.115C35.341 28.647 38 23.659 38 18c0-9.941-8.059-18-18-18z"
          fill={`url(#gradient-${point.id})`}
          stroke="#FFFFFF"
          strokeWidth="2"
          filter={isSelected ? `url(#glow-${point.id})` : undefined}
        />

        {/* 中央ドット */}
        <circle cx="20" cy="18" r="6" fill="#FFFFFF" opacity={0.95} />

        {/* カテゴリインジケーター（オプション） */}
        {isSelected && (
          <circle cx="20" cy="18" r="3" fill={markerColor} opacity={0.9} />
        )}
      </svg>
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
