/**
 * フィルターバリデーションユーティリティ
 * App.tsx内の重複したバリデーションロジックを統合
 */

import type { CuisineType, PriceRange, SadoDistrict } from "@/types";
import { sanitizeInput } from "../securityUtils";

export interface ValidationResult<T> {
  value: T;
  error: string | null;
  isValid: boolean;
}

/**
 * 検索クエリのバリデーション
 */
export function validateSearchQuery(query: string): ValidationResult<string> {
  if (typeof query !== "string") {
    return {
      value: "",
      error: "検索クエリは文字列である必要があります",
      isValid: false,
    };
  }

  const sanitized = sanitizeInput(query);
  const maxLength = 100;

  if (sanitized.length > maxLength) {
    return {
      value: sanitized.slice(0, maxLength),
      error: "検索クエリは100文字以下で入力してください",
      isValid: false,
    };
  }

  return {
    value: sanitized,
    error: null,
    isValid: true,
  };
}

/**
 * 特徴フィルターのバリデーション
 */
export function validateFeatures(
  features: string[]
): ValidationResult<string[]> {
  if (!Array.isArray(features)) {
    return {
      value: [],
      error: "特徴フィルターは配列である必要があります",
      isValid: false,
    };
  }

  const maxCount = 20;
  const maxItemLength = 50;

  const sanitized = features
    .filter((feature): feature is string => typeof feature === "string")
    .map(feature => {
      const cleaned = sanitizeInput(feature);
      return cleaned.length > maxItemLength
        ? cleaned.slice(0, maxItemLength)
        : cleaned;
    })
    .filter(feature => feature.length > 0);

  if (sanitized.length > maxCount) {
    return {
      value: sanitized.slice(0, maxCount),
      error: "特徴フィルターは20個以下で選択してください",
      isValid: false,
    };
  }

  return {
    value: sanitized,
    error: null,
    isValid: true,
  };
}

/**
 * 地区フィルターのバリデーション
 */
export function validateDistricts(
  districts: SadoDistrict[]
): ValidationResult<SadoDistrict[]> {
  if (!Array.isArray(districts)) {
    return {
      value: [],
      error: "地区フィルターは配列である必要があります",
      isValid: false,
    };
  }

  const maxCount = 10;

  if (districts.length > maxCount) {
    return {
      value: districts.slice(0, maxCount),
      error: "地区は10個以下で選択してください",
      isValid: false,
    };
  }

  return {
    value: districts,
    error: null,
    isValid: true,
  };
}

/**
 * 料理タイプのバリデーション
 */
export function validateCuisineType(
  cuisine: CuisineType | ""
): ValidationResult<CuisineType | ""> {
  if (cuisine !== "" && typeof cuisine !== "string") {
    return {
      value: "",
      error: "無効な料理タイプが指定されました",
      isValid: false,
    };
  }

  return {
    value: cuisine,
    error: null,
    isValid: true,
  };
}

/**
 * 価格範囲のバリデーション
 */
export function validatePriceRange(
  price: PriceRange | ""
): ValidationResult<PriceRange | ""> {
  if (price !== "" && typeof price !== "string") {
    return {
      value: "",
      error: "無効な価格範囲が指定されました",
      isValid: false,
    };
  }

  return {
    value: price,
    error: null,
    isValid: true,
  };
}
