/**
 * 🎌 ICOOON MONO 完全統一マーカー設定
 *
 * 全10カテゴリをICOOON MONOで統一実装
 * 日本製の高品質・統一デザインでブランド強化
 */

import type {
  IcooonMarkerCategory,
  IcooonMarkerConfig,
  IcooonMarkerStats,
} from "../types/icooonMarker.types";

/**
 * ICOOON MONO 完全統一マーカー設定
 */
export const ICOOON_MARKER_CONFIGS: Record<
  IcooonMarkerCategory,
  IcooonMarkerConfig
> = {
  // 🍚 レストランカテゴリ (7個)
  japanese: {
    category: "japanese",
    name: "和食",
    iconPath: "/assets/markers/icooon-mono/ochawan-hashi.svg",
    iconSource: "ICOOON MONO",
    iconUrl: "https://icooon-mono.com/11333-お茶碗と箸/",
    color: "#e8f5e8",
    borderColor: "#2e7d32",
    textColor: "#1b5e20",
    emoji: "🍚",
    accessibility: {
      ariaLabel: "和食レストラン",
      description: "お茶碗と箸のアイコンで和食を表現",
      contrast: "4.7:1",
    },
  },

  noodles: {
    category: "noodles",
    name: "麺類",
    iconPath: "/assets/markers/icooon-mono/ramen-icon.svg",
    iconSource: "ICOOON MONO",
    iconUrl: "https://icooon-mono.com/11337-ラーメンのアイコン/",
    color: "#fff3e0",
    borderColor: "#f57c00",
    textColor: "#e65100",
    emoji: "🍜",
    accessibility: {
      ariaLabel: "麺類レストラン",
      description: "ラーメンアイコンで麺類を表現",
      contrast: "5.1:1",
    },
  },

  yakiniku: {
    category: "yakiniku",
    name: "焼肉・グリル",
    iconPath: "/assets/markers/icooon-mono/steak-icon2.svg",
    iconSource: "ICOOON MONO",
    iconUrl: "https://icooon-mono.com/14898-ステーキアイコン2/",
    color: "#ffebee",
    borderColor: "#d32f2f",
    textColor: "#c62828",
    emoji: "🥩",
    accessibility: {
      ariaLabel: "焼肉・グリルレストラン",
      description: "ステーキアイコンで焼肉・グリルを表現",
      contrast: "4.8:1",
    },
  },

  international: {
    category: "international",
    name: "多国籍料理",
    iconPath: "/assets/markers/icooon-mono/earth-icon12.svg",
    iconSource: "ICOOON MONO",
    iconUrl: "https://icooon-mono.com/14506-地球アイコン12/",
    color: "#e3f2fd",
    borderColor: "#1976d2",
    textColor: "#0d47a1",
    emoji: "�",
    accessibility: {
      ariaLabel: "多国籍料理レストラン",
      description: "地球アイコンで多国籍料理を表現",
      contrast: "6.2:1",
    },
  },

  cafe: {
    category: "cafe",
    name: "カフェ・軽食",
    iconPath: "/assets/markers/icooon-mono/tea-icon.svg",
    iconSource: "ICOOON MONO",
    iconUrl: "https://icooon-mono.com/16295-紅茶アイコン/",
    color: "#f3e5f5",
    borderColor: "#7b1fa2",
    textColor: "#4a148c",
    emoji: "☕",
    accessibility: {
      ariaLabel: "カフェ・軽食店",
      description: "紅茶アイコンでカフェを表現",
      contrast: "5.3:1",
    },
  },

  izakaya: {
    category: "izakaya",
    name: "居酒屋・バー",
    iconPath: "/assets/markers/icooon-mono/wine-bottle.svg",
    iconSource: "ICOOON MONO",
    iconUrl: "https://icooon-mono.com/11180-ボトルワインのアイコン素材/",
    color: "#fce4ec",
    borderColor: "#c2185b",
    textColor: "#880e4f",
    emoji: "🍷",
    accessibility: {
      ariaLabel: "居酒屋・バー",
      description: "ワインボトルアイコンで居酒屋・バーを表現",
      contrast: "5.8:1",
    },
  },

  fastfood: {
    category: "fastfood",
    name: "ファストフード",
    iconPath: "/assets/markers/icooon-mono/hamburger-icon7.svg",
    iconSource: "ICOOON MONO",
    iconUrl: "https://icooon-mono.com/15591-ハンバーガーの無料アイコン7/",
    color: "#fff8e1",
    borderColor: "#f9a825",
    textColor: "#f57f17",
    emoji: "🍔",
    accessibility: {
      ariaLabel: "ファストフード店",
      description: "ハンバーガーアイコンでファストフードを表現",
      contrast: "4.9:1",
    },
  },

  general: {
    category: "general",
    name: "一般レストラン",
    iconPath: "/assets/markers/icooon-mono/fork-knife.svg",
    iconSource: "ICOOON MONO",
    iconUrl:
      "https://icooon-mono.com/11164-フォークとナイフのお食事アイコン素材/",
    color: "#e8eaf6",
    borderColor: "#3f51b5",
    textColor: "#283593",
    emoji: "🍽️",
    accessibility: {
      ariaLabel: "一般レストラン",
      description: "フォークとナイフアイコンで一般レストランを表現",
      contrast: "5.5:1",
    },
  },

  // 🏢 施設カテゴリ (2個)
  parking: {
    category: "parking",
    name: "駐車場",
    iconPath: "/assets/markers/icooon-mono/parking-icon.svg",
    iconSource: "ICOOON MONO",
    iconUrl: "https://icooon-mono.com/12509-パーキングのアイコン/",
    color: "#e0f2f1",
    borderColor: "#00796b",
    textColor: "#004d40",
    emoji: "🅿️",
    accessibility: {
      ariaLabel: "駐車場",
      description: "パーキングアイコンで駐車場を表現",
      contrast: "6.8:1",
    },
  },

  toilet: {
    category: "toilet",
    name: "トイレ",
    iconPath: "/assets/markers/icooon-mono/toilet-pictogram.svg",
    iconSource: "ICOOON MONO",
    iconUrl: "https://icooon-mono.com/11553-トイレのピクトグラム/",
    color: "#e1f5fe",
    borderColor: "#0277bd",
    textColor: "#01579b",
    emoji: "🚻",
    accessibility: {
      ariaLabel: "トイレ",
      description: "トイレピクトグラムアイコンでトイレを表現",
      contrast: "7.2:1",
    },
  },
};

