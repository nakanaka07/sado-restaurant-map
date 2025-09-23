/**
 * 🎯 useOfflineMarkers - PWAオフライン機能統合
 *
 * Phase 4 Week 4: オフライン時のマーカー表示最適化
 * Service Workerとの連携・キャッシュ戦略・軽量表示
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Restaurant } from "../types";

/**
 * オフライン状態の詳細情報
 */
interface OfflineState {
  /** オフライン状態かどうか */
  isOffline: boolean;
  /** 最後にオンラインだった時刻 */
  lastOnlineTime: number | null;
  /** 接続状態の変更回数 */
  connectionChanges: number;
  /** 推定接続品質 */
  connectionQuality: "good" | "poor" | "offline";
}

/**
 * オフラインマーカー設定
 */
interface OfflineMarkerConfig {
  /** キャッシュするマーカーの最大数 */
  readonly maxCachedMarkers: number;
  /** オフライン時の表示簡素化レベル */
  readonly simplificationLevel: "minimal" | "reduced" | "full";
  /** 位置情報に基づく優先キャッシュ */
  readonly enableLocationPriority: boolean;
  /** デバッグモード */
  readonly debugMode: boolean;
}

/**
 * 軽量化されたレストラン情報（オフライン用）
 */
interface LightweightRestaurant {
  readonly id: string;
  readonly name: string;
  readonly coordinates: { lat: number; lng: number };
  readonly cuisineType: string;
  readonly district: string;
  readonly rating?: number;
  readonly isOfflineMode: boolean;
  readonly cachedAt: number;
}

/**
 * PWAオフラインマーカー管理Hook
 */
