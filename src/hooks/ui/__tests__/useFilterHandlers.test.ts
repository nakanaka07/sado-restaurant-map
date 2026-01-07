/* @vitest-environment jsdom */
/**
 * @fileoverview フィルターハンドラーカスタムフックのテスト
 * useFilterHandlers.ts の単体テスト
 */

import {
  autoSetupTestEnv,
  createMockFilterHandlers,
  createMockFilters,
  resetMocks,
} from "@/test/helpers";
import type { ExtendedMapFilters } from "@/types";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFilterHandlers } from "../useFilterHandlers";

describe("useFilterHandlers", () => {
  // Test Helpers使用: beforeEach/afterEachを自動設定（15行 → 2行）
  const testEnv = autoSetupTestEnv();

  // Test Helpers使用: モックオブジェクト生成（20行 → 4行）
  const mockFilters: ExtendedMapFilters = createMockFilters();
  const { mockUpdateFilters, mockOnError } = createMockFilterHandlers();

  beforeEach(() => {
    // 各テスト前にモックをリセット
    resetMocks(mockUpdateFilters, mockOnError);
  });

  describe("handleCuisineFilter", () => {
    it("有効な料理タイプでフィルターを更新する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleCuisineFilter("日本料理");
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        cuisineTypes: ["日本料理"],
      });
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it("空文字列で料理タイプをクリアする", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleCuisineFilter("");
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        cuisineTypes: [],
      });
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it("無効な料理タイプで警告を出力する（DEV環境）", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        result.current.handleCuisineFilter(123 as any);
      });

      expect(testEnv.current?.consoleWarnSpy).toHaveBeenCalled();
      expect(mockUpdateFilters).not.toHaveBeenCalled();
    });
  });

  describe("handlePriceFilter", () => {
    it("有効な価格範囲でフィルターを更新する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handlePriceFilter("1000-2000円");
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        priceRanges: ["1000-2000円"],
      });
    });

    it("空文字列で価格範囲をクリアする", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handlePriceFilter("");
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        priceRanges: [],
      });
    });

    it("無効な価格範囲で警告を出力する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        result.current.handlePriceFilter(null as any);
      });

      expect(testEnv.current?.consoleWarnSpy).toHaveBeenCalled();
      expect(mockUpdateFilters).not.toHaveBeenCalled();
    });
  });

  describe("handleDistrictFilter", () => {
    it("有効な地区配列でフィルターを更新する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleDistrictFilter(["両津", "相川"]);
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        districts: ["両津", "相川"],
      });
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it("10個を超える地区でエラーを通知する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      // 無効な地区配列（11個）をテストするため、意図的に型をanyに
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const manyDistricts: any = [
        "両津",
        "相川",
        "佐和田",
        "金井",
        "新穂",
        "畑野",
        "真野",
        "小木",
        "羽茂",
        "赤泊",
        "その他",
      ];

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        result.current.handleDistrictFilter(manyDistricts);
      });

      expect(mockOnError).toHaveBeenCalledWith(
        "地区は10個以下で選択してください"
      );
      expect(testEnv.current?.consoleWarnSpy).toHaveBeenCalled();
      expect(mockUpdateFilters).not.toHaveBeenCalled();
    });

    it("配列以外の型で警告を出力する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        result.current.handleDistrictFilter("両津" as any);
      });

      expect(testEnv.current?.consoleWarnSpy).toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalled();
      expect(mockUpdateFilters).not.toHaveBeenCalled();
    });
  });

  describe("handleRatingFilter", () => {
    it("数値でminRatingを設定する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleRatingFilter(4.0);
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        minRating: 4.0,
      });
    });

    it("undefinedでminRatingをクリアする", () => {
      const filtersWithRating: ExtendedMapFilters = {
        ...mockFilters,
        minRating: 3.5,
      };

      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: filtersWithRating,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleRatingFilter(undefined);
      });

      // minRatingが除外されたフィルターオブジェクトが渡される
      expect(mockUpdateFilters).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const callArg = mockUpdateFilters.mock.calls[0]?.[0];
      expect(callArg).not.toHaveProperty("minRating");
    });

    it("0.0の評価を設定できる", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleRatingFilter(0.0);
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        minRating: 0.0,
      });
    });
  });

  describe("handleOpenNowFilter", () => {
    it("trueで営業中フィルターを有効化する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleOpenNowFilter(true);
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        openNow: true,
      });
    });

    it("falseで営業中フィルターを無効化する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleOpenNowFilter(false);
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        openNow: false,
      });
    });
  });

  describe("handleSearchFilter", () => {
    it("有効な検索クエリでフィルターを更新する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleSearchFilter("テストクエリ");
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        searchQuery: "テストクエリ",
      });
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it("100文字を超えるクエリでエラーを通知する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      const longQuery = "a".repeat(150);

      act(() => {
        result.current.handleSearchFilter(longQuery);
      });

      expect(mockOnError).toHaveBeenCalledWith(
        "検索クエリは100文字以下で入力してください"
      );
      expect(testEnv.current?.consoleWarnSpy).toHaveBeenCalled();
      expect(mockUpdateFilters).not.toHaveBeenCalled();
    });

    it("XSSを含む検索クエリをサニタイズする", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleSearchFilter('<script>alert("xss")</script>');
      });

      expect(mockUpdateFilters).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const callArg = mockUpdateFilters.mock.calls[0]?.[0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(callArg.searchQuery).not.toContain("<script>");
    });
  });

  describe("handleFeatureFilter", () => {
    it("有効な特徴配列でフィルターを更新する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleFeatureFilter(["駐車場", "Wi-Fi"]);
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        features: ["駐車場", "Wi-Fi"],
      });
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it("20個を超える特徴でエラーを通知する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      const manyFeatures = Array.from({ length: 25 }, (_, i) => `特徴${i + 1}`);

      act(() => {
        result.current.handleFeatureFilter(manyFeatures);
      });

      expect(mockOnError).toHaveBeenCalledWith(
        "特徴フィルターは20個以下で選択してください"
      );
      expect(testEnv.current?.consoleWarnSpy).toHaveBeenCalled();
      expect(mockUpdateFilters).not.toHaveBeenCalled();
    });

    it("配列以外の型で警告を出力する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        result.current.handleFeatureFilter("駐車場" as any);
      });

      expect(testEnv.current?.consoleWarnSpy).toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalled();
      expect(mockUpdateFilters).not.toHaveBeenCalled();
    });
  });

  describe("handlePointTypeFilter", () => {
    it("ポイントタイプ配列でフィルターを更新する", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handlePointTypeFilter(["restaurant", "parking"]);
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        pointTypes: ["restaurant", "parking"],
      });
    });

    it("空配列でポイントタイプをクリアする", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handlePointTypeFilter([]);
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        pointTypes: [],
      });
    });
  });

  describe("handleResetFilters", () => {
    it("すべてのフィルターをデフォルト状態にリセットする", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: {
            ...mockFilters,
            cuisineTypes: ["日本料理"],
            priceRanges: ["1000-2000円"],
            districts: ["両津"],
            features: ["駐車場"],
            searchQuery: "検索",
            openNow: true,
            minRating: 4.0,
          },
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleResetFilters();
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        cuisineTypes: [],
        priceRanges: [],
        districts: [],
        features: [],
        searchQuery: "",
        openNow: false,
        pointTypes: ["restaurant", "parking", "toilet"],
      });
      expect(mockOnError).toHaveBeenCalledWith("");
    });
  });

  describe("エラーハンドリング", () => {
    it("updateFiltersが例外をスローした場合にエラーを捕捉する", () => {
      const errorUpdateFilters = vi.fn(() => {
        throw new Error("Update failed");
      });

      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: errorUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleCuisineFilter("日本料理");
      });

      expect(testEnv.current?.consoleErrorSpy).toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledWith(
        "料理タイプフィルター中にエラーが発生しました"
      );
    });

    it("非Error型の例外も適切に処理する", () => {
      const errorUpdateFilters = vi.fn(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "String error";
      });

      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: errorUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleSearchFilter("test");
      });

      expect(testEnv.current?.consoleErrorSpy).toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  describe("メモ化とパフォーマンス", () => {
    it("依存関係が変わらない場合ハンドラーが再生成されない", () => {
      const { result, rerender } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      const firstHandlers = result.current;

      // 再レンダリング
      rerender();

      const secondHandlers = result.current;

      // 同じ参照を保持
      expect(firstHandlers.handleCuisineFilter).toBe(
        secondHandlers.handleCuisineFilter
      );
      expect(firstHandlers.handlePriceFilter).toBe(
        secondHandlers.handlePriceFilter
      );
      expect(firstHandlers.handleResetFilters).toBe(
        secondHandlers.handleResetFilters
      );
    });

    it("updateFiltersが変更された場合ハンドラーが再生成される", () => {
      const { result, rerender } = renderHook(
        props => useFilterHandlers(props),
        {
          initialProps: {
            filters: mockFilters,
            updateFilters: mockUpdateFilters,
            onError: mockOnError,
          },
        }
      );

      const firstHandlers = result.current;

      // updateFiltersを変更
      const newUpdateFilters = vi.fn();
      rerender({
        filters: mockFilters,
        updateFilters: newUpdateFilters,
        onError: mockOnError,
      });

      const secondHandlers = result.current;

      // ハンドラーが再生成される
      expect(firstHandlers.handleCuisineFilter).not.toBe(
        secondHandlers.handleCuisineFilter
      );
    });
  });

  describe("統合シナリオ", () => {
    it("複数のフィルターを連続して適用できる", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleCuisineFilter("日本料理");
        result.current.handlePriceFilter("1000-2000円");
        result.current.handleDistrictFilter(["両津"]);
        result.current.handleOpenNowFilter(true);
      });

      expect(mockUpdateFilters).toHaveBeenCalledTimes(4);
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it("エラーが発生してもその後のフィルター操作が可能", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      // 無効な操作
      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        result.current.handleCuisineFilter(null as any);
      });

      expect(mockOnError).not.toHaveBeenCalled(); // cuisineFilterはonErrorを呼ばない

      // 有効な操作
      act(() => {
        result.current.handleCuisineFilter("日本料理");
      });

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        cuisineTypes: ["日本料理"],
      });
    });
  });

  describe("本番環境動作", () => {
    beforeEach(() => {
      vi.stubEnv("DEV", false);
      vi.stubEnv("PROD", true);
    });

    it("本番環境ではconsole.warnが呼ばれない", () => {
      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: mockUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        result.current.handleCuisineFilter(123 as any);
      });

      expect(testEnv.current?.consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("本番環境でもエラーハンドリングは機能する", () => {
      const errorUpdateFilters = vi.fn(() => {
        throw new Error("Update failed");
      });

      const { result } = renderHook(() =>
        useFilterHandlers({
          filters: mockFilters,
          updateFilters: errorUpdateFilters,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handlePriceFilter("1000-2000円");
      });

      expect(mockOnError).toHaveBeenCalledWith(
        "価格フィルター中にエラーが発生しました"
      );
    });
  });
});
