/**
 * @fileoverview Hybrid Marker Utils - ICOOON MONO + Phosphor Icons対応統合ユーティリティ
 * 佐渡島レストランマップ用10カテゴリ完全対応
 */

import {
  HYBRID_MARKER_CONFIGS,
  LEGACY_CATEGORY_MAPPING,
} from "@/config/hybridMarkerConfig";
import type { MapPoint } from "@/types";

/**
 * ハイブリッドマーカー設定の型定義
 */
export interface HybridMarkerUtil {
  readonly id: string;
  readonly category: string;
  readonly primary: string;
  readonly secondary: string;
  readonly iconSource: "icooon-mono" | "phosphor" | "fallback";
  readonly iconSvgPath: string;
  readonly iconEmoji: string;
  readonly size: number;
  readonly scale: number;
  readonly contrastRatio: number;
  readonly showBadge: boolean;
  readonly ariaLabel: string;
}

/**
 * 価格帯別サイズマップ（ハイブリッド対応）
 * 52pxベースの美しいスケーリング
 */
const HYBRID_PRICE_SIZE_MAP: Readonly<Record<string, number>> = {
  "～1000円": 48, // 小サイズ
  "1000-2000円": 52, // 標準サイズ
  "2000-3000円": 56, // 大サイズ
  "3000円～": 60, // 特大サイズ
} as const;

/**
 * 施設タイプ別サイズマップ
 */
const FACILITY_SIZE_MAP: Readonly<Record<string, number>> = {
  parking: 50, // 駐車場
  toilet: 50, // トイレ
  restaurant: 52, // レストラン（標準）
} as const;

/**
 * レガシーカテゴリを新10カテゴリにマッピング
 * @param legacyCategory - 既存の18カテゴリ
 * @returns 新10カテゴリ
 */
export const mapLegacyToHybridCategory = (legacyCategory: string): string => {
  return LEGACY_CATEGORY_MAPPING[legacyCategory] || "一般レストラン";
};

/**
 * マップポイントから最適なハイブリッドカテゴリを決定
 * @param point - マップポイント
 * @returns ハイブリッドマーカーカテゴリ
 */
export const getHybridCategoryFromPoint = (point: MapPoint): string => {
  // 施設タイプ優先（駐車場・トイレ）
  switch (point.type) {
    case "parking":
      return "駐車場";
    case "toilet":
      return "トイレ";
    case "restaurant":
      // レストランの場合は料理ジャンルから判定
      if (point.cuisineType) {
        return mapLegacyToHybridCategory(point.cuisineType);
      }
      return "一般レストラン";
    default:
      return "一般レストラン";
  }
};

/**
 * 価格帯に基づくハイブリッドマーカーサイズ決定
 * @param priceRange - 価格帯
 * @param baseSize - ベースサイズ（デフォルト：52px）
 * @returns マーカーサイズ（ピクセル）
 */
export const getHybridMarkerSizeByPrice = (
  priceRange?: string,
  baseSize: number = 52
): number => {
  if (!priceRange) return baseSize;
  return HYBRID_PRICE_SIZE_MAP[priceRange] || baseSize;
};

/**
 * 施設タイプに基づくマーカーサイズ決定
 * @param point - マップポイント
 * @returns マーカーサイズ（ピクセル）
 */
export const getHybridMarkerSizeByType = (point: MapPoint): number => {
  const baseSize = FACILITY_SIZE_MAP[point.type] || 52;

  // レストランの場合は価格帯も考慮
  if (point.type === "restaurant") {
    return getHybridMarkerSizeByPrice(point.priceRange, baseSize);
  }

  return baseSize;
};

/**
 * SVGアイコンの動的読み込み（プレースホルダー）
 * 実装時に実際のSVGファイルから読み込み
 * @param iconPath - SVGファイルパス
 * @returns SVG文字列またはnull
 */
