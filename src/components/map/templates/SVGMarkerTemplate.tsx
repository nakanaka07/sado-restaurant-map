/**
 * @fileoverview SVGマーカーテンプレートシステム v2.0
 * レスポンシブ・アクセシブル・パフォーマンス最適化対応
 *
 * 🎯 特徴:
 * 1. 三層情報システム (色彩 + 形状 + アイコン)
 * 2. レスポンシブサイズ対応
 * 3. WCAG 2.2 AA準拠
 * 4. 最適化されたSVG生成
 */

import React from "react";
import type {
  MarkerCategory,
  MarkerDesignSystem,
  MarkerSize,
} from "../v2/MarkerDesignSystem";
import {
  adjustColorBrightness,
  generateShapePath,
  getIconSize,
  getMarkerDimensions,
} from "./svgMarkerUtils";

// ==============================
// SVGマーカーコンポーネントProps
// ==============================

export interface SVGMarkerTemplateProps {
  readonly config: MarkerDesignSystem;
  readonly size: MarkerSize;
  readonly isSelected?: boolean | undefined;
  readonly isHovered?: boolean | undefined;
  readonly children?: React.ReactNode; // アイコンコンテンツ
  readonly className?: string | undefined;
  readonly style?: React.CSSProperties;
  readonly onClick?: (() => void) | undefined; // exactOptionalPropertyTypes対応
  readonly onKeyDown?: (event: React.KeyboardEvent) => void;
}

// ==============================
// メインSVGマーカーテンプレート
// ==============================

