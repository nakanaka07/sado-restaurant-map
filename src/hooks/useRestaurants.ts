/**
 * 佐渡飲食店データ管理Hook
 * React 19 + Concurrent Features + TypeScript 5.7対応
 * Google Sheets API統合版
 */

import {
  useState,
  useCallback,
  useMemo,
  startTransition,
  useEffect,
} from "react";
import type {
  Restaurant,
  MapFilters,
  SortOrder,
  AsyncState,
} from "../types/restaurant.types";
import {
  fetchRestaurantsFromSheets,
  checkDataFreshness,
  SheetsApiError,
} from "../services/sheetsService";

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
    coordinates: { lat: 38.018611, lng: 138.367222 }, // 佐渡島中心部
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
    coordinates: { lat: 37.9, lng: 138.25 }, // 佐渡島南部
    rating: 4.5,
    reviewCount: 123,
    openingHours: [
      { day: "火-日", open: "11:30", close: "20:00", isHoliday: false },
      { day: "月", open: "", close: "", isHoliday: true },
    ],
    features: ["テラス席", "禁煙", "手打ちそば", "テイクアウト可"],
    lastUpdated: "2025-07-10",
  },
  {
    id: "3",
    name: "佐渡カフェ",
    description: "佐渡の絶景を眺めながらゆったりできるカフェ",
    cuisineType: "カフェ・喫茶店",
    priceRange: "～1000円",
    address: "新潟県佐渡市両津夷269-1",
    phone: "0259-23-4567",
    coordinates: { lat: 38.05, lng: 138.38 }, // 佐渡島北東部
    rating: 4.3,
    reviewCount: 67,
    openingHours: [
      { day: "月-日", open: "9:00", close: "18:00", isHoliday: false },
    ],
    features: ["Wi-Fiあり", "テラス席", "駐車場あり", "禁煙", "テイクアウト可"],
    lastUpdated: "2025-07-10",
  },
  {
    id: "4",
    name: "寿司処 金峰",
    description: "佐渡近海の新鮮なネタが自慢の老舗寿司店",
    cuisineType: "寿司",
    priceRange: "3000円～",
    address: "新潟県佐渡市相川下戸村358",
    phone: "0259-74-2109",
    coordinates: { lat: 38.03, lng: 138.23 }, // 佐渡島西部（相川）
    rating: 4.6,
    reviewCount: 142,
    openingHours: [
      { day: "火-日", open: "17:00", close: "22:00", isHoliday: false },
      { day: "月", open: "", close: "", isHoliday: true },
    ],
    features: ["カウンター席", "個室あり", "予約可能"],
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
          restaurant.address.toLowerCase().includes(query) ||
          restaurant.cuisineType.toLowerCase().includes(query)
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

  // データ更新（Google Sheets API連携）
  const refreshData = useCallback(async () => {
    setAsyncState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // データ更新チェック
      const { needsUpdate } = await checkDataFreshness();

      // キャッシュされたデータがある場合はそれを使用
      const cachedData = localStorage.getItem("restaurantData");
      if (!needsUpdate && cachedData) {
        const parsedData = JSON.parse(cachedData) as Restaurant[];
        setRestaurants(parsedData);
        setAsyncState({
          data: parsedData,
          loading: false,
          error: null,
        });
        return;
      }

      // Google Sheets APIからデータ取得
      const data = await fetchRestaurantsFromSheets();

      // データをキャッシュ
      localStorage.setItem("restaurantData", JSON.stringify(data));
      localStorage.setItem("restaurantDataTimestamp", new Date().toISOString());

      setRestaurants(data);
      setAsyncState({
        data,
        loading: false,
        error: null,
      });
    } catch (error) {
      let errorMessage = "データの取得に失敗しました";

      if (error instanceof SheetsApiError) {
        errorMessage = `Google Sheets API エラー: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // フォールバック: キャッシュされたデータを使用
      const cachedData = localStorage.getItem("restaurantData");
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData) as Restaurant[];
          setRestaurants(parsedData);
          setAsyncState({
            data: parsedData,
            loading: false,
            error: `${errorMessage}（キャッシュデータを使用中）`,
          });
          return;
        } catch {
          // キャッシュデータも無効な場合はモックデータを使用
        }
      }

      // 最終フォールバック: モックデータ
      setRestaurants(MOCK_RESTAURANTS);
      setAsyncState({
        data: MOCK_RESTAURANTS,
        loading: false,
        error: `${errorMessage}（サンプルデータを表示中）`,
      });
    }
  }, []);

  // 初回データ読み込み
  useEffect(() => {
    void refreshData();
  }, [refreshData]);

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
