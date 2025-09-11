/**
 * @fileoverview Compact Modal Filter Component
 * 計画書のPattern 1実装 - 既存FilterPanelとの統合
 */

import { FilterPanel } from "@/components/restaurant";
import { useModalFilter } from "@/hooks";
import type { CompactModalFilterProps } from "@/types";
import { memo } from "react";
import { FilterModal } from "./FilterModal";
import { FilterTriggerButton } from "./FilterTriggerButton";

/**
 * コンパクトモーダルフィルターコンポーネント
 * FilterPanelと互換性のあるProps設計で既存のApp.tsxと統合
 */
export const CompactModalFilter = memo<CompactModalFilterProps>(
  function CompactModalFilter({
    // 基本情報
    loading = false,
    resultCount = 0,
    stats,

    // FilterPanelと同じハンドラー群
    onCuisineFilter,
    onPriceFilter,
    onDistrictFilter,
    onRatingFilter,
    onOpenNowFilter,
    onSearchFilter,
    onFeatureFilter,
    onPointTypeFilter,
    onSortChange,
    onResetFilters,

    // Modal専用
    className = "",
    "data-testid": testId = "compact-modal-filter",
  }) {
    // React 19 useActionState を活用したモーダル状態管理
    const { isOpen, activeFilterCount, openModal, closeModal } =
      useModalFilter();

    return (
      <div className={`compact-modal-filter ${className}`} data-testid={testId}>
        {/* トリガーボタン - マップ上に常時表示 */}
        <FilterTriggerButton
          onClick={openModal}
          activeCount={activeFilterCount}
          isLoading={loading}
        />

        {/* モーダルウィンドウ */}
        <FilterModal
          isOpen={isOpen}
          onClose={closeModal}
          onFiltersChange={async () => {}} // Dummy handler for interface compatibility
        >
          {/* 既存のFilterPanelをモーダル内に表示 */}
          <FilterPanel
            loading={loading}
            resultCount={resultCount}
            stats={
              stats || { restaurants: 0, parkings: 0, toilets: 0, total: 0 }
            }
            {...(onCuisineFilter && { onCuisineFilter })}
            {...(onPriceFilter && { onPriceFilter })}
            {...(onDistrictFilter && { onDistrictFilter })}
            {...(onRatingFilter && { onRatingFilter })}
            {...(onOpenNowFilter && { onOpenNowFilter })}
            {...(onSearchFilter && { onSearchFilter })}
            {...(onFeatureFilter && { onFeatureFilter })}
            {...(onPointTypeFilter && { onPointTypeFilter })}
            {...(onSortChange && { onSortChange })}
            {...(onResetFilters && { onResetFilters })}
          />
        </FilterModal>
      </div>
    );
  }
);

CompactModalFilter.displayName = "CompactModalFilter";
