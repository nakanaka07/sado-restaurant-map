/**
 * Google Sheets API連携サービス
 * places_data_updater.pyで生成されたスプレッドシートからデータを取得
 */

import type {
  CuisineType,
  MapPoint,
  Parking,
  PriceRange,
  Restaurant,
  RestaurantCategory,
  SadoDistrict,
  Toilet,
} from "@/types";
import { getDistrictFromAddress } from "@/utils";
import { maskApiKey } from "@/utils/securityUtils";

// 環境変数から設定値を取得
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

// スプレッドシートのワークシート名（実際のデータベース構造に対応）
const WORKSHEETS = {
  RESTAURANTS: "restaurants", // 飲食店データの実際のシート名
  PARKINGS: "parkings", // 駐車場データの実際のシート名
  TOILETS: "toilets", // トイレデータの実際のシート名
} as const;

// 佐渡の地区分類（places_data_updater.pyと対応）
// restaurant.types.tsからインポートして使用

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
  public readonly status: number;

  constructor(
    message: string,
    status: number = 500,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = "SheetsApiError";
    this.status = status;
  }
}

/**
 * Google Sheets APIレスポンスの型定義
 */
interface SheetsApiResponse {
  values?: string[][];
}

/**
 * Google Sheets APIからデータを取得（v2.0 - 認知的複雑度削減版）
 */
async function fetchSheetData(worksheetName: string): Promise<string[][]> {
  validateApiConfiguration();

  const url = buildSheetsApiUrl(worksheetName);
  logApiRequest(url);

  const response = await makeApiRequest(url);
  const data = await handleApiResponse(response, worksheetName);

  return data;
}

/**
 * API設定の検証
 */
function validateApiConfiguration(): void {
  if (!SPREADSHEET_ID || !API_KEY) {
    throw new SheetsApiError(
      "Google Sheets API設定が不完全です。VITE_SPREADSHEET_IDとVITE_GOOGLE_SHEETS_API_KEYを設定してください。",
      400
    );
  }
}

/**
 * Sheets API URLの構築
 */
