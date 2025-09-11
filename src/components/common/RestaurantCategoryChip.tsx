/**
 * レストランカテゴリーチップコンポーネント
 * 業種を視覚的に表示するチップ
 */

import type { CuisineType, RestaurantCategory } from "@/types";
import React from "react";

interface RestaurantCategoryChipProps {
  readonly category: CuisineType | RestaurantCategory | string;
  readonly size?: "small" | "medium";
  readonly showIcon?: boolean;
  readonly variant?: "filled" | "outlined";
  readonly className?: string;
}

export const RestaurantCategoryChip = React.memo<RestaurantCategoryChipProps>(
  ({
    category,
    size = "medium",
    showIcon = true,
    variant = "filled",
    className = "",
  }) => {
    const config = getCategoryConfig(category);
    const sizeConfig = getSizeConfig(size);
    const variantConfig = getVariantConfig(variant, config);

    return (
      <span
        className={`restaurant-category-chip ${className}`}
        style={{
          ...variantConfig,
          padding: sizeConfig.padding,
          borderRadius: sizeConfig.borderRadius,
          fontSize: sizeConfig.fontSize,
          fontWeight: "500",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          lineHeight: "1",
          whiteSpace: "nowrap",
          transition: "all 0.2s ease-in-out",
        }}
        aria-label={`カテゴリ: ${config.text}`}
      >
        {showIcon && (
          <span style={{ fontSize: sizeConfig.iconSize }} aria-hidden="true">
            {config.icon}
          </span>
        )}
        <span>{config.text}</span>
      </span>
    );
  }
);

RestaurantCategoryChip.displayName = "RestaurantCategoryChip";

/**
 * カテゴリに応じた設定を取得
 */
function getCategoryConfig(
  category: CuisineType | RestaurantCategory | string
) {
  // category is already a string type in all cases, so we use it directly
  const categoryStr = String(category);

  switch (categoryStr) {
    case "寿司":
    case "sushi":
      return {
        text: "寿司",
        icon: "🍣",
        background: "#fef3c7", // yellow-100
        color: "#d97706", // yellow-600
        border: "#fbbf24", // yellow-400
      };

    case "海鮮":
    case "seafood":
      return {
        text: "海鮮",
        icon: "🐟",
        background: "#dbeafe", // blue-100
        color: "#1d4ed8", // blue-700
        border: "#60a5fa", // blue-400
      };

    case "焼肉・焼鳥":
    case "yakiniku":
      return {
        text: "焼肉・焼鳥",
        icon: "🍖",
        background: "#fed7d7", // red-100
        color: "#c53030", // red-600
        border: "#fc8181", // red-400
      };

    case "ラーメン":
    case "ramen":
      return {
        text: "ラーメン",
        icon: "🍜",
        background: "#ffeaa7", // custom yellow
        color: "#d63031", // custom red
        border: "#fdcb6e", // custom yellow-orange
      };

    case "そば・うどん":
    case "noodles":
      return {
        text: "そば・うどん",
        icon: "🥢",
        background: "#e6fffa", // teal-50
        color: "#0d9488", // teal-600
        border: "#5eead4", // teal-300
      };

    case "中華":
    case "chinese":
      return {
        text: "中華",
        icon: "🥟",
        background: "#fef2f2", // red-50
        color: "#dc2626", // red-600
        border: "#fca5a5", // red-300
      };

    case "イタリアン":
    case "italian":
      return {
        text: "イタリアン",
        icon: "🍝",
        background: "#f0fdf4", // green-50
        color: "#16a34a", // green-600
        border: "#86efac", // green-300
      };

    case "フレンチ":
    case "french":
      return {
        text: "フレンチ",
        icon: "🥐",
        background: "#fdf4ff", // fuchsia-50
        color: "#c026d3", // fuchsia-600
        border: "#f0abfc", // fuchsia-300
      };

    case "カフェ・喫茶店":
    case "cafe":
      return {
        text: "カフェ",
        icon: "☕",
        background: "#fefbf3", // amber-50
        color: "#d97706", // amber-600
        border: "#fcd34d", // amber-300
      };

    case "バー・居酒屋":
    case "bar":
      return {
        text: "バー・居酒屋",
        icon: "🍻",
        background: "#fffbeb", // amber-50
        color: "#f59e0b", // amber-500
        border: "#fbbf24", // amber-400
      };

    case "ファストフード":
    case "fastfood":
      return {
        text: "ファストフード",
        icon: "🍔",
        background: "#fef2f2", // red-50
        color: "#ef4444", // red-500
        border: "#fca5a5", // red-300
      };

    case "デザート・スイーツ":
    case "dessert":
      return {
        text: "デザート",
        icon: "🍰",
        background: "#fdf2f8", // pink-50
        color: "#ec4899", // pink-500
        border: "#f9a8d4", // pink-300
      };

    case "カレー・エスニック":
    case "curry":
      return {
        text: "カレー",
        icon: "🍛",
        background: "#fff7ed", // orange-50
        color: "#ea580c", // orange-600
        border: "#fdba74", // orange-300
      };

    case "ステーキ・洋食":
    case "steak":
      return {
        text: "ステーキ・洋食",
        icon: "🥩",
        background: "#7c2d12", // brown-800
        color: "#ffffff",
        border: "#a16207", // brown-600
      };

    case "弁当・テイクアウト":
    case "bento":
      return {
        text: "弁当",
        icon: "🍱",
        background: "#f3f4f6", // gray-100
        color: "#374151", // gray-700
        border: "#9ca3af", // gray-400
      };

    case "日本料理":
    case "japanese":
      return {
        text: "和食",
        icon: "🍚",
        background: "#fef7ff", // purple-50
        color: "#7c3aed", // purple-600
        border: "#c4b5fd", // purple-300
      };

    case "レストラン":
    case "restaurant":
      return {
        text: "レストラン",
        icon: "🍽️",
        background: "#f8fafc", // slate-50
        color: "#475569", // slate-600
        border: "#cbd5e1", // slate-300
      };

    default:
      return {
        text: "その他",
        icon: "🏪",
        background: "#f3f4f6", // gray-100
        color: "#6b7280", // gray-500
        border: "#d1d5db", // gray-300
      };
  }
}

/**
 * サイズ設定を取得
 */
function getSizeConfig(size: "small" | "medium") {
  switch (size) {
    case "small":
      return {
        padding: "2px 6px",
        fontSize: "10px",
        iconSize: "10px",
        borderRadius: "6px",
      };

    case "medium":
    default:
      return {
        padding: "4px 8px",
        fontSize: "11px",
        iconSize: "12px",
        borderRadius: "8px",
      };
  }
}

/**
 * バリアント設定を取得
 */
function getVariantConfig(
  variant: "filled" | "outlined",
  config: ReturnType<typeof getCategoryConfig>
) {
  switch (variant) {
    case "outlined":
      return {
        backgroundColor: "transparent",
        color: config.color,
        border: `1px solid ${config.border}`,
      };

    case "filled":
    default:
      return {
        backgroundColor: config.background,
        color: config.color,
        border: `1px solid ${config.border}`,
      };
  }
}
