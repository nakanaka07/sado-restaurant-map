/**
 * 佐渡飲食店マップ - 飲食店関連型定義
 * React 19 + TypeScript 5.7 対応
 */

import type {
  LatLngLiteral,
  MapPointType,
  OpeningHours,
  SadoDistrict,
} from "./core.types";

// ==============================
// 飲食店関連の型定義
// ==============================

/** 営業状況 */
export enum BusinessStatus {
  OPEN = "営業中",
  CLOSED = "閉店中",
  UNKNOWN = "不明",
}

/** 詳細営業時間 */
export interface DetailedOpeningHours {
  readonly monday?: TimeRange;
  readonly tuesday?: TimeRange;
  readonly wednesday?: TimeRange;
  readonly thursday?: TimeRange;
  readonly friday?: TimeRange;
  readonly saturday?: TimeRange;
  readonly sunday?: TimeRange;
}

/** 時間範囲 */
export interface TimeRange {
  readonly open: string; // "09:00"
  readonly close: string; // "21:00"
  readonly isClosed?: boolean;
}

/** レストランカテゴリー */
export enum RestaurantCategory {
  JAPANESE = "japanese",
  SUSHI = "sushi",
  SEAFOOD = "seafood",
  YAKINIKU = "yakiniku",
  RAMEN = "ramen",
  NOODLES = "noodles",
  CHINESE = "chinese",
  ITALIAN = "italian",
  FRENCH = "french",
  CAFE = "cafe",
  BAR = "bar",
  FAST_FOOD = "fastfood",
  DESSERT = "dessert",
  CURRY = "curry",
  STEAK = "steak",
  BENTO = "bento",
  RESTAURANT = "restaurant",
  OTHER = "other",
}

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

/** 飲食店の基本情報 */
export interface Restaurant {
  readonly id: string;
  readonly type: "restaurant"; // MapPointType と互換性
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
  // 新機能追加フィールド
  readonly businessStatus?: BusinessStatus;
  readonly detailedOpeningHours?: DetailedOpeningHours;
  readonly lastDataUpdate?: string; // データ更新日
  readonly mainCategory?: RestaurantCategory;
  readonly googleMapsUrl?: string;
}

// ==============================
// 駐車場・トイレ関連の型定義
// ==============================

/** 駐車場の基本情報 */
export interface Parking {
  readonly id: string;
  readonly type: "parking"; // MapPointType と互換性
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
  readonly type: "toilet"; // MapPointType と互換性
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
export type MapPoint = Restaurant | Parking | Toilet;

/** 拡張されたマップフィルター（駐車場・トイレ対応） */
export interface ExtendedMapFilters {
  readonly cuisineTypes: readonly CuisineType[];
  readonly priceRanges: readonly PriceRange[];
  readonly districts: readonly SadoDistrict[];
  readonly features: readonly string[];
  readonly searchQuery: string;
  readonly currentLocation?: LatLngLiteral;
  readonly radius?: number; // km
  readonly minRating?: number;
  readonly openNow?: boolean;
  readonly pointTypes: readonly MapPointType[]; // 表示するポイントの種類
  readonly parkingFeatures?: readonly string[]; // 駐車場の特徴フィルター
  readonly toiletFeatures?: readonly string[]; // トイレの特徴フィルター
}
