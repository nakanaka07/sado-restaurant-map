import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilterState } from "./useFilterState";
import type {
  CuisineType,
  PriceRange,
  SadoDistrict,
  SortOrder,
  MapPointType,
} from "@/types";

// Analytics モック
vi.mock("@/utils/analytics", () => ({
  trackSearch: vi.fn(),
  trackFilter: vi.fn(),
}));

describe("useFilterState", () => {
  const mockHandlers = {
    onCuisineFilter: vi.fn(),
    onPriceFilter: vi.fn(),
    onDistrictFilter: vi.fn(),
    onRatingFilter: vi.fn(),
    onOpenNowFilter: vi.fn(),
    onSearchFilter: vi.fn(),
    onSortChange: vi.fn(),
    onFeatureFilter: vi.fn(),
    onPointTypeFilter: vi.fn(),
    onResetFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("初期状態", () => {
    it("正しい初期値が設定されること", () => {
      const { result } = renderHook(() => useFilterState({}));

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
  });

  describe("検索機能", () => {
    it("handleSearchChangeが正常に動作すること", async () => {
      const { trackSearch } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleSearchChange("寿司");
      });

      expect(result.current.searchQuery).toBe("寿司");
      expect(mockHandlers.onSearchFilter).toHaveBeenCalledWith("寿司");
      expect(trackSearch).toHaveBeenCalledWith("寿司", 0);
    });

    it("空文字検索ではAnalyticsが送信されないこと", async () => {
      const { trackSearch } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleSearchChange("  ");
      });

      expect(result.current.searchQuery).toBe("  ");
      expect(mockHandlers.onSearchFilter).toHaveBeenCalledWith("  ");
      expect(trackSearch).not.toHaveBeenCalled();
    });
  });

  describe("料理分野フィルター", () => {
    it("handleCuisineChangeが正常に動作すること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      const cuisine: CuisineType = "寿司";
      act(() => {
        result.current.handleCuisineChange(cuisine);
      });

      expect(result.current.selectedCuisine).toBe(cuisine);
      expect(mockHandlers.onCuisineFilter).toHaveBeenCalledWith(cuisine);
      expect(trackFilter).toHaveBeenCalledWith("cuisine", cuisine);
    });

    it("料理分野リセット時に空文字が設定されること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleCuisineChange("");
      });

      expect(result.current.selectedCuisine).toBe("");
      expect(mockHandlers.onCuisineFilter).toHaveBeenCalledWith("");
      expect(trackFilter).toHaveBeenCalledWith("cuisine", "");
    });
  });

  describe("価格帯フィルター", () => {
    it("handlePriceChangeが正常に動作すること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      const price: PriceRange = "1000-2000円";
      act(() => {
        result.current.handlePriceChange(price);
      });

      expect(result.current.selectedPrice).toBe(price);
      expect(mockHandlers.onPriceFilter).toHaveBeenCalledWith(price);
      expect(trackFilter).toHaveBeenCalledWith("price", price);
    });
  });

  describe("地区フィルター", () => {
    it("handleDistrictToggleで地区を追加できること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      const district: SadoDistrict = "両津";
      act(() => {
        result.current.handleDistrictToggle(district);
      });

      expect(result.current.selectedDistricts).toContain(district);
      expect(mockHandlers.onDistrictFilter).toHaveBeenCalledWith([district]);
      expect(trackFilter).toHaveBeenCalledWith("district", district);
    });

    it("handleDistrictToggleで地区を削除できること", async () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      const district: SadoDistrict = "両津";

      // まず地区を追加
      act(() => {
        result.current.handleDistrictToggle(district);
      });
      expect(result.current.selectedDistricts).toContain(district);

      // 再度トグルして削除
      act(() => {
        result.current.handleDistrictToggle(district);
      });
      expect(result.current.selectedDistricts).not.toContain(district);
      expect(mockHandlers.onDistrictFilter).toHaveBeenLastCalledWith([]);
    });

    it("複数の地区を選択できること", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      const district1: SadoDistrict = "両津";
      const district2: SadoDistrict = "相川";

      act(() => {
        result.current.handleDistrictToggle(district1);
      });
      act(() => {
        result.current.handleDistrictToggle(district2);
      });

      expect(result.current.selectedDistricts).toEqual([district1, district2]);
    });
  });

  describe("評価フィルター", () => {
    it("handleRatingChangeが正常に動作すること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleRatingChange(4);
      });

      expect(result.current.selectedRating).toBe(4);
      expect(mockHandlers.onRatingFilter).toHaveBeenCalledWith(4);
      expect(trackFilter).toHaveBeenCalledWith("rating", "4");
    });

    it("評価リセット時にundefinedが設定されること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleRatingChange(undefined);
      });

      expect(result.current.selectedRating).toBeUndefined();
      expect(mockHandlers.onRatingFilter).toHaveBeenCalledWith(undefined);
      expect(trackFilter).toHaveBeenCalledWith("rating", "");
    });
  });

  describe("営業中フィルター", () => {
    it("handleOpenNowChangeが正常に動作すること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleOpenNowChange(true);
      });

      expect(result.current.openNow).toBe(true);
      expect(mockHandlers.onOpenNowFilter).toHaveBeenCalledWith(true);
      expect(trackFilter).toHaveBeenCalledWith("openNow", "true");
    });
  });

  describe("ソート機能", () => {
    it("handleSortChangeが正常に動作すること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      const sort: SortOrder = "rating";
      act(() => {
        result.current.handleSortChange(sort);
      });

      expect(result.current.selectedSort).toBe(sort);
      expect(mockHandlers.onSortChange).toHaveBeenCalledWith(sort);
      expect(trackFilter).toHaveBeenCalledWith("sort", sort);
    });
  });

  describe("特徴フィルター", () => {
    it("handleFeatureToggleで特徴を追加できること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      const feature = "駐車場あり";
      act(() => {
        result.current.handleFeatureToggle(feature);
      });

      expect(result.current.selectedFeatures).toContain(feature);
      expect(mockHandlers.onFeatureFilter).toHaveBeenCalledWith([feature]);
      expect(trackFilter).toHaveBeenCalledWith("feature", feature);
    });

    it("handleFeatureToggleで特徴を削除できること", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      const feature = "駐車場あり";

      // まず特徴を追加
      act(() => {
        result.current.handleFeatureToggle(feature);
      });
      expect(result.current.selectedFeatures).toContain(feature);

      // 再度トグルして削除
      act(() => {
        result.current.handleFeatureToggle(feature);
      });
      expect(result.current.selectedFeatures).not.toContain(feature);
      expect(mockHandlers.onFeatureFilter).toHaveBeenLastCalledWith([]);
    });

    it("複数の特徴を選択できること", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      const feature1 = "駐車場あり";
      const feature2 = "禁煙";

      act(() => {
        result.current.handleFeatureToggle(feature1);
      });
      act(() => {
        result.current.handleFeatureToggle(feature2);
      });

      expect(result.current.selectedFeatures).toEqual([feature1, feature2]);
    });
  });

  describe("地図ポイントタイプフィルター", () => {
    it("handlePointTypeChangeでポイントタイプを削除できること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      const pointType: MapPointType = "restaurant";
      act(() => {
        result.current.handlePointTypeChange(pointType);
      });

      // 初期状態でrestaurantが含まれているので削除される
      expect(result.current.selectedPointTypes).not.toContain(pointType);
      expect(mockHandlers.onPointTypeFilter).toHaveBeenCalledWith([
        "parking",
        "toilet",
      ]);
      expect(trackFilter).toHaveBeenCalledWith("pointType", pointType);
    });

    it("handlePointTypeChangeでポイントタイプを追加できること", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      // まずrestaurantを削除
      act(() => {
        result.current.handlePointTypeChange("restaurant");
      });

      // 再度追加
      act(() => {
        result.current.handlePointTypeChange("restaurant");
      });

      expect(result.current.selectedPointTypes).toContain("restaurant");
    });
  });

  describe("リセット機能", () => {
    it("handleResetFiltersで全ての状態がリセットされること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const { result } = renderHook(() => useFilterState(mockHandlers));

      // 各フィルターに値を設定
      act(() => {
        result.current.handleSearchChange("テスト");
        result.current.handleCuisineChange("寿司");
        result.current.handlePriceChange("1000-2000円");
        result.current.handleDistrictToggle("両津");
        result.current.handleRatingChange(4);
        result.current.handleOpenNowChange(true);
        result.current.handleSortChange("rating");
        result.current.handleFeatureToggle("駐車場あり");
      });

      // リセットを実行
      act(() => {
        result.current.handleResetFilters();
      });

      // 全ての状態が初期値に戻ることを確認
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

      expect(mockHandlers.onResetFilters).toHaveBeenCalled();
      expect(trackFilter).toHaveBeenCalledWith("reset", "all");
    });
  });

  describe("ハンドラーが未定義の場合", () => {
    it("ハンドラーが未定義でもエラーが発生しないこと", () => {
      const { result } = renderHook(() => useFilterState({}));

      // エラーが発生しないことを確認
      expect(() => {
        act(() => {
          result.current.handleSearchChange("テスト");
          result.current.handleCuisineChange("寿司");
          result.current.handlePriceChange("1000-2000円");
          result.current.handleResetFilters();
        });
      }).not.toThrow();
    });
  });

  describe("useCallback依存関係", () => {
    it("ハンドラーが変更されたときに関数が更新されること", () => {
      const initialHandlers = { onSearchFilter: vi.fn() };
      const { result, rerender } = renderHook(
        ({ handlers }) => useFilterState(handlers),
        { initialProps: { handlers: initialHandlers } }
      );

      const initialSearchHandler = result.current.handleSearchChange;

      const newHandlers = { onSearchFilter: vi.fn() };
      rerender({ handlers: newHandlers });

      // 関数が新しく作成されていることを確認
      expect(result.current.handleSearchChange).not.toBe(initialSearchHandler);
    });
  });
});
