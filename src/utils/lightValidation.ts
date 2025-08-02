/**
 * 軽量バリデーションユーティリティ
 * Zodの代替として、TypeScriptネイティブな型ガードを提供
 */

import type {
  Restaurant,
  CuisineType,
  PriceRange,
  LatLngLiteral,
} from "../types/restaurant.types";

// ==============================
// 基本的な型ガード関数
// ==============================

/** 文字列かどうかをチェック */
export const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

/** 数値かどうかをチェック */
export const isNumber = (value: unknown): value is number => {
  return typeof value === "number" && !isNaN(value);
};

/** 配列かどうかをチェック */
export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

/** オブジェクトかどうかをチェック */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

// ==============================
// 料理タイプのバリデーション
// ==============================

const CUISINE_TYPES: readonly CuisineType[] = [
  "日本料理",
  "寿司",
  "海鮮",
  "焼肉・焼鳥",
  "ラーメン",
  "そば・うどん",
  "中華",
  "イタリアン",
  "フレンチ",
  "カフェ・喫茶店",
  "バー・居酒屋",
  "ファストフード",
  "デザート・スイーツ",
  "その他",
] as const;

export const isCuisineType = (value: unknown): value is CuisineType => {
  return isString(value) && CUISINE_TYPES.includes(value as CuisineType);
};

// ==============================
// 価格帯のバリデーション
// ==============================

const PRICE_RANGES: readonly PriceRange[] = [
  "～1000円",
  "1000-2000円",
  "2000-3000円",
  "3000円～",
] as const;

export const isPriceRange = (value: unknown): value is PriceRange => {
  return isString(value) && PRICE_RANGES.includes(value as PriceRange);
};

// ==============================
// 座標のバリデーション
// ==============================

export const isLatLngLiteral = (value: unknown): value is LatLngLiteral => {
  if (!isObject(value)) return false;

  const lat = value.lat;
  const lng = value.lng;

  return (
    isNumber(lat) &&
    isNumber(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

// ==============================
// レストランデータのバリデーション
// ==============================

export const isRestaurant = (value: unknown): value is Restaurant => {
  if (!isObject(value)) return false;

  const {
    id,
    name,
    cuisineType,
    priceRange,
    address,
    coordinates,
    features,
    openingHours,
    lastUpdated,
  } = value;

  // 必須フィールドのチェック
  if (!isString(id) || id.length === 0) return false;
  if (!isString(name) || name.length === 0) return false;
  if (!isCuisineType(cuisineType)) return false;
  if (!isPriceRange(priceRange)) return false;
  if (!isString(address) || address.length === 0) return false;
  if (!isLatLngLiteral(coordinates)) return false;
  if (!isArray(features)) return false;
  if (!isArray(openingHours)) return false;
  if (!isString(lastUpdated)) return false;

  // IDの形式チェック（英数字、ハイフン、アンダースコアのみ）
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return false;

  // 名前の長さチェック
  if (name.length > 100) return false;

  // 住所の長さチェック
  if (address.length > 200) return false;

  // features配列の要素がすべて文字列かチェック
  if (!features.every((feature) => isString(feature))) return false;

  return true;
};

// ==============================
// セキュリティ関連のバリデーション
// ==============================

/** APIキーの形式チェック */
export const isValidApiKey = (value: unknown): value is string => {
  return isString(value) && /^AIza[0-9A-Za-z-_]{35}$/.test(value);
};

/** 入力文字列のサニタイズ */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>"'&]/g, "") // HTMLタグや特殊文字を除去
    .slice(0, 1000); // 最大長制限
};

/** 検索クエリのバリデーション */
export const isValidSearchQuery = (value: unknown): value is string => {
  if (!isString(value)) return false;

  const sanitized = sanitizeInput(value);
  return sanitized.length <= 100;
};

// ==============================
// データ配列のバリデーション
// ==============================

export const isRestaurantArray = (value: unknown): value is Restaurant[] => {
  return isArray(value) && value.every(isRestaurant);
};

// ==============================
// エラー処理ユーティリティ
// ==============================

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
}

export const createValidationError = (
  field: string,
  message: string,
  value?: unknown
): ValidationError => ({
  field,
  message,
  value,
});

/** レストランデータの詳細バリデーション（エラー詳細付き） */
export const validateRestaurant = (value: unknown): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!isObject(value)) {
    errors.push(
      createValidationError("root", "オブジェクトである必要があります", value)
    );
    return errors;
  }

  const {
    id,
    name,
    cuisineType,
    priceRange,
    address,
    coordinates,
    features,
    openingHours,
    lastUpdated,
  } = value;

  // IDの検証
  if (!isString(id)) {
    errors.push(
      createValidationError("id", "IDは文字列である必要があります", id)
    );
  } else if (id.length === 0) {
    errors.push(createValidationError("id", "IDは必須です", id));
  } else if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    errors.push(
      createValidationError(
        "id",
        "IDは英数字、ハイフン、アンダースコアのみ使用可能です",
        id
      )
    );
  }

  // 名前の検証
  if (!isString(name)) {
    errors.push(
      createValidationError("name", "店舗名は文字列である必要があります", name)
    );
  } else if (name.length === 0) {
    errors.push(createValidationError("name", "店舗名は必須です", name));
  } else if (name.length > 100) {
    errors.push(
      createValidationError(
        "name",
        "店舗名は100文字以内である必要があります",
        name
      )
    );
  }

  // 料理タイプの検証
  if (!isCuisineType(cuisineType)) {
    errors.push(
      createValidationError(
        "cuisineType",
        "有効な料理タイプである必要があります",
        cuisineType
      )
    );
  }

  // 価格帯の検証
  if (!isPriceRange(priceRange)) {
    errors.push(
      createValidationError(
        "priceRange",
        "有効な価格帯である必要があります",
        priceRange
      )
    );
  }

  // 住所の検証
  if (!isString(address)) {
    errors.push(
      createValidationError(
        "address",
        "住所は文字列である必要があります",
        address
      )
    );
  } else if (address.length === 0) {
    errors.push(createValidationError("address", "住所は必須です", address));
  } else if (address.length > 200) {
    errors.push(
      createValidationError(
        "address",
        "住所は200文字以内である必要があります",
        address
      )
    );
  }

  // 座標の検証
  if (!isLatLngLiteral(coordinates)) {
    errors.push(
      createValidationError(
        "coordinates",
        "有効な座標である必要があります",
        coordinates
      )
    );
  }

  // 特徴の検証
  if (!isArray(features)) {
    errors.push(
      createValidationError(
        "features",
        "特徴は配列である必要があります",
        features
      )
    );
  } else if (!features.every((feature) => isString(feature))) {
    errors.push(
      createValidationError(
        "features",
        "特徴の要素はすべて文字列である必要があります",
        features
      )
    );
  }

  // 営業時間の検証
  if (!isArray(openingHours)) {
    errors.push(
      createValidationError(
        "openingHours",
        "営業時間は配列である必要があります",
        openingHours
      )
    );
  }

  // 更新日時の検証
  if (!isString(lastUpdated)) {
    errors.push(
      createValidationError(
        "lastUpdated",
        "更新日時は文字列である必要があります",
        lastUpdated
      )
    );
  }

  return errors;
};
