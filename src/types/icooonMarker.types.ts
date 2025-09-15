/**
 * ICOOON MONO 専用マーカー型定義
 * 10カテゴリ統一実装用
 */

// ==============================
// ICOOON MONO カテゴリ型定義
// ==============================

/**
 * 統合10カテゴリ定義
 */
export type IcooonMarkerCategory =
  | "japanese" // 和食 🍚
  | "noodles" // 麺類 🍜
  | "yakiniku" // 焼肉・グリル 🔥
  | "international" // 多国籍料理 🍕
  | "cafe" // カフェ・軽食 ☕
  | "izakaya" // 居酒屋・バー 🍷
  | "fastfood" // ファストフード 🍔
  | "general" // 一般レストラン 🍽️
  | "parking" // 駐車場 🚗
  | "toilet"; // トイレ 🚻

/**
 * マーカーカテゴリ設定
 */
export interface IcooonMarkerConfig {
  readonly category: IcooonMarkerCategory;
  readonly name: string;
  readonly iconPath: string;
  readonly iconSource: "ICOOON MONO";
  readonly iconUrl: string;
  readonly color: string; // 背景色
  readonly borderColor: string; // 枠線色
  readonly textColor: string; // 文字色
  readonly emoji: string; // フォールバック絵文字
  readonly accessibility: {
    readonly ariaLabel: string;
    readonly description: string;
    readonly contrast: string; // コントラスト比
  };
}

/**
 * アクセシビリティ要件
 */
export interface IcooonAccessibilityConfig {
  readonly minContrast: number; // 4.5:1 (WCAG 2.2 AA)
  readonly keyboardNavigable: boolean; // キーボードナビゲーション
  readonly screenReader: boolean; // スクリーンリーダー対応
  readonly colorBlindSafe: boolean; // 色覚多様性対応
  readonly focusVisible: boolean; // フォーカス可視化
}

/**
 * デザインシステム統一設定
 */
export interface IcooonDesignSystem {
  readonly source: "ICOOON MONO";
  readonly version: string;
  readonly license: "商用無料";
  readonly format: "SVG";
  readonly size: "512px";
  readonly consistency: "完全統一";
  readonly brand: "佐渡島オリジナル";
}

/**
 * マーカー統計情報
 */
export interface IcooonMarkerStats {
  readonly totalCategories: number;
  readonly restaurantCategories: number;
  readonly facilityCategories: number;
  readonly iconSource: string;
  readonly designConsistency: string;
  readonly accessibility: string;
  readonly licensing: string;
}
