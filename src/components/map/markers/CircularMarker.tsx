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

function computeIconSize(base: number, ringed: boolean): number {
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
  const computedIconSize = computeIconSize(sizeConfig.iconSize, isRinged);

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
            filter: "brightness(0) saturate(100%) invert(100%)",
            pointerEvents: "none",
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

      <style
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
          /* Base core circle size */
          /* Slightly reduced to keep outer visual footprint consistent with non-ringed markers */
          width: 72%;
          height: 72%;
          transform: translate(-50%, -50%);
          background: ${parkingColor}; /* green core */
          border-radius: 50%;
          z-index: 0;
          transition: transform 0.25s ease, filter 0.25s ease;
          /* Multi-ring stack (green core + white ring + green ring + outer white ring + subtle outline)
             We build outward using successive spread radii; fine-tune values for visual proportion.
             Order: inset subtle core edge, then outward rings.
          */
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05) inset, /* subtle inner definition */
            0 0 0 4px #FFFFFF,                /* inner white ring (4px) */
            0 0 0 8px ${parkingColor},       /* mid green ring (adds 4px beyond white) */
            0 0 0 10px #FFFFFF,               /* outer white ring (adds 2px) */
            0 0 0 11.7px rgba(0,0,0,0.06);    /* faint outline (adds 0.7px) */
        }
        .circular-marker.parking-marker .icon-image { position: relative; z-index: 1; }
        .circular-marker.parking-marker.interactive:hover::before {
          /* remove scale; add gentle glow ring */
          filter: brightness(1.02) saturate(1.04);
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05) inset,
            0 0 0 5px #FFFFFF,
            0 0 0 9px ${parkingColor},
            0 0 0 10.3px #FFFFFF,
            0 0 0 12px rgba(0,0,0,0.10),
            0 0 4px 2px rgba(76,175,80,0.35); /* soft colored glow */
        }
        .circular-marker.parking-marker.interactive:hover {
          box-shadow: 0 3px 9px rgba(0,0,0,0.24);
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
          filter: brightness(1.02) saturate(1.04);
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05) inset,
            0 0 0 5px #FFFFFF,
            0 0 0 9px var(--marker-color),
            0 0 0 10.3px #FFFFFF,
            0 0 0 12px rgba(0,0,0,0.10),
            0 0 4px 2px rgba(255,255,255,0.35); /* neutral glow */
        }
        .circular-marker.ringed-marker.interactive:hover {
          box-shadow: 0 3px 9px rgba(0,0,0,0.24);
        }

        /* アイコンのホバー効果 */
        .circular-marker.interactive:hover .icon-image {
          filter: brightness(0) saturate(100%) invert(100%) drop-shadow(0 0 3px rgba(255,255,255,0.65));
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
          /* minimal nudge, no rotation to avoid visual wobble */
          transform: translateY(1px);
          transition: transform 0.08s ease-out;
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
            transform: translate(-50%, -50%) scale(1);
            filter: brightness(1) saturate(1);
          }
          .circular-marker.interactive:active { transform: scale(0.98); }
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
