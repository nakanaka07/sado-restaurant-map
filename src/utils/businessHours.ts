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
 * 現在の営業状況を判定
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

  // 今日の営業時間を検索
  const todayHours = findTodayHours(openingHours, currentDay);

  if (!todayHours) {
    return BusinessStatus.UNKNOWN;
  }

  if (todayHours.isHoliday) {
    return BusinessStatus.CLOSED;
  }

  const openTime = parseTimeToMinutes(todayHours.open);
  const closeTime = parseTimeToMinutes(todayHours.close);

  if (!openTime || !closeTime) {
    return BusinessStatus.UNKNOWN;
  }

  // 24時間営業の判定
  if (openTime === 0 && closeTime === 1440) {
    return BusinessStatus.OPEN;
  }

  // 深夜営業（日をまたぐ）の判定
  if (closeTime < openTime) {
    if (currentMinutes >= openTime || currentMinutes <= closeTime) {
      return BusinessStatus.OPEN;
    }
  } else if (currentMinutes >= openTime && currentMinutes <= closeTime) {
    // 通常営業時間の判定（else if に変更）
    return BusinessStatus.OPEN;
  }

  return BusinessStatus.CLOSED;
}

/**
 * 営業時間を見やすい形式でフォーマット
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

  // 今日の営業時間を優先表示
  const todayHours = findTodayHours(openingHours, dayName);

  if (todayHours) {
    if (todayHours.isHoliday) {
      return "本日定休日";
    }

    if (todayHours.open && todayHours.close) {
      return `本日 ${todayHours.open}-${todayHours.close}`;
    }
  }

  // 営業時間の概要を表示
  const validHours = openingHours.filter(
    h => !h.isHoliday && h.open && h.close
  );
  if (validHours.length === 0) {
    return "営業時間不明";
  }

  return validHours.map(h => `${h.day}: ${h.open}-${h.close}`).join(", ");
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
 * 営業時間配列から今日の営業時間を検索
 */
function findTodayHours(
  openingHours: readonly OpeningHours[],
  dayName: string
): OpeningHours | null {
  return (
    openingHours.find(
      hours =>
        hours.day.includes(dayName) ||
        hours.day.includes(dayName[0]) ||
        (dayName === "日曜日" && hours.day.includes("日"))
    ) || null
  );
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
 * 時間文字列（HH:MM）を分単位に変換
 */
function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== "string") {
    return null;
  }

  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeRegex.exec(timeStr.trim());

  if (!match) {
    return null;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
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
