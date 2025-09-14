/**
 * @fileoverview MapInfoWindow component
 * 地図のInfoWindowコンテンツコンポーネント
 */

import {
  BusinessStatusBadge,
  DetailedBusinessHours,
  GoogleMapsLinkButton,
  LastUpdatedDisplay,
  RestaurantCategoryChip,
} from "@/components/common";
import type { CuisineType, MapPoint } from "@/types";
import { RestaurantCategory } from "@/types";
import { isRestaurant } from "@/types/type-guards";
import {
  calculateBusinessStatus,
  formatBusinessHoursForDisplay,
} from "@/utils";

interface MapInfoWindowProps {
  readonly point: MapPoint;
}

export function MapInfoWindow({ point }: Readonly<MapInfoWindowProps>) {
  return (
    <div style={{ padding: "16px", minWidth: "300px", maxWidth: "400px" }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <h3
            style={{
              margin: "0 0 4px 0",
              color: "#1f2937",
              fontSize: "18px",
              fontWeight: "bold",
              flex: "1",
            }}
          >
            {point.name}
          </h3>

          {/* 営業状況バッジ（飲食店のみ） */}
          {point.type === "restaurant" &&
            isRestaurant(point) &&
            point.openingHours && (
              <BusinessStatusBadge
                status={calculateBusinessStatus(point.openingHours)}
                size="medium"
                showIcon={true}
              />
            )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            flexWrap: "wrap",
          }}
        >
          {/* カテゴリーチップ */}
          <RestaurantCategoryChip
            category={getCategoryDisplay(point)}
            size="medium"
            showIcon={true}
            variant="filled"
          />

          {/* 価格帯（飲食店のみ） */}
          {point.type === "restaurant" && isRestaurant(point) && (
            <span
              style={{
                backgroundColor: "#f3f4f6",
                color: "#374151",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            >
              {point.priceRange}
            </span>
          )}
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
          <span>{point.address}</span>
        </div>

        {/* 電話番号（飲食店のみ） */}
        {point.type === "restaurant" && isRestaurant(point) && point.phone && (
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
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`tel:${point.phone}`, "_self");
              }}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(`tel:${point.phone}`, "_self");
                }
              }}
            >
              {point.phone}
            </span>
          </div>
        )}

        {/* 評価（飲食店のみ） */}
        {point.type === "restaurant" && isRestaurant(point) && point.rating && (
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
              {point.rating.toFixed(1)}
              {point.reviewCount && ` (${point.reviewCount}件)`}
            </span>
          </div>
        )}

        {/* 容量（駐車場のみ） */}
        {point.type === "parking" && point.capacity && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "6px 0",
              fontSize: "14px",
              color: "#374151",
            }}
          >
            <span style={{ marginRight: "8px" }}>🚗</span>
            <span>容量: {point.capacity}台</span>
          </div>
        )}

        {/* 料金（駐車場のみ） */}
        {point.type === "parking" && point.fee && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "6px 0",
              fontSize: "14px",
              color: "#374151",
            }}
          >
            <span style={{ marginRight: "8px" }}>💰</span>
            <span>料金: {point.fee}</span>
          </div>
        )}

        {/* 営業時間（飲食店のみ） */}
        {point.type === "restaurant" &&
          isRestaurant(point) &&
          point.openingHours && (
            <div style={{ margin: "8px 0" }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  marginBottom: "4px",
                }}
              >
                🕐 今日: {formatBusinessHoursForDisplay(point.openingHours)}
              </div>
              <DetailedBusinessHours
                openingHours={point.openingHours}
                compact={true}
                highlightToday={false}
                showLabel={false}
              />
            </div>
          )}
      </div>

      {/* 説明 */}
      {point.description && (
        <p
          style={{
            margin: "8px 0",
            color: "#6b7280",
            fontSize: "13px",
            lineHeight: "1.4",
          }}
        >
          {point.description}
        </p>
      )}

      {/* 特徴・設備 */}
      {point.features && point.features.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            {point.type === "restaurant" ? "特徴:" : "設備:"}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
            }}
          >
            {point.features.map(feature => (
              <span
                key={`feature-${feature}`}
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

      {/* メタ情報・最終更新日 */}
      {point.type === "restaurant" && isRestaurant(point) && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "8px",
            borderTop: "1px solid #e5e7eb",
            fontSize: "11px",
            color: "#6b7280",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <LastUpdatedDisplay
            lastUpdated={point.lastDataUpdate || point.lastUpdated}
            format="relative"
            size="small"
            showFreshnessIndicator={true}
          />
          {point.mainCategory && (
            <span style={{ fontSize: "10px" }}>🏷️ {point.mainCategory}</span>
          )}
        </div>
      )}

      {/* メタ情報・最終更新日（駐車場・トイレ用） */}
      {(point.type === "parking" || point.type === "toilet") && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "8px",
            borderTop: "1px solid #e5e7eb",
            fontSize: "11px",
            color: "#6b7280",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <LastUpdatedDisplay
            lastUpdated={point.lastDataUpdate || point.lastUpdated}
            format="relative"
            size="small"
            showFreshnessIndicator={true}
          />
          <span style={{ fontSize: "10px" }}>
            {point.type === "parking" ? "🅿️ 駐車場" : "🚻 トイレ"}
          </span>
        </div>
      )}

      {/* アクションボタン */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "8px",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        {/* Google Maps ルート案内 */}
        <GoogleMapsLinkButton
          name={point.name}
          coordinates={point.coordinates}
          {...(point.type === "restaurant" &&
            isRestaurant(point) && { placeId: point.id })}
          mode="directions"
          variant="primary"
          size="medium"
          showIcon={true}
        />

        {/* Google Maps 表示 */}
        <GoogleMapsLinkButton
          name={point.name}
          coordinates={point.coordinates}
          {...(point.type === "restaurant" &&
            isRestaurant(point) && { placeId: point.id })}
          mode="search"
          variant="secondary"
          size="medium"
          showIcon={true}
        />

        {/* ウェブサイトボタン（飲食店のみ） */}
        {point.type === "restaurant" &&
          isRestaurant(point) &&
          point.website && (
            <button
              type="button"
              onClick={() =>
                window.open(point.website, "_blank", "noopener,noreferrer")
              }
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: "500",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#059669";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#10b981";
              }}
            >
              🌐 ウェブサイト
            </button>
          )}
      </div>
    </div>
  );
}

/**
 * カテゴリー表示のヘルパー関数（複雑な三項演算子を単純化）
 */
function getCategoryDisplay(point: MapPoint): CuisineType | RestaurantCategory {
  if (point.type === "restaurant" && isRestaurant(point)) {
    return point.cuisineType;
  }
  if (point.type === "parking") {
    // 駐車場の場合はOTHERカテゴリーを使用
    return RestaurantCategory.OTHER;
  }
  // トイレの場合もOTHERカテゴリーを使用
  return RestaurantCategory.OTHER;
}
