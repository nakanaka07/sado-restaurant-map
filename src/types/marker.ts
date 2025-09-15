/**
 * @fileoverview マーカー型定義
 */

// ==============================
// マーカー形状・サイズ型定義
// ==============================

/**
 * マーカーの形状
 */
export type MarkerShape = "circle" | "square" | "diamond" | "star" | "hexagon";

/**
 * マーカーのサイズ
 */
export type MarkerSize = "small" | "medium" | "standard" | "large";

/**
 * マーカーカテゴリ
 */
export type MarkerCategory =
  | "restaurant"
  | "parking"
  | "toilet"
  | "寿司"
  | "そば・うどん"
  | "中華"
  | "イタリアン"
  | "フレンチ"
  | "カフェ・喫茶店"
  | "バー・居酒屋"
  | "ファストフード"
  | "デザート・スイーツ"
  | "カレー・エスニック"
  | "ステーキ・洋食"
  | "弁当・テイクアウト"
  | "レストラン"
  | "その他";

/**
 * マーカーアクセシビリティ設定
 */
export interface MarkerAccessibilityConfig {
  readonly ariaLabel: string;
  readonly ariaDescription: string;
  readonly contrastRatio: number;
  readonly cvdFriendly: boolean; // 色覚多様性対応
  readonly keyboardNavigable: boolean;
  readonly role: string;
  readonly tabIndex: number;
}

/**
 * マーカーデザインシステム設定
 */
export interface MarkerDesignSystem {
  readonly category: MarkerCategory;
  readonly colorPrimary: string;
  readonly colorSecondary: string;
  readonly colorContrast: string;
  readonly shape: MarkerShape;
  readonly icon: string;
  readonly accessibility: MarkerAccessibilityConfig;
}
