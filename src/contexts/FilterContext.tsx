/**
 * @fileoverview Filter Context for Compound Components Pattern
 * React 19 Context最適化 + TypeScript 5.9 strict mode対応
 *
 * Week 2 P2-1: FilterContext + Compound Components実装
 * - Props Drilling解消
 * - 状態管理の一元化
 * - Compound Componentsパターンのサポート
 */

import type {
  CuisineType,
  MapPointType,
  PriceRange,
  SadoDistrict,
  SortOrder,
} from "@/types";
import { trackFilter } from "@/utils/analytics";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * フィルター状態の型定義
 */
export interface FilterState {
  readonly searchQuery: string;
  readonly selectedCuisine: CuisineType | "";
  readonly selectedPrice: PriceRange | "";
  readonly selectedDistricts: readonly SadoDistrict[];
  readonly selectedRating: number | undefined;
  readonly openNow: boolean;
  readonly selectedSort: SortOrder;
  readonly selectedFeatures: readonly string[];
  readonly selectedPointTypes: readonly MapPointType[];
  readonly isDistrictExpanded: boolean;
  readonly isFeatureExpanded: boolean;
}

/**
 * フィルターアクションの型定義
 */
export interface FilterActions {
  readonly setSearchQuery: (query: string) => void;
  readonly setCuisine: (cuisine: CuisineType | "") => void;
  readonly setPrice: (price: PriceRange | "") => void;
  readonly toggleDistrict: (district: SadoDistrict) => void;
  readonly setRating: (rating: number | undefined) => void;
  readonly setOpenNow: (openNow: boolean) => void;
  readonly setSort: (sort: SortOrder) => void;
  readonly toggleFeature: (feature: string) => void;
  readonly togglePointType: (pointType: MapPointType) => void;
  readonly resetFilters: () => void;
  readonly toggleDistrictExpanded: () => void;
  readonly toggleFeatureExpanded: () => void;
}

/**
 * 外部へのコールバック（親コンポーネントへの通知）
 */
export interface FilterCallbacks {
  readonly onCuisineChange?: (cuisine: CuisineType | "") => void;
  readonly onPriceChange?: (price: PriceRange | "") => void;
  readonly onDistrictChange?: (districts: SadoDistrict[]) => void;
  readonly onRatingChange?: (rating: number | undefined) => void;
  readonly onOpenNowChange?: (openNow: boolean) => void;
  readonly onSearchChange?: (search: string) => void;
  readonly onSortChange?: (sort: SortOrder) => void;
  readonly onFeatureChange?: (features: string[]) => void;
  readonly onPointTypeChange?: (pointTypes: MapPointType[]) => void;
  readonly onResetFilters?: () => void;
}

/**
 * FilterContextの完全な型
 */
export interface FilterContextValue extends FilterState, FilterActions {
  readonly loading: boolean;
  readonly resultCount: number;
  readonly stats: {
    readonly restaurants: number;
    readonly parkings: number;
    readonly toilets: number;
    readonly total: number;
  };
}

// ============================================================================
// Context
// ============================================================================

/**
 * FilterContext - React 19ではdefaultValueなしでも型安全
 */
const FilterContext = createContext<FilterContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

/**
 * 初期状態
 */
const INITIAL_FILTER_STATE: FilterState = {
  searchQuery: "",
  selectedCuisine: "",
  selectedPrice: "",
  selectedDistricts: [],
  selectedRating: undefined,
  openNow: false,
  selectedSort: "name",
  selectedFeatures: [],
  selectedPointTypes: ["restaurant", "parking", "toilet"],
  isDistrictExpanded: false,
  isFeatureExpanded: false,
};

/**
 * FilterProviderのProps
 */
export interface FilterProviderProps {
  readonly children: ReactNode;
  readonly loading?: boolean;
  readonly resultCount?: number;
  readonly stats?: {
    readonly restaurants: number;
    readonly parkings: number;
    readonly toilets: number;
    readonly total: number;
  };
  readonly callbacks?: FilterCallbacks;
  readonly initialState?: Partial<FilterState>;
}

/**
 * FilterProvider - フィルター状態を一元管理
 */
