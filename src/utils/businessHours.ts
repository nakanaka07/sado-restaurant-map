/**
 * 営業時間関連のユーティリティ関数
 * 営業状況判定、営業時間の表示フォーマットなどを担当
 */

import {
  BusinessStatus,
  type DetailedOpeningHours,
  type OpeningHours,
  type TimeRange,
} from "@/types";

/**
 * 現在の営業状況を判定（強化版）
 * 特別営業時間、休憩時間、ラストオーダーに対応
 */
export function calculateBusinessStatus(
  openingHours: readonly OpeningHours[],
  currentTime: Date = new Date()
): BusinessStatus {
  if (!openingHours || openingHours.length === 0) {
    return BusinessStatus.UNKNOWN;
  }

  const currentDay = getCurrentDay(currentTime);
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // 今日の営業時間を検索（複数セッション対応）
  const todayHoursList = findAllTodayHours(openingHours, currentDay);

  if (todayHoursList.length === 0) {
    return BusinessStatus.UNKNOWN;
  }

  // 定休日チェック
  if (todayHoursList.every(hours => hours.isHoliday)) {
    return BusinessStatus.CLOSED;
  }

  // 各営業セッションをチェック
  for (const todayHours of todayHoursList) {
    if (todayHours.isHoliday) {
      continue;
    }

    const businessStatus = checkSingleSession(todayHours, currentMinutes);
    if (businessStatus === BusinessStatus.OPEN) {
      return BusinessStatus.OPEN;
    }
  }

  return BusinessStatus.CLOSED;
}

/**
 * 単一営業セッションの営業状況判定
 */
function checkSingleSession(
  hours: OpeningHours,
  currentMinutes: number
): BusinessStatus {
  // 分割営業時間の解析（例: "11:00-14:00,17:00-22:00"）
  const timeRanges = parseMultipleTimeRanges(hours.open, hours.close);

  for (const range of timeRanges) {
    const openTime = parseTimeToMinutes(range.open);
    const closeTime = parseTimeToMinutes(range.close);

    if (openTime === null || closeTime === null) {
      continue;
    }

    // 24時間営業の判定
    if (openTime === 0 && closeTime === 1440) {
      return BusinessStatus.OPEN;
    }

    // ラストオーダー時間を考慮した判定
    const effectiveCloseTime = getEffectiveCloseTime(closeTime, range.close);

    // 深夜営業（日をまたぐ）の判定
    if (effectiveCloseTime < openTime) {
      if (currentMinutes >= openTime || currentMinutes <= effectiveCloseTime) {
        return BusinessStatus.OPEN;
      }
    } else if (
      currentMinutes >= openTime &&
      currentMinutes < effectiveCloseTime
    ) {
      return BusinessStatus.OPEN;
    }
  }

  return BusinessStatus.CLOSED;
}

/**
 * 複数の営業時間範囲を解析
 */
function parseMultipleTimeRanges(
  openStr: string,
  closeStr: string
): Array<{ open: string; close: string }> {
  // 分割営業時間の特別処理：openStr が複数の時間を含む場合
  if (openStr.includes("-") || openStr.includes(",")) {
    return parseComplexTimeRanges(openStr);
  }

  // 通常の営業時間
  return [{ open: openStr, close: closeStr }];
}

/**
 * 複雑な分割営業時間の解析
 */
function parseComplexTimeRanges(
  timeStr: string
): Array<{ open: string; close: string }> {
  const ranges: Array<{ open: string; close: string }> = [];

  // 時間範囲パターンの抽出
  const timeRangePattern =
    /(\d{1,2}[:：.]\d{2})\s*[-~〜]\s*(\d{1,2}[:：.]\d{2})/g;
  let match;

  while ((match = timeRangePattern.exec(timeStr)) !== null) {
    ranges.push({ open: match[1], close: match[2] });
  }

  return ranges.length > 0 ? ranges : [{ open: "", close: "" }];
}

/**
 * 実効閉店時間を取得（ラストオーダー考慮）
 */
function getEffectiveCloseTime(closeTime: number, closeStr: string): number {
  // ラストオーダー表記の検出
  if (
    closeStr.includes("L.O") ||
    closeStr.includes("ラストオーダー") ||
    closeStr.includes("lo")
  ) {
    // ラストオーダーの場合、30分後を実質閉店時間とする
    return closeTime + 30;
  }

  return closeTime;
}

/**
 * 今日の全営業時間を取得（複数セッション対応）
 */
