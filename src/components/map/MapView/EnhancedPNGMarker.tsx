/**
 * @fileoverview Enhanced PNG Marker Component
 * Phase 1実装 - 既存PNG活用による即座改善
 */

import type { MapPoint } from "@/types";
import { isRestaurant } from "@/types/type-guards";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React from 'react';
import { getMarkerColorByCuisine } from "../utils/markerUtils";

// 既存アセットのインポート
import anoIcon01 from "@/assets/png/ano_icon01.png";
import currentLocationIcon from "@/assets/png/current_location_icon.png";
import parkingIcon from "@/assets/png/parking_icon.png";
import shiIcon01 from "@/assets/png/shi_icon01.png";
import toiletIcon from "@/assets/png/toilette_icon.png";

interface EnhancedPNGMarkerProps {
  readonly point: MapPoint;
  readonly onClick: (point: MapPoint) => void;
}

/**
 * 改良されたPNGマーカー
 * 既存アセットを活用した即座改善実装
 */
export function EnhancedPNGMarker({ point, onClick }: EnhancedPNGMarkerProps) {
  // 色とアイコンの設定
  const config = getEnhancedPNGConfig(point);

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
      <button
        type="button"
        style={{
          width: "48px",  // 35px → 48px (37%拡大)
          height: "48px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
          border: "4px solid white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "transform 0.2s ease",
          position: "relative",
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
        onClick={handleClick}
        aria-label={`${point.name}の詳細を表示`}
      >
        <img
          src={config.iconUrl}
          alt={point.name}
          style={{
            width: "32px",
            height: "32px",
            objectFit: "contain",
            filter: "brightness(0) invert(1)", // 白色化
          }}
        />

        {/* 評価バッジ（レストランの場合） */}
        {isRestaurant(point) && point.rating && (
          <div
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#ff6b6b",
              color: "white",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              fontSize: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              border: "2px solid white",
            }}
          >
            ★
          </div>
        )}
      </button>
    </AdvancedMarker>
  );
}

/**
 * 改良されたPNGマーカーの設定を取得
 */
function getEnhancedPNGConfig(point: MapPoint) {
  let primaryColor: string;
  let secondaryColor: string;
  let iconUrl: string;

  switch (point.type) {
    case "restaurant": {
      const cuisineType = isRestaurant(point) ? point.cuisineType : "その他";
      primaryColor = getMarkerColorByCuisine(cuisineType);
      secondaryColor = adjustColorBrightness(primaryColor, -20);

      // 地区別アイコン
      if (point.district === "両津" || point.district === "相川") {
        iconUrl = anoIcon01;
      } else if (["佐和田", "新穂", "畑野", "真野"].includes(point.district)) {
        iconUrl = shiIcon01;
      } else {
        iconUrl = currentLocationIcon;
      }
      break;
    }
    case "parking":
      primaryColor = "#4caf50";
      secondaryColor = adjustColorBrightness(primaryColor, -20);
      iconUrl = parkingIcon;
      break;
    case "toilet":
      primaryColor = "#2196f3";
      secondaryColor = adjustColorBrightness(primaryColor, -20);
      iconUrl = toiletIcon;
      break;
    default:
      primaryColor = "#9e9e9e";
      secondaryColor = adjustColorBrightness(primaryColor, -20);
      iconUrl = currentLocationIcon;
  }

  return {
    primaryColor,
    secondaryColor,
    iconUrl,
  };
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
