/**
 * @fileoverview Unified map marker utilities
 * 統合されたマップマーカーユーティリティ関数
 */

import type { MapPoint, Restaurant } from "@/types";

/**
 * マーカー設定の型定義
 */
export interface MarkerConfig {
  readonly background: string;
  readonly glyph: string;
  readonly size: number;
  readonly scale: number;
}

/**
 * 料理ジャンル別カラーマップ（型安全）
 */
const CUISINE_COLOR_MAP: Readonly<Record<string, string>> = {
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
} as const;

/**
 * 価格帯別サイズマップ（型安全）
 */
const PRICE_SIZE_MAP: Readonly<Record<string, number>> = {
  "～1000円": 30, // 小
  "1000-2000円": 35, // 中
  "2000-3000円": 40, // 大
  "3000円～": 45, // 特大
} as const;

/**
 * 料理ジャンルに基づいてマーカーの色を決定（飲食店用）
 * @param cuisineType - 料理ジャンル
 * @returns CSS カラーコード
 */
export const getMarkerColorByCuisine = (cuisineType: string): string => {
  return CUISINE_COLOR_MAP[cuisineType] || "#9e9e9e";
};

/**
 * 価格帯に基づいてマーカーのサイズを決定
 * @param priceRange - 価格帯
 * @returns マーカーサイズ（ピクセル）
 */
export const getMarkerSizeByPrice = (priceRange?: string): number => {
  if (!priceRange) return 35; // デフォルトサイズ
  return PRICE_SIZE_MAP[priceRange] || 35;
};

/**
 * マーカーアイコン設定の型定義
 */
export interface MarkerIcon {
  readonly background: string;
  readonly glyph: string;
}

/**
 * ポイントタイプに基づいてマーカーのアイコンを決定
 * @param point - マップポイント
 * @returns マーカーアイコン設定
 */
export const getMarkerIcon = (point: MapPoint): MarkerIcon => {
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
 * マップポイントのサイズを決定
 * @param point - マップポイント
 * @returns マーカーサイズ（ピクセル）
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

/**
 * 統合されたマーカー設定を取得
 * @param point - マップポイント
 * @returns 完全なマーカー設定
 */
export const getMarkerConfig = (point: MapPoint): MarkerConfig => {
  const icon = getMarkerIcon(point);
  const size = getMarkerSize(point);

  return {
    ...icon,
    size,
    scale: size / 35, // 基準サイズからのスケール比
  };
};
