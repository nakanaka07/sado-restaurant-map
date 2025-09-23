/**
 * @fileoverview FilterPanel state management hook
 * FilterPanelの状態管理カスタムフック
 */

import type {
  CuisineType,
  MapPointType,
  PriceRange,
  SadoDistrict,
  SortOrder,
} from "@/types";
import { trackFilter } from "@/utils/analytics";
import { useCallback, useState } from "react";

/**
 * フィルターイベントハンドラーの型定義
 * 各フィルター操作の型安全性を保証
 */
export interface FilterHandlers {
  readonly onCuisineFilter?: (cuisine: CuisineType | "") => void;
  readonly onPriceFilter?: (price: PriceRange | "") => void;
  readonly onDistrictFilter?: (districts: SadoDistrict[]) => void;
  readonly onRatingFilter?: (minRating: number | undefined) => void;
  readonly onOpenNowFilter?: (openNow: boolean) => void;
  readonly onSearchFilter?: (search: string) => void;
  readonly onSortChange?: (sort: SortOrder) => void;
  readonly onFeatureFilter?: (features: string[]) => void;
  readonly onPointTypeFilter?: (pointTypes: MapPointType[]) => void;
  readonly onResetFilters?: () => void;
}

/**
 * フィルター状態の型定義
 * immutableな配列とオプショナルチェーンを活用
 */
export interface FilterState {
  // Filter states
  searchQuery: string;
  selectedCuisine: CuisineType | "";
  selectedPrice: PriceRange | "";
  selectedDistricts: SadoDistrict[];
  selectedRating: number | undefined;
  openNow: boolean;
  selectedSort: SortOrder;
  selectedFeatures: string[];
  selectedPointTypes: MapPointType[];
  isDistrictExpanded: boolean;
  isFeatureExpanded: boolean;

  // Action handlers
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCuisineChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handlePriceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleDistrictToggle: (district: SadoDistrict) => void;
  handleRatingChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleOpenNowChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleFeatureToggle: (feature: string) => void;
  handlePointTypeToggle: (pointType: MapPointType) => void;
  handleResetFilters: () => void;
  toggleDistrictExpanded: () => void;
  toggleFeatureExpanded: () => void;
}

export function useFilterState(handlers: FilterHandlers): FilterState {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | "">("");
  const [selectedPrice, setSelectedPrice] = useState<PriceRange | "">("");
  const [selectedDistricts, setSelectedDistricts] = useState<SadoDistrict[]>(
    []
  );
  const [selectedRating, setSelectedRating] = useState<number | undefined>(
    undefined
  );
  const [openNow, setOpenNow] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOrder>("name");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedPointTypes, setSelectedPointTypes] = useState<MapPointType[]>([
    "restaurant",
    "parking",
    "toilet",
  ]);
  const [isDistrictExpanded, setIsDistrictExpanded] = useState(false);
  const [isFeatureExpanded, setIsFeatureExpanded] = useState(false);

  // Event handlers
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      handlers.onSearchFilter?.(value);
    },
    [handlers]
  );

  const handleCuisineChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as CuisineType | "";
      setSelectedCuisine(value);
      handlers.onCuisineFilter?.(value);
      trackFilter("cuisine", value);
    },
    [handlers]
  );

  const handlePriceChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as PriceRange | "";
      setSelectedPrice(value);
      handlers.onPriceFilter?.(value);
      trackFilter("price", value);
    },
    [handlers]
  );

  const handleDistrictToggle = useCallback(
    (district: SadoDistrict) => {
      setSelectedDistricts(prev => {
        const newDistricts = prev.includes(district)
          ? prev.filter(d => d !== district)
          : [...prev, district];
        handlers.onDistrictFilter?.(newDistricts);
        trackFilter("district", district);
        return newDistricts;
      });
    },
    [handlers]
  );

  const handleRatingChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value ? Number(e.target.value) : undefined;
      setSelectedRating(value);
      handlers.onRatingFilter?.(value);
      trackFilter("rating", value?.toString() || "all");
    },
    [handlers]
  );

  const handleOpenNowChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setOpenNow(checked);
      handlers.onOpenNowFilter?.(checked);
      trackFilter("openNow", checked.toString());
    },
    [handlers]
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as SortOrder;
      setSelectedSort(value);
      handlers.onSortChange?.(value);
      trackFilter("sort", value);
    },
    [handlers]
  );

  const handleFeatureToggle = useCallback(
    (feature: string) => {
      setSelectedFeatures(prev => {
        const newFeatures = prev.includes(feature)
          ? prev.filter(f => f !== feature)
          : [...prev, feature];
        handlers.onFeatureFilter?.(newFeatures);
        trackFilter("feature", feature);
        return newFeatures;
      });
    },
    [handlers]
  );

  const handlePointTypeToggle = useCallback(
    (pointType: MapPointType) => {
      setSelectedPointTypes(prev => {
        const newPointTypes = prev.includes(pointType)
          ? prev.filter(pt => pt !== pointType)
          : [...prev, pointType];
        handlers.onPointTypeFilter?.(newPointTypes);
        trackFilter("pointType", pointType);
        return newPointTypes;
      });
    },
    [handlers]
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCuisine("");
    setSelectedPrice("");
    setSelectedDistricts([]);
    setSelectedRating(undefined);
    setOpenNow(false);
    setSelectedSort("name");
    setSelectedFeatures([]);
    setSelectedPointTypes(["restaurant", "parking", "toilet"]);
    handlers.onResetFilters?.();
    trackFilter("reset", "all");
  }, [handlers]);

  const toggleDistrictExpanded = useCallback(() => {
    setIsDistrictExpanded(prev => !prev);
  }, []);

  const toggleFeatureExpanded = useCallback(() => {
    setIsFeatureExpanded(prev => !prev);
  }, []);

  return {
    // States
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

    // Handlers
    handleSearchChange,
    handleCuisineChange,
    handlePriceChange,
    handleDistrictToggle,
    handleRatingChange,
    handleOpenNowChange,
    handleSortChange,
    handleFeatureToggle,
    handlePointTypeToggle,
    handleResetFilters,
    toggleDistrictExpanded,
    toggleFeatureExpanded,
  };
}
