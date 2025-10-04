/**
 * @fileoverview SVGマーカー用ユーティリティ関数
 * React Fast Refresh対応のため、コンポーネントと分離
 *
 * @deprecated このファイルは非推奨です。legacy/templates/SVGMarkerTemplate.tsx の一部です。
 */

import type { MarkerShape, MarkerSize } from "../../v2/MarkerDesignSystem";

// ==============================
// 形状パス生成関数
// ==============================

/**
 * マーカー形状別SVGパス生成
 */
export const generateShapePath = (
  shape: MarkerShape,
  width: number,
  height: number
): string => {
  const centerX = width / 2;
  const centerY = height * 0.35; // マーカー上部の円形部分
  const radius = Math.min(width, height) * 0.3;
  const tipY = height * 0.9; // マーカー先端

  switch (shape) {
    case "circle":
      return `
        M ${centerX} ${centerY - radius}
        A ${radius} ${radius} 0 1 1 ${centerX} ${centerY + radius}
        L ${centerX} ${tipY}
        Z
      `;

    case "square": {
      const halfSide = radius * 0.8;
      return `
        M ${centerX - halfSide} ${centerY - halfSide}
        L ${centerX + halfSide} ${centerY - halfSide}
        L ${centerX + halfSide} ${centerY + halfSide}
        L ${centerX - halfSide} ${centerY + halfSide}
        L ${centerX - halfSide} ${centerY - halfSide}
        L ${centerX} ${tipY}
        Z
      `;
    }

    case "diamond": {
      return `
        M ${centerX} ${centerY - radius}
        L ${centerX + radius * 0.7} ${centerY}
        L ${centerX} ${centerY + radius}
        L ${centerX - radius * 0.7} ${centerY}
        L ${centerX} ${centerY - radius}
        L ${centerX} ${tipY}
        Z
      `;
    }

    case "triangle": {
      const triangleHeight = radius * 1.2;
      return `
        M ${centerX} ${centerY - triangleHeight}
        L ${centerX - radius} ${centerY + triangleHeight / 2}
        L ${centerX + radius} ${centerY + triangleHeight / 2}
        Z
        M ${centerX} ${centerY + triangleHeight / 2}
        L ${centerX} ${tipY}
        Z
      `;
    }

    case "hexagon": {
      const hexRadius = radius * 0.8;
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        hexPoints.push([
          centerX + Math.cos(angle) * hexRadius,
          centerY + Math.sin(angle) * hexRadius,
        ]);
      }

      return `
        M ${hexPoints[0]?.[0]} ${hexPoints[0]?.[1]}
        ${hexPoints
          .slice(1)
          .map(([x, y]) => `L ${x} ${y}`)
          .join(" ")}
        L ${hexPoints[0]?.[0]} ${hexPoints[0]?.[1]}
        L ${centerX} ${tipY}
        Z
      `;
    }

    default: {
      // デフォルトは円形（circleケースと同じ）
      return generateShapePath("circle", width, height);
    }
  }
};

/**
 * サイズに基づく寸法取得
 */
export const getMarkerDimensions = (
  size: MarkerSize
): { width: number; height: number } => {
  const sizeMap: Record<MarkerSize, { width: number; height: number }> = {
    small: { width: 24, height: 30 },
    medium: { width: 36, height: 44 },
    standard: { width: 48, height: 58 },
    large: { width: 60, height: 72 },
  };
  return sizeMap[size];
};

/**
 * アイコンサイズ計算
 */
export const getIconSize = (markerSize: MarkerSize): number => {
  const dimensions = getMarkerDimensions(markerSize);
  return Math.round(dimensions.width * 0.4);
};

/**
 * 色の明度調整
 */
export const adjustColorBrightness = (hex: string, percent: number): string => {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  const clampedR = Math.max(0, Math.min(255, R));
  const clampedG = Math.max(0, Math.min(255, G));
  const clampedB = Math.max(0, Math.min(255, B));

  return `#${(0x1000000 + clampedR * 0x10000 + clampedG * 0x100 + clampedB)
    .toString(16)
    .slice(1)}`;
};
