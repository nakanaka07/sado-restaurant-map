/**
 * @fileoverview Cuisine icons configuration
 * 料理ジャンル別アイコン設定
 */

import type { CuisineType } from "@/types";

// PNG料理ジャンルアイコンのインポート
import barIcon from "@/assets/png/bar_icon.png";
import bentoIcon from "@/assets/png/bento_icon.png";
import cafeIcon from "@/assets/png/cafe_icon.png";
import chineseIcon from "@/assets/png/chinese_icon.png";
import curryIcon from "@/assets/png/curry_icon.png";
import dessertIcon from "@/assets/png/dessert_icon.png";
import fastfoodIcon from "@/assets/png/fastfood_icon.png";
import frenchIcon from "@/assets/png/french_icon.png";
import italianIcon from "@/assets/png/italian_icon.png";
import japaneseIcon from "@/assets/png/japanese_icon.png";
import otherIcon from "@/assets/png/other_icon.png";
import ramenIcon from "@/assets/png/ramen_icon.png";
import restaurantIcon from "@/assets/png/restaurant_icon.png";
import seafoodIcon from "@/assets/png/seafood_icon.png";
import sobaIcon from "@/assets/png/soba_icon.png";
import steakIcon from "@/assets/png/steak_icon.png";
import sushiIcon from "@/assets/png/sushi_icon.png";
import yakinikuIcon from "@/assets/png/yakiniku_icon.png";

/**
 * 料理ジャンル別アイコンマップ（型安全）
 */
export const CUISINE_ICONS: Readonly<Record<CuisineType, string>> = {
  日本料理: japaneseIcon,
  寿司: sushiIcon,
  海鮮: seafoodIcon,
  "焼肉・焼鳥": yakinikuIcon,
  ラーメン: ramenIcon,
  "そば・うどん": sobaIcon,
  中華: chineseIcon,
  イタリアン: italianIcon,
  フレンチ: frenchIcon,
  "カフェ・喫茶店": cafeIcon,
  "バー・居酒屋": barIcon,
  ファストフード: fastfoodIcon,
  "デザート・スイーツ": dessertIcon,
  "カレー・エスニック": curryIcon,
  "ステーキ・洋食": steakIcon,
  "弁当・テイクアウト": bentoIcon,
  レストラン: restaurantIcon,
  その他: otherIcon,
} as const;

/**
 * 料理ジャンルに対応するアイコンURLを取得
 * @param cuisineType - 料理ジャンル
 * @returns アイコンのURL
 */
export const getCuisineIconUrl = (cuisineType: CuisineType): string => {
  return CUISINE_ICONS[cuisineType] || CUISINE_ICONS["その他"];
};

/**
 * アイコンの存在確認
 * @param cuisineType - 料理ジャンル
 * @returns アイコンが存在するかどうか
 */
export const hasCuisineIcon = (cuisineType: CuisineType): boolean => {
  return cuisineType in CUISINE_ICONS;
};
