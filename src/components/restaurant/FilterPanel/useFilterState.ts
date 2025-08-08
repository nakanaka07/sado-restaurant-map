/**
 * @fileoverview FilterPanel state management hook
 * フィルターパネルの状態管理ロジック
 */

import { useState, useCallback } from "react";
import type {
  CuisineType,
  PriceRange,
  SadoDistrict,
  SortOrder,
  MapPointType,
} from "@/types";
import { trackSearch, trackFilter } from "@/utils/analytics";

export interface FilterState {
  searchQuery: string;
  selectedCuisine: CuisineType | "";
  selectedPrice: PriceRange | "";
  selectedDistricts: SadoDistrict[];
  selectedRating: number | undefined;
  openNow: boolean;
  selectedSort: SortOrder;
  selectedFeatures: string[];
  selectedPointTypes: MapPointType[];
}

export interface FilterActions {
  handleSearchChange: (value: string) => void;
  handleCuisineChange: (value: CuisineType | "") => void;
  handlePriceChange: (value: PriceRange | "") => void;
  handleDistrictToggle: (district: SadoDistrict) => void;
  handleRatingChange: (value: number | undefined) => void;
  handleOpenNowChange: (value: boolean) => void;
  handleSortChange: (value: SortOrder) => void;
  handleFeatureToggle: (feature: string) => void;
  handlePointTypeChange: (pointType: MapPointType) => void;
  handleResetFilters: () => void;
}

export interface FilterHandlers {
  onCuisineFilter?: (cuisine: CuisineType | "") => void;
  onPriceFilter?: (price: PriceRange | "") => void;
  onDistrictFilter?: (districts: SadoDistrict[]) => void;
  onRatingFilter?: (minRating: number | undefined) => void;
  onOpenNowFilter?: (openNow: boolean) => void;
  onSearchFilter?: (search: string) => void;
  onSortChange?: (sort: SortOrder) => void;
  onFeatureFilter?: (features: string[]) => void;
  onPointTypeFilter?: (pointTypes: MapPointType[]) => void;
  onResetFilters?: () => void;
}

export function useFilterState(
  handlers: FilterHandlers
): FilterState & FilterActions {
  // State
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

  // Actions
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (value.trim()) {
        trackSearch(value, 0); // 結果数は後で更新される
      }
      handlers.onSearchFilter?.(value);
    },
    [handlers]
  );

  const handleCuisineChange = useCallback(
    (value: CuisineType | "") => {
      setSelectedCuisine(value);
      trackFilter("cuisine", value);
      handlers.onCuisineFilter?.(value);
    },
    [handlers]
  );

  const handlePriceChange = useCallback(
    (value: PriceRange | "") => {
      setSelectedPrice(value);
      trackFilter("price", value);
      handlers.onPriceFilter?.(value);
    },
    [handlers]
  );

  const handleDistrictToggle = useCallback(
    (district: SadoDistrict) => {
      const newDistricts = selectedDistricts.includes(district)
        ? selectedDistricts.filter((d) => d !== district)
        : [...selectedDistricts, district];

      setSelectedDistricts(newDistricts);
      trackFilter("district", district);
      handlers.onDistrictFilter?.(newDistricts);
    },
    [selectedDistricts, handlers]
  );

  const handleRatingChange = useCallback(
    (value: number | undefined) => {
      setSelectedRating(value);
      trackFilter("rating", value?.toString() || "");
      handlers.onRatingFilter?.(value);
    },
    [handlers]
  );

  const handleOpenNowChange = useCallback(
    (value: boolean) => {
      setOpenNow(value);
      trackFilter("openNow", value.toString());
      handlers.onOpenNowFilter?.(value);
    },
    [handlers]
  );

  const handleSortChange = useCallback(
    (value: SortOrder) => {
      setSelectedSort(value);
      trackFilter("sort", value);
      handlers.onSortChange?.(value);
    },
    [handlers]
  );

  const handleFeatureToggle = useCallback(
    (feature: string) => {
      const newFeatures = selectedFeatures.includes(feature)
        ? selectedFeatures.filter((f) => f !== feature)
        : [...selectedFeatures, feature];

      setSelectedFeatures(newFeatures);
      trackFilter("feature", feature);
      handlers.onFeatureFilter?.(newFeatures);
    },
    [selectedFeatures, handlers]
  );

  const handlePointTypeChange = useCallback(
    (pointType: MapPointType) => {
      const newPointTypes = selectedPointTypes.includes(pointType)
        ? selectedPointTypes.filter((type) => type !== pointType)
        : [...selectedPointTypes, pointType];

      setSelectedPointTypes(newPointTypes);
      trackFilter("pointType", pointType);
      handlers.onPointTypeFilter?.(newPointTypes);
    },
    [selectedPointTypes, handlers]
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

    trackFilter("reset", "all");
    handlers.onResetFilters?.();
  }, [handlers]);

  return {
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

    // Actions
    handleSearchChange,
    handleCuisineChange,
    handlePriceChange,
    handleDistrictToggle,
    handleRatingChange,
    handleOpenNowChange,
    handleSortChange,
    handleFeatureToggle,
    handlePointTypeChange,
    handleResetFilters,
  };
}
