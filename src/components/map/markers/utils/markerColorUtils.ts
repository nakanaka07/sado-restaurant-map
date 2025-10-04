/**
 * @fileoverview Marker color utility functions
 *
 * マーカーのカテゴリ別色管理ユーティリティ
 * UnifiedMarker全Strategy実装で共通使用
 */

import type { MapPoint } from "@/types";
import type { IcooonMarkerCategory } from "@/types/icooonMarker.types";
import { CIRCULAR_MARKER_COLORS } from "../constants";

/**
 * 料理タイプキーワードとカテゴリのマッピング
 */
const CUISINE_KEYWORD_MAP: ReadonlyArray<
  readonly [keywords: readonly string[], category: IcooonMarkerCategory]
> = [
  [["japanese", "和食"], "japanese"],
  [["noodle", "麺"], "noodles"],
  [["yakiniku", "焼肉"], "yakiniku"],
  [["cafe", "カフェ"], "cafe"],
  [["izakaya", "居酒屋"], "izakaya"],
  [["fast", "ファスト"], "fastfood"],
  [["international", "多国籍"], "international"],
] as const;

/**
 * 料理タイプからカテゴリを判定
 */
function getCuisineCategory(
  cuisineType: string | undefined
): IcooonMarkerCategory {
  if (!cuisineType) return "general";

  const cuisine = cuisineType.toLowerCase();

  for (const [keywords, category] of CUISINE_KEYWORD_MAP) {
    if (keywords.some(keyword => cuisine.includes(keyword))) {
      return category;
    }
  }

  return "general";
}

/**
 * MapPointからカテゴリ色を取得
 *
 * @param point - マップポイント
 * @returns カテゴリに対応するHEX色コード
 */
export function getMarkerColor(point: MapPoint): string {
  // Parking
  if ("capacity" in point) {
    return CIRCULAR_MARKER_COLORS.parking;
  }

  // Toilet
  if ("isAccessible" in point) {
    return CIRCULAR_MARKER_COLORS.toilet;
  }

  // Restaurant
  if ("cuisineType" in point) {
    const category = getCuisineCategory(point.cuisineType);
    return CIRCULAR_MARKER_COLORS[category];
  }

  // Fallback
  return CIRCULAR_MARKER_COLORS.general;
}
