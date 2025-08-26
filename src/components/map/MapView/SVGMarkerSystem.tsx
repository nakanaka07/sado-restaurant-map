/**
 * @fileoverview SVG Marker System Component
 * SVGマーカーシステム - Phase 2実装
 */

import { getIconComponent } from "@/config/svgIcons";
import type { MapPoint } from "@/types";
import { isRestaurant } from "@/types/type-guards";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React from 'react';
import { getMarkerColorByCuisine } from "../utils/markerUtils";

interface SVGMarkerSystemProps {
  readonly point: MapPoint;
  readonly onClick: (point: MapPoint) => void;
}

/**
 * SVGマーカーシステム
 * スケーラブルなSVGマーカーコンポーネント
 */
export function SVGMarkerSystem({ point, onClick }: SVGMarkerSystemProps) {
  // 料理ジャンル別の色を取得
  const primaryColor = isRestaurant(point)
    ? getMarkerColorByCuisine(point.cuisineType)
    : getFacilityColor(point.type);
  const secondaryColor = adjustColorBrightness(primaryColor, -20);

  // サイズ設定
  const markerSize = getMarkerSize(point);
  const iconSize = Math.round(markerSize * 0.6);

  // アイコンコンポーネントを取得
  const IconComponent = getIconComponent(
    isRestaurant(point) ? point.cuisineType : undefined,
    point.type
  );

  // クリックハンドラー
  const handleClick = React.useCallback(() => {
    onClick(point);
  }, [onClick, point]);

  return (
    <AdvancedMarker
      position={point.coordinates}
      title={point.name}
      onClick={handleClick}
    >
      <div
        style={{
          width: `${markerSize}px`,
          height: `${markerSize}px`,
          position: "relative",
          cursor: "pointer",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* SVGマーカー本体 */}
        <svg
          width={markerSize}
          height={Math.round(markerSize * 1.2)}
          viewBox={`0 0 ${markerSize} ${Math.round(markerSize * 1.2)}`}
          style={{
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
          }}
        >
          <defs>
            {/* グラデーション定義 */}
            <linearGradient id={`gradient-${point.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>

            {/* 外側のグロー効果 */}
            <filter id={`glow-${point.id}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* メインピン形状 */}
          <path
            d={getMarkerPath(markerSize)}
            fill={`url(#gradient-${point.id})`}
            stroke="white"
            strokeWidth="2"
            filter={`url(#glow-${point.id})`}
          />
        </svg>

        {/* アイコン表示 */}
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent
            width={iconSize}
            height={iconSize}
            fill="white"
          />
        </div>

        {/* 評価表示（レストランの場合） */}
        {point.type === "restaurant" && point.rating && (
          <div
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              background: "#ff6b6b",
              color: "white",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              fontSize: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              border: "2px solid white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            ★
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
}

/**
 * 施設タイプ別の色を取得
 */
function getFacilityColor(type: string): string {
  switch (type) {
    case "parking":
      return "#4caf50"; // グリーン
    case "toilet":
      return "#2196f3"; // ブルー
    default:
      return "#9e9e9e"; // グレー
  }
}

/**
 * マーカーサイズを決定
 */
function getMarkerSize(point: MapPoint): number {
  switch (point.type) {
    case "restaurant": {
      // 価格帯に基づくサイズ調整
      const priceRange = isRestaurant(point) ? point.priceRange : undefined;
      if (priceRange === "～1000円") return 48;
      if (priceRange === "1000-2000円") return 52;
      if (priceRange === "2000-3000円") return 56;
      if (priceRange === "3000円～") return 60;
      return 52; // デフォルト
    }
    case "parking":
    case "toilet":
      return 44; // 固定サイズ
    default:
      return 48;
  }
}

/**
 * マーカーのSVGパスを生成
 */
function getMarkerPath(size: number): string {
  const centerX = size / 2;
  const centerY = size * 0.4;
  const radius = size * 0.35;
  const tipY = size * 0.95;

  return `
    M ${centerX} ${centerY - radius}
    A ${radius} ${radius} 0 1 1 ${centerX} ${centerY + radius}
    L ${centerX} ${tipY}
    Z
  `;
}

/**
 * 色の明度を調整
 */
function adjustColorBrightness(hex: string, percent: number): string {
  // #を除去
  const cleanHex = hex.replace('#', '');

  // RGBに変換
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // 明度を調整
  const factor = 1 + percent / 100;
  const newR = Math.max(0, Math.min(255, Math.round(r * factor)));
  const newG = Math.max(0, Math.min(255, Math.round(g * factor)));
  const newB = Math.max(0, Math.min(255, Math.round(b * factor)));

  // 16進数に戻す
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
