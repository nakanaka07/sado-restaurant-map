/**
 * @fileoverview hybridMarkerUtils Tests
 * カバレッジ目標: 0% → 50%+
 */

import type { MapPoint, Parking, Restaurant, Toilet } from "@/types";
import { describe, expect, test, vi } from "vitest";
import {
  getHybridCategoryFromPoint,
  getHybridMarkerSizeByPrice,
  getHybridMarkerSizeByType,
  getHybridMarkerUtil,
  loadSvgIcon,
  mapLegacyToHybridCategory,
} from "../hybridMarkerUtils";

/**
 * テスト用モックデータ生成
 */
const createMockMapPoint = (
  type: "restaurant" | "parking" | "toilet",
  overrides?: Partial<MapPoint>
): MapPoint => {
  const base = {
    id: "test-1",
    name: "テスト施設",
    type,
    coordinates: { lat: 38.0, lng: 138.5 },
    address: "佐渡市",
    district: "両津" as const,
    features: [] as readonly string[],
    lastUpdated: new Date().toISOString(),
  };

  if (type === "restaurant") {
    return {
      ...base,
      type: "restaurant",
      cuisineType: "日本料理",
      priceRange: "1000-2000円",
      openingHours: [],
      ...overrides,
    } as Restaurant;
  } else if (type === "parking") {
    return {
      ...base,
      type: "parking",
      ...overrides,
    } as Parking;
  } else {
    return {
      ...base,
      type: "toilet",
      ...overrides,
    } as Toilet;
  }
};

