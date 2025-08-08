/**
 * @fileoverview Main FilterPanel component
 * メインフィルターパネルコンポーネント（分割後）
 */

import type { SadoDistrict, SortOrder, MapPointType } from "@/types";
import { useFilterState, type FilterHandlers } from "./useFilterState";
import { SearchFilter } from "./SearchFilter";
import { CuisineFilter } from "./CuisineFilter";
import { PriceFilter } from "./PriceFilter";
import { DistrictFilter } from "./DistrictFilter";
import { FilterChips } from "./FilterChips";

interface FilterPanelProps extends FilterHandlers {
  loading?: boolean;
  resultCount?: number;
}

export function FilterPanel({
  loading = false,
  resultCount = 0,
  ...handlers
}: FilterPanelProps) {
  const filterState = useFilterState(handlers);

  const handleClearSearch = () => filterState.handleSearchChange("");
  const handleClearCuisine = () => filterState.handleCuisineChange("");
  const handleClearPrice = () => filterState.handlePriceChange("");
  const handleClearDistrict = (district: SadoDistrict) =>
    filterState.handleDistrictToggle(district);
  const handleClearRating = () => filterState.handleRatingChange(undefined);
  const handleClearOpenNow = () => filterState.handleOpenNowChange(false);
  const handleClearFeature = (feature: string) =>
    filterState.handleFeatureToggle(feature);
  const handleClearPointType = (pointType: MapPointType) =>
    filterState.handlePointTypeChange(pointType);

  return (
    <div className="filter-panel" role="region" aria-label="フィルター設定">
      <div className="filter-header">
        <h2 className="filter-title">フィルター</h2>
        <button
          type="button"
          onClick={filterState.handleResetFilters}
          className="reset-button"
          disabled={loading}
          aria-label="すべてのフィルターをリセット"
        >
          リセット
        </button>
      </div>

      <FilterChips
        searchQuery={filterState.searchQuery}
        selectedCuisine={filterState.selectedCuisine}
        selectedPrice={filterState.selectedPrice}
        selectedDistricts={filterState.selectedDistricts}
        selectedRating={filterState.selectedRating}
        openNow={filterState.openNow}
        selectedFeatures={filterState.selectedFeatures}
        selectedPointTypes={filterState.selectedPointTypes}
        onClearSearch={handleClearSearch}
        onClearCuisine={handleClearCuisine}
        onClearPrice={handleClearPrice}
        onClearDistrict={handleClearDistrict}
        onClearRating={handleClearRating}
        onClearOpenNow={handleClearOpenNow}
        onClearFeature={handleClearFeature}
        onClearPointType={handleClearPointType}
        onClearAll={filterState.handleResetFilters}
        resultCount={resultCount}
      />

      <div className="filter-content">
        <SearchFilter
          value={filterState.searchQuery}
          onChange={filterState.handleSearchChange}
          loading={loading}
        />

        <CuisineFilter
          value={filterState.selectedCuisine}
          onChange={filterState.handleCuisineChange}
        />

        <PriceFilter
          value={filterState.selectedPrice}
          onChange={filterState.handlePriceChange}
        />

        <DistrictFilter
          selectedDistricts={filterState.selectedDistricts}
          onToggle={filterState.handleDistrictToggle}
        />

        {/* 評価フィルター */}
        <div className="filter-rating">
          <label htmlFor="rating-select" className="filter-label">
            評価
          </label>
          <select
            id="rating-select"
            value={filterState.selectedRating || ""}
            onChange={(e) =>
              filterState.handleRatingChange(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="rating-select"
          >
            <option value="">すべての評価</option>
            <option value="4">4.0以上</option>
            <option value="3">3.0以上</option>
            <option value="2">2.0以上</option>
          </select>
        </div>

        {/* 営業中フィルター */}
        <div className="filter-open-now">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filterState.openNow}
              onChange={(e) =>
                filterState.handleOpenNowChange(e.target.checked)
              }
              className="open-now-checkbox"
            />
            <span>営業中のみ表示</span>
          </label>
        </div>

        {/* ソート */}
        <div className="filter-sort">
          <label htmlFor="sort-select" className="filter-label">
            並び順
          </label>
          <select
            id="sort-select"
            value={filterState.selectedSort}
            onChange={(e) =>
              filterState.handleSortChange(e.target.value as SortOrder)
            }
            className="sort-select"
          >
            <option value="name">名前順</option>
            <option value="rating">評価順</option>
            <option value="distance">距離順</option>
          </select>
        </div>
      </div>
    </div>
  );
}
