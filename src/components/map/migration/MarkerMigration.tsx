/**
 * @fileoverview マーカーシステム移行コンポーネント
 * レガシーシステムから新v2システムへの段階的移行管理
 *
 * 🎯 機能:
 * 1. A/Bテスト対応の段階的切り替え
 * 2. フォールバック機能付きエラーハンドリング
 * 3. パフォーマンス監視・レポート
 * 4. ユーザーフィードバック収集
 */

import type { Restaurant } from "@/types";
import type {
  MigrationConfig,
  MigrationState,
  PerformanceMetrics,
} from "@/types/migration";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { OptimizedRestaurantMarker } from "../legacy/OptimizedRestaurantMarker";
import { SVGMarkerTemplate } from "../legacy/templates/SVGMarkerTemplate";
import { createMarkerDesignConfig } from "../v2/MarkerDesignSystem";
import {
  migrateCuisineToCategory,
  type MigrationStatistics,
} from "./CategoryMapper";
import { useMigrationControl } from "./migrationUtils";

// ==============================
// メインマーカー移行コンポーネント
// ==============================

export interface MarkerMigrationSystemProps {
  readonly restaurant: Restaurant;
  readonly onClick: (restaurant: Restaurant) => void;
  readonly config: MigrationConfig;
  readonly className?: string;
  readonly onMigrationStateChange?: (state: MigrationState) => void;
  readonly onPerformanceMetric?: (metrics: PerformanceMetrics) => void;
}

export const MarkerMigrationSystem: React.FC<MarkerMigrationSystemProps> = ({
  restaurant,
  onClick,
  config,
  className,
  onMigrationStateChange,
  onPerformanceMetric,
}) => {
  const migrationControl = useMigrationControl(config);
  const [performanceData, setPerformanceData] = useState<{
    startTime: number;
    interactions: number;
  }>({
    startTime: performance.now(),
    interactions: 0,
  });

  // パフォーマンス測定
  useEffect(() => {
    if (!config.enablePerformanceMonitoring) return;

    const endTime = performance.now();
    const renderTime = endTime - performanceData.startTime;

    const memoryInfo = (
      performance as unknown as { memory?: { usedJSHeapSize: number } }
    ).memory;
    const memoryValue = memoryInfo?.usedJSHeapSize;
    const metrics: PerformanceMetrics = {
      renderTime,
      userInteractions: performanceData.interactions,
      ...(typeof memoryValue === "number" && {
        memoryUsage: Math.round(memoryValue / 1024 / 1024),
      }),
    };

    if (onPerformanceMetric) {
      onPerformanceMetric(metrics);
    }
  }, [
    migrationControl.isUsingNewSystem,
    performanceData,
    config.enablePerformanceMonitoring,
    onPerformanceMetric,
  ]);

  // 状態変更通知
  useEffect(() => {
    if (onMigrationStateChange) {
      onMigrationStateChange(migrationControl);
    }
  }, [migrationControl, onMigrationStateChange]);

  const handleClick = useCallback(() => {
    setPerformanceData(prev => ({
      ...prev,
      interactions: prev.interactions + 1,
    }));
    onClick(restaurant);
  }, [onClick, restaurant]);

  // エラー境界付きレンダリング
  const renderMarker = useCallback(() => {
    try {
      if (migrationControl.isUsingNewSystem) {
        // 新システム (v2)
        const category = migrateCuisineToCategory(restaurant.cuisineType);
        const markerConfig = createMarkerDesignConfig(category);

        return (
          <SVGMarkerTemplate
            config={markerConfig}
            size="standard"
            onClick={handleClick}
            className={`marker-v2 ${className || ""}`}
          />
        );
      } else {
        // レガシーシステム
        return (
          <OptimizedRestaurantMarker
            restaurant={restaurant}
            onClick={handleClick}
          />
        );
      }
    } catch (error) {
      migrationControl.reportIssue(`レンダリングエラー: ${String(error)}`);

      // フォールバック
      if (config.enableFallback && migrationControl.isUsingNewSystem) {
        console.warn(
          "[Marker Migration] フォールバック: レガシーシステムに切り替え"
        );
        return (
          <OptimizedRestaurantMarker
            restaurant={restaurant}
            onClick={handleClick}
          />
        );
      }

      // 最終フォールバック: シンプルマーカー
      return (
        <button
          type="button"
          style={{
            width: "24px",
            height: "30px",
            backgroundColor: "#ff6b6b",
            border: "none",
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            padding: 0,
          }}
          onClick={handleClick}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          aria-label={`${restaurant.name} - 簡略マーカー`}
          tabIndex={0}
        >
          📍
        </button>
      );
    }
  }, [
    migrationControl,
    restaurant,
    handleClick,
    className,
    config.enableFallback,
  ]);

  // デバッグ情報表示
  const debugInfo = config.debugMode && (
    <div
      style={{
        position: "absolute",
        top: "-40px",
        left: "0",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        whiteSpace: "nowrap",
        zIndex: 1001,
      }}
    >
      {migrationControl.isUsingNewSystem ? "v2" : "legacy"} |
      {performanceData.interactions}i |
      {Math.round(performance.now() - performanceData.startTime)}ms
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      {renderMarker()}
      {debugInfo}
      {/* エラー表示 */}
      {migrationControl.errors.length > 0 && config.debugMode && (
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "0",
            background: "#ff4444",
            color: "white",
            padding: "2px 4px",
            borderRadius: "2px",
            fontSize: "8px",
            maxWidth: "200px",
            zIndex: 1002,
          }}
        >
          {migrationControl.errors[migrationControl.errors.length - 1]}
        </div>
      )}
    </div>
  );
};

