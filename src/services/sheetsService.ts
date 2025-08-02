/**
 * Google Sheets API連携サービス
 * places_data_updater.pyで生成されたスプレッドシートからデータを取得
 */

import type { Restaurant, CuisineType, PriceRange } from "@/types";

// 環境変数から設定値を取得
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

// スプレッドシートのワークシート名（places_data_updater.pyと対応）
const WORKSHEETS = {
  RESTAURANTS: "飲食店",
  PARKINGS: "駐車場",
  TOILETS: "公衆トイレ",
} as const;

// 佐渡の地区分類（places_data_updater.pyと対応）
export type SadoDistrict =
  | "両津地区"
  | "相川地区"
  | "佐和田地区"
  | "金井地区"
  | "新穂地区"
  | "畑野地区"
  | "真野地区"
  | "小木地区"
  | "羽茂地区"
  | "赤泊地区"
  | "その他";

/**
 * スプレッドシートから飲食店データを取得
 */
export interface SheetRestaurantData {
  readonly placeId: string;
  readonly name: string;
  readonly address: string;
  readonly lat: number;
  readonly lng: number;
  readonly category: string;
  readonly categoryDetail: string;
  readonly phone?: string;
  readonly openingHours?: string;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly district: SadoDistrict;
  readonly googleMapsUrl: string;
  readonly lastUpdated: string;
}

/**
 * Google Sheets APIエラー
 */
export class SheetsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = "SheetsApiError";
  }
}

/**
 * Google Sheets APIレスポンスの型定義
 */
interface SheetsApiResponse {
  values?: string[][];
}

/**
 * Google Sheets APIからデータを取得
 */
