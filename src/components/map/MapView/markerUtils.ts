/**
 * @fileoverview Map marker utilities
 * 地図マーカー関連のユーティリティ関数
 */

import type { MapPoint, Restaurant } from "@/types";

/**
 * ポイントタイプに基づいてマーカーのアイコンを決定
 */
export const getMarkerIcon = (
  point: MapPoint
): { background: string; glyph: string } => {
  switch (point.type) {
    case "restaurant":
      return {
        background: getMarkerColorByCuisine((point as Restaurant).cuisineType),
        glyph: "🍽️",
      };
    case "parking":
      return {
        background: "#4caf50", // グリーン
        glyph: "🅿️",
      };
    case "toilet":
      return {
        background: "#2196f3", // ブルー
        glyph: "🚽",
      };
    default:
      return {
        background: "#9e9e9e", // グレー
        glyph: "📍",
      };
  }
};

/**
 * 料理ジャンルに基づいてマーカーの色を決定（飲食店用）
 */
export const getMarkerColorByCuisine = (cuisineType: string): string => {
  const colorMap: Record<string, string> = {
    日本料理: "#ef4444",
    寿司: "#f97316",
    海鮮: "#06b6d4",
    "焼肉・焼鳥": "#dc2626",
    ラーメン: "#eab308",
    "そば・うどん": "#84cc16",
    中華: "#f59e0b",
    イタリアン: "#10b981",
    フレンチ: "#8b5cf6",
    "カフェ・喫茶店": "#14b8a6",
    "バー・居酒屋": "#f59e0b",
    ファストフード: "#ef4444",
    "デザート・スイーツ": "#ec4899",
    "カレー・エスニック": "#f97316",
    "ステーキ・洋食": "#6366f1",
    "弁当・テイクアウト": "#8b5cf6",
    レストラン: "#06b6d4",
    その他: "#6b7280",
  };

  return colorMap[cuisineType] || "#9e9e9e";
};

/**
 * 価格帯に基づいてマーカーのサイズを決定
 */
export const getMarkerSizeByPrice = (priceRange?: string): number => {
  if (!priceRange) return 35; // デフォルトサイズ

  const sizeMap: Record<string, number> = {
    "～1000円": 30, // 小
    "1000-2000円": 35, // 中
    "2000-3000円": 40, // 大
    "3000円～": 45, // 特大
  };

  return sizeMap[priceRange] || 35;
};

/**
 * マップポイントのサイズを決定
 */
export const getMarkerSize = (point: MapPoint): number => {
  switch (point.type) {
    case "restaurant":
      return getMarkerSizeByPrice((point as Restaurant).priceRange);
    case "parking":
    case "toilet":
      return 32; // 固定サイズ
    default:
      return 35;
  }
};
