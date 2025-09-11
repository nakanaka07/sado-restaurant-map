import type { OpeningHours } from "@/types";
import { BusinessStatus } from "@/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateBusinessStatus,
  formatBusinessHoursForDisplay,
} from "../businessHours";

// モックの現在時刻を設定（月曜日 12:30 JST）
const mockNow = new Date("2024-01-15T12:30:00+09:00");

describe("businessHours", () => {
  beforeEach(() => {
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateBusinessStatus", () => {
    it("営業中の場合、営業中を返す", () => {
      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "11:00", close: "14:00", isHoliday: false },
        { day: "火曜日", open: "11:00", close: "14:00", isHoliday: false },
        { day: "水曜日", open: "11:00", close: "14:00", isHoliday: false },
        { day: "木曜日", open: "11:00", close: "14:00", isHoliday: false },
        { day: "金曜日", open: "11:00", close: "14:00", isHoliday: false },
        { day: "土曜日", open: "11:00", close: "14:00", isHoliday: false },
        { day: "日曜日", open: "11:00", close: "14:00", isHoliday: false },
      ];

      const status = calculateBusinessStatus(openingHours);
      expect(status).toBe(BusinessStatus.OPEN);
    });

    it("営業時間外の場合、閉店中を返す", () => {
      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "火曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "水曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "木曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "金曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "土曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "日曜日", open: "18:00", close: "22:00", isHoliday: false },
      ];

      const status = calculateBusinessStatus(openingHours);
      expect(status).toBe(BusinessStatus.CLOSED);
    });

    it("定休日の場合、閉店中を返す", () => {
      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "", close: "", isHoliday: true }, // 定休日
        { day: "火曜日", open: "11:00", close: "14:00", isHoliday: false },
      ];

      const status = calculateBusinessStatus(openingHours);
      expect(status).toBe(BusinessStatus.CLOSED);
    });

    it("営業時間情報がない場合、不明を返す", () => {
      const status = calculateBusinessStatus([]);
      expect(status).toBe(BusinessStatus.UNKNOWN);
    });
  });

  describe("formatBusinessHoursForDisplay", () => {
    it("通常の営業時間をフォーマット", () => {
      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "11:00", close: "14:00", isHoliday: false },
        { day: "水曜日", open: "", close: "", isHoliday: true }, // 定休日
      ];

      const formatted = formatBusinessHoursForDisplay(openingHours);
      expect(formatted).toContain("11:00");
      expect(formatted).toContain("14:00");
    });

    it("営業時間情報がない場合、適切なメッセージを返す", () => {
      const formatted = formatBusinessHoursForDisplay([]);
      expect(formatted).toBe("営業時間不明");
    });
  });
});
