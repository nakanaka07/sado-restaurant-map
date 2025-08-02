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

// フィルター入力のバリデーション
export const FilterInputSchema = z.object({
  searchQuery: z
    .string()
    .max(100, "検索クエリは100文字以内である必要があります")
    .transform((val) => val.trim())
    .default(""),
  cuisineTypes: z
    .array(CuisineTypeSchema)
    .max(5, "料理タイプは5個まで選択可能です")
    .default([]),
  priceRanges: z
    .array(PriceRangeSchema)
    .max(4, "価格帯は4個まで選択可能です")
    .default([]),
  features: z
    .array(z.string().max(20, "特徴は20文字以内である必要があります"))
    .max(10, "特徴は10個まで選択可能です")
    .default([]),
});

// ソート順バリデーション
export const SortOrderSchema = z.enum([
  "name",
  "rating",
  "distance",
  "reviewCount",
  "priceRange",
]);

// APIリクエストのレート制限チェック
export function validateApiRequestLimit(
  lastRequestTime: number,
  minInterval: number = 1000
): boolean {
  const now = Date.now();
  return now - lastRequestTime >= minInterval;
}

// 位置情報の佐渡島範囲チェック
export function isSadoIslandCoordinate(coordinates: {
  lat: number;
  lng: number;
}): boolean {
  // 佐渡島の大まかな境界
  const SADO_BOUNDS = {
    north: 38.32,
    south: 37.72,
    east: 138.62,
    west: 138.05,
  };

  return (
    coordinates.lat >= SADO_BOUNDS.south &&
    coordinates.lat <= SADO_BOUNDS.north &&
    coordinates.lng >= SADO_BOUNDS.west &&
    coordinates.lng <= SADO_BOUNDS.east
  );
}

// 危険なHTMLタグの検出
export function containsDangerousContent(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /javascript:/i,
    /vbscript:/i,
    /data:text\/html/i,
    /onclick=/i,
    /onload=/i,
    /onerror=/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(input));
}

// SQLインジェクション検出（将来のDB使用時）
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /('|(\\'))|(;)|(\|)|(\*)|(%)/i,
    /(union|select|insert|update|delete|drop|create|alter)/i,
    /(script|javascript|vbscript)/i,
    /(char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

// XSS攻撃検出
export function containsXssAttempt(input: string): boolean {
  return containsDangerousContent(input);
}

// 包括的入力検証
export function validateUserInput(
  input: string,
  context: "search" | "filter" | "general" = "general"
): {
  isValid: boolean;
  errors: string[];
  sanitized: string;
} {
  const errors: string[] = [];
  let sanitized = input.trim();

  // 長さチェック
  const maxLength = context === "search" ? 100 : 50;
  if (sanitized.length > maxLength) {
    errors.push(`入力は${maxLength}文字以内である必要があります`);
    sanitized = sanitized.slice(0, maxLength);
  }

  // 危険なコンテンツチェック
  if (containsDangerousContent(sanitized)) {
    errors.push("不正なコンテンツが含まれています");
  }

  // SQLインジェクションチェック
  if (containsSqlInjection(sanitized)) {
    errors.push("不正なSQL文字列が含まれています");
  }

  // 基本的なサニタイゼーション
  sanitized = sanitized
    .replace(/[<>]/g, "") // HTMLタグ除去
    .replace(/['"]/g, "") // クォート除去
    .replace(/[;&|*%]/g, ""); // 危険な記号除去

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

// レスポンシブ画像URL検証
export function validateImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // HTTPS必須
    if (urlObj.protocol !== "https:") {
      return false;
    }

    // 許可されたドメイン
    const allowedDomains = [
      "images.unsplash.com",
      "res.cloudinary.com",
      "storage.googleapis.com",
      "lh3.googleusercontent.com", // Google Photos
    ];

    return allowedDomains.some((domain) => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

// アクセシビリティ検証
export function validateAccessibilityText(text: string): {
  isValid: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];

  // 最低文字数
  if (text.length < 3) {
    suggestions.push("説明文は3文字以上にしてください");
  }

  // 最大文字数
  if (text.length > 200) {
    suggestions.push("説明文は200文字以内にしてください");
  }

  // 特殊文字の連続使用
  if (/[!@#$%^&*()]{3,}/.test(text)) {
    suggestions.push("特殊文字の連続使用は避けてください");
  }

  return {
    isValid: suggestions.length === 0,
    suggestions,
  };
}

// バッチ検証（複数データの一括検証）
export function validateRestaurantBatch(restaurants: unknown[]): {
  valid: Restaurant[];
  invalid: Array<{ index: number; errors: string[]; data: unknown }>;
} {
  const valid: Restaurant[] = [];
  const invalid: Array<{ index: number; errors: string[]; data: unknown }> = [];

  restaurants.forEach((restaurant, index) => {
    try {
      const validRestaurant = validateRestaurantData(restaurant);
      valid.push(validRestaurant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        invalid.push({
          index,
          errors: error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          ),
          data: restaurant,
        });
      } else {
        invalid.push({
          index,
          errors: ["Unknown validation error"],
          data: restaurant,
        });
      }
    }
  });

  return { valid, invalid };
}
