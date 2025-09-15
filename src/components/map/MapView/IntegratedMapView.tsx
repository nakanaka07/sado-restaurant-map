/**
 * @fileoverview Integrated MapView with A/B Testing
 * A/Bテスト統合MapViewコンポーネント
 *
 * 🎯 機能:
 * - 自動ユーザー分類とバリアント選択
 * - 段階的ロールアウト対応
 * - テストモード動的切り替え
 * - パフォーマンス監視
 */

import type { MapPoint } from "@/types";
import { trackMapInteraction, trackRestaurantClick } from "@/utils/analytics";
import { ReactNode, useCallback, useEffect, useState } from "react";
import {
  type ABTestVariant,
  classifyUser,
  CURRENT_AB_TEST_CONFIG,
  loadABTestState,
  saveABTestState,
  trackABTestEvent,
  type UserClassification,
} from "../../../config/abTestConfig";
import { EnhancedMapContainer } from "./EnhancedMapContainer";
import { MapContainer } from "./MapContainer";
import { MapErrorBoundary } from "./MapErrorBoundary";
import { MapErrorFallback } from "./MapErrorFallback";

interface IntegratedMapViewProps {
  readonly mapPoints: readonly MapPoint[];
  readonly center: { lat: number; lng: number };
  readonly loading: boolean;
  readonly error?: string | null;
  readonly customControls?: ReactNode;
  readonly userId?: string; // ユーザー識別用（任意）
  readonly forceVariant?: ABTestVariant; // 開発者用強制設定
}

/**
 * A/Bテスト統合MapViewコンポーネント
 * ユーザー分類に基づいて適切なマーカーシステムを表示
 */
export function IntegratedMapView({
  mapPoints,
  center,
  loading,
  error,
  customControls,
  userId,
  forceVariant,
}: IntegratedMapViewProps) {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [userClassification, setUserClassification] =
    useState<UserClassification | null>(null);
  const [currentVariant, setCurrentVariant] =
    useState<ABTestVariant>("original");
  const [isTestingModeActive, setIsTestingModeActive] = useState(false);

  // ユーザー分類の実行
  useEffect(() => {
    const initializeABTest = () => {
      try {
        // まず保存済み状態をチェック
        let classification = loadABTestState();

        // 保存済み状態がない、または強制バリアント指定がある場合は新規分類
        if (!classification || forceVariant) {
          const config = forceVariant
            ? { ...CURRENT_AB_TEST_CONFIG, forceVariant }
            : CURRENT_AB_TEST_CONFIG;

          classification = classifyUser(userId, config);
          saveABTestState(classification);

          // A/Bテスト割り当てイベント記録
          trackABTestEvent("assigned", {
            variant: classification.variant,
            segment: classification.segment,
            phase: CURRENT_AB_TEST_CONFIG.currentPhase,
            metadata: {
              isNewAssignment: true,
              forceVariant: !!forceVariant,
            },
          });
        }

        setUserClassification(classification);
        setCurrentVariant(classification.variant);

        // テストモードの可否を設定
        setIsTestingModeActive(
          classification.testingModeAvailable &&
            classification.variant === "testing"
        );

        // 開発環境での分類結果表示
        if (import.meta.env.DEV) {
          console.log("🧪 A/B Test Classification:", {
            classification,
            config: CURRENT_AB_TEST_CONFIG,
            testingModeActive: classification.testingModeAvailable,
          });
        }
      } catch (error) {
        console.error("A/Bテスト初期化エラー:", error);
        // エラー時はデフォルト設定を使用
        const fallbackClassification = {
          segment: "control" as const,
          variant: "original" as const,
          isInTest: false,
          testingModeAvailable: false,
        };
        setUserClassification(fallbackClassification);
        setCurrentVariant("original");
        setIsTestingModeActive(false);
      }
    };

    initializeABTest();
  }, [userId, forceVariant]);

  // マーカークリックハンドラー（A/Bテストイベント追加）
  const handleMarkerClick = useCallback(
    (point: MapPoint) => {
      setSelectedPoint(point);

      // 既存の分析追跡
      if (point.type === "restaurant" && "cuisineType" in point) {
        trackRestaurantClick({
          id: point.id,
          name: point.name,
          category: point.cuisineType,
          priceRange: point.priceRange || "不明",
        });
      }

      // 地図インタラクション分析
      trackMapInteraction("marker_click");

      // A/Bテストインタラクションイベント
      if (userClassification) {
        trackABTestEvent("interaction", {
          variant: currentVariant,
          segment: userClassification.segment,
          phase: CURRENT_AB_TEST_CONFIG.currentPhase,
          metadata: {
            interactionType: "marker_click",
            pointType: point.type,
            pointId: point.id,
          },
        });
      }
    },
    [userClassification, currentVariant]
  );

  // InfoWindow閉じるハンドラー
  const handleCloseInfoWindow = useCallback(() => {
    setSelectedPoint(null);
  }, []);

  // ローディング状態
  if (loading) {
    return (
      <div className="map-loading">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔄</div>
          <p style={{ color: "#6c757d" }}>地図を読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー状態またはMap ID未設定
  if (error || !mapId) {
    return <MapErrorFallback mapId={mapId} error={error || null} />;
  }

  // A/Bテスト分類待ち
  if (!userClassification) {
    return (
      <div className="map-loading">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>⚙️</div>
          <p style={{ color: "#6c757d" }}>マーカーシステムを初期化中...</p>
        </div>
      </div>
    );
  }

  // テストモードが有効な場合はEnhancedMapContainerを使用
  const shouldUseTestingMode =
    isTestingModeActive ||
    (userClassification.testingModeAvailable && import.meta.env.DEV);

  return (
    <MapErrorBoundary>
      {shouldUseTestingMode ? (
        <EnhancedMapContainer
          mapPoints={mapPoints}
          center={center}
          mapId={mapId}
          selectedPoint={selectedPoint}
          onMarkerClick={handleMarkerClick}
          onCloseInfoWindow={handleCloseInfoWindow}
        />
      ) : (
        <MapContainer
          mapPoints={mapPoints}
          center={center}
          mapId={mapId}
          selectedPoint={selectedPoint}
          onMarkerClick={handleMarkerClick}
          onCloseInfoWindow={handleCloseInfoWindow}
          customControls={customControls}
        />
      )}

      {/* カスタムコントロールをテストモードでも表示 */}
      {shouldUseTestingMode && customControls && (
        <div className="test-mode-custom-controls">{customControls}</div>
      )}

      {/* A/Bテスト情報表示（開発環境のみ） */}
      {import.meta.env.DEV && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1001,
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontFamily: "monospace",
          }}
        >
          🧪 A/B: {currentVariant} | 👤 {userClassification.segment} | 🎯{" "}
          {CURRENT_AB_TEST_CONFIG.currentPhase}
          {shouldUseTestingMode && " | 🔬 TEST"}
        </div>
      )}
    </MapErrorBoundary>
  );
}

export default IntegratedMapView;
