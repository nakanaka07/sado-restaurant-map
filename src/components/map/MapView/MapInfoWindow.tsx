/**
 * @fileoverview MapInfoWindow component
 * 地図のInfoWindowコンテンツコンポーネント
 */

import type { MapPoint } from "@/types";
import { isRestaurant } from "@/types/type-guards";
import { getMarkerIcon } from "../utils";

interface MapInfoWindowProps {
  readonly point: MapPoint;
}

export function MapInfoWindow({ point }: Readonly<MapInfoWindowProps>) {
  const { background } = getMarkerIcon(point);

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
          {point.name}
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
              backgroundColor: background,
              color: "white",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            {point.type === "restaurant" &&
              isRestaurant(point) &&
              point.cuisineType}
            {point.type === "parking" && "駐車場"}
            {point.type === "toilet" && "公衆トイレ"}
          </span>
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
            <a
              href={`tel:${point.phone}`}
              style={{ color: "#2563eb", textDecoration: "none" }}
            >
              {point.phone}
            </a>
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

        {/* 営業時間（駐車場・トイレ） */}
        {(point.type === "parking" || point.type === "toilet") &&
          point.openingHours &&
          point.openingHours.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "6px 0",
                fontSize: "14px",
                color: "#374151",
              }}
            >
              <span style={{ marginRight: "8px" }}>🕐</span>
              <span>
                {point.openingHours
                  .map(
                    (hours) =>
                      `${hours.day}: ${
                        hours.isHoliday
                          ? "休業"
                          : `${hours.open}-${hours.close}`
                      }`
                  )
                  .join(", ")}
              </span>
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
            {point.features.map((feature) => (
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

      {/* アクションボタン */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "8px",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() =>
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${point.coordinates.lat},${point.coordinates.lng}`,
              "_blank"
            )
          }
          style={{
            background: "#1f2937",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#111827";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#1f2937";
          }}
        >
          🗺️ ルート案内
        </button>

        {point.type === "restaurant" && point.website && (
          <button
            onClick={() => window.open(point.website, "_blank")}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1d4ed8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
            }}
          >
            🌐 ウェブサイト
          </button>
        )}
      </div>
    </div>
  );
}