export const SVGMarkerTemplate: React.FC<SVGMarkerTemplateProps> = ({
  config,
  size,
  isSelected = false,
  isHovered = false,
  children,
  className = "",
  style = {},
  onClick,
  onKeyDown,
}) => {
  const dimensions = getMarkerDimensions(size);
  const { width, height } = dimensions;
  const iconSize = getIconSize(size);

  // 状態に基づくスタイル調整
  // スケールとシャドウ強度の計算
  let scale = 1.0;
  let shadowIntensity = 0.2;

  if (isSelected) {
    scale = 1.2;
    shadowIntensity = 0.4;
  } else if (isHovered) {
    scale = 1.1;
    shadowIntensity = 0.3;
  }

  // グラデーション用のユニークID
  const gradientId = `gradient-${config.category}-${Date.now()}`;
  const shadowId = `shadow-${config.category}-${Date.now()}`;

  // キーボードイベントハンドラー
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
    onKeyDown?.(event);
  };

  return (
    <button
      type="button"
      className={`marker-container ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        transform: `scale(${scale})`,
        transition: "transform 0.2s ease-out",
        border: "none",
        background: "transparent",
        padding: 0,
        ...style,
      }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={config.accessibility.tabIndex}
      aria-label={config.accessibility.ariaLabel}
      title={config.accessibility.ariaDescription}
    >
      {/* メインSVGマーカー */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`marker-title-${config.category}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <defs>
          {/* グラデーション定義 */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={config.colorPrimary} />
            <stop
              offset="100%"
              stopColor={adjustColorBrightness(config.colorPrimary, -15)}
            />
          </linearGradient>

          {/* シャドウ定義 */}
          <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="2"
              dy="4"
              stdDeviation={shadowIntensity * 3}
              floodOpacity={shadowIntensity}
              floodColor="#000000"
            />
          </filter>
        </defs>

        {/* マーカー形状パス */}
        <path
          d={generateShapePath(config.shape, width, height)}
          fill={`url(#${gradientId})`}
          stroke={config.colorContrast}
          strokeWidth="2"
          filter={`url(#${shadowId})`}
        />

        <title id={`marker-title-${config.category}`}>
          {config.accessibility.ariaDescription}
        </title>
      </svg>

      {/* アイコン表示エリア */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: config.colorContrast,
          fontSize: `${iconSize}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {children || config.icon}
      </div>

      {/* ホバー・選択状態の視覚的フィードバック */}
      {(isHovered || isSelected) && (
        <div
          style={{
            position: "absolute",
            top: "-4px",
            left: "-4px",
            right: "-4px",
            bottom: "-4px",
            borderRadius: "50%",
            border: `2px solid ${config.colorPrimary}`,
            opacity: isSelected ? 0.8 : 0.5,
            animation: isSelected ? "pulse 1s infinite" : undefined,
            pointerEvents: "none",
          }}
        />
      )}
    </button>
  );
};

// ==============================
// 専用マーカーコンポーネント
// ==============================

/**
 * レストランマーカー専用コンポーネント
 */
export interface RestaurantMarkerProps {
  readonly category: MarkerCategory;
  readonly size?: MarkerSize;
  readonly isSelected?: boolean;
  readonly isHovered?: boolean;
  readonly rating?: number;
  readonly onClick?: (() => void) | undefined; // exactOptionalPropertyTypes対応
  readonly className?: string;
}

export const RestaurantMarker: React.FC<RestaurantMarkerProps> = ({
  category,
  size = "standard",
  isSelected,
  isHovered,
  rating,
  onClick,
  className,
}) => {
  // カテゴリ設定を取得 (実装は MarkerDesignSystem から)
  const config: MarkerDesignSystem = {
    category,
    colorPrimary: "#D32F2F",
    colorSecondary: "#FFCDD2",
    colorContrast: "#FFFFFF",
    shape: "circle",
    icon: "🍽️",
    accessibility: {
      ariaLabel: `${category}レストラン`,
      ariaDescription: `${category}カテゴリの飲食店`,
      contrastRatio: 5.2,
      cvdFriendly: true,
      keyboardNavigable: true,
      role: "button",
      tabIndex: 0,
    },
  };

  return (
    <SVGMarkerTemplate
      config={config}
      size={size}
      isSelected={isSelected}
      isHovered={isHovered}
      onClick={onClick}
      className={className}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span>{config.icon}</span>
        {rating && (
          <div
            style={{
              fontSize: "8px",
              background: "rgba(255,255,255,0.9)",
              color: "#000",
              borderRadius: "4px",
              padding: "1px 3px",
              marginTop: "2px",
            }}
          >
            ⭐{rating}
          </div>
        )}
      </div>
    </SVGMarkerTemplate>
  );
};

/**
 * 施設マーカー専用コンポーネント
 */
export interface FacilityMarkerProps {
  readonly type: "parking" | "toilet";
  readonly size?: MarkerSize;
  readonly capacity?: number;
  readonly isAccessible?: boolean;
  readonly onClick?: (() => void) | undefined; // exactOptionalPropertyTypes対応
  readonly className?: string;
}

export const FacilityMarker: React.FC<FacilityMarkerProps> = ({
  type,
  size = "standard",
  capacity,
  isAccessible,
  onClick,
  className,
}) => {
  // 施設タイプ設定を取得
  const config: MarkerDesignSystem = {
    category: type as MarkerCategory,
    colorPrimary: type === "parking" ? "#455A64" : "#00695C",
    colorSecondary: type === "parking" ? "#CFD8DC" : "#B2DFDB",
    colorContrast: "#FFFFFF",
    shape: "square",
    icon: type === "parking" ? "🅿️" : "🚻",
    accessibility: {
      ariaLabel: type === "parking" ? "駐車場" : "トイレ",
      ariaDescription: `${type === "parking" ? "駐車場の位置" : "公衆トイレの位置"}`,
      contrastRatio: type === "parking" ? 6.2 : 5.8,
      cvdFriendly: true,
      keyboardNavigable: true,
      role: "button",
      tabIndex: 0,
    },
  };

  return (
    <SVGMarkerTemplate
      config={config}
      size={size}
      onClick={onClick}
      className={className}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span>{config.icon}</span>
        {capacity && type === "parking" && (
          <div
            style={{
              fontSize: "8px",
              background: "rgba(255,255,255,0.9)",
              color: "#000",
              borderRadius: "4px",
              padding: "1px 3px",
              marginTop: "2px",
            }}
          >
            {capacity}台
          </div>
        )}
        {isAccessible && (
          <div
            style={{
              fontSize: "8px",
              background: "rgba(255,255,255,0.9)",
              color: "#000",
              borderRadius: "4px",
              padding: "1px 3px",
              marginTop: "1px",
            }}
          >
            ♿
          </div>
        )}
      </div>
    </SVGMarkerTemplate>
  );
};