function findAllTodayHours(
  openingHours: readonly OpeningHours[],
  dayName: string
): OpeningHours[] {
  const normalizedDayName = normalizeDayName(dayName);
  const result: OpeningHours[] = [];

  for (const hours of openingHours) {
    const hoursDayNormalized = normalizeDayName(hours.day);

    if (
      hoursDayNormalized === normalizedDayName ||
      getDayMappings(normalizedDayName).includes(hoursDayNormalized)
    ) {
      result.push(hours);
    }
  }

  return result;
}

/**
 * 営業時間を見やすい形式でフォーマット（強化版）
 * 特別営業時間、休憩時間、ラストオーダー表示に対応
 */
export function formatBusinessHoursForDisplay(
  openingHours: readonly OpeningHours[],
  currentDay?: number
): string {
  if (!openingHours || openingHours.length === 0) {
    return "営業時間不明";
  }

  const day = currentDay ?? new Date().getDay();
  const dayName = getCurrentDay(
    new Date(Date.now() + day * 24 * 60 * 60 * 1000)
  );

  // 今日の営業時間を優先表示（複数セッション対応）
  const todayHoursList = findAllTodayHours(openingHours, dayName);

  if (todayHoursList.length > 0) {
    const todayFormatted = formatTodayHours(todayHoursList);
    if (todayFormatted) {
      return todayFormatted;
    }
  }

  // 営業時間の概要を表示
  const validHours = openingHours.filter(
    h => !h.isHoliday && h.open && h.close
  );
  if (validHours.length === 0) {
    return "営業時間不明";
  }

  return formatWeeklyHours(validHours);
}

/**
 * 営業時間の分類処理
 */
function categorizeHours(todayHoursList: OpeningHours[]) {
  return {
    holidayHours: todayHoursList.filter(h => h.isHoliday),
    operatingHours: todayHoursList.filter(h => !h.isHoliday),
  };
}

/**
 * 営業時間の時間範囲を抽出
 */
function extractTimeRanges(operatingHours: OpeningHours[]): string[] {
  const timeRanges: string[] = [];

  for (const hours of operatingHours) {
    const ranges = parseMultipleTimeRanges(hours.open, hours.close);
    for (const range of ranges) {
      if (range.open && range.close) {
        const formatted = formatTimeRange(range.open, range.close);
        if (formatted && !timeRanges.includes(formatted)) {
          timeRanges.push(formatted);
        }
      }
    }
  }

  return timeRanges;
}

/**
 * 今日の営業時間をフォーマット
 */
function formatTodayHours(todayHoursList: OpeningHours[]): string {
  const { holidayHours, operatingHours } = categorizeHours(todayHoursList);

  if (holidayHours.length > 0 && operatingHours.length === 0) {
    return "本日定休日";
  }

  if (operatingHours.length === 0) {
    return "本日営業時間不明";
  }

  const timeRanges = extractTimeRanges(operatingHours);

  if (timeRanges.length === 0) {
    return "本日営業時間不明";
  }

  const prefix = "本日 ";
  return `${prefix}${timeRanges.join(", ")}`;
}

/**
 * 週間営業時間をフォーマット
 */
function formatWeeklyHours(validHours: readonly OpeningHours[]): string {
  return validHours
    .map(h => {
      const dayShort = h.day.replace(/曜日$/, "");
      const ranges = parseMultipleTimeRanges(h.open, h.close);
      const timeStr = ranges
        .map(r => formatTimeRange(r.open, r.close))
        .filter(Boolean)
        .join(",");
      return `${dayShort}:${timeStr}`;
    })
    .join(" ");
}

/**
 * 時間範囲をフォーマット（特別表記対応）
 */
function formatTimeRange(openStr: string, closeStr: string): string {
  const normalizedOpen = normalizeTimeString(openStr);
  const normalizedClose = normalizeTimeString(closeStr);

  if (!normalizedOpen || !normalizedClose) {
    return "";
  }

  // 24時間営業の判定
  if (
    (normalizedOpen === "00:00" && normalizedClose === "24:00") ||
    (normalizedOpen === "00:00" && normalizedClose === "00:00")
  ) {
    return "24時間営業";
  }

  // ラストオーダー表記の保持
  if (closeStr.includes("L.O") || closeStr.includes("ラストオーダー")) {
    return `${normalizedOpen}-${normalizedClose}(L.O)`;
  }

  return `${normalizedOpen}-${normalizedClose}`;
}

/**
 * 詳細営業時間を曜日別に整理
 */
