/**
 * @fileoverview 最適化されたInfoWindowコンポーネント
 * メモリ効率とレンダリング最適化を重視
 */

import { LastUpdatedDisplay } from "@/components/common/LastUpdatedDisplay";
import type { Restaurant } from "@/types";
import { InfoWindow } from "@vis.gl/react-google-maps";
import { memo, useCallback } from "react";
import { getMarkerColorByCuisine } from "./utils";

interface OptimizedInfoWindowProps {
  readonly restaurant: Restaurant;
  readonly onClose: () => void;
}

/**
 * メモ化されたInfoWindow内容
 */
const InfoWindowContent = memo<{ restaurant: Restaurant }>(({ restaurant }) => {
  // 電話クリックハンドラー
  const handlePhoneClick = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (restaurant.phone) {
        window.open(`tel:${restaurant.phone}`, "_self");
      }
    },
    [restaurant.phone]
  );

  // キーボードイベントハンドラー
  const handlePhoneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        handlePhoneClick(e);
      }
    },
    [handlePhoneClick]
  );

  return (
    <div style={{ padding: "16px", minWidth: "300px", maxWidth: "400px" }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: "12px" }}>
        <h3
          style={{
            margin: "0 0 4px 0",
            color: "#1f2937",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          {restaurant.name}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              backgroundColor: getMarkerColorByCuisine(restaurant.cuisineType),
              color: "white",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            {restaurant.cuisineType}
          </span>
          <span
            style={{
              backgroundColor: "#f3f4f6",
              color: "#374151",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          >
            {restaurant.priceRange}
          </span>
        </div>
      </div>

      {/* 基本情報 */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            margin: "6px 0",
            fontSize: "14px",
            color: "#374151",
          }}
        >
          <span style={{ marginRight: "8px" }}>📍</span>
          <span>{restaurant.address}</span>
        </div>

        {restaurant.phone && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "6px 0",
              fontSize: "14px",
              color: "#374151",
            }}
          >
            <span style={{ marginRight: "8px" }}>📞</span>
            <span
              role="link"
              tabIndex={0}
              style={{
                color: "#2563eb",
                cursor: "pointer",
                textDecoration: "none",
              }}
              onClick={handlePhoneClick}
              onKeyDown={handlePhoneKeyDown}
            >
              {restaurant.phone}
            </span>
          </div>
        )}

        {restaurant.rating && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "6px 0",
              fontSize: "14px",
              color: "#374151",
            }}
          >
            <span style={{ marginRight: "8px" }}>⭐</span>
            <span>
              {restaurant.rating.toFixed(1)}
              {restaurant.reviewCount && ` (${restaurant.reviewCount}件)`}
            </span>
          </div>
        )}
      </div>

      {/* 説明 */}
      {restaurant.description && (
        <p
          style={{
            margin: "8px 0",
            color: "#6b7280",
            fontSize: "13px",
            lineHeight: "1.4",
          }}
        >
          {restaurant.description}
        </p>
      )}

      {/* 特徴 */}
      {restaurant.features && restaurant.features.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            特徴:
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
            }}
          >
            {restaurant.features.slice(0, 6).map(feature => (
              <span
                key={feature}
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 最終更新日 */}
      {restaurant.lastUpdated && (
        <div
          style={{
            marginTop: "8px",
            paddingTop: "6px",
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <LastUpdatedDisplay
            lastUpdated={restaurant.lastUpdated}
            format="relative"
            size="small"
            showIcon={false}
            showFreshnessIndicator={true}
          />
        </div>
      )}
    </div>
  );
});

InfoWindowContent.displayName = "InfoWindowContent";

/**
 * 最適化されたInfoWindow
 */
export const OptimizedInfoWindow = memo<OptimizedInfoWindowProps>(
  ({ restaurant, onClose }) => {
    return (
      <InfoWindow
        position={restaurant.coordinates}
        onCloseClick={onClose}
        zIndex={1000}
      >
        <InfoWindowContent restaurant={restaurant} />
      </InfoWindow>
    );
  }
);

OptimizedInfoWindow.displayName = "OptimizedInfoWindow";
