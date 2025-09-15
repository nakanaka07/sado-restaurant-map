/**
 * @fileoverview マーカーカテゴリ移行システム
 * 18種類→8種類への統合マッピングとデータ変換
 *
 * 🎯 目的:
 * 1. レガシーシステムからの段階的移行
 * 2. データ整合性の保証
 * 3. 後方互換性の維持
 */

import type { CuisineType } from "@/types/restaurant.types";
import {
  MarkerCategory,
  getCategoryDisplayName,
} from "../v2/MarkerDesignSystem";

// ==============================
// カテゴリマッピング定義
// ==============================

/** 18→8カテゴリマッピングルール */
export const CATEGORY_MIGRATION_MAP: Record<CuisineType, MarkerCategory> = {
  // 和食系 (4種類→1カテゴリ)
  日本料理: "japanese",
  寿司: "japanese",
  海鮮: "japanese",
  "そば・うどん": "japanese",

  // 麺類 (特別枠で独立)
  ラーメン: "noodles",

  // 焼肉・グリル系 (2種類→1カテゴリ)
  "焼肉・焼鳥": "grill",
  "ステーキ・洋食": "grill",

  // 多国籍料理系 (4種類→1カテゴリ)
  中華: "international",
  イタリアン: "international",
  フレンチ: "international",
  "カレー・エスニック": "international",

  // カフェ・軽食系 (2種類→1カテゴリ)
  "カフェ・喫茶店": "cafe",
  "デザート・スイーツ": "cafe",

  // 居酒屋・バー (独立)
  "バー・居酒屋": "bar",

  // ファストフード系 (2種類→1カテゴリ)
  ファストフード: "fastfood",
  "弁当・テイクアウト": "fastfood",

  // 一般レストラン系 (2種類→1カテゴリ)
  レストラン: "general",
  その他: "general",
} as const;

/** 逆マッピング: 新カテゴリ→含まれる旧カテゴリ */
export const REVERSE_CATEGORY_MAP: Record<MarkerCategory, CuisineType[]> = {
  japanese: ["日本料理", "寿司", "海鮮", "そば・うどん"],
  noodles: ["ラーメン"],
  grill: ["焼肉・焼鳥", "ステーキ・洋食"],
  international: ["中華", "イタリアン", "フレンチ", "カレー・エスニック"],
  cafe: ["カフェ・喫茶店", "デザート・スイーツ"],
  bar: ["バー・居酒屋"],
  fastfood: ["ファストフード", "弁当・テイクアウト"],
  general: ["レストラン", "その他"],
} as const;

// ==============================
// 移行関数
// ==============================

/**
 * レガシー料理ジャンルを新カテゴリに変換
 */
export const migrateCuisineToCategory = (
  cuisineType: CuisineType
): MarkerCategory => {
  return CATEGORY_MIGRATION_MAP[cuisineType];
};

/**
 * 複数の料理ジャンルを新カテゴリにバッチ変換
 */
export const migrateCuisinesBatch = (
  cuisineTypes: CuisineType[]
): MarkerCategory[] => {
  return [...new Set(cuisineTypes.map(migrateCuisineToCategory))];
};

/**
 * 新カテゴリに含まれる料理ジャンルを取得
 */
export const getCategoryIncludedCuisines = (
  category: MarkerCategory
): CuisineType[] => {
  return REVERSE_CATEGORY_MAP[category] || [];
};

/**
 * カテゴリが特定の料理ジャンルを含むかチェック
 */
export const categoryIncludesCuisine = (
  category: MarkerCategory,
  cuisineType: CuisineType
): boolean => {
  return REVERSE_CATEGORY_MAP[category]?.includes(cuisineType) ?? false;
};

// ==============================
// データ変換インターフェース
// ==============================

/** 移行統計情報 */
export interface MigrationStatistics {
  readonly totalRestaurants: number;
  readonly originalCategories: number;
  readonly newCategories: number;
  readonly consolidationRatio: number; // 統合比率
  readonly categoryDistribution: Record<
    MarkerCategory,
    {
      readonly count: number;
      readonly percentage: number;
      readonly originalCuisines: CuisineType[];
    }
  >;
}

/** レストランデータ移行結果 */
export interface RestaurantMigrationResult {
  readonly id: string;
  readonly name: string;
  readonly originalCuisine: CuisineType;
  readonly newCategory: MarkerCategory;
  readonly migrationSuccess: boolean;
  readonly issues?: string[];
}