export const loadSvgIcon = async (iconPath: string): Promise<string | null> => {
  try {
    // 実装時にfetch等でSVGファイルを読み込み予定
    const response = await fetch(iconPath);
    if (response.ok) {
      return await response.text();
    }
    console.warn(`Failed to fetch SVG icon: ${iconPath}`);
    return null;
  } catch (error) {
    console.warn(`Error loading SVG icon: ${iconPath}`, error);
    return null;
  }
};

/**
 * 統合されたハイブリッドマーカー設定を取得
 * @param point - マップポイント
 * @param customCategory - カスタムカテゴリ（オプション）
 * @returns 完全なハイブリッドマーカー設定
 */
export const getHybridMarkerUtil = (
  point: MapPoint,
  customCategory?: string
): HybridMarkerUtil => {
  // カテゴリ決定（カスタム指定 > ポイント判定）
  const category = customCategory || getHybridCategoryFromPoint(point);
  const config =
    HYBRID_MARKER_CONFIGS[category] || HYBRID_MARKER_CONFIGS["一般レストラン"];

  // サイズ決定
  const size = getHybridMarkerSizeByType(point);
  const scale = size / 52; // 52pxを基準としたスケール

  // アクセシビリティラベル生成
  const ariaLabel = `${category}のマーカー: ${point.name}${
    point.type === "restaurant" && point.rating ? `, 評価${point.rating}星` : ""
  }`;

  return {
    id: config.id,
    category,
    primary: config.primary,
    secondary: config.secondary,
    iconSource: config.iconSource,
    iconSvgPath: config.iconSvgPath,
    iconEmoji: config.iconEmoji,
    size,
    scale,
    contrastRatio: config.contrastRatio,
    showBadge: config.showCategoryBadge,
    ariaLabel,
  };
};

/**
 * カテゴリ別統計情報取得
 * @param points - 全マップポイント
 * @returns カテゴリ別集計結果
 */
export interface CategoryStats {
  category: string;
  count: number;
  config: (typeof HYBRID_MARKER_CONFIGS)[string];
}

export const getCategoryStatistics = (points: MapPoint[]): CategoryStats[] => {
  const categoryCount: Record<string, number> = {};

  // カテゴリ別カウント
  points.forEach(point => {
    const category = getHybridCategoryFromPoint(point);
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  // 統計オブジェクト作成
  return Object.entries(categoryCount).map(([category, count]) => ({
    category,
    count,
    config:
      HYBRID_MARKER_CONFIGS[category] ||
      HYBRID_MARKER_CONFIGS["一般レストラン"],
  }));
};

/**
 * マーカーフィルタリングユーティリティ
 * @param points - 全マップポイント
 * @param activeCategories - アクティブなカテゴリ一覧
 * @returns フィルタされたポイント
 */
export const filterPointsByHybridCategories = (
  points: MapPoint[],
  activeCategories: string[]
): MapPoint[] => {
  if (activeCategories.length === 0) return points;

  return points.filter(point => {
    const category = getHybridCategoryFromPoint(point);
    return activeCategories.includes(category);
  });
};

/**
 * WCAG AA準拠のコントラスト比チェック
 * @param backgroundColor - 背景色
 * @returns コントラスト比が4.5:1以上かどうか
 */
export const isWcagAACompliant = (backgroundColor: string): boolean => {
  // プレースホルダー実装
  // 実際にはcolor-contrast等のライブラリを使用してコントラスト比計算
  const config = Object.values(HYBRID_MARKER_CONFIGS).find(
    c => c.primary === backgroundColor
  );
  return config ? config.contrastRatio >= 4.5 : false;
};

/**
 * デバッグ用：全カテゴリ設定表示
 * @returns カテゴリ設定一覧
 */
export const getDebugCategoryInfo = () => {
  return Object.entries(HYBRID_MARKER_CONFIGS).map(([category, config]) => ({
    category,
    ...config,
    isWcagCompliant: config.contrastRatio >= 4.5,
  }));
};
