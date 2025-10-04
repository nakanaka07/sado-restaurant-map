import type { OpeningHours } from "@/types";
import { BusinessStatus } from "@/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateBusinessStatus,
  formatBusinessHoursForDisplay,
  mapCategoryToCuisineType,
  organizeDetailedHours,
} from "../businessHours";

describe("businessHours - 強化版", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateBusinessStatus - 精度向上テスト", () => {
    it("営業中の場合、営業中を返す", () => {
      // 確実に月曜日12:30として認識される日時を作成
      const mondayDate = new Date(2024, 0, 15, 12, 30); // 年, 月(0ベース), 日, 時, 分

      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "11:00", close: "15:00", isHoliday: false },
        { day: "火曜日", open: "11:00", close: "15:00", isHoliday: false },
        { day: "水曜日", open: "11:00", close: "15:00", isHoliday: false },
        { day: "木曜日", open: "11:00", close: "15:00", isHoliday: false },
        { day: "金曜日", open: "11:00", close: "15:00", isHoliday: false },
        { day: "土曜日", open: "11:00", close: "15:00", isHoliday: false },
        { day: "日曜日", open: "11:00", close: "15:00", isHoliday: false },
      ];

      const status = calculateBusinessStatus(openingHours, mondayDate);
      expect(status).toBe(BusinessStatus.OPEN);
    });

    it("営業時間外の場合、閉店中を返す", () => {
      // 確実に月曜日12:30として認識される日時を作成
      const mondayDate = new Date(2024, 0, 15, 12, 30);

      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "火曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "水曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "木曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "金曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "土曜日", open: "18:00", close: "22:00", isHoliday: false },
        { day: "日曜日", open: "18:00", close: "22:00", isHoliday: false },
      ];

      const status = calculateBusinessStatus(openingHours, mondayDate);
      expect(status).toBe(BusinessStatus.CLOSED);
    });

    it("定休日の場合、閉店中を返す", () => {
      // 確実に月曜日12:30として認識される日時を作成
      const mondayDate = new Date(2024, 0, 15, 12, 30);

      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "", close: "", isHoliday: true }, // 定休日
        { day: "火曜日", open: "11:00", close: "14:00", isHoliday: false },
      ];

      const status = calculateBusinessStatus(openingHours, mondayDate);
      expect(status).toBe(BusinessStatus.CLOSED);
    });

    it("営業時間情報がない場合、不明を返す", () => {
      const status = calculateBusinessStatus([]);
      expect(status).toBe(BusinessStatus.UNKNOWN);
    });

    // 精度向上のための新しいテストケース
    it("曜日異表記に対応する", () => {
      const mondayDate = new Date(2024, 0, 15, 12, 30); // 月曜日

      const openingHours: readonly OpeningHours[] = [
        { day: "月", open: "11:00", close: "15:00", isHoliday: false }, // 省略形
        { day: "Tue", open: "11:00", close: "15:00", isHoliday: false }, // 英語略称
      ];

      const status = calculateBusinessStatus(openingHours, mondayDate);
      expect(status).toBe(BusinessStatus.OPEN);
    });

    it("分割営業時間に対応する（複数エントリ）", () => {
      const mondayDate = new Date(2024, 0, 15, 12, 30); // 月曜日 12:30

      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "11:00", close: "14:00", isHoliday: false }, // ランチ
        { day: "月曜日", open: "17:00", close: "21:00", isHoliday: false }, // ディナー
      ];

      const status = calculateBusinessStatus(openingHours, mondayDate);
      expect(status).toBe(BusinessStatus.OPEN); // ランチタイム中
    });

    it("深夜営業（日をまたぐ）に対応する", () => {
      const lateNightDate = new Date(2024, 0, 16, 1, 30); // 火曜日 01:30

      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "18:00", close: "02:00", isHoliday: false }, // 月曜 18:00-火曜 02:00
      ];

      const status = calculateBusinessStatus(openingHours, lateNightDate);
      expect(status).toBe(BusinessStatus.OPEN);
    });

    it("24時間営業に対応する", () => {
      const anytimeDate = new Date(2024, 0, 15, 3, 0); // 月曜日 03:00

      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "00:00", close: "24:00", isHoliday: false },
      ];

      const status = calculateBusinessStatus(openingHours, anytimeDate);
      expect(status).toBe(BusinessStatus.OPEN);
    });

    it("時間表記の正規化に対応する", () => {
      const mondayDate = new Date(2024, 0, 15, 12, 30); // 月曜日

      const openingHours: readonly OpeningHours[] = [
        {
          day: "月曜日",
          open: "11時30分",
          close: "14時00分",
          isHoliday: false,
        }, // 日本語表記
        { day: "火曜日", open: "11：30", close: "14：00", isHoliday: false }, // 全角コロン
        { day: "水曜日", open: "1130", close: "1400", isHoliday: false }, // 数字のみ
      ];

      const status = calculateBusinessStatus(openingHours, mondayDate);
      expect(status).toBe(BusinessStatus.OPEN);
    });
  });

  describe("formatBusinessHoursForDisplay - 精度向上テスト", () => {
    beforeEach(() => {
      vi.setSystemTime(new Date(2024, 0, 15, 12, 30)); // 月曜日 12:30
    });

    it("通常の営業時間をフォーマット", () => {
      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "11:00", close: "14:00", isHoliday: false },
        { day: "水曜日", open: "", close: "", isHoliday: true }, // 定休日
      ];

      const formatted = formatBusinessHoursForDisplay(openingHours);
      // 関数は「本日 11:00-14:00」の形式で返すため
      expect(formatted).toContain("11:00");
      expect(formatted).toContain("14:00");
    });

    it("営業時間情報がない場合、適切なメッセージを返す", () => {
      const formatted = formatBusinessHoursForDisplay([]);
      expect(formatted).toBe("営業時間不明");
    });

    // 精度向上のための新しいテストケース
    it("分割営業時間をフォーマット", () => {
      const openingHours: readonly OpeningHours[] = [
        {
          day: "月曜日",
          open: "11:00-14:00,17:00-21:00",
          close: "",
          isHoliday: false,
        },
      ];

      // 月曜日（1）として評価
      const formatted = formatBusinessHoursForDisplay(openingHours, 1);
      expect(formatted).toContain("本日");
      expect(formatted).toContain("11:00");
      expect(formatted).toContain("21:00");
    });

    it("ラストオーダー表記を保持", () => {
      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "17:00", close: "21:00(L.O)", isHoliday: false },
      ];

      // 月曜日（1）として評価
      const formatted = formatBusinessHoursForDisplay(openingHours, 1);
      expect(formatted).toContain("L.O");
    });

    it("24時間営業を表示", () => {
      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "00:00", close: "24:00", isHoliday: false },
      ];

      const formatted = formatBusinessHoursForDisplay(openingHours);
      expect(formatted).toContain("24時間営業");
    });

    it("定休日を表示", () => {
      const openingHours: readonly OpeningHours[] = [
        { day: "月曜日", open: "", close: "", isHoliday: true },
      ];

      // 月曜日（1）として評価
      const formatted = formatBusinessHoursForDisplay(openingHours, 1);
      expect(formatted).toBe("本日定休日");
    });

    it("異なる時間表記フォーマットを正規化", () => {
      const openingHours: readonly OpeningHours[] = [
        {
          day: "月曜日",
          open: "11時30分",
          close: "14時00分",
          isHoliday: false,
        },
      ];

      const formatted = formatBusinessHoursForDisplay(openingHours);
      expect(formatted).toContain("11:30");
      expect(formatted).toContain("14:00");
    });
  });

  /**
   * organizeDetailedHours のテスト
   */
  describe("organizeDetailedHours", () => {
    it("converts OpeningHours array to DetailedOpeningHours object", () => {
      const hours: OpeningHours[] = [
        { day: "月曜日", open: "11:00", close: "20:00", isHoliday: false },
        { day: "火曜日", open: "11:00", close: "20:00", isHoliday: false },
      ];

      const result = organizeDetailedHours(hours);

      expect(result.monday).toEqual({
        open: "11:00",
        close: "20:00",
        isClosed: false,
      });
      expect(result.tuesday).toEqual({
        open: "11:00",
        close: "20:00",
        isClosed: false,
      });
    });

    it("handles holiday flag as isClosed", () => {
      const hours: OpeningHours[] = [
        { day: "水曜日", open: "", close: "", isHoliday: true },
      ];

      const result = organizeDetailedHours(hours);

      expect(result.wednesday).toEqual({
        open: "",
        close: "",
        isClosed: true,
      });
    });

    it("returns empty object for empty array", () => {
      const result = organizeDetailedHours([]);

      expect(result).toEqual({});
    });

    it("handles all 7 days correctly", () => {
      const hours: OpeningHours[] = [
        { day: "月曜日", open: "09:00", close: "17:00", isHoliday: false },
        { day: "火曜日", open: "09:00", close: "17:00", isHoliday: false },
        { day: "水曜日", open: "09:00", close: "17:00", isHoliday: false },
        { day: "木曜日", open: "09:00", close: "17:00", isHoliday: false },
        { day: "金曜日", open: "09:00", close: "17:00", isHoliday: false },
        { day: "土曜日", open: "10:00", close: "16:00", isHoliday: false },
        { day: "日曜日", open: "10:00", close: "16:00", isHoliday: false },
      ];

      const result = organizeDetailedHours(hours);

      expect(Object.keys(result)).toHaveLength(7);
      expect(result.saturday?.open).toBe("10:00");
      expect(result.sunday?.close).toBe("16:00");
    });
  });

  /**
   * mapCategoryToCuisineType のテスト
   */
  describe("mapCategoryToCuisineType", () => {
    describe("Japanese cuisine mapping", () => {
      it('maps "寿司" to "寿司"', () => {
        expect(mapCategoryToCuisineType("寿司")).toBe("寿司");
        expect(mapCategoryToCuisineType("sushi")).toBe("寿司");
      });

      it('maps "ラーメン" to "ラーメン"', () => {
        expect(mapCategoryToCuisineType("ラーメン")).toBe("ラーメン");
        expect(mapCategoryToCuisineType("RAMEN")).toBe("ラーメン");
      });

      it('maps "和食" to "日本料理"', () => {
        expect(mapCategoryToCuisineType("和食")).toBe("日本料理");
        expect(mapCategoryToCuisineType("日本料理")).toBe("日本料理");
      });
    });

    describe("Western cuisine mapping", () => {
      it('maps "イタリアン" to "イタリアン"', () => {
        expect(mapCategoryToCuisineType("イタリアン")).toBe("イタリアン");
        expect(mapCategoryToCuisineType("italian")).toBe("イタリアン");
      });

      it('maps "フレンチ" to "フレンチ"', () => {
        expect(mapCategoryToCuisineType("フレンチ")).toBe("フレンチ");
        expect(mapCategoryToCuisineType("french")).toBe("フレンチ");
      });
    });

    describe("Other cuisine mapping", () => {
      it('maps "カフェ" to "カフェ・喫茶店"', () => {
        expect(mapCategoryToCuisineType("カフェ")).toBe("カフェ・喫茶店");
        expect(mapCategoryToCuisineType("cafe")).toBe("カフェ・喫茶店");
      });

      it('maps "中華" to "中華"', () => {
        expect(mapCategoryToCuisineType("中華")).toBe("中華");
        expect(mapCategoryToCuisineType("chinese")).toBe("中華");
      });
    });

    describe("Fallback behavior", () => {
      it('returns "その他" for unknown categories', () => {
        expect(mapCategoryToCuisineType("未知のカテゴリー")).toBe("その他");
        expect(mapCategoryToCuisineType("random")).toBe("その他");
      });
    });
  });
});
