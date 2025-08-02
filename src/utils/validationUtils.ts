/**
 * バリデーションユーティリティ
 * 軽量バリデーション機能を使用してZodを置き換え
 */

import {
  isRestaurant,
  isRestaurantArray,
  isValidApiKey,
  sanitizeInput,
  isValidSearchQuery,
  validateRestaurant,
} from "./lightValidation";
import type {
  Restaurant,
  CuisineType,
  PriceRange,
} from "../types/restaurant.types";

// ==============================
// 公開API（下位互換性のため）
// ==============================

/** APIキーの形式バリデーション */
export const validateApiKey = (apiKey: string): boolean => {
  return isValidApiKey(apiKey);
};

/** 入力文字列のサニタイズ */
export { sanitizeInput };

/** 検索クエリのバリデーション */
export const validateSearchQuery = (query: string): boolean => {
  return isValidSearchQuery(query);
};

/** レストランデータのバリデーション */
export const validateRestaurantData = (data: unknown): data is Restaurant => {
  return isRestaurant(data);
};

/** レストラン配列のバリデーション */
export const validateRestaurantArray = (
  data: unknown
): data is Restaurant[] => {
  return isRestaurantArray(data);
};

/** 詳細バリデーション（エラー情報付き） */
export const validateRestaurantWithErrors = (data: unknown) => {
  return validateRestaurant(data);
};

/** 安全な数値変換 */
export const safeParseNumber = (value: unknown): number | null => {
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

/** 安全な文字列変換 */
export const safeParseString = (value: unknown): string => {
  if (typeof value === "string") {
    return sanitizeInput(value);
  }
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    try {
      return sanitizeInput(JSON.stringify(value));
    } catch {
      return "";
    }
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return sanitizeInput(String(value));
  }
  return "";
};

/** 配列の安全な変換 */
export const safeParseArray = <T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T
): T[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(itemValidator);
};

// ==============================
// Google Sheets データの変換
// ==============================

/**
 * Google Sheetsから取得した行データをレストラン情報に変換
 * エラーハンドリングと型安全性を強化
 */
export const parseRestaurantFromSheetRow = (
  row: readonly string[],
  rowIndex: number
): Restaurant | null => {
  try {
    // 最低限必要な列数をチェック
    if (row.length < 8) {
      console.warn(
        `行 ${rowIndex}: 必要な列数が不足しています (${row.length} < 8)`
      );
      return null;
    }

    const [
      id,
      name,
      description = "",
      cuisineType,
      priceRange,
      address,
      phone = "",
      website = "",
      latStr,
      lngStr,
      ratingStr = "",
      reviewCountStr = "",
      featuresStr = "",
      ...openingHoursData
    ] = row;

    // 必須フィールドの検証
    if (!id || !name || !cuisineType || !priceRange || !address) {
      console.warn(`行 ${rowIndex}: 必須フィールドが不足しています`);
      return null;
    }

    // 座標の解析
    const lat = safeParseNumber(latStr);
    const lng = safeParseNumber(lngStr);

    if (lat === null || lng === null) {
      console.warn(
        `行 ${rowIndex}: 無効な座標データ (lat: ${latStr}, lng: ${lngStr})`
      );
      return null;
    }

    // 評価とレビュー数の解析
    const rating = safeParseNumber(ratingStr);
    const reviewCount = safeParseNumber(reviewCountStr);

    // 特徴の解析
    const features = featuresStr
      ? featuresStr
          .split(",")
          .map((f) => sanitizeInput(f.trim()))
          .filter((f) => f.length > 0)
      : [];

    // 営業時間の解析（簡単な形式）
    const openingHours = openingHoursData
      .filter((data) => data && data.trim().length > 0)
      .map((data, index) => ({
        day:
          ["月", "火", "水", "木", "金", "土", "日"][index] ||
          `曜日${index + 1}`,
        open: "9:00",
        close: "18:00",
        isHoliday:
          data.toLowerCase().includes("休") ||
          data.toLowerCase().includes("closed"),
      }));

    const restaurant: Restaurant = {
      id: sanitizeInput(id),
      name: sanitizeInput(name),
      description: description ? sanitizeInput(description) : undefined,
      cuisineType: cuisineType as CuisineType,
      priceRange: priceRange as PriceRange,
      address: sanitizeInput(address),
      phone: phone ? sanitizeInput(phone) : undefined,
      website: website ? sanitizeInput(website) : undefined,
      coordinates: { lat, lng },
      rating: rating || undefined,
      reviewCount: reviewCount || undefined,
      openingHours,
      features,
      images: [], // 今回は空配列
      lastUpdated: new Date().toISOString(),
    };

    // 最終バリデーション
    if (!isRestaurant(restaurant)) {
      const errors = validateRestaurant(restaurant);
      console.warn(`行 ${rowIndex}: バリデーションエラー`, errors);
      return null;
    }

    return restaurant;
  } catch (error) {
    console.error(`行 ${rowIndex}: パースエラー`, error);
    return null;
  }
};

/**
 * Google Sheetsの全データを解析
 */
export const parseRestaurantsFromSheetData = (
  data: readonly (readonly string[])[]
): Restaurant[] => {
  const restaurants: Restaurant[] = [];

  // ヘッダー行をスキップ（1行目）
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const restaurant = parseRestaurantFromSheetRow(row, i + 1);
    if (restaurant) {
      restaurants.push(restaurant);
    }
  }

  console.log(
    `Google Sheetsから ${restaurants.length} 件のレストランデータを取得しました`
  );
  return restaurants;
};

/**
 * エラーハンドリングの強化
 */
export const handleValidationError = (
  error: unknown,
  context: string = "データ処理"
): void => {
  try {
    if (error instanceof Error) {
      console.error(`${context} - エラー:`, {
        name: error.name,
        message: error.message,
        stack: import.meta.env.DEV ? error.stack : undefined,
      });
    } else {
      console.error(`${context} - 不明なエラー:`, error);
    }
  } catch (handlingError) {
    console.error("エラーハンドリング中にエラーが発生しました:", handlingError);
  }
};