describe("hybridMarkerUtils", () => {
  describe("mapLegacyToHybridCategory", () => {
    test("レガシーカテゴリを新10カテゴリにマッピング", () => {
      // 和食系
      expect(mapLegacyToHybridCategory("和食")).toBe("和食");
      expect(mapLegacyToHybridCategory("寿司")).toBe("和食");
      expect(mapLegacyToHybridCategory("天ぷら")).toBe("和食");

      // 麺類
      expect(mapLegacyToHybridCategory("ラーメン")).toBe("麺類");
      expect(mapLegacyToHybridCategory("そば")).toBe("麺類");
      expect(mapLegacyToHybridCategory("うどん")).toBe("麺類");

      // 焼肉・グリル
      expect(mapLegacyToHybridCategory("焼肉")).toBe("焼肉・グリル");
      expect(mapLegacyToHybridCategory("焼鳥")).toBe("焼肉・グリル");

      // 多国籍料理
      expect(mapLegacyToHybridCategory("イタリアン")).toBe("多国籍料理");
      expect(mapLegacyToHybridCategory("フレンチ")).toBe("多国籍料理");
      expect(mapLegacyToHybridCategory("中華")).toBe("多国籍料理");

      // カフェ・軽食
      expect(mapLegacyToHybridCategory("カフェ")).toBe("カフェ・軽食");
      expect(mapLegacyToHybridCategory("喫茶店")).toBe("カフェ・軽食");

      // 居酒屋・バー
      expect(mapLegacyToHybridCategory("居酒屋")).toBe("居酒屋・バー");
      expect(mapLegacyToHybridCategory("バー")).toBe("居酒屋・バー");

      // 一般レストラン
      expect(mapLegacyToHybridCategory("洋食")).toBe("一般レストラン");
    });

    test("未定義のレガシーカテゴリは一般レストランにフォールバック", () => {
      expect(mapLegacyToHybridCategory("存在しないカテゴリ")).toBe(
        "一般レストラン"
      );
      expect(mapLegacyToHybridCategory("")).toBe("一般レストラン");
    });
  });

  describe("getHybridCategoryFromPoint", () => {
    test("駐車場タイプは駐車場カテゴリを返す", () => {
      const point = createMockMapPoint("parking");
      expect(getHybridCategoryFromPoint(point)).toBe("駐車場");
    });

    test("トイレタイプはトイレカテゴリを返す", () => {
      const point = createMockMapPoint("toilet");
      expect(getHybridCategoryFromPoint(point)).toBe("トイレ");
    });

    test("レストランタイプは料理ジャンルから判定", () => {
      // テスト用: LEGACY_CATEGORY_MAPPINGで「和食」→「和食」を検証
      const point = createMockMapPoint("restaurant");
      // @ts-expect-error - テスト目的でレガシーカテゴリを設定
      point.cuisineType = "和食";
      expect(getHybridCategoryFromPoint(point)).toBe("和食");
    });

    test("料理ジャンルがないレストランは一般レストラン", () => {
      const point = createMockMapPoint("restaurant");
      expect(getHybridCategoryFromPoint(point)).toBe("一般レストラン");
    });
  });

  describe("getHybridMarkerSizeByPrice", () => {
    test("価格帯に応じたサイズを返す", () => {
      expect(getHybridMarkerSizeByPrice("～1000円")).toBe(48);
      expect(getHybridMarkerSizeByPrice("1000-2000円")).toBe(52);
      expect(getHybridMarkerSizeByPrice("2000-3000円")).toBe(56);
      expect(getHybridMarkerSizeByPrice("3000円～")).toBe(60);
    });

    test("価格帯がない場合はベースサイズを返す", () => {
      expect(getHybridMarkerSizeByPrice()).toBe(52);
      expect(getHybridMarkerSizeByPrice(undefined, 48)).toBe(48);
    });

    test("未定義の価格帯はベースサイズを返す", () => {
      expect(getHybridMarkerSizeByPrice("不明な価格帯")).toBe(52);
    });
  });

  describe("getHybridMarkerSizeByType", () => {
    test("駐車場は50pxを返す", () => {
      const point = createMockMapPoint("parking");
      expect(getHybridMarkerSizeByType(point)).toBe(50);
    });

    test("トイレは50pxを返す", () => {
      const point = createMockMapPoint("toilet");
      expect(getHybridMarkerSizeByType(point)).toBe(50);
    });

    test("レストランは価格帯考慮したサイズを返す", () => {
      const point1 = createMockMapPoint("restaurant", {
        priceRange: "～1000円",
      });
      expect(getHybridMarkerSizeByType(point1)).toBe(48);

      const point2 = createMockMapPoint("restaurant", {
        priceRange: "3000円～",
      });
      expect(getHybridMarkerSizeByType(point2)).toBe(60);
    });

    test("価格帯なしレストランは標準サイズ52pxを返す", () => {
      const point = createMockMapPoint("restaurant");
      expect(getHybridMarkerSizeByType(point)).toBe(52);
    });
  });

  describe("loadSvgIcon", () => {
    test("SVGファイルの読み込み成功", async () => {
      const mockFetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("<svg>test</svg>"),
      } as Response);
      global.fetch = mockFetch;

      const result = await loadSvgIcon("/test-icon.svg");
      expect(result).toBe("<svg>test</svg>");
      expect(mockFetch).toHaveBeenCalledWith("/test-icon.svg");
    });

    test("SVGファイルの読み込み失敗（404等）", async () => {
      const mockFetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: false,
      } as Response);
      global.fetch = mockFetch;

      const result = await loadSvgIcon("/nonexistent.svg");
      expect(result).toBeNull();
    });

    test("ネットワークエラー時はnullを返す", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
      global.fetch = mockFetch;

      const result = await loadSvgIcon("/error.svg");
      expect(result).toBeNull();
    });
  });

  describe("getHybridMarkerUtil", () => {
    test("レストランポイントから完全な設定を生成", () => {
      const point = createMockMapPoint("restaurant", {
        priceRange: "1000-2000円",
        rating: 4.5,
      });
      // @ts-expect-error - テスト目的でレガシーカテゴリを設定
      point.cuisineType = "和食";

      const util = getHybridMarkerUtil(point);

      expect(util.category).toBe("和食"); // LEGACY_CATEGORY_MAPPING: "和食" -> "和食"
      expect(util.size).toBe(52);
      expect(util.scale).toBeCloseTo(1.0);
      expect(util.showBadge).toBe(true);
      expect(util.ariaLabel).toContain("和食");
      expect(util.ariaLabel).toContain("テスト施設");
      expect(util.ariaLabel).toContain("評価4.5星");
    });

    test("駐車場ポイントから設定を生成", () => {
      const point = createMockMapPoint("parking", {
        name: "佐渡中央駐車場",
      });

      const util = getHybridMarkerUtil(point);

      expect(util.category).toBe("駐車場");
      expect(util.size).toBe(50);
      expect(util.ariaLabel).toContain("駐車場のマーカー: 佐渡中央駐車場");
    });

    test("トイレポイントから設定を生成", () => {
      const point = createMockMapPoint("toilet", {
        name: "公共トイレ",
      });

      const util = getHybridMarkerUtil(point);

      expect(util.category).toBe("トイレ");
      expect(util.size).toBe(50);
      expect(util.ariaLabel).toContain("トイレのマーカー: 公共トイレ");
    });

    test("カスタムカテゴリ指定が優先される", () => {
      const point = createMockMapPoint("restaurant", {
        cuisineType: "日本料理",
      });

      const util = getHybridMarkerUtil(point, "カフェ");

      expect(util.category).toBe("カフェ");
    });

    test("評価なしレストランはアクセシビリティラベルに評価を含まない", () => {
      const point = createMockMapPoint("restaurant", {
        cuisineType: "ステーキ・洋食",
      });

      const util = getHybridMarkerUtil(point);

      expect(util.ariaLabel).not.toContain("評価");
    });

    test("未定義カテゴリは一般レストラン設定にフォールバック", () => {
      const point = createMockMapPoint("restaurant", {
        cuisineType: "その他",
      });

      const util = getHybridMarkerUtil(point);

      // HYBRID_MARKER_CONFIGS["一般レストラン"]の設定が使用される
      expect(util.category).toBe("一般レストラン");
      expect(util.id).toBeDefined();
      expect(util.primary).toBeDefined();
      expect(util.secondary).toBeDefined();
    });

    test("スケール計算が52px基準で正しく動作", () => {
      // 48px = scale 0.923
      const point1 = createMockMapPoint("restaurant", {
        priceRange: "～1000円",
      });
      expect(getHybridMarkerUtil(point1).scale).toBeCloseTo(48 / 52);

      // 60px = scale 1.154
      const point2 = createMockMapPoint("restaurant", {
        priceRange: "3000円～",
      });
      expect(getHybridMarkerUtil(point2).scale).toBeCloseTo(60 / 52);
    });
  });
});
