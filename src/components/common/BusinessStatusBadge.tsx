/**
 * 営業状況バッジコンポーネント
 * 営業中/閉店中/不明の状態を視覚的に表示
 */

import { BusinessStatus } from "@/types";
import React from "react";

interface BusinessStatusBadgeProps {
  readonly status: BusinessStatus;
  readonly size?: "small" | "medium" | "large";
  readonly showIcon?: boolean;
  readonly className?: string;
}

export const BusinessStatusBadge = React.memo<BusinessStatusBadgeProps>(
  ({ status, size = "medium", showIcon = true, className = "" }) => {
    const config = getStatusConfig(status);
    const sizeConfig = getSizeConfig(size);

    return (
      <span
        className={`business-status-badge ${className}`}
        style={{
          backgroundColor: config.background,
          color: config.color,
          border: `1px solid ${config.border}`,
          padding: sizeConfig.padding,
          borderRadius: sizeConfig.borderRadius,
          fontSize: sizeConfig.fontSize,
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          lineHeight: "1",
          whiteSpace: "nowrap",
        }}
        aria-label={`営業状況: ${status}`}
      >
        {showIcon && (
          <span style={{ fontSize: sizeConfig.iconSize }} aria-hidden="true">
            {config.icon}
          </span>
        )}
        <span>{config.text}</span>
      </span>
    );
  }
);

BusinessStatusBadge.displayName = "BusinessStatusBadge";

/**
 * 営業状況に応じたスタイル設定を取得
 */
function getStatusConfig(status: BusinessStatus) {
  switch (status) {
    case BusinessStatus.OPEN:
      return {
        text: "営業中",
        icon: "🟢",
        background: "#dcfce7", // green-100
        color: "#15803d", // green-700
        border: "#86efac", // green-300
      };

    case BusinessStatus.CLOSED:
      return {
        text: "閉店中",
        icon: "🔴",
        background: "#fee2e2", // red-100
        color: "#dc2626", // red-600
        border: "#fca5a5", // red-300
      };

    case BusinessStatus.UNKNOWN:
    default:
      return {
        text: "営業時間不明",
        icon: "🟡",
        background: "#fef3c7", // yellow-100
        color: "#d97706", // yellow-600
        border: "#fde68a", // yellow-300
      };
  }
}

/**
 * サイズに応じたスタイル設定を取得
 */
function getSizeConfig(size: "small" | "medium" | "large") {
  switch (size) {
    case "small":
      return {
        padding: "2px 6px",
        fontSize: "10px",
        iconSize: "8px",
        borderRadius: "8px",
      };

    case "large":
      return {
        padding: "6px 12px",
        fontSize: "14px",
        iconSize: "14px",
        borderRadius: "12px",
      };

    case "medium":
    default:
      return {
        padding: "4px 8px",
        fontSize: "12px",
        iconSize: "12px",
        borderRadius: "10px",
      };
  }
}
