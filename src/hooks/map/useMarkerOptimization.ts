/**
 * @fileoverview マーカー表示最適化Hook
 * 大量マーカーの効率的な管理とパフォーマンス向上
 */

import type { Restaurant } from "@/types";
import { useCallback, useMemo, useRef, useState } from "react";

/**
 * マーカー最適化設定
 */
interface MarkerOptimizationConfig {
  /** 最大同時表示マーカー数 */
  readonly maxVisibleMarkers: number;
  /** クラスタリング最小距離（pixel） */
  readonly clusteringDistance: number;
  /** 仮想化しきい値 */
  readonly virtualizationThreshold: number;
  /** デバッグモード */
  readonly debugMode: boolean;
}

/**
 * ビューポート情報
 */
interface ViewportBounds {
  readonly north: number;
  readonly south: number;
  readonly east: number;
  readonly west: number;
  readonly zoom: number;
}

/**
 * 最適化されたマーカーデータ
 */
interface OptimizedMarker {
  readonly id: string;
  readonly restaurant: Restaurant;
  readonly priority: number;
  readonly isVisible: boolean;
  readonly clustered: boolean;
  readonly clusterSize?: number;
}

/**
 * パフォーマンス統計
 */
interface PerformanceStats {
  readonly totalMarkers: number;
  readonly visibleMarkers: number;
  readonly clusteredMarkers: number;
  readonly renderTime: number;
  readonly lastUpdate: number;
}

/**
 * マーカー最適化Hook
 */
