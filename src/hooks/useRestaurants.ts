/**
 * 佐渡飲食店データ管理Hook
 * React 19 + Concurrent Features + TypeScript 5.7対応
 */

import { useState, useCallback, useMemo, startTransition } from "react";
import type { Restaurant, MapFilters, SortOrder, AsyncState } from "@/types";

// モックデータ（開発用）
const MOCK_RESTAURANTS: readonly Restaurant[] = [
  {
    id: "1",
    name: "海鮮市場 金太",
    description: "佐渡の新鮮な海の幸を味わえる海鮮料理店",
    cuisineType: "海鮮",
    priceRange: "2000-3000円",
    address: "新潟県佐渡市両津湊119",
    phone: "0259-27-5938",
    coordinates: { lat: 38.0463, lng: 138.4348 },
    rating: 4.2,
    reviewCount: 85,
    openingHours: [
      { day: "月-日", open: "11:00", close: "21:00", isHoliday: false },
    ],
    features: ["駐車場あり", "団体利用可", "個室あり"],
    lastUpdated: "2025-07-10",
  },
  {
    id: "2",
    name: "そば処 竹の子",
    description: "佐渡の水で打つ手打ちそばが自慢",
    cuisineType: "そば・うどん",
    priceRange: "1000-2000円",
    address: "新潟県佐渡市小木町1956",
    coordinates: { lat: 37.7567, lng: 138.2871 },
    rating: 4.5,
    reviewCount: 123,
    openingHours: [
      { day: "火-日", open: "11:30", close: "20:00", isHoliday: false },
      { day: "月", open: "", close: "", isHoliday: true },
    ],
    features: ["テラス席", "禁煙", "手打ちそば"],
    lastUpdated: "2025-07-10",
  },
] as const;

interface UseRestaurantsResult {
  readonly restaurants: readonly Restaurant[];
  readonly filteredRestaurants: readonly Restaurant[];
  readonly selectedRestaurant: Restaurant | null;
  readonly asyncState: AsyncState<readonly Restaurant[]>;
  readonly setFilters: (filters: Partial<MapFilters>) => void;
  readonly setSortOrder: (order: SortOrder) => void;
  readonly selectRestaurant: (restaurant: Restaurant | null) => void;
  readonly refreshData: () => Promise<void>;
}

/**
 * 飲食店データを管理するHook
 * React 19のConcurrent Featuresを活用した最適化実装
 */
export function useRestaurants(
  initialFilters: MapFilters = {
    cuisineTypes: [],
    priceRanges: [],
    features: [],
    searchQuery: "",
  }
): UseRestaurantsResult {
  const [restaurants, setRestaurants] =
    useState<readonly Restaurant[]>(MOCK_RESTAURANTS);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [filters, setInternalFilters] = useState<MapFilters>(initialFilters);
  const [sortOrder, setSortOrder] = useState<SortOrder>("name");
  const [asyncState, setAsyncState] = useState<
    AsyncState<readonly Restaurant[]>
  >({
    data: MOCK_RESTAURANTS,
    loading: false,
    error: null,
  });

  // フィルタリング・ソート処理（メモ化）
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants.slice();

    // 料理ジャンルフィルター
    if (filters.cuisineTypes.length > 0) {
      filtered = filtered.filter((restaurant) =>
        filters.cuisineTypes.includes(restaurant.cuisineType)
      );
    }

    // 価格帯フィルター
    if (filters.priceRanges.length > 0) {
      filtered = filtered.filter((restaurant) =>
        filters.priceRanges.includes(restaurant.priceRange)
      );
    }

    // 特徴フィルター
    if (filters.features.length > 0) {
      filtered = filtered.filter((restaurant) =>
        filters.features.some((feature) =>
          restaurant.features.includes(feature)
        )
      );
    }

    // 検索クエリフィルター
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(query) ||
          restaurant.description?.toLowerCase().includes(query) ||
          restaurant.address.toLowerCase().includes(query)
      );
    }

    // 距離フィルター（現在地が設定されている場合）
    if (filters.currentLocation && filters.radius) {
      filtered = filtered.filter((restaurant) => {
        const distance = calculateDistance(
          filters.currentLocation as { lat: number; lng: number },
          restaurant.coordinates
        );
        return distance <= (filters.radius as number);
      });
    }

    // ソート
    return sortRestaurants(filtered, sortOrder);
  }, [restaurants, filters, sortOrder]);

  // フィルター更新（React 19 startTransition使用）
  const setFilters = useCallback((newFilters: Partial<MapFilters>) => {
    startTransition(() => {
      setInternalFilters((prev) => ({ ...prev, ...newFilters }));
    });
  }, []);

  // 選択された飲食店の更新
  const selectRestaurant = useCallback((restaurant: Restaurant | null) => {
    setSelectedRestaurant(restaurant);
  }, []);

  // データ更新（将来的にAPI連携）
  const refreshData = useCallback(async () => {
    setAsyncState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 将来的にGoogle Sheets APIやその他のAPIから取得
      // const data = await fetchRestaurantData()
      await new Promise((resolve) => setTimeout(resolve, 500)); // モック遅延

      setRestaurants(MOCK_RESTAURANTS);
      setAsyncState({
        data: MOCK_RESTAURANTS,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "データの取得に失敗しました";
      setAsyncState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  return {
    restaurants,
    filteredRestaurants,
    selectedRestaurant,
    asyncState,
    setFilters,
    setSortOrder,
    selectRestaurant,
    refreshData,
  };
}

// ==============================
// ユーティリティ関数
// ==============================

/**
 * 2点間の距離を計算（Haversine公式）
 */
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // 地球の半径（km）
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 飲食店リストをソート
 */
function sortRestaurants(
  restaurants: readonly Restaurant[],
  sortOrder: SortOrder
): readonly Restaurant[] {
  const sorted = restaurants.slice();

  switch (sortOrder) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "ja"));

    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    case "priceRange":
      return sorted.sort((a, b) => {
        const priceOrder = [
          "～1000円",
          "1000-2000円",
          "2000-3000円",
          "3000円～",
        ];
        return (
          priceOrder.indexOf(a.priceRange) - priceOrder.indexOf(b.priceRange)
        );
      });

    case "distance":
      // 距離ソートは現在地が必要（未実装）
      return sorted;

    default:
      return sorted;
  }
}
