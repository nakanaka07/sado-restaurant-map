/**
 * 統合マップポイント管理Hook（飲食店・駐車場・トイレ）
 * React 19 + Concurrent Features + TypeScript 5.7対応
 */

import {
  useState,
  useCallback,
  useMemo,
  startTransition,
  useEffect,
} from "react";
import type {
  MapPoint,
  ExtendedMapFilters,
  SortOrder,
  AsyncState,
} from "@/types";
import { fetchAllMapPoints, SheetsApiError } from "@/services";

// 初期フィルター設定
const INITIAL_FILTERS: ExtendedMapFilters = {
  cuisineTypes: [],
  priceRanges: [],
  districts: [],
  features: [],
  searchQuery: "",
  pointTypes: ["restaurant", "parking", "toilet"], // デフォルトで全て表示
  parkingFeatures: [],
  toiletFeatures: [],
};

/**
 * 統合マップポイント管理Hook
 */
export function useMapPoints() {
  // ステート管理
  const [state, setState] = useState<AsyncState<MapPoint[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const [filters, setFilters] = useState<ExtendedMapFilters>(INITIAL_FILTERS);
  const [sortOrder, setSortOrder] = useState<SortOrder>("name");

  /**
   * データ取得関数
   */
  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const mapPoints = await fetchAllMapPoints();

      startTransition(() => {
        setState({
          data: mapPoints,
          loading: false,
          error: null,
        });
      });

      console.log(`✅ 統合マップポイント取得完了: ${mapPoints.length}件`);
    } catch (error) {
      const errorMessage =
        error instanceof SheetsApiError
          ? `データベース接続エラー: ${error.message}`
          : `予期しないエラーが発生しました: ${
              error instanceof Error ? error.message : "Unknown error"
            }`;

      startTransition(() => {
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
      });

      console.error("統合マップポイント取得エラー:", error);
    }
  }, []);

  /**
   * 初期データ読み込み
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * フィルタリング処理
   */
  const filteredMapPoints = useMemo(() => {
    if (!state.data) return [];

    return state.data.filter((point) => {
      // ポイントタイプフィルター
      if (!filters.pointTypes.includes(point.type)) return false;

      // 地区フィルター
      if (
        filters.districts.length > 0 &&
        !filters.districts.includes(point.district)
      ) {
        return false;
      }

      // 検索クエリフィルター
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText =
          `${point.name} ${point.description} ${point.address}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // 飲食店固有のフィルター
      if (point.type === "restaurant") {
        // 料理ジャンルフィルター
        if (filters.cuisineTypes.length > 0 && point.cuisineType) {
          if (!filters.cuisineTypes.includes(point.cuisineType)) return false;
        }

        // 価格帯フィルター
        if (filters.priceRanges.length > 0 && point.priceRange) {
          if (!filters.priceRanges.includes(point.priceRange)) return false;
        }

        // 評価フィルター
        if (filters.minRating && point.rating) {
          if (point.rating < filters.minRating) return false;
        }

        // 営業中フィルター
        if (filters.openNow && point.openingHours) {
          const now = new Date();
          const currentDay = now.toLocaleDateString("ja-JP", {
            weekday: "long",
          });
          const currentTime = now.toTimeString().slice(0, 5);

          const todayHours = point.openingHours.find((hours) =>
            hours.day.includes(currentDay.slice(0, 1))
          );

          if (!todayHours || todayHours.isHoliday) return false;
          if (todayHours.open && todayHours.close) {
            if (
              currentTime < todayHours.open ||
              currentTime > todayHours.close
            ) {
              return false;
            }
          }
        }
      }

      // 特徴フィルター
      if (filters.features.length > 0) {
        const hasMatchingFeature = filters.features.some((feature) =>
          point.features.includes(feature)
        );
        if (!hasMatchingFeature) return false;
      }

      // 駐車場特徴フィルター
      if (
        point.type === "parking" &&
        filters.parkingFeatures &&
        filters.parkingFeatures.length > 0
      ) {
        const hasMatchingFeature = filters.parkingFeatures.some((feature) =>
          point.features.includes(feature)
        );
        if (!hasMatchingFeature) return false;
      }

      // トイレ特徴フィルター
      if (
        point.type === "toilet" &&
        filters.toiletFeatures &&
        filters.toiletFeatures.length > 0
      ) {
        const hasMatchingFeature = filters.toiletFeatures.some((feature) =>
          point.features.includes(feature)
        );
        if (!hasMatchingFeature) return false;
      }

      return true;
    });
  }, [state.data, filters]);

  /**
   * ソート処理
   */
  const sortedMapPoints = useMemo(() => {
    const points = [...filteredMapPoints];

    return points.sort((a, b) => {
      switch (sortOrder) {
        case "name":
          return a.name.localeCompare(b.name, "ja");

        case "rating":
          const ratingA = a.type === "restaurant" ? a.rating || 0 : 0;
          const ratingB = b.type === "restaurant" ? b.rating || 0 : 0;
          return ratingB - ratingA;

        case "distance":
          if (filters.currentLocation) {
            const distanceA = calculateDistance(
              filters.currentLocation,
              a.coordinates
            );
            const distanceB = calculateDistance(
              filters.currentLocation,
              b.coordinates
            );
            return distanceA - distanceB;
          }
          return 0;

        case "priceRange":
          if (a.type === "restaurant" && b.type === "restaurant") {
            const priceOrderA = getPriceOrder(a.priceRange);
            const priceOrderB = getPriceOrder(b.priceRange);
            return priceOrderA - priceOrderB;
          }
          return 0;

        default:
          return 0;
      }
    });
  }, [filteredMapPoints, sortOrder, filters.currentLocation]);

  /**
   * フィルター更新関数
   */
  const updateFilters = useCallback(
    (newFilters: Partial<ExtendedMapFilters>) => {
      startTransition(() => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
      });
    },
    []
  );

  /**
   * フィルターリセット関数
   */
  const resetFilters = useCallback(() => {
    startTransition(() => {
      setFilters(INITIAL_FILTERS);
    });
  }, []);

  /**
   * ソート順変更関数
   */
  const updateSortOrder = useCallback((newSortOrder: SortOrder) => {
    startTransition(() => {
      setSortOrder(newSortOrder);
    });
  }, []);

  // 統計情報の計算
  const stats = useMemo(() => {
    if (!state.data)
      return { restaurants: 0, parkings: 0, toilets: 0, total: 0 };

    const restaurants = state.data.filter(
      (p) => p.type === "restaurant"
    ).length;
    const parkings = state.data.filter((p) => p.type === "parking").length;
    const toilets = state.data.filter((p) => p.type === "toilet").length;

    return {
      restaurants,
      parkings,
      toilets,
      total: state.data.length,
    };
  }, [state.data]);

  return {
    // データ
    mapPoints: sortedMapPoints,
    allMapPoints: state.data || [],

    // 状態
    loading: state.loading,
    error: state.error,

    // フィルター・ソート
    filters,
    sortOrder,

    // 統計
    stats,
    filteredCount: sortedMapPoints.length,

    // アクション
    updateFilters,
    resetFilters,
    updateSortOrder,
    refetch: fetchData,
  };
}

/**
 * 距離計算（Haversine公式）
 */
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // 地球の半径（km）
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 価格帯の順序を取得
 */
function getPriceOrder(priceRange?: string): number {
  switch (priceRange) {
    case "～1000円":
      return 1;
    case "1000-2000円":
      return 2;
    case "2000-3000円":
      return 3;
    case "3000円～":
      return 4;
    default:
      return 0;
  }
}
