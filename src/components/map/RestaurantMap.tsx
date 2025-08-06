import {
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { useState, useCallback } from "react";
import type { Restaurant } from "../../types/restaurant.types";
import { trackRestaurantClick, trackMapInteraction } from "@/utils/analytics";

interface RestaurantMapProps {
  restaurants: readonly Restaurant[];
  center: { lat: number; lng: number };
  loading: boolean;
  error?: string | null;
}

/**
 * 料理ジャンルに基づいてマーカーの色を決定
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
    "カフェ・喫茶店": "#607d8b", // グレー
    "バー・居酒屋": "#ff9800", // アンバー
    ファストフード: "#ffeb3b", // イエロー
    "デザート・スイーツ": "#e91e63", // ピンク
    その他: "#9e9e9e", // グレー
  };

  return colorMap[cuisineType] || "#ff6b6b"; // デフォルト色
};

/**
 * 価格帯に基づいてマーカーのサイズを決定
 */
const getMarkerSizeByPrice = (priceRange: string): number => {
  const sizeMap: Record<string, number> = {
    "～1000円": 1.0,
    "1000-2000円": 1.2,
    "2000-3000円": 1.4,
    "3000円～": 1.6,
  };

  return sizeMap[priceRange] || 1.2; // デフォルトサイズ
};

export default function RestaurantMap({
  restaurants,
  center,
  loading,
}: RestaurantMapProps) {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  // レストランマーカークリック時の処理
  const handleMarkerClick = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);

    // Analytics: レストランクリック追跡
    trackRestaurantClick({
      id: restaurant.id,
      name: restaurant.name,
      category: restaurant.cuisineType,
      priceRange: restaurant.priceRange,
    });

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
        {restaurants.map((restaurant, index) => (
          <AdvancedMarker
            key={`${restaurant.id}-${index}`} // 重複防止のためインデックスを追加
            position={restaurant.coordinates}
            title={restaurant.name}
            onClick={() => handleMarkerClick(restaurant)}
          >
            <Pin
              background={getMarkerColorByCuisine(restaurant.cuisineType)}
              borderColor="#fff"
              glyphColor="#fff"
              scale={getMarkerSizeByPrice(restaurant.priceRange)}
            />
          </AdvancedMarker>
        ))}

        {selectedRestaurant && (
          <InfoWindow
            position={selectedRestaurant.coordinates}
            onCloseClick={() => setSelectedRestaurant(null)}
          >
            <div
              style={{ padding: "16px", minWidth: "300px", maxWidth: "400px" }}
            >
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
                  {selectedRestaurant.name}
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
                      backgroundColor: getMarkerColorByCuisine(
                        selectedRestaurant.cuisineType
                      ),
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {selectedRestaurant.cuisineType}
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
                    {selectedRestaurant.priceRange}
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
                  <span>{selectedRestaurant.address}</span>
                </div>

                {selectedRestaurant.phone && (
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
                      href={`tel:${selectedRestaurant.phone}`}
                      style={{ color: "#2563eb", textDecoration: "none" }}
                    >
                      {selectedRestaurant.phone}
                    </a>
                  </div>
                )}

                {selectedRestaurant.rating && (
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
                      {selectedRestaurant.rating.toFixed(1)}
                      {selectedRestaurant.reviewCount &&
                        ` (${selectedRestaurant.reviewCount}件)`}
                    </span>
                  </div>
                )}
              </div>

              {/* 説明 */}
              {selectedRestaurant.description && (
                <p
                  style={{
                    margin: "8px 0",
                    color: "#6b7280",
                    fontSize: "13px",
                    lineHeight: "1.4",
                  }}
                >
                  {selectedRestaurant.description}
                </p>
              )}

              {/* 特徴 */}
              {selectedRestaurant.features &&
                selectedRestaurant.features.length > 0 && (
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
                      {selectedRestaurant.features
                        .slice(0, 6)
                        .map((feature, index) => (
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
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