export function FilterProvider({
  children,
  loading = false,
  resultCount = 0,
  stats = { restaurants: 0, parkings: 0, toilets: 0, total: 0 },
  callbacks = {},
  initialState = {},
}: FilterProviderProps) {
  // State initialization with merged initial values
  const [searchQuery, setSearchQueryState] = useState(
    initialState.searchQuery ?? INITIAL_FILTER_STATE.searchQuery
  );
  const [selectedCuisine, setSelectedCuisineState] = useState<CuisineType | "">(
    initialState.selectedCuisine ?? INITIAL_FILTER_STATE.selectedCuisine
  );
  const [selectedPrice, setSelectedPriceState] = useState<PriceRange | "">(
    initialState.selectedPrice ?? INITIAL_FILTER_STATE.selectedPrice
  );
  const [selectedDistricts, setSelectedDistrictsState] = useState<
    readonly SadoDistrict[]
  >(initialState.selectedDistricts ?? INITIAL_FILTER_STATE.selectedDistricts);
  const [selectedRating, setSelectedRatingState] = useState<number | undefined>(
    initialState.selectedRating ?? INITIAL_FILTER_STATE.selectedRating
  );
  const [openNow, setOpenNowState] = useState(
    initialState.openNow ?? INITIAL_FILTER_STATE.openNow
  );
  const [selectedSort, setSelectedSortState] = useState<SortOrder>(
    initialState.selectedSort ?? INITIAL_FILTER_STATE.selectedSort
  );
  const [selectedFeatures, setSelectedFeaturesState] = useState<
    readonly string[]
  >(initialState.selectedFeatures ?? INITIAL_FILTER_STATE.selectedFeatures);
  const [selectedPointTypes, setSelectedPointTypesState] = useState<
    readonly MapPointType[]
  >(initialState.selectedPointTypes ?? INITIAL_FILTER_STATE.selectedPointTypes);
  const [isDistrictExpanded, setIsDistrictExpanded] = useState(
    initialState.isDistrictExpanded ?? INITIAL_FILTER_STATE.isDistrictExpanded
  );
  const [isFeatureExpanded, setIsFeatureExpanded] = useState(
    initialState.isFeatureExpanded ?? INITIAL_FILTER_STATE.isFeatureExpanded
  );

  // Action handlers with analytics tracking
  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      callbacks.onSearchChange?.(query);
    },
    [callbacks]
  );

  const setCuisine = useCallback(
    (cuisine: CuisineType | "") => {
      setSelectedCuisineState(cuisine);
      callbacks.onCuisineChange?.(cuisine);
      trackFilter("cuisine", cuisine);
    },
    [callbacks]
  );

  const setPrice = useCallback(
    (price: PriceRange | "") => {
      setSelectedPriceState(price);
      callbacks.onPriceChange?.(price);
      trackFilter("price", price);
    },
    [callbacks]
  );

  const toggleDistrict = useCallback(
    (district: SadoDistrict) => {
      setSelectedDistrictsState(prev => {
        const newDistricts = prev.includes(district)
          ? prev.filter(d => d !== district)
          : [...prev, district];
        callbacks.onDistrictChange?.([...newDistricts]);
        trackFilter("district", district);
        return newDistricts;
      });
    },
    [callbacks]
  );

  const setRating = useCallback(
    (rating: number | undefined) => {
      setSelectedRatingState(rating);
      callbacks.onRatingChange?.(rating);
      trackFilter("rating", rating?.toString() ?? "all");
    },
    [callbacks]
  );

  const setOpenNow = useCallback(
    (value: boolean) => {
      setOpenNowState(value);
      callbacks.onOpenNowChange?.(value);
      trackFilter("openNow", value.toString());
    },
    [callbacks]
  );

  const setSort = useCallback(
    (sort: SortOrder) => {
      setSelectedSortState(sort);
      callbacks.onSortChange?.(sort);
      trackFilter("sort", sort);
    },
    [callbacks]
  );

  const toggleFeature = useCallback(
    (feature: string) => {
      setSelectedFeaturesState(prev => {
        const newFeatures = prev.includes(feature)
          ? prev.filter(f => f !== feature)
          : [...prev, feature];
        callbacks.onFeatureChange?.([...newFeatures]);
        trackFilter("feature", feature);
        return newFeatures;
      });
    },
    [callbacks]
  );

  const togglePointType = useCallback(
    (pointType: MapPointType) => {
      setSelectedPointTypesState(prev => {
        const newPointTypes = prev.includes(pointType)
          ? prev.filter(pt => pt !== pointType)
          : [...prev, pointType];
        callbacks.onPointTypeChange?.([...newPointTypes]);
        trackFilter("pointType", pointType);
        return newPointTypes;
      });
    },
    [callbacks]
  );

  const resetFilters = useCallback(() => {
    setSearchQueryState(INITIAL_FILTER_STATE.searchQuery);
    setSelectedCuisineState(INITIAL_FILTER_STATE.selectedCuisine);
    setSelectedPriceState(INITIAL_FILTER_STATE.selectedPrice);
    setSelectedDistrictsState(INITIAL_FILTER_STATE.selectedDistricts);
    setSelectedRatingState(INITIAL_FILTER_STATE.selectedRating);
    setOpenNowState(INITIAL_FILTER_STATE.openNow);
    setSelectedSortState(INITIAL_FILTER_STATE.selectedSort);
    setSelectedFeaturesState(INITIAL_FILTER_STATE.selectedFeatures);
    setSelectedPointTypesState(INITIAL_FILTER_STATE.selectedPointTypes);
    callbacks.onResetFilters?.();
    trackFilter("reset", "all");
  }, [callbacks]);

  const toggleDistrictExpanded = useCallback(() => {
    setIsDistrictExpanded(prev => !prev);
  }, []);

  const toggleFeatureExpanded = useCallback(() => {
    setIsFeatureExpanded(prev => !prev);
  }, []);

  // Memoized context value
  const value = useMemo<FilterContextValue>(
    () => ({
      // State
      searchQuery,
      selectedCuisine,
      selectedPrice,
      selectedDistricts,
      selectedRating,
      openNow,
      selectedSort,
      selectedFeatures,
      selectedPointTypes,
      isDistrictExpanded,
      isFeatureExpanded,
      loading,
      resultCount,
      stats,

      // Actions
      setSearchQuery,
      setCuisine,
      setPrice,
      toggleDistrict,
      setRating,
      setOpenNow,
      setSort,
      toggleFeature,
      togglePointType,
      resetFilters,
      toggleDistrictExpanded,
      toggleFeatureExpanded,
    }),
    [
      searchQuery,
      selectedCuisine,
      selectedPrice,
      selectedDistricts,
      selectedRating,
      openNow,
      selectedSort,
      selectedFeatures,
      selectedPointTypes,
      isDistrictExpanded,
      isFeatureExpanded,
      loading,
      resultCount,
      stats,
      setSearchQuery,
      setCuisine,
      setPrice,
      toggleDistrict,
      setRating,
      setOpenNow,
      setSort,
      toggleFeature,
      togglePointType,
      resetFilters,
      toggleDistrictExpanded,
      toggleFeatureExpanded,
    ]
  );

  // React 19: <Context> as Provider (not <Context.Provider>)
  return <FilterContext value={value}>{children}</FilterContext>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * FilterContextを使用するカスタムフック
 * Provider外で使用された場合はエラーをスロー
 */
