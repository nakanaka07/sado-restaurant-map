/**
 * 佐渡飲食店マップ - 型ガード関数
 * Type Guards for Runtime Type Checking
 */

import type {
  MapPoint,
  Restaurant,
  Parking,
  Toilet,
  ApiError,
  SheetsApiError,
  MapPointType,
  SadoDistrict,
} from "./index";

// ==============================
// マップポイント型ガード
// ==============================

/** Restaurant型ガード */
export const isRestaurant = (point: MapPoint): point is Restaurant => {
  return point.type === "restaurant";
};

/** Parking型ガード */
export const isParking = (point: MapPoint): point is Parking => {
  return point.type === "parking";
};

/** Toilet型ガード */
export const isToilet = (point: MapPoint): point is Toilet => {
  return point.type === "toilet";
};

/** MapPointType型ガード */
export const isValidMapPointType = (type: string): type is MapPointType => {
  return ["restaurant", "parking", "toilet"].includes(type);
};

/** SadoDistrict型ガード */
export const isValidSadoDistrict = (
  district: string
): district is SadoDistrict => {
  return [
    "両津",
    "相川",
    "佐和田",
    "金井",
    "新穂",
    "畑野",
    "真野",
    "小木",
    "羽茂",
    "赤泊",
    "その他",
  ].includes(district);
};

// ==============================
// APIエラー型ガード
// ==============================

/** API エラー型ガード */
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as ApiError).code === "number" &&
    typeof (error as ApiError).message === "string"
  );
};

/** Google Sheets API エラー型ガード */
export const isSheetsApiError = (error: unknown): error is SheetsApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as SheetsApiError).error === "object"
  );
};

// ==============================
// 座標・位置情報型ガード
// ==============================

/** 有効な緯度経度型ガード */
export const isValidLatLng = (
  coords: unknown
): coords is { lat: number; lng: number } => {
  return (
    typeof coords === "object" &&
    coords !== null &&
    "lat" in coords &&
    "lng" in coords &&
    typeof (coords as any).lat === "number" &&
    typeof (coords as any).lng === "number" &&
    !isNaN((coords as any).lat) &&
    !isNaN((coords as any).lng) &&
    (coords as any).lat >= -90 &&
    (coords as any).lat <= 90 &&
    (coords as any).lng >= -180 &&
    (coords as any).lng <= 180
  );
};

// ==============================
// 配列・コレクション型ガード
// ==============================

/** 非空配列型ガード */
export const isNonEmptyArray = <T>(arr: T[]): arr is [T, ...T[]] => {
  return Array.isArray(arr) && arr.length > 0;
};

/** 文字列配列型ガード */
export const isStringArray = (arr: unknown): arr is string[] => {
  return Array.isArray(arr) && arr.every((item) => typeof item === "string");
};

// ==============================
// React関連型ガード
// ==============================

/** React要素型ガード */
export const isReactElement = (
  element: unknown
): element is React.ReactElement => {
  return (
    typeof element === "object" &&
    element !== null &&
    "type" in element &&
    "props" in element
  );
};

// ==============================
// 開発時デバッグ用型ガード
// ==============================

/** 開発環境での詳細型チェック */
export const validateMapPoint = (point: unknown): point is MapPoint => {
  if (typeof point !== "object" || point === null) {
    console.warn("MapPoint validation failed: not an object", point);
    return false;
  }

  const p = point as any;

  // 必須フィールドのチェック
  const requiredFields = [
    "id",
    "type",
    "name",
    "district",
    "address",
    "coordinates",
    "features",
    "lastUpdated",
  ];
  for (const field of requiredFields) {
    if (!(field in p)) {
      console.warn(
        `MapPoint validation failed: missing field "${field}"`,
        point
      );
      return false;
    }
  }

  // 型の詳細チェック
  if (!isValidMapPointType(p.type)) {
    console.warn("MapPoint validation failed: invalid type", p.type);
    return false;
  }

  if (!isValidSadoDistrict(p.district)) {
    console.warn("MapPoint validation failed: invalid district", p.district);
    return false;
  }

  if (!isValidLatLng(p.coordinates)) {
    console.warn(
      "MapPoint validation failed: invalid coordinates",
      p.coordinates
    );
    return false;
  }

  if (!isStringArray(p.features)) {
    console.warn("MapPoint validation failed: invalid features", p.features);
    return false;
  }

  return true;
};
