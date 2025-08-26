/**
 * @fileoverview Main FilterPanel component
 * メインのフィルターパネルコンポーネント（分割後）
 */

import type { MapPointType } from "@/types";
import { memo } from "react";
import { CuisineFilter } from "./CuisineFilter";
import { DistrictFilter } from "./DistrictFilter";
import { FeatureFilter } from "./FeatureFilter";
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
    <>
      <style>
        {`
          .filter-section {
            margin-bottom: 16px;
          }
          .filter-label {
            display: block;
            margin-bottom: 6px;
          }
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
        `}
      </style>

      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          width: "320px",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ padding: "20px" }}>
          {/* ヘッダー */}
          <div
            style={{
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "2px solid #f3f4f6",
            }}
          >
            {/* ヘッダー行 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                🔍 フィルター
              </h2>
              <div
                aria-live="polite"
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  fontWeight: "600",
                }}
              >
                📊 {resultCount}件
              </div>
            </div>

            {/* 詳細統計情報 */}
            {stats && resultCount > 0 && (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  fontWeight: "500",
                  padding: "8px 12px",
                  backgroundColor: "var(--color-background-secondary, #f8f9fa)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border-light, #e9ecef)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span>🍽️ {stats.restaurants}</span>
                <span>🅿️ {stats.parkings}</span>
                <span>🚻 {stats.toilets}</span>
              </div>
            )}

            {/* 結果なしのメッセージ */}
            {resultCount === 0 && (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted, #6c757d)",
                  fontStyle: "italic",
                  padding: "8px 12px",
                  backgroundColor: "var(--color-background-secondary, #f8f9fa)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border-light, #e9ecef)",
                }}
              >
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
          <div className="filter-section">
            <label htmlFor="modern-rating" className="filter-label">
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--color-text-primary)",
                }}
              >
                ⭐ 評価
              </span>
            </label>
            <select
              id="modern-rating"
              value={filterState.selectedRating || ""}
              onChange={filterState.handleRatingChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "#fff",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">すべての評価</option>
              <option value="4">4.0以上</option>
              <option value="3">3.0以上</option>
              <option value="2">2.0以上</option>
            </select>
          </div>

          {/* 営業中フィルター */}
          <div className="filter-section">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--color-text-primary)",
              }}
            >
              <input
                type="checkbox"
                checked={filterState.openNow}
                onChange={filterState.handleOpenNowChange}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "#3b82f6",
                }}
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
          <div className="filter-section">
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--color-text-primary)",
                marginBottom: "8px",
              }}
            >
              📍 表示ポイント
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(["restaurant", "parking", "toilet"] as MapPointType[]).map(
                (pointType) => (
                  <label
                    key={pointType}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filterState.selectedPointTypes.includes(
                        pointType
                      )}
                      onChange={() =>
                        filterState.handlePointTypeToggle(pointType)
                      }
                      style={{
                        width: "16px",
                        height: "16px",
                        accentColor: "#3b82f6",
                      }}
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
          <div className="filter-section">
            <label htmlFor="modern-sort" className="filter-label">
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--color-text-primary)",
                }}
              >
                📊 並び順
              </span>
            </label>
            <select
              id="modern-sort"
              value={filterState.selectedSort}
              onChange={filterState.handleSortChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "#fff",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="name">名前順</option>
              <option value="rating">評価順</option>
              <option value="distance">距離順</option>
            </select>
          </div>

          {/* リセットボタン */}
          <div style={{ marginTop: "20px", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={filterState.handleResetFilters}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ef4444";
              }}
              disabled={loading}
              aria-describedby="reset-help"
            >
              🔄 フィルターをリセット
            </button>
            <div id="reset-help" className="sr-only">
              すべてのフィルター設定をクリアします
            </div>
          </div>

          {/* マップ凡例 */}
          <MapLegend />
        </div>
      </div>
    </>
  );
});
