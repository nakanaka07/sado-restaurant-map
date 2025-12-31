/**
 * @fileoverview Modal Filter Type Definitions
 * モーダルフィルターの型定義 - TypeScript 5.7 enum安全性パターン対応
 * React 19 useActionState と統合したモーダルフィルター状態管理
 */

import type {
  CuisineType,
  ExtendedMapFilters,
  MapPointType,
  PriceRange,
  SadoDistrict,
  SortOrder,
} from "./index";

/**
 * モーダル状態の列挙型 - TypeScript 5.7 enum安全性パターン
 */
export enum ModalState {
  CLOSED = "closed",
  OPENING = "opening",
  OPEN = "open",
  CLOSING = "closing",
}

/**
 * モーダルフィルター表示モードの列挙型
 */
export enum FilterDisplayMode {
  COMPACT = "compact",
  FULL = "full",
  MINIMAL = "minimal",
}

/**
 * フィルターアクションタイプの列挙型
 */
export enum FilterActionType {
  TOGGLE_MODAL = "TOGGLE_MODAL",
  OPEN_MODAL = "OPEN_MODAL",
  CLOSE_MODAL = "CLOSE_MODAL",
  UPDATE_FILTERS = "UPDATE_FILTERS",
  RESET_FILTERS = "RESET_FILTERS",
  SET_DISPLAY_MODE = "SET_DISPLAY_MODE",
  INCREMENT_ACTIVE_COUNT = "INCREMENT_ACTIVE_COUNT",
  DECREMENT_ACTIVE_COUNT = "DECREMENT_ACTIVE_COUNT",
}

/**
 * モーダルフィルター状態インターフェース
 */
export interface ModalFilterState {
  readonly isOpen: boolean;
  readonly modalState: ModalState;
  readonly displayMode: FilterDisplayMode;
  readonly activeFilterCount: number;
  readonly filters: ExtendedMapFilters;
  readonly lastUpdated: Date;
  readonly isAnimating: boolean;
}

/**
 * フィルターアクション定義
 */
export type FilterAction =
  | { type: FilterActionType.TOGGLE_MODAL }
  | { type: FilterActionType.OPEN_MODAL }
  | { type: FilterActionType.CLOSE_MODAL }
  | {
      type: FilterActionType.UPDATE_FILTERS;
      payload: Partial<ExtendedMapFilters>;
    }
  | { type: FilterActionType.RESET_FILTERS }
  | {
      type: FilterActionType.SET_DISPLAY_MODE;
      payload: FilterDisplayMode;
    }
  | { type: FilterActionType.INCREMENT_ACTIVE_COUNT }
  | { type: FilterActionType.DECREMENT_ACTIVE_COUNT };

/**
 * モーダルフィルターフック戻り値
 */
export interface UseModalFilterResult {
  // State
  readonly state: ModalFilterState;
  readonly isOpen: boolean;
  readonly modalState: ModalState;
  readonly displayMode: FilterDisplayMode;
  readonly activeFilterCount: number;
  readonly filters: ExtendedMapFilters;

  // Actions
  readonly toggleModal: () => void;
  readonly openModal: () => void;
  readonly closeModal: () => void;
  readonly updateFilters: (filters: Partial<ExtendedMapFilters>) => void;
  readonly resetFilters: () => void;
  readonly setDisplayMode: (mode: FilterDisplayMode) => void;
}

/**
 * トリガーボタンProps
 */
export interface FilterTriggerButtonProps {
  readonly onClick: () => void;
  readonly activeCount: number;
  readonly isLoading?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly "aria-label"?: string;
}

/**
 * モーダルフィルタープロップス
 * React 19: refをpropsとして直接受け取る（forwardRef不要）
 */
export interface FilterModalProps {
  readonly ref?: React.Ref<HTMLDialogElement>;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onFiltersChange: (
    filters: Partial<ExtendedMapFilters>
  ) => Promise<void>;
  readonly children: React.ReactNode;
  readonly displayMode?: FilterDisplayMode;
  readonly className?: string;
}

