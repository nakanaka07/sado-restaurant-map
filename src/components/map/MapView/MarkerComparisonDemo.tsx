/**
 * @fileoverview Marker Comparison Demo Component
 * マーカー比較デモ - 改善前後の比較表示
 */

import type { MapPoint } from "@/types";
import React, { useState } from "react";
import { EnhancedPNGMarker } from "./EnhancedPNGMarker";
import { MapMarker } from "./MapMarker";
import { SVGMarkerSystem } from "./SVGMarkerSystem";

interface MarkerComparisonDemoProps {
  readonly points: MapPoint[];
  readonly onMarkerClick: (point: MapPoint) => void;
}

type MarkerType = "original" | "enhanced-png" | "svg";

/**
 * マーカー比較デモコンポーネント
 * 3つのマーカータイプを切り替えて比較できる
 */
export function MarkerComparisonDemo({
  points,
  onMarkerClick,
}: MarkerComparisonDemoProps) {
  const [selectedMarkerType, setSelectedMarkerType] =
    useState<MarkerType>("enhanced-png");

  // サンプルポイントを作成（実際のデータがない場合）
  const samplePoints: MapPoint[] = React.useMemo(() => {
    if (points.length > 0) return points.slice(0, 5); // 最初の5件のみ表示

    // サンプルデータ
    return [
      {
        id: "sample-restaurant-1",
        type: "restaurant",
        name: "サンプル寿司店",
        cuisineType: "寿司",
        priceRange: "2000-3000円",
        district: "両津",
        address: "新潟県佐渡市両津港",
        coordinates: { lat: 38.0484, lng: 138.4344 },
        rating: 4.5,
        reviewCount: 25,
        openingHours: [],
        features: ["新鮮な海鮮", "地元食材"],
        lastUpdated: "2025-08-26",
      },
      {
        id: "sample-restaurant-2",
        type: "restaurant",
        name: "サンプルラーメン店",
        cuisineType: "ラーメン",
        priceRange: "～1000円",
        district: "相川",
        address: "新潟県佐渡市相川",
        coordinates: { lat: 38.0684, lng: 138.4144 },
        rating: 4.2,
        reviewCount: 18,
        openingHours: [],
        features: ["濃厚スープ", "手作り麺"],
        lastUpdated: "2025-08-26",
      },
      {
        id: "sample-parking-1",
        type: "parking",
        name: "サンプル駐車場",
        district: "佐和田",
        address: "新潟県佐渡市佐和田",
        coordinates: { lat: 38.0384, lng: 138.4544 },
        capacity: 50,
        fee: "無料",
        openingHours: [],
        features: ["24時間利用可", "大型車対応"],
        lastUpdated: "2025-08-26",
      },
      {
        id: "sample-toilet-1",
        type: "toilet",
        name: "サンプル公衆トイレ",
        district: "金井",
        address: "新潟県佐渡市金井",
        coordinates: { lat: 38.0284, lng: 138.4744 },
        openingHours: [],
        features: ["車椅子対応", "おむつ交換台"],
        lastUpdated: "2025-08-26",
      },
    ] as MapPoint[];
  }, [points]);

  // マーカーコンポーネントを選択
  const renderMarker = (point: MapPoint, index: number) => {
    const key = `${selectedMarkerType}-${point.id}-${index}`;

    switch (selectedMarkerType) {
      case "original":
        return <MapMarker key={key} point={point} onClick={onMarkerClick} />;
      case "enhanced-png":
        return (
          <EnhancedPNGMarker key={key} point={point} onClick={onMarkerClick} />
        );
      case "svg":
        return (
          <SVGMarkerSystem key={key} point={point} onClick={onMarkerClick} />
        );
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* マーカータイプ選択UI */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          background: "white",
          borderRadius: "8px",
          padding: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          minWidth: "280px",
        }}
      >
        <h3
          style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: "bold" }}
        >
          マーカータイプ比較
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="markerType"
              value="original"
              checked={selectedMarkerType === "original"}
              onChange={e =>
                setSelectedMarkerType(e.target.value as MarkerType)
              }
            />
            <span>オリジナル (35px, Pin)</span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="markerType"
              value="enhanced-png"
              checked={selectedMarkerType === "enhanced-png"}
              onChange={e =>
                setSelectedMarkerType(e.target.value as MarkerType)
              }
            />
            <span>改良PNG (48px, グラデーション)</span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="markerType"
              value="svg"
              checked={selectedMarkerType === "svg"}
              onChange={e =>
                setSelectedMarkerType(e.target.value as MarkerType)
              }
            />
            <span>SVGマーカー (スケーラブル)</span>
          </label>
        </div>

        {/* マーカータイプの説明 */}
        <div style={{ marginTop: "12px", fontSize: "12px", color: "#666" }}>
          {selectedMarkerType === "original" && (
            <p>現在のピンマーカー (35px, 絵文字使用)</p>
          )}
          {selectedMarkerType === "enhanced-png" && (
            <p>Phase 1: 37%大型化、グラデーション背景、既存PNG活用</p>
          )}
          {selectedMarkerType === "svg" && (
            <p>Phase 2: 無限スケーラブル、軽量、動的カスタマイズ</p>
          )}
        </div>
      </div>

      {/* マーカー表示エリア */}
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {samplePoints.map((point, index) => renderMarker(point, index))}
      </div>

      {/* 統計情報 */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          background: "white",
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: "12px",
          minWidth: "200px",
        }}
      >
        <h4 style={{ margin: "0 0 8px", fontSize: "14px" }}>
          表示中のマーカー
        </h4>
        <p style={{ margin: "0" }}>
          レストラン: {samplePoints.filter(p => p.type === "restaurant").length}
          件<br />
          駐車場: {samplePoints.filter(p => p.type === "parking").length}件
          <br />
          トイレ: {samplePoints.filter(p => p.type === "toilet").length}件
        </p>
      </div>
    </div>
  );
}
