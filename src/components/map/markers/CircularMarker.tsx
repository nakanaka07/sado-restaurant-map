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

/**
 * Phase 4: アニメーションタイプ
 */
export type MarkerAnimation = "none" | "attention" | "subtle" | "loading";

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
  /** Phase 4: アニメーション効果 */
  animation?: MarkerAnimation;
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
  animation = "none",
}) => {
  const sizeConfig = MARKER_SIZES[size];
  const backgroundColor = CIRCULAR_MARKER_COLORS[category];
  const iconPath = ICON_PATH_MAP[category];
  const defaultAriaLabel = ARIA_LABEL_MAP[category];

  // Phase 4: アニメーションクラス生成
  const animationClass = animation !== "none" ? `${animation}-animation` : "";
  const fullClassName =
    `circular-marker ${className} ${interactive ? "interactive" : "static"} ${animationClass}`.trim();

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
      className={fullClassName}
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

      {/* カテゴリツールチップ（Phase 4改善版） */}
      {size === "large" || size === "xlarge" ? (
        <div
          className="category-tooltip"
          style={{
            position: "absolute",
            bottom: "-12px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            opacity: 0,
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          {ARIA_LABEL_MAP[category]}
        </div>
      ) : null}

      {/* Phase 4改善: 強化されたスタイル定義 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Phase 4: 改善されたホバー効果 */
        .circular-marker.interactive:hover {
          transform: scale(1.15) rotate(2deg);
          box-shadow:
            0 6px 20px rgba(0, 0, 0, 0.3),
            0 0 0 4px rgba(66, 165, 245, 0.2);
          background: linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%);
          filter: brightness(1.1) saturate(1.15);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* アイコンのホバー効果 */
        .circular-marker.interactive:hover .icon-image {
          filter: brightness(0) saturate(100%) invert(100%) drop-shadow(0 0 4px rgba(255,255,255,0.8));
        }

        /* ツールチップの改善されたアニメーション */
        .circular-marker.interactive:hover .category-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(2px) scale(1.05);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* ツールチップの矢印 */
        .category-tooltip::before {
          content: "";
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 4px solid rgba(0, 0, 0, 0.85);
        }

        /* アクティブ状態（クリック時）の改善 */
        .circular-marker.interactive:active {
          transform: scale(0.95) rotate(-1deg);
          transition: all 0.1s ease-out;
        }

        /* フォーカス状態のアクセシビリティ向上 */
        .circular-marker:focus {
          outline: 3px solid #4A90E2;
          outline-offset: 3px;
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.15),
            0 0 0 6px rgba(74, 144, 226, 0.3);
        }

        /* 静的マーカー（非インタラクティブ） */
        .circular-marker.static {
          pointer-events: none;
          transition: none;
        }

        /* Phase 4: パルスアニメーション（注目時） */
        .circular-marker.attention {
          animation: marker-attention 2s ease-in-out infinite;
        }

        @keyframes marker-attention {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
          }
        }

        /* Phase 4: 呼吸アニメーション（軽微な動き） */
        .circular-marker.subtle-animation {
          animation: marker-breathe 4s ease-in-out infinite;
        }

        @keyframes marker-breathe {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1) saturate(1);
          }
          50% {
            transform: scale(1.02);
            filter: brightness(1.05) saturate(1.05);
          }
        }

        /* Phase 4: ローディングアニメーション */
        .circular-marker.loading {
          animation: marker-loading 1.5s ease-in-out infinite;
        }

        @keyframes marker-loading {
          0% {
            opacity: 0.5;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 0.5;
            transform: scale(0.8);
          }
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
