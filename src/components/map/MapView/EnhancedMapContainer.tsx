/**
 * @fileoverview Enhanced MapContainer with Marker Type Selection
 * マーカータイプ選択機能付きMapContainer
 */

import type { ABTestVariant } from "@/config/abTestConfig";
import { classifyUser } from "@/config/abTestConfig";
import type { MapPoint } from "@/types";
import { InfoWindow, Map } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MarkerVariant } from "../UnifiedMarker";
import { UnifiedMarker } from "../UnifiedMarker";
import { CircularMarkerContainer } from "./CircularMarkerContainer";
import { MapInfoWindow } from "./MapInfoWindow";

interface EnhancedMapContainerProps {
  readonly mapPoints: readonly MapPoint[];
  readonly center: { lat: number; lng: number };
  readonly mapId: string;
  readonly selectedPoint: MapPoint | null;
  readonly onMarkerClick: (point: MapPoint) => void;
  readonly onCloseInfoWindow: () => void;
  readonly initialMarkerType?: MarkerType; // 外部から初期値を注入
  readonly onMarkerTypeChange?: (markerType: MarkerType) => void; // 外部通知 (A/B同期)
  readonly showSelectionPanel?: boolean; // パネル表示制御（本番で非表示）
}

// UnifiedMarkerに統一、circular-icooonは互換性のため保持
type MarkerType = "circular-icooon" | "unified-marker";

/**
 * A/BテストvariantからUnifiedMarker variantへのマッピング
 */
function mapABTestVariantToMarkerVariant(
  abVariant: ABTestVariant
): MarkerVariant {
  const mapping: Record<ABTestVariant, MarkerVariant> = {
    original: "pin",
    "enhanced-png": "icon",
    svg: "svg",
    testing: "icon",
    "phase4-enhanced": "icon",
  };
  return mapping[abVariant];
}

/**
 * マーカータイプから表示名を取得
 */
function getMarkerTypeDisplayName(markerType: MarkerType): string {
  const displayNames: Record<MarkerType, string> = {
    "circular-icooon": "Circular ICOOON",
    "unified-marker": "UnifiedMarker",
  };
  return displayNames[markerType];
}

