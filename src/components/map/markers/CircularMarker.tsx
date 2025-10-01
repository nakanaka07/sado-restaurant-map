/**
 * 🎯 CircularMarker - 円形背景+白アイコン統一マーカー
 *
 * ICOOON MONO SVGアイコンを使用した美しい円形マーカー
 * WCAG 2.2 AA準拠のアクセシビリティ対応
 */

import React from "react";
import type { IcooonMarkerCategory } from "../../../types/icooonMarker.types";
import {
  ARIA_LABEL_MAP,
  CIRCULAR_MARKER_COLORS,
  ICON_PATH_MAP,
  MARKER_SIZES,
  MarkerAnimation,
  MarkerSize,
} from "./constants";

// 定数は `constants.ts` に移動しました。

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
// ICON_PATH_MAP と ARIA_LABEL_MAP は `constants.ts` を利用します

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
    // AdvancedMarker 親へのバブリングを許可しても良いが、
    // 今回は CircularMarker 自身で onClick を完結させるため preventDefault のみ。
    // InfoWindow 表示は Container から渡された onClick で行われる。
    e.preventDefault();
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

  // CSS変数用のRGBA変換関数
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // 明瞭ストライプ用カラー生成 (parking のみ)
  const deriveStripeColors = (hex: string): { light: string; dark: string } => {
    // シンプルな明度調整 (HSL 変換を避け高速化)
    const toRGB = (h: string) => [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16),
    ];
    const toHex = (r: number, g: number, b: number) =>
      `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    const clamp = (v: number) => Math.min(255, Math.max(0, v));
    const [r, g, b] = toRGB(hex);
    // lighten +24%, darken -18% 程度で白アイコンとのコントラスト確保
    const light = toHex(
      clamp(r + (255 - r) * 0.24),
      clamp(g + (255 - g) * 0.24),
      clamp(b + (255 - b) * 0.24)
    );
    const dark = toHex(clamp(r * 0.82), clamp(g * 0.82), clamp(b * 0.82));
    return { light, dark };
  };

  const parkingStripe =
    category === "parking" ? deriveStripeColors(backgroundColor) : null;

  return (
    <button
      type="button"
      className={fullClassName}
      style={
        {
          width: sizeConfig.width,
          height: sizeConfig.height,
          // 駐車場: 高コントラスト 45deg ストライプ (8px 幅)
          background:
            category === "parking" && parkingStripe
              ? `repeating-linear-gradient(45deg, ${parkingStripe.light} 0 8px, ${parkingStripe.dark} 8px 16px)`
              : backgroundColor,
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
          // CSS変数でカテゴリ別の色を設定
          "--marker-color": backgroundColor,
          "--marker-color-alpha": hexToRgba(backgroundColor, 0.4),
        } as React.CSSProperties & Record<string, string | number>
      }
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
        /* Phase 4: 改善されたホバー効果 - カテゴリ別個別対応 */
        .circular-marker.interactive:hover {
          transform: scale(1.15) rotate(2deg);
          box-shadow:
            0 6px 20px rgba(0, 0, 0, 0.3),
            0 0 0 4px var(--marker-color-alpha);
          background: linear-gradient(135deg, var(--marker-color) 0%, var(--marker-color) 100%);
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
