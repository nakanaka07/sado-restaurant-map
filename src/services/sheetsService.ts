/**
 * Google Sheets API連携サービス
 * places_data_updater.pyで生成されたスプレッドシートからデータを取得
 */

import type {
  Restaurant,
  CuisineType,
  PriceRange,
} from "../types/restaurant.types";

// 環境変数から設定値を取得
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

// スプレッドシートのワークシート名（実際のデータベース構造に対応）
const WORKSHEETS = {
  RESTAURANTS: "restaurants", // 実際のシート名
  PARKINGS: "parkings", // 実際のシート名
  TOILETS: "toilets", // 実際のシート名
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
 * 実際のデータベース構造（43フィールド）に対応:
 * Place ID, 店舗名, 所在地, 緯度, 経度, 評価, レビュー数, 営業状況, 営業時間, 電話番号, ウェブサイト, 価格帯, 店舗タイプ, 店舗説明, テイクアウト, デリバリー, 店内飲食, 朝食提供, 昼食提供, 夕食提供, ビール提供, ワイン提供, カクテル提供, コーヒー提供, ベジタリアン対応, 子供向け対応, デザート提供, 屋外席, 音楽再生, トイレ, 駐車場, アクセシビリティ, 子供連れ歓迎, ペット同伴可, グループ利用, スポーツ観戦, GoogleマップURL, 地区, 佐渡市内外, 取得方法, エディトリアル要約, 最終更新日時
 */
function convertSheetRowToRestaurant(
  row: string[],
  rowNumber: number
): Restaurant {
  if (row.length < 15) {
    throw new Error(
      `Insufficient data in row ${rowNumber}: expected at least 15 columns, got ${row.length}`
    );
  }

  const [
    placeId = "",
    name = "",
    address = "",
    latStr = "",
    lngStr = "",
    ratingStr = "",
    reviewCountStr = "", // businessStatus（未使用）
    ,
    openingHours = "",
    phone = "", // website（未使用）
    ,
    priceLevel = "",
    storeType = "",
    storeDescription = "",
    takeout = "",
    delivery = "",
    dineIn = "",
    breakfast = "",
    lunch = "",
    dinner = "",
    beer = "",
    wine = "",
    cocktails = "",
    coffee = "",
    vegetarian = "",
    kidsMenu = "",
    dessert = "",
    outdoor = "",
    liveMusic = "",
    restroom = "",
    parking = "",
    accessibility = "",
    goodForKids = "",
    allowsDogs = "",
    goodForGroups = "",
    goodForWatchingSports = "", // googleMapsUrl（未使用）
    ,
    district = "", // locationCategory（未使用） // acquisitionMethod（未使用）
    ,
    ,
    editorialSummary = "",
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

  // 料理ジャンルの変換（店舗タイプとエディトリアル要約から推定）
  const cuisineType = mapStoreTypeToCuisineType(
    storeType,
    storeDescription || editorialSummary
  );

  // 価格帯の変換（Google Places API価格レベルから）
  const priceRange = mapPriceLevelToPriceRange(priceLevel, storeType);

  // 評価・レビュー数の変換
  const rating = ratingStr ? parseFloat(ratingStr) : undefined;
  const reviewCount = reviewCountStr ? parseInt(reviewCountStr, 10) : undefined;

  // 営業時間の変換
  const parsedOpeningHours = parseOpeningHours(openingHours);

  // 特徴の抽出（Places APIの詳細データから）
  const features = extractFeaturesFromPlacesData({
    storeType,
    takeout,
    delivery,
    dineIn,
    breakfast,
    lunch,
    dinner,
    beer,
    wine,
    cocktails,
    coffee,
    vegetarian,
    kidsMenu,
    dessert,
    outdoor,
    liveMusic,
    restroom,
    parking,
    accessibility,
    goodForKids,
    allowsDogs,
    goodForGroups,
    goodForWatchingSports,
  });

  return {
    id: placeId,
    name: name.trim(),
    description:
      editorialSummary || storeDescription || `${district}にある${storeType}`,
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
 * Google Places APIの店舗タイプを料理ジャンルに変換
 */
function mapStoreTypeToCuisineType(
  storeType: string,
  description: string
): CuisineType {
  const combined = `${storeType} ${description}`.toLowerCase();

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
    combined.includes("コーヒー") ||
    combined.includes("パン屋")
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
 * Google Places APIの価格レベルを価格帯に変換
 */
function mapPriceLevelToPriceRange(
  priceLevel: string,
  storeType: string
): PriceRange {
  const priceLevelNum = parseInt(priceLevel, 10);

  // Places API価格レベル: 0=無料, 1=安価, 2=普通, 3=高価, 4=非常に高価
  if (!isNaN(priceLevelNum)) {
    switch (priceLevelNum) {
      case 0:
      case 1:
        return "～1000円";
      case 2:
        return "1000-2000円";
      case 3:
        return "2000-3000円";
      case 4:
        return "3000円～";
    }
  }

  // フォールバック: 店舗タイプから推定
  const typeStr = storeType.toLowerCase();
  if (
    typeStr.includes("高級") ||
    typeStr.includes("割烹") ||
    typeStr.includes("料亭")
  )
    return "3000円～";
  if (
    typeStr.includes("ファスト") ||
    typeStr.includes("カフェ") ||
    typeStr.includes("軽食") ||
    typeStr.includes("パン屋")
  )
    return "～1000円";
  if (
    typeStr.includes("寿司") ||
    typeStr.includes("焼肉") ||
    typeStr.includes("海鮮")
  )
    return "2000-3000円";

  return "1000-2000円"; // デフォルト
}

/**
 * Places APIの詳細データから特徴を抽出
 */
function extractFeaturesFromPlacesData(data: {
  storeType: string;
  takeout: string;
  delivery: string;
  dineIn: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  beer: string;
  wine: string;
  cocktails: string;
  coffee: string;
  vegetarian: string;
  kidsMenu: string;
  dessert: string;
  outdoor: string;
  liveMusic: string;
  restroom: string;
  parking: string;
  accessibility: string;
  goodForKids: string;
  allowsDogs: string;
  goodForGroups: string;
  goodForWatchingSports: string;
}): string[] {
  const features: string[] = [];

  // サービス形態
  if (data.takeout === "true" || data.takeout === "可")
    features.push("テイクアウト可");
  if (data.delivery === "true" || data.delivery === "可")
    features.push("デリバリー可");
  if (data.dineIn === "true" || data.dineIn === "可")
    features.push("店内飲食可");

  // 食事時間帯
  if (data.breakfast === "true" || data.breakfast === "可")
    features.push("朝食提供");
  if (data.lunch === "true" || data.lunch === "可") features.push("昼食提供");
  if (data.dinner === "true" || data.dinner === "可") features.push("夕食提供");

  // 飲み物
  if (data.beer === "true" || data.beer === "可") features.push("ビール提供");
  if (data.wine === "true" || data.wine === "可") features.push("ワイン提供");
  if (data.cocktails === "true" || data.cocktails === "可")
    features.push("カクテル提供");
  if (data.coffee === "true" || data.coffee === "可")
    features.push("コーヒー提供");

  // 特別対応
  if (data.vegetarian === "true" || data.vegetarian === "可")
    features.push("ベジタリアン対応");
  if (data.kidsMenu === "true" || data.kidsMenu === "可")
    features.push("子供向けメニュー");
  if (data.dessert === "true" || data.dessert === "可")
    features.push("デザート提供");

  // 設備・環境
  if (data.outdoor === "true" || data.outdoor === "可") features.push("屋外席");
  if (data.liveMusic === "true" || data.liveMusic === "可")
    features.push("音楽あり");
  if (data.restroom === "true" || data.restroom === "可")
    features.push("トイレあり");
  if (data.parking === "true" || data.parking === "可")
    features.push("駐車場あり");
  if (data.accessibility === "true" || data.accessibility === "可")
    features.push("バリアフリー");

  // 顧客対応
  if (data.goodForKids === "true" || data.goodForKids === "可")
    features.push("子供連れ歓迎");
  if (data.allowsDogs === "true" || data.allowsDogs === "可")
    features.push("ペット同伴可");
  if (data.goodForGroups === "true" || data.goodForGroups === "可")
    features.push("グループ利用可");
  if (
    data.goodForWatchingSports === "true" ||
    data.goodForWatchingSports === "可"
  )
    features.push("スポーツ観戦可");

  // 店舗タイプから追加特徴を抽出
  const storeTypeFeatures = extractFeaturesFromStoreType(data.storeType);
  features.push(...storeTypeFeatures);

  // 重複を除去して返す
  return [...new Set(features)];
}

/**
 * 店舗タイプから特徴を抽出（従来機能の補完）
 */
function extractFeaturesFromStoreType(storeType: string): string[] {
  const features: string[] = [];
  const typeStr = storeType.toLowerCase();

  if (typeStr.includes("禁煙")) features.push("禁煙");
  if (typeStr.includes("個室")) features.push("個室あり");
  if (typeStr.includes("テラス")) features.push("テラス席");
  if (typeStr.includes("wifi") || typeStr.includes("wi-fi"))
    features.push("Wi-Fiあり");
  if (typeStr.includes("カード") || typeStr.includes("card"))
    features.push("クレジットカード可");
  if (typeStr.includes("予約")) features.push("予約可能");

  return features;
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
 * 駐車場データを取得（将来実装用）
 */
export async function fetchParkingsFromSheets(): Promise<any[]> {
  try {
    const rows = await fetchSheetData(WORKSHEETS.PARKINGS);
    // 将来的に駐車場データの変換処理を実装
    return rows.slice(1); // ヘッダーを除く
  } catch (error) {
    console.warn("駐車場データの取得に失敗しました:", error);
    return [];
  }
}

/**
 * 公衆トイレデータを取得（将来実装用）
 */
export async function fetchToiletsFromSheets(): Promise<any[]> {
  try {
    const rows = await fetchSheetData(WORKSHEETS.TOILETS);
    // 将来的に公衆トイレデータの変換処理を実装
    return rows.slice(1); // ヘッダーを除く
  } catch (error) {
    console.warn("公衆トイレデータの取得に失敗しました:", error);
    return [];
  }
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

    // 最後の行の最終更新日時をチェック（43番目のフィールド）
    const lastRow = rows[rows.length - 1];
    const lastUpdated = lastRow[42] || ""; // 最終更新日時フィールド

    // ローカルストレージと比較
    const cachedTimestamp = localStorage.getItem("restaurantDataTimestamp");
    const needsUpdate = !cachedTimestamp || cachedTimestamp !== lastUpdated;

    return { lastUpdated, needsUpdate };
  } catch (error) {
    console.error("Failed to check data freshness:", error);
    return { lastUpdated: new Date().toISOString(), needsUpdate: true };
  }
}
