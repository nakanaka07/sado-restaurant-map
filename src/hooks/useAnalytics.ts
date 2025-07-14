import { useCallback } from "react";
import {
  trackEvent,
  trackRestaurantClick,
  trackSearch,
  trackFilter,
  trackMapInteraction,
  trackPWAUsage,
  trackPageView,
} from "@/utils/analytics";
import type { Restaurant } from "@/types";

export function useAnalytics() {
  // レストラン詳細表示追跡
  const trackRestaurantView = useCallback((restaurant: Restaurant) => {
    trackRestaurantClick({
      id: restaurant.id,
      name: restaurant.name,
      category: restaurant.cuisineType,
      priceRange: restaurant.priceRange,
    });
  }, []);

  // 検索行動追跡
  const trackSearchBehavior = useCallback(
    (query: string, resultCount: number) => {
      trackSearch(query, resultCount);
    },
    []
  );

  // フィルター使用追跡
  const trackFilterUsage = useCallback((filterType: string, value: string) => {
    trackFilter(filterType, value);
  }, []);

  // 地図操作追跡
  const trackMapUsage = useCallback(
    (action: "zoom" | "pan" | "marker_click") => {
      trackMapInteraction(action);
    },
    []
  );

  // PWA関連追跡
  const trackPWAEvents = useCallback(
    (action: "install" | "standalone_mode") => {
      trackPWAUsage(action);
    },
    []
  );

  // ページビュー追跡（SPA対応）
  const trackPage = useCallback((pageName: string) => {
    trackPageView(pageName);
  }, []);

  // カスタムイベント追跡
  const trackCustomEvent = useCallback(
    (eventName: string, parameters?: Record<string, unknown>) => {
      trackEvent(eventName, parameters);
    },
    []
  );

  return {
    trackRestaurantView,
    trackSearchBehavior,
    trackFilterUsage,
    trackMapUsage,
    trackPWAEvents,
    trackPage,
    trackCustomEvent,
  };
}
