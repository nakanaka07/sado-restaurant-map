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
  // EnhancedMapContainer と整合するローカル型
  type LocalMarkerType = "circular-icooon" | "unified-marker";
  const [markerType, setMarkerType] = useState<LocalMarkerType | null>(null);
  const [isUserOverride, setIsUserOverride] = useState(false);
  const [isABTestInfoCollapsed, setIsABTestInfoCollapsed] = useState(false);

  const deriveLocalMarkerType = useCallback(
    (_variant: ABTestVariant): LocalMarkerType => {
      // 現状は Circular に統一。将来の段階で分岐する可能性あり。
      return "circular-icooon";
    },
    []
  );

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
        // 初期 markerType を variant から導出
        const initialMarker = deriveLocalMarkerType(classification.variant);
        setMarkerType(initialMarker);

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
        setMarkerType(deriveLocalMarkerType("original"));
      }
    };

    initializeABTest();
  }, [userId, forceVariant, deriveLocalMarkerType]);

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
  // 開発環境では常にテストパネルを表示、本番環境では統計パネル・テストUI一切無効化
  const shouldUseTestingMode = import.meta.env.DEV;

  // マーカータイプがまだ未設定 (分類直後) の場合はローディング表示
  if (!markerType) {
    return (
      <div className="map-loading">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>🧪</div>
          <p style={{ color: "#6c757d" }}>マーカータイプ初期化中...</p>
        </div>
      </div>
    );
  }

  return (
    <MapErrorBoundary>
      {/**
       * 仕様簡素化: 常に EnhancedMapContainer を使用し、パネル表示有無で挙動制御。
       * 本番ではユーザー変更を許さないため showSelectionPanel = shouldUseTestingMode
       */}
      <EnhancedMapContainer
        mapPoints={mapPoints}
        center={center}
        mapId={mapId}
        selectedPoint={selectedPoint}
        onMarkerClick={handleMarkerClick}
        onCloseInfoWindow={handleCloseInfoWindow}
        // 新規 props (後でコンポーネント側に追加予定)
        initialMarkerType={markerType}
        showSelectionPanel={shouldUseTestingMode}
        onMarkerTypeChange={next => {
          setMarkerType(next);
          // override 判定: variant 由来 marker と異なる場合
          const derived = deriveLocalMarkerType(currentVariant);
          const overridden = derived !== next;
          setIsUserOverride(overridden);
          if (overridden) {
            trackABTestEvent("override_marker_type", {
              variant: currentVariant,
              segment: userClassification.segment,
              phase: CURRENT_AB_TEST_CONFIG.currentPhase,
              metadata: { from: derived, to: next },
            });
          }
        }}
      />

      {/* カスタムコントロールをテストモードでも表示 */}
      {shouldUseTestingMode && customControls && (
        <div className="test-mode-custom-controls">{customControls}</div>
      )}

      {/* A/Bテスト情報表示（開発環境のみ） */}
      {import.meta.env.DEV && (
        <button
          type="button"
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1001,
            background: isUserOverride
              ? "linear-gradient(90deg,#ff9800,#f57c00)"
              : "rgba(0,0,0,0.8)",
            color: "white",
            padding: "6px 10px", // 少しコンパクトに
            borderRadius: "6px",
            fontSize: "11px", // 少し小さく
            fontFamily: "monospace",
            boxShadow: isUserOverride
              ? "0 0 0 2px #ff9800 inset,0 4px 12px rgba(0,0,0,0.35)"
              : "0 2px 6px rgba(0,0,0,0.3)",
            transition: "all 0.2s ease",
            backdropFilter: "blur(4px)", // ぼかし効果追加
            cursor: "pointer",
            border: "none", // ボタンのデフォルトボーダーを削除
          }}
          onClick={() => setIsABTestInfoCollapsed(!isABTestInfoCollapsed)}
          aria-label={
            isUserOverride
              ? "A/B割当とは異なるマーカータイプがユーザーにより上書きされています。クリックして詳細表示を切り替え"
              : "A/Bテスト現在の状態。クリックして詳細表示を切り替え"
          }
        >
          {isABTestInfoCollapsed ? (
            "🧪"
          ) : (
            <>
              🧪 A/B: {currentVariant} | 👤 {userClassification.segment} | 🎯{" "}
              {CURRENT_AB_TEST_CONFIG.currentPhase} | 🗺 {markerType}
              {isUserOverride && "* (override)"}
              {shouldUseTestingMode && " | 🔬 TEST"}
            </>
          )}
        </button>
      )}
    </MapErrorBoundary>
  );
}

export default IntegratedMapView;
