import {
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { useState, useCallback } from "react";
import type {
  MapPoint,
  Restaurant,
  Parking,
  Toilet,
} from "../../types/restaurant.types";
import { trackRestaurantClick, trackMapInteraction } from "@/utils/analytics";

interface MapViewProps {
  mapPoints: readonly MapPoint[];
  center: { lat: number; lng: number };
  loading: boolean;
  error?: string | null;
}

/**
 * ポイントタイプに基づいてマーカーのアイコンを決定
 */
const getMarkerIcon = (
  point: MapPoint
): { background: string; glyph: string } => {
  switch (point.type) {
    case "restaurant":
      return {
        background: getMarkerColorByCuisine((point as Restaurant).cuisineType),
        glyph: "🍽️",
      };
    case "parking":
      return {
        background: "#4caf50", // グリーン
        glyph: "🅿️",
      };
    case "toilet":
      return {
        background: "#2196f3", // ブルー
        glyph: "🚽",
      };
    default:
      return {
        background: "#9e9e9e", // グレー
        glyph: "📍",
      };
  }
};

/**
 * 料理ジャンルに基づいてマーカーの色を決定（飲食店用）
 */
const getMarkerColorByCuisine = (cuisineType: string): string => {
  const colorMap: Record<string, string> = {
    日本料理: "#ff9800", // オレンジ
    寿司: "#e91e63", // ピンク
    海鮮: "#2196f3", // 青
    "焼肉・焼鳥": "#d32f2f", // 赤
    ラーメン: "#ff5722", // ディープオレンジ
    "そば・うどん": "#795548", // ブラウン
    中華: "#f44336", // レッド
    イタリアン: "#4caf50", // グリーン
    フレンチ: "#9c27b0", // パープル
    "カフェ・喫茶店": "#607d8b", // ブルーグレー
    "バー・居酒屋": "#ff9800", // アンバー
    ファストフード: "#ffeb3b", // イエロー
    "デザート・スイーツ": "#e91e63", // ピンク
    "カレー・エスニック": "#ff9600", // ディープオレンジ
    "ステーキ・洋食": "#8e24aa", // ディープパープル
    "弁当・テイクアウト": "#5d4037", // ダークブラウン
    レストラン: "#3f51b5", // インディゴ
    その他: "#9e9e9e", // グレー
  };

  return colorMap[cuisineType] || "#ff6b6b"; // デフォルト色
};

/**
 * 価格帯に基づいてマーカーのサイズを決定（飲食店用）
 */
const getMarkerSizeByPrice = (priceRange?: string): number => {
  if (!priceRange) return 1.2;

  const sizeMap: Record<string, number> = {
    "～1000円": 1.0,
    "1000-2000円": 1.2,
    "2000-3000円": 1.4,
    "3000円～": 1.6,
  };

  return sizeMap[priceRange] || 1.2; // デフォルトサイズ
};

/**
 * マーカーサイズを決定（全ポイントタイプ対応）
 */
const getMarkerSize = (point: MapPoint): number => {
  switch (point.type) {
    case "restaurant":
      return getMarkerSizeByPrice((point as Restaurant).priceRange);
    case "parking":
    case "toilet":
      return 1.1; // 統一サイズ
    default:
      return 1.0;
  }
};

/**
 * InfoWindow用のコンテンツを生成
 */
const renderInfoWindowContent = (point: MapPoint) => {
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
            {point.features.slice(0, 6).map((feature, index) => (
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
    </div>
  );
};

export default function MapView({ mapPoints, center, loading }: MapViewProps) {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // マーカークリック時の処理
  const handleMarkerClick = useCallback((point: MapPoint) => {
    setSelectedPoint(point);

    // Analytics: 飲食店クリック追跡
    if (point.type === "restaurant") {
      const restaurant = point as Restaurant;
      trackRestaurantClick({
        id: restaurant.id,
        name: restaurant.name,
        category: restaurant.cuisineType,
        priceRange: restaurant.priceRange,
      });
    }

    // Analytics: 地図操作追跡
    trackMapInteraction("marker_click");
  }, []);

  if (loading) {
    return (
      <div
        className="map-loading"
        style={{
          height: "500px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <p>🗺️ 地図を読み込み中...</p>
      </div>
    );
  }

  if (!mapId) {
    return (
      <div
        className="map-error"
        style={{
          height: "500px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fee",
          borderRadius: "8px",
          border: "1px solid #fcc",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#d63031", fontSize: "18px", marginBottom: "12px" }}>
          ❌ Map ID が設定されていません
        </p>
        <p style={{ color: "#636e72", fontSize: "14px", marginBottom: "16px" }}>
          Google Maps API の Map ID を設定してください
        </p>
        <div style={{ fontSize: "12px", color: "#636e72" }}>
          <p>
            環境変数: <code>VITE_GOOGLE_MAPS_MAP_ID</code>
          </p>
          <p>
            現在の値: <code>{mapId || "未設定"}</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="map-container"
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: "1px solid #e0e0e0",
      }}
    >
      <Map
        defaultCenter={center}
        defaultZoom={11}
        mapId={mapId}
        style={{ width: "100%", height: "100%" }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={true}
        fullscreenControl={true}
        streetViewControl={true}
        zoomControl={true}
      >
        {mapPoints.map((point, index) => {
          const { background, glyph } = getMarkerIcon(point);

          return (
            <AdvancedMarker
              key={`${point.type}-${point.id}-${index}`} // ポイントタイプを含むユニークキー
              position={point.coordinates}
              title={point.name}
              onClick={() => handleMarkerClick(point)}
            >
              <Pin
                background={background}
                borderColor="#fff"
                glyphColor="#fff"
                scale={getMarkerSize(point)}
              >
                <div style={{ fontSize: "12px" }}>{glyph}</div>
              </Pin>
            </AdvancedMarker>
          );
        })}

        {selectedPoint && (
          <InfoWindow
            position={selectedPoint.coordinates}
            onCloseClick={() => setSelectedPoint(null)}
          >
            {renderInfoWindowContent(selectedPoint)}
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
