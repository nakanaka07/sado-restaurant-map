/**
 * 軽量バリデーションユーティリティ
 * Zodの代替として、TypeScriptネイティブな型ガードを提供
 *
 * @fileoverview 佐渡飲食店マップアプリケーション用の軽量バリデーション
 * @version 2.1.0
 * @since 1.0.0
 * @author GitHub Copilot AI Assistant
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates TypeScript Type Guards}
 */

import type {
  Restaurant,
  CuisineType,
  PriceRange,
  SadoDistrict,
  LatLngLiteral,
} from "@/types";

// ==============================
// 基本的な型ガード関数
// ==============================

/**
 * 値が文字列かどうかをチェックする型ガード関数
 *
 * @param value - チェック対象の値
 * @returns 値が文字列の場合true
 *
 * @example
 * ```typescript
 * if (isString(userInput)) {
 *   // userInput は string 型として扱える
 *   console.log(userInput.toLowerCase());
 * }
 * ```
 */
export const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

/**
 * 値が数値かどうかをチェックする型ガード関数
 * NaN は false を返す
 *
 * @param value - チェック対象の値
 * @returns 値が有効な数値の場合true
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === "number" && !isNaN(value);
};

/**
 * 値が配列かどうかをチェックする型ガード関数
 *
 * @param value - チェック対象の値
 * @returns 値が配列の場合true
 */
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
  "カレー・エスニック",
  "ステーキ・洋食",
  "弁当・テイクアウト",
  "レストラン",
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
// 地区のバリデーション
// ==============================

const SADO_DISTRICTS: readonly SadoDistrict[] = [
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
] as const;

export const isSadoDistrict = (value: unknown): value is SadoDistrict => {
  return isString(value) && SADO_DISTRICTS.includes(value as SadoDistrict);
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
    district,
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
  if (!isSadoDistrict(district)) return false;
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
    district,
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

  // 地区の検証
  if (!isSadoDistrict(district)) {
    errors.push(
      createValidationError(
        "district",
        "有効な佐渡の地区である必要があります",
        district
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
