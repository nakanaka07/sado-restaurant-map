/**
 * @fileoverview 形状システム・ジオメトリ生成ユーティリティ
 * 数学的に最適化された形状パス生成とレスポンシブ対応
 *
 * @deprecated このユーティリティは非推奨です。
 * SVGマーカー内部ユーティリティに統合されました。
 * 詳細: src/components/map/legacy/README.md
 */

// Deprecation警告
if (process.env.NODE_ENV === "development") {
  console.warn(
    "⚠️ MarkerShapeSystem is deprecated. SVG utilities are now integrated internally."
  );
}

// ==============================
// 基本型定義
// ==============================

export interface ShapeConfig {
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly radius: number;
  readonly strokeWidth?: number;
}

export interface PathGeometry {
  readonly mainPath: string; // メイン形状パス
  readonly tipPath: string; // マーカー先端パス
  readonly boundingBox: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

// ==============================
// 数学ユーティリティ
// ==============================

/**
 * 度数をラジアンに変換
 */
export const degToRad = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * 極座標から直交座標に変換
 */
export const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } => ({
  x: centerX + radius * Math.cos(degToRad(angleInDegrees)),
  y: centerY + radius * Math.sin(degToRad(angleInDegrees)),
});

/**
 * 二点間の距離計算
 */
export const distance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

/**
 * ベジエ曲線制御点計算
 */
export const getBezierControlPoint = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  curvature: number = 0.2
): { cx: number; cy: number } => ({
  cx: (startX + endX) / 2,
  cy: (startY + endY) / 2 - distance(startX, startY, endX, endY) * curvature,
});

// ==============================
// 形状パス生成器
// ==============================

/**
 * 円形マーカーパス生成
 */
export const generateCirclePath = (config: ShapeConfig): PathGeometry => {
  const { centerX, centerY, radius, height } = config;
  const tipY = height * 0.9;

  const mainPath = `
    M ${centerX - radius} ${centerY}
    A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY}
    A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY}
  `;

  const tipPath = `
    M ${centerX - radius * 0.3} ${centerY + radius}
    Q ${centerX} ${tipY} ${centerX + radius * 0.3} ${centerY + radius}
  `;

  return {
    mainPath,
    tipPath,
    boundingBox: {
      x: centerX - radius,
      y: centerY - radius,
      width: radius * 2,
      height: tipY - (centerY - radius),
    },
  };
};

/**
 * 四角形マーカーパス生成
 */
export const generateSquarePath = (config: ShapeConfig): PathGeometry => {
  const { centerX, centerY, radius, height } = config;
  const sideLength = radius * 1.4;
  const halfSide = sideLength / 2;
  const tipY = height * 0.9;

  const mainPath = `
    M ${centerX - halfSide} ${centerY - halfSide}
    L ${centerX + halfSide} ${centerY - halfSide}
    L ${centerX + halfSide} ${centerY + halfSide}
    L ${centerX - halfSide} ${centerY + halfSide}
    Z
  `;

  const tipPath = `
    M ${centerX - halfSide * 0.4} ${centerY + halfSide}
    Q ${centerX} ${tipY} ${centerX + halfSide * 0.4} ${centerY + halfSide}
  `;

  return {
    mainPath,
    tipPath,
    boundingBox: {
      x: centerX - halfSide,
      y: centerY - halfSide,
      width: sideLength,
      height: tipY - (centerY - halfSide),
    },
  };
};

/**
 * 三角形マーカーパス生成
 */
export const generateTrianglePath = (config: ShapeConfig): PathGeometry => {
  const { centerX, centerY, radius, height } = config;
  const triangleHeight = radius * 1.2;
  const tipY = height * 0.9;

  // 正三角形の頂点計算
  const topPoint = { x: centerX, y: centerY - triangleHeight };
  const leftPoint = { x: centerX - radius, y: centerY + triangleHeight / 2 };
  const rightPoint = { x: centerX + radius, y: centerY + triangleHeight / 2 };

  const mainPath = `
    M ${topPoint.x} ${topPoint.y}
    L ${rightPoint.x} ${rightPoint.y}
    L ${leftPoint.x} ${leftPoint.y}
    Z
  `;

  const tipPath = `
    M ${leftPoint.x + radius * 0.3} ${rightPoint.y}
    Q ${centerX} ${tipY} ${rightPoint.x - radius * 0.3} ${rightPoint.y}
  `;

  return {
    mainPath,
    tipPath,
    boundingBox: {
      x: leftPoint.x,
      y: topPoint.y,
      width: radius * 2,
      height: tipY - topPoint.y,
    },
  };
};

/**
 * ダイヤ形マーカーパス生成
 */
export const generateDiamondPath = (config: ShapeConfig): PathGeometry => {
  const { centerX, centerY, radius, height } = config;
  const diamondRadius = radius * 0.9;
  const tipY = height * 0.9;

  const mainPath = `
    M ${centerX} ${centerY - diamondRadius}
    L ${centerX + diamondRadius} ${centerY}
    L ${centerX} ${centerY + diamondRadius}
    L ${centerX - diamondRadius} ${centerY}
    Z
  `;

  const tipPath = `
    M ${centerX - diamondRadius * 0.4} ${centerY + diamondRadius}
    Q ${centerX} ${tipY} ${centerX + diamondRadius * 0.4} ${centerY + diamondRadius}
  `;

  return {
    mainPath,
    tipPath,
    boundingBox: {
      x: centerX - diamondRadius,
      y: centerY - diamondRadius,
      width: diamondRadius * 2,
      height: tipY - (centerY - diamondRadius),
    },
  };
};

