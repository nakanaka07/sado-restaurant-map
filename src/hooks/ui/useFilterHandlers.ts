/**
 * フィルターハンドラーカスタムフック
 * App.tsx内の9種類のフィルター処理を統合
 */

import type {
  CuisineType,
  ExtendedMapFilters,
  MapPointType,
  PriceRange,
  SadoDistrict,
} from "@/types";
import {
  validateCuisineType,
  validateDistricts,
  validateFeatures,
  validatePriceRange,
  validateSearchQuery,
} from "@/utils/validation/filterValidation";
import { useCallback } from "react";

interface UseFilterHandlersProps {
  filters: ExtendedMapFilters;
  updateFilters: (partial: Partial<ExtendedMapFilters>) => void;
  onError: (error: string) => void;
}

interface FilterHandlers {
  handleCuisineFilter: (cuisine: CuisineType | "") => void;
  handlePriceFilter: (price: PriceRange | "") => void;
  handleDistrictFilter: (districts: SadoDistrict[]) => void;
  handleRatingFilter: (minRating: number | undefined) => void;
  handleOpenNowFilter: (openNow: boolean) => void;
  handleSearchFilter: (search: string) => void;
  handleFeatureFilter: (features: string[]) => void;
  handlePointTypeFilter: (pointTypes: MapPointType[]) => void;
  handleResetFilters: () => void;
}

/**
 * フィルター処理を統合管理するカスタムフック
 */
export function useFilterHandlers({
  filters,
  updateFilters,
  onError,
}: UseFilterHandlersProps): FilterHandlers {
  // 汎用エラーハンドラ
  const handleFilterError = useCallback(
    (error: unknown, context: string) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (import.meta.env.DEV) {
        console.error(`${context}エラー:`, errorMessage);
      }
      onError(`${context}中にエラーが発生しました`);
    },
    [onError]
  );

  // 料理タイプフィルター
  const handleCuisineFilter = useCallback(
    (cuisine: CuisineType | "") => {
      try {
        const validation = validateCuisineType(cuisine);
        if (!validation.isValid) {
          if (import.meta.env.DEV) {
            console.warn(validation.error);
          }
          return;
        }
        updateFilters({
          cuisineTypes: validation.value ? [validation.value] : [],
        });
      } catch (error) {
        handleFilterError(error, "料理タイプフィルター");
      }
    },
    [updateFilters, handleFilterError]
  );

  // 価格フィルター
  const handlePriceFilter = useCallback(
    (price: PriceRange | "") => {
      try {
        const validation = validatePriceRange(price);
        if (!validation.isValid) {
          if (import.meta.env.DEV) {
            console.warn(validation.error);
          }
          return;
        }
        updateFilters({
          priceRanges: validation.value ? [validation.value] : [],
        });
      } catch (error) {
        handleFilterError(error, "価格フィルター");
      }
    },
    [updateFilters, handleFilterError]
  );

  // 地区フィルター
  const handleDistrictFilter = useCallback(
    (districts: SadoDistrict[]) => {
      try {
        const validation = validateDistricts(districts);
        if (!validation.isValid) {
          if (import.meta.env.DEV) {
            console.warn(validation.error);
          }
          if (validation.error) {
            onError(validation.error);
          }
          return;
        }
        updateFilters({ districts: validation.value });
      } catch (error) {
        handleFilterError(error, "地区フィルター");
      }
    },
    [updateFilters, handleFilterError, onError]
  );

  // 評価フィルター
  const handleRatingFilter = useCallback(
    (minRating: number | undefined) => {
      try {
        if (typeof minRating === "number") {
          updateFilters({ minRating });
        } else {
          // minRatingを除外したフィルターでリセット
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { minRating: _removed, ...filtersWithoutRating } = filters;
          updateFilters(filtersWithoutRating);
        }
      } catch (error) {
        handleFilterError(error, "評価フィルター");
      }
    },
    [filters, updateFilters, handleFilterError]
  );

  // 営業中フィルター
  const handleOpenNowFilter = useCallback(
    (openNow: boolean) => {
      try {
        updateFilters({ openNow });
      } catch (error) {
        handleFilterError(error, "営業中フィルター");
      }
    },
    [updateFilters, handleFilterError]
  );

  // 検索フィルター
  const handleSearchFilter = useCallback(
    (search: string) => {
      try {
        const validation = validateSearchQuery(search);
        if (!validation.isValid) {
          if (import.meta.env.DEV) {
            console.warn(validation.error);
          }
          if (validation.error) {
            onError(validation.error);
          }
          return;
        }
        updateFilters({ searchQuery: validation.value });
      } catch (error) {
        handleFilterError(error, "検索フィルター");
      }
    },
    [updateFilters, handleFilterError, onError]
  );

  // 特徴フィルター
  const handleFeatureFilter = useCallback(
    (features: string[]) => {
      try {
        const validation = validateFeatures(features);
        if (!validation.isValid) {
          if (import.meta.env.DEV) {
            console.warn(validation.error);
          }
          if (validation.error) {
            onError(validation.error);
          }
          return;
        }
        updateFilters({ features: validation.value });
      } catch (error) {
        handleFilterError(error, "特徴フィルター");
      }
    },
    [updateFilters, handleFilterError, onError]
  );

  // ポイントタイプフィルター
  const handlePointTypeFilter = useCallback(
    (pointTypes: MapPointType[]) => {
      try {
        updateFilters({ pointTypes });
      } catch (error) {
        handleFilterError(error, "ポイントタイプフィルター");
      }
    },
    [updateFilters, handleFilterError]
  );

  // フィルターリセット
  const handleResetFilters = useCallback(() => {
    try {
      const defaultPointTypes: MapPointType[] = [
        "restaurant",
        "parking",
        "toilet",
      ];
      updateFilters({
        cuisineTypes: [] as CuisineType[],
        priceRanges: [] as PriceRange[],
        districts: [] as SadoDistrict[],
        features: [] as string[],
        searchQuery: "",
        openNow: false,
        pointTypes: defaultPointTypes,
      });
      // エラーもクリア
      onError("");
    } catch (error) {
      handleFilterError(error, "フィルターリセット");
    }
  }, [updateFilters, handleFilterError, onError]);

  return {
    handleCuisineFilter,
    handlePriceFilter,
    handleDistrictFilter,
    handleRatingFilter,
    handleOpenNowFilter,
    handleSearchFilter,
    handleFeatureFilter,
    handlePointTypeFilter,
    handleResetFilters,
  };
}
