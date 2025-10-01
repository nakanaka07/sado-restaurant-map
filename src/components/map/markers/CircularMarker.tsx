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
}

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
  const baseColor = CIRCULAR_MARKER_COLORS[category];
  const iconPath = ICON_PATH_MAP[category];
  const defaultAriaLabel = ARIA_LABEL_MAP[category];
  const isParking = category === "parking";
  const parkingColor = "#4CAF50"; // classic parking green

  const animationClass = animation !== "none" ? `${animation}-animation` : "";
  const fullClassName =
    `circular-marker ${className} ${interactive ? "interactive" : "static"} ${animationClass} ${
      isParking ? "parking-marker" : ""
    }`.trim();

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

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
          background: isParking ? "#FFFFFF" : baseColor,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: interactive ? "pointer" : "default",
          transition: "all 0.25s ease-in-out",
          boxShadow: isParking
            ? [
                // outer white ring (reduced spread 10.5px -> 10.0px)
                "0 0 0 10px #FFFFFF",
                // subtle outline adjusted accordingly (11.1 -> 10.6)
                "0 0 0 10.6px rgba(0,0,0,0.06)",
                // depth shadow
                "0 2px 5px rgba(0,0,0,0.26)",
              ].join(", ")
            : "0 2px 8px rgba(0,0,0,0.15)",
          border: isParking ? "none" : "2px solid rgba(255,255,255,0.3)",
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
      <img
        src={iconPath}
        alt=""
        aria-hidden="true"
        className="icon-image"
        style={{
          width: sizeConfig.iconSize,
          height: sizeConfig.iconSize,
          filter: "brightness(0) saturate(100%) invert(100%)",
          pointerEvents: "none",
        }}
      />

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
          width: 62%;
          height: 62%;
          transform: translate(-50%, -50%);
          background: ${parkingColor};
          border-radius: 50%;
          z-index: 0;
          transition: transform 0.25s ease, filter 0.25s ease;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.05) inset;
        }
        .circular-marker.parking-marker .icon-image { position: relative; z-index: 1; }
        .circular-marker.parking-marker.interactive:hover::before {
          transform: translate(-50%, -50%) scale(1.04);
          filter: brightness(1.05) saturate(1.08);
        }
        .circular-marker.parking-marker.interactive:hover {
          box-shadow:
            0 0 0 10px #FFFFFF,
            0 0 0 10.6px rgba(0,0,0,0.075),
            0 5px 15px rgba(0,0,0,0.40);
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
