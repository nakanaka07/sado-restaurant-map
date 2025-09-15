/**
 * 🎯 CircularMarker - 円形背景+白アイコン統一マーカー
 *
 * ICOOON MONO SVGアイコンを使用した美しい円形マーカー
 * WCAG 2.2 AA準拠のアクセシビリティ対応
 */

import React from "react";
import type { IcooonMarkerCategory } from "../../../types/icooonMarker.types";

/**
 * 10カテゴリ対応の円形背景カラー設定
 * 高コントラスト・視認性重視の色彩設計
 */
export const CIRCULAR_MARKER_COLORS: Record<IcooonMarkerCategory, string> = {
  // 🍚 飲食店カテゴリ（8種類）
  japanese: "#D32F2F", // 深紅 - 和食
  noodles: "#F57C00", // オレンジ - 麺類
  yakiniku: "#7B1FA2", // 紫 - 焼肉・グリル
  international: "#388E3C", // 緑 - 多国籍料理
  cafe: "#F9A825", // 金色 - カフェ・軽食
  izakaya: "#E65100", // 深オレンジ - 居酒屋・バー
  fastfood: "#5E35B1", // インディゴ - ファストフード
  general: "#00695C", // ティール - 一般レストラン

  // 🏢 施設カテゴリ（2種類）
  parking: "#455A64", // 青灰 - 駐車場
  toilet: "#004D40", // ダークティール - トイレ
};

/**
 * サイズ設定（レスポンシブ対応）
 */
export const MARKER_SIZES = {
  small: { width: 32, height: 32, iconSize: 16 },
  medium: { width: 40, height: 40, iconSize: 20 },
  large: { width: 48, height: 48, iconSize: 24 },
  xlarge: { width: 64, height: 64, iconSize: 32 },
} as const;

export type MarkerSize = keyof typeof MARKER_SIZES;

interface CircularMarkerProps {
  /** マーカーカテゴリ */
  category: IcooonMarkerCategory;
  /** マーカーサイズ */
  size?: MarkerSize;
  /** クリック可能かどうか */
  interactive?: boolean;
  /** クリックハンドラー */
  onClick?: () => void;
  /** 追加のCSSクラス */
  className?: string;
  /** アクセシビリティラベル（上書き用） */
  ariaLabel?: string;
}

/**
 * ICOOON MONO アイコンパスマッピング
 * Public Asset として提供（Vite Asset URL処理に依存しない確実な方法）
 */
const getIconPath = (fileName: string): string => {
  const baseUrl = import.meta.env.PROD ? "/sado-restaurant-map" : "";
  return `${baseUrl}/icons/${fileName}`;
};

const ICON_PATH_MAP: Record<IcooonMarkerCategory, string> = {
  japanese: getIconPath("ochawan-hashi.svg"),
  noodles: getIconPath("ramen-icon.svg"),
  yakiniku: getIconPath("steak-icon2.svg"),
  international: getIconPath("earth-icon12.svg"),
  cafe: getIconPath("tea-icon.svg"),
  izakaya: getIconPath("wine-bottle.svg"),
  fastfood: getIconPath("hamburger-icon7.svg"),
  general: getIconPath("fork-knife.svg"),
  parking: getIconPath("parking-icon.svg"),
  toilet: getIconPath("toilet-pictogram.svg"),
};

/**
 * アクセシビリティラベルマッピング
 */
const ARIA_LABEL_MAP: Record<IcooonMarkerCategory, string> = {
  japanese: "和食レストラン",
  noodles: "麺類レストラン",
  yakiniku: "焼肉・グリルレストラン",
  international: "多国籍料理レストラン",
  cafe: "カフェ・軽食店",
  izakaya: "居酒屋・バー",
  fastfood: "ファストフード店",
  general: "一般レストラン",
  parking: "駐車場",
  toilet: "トイレ",
};

export const CircularMarker: React.FC<CircularMarkerProps> = ({
  category,
  size = "medium",
  interactive = true,
  onClick,
  className = "",
  ariaLabel,
}) => {
  const sizeConfig = MARKER_SIZES[size];
  const backgroundColor = CIRCULAR_MARKER_COLORS[category];
  const iconPath = ICON_PATH_MAP[category];
  const defaultAriaLabel = ARIA_LABEL_MAP[category];

  // 🔧 デバッグ用ログ（開発環境のみ）
  if (import.meta.env.DEV) {
    console.log(`🔍 CircularMarker Debug:`, {
      category,
      iconPath,
      backgroundColor,
      size: sizeConfig,
    });
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (interactive && onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={`circular-marker ${className} ${interactive ? "interactive" : "static"}`}
      style={{
        width: sizeConfig.width,
        height: sizeConfig.height,
        backgroundColor: backgroundColor,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: interactive ? "pointer" : "default",
        transition: "all 0.2s ease-in-out",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        border: "2px solid rgba(255, 255, 255, 0.3)",
        padding: 0,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={!interactive}
      aria-label={ariaLabel || defaultAriaLabel}
    >
      {/* SVGアイコン（白色で表示） */}
      <img
        src={iconPath}
        alt=""
        className="icon-image"
        style={{
          width: sizeConfig.iconSize,
          height: sizeConfig.iconSize,
          filter: "brightness(0) saturate(100%) invert(100%)", // 白色変換
          pointerEvents: "none", // クリックイベントを親要素に委譲
        }}
        onLoad={() => {
          if (import.meta.env.DEV) {
            console.log(`✅ SVG loaded successfully: ${iconPath}`);
          }
        }}
        onError={e => {
          console.error(`❌ SVG failed to load: ${iconPath}`, e);
        }}
        aria-hidden="true"
      />

      {/* ホバー時のカテゴリ表示（大きなサイズのみ） */}
      {size === "large" || size === "xlarge" ? (
        <div
          className="category-tooltip"
          style={{
            position: "absolute",
            bottom: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            opacity: 0,
            transition: "opacity 0.2s ease-in-out",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {ARIA_LABEL_MAP[category]}
        </div>
      ) : null}

      {/* スタイル定義 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .circular-marker.interactive:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        }

        .circular-marker.interactive:hover .category-tooltip {
          opacity: 1;
        }

        .circular-marker.interactive:active {
          transform: scale(0.95);
        }

        .circular-marker:focus {
          outline: 3px solid #4A90E2;
          outline-offset: 2px;
        }

        .circular-marker.static {
          pointer-events: none;
        }
        `,
        }}
      />
    </button>
  );
};

/**
 * プリセット付きCircularMarkerコンポーネント群
 */

// 飲食店用
export const RestaurantCircularMarker: React.FC<
  Omit<CircularMarkerProps, "category"> & {
    category: Exclude<IcooonMarkerCategory, "parking" | "toilet">;
  }
> = props => <CircularMarker {...props} />;

// 施設用
export const FacilityCircularMarker: React.FC<
  Omit<CircularMarkerProps, "category"> & {
    category: "parking" | "toilet";
  }
> = props => <CircularMarker {...props} />;

export default CircularMarker;
