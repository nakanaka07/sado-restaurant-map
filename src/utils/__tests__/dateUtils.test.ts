import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDateForDisplay,
  formatDayShort,
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
});
