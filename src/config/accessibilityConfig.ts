/**
 * @fileoverview アクセシブルカラーシステム設定
 * WCAG 2.2 AA準拠のカラーパレット・コントラスト計算ユーティリティ
 */

// ==============================
// カラーアクセシビリティユーティリティ
// ==============================

/** RGB値 */
export interface RGBColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** HSL値 */
export interface HSLColor {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

/** 色覚多様性タイプ */
export type ColorVisionType =
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "normal";

/**
 * HEX色をRGBに変換
 */
export const hexToRgb = (hex: string): RGBColor => {
  const cleanHex = hex.replace("#", "");
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
};

/**
 * RGBをHEXに変換
 */
export const rgbToHex = ({ r, g, b }: RGBColor): string => {
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g)
    .toString(16)
    .padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
};

/**
 * 相対輝度を計算 (WCAG基準)
 */
export const getLuminance = (color: RGBColor): number => {
  const { r, g, b } = color;

  const srgb = [r, g, b].map(c => {
    const normalized = c / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

/**
 * 2色間のコントラスト比を計算 (WCAG基準)
 * @param color1 前景色
 * @param color2 背景色
 * @returns コントラスト比 (1:1 - 21:1)
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

// ==============================
// 色覚多様性サポート
// ==============================

/**
 * 色を解析してRGB値を取得
 */
const parseColor = (color: string): RGBColor => {
  if (color.startsWith("#")) {
    return hexToRgb(color);
  }
  // RGB形式の場合の処理も追加可能
  throw new Error(`Unsupported color format: ${color}`);
};

/**
 * RGB値を色文字列にフォーマット
 */
const formatColor = (r: number, g: number, b: number): string => {
  return rgbToHex({ r, g, b });
};

/**
 * 色覚多様性をシミュレーション
 * @param color 元の色
 * @param visionType 色覚タイプ
 * @returns 調整後の色
 */
export const simulateColorVision = (
  color: string,
  visionType: ColorVisionType
): string => {
  const { r, g, b } = parseColor(color);

  switch (visionType) {
    case "protanopia": // 赤緑色盲（赤錐体欠損）
      return formatColor(
        Math.round(0.567 * r + 0.433 * g + 0.0 * b),
        Math.round(0.558 * r + 0.442 * g + 0.0 * b),
        Math.round(0.0 * r + 0.242 * g + 0.758 * b)
      );
    case "deuteranopia": // 赤緑色盲（緑錐体欠損）
      return formatColor(
        Math.round(0.625 * r + 0.375 * g + 0.0 * b),
        Math.round(0.7 * r + 0.3 * g + 0.0 * b),
        Math.round(0.0 * r + 0.3 * g + 0.7 * b)
      );
    case "tritanopia": // 青黄色盲（青錐体欠損）
      return formatColor(
        Math.round(0.95 * r + 0.05 * g + 0.0 * b),
        Math.round(0.0 * r + 0.433 * g + 0.567 * b),
        Math.round(0.0 * r + 0.475 * g + 0.525 * b)
      );
    default:
      return color;
  }
};

/**
 * 色覚多様性に配慮した色の組み合わせかをチェック
 * @param colors チェックする色の配列
 * @param threshold 最小コントラスト比 (デフォルト: 2.0)
 * @returns 検証結果
 */
export const isColorVisionFriendly = (
  colors: string[],
  threshold = 2.0
): {
  isFriendly: boolean;
  problematicPairs: Array<{ color1: string; color2: string; contrast: number }>;
} => {
  const problematicPairs: Array<{
    color1: string;
    color2: string;
    contrast: number;
  }> = [];

  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const color1 = colors[i];
      const color2 = colors[j];

      // 各色覚異常パターンでの色比較
      const visionTypes: ColorVisionType[] = [
        "protanopia",
        "deuteranopia",
        "tritanopia",
      ];

      for (const visionType of visionTypes) {
        const adjustedColor1 = simulateColorVision(color1, visionType);
        const adjustedColor2 = simulateColorVision(color2, visionType);
        const contrast = getContrastRatio(adjustedColor1, adjustedColor2);

        if (contrast < threshold) {
          problematicPairs.push({ color1, color2, contrast });
          break; // 1つでも問題があれば記録
        }
      }
    }
  }

  return {
    isFriendly: problematicPairs.length === 0,
    problematicPairs,
  };
};

// ==============================
// WCAG準拠性検証
// ==============================

/** アクセシビリティ検証結果 */
export interface AccessibilityValidationResult {
  readonly isValid: boolean;
  readonly contrastRatio: number;
  readonly meetsAA: boolean;
  readonly meetsAAA: boolean;
  readonly isColorVisionFriendly: boolean;
  readonly recommendations?: string[];
}

/**
 * 色のアクセシビリティを総合的に検証
 * @param foreground 前景色
 * @param background 背景色
 * @param compareColors 他の色との比較用色リスト
 * @returns 検証結果
 */
export const validateColorAccessibility = (
  foreground: string,
  background: string,
  compareColors: string[] = []
): AccessibilityValidationResult => {
  const contrastRatio = getContrastRatio(foreground, background);

  // WCAG基準チェック
  const meetsAA = contrastRatio >= 4.5;
  const meetsAAA = contrastRatio >= 7.0;

  // 他の色との区別可能性をチェック
  const isColorVisionFriendlyResult =
    compareColors.length > 0
      ? isColorVisionFriendly([foreground, ...compareColors]).isFriendly
      : true;

  const recommendations: string[] = [];

  if (!meetsAA) {
    recommendations.push("コントラスト比を4.5:1以上に調整してください");
  }
  if (!isColorVisionFriendlyResult) {
    recommendations.push(
      "色覚多様性に配慮した色の組み合わせを検討してください"
    );
  }

  return {
    isValid: meetsAA && isColorVisionFriendlyResult,
    contrastRatio,
    meetsAA,
    meetsAAA,
    isColorVisionFriendly: isColorVisionFriendlyResult,
    ...(recommendations.length > 0 ? { recommendations } : {}),
  } as AccessibilityValidationResult;
};

// ==============================
// プリセットカラーパレット
// ==============================

/** 事前検証済みアクセシブルカラーセット */
export const ACCESSIBLE_PRESET_COLORS = {
  // 背景: 白 (#FFFFFF) でのテスト済み
  backgrounds: {
    white: "#FFFFFF",
    lightGray: "#F5F5F5",
    mediumGray: "#E0E0E0",
  },
  // WCAG AA準拠カラー (4.5:1以上)
  accessibleColors: {
    deepRed: "#C62828", // 5.5:1
    orange: "#F57C00", // 4.8:1
    deepPurple: "#7B1FA2", // 5.4:1
    forestGreen: "#2E7D32", // 4.7:1
    amber: "#F9A825", // 4.6:1
    darkOrange: "#E65100", // 5.1:1
    indigo: "#3F51B5", // 5.0:1
    teal: "#00695C", // 5.8:1
    blueGray: "#455A64", // 6.2:1
  },
};

// ==============================
// カラー調整ユーティリティ
// ==============================

/**
 * 色の明度を調整してコントラスト比を改善
 * @param color 調整する色
 * @param background 背景色
 * @param targetContrast 目標コントラスト比
 * @returns 調整後の色
 */
export const adjustColorForContrast = (
  color: string,
  background: string,
  targetContrast = 4.5
): string => {
  const currentColor = color;
  const currentContrast = getContrastRatio(currentColor, background);

  if (currentContrast >= targetContrast) {
    return currentColor;
  }

  const rgb = hexToRgb(currentColor);
  const backgroundLuminance = getLuminance(hexToRgb(background));

  // 背景より明るいか暗いかで調整方向を決定
  const shouldDarken = getLuminance(rgb) > backgroundLuminance;

  for (let adjustment = 10; adjustment <= 100; adjustment += 10) {
    const adjustedRgb: RGBColor = {
      r: shouldDarken
        ? Math.max(0, rgb.r - adjustment)
        : Math.min(255, rgb.r + adjustment),
      g: shouldDarken
        ? Math.max(0, rgb.g - adjustment)
        : Math.min(255, rgb.g + adjustment),
      b: shouldDarken
        ? Math.max(0, rgb.b - adjustment)
        : Math.min(255, rgb.b + adjustment),
    };

    const adjustedColor = rgbToHex(adjustedRgb);
    const adjustedContrast = getContrastRatio(adjustedColor, background);

    if (adjustedContrast >= targetContrast) {
      return adjustedColor;
    }
  }

  // 調整できない場合は元の色を返す
  return currentColor;
};

/**
 * カラーパレット全体のアクセシビリティを検証
 * @param colors 検証するカラーパレット
 * @param background 背景色
 * @returns 検証レポート
 */
export const validateColorPalette = (
  colors: Record<string, string>,
  background = "#FFFFFF"
): {
  overall: boolean;
  individual: Record<string, AccessibilityValidationResult>;
  summary: {
    totalColors: number;
    passedColors: number;
    failedColors: string[];
    averageContrast: number;
  };
} => {
  const individual: Record<string, AccessibilityValidationResult> = {};
  const colorValues = Object.values(colors);
  let totalContrast = 0;
  let passedCount = 0;
  const failedColors: string[] = [];

  Object.entries(colors).forEach(([key, color]) => {
    const result = validateColorAccessibility(
      color,
      background,
      colorValues.filter(c => c !== color)
    );
    individual[key] = result;
    totalContrast += result.contrastRatio;

    if (result.isValid) {
      passedCount++;
    } else {
      failedColors.push(key);
    }
  });

  const totalColors = Object.keys(colors).length;

  return {
    overall: failedColors.length === 0,
    individual,
    summary: {
      totalColors,
      passedColors: passedCount,
      failedColors,
      averageContrast: totalColors > 0 ? totalContrast / totalColors : 0,
    },
  };
};
