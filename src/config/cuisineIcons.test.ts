/**
 * @fileoverview Tests for cuisineIcons configuration
 * 料理ジャンルアイコン設定のテスト
 */

import { describe, expect, it } from "vitest";
import {
  CUISINE_ICONS,
  getCuisineIconUrl,
  hasCuisineIcon,
} from "./cuisineIcons";

describe("cuisineIcons", () => {
  describe("CUISINE_ICONS", () => {
    it("すべての料理ジャンルに対応するアイコンが定義されている", () => {
      const expectedCuisines = [
        "日本料理",
        "寿司",
        "海鮮",
        "焼肉・焼鳥",
        "ラーメン",
        "そば・うどん",
        "中華",
        "イタリアン",
        "フレンチ",
        "カフェ・喫茶店",
        "バー・居酒屋",
        "ファストフード",
        "デザート・スイーツ",
        "カレー・エスニック",
        "ステーキ・洋食",
        "弁当・テイクアウト",
        "レストラン",
        "その他",
      ];

      expectedCuisines.forEach(cuisine => {
        expect(CUISINE_ICONS).toHaveProperty(cuisine);
      });
    });

    it("すべてのアイコンURLが文字列である", () => {
      Object.values(CUISINE_ICONS).forEach(iconUrl => {
        expect(typeof iconUrl).toBe("string");
        expect(iconUrl.length).toBeGreaterThan(0);
      });
    });

    it("日本料理のアイコンが定義されている", () => {
      expect(CUISINE_ICONS["日本料理"]).toBeDefined();
      expect(typeof CUISINE_ICONS["日本料理"]).toBe("string");
    });

    it("寿司のアイコンが定義されている", () => {
      expect(CUISINE_ICONS["寿司"]).toBeDefined();
      expect(typeof CUISINE_ICONS["寿司"]).toBe("string");
    });

    it("ラーメンのアイコンが定義されている", () => {
      expect(CUISINE_ICONS["ラーメン"]).toBeDefined();
      expect(typeof CUISINE_ICONS["ラーメン"]).toBe("string");
    });

    it("カフェ・喫茶店のアイコンが定義されている", () => {
      expect(CUISINE_ICONS["カフェ・喫茶店"]).toBeDefined();
      expect(typeof CUISINE_ICONS["カフェ・喫茶店"]).toBe("string");
    });

    it("その他のアイコンが定義されている", () => {
      expect(CUISINE_ICONS["その他"]).toBeDefined();
      expect(typeof CUISINE_ICONS["その他"]).toBe("string");
    });

    it("合計18種類の料理ジャンルが定義されている", () => {
      const cuisineCount = Object.keys(CUISINE_ICONS).length;
      expect(cuisineCount).toBe(18);
    });
  });

  describe("getCuisineIconUrl", () => {
    it("日本料理のアイコンURLを取得できる", () => {
      const iconUrl = getCuisineIconUrl("日本料理");
      expect(typeof iconUrl).toBe("string");
      expect(iconUrl.length).toBeGreaterThan(0);
      expect(iconUrl).toBe(CUISINE_ICONS["日本料理"]);
    });

    it("寿司のアイコンURLを取得できる", () => {
      const iconUrl = getCuisineIconUrl("寿司");
      expect(iconUrl).toBe(CUISINE_ICONS["寿司"]);
    });

    it("ラーメンのアイコンURLを取得できる", () => {
      const iconUrl = getCuisineIconUrl("ラーメン");
      expect(iconUrl).toBe(CUISINE_ICONS["ラーメン"]);
    });

    it("イタリアンのアイコンURLを取得できる", () => {
      const iconUrl = getCuisineIconUrl("イタリアン");
      expect(iconUrl).toBe(CUISINE_ICONS["イタリアン"]);
    });

    it("カフェ・喫茶店のアイコンURLを取得できる", () => {
      const iconUrl = getCuisineIconUrl("カフェ・喫茶店");
      expect(iconUrl).toBe(CUISINE_ICONS["カフェ・喫茶店"]);
    });

    it("バー・居酒屋のアイコンURLを取得できる", () => {
      const iconUrl = getCuisineIconUrl("バー・居酒屋");
      expect(iconUrl).toBe(CUISINE_ICONS["バー・居酒屋"]);
    });

    it("ファストフードのアイコンURLを取得できる", () => {
      const iconUrl = getCuisineIconUrl("ファストフード");
      expect(iconUrl).toBe(CUISINE_ICONS["ファストフード"]);
    });

    it("その他のアイコンURLを取得できる", () => {
      const iconUrl = getCuisineIconUrl("その他");
      expect(iconUrl).toBe(CUISINE_ICONS["その他"]);
    });

    it("すべての料理ジャンルでアイコンURLを取得できる", () => {
      Object.keys(CUISINE_ICONS).forEach(cuisine => {
        const iconUrl = getCuisineIconUrl(
          cuisine as keyof typeof CUISINE_ICONS
        );
        expect(typeof iconUrl).toBe("string");
        expect(iconUrl.length).toBeGreaterThan(0);
      });
    });
  });

  describe("hasCuisineIcon", () => {
    it("日本料理のアイコンが存在する", () => {
      expect(hasCuisineIcon("日本料理")).toBe(true);
    });

    it("寿司のアイコンが存在する", () => {
      expect(hasCuisineIcon("寿司")).toBe(true);
    });

    it("ラーメンのアイコンが存在する", () => {
      expect(hasCuisineIcon("ラーメン")).toBe(true);
    });

    it("イタリアンのアイコンが存在する", () => {
      expect(hasCuisineIcon("イタリアン")).toBe(true);
    });

    it("カフェ・喫茶店のアイコンが存在する", () => {
      expect(hasCuisineIcon("カフェ・喫茶店")).toBe(true);
    });

    it("その他のアイコンが存在する", () => {
      expect(hasCuisineIcon("その他")).toBe(true);
    });

    it("すべての料理ジャンルでhasCuisineIconがtrueを返す", () => {
      Object.keys(CUISINE_ICONS).forEach(cuisine => {
        expect(hasCuisineIcon(cuisine as keyof typeof CUISINE_ICONS)).toBe(
          true
        );
      });
    });
  });

  describe("アイコンの整合性", () => {
    it("getCuisineIconUrlとCUISINE_ICONSの値が一致する", () => {
      Object.keys(CUISINE_ICONS).forEach(cuisine => {
        const cuisineKey = cuisine as keyof typeof CUISINE_ICONS;
        expect(getCuisineIconUrl(cuisineKey)).toBe(CUISINE_ICONS[cuisineKey]);
      });
    });

    it("hasCuisineIconとCUISINE_ICONSのキーが一致する", () => {
      Object.keys(CUISINE_ICONS).forEach(cuisine => {
        const cuisineKey = cuisine as keyof typeof CUISINE_ICONS;
        expect(hasCuisineIcon(cuisineKey)).toBe(cuisineKey in CUISINE_ICONS);
      });
    });
  });
});
