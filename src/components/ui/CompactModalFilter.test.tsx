/**
 * @fileoverview CompactModalFilter Component Tests
 * コンパクトモーダルフィルターコンポーネントのテスト
 * @vitest-environment jsdom
 */

import { FilterDisplayMode, ModalState } from "@/types";
import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CompactModalFilter } from "./CompactModalFilter";

// Mock useModalFilter hook
vi.mock("@/hooks/ui/useModalFilter", () => ({
  useModalFilter: vi.fn(() => ({
    isOpen: false,
    activeFilterCount: 0,
    openModal: vi.fn(),
    closeModal: vi.fn(),
  })),
}));

// Mock FilterPanel
vi.mock("@/components/restaurant", () => ({
  FilterPanel: vi.fn(({ resultCount }: { resultCount?: number }) => (
    <div data-testid="filter-panel">Filter Panel - {resultCount} results</div>
  )),
}));

// Mock FilterModal
vi.mock("./FilterModal", () => ({
  FilterModal: vi.fn(
    ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
      isOpen ? <div data-testid="filter-modal">{children}</div> : null
  ),
}));

// Mock FilterTriggerButton
vi.mock("./FilterTriggerButton", () => ({
  FilterTriggerButton: vi.fn(
    ({
      onClick,
      activeCount,
      isLoading,
    }: {
      onClick: () => void;
      activeCount: number;
      isLoading?: boolean;
    }) => (
      <button
        data-testid="filter-trigger-button"
        onClick={onClick}
        disabled={isLoading}
      >
        Filters ({activeCount})
      </button>
    )
  ),
}));

import { useModalFilter } from "@/hooks/ui/useModalFilter";

const mockUseModalFilter = vi.mocked(useModalFilter);