// ==============================
// 移行統計・監視コンポーネント
// ==============================

export interface MigrationDashboardProps {
  readonly config: MigrationConfig;
  readonly restaurants: Restaurant[];
  readonly onConfigChange: (config: MigrationConfig) => void;
}

export const MigrationDashboard: React.FC<MigrationDashboardProps> = ({
  config,
  restaurants,
  onConfigChange,
}) => {
  const [metrics] = useState<PerformanceMetrics[]>([
    { renderTime: 12, userInteractions: 5, memoryUsage: 25 },
    { renderTime: 15, userInteractions: 8, memoryUsage: 28 },
  ]);
  const [stats] = useState<MigrationStatistics | null>(null);

  // 統計計算
  useEffect(() => {
    // 移行統計を計算 (実装は CategoryMapper から)
    // 実際は calculateMigrationStats(restaurants) を呼び出し
  }, [restaurants]);

  const averageRenderTime = useMemo(() => {
    if (metrics.length === 0) return 0;
    return Math.round(
      metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length
    );
  }, [metrics]);

  if (!config.debugMode) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        minWidth: "300px",
        zIndex: 10000,
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
        🔄 マーカー移行ダッシュボード
      </h3>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={e =>
              onConfigChange({ ...config, enabled: e.target.checked })
            }
          />{" "}
          移行機能有効
        </label>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label
          style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}
        >
          ロールアウト率: {config.rolloutPercentage}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.rolloutPercentage}
          onChange={e =>
            onConfigChange({
              ...config,
              rolloutPercentage: Number(e.target.value),
            })
          }
          style={{ width: "100%" }}
        />
      </div>

      {stats && (
        <div style={{ fontSize: "12px", color: "#666" }}>
          <div>総レストラン数: {stats.totalRestaurants}</div>
          <div>統合率: {stats.consolidationRatio}%</div>
          <div>平均レンダリング時間: {averageRenderTime}ms</div>
        </div>
      )}

      <div style={{ marginTop: "12px" }}>
        <button
          onClick={() =>
            onConfigChange({
              ...config,
              useNewSystemForced: !config.useNewSystemForced,
            })
          }
          style={{
            padding: "4px 8px",
            fontSize: "11px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            background: config.useNewSystemForced ? "#007bff" : "white",
            color: config.useNewSystemForced ? "white" : "black",
            cursor: "pointer",
          }}
        >
          {config.useNewSystemForced ? "新システム固定" : "A/Bテスト"}
        </button>
      </div>
    </div>
  );
};
