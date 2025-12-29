/**
 * @fileoverview CategoryMapper テスト
 * 18→8カテゴリ移行マッピングシステムの包括的テスト
 */

import type { CuisineType } from "@/types/restaurant.types";
import { describe, expect, it } from "vitest";
import { MarkerCategory } from "../../v2/MarkerDesignSystem";
import {
  CATEGORY_MIGRATION_MAP,
  REVERSE_CATEGORY_MAP,
  categoryIncludesCuisine,
  filterLegacyDataByNewCategories,
  generateMigrationMappingTable,
  generateMigrationReport,
  getCategoryIncludedCuisines,
  migrateCuisineToCategory,
  migrateCuisinesBatch,
  migrateLegacyFilters,
  migrateRestaurantData,
  validateMigrationQuality,
  type MigrationStatistics,
} from "../CategoryMapper";

describe("CategoryMapper", () => {
  // ==============================
  // マッピング定義テスト
  // ==============================
  describe("CATEGORY_MIGRATION_MAP", () => {
    it("18種類すべてのCuisineTypeがマッピングされている", () => {
      const allCuisineTypes: CuisineType[] = [
        "日本料理",
        "寿司",
        "海鮮",
        "そば・うどん",
        "ラーメン",
        "焼肉・焼鳥",
        "ステーキ・洋食",
        "中華",
        "イタリアン",
        "フレンチ",
        "カレー・エスニック",
        "カフェ・喫茶店",
        "デザート・スイーツ",
        "バー・居酒屋",
        "ファストフード",
        "弁当・テイクアウト",
        "レストラン",
        "その他",
      ];

      allCuisineTypes.forEach(cuisineType => {
        expect(CATEGORY_MIGRATION_MAP[cuisineType]).toBeDefined();
      });
      expect(Object.keys(CATEGORY_MIGRATION_MAP)).toHaveLength(18);
    });

    it("8種類のMarkerCategoryにマッピングされる", () => {
      const categories = new Set(Object.values(CATEGORY_MIGRATION_MAP));
      expect(categories.size).toBe(8);

      const expectedCategories: MarkerCategory[] = [
        "japanese",
        "noodles",
        "grill",
        "international",
        "cafe",
        "bar",
        "fastfood",
        "general",
      ];
      expectedCategories.forEach(category => {
        expect(categories.has(category)).toBe(true);
      });
    });
  });

  describe("REVERSE_CATEGORY_MAP", () => {
    it("8カテゴリすべてが定義されている", () => {
      expect(Object.keys(REVERSE_CATEGORY_MAP)).toHaveLength(8);
    });

    it("各カテゴリに正しいCuisineTypeが含まれている", () => {
      expect(REVERSE_CATEGORY_MAP.japanese).toEqual([
        "日本料理",
        "寿司",
        "海鮮",
        "そば・うどん",
      ]);
      expect(REVERSE_CATEGORY_MAP.noodles).toEqual(["ラーメン"]);
      expect(REVERSE_CATEGORY_MAP.grill).toEqual([
        "焼肉・焼鳥",
        "ステーキ・洋食",
      ]);
      expect(REVERSE_CATEGORY_MAP.international).toEqual([
        "中華",
        "イタリアン",
        "フレンチ",
        "カレー・エスニック",
      ]);
      expect(REVERSE_CATEGORY_MAP.cafe).toEqual([
        "カフェ・喫茶店",
        "デザート・スイーツ",
      ]);
      expect(REVERSE_CATEGORY_MAP.bar).toEqual(["バー・居酒屋"]);
      expect(REVERSE_CATEGORY_MAP.fastfood).toEqual([
        "ファストフード",
        "弁当・テイクアウト",
      ]);
      expect(REVERSE_CATEGORY_MAP.general).toEqual(["レストラン", "その他"]);
    });

    it("逆マッピングの合計が18種類になる", () => {
      const totalCuisines = Object.values(REVERSE_CATEGORY_MAP).flat();
      expect(totalCuisines).toHaveLength(18);
    });
  });

  // ==============================
  // 移行関数テスト
  // ==============================
  describe("migrateCuisineToCategory", () => {
    it("日本料理系→japanese", () => {
      expect(migrateCuisineToCategory("日本料理")).toBe("japanese");
      expect(migrateCuisineToCategory("寿司")).toBe("japanese");
      expect(migrateCuisineToCategory("海鮮")).toBe("japanese");
      expect(migrateCuisineToCategory("そば・うどん")).toBe("japanese");
    });

    it("ラーメン→noodles", () => {
      expect(migrateCuisineToCategory("ラーメン")).toBe("noodles");
    });

    it("焼肉系→grill", () => {
      expect(migrateCuisineToCategory("焼肉・焼鳥")).toBe("grill");
      expect(migrateCuisineToCategory("ステーキ・洋食")).toBe("grill");
    });

    it("多国籍料理→international", () => {
      expect(migrateCuisineToCategory("中華")).toBe("international");
      expect(migrateCuisineToCategory("イタリアン")).toBe("international");
      expect(migrateCuisineToCategory("フレンチ")).toBe("international");
      expect(migrateCuisineToCategory("カレー・エスニック")).toBe(
        "international"
      );
    });

    it("カフェ系→cafe", () => {
      expect(migrateCuisineToCategory("カフェ・喫茶店")).toBe("cafe");
      expect(migrateCuisineToCategory("デザート・スイーツ")).toBe("cafe");
    });

    it("バー・居酒屋→bar", () => {
      expect(migrateCuisineToCategory("バー・居酒屋")).toBe("bar");
    });

    it("ファストフード系→fastfood", () => {
      expect(migrateCuisineToCategory("ファストフード")).toBe("fastfood");
      expect(migrateCuisineToCategory("弁当・テイクアウト")).toBe("fastfood");
    });

    it("一般レストラン系→general", () => {
      expect(migrateCuisineToCategory("レストラン")).toBe("general");
      expect(migrateCuisineToCategory("その他")).toBe("general");
    });
  });

  describe("migrateCuisinesBatch", () => {
    it("複数のCuisineTypeをバッチ変換する", () => {
      const cuisines: CuisineType[] = ["日本料理", "ラーメン", "中華"];
      const result = migrateCuisinesBatch(cuisines);
      expect(result).toContain("japanese");
      expect(result).toContain("noodles");
      expect(result).toContain("international");
    });

    it("重複するカテゴリは1つにまとめられる", () => {
      const cuisines: CuisineType[] = ["日本料理", "寿司", "海鮮"]; // すべてjapanese
      const result = migrateCuisinesBatch(cuisines);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("japanese");
    });

    it("空配列で空配列を返す", () => {
      expect(migrateCuisinesBatch([])).toEqual([]);
    });
  });

  describe("getCategoryIncludedCuisines", () => {
    it("カテゴリに含まれるCuisineTypeを返す", () => {
      expect(getCategoryIncludedCuisines("japanese")).toEqual([
        "日本料理",
        "寿司",
        "海鮮",
        "そば・うどん",
      ]);
      expect(getCategoryIncludedCuisines("noodles")).toEqual(["ラーメン"]);
    });

    it("すべてのカテゴリで正しい結果を返す", () => {
      const allCategories: MarkerCategory[] = [
        "japanese",
        "noodles",
        "grill",
        "international",
        "cafe",
        "bar",
        "fastfood",
        "general",
      ];
      allCategories.forEach(category => {
        const cuisines = getCategoryIncludedCuisines(category);
        expect(Array.isArray(cuisines)).toBe(true);
        expect(cuisines.length).toBeGreaterThan(0);
      });
    });
  });

  describe("categoryIncludesCuisine", () => {
    it("カテゴリに含まれるCuisineTypeでtrueを返す", () => {
      expect(categoryIncludesCuisine("japanese", "日本料理")).toBe(true);
      expect(categoryIncludesCuisine("japanese", "寿司")).toBe(true);
      expect(categoryIncludesCuisine("noodles", "ラーメン")).toBe(true);
    });

    it("カテゴリに含まれないCuisineTypeでfalseを返す", () => {
      expect(categoryIncludesCuisine("japanese", "ラーメン")).toBe(false);
      expect(categoryIncludesCuisine("noodles", "日本料理")).toBe(false);
      expect(categoryIncludesCuisine("cafe", "中華")).toBe(false);
    });
  });

  // ==============================
  // データ変換テスト
  // ==============================
  describe("migrateRestaurantData", () => {
    const mockRestaurants = [
      { id: "1", name: "すし屋", cuisineType: "寿司" as CuisineType },
      { id: "2", name: "ラーメン屋", cuisineType: "ラーメン" as CuisineType },
      { id: "3", name: "焼肉店", cuisineType: "焼肉・焼鳥" as CuisineType },
      { id: "4", name: "カフェ", cuisineType: "カフェ・喫茶店" as CuisineType },
    ];

    it("すべてのレストランにnewCategoryが追加される", () => {
      const { migrated } = migrateRestaurantData(mockRestaurants);
      expect(migrated).toHaveLength(4);
      migrated.forEach(restaurant => {
        expect(restaurant.newCategory).toBeDefined();
      });
    });

    it("正しいカテゴリがマッピングされる", () => {
      const { migrated } = migrateRestaurantData(mockRestaurants);
      expect(migrated[0]?.newCategory).toBe("japanese");
      expect(migrated[1]?.newCategory).toBe("noodles");
      expect(migrated[2]?.newCategory).toBe("grill");
      expect(migrated[3]?.newCategory).toBe("cafe");
    });

    it("統計情報が正しく生成される", () => {
      const { statistics } = migrateRestaurantData(mockRestaurants);
      expect(statistics.totalRestaurants).toBe(4);
      expect(statistics.originalCategories).toBe(18);
      expect(statistics.newCategories).toBe(8);
      expect(statistics.consolidationRatio).toBeCloseTo(44.44, 1);
    });

    it("カテゴリ分布が正しく計算される", () => {
      const { statistics } = migrateRestaurantData(mockRestaurants);
      expect(statistics.categoryDistribution.japanese.count).toBe(1);
      expect(statistics.categoryDistribution.noodles.count).toBe(1);
      expect(statistics.categoryDistribution.grill.count).toBe(1);
      expect(statistics.categoryDistribution.cafe.count).toBe(1);
    });

    it("空配列で正しく動作する", () => {
      const { migrated, statistics } = migrateRestaurantData([]);
      expect(migrated).toHaveLength(0);
      expect(statistics.totalRestaurants).toBe(0);
    });

    it("元のデータが変更されない（イミュータブル）", () => {
      const original = [...mockRestaurants];
      migrateRestaurantData(mockRestaurants);
      expect(mockRestaurants).toEqual(original);
    });
  });

  // ==============================
  // 品質保証テスト
  // ==============================
  describe("validateMigrationQuality", () => {
    const createMockStatistics = (
      distribution: Partial<
        Record<MarkerCategory, { count: number; percentage: number }>
      >
    ): MigrationStatistics => {
      const fullDistribution: Record<
        MarkerCategory,
        {
          count: number;
          percentage: number;
          originalCuisines: CuisineType[];
        }
      > = {
        japanese: {
          count: 0,
          percentage: 0,
          originalCuisines: ["日本料理", "寿司", "海鮮", "そば・うどん"],
        },
        noodles: { count: 0, percentage: 0, originalCuisines: ["ラーメン"] },
        grill: {
          count: 0,
          percentage: 0,
          originalCuisines: ["焼肉・焼鳥", "ステーキ・洋食"],
        },
        international: {
          count: 0,
          percentage: 0,
          originalCuisines: [
            "中華",
            "イタリアン",
            "フレンチ",
            "カレー・エスニック",
          ],
        },
        cafe: {
          count: 0,
          percentage: 0,
          originalCuisines: ["カフェ・喫茶店", "デザート・スイーツ"],
        },
        bar: { count: 0, percentage: 0, originalCuisines: ["バー・居酒屋"] },
        fastfood: {
          count: 0,
          percentage: 0,
          originalCuisines: ["ファストフード", "弁当・テイクアウト"],
        },
        general: {
          count: 0,
          percentage: 0,
          originalCuisines: ["レストラン", "その他"],
        },
      };

      Object.entries(distribution).forEach(([key, value]) => {
        if (value) {
          fullDistribution[key as MarkerCategory].count = value.count;
          fullDistribution[key as MarkerCategory].percentage = value.percentage;
        }
      });

      const totalRestaurants = Object.values(fullDistribution).reduce(
        (sum, d) => sum + d.count,
        0
      );

      return {
        totalRestaurants,
        originalCategories: 18,
        newCategories: 8,
        consolidationRatio: 44.44,
        categoryDistribution: fullDistribution,
      };
    };

    it("バランスの良い分布でisValid: trueを返す", () => {
      const stats = createMockStatistics({
        japanese: { count: 15, percentage: 15 },
        noodles: { count: 10, percentage: 10 },
        grill: { count: 12, percentage: 12 },
        international: { count: 18, percentage: 18 },
        cafe: { count: 15, percentage: 15 },
        bar: { count: 8, percentage: 8 },
        fastfood: { count: 12, percentage: 12 },
        general: { count: 10, percentage: 10 },
      });

      const result = validateMigrationQuality(stats);
      expect(result.isValid).toBe(true);
      expect(result.coverage).toBe(100);
    });

    it("未使用カテゴリがある場合にカバレッジが下がる", () => {
      const stats = createMockStatistics({
        japanese: { count: 50, percentage: 50 },
        noodles: { count: 50, percentage: 50 },
        // 他のカテゴリは0
      });

      const result = validateMigrationQuality(stats);
      expect(result.coverage).toBe(25); // 2/8 = 25%
    });

    it("極端に偏った分布で警告を生成", () => {
      const stats = createMockStatistics({
        japanese: { count: 90, percentage: 90 },
        noodles: { count: 10, percentage: 10 },
      });

      const result = validateMigrationQuality(stats);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("データが少ないカテゴリで警告を生成", () => {
      const stats = createMockStatistics({
        japanese: { count: 95, percentage: 95 },
        noodles: { count: 1, percentage: 1 }, // 2%未満
        grill: { count: 2, percentage: 2 },
        international: { count: 1, percentage: 1 },
        cafe: { count: 1, percentage: 1 },
      });

      const result = validateMigrationQuality(stats);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ==============================
  // フィルタリング互換性テスト
  // ==============================
  describe("migrateLegacyFilters", () => {
    it("レガシーフィルターを新システムに変換する", () => {
      const legacyFilters: CuisineType[] = ["日本料理", "寿司", "ラーメン"];
      const result = migrateLegacyFilters(legacyFilters);
      expect(result).toContain("japanese");
      expect(result).toContain("noodles");
      expect(result).toHaveLength(2); // 重複排除
    });
  });

  describe("filterLegacyDataByNewCategories", () => {
    const mockData = [
      { id: "1", cuisineType: "日本料理" as CuisineType },
      { id: "2", cuisineType: "ラーメン" as CuisineType },
      { id: "3", cuisineType: "中華" as CuisineType },
      { id: "4", cuisineType: "カフェ・喫茶店" as CuisineType },
    ];

    it("カテゴリフィルターでデータを絞り込む", () => {
      const result = filterLegacyDataByNewCategories(mockData, ["japanese"]);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("1");
    });

    it("複数カテゴリでフィルタリング", () => {
      const result = filterLegacyDataByNewCategories(mockData, [
        "japanese",
        "noodles",
      ]);
      expect(result).toHaveLength(2);
    });

    it("空のフィルターで全データを返す", () => {
      const result = filterLegacyDataByNewCategories(mockData, []);
      expect(result).toHaveLength(4);
    });

    it("該当なしで空配列を返す", () => {
      const result = filterLegacyDataByNewCategories(mockData, ["bar"]);
      expect(result).toHaveLength(0);
    });
  });

  // ==============================
  // レポート生成テスト
  // ==============================
  describe("generateMigrationReport", () => {
    it("Markdown形式のレポートを生成する", () => {
      const mockRestaurants = [
        { id: "1", name: "店1", cuisineType: "日本料理" as CuisineType },
        { id: "2", name: "店2", cuisineType: "ラーメン" as CuisineType },
      ];
      const { statistics } = migrateRestaurantData(mockRestaurants);
      const report = generateMigrationReport(statistics);

      expect(report).toContain("# マーカーカテゴリ移行レポート");
      expect(report).toContain("## 移行統計");
      expect(report).toContain("総レストラン数");
      expect(report).toContain("## カテゴリ別分布");
      expect(report).toContain("## 品質評価");
    });

    it("警告がある場合に警告セクションを含む", () => {
      // 偏ったデータで警告を発生させる
      const mockRestaurants = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `店${i}`,
        cuisineType: "日本料理" as CuisineType,
      }));
      const { statistics } = migrateRestaurantData(mockRestaurants);
      const report = generateMigrationReport(statistics);

      // 偏りが大きいので推奨事項が含まれる
      expect(report).toContain("💡 推奨事項");
    });
  });

  describe("generateMigrationMappingTable", () => {
    it("Markdownテーブルを生成する", () => {
      const table = generateMigrationMappingTable();

      expect(table).toContain("# カテゴリ移行マッピング表");
      expect(table).toContain("| 新カテゴリ |");
      expect(table).toContain("| japanese |");
      expect(table).toContain("| noodles |");
      expect(table).toContain("日本料理");
      expect(table).toContain("ラーメン");
    });

    it("すべての8カテゴリが含まれる", () => {
      const table = generateMigrationMappingTable();
      const categories: MarkerCategory[] = [
        "japanese",
        "noodles",
        "grill",
        "international",
        "cafe",
        "bar",
        "fastfood",
        "general",
      ];
      categories.forEach(category => {
        expect(table).toContain(`| ${category} |`);
      });
    });
  });
});