async function fetchSheetData(worksheetName: string): Promise<string[][]> {
  if (!SPREADSHEET_ID || !API_KEY) {
    throw new SheetsApiError(
      "Google Sheets API設定が不完全です。VITE_SPREADSHEET_IDとVITE_GOOGLE_SHEETS_API_KEYを設定してください。"
    );
  }

  const range = `${worksheetName}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new SheetsApiError(
        `Google Sheets API request failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data = (await response.json()) as SheetsApiResponse;

    if (!data.values || !Array.isArray(data.values)) {
      throw new SheetsApiError(
        "Invalid response format from Google Sheets API"
      );
    }

    return data.values;
  } catch (error) {
    if (error instanceof SheetsApiError) {
      throw error;
    }

    throw new SheetsApiError(
      `Google Sheets API request failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * 飲食店データを取得してRestaurant型に変換
 */
export async function fetchRestaurantsFromSheets(): Promise<Restaurant[]> {
  try {
    const rows = await fetchSheetData(WORKSHEETS.RESTAURANTS);

    if (rows.length === 0) {
      return [];
    }

    // ヘッダー行をスキップ
    const dataRows = rows.slice(1);

    return dataRows
      .map((row, index) => {
        try {
          return convertSheetRowToRestaurant(row, index + 2); // +2 for header and 1-based indexing
        } catch (error) {
          console.warn(`Row ${index + 2} conversion failed:`, error);
          return null;
        }
      })
      .filter((restaurant): restaurant is Restaurant => restaurant !== null);
  } catch (error) {
    console.error("Failed to fetch restaurants from sheets:", error);
    throw error;
  }
}

/**
 * シートの行データをRestaurant型に変換
 *
 * ヘッダー順序（places_data_updater.pyのHEADERS['飲食店']と対応）:
 * プレイスID, 店舗名, 住所, 緯度, 経度, カテゴリ, カテゴリ詳細, 電話番号, 営業時間, 評価, レビュー数, 地区, GoogleマップURL, 最終更新日時
 */
function convertSheetRowToRestaurant(
  row: string[],
  rowNumber: number
): Restaurant {
  if (row.length < 13) {
    throw new Error(
      `Insufficient data in row ${rowNumber}: expected at least 13 columns, got ${row.length}`
    );
  }

  const [
    placeId = "",
    name = "",
    address = "",
    latStr = "",
    lngStr = "",
    category = "",
    categoryDetail = "",
    phone = "",
    openingHours = "",
    ratingStr = "",
    reviewCountStr = "",
    district = "", // googleMapsUrl - 使用しないためスキップ
    ,
    lastUpdated = "",
  ] = row;

  // 必須フィールドの検証
  if (!placeId || !name || !address) {
    throw new Error(`Missing required fields in row ${rowNumber}`);
  }

  // 座標の変換
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error(
      `Invalid coordinates in row ${rowNumber}: lat=${latStr}, lng=${lngStr}`
    );
  }

  // 料理ジャンルの変換
  const cuisineType = mapCategoryToCuisineType(category, categoryDetail);

  // 価格帯の推定（評価から）
  const priceRange = estimatePriceRange(category, categoryDetail);

  // 評価・レビュー数の変換
  const rating = ratingStr ? parseFloat(ratingStr) : undefined;
  const reviewCount = reviewCountStr ? parseInt(reviewCountStr, 10) : undefined;

  // 営業時間の変換
  const parsedOpeningHours = parseOpeningHours(openingHours);

  // 特徴の抽出
  const features = extractFeatures(categoryDetail, openingHours);

  return {
    id: placeId,
    name: name.trim(),
    description: `${district}にある${categoryDetail || category}`,
    cuisineType,
    priceRange,
    address: address.trim(),
    phone: phone.trim() || undefined,
    coordinates: { lat, lng },
    rating: rating && !isNaN(rating) ? rating : undefined,
    reviewCount: reviewCount && !isNaN(reviewCount) ? reviewCount : undefined,
    openingHours: parsedOpeningHours,
    features,
    lastUpdated: lastUpdated || new Date().toISOString().split("T")[0],
  };
}

/**
 * Google Places APIのカテゴリを料理ジャンルに変換
 */
function mapCategoryToCuisineType(
  category: string,
  categoryDetail: string
): CuisineType {
  const combined = `${category} ${categoryDetail}`.toLowerCase();

  if (combined.includes("寿司") || combined.includes("sushi")) return "寿司";
  if (combined.includes("海鮮") || combined.includes("魚")) return "海鮮";
  if (
    combined.includes("焼肉") ||
    combined.includes("焼鳥") ||
    combined.includes("ホルモン")
  )
    return "焼肉・焼鳥";
  if (combined.includes("ラーメン") || combined.includes("ramen"))
    return "ラーメン";
  if (
    combined.includes("そば") ||
    combined.includes("うどん") ||
    combined.includes("蕎麦")
  )
    return "そば・うどん";
  if (combined.includes("中華") || combined.includes("中国")) return "中華";
  if (
    combined.includes("イタリア") ||
    combined.includes("パスタ") ||
    combined.includes("ピザ")
  )
    return "イタリアン";
  if (combined.includes("フレンチ") || combined.includes("フランス"))
    return "フレンチ";
  if (
    combined.includes("カフェ") ||
    combined.includes("cafe") ||
    combined.includes("珈琲") ||
    combined.includes("コーヒー")
  )
    return "カフェ・喫茶店";
  if (
    combined.includes("バー") ||
    combined.includes("居酒屋") ||
    combined.includes("酒") ||
    combined.includes("スナック")
  )
    return "バー・居酒屋";
  if (
    combined.includes("ファスト") ||
    combined.includes("マクドナルド") ||
    combined.includes("ケンタ")
  )
    return "ファストフード";
  if (
    combined.includes("デザート") ||
    combined.includes("スイーツ") ||
    combined.includes("ケーキ") ||
    combined.includes("パン")
  )
    return "デザート・スイーツ";

  return "日本料理"; // デフォルト
}

/**
 * カテゴリから価格帯を推定
 */
function estimatePriceRange(
  category: string,
  categoryDetail: string
): PriceRange {
  const combined = `${category} ${categoryDetail}`.toLowerCase();

  if (
    combined.includes("高級") ||
    combined.includes("割烹") ||
    combined.includes("料亭")
  )
    return "3000円～";
  if (
    combined.includes("ファスト") ||
    combined.includes("カフェ") ||
    combined.includes("軽食")
  )
    return "～1000円";
  if (
    combined.includes("寿司") ||
    combined.includes("焼肉") ||
    combined.includes("海鮮")
  )
    return "2000-3000円";

  return "1000-2000円"; // デフォルト
}

/**
 * 営業時間文字列をパース
 */
function parseOpeningHours(openingHoursStr: string) {
  if (!openingHoursStr || openingHoursStr.trim() === "") {
    return [];
  }

  // 改行区切りの営業時間をパース
  const lines = openingHoursStr.split("\n").filter((line) => line.trim());

  return lines.map((line) => {
    const match = line.match(/^(.+?):\s*(.+)$/);
    if (!match) {
      return { day: line.trim(), open: "", close: "", isHoliday: true };
    }

    const [, day, hours] = match;

    if (
      hours.includes("定休") ||
      hours.includes("休み") ||
      hours.includes("closed")
    ) {
      return { day: day.trim(), open: "", close: "", isHoliday: true };
    }

    const timeMatch = hours.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
    if (timeMatch) {
      return {
        day: day.trim(),
        open: timeMatch[1],
        close: timeMatch[2],
        isHoliday: false,
      };
    }

    return { day: day.trim(), open: hours.trim(), close: "", isHoliday: false };
  });
}

/**
 * カテゴリや営業時間から特徴を抽出
 */
function extractFeatures(
  categoryDetail: string,
  openingHours: string
): string[] {
  const features: string[] = [];
  const combined = `${categoryDetail} ${openingHours}`.toLowerCase();

  if (combined.includes("駐車") || combined.includes("parking"))
    features.push("駐車場あり");
  if (combined.includes("禁煙") || combined.includes("non-smoking"))
    features.push("禁煙");
  if (combined.includes("個室")) features.push("個室あり");
  if (combined.includes("テラス")) features.push("テラス席");
  if (combined.includes("wifi") || combined.includes("wi-fi"))
    features.push("Wi-Fiあり");
  if (combined.includes("テイクアウト") || combined.includes("持ち帰り"))
    features.push("テイクアウト可");
  if (combined.includes("デリバリー") || combined.includes("配達"))
    features.push("デリバリー可");
  if (combined.includes("カード") || combined.includes("card"))
    features.push("クレジットカード可");
  if (combined.includes("予約")) features.push("予約可能");

  return features;
}

/**
 * その他のデータ取得関数（駐車場・公衆トイレ）
 */
export async function fetchParkingsFromSheets() {
  // 必要に応じて実装
}

export async function fetchToiletsFromSheets() {
  // 必要に応じて実装
}

/**
 * データ更新チェック（キャッシュ対応）
 */
export async function checkDataFreshness(): Promise<{
  lastUpdated: string;
  needsUpdate: boolean;
}> {
  try {
    const rows = await fetchSheetData(WORKSHEETS.RESTAURANTS);

    if (rows.length <= 1) {
      return { lastUpdated: new Date().toISOString(), needsUpdate: true };
    }

    // 最後の行の最終更新日時をチェック
    const lastRow = rows[rows.length - 1];
    const lastUpdated = lastRow[lastRow.length - 1] || "";

    // ローカルストレージと比較
    const cachedTimestamp = localStorage.getItem("restaurantDataTimestamp");
    const needsUpdate = !cachedTimestamp || cachedTimestamp !== lastUpdated;

    return { lastUpdated, needsUpdate };
  } catch (error) {
    console.error("Failed to check data freshness:", error);
    return { lastUpdated: new Date().toISOString(), needsUpdate: true };
  }
}
