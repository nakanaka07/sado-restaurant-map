/**
 * 佐渡飲食店マップ - UI・コンポーネント関連型定義
 * React 19 + Accessibility対応
 */

import type { LatLngLiteral, SadoDistrict } from "./core.types";
import type { CuisineType, PriceRange } from "./restaurant.types";

// ==============================
// テーマ・表示関連
// ==============================

/** テーマ設定 */
export type Theme = "light" | "dark" | "auto";

/** 表示モード */
export type ViewMode = "map" | "list" | "grid";

/** ソート順 */
export type SortOrder = "name" | "rating" | "distance" | "priceRange";

/** UI状態 */
export type UIState = "idle" | "loading" | "error" | "success";

// ==============================
// フィルター・検索関連
// ==============================

/** 地図のフィルター設定 */
export interface MapFilters {
  readonly cuisineTypes: readonly CuisineType[];
  readonly priceRanges: readonly PriceRange[];
  readonly districts: readonly SadoDistrict[];
  readonly features: readonly string[];
  readonly searchQuery: string;
  readonly currentLocation?: LatLngLiteral;
  readonly radius?: number; // km
  readonly minRating?: number;
  readonly openNow?: boolean;
}

/** 検索結果設定 */
export interface SearchResultConfig {
  readonly sortOrder: SortOrder;
  readonly pageSize: number;
  readonly currentPage: number;
  readonly showTotal: boolean;
}

// ==============================
// コンポーネントProps関連
// ==============================

/** ベースコンポーネントProps */
export interface BaseComponentProps {
  readonly className?: string;
  readonly testId?: string;
  readonly "aria-label"?: string;
  readonly "aria-describedby"?: string;
}

/** ボタンコンポーネントProps */
export interface ButtonProps extends BaseComponentProps {
  readonly variant?: "primary" | "secondary" | "outline" | "ghost";
  readonly size?: "sm" | "md" | "lg";
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly icon?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
}

/** モーダルコンポーネントProps */
export interface ModalProps extends BaseComponentProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly children: React.ReactNode;
  readonly size?: "sm" | "md" | "lg" | "xl";
  readonly closeOnOverlayClick?: boolean;
  readonly closeOnEsc?: boolean;
}

/** フォームフィールドProps */
export interface FormFieldProps extends BaseComponentProps {
  readonly label?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly helper?: string;
}

// ==============================
// アクセシビリティ関連
// ==============================

/** スクリーンリーダー対応設定 */
export interface AccessibilityConfig {
  readonly enableScreenReader: boolean;
  readonly announceChanges: boolean;
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly focusVisible: boolean;
}

/** フォーカス管理設定 */
export interface FocusManagementConfig {
  readonly trapFocus: boolean;
  readonly restoreFocus: boolean;
  readonly initialFocus?: string; // セレクター
  readonly escapeDeactivates: boolean;
}

/** キーボードナビゲーション設定 */
export interface KeyboardNavConfig {
  readonly enableArrowKeys: boolean;
  readonly enableTabNavigation: boolean;
  readonly enableEnterSubmit: boolean;
  readonly enableEscapeClose: boolean;
  readonly customKeyBindings?: Record<string, () => void>;
}

// ==============================
// アニメーション・トランジション関連
// ==============================

/** アニメーション設定 */
export interface AnimationConfig {
  readonly duration: number; // ミリ秒
  readonly easing: string;
  readonly delay?: number;
  readonly fillMode?: "none" | "forwards" | "backwards" | "both";
}

/** トランジション設定 */
export interface TransitionConfig {
  readonly property: string;
  readonly duration: number;
  readonly timing: string;
  readonly delay?: number;
}

/** View Transitions API 設定 */
export interface ViewTransitionConfig {
  readonly name?: string;
  readonly duration?: number;
  readonly easing?: string;
  readonly types?: readonly string[];
}

// ==============================
// レスポンシブ・メディアクエリ関連
// ==============================

/** ブレークポイント設定 */
export interface BreakpointConfig {
  readonly xs: number; // 0px
  readonly sm: number; // 576px
  readonly md: number; // 768px
  readonly lg: number; // 992px
  readonly xl: number; // 1200px
  readonly xxl: number; // 1400px
}

/** レスポンシブ設定 */
export interface ResponsiveConfig<T> {
  readonly xs?: T;
  readonly sm?: T;
  readonly md?: T;
  readonly lg?: T;
  readonly xl?: T;
  readonly xxl?: T;
}

// ==============================
// 通知・トースト関連
// ==============================

/** 通知タイプ */
export type NotificationType = "info" | "success" | "warning" | "error";

/** 通知設定 */
export interface NotificationConfig {
  readonly type: NotificationType;
  readonly title?: string;
  readonly message: string;
  readonly duration?: number;
  readonly dismissible?: boolean;
  readonly action?: {
    readonly label: string;
    readonly handler: () => void;
  };
}
