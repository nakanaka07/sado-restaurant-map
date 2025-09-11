/**
 * 日付・時間フォーマット関連のユーティリティ関数
 * 最終更新日表示、営業時間表示などに使用
 */

/**
 * 日付を見やすい日本語形式でフォーマット
 */
export function formatDateForDisplay(
  dateStr: string | Date,
  options: {
    showTime?: boolean;
    showYear?: boolean;
    format?: "short" | "long";
  } = {}
): string {
  const { showTime = false, showYear = true, format = "short" } = options;

  let date: Date;

  if (typeof dateStr === "string") {
    // ISO形式やその他の文字列形式をパース
    date = new Date(dateStr);
  } else {
    date = dateStr;
  }

  // 無効な日付の場合
  if (isNaN(date.getTime())) {
    return "更新日不明";
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let result: string;

  if (format === "long") {
    result = `${year}年${month}月${day}日`;
  } else {
    const yearPart = showYear ? `${year}/` : "";
    result = `${yearPart}${month}/${day}`;
  }

  if (showTime) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    result += ` ${timeStr}`;
  }

  return result;
}

/**
 * 相対的な時間表示（"2日前"、"1週間前"など）
 */
export function formatRelativeTime(dateStr: string | Date): string {
  let date: Date;

  if (typeof dateStr === "string") {
    date = new Date(dateStr);
  } else {
    date = dateStr;
  }

  if (isNaN(date.getTime())) {
    return "更新日不明";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "本日更新";
  } else if (diffDays === 1) {
    return "昨日更新";
  } else if (diffDays < 7) {
    return `${diffDays}日前更新`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}週間前更新`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}ヶ月前更新`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years}年前更新`;
  }
}

/**
 * 営業時間を見やすい形式でフォーマット（拡張版）
 */
export function formatOpeningHours(
  openStr: string,
  closeStr: string,
  options: {
    format?: "12h" | "24h";
    showPeriod?: boolean;
  } = {}
): string {
  const { format = "24h", showPeriod = false } = options;

  if (!openStr || !closeStr) {
    return "時間不明";
  }

  if (format === "12h") {
    const openTime = convertTo12Hour(openStr);
    const closeTime = convertTo12Hour(closeStr);
    return `${openTime} - ${closeTime}`;
  }

  // 24時間形式（デフォルト）
  const result = `${openStr} - ${closeStr}`;

  if (showPeriod) {
    const openHour = parseInt(openStr.split(":")[0], 10);
    const closeHour = parseInt(closeStr.split(":")[0], 10);

    if (openHour < 11) {
      return `${result} (朝営業)`;
    } else if (openHour >= 17 || closeHour >= 21) {
      return `${result} (夜営業)`;
    } else if (closeHour <= 15) {
      return `${result} (ランチのみ)`;
    }
  }

  return result;
}

/**
 * 24時間形式を12時間形式に変換
 */
function convertTo12Hour(time24: string): string {
  const [hoursStr, minutes] = time24.split(":");
  const hours = parseInt(hoursStr, 10);

  if (hours === 0) {
    return `12:${minutes} AM`;
  } else if (hours < 12) {
    return `${hours}:${minutes} AM`;
  } else if (hours === 12) {
    return `12:${minutes} PM`;
  } else {
    return `${hours - 12}:${minutes} PM`;
  }
}

/**
 * 現在の時刻を営業時間判定用の分数に変換
 */
export function getCurrentTimeInMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * 曜日を短縮形に変換
 */
export function formatDayShort(dayStr: string): string {
  const dayMappings: Record<string, string> = {
    月曜日: "月",
    火曜日: "火",
    水曜日: "水",
    木曜日: "木",
    金曜日: "金",
    土曜日: "土",
    日曜日: "日",
    monday: "月",
    tuesday: "火",
    wednesday: "水",
    thursday: "木",
    friday: "金",
    saturday: "土",
    sunday: "日",
  };

  return dayMappings[dayStr.toLowerCase()] || dayStr;
}

/**
 * データの新しさを判定
 */
export function isDataFresh(
  lastUpdated: string,
  thresholdHours: number = 24
): boolean {
  const updateDate = new Date(lastUpdated);

  if (isNaN(updateDate.getTime())) {
    return false;
  }

  const now = new Date();
  const diffMs = now.getTime() - updateDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours <= thresholdHours;
}