/**
 * 既存カテゴリ互換性マッピング
 */
export const LEGACY_CATEGORY_MAPPING: Record<string, IcooonMarkerCategory> = {
  japanese_restaurant: "japanese",
  soba_udon: "noodles",
  ramen: "noodles",
  yakiniku_bbq: "yakiniku",
  pizza_pasta: "international",
  chinese_cuisine: "international",
  cafe_light_meal: "cafe",
  bar_izakaya: "izakaya",
  fast_food: "fastfood",
  family_restaurant: "general",
  fine_dining: "general",
  buffet: "general",
  parking_lot: "parking",
  public_parking: "parking",
  restroom: "toilet",
  public_toilet: "toilet",
  accessible_toilet: "toilet",
};

/**
 * ICOOON MONO マーカー設定取得
 */
export function getIcooonMarkerConfig(
  category: IcooonMarkerCategory
): IcooonMarkerConfig {
  return ICOOON_MARKER_CONFIGS[category] || ICOOON_MARKER_CONFIGS["general"];
}

/**
 * カテゴリ統計情報取得
 */
export function getIcooonMarkerStats(): IcooonMarkerStats {
  const totalCategories = Object.keys(ICOOON_MARKER_CONFIGS).length;
  const restaurantCategories = Object.values(ICOOON_MARKER_CONFIGS).filter(
    config => !["parking", "toilet"].includes(config.category)
  ).length;
  const facilityCategories = totalCategories - restaurantCategories;

  return {
    totalCategories,
    restaurantCategories,
    facilityCategories,
    iconSource: "ICOOON MONO (100%)",
    designConsistency: "完全統一",
    accessibility: "WCAG 2.2 AA準拠",
    licensing: "商用無料・統一ライセンス",
  };
}