export const useOfflineMarkers = (
  restaurants: Restaurant[],
  userLocation?: { lat: number; lng: number },
  config?: Partial<OfflineMarkerConfig>
) => {
  // 設定のデフォルト値（安定化のため useMemo でラップ）
  const finalConfig = useMemo<OfflineMarkerConfig>(
    () => ({
      maxCachedMarkers: 100,
      simplificationLevel: "reduced",
      enableLocationPriority: true,
      debugMode: process.env.NODE_ENV === "development",
      ...config,
    }),
    [config]
  );

  // オフライン状態管理
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOffline: !navigator.onLine,
    lastOnlineTime: navigator.onLine ? Date.now() : null,
    connectionChanges: 0,
    connectionQuality: navigator.onLine ? "good" : "offline",
  });

  // キャッシュされたマーカー管理
  const [cachedMarkers, setCachedMarkers] = useState<LightweightRestaurant[]>(
    []
  );

  /**
   * レストランデータの軽量化
   */
  const createLightweightRestaurant = useCallback(
    (restaurant: Restaurant): LightweightRestaurant => {
      return {
        id: restaurant.id,
        name: restaurant.name,
        coordinates: restaurant.coordinates,
        cuisineType: restaurant.cuisineType,
        district: restaurant.district,
        ...(restaurant.rating && { rating: restaurant.rating }),
        isOfflineMode: true,
        cachedAt: Date.now(),
      };
    },
    []
  );

  /**
   * ユーザー位置からの距離計算
   */
  const calculateDistanceFromUser = useCallback(
    (restaurantCoords: { lat: number; lng: number }): number => {
      if (!userLocation) return Infinity;

      const R = 6371; // 地球の半径（km）
      const dLat = ((restaurantCoords.lat - userLocation.lat) * Math.PI) / 180;
      const dLng = ((restaurantCoords.lng - userLocation.lng) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocation.lat * Math.PI) / 180) *
          Math.cos((restaurantCoords.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [userLocation]
  );

  /**
   * 優先度に基づくレストランソート
   */
  const sortRestaurantsByPriority = useCallback(
    (restaurants: Restaurant[]): Restaurant[] => {
      return [...restaurants].sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // 評価スコア
        if (a.rating) scoreA += a.rating * 10;
        if (b.rating) scoreB += b.rating * 10;

        // レビュー数スコア
        if (a.reviewCount) scoreA += Math.min(a.reviewCount / 5, 20);
        if (b.reviewCount) scoreB += Math.min(b.reviewCount / 5, 20);

        // 位置優先度（有効時）
        if (finalConfig.enableLocationPriority && userLocation) {
          const distanceA = calculateDistanceFromUser(a.coordinates);
          const distanceB = calculateDistanceFromUser(b.coordinates);

          // 近い方が優先（距離逆数を使用）
          if (distanceA < Infinity) scoreA += 50 / (distanceA + 1);
          if (distanceB < Infinity) scoreB += 50 / (distanceB + 1);
        }

        return scoreB - scoreA;
      });
    },
    [
      finalConfig.enableLocationPriority,
      userLocation,
      calculateDistanceFromUser,
    ]
  );

  /**
   * マーカーキャッシュ更新
   */
  const updateMarkerCache = useCallback(async () => {
    try {
      // 優先度順にソート
      const prioritizedRestaurants = sortRestaurantsByPriority([
        ...restaurants,
      ]);

      // 最大数まで軽量化してキャッシュ
      const lightweightMarkers = prioritizedRestaurants
        .slice(0, finalConfig.maxCachedMarkers)
        .map(createLightweightRestaurant);

      setCachedMarkers(lightweightMarkers);

      // Service Workerでのキャッシュストレージ（利用可能な場合）
      if ("serviceWorker" in navigator && "caches" in window) {
        const cache = await caches.open("sado-restaurant-markers-v1");
        const cacheData = {
          markers: lightweightMarkers,
          timestamp: Date.now(),
          userLocation: userLocation,
        };

        await cache.put(
          "/cached-markers.json",
          new Response(JSON.stringify(cacheData), {
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      if (finalConfig.debugMode) {
        console.log("📦 Offline markers cached:", {
          total: restaurants.length,
          cached: lightweightMarkers.length,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn("⚠️ Failed to update marker cache:", error);
    }
  }, [
    restaurants,
    sortRestaurantsByPriority,
    finalConfig,
    userLocation,
    createLightweightRestaurant,
  ]);

  /**
   * キャッシュからマーカー読み込み
   */
  const loadCachedMarkers = useCallback(async (): Promise<
    LightweightRestaurant[]
  > => {
    try {
      // Service Workerキャッシュから読み込み
      if ("caches" in window) {
        const cache = await caches.open("sado-restaurant-markers-v1");
        const cachedResponse = await cache.match("/cached-markers.json");

        if (cachedResponse) {
          const raw = (await cachedResponse.json()) as unknown;
          const cacheData =
            typeof raw === "object" && raw !== null
              ? (raw as Record<string, unknown>)
              : {};

          const cachedMarkers = Array.isArray(cacheData.markers)
            ? (cacheData.markers as LightweightRestaurant[])
            : [];

          const timestamp =
            typeof cacheData.timestamp === "number" ? cacheData.timestamp : 0;

          // キャッシュの有効性チェック（24時間以内）
          const isValidCache =
            timestamp > 0 && Date.now() - timestamp < 24 * 60 * 60 * 1000;

          if (isValidCache && cachedMarkers.length > 0) {
            if (finalConfig.debugMode) {
              console.log("📂 Loaded cached markers:", {
                count: cachedMarkers.length,
                cacheAge: Math.round((Date.now() - timestamp) / 60000),
              });
            }
            return cachedMarkers;
          }
        }
      }

      return [];
    } catch (error) {
      console.warn("⚠️ Failed to load cached markers:", error);
      return [];
    }
  }, [finalConfig.debugMode]);

  /**
   * オンライン/オフライン状態監視
   */
  useEffect(() => {
    const handleOnline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOffline: false,
        lastOnlineTime: Date.now(),
        connectionChanges: prev.connectionChanges + 1,
        connectionQuality: "good",
      }));

      // オンライン復帰時にキャッシュ更新
      void updateMarkerCache();

      if (finalConfig.debugMode) {
        console.log("🌐 Connection restored - updating marker cache");
      }
    };

    const handleOffline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOffline: true,
        connectionChanges: prev.connectionChanges + 1,
        connectionQuality: "offline",
      }));

      if (finalConfig.debugMode) {
        console.log("📵 Connection lost - using cached markers");
      }
    };

    // 接続品質の簡易推定
    const estimateConnectionQuality = () => {
      if (!navigator.onLine) return;

      const connection = (
        navigator as unknown as {
          connection?: { effectiveType?: string };
        }
      ).connection;

      const effectiveType = connection?.effectiveType;
      if (effectiveType) {
        const quality = effectiveType === "4g" ? "good" : "poor";
        setOfflineState(prev => ({
          ...prev,
          connectionQuality: quality,
        }));
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 初回キャッシュ更新
    if (navigator.onLine) {
      void updateMarkerCache();
    } else {
      void loadCachedMarkers().then(setCachedMarkers);
    }

    // 接続品質監視（サポートされている場合）
    estimateConnectionQuality();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updateMarkerCache, loadCachedMarkers, finalConfig.debugMode]);

  /**
   * 表示用マーカーデータの取得
   */
  const getDisplayMarkers = useMemo(() => {
    if (offlineState.isOffline) {
      // オフライン時：キャッシュされた軽量マーカーを返す
      return cachedMarkers.map(marker => ({
        ...marker,
        // 簡素化レベルに応じた情報制限
        ...(finalConfig.simplificationLevel === "minimal" && {
          rating: undefined,
        }),
      }));
    } else {
      // オンライン時：通常のレストランデータ
      return restaurants;
    }
  }, [
    offlineState.isOffline,
    cachedMarkers,
    restaurants,
    finalConfig.simplificationLevel,
  ]);

  /**
   * オフライン統計情報
   */
  const getOfflineStats = useCallback(() => {
    return {
      isOffline: offlineState.isOffline,
      connectionQuality: offlineState.connectionQuality,
      cachedMarkersCount: cachedMarkers.length,
      lastOnlineTime: offlineState.lastOnlineTime,
      connectionChanges: offlineState.connectionChanges,
      cacheSize: finalConfig.maxCachedMarkers,
    };
  }, [offlineState, cachedMarkers, finalConfig]);

  /**
   * 手動キャッシュ更新
   */
  const refreshCache = useCallback(() => {
    if (navigator.onLine) {
      return updateMarkerCache();
    } else {
      console.warn("Cannot refresh cache while offline");
      return Promise.resolve();
    }
  }, [updateMarkerCache]);

  return {
    // データ
    markers: getDisplayMarkers,
    offlineState,

    // 統計・状態
    getOfflineStats,
    isOffline: offlineState.isOffline,

    // 制御
    refreshCache,

    // 設定
    config: finalConfig,
  };
};

/**
 * 軽量版オフラインHook
 */
export const useSimpleOfflineMarkers = (restaurants: Restaurant[]) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOffline,
    markers: isOffline
      ? restaurants.slice(0, 50).map(r => ({ ...r, isOfflineMode: true }))
      : restaurants,
  };
};

export default useOfflineMarkers;
