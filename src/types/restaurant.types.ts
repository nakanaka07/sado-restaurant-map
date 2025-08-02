/**
 * 佐渡飲食店マップ - 型定義
 * React 19 + TypeScript 5.7 + Google Maps Advanced Markers対応
 */

// ==============================
// 基本的な地理座標の型定義
// ==============================

/** 緯度経度の座標 */
export interface LatLngLiteral {
  readonly lat: number;
  readonly lng: number;
}

// ==============================
// 飲食店関連の型定義
// ==============================

/** 料理ジャンル */
export type CuisineType =
  | "日本料理"
  | "寿司"
  | "海鮮"
  | "焼肉・焼鳥"
  | "ラーメン"
  | "そば・うどん"
  | "中華"
  | "イタリアン"
  | "フレンチ"
  | "カフェ・喫茶店"
  | "バー・居酒屋"
  | "ファストフード"
  | "デザート・スイーツ"
  | "その他";

/** 価格帯 */
export type PriceRange =
  | "～1000円"
  | "1000-2000円"
  | "2000-3000円"
  | "3000円～";

/** 営業時間 */
export interface OpeningHours {
  readonly day: string;
  readonly open: string;
  readonly close: string;
  readonly isHoliday: boolean;
}

/** 飲食店の基本情報 */
export interface Restaurant {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly cuisineType: CuisineType;
  readonly priceRange: PriceRange;
  readonly address: string;
  readonly phone?: string;
  readonly website?: string;
  readonly coordinates: LatLngLiteral;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly openingHours: readonly OpeningHours[];
  readonly features: readonly string[];
  readonly images?: readonly string[];
  readonly lastUpdated: string;
}

// ==============================
// Google Maps関連の型定義
// ==============================

/** マーカーの状態 */
export type MarkerState = "default" | "selected" | "highlighted";

/** カスタムマーカーのプロパティ */
export interface CustomMarkerProps {
  readonly restaurant: Restaurant;
  readonly state: MarkerState;
  readonly onClick: (restaurant: Restaurant) => void;
  readonly onHover?: (restaurant: Restaurant | null) => void;
}

/** 地図の表示設定 */
export interface MapSettings {
  readonly center: LatLngLiteral;
  readonly zoom: number;
  readonly mapTypeId: google.maps.MapTypeId;
  readonly showTraffic: boolean;
  readonly showTransit: boolean;
}

/** 地図のフィルター設定 */
export interface MapFilters {
  readonly cuisineTypes: readonly CuisineType[];
  readonly priceRanges: readonly PriceRange[];
  readonly features: readonly string[];
  readonly searchQuery: string;
  readonly currentLocation?: LatLngLiteral;
  readonly radius?: number; // km
}

// ==============================
// UI関連の型定義
// ==============================

/** テーマ設定 */
export type Theme = "light" | "dark" | "auto";

/** 表示モード */
export type ViewMode = "map" | "list" | "grid";

/** ソート順 */
export type SortOrder = "name" | "rating" | "distance" | "priceRange";

/** アプリの状態 */
export interface AppState {
  readonly restaurants: readonly Restaurant[];
  readonly selectedRestaurant: Restaurant | null;
  readonly filters: MapFilters;
  readonly mapSettings: MapSettings;
  readonly viewMode: ViewMode;
  readonly sortOrder: SortOrder;
  readonly theme: Theme;
  readonly isLoading: boolean;
  readonly error: string | null;
}

// ==============================
// API関連の型定義
// ==============================

/** Google Sheets APIのレスポンス */
export interface SheetsApiResponse {
  readonly range: string;
  readonly majorDimension: string;
  readonly values: readonly (readonly string[])[];
}

/** APIエラー */
export interface ApiError {
  readonly code: number;
  readonly message: string;
  readonly details?: unknown;
}

// ==============================
// ユーティリティ型
// ==============================

/** 非同期処理の状態 */
export type AsyncState<T> = {
  readonly data: T | null;
  readonly loading: boolean;
  readonly error: string | null;
};

/** 位置情報の状態 */
export type GeolocationState = {
  readonly position: LatLngLiteral | null;
  readonly permission: PermissionState | null;
  readonly accuracy?: number;
  readonly timestamp?: number;
};

/** React 19対応 - use hook用の Promise型 */
export type PromiseState<T> = Promise<T> & {
  readonly status?: "pending" | "fulfilled" | "rejected";
  readonly value?: T;
  readonly reason?: unknown;
};
