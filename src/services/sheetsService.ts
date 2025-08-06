/**
 * Google Sheets API連携サービス
 * places_data_updater.pyで生成されたスプレッドシートからデータを取得
 */

import type {
  Restaurant,
  CuisineType,
  PriceRange,
  SadoDistrict,
  Parking,
  Toilet,
  MapPoint,
} from "../types/restaurant.types";
import { getDistrictFromAddress } from "../utils/districtUtils";

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
    console.log(`📡 Google Sheets APIリクエスト: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      let errorDetails = `${response.status} ${response.statusText}`;

      // 403エラーの詳細情報を取得
      if (response.status === 403) {
        try {
          const errorBody = await response.text();
          console.error("🔒 403エラー詳細:", errorBody);

          if (errorBody.includes("permission")) {
            errorDetails = `スプレッドシートへのアクセス権限がありません。スプレッドシートを「リンクを知っている全員が閲覧可能」に設定してください。`;
          } else if (errorBody.includes("API key")) {
            errorDetails = `APIキーが無効または制限されています。Google Cloud ConsoleでAPIキーの設定を確認してください。`;
          }
        } catch (e) {
          console.warn("エラーレスポンスの解析に失敗:", e);
        }
      }

      throw new SheetsApiError(
        `Google Sheets API request failed: ${errorDetails}`,
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
  } catch (error) {
    console.error("Failed to fetch restaurants from sheets:", error);
    throw error;
  }
}

/**
 * シートの行データをRestaurant型に変換
 *
 * 実際のデータベース構造（26フィールド）に対応:
 * Place ID, 店舗名, 所在地, 緯度, 経度, 評価, レビュー数, 営業状況, 営業時間, 電話番号, ウェブサイト, 価格帯, 店舗タイプ, 店舗説明, テイクアウト, デリバリー, 店内飲食, カーブサイドピックアップ, 予約可能, 朝食提供, 昼食提供, 夕食提供, ビール提供, ワイン提供, カクテル提供, コーヒー提供
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
    phone = "", // website（未使用）
    ,
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

  return {
    id: placeId,
    name: name.trim(),
    description: storeDescription || `${district}にある${storeType}`,
    cuisineType,
    priceRange,
    district,
    address: address.trim(),
    phone: phone.trim() || undefined,
    coordinates: { lat, lng },
    rating: rating && !isNaN(rating) ? rating : undefined,
    reviewCount: reviewCount && !isNaN(reviewCount) ? reviewCount : undefined,
    openingHours: parsedOpeningHours,
    features,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

/**
 * Google Places APIの店舗タイプを料理ジャンルに変換 (v2.0 - 大幅改良版)
 * 店舗名も分析対象に含めて、より精密な分類を実現
 */
function mapStoreTypeToCuisineType(
  storeTypeWithName: string,
  description: string
): CuisineType {
  const combined = `${storeTypeWithName} ${description}`.toLowerCase();

  // より詳細なキーワードパターンマッチング（正規表現使用）

  // 🍣 寿司・回転寿司
  if (combined.match(/(寿司|すし|sushi|回転寿司|握り|にぎり)/)) {
    return "寿司";
  }

  // 🐟 海鮮・魚料理
  if (
    combined.match(
      /(海鮮|魚|刺身|鮮魚|漁師|海の家|魚介|あじ|いわし|かに|蟹|えび|海老|たこ|蛸|いか|烏賊|まぐろ|鮪|さば|鯖)/
    )
  ) {
    return "海鮮";
  }

  // 🥩 焼肉・焼鳥・BBQ
  if (
    combined.match(
      /(焼肉|焼鳥|ホルモン|串焼|炭火|bbq|バーベキュー|やきとり|やきにく|鶏|チキン|beef|牛)/
    )
  ) {
    return "焼肉・焼鳥";
  }

  // 🍜 ラーメン・つけ麺
  if (
    combined.match(
      /(ラーメン|らーめん|ramen|つけ麺|担々麺|味噌|醤油|豚骨|塩ラーメン|中華そば|二郎)/
    )
  ) {
    return "ラーメン";
  }

  // 🍝 そば・うどん
  if (
    combined.match(
      /(そば|蕎麦|うどん|手打|十割|二八|讃岐|きしめん|ひやむぎ|そうめん)/
    )
  ) {
    return "そば・うどん";
  }

  // 🥟 中華・中国料理
  if (
    combined.match(
      /(中華|中国|餃子|チャーハン|炒飯|麻婆|点心|北京|四川|上海|広東|台湾|小籠包)/
    )
  ) {
    return "中華";
  }

  // 🍝 イタリアン
  if (
    combined.match(
      /(イタリア|パスタ|ピザ|ピッツァ|リストランテ|トラットリア|スパゲッティ|italian)/
    )
  ) {
    return "イタリアン";
  }

  // 🥖 フレンチ・西洋料理
  if (combined.match(/(フレンチ|フランス|ビストロ|french|西洋料理|洋食)/)) {
    return "フレンチ";
  }

  // 🍛 カレー・エスニック
  if (
    combined.match(
      /(カレー|curry|インド|タイ|エスニック|スパイス|ナン|タンドール|ココナッツ)/
    )
  ) {
    return "カレー・エスニック";
  }

  // 🍖 ステーキ・洋食
  if (
    combined.match(/(ステーキ|steak|ハンバーグ|オムライス|グリル|beef|pork)/)
  ) {
    return "ステーキ・洋食";
  }

  // 🧁 デザート・スイーツ・和菓子（パン屋を優先）
  if (
    combined.match(
      /(デザート|スイーツ|ケーキ|アイス|sweet|dessert|洋菓子|和菓子|だんご|まんじゅう|どら焼き|大福|餅|パン屋|パン|ベーカリー|bread|パティスリー)/
    )
  ) {
    return "デザート・スイーツ";
  }

  // ☕ カフェ・喫茶店（パン屋のチェック後に配置）
  if (combined.match(/(カフェ|cafe|珈琲|コーヒー|coffee|喫茶)/)) {
    return "カフェ・喫茶店";
  }

  // 🍺 バー・居酒屋・スナック
  if (
    combined.match(
      /(バー|bar|居酒屋|酒|スナック|パブ|pub|飲み屋|ビアガーデン|beer|wine)/
    )
  ) {
    return "バー・居酒屋";
  }

  // 🍟 ファストフード
  if (
    combined.match(
      /(ファスト|マクドナルド|ケンタ|モス|サブウェイ|fast|burger|ハンバーガー)/
    )
  ) {
    return "ファストフード";
  }

  // 🧁 デザート・スイーツ・和菓子
  if (
    combined.match(
      /(デザート|スイーツ|ケーキ|アイス|sweet|dessert|洋菓子|和菓子|だんご|まんじゅう|どら焼き|大福|餅)/
    )
  ) {
    return "デザート・スイーツ";
  }

  // 🍱 弁当・テイクアウト
  if (combined.match(/(弁当|bento|テイクアウト|持ち帰り|惣菜|お惣菜)/)) {
    return "弁当・テイクアウト";
  }

  // 🍱 和食・定食・食堂
  if (
    combined.match(
      /(和食|定食|食堂|日本料理|割烹|料亭|懐石|会席|てんぷら|天ぷら|とんかつ|カツ|丼|どんぶり)/
    )
  ) {
    return "日本料理";
  }

  // 🏪 レストラン（ジャンル不明）
  if (
    combined.match(
      /(レストラン|restaurant|ダイニング|ビュッフェ|バイキング|食べ放題)/
    )
  ) {
    return "レストラン";
  }

  // 🏪 その他（小売店・コンビニなど）
  if (combined.match(/(コンビニ|スーパー|商店|売店|自販機|マーケット)/)) {
    return "その他";
  }

  // それでも分類できない場合
  return "その他";
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

  // サービス形態
  if (data.takeout === "true" || data.takeout === "可")
    features.push("テイクアウト可");
  if (data.delivery === "true" || data.delivery === "可")
    features.push("デリバリー可");
  if (data.dineIn === "true" || data.dineIn === "可")
    features.push("店内飲食可");
  if (data.curbsidePickup === "true" || data.curbsidePickup === "可")
    features.push("カーブサイドピックアップ可");
  if (data.reservable === "true" || data.reservable === "可")
    features.push("予約可能");

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
 * 駐車場データを取得してParking型に変換
 */
export async function fetchParkingsFromSheets(): Promise<Parking[]> {
  try {
    const rows = await fetchSheetData(WORKSHEETS.PARKINGS);

    if (rows.length === 0) {
      return [];
    }

    // ヘッダー行をスキップ
    const dataRows = rows.slice(1);

    return dataRows
      .map((row, index) => {
        try {
          return convertSheetRowToParking(row, index + 2);
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
  } catch (error) {
    console.warn("駐車場データの取得に失敗しました:", error);
    return [];
  }
}

/**
 * 公衆トイレデータを取得してToilet型に変換
 */
export async function fetchToiletsFromSheets(): Promise<Toilet[]> {
  try {
    const rows = await fetchSheetData(WORKSHEETS.TOILETS);

    if (rows.length === 0) {
      return [];
    }

    // ヘッダー行をスキップ
    const dataRows = rows.slice(1);

    return dataRows
      .map((row, index) => {
        try {
          return convertSheetRowToToilet(row, index + 2);
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
  } catch (error) {
    console.warn("公衆トイレデータの取得に失敗しました:", error);
    return [];
  }
}

/**
 * 全てのマップポイント（飲食店・駐車場・トイレ）を統合して取得
 */
export async function fetchAllMapPoints(): Promise<MapPoint[]> {
  try {
    const [restaurants, parkings, toilets] = await Promise.all([
      fetchRestaurantsFromSheets(),
      fetchParkingsFromSheets(),
      fetchToiletsFromSheets(),
    ]);

    const mapPoints: MapPoint[] = [
      ...restaurants.map(convertRestaurantToMapPoint),
      ...parkings.map(convertParkingToMapPoint),
      ...toilets.map(convertToiletToMapPoint),
    ];

    console.log(
      `📊 統合マップポイント: 飲食店${restaurants.length}件 + 駐車場${parkings.length}件 + トイレ${toilets.length}件 = 合計${mapPoints.length}件`
    );

    return mapPoints;
  } catch (error) {
    console.error("統合マップポイントの取得に失敗しました:", error);
    throw error;
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

    // 最後の行の最終更新日時をチェック（実際のデータ構造では26番目のフィールドは存在しない）
    // 代わりに現在の日時を使用
    const lastUpdated = new Date().toISOString();

    // ローカルストレージと比較
    const cachedTimestamp = localStorage.getItem("restaurantDataTimestamp");
    const needsUpdate = !cachedTimestamp || cachedTimestamp !== lastUpdated;

    return { lastUpdated, needsUpdate };
  } catch (error) {
    console.error("Failed to check data freshness:", error);
    return { lastUpdated: new Date().toISOString(), needsUpdate: true };
  }
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
    lastUpdated = "",
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

  return {
    id: placeId,
    name: name.trim(),
    description: description || `${extractedDistrict}にある駐車場`,
    district: extractedDistrict as SadoDistrict,
    address: address.trim(),
    coordinates: { lat, lng },
    capacity: undefined, // 駐車場データには収容台数情報がない
    fee: feeStructure || "料金不明",
    openingHours: parseOpeningHours(detailedHours),
    features: extractedFeatures,
    lastUpdated: lastUpdated || new Date().toISOString().split("T")[0],
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
    lastUpdated = "",
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

  return {
    id: placeId,
    name: name.trim(),
    description: description || `${extractedDistrict}にある公衆トイレ`,
    district: extractedDistrict as SadoDistrict,
    address: address.trim(),
    coordinates: { lat, lng },
    openingHours: parseOpeningHours(detailedHours),
    features: extractedFeatures,
    lastUpdated: lastUpdated || new Date().toISOString().split("T")[0],
  };
}

/**
 * Restaurant型をMapPoint型に変換
 */
function convertRestaurantToMapPoint(restaurant: Restaurant): MapPoint {
  return {
    id: restaurant.id,
    type: "restaurant",
    name: restaurant.name,
    description: restaurant.description,
    district: restaurant.district,
    address: restaurant.address,
    coordinates: restaurant.coordinates,
    features: restaurant.features,
    lastUpdated: restaurant.lastUpdated,
    cuisineType: restaurant.cuisineType,
    priceRange: restaurant.priceRange,
    rating: restaurant.rating,
    reviewCount: restaurant.reviewCount,
    phone: restaurant.phone,
    openingHours: restaurant.openingHours,
  };
}

/**
 * Parking型をMapPoint型に変換
 */
function convertParkingToMapPoint(parking: Parking): MapPoint {
  return {
    id: parking.id,
    type: "parking",
    name: parking.name,
    description: parking.description,
    district: parking.district,
    address: parking.address,
    coordinates: parking.coordinates,
    features: parking.features,
    lastUpdated: parking.lastUpdated,
  };
}

/**
 * Toilet型をMapPoint型に変換
 */
function convertToiletToMapPoint(toilet: Toilet): MapPoint {
  return {
    id: toilet.id,
    type: "toilet",
    name: toilet.name,
    description: toilet.description,
    district: toilet.district,
    address: toilet.address,
    coordinates: toilet.coordinates,
    features: toilet.features,
    lastUpdated: toilet.lastUpdated,
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
