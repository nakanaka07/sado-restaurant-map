/**
 * @fileoverview Filter Trigger Button Component
 * モーダルフィルターを開くトリガーボタン - WCAG 2.2 AA準拠
 */

import type { FilterTriggerButtonProps } from "@/types";
import { memo, useCallback } from "react";

/**
 * フィルタートリガーボタンコンポーネント
 * モバイルファーストデザインでマップ視認性を重視
 */
export const FilterTriggerButton = memo<FilterTriggerButtonProps>(
  function FilterTriggerButton({
    onClick,
    activeCount,
    isLoading = false,
    disabled = false,
    className = "",
    "aria-label": ariaLabel,
  }) {
    // キーボード対応のハンドラー
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      },
      [onClick]
    );

    // アクセシビリティ用ラベル
    // アクセシビリティ対応: ネストテンプレートリテラルを回避
    const getAriaLabel = (): string => {
      const baseLabel = "フィルターを開く";
      if (activeCount > 0) {
        return `${baseLabel} (${activeCount}件の条件が設定済み)`;
      }
      return baseLabel;
    };
    const defaultAriaLabel = getAriaLabel();

    return (
      <button
        type="button"
        className={`filter-trigger-btn ${className}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoading}
        aria-label={ariaLabel || defaultAriaLabel}
        aria-pressed="false"
        aria-haspopup="dialog"
        data-active={activeCount > 0}
        data-loading={isLoading}
        data-testid="filter-trigger-button"
      >
        {/* アイコン */}
        <span className="filter-trigger-icon" aria-hidden="true">
          {isLoading ? "⏳" : "🔍"}
        </span>

        {/* ラベル */}
        <span className="filter-trigger-label">フィルター</span>

        {/* アクティブ数バッジ */}
        {activeCount > 0 && (
          <span
            className="filter-trigger-badge"
            aria-label={`${activeCount}件の条件が設定中`}
          >
            {activeCount}
          </span>
        )}

        {/* 視覚的フィードバック用のリップル */}
        <span className="filter-trigger-ripple" aria-hidden="true" />
      </button>
    );
  }
);

FilterTriggerButton.displayName = "FilterTriggerButton";
