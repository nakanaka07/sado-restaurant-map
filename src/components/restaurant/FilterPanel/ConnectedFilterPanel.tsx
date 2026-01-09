/**
 * @fileoverview Connected FilterPanel with Context Support
 * FilterContextから状態を取得するラッパーコンポーネント
 *
 * Week 2 P2-2: Context as Provider Migration
 * - Props Drillingの解消
 * - 後方互換性の維持（propsも引き続きサポート）
 */

import { useFilterContext } from "@/contexts/FilterContext";
import type { MapPointType, SadoDistrict } from "@/types";
import { memo, useCallback } from "react";
import { FilterPanel } from "./FilterPanel";

/**
 * ConnectedFilterPanel - FilterContextから自動的に値を取得
 *
 * 使用方法:
 * ```tsx
 * // FilterProvider内で使用（propsなしで動作）
 * <FilterProvider loading={loading} resultCount={count} stats={stats} callbacks={callbacks}>
 *   <ConnectedFilterPanel />
 * </FilterProvider>
 * ```
 */
export const ConnectedFilterPanel = memo(function ConnectedFilterPanel() {
  const {
    loading,
    resultCount,
    stats,
    setCuisine,
    setPrice,
    toggleDistrict,
    setRating,
    setOpenNow,
    setSearchQuery,
    setSort,
    toggleFeature,
    togglePointType,
    resetFilters,
    selectedDistricts,
    selectedFeatures,
    selectedPointTypes,
  } = useFilterContext();

  // 配列ベースのハンドラーをトグルベースに変換
  const handleDistrictFilter = useCallback(
    (districts: SadoDistrict[]) => {
      const currentSet = new Set(selectedDistricts);
      const newSet = new Set(districts);

      // 追加されたdistrict
      for (const district of newSet) {
        if (!currentSet.has(district)) {
          toggleDistrict(district);
        }
      }
      // 削除されたdistrict
      for (const district of currentSet) {
        if (!newSet.has(district)) {
          toggleDistrict(district);
        }
      }
    },
    [selectedDistricts, toggleDistrict]
  );

  const handleFeatureFilter = useCallback(
    (features: string[]) => {
      const currentSet = new Set(selectedFeatures);
      const newSet = new Set(features);

      for (const feature of newSet) {
        if (!currentSet.has(feature)) {
          toggleFeature(feature);
        }
      }
      for (const feature of currentSet) {
        if (!newSet.has(feature)) {
          toggleFeature(feature);
        }
      }
    },
    [selectedFeatures, toggleFeature]
  );

  const handlePointTypeFilter = useCallback(
    (pointTypes: MapPointType[]) => {
      const currentSet = new Set(selectedPointTypes);
      const newSet = new Set(pointTypes);

      for (const pointType of newSet) {
        if (!currentSet.has(pointType)) {
          togglePointType(pointType);
        }
      }
      for (const pointType of currentSet) {
        if (!newSet.has(pointType)) {
          togglePointType(pointType);
        }
      }
    },
    [selectedPointTypes, togglePointType]
  );

  return (
    <FilterPanel
      loading={loading}
      resultCount={resultCount}
      stats={stats}
      onCuisineFilter={setCuisine}
      onPriceFilter={setPrice}
      onDistrictFilter={handleDistrictFilter}
      onRatingFilter={setRating}
      onOpenNowFilter={setOpenNow}
      onSearchFilter={setSearchQuery}
      onSortChange={setSort}
      onFeatureFilter={handleFeatureFilter}
      onPointTypeFilter={handlePointTypeFilter}
      onResetFilters={resetFilters}
    />
  );
});

export default ConnectedFilterPanel;