function buildSheetsApiUrl(worksheetName: string): string {
  const range = `${worksheetName}!A:Z`;
  return `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
}

/**
 * APIリクエストのログ出力（機密情報マスキング済み）
 */
function logApiRequest(url: string): void {
  const apiKey = API_KEY || "undefined";
  const maskedUrl = url.replace(/key=[^&]+/, `key=${maskApiKey(apiKey)}`);
  console.log(`📡 Google Sheets APIリクエスト: ${maskedUrl}`);
}

/**
 * APIリクエストの実行
 */
async function makeApiRequest(url: string): Promise<Response> {
  const response = await fetch(url);

  if (!response.ok) {
    await handleApiError(response);
  }

  return response;
}

/**
 * APIエラーの処理
 */
async function handleApiError(response: Response): Promise<never> {
  let errorDetails = `${response.status} ${response.statusText}`;

  if (response.status === 403) {
    errorDetails = await handle403Error(response);
  }

  throw new SheetsApiError(
    `Google Sheets API request failed: ${errorDetails}`,
    response.status
  );
}

/**
 * 403エラーの詳細処理
 */
async function handle403Error(response: Response): Promise<string> {
  try {
    const errorBody = await response.text();
    console.error("🔒 403エラー詳細:", errorBody);

    if (errorBody.includes("permission")) {
      return "スプレッドシートへのアクセス権限がありません。スプレッドシートを「リンクを知っている全員が閲覧可能」に設定してください。";
    } else if (errorBody.includes("API key")) {
      return "APIキーが無効または制限されています。Google Cloud ConsoleでAPIキーの設定を確認してください。";
    }

    return `403 Forbidden: ${errorBody}`;
  } catch (e) {
    console.warn("エラーレスポンスの解析に失敗:", e);
    return "403 Forbidden: アクセス権限エラー";
  }
}

/**
 * APIレスポンスの処理と検証
 */
async function handleApiResponse(
  response: Response,
  worksheetName: string
): Promise<string[][]> {
  const data = (await response.json()) as SheetsApiResponse;

  return validateAndExtractData(data, worksheetName);
}

/**
 * レスポンスデータの検証と抽出
 */
function validateAndExtractData(
  data: SheetsApiResponse,
  worksheetName: string
): string[][] {
  if (!data || typeof data !== "object") {
    throw new SheetsApiError(
      "Invalid response format from Google Sheets API: response is not an object",
      422
    );
  }

  if (!data.values) {
    console.warn(`Worksheet '${worksheetName}' has no data`);
    return [];
  }

  if (!Array.isArray(data.values)) {
    throw new SheetsApiError(
      "Invalid response format from Google Sheets API: values is not an array",
      422
    );
  }

  if (!data.values.every(row => Array.isArray(row))) {
    throw new SheetsApiError(
      "Invalid response format from Google Sheets API: some rows are not arrays",
      422
    );
  }

  return data.values;
}

/**
 * Restaurant データの型安全性を検証
 */
function validateRestaurantData(data: unknown): data is Restaurant {
  if (!data || typeof data !== "object") {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // 必須プロパティの検証
  const requiredStringFields = [
    "id",
    "name",
    "address",
    "district",
    "cuisineType",
    "priceRange",
  ];
  for (const field of requiredStringFields) {
    if (!obj[field] || typeof obj[field] !== "string") {
      console.warn(`Missing or invalid required field: ${field}`);
      return false;
    }
  }

  // type プロパティの検証
  if (obj.type !== "restaurant") {
    console.warn(
      `Invalid type property: expected 'restaurant', got '${String(obj.type)}'`
    );
    return false;
  }

  // coordinates の検証
  if (!obj.coordinates || typeof obj.coordinates !== "object") {
    console.warn("Missing or invalid coordinates");
    return false;
  }

  const coords = obj.coordinates as Record<string, unknown>;
  if (typeof coords.lat !== "number" || typeof coords.lng !== "number") {
    console.warn("Invalid coordinate values");
    return false;
  }

  if (isNaN(coords.lat) || isNaN(coords.lng)) {
    console.warn("NaN coordinate values");
    return false;
  }

  // features の検証
  if (!Array.isArray(obj.features)) {
    console.warn("Features must be an array");
    return false;
  }

  // openingHours の検証
  if (!Array.isArray(obj.openingHours)) {
    console.warn("OpeningHours must be an array");
    return false;
  }

  return true;
}

/**
 * 飲食店データを取得してRestaurant型に変換
 */
export async function fetchRestaurantsFromSheets(): Promise<Restaurant[]> {
  try {
    const rows = await fetchSheetData(WORKSHEETS.RESTAURANTS);

    // 厳格なデータ型検証
    if (!Array.isArray(rows)) {
      throw new SheetsApiError("Invalid data format: expected array", 400);
    }

    if (rows.length === 0) {
      console.warn("Google Sheets returned empty data");
      return [];
    }

    // ヘッダー行をスキップ
    const dataRows = rows.slice(1);

    // スプレッドシート構造の確認用ログ（最初の3行のみ）
    console.log("📊 スプレッドシートデータ構造確認:");
    if (rows.length > 0) {
      console.log("ヘッダー行:", rows[0]);
      console.log("サンプルデータ行（最大3行）:");
      dataRows.slice(0, 3).forEach((row, index) => {
        console.log(`行${index + 2}:`, {
          columns: row.length,
          last5Columns: row.slice(-5), // 最後の5列
          column41_AO: row[40], // 41列目（AO列）
        });
      });
    }

    // 空データの場合は空配列を返す
    if (dataRows.length === 0) {
      console.warn("No restaurant data rows found after header");
      return [];
    }

    // データ行の形式検証
    if (!dataRows.every(row => Array.isArray(row))) {
      throw new SheetsApiError(
        "Invalid data format: each row must be an array",
        400
      );
    }

    const validRestaurants = dataRows
      .map((row, index) => {
        try {
          const restaurant = convertSheetRowToRestaurant(row, index + 2);

          // 厳格な型検証
          if (!validateRestaurantData(restaurant)) {
            throw new Error("Restaurant data validation failed");
          }

          return restaurant;
        } catch (error) {
          // より詳細なログ出力
          console.warn(`行 ${index + 2} 変換失敗 (${row.length}列):`, {
            error: error instanceof Error ? error.message : error,
            rowData: row.slice(0, 5), // 最初の5列のみ表示（デバッグ用）
            totalColumns: row.length,
          });
          return null;
        }
      })
      .filter((restaurant): restaurant is Restaurant => restaurant !== null);

    // 最終的なデータ検証
    if (validRestaurants.length === 0 && dataRows.length > 0) {
      throw new SheetsApiError("No valid restaurant data could be parsed", 422);
    }

    console.log(
      `✅ ${validRestaurants.length}/${dataRows.length} 件の有効な飲食店データを変換しました`
    );
    return validRestaurants;
  } catch (error) {
    console.error("Failed to fetch restaurants from sheets:", error);

    // エラーを適切にrejectする
    if (error instanceof SheetsApiError) {
      throw error;
    }

    throw new SheetsApiError(
      `Restaurant data fetch failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
}

/**
 * シートの行データをRestaurant型に変換
 *
 * 実際のデータベース構造（41フィールド）に対応:
 * Place ID, 店舗名, 所在地, 緯度, 経度, 評価, レビュー数, 営業状況, 営業時間, 電話番号, ウェブサイト, 価格帯, 店舗タイプ, 店舗説明, テイクアウト, デリバリー, 店内飲食, カーブサイドピックアップ, 予約可能, 朝食提供, 昼食提供, 夕食提供, ビール提供, ワイン提供, カクテル提供, コーヒー提供, ...(27-40列目は空), 最終更新日（AO列）
 */
