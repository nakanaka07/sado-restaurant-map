/**
 * 佐渡飲食店マップ - アプリケーション設定
 * 定数・設定値の一元管理
 */

import type { LatLngLiteral } from "@/types";

// ==============================
// 地図関連の定数
// ==============================

/** 佐渡島の中心座標 */
export const SADO_CENTER: LatLngLiteral = {
  lat: 38.018611,
  lng: 138.367222,
} as const;

/** デフォルトの地図ズームレベル */
export const DEFAULT_ZOOM = 10;

/** マーカークラスタリングの最小ズームレベル */
export const MIN_CLUSTER_ZOOM = 8;

/** 検索半径の選択肢（km） */
export const SEARCH_RADIUS_OPTIONS = [1, 3, 5, 10, 20] as const;

// ==============================
// API関連の設定
// ==============================

/** Google Analytics測定ID */
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined;

/** Google Sheets API設定 */
export const SHEETS_CONFIG = {
  SPREADSHEET_ID: import.meta.env.VITE_SPREADSHEET_ID,
  API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
  SHEET_NAME: "まとめータベース",
  RANGE: "A:Z",
} as const;

/** 位置情報取得の設定 */
export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5分
} as const;

// ==============================
// UI関連の定数
// ==============================

/** 利用可能なテーマ */
export const THEMES = ["light", "dark", "auto"] as const;

/** 表示モード */
export const VIEW_MODES = ["map", "list", "grid"] as const;

/** ソート順の選択肢 */
export const SORT_OPTIONS = [
  { value: "name", label: "店名順" },
  { value: "rating", label: "評価順" },
  { value: "distance", label: "距離順" },
  { value: "priceRange", label: "価格順" },
] as const;

/** ページネーションの設定 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// ==============================
// バリデーション関連
// ==============================

/** 入力値の最大長 */
export const INPUT_LIMITS = {
  SEARCH_QUERY: 100,
  RESTAURANT_NAME: 50,
  ADDRESS: 200,
  PHONE: 20,
} as const;

/** APIキーの形式パターン */
export const API_KEY_PATTERNS = {
  GOOGLE_MAPS: /^AIza[0-9A-Za-z-_]{35}$/,
  GOOGLE_SHEETS: /^AIza[0-9A-Za-z-_]{35}$/,
} as const;

// ==============================
// パフォーマンス関連
// ==============================

/** デバウンス時間（ミリ秒） */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  RESIZE: 100,
  SCROLL: 50,
} as const;

/** キャッシュの有効期限（ミリ秒） */
export const CACHE_DURATIONS = {
  RESTAURANT_DATA: 30 * 60 * 1000, // 30分
  GEOCODING: 24 * 60 * 60 * 1000, // 24時間
  USER_LOCATION: 5 * 60 * 1000, // 5分
} as const;

// ==============================
// アクセシビリティ関連
// ==============================

/** ARIA ラベル */
export const ARIA_LABELS = {
  MAP_CONTAINER: "佐渡島の飲食店地図",
  SEARCH_INPUT: "飲食店を検索",
  FILTER_PANEL: "フィルター設定",
  RESTAURANT_LIST: "飲食店一覧",
  RESTAURANT_CARD: "飲食店情報",
} as const;

/** キーボードショートカット */
export const KEYBOARD_SHORTCUTS = {
  SEARCH_FOCUS: "Ctrl+F",
  MAP_RESET: "Ctrl+R",
  TOGGLE_THEME: "Ctrl+T",
} as const;
