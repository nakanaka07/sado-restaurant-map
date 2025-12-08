/**
 * @fileoverview マーカー表示最適化Hook
 * 大量マーカーの効率的な管理とパフォーマンス向上
 * Phase 9: チャンク処理とキャッシュによる最適化
 */

import type { Restaurant } from "@/types";
import { processInChunksSync } from "@/utils/performanceUtils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Phase 4: ClusterMarker統合
import type { ClusterData } from "@/components/map/markers/clusterUtils";

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
  /** Phase 4: クラスタリング有効化フラグ */
  readonly enableClustering: boolean;
  /** Phase 4: クラスタリング最小件数 */
  readonly clusteringMinCount: number;
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
  /** Phase 4: クラスター統計 */
  readonly clusterCount: number;
  readonly averageClusterSize: number;
}

/**
 * マーカー最適化Hook
 */
export const useMarkerOptimization = (
  restaurants: readonly Restaurant[],
  viewportBounds?: ViewportBounds,
  config: Partial<MarkerOptimizationConfig> = {}
) => {
  // config を JSON 文字列化して安定した依存関係を作成
  const configKey = JSON.stringify(config);

  // finalConfigをuseMemo化して依存関係を安定化
  const finalConfig = useMemo(() => {
    const defaultConfig: MarkerOptimizationConfig = {
      maxVisibleMarkers: 500,
      clusteringDistance: 50,
      virtualizationThreshold: 1000,
      debugMode: process.env.NODE_ENV === "development",
      enableClustering: true, // Phase 4: デフォルトでクラスタリング有効
      clusteringMinCount: 2, // Phase 4: 2軒以上でクラスタリング
    };
    return { ...defaultConfig, ...config };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  // パフォーマンス統計
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    totalMarkers: 0,
    visibleMarkers: 0,
    clusteredMarkers: 0,
    renderTime: 0,
    lastUpdate: Date.now(),
    clusterCount: 0,
    averageClusterSize: 0,
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
   * Phase 9: チャンク処理で最適化（100件ずつ処理）
   */
  const filterByViewport = useCallback(
    (restaurants: readonly Restaurant[], bounds?: ViewportBounds) => {
      if (!bounds) return restaurants;

      // Phase 9: 100件ずつチャンク処理
      return processInChunksSync(restaurants, 100, restaurant => {
        const { lat, lng } = restaurant.coordinates;
        const isInViewport =
          lat >= bounds.south &&
          lat <= bounds.north &&
          lng >= bounds.west &&
          lng <= bounds.east;
        return isInViewport ? restaurant : null;
      }).filter((r): r is Restaurant => r !== null);
    },
    []
  );

  /**
   * 優先度計算キャッシュ
   * Phase 9: 同一レストランの再計算を防ぐ
   */
  const priorityCache = useRef(new Map<string, number>());

  /**
   * マーカーの優先度計算
   * Phase 9: キャッシュによる最適化
   */
  const calculatePriority = useCallback((restaurant: Restaurant): number => {
    // キャッシュチェック
    const cached = priorityCache.current.get(restaurant.id);
    if (cached !== undefined) {
      return cached;
    }

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

    // キャッシュに保存
    priorityCache.current.set(restaurant.id, priority);

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
   * ピクセル単位距離計算（簡易版）
   */
  const calculatePixelDistance = useCallback(
    (
      coord1: { lat: number; lng: number },
      coord2: { lat: number; lng: number },
      zoomLevel: number
    ): number => {
      const pixelsPerDegree = (256 * Math.pow(2, zoomLevel)) / 360;
      const deltaLat = Math.abs(coord1.lat - coord2.lat) * pixelsPerDegree;
      const deltaLng =
        Math.abs(coord1.lng - coord2.lng) *
        pixelsPerDegree *
        Math.cos((coord1.lat * Math.PI) / 180);
      return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
    },
    []
  );

  /**
   * Phase 4: クラスタリング機能
   */
  const generateClusters = useCallback(
    (restaurants: Restaurant[], zoomLevel: number = 10): ClusterData[] => {
      if (
        !finalConfig.enableClustering ||
        restaurants.length < finalConfig.clusteringMinCount
      ) {
        return [];
      }

      const clusters: ClusterData[] = [];
      const processed = new Set<string>();
      const adjustedDistance =
        (finalConfig.clusteringDistance * (21 - zoomLevel)) / 21;

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

        // クラスターサイズが最小件数以上の場合のみ作成
        if (clusterRestaurants.length >= finalConfig.clusteringMinCount) {
          // クラスター中心計算
          const centerLat =
            clusterRestaurants.reduce((sum, r) => sum + r.coordinates.lat, 0) /
            clusterRestaurants.length;
          const centerLng =
            clusterRestaurants.reduce((sum, r) => sum + r.coordinates.lng, 0) /
            clusterRestaurants.length;

          clusters.push({
            id: `cluster-${restaurant.id}-${clusterRestaurants.length}`,
            count: clusterRestaurants.length,
            restaurants: clusterRestaurants,
            position: { lat: centerLat, lng: centerLng },
            bounds: {
              north: Math.max(
                ...clusterRestaurants.map(r => r.coordinates.lat)
              ),
              south: Math.min(
                ...clusterRestaurants.map(r => r.coordinates.lat)
              ),
              east: Math.max(...clusterRestaurants.map(r => r.coordinates.lng)),
              west: Math.min(...clusterRestaurants.map(r => r.coordinates.lng)),
            },
          });
        }
      });

      return clusters;
    },
    [
      finalConfig.enableClustering,
      finalConfig.clusteringMinCount,
      finalConfig.clusteringDistance,
      calculatePixelDistance,
    ]
  );

  /**
   * 最適化されたマーカーの生成
   */
  const optimizedResult = useMemo(() => {
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

    // Step 5: Phase 4 - クラスタリング生成
    const clusters = generateClusters(
      limitedRestaurants.map(item => item.restaurant),
      viewportBounds?.zoom || 10
    );

    // Step 6: 最適化されたマーカーオブジェクト生成
    const optimized: OptimizedMarker[] = limitedRestaurants.map(
      ({ restaurant, priority }) => ({
        id: `marker-${restaurant.id}`,
        restaurant,
        priority,
        isVisible: true,
        clustered: false,
      })
    );

    // パフォーマンス統計計算（state更新はuseEffect内で行う）
    const renderTime = performance.now() - renderStartTime.current;
    const clusterCount = clusters.length;
    const averageClusterSize =
      clusterCount > 0
        ? clusters.reduce((sum, cluster) => sum + cluster.count, 0) /
          clusterCount
        : 0;

    const stats: PerformanceStats = {
      totalMarkers: restaurants.length,
      visibleMarkers: optimized.length,
      clusteredMarkers: clusters.reduce(
        (sum, cluster) => sum + cluster.count,
        0
      ),
      renderTime,
      lastUpdate: Date.now(),
      clusterCount,
      averageClusterSize,
    };

    if (finalConfig.debugMode) {
      const isNearLimit = optimized.length >= 40; // API制限50の80%
      const warningStyle = isNearLimit ? "⚠️" : "🎯";

      console.log(`${warningStyle} Marker Optimization Stats:`, {
        total: restaurants.length,
        valid: validRestaurants.length,
        inViewport: viewportRestaurants.length,
        displayed: optimized.length,
        clusters: clusterCount,
        averageClusterSize: averageClusterSize.toFixed(1),
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

    return { optimized, clusters, stats };
  }, [
    restaurants,
    viewportBounds,
    finalConfig.maxVisibleMarkers,
    finalConfig.debugMode,
    isValidCoordinates,
    filterByViewport,
    calculatePriority,
    generateClusters,
  ]);

  const optimizedMarkers = optimizedResult.optimized;
  const clusters = optimizedResult.clusters;

  // パフォーマンス統計をuseEffect内で更新（useMemo外で安全に更新）
  // stats オブジェクトを JSON 文字列化して依存関係を安定化
  const statsKey = JSON.stringify(optimizedResult.stats);
  useEffect(() => {
    setPerformanceStats(optimizedResult.stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsKey]);

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
      clusterCount: 0,
      averageClusterSize: 0,
    });
  }, []);

  return {
    optimizedMarkers,
    clusters, // Phase 4: クラスターデータを追加
    performanceStats,
    config: finalConfig,
    resetOptimization,
    // ユーティリティ関数
    isValidCoordinates,
    calculateDistance,
    // Phase 4: クラスタリング関数
    generateClusters,
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
