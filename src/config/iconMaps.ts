/**
 * アイコンマップとヘルパー関数
 * React Fast Refresh対応のため、コンポーネントから分離
 */

import type { CuisineType } from "@/types";
import {
  CafeIcon,
  ChineseIcon,
  DefaultIcon,
  ParkingIcon,
  RamenIcon,
  RestaurantIcon,
  SeafoodIcon,
  SushiIcon,
  ToiletIcon,
  YakinikuIcon,
} from "./svgIcons";

/**
 * 料理ジャンル別アイコンマップ
 * 実際に存在するアイコンのみ使用
 */
export const CUISINE_ICON_MAP: Record<CuisineType, React.ComponentType> = {
  日本料理: RestaurantIcon,
  寿司: SushiIcon,
  ラーメン: RamenIcon,
  海鮮: SeafoodIcon,
  "焼肉・焼鳥": YakinikuIcon,
  "そば・うどん": RestaurantIcon,
  中華: ChineseIcon,
  イタリアン: RestaurantIcon,
  フレンチ: RestaurantIcon,
  "カフェ・喫茶店": CafeIcon,
  "バー・居酒屋": RestaurantIcon,
  ファストフード: RestaurantIcon,
  "デザート・スイーツ": CafeIcon,
  "カレー・エスニック": RestaurantIcon,
  "ステーキ・洋食": YakinikuIcon,
  "弁当・テイクアウト": RestaurantIcon,
  レストラン: RestaurantIcon,
  その他: DefaultIcon,
} as const;

/**
 * 施設タイプ別アイコンマップ
 */
export const FACILITY_ICON_MAP = {
  parking: ParkingIcon,
  toilet: ToiletIcon,
  restaurant: RestaurantIcon,
} as const;

/**
 * アイコンを取得する関数
 */
export const getIconComponent = (
  cuisineType?: string,
  facilityType?: string
) => {
  if (facilityType && facilityType in FACILITY_ICON_MAP) {
    return FACILITY_ICON_MAP[facilityType as keyof typeof FACILITY_ICON_MAP];
  }

  if (cuisineType && cuisineType in CUISINE_ICON_MAP) {
    return CUISINE_ICON_MAP[cuisineType as keyof typeof CUISINE_ICON_MAP];
  }

  return DefaultIcon;
};

/**
 * 施設タイプ型定義
 */
export type FacilityType = keyof typeof FACILITY_ICON_MAP;
