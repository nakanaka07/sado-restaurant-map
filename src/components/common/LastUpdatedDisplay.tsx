/**
 * 最終更新日表示コンポーネント
 * データの更新日時を見やすく表示
 */

import { formatDateForDisplay, formatRelativeTime, isDataFresh } from "@/utils";
import React from "react";

interface LastUpdatedDisplayProps {
  readonly lastUpdated: string;
  readonly format?: "absolute" | "relative" | "both";
  readonly showIcon?: boolean;
  readonly showFreshnessIndicator?: boolean;
  readonly size?: "small" | "medium";
  readonly className?: string;
}

export const LastUpdatedDisplay = React.memo<LastUpdatedDisplayProps>(
  ({
    lastUpdated,
    format = "relative",
    showIcon = true,
    showFreshnessIndicator = true,
    size = "medium",
    className = "",
  }) => {
    if (!lastUpdated) {
      return (
        <div className={`last-updated-display ${className}`}>
          <span style={{ color: "#9ca3af", fontSize: "11px" }}>更新日不明</span>
        </div>
      );
    }

    const isFresh = isDataFresh(lastUpdated, 24);
    const sizeConfig = getSizeConfig(size);
    const freshnessConfig = getFreshnessConfig(isFresh);

    return (
      <div
        className={`last-updated-display ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: sizeConfig.fontSize,
          color: freshnessConfig.color,
        }}
      >
        {showIcon && (
          <span
            style={{
              fontSize: sizeConfig.iconSize,
              color: freshnessConfig.iconColor,
            }}
            aria-hidden="true"
          >
            {freshnessConfig.icon}
          </span>
        )}

        <span>
          {format === "absolute" &&
            formatDateForDisplay(lastUpdated, { showYear: false })}
          {format === "relative" && formatRelativeTime(lastUpdated)}
          {format === "both" && (
            <span>
              {formatRelativeTime(lastUpdated)}
              <span style={{ color: "#9ca3af", marginLeft: "4px" }}>
                ({formatDateForDisplay(lastUpdated, { showYear: false })})
              </span>
            </span>
          )}
        </span>

        {showFreshnessIndicator && (
          <FreshnessIndicator isFresh={isFresh} size={size} />
        )}
      </div>
    );
  }
);

LastUpdatedDisplay.displayName = "LastUpdatedDisplay";

/**
 * データの新鮮さインジケーター
 */
const FreshnessIndicator = React.memo<{
  isFresh: boolean;
  size: "small" | "medium";
}>(({ isFresh, size }) => {
  const sizeConfig = getSizeConfig(size);

  return (
    <span
      style={{
        width: sizeConfig.indicatorSize,
        height: sizeConfig.indicatorSize,
        borderRadius: "50%",
        backgroundColor: isFresh ? "#22c55e" : "#f59e0b",
        border: "1px solid",
        borderColor: isFresh ? "#16a34a" : "#d97706",
        flexShrink: 0,
      }}
      title={isFresh ? "最新データ" : "データが古い可能性があります"}
      aria-label={isFresh ? "データは最新です" : "データが古い可能性があります"}
    />
  );
});

FreshnessIndicator.displayName = "FreshnessIndicator";

/**
 * サイズ設定を取得
 */
function getSizeConfig(size: "small" | "medium") {
  switch (size) {
    case "small":
      return {
        fontSize: "10px",
        iconSize: "10px",
        indicatorSize: "6px",
      };

    case "medium":
    default:
      return {
        fontSize: "12px",
        iconSize: "12px",
        indicatorSize: "8px",
      };
  }
}

/**
 * 新鮮さに応じた設定を取得
 */
function getFreshnessConfig(isFresh: boolean) {
  if (isFresh) {
    return {
      color: "#374151", // gray-700
      iconColor: "#22c55e", // green-500
      icon: "🔄",
    };
  } else {
    return {
      color: "#6b7280", // gray-500
      iconColor: "#f59e0b", // amber-500
      icon: "⚠️",
    };
  }
}