/**
 * レストランデータの移行処理
 */
export const migrateRestaurantData = <
  T extends { id: string; name: string; cuisineType: CuisineType },
>(
  restaurants: T[]
): {
  migrated: Array<T & { newCategory: MarkerCategory }>;
  statistics: MigrationStatistics;
  issues: string[];
} => {
  const migrated = restaurants.map(restaurant => ({
    ...restaurant,
    newCategory: migrateCuisineToCategory(restaurant.cuisineType),
  }));

  // 統計情報生成
  const categoryDistribution: Record<
    string,
    {
      count: number;
      percentage: number;
      originalCuisines: CuisineType[];
    }
  > = {};

  Object.values(REVERSE_CATEGORY_MAP)
    .flat()
    .forEach(category => {
      const categoryKey = migrateCuisineToCategory(category);
      if (!categoryDistribution[categoryKey]) {
        categoryDistribution[categoryKey] = {
          count: 0,
          percentage: 0,
          originalCuisines: REVERSE_CATEGORY_MAP[categoryKey],
        };
      }
    });

  migrated.forEach(restaurant => {
    categoryDistribution[restaurant.newCategory].count++;
  });

  // パーセンテージ計算
  Object.keys(categoryDistribution).forEach(key => {
    categoryDistribution[key].percentage =
      Math.round(
        (categoryDistribution[key].count / restaurants.length) * 100 * 100
      ) / 100;
  });

  const statistics: MigrationStatistics = {
    totalRestaurants: restaurants.length,
    originalCategories: Object.keys(CATEGORY_MIGRATION_MAP).length, // 18
    newCategories: Object.keys(REVERSE_CATEGORY_MAP).length, // 8
    consolidationRatio: Math.round((8 / 18) * 100 * 100) / 100, // 44.44%
    categoryDistribution: categoryDistribution as Record<
      MarkerCategory,
      {
        readonly count: number;
        readonly percentage: number;
        readonly originalCuisines: CuisineType[];
      }
    >,
  };

  // 問題検出
  const issues: string[] = [];
  if (restaurants.some(r => !r.cuisineType)) {
    issues.push("一部のレストランで料理ジャンルが未設定です");
  }

  const emptyCategoriesCount = Object.values(categoryDistribution).filter(
    dist => dist.count === 0
  ).length;
  if (emptyCategoriesCount > 0) {
    issues.push(`${emptyCategoriesCount}個のカテゴリにデータがありません`);
  }

  return { migrated, statistics, issues };
};

// ==============================
// 移行品質保証
// ==============================

/** 移行品質チェック結果 */
export interface MigrationQualityReport {
  readonly isValid: boolean;
  readonly coverage: number; // カバレッジ率
  readonly balance: number; // バランス指数 (0-100)
  readonly recommendations: string[];
  readonly warnings: string[];
}

/**
 * 移行品質をチェック
 */
export const validateMigrationQuality = (
  statistics: MigrationStatistics
): MigrationQualityReport => {
  const { categoryDistribution, totalRestaurants } = statistics;

  // カバレッジ: 使用されているカテゴリの割合
  const usedCategories = Object.values(categoryDistribution).filter(
    d => d.count > 0
  ).length;
  const coverage = Math.round((usedCategories / 8) * 100);

  // バランス: カテゴリ間のデータ分散均等性
  const percentages = Object.values(categoryDistribution).map(
    d => d.percentage
  );
  const averagePercentage =
    percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
  const variance =
    percentages.reduce(
      (sum, p) => sum + Math.pow(p - averagePercentage, 2),
      0
    ) / percentages.length;
  const balance = Math.max(0, 100 - Math.sqrt(variance) * 2); // 標準偏差ベースのバランス指数

  // 推奨事項生成
  const recommendations: string[] = [];
  const warnings: string[] = [];

  if (coverage < 80) {
    recommendations.push(
      "未使用のカテゴリがあります。データ収集の拡充を検討してください"
    );
  }

  if (balance < 50) {
    warnings.push("カテゴリ間のデータ分布に大きな偏りがあります");
  }

  // 極端に少ないカテゴリの検出
  const minThreshold = totalRestaurants * 0.02; // 全体の2%未満
  Object.entries(categoryDistribution).forEach(([category, data]) => {
    if (data.count > 0 && data.count < minThreshold) {
      warnings.push(
        `${getCategoryDisplayName(category as MarkerCategory)}カテゴリのデータが少なすぎます (${data.count}件)`
      );
    }
  });

  // 極端に多いカテゴリの検出
  const maxThreshold = totalRestaurants * 0.4; // 全体の40%以上
  Object.entries(categoryDistribution).forEach(([category, data]) => {
    if (data.count > maxThreshold) {
      recommendations.push(
        `${getCategoryDisplayName(category as MarkerCategory)}カテゴリに集中しすぎています。細分化を検討してください`
      );
    }
  });

  const isValid = coverage >= 60 && balance >= 30 && warnings.length < 3;

  return {
    isValid,
    coverage,
    balance: Math.round(balance),
    recommendations,
    warnings,
  };
};