function convertSheetRowToRestaurant(
  row: string[],
  rowNumber: number
): Restaurant {
  // 最小限必要なフィールド数を5に減らし、その他はオプションとして扱う
  if (row.length < 5) {
    throw new Error(
      `Insufficient data in row ${rowNumber}: expected at least 5 columns (id, name, address, lat, lng), got ${row.length}`
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
    phone = "",
    website = "",
    priceLevel = "",
    storeType = "",
    storeDescription = "",
    takeout = "",
    delivery = "",
    dineIn = "",
    curbsidePickup = "",
    reservable = "",
    breakfast = "",
    lunch = "",
    dinner = "",
    beer = "",
    wine = "",
    cocktails = "",
    coffee = "",
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    // 空のカラム（27-40列目）をスキップ
    lastUpdatedFromSheet = "", // 41列目（AO列）: 実際の最終更新日
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

  // 料理ジャンルの変換（店舗名、店舗タイプ、説明から推定）
  const cuisineType = mapStoreTypeToCuisineType(
    `${name} ${storeType}`, // 店舗名も含めて分類
    storeDescription
  );

  // 価格帯の変換（Google Places API価格レベルから）
  const priceRange = mapPriceLevelToPriceRange(priceLevel, storeType);

  // 評価・レビュー数の変換
  const rating = ratingStr ? parseFloat(ratingStr) : undefined;
  const reviewCount = reviewCountStr ? parseInt(reviewCountStr, 10) : undefined;

  // 営業時間の変換
  const parsedOpeningHours = parseOpeningHours(openingHours);

  // 地区を住所から抽出
  const district = getDistrictFromAddress(address);

  // 特徴の抽出（Places APIの詳細データから）
  const features = extractFeaturesFromPlacesData({
    storeType,
    takeout,
    delivery,
    dineIn,
    curbsidePickup,
    reservable,
    breakfast,
    lunch,
    dinner,
    beer,
    wine,
    cocktails,
    coffee,
  });

  // 新機能: Google Maps URLの生成
  const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(name)}/@${lat},${lng},17z`;

  // 新機能: メインカテゴリーの判定
  const mainCategory = mapCuisineTypeToCategory(cuisineType);

  // 新機能: 営業状況の判定（現在はデフォルトで不明）
  // 実際のリアルタイム判定はMapInfoWindowで実装

  // 新機能: 詳細営業時間の整理
  // UI側で動的に生成

  const phoneValue = phone?.trim();
  const ratingValue = rating && !isNaN(rating) ? rating : null;
  const reviewCountValue =
    reviewCount && !isNaN(reviewCount) ? reviewCount : null;

  // 更新日の設定（スプレッドシートの更新日データまたは現在日時）
  const actualLastUpdated =
    lastUpdatedFromSheet?.trim() || new Date().toISOString().split("T")[0];

  // デバッグ: lastUpdated設定の確認
  console.log("🗓️ lastUpdated設定デバッグ:", {
    restaurantName: name.trim(),
    lastUpdatedFromSheet,
    lastUpdatedFromSheetTrimmed: lastUpdatedFromSheet?.trim(),
    hasLastUpdatedFromSheet: !!lastUpdatedFromSheet?.trim(),
    actualLastUpdated,
    rowLength: row.length,
    columnIndex41_AO: row[40], // 41列目（AO列、0ベースで40）
  });

  const baseRestaurant = {
    id: placeId,
    type: "restaurant" as const,
    name: name.trim(),
    description: storeDescription || `${district}にある${storeType}`,
    cuisineType,
    priceRange,
    district,
    address: address.trim(),
    coordinates: { lat, lng },
    openingHours: parsedOpeningHours,
    features,
    lastUpdated: actualLastUpdated,
    // 新機能フィールド
    lastDataUpdate: new Date().toISOString().split("T")[0], // データ処理日は別途記録
    mainCategory,
    googleMapsUrl,
  };

  // 条件付きプロパティを追加（exactOptionalPropertyTypes対応）
  return {
    ...baseRestaurant,
    ...(phoneValue && { phone: phoneValue }),
    ...(ratingValue !== null && { rating: ratingValue }),
    ...(reviewCountValue !== null && { reviewCount: reviewCountValue }),
    ...(website.trim() && { website: website.trim() }),
  };
}

// 料理ジャンル判定用の正規表現パターン（パフォーマンス向上のため事前コンパイル）
const CUISINE_PATTERNS = {
  sushi: /(寿司|すし|sushi|回転寿司|握り|にぎり)/,
  seafood:
    /(海鮮|魚|刺身|鮮魚|漁師|海の家|魚介|あじ|いわし|かに|蟹|えび|海老|たこ|蛸|いか|烏賊|まぐろ|鮪|さば|鯖)/,
  yakiniku:
    /(焼肉|焼鳥|ホルモン|串焼|炭火|bbq|バーベキュー|やきとり|やきにく|鶏|チキン|beef|牛)/,
  ramen:
    /(ラーメン|らーめん|ramen|つけ麺|担々麺|味噌|醤油|豚骨|塩ラーメン|中華そば|二郎)/,
  noodles: /(そば|蕎麦|うどん|手打|十割|二八|讃岐|きしめん|ひやむぎ|そうめん)/,
  chinese:
    /(中華|中国|餃子|チャーハン|炒飯|麻婆|点心|北京|四川|上海|広東|台湾|小籠包)/,
  italian:
    /(イタリア|パスタ|ピザ|ピッツァ|リストランテ|トラットリア|スパゲッティ|italian)/,
  french: /(フレンチ|フランス|ビストロ|french|西洋料理|洋食)/,
  curry:
    /(カレー|curry|インド|タイ|エスニック|スパイス|ナン|タンドール|ココナッツ)/,
  steak: /(ステーキ|steak|ハンバーグ|オムライス|グリル|beef|pork)/,
  dessert:
    /(デザート|スイーツ|ケーキ|アイス|sweet|dessert|洋菓子|和菓子|だんご|まんじゅう|どら焼き|大福|餅|パン屋|パン|ベーカリー|bread|パティスリー)/,
  cafe: /(カフェ|cafe|珈琲|コーヒー|coffee|喫茶)/,
  bar: /(バー|bar|居酒屋|酒|スナック|パブ|pub|飲み屋|ビアガーデン|beer|wine)/,
  fastFood:
    /(ファスト|マクドナルド|ケンタ|モス|サブウェイ|fast|burger|ハンバーガー)/,
} as const;

/**
 * 料理ジャンル判定のヘルパー関数
 */
function checkCuisinePattern(combined: string, pattern: RegExp): boolean {
  return pattern.test(combined);
}

/**
 * 基本的な料理ジャンルの判定
 */
function mapBasicCuisineTypes(combined: string): CuisineType | null {
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.sushi)) return "寿司";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.seafood)) return "海鮮";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.yakiniku))
    return "焼肉・焼鳥";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.ramen)) return "ラーメン";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.noodles))
    return "そば・うどん";
  return null;
}

/**
 * 特別な料理ジャンルの判定
 */
function mapSpecialtyCuisineTypes(combined: string): CuisineType | null {
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.chinese)) return "中華";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.italian))
    return "イタリアン";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.french)) return "フレンチ";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.curry))
    return "カレー・エスニック";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.steak))
    return "ステーキ・洋食";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.fastFood))
    return "ファストフード";
  return null;
}

/**
 * デザート・ドリンク系の判定
 */
function mapDessertAndDrinkTypes(combined: string): CuisineType | null {
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.dessert))
    return "デザート・スイーツ";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.cafe))
    return "カフェ・喫茶店";
  if (checkCuisinePattern(combined, CUISINE_PATTERNS.bar))
    return "バー・居酒屋";
  return null;
}

/**
 * Google Places APIの店舗タイプを料理ジャンルに変換 (v3.0 - 認知的複雑度削減版)
 * 店舗名も分析対象に含めて、より精密な分類を実現
 */
function mapStoreTypeToCuisineType(
  storeTypeWithName: string,
  description: string
): CuisineType {
  const combined = `${storeTypeWithName} ${description}`.toLowerCase();

  return (
    mapBasicCuisineTypes(combined) ||
    mapSpecialtyCuisineTypes(combined) ||
    mapDessertAndDrinkTypes(combined) ||
    mapAdditionalFoodTypes(combined) ||
    "その他"
  );
}

/**
 * 追加の料理ジャンルの判定（弁当・和食・レストラン等）
 */
function mapAdditionalFoodTypes(combined: string): CuisineType | null {
  // 🍱 弁当・テイクアウト
  if (/弁当|bento|テイクアウト|持ち帰り|惣菜|お惣菜/.test(combined)) {
    return "弁当・テイクアウト";
  }

  // 🍱 和食・定食・食堂
  if (
    /和食|定食|食堂|日本料理|割烹|料亭|懐石|会席|てんぷら|天ぷら|とんかつ|カツ|丼|どんぶり/.test(
      combined
    )
  ) {
    return "日本料理";
  }

  // 🏪 レストラン（ジャンル不明）
  if (
    /レストラン|restaurant|ダイニング|ビュッフェ|バイキング|食べ放題/.test(
      combined
    )
  ) {
    return "レストラン";
  }

  return null;
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
 * Places APIの詳細データから特徴を抽出（v2.0 - 認知的複雑度削減版）
 */
function extractFeaturesFromPlacesData(data: {
  storeType: string;
  takeout: string;
  delivery: string;
  dineIn: string;
  curbsidePickup?: string;
  reservable?: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  beer: string;
  wine: string;
  cocktails: string;
  coffee: string;
  vegetarian?: string;
  kidsMenu?: string;
  dessert?: string;
  outdoor?: string;
  liveMusic?: string;
  restroom?: string;
  parking?: string;
  accessibility?: string;
  goodForKids?: string;
  allowsDogs?: string;
  goodForGroups?: string;
  goodForWatchingSports?: string;
}): string[] {
  const features: string[] = [];

  // 各カテゴリの特徴を抽出
  features.push(...extractServiceFeatures(data));
  features.push(...extractTimeFeatures(data));
  features.push(...extractDrinkFeatures(data));
  features.push(...extractAccessibilityFeatures(data));
  features.push(...extractFeaturesFromStoreType(data.storeType));

  return features;
}

/**
 * サービス形態の特徴を抽出
 */
function extractServiceFeatures(data: {
  takeout: string;
  delivery: string;
  dineIn: string;
  curbsidePickup?: string;
  reservable?: string;
}): string[] {
  const features: string[] = [];

  if (data.takeout === "true" || data.takeout === "可")
    features.push("テイクアウト可");
  if (data.delivery === "true" || data.delivery === "可")
    features.push("デリバリー可");
  if (data.dineIn === "true" || data.dineIn === "可")
    features.push("店内飲食可");
  if (data.curbsidePickup === "true" || data.curbsidePickup === "可")
    features.push("カーブサイドピックアップ可");
  if (data.reservable === "true" || data.reservable === "可")
    features.push("予約可");

  return features;
}

/**
 * 営業時間帯の特徴を抽出
 */
function extractTimeFeatures(data: {
  breakfast: string;
  lunch: string;
  dinner: string;
}): string[] {
  const features: string[] = [];

  if (data.breakfast === "true" || data.breakfast === "提供")
    features.push("朝食提供");
  if (data.lunch === "true" || data.lunch === "提供") features.push("昼食提供");
  if (data.dinner === "true" || data.dinner === "提供")
    features.push("夕食提供");

  return features;
}

/**
 * 飲み物・アルコールの特徴を抽出
 */
function extractDrinkFeatures(data: {
  beer: string;
  wine: string;
  cocktails: string;
  coffee: string;
}): string[] {
  const features: string[] = [];

  if (data.beer === "true" || data.beer === "提供") features.push("ビール提供");
  if (data.wine === "true" || data.wine === "提供") features.push("ワイン提供");
  if (data.cocktails === "true" || data.cocktails === "提供")
    features.push("カクテル提供");
  if (data.coffee === "true" || data.coffee === "提供")
    features.push("コーヒー提供");

  return features;
}

/**
 * アクセシビリティ・その他の特徴を抽出
 */
function extractAccessibilityFeatures(data: {
  vegetarian?: string;
  kidsMenu?: string;
  dessert?: string;
  outdoor?: string;
  liveMusic?: string;
  restroom?: string;
  parking?: string;
  accessibility?: string;
  goodForKids?: string;
  allowsDogs?: string;
  goodForGroups?: string;
  goodForWatchingSports?: string;
}): string[] {
  const features: string[] = [];

  if (data.vegetarian === "true" || data.vegetarian === "対応")
    features.push("ベジタリアン対応");
  if (data.kidsMenu === "true" || data.kidsMenu === "あり")
    features.push("キッズメニューあり");
  if (data.dessert === "true" || data.dessert === "提供")
    features.push("デザート提供");
  if (data.outdoor === "true" || data.outdoor === "あり")
    features.push("屋外席あり");
  if (data.liveMusic === "true" || data.liveMusic === "あり")
    features.push("ライブミュージック");
  if (data.restroom === "true" || data.restroom === "あり")
    features.push("お手洗いあり");
  if (data.parking === "true" || data.parking === "あり")
    features.push("駐車場あり");
  if (data.accessibility === "true" || data.accessibility === "対応")
    features.push("車椅子対応");
  if (data.goodForKids === "true" || data.goodForKids === "対応")
    features.push("子供連れ歓迎");
  if (data.allowsDogs === "true" || data.allowsDogs === "可")
    features.push("ペット可");
  if (data.goodForGroups === "true" || data.goodForGroups === "対応")
    features.push("大人数対応");
  if (
    data.goodForWatchingSports === "true" ||
    data.goodForWatchingSports === "対応"
  )
    features.push("スポーツ観戦可");

  return features;
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
  const lines = openingHoursStr.split("\n").filter(line => line.trim());

  // 正規表現を事前にコンパイル
  const dayTimePattern = /^(.+?):\s*(.+)$/;
  const timeRangePattern = /(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/;

  return lines.map(line => {
    const match = dayTimePattern.exec(line);
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

    const timeMatch = timeRangePattern.exec(hours);
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
 * 駐車場データを取得してParking型に変換
 */
export async function fetchParkingsFromSheets(): Promise<Parking[]> {
  try {
    const rows = await fetchSheetData(WORKSHEETS.PARKINGS);

    // 厳格なデータ型検証
    if (!Array.isArray(rows)) {
      throw new SheetsApiError(
        "Invalid parking data format: expected array",
        400
      );
    }

    if (rows.length === 0) {
      console.warn("Google Sheets returned empty parking data");
      return [];
    }

    // ヘッダー行をスキップ
    const dataRows = rows.slice(1);

    // 空データの場合は空配列を返す
    if (dataRows.length === 0) {
      console.warn("No parking data rows found after header");
      return [];
    }

    const validParkings = dataRows
      .map((row, index) => {
        try {
          const parking = convertSheetRowToParking(row, index + 2);

          // type プロパティが正しく設定されているか確認
          if (parking.type !== "parking") {
            throw new Error('Parking type property must be "parking"');
          }

          return parking;
        } catch (error) {
          console.warn(`駐車場データ行 ${index + 2} 変換失敗:`, {
            error: error instanceof Error ? error.message : error,
            rowData: row.slice(0, 5),
            totalColumns: row.length,
          });
          return null;
        }
      })
      .filter((parking): parking is Parking => parking !== null);

    console.log(
      `✅ ${validParkings.length}/${dataRows.length} 件の有効な駐車場データを変換しました`
    );
    return validParkings;
  } catch (error) {
    console.warn("駐車場データの取得に失敗しました:", error);

    if (error instanceof SheetsApiError) {
      throw error;
    }

    // エラー時は空配列を返す（データ不足による完全な失敗を防ぐ）
    return [];
  }
}

/**
 * 公衆トイレデータを取得してToilet型に変換
 */
export async function fetchToiletsFromSheets(): Promise<Toilet[]> {
  try {
    const rows = await fetchSheetData(WORKSHEETS.TOILETS);

    // 厳格なデータ型検証
    if (!Array.isArray(rows)) {
      throw new SheetsApiError(
        "Invalid toilet data format: expected array",
        400
      );
    }

    if (rows.length === 0) {
      console.warn("Google Sheets returned empty toilet data");
      return [];
    }

    // ヘッダー行をスキップ
    const dataRows = rows.slice(1);

    // 空データの場合は空配列を返す
    if (dataRows.length === 0) {
      console.warn("No toilet data rows found after header");
      return [];
    }

    const validToilets = dataRows
      .map((row, index) => {
        try {
          const toilet = convertSheetRowToToilet(row, index + 2);

          // type プロパティが正しく設定されているか確認
          if (toilet.type !== "toilet") {
            throw new Error('Toilet type property must be "toilet"');
          }

          return toilet;
        } catch (error) {
          console.warn(`トイレデータ行 ${index + 2} 変換失敗:`, {
            error: error instanceof Error ? error.message : error,
            rowData: row.slice(0, 5),
            totalColumns: row.length,
          });
          return null;
        }
      })
      .filter((toilet): toilet is Toilet => toilet !== null);

    console.log(
      `✅ ${validToilets.length}/${dataRows.length} 件の有効なトイレデータを変換しました`
    );
    return validToilets;
  } catch (error) {
    console.warn("公衆トイレデータの取得に失敗しました:", error);

    if (error instanceof SheetsApiError) {
      throw error;
    }

    // エラー時は空配列を返す（データ不足による完全な失敗を防ぐ）
    return [];
  }
}

/**
 * 全てのマップポイント（飲食店・駐車場・トイレ）を統合して取得
 */
export async function fetchAllMapPoints(): Promise<MapPoint[]> {
  try {
    // Promise.allSettledを使用して、一部のAPIが失敗しても他の結果を取得
    const [restaurantResult, parkingResult, toiletResult] =
      await Promise.allSettled([
        fetchRestaurantsFromSheets(),
        fetchParkingsFromSheets(),
        fetchToiletsFromSheets(),
      ]);

    // 成功した結果のみを取得
    const restaurants =
      restaurantResult.status === "fulfilled" ? restaurantResult.value : [];
    const parkings =
      parkingResult.status === "fulfilled" ? parkingResult.value : [];
    const toilets =
      toiletResult.status === "fulfilled" ? toiletResult.value : [];

    // エラーログを出力（デバッグ用）
    if (restaurantResult.status === "rejected") {
      console.warn(
        "レストランデータの取得に失敗しました:",
        restaurantResult.reason
      );
    }
    if (parkingResult.status === "rejected") {
      console.warn("駐車場データの取得に失敗しました:", parkingResult.reason);
    }
    if (toiletResult.status === "rejected") {
      console.warn(
        "公衆トイレデータの取得に失敗しました:",
        toiletResult.reason
      );
    }

    // 各データに type プロパティが正しく設定されているか再確認
    const restaurantPoints = restaurants.map(restaurant => {
      const point = convertRestaurantToMapPoint(restaurant);
      if (point.type !== "restaurant") {
        throw new Error(
          `Invalid restaurant type: expected 'restaurant', got '${point.type}'`
        );
      }
      return point;
    });

    const parkingPoints = parkings.map(parking => {
      const point = convertParkingToMapPoint(parking);
      if (point.type !== "parking") {
        throw new Error(
          `Invalid parking type: expected 'parking', got '${point.type}'`
        );
      }
      return point;
    });

    const toiletPoints = toilets.map(toilet => {
      const point = convertToiletToMapPoint(toilet);
      if (point.type !== "toilet") {
        throw new Error(
          `Invalid toilet type: expected 'toilet', got '${point.type}'`
        );
      }
      return point;
    });

    const mapPoints: MapPoint[] = [
      ...restaurantPoints,
      ...parkingPoints,
      ...toiletPoints,
    ];

    // 最終的な統合データの検証
    if (!Array.isArray(mapPoints)) {
      throw new SheetsApiError("Failed to create map points array", 500);
    }

    // 各ポイントの type プロパティ検証
    for (const point of mapPoints) {
      if (
        !point.type ||
        !["restaurant", "parking", "toilet"].includes(point.type)
      ) {
        throw new SheetsApiError(`Invalid map point type: ${point.type}`, 422);
      }
    }

    console.log(
      `📊 統合マップポイント: 飲食店${restaurants.length}件 + 駐車場${parkings.length}件 + トイレ${toilets.length}件 = 合計${mapPoints.length}件`
    );

    return mapPoints;
  } catch (error) {
    console.error("統合マップポイントの取得に失敗しました:", error);

    if (error instanceof SheetsApiError) {
      throw error;
    }

    throw new SheetsApiError(
      `Map points integration failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
}

/**
 * データの新鮮度をチェック（実装簡略版）
 */
export function checkDataFreshness(): {
  lastUpdated: string;
  needsUpdate: boolean;
} {
  // 簡略実装: 常に最新とみなす
  return {
    lastUpdated: new Date().toISOString().split("T")[0],
    needsUpdate: false,
  };
}

/**
 * シートの行データをParking型に変換
 *
 * 実際のデータ構造（21フィールド）に対応:
 * Place ID, 駐車場名, 所在地, 緯度, 経度, カテゴリ, カテゴリ詳細, 営業状況, 施設説明, 完全住所, 詳細営業時間, バリアフリー対応, 支払い方法, 料金体系, トイレ設備, 施設評価, レビュー数, 地区, GoogleマップURL, 取得方法, 最終更新日時
 */
function convertSheetRowToParking(row: string[], rowNumber: number): Parking {
  if (row.length < 5) {
    throw new Error(
      `Insufficient parking data in row ${rowNumber}: expected at least 5 columns, got ${row.length}`
    );
  }

  const [
    placeId = "",
    name = "",
    address = "",
    latStr = "",
    lngStr = "",
    category = "",
    categoryDetail = "", // businessStatus（未使用）
    ,
    description = "", // fullAddress（未使用）
    ,
    detailedHours = "",
    accessibility = "",
    paymentMethods = "",
    feeStructure = "",
    toiletFacilities = "", // rating（未使用） // reviewCount（未使用）
    ,
    ,
    district = "", // googleMapsUrl（未使用） // acquisitionMethod（未使用）
    ,
    ,
    lastUpdatedFromSheet = "",
  ] = row;

  if (!placeId || !name || !address) {
    throw new Error(`Missing required parking fields in row ${rowNumber}`);
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error(
      `Invalid parking coordinates in row ${rowNumber}: lat=${latStr}, lng=${lngStr}`
    );
  }

  // 地区を住所から推定（地区フィールドがある場合はそれを使用）
  const extractedDistrict = district || getDistrictFromAddress(address);

  // 特徴の抽出
  const extractedFeatures = extractParkingFeatures(
    `${category} ${categoryDetail} ${accessibility} ${paymentMethods} ${toiletFacilities}`,
    description,
    feeStructure
  );

  // 更新日の設定（スプレッドシートの更新日データまたは現在日時）
  const actualLastUpdated =
    lastUpdatedFromSheet?.trim() || new Date().toISOString().split("T")[0];

  const baseParkingData = {
    id: placeId,
    type: "parking" as const,
    name: name.trim(),
    district: extractedDistrict as SadoDistrict,
    address: address.trim(),
    coordinates: { lat, lng },
    fee: feeStructure || "料金不明",
    openingHours: parseOpeningHours(detailedHours),
    features: extractedFeatures,
    lastUpdated: actualLastUpdated,
  };

  const descriptionValue = description || `${extractedDistrict}にある駐車場`;

  return {
    ...baseParkingData,
    description: descriptionValue,
    // capacityはオプショナルでundefinedを許可するため、値がある場合のみ追加
    // 今回は駐車場データに収容台数情報がないため、プロパティ自体を追加しない
  };
}

/**
 * シートの行データをToilet型に変換
 *
 * 実際のデータ構造（20フィールド）に対応:
 * Place ID, 施設名, 所在地, 緯度, 経度, カテゴリ, カテゴリ詳細, 営業状況, 施設説明, 完全住所, 詳細営業時間, バリアフリー対応, 子供連れ対応, 駐車場併設, 施設評価, レビュー数, 地区, GoogleマップURL, 取得方法, 最終更新日時
 */
function convertSheetRowToToilet(row: string[], rowNumber: number): Toilet {
  if (row.length < 5) {
    throw new Error(
      `Insufficient toilet data in row ${rowNumber}: expected at least 5 columns, got ${row.length}`
    );
  }

  const [
    placeId = "",
    name = "",
    address = "",
    latStr = "",
    lngStr = "",
    category = "",
    categoryDetail = "", // businessStatus（未使用）
    ,
    description = "", // fullAddress（未使用）
    ,
    detailedHours = "",
    accessibility = "",
    kidsSupport = "",
    parkingAvailable = "", // rating（未使用） // reviewCount（未使用）
    ,
    ,
    district = "", // googleMapsUrl（未使用） // acquisitionMethod（未使用）
    ,
    ,
    lastUpdatedFromSheet = "",
  ] = row;

  if (!placeId || !name || !address) {
    throw new Error(`Missing required toilet fields in row ${rowNumber}`);
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error(
      `Invalid toilet coordinates in row ${rowNumber}: lat=${latStr}, lng=${lngStr}`
    );
  }

  // 地区を住所から推定（地区フィールドがある場合はそれを使用）
  const extractedDistrict = district || getDistrictFromAddress(address);

  // 特徴の抽出
  const extractedFeatures = extractToiletFeatures(
    `${category} ${categoryDetail} ${accessibility} ${kidsSupport} ${parkingAvailable}`,
    description
  );

  // 更新日の設定（スプレッドシートの更新日データまたは現在日時）
  const actualLastUpdated =
    lastUpdatedFromSheet?.trim() || new Date().toISOString().split("T")[0];

  return {
    id: placeId,
    type: "toilet" as const,
    name: name.trim(),
    description: description || `${extractedDistrict}にある公衆トイレ`,
    district: extractedDistrict as SadoDistrict,
    address: address.trim(),
    coordinates: { lat, lng },
    openingHours: parseOpeningHours(detailedHours),
    features: extractedFeatures,
    lastUpdated: actualLastUpdated,
  };
}

/**
 * Restaurant型をMapPoint型に変換
 */
function convertRestaurantToMapPoint(restaurant: Restaurant): MapPoint {
  const baseData = {
    id: restaurant.id,
    type: "restaurant" as const,
    name: restaurant.name,
    district: restaurant.district,
    address: restaurant.address,
    coordinates: restaurant.coordinates,
    features: restaurant.features,
    lastUpdated: restaurant.lastUpdated,
    cuisineType: restaurant.cuisineType,
    priceRange: restaurant.priceRange,
    openingHours: restaurant.openingHours,
  };

  return {
    ...baseData,
    ...(restaurant.description && { description: restaurant.description }),
    ...(restaurant.rating && { rating: restaurant.rating }),
    ...(restaurant.reviewCount && { reviewCount: restaurant.reviewCount }),
    ...(restaurant.phone && { phone: restaurant.phone }),
  };
}

/**
 * Parking型をMapPoint型に変換
 */
function convertParkingToMapPoint(parking: Parking): MapPoint {
  const baseData = {
    id: parking.id,
    type: "parking" as const,
    name: parking.name,
    district: parking.district,
    address: parking.address,
    coordinates: parking.coordinates,
    features: parking.features,
    lastUpdated: parking.lastUpdated,
  };

  return {
    ...baseData,
    ...(parking.description && { description: parking.description }),
  };
}

/**
 * Toilet型をMapPoint型に変換
 */
function convertToiletToMapPoint(toilet: Toilet): MapPoint {
  const baseData = {
    id: toilet.id,
    type: "toilet" as const,
    name: toilet.name,
    district: toilet.district,
    address: toilet.address,
    coordinates: toilet.coordinates,
    features: toilet.features,
    lastUpdated: toilet.lastUpdated,
  };

  return {
    ...baseData,
    ...(toilet.description && { description: toilet.description }),
  };
}

/**
 * 駐車場の特徴を抽出
 */
function extractParkingFeatures(
  featuresText: string,
  description: string,
  fee: string
): string[] {
  const features: string[] = [];
  const combinedText = `${featuresText} ${description} ${fee}`.toLowerCase();

  if (combinedText.includes("無料") || fee.includes("無料"))
    features.push("無料");
  if (combinedText.includes("有料") || fee.includes("有料"))
    features.push("有料");
  if (combinedText.includes("大型") || combinedText.includes("大型車"))
    features.push("大型車対応");
  if (combinedText.includes("24時間") || combinedText.includes("24h"))
    features.push("24時間利用可");
  if (
    combinedText.includes("障害者") ||
    combinedText.includes("車椅子") ||
    combinedText.includes("バリアフリー")
  ) {
    features.push("障害者用駐車場");
  }
  if (combinedText.includes("屋根") || combinedText.includes("屋内"))
    features.push("屋根付き");
  if (
    combinedText.includes("観光") ||
    combinedText.includes("海水浴場") ||
    combinedText.includes("公園")
  ) {
    features.push("観光地駐車場");
  }

  return features.length > 0 ? features : ["駐車場"];
}

/**
 * トイレの特徴を抽出
 */
function extractToiletFeatures(
  featuresText: string,
  description: string
): string[] {
  const features: string[] = [];
  const combinedText = `${featuresText} ${description}`.toLowerCase();

  if (combinedText.includes("多目的") || combinedText.includes("誰でも"))
    features.push("多目的トイレ");
  if (combinedText.includes("車椅子") || combinedText.includes("バリアフリー"))
    features.push("車椅子対応");
  if (combinedText.includes("おむつ") || combinedText.includes("赤ちゃん"))
    features.push("おむつ交換台");
  if (combinedText.includes("24時間") || combinedText.includes("24h"))
    features.push("24時間利用可");
  if (combinedText.includes("きれい") || combinedText.includes("清潔"))
    features.push("清潔");
  if (
    combinedText.includes("温水洗浄") ||
    combinedText.includes("ウォシュレット")
  )
    features.push("温水洗浄便座");
  if (
    combinedText.includes("海水浴場") ||
    combinedText.includes("公園") ||
    combinedText.includes("観光")
  ) {
    features.push("観光地トイレ");
  }

  return features.length > 0 ? features : ["公衆トイレ"];
}

/**
 * 料理ジャンルをレストランカテゴリーにマッピング
 */
function mapCuisineTypeToCategory(
  cuisineType: CuisineType
): RestaurantCategory {
  switch (cuisineType) {
    case "寿司":
      return "sushi" as RestaurantCategory;
    case "海鮮":
      return "seafood" as RestaurantCategory;
    case "焼肉・焼鳥":
      return "yakiniku" as RestaurantCategory;
    case "ラーメン":
      return "ramen" as RestaurantCategory;
    case "そば・うどん":
      return "noodles" as RestaurantCategory;
    case "中華":
      return "chinese" as RestaurantCategory;
    case "イタリアン":
      return "italian" as RestaurantCategory;
    case "フレンチ":
      return "french" as RestaurantCategory;
    case "カフェ・喫茶店":
      return "cafe" as RestaurantCategory;
    case "バー・居酒屋":
      return "bar" as RestaurantCategory;
    case "ファストフード":
      return "fastfood" as RestaurantCategory;
    case "デザート・スイーツ":
      return "dessert" as RestaurantCategory;
    case "カレー・エスニック":
      return "curry" as RestaurantCategory;
    case "ステーキ・洋食":
      return "steak" as RestaurantCategory;
    case "弁当・テイクアウト":
      return "bento" as RestaurantCategory;
    case "日本料理":
      return "japanese" as RestaurantCategory;
    case "レストラン":
      return "restaurant" as RestaurantCategory;
    default:
      return "other" as RestaurantCategory;
  }
}
