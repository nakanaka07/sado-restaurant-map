/**
 * @vitest-environment jsdom
 */
/**
 * @fileoverview Tests for useAnalytics hook
 * アナリティクスフックのテスト
 */

import * as analyticsModule from "@/utils/analytics";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAnalytics } from "./useAnalytics";

// analyticsモジュール全体をモック
vi.mock("@/utils/analytics", () => ({
  trackEvent: vi.fn(),
  trackRestaurantClick: vi.fn(),
  trackSearch: vi.fn(),
  trackFilter: vi.fn(),
  trackMapInteraction: vi.fn(),
  trackPWAUsage: vi.fn(),
  trackPageView: vi.fn(),
}));

describe("useAnalytics", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("hookの初期化", () => {
    it("すべてのトラッキング関数を返す", () => {
      const { result } = renderHook(() => useAnalytics());

      expect(result.current).toHaveProperty("trackRestaurantView");
      expect(result.current).toHaveProperty("trackSearchBehavior");
      expect(result.current).toHaveProperty("trackFilterUsage");
      expect(result.current).toHaveProperty("trackMapUsage");
      expect(result.current).toHaveProperty("trackPWAEvents");
      expect(result.current).toHaveProperty("trackPage");
      expect(result.current).toHaveProperty("trackCustomEvent");
    });

    it("すべての関数がfunction型である", () => {
      const { result } = renderHook(() => useAnalytics());

      expect(typeof result.current.trackRestaurantView).toBe("function");
      expect(typeof result.current.trackSearchBehavior).toBe("function");
      expect(typeof result.current.trackFilterUsage).toBe("function");
      expect(typeof result.current.trackMapUsage).toBe("function");
      expect(typeof result.current.trackPWAEvents).toBe("function");
      expect(typeof result.current.trackPage).toBe("function");
      expect(typeof result.current.trackCustomEvent).toBe("function");
    });
  });

  describe("trackRestaurantView", () => {
    it("レストラン情報でtrackRestaurantClickを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      const restaurant = {
        id: "rest-001",
        name: "テスト食堂",
        type: "restaurant" as const,
        cuisineType: "日本料理" as const,
        priceRange: "1000-2000円" as const,
        district: "相川" as const,
        address: "佐渡市相川",
        coordinates: { lat: 38.0, lng: 138.0 },
        position: { lat: 38.0, lng: 138.0 },
        openingHours: [
          {
            day: "月-金",
            open: "11:00",
            close: "20:00",
            isHoliday: false,
          },
        ],
        phone: "0259-00-0000",
        rating: 4.5,
        features: [],
        lastUpdated: "2025-01-01",
      };

      result.current.trackRestaurantView(restaurant);

      expect(analyticsModule.trackRestaurantClick).toHaveBeenCalledTimes(1);
      expect(analyticsModule.trackRestaurantClick).toHaveBeenCalledWith({
        id: "rest-001",
        name: "テスト食堂",
        category: "日本料理",
        priceRange: "1000-2000円",
      });
    });

    it("複数回呼び出しても正しく動作する", () => {
      const { result } = renderHook(() => useAnalytics());

      const restaurant1 = {
        id: "rest-001",
        name: "店A",
        type: "restaurant" as const,
        cuisineType: "日本料理" as const,
        priceRange: "～1000円" as const,
        district: "両津" as const,
        address: "佐渡市",
        coordinates: { lat: 38.0, lng: 138.0 },
        position: { lat: 38.0, lng: 138.0 },
        openingHours: [
          {
            day: "月-金",
            open: "11:00",
            close: "20:00",
            isHoliday: false,
          },
        ],
        phone: "0259-00-0000",
        rating: 4.0,
        features: [],
        lastUpdated: "2025-01-01",
      };

      const restaurant2 = {
        id: "rest-002",
        name: "店B",
        type: "restaurant" as const,
        cuisineType: "ステーキ・洋食" as const,
        priceRange: "3000円～" as const,
        district: "佐和田" as const,
        address: "佐渡市",
        coordinates: { lat: 38.0, lng: 138.0 },
        position: { lat: 38.0, lng: 138.0 },
        openingHours: [
          {
            day: "月-金",
            open: "11:00",
            close: "20:00",
            isHoliday: false,
          },
        ],
        phone: "0259-00-0000",
        rating: 4.5,
        features: [],
        lastUpdated: "2025-01-01",
      };

      result.current.trackRestaurantView(restaurant1);
      result.current.trackRestaurantView(restaurant2);

      expect(analyticsModule.trackRestaurantClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("trackSearchBehavior", () => {
    it("検索クエリと結果数でtrackSearchを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackSearchBehavior("ラーメン", 5);

      expect(analyticsModule.trackSearch).toHaveBeenCalledTimes(1);
      expect(analyticsModule.trackSearch).toHaveBeenCalledWith("ラーメン", 5);
    });

    it("結果数0でも正しく動作する", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackSearchBehavior("存在しない店", 0);

      expect(analyticsModule.trackSearch).toHaveBeenCalledWith(
        "存在しない店",
        0
      );
    });
  });

  describe("trackFilterUsage", () => {
    it("フィルタータイプと値でtrackFilterを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackFilterUsage("cuisine", "和食");

      expect(analyticsModule.trackFilter).toHaveBeenCalledTimes(1);
      expect(analyticsModule.trackFilter).toHaveBeenCalledWith(
        "cuisine",
        "和食"
      );
    });

    it("価格フィルターでも正しく動作する", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackFilterUsage("price", "～1000円");

      expect(analyticsModule.trackFilter).toHaveBeenCalledWith(
        "price",
        "～1000円"
      );
    });
  });

  describe("trackMapUsage", () => {
    it("ズーム操作でtrackMapInteractionを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackMapUsage("zoom");

      expect(analyticsModule.trackMapInteraction).toHaveBeenCalledTimes(1);
      expect(analyticsModule.trackMapInteraction).toHaveBeenCalledWith("zoom");
    });

    it("パン操作でtrackMapInteractionを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackMapUsage("pan");

      expect(analyticsModule.trackMapInteraction).toHaveBeenCalledWith("pan");
    });

    it("マーカークリックでtrackMapInteractionを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackMapUsage("marker_click");

      expect(analyticsModule.trackMapInteraction).toHaveBeenCalledWith(
        "marker_click"
      );
    });
  });

  describe("trackPWAEvents", () => {
    it("インストールイベントでtrackPWAUsageを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackPWAEvents("install");

      expect(analyticsModule.trackPWAUsage).toHaveBeenCalledTimes(1);
      expect(analyticsModule.trackPWAUsage).toHaveBeenCalledWith("install");
    });

    it("スタンドアロンモードでtrackPWAUsageを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackPWAEvents("standalone_mode");

      expect(analyticsModule.trackPWAUsage).toHaveBeenCalledWith(
        "standalone_mode"
      );
    });
  });

  describe("trackPage", () => {
    it("ページ名でtrackPageViewを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackPage("ホーム");

      expect(analyticsModule.trackPageView).toHaveBeenCalledTimes(1);
      expect(analyticsModule.trackPageView).toHaveBeenCalledWith("ホーム");
    });

    it("複数のページ遷移を追跡する", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackPage("ホーム");
      result.current.trackPage("店舗詳細");
      result.current.trackPage("検索結果");

      expect(analyticsModule.trackPageView).toHaveBeenCalledTimes(3);
    });
  });

  describe("trackCustomEvent", () => {
    it("イベント名のみでtrackEventを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      result.current.trackCustomEvent("custom_action");

      expect(analyticsModule.trackEvent).toHaveBeenCalledTimes(1);
      expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
        "custom_action",
        undefined
      );
    });

    it("パラメータ付きでtrackEventを呼ぶ", () => {
      const { result } = renderHook(() => useAnalytics());

      const params = { userId: "user123", action: "click" };
      result.current.trackCustomEvent("button_click", params);

      expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
        "button_click",
        params
      );
    });

    it("複雑なパラメータでも正しく動作する", () => {
      const { result } = renderHook(() => useAnalytics());

      const params = {
        nested: { key: "value" },
        array: [1, 2, 3],
        bool: true,
        num: 42,
      };

      result.current.trackCustomEvent("complex_event", params);

      expect(analyticsModule.trackEvent).toHaveBeenCalledWith(
        "complex_event",
        params
      );
    });
  });

  describe("useCallback安定性", () => {
    it("再レンダリング時に同じ関数参照を保持する", () => {
      const { result, rerender } = renderHook(() => useAnalytics());

      const firstRender = { ...result.current };
      rerender();
      const secondRender = { ...result.current };

      expect(firstRender.trackRestaurantView).toBe(
        secondRender.trackRestaurantView
      );
      expect(firstRender.trackSearchBehavior).toBe(
        secondRender.trackSearchBehavior
      );
      expect(firstRender.trackFilterUsage).toBe(secondRender.trackFilterUsage);
      expect(firstRender.trackMapUsage).toBe(secondRender.trackMapUsage);
      expect(firstRender.trackPWAEvents).toBe(secondRender.trackPWAEvents);
      expect(firstRender.trackPage).toBe(secondRender.trackPage);
      expect(firstRender.trackCustomEvent).toBe(secondRender.trackCustomEvent);
    });
  });
});
