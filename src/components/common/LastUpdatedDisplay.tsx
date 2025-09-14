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

/**
 * 新鮮さに応じた設定を取得する関数（メソッド分割パターン）
 */
function createFreshnessConfig(lastUpdated: string) {
  const isFresh = isDataFresh(lastUpdated, 24);
  if (isFresh) {
    return getFreshDataConfig();
  }
  return getStaleDataConfig();
}

/**
 * 新鮮さに応じたインジケーターを作成
 */
function createFreshnessIndicator(
  lastUpdated: string,
  size: "small" | "medium",
  showFreshnessIndicator: boolean
) {
  if (!showFreshnessIndicator) return null;

  const isFresh = isDataFresh(lastUpdated, 24);
  return <FreshnessIndicator isFresh={isFresh} size={size} />;
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

    const sizeConfig = getSizeConfig(size);
    const freshnessConfig = createFreshnessConfig(lastUpdated);

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

        {createFreshnessIndicator(lastUpdated, size, showFreshnessIndicator)}
      </div>
    );
  }
);

LastUpdatedDisplay.displayName = "LastUpdatedDisplay";

/**
 * データの新鮮さインジケーター
 */
/**
 * 新鮮なデータ用のインジケータースタイルを取得
 */
function getFreshIndicatorStyle(sizeConfig: ReturnType<typeof getSizeConfig>) {
  return {
    width: sizeConfig.indicatorSize,
    height: sizeConfig.indicatorSize,
    borderRadius: "50%" as const,
    backgroundColor: "#22c55e",
    border: "1px solid",
    borderColor: "#16a34a",
    flexShrink: 0,
  };
}

/**
 * 古いデータ用のインジケータースタイルを取得
 */
function getStaleIndicatorStyle(sizeConfig: ReturnType<typeof getSizeConfig>) {
  return {
    width: sizeConfig.indicatorSize,
    height: sizeConfig.indicatorSize,
    borderRadius: "50%" as const,
    backgroundColor: "#f59e0b",
    border: "1px solid",
    borderColor: "#d97706",
    flexShrink: 0,
  };
}

/**
 * 新鮮さ用のラベルを取得
 */
function getFreshLabels() {
  return {
    title: "最新データ",
    ariaLabel: "データは最新です",
  };
}

/**
 * 古いデータ用のラベルを取得
 */
function getStaleLabels() {
  return {
    title: "データが古い可能性があります",
    ariaLabel: "データが古い可能性があります",
  };
}

/**
 * 新鮮なデータ用のインジケーター
 */
const FreshDataIndicator = React.memo<{
  size: "small" | "medium";
}>(({ size }) => {
  const sizeConfig = getSizeConfig(size);
  const style = getFreshIndicatorStyle(sizeConfig);
  const labels = getFreshLabels();

  return (
    <span style={style} title={labels.title} aria-label={labels.ariaLabel} />
  );
});

FreshDataIndicator.displayName = "FreshDataIndicator";

/**
 * 古いデータ用のインジケーター
 */
const StaleDataIndicator = React.memo<{
  size: "small" | "medium";
}>(({ size }) => {
  const sizeConfig = getSizeConfig(size);
  const style = getStaleIndicatorStyle(sizeConfig);
  const labels = getStaleLabels();

  return (
    <span style={style} title={labels.title} aria-label={labels.ariaLabel} />
  );
});

StaleDataIndicator.displayName = "StaleDataIndicator";

/**
 * 新鮮なデータ用のインジケーター取得
 */
function getFreshIndicatorComponent(size: "small" | "medium") {
  return <FreshDataIndicator size={size} />;
}

/**
 * 古いデータ用のインジケーター取得
 */
function getStaleIndicatorComponent(size: "small" | "medium") {
  return <StaleDataIndicator size={size} />;
}

/**
 * データの新鮮さに応じたインジケーター選択
 */
function selectFreshnessIndicator(isFresh: boolean, size: "small" | "medium") {
  if (isFresh) {
    return getFreshIndicatorComponent(size);
  }
  return getStaleIndicatorComponent(size);
}

const FreshnessIndicator = React.memo<{
  isFresh: boolean;
  size: "small" | "medium";
}>(({ isFresh, size }) => {
  return selectFreshnessIndicator(isFresh, size);
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
 * 新鮮なデータの設定を取得
 */
function getFreshDataConfig() {
  return {
    color: "#374151", // gray-700
    iconColor: "#22c55e", // green-500
    icon: "🔄",
  };
}

/**
 * 古いデータの設定を取得
 */
function getStaleDataConfig() {
  return {
    color: "#6b7280", // gray-500
    iconColor: "#f59e0b", // amber-500
    icon: "⚠️",
  };
}