export function EnhancedMapContainer({
  mapPoints,
  center,
  mapId,
  selectedPoint,
  onMarkerClick,
  onCloseInfoWindow,
  initialMarkerType,
  onMarkerTypeChange,
  showSelectionPanel = true,
}: EnhancedMapContainerProps) {
  // 🧪 A/Bテスト: ユーザー分類とvariant決定
  const abTestClassification = useMemo(() => {
    return classifyUser();
  }, []);

  // 🎯 A/BテストからUnifiedMarker variantを導出
  const unifiedMarkerVariant = useMemo(
    () => mapABTestVariantToMarkerVariant(abTestClassification.variant),
    [abTestClassification.variant]
  );

  // 🔄 デフォルトMarkerType: initialMarkerType優先、次にA/Bテスト結果
  const defaultMarkerType = useMemo((): MarkerType => {
    if (initialMarkerType) {
      return initialMarkerType;
    }
    // A/Bテストが有効でテスト対象の場合はUnifiedMarkerを使用
    // (開発環境でのtestingModeAvailableチェックを含む)
    if (
      abTestClassification.testingModeAvailable &&
      abTestClassification.isInTest
    ) {
      return "unified-marker";
    }
    return "circular-icooon";
  }, [initialMarkerType, abTestClassification]);

  const [selectedMarkerType, setSelectedMarkerType] =
    useState<MarkerType>(defaultMarkerType);

  // 外部 initialMarkerType 変更を同期
  useEffect(() => {
    if (initialMarkerType && initialMarkerType !== selectedMarkerType) {
      setSelectedMarkerType(initialMarkerType);
    }
  }, [initialMarkerType, selectedMarkerType]);

  // エラー防止のためのクリックハンドラーをメモ化
  const handleMarkerClick = useCallback(
    (point: MapPoint) => {
      try {
        onMarkerClick(point);
      } catch (error) {
        console.error("マーカークリック時エラー:", error);
      }
    },
    [onMarkerClick]
  );

  const handleInfoWindowClose = useCallback(() => {
    try {
      onCloseInfoWindow();
    } catch (error) {
      console.error("InfoWindow閉じる時エラー:", error);
    }
  }, [onCloseInfoWindow]);

  // マーカーコンポーネントを選択 (UnifiedMarkerに統一)
  const renderMarker = useCallback(
    (point: MapPoint, index: number) => {
      const key = `${selectedMarkerType}-${point.id}-${index}`;

      switch (selectedMarkerType) {
        case "circular-icooon":
          return (
            <CircularMarkerContainer
              key={key}
              points={[point]}
              markerSize="medium"
              onPointClick={handleMarkerClick}
            />
          );
        case "unified-marker":
        default:
          return (
            <UnifiedMarker
              key={key}
              point={point}
              onClick={handleMarkerClick}
              variant={unifiedMarkerVariant}
              size="medium"
            />
          );
      }
    },
    [selectedMarkerType, handleMarkerClick, unifiedMarkerVariant]
  );

  return (
    <div
      className="map-container"
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* マーカータイプ選択パネル */}
      {showSelectionPanel && (
        <div
          style={{
            position: "absolute",
            top: "20px", // 元の位置に戻す
            left: "280px", // フィルターパネルの右側に配置
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.95)", // 半透明化
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            border: "1px solid #e0e0e0",
            minWidth: "280px",
            backdropFilter: "blur(8px)", // ぼかし効果
          }}
        >
          <h3
            style={{
              margin: "0 0 16px",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#333",
              borderBottom: "2px solid #f0f0f0",
              paddingBottom: "8px",
            }}
          >
            🗺️ マーカータイプ選択
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* CircularMarker ICOOON MONO Option */}
            <label
              htmlFor="marker-type-circular"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor:
                  selectedMarkerType === "circular-icooon"
                    ? "#f0f7ff"
                    : "transparent",
                border:
                  selectedMarkerType === "circular-icooon"
                    ? "2px solid #2196f3"
                    : "2px solid transparent",
                transition: "all 0.2s ease",
              }}
              aria-label="Circular ICOOON MONOマーカー を選択"
            >
              <input
                id="marker-type-circular"
                type="radio"
                name="markerType"
                value="circular-icooon"
                checked={selectedMarkerType === "circular-icooon"}
                onChange={e => {
                  const next = e.target.value as MarkerType;
                  setSelectedMarkerType(next);
                  onMarkerTypeChange?.(next);
                }}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                  Circular ICOOON ✨
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  日本製高品質SVG、アクセシブル
                </div>
              </div>
            </label>

            {/* UnifiedMarker Option (Phase 1完了) */}
            <label
              htmlFor="marker-type-unified"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor:
                  selectedMarkerType === "unified-marker"
                    ? "#f3e5f5"
                    : "transparent",
                border:
                  selectedMarkerType === "unified-marker"
                    ? "2px solid #9c27b0"
                    : "2px solid transparent",
                transition: "all 0.2s ease",
              }}
              aria-label="UnifiedMarkerを選択"
            >
              <input
                id="marker-type-unified"
                type="radio"
                name="markerType"
                value="unified-marker"
                checked={selectedMarkerType === "unified-marker"}
                onChange={e => {
                  const next = e.target.value as MarkerType;
                  setSelectedMarkerType(next);
                  onMarkerTypeChange?.(next);
                }}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                  UnifiedMarker 🚀 NEW
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Strategy Pattern統合実装
                </div>
              </div>
            </label>
          </div>

          {/* 現在の選択の説明 */}
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                marginBottom: "4px",
                color: "#495057",
              }}
            >
              現在の表示:
            </div>
            <div style={{ fontSize: "11px", color: "#6c757d" }}>
              {selectedMarkerType === "circular-icooon" &&
                "Circular ICOOON: ICOOON MONO統合、TypeScript完全対応、WCAG 2.2 AA準拠"}
              {selectedMarkerType === "unified-marker" &&
                `UnifiedMarker (推奨): variant=${unifiedMarkerVariant} (A/B: ${abTestClassification.segment})`}
            </div>
          </div>

          {/* A/Bテスト情報（開発環境のみ） */}
          {showSelectionPanel && abTestClassification.testingModeAvailable && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px",
                backgroundColor: "#fff3cd",
                borderRadius: "8px",
                border: "1px solid #ffc107",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  marginBottom: "6px",
                  color: "#856404",
                }}
              >
                🧪 A/Bテスト情報:
              </div>
              <div style={{ fontSize: "10px", color: "#856404" }}>
                <div>セグメント: {abTestClassification.segment}</div>
                <div>
                  バリアント: {abTestClassification.variant} → variant=
                  {unifiedMarkerVariant}
                </div>
                <div>
                  テスト参加:{" "}
                  {abTestClassification.isInTest ? "Yes ✓" : "No (Control)"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 統計情報パネル（開発/テスト環境のみ） */}
      {showSelectionPanel && (
        <div
          style={{
            position: "absolute",
            bottom: "80px", // マップコントロールと重ならないよう上に移動
            right: "20px",
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.95)", // 半透明化
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            border: "1px solid #e0e0e0",
            minWidth: "220px",
            backdropFilter: "blur(8px)", // ぼかし効果
          }}
        >
          <h4 style={{ margin: "0 0 12px", fontSize: "14px", color: "#333" }}>
            📊 表示中のマーカー
          </h4>
          <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.4" }}>
            <div>
              🍽️ レストラン:{" "}
              {mapPoints.filter(p => p.type === "restaurant").length}件
            </div>
            <div>
              🅿️ 駐車場: {mapPoints.filter(p => p.type === "parking").length}件
            </div>
            <div>
              🚻 トイレ: {mapPoints.filter(p => p.type === "toilet").length}件
            </div>
            <div
              style={{ marginTop: "8px", fontWeight: "bold", color: "#333" }}
            >
              合計: {mapPoints.length}件
            </div>
            <div style={{ marginTop: "6px", fontSize: "11px", color: "#999" }}>
              マーカー: {getMarkerTypeDisplayName(selectedMarkerType)}
            </div>
          </div>
        </div>
      )}

      {/* 地図本体 */}
      <Map
        defaultCenter={center}
        defaultZoom={11}
        mapTypeId="hybrid"
        mapId={mapId}
        style={{ width: "100%", height: "100%" }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={true}
        fullscreenControl={true}
        streetViewControl={true}
        zoomControl={true}
        mapTypeControlOptions={{
          position: window.google?.maps?.ControlPosition?.TOP_RIGHT || 1,
          style: window.google?.maps?.MapTypeControlStyle?.DROPDOWN_MENU || 1,
        }}
        zoomControlOptions={{
          position: window.google?.maps?.ControlPosition?.RIGHT_CENTER || 6,
        }}
        fullscreenControlOptions={{
          position: window.google?.maps?.ControlPosition?.TOP_RIGHT || 1,
        }}
        streetViewControlOptions={{
          position: window.google?.maps?.ControlPosition?.RIGHT_CENTER || 6,
        }}
      >
        {/* マーカー表示 */}
        {selectedMarkerType === "circular-icooon" ? (
          <CircularMarkerContainer
            points={[...mapPoints]}
            markerSize="medium"
            onPointClick={handleMarkerClick}
            showInfoWindow={!!selectedPoint}
            selectedPoint={selectedPoint}
            onInfoWindowClose={handleInfoWindowClose}
          />
        ) : (
          <>
            {mapPoints.map((point, index) => renderMarker(point, index))}
            {/* 選択されたポイントのInfoWindow */}
            {selectedPoint && (
              <InfoWindow
                position={selectedPoint.coordinates}
                onCloseClick={handleInfoWindowClose}
                maxWidth={400}
              >
                <MapInfoWindow point={selectedPoint} />
              </InfoWindow>
            )}
          </>
        )}
      </Map>
    </div>
  );
}