export function organizeDetailedHours(
  openingHours: readonly OpeningHours[]
): DetailedOpeningHours {
  // 可変オブジェクトとして作成してからreadonly型に変換
  const organized: Record<string, TimeRange> = {};

  for (const hours of openingHours) {
    const dayKey = mapDayToKey(hours.day);
    if (dayKey) {
      organized[dayKey] = {
        open: hours.open,
        close: hours.close,
        isClosed: hours.isHoliday,
      };
    }
  }

  // readonly型として返却
  return organized as DetailedOpeningHours;
}

/**
 * 曜日名を正規化（多様な表記に対応）
 */
function normalizeDayName(dayStr: string): string {
  const cleaned = normalizeWhitespace(dayStr);

  // 英語曜日の日本語変換
  const englishToJapanese: Record<string, string> = {
    sunday: "日曜日",
    sun: "日",
    monday: "月曜日",
    mon: "月",
    tuesday: "火曜日",
    tue: "火",
    wednesday: "水曜日",
    wed: "水",
    thursday: "木曜日",
    thu: "木",
    friday: "金曜日",
    fri: "金",
    saturday: "土曜日",
    sat: "土",
  };

  const lowerCleaned = cleaned.toLowerCase();
  if (englishToJapanese[lowerCleaned]) {
    return englishToJapanese[lowerCleaned];
  }

  return cleaned;
}

/**
 * 曜日の異表記マッピング取得
 */
function getDayMappings(dayName: string): string[] {
  const mappings: Record<string, string[]> = {
    日曜日: ["日", "日曜", "sun", "sunday"],
    日: ["日曜日", "日曜", "sun", "sunday"],
    月曜日: ["月", "月曜", "mon", "monday"],
    月: ["月曜日", "月曜", "mon", "monday"],
    火曜日: ["火", "火曜", "tue", "tuesday"],
    火: ["火曜日", "火曜", "tue", "tuesday"],
    水曜日: ["水", "水曜", "wed", "wednesday"],
    水: ["水曜日", "水曜", "wed", "wednesday"],
    木曜日: ["木", "木曜", "thu", "thursday"],
    木: ["木曜日", "木曜", "thu", "thursday"],
    金曜日: ["金", "金曜", "fri", "friday"],
    金: ["金曜日", "金曜", "fri", "friday"],
    土曜日: ["土", "土曜", "sat", "saturday"],
    土: ["土曜日", "土曜", "sat", "saturday"],
  };

  return mappings[dayName] || [];
}

/**
 * 現在の曜日名を取得
 */
function getCurrentDay(date: Date): string {
  const days = [
    "日曜日",
    "月曜日",
    "火曜日",
    "水曜日",
    "木曜日",
    "金曜日",
    "土曜日",
  ];
  return days[date.getDay()];
}

/**
 * 時間文字列（HH:MM）を分単位に変換（強化版）
 * 多様な時間表記フォーマットと特別営業時間に対応
 */