// ==============================
// フィルタリング互換性
// ==============================

/**
 * レガシーフィルターを新システムに変換
 */
export const migrateLegacyFilters = (
  legacyCuisineFilters: CuisineType[]
): MarkerCategory[] => {
  return migrateCuisinesBatch(legacyCuisineFilters);
};

/**
 * 新フィルターでレガシーデータを検索
 */
export const filterLegacyDataByNewCategories = <
  T extends { cuisineType: CuisineType },
>(
  data: T[],
  categoryFilters: MarkerCategory[]
): T[] => {
  if (categoryFilters.length === 0) return data;

  return data.filter(item => {
    const itemCategory = migrateCuisineToCategory(item.cuisineType);
    return categoryFilters.includes(itemCategory);
  });
};

// ==============================
// レポート生成
// ==============================

/**
 * 移行レポートを生成
 */
export const generateMigrationReport = (
  statistics: MigrationStatistics
): string => {
  const quality = validateMigrationQuality(statistics);

  let report = "# マーカーカテゴリ移行レポート\n\n";

  // 基本統計
  report += "## 移行統計\n";
  report += `- 総レストラン数: ${statistics.totalRestaurants}件\n`;
  report += `- 移行前カテゴリ数: ${statistics.originalCategories}種類\n`;
  report += `- 移行後カテゴリ数: ${statistics.newCategories}種類\n`;
  report += `- 統合効率: ${statistics.consolidationRatio}% (認知負荷 ${Math.round(((18 - 8) / 18) * 100)}% 削減)\n\n`;

  // カテゴリ別分布
  report += "## カテゴリ別分布\n";
  Object.entries(statistics.categoryDistribution)
    .sort(([, a], [, b]) => b.count - a.count)
    .forEach(([category, data]) => {
      const displayName = getCategoryDisplayName(category as MarkerCategory);
      report += `- **${displayName}**: ${data.count}件 (${data.percentage}%)\n`;
      report += `  - 統合対象: ${data.originalCuisines.join(", ")}\n`;
    });
  report += "\n";

  // 品質評価
  report += "## 品質評価\n";
  report += `- 全体評価: ${quality.isValid ? "✅ 良好" : "⚠️ 要改善"}\n`;
  report += `- カバレッジ: ${quality.coverage}%\n`;
  report += `- バランス指数: ${quality.balance}/100\n\n`;

  // 警告・推奨事項
  if (quality.warnings.length > 0) {
    report += "## ⚠️ 警告\n";
    quality.warnings.forEach(warning => {
      report += `- ${warning}\n`;
    });
    report += "\n";
  }

  if (quality.recommendations.length > 0) {
    report += "## 💡 推奨事項\n";
    quality.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
    report += "\n";
  }

  return report;
};

/**
 * 移行マッピング表をMarkdownで生成
 */
export const generateMigrationMappingTable = (): string => {
  let table = "# カテゴリ移行マッピング表\n\n";
  table += "| 新カテゴリ | 表示名 | 統合対象 (旧18カテゴリ) | 統合数 |\n";
  table += "|-----------|--------|----------------------|--------|\n";

  Object.entries(REVERSE_CATEGORY_MAP).forEach(([category, cuisines]) => {
    const displayName = getCategoryDisplayName(category as MarkerCategory);
    const cuisineList = cuisines.join(", ");
    table += `| ${category} | ${displayName} | ${cuisineList} | ${cuisines.length}種類 |\n`;
  });

  return table;
};
