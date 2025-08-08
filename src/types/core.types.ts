/**
 * 佐渡飲食店マップ - 共通・基盤型定義
 * React 19 + TypeScript 5.7 対応
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
// 基盤的な識別・分類型
// ==============================

/** マップポイントの種類 */
export type MapPointType = "restaurant" | "parking" | "toilet";

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
