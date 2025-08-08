/**
 * @fileoverview MapInfoWindow component
 * 地図のInfoWindowコンテンツコンポーネント
 */

import type { MapPoint, Restaurant, Parking, Toilet } from "@/types";
import { getMarkerIcon } from "./markerUtils";

interface MapInfoWindowProps {
  point: MapPoint;
}

export function MapInfoWindow({ point }: MapInfoWindowProps) {
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
            {point.type === "restaurant" && (point as Restaurant).cuisineType}
            {point.type === "parking" && "駐車場"}
            {point.type === "toilet" && "公衆トイレ"}
          </span>
          {point.type === "restaurant" && (
            <span
              style={{
                backgroundColor: "#f3f4f6",
                color: "#374151",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            >
              {(point as Restaurant).priceRange}
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
        {point.type === "restaurant" && (point as Restaurant).phone && (
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
              href={`tel:${(point as Restaurant).phone}`}
              style={{ color: "#2563eb", textDecoration: "none" }}
            >
              {(point as Restaurant).phone}
            </a>
          </div>
        )}

        {/* 評価（飲食店のみ） */}
        {point.type === "restaurant" && (point as Restaurant).rating && (
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
              {(point as Restaurant).rating!.toFixed(1)}
              {(point as Restaurant).reviewCount &&
                ` (${(point as Restaurant).reviewCount}件)`}
            </span>
          </div>
        )}

        {/* 容量（駐車場のみ） */}
        {point.type === "parking" && (point as Parking).capacity && (
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
            <span>容量: {(point as Parking).capacity}台</span>
          </div>
        )}

        {/* 料金（駐車場のみ） */}
        {point.type === "parking" && (point as Parking).fee && (
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
            <span>料金: {(point as Parking).fee}</span>
          </div>
        )}

        {/* 営業時間（駐車場・トイレ） */}
        {(point.type === "parking" || point.type === "toilet") &&
          (point as Parking | Toilet).openingHours &&
          (point as Parking | Toilet).openingHours!.length > 0 && (
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
                {(point as Parking | Toilet)
                  .openingHours!.map(
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
            {point.features.map((feature, index) => (
              <span
                key={index}
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

        {point.type === "restaurant" && (point as Restaurant).website && (
          <button
            onClick={() =>
              window.open((point as Restaurant).website!, "_blank")
            }
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
