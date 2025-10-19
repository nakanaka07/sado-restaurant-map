/**
 * 🎯 CircularMarker - 円形背景+白アイコン統一マーカー
 *
/**
 * 🎯 CircularMarker - Rebuilt clean version with classic parking style
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

interface CircularMarkerProps {
  category: IcooonMarkerCategory;
  size?: MarkerSize;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  animation?: MarkerAnimation;
  /**
   * Apply multi-ring (parking-like) layered ring style to non-parking markers.
   * Parking is always ringed regardless of this flag.
   * Intended mainly for emphasis (e.g. highlight / featured POI).
   */
  ringed?: boolean;
  /**
   * Custom inner content (replaces default white icon). Sized & centered automatically.
   * Use for histogram / sparkline / dynamic state indicator.
   */
  customContent?: React.ReactNode;
}

// --- Helpers ---------------------------------------------------------------
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function computeIconSize(
  base: number,
  ringed: boolean,
  category: IcooonMarkerCategory
): number {
  // トイレアイコンは特別に大きく表示（enhanced-pngサイズ感）
  if (category === "toilet") {
    // ベースサイズの約1.4倍（円の淵近くまで拡大）
    return Math.round(base * 1.4);
  }

  if (!ringed) return base;
  if (base >= 20) return base - 2; // medium+ cases
  return base - 1; // small
}

function buildClassName(
  user: string,
  interactive: boolean,
  animation: MarkerAnimation,
  isParking: boolean,
  isRinged: boolean
): string {
  const classes = [
    "circular-marker",
    user,
    interactive ? "interactive" : "static",
    animation !== "none" ? `${animation}-animation` : "",
    isParking ? "parking-marker" : "",
    !isParking && isRinged ? "ringed-marker" : "",
  ];
  return classes.filter(Boolean).join(" ");
}

