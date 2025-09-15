import ABTestDashboard from "@/components/dashboard/ABTestDashboardSimple";
import {
  createMarkerInteraction,
  useABTestIntegration,
} from "@/hooks/map/useABTestIntegration";
import { useMapDebugging } from "@/hooks/map/useMapDebugging";
import { useSimpleMarkerOptimization } from "@/hooks/map/useMarkerOptimization";
import type { Restaurant } from "@/types";
import type { MigrationConfig } from "@/types/migration";
import { trackMapInteraction, trackRestaurantClick } from "@/utils/analytics";
import { Map } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapErrorBoundary } from "./MapErrorBoundary";
import { MarkerMigrationSystem } from "./migration/MarkerMigration";
import { OptimizedInfoWindow } from "./OptimizedInfoWindow";
import { OptimizedRestaurantMarker } from "./OptimizedRestaurantMarker";

interface RestaurantMapProps {
  readonly restaurants: readonly Restaurant[];
  readonly center: { lat: number; lng: number };
  readonly loading: boolean;
}

export default function RestaurantMap({
  restaurants,
  center,
  loading,
}: RestaurantMapProps) {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  // 🚀 高速化: 最適化されたマーカー表示
  const optimizedRestaurants = useSimpleMarkerOptimization(restaurants, 200);

  // 🧪 A/Bテスト: マーカーシステム移行設定
  const migrationConfig = useMemo(
    (): MigrationConfig => ({
      enabled: true, // 移行機能有効
      rolloutPercentage: 50, // Phase 2: 50%ロールアウト
      useNewSystemForced: false, // デバッグ用強制設定
      enableFallback: true, // フォールバック有効
      enablePerformanceMonitoring: true,
      enableUserFeedback: false, // 初期段階では無効
      debugMode: process.env.NODE_ENV === "development",
    }),
    []
  );

  // 🔄 移行判定: ユーザーIDベースの一貫した振り分け
  const shouldUseNewMarkerSystem = useMemo(() => {
    if (migrationConfig.useNewSystemForced !== undefined) {
      return migrationConfig.useNewSystemForced;
    }

    // ユーザーセッションベースの安定した振り分け
    const userSeed =
      sessionStorage.getItem("markerSystemSeed") ||
      String(Date.now() + Math.random());
    sessionStorage.setItem("markerSystemSeed", userSeed);

    const hash = userSeed.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) & 0x7fffffff;
    }, 0);

    return hash % 100 < migrationConfig.rolloutPercentage;
  }, [migrationConfig.rolloutPercentage, migrationConfig.useNewSystemForced]);

  // 📊 A/Bテスト統合: 分析・監視機能
  const abTestIntegration = useABTestIntegration({
    variant: shouldUseNewMarkerSystem ? "enhanced-png" : "original",
    segment: "general",
    enableTracking: true,
    enableDashboard: process.env.NODE_ENV === "development",
    debugMode: process.env.NODE_ENV === "development",
  });

  // 🔧 デバッグ: 開発者体験向上
  const debugging = useMapDebugging(restaurants, {
    trackPerformance: true,
    trackMemory: true,
  });

  // 🧠 メモ化: アナリティクス関数を最適化
  const trackingFunctions = useMemo(
    () => ({
      trackRestaurantClick: (restaurant: Restaurant) => {
        trackRestaurantClick({
          id: restaurant.id,
          name: restaurant.name,
          category: restaurant.cuisineType,
          priceRange: restaurant.priceRange,
        });
      },
      trackMapInteraction: () => {
        trackMapInteraction("marker_click");
      },
    }),
    []
  );

  // レストランマーカークリック時の処理（メモ化）
  const handleMarkerClick = useCallback(
    (restaurant: Restaurant) => {
      const startTime = performance.now();
      debugging.startPerformanceTimer("marker_click");

      setSelectedRestaurant(restaurant);
      trackingFunctions.trackRestaurantClick(restaurant);
      trackingFunctions.trackMapInteraction();

      // A/Bテストイベント追跡
      const renderTime = performance.now() - startTime;
      abTestIntegration.trackMarkerInteraction(
        createMarkerInteraction(restaurant, "click", renderTime)
      );

      debugging.endPerformanceTimer("marker_click", {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      });

      debugging.logEvent("marker_click", {
        restaurant: restaurant.name,
        cuisine: restaurant.cuisineType,
      });
    },
    [trackingFunctions, debugging, abTestIntegration]
  );

  // InfoWindow閉じるハンドラー（メモ化）
  const handleCloseInfoWindow = useCallback(() => {
    setSelectedRestaurant(null);
    debugging.logEvent("marker_click", { action: "close_info_window" });
  }, [debugging]);

  // パフォーマンス統計の更新
  useEffect(() => {
    debugging.updateDebugStats(
      optimizedRestaurants.length,
      optimizedRestaurants.length,
      0 // レンダリング時間は別途測定
    );
  }, [optimizedRestaurants.length, debugging]);

  if (loading) {
    return (
      <div className="map-loading" style={{ height: "500px" }}>
        <p>🗺️ 地図を読み込み中...</p>
      </div>
    );
  }

  if (!mapId) {
    return (
      <div className="map-error" style={{ height: "500px" }}>
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
            現在の値: <code>{mapId ?? "未設定"}</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <MapErrorBoundary
      onError={errorInfo => {
        debugging.logError(
          errorInfo.originalError || new Error(errorInfo.message),
          "RestaurantMap"
        );

        // A/Bテストエラー追跡
        abTestIntegration.trackError(
          errorInfo.originalError || new Error(errorInfo.message),
          "RestaurantMap"
        );
      }}
    >
      <div className="map-container">
        {/* 📊 A/Bテストダッシュボード（開発環境のみ） */}
        {abTestIntegration.isDashboardVisible && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.8)",
              zIndex: 2000,
              overflow: "auto",
            }}
          >
            <div
              style={{
                position: "relative",
                backgroundColor: "#ffffff",
                margin: "20px",
                borderRadius: "8px",
                maxHeight: "calc(100vh - 40px)",
                overflow: "auto",
              }}
            >
              <button
                onClick={abTestIntegration.toggleDashboard}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  zIndex: 2001,
                }}
              >
                × 閉じる
              </button>
              <ABTestDashboard />
            </div>
          </div>
        )}

        {/* 🎯 デバッグ情報表示（開発環境のみ） */}
        {process.env.NODE_ENV === "development" && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              zIndex: 1000,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "monospace",
              border: "1px solid #ddd",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div>
              📊 表示中: {optimizedRestaurants.length}/{restaurants.length}
            </div>
            <div>
              ⏱️ レンダリング: {debugging.debugStats.renderTime.toFixed(1)}ms
            </div>
            {debugging.debugStats.memoryUsage && (
              <div>
                💾 メモリ: {debugging.debugStats.memoryUsage.toFixed(1)}MB
              </div>
            )}
            <div>
              🎯 マーカー: {shouldUseNewMarkerSystem ? "v2(新)" : "v1(旧)"}
            </div>
            <div>
              📈 インタラクション: {abTestIntegration.totalInteractions}
            </div>
            <div>⏱️ セッション: {abTestIntegration.sessionDuration}秒</div>
            <button
              onClick={abTestIntegration.toggleDashboard}
              style={{
                marginTop: "4px",
                padding: "2px 6px",
                fontSize: "10px",
                border: "1px solid #ccc",
                borderRadius: "3px",
                background: "#f8f9fa",
                cursor: "pointer",
              }}
            >
              📊 ダッシュボード
            </button>
          </div>
        )}

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
          {/* 🎯 最適化されたマーカー表示 - A/Bテスト対応 */}
          {shouldUseNewMarkerSystem
            ? optimizedRestaurants.map(restaurant => (
                <MarkerMigrationSystem
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={handleMarkerClick}
                  config={migrationConfig}
                />
              ))
            : optimizedRestaurants.map(restaurant => (
                <OptimizedRestaurantMarker
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={handleMarkerClick}
                />
              ))}

          {selectedRestaurant && (
            <OptimizedInfoWindow
              restaurant={selectedRestaurant}
              onClose={handleCloseInfoWindow}
            />
          )}
        </Map>
      </div>
    </MapErrorBoundary>
  );
}

export { RestaurantMap };
