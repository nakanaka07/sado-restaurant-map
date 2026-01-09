/**
 * @fileoverview Main FilterPanel component
 * メインのフィルターパネルコンポーネント（分割後）
 * Week 2 P2-3: CSS Modules導入
 */

import type { MapPointType } from "@/types";
import { memo } from "react";
import { CuisineFilter } from "./CuisineFilter";
import { DistrictFilter } from "./DistrictFilter";
import { FeatureFilter } from "./FeatureFilter";
import styles from "./FilterPanel.module.css";
import { MapLegend } from "./MapLegend";
import { PriceFilter } from "./PriceFilter";
import { SearchFilter } from "./SearchFilter";
import { useFilterState, type FilterHandlers } from "./useFilterState";

interface FilterPanelProps extends FilterHandlers {
  readonly loading?: boolean;
  readonly resultCount?: number;
  readonly stats?: {
    restaurants: number;
    parkings: number;
    toilets: number;
    total: number;
  };
}

export const FilterPanel = memo<FilterPanelProps>(function FilterPanel({
  loading = false,
  resultCount = 0,
  stats,
  ...handlers
}) {
  const filterState = useFilterState(handlers);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* ヘッダー */}
        <div className={styles.header}>
          {/* ヘッダー行 */}
          <div className={styles.headerRow}>
            <h2 className={styles.title}>🔍 フィルター</h2>
            <div aria-live="polite" className={styles.resultCount}>
              📊 {resultCount}件
            </div>
          </div>

          {/* 詳細統計情報 */}
          {stats && resultCount > 0 && (
            <div className={styles.statsContainer}>
              <span>🍽️ {stats.restaurants}</span>
              <span>🅿️ {stats.parkings}</span>
              <span>🚻 {stats.toilets}</span>
            </div>
          )}

          {/* 結果なしのメッセージ */}
          {resultCount === 0 && (
            <div className={styles.noResultsMessage}>
              条件に一致するポイントが見つかりませんでした
            </div>
          )}
        </div>

        {/* 検索フィルター */}
        <SearchFilter
          value={filterState.searchQuery}
          onChange={filterState.handleSearchChange}
          loading={loading}
        />

        {/* 料理ジャンルフィルター */}
        <CuisineFilter
          value={filterState.selectedCuisine}
          onChange={filterState.handleCuisineChange}
        />

        {/* 価格フィルター */}
        <PriceFilter
          value={filterState.selectedPrice}
          onChange={filterState.handlePriceChange}
        />

        {/* 評価フィルター */}
        <div className={styles.filterSection}>
          <label htmlFor="modern-rating" className={styles.filterLabel}>
            <span className={styles.labelText}>⭐ 評価</span>
          </label>
          <select
            id="modern-rating"
            value={filterState.selectedRating || ""}
            onChange={filterState.handleRatingChange}
            className={styles.select}
          >
            <option value="">すべての評価</option>
            <option value="4">4.0以上</option>
            <option value="3">3.0以上</option>
            <option value="2">2.0以上</option>
          </select>
        </div>

        {/* 営業中フィルター */}
        <div className={styles.filterSection}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filterState.openNow}
              onChange={filterState.handleOpenNowChange}
              className={styles.checkbox}
            />
            <span>🕐 営業中のみ表示</span>
          </label>
        </div>

        {/* 地域フィルター */}
        <DistrictFilter
          selectedDistricts={filterState.selectedDistricts}
          onToggle={filterState.handleDistrictToggle}
          isExpanded={filterState.isDistrictExpanded}
          onToggleExpanded={filterState.toggleDistrictExpanded}
        />

        {/* 特徴フィルター */}
        <FeatureFilter
          selectedFeatures={filterState.selectedFeatures}
          onToggle={filterState.handleFeatureToggle}
          isExpanded={filterState.isFeatureExpanded}
          onToggleExpanded={filterState.toggleFeatureExpanded}
        />

        {/* ポイントタイプフィルター */}
        <div className={styles.filterSection}>
          <div className={styles.sectionTitle}>📍 表示ポイント</div>
          <div className={styles.pointTypesContainer}>
            {(["restaurant", "parking", "toilet"] as MapPointType[]).map(
              pointType => (
                <label key={pointType} className={styles.checkboxLabelSmall}>
                  <input
                    type="checkbox"
                    checked={filterState.selectedPointTypes.includes(pointType)}
                    onChange={() =>
                      filterState.handlePointTypeToggle(pointType)
                    }
                    className={styles.checkboxSmall}
                  />
                  <span>
                    {pointType === "restaurant" && "🍽️ 飲食店"}
                    {pointType === "parking" && "🅿️ 駐車場"}
                    {pointType === "toilet" && "🚻 トイレ"}
                  </span>
                </label>
              )
            )}
          </div>
        </div>

        {/* ソート */}
        <div className={styles.filterSection}>
          <label htmlFor="modern-sort" className={styles.filterLabel}>
            <span className={styles.labelText}>📊 並び順</span>
          </label>
          <select
            id="modern-sort"
            value={filterState.selectedSort}
            onChange={filterState.handleSortChange}
            className={styles.select}
          >
            <option value="name">名前順</option>
            <option value="rating">評価順</option>
            <option value="distance">距離順</option>
          </select>
        </div>

        {/* リセットボタン */}
        <div className={styles.resetButtonContainer}>
          <button
            type="button"
            onClick={filterState.handleResetFilters}
            className={styles.resetButton}
            disabled={loading}
            aria-describedby="reset-help"
          >
            🔄 フィルターをリセット
          </button>
          <div id="reset-help" className={styles.srOnly}>
            すべてのフィルター設定をクリアします
          </div>
        </div>

        {/* マップ凡例 */}
        <MapLegend />
      </div>
    </div>
  );
});
