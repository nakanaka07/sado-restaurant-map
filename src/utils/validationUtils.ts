import { z } from "zod";
import type { Restaurant } from "@/types";

// スキーマ定義でデータ整合性を保証
export const CuisineTypeSchema = z.enum([
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
]);

export const PriceRangeSchema = z.enum([
  "～1000円",
  "1000-2000円",
  "2000-3000円",
  "3000円～",
]);

export const CoordinatesSchema = z.object({
  lat: z
    .number()
    .min(-90, "緯度は-90以上である必要があります")
    .max(90, "緯度は90以下である必要があります"),
  lng: z
    .number()
    .min(-180, "経度は-180以上である必要があります")
    .max(180, "経度は180以下である必要があります"),
});

export const RestaurantSchema = z.object({
  id: z
    .string()
    .min(1, "IDは必須です")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "IDは英数字とハイフン、アンダースコアのみ使用可能です"
    ),
  name: z
    .string()
    .min(1, "店舗名は必須です")
    .max(100, "店舗名は100文字以内である必要があります"),
  description: z
    .string()
    .max(500, "説明は500文字以内である必要があります")
    .optional(),
  cuisineType: CuisineTypeSchema.default("その他"),
  priceRange: PriceRangeSchema.default("1000-2000円"),
  address: z
    .string()
    .min(1, "住所は必須です")
    .max(200, "住所は200文字以内である必要があります"),
  coordinates: CoordinatesSchema,
  phone: z
    .string()
    .regex(/^[\d\-()s+]+$/, "電話番号の形式が正しくありません")
    .optional(),
  website: z.string().url("正しいURL形式で入力してください").optional(),
  rating: z
    .number()
    .min(0, "評価は0以上である必要があります")
    .max(5, "評価は5以下である必要があります")
    .optional(),
  reviewCount: z
    .number()
    .min(0, "レビュー数は0以上である必要があります")
    .default(0),
  openingHours: z
    .array(
      z.object({
        day: z.string(),
        open: z.string(),
        close: z.string(),
        isHoliday: z.boolean(),
      })
    )
    .default([]),
  features: z
    .array(z.string().max(20, "特徴は20文字以内である必要があります"))
    .default([]),
  images: z
    .array(z.string().url("画像URLの形式が正しくありません"))
    .default([])
    .optional(),
  lastUpdated: z.string(),
});

// Google Sheets APIレスポンス用スキーマ
export const SheetsApiResponseSchema = z.object({
  range: z.string(),
  majorDimension: z.string(),
  values: z.array(z.array(z.string())),
});

// 環境変数バリデーション
export const EnvironmentSchema = z.object({
  VITE_GOOGLE_MAPS_API_KEY: z
    .string()
    .min(1, "Google Maps API Keyは必須です")
    .startsWith("AIza", "Google Maps API Keyの形式が正しくありません"),
  VITE_GOOGLE_SHEETS_API_KEY: z
    .string()
    .min(1, "Google Sheets API Keyは必須です")
    .startsWith("AIza", "Google Sheets API Keyの形式が正しくありません")
    .optional(),
  VITE_SPREADSHEET_ID: z
    .string()
    .min(1, "スプレッドシートIDは必須です")
    .regex(/^[a-zA-Z0-9\-_]+$/, "スプレッドシートIDの形式が正しくありません"),
});

// バリデーション関数
export function validateRestaurantData(data: unknown): Restaurant {
  return RestaurantSchema.parse(data);
}

export function validateEnvironment() {
  return EnvironmentSchema.parse(import.meta.env);
}

export function validateSheetsApiResponse(data: unknown) {
  return SheetsApiResponseSchema.parse(data);
}

// 型ガード関数
export function isValidRestaurant(data: unknown): data is Restaurant {
  try {
    validateRestaurantData(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidCoordinates(
  data: unknown
): data is { lat: number; lng: number } {
  try {
    CoordinatesSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

// サニタイゼーション関数
export function sanitizeRestaurantInput(
  input: Partial<Restaurant>
): Partial<Restaurant> {
  return {
    ...input,
    name: input.name?.trim(),
    description: input.description?.trim(),
    address: input.address?.trim(),
    phone: input.phone?.replace(/[^\d\-()s+]/g, ""),
    features: input.features?.map((feature: string) =>
      feature.trim().toLowerCase()
    ),
  };
}
