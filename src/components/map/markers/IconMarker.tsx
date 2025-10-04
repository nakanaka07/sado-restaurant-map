/**
 * @fileoverview IconMarker - ICOOON MONO icon-based marker
 *
 * UnifiedMarker Strategy実装 #2: ICOOON MONOアイコン版
 *
 * 特徴:
 * - 既存CircularMarkerと同等の機能
 * - ICOOON MONO白アイコン + カテゴリ色背景
 * - WCAG AA準拠のコントラスト
 * - キーボード操作・スクリーンリーダー対応
 *
 * 用途:
 * - 現行デフォルトマーカー（既存実装からの移行）
 * - カテゴリ識別重視
 * - アクセシビリティ最優先
 */

import type { MapPoint } from "@/types";
import type { IcooonMarkerCategory } from "@/types/icooonMarker.types";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useCallback } from "react";
import type { MarkerStrategyProps } from "../UnifiedMarker";
import { CircularMarker } from "./CircularMarker";

// ==============================
// Marker Size Mapping
// ==============================

const ICON_SIZES = {
  small: "small",
  medium: "medium",
  large: "large",
} as const;

// ==============================
// IconMarker Component
// ==============================

/**
 * IconMarker - ICOOON MONO統一アイコンマーカー
 *
 * @example
 * ```tsx
 * <IconMarker
 *   point={restaurant}
 *   onClick={handleClick}
 *   size="medium"
 * />
 * ```
 */
export function IconMarker({
  point,
  onClick,
  size,
  isSelected,
  isHovered,
  ariaLabel,
}: Readonly<MarkerStrategyProps>) {
  // クリックハンドラー
  const handleClick = useCallback(() => {
    onClick(point);
  }, [onClick, point]);

  // カテゴリ判定
  const category = getCategoryFromPoint(point);

  // CircularMarkerサイズマッピング
  const circularSize = ICON_SIZES[size];

  // アニメーション判定（ネストされた三項演算子を抽出）
  let animation: "attention" | "subtle" | "none";
  if (isSelected) {
    animation = "attention";
  } else if (isHovered) {
    animation = "subtle";
  } else {
    animation = "none";
  }

  return (
    <AdvancedMarker
      position={{ lat: point.coordinates.lat, lng: point.coordinates.lng }}
      zIndex={isSelected ? 1000 : null}
    >
      <CircularMarker
        category={category}
        size={circularSize}
        onClick={handleClick}
        interactive
        ariaLabel={ariaLabel ?? getDefaultAriaLabel(point)}
        animation={animation}
        ringed={isSelected ?? false} // 選択時は強調リング
      />
    </AdvancedMarker>
  );
}

// ==============================
// Helpers
// ==============================

/**
 * MapPointからIcooonMarkerCategoryを推定
 */
function getCategoryFromPoint(point: MapPoint): IcooonMarkerCategory {
  // Parking
  if ("capacity" in point) return "parking";

  // Toilet
  if ("isAccessible" in point) return "toilet";

  // Restaurant
  if ("cuisineType" in point) {
    return getCuisineCategory(point.cuisineType);
  }

  return "general";
}

/**
 * 料理タイプからカテゴリを判定
 */
function getCuisineCategory(
  cuisineType: string | undefined
): IcooonMarkerCategory {
  if (!cuisineType) return "general";

  const cuisine = cuisineType.toLowerCase();

  const categoryMap: Record<string, IcooonMarkerCategory> = {
    japanese: "japanese",
    和食: "japanese",
    noodle: "noodles",
    麺: "noodles",
    yakiniku: "yakiniku",
    焼肉: "yakiniku",
    cafe: "cafe",
    カフェ: "cafe",
    izakaya: "izakaya",
    居酒屋: "izakaya",
    fast: "fastfood",
    ファスト: "fastfood",
    international: "international",
    多国籍: "international",
  };

  for (const [key, category] of Object.entries(categoryMap)) {
    if (cuisine.includes(key)) return category;
  }

  return "general";
}

/**
 * ポイントタイプに応じたデフォルトARIAラベル生成
 */
function getDefaultAriaLabel(point: MapPoint): string {
  if ("cuisineType" in point) {
    return `レストラン: ${point.name} (${point.cuisineType || "一般"})`;
  }
  if ("capacity" in point) {
    return `駐車場: ${point.name} (収容台数: ${point.capacity || "不明"}台)`;
  }
  if ("isAccessible" in point) {
    return `トイレ: ${point.name}${point.isAccessible ? " (バリアフリー対応)" : ""}`;
  }
  return point.name;
}
