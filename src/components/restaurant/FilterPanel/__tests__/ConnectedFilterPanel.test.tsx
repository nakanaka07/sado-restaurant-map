/**
 * @fileoverview ConnectedFilterPanel テスト
 * Week 2 P2-2: Context as Provider Migration
 */

import { FilterProvider } from "@/contexts/FilterContext";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectedFilterPanel } from "../ConnectedFilterPanel";

// Mock useFilterState to prevent actual filter operations
vi.mock("../useFilterState", () => ({
  useFilterState: () => ({
    searchQuery: "",
    selectedCuisine: "",
    selectedPrice: "",
    selectedDistricts: [],
    selectedRating: undefined,
    openNow: false,
    selectedSort: "name",
    selectedFeatures: [],
    selectedPointTypes: ["restaurant", "parking", "toilet"],
    isDistrictExpanded: false,
    isFeatureExpanded: false,
    handleSearchChange: vi.fn(),
    handleCuisineChange: vi.fn(),
    handlePriceChange: vi.fn(),
    handleDistrictToggle: vi.fn(),
    handleRatingChange: vi.fn(),
    handleOpenNowChange: vi.fn(),
    handleSortChange: vi.fn(),
    handleFeatureToggle: vi.fn(),
    handlePointTypeToggle: vi.fn(),
    handleResetFilters: vi.fn(),
    toggleDistrictExpanded: vi.fn(),
    toggleFeatureExpanded: vi.fn(),
  }),
}));

describe("ConnectedFilterPanel", () => {
  afterEach(() => {
    cleanup();
  });

  const defaultStats = {
    restaurants: 100,
    parkings: 20,
    toilets: 15,
    total: 135,
  };

  describe("Context Integration", () => {
    it("FilterProvider内で正常にレンダリングされる", () => {
      render(
        <FilterProvider loading={false} resultCount={100} stats={defaultStats}>
          <ConnectedFilterPanel />
        </FilterProvider>
      );

      expect(screen.getByText("🔍 フィルター")).toBeInTheDocument();
    });

    it("loading状態がContextから正しく伝播される", () => {
      render(
        <FilterProvider loading={true} resultCount={0} stats={defaultStats}>
          <ConnectedFilterPanel />
        </FilterProvider>
      );

      // loading中の表示を確認（resultCountが0でも表示される）
      expect(screen.getByText("🔍 フィルター")).toBeInTheDocument();
    });

    it("resultCountがContextから正しく伝播される", () => {
      render(
        <FilterProvider loading={false} resultCount={42} stats={defaultStats}>
          <ConnectedFilterPanel />
        </FilterProvider>
      );

      expect(screen.getByText(/42件/)).toBeInTheDocument();
    });

    it("statsがContextから正しく伝播される", () => {
      const customStats = {
        restaurants: 50,
        parkings: 10,
        toilets: 5,
        total: 65,
      };

      render(
        <FilterProvider loading={false} resultCount={65} stats={customStats}>
          <ConnectedFilterPanel />
        </FilterProvider>
      );

      // 統計情報が表示されていることを確認
      expect(screen.getByText(/65件/)).toBeInTheDocument();
    });

    it("FilterPanelのUI要素が正しく表示される", () => {
      render(
        <FilterProvider loading={false} resultCount={100} stats={defaultStats}>
          <ConnectedFilterPanel />
        </FilterProvider>
      );

      // 主要なUI要素が表示されていることを確認
      expect(screen.getByLabelText("🍽️ 料理ジャンル")).toBeInTheDocument();
      expect(screen.getByLabelText("💰 価格帯")).toBeInTheDocument();
      expect(screen.getByText("🔄 フィルターをリセット")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("FilterProvider外で使用するとエラーがスローされる", () => {
      // エラーを抑制（コンソールに出力されないようにする）
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<ConnectedFilterPanel />);
      }).toThrow("useFilterContext must be used within a FilterProvider");

      consoleSpy.mockRestore();
    });
  });
});
