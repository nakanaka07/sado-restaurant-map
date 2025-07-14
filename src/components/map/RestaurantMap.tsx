import {
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { useState, useCallback } from "react";
import type { Restaurant } from "@/types";
import { trackRestaurantClick, trackMapInteraction } from "@/utils/analytics";

interface RestaurantMapProps {
  restaurants: readonly Restaurant[];
  center: { lat: number; lng: number };
  loading: boolean;
  error?: string | null;
}

export function RestaurantMap({
  restaurants,
  center,
  loading,
}: RestaurantMapProps) {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  // レストランマーカークリック時の処理
  const handleMarkerClick = useCallback((restaurant: Restaurant) => {
    console.log("マーカークリック:", restaurant.name); // デバッグ用ログ
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

    console.log("Analytics イベント送信完了"); // デバッグ用ログ
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
        {restaurants.map((restaurant) => (
          <AdvancedMarker
            key={restaurant.id}
            position={restaurant.coordinates}
            title={restaurant.name}
            onClick={() => handleMarkerClick(restaurant)}
          >
            <Pin
              background="#ff6b6b"
              borderColor="#fff"
              glyphColor="#fff"
              scale={1.2}
            />
          </AdvancedMarker>
        ))}

        {selectedRestaurant && (
          <InfoWindow
            position={selectedRestaurant.coordinates}
            onCloseClick={() => setSelectedRestaurant(null)}
          >
            <div style={{ padding: "12px", minWidth: "200px" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
                {selectedRestaurant.name}
              </h3>
              <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                📍 {selectedRestaurant.address}
              </p>
              <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                🍽️ {selectedRestaurant.cuisineType}
              </p>
              {selectedRestaurant.phone && (
                <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                  📞 {selectedRestaurant.phone}
                </p>
              )}
              <div
                style={{
                  marginTop: "8px",
                  padding: "4px 8px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: "#0369a1",
                }}
              >
                クリックして詳細を表示
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