/**
 * コンパクトモーダルフィルタープロップス
 * FilterPanelと互換性のあるプロップス設計
 */
export interface CompactModalFilterProps {
  // 基本情報
  readonly loading?: boolean;
  readonly resultCount?: number;
  readonly stats?: {
    restaurants: number;
    parkings: number;
    toilets: number;
    total: number;
  };

  // FilterPanelと同じハンドラー定義
  readonly onCuisineFilter?: (cuisine: CuisineType | "") => void;
  readonly onPriceFilter?: (price: PriceRange | "") => void;
  readonly onDistrictFilter?: (districts: SadoDistrict[]) => void; // 配列に修正
  readonly onRatingFilter?: (minRating: number | undefined) => void;
  readonly onOpenNowFilter?: (openNow: boolean) => void;
  readonly onSearchFilter?: (searchQuery: string) => void;
  readonly onFeatureFilter?: (features: string[]) => void;
  readonly onPointTypeFilter?: (pointTypes: MapPointType[]) => void;
  readonly onSortChange?: (sortOrder: SortOrder) => void;
  readonly onResetFilters?: () => void;

  // Modal専用
  readonly initialFilters?: Partial<ExtendedMapFilters>;
  readonly onFiltersChange?: (filters: ExtendedMapFilters) => Promise<void>;
  readonly className?: string;
  readonly "data-testid"?: string;
}

/**
 * 型ガード関数: 有効なモーダル状態かチェック
 */
export function isValidModalState(state: unknown): state is ModalState {
  return (
    typeof state === "string" &&
    Object.values(ModalState).includes(state as ModalState)
  );
}

/**
 * 型ガード関数: 有効なフィルター状態かチェック
 */
export function isValidFilterState(state: unknown): state is ModalFilterState {
  return (
    typeof state === "object" &&
    state !== null &&
    "isOpen" in state &&
    "modalState" in state &&
    "activeFilterCount" in state &&
    "filters" in state &&
    typeof (state as ModalFilterState).isOpen === "boolean" &&
    isValidModalState((state as ModalFilterState).modalState) &&
    typeof (state as ModalFilterState).activeFilterCount === "number" &&
    (state as ModalFilterState).filters !== null
  );
}

/**
 * 型ガード関数: 有効なフィルターアクションかチェック
 */
export function isValidFilterAction(action: unknown): action is FilterAction {
  return (
    typeof action === "object" &&
    action !== null &&
    "type" in action &&
    Object.values(FilterActionType).includes((action as FilterAction).type)
  );
}

/**
 * アクティブフィルター数を計算するヘルパー関数
 */
export function countActiveFilters(filters: ExtendedMapFilters): number {
  let count = 0;

  // 検索クエリ
  if (filters.searchQuery?.trim()) count++;

  // 配列系フィルター
  if (filters.cuisineTypes?.length) count += filters.cuisineTypes.length;
  if (filters.priceRanges?.length) count += filters.priceRanges.length;
  if (filters.districts?.length) count += filters.districts.length;
  if (filters.features?.length) count += filters.features.length;
  if (filters.parkingFeatures?.length) count += filters.parkingFeatures.length;
  if (filters.toiletFeatures?.length) count += filters.toiletFeatures.length;

  // ポイントタイプ（デフォルト以外の場合のみカウント）
  const defaultPointTypes = ["restaurant", "parking", "toilet"];
  if (
    filters.pointTypes?.length &&
    filters.pointTypes.length !== defaultPointTypes.length
  ) {
    count++;
  }

  return count;
}

/**
 * 初期モーダルフィルター状態
 */
export const INITIAL_MODAL_FILTER_STATE: ModalFilterState = {
  isOpen: false,
  modalState: ModalState.CLOSED,
  displayMode: FilterDisplayMode.COMPACT,
  activeFilterCount: 0,
  filters: {
    cuisineTypes: [],
    priceRanges: [],
    districts: [],
    features: [],
    searchQuery: "",
    pointTypes: ["restaurant", "parking", "toilet"],
    parkingFeatures: [],
    toiletFeatures: [],
  },
  lastUpdated: new Date(),
  isAnimating: false,
} as const;
