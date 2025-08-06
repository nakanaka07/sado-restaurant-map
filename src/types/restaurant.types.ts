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
// マップポイントの種類
// ==============================

/** マップポイントの種類 */
export type MapPointType = "restaurant" | "parking" | "toilet";

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
  | "カレー・エスニック"
  | "ステーキ・洋食"
  | "弁当・テイクアウト"
  | "レストラン"
  | "その他";

/** 価格帯 */
export type PriceRange =
  | "～1000円"
  | "1000-2000円"
  | "2000-3000円"
  | "3000円～";

/** 佐渡の地区分類 */
export type SadoDistrict =
  | "両津"
  | "相川"
  | "佐和田"
  | "金井"
  | "新穂"
  | "畑野"
  | "真野"
  | "小木"
  | "羽茂"
  | "赤泊"
  | "その他";

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
  readonly district: SadoDistrict;
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
  readonly districts: readonly SadoDistrict[];
  readonly features: readonly string[];
  readonly searchQuery: string;
  readonly currentLocation?: LatLngLiteral;
  readonly radius?: number; // km
  readonly minRating?: number;
  readonly openNow?: boolean;
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

// ==============================
// 駐車場・トイレ関連の型定義
// ==============================

/** 駐車場の基本情報 */
export interface Parking {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly district: SadoDistrict;
  readonly address: string;
  readonly coordinates: LatLngLiteral;
  readonly capacity?: number;
  readonly fee?: string; // "無料" | "有料" | "100円/時" など
  readonly openingHours?: readonly OpeningHours[];
  readonly features: readonly string[]; // "大型車対応", "障害者用", "24時間利用可" など
  readonly lastUpdated: string;
}

/** 公衆トイレの基本情報 */
export interface Toilet {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly district: SadoDistrict;
  readonly address: string;
  readonly coordinates: LatLngLiteral;
  readonly openingHours?: readonly OpeningHours[];
  readonly features: readonly string[]; // "多目的トイレ", "おむつ交換台", "車椅子対応" など
  readonly lastUpdated: string;
}

/** 統合マップポイント（飲食店・駐車場・トイレを統合） */
export interface MapPoint {
  readonly id: string;
  readonly type: MapPointType;
  readonly name: string;
  readonly description?: string;
  readonly district: SadoDistrict;
  readonly address: string;
  readonly coordinates: LatLngLiteral;
  readonly features: readonly string[];
  readonly lastUpdated: string;
  // 飲食店固有のプロパティ（オプション）
  readonly cuisineType?: CuisineType;
  readonly priceRange?: PriceRange;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly phone?: string;
  readonly openingHours?: readonly OpeningHours[];
}

/** 拡張されたマップフィルター（駐車場・トイレ対応） */
export interface ExtendedMapFilters extends MapFilters {
  readonly pointTypes: readonly MapPointType[]; // 表示するポイントの種類
  readonly parkingFeatures?: readonly string[]; // 駐車場の特徴フィルター
  readonly toiletFeatures?: readonly string[]; // トイレの特徴フィルター
}