export function useFilterContext(): FilterContextValue {
  const context = useContext(FilterContext);

  if (context === null) {
    throw new Error(
      "useFilterContext must be used within a FilterProvider. " +
        "Wrap your component tree with <FilterProvider>."
    );
  }

  return context;
}

/**
 * FilterContextの存在確認用フック（optional usage）
 * Provider外で使用された場合はnullを返す
 */
export function useFilterContextOptional(): FilterContextValue | null {
  return useContext(FilterContext);
}

// ============================================================================
// Selector Hooks (Performance Optimization)
// ============================================================================

/**
 * 検索クエリのみ取得
 */
export function useFilterSearch() {
  const { searchQuery, setSearchQuery } = useFilterContext();
  return { searchQuery, setSearchQuery };
}

/**
 * 料理ジャンルフィルターのみ取得
 */
export function useFilterCuisine() {
  const { selectedCuisine, setCuisine } = useFilterContext();
  return { selectedCuisine, setCuisine };
}

/**
 * 価格フィルターのみ取得
 */
export function useFilterPrice() {
  const { selectedPrice, setPrice } = useFilterContext();
  return { selectedPrice, setPrice };
}

/**
 * 地域フィルターのみ取得
 */
export function useFilterDistricts() {
  const {
    selectedDistricts,
    toggleDistrict,
    isDistrictExpanded,
    toggleDistrictExpanded,
  } = useFilterContext();
  return {
    selectedDistricts,
    toggleDistrict,
    isDistrictExpanded,
    toggleDistrictExpanded,
  };
}

/**
 * 評価フィルターのみ取得
 */
export function useFilterRating() {
  const { selectedRating, setRating } = useFilterContext();
  return { selectedRating, setRating };
}

/**
 * 営業中フィルターのみ取得
 */
export function useFilterOpenNow() {
  const { openNow, setOpenNow } = useFilterContext();
  return { openNow, setOpenNow };
}

/**
 * ソート設定のみ取得
 */
export function useFilterSort() {
  const { selectedSort, setSort } = useFilterContext();
  return { selectedSort, setSort };
}

/**
 * 特徴フィルターのみ取得
 */
export function useFilterFeatures() {
  const {
    selectedFeatures,
    toggleFeature,
    isFeatureExpanded,
    toggleFeatureExpanded,
  } = useFilterContext();
  return {
    selectedFeatures,
    toggleFeature,
    isFeatureExpanded,
    toggleFeatureExpanded,
  };
}

/**
 * ポイントタイプフィルターのみ取得
 */
export function useFilterPointTypes() {
  const { selectedPointTypes, togglePointType } = useFilterContext();
  return { selectedPointTypes, togglePointType };
}

/**
 * フィルター統計のみ取得
 */
export function useFilterStats() {
  const { loading, resultCount, stats } = useFilterContext();
  return { loading, resultCount, stats };
}

/**
 * リセット機能のみ取得
 */
export function useFilterReset() {
  const { resetFilters, loading } = useFilterContext();
  return { resetFilters, loading };
}

// ============================================================================
// Export
// ============================================================================

export { FilterContext };
