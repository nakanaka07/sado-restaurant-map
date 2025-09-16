/**
 * 🎯 ClusterMarker - マーカークラスター表示コンポーネント
 *
 * Phase 4: 密集マーカーの効率的な表示・ユーザビリティ向上
 * 数に応じた動的サイズ調整・グラデーション・アニメーション効果
 */

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React, { useCallback, useMemo } from "react";
import type { Restaurant } from "../../../types";

/**
 * クラスターマーカープロパティ
 */
interface ClusterMarkerProps {
  /** クラスター内レストラン数 */
  count: number;
  /** クラスター内のレストラン一覧 */
  restaurants: Restaurant[];
  /** クラスター中心位置 */
  position: { lat: number; lng: number };
  /** クリックハンドラー */
  onClick: () => void;
  /** ズームレベル（サイズ調整用） */
  zoomLevel?: number;
  /** アクセシビリティラベル */
  ariaLabel?: string;
}

/**
 * クラスターサイズ・色彩設定
 */
const getClusterConfig = (count: number, zoomLevel: number = 10) => {
  // ズームレベルに応じたベースサイズ
  const baseSize = Math.max(32, Math.min(64, 20 + zoomLevel * 2));

  // レストラン数に応じたサイズ調整（対数スケール）
  const sizeMultiplier = 1 + Math.log(count) * 0.15;
  const size = Math.min(80, baseSize * sizeMultiplier);

  // 数に応じたグラデーション色彩
  let gradientColors: { start: string; end: string };

  if (count < 3) {
    // 小クラスター: 緑系
    gradientColors = { start: "#4CAF50", end: "#2E7D32" };
  } else if (count < 8) {
    // 中クラスター: 青系
    gradientColors = { start: "#2196F3", end: "#1565C0" };
  } else if (count < 15) {
    // 大クラスター: オレンジ系
    gradientColors = { start: "#FF9800", end: "#E65100" };
  } else {
    // 特大クラスター: 紫系
    gradientColors = { start: "#9C27B0", end: "#4A148C" };
  }

  return { size, gradientColors };
};

/**
 * PhaseMarkerコンポーネント
 */