/**
 * 六角形マーカーパス生成
 */
export const generateHexagonPath = (config: ShapeConfig): PathGeometry => {
  const { centerX, centerY, radius, height } = config;
  const hexRadius = radius * 0.8;
  const tipY = height * 0.9;

  // 六角形の頂点計算 (上から時計回り)
  const vertices: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angle = i * 60 - 90; // -90度でトップから開始
    const vertex = polarToCartesian(centerX, centerY, hexRadius, angle);
    vertices.push(vertex);
  }

  const mainPath = `
    M ${vertices[0].x} ${vertices[0].y}
    ${vertices
      .slice(1)
      .map(v => `L ${v.x} ${v.y}`)
      .join(" ")}
    Z
  `;

  const tipPath = `
    M ${vertices[4].x} ${vertices[4].y}
    Q ${centerX} ${tipY} ${vertices[5].x} ${vertices[5].y}
  `;

  return {
    mainPath,
    tipPath,
    boundingBox: {
      x: centerX - hexRadius,
      y: centerY - hexRadius,
      width: hexRadius * 2,
      height: tipY - (centerY - hexRadius),
    },
  };
};

// ==============================
// 統合形状ファクトリー
// ==============================

export type MarkerShape =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon";

/**
 * 形状タイプに基づいてパスジオメトリを生成
 */
export const generateMarkerGeometry = (
  shape: MarkerShape,
  config: ShapeConfig
): PathGeometry => {
  switch (shape) {
    case "circle":
      return generateCirclePath(config);
    case "square":
      return generateSquarePath(config);
    case "triangle":
      return generateTrianglePath(config);
    case "diamond":
      return generateDiamondPath(config);
    case "hexagon":
      return generateHexagonPath(config);
    default:
      return generateCirclePath(config);
  }
};

/**
 * レスポンシブ形状設定生成
 */
export const createResponsiveShapeConfig = (
  width: number,
  height: number,
  strokeWidth: number = 2
): ShapeConfig => ({
  width,
  height,
  centerX: width / 2,
  centerY: height * 0.35, // マーカー上部35%の位置
  radius: Math.min(width, height) * 0.25, // サイズの25%
  strokeWidth,
});

// ==============================
// 高度な形状効果
// ==============================

/**
 * 3D効果用のパス生成
 */
export const generate3DEffectPaths = (
  geometry: PathGeometry,
  depth: number = 2
): {
  shadowPath: string;
  highlightPath: string;
} => {
  // 影効果 (右下にオフセット)
  const shadowPath = geometry.mainPath
    .replace(
      /M\s*([\d.]+)\s*([\d.]+)/g,
      (_, x: string, y: string) =>
        `M ${parseFloat(x) + depth} ${parseFloat(y) + depth}`
    )
    .replace(
      /L\s*([\d.]+)\s*([\d.]+)/g,
      (_, x: string, y: string) =>
        `L ${parseFloat(x) + depth} ${parseFloat(y) + depth}`
    );

  // ハイライト効果 (左上にオフセット)
  const highlightPath = geometry.mainPath
    .replace(
      /M\s*([\d.]+)\s*([\d.]+)/g,
      (_, x: string, y: string) =>
        `M ${parseFloat(x) - depth / 2} ${parseFloat(y) - depth / 2}`
    )
    .replace(
      /L\s*([\d.]+)\s*([\d.]+)/g,
      (_, x: string, y: string) =>
        `L ${parseFloat(x) - depth / 2} ${parseFloat(y) - depth / 2}`
    );

  return { shadowPath, highlightPath };
};

/**
 * パルス効果用のアニメーション設定
 */
export const generatePulseAnimation = (
  baseRadius: number,
  intensity: number = 0.2
): {
  values: string;
  dur: string;
  repeatCount: string;
} => ({
  values: `${baseRadius};${baseRadius * (1 + intensity)};${baseRadius}`,
  dur: "2s",
  repeatCount: "indefinite",
});

/**
 * 回転効果用のアニメーション設定
 */
export const generateRotationAnimation = (
  speed: "slow" | "medium" | "fast" = "medium"
): {
  values: string;
  dur: string;
  repeatCount: string;
} => {
  const speedMap = {
    slow: "4s",
    medium: "2s",
    fast: "1s",
  };

  return {
    values: "0;360",
    dur: speedMap[speed],
    repeatCount: "indefinite",
  };
};

// ==============================
// 形状最適化ユーティリティ
// ==============================

/**
 * SVGパスの最適化（不要な小数点削除）
 */
export const optimizeSVGPath = (
  path: string,
  precision: number = 1
): string => {
  return path.replace(/[\d.]+/g, match => {
    const num = parseFloat(match);
    return num.toFixed(precision).replace(/\.?0+$/, "");
  });
};

/**
 * パスの境界ボックス計算
 */
export const calculatePathBounds = (
  path: string
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} => {
  const coords: number[] = [];
  const matches = path.match(/[\d.]+/g);

  if (matches) {
    coords.push(...matches.map(Number));
  }

  const xCoords = coords.filter((_, i) => i % 2 === 0);
  const yCoords = coords.filter((_, i) => i % 2 === 1);

  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * ViewBox最適化
 */
export const optimizeViewBox = (
  geometry: PathGeometry,
  padding: number = 4
): string => {
  const { x, y, width, height } = geometry.boundingBox;
  return `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`;
};
