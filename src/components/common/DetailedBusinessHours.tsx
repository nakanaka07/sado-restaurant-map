/**
 * 詳細営業時間表示コンポーネント
 * 曜日別営業時間を見やすく表示
 */

import type { OpeningHours } from "@/types";
import { formatDayShort, formatOpeningHours } from "@/utils";
import React from "react";

interface DetailedBusinessHoursProps {
  readonly openingHours: readonly OpeningHours[];
  readonly compact?: boolean;
  readonly highlightToday?: boolean;
  readonly showLabel?: boolean;
  readonly className?: string;
}

export const DetailedBusinessHours = React.memo<DetailedBusinessHoursProps>(
  ({
    openingHours,
    compact = false,
    highlightToday = true,
    showLabel = true,
    className = "",
  }) => {
    if (!openingHours || openingHours.length === 0) {
      return (
        <div className={`detailed-business-hours ${className}`}>
          <span style={{ color: "#6b7280", fontSize: "12px" }}>
            営業時間不明
          </span>
        </div>
      );
    }

    const todayIndex = new Date().getDay();
    const todayName = ["日", "月", "火", "水", "木", "金", "土"][todayIndex]!;

    return (
      <div className={`detailed-business-hours ${className}`}>
        {showLabel && (
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            📅 営業時間
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: compact ? "row" : "column",
            gap: compact ? "12px" : "4px",
            flexWrap: compact ? "wrap" : "nowrap",
          }}
        >
          {openingHours.map((hours, index) => {
            const dayShort = formatDayShort(hours.day);
            const isToday = highlightToday && dayShort === todayName;
            const isHoliday = hours.isHoliday;

            return (
              <div
                key={`hours-${index}-${hours.day}`}
                style={{
                  display: "flex",
                  justifyContent: compact ? "flex-start" : "space-between",
                  alignItems: "center",
                  gap: "8px",
                  padding: isToday ? "4px 8px" : "2px 0",
                  backgroundColor: isToday ? "#f3f4f6" : "transparent",
                  borderRadius: "4px",
                  fontSize: compact ? "11px" : "12px",
                  fontWeight: isToday ? "600" : "normal",
                  color: getTextColor(isHoliday, isToday),
                }}
              >
                <span
                  style={{
                    minWidth: compact ? "20px" : "24px",
                    fontWeight: "500",
                    color: isToday ? "#1976d2" : "inherit",
                  }}
                >
                  {dayShort}
                </span>

                <span style={{ flex: compact ? "none" : "1" }}>
                  {isHoliday ? (
                    <span
                      style={{
                        fontStyle: "italic",
                        color: "#ef4444",
                      }}
                    >
                      定休日
                    </span>
                  ) : (
                    formatOpeningHours(hours.open, hours.close, {
                      format: "24h",
                      showPeriod: false,
                    })
                  )}
                </span>

                {isToday && !compact && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#1976d2",
                      fontWeight: "500",
                    }}
                  >
                    本日
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 今日の営業時間を強調表示 */}
        {!compact && highlightToday && (
          <TodayHoursHighlight
            openingHours={openingHours}
            todayName={todayName}
          />
        )}
      </div>
    );
  }
);

DetailedBusinessHours.displayName = "DetailedBusinessHours";

/**
 * 今日の営業時間強調表示コンポーネント
 */
const TodayHoursHighlight = React.memo<{
  openingHours: readonly OpeningHours[];
  todayName: string;
}>(({ openingHours, todayName }) => {
  const todayHours = openingHours.find(
    hours => formatDayShort(hours.day) === todayName
  );

  if (!todayHours) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "8px",
        padding: "6px 8px",
        backgroundColor: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: "6px",
        fontSize: "11px",
      }}
    >
      <div style={{ fontWeight: "600", color: "#1e40af" }}>本日の営業時間</div>
      <div style={{ color: "#1e3a8a", marginTop: "2px" }}>
        {todayHours.isHoliday
          ? "定休日"
          : formatOpeningHours(todayHours.open ?? "", todayHours.close ?? "", {
              format: "24h",
              showPeriod: true,
            })}
      </div>
    </div>
  );
});

TodayHoursHighlight.displayName = "TodayHoursHighlight";

/**
 * テキストカラーを取得（複雑な三項演算子を単純化）
 */
function getTextColor(isHoliday: boolean, isToday: boolean): string {
  if (isHoliday) return "#9ca3af";
  if (isToday) return "#111827";
  return "#4b5563";
}