export const CircularMarker: React.FC<CircularMarkerProps> = ({
  category,
  size = "medium",
  interactive = true,
  onClick,
  className = "",
  ariaLabel,
  animation = "none",
  ringed = false,
  customContent,
}) => {
  // Basic derived values
  const sizeConfig = MARKER_SIZES[size];
  const baseColor = CIRCULAR_MARKER_COLORS[category];
  const iconPath = ICON_PATH_MAP[category];
  const defaultAriaLabel = ARIA_LABEL_MAP[category];
  const isParking = category === "parking";
  const parkingColor = "#4CAF50"; // classic parking green
  // parking は常時リング、toilet は明示 ringed 指定時のみ
  const isRinged = isParking || (!isParking && ringed);

  // Icon size (avoid nested ternaries inline in JSX)
  const computedIconSize = computeIconSize(
    sizeConfig.iconSize,
    isRinged,
    category
  );

  // Build classname
  const fullClassName = buildClassName(
    className,
    interactive,
    animation,
    isParking,
    isRinged
  );

  // Event handlers
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (interactive && onClick) onClick();
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
      style={
        {
          width: sizeConfig.width,
          height: sizeConfig.height,
          // parking は本体背景を白にして擬似要素で緑コアを描く
          background: isRinged ? "#FFFFFF" : baseColor,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: interactive ? "pointer" : "default",
          transition: "all 0.25s ease-in-out",
          boxShadow: isParking
            ? [
                // depth shadow only (rings handled by pseudo-element)
                "0 2px 5px rgba(0,0,0,0.26)",
              ].join(", ")
            : "0 2px 8px rgba(0,0,0,0.15)",
          border: isRinged ? "none" : "2px solid rgba(255,255,255,1)",
          padding: 0,
          "--marker-color": isParking ? parkingColor : baseColor,
          "--marker-color-alpha": hexToRgba(
            isParking ? parkingColor : baseColor,
            0.4
          ),
        } as React.CSSProperties & Record<string, string | number>
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={!interactive}
      aria-label={ariaLabel || defaultAriaLabel}
    >
      {customContent ? (
        <div
          className="custom-content-wrapper"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            overflow: "hidden",
            // Ensure custom visuals don't swallow pointer events separate from button
            pointerEvents: "none",
          }}
        >
          {customContent}
        </div>
      ) : (
        <img
          src={iconPath}
          alt=""
          aria-hidden="true"
          className="icon-image"
          style={{
            width: computedIconSize,
            height: computedIconSize,
            pointerEvents: "none",
            // SVGs with currentColor need color property set + invert filter
            color: "white",
            filter: "invert(1)",
          }}
        />
      )}

      {(size === "large" || size === "xlarge") && (
        <div
          className="category-tooltip"
          style={{
            position: "absolute",
            bottom: "-12px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.85)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            opacity: 0,
            transition: "all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {ARIA_LABEL_MAP[category]}
        </div>
      )}

      {process.env.NODE_ENV !== "test" && (
        <style
          // NOTE(test-optim): テスト環境では巨大インラインCSSが jsdom の `Could not parse CSS stylesheet` ノイズを大量発生させるためスキップ。
          // 視覚的スタイルは E2E/実ブラウザで担保し、ユニットテストではアクセシビリティ & クリック挙動のみ検証する方針。
          dangerouslySetInnerHTML={{
            __html: `
            0 0 0 4px var(--marker-color-alpha);
          background: linear-gradient(135deg, var(--marker-color) 0%, var(--marker-color) 100%);
          filter: brightness(1.1) saturate(1.15);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* 駐車場専用: 外側黒リング (擬似要素) */
        .circular-marker.parking-marker {
          position: relative;
        }

  .circular-marker.parking-marker::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          /* Base core circle size - enlarged to maintain visual presence */
          width: 78%;
          height: 78%;
          transform: translate(-50%, -50%);
          background: ${parkingColor}; /* green core */
          border-radius: 50%;
          z-index: 0;
          transition: transform 0.25s ease, filter 0.25s ease;
          /* Adjusted ring stack for consistent outer footprint with other markers
             Total outer size: ~2px to match standard marker border
             Order: inset subtle core edge, then outward rings.
          */
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05) inset, /* subtle inner definition */
            0 0 0 2.5px #FFFFFF,              /* inner white ring (2.5px) */
            0 0 0 5px ${parkingColor},        /* mid green ring (adds 2.5px) */
            0 0 0 6.5px #FFFFFF,              /* outer white ring (adds 1.5px) */
            0 0 0 7px rgba(0,0,0,0.06);       /* faint outline (adds 0.5px) */
        }
        .circular-marker.parking-marker .icon-image { position: relative; z-index: 1; }
        .circular-marker.parking-marker.interactive:hover::before {
          /* subtle brightness increase without filter (prevents repainting) */
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05) inset,
            0 0 0 2.5px #FFFFFF,
            0 0 0 5px ${parkingColor},
            0 0 0 6.5px #FFFFFF,
            0 0 0 7px rgba(0,0,0,0.08),
            0 0 2px 2px rgba(76,175,80,0.3); /* gentle outer glow */
        }
        .circular-marker.parking-marker.interactive:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.35);
          transform: scale(1.05);
          transition: all 0.25s ease;
        }

        /* 通常マーカー（リングなし）のホバー効果 */
        .circular-marker.interactive:not(.parking-marker):not(.ringed-marker):hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.35);
          transform: scale(1.05);
          transition: all 0.25s ease;
        }

        /* 汎用リング付きマーカー (非駐車場カテゴリで ringed=true の場合) */
        .circular-marker.ringed-marker { position: relative; }
  .circular-marker.ringed-marker::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 65%;
          height: 65%;
          transform: translate(-50%, -50%);
          background: var(--marker-color);
          border-radius: 50%;
          z-index: 0;
          transition: transform 0.25s ease, filter 0.25s ease;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05) inset,
            0 0 0 4px #FFFFFF,
            0 0 0 8px var(--marker-color),
            0 0 0 10px #FFFFFF,
            0 0 0 11.7px rgba(0,0,0,0.06);
        }
        .circular-marker.ringed-marker .icon-image { position: relative; z-index: 1; }
        .circular-marker.ringed-marker.interactive:hover::before {
          /* maintain structure, add subtle glow */
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05) inset,
            0 0 0 4px #FFFFFF,
            0 0 0 8px var(--marker-color),
            0 0 0 10px #FFFFFF,
            0 0 0 11.7px rgba(0,0,0,0.08),
            0 0 2px 2px rgba(255,255,255,0.25); /* gentle outer glow */
        }
        .circular-marker.ringed-marker.interactive:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.35);
          transform: scale(1.05);
          transition: all 0.25s ease;
        }

        /* アイコンのホバー効果（控えめなグロー） */
        .circular-marker.interactive:hover .icon-image {
          filter: invert(1) drop-shadow(0 0 3px rgba(255,255,255,0.8));
          transition: filter 0.25s ease;
        }

        /* ツールチップの改善されたアニメーション（スケール削除） */
        .circular-marker.interactive:hover .category-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(-2px);
          transition: opacity 0.25s ease-out, transform 0.25s ease-out;
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

        /* アクティブ状態（クリック時）- シャドウのみ変更 */
        .circular-marker.interactive:active {
          box-shadow: 0 1px 4px rgba(0,0,0,0.2) !important;
          transition: box-shadow 0.05s ease-out;
        }

        /* Stability & performance hints */
        .circular-marker { will-change: transform, filter; }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .circular-marker.attention,
          .circular-marker.subtle-animation,
          .circular-marker.loading { animation: none !important; }
          .circular-marker.parking-marker.interactive:hover::before,
          .circular-marker.ringed-marker.interactive:hover::before {
            transform: translate(-50%, -50%);
          }
          .circular-marker.interactive:hover,
          .circular-marker.interactive:active {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          }
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
      )}
    </button>
  );
};

export const RestaurantCircularMarker: React.FC<
  Omit<CircularMarkerProps, "category"> & {
    category: Exclude<IcooonMarkerCategory, "parking" | "toilet">;
  }
> = props => <CircularMarker {...props} />;

export const FacilityCircularMarker: React.FC<
  Omit<CircularMarkerProps, "category"> & {
    category: "parking" | "toilet";
  }
> = props => <CircularMarker {...props} />;

export default CircularMarker;
