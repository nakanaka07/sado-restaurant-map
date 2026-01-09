/**
 * @fileoverview FilterContext tests
 * Week 2 P2-1: FilterContext + Compound Components テスト
 */

import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FilterProvider,
  useFilterContext,
  useFilterCuisine,
  useFilterDistricts,
  useFilterFeatures,
  useFilterOpenNow,
  useFilterPointTypes,
  useFilterPrice,
  useFilterRating,
  useFilterSearch,
  useFilterSort,
  useFilterStats,
} from "../FilterContext";

// Mock analytics
vi.mock("@/utils/analytics", () => ({
  trackFilter: vi.fn(),
}));

// Test wrapper with FilterProvider
function createWrapper(props?: Partial<Parameters<typeof FilterProvider>[0]>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <FilterProvider {...props}>{children}</FilterProvider>;
  };
}

describe("FilterContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useFilterContext", () => {
    it("Provider外で使用するとエラーをスロー", () => {
      // Console error を抑制
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useFilterContext());
      }).toThrow("useFilterContext must be used within a FilterProvider");

      consoleSpy.mockRestore();
    });

    it("Provider内で正常に状態を取得できる", () => {
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper(),
      });

      expect(result.current.searchQuery).toBe("");
      expect(result.current.selectedCuisine).toBe("");
      expect(result.current.selectedPrice).toBe("");
      expect(result.current.selectedDistricts).toEqual([]);
      expect(result.current.selectedRating).toBeUndefined();
      expect(result.current.openNow).toBe(false);
      expect(result.current.selectedSort).toBe("name");
      expect(result.current.selectedFeatures).toEqual([]);
      expect(result.current.selectedPointTypes).toEqual([
        "restaurant",
        "parking",
        "toilet",
      ]);
    });

    it("初期状態をカスタマイズできる", () => {
      const initialState = {
        searchQuery: "テスト",
        selectedCuisine: "寿司" as const,
        openNow: true,
      };

      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper({ initialState }),
      });

      expect(result.current.searchQuery).toBe("テスト");
      expect(result.current.selectedCuisine).toBe("寿司");
      expect(result.current.openNow).toBe(true);
    });
  });

  describe("useFilterSearch", () => {
    it("検索クエリを更新できる", () => {
      const onSearchChange = vi.fn();
      const { result } = renderHook(() => useFilterSearch(), {
        wrapper: createWrapper({ callbacks: { onSearchChange } }),
      });

      expect(result.current.searchQuery).toBe("");

      act(() => {
        result.current.setSearchQuery("寿司");
      });

      expect(result.current.searchQuery).toBe("寿司");
      expect(onSearchChange).toHaveBeenCalledWith("寿司");
    });
  });

  describe("useFilterCuisine", () => {
    it("料理ジャンルを更新できる", () => {
      const onCuisineChange = vi.fn();
      const { result } = renderHook(() => useFilterCuisine(), {
        wrapper: createWrapper({ callbacks: { onCuisineChange } }),
      });

      expect(result.current.selectedCuisine).toBe("");

      act(() => {
        result.current.setCuisine("寿司");
      });

      expect(result.current.selectedCuisine).toBe("寿司");
      expect(onCuisineChange).toHaveBeenCalledWith("寿司");
    });
  });

  describe("useFilterPrice", () => {
    it("価格帯を更新できる", () => {
      const onPriceChange = vi.fn();
      const { result } = renderHook(() => useFilterPrice(), {
        wrapper: createWrapper({ callbacks: { onPriceChange } }),
      });

      expect(result.current.selectedPrice).toBe("");

      act(() => {
        result.current.setPrice("1000-2000円");
      });

      expect(result.current.selectedPrice).toBe("1000-2000円");
      expect(onPriceChange).toHaveBeenCalledWith("1000-2000円");
    });
  });

  describe("useFilterDistricts", () => {
    it("地域をトグルできる", () => {
      const onDistrictChange = vi.fn();
      const { result } = renderHook(() => useFilterDistricts(), {
        wrapper: createWrapper({ callbacks: { onDistrictChange } }),
      });

      expect(result.current.selectedDistricts).toEqual([]);

      act(() => {
        result.current.toggleDistrict("両津");
      });

      expect(result.current.selectedDistricts).toContain("両津");
      expect(onDistrictChange).toHaveBeenCalledWith(["両津"]);

      // トグルオフ
      act(() => {
        result.current.toggleDistrict("両津");
      });

      expect(result.current.selectedDistricts).not.toContain("両津");
    });

    it("展開状態をトグルできる", () => {
      const { result } = renderHook(() => useFilterDistricts(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isDistrictExpanded).toBe(false);

      act(() => {
        result.current.toggleDistrictExpanded();
      });

      expect(result.current.isDistrictExpanded).toBe(true);
    });
  });

  describe("useFilterRating", () => {
    it("評価を更新できる", () => {
      const onRatingChange = vi.fn();
      const { result } = renderHook(() => useFilterRating(), {
        wrapper: createWrapper({ callbacks: { onRatingChange } }),
      });

      expect(result.current.selectedRating).toBeUndefined();

      act(() => {
        result.current.setRating(4);
      });

      expect(result.current.selectedRating).toBe(4);
      expect(onRatingChange).toHaveBeenCalledWith(4);
    });
  });

  describe("useFilterOpenNow", () => {
    it("営業中フィルターを更新できる", () => {
      const onOpenNowChange = vi.fn();
      const { result } = renderHook(() => useFilterOpenNow(), {
        wrapper: createWrapper({ callbacks: { onOpenNowChange } }),
      });

      expect(result.current.openNow).toBe(false);

      act(() => {
        result.current.setOpenNow(true);
      });

      expect(result.current.openNow).toBe(true);
      expect(onOpenNowChange).toHaveBeenCalledWith(true);
    });
  });

  describe("useFilterSort", () => {
    it("ソート順を更新できる", () => {
      const onSortChange = vi.fn();
      const { result } = renderHook(() => useFilterSort(), {
        wrapper: createWrapper({ callbacks: { onSortChange } }),
      });

      expect(result.current.selectedSort).toBe("name");

      act(() => {
        result.current.setSort("rating");
      });

      expect(result.current.selectedSort).toBe("rating");
      expect(onSortChange).toHaveBeenCalledWith("rating");
    });
  });

  describe("useFilterFeatures", () => {
    it("特徴をトグルできる", () => {
      const onFeatureChange = vi.fn();
      const { result } = renderHook(() => useFilterFeatures(), {
        wrapper: createWrapper({ callbacks: { onFeatureChange } }),
      });

      expect(result.current.selectedFeatures).toEqual([]);

      act(() => {
        result.current.toggleFeature("parking");
      });

      expect(result.current.selectedFeatures).toContain("parking");
      expect(onFeatureChange).toHaveBeenCalledWith(["parking"]);
    });
  });

  describe("useFilterPointTypes", () => {
    it("ポイントタイプをトグルできる", () => {
      const onPointTypeChange = vi.fn();
      const { result } = renderHook(() => useFilterPointTypes(), {
        wrapper: createWrapper({ callbacks: { onPointTypeChange } }),
      });

      // 初期状態では全て選択されている
      expect(result.current.selectedPointTypes).toContain("restaurant");

      act(() => {
        result.current.togglePointType("restaurant");
      });

      expect(result.current.selectedPointTypes).not.toContain("restaurant");
      expect(onPointTypeChange).toHaveBeenCalledWith(["parking", "toilet"]);
    });
  });

  describe("useFilterReset", () => {
    it("フィルターをリセットできる", () => {
      const onResetFilters = vi.fn();
      const { result } = renderHook(() => useFilterContext(), {
        wrapper: createWrapper({ callbacks: { onResetFilters } }),
      });

      // いくつかの値を変更
      act(() => {
        result.current.setSearchQuery("テスト");
        result.current.setCuisine("寿司");
        result.current.setOpenNow(true);
      });

      expect(result.current.searchQuery).toBe("テスト");
      expect(result.current.selectedCuisine).toBe("寿司");
      expect(result.current.openNow).toBe(true);

      // リセット
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.searchQuery).toBe("");
      expect(result.current.selectedCuisine).toBe("");
      expect(result.current.openNow).toBe(false);
      expect(onResetFilters).toHaveBeenCalled();
    });
  });

  describe("useFilterStats", () => {
    it("統計情報を取得できる", () => {
      const stats = { restaurants: 10, parkings: 5, toilets: 3, total: 18 };
      const { result } = renderHook(() => useFilterStats(), {
        wrapper: createWrapper({ loading: false, resultCount: 18, stats }),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.resultCount).toBe(18);
      expect(result.current.stats).toEqual(stats);
    });
  });
});
