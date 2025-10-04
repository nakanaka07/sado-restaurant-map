/**
 * 🎯 useOfflineMarkers - PWAオフライン機能統合
 *
 * Phase 4 Week 4: オフライン時のマーカー表示最適化
 * Service Workerとの連携・キャッシュ戦略・軽量表示
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Restaurant } from "../types";

// -----------------------------
// Module-level helpers to keep hook body small
// -----------------------------

const EARTH_RADIUS_KM = 6371;

function createLightweightRestaurantSimple(restaurant: Restaurant) {
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
}

function calculateDistanceForCoords(
  restaurantCoords: { lat: number; lng: number },
  userLocation?: { lat: number; lng: number }
): number {
  if (!userLocation) return Infinity;

  const dLat = ((restaurantCoords.lat - userLocation.lat) * Math.PI) / 180;
  const dLng = ((restaurantCoords.lng - userLocation.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLocation.lat * Math.PI) / 180) *
      Math.cos((restaurantCoords.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function sortRestaurantsByPrioritySimple(
  restaurants: Restaurant[],
  opts: {
    enableLocationPriority: boolean;
    userLocation?: { lat: number; lng: number };
    calculateDistanceFromUser: (coords: { lat: number; lng: number }) => number;
  }
) {
  const { enableLocationPriority, userLocation, calculateDistanceFromUser } =
    opts;

  return [...restaurants].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.rating) scoreA += a.rating * 10;
    if (b.rating) scoreB += b.rating * 10;

    if (a.reviewCount) scoreA += Math.min(a.reviewCount / 5, 20);
    if (b.reviewCount) scoreB += Math.min(b.reviewCount / 5, 20);

    if (enableLocationPriority && userLocation) {
      const distanceA = calculateDistanceFromUser(a.coordinates);
      const distanceB = calculateDistanceFromUser(b.coordinates);

      if (distanceA < Infinity) scoreA += 50 / (distanceA + 1);
      if (distanceB < Infinity) scoreB += 50 / (distanceB + 1);
    }

    return scoreB - scoreA;
  });
}

async function writeMarkersToCache(
  lightweightMarkers: LightweightRestaurant[],
  userLocation?: { lat: number; lng: number }
) {
  if ("serviceWorker" in navigator && "caches" in window) {
    const cache = await caches.open("sado-restaurant-markers-v1");
    const cacheData = {
      markers: lightweightMarkers,
      timestamp: Date.now(),
      userLocation,
    };

    await cache.put(
      "/cached-markers.json",
      new Response(JSON.stringify(cacheData), {
        headers: { "Content-Type": "application/json" },
      })
    );
  }
}

async function loadCachedMarkersFromCacheSimple(debugMode = false) {
  try {
    if (!("caches" in window)) return [];

    const cache = await caches.open("sado-restaurant-markers-v1");
    const cachedResponse = await cache.match("/cached-markers.json");
    if (!cachedResponse) return [];

    const raw = (await cachedResponse.json()) as unknown;
    const { cachedMarkers, timestamp } = parseCachedData(raw);

    const isValidCache =
      timestamp > 0 && Date.now() - timestamp < 24 * 60 * 60 * 1000;
    if (isValidCache && cachedMarkers.length > 0) {
      if (debugMode) {
        console.log("📂 Loaded cached markers:", {
          count: cachedMarkers.length,
          cacheAge: Math.round((Date.now() - timestamp) / 60000),
        });
      }
      return cachedMarkers;
    }

    return [];
  } catch (error) {
    console.warn("⚠️ Failed to load cached markers:", error);
    return [];
  }
}

function parseCachedData(raw: unknown): {
  cachedMarkers: LightweightRestaurant[];
  timestamp: number;
} {
  const cacheData =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  const cachedMarkers = Array.isArray(cacheData.markers)
    ? (cacheData.markers as LightweightRestaurant[])
    : [];
  const timestamp =
    typeof cacheData.timestamp === "number" ? cacheData.timestamp : 0;

  return { cachedMarkers, timestamp };
}

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
  // For maintainability, heavy computations are delegated to module-level helpers
  const createLightweightRestaurant = useCallback(
    (r: Restaurant) => createLightweightRestaurantSimple(r),
    []
  );

  const calculateDistanceFromUser = useCallback(
    (coords: { lat: number; lng: number }) =>
      calculateDistanceForCoords(coords, userLocation),
    [userLocation]
  );

  const sortRestaurantsByPriority = useCallback(
    (rs: Restaurant[]) =>
      (() => {
        const opts: {
          enableLocationPriority: boolean;
          calculateDistanceFromUser: (coords: {
            lat: number;
            lng: number;
          }) => number;
          userLocation?: { lat: number; lng: number };
        } = {
          enableLocationPriority: finalConfig.enableLocationPriority,
          calculateDistanceFromUser,
        };

        if (userLocation) {
          opts.userLocation = userLocation;
        }

        return sortRestaurantsByPrioritySimple(rs, opts);
      })(),
    [
      finalConfig.enableLocationPriority,
      userLocation,
      calculateDistanceFromUser,
    ]
  );

  const updateMarkerCache = useCallback(async () => {
    try {
      const prioritizedRestaurants = sortRestaurantsByPriority([
        ...restaurants,
      ]);

      const lightweightMarkers = prioritizedRestaurants
        .slice(0, finalConfig.maxCachedMarkers)
        .map(createLightweightRestaurant);

      setCachedMarkers(lightweightMarkers);

      await writeMarkersToCache(lightweightMarkers, userLocation);

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
  const loadCachedMarkers = useCallback(
    async (): Promise<LightweightRestaurant[]> =>
      loadCachedMarkersFromCacheSimple(finalConfig.debugMode),
    [finalConfig.debugMode]
  );

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

export default useOfflineMarkers;