function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== "string") {
    return null;
  }

  const cleanTime = normalizeTimeString(timeStr);
  if (!cleanTime) {
    return null;
  }

  // 24時間営業の明示的表記
  if (cleanTime === "24:00" || cleanTime === "00:00") {
    return cleanTime === "24:00" ? 1440 : 0;
  }

  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeRegex.exec(cleanTime);

  if (!match) {
    return null;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  // 深夜時間対応（25:00, 26:00など）
  if (hours >= 24 && hours <= 29 && minutes >= 0 && minutes <= 59) {
    return (hours - 24) * 60 + minutes + 1440; // 翌日扱い
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * 時間文字列を正規化（多様な表記に対応）
 */
function normalizeTimeString(timeStr: string): string | null {
  const cleaned = normalizeWhitespace(timeStr);

  // 全角数字を半角に変換
  const halfWidth = cleaned.replace(/[０-９]/g, char =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );

  // 各種時間表記の正規化
  const patterns = [
    /^(\d{1,2}):(\d{2})$/, // 11:30
    /^(\d{1,2})時(\d{2})分?$/, // 11時30分, 11時30
    /^(\d{1,2})：(\d{2})$/, // 11：30（全角コロン）
    /^(\d{1,2})\.(\d{2})$/, // 11.30
    /^(\d{1,2})h(\d{2})$/, // 11h30
    /^(\d{3,4})$/, // 1130
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(halfWidth);
    if (match) {
      // 4桁数字形式の特別処理
      if (pattern.source === "^(\\d{3,4})$") {
        const timeStr = match[0].padStart(4, "0");
        return `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;
      }
      // 通常の2グループキャプチャ
      if (match[1] && match[2]) {
        return `${match[1].padStart(2, "0")}:${match[2].padStart(2, "0")}`;
      }
    }
  }

  return null;
}

/**
 * 曜日名をDetailedOpeningHoursのキーにマッピング
 */
function mapDayToKey(dayStr: string): keyof DetailedOpeningHours | null {
  const day = dayStr.toLowerCase().trim();

  if (day.includes("月") || day.includes("mon")) return "monday";
  if (day.includes("火") || day.includes("tue")) return "tuesday";
  if (day.includes("水") || day.includes("wed")) return "wednesday";
  if (day.includes("木") || day.includes("thu")) return "thursday";
  if (day.includes("金") || day.includes("fri")) return "friday";
  if (day.includes("土") || day.includes("sat")) return "saturday";
  if (day.includes("日") || day.includes("sun")) return "sunday";

  return null;
}

/**
 * 不正な空白文字を正規化して通常のトリム済み文字列を返す
 */
function normalizeWhitespace(s: string): string {
  if (!s || typeof s !== "string") return "";
  // 全角スペースや各種不可視空白を除去し、前後の空白をトリム
  return s.replace(/[\u00A0\u2000-\u200B\u202F\u3000\uFEFF]/g, "").trim();
}

/**
 * Google Maps URLを生成
 */
export function generateGoogleMapsUrl(
  name: string,
  coordinates: { lat: number; lng: number }
): string {
  const baseUrl = "https://www.google.com/maps/search/";
  const query = encodeURIComponent(
    `${name} ${coordinates.lat},${coordinates.lng}`
  );
  return `${baseUrl}${query}/@${coordinates.lat},${coordinates.lng},17z`;
}

/**
 * レストランカテゴリーから料理ジャンルをマッピング
 */
export function mapCategoryToCuisineType(category: string): string {
  const categoryLower = category.toLowerCase();

  // 和食系の判定
  const japaneseCuisine = checkJapaneseCuisine(categoryLower);
  if (japaneseCuisine) return japaneseCuisine;

  // 洋食系の判定
  const westernCuisine = checkWesternCuisine(categoryLower);
  if (westernCuisine) return westernCuisine;

  // その他の判定
  const otherCuisine = checkOtherCuisine(categoryLower);
  if (otherCuisine) return otherCuisine;

  return "その他";
}

/**
 * 和食系カテゴリーの判定（認知的複雑度を下げるため分割）
 */
function checkJapaneseCuisine(categoryLower: string): string | null {
  if (categoryLower.includes("寿司") || categoryLower.includes("sushi"))
    return "寿司";
  if (categoryLower.includes("海鮮") || categoryLower.includes("seafood"))
    return "海鮮";
  if (categoryLower.includes("焼肉") || categoryLower.includes("焼鳥"))
    return "焼肉・焼鳥";
  if (categoryLower.includes("ラーメン") || categoryLower.includes("ramen"))
    return "ラーメン";
  if (categoryLower.includes("そば") || categoryLower.includes("うどん"))
    return "そば・うどん";
  if (categoryLower.includes("和食") || categoryLower.includes("日本料理"))
    return "日本料理";
  return null;
}

/**
 * 洋食系カテゴリーの判定
 */
function checkWesternCuisine(categoryLower: string): string | null {
  if (categoryLower.includes("イタリア") || categoryLower.includes("italian"))
    return "イタリアン";
  if (categoryLower.includes("フレンチ") || categoryLower.includes("french"))
    return "フレンチ";
  if (categoryLower.includes("ステーキ") || categoryLower.includes("洋食"))
    return "ステーキ・洋食";
  return null;
}

/**
 * その他カテゴリーの判定
 */
function checkOtherCuisine(categoryLower: string): string | null {
  if (categoryLower.includes("中華") || categoryLower.includes("chinese"))
    return "中華";
  if (categoryLower.includes("カフェ") || categoryLower.includes("cafe"))
    return "カフェ・喫茶店";
  if (categoryLower.includes("バー") || categoryLower.includes("居酒屋"))
    return "バー・居酒屋";
  if (categoryLower.includes("ファスト") || categoryLower.includes("fast"))
    return "ファストフード";
  if (categoryLower.includes("デザート") || categoryLower.includes("スイーツ"))
    return "デザート・スイーツ";
  if (categoryLower.includes("カレー") || categoryLower.includes("エスニック"))
    return "カレー・エスニック";
  if (categoryLower.includes("弁当") || categoryLower.includes("テイクアウト"))
    return "弁当・テイクアウト";
  if (categoryLower.includes("レストラン")) return "レストラン";
  return null;
}
