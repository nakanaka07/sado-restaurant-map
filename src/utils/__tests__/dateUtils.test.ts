import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDateForDisplay,
  formatDayShort,
  formatOpeningHours,
  formatRelativeTime,
  getCurrentTimeInMinutes,
  isDataFresh,
} from "../dateUtils";

describe("dateUtils", () => {
  describe("formatDateForDisplay", () => {
    it("formats valid date string to YYYY/M/D", () => {
      const result = formatDateForDisplay("2024-01-15");
      expect(result).toBe("2024/1/15");
    });

    it("formats Date object", () => {
      const date = new Date("2024-01-15T12:00:00");
      const result = formatDateForDisplay(date);
      expect(result).toContain("2024");
      expect(result).toContain("/");
    });

    it('returns "更新日不明" for invalid date', () => {
      const result = formatDateForDisplay("invalid");
      expect(result).toBe("更新日不明");
    });

    it('returns "更新日不明" for empty string', () => {
      const result = formatDateForDisplay("");
      expect(result).toBe("更新日不明");
    });

    it("formats with long format option", () => {
      const result = formatDateForDisplay("2024-01-15", { format: "long" });
      expect(result).toBe("2024年1月15日");
    });

    it("formats without year when showYear is false", () => {
      const result = formatDateForDisplay("2024-01-15", { showYear: false });
      expect(result).toBe("1/15");
      expect(result).not.toContain("2024");
    });

    it("includes time when showTime is true", () => {
      const result = formatDateForDisplay("2024-01-15T14:30:00", {
        showTime: true,
      });
      expect(result).toContain("14:30");
    });

    it("formats time with leading zeros", () => {
      const result = formatDateForDisplay("2024-01-15T09:05:00", {
        showTime: true,
      });
      expect(result).toContain("09:05");
    });

    it("combines all options: long format with time", () => {
      const result = formatDateForDisplay("2024-01-15T14:30:00", {
        format: "long",
        showTime: true,
      });
      expect(result).toBe("2024年1月15日 14:30");
    });
  });

  describe("formatRelativeTime", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:00:00"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "本日更新" for same day', () => {
      const recent = new Date("2024-01-15T11:30:00");
      const result = formatRelativeTime(recent);
      expect(result).toBe("本日更新");
    });

    it('returns "昨日更新" for previous day', () => {
      const yesterday = new Date("2024-01-14T12:00:00");
      const result = formatRelativeTime(yesterday);
      expect(result).toBe("昨日更新");
    });

    it("returns days ago for recent dates", () => {
      const threeDaysAgo = new Date("2024-01-12T12:00:00");
      const result = formatRelativeTime(threeDaysAgo);
      expect(result).toBe("3日前更新");
    });

    it("formats date string input", () => {
      const result = formatRelativeTime("2024-01-15T11:00:00");
      expect(result).toBe("本日更新");
    });

    it("returns weeks ago for dates 7-29 days old", () => {
      const twoWeeksAgo = new Date("2024-01-01T12:00:00");
      const result = formatRelativeTime(twoWeeksAgo);
      expect(result).toBe("2週間前更新");
    });

    it("returns months ago for dates 30-364 days old", () => {
      const twoMonthsAgo = new Date("2023-11-15T12:00:00");
      const result = formatRelativeTime(twoMonthsAgo);
      expect(result).toBe("2ヶ月前更新");
    });

    it("returns years ago for dates 365+ days old", () => {
      const oneYearAgo = new Date("2023-01-15T12:00:00");
      const result = formatRelativeTime(oneYearAgo);
      expect(result).toBe("1年前更新");
    });

    it('returns "更新日不明" for invalid date string', () => {
      const result = formatRelativeTime("invalid-date");
      expect(result).toBe("更新日不明");
    });

    it('returns "更新日不明" for invalid Date object', () => {
      const result = formatRelativeTime(new Date("invalid"));
      expect(result).toBe("更新日不明");
    });
  });

  describe("getCurrentTimeInMinutes", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns time in minutes for 12:30", () => {
      vi.setSystemTime(new Date("2024-01-15T12:30:00"));
      const result = getCurrentTimeInMinutes();
      expect(result).toBe(12 * 60 + 30); // 750
    });

    it("returns 0 for midnight", () => {
      vi.setSystemTime(new Date("2024-01-15T00:00:00"));
      const result = getCurrentTimeInMinutes();
      expect(result).toBe(0);
    });

    it("returns correct value for 23:59", () => {
      vi.setSystemTime(new Date("2024-01-15T23:59:00"));
      const result = getCurrentTimeInMinutes();
      expect(result).toBe(23 * 60 + 59);
    });
  });

  describe("formatDayShort", () => {
    it("formats Japanese day names", () => {
      expect(formatDayShort("月曜日")).toBe("月");
      expect(formatDayShort("火曜日")).toBe("火");
      expect(formatDayShort("水曜日")).toBe("水");
      expect(formatDayShort("木曜日")).toBe("木");
      expect(formatDayShort("金曜日")).toBe("金");
      expect(formatDayShort("土曜日")).toBe("土");
      expect(formatDayShort("日曜日")).toBe("日");
    });

    it("formats English day names", () => {
      expect(formatDayShort("monday")).toBe("月");
      expect(formatDayShort("TUESDAY")).toBe("火");
      expect(formatDayShort("Wednesday")).toBe("水");
    });

    it("returns original string for unknown day", () => {
      expect(formatDayShort("unknown")).toBe("unknown");
      expect(formatDayShort("")).toBe("");
    });
  });

  describe("isDataFresh", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:00:00"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns true for data within threshold (hours)", () => {
      const recentDate = new Date("2024-01-15T11:30:00"); // 0.5 hours ago
      const result = isDataFresh(recentDate.toISOString(), 1); // 1 hour threshold
      expect(result).toBe(true);
    });

    it("returns false for data beyond threshold", () => {
      const oldDate = new Date("2024-01-14T11:00:00"); // 25 hours ago
      const result = isDataFresh(oldDate.toISOString(), 24); // 24 hour threshold
      expect(result).toBe(false);
    });

    it("handles string date input", () => {
      const result = isDataFresh("2024-01-15T11:45:00", 1); // 0.25 hours ago
      expect(result).toBe(true);
    });

    it("uses default 24-hour threshold", () => {
      const recentDate = new Date("2024-01-15T11:00:00"); // 1 hour ago
      const result = isDataFresh(recentDate.toISOString());
      expect(result).toBe(true);
    });

    it("returns false for invalid date string", () => {
      const result = isDataFresh("invalid-date", 24);
      expect(result).toBe(false);
    });

    it("returns false for empty string", () => {
      const result = isDataFresh("", 24);
      expect(result).toBe(false);
    });

    it("handles zero threshold", () => {
      const now = new Date();
      const result = isDataFresh(now.toISOString(), 0);
      expect(result).toBe(true);
    });
  });

  describe("formatOpeningHours", () => {
    it("formats 24-hour time by default", () => {
      const result = formatOpeningHours("09:00", "21:00");
      expect(result).toBe("09:00 - 21:00");
    });

    it('returns "時間不明" for missing open time', () => {
      const result = formatOpeningHours("", "21:00");
      expect(result).toBe("時間不明");
    });

    it('returns "時間不明" for missing close time', () => {
      const result = formatOpeningHours("09:00", "");
      expect(result).toBe("時間不明");
    });

    it("formats 12-hour time when requested", () => {
      const result = formatOpeningHours("09:00", "21:00", { format: "12h" });
      expect(result).toContain("AM");
      expect(result).toContain("PM");
    });

    it("shows morning period when showPeriod is true", () => {
      const result = formatOpeningHours("07:00", "11:00", {
        showPeriod: true,
      });
      expect(result).toContain("(朝営業)");
    });

    it("shows night period for late hours", () => {
      const result = formatOpeningHours("18:00", "23:00", {
        showPeriod: true,
      });
      expect(result).toContain("(夜営業)");
    });

    it("shows lunch-only period", () => {
      const result = formatOpeningHours("11:00", "14:00", {
        showPeriod: true,
      });
      expect(result).toContain("(ランチのみ)");
    });

    it("formats midnight in 12-hour format", () => {
      const result = formatOpeningHours("00:00", "12:00", { format: "12h" });
      expect(result).toContain("12:00 AM");
    });

    it("formats noon in 12-hour format", () => {
      const result = formatOpeningHours("12:00", "13:00", { format: "12h" });
      expect(result).toContain("12:00 PM");
    });

    it("formats afternoon in 12-hour format", () => {
      const result = formatOpeningHours("14:00", "20:00", { format: "12h" });
      expect(result).toContain("2:00 PM");
      expect(result).toContain("8:00 PM");
    });

    it("handles both 12h format and showPeriod", () => {
      const result = formatOpeningHours("18:00", "22:00", {
        format: "12h",
        showPeriod: true,
      });
      expect(result).toContain("PM");
    });

    it("shows morning period for very early hours", () => {
      const result = formatOpeningHours("06:00", "10:00", {
        showPeriod: true,
      });
      expect(result).toContain("(朝営業)");
    });

    it("shows night period for opening after 17:00", () => {
      const result = formatOpeningHours("17:00", "21:00", {
        showPeriod: true,
      });
      expect(result).toContain("(夜営業)");
    });

    it("shows no period for mid-day hours", () => {
      const result = formatOpeningHours("12:00", "17:00", {
        showPeriod: true,
      });
      expect(result).not.toContain("(朝営業)");
      expect(result).not.toContain("(夜営業)");
      expect(result).not.toContain("(ランチのみ)");
    });

    it("handles 1 AM in 12-hour format", () => {
      const result = formatOpeningHours("01:00", "05:00", { format: "12h" });
      expect(result).toContain("1:00 AM");
    });

    it("handles 11 PM in 12-hour format", () => {
      const result = formatOpeningHours("23:00", "23:59", { format: "12h" });
      expect(result).toContain("11:00 PM");
      expect(result).toContain("11:59 PM");
    });
  });
});