describe("CompactModalFilter", () => {
  const defaultProps = {
    loading: false,
    resultCount: 0,
    stats: {
      restaurants: 0,
      parkings: 0,
      toilets: 0,
      total: 0,
    },
    onCuisineFilter: vi.fn(),
    onPriceFilter: vi.fn(),
    onDistrictFilter: vi.fn(),
    onRatingFilter: vi.fn(),
    onOpenNowFilter: vi.fn(),
    onSearchFilter: vi.fn(),
    onFeatureFilter: vi.fn(),
    onPointTypeFilter: vi.fn(),
    onSortChange: vi.fn(),
    onResetFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseModalFilter.mockReturnValue({
      state: {
        isOpen: false,
        modalState: ModalState.CLOSED,
        displayMode: FilterDisplayMode.COMPACT,
        activeFilterCount: 0,
        filters: {
          cuisineTypes: [],
          priceRanges: [],
          districts: [],
          features: [],
          searchQuery: "",
          pointTypes: ["restaurant", "parking", "toilet"],
        },
        isAnimating: false,
        lastUpdated: new Date(),
      },
      isOpen: false,
      modalState: ModalState.CLOSED,
      displayMode: FilterDisplayMode.COMPACT,
      activeFilterCount: 0,
      filters: {
        cuisineTypes: [],
        priceRanges: [],
        districts: [],
        features: [],
        searchQuery: "",
        pointTypes: ["restaurant", "parking", "toilet"],
      },
      toggleModal: vi.fn(),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      updateFilters: vi.fn(),
      resetFilters: vi.fn(),
      setDisplayMode: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("コンポーネントが正常にレンダリングされること", () => {
      render(<CompactModalFilter {...defaultProps} />);

      expect(screen.getByTestId("compact-modal-filter")).toBeInTheDocument();
    });

    it("FilterTriggerButtonが表示されること", () => {
      render(<CompactModalFilter {...defaultProps} />);

      expect(screen.getByTestId("filter-trigger-button")).toBeInTheDocument();
    });

    it("初期状態ではモーダルが閉じていること", () => {
      render(<CompactModalFilter {...defaultProps} />);

      expect(screen.queryByTestId("filter-modal")).not.toBeInTheDocument();
    });
  });

  describe("モーダル状態管理", () => {
    it("モーダルが開いている時にFilterPanelが表示されること", () => {
      mockUseModalFilter.mockReturnValue({
        state: {
          isOpen: true,
          modalState: ModalState.OPEN,
          displayMode: FilterDisplayMode.COMPACT,
          activeFilterCount: 0,
          filters: {
            cuisineTypes: [],
            priceRanges: [],
            districts: [],
            features: [],
            searchQuery: "",
            pointTypes: ["restaurant", "parking", "toilet"],
          },
          isAnimating: false,
          lastUpdated: new Date(),
        },
        isOpen: true,
        modalState: ModalState.OPEN,
        displayMode: FilterDisplayMode.COMPACT,
        activeFilterCount: 0,
        filters: {
          cuisineTypes: [],
          priceRanges: [],
          districts: [],
          features: [],
          searchQuery: "",
          pointTypes: ["restaurant", "parking", "toilet"],
        },
        toggleModal: vi.fn(),
        openModal: vi.fn(),
        closeModal: vi.fn(),
        updateFilters: vi.fn(),
        resetFilters: vi.fn(),
        setDisplayMode: vi.fn(),
      });

      render(<CompactModalFilter {...defaultProps} />);

      expect(screen.getByTestId("filter-modal")).toBeInTheDocument();
      expect(screen.getByTestId("filter-panel")).toBeInTheDocument();
    });

    it("activeFilterCountがFilterTriggerButtonに渡されること", () => {
      mockUseModalFilter.mockReturnValue({
        state: {
          isOpen: false,
          modalState: ModalState.CLOSED,
          displayMode: FilterDisplayMode.COMPACT,
          activeFilterCount: 5,
          filters: {
            cuisineTypes: [],
            priceRanges: [],
            districts: [],
            features: [],
            searchQuery: "",
            pointTypes: ["restaurant", "parking", "toilet"],
          },
          isAnimating: false,
          lastUpdated: new Date(),
        },
        isOpen: false,
        modalState: ModalState.CLOSED,
        displayMode: FilterDisplayMode.COMPACT,
        activeFilterCount: 5,
        filters: {
          cuisineTypes: [],
          priceRanges: [],
          districts: [],
          features: [],
          searchQuery: "",
          pointTypes: ["restaurant", "parking", "toilet"],
        },
        toggleModal: vi.fn(),
        openModal: vi.fn(),
        closeModal: vi.fn(),
        updateFilters: vi.fn(),
        resetFilters: vi.fn(),
        setDisplayMode: vi.fn(),
      });

      render(<CompactModalFilter {...defaultProps} />);

      expect(screen.getByText("Filters (5)")).toBeInTheDocument();
    });

    it("トリガーボタンクリックでopenModalが呼ばれること", () => {
      const openModal = vi.fn();
      mockUseModalFilter.mockReturnValue({
        state: {
          isOpen: false,
          modalState: ModalState.CLOSED,
          displayMode: FilterDisplayMode.COMPACT,
          activeFilterCount: 0,
          filters: {
            cuisineTypes: [],
            priceRanges: [],
            districts: [],
            features: [],
            searchQuery: "",
            pointTypes: ["restaurant", "parking", "toilet"],
          },
          isAnimating: false,
          lastUpdated: new Date(),
        },
        isOpen: false,
        modalState: ModalState.CLOSED,
        displayMode: FilterDisplayMode.COMPACT,
        activeFilterCount: 0,
        filters: {
          cuisineTypes: [],
          priceRanges: [],
          districts: [],
          features: [],
          searchQuery: "",
          pointTypes: ["restaurant", "parking", "toilet"],
        },
        toggleModal: vi.fn(),
        openModal,
        closeModal: vi.fn(),
        updateFilters: vi.fn(),
        resetFilters: vi.fn(),
        setDisplayMode: vi.fn(),
      });

      render(<CompactModalFilter {...defaultProps} />);

      const button = screen.getByTestId("filter-trigger-button");
      fireEvent.click(button);

      expect(openModal).toHaveBeenCalledTimes(1);
    });
  });

  describe("Props の受け渡し", () => {
    it("loadingがtrueの時にFilterTriggerButtonが無効化されること", () => {
      render(<CompactModalFilter {...defaultProps} loading={true} />);

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toBeDisabled();
    });

    it("resultCountがFilterPanelに渡されること", () => {
      mockUseModalFilter.mockReturnValue({
        state: {
          isOpen: true,
          modalState: ModalState.OPEN,
          displayMode: FilterDisplayMode.COMPACT,
          activeFilterCount: 0,
          filters: {
            cuisineTypes: [],
            priceRanges: [],
            districts: [],
            features: [],
            searchQuery: "",
            pointTypes: ["restaurant", "parking", "toilet"],
          },
          isAnimating: false,
          lastUpdated: new Date(),
        },
        isOpen: true,
        modalState: ModalState.OPEN,
        displayMode: FilterDisplayMode.COMPACT,
        activeFilterCount: 0,
        filters: {
          cuisineTypes: [],
          priceRanges: [],
          districts: [],
          features: [],
          searchQuery: "",
          pointTypes: ["restaurant", "parking", "toilet"],
        },
        toggleModal: vi.fn(),
        openModal: vi.fn(),
        closeModal: vi.fn(),
        updateFilters: vi.fn(),
        resetFilters: vi.fn(),
        setDisplayMode: vi.fn(),
      });

      render(<CompactModalFilter {...defaultProps} resultCount={42} />);

      expect(screen.getByText(/42 results/)).toBeInTheDocument();
    });

    it("statsがFilterPanelに渡されること", () => {
      mockUseModalFilter.mockReturnValue({
        state: {
          isOpen: true,
          modalState: ModalState.OPEN,
          displayMode: FilterDisplayMode.COMPACT,
          activeFilterCount: 0,
          filters: {
            cuisineTypes: [],
            priceRanges: [],
            districts: [],
            features: [],
            searchQuery: "",
            pointTypes: ["restaurant", "parking", "toilet"],
          },
          isAnimating: false,
          lastUpdated: new Date(),
        },
        isOpen: true,
        modalState: ModalState.OPEN,
        displayMode: FilterDisplayMode.COMPACT,
        activeFilterCount: 0,
        filters: {
          cuisineTypes: [],
          priceRanges: [],
          districts: [],
          features: [],
          searchQuery: "",
          pointTypes: ["restaurant", "parking", "toilet"],
        },
        toggleModal: vi.fn(),
        openModal: vi.fn(),
        closeModal: vi.fn(),
        updateFilters: vi.fn(),
        resetFilters: vi.fn(),
        setDisplayMode: vi.fn(),
      });

      const stats = {
        restaurants: 10,
        parkings: 5,
        toilets: 3,
        total: 18,
      };

      render(<CompactModalFilter {...defaultProps} stats={stats} />);

      expect(screen.getByTestId("filter-panel")).toBeInTheDocument();
    });

    it("stats未指定時にデフォルト値が使用されること", () => {
      mockUseModalFilter.mockReturnValue({
        state: {
          isOpen: true,
          modalState: ModalState.OPEN,
          displayMode: FilterDisplayMode.COMPACT,
          activeFilterCount: 0,
          filters: {
            cuisineTypes: [],
            priceRanges: [],
            districts: [],
            features: [],
            searchQuery: "",
            pointTypes: ["restaurant", "parking", "toilet"],
          },
          isAnimating: false,
          lastUpdated: new Date(),
        },
        isOpen: true,
        modalState: ModalState.OPEN,
        displayMode: FilterDisplayMode.COMPACT,
        activeFilterCount: 0,
        filters: {
          cuisineTypes: [],
          priceRanges: [],
          districts: [],
          features: [],
          searchQuery: "",
          pointTypes: ["restaurant", "parking", "toilet"],
        },
        toggleModal: vi.fn(),
        openModal: vi.fn(),
        closeModal: vi.fn(),
        updateFilters: vi.fn(),
        resetFilters: vi.fn(),
        setDisplayMode: vi.fn(),
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { stats: _stats, ...propsWithoutStats } = defaultProps;
      render(<CompactModalFilter {...propsWithoutStats} />);

      expect(screen.getByTestId("filter-panel")).toBeInTheDocument();
    });
  });

  describe("className と data-testid", () => {
    it("カスタムclassNameが適用されること", () => {
      render(<CompactModalFilter {...defaultProps} className="custom-class" />);

      const element = screen.getByTestId("compact-modal-filter");
      expect(element).toHaveClass("compact-modal-filter", "custom-class");
    });

    it("カスタムdata-testidが適用されること", () => {
      render(
        <CompactModalFilter {...defaultProps} data-testid="custom-testid" />
      );

      expect(screen.getByTestId("custom-testid")).toBeInTheDocument();
    });

    it("デフォルトのdata-testidが使用されること", () => {
      render(<CompactModalFilter {...defaultProps} />);

      expect(screen.getByTestId("compact-modal-filter")).toBeInTheDocument();
    });
  });

  describe("フィルターハンドラーの統合", () => {
    it("全てのフィルターハンドラーがFilterPanelに渡されること", () => {
      mockUseModalFilter.mockReturnValue({
        state: {
          isOpen: true,
          modalState: ModalState.OPEN,
          displayMode: FilterDisplayMode.COMPACT,
          activeFilterCount: 0,
          filters: {
            cuisineTypes: [],
            priceRanges: [],
            districts: [],
            features: [],
            searchQuery: "",
            pointTypes: ["restaurant", "parking", "toilet"],
          },
          isAnimating: false,
          lastUpdated: new Date(),
        },
        isOpen: true,
        modalState: ModalState.OPEN,
        displayMode: FilterDisplayMode.COMPACT,
        activeFilterCount: 0,
        filters: {
          cuisineTypes: [],
          priceRanges: [],
          districts: [],
          features: [],
          searchQuery: "",
          pointTypes: ["restaurant", "parking", "toilet"],
        },
        toggleModal: vi.fn(),
        openModal: vi.fn(),
        closeModal: vi.fn(),
        updateFilters: vi.fn(),
        resetFilters: vi.fn(),
        setDisplayMode: vi.fn(),
      });

      render(<CompactModalFilter {...defaultProps} />);

      expect(screen.getByTestId("filter-panel")).toBeInTheDocument();
    });
  });

  describe("displayName", () => {
    it("displayNameが設定されていること", () => {
      expect(CompactModalFilter.displayName).toBe("CompactModalFilter");
    });
  });

  describe("エッジケース", () => {
    it("ハンドラーがundefinedでもエラーが発生しないこと", () => {
      const propsWithoutHandlers = {
        loading: false,
        resultCount: 0,
        stats: defaultProps.stats,
      };

      expect(() => {
        render(<CompactModalFilter {...propsWithoutHandlers} />);
      }).not.toThrow();
    });

    it("loadingとresultCountが同時に変更されても正常に動作すること", () => {
      mockUseModalFilter.mockReturnValue({
        state: {
          isOpen: true,
          modalState: ModalState.OPEN,
          displayMode: FilterDisplayMode.COMPACT,
          activeFilterCount: 0,
          filters: {
            cuisineTypes: [],
            priceRanges: [],
            districts: [],
            features: [],
            searchQuery: "",
            pointTypes: ["restaurant", "parking", "toilet"],
          },
          isAnimating: false,
          lastUpdated: new Date(),
        },
        isOpen: true,
        modalState: ModalState.OPEN,
        displayMode: FilterDisplayMode.COMPACT,
        activeFilterCount: 0,
        filters: {
          cuisineTypes: [],
          priceRanges: [],
          districts: [],
          features: [],
          searchQuery: "",
          pointTypes: ["restaurant", "parking", "toilet"],
        },
        toggleModal: vi.fn(),
        openModal: vi.fn(),
        closeModal: vi.fn(),
        updateFilters: vi.fn(),
        resetFilters: vi.fn(),
        setDisplayMode: vi.fn(),
      });

      const { rerender } = render(
        <CompactModalFilter {...defaultProps} loading={false} resultCount={0} />
      );

      rerender(
        <CompactModalFilter
          {...defaultProps}
          loading={true}
          resultCount={100}
        />
      );

      expect(screen.getByText(/100 results/)).toBeInTheDocument();
    });
  });
});