export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  count,
  restaurants,
  position,
  onClick,
  zoomLevel = 10,
  ariaLabel,
}) => {
  // クラスター設定の計算（メモ化）
  const { size, gradientColors } = useMemo(
    () => getClusterConfig(count, zoomLevel),
    [count, zoomLevel]
  );

  // カテゴリ分析（メモ化）
  const categoryAnalysis = useMemo(() => {
    const categoryCounts = restaurants.reduce(
      (acc, restaurant) => {
        const cuisineType = restaurant.cuisineType || "一般";
        acc[cuisineType] = (acc[cuisineType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const categoryKeys = Object.keys(categoryCounts);
    const topCuisineType =
      categoryKeys.length > 0
        ? categoryKeys.reduce(
            (a, b) => (categoryCounts[a] > categoryCounts[b] ? a : b),
            categoryKeys[0]
          ) // 初期値を追加
        : "一般"; // デフォルトカテゴリ

    return { categoryCounts, topCuisineType };
  }, [restaurants]);

  // クリックハンドラー
  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      e.stop();
      onClick();
    },
    [onClick]
  );

  // キーボードハンドラー
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  // アクセシビリティラベル生成
  const defaultAriaLabel = `${count}軒のレストランクラスター。主なカテゴリ: ${categoryAnalysis.topCuisineType}。クリックして詳細表示。`;

  return (
    <AdvancedMarker position={position} onClick={handleClick}>
      <div
        className="cluster-marker"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${gradientColors.start} 0%, ${gradientColors.end} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
          border: "3px solid rgba(255, 255, 255, 0.4)",
          position: "relative",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          zIndex: 1000,
        }}
        tabIndex={0}
        role="button"
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel || defaultAriaLabel}
      >
        {/* メイン数字表示 */}
        <div
          style={{
            fontSize: Math.max(12, Math.min(20, size * 0.25)),
            lineHeight: 1,
            marginBottom: count >= 100 ? "2px" : "0px",
          }}
        >
          {count}
        </div>

        {/* 小さな軒数表示 */}
        <div
          style={{
            fontSize: Math.max(8, Math.min(12, size * 0.15)),
            opacity: 0.9,
            fontWeight: "500",
          }}
        >
          軒
        </div>

        {/* ホバー時の詳細情報 */}
        <div
          className="cluster-tooltip"
          style={{
            position: "absolute",
            bottom: `-${size * 0.15 + 16}px`,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "white",
            padding: "6px 10px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            opacity: 0,
            transition: "opacity 0.3s ease-in-out",
            pointerEvents: "none",
            zIndex: 1001,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          {count}軒 - 主に{categoryAnalysis.topCuisineType}
          <div
            style={{
              position: "absolute",
              top: "-4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: "4px solid rgba(0, 0, 0, 0.9)",
            }}
          />
        </div>

        {/* Phase 4: 改善されたスタイル */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* クラスターマーカーのホバー効果 */
          .cluster-marker:hover {
            transform: scale(1.15) rotate(5deg);
            box-shadow:
              0 6px 24px rgba(0, 0, 0, 0.4),
              0 0 0 6px rgba(255, 255, 255, 0.3);
            filter: brightness(1.1) saturate(1.1);
          }

          /* ツールチップ表示 */
          .cluster-marker:hover .cluster-tooltip {
            opacity: 1;
          }

          /* アクティブ状態 */
          .cluster-marker:active {
            transform: scale(1.05) rotate(2deg);
            transition: all 0.1s ease-out;
          }

          /* フォーカス状態（アクセシビリティ） */
          .cluster-marker:focus {
            outline: 3px solid #4A90E2;
            outline-offset: 4px;
            box-shadow:
              0 4px 16px rgba(0, 0, 0, 0.3),
              0 0 0 6px rgba(74, 144, 226, 0.4);
          }

          /* パルスアニメーション（注目時） */
          .cluster-marker.attention {
            animation: cluster-pulse 2s ease-in-out infinite;
          }

          @keyframes cluster-pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.08);
              opacity: 0.85;
            }
          }

          /* 呼吸アニメーション（軽微） */
          .cluster-marker.breathe {
            animation: cluster-breathe 3s ease-in-out infinite;
          }

          @keyframes cluster-breathe {
            0%, 100% {
              transform: scale(1);
              filter: brightness(1) saturate(1);
            }
            50% {
              transform: scale(1.03);
              filter: brightness(1.05) saturate(1.05);
            }
          }
          `,
          }}
        />
      </div>
    </AdvancedMarker>
  );
};

/**
 * クラスター生成ヘルパー関数
 */
export interface ClusterData {
  id: string;
  count: number;
  restaurants: Restaurant[];
  position: { lat: number; lng: number };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * レストラン配列からクラスターデータを生成
 */
export const generateClusters = (
  restaurants: Restaurant[],
  clusterDistance: number = 50, // ピクセル単位
  zoomLevel: number = 10
): ClusterData[] => {
  // ズームレベルに応じた距離調整
  const adjustedDistance = (clusterDistance * (21 - zoomLevel)) / 21;

  const clusters: ClusterData[] = [];
  const processed = new Set<string>();

  restaurants.forEach(restaurant => {
    if (processed.has(restaurant.id)) return;

    const clusterRestaurants = [restaurant];
    processed.add(restaurant.id);

    // 近接レストラン検索
    restaurants.forEach(otherRestaurant => {
      if (processed.has(otherRestaurant.id)) return;

      const distance = calculatePixelDistance(
        restaurant.coordinates,
        otherRestaurant.coordinates,
        zoomLevel
      );

      if (distance < adjustedDistance) {
        clusterRestaurants.push(otherRestaurant);
        processed.add(otherRestaurant.id);
      }
    });

    // クラスター中心計算
    const centerLat =
      clusterRestaurants.reduce((sum, r) => sum + r.coordinates.lat, 0) /
      clusterRestaurants.length;
    const centerLng =
      clusterRestaurants.reduce((sum, r) => sum + r.coordinates.lng, 0) /
      clusterRestaurants.length;

    // 境界計算
    const bounds = clusterRestaurants.reduce(
      (bounds, r) => ({
        north: Math.max(bounds.north, r.coordinates.lat),
        south: Math.min(bounds.south, r.coordinates.lat),
        east: Math.max(bounds.east, r.coordinates.lng),
        west: Math.min(bounds.west, r.coordinates.lng),
      }),
      {
        north: -90,
        south: 90,
        east: -180,
        west: 180,
      }
    );

    clusters.push({
      id: `cluster-${restaurant.id}-${clusterRestaurants.length}`,
      count: clusterRestaurants.length,
      restaurants: clusterRestaurants,
      position: { lat: centerLat, lng: centerLng },
      bounds,
    });
  });

  return clusters;
};

/**
 * ピクセル単位距離計算（簡易版）
 */
const calculatePixelDistance = (
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number },
  zoomLevel: number
): number => {
  // ズームレベルに基づくピクセル変換係数
  const pixelsPerDegree = (256 * Math.pow(2, zoomLevel)) / 360;

  const deltaLat = Math.abs(coord1.lat - coord2.lat) * pixelsPerDegree;
  const deltaLng =
    Math.abs(coord1.lng - coord2.lng) *
    pixelsPerDegree *
    Math.cos((coord1.lat * Math.PI) / 180);

  return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
};

export default ClusterMarker;
