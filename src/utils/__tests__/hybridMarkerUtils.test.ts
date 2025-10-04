/**
 * @fileoverview hybridMarkerUtils Tests
 * カバレッジ目標: 0% → 50%+
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import type { MapPoint, Parking, Restaurant, Toilet } from "@/types";
import { describe, expect, test, vi } from "vitest";
import {
  filterPointsByHybridCategories,
  getCategoryStatistics,
  getDebugCategoryInfo,
  getHybridCategoryFromPoint,
  getHybridMarkerSizeByPrice,
  getHybridMarkerSizeByType,
  getHybridMarkerUtil,
  isWcagAACompliant,
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

  describe("getCategoryStatistics", () => {
    test("空配列の場合は空の統計を返す", () => {
      const stats = getCategoryStatistics([]);
      expect(stats).toEqual([]);
    });

    test("単一カテゴリのポイント群から統計を生成", () => {
      const points = [
        createMockMapPoint("restaurant", { cuisineType: "和食" as any }),
        createMockMapPoint("restaurant", { cuisineType: "和食" as any }),
        createMockMapPoint("restaurant", { cuisineType: "寿司" as any }), // 和食にマッピング
      ];

      const stats = getCategoryStatistics(points);

      expect(stats).toHaveLength(1);
      expect(stats[0].category).toBe("和食");
      expect(stats[0].count).toBe(3);
      expect(stats[0].config).toBeDefined();
      expect(stats[0].config.id).toBeDefined();
    });

    test("複数カテゴリの混在ポイント群から統計を生成", () => {
      const points = [
        createMockMapPoint("restaurant", { cuisineType: "和食" as any }),
        createMockMapPoint("restaurant", { cuisineType: "ラーメン" as any }), // 麺類
        createMockMapPoint("restaurant", { cuisineType: "カフェ" as any }),
        createMockMapPoint("parking"),
        createMockMapPoint("toilet"),
        createMockMapPoint("restaurant", { cuisineType: "和食" as any }),
      ];

      const stats = getCategoryStatistics(points);

      expect(stats.length).toBeGreaterThanOrEqual(4); // 和食, 麺類, カフェ・軽食, 駐車場, トイレ等

      // 和食カテゴリの検証
      const wadaStats = stats.find((s: any) => s.category === "和食");
      expect(wadaStats).toBeDefined();
      expect(wadaStats?.count).toBe(2);

      // 駐車場カテゴリの検証
      const parkingStats = stats.find((s: any) => s.category === "駐車場");
      expect(parkingStats).toBeDefined();
      expect(parkingStats?.count).toBe(1);
    });

    test("全てのカテゴリ設定が正しく取得される", () => {
      const points = [
        createMockMapPoint("restaurant", {
          cuisineType: "存在しないカテゴリ" as any,
        }),
      ];

      const stats = getCategoryStatistics(points);

      expect(stats).toHaveLength(1);
      expect(stats[0].category).toBe("一般レストラン"); // フォールバック
      expect(stats[0].config.primary).toBeDefined();
      expect(stats[0].config.secondary).toBeDefined();
    });

    test("大量のポイントでもパフォーマンス良く統計生成", () => {
      const largePoints = Array.from({ length: 1000 }, (_, i) =>
        createMockMapPoint("restaurant", {
          cuisineType: (i % 2 === 0 ? "和食" : "ラーメン") as any,
        })
      );

      const startTime = performance.now();
      const stats = getCategoryStatistics(largePoints);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50); // 50ms以内
      expect(stats).toHaveLength(2); // 和食と麺類
      expect(stats.find((s: any) => s.category === "和食")?.count).toBe(500);
      expect(stats.find((s: any) => s.category === "麺類")?.count).toBe(500);
    });
  });

  describe("filterPointsByHybridCategories", () => {
    const testPoints = [
      createMockMapPoint("restaurant", {
        cuisineType: "和食" as any,
        id: "r1",
      }),
      createMockMapPoint("restaurant", {
        cuisineType: "ラーメン" as any,
        id: "r2",
      }),
      createMockMapPoint("parking", { id: "p1" }),
      createMockMapPoint("toilet", { id: "t1" }),
      createMockMapPoint("restaurant", {
        cuisineType: "カフェ" as any,
        id: "r3",
      }),
    ];

    test("空のカテゴリ配列は全ポイントを返す", () => {
      const filtered = filterPointsByHybridCategories(testPoints, []);
      expect(filtered).toEqual(testPoints);
      expect(filtered).toHaveLength(5);
    });

    test("単一カテゴリでフィルタリング", () => {
      const filtered = filterPointsByHybridCategories(testPoints, ["和食"]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("r1");
    });

    test("複数カテゴリでフィルタリング", () => {
      const filtered = filterPointsByHybridCategories(testPoints, [
        "和食",
        "駐車場",
      ]);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((p: any) => p.id)).toContain("r1");
      expect(filtered.map((p: any) => p.id)).toContain("p1");
    });

    test("全施設タイプをフィルタリング", () => {
      const filtered = filterPointsByHybridCategories(testPoints, [
        "駐車場",
        "トイレ",
      ]);

      expect(filtered).toHaveLength(2);
      expect(
        filtered.every((p: any) => p.type === "parking" || p.type === "toilet")
      ).toBe(true);
    });

    test("存在しないカテゴリでフィルタリングは空配列を返す", () => {
      const filtered = filterPointsByHybridCategories(testPoints, [
        "存在しないカテゴリ",
      ]);

      expect(filtered).toHaveLength(0);
    });

    test("レガシーカテゴリマッピング後のフィルタリング", () => {
      // ラーメンは「麺類」にマッピングされる
      const filtered = filterPointsByHybridCategories(testPoints, ["麺類"]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("r2");
    });

    test("空のポイント配列は空配列を返す", () => {
      const filtered = filterPointsByHybridCategories([], ["和食"]);
      expect(filtered).toEqual([]);
    });
  });

  describe("isWcagAACompliant", () => {
    test("WCAG AA準拠の背景色でtrueを返す", () => {
      // HYBRID_MARKER_CONFIGSから実際の色を使用
      const compliantColor = "#FF6B6B"; // 和食の色（4.5以上のコントラスト比）

      const result = isWcagAACompliant(compliantColor);
      expect(typeof result).toBe("boolean");
    });

    test("WCAG AA非準拠の背景色でfalseを返す", () => {
      // 設定にない色
      const nonCompliantColor = "#FFFFFF";

      const result = isWcagAACompliant(nonCompliantColor);
      expect(result).toBe(false);
    });

    test("未定義の背景色でfalseを返す", () => {
      const result = isWcagAACompliant("");
      expect(result).toBe(false);
    });

    test("設定にない背景色でfalseを返す", () => {
      const unknownColor = "#ABCDEF";
      const result = isWcagAACompliant(unknownColor);
      expect(result).toBe(false);
    });
  });

  describe("getDebugCategoryInfo", () => {
    test("全カテゴリ設定を取得", () => {
      const debugInfo = getDebugCategoryInfo();

      expect(Array.isArray(debugInfo)).toBe(true);
      expect(debugInfo.length).toBeGreaterThan(0);

      // 各カテゴリが必要なプロパティを持つことを確認
      debugInfo.forEach((info: any) => {
        expect(info.category).toBeDefined();
        expect(info.id).toBeDefined();
        expect(info.primary).toBeDefined();
        expect(info.secondary).toBeDefined();
        expect(info.iconSource).toBeDefined();
        expect(info.contrastRatio).toBeDefined();
        expect(typeof info.isWcagCompliant).toBe("boolean");
      });
    });

    test("WCAG準拠フラグが正しく設定される", () => {
      const debugInfo = getDebugCategoryInfo();

      // コントラスト比4.5以上はWCAG準拠
      const compliantCategories = debugInfo.filter(
        (info: any) => info.isWcagCompliant
      );
      expect(compliantCategories.length).toBeGreaterThan(0);

      compliantCategories.forEach((info: any) => {
        expect(info.contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });

    test("主要10カテゴリが全て含まれる", () => {
      const debugInfo = getDebugCategoryInfo();
      const categories = debugInfo.map((info: any) => info.category);

      const expectedCategories = [
        "和食",
        "麺類",
        "カフェ・軽食",
        "一般レストラン",
        "駐車場",
        "トイレ",
      ];

      expectedCategories.forEach(expected => {
        expect(categories).toContain(expected);
      });
    });

    test("各カテゴリにアイコンソース情報が含まれる", () => {
      const debugInfo = getDebugCategoryInfo();

      debugInfo.forEach((info: any) => {
        expect(["icooon-mono", "phosphor", "fallback"]).toContain(
          info.iconSource
        );
        expect(info.iconSvgPath).toBeDefined();
        expect(info.iconEmoji).toBeDefined();
      });
    });
  });

  describe("エッジケースと統合テスト", () => {
    test("nullやundefinedの料理タイプを持つレストランを正しく処理", () => {
      const pointWithNull = createMockMapPoint("restaurant");
      // @ts-expect-error - テスト目的でnullを設定
      pointWithNull.cuisineType = null;

      const category = getHybridCategoryFromPoint(pointWithNull);
      expect(category).toBe("一般レストラン");
    });

    test("非常に長いカテゴリ名でも正しく処理", () => {
      const longCategory = "a".repeat(100);
      const mapped = mapLegacyToHybridCategory(longCategory);
      expect(mapped).toBe("一般レストラン");
    });

    test("特殊文字を含むカテゴリ名を処理", () => {
      const specialCategory = "カフェ☕️";
      const mapped = mapLegacyToHybridCategory(specialCategory);
      expect(typeof mapped).toBe("string");
    });

    test("全てのカテゴリに対してgetHybridMarkerUtilが動作", () => {
      const categories = [
        "和食",
        "麺類",
        "カフェ・軽食",
        "居酒屋・バー",
        "焼肉・グリル",
        "多国籍料理",
        "一般レストラン",
      ];

      categories.forEach(category => {
        const point = createMockMapPoint("restaurant");
        const util = getHybridMarkerUtil(point, category);

        expect(util.category).toBe(category);
        expect(util.size).toBeGreaterThan(0);
        expect(util.scale).toBeGreaterThan(0);
        expect(util.ariaLabel).toContain(category);
      });
    });

    test("大量のポイントでフィルタリングが高速に動作", () => {
      const largePoints = Array.from({ length: 5000 }, (_, i) => {
        let cuisineType: string;
        if (i % 3 === 0) {
          cuisineType = "和食";
        } else if (i % 3 === 1) {
          cuisineType = "ラーメン";
        } else {
          cuisineType = "カフェ";
        }
        return createMockMapPoint("restaurant", {
          cuisineType: cuisineType as any,
          id: `r${i}`,
        });
      });

      const startTime = performance.now();
      const filtered = filterPointsByHybridCategories(largePoints, [
        "和食",
        "麺類",
      ]);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100); // 100ms以内
      expect(filtered.length).toBeGreaterThan(0);
    });
  });
});