export const useMarkerOptimization = (
  restaurants: readonly Restaurant[],
  viewportBounds?: ViewportBounds,
  config: Partial<MarkerOptimizationConfig> = {}
) => {
  // finalConfigをuseMemo化して依存関係を安定化
  const finalConfig = useMemo(() => {
    const defaultConfig: MarkerOptimizationConfig = {
      maxVisibleMarkers: 500,
      clusteringDistance: 50,
      virtualizationThreshold: 1000,
      debugMode: process.env.NODE_ENV === "development",
    };
    return { ...defaultConfig, ...config };
  }, [config]);

  // パフォーマンス統計
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    totalMarkers: 0,
    visibleMarkers: 0,
    clusteredMarkers: 0,
    renderTime: 0,
    lastUpdate: Date.now(),
  });

  // パフォーマンス測定用ref
  const renderStartTime = useRef<number>(0);

  /**
   * 座標の有効性チェック（最適化版）
   */
  const isValidCoordinates = useCallback(
    (lat: number, lng: number): boolean => {
      return (
        typeof lat === "number" &&
        typeof lng === "number" &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    },
    []
  );

  /**
   * ビューポート内のレストランをフィルタリング
   */
  const filterByViewport = useCallback(
    (restaurants: readonly Restaurant[], bounds?: ViewportBounds) => {
      if (!bounds) return restaurants;

      return restaurants.filter(restaurant => {
        const { lat, lng } = restaurant.coordinates;
        return (
          lat >= bounds.south &&
          lat <= bounds.north &&
          lng >= bounds.west &&
          lng <= bounds.east
        );
      });
    },
    []
  );

  /**
   * マーカーの優先度計算
   */
  const calculatePriority = useCallback((restaurant: Restaurant): number => {
    let priority = 0;

    // 評価による優先度
    if (restaurant.rating) {
      priority += restaurant.rating * 10;
    }

    // レビュー数による優先度
    if (restaurant.reviewCount) {
      priority += Math.min(restaurant.reviewCount / 10, 50);
    }

    // 価格帯による調整（手頃な価格を優先）
    const priceMultiplier: Record<string, number> = {
      "～1000円": 1.2,
      "1000-2000円": 1.1,
      "2000-3000円": 1.0,
      "3000円～": 0.9,
    };

    if (restaurant.priceRange) {
      priority *= priceMultiplier[restaurant.priceRange] || 1.0;
    }

    return priority;
  }, []);

  /**
   * 距離計算（Haversine公式の簡易版）
   */
  const calculateDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371; // 地球の半径（km）
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c * 1000; // メートルに変換
    },
    []
  );

  /**
   * 最適化されたマーカーの生成
   */
  const optimizedMarkers = useMemo(() => {
    renderStartTime.current = performance.now();

    // Step 1: 有効な座標のみをフィルタリング
    const validRestaurants = restaurants.filter(restaurant => {
      const { lat, lng } = restaurant.coordinates;
      return isValidCoordinates(lat, lng);
    });

    // Step 2: ビューポート内のレストランをフィルタリング
    const viewportRestaurants = filterByViewport(
      validRestaurants,
      viewportBounds
    );

    // Step 3: 優先度順にソート
    const prioritizedRestaurants = viewportRestaurants
      .map(restaurant => ({
        restaurant,
        priority: calculatePriority(restaurant),
      }))
      .sort((a, b) => b.priority - a.priority);

    // Step 4: 表示数制限適用
    const limitedRestaurants = prioritizedRestaurants.slice(
      0,
      finalConfig.maxVisibleMarkers
    );

    // Step 5: 最適化されたマーカーオブジェクト生成
    const optimized: OptimizedMarker[] = limitedRestaurants.map(
      ({ restaurant, priority }) => ({
        id: `marker-${restaurant.id}`,
        restaurant,
        priority,
        isVisible: true,
        clustered: false,
      })
    );

    // パフォーマンス統計更新
    const renderTime = performance.now() - renderStartTime.current;
    setPerformanceStats(prev => ({
      ...prev,
      totalMarkers: restaurants.length,
      visibleMarkers: optimized.length,
      clusteredMarkers: 0, // クラスタリング未実装
      renderTime,
      lastUpdate: Date.now(),
    }));

    if (finalConfig.debugMode) {
      const isNearLimit = optimized.length >= 40; // API制限50の80%
      const warningStyle = isNearLimit ? "⚠️" : "🎯";

      console.log(`${warningStyle} Marker Optimization Stats:`, {
        total: restaurants.length,
        valid: validRestaurants.length,
        inViewport: viewportRestaurants.length,
        displayed: optimized.length,
        renderTime: `${renderTime.toFixed(2)}ms`,
        ...(isNearLimit && {
          warning: "⚠️ Google Maps API制限(50個)に近づいています",
          apiLimit: "開発環境では1日50個までです",
        }),
      });

      // API制限警告
      if (restaurants.length > 50) {
        console.warn(
          "🚨 Google Maps API制限警告:",
          `全データ${restaurants.length}件中、開発環境では${optimized.length}件のみ表示しています。`,
          "本番環境では全件表示されます。"
        );
      }
    }

    return optimized;
  }, [
    restaurants,
    viewportBounds,
    finalConfig.maxVisibleMarkers,
    finalConfig.debugMode,
    isValidCoordinates,
    filterByViewport,
    calculatePriority,
  ]);

  /**
   * マーカーリセット関数
   */
  const resetOptimization = useCallback(() => {
    setPerformanceStats({
      totalMarkers: 0,
      visibleMarkers: 0,
      clusteredMarkers: 0,
      renderTime: 0,
      lastUpdate: Date.now(),
    });
  }, []);

  /**
   * 設定更新関数
   */
  const updateConfig = useCallback(
    (newConfig: Partial<MarkerOptimizationConfig>) => {
      Object.assign(finalConfig, newConfig);
    },
    [finalConfig]
  );

  return {
    optimizedMarkers,
    performanceStats,
    config: finalConfig,
    resetOptimization,
    updateConfig,
    // ユーティリティ関数
    isValidCoordinates,
    calculateDistance,
  };
};

/**
 * マーカー最適化Hook（軽量版）
 * シンプルな用途向け
 */
export const useSimpleMarkerOptimization = (
  restaurants: readonly Restaurant[],
  maxMarkers: number = 100
) => {
  return useMemo(() => {
    const validRestaurants = restaurants.filter(restaurant => {
      const { lat, lng } = restaurant.coordinates;
      return (
        typeof lat === "number" &&
        typeof lng === "number" &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    });

    return validRestaurants.slice(0, maxMarkers);
  }, [restaurants, maxMarkers]);
};
