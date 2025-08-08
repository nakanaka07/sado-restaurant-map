/**
 * @fileoverview ModernFilterPanel state management hook
 * ModernFilterPanelの状態管理カスタムフック
 */

import { useState, useCallback } from "react";
import type {
  CuisineType,
  PriceRange,
  SadoDistrict,
  SortOrder,
  MapPointType,
} from "@/types";
import { trackFilter } from "@/utils/analytics";

export interface ModernFilterHandlers {
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

export interface ModernFilterState {
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
  isExpanded: boolean;

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
  toggleExpanded: () => void;
}

export function useModernFilterState(
  handlers: ModernFilterHandlers
): ModernFilterState {
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
  ]);
  const [isExpanded, setIsExpanded] = useState(false);

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
      setSelectedDistricts((prev) => {
        const newDistricts = prev.includes(district)
          ? prev.filter((d) => d !== district)
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
      setSelectedFeatures((prev) => {
        const newFeatures = prev.includes(feature)
          ? prev.filter((f) => f !== feature)
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
      setSelectedPointTypes((prev) => {
        const newPointTypes = prev.includes(pointType)
          ? prev.filter((pt) => pt !== pointType)
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
    setSelectedPointTypes(["restaurant"]);
    handlers.onResetFilters?.();
    trackFilter("reset", "all");
  }, [handlers]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
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
    isExpanded,

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
    toggleExpanded,
  };
}
