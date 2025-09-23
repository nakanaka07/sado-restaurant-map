import type { IcooonMarkerCategory } from "../../../types/icooonMarker.types";

export const CIRCULAR_MARKER_COLORS: Record<IcooonMarkerCategory, string> = {
  japanese: "#E53E3E",
  noodles: "#FF8C00",
  yakiniku: "#D53F8C",
  international: "#38A169",
  cafe: "#FEB002",
  izakaya: "#DC143C",
  fastfood: "#FF6B35",
  general: "#00A693",
  parking: "#546E7A",
  toilet: "#2196F3",
};

export const MARKER_SIZES = {
  small: { width: 32, height: 32, iconSize: 16 },
  medium: { width: 40, height: 40, iconSize: 20 },
  large: { width: 48, height: 48, iconSize: 24 },
  xlarge: { width: 64, height: 64, iconSize: 32 },
} as const;

export type MarkerSize = keyof typeof MARKER_SIZES;

export type MarkerAnimation = "none" | "attention" | "subtle" | "loading";

export const ICON_PATH_MAP: Record<IcooonMarkerCategory, string> = {
  japanese: getIconPath("ochawan-hashi.svg"),
  noodles: getIconPath("ramen-icon.svg"),
  yakiniku: getIconPath("steak-icon2.svg"),
  international: getIconPath("earth-icon12.svg"),
  cafe: getIconPath("tea-icon.svg"),
  izakaya: getIconPath("wine-bottle.svg"),
  fastfood: getIconPath("hamburger-icon7.svg"),
  general: getIconPath("fork-knife.svg"),
  parking: getIconPath("parking-icon.svg"),
  toilet: getIconPath("toilet-pictogram.svg"),
};

export const ARIA_LABEL_MAP: Record<IcooonMarkerCategory, string> = {
  japanese: "和食レストラン",
  noodles: "麺類レストラン",
  yakiniku: "焼肉・グリルレストラン",
  international: "多国籍料理レストラン",
  cafe: "カフェ・軽食店",
  izakaya: "居酒屋・バー",
  fastfood: "ファストフード店",
  general: "一般レストラン",
  parking: "駐車場",
  toilet: "トイレ",
};

function getIconPath(fileName: string): string {
  const baseUrl = import.meta.env.PROD ? "/sado-restaurant-map" : "";
  return `${baseUrl}/icons/${fileName}`;
}
