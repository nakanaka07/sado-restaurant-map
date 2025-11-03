/* @vitest-environment jsdom */
import { renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilterHandlers } from "./useFilterState";
import { useFilterState } from "./useFilterState";

// ========================
// Mock Setup
// ========================

// trackFilterのモック
vi.mock("@/utils/analytics", () => ({
  trackFilter: vi.fn(),
}));

import { trackFilter } from "@/utils/analytics";

// ========================
// Test Helpers
// ========================

const createMockHandlers = (
  overrides?: Partial<FilterHandlers>
): FilterHandlers => ({
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
  ...overrides,
});

// ========================
// Tests
// ========================

describe("useFilterState", () => {
  let mockHandlers: FilterHandlers;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandlers = createMockHandlers();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("初期状態", () => {
    it("デフォルト値が正しく設定される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

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
      expect(result.current.isDistrictExpanded).toBe(false);
      expect(result.current.isFeatureExpanded).toBe(false);
    });

    it("すべてのハンドラー関数が定義される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      expect(result.current.handleSearchChange).toBeInstanceOf(Function);
      expect(result.current.handleCuisineChange).toBeInstanceOf(Function);
      expect(result.current.handlePriceChange).toBeInstanceOf(Function);
      expect(result.current.handleDistrictToggle).toBeInstanceOf(Function);
      expect(result.current.handleRatingChange).toBeInstanceOf(Function);
      expect(result.current.handleOpenNowChange).toBeInstanceOf(Function);
      expect(result.current.handleSortChange).toBeInstanceOf(Function);
      expect(result.current.handleFeatureToggle).toBeInstanceOf(Function);
      expect(result.current.handlePointTypeToggle).toBeInstanceOf(Function);
      expect(result.current.handleResetFilters).toBeInstanceOf(Function);
      expect(result.current.toggleDistrictExpanded).toBeInstanceOf(Function);
      expect(result.current.toggleFeatureExpanded).toBeInstanceOf(Function);
    });
  });

  describe("handleSearchChange", () => {
    it("検索クエリが更新される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleSearchChange({
          target: { value: "寿司" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.searchQuery).toBe("寿司");
    });

    it("onSearchFilterハンドラーが呼ばれる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleSearchChange({
          target: { value: "ラーメン" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(mockHandlers.onSearchFilter).toHaveBeenCalledWith("ラーメン");
      expect(mockHandlers.onSearchFilter).toHaveBeenCalledTimes(1);
    });

    it("空文字列でも動作する", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleSearchChange({
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.searchQuery).toBe("");
      expect(mockHandlers.onSearchFilter).toHaveBeenCalledWith("");
    });
  });

  describe("handleCuisineChange", () => {
    it("料理タイプが更新される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleCuisineChange({
          target: { value: "日本料理" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(result.current.selectedCuisine).toBe("日本料理");
    });

    it("onCuisineFilterハンドラーとtrackFilterが呼ばれる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleCuisineChange({
          target: { value: "中華" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(mockHandlers.onCuisineFilter).toHaveBeenCalledWith("中華");
      expect(trackFilter).toHaveBeenCalledWith("cuisine", "中華");
    });

    it("空文字列でクリアできる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleCuisineChange({
          target: { value: "" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(result.current.selectedCuisine).toBe("");
      expect(mockHandlers.onCuisineFilter).toHaveBeenCalledWith("");
    });
  });

  describe("handlePriceChange", () => {
    it("価格帯が更新される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handlePriceChange({
          target: { value: "1000-2000円" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(result.current.selectedPrice).toBe("1000-2000円");
    });

    it("onPriceFilterハンドラーとtrackFilterが呼ばれる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handlePriceChange({
          target: { value: "2000-3000円" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(mockHandlers.onPriceFilter).toHaveBeenCalledWith("2000-3000円");
      expect(trackFilter).toHaveBeenCalledWith("price", "2000-3000円");
    });
  });

  describe("handleDistrictToggle", () => {
    it("地区が追加される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleDistrictToggle("両津");
      });

      expect(result.current.selectedDistricts).toEqual(["両津"]);
    });

    it("既存の地区が削除される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleDistrictToggle("両津");
      });
      act(() => {
        result.current.handleDistrictToggle("両津");
      });

      expect(result.current.selectedDistricts).toEqual([]);
    });

    it("複数の地区を追加できる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleDistrictToggle("両津");
      });
      act(() => {
        result.current.handleDistrictToggle("相川");
      });

      expect(result.current.selectedDistricts).toEqual(["両津", "相川"]);
    });

    it("onDistrictFilterハンドラーとtrackFilterが呼ばれる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleDistrictToggle("佐和田");
      });

      expect(mockHandlers.onDistrictFilter).toHaveBeenCalledWith(["佐和田"]);
      expect(trackFilter).toHaveBeenCalledWith("district", "佐和田");
    });
  });

  describe("handleRatingChange", () => {
    it("評価が更新される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleRatingChange({
          target: { value: "4" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(result.current.selectedRating).toBe(4);
    });

    it("空文字列でundefinedになる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleRatingChange({
          target: { value: "" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(result.current.selectedRating).toBeUndefined();
    });

    it("onRatingFilterハンドラーとtrackFilterが呼ばれる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleRatingChange({
          target: { value: "3" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(mockHandlers.onRatingFilter).toHaveBeenCalledWith(3);
      expect(trackFilter).toHaveBeenCalledWith("rating", "3");
    });

    it("undefined時はtrackFilterに'all'が渡される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleRatingChange({
          target: { value: "" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(mockHandlers.onRatingFilter).toHaveBeenCalledWith(undefined);
      expect(trackFilter).toHaveBeenCalledWith("rating", "all");
    });
  });

  describe("handleOpenNowChange", () => {
    it("営業中フラグが更新される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleOpenNowChange({
          target: { checked: true },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.openNow).toBe(true);
    });

    it("onOpenNowFilterハンドラーとtrackFilterが呼ばれる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleOpenNowChange({
          target: { checked: true },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(mockHandlers.onOpenNowFilter).toHaveBeenCalledWith(true);
      expect(trackFilter).toHaveBeenCalledWith("openNow", "true");
    });

    it("falseに戻せる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleOpenNowChange({
          target: { checked: true },
        } as React.ChangeEvent<HTMLInputElement>);
      });
      act(() => {
        result.current.handleOpenNowChange({
          target: { checked: false },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.openNow).toBe(false);
      expect(trackFilter).toHaveBeenLastCalledWith("openNow", "false");
    });
  });

  describe("handleSortChange", () => {
    it("ソート順が更新される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleSortChange({
          target: { value: "rating" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(result.current.selectedSort).toBe("rating");
    });

    it("onSortChangeハンドラーとtrackFilterが呼ばれる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleSortChange({
          target: { value: "distance" },
        } as React.ChangeEvent<HTMLSelectElement>);
      });

      expect(mockHandlers.onSortChange).toHaveBeenCalledWith("distance");
      expect(trackFilter).toHaveBeenCalledWith("sort", "distance");
    });
  });

  describe("handleFeatureToggle", () => {
    it("特徴が追加される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleFeatureToggle("駐車場");
      });

      expect(result.current.selectedFeatures).toEqual(["駐車場"]);
    });

    it("既存の特徴が削除される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleFeatureToggle("個室");
      });
      act(() => {
        result.current.handleFeatureToggle("個室");
      });

      expect(result.current.selectedFeatures).toEqual([]);
    });

    it("複数の特徴を追加できる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleFeatureToggle("駐車場");
      });
      act(() => {
        result.current.handleFeatureToggle("個室");
      });

      expect(result.current.selectedFeatures).toEqual(["駐車場", "個室"]);
    });

    it("onFeatureFilterハンドラーとtrackFilterが呼ばれる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleFeatureToggle("Wi-Fi");
      });

      expect(mockHandlers.onFeatureFilter).toHaveBeenCalledWith(["Wi-Fi"]);
      expect(trackFilter).toHaveBeenCalledWith("feature", "Wi-Fi");
    });
  });

  describe("handlePointTypeToggle", () => {
    it("ポイントタイプが削除される", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handlePointTypeToggle("restaurant");
      });

      expect(result.current.selectedPointTypes).toEqual(["parking", "toilet"]);
    });

    it("削除したポイントタイプを再追加できる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handlePointTypeToggle("parking");
      });
      act(() => {
        result.current.handlePointTypeToggle("parking");
      });

      // 配列の順序は追加順に依存するため、要素の存在のみチェック
      expect(result.current.selectedPointTypes).toContain("restaurant");
      expect(result.current.selectedPointTypes).toContain("parking");
      expect(result.current.selectedPointTypes).toContain("toilet");
      expect(result.current.selectedPointTypes).toHaveLength(3);
    });

    it("onPointTypeFilterハンドラーとtrackFilterが呼ばれる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handlePointTypeToggle("toilet");
      });

      expect(mockHandlers.onPointTypeFilter).toHaveBeenCalledWith([
        "restaurant",
        "parking",
      ]);
      expect(trackFilter).toHaveBeenCalledWith("pointType", "toilet");
    });

    it("すべてのポイントタイプを削除できる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handlePointTypeToggle("restaurant");
      });
      act(() => {
        result.current.handlePointTypeToggle("parking");
      });
      act(() => {
        result.current.handlePointTypeToggle("toilet");
      });

      expect(result.current.selectedPointTypes).toEqual([]);
    });
  });

  describe("handleResetFilters", () => {
    it("すべての状態がリセットされる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      // 状態を変更
      act(() => {
        result.current.handleSearchChange({
          target: { value: "test" },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleCuisineChange({
          target: { value: "日本料理" },
        } as React.ChangeEvent<HTMLSelectElement>);
        result.current.handlePriceChange({
          target: { value: "1000-2000円" },
        } as React.ChangeEvent<HTMLSelectElement>);
        result.current.handleDistrictToggle("両津");
        result.current.handleRatingChange({
          target: { value: "4" },
        } as React.ChangeEvent<HTMLSelectElement>);
        result.current.handleOpenNowChange({
          target: { checked: true },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleSortChange({
          target: { value: "rating" },
        } as React.ChangeEvent<HTMLSelectElement>);
        result.current.handleFeatureToggle("駐車場");
        result.current.handlePointTypeToggle("restaurant");
      });

      // リセット実行
      act(() => {
        result.current.handleResetFilters();
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

    it("onResetFiltersハンドラーとtrackFilterが呼ばれる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      act(() => {
        result.current.handleResetFilters();
      });

      expect(mockHandlers.onResetFilters).toHaveBeenCalledTimes(1);
      expect(trackFilter).toHaveBeenCalledWith("reset", "all");
    });
  });

  describe("toggleDistrictExpanded", () => {
    it("地区展開状態がトグルされる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      expect(result.current.isDistrictExpanded).toBe(false);

      act(() => {
        result.current.toggleDistrictExpanded();
      });

      expect(result.current.isDistrictExpanded).toBe(true);

      act(() => {
        result.current.toggleDistrictExpanded();
      });

      expect(result.current.isDistrictExpanded).toBe(false);
    });
  });

  describe("toggleFeatureExpanded", () => {
    it("特徴展開状態がトグルされる", () => {
      const { result } = renderHook(() => useFilterState(mockHandlers));

      expect(result.current.isFeatureExpanded).toBe(false);

      act(() => {
        result.current.toggleFeatureExpanded();
      });

      expect(result.current.isFeatureExpanded).toBe(true);

      act(() => {
        result.current.toggleFeatureExpanded();
      });

      expect(result.current.isFeatureExpanded).toBe(false);
    });
  });

  describe("ハンドラーの安定性", () => {
    it("同じhandlersオブジェクトでハンドラー関数が再生成されない", () => {
      const { result, rerender } = renderHook(() =>
        useFilterState(mockHandlers)
      );

      const initialHandleSearchChange = result.current.handleSearchChange;
      const initialHandleCuisineChange = result.current.handleCuisineChange;

      rerender();

      expect(result.current.handleSearchChange).toBe(initialHandleSearchChange);
      expect(result.current.handleCuisineChange).toBe(
        initialHandleCuisineChange
      );
    });

    it("handlersが変更された場合はハンドラー関数が再生成される", () => {
      const { result, rerender } = renderHook(
        ({ handlers }) => useFilterState(handlers),
        { initialProps: { handlers: mockHandlers } }
      );

      const initialHandleCuisineChange = result.current.handleCuisineChange;

      const newHandlers = createMockHandlers();
      rerender({ handlers: newHandlers });

      expect(result.current.handleCuisineChange).not.toBe(
        initialHandleCuisineChange
      );
    });
  });

  describe("オプショナルハンドラー", () => {
    it("onCuisineFilterがundefinedでもエラーが発生しない", () => {
      // exactOptionalPropertyTypes対応: undefinedを明示せず、プロパティを省略
      const handlersWithoutCuisine: FilterHandlers = {
        onPriceFilter: vi.fn(),
        onDistrictFilter: vi.fn(),
        onRatingFilter: vi.fn(),
        onOpenNowFilter: vi.fn(),
        onSearchFilter: vi.fn(),
        onSortChange: vi.fn(),
        onFeatureFilter: vi.fn(),
        onPointTypeFilter: vi.fn(),
        onResetFilters: vi.fn(),
        // onCuisineFilter は省略（undefined相当）
      };
      const { result } = renderHook(() =>
        useFilterState(handlersWithoutCuisine)
      );

      expect(() => {
        act(() => {
          result.current.handleCuisineChange({
            target: { value: "日本料理" },
          } as React.ChangeEvent<HTMLSelectElement>);
        });
      }).not.toThrow();

      expect(result.current.selectedCuisine).toBe("日本料理");
    });

    it("すべてのハンドラーがundefinedでも動作する", () => {
      const emptyHandlers: FilterHandlers = {};
      const { result } = renderHook(() => useFilterState(emptyHandlers));

      expect(() => {
        act(() => {
          result.current.handleSearchChange({
            target: { value: "test" },
          } as React.ChangeEvent<HTMLInputElement>);
          result.current.handleCuisineChange({
            target: { value: "中華" },
          } as React.ChangeEvent<HTMLSelectElement>);
          result.current.handleResetFilters();
        });
      }).not.toThrow();
    });
  });
});
