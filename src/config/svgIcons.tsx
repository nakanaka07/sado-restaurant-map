/**
 * @fileoverview SVG Icons Library
 * SVGアイコンライブラリ - 料理ジャンル別アイコン定義
 */

export interface SVGIconProps {
  width?: number;
  height?: number;
  fill?: string;
  className?: string;
}

/**
 * レストランアイコン - デフォルト
 */
export const RestaurantIcon = ({ width = 24, height = 24, fill = "currentColor", className }: SVGIconProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"
      fill={fill}
    />
  </svg>
);

/**
 * 寿司アイコン
 */
export const SushiIcon = ({ width = 24, height = 24, fill = "currentColor", className }: SVGIconProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="10" rx="9" ry="3" fill={fill} />
    <rect x="6" y="13" width="12" height="4" rx="2" fill={fill} opacity="0.8" />
    <circle cx="9" cy="8" r="1" fill="#ff6b35" />
    <circle cx="15" cy="8" r="1" fill="#ff6b35" />
  </svg>
);

/**
 * ラーメンアイコン
 */
export const RamenIcon = ({ width = 24, height = 24, fill = "currentColor", className }: SVGIconProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="14" rx="10" ry="6" fill={fill} />
    <path d="M4 12 Q8 8 12 10 Q16 8 20 12" stroke={fill} strokeWidth="2" fill="none" />
    <circle cx="8" cy="16" r="1" fill="#ffd93d" />
    <circle cx="16" cy="16" r="1" fill="#ffd93d" />
    <rect x="10" y="6" width="4" height="6" fill={fill} opacity="0.6" />
  </svg>
);

/**
 * 海鮮アイコン
 */
export const SeafoodIcon = ({ width = 24, height = 24, fill = "currentColor", className }: SVGIconProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2C8 2 5 6 5 10s3 8 7 8 7-4 7-8-3-8-7-8z"
      fill={fill}
    />
    <path
      d="M12 6c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2z"
      fill="white"
    />
    <path
      d="M8 18s2 2 4 2 4-2 4-2"
      stroke={fill} strokeWidth="2" fill="none"
    />
  </svg>
);

/**
 * カフェアイコン
 */
export const CafeIcon = ({ width = 24, height = 24, fill = "currentColor", className }: SVGIconProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.38 0 2.5-1.12 2.5-2.5S19.88 5 18.5 5V3z"
      fill={fill}
    />
    <path
      d="M7 9V7h8v2"
      stroke="white" strokeWidth="1" fill="none"
    />
  </svg>
);

/**
 * 焼肉アイコン
 */
export const YakinikuIcon = ({ width = 24, height = 24, fill = "currentColor", className }: SVGIconProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="10" width="16" height="8" rx="2" fill={fill} />
    <path
      d="M6 14h12M8 16h8M10 12h4"
      stroke="white" strokeWidth="1"
    />
    <path
      d="M8 8l1-2M12 8l0-2M16 8l-1-2"
      stroke={fill} strokeWidth="2" fill="none"
    />
  </svg>
);

/**
 * 中華アイコン
 */
export const ChineseIcon = ({ width = 24, height = 24, fill = "currentColor", className }: SVGIconProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8" fill={fill} />
    <path
      d="M8 8h8l-2 2H10l-2-2zM8 16h8l-2-2H10l-2 2z"
      fill="white"
    />
    <rect x="11" y="6" width="2" height="12" fill="white" />
  </svg>
);

/**
 * 駐車場アイコン
 */
export const ParkingIcon = ({ width = 24, height = 24, fill = "currentColor", className }: SVGIconProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" fill={fill} />
    <path
      d="M8 8h4c2 0 3 1 3 3s-1 3-3 3h-2v3H8V8zm2 4h2c1 0 1-1 1-1s0-1-1-1h-2v2z"
      fill="white"
    />
  </svg>
);

/**
 * トイレアイコン
 */
export const ToiletIcon = ({ width = 24, height = 24, fill = "currentColor", className }: SVGIconProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" fill={fill} />
    <circle cx="10" cy="8" r="1.5" fill="white" />
    <rect x="9" y="10" width="2" height="6" fill="white" />
    <rect x="8" y="12" width="4" height="1" fill="white" />
    <circle cx="14" cy="8" r="1.5" fill="white" />
    <path d="M14 10v6M12 12h4v4h-4" stroke="white" strokeWidth="1" fill="none" />
  </svg>
);

/**
 * デフォルトアイコン
 */
export const DefaultIcon = ({ width = 24, height = 24, fill = "currentColor", className }: SVGIconProps) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8" fill={fill} />
    <circle cx="12" cy="12" r="3" fill="white" />
  </svg>
);

/**
 * 料理ジャンル別アイコンマップ
 */
export const CUISINE_ICON_MAP = {
  "日本料理": RestaurantIcon,
  "寿司": SushiIcon,
  "ラーメン": RamenIcon,
  "海鮮": SeafoodIcon,
  "焼肉・焼鳥": YakinikuIcon,
  "そば・うどん": RestaurantIcon,
  "中華": ChineseIcon,
  "イタリアン": RestaurantIcon,
  "フレンチ": RestaurantIcon,
  "カフェ・喫茶店": CafeIcon,
  "バー・居酒屋": RestaurantIcon,
  "ファストフード": RestaurantIcon,
  "デザート・スイーツ": CafeIcon,
  "カレー・エスニック": RestaurantIcon,
  "ステーキ・洋食": YakinikuIcon,
  "弁当・テイクアウト": RestaurantIcon,
  "レストラン": RestaurantIcon,
  "その他": DefaultIcon,
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
export const getIconComponent = (cuisineType?: string, facilityType?: string) => {
  if (facilityType && facilityType in FACILITY_ICON_MAP) {
    return FACILITY_ICON_MAP[facilityType as keyof typeof FACILITY_ICON_MAP];
  }

  if (cuisineType && cuisineType in CUISINE_ICON_MAP) {
    return CUISINE_ICON_MAP[cuisineType as keyof typeof CUISINE_ICON_MAP];
  }

  return DefaultIcon;
};
