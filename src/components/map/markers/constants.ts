import type { IcooonMarkerCategory } from "../../../types/icooonMarker.types";

// Note: Reference SVGs from public/icons/ directory.
// Use import.meta.env.BASE_URL to ensure correct path in both dev and production
// In dev: /icons/*.svg, in production: /sado-restaurant-map/icons/*.svg
const BASE_URL = import.meta.env.BASE_URL;
const iconInternational = `${BASE_URL}icons/earth-icon12.svg`;
const iconGeneral = `${BASE_URL}icons/fork-knife.svg`;
const iconFastfood = `${BASE_URL}icons/hamburger-icon7.svg`;
const iconJapanese = `${BASE_URL}icons/ochawan-hashi.svg`;
const iconParking = `${BASE_URL}icons/parking-icon.svg`;
const iconNoodles = `${BASE_URL}icons/ramen-icon.svg`;
const iconYakiniku = `${BASE_URL}icons/steak-icon2.svg`;
const iconCafe = `${BASE_URL}icons/tea-icon.svg`;
const iconToilet = `${BASE_URL}icons/toilet-pictogram.svg`;
const iconIzakaya = `${BASE_URL}icons/wine-bottle.svg`;

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
  japanese: iconJapanese,
  noodles: iconNoodles,
  yakiniku: iconYakiniku,
  international: iconInternational,
  cafe: iconCafe,
  izakaya: iconIzakaya,
  fastfood: iconFastfood,
  general: iconGeneral,
  parking: iconParking,
  toilet: iconToilet,
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
