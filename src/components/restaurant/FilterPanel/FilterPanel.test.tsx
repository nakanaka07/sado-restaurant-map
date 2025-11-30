/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterPanel } from "./FilterPanel";

// ========================
// Mock Setup
// ========================

// Mock子コンポーネント
vi.mock("./SearchFilter", () => ({
  SearchFilter: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div data-testid="search-filter">
      <input
        type="text"
        value={value}
        onChange={onChange}
        data-testid="search-input"
      />
    </div>
  ),
}));

vi.mock("./CuisineFilter", () => ({
  CuisineFilter: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  }) => (
    <div data-testid="cuisine-filter">
      <select value={value} onChange={onChange} data-testid="cuisine-select">
        <option value="">すべて</option>
        <option value="日本料理">日本料理</option>
      </select>
    </div>
  ),
}));

vi.mock("./PriceFilter", () => ({
  PriceFilter: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  }) => (
    <div data-testid="price-filter">
      <select value={value} onChange={onChange} data-testid="price-select">
        <option value="">すべて</option>
        <option value="1000-2000円">1000-2000円</option>
      </select>
    </div>
  ),
}));

vi.mock("./DistrictFilter", () => ({
  DistrictFilter: ({
    selectedDistricts,
    onToggle,
  }: {
    selectedDistricts: string[];
    onToggle: (district: string) => void;
  }) => (
    <div data-testid="district-filter">
      <button onClick={() => onToggle("両津")} data-testid="district-toggle">
        両津 {selectedDistricts.includes("両津") ? "✓" : ""}
      </button>
    </div>
  ),
}));

vi.mock("./FeatureFilter", () => ({
  FeatureFilter: ({
    selectedFeatures,
    onToggle,
  }: {
    selectedFeatures: string[];
    onToggle: (feature: string) => void;
  }) => (
    <div data-testid="feature-filter">
      <button onClick={() => onToggle("駐車場")} data-testid="feature-toggle">
        駐車場 {selectedFeatures.includes("駐車場") ? "✓" : ""}
      </button>
    </div>
  ),
}));

vi.mock("./MapLegend", () => ({
  MapLegend: () => <div data-testid="map-legend">凡例</div>,
}));

// useFilterStateのモック
const mockUseFilterState = vi.fn();
vi.mock("./useFilterState", () => ({
  useFilterState: (handlers: unknown) =>
    mockUseFilterState(handlers) as ReturnType<typeof createMockFilterState>,
}));

// ========================
// Test Data
// ========================

interface MockFilterStateOverrides {
  [key: string]: unknown;
}

const createMockFilterState = (overrides?: MockFilterStateOverrides) => ({
  searchQuery: "",
  selectedCuisine: "" as const,
  selectedPrice: "" as const,
  selectedDistricts: [],
  selectedRating: undefined,
  openNow: false,
  selectedSort: "name" as const,
  selectedFeatures: [],
  selectedPointTypes: ["restaurant", "parking", "toilet"] as const,
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
  ...overrides,
});

interface MockFilterPanelProps {
  loading?: boolean;
  resultCount?: number;
  stats?: {
    restaurants: number;
    parkings: number;
    toilets: number;
    total: number;
  };
}

const createDefaultProps = (overrides?: MockFilterPanelProps) => ({
  loading: false,
  resultCount: 10,
  ...overrides,
});

// ========================
// Tests
// ========================

describe("FilterPanel", () => {
  let mockFilterState: ReturnType<typeof createMockFilterState>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFilterState = createMockFilterState();
    mockUseFilterState.mockReturnValue(mockFilterState);
  });

  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("フィルターパネルが正しく表示される", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      expect(screen.getByText("🔍 フィルター")).toBeInTheDocument();
      expect(screen.getByText("📊 10件")).toBeInTheDocument();
    });

    it("すべての子コンポーネントが表示される", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      expect(screen.getByTestId("search-filter")).toBeInTheDocument();
      expect(screen.getByTestId("cuisine-filter")).toBeInTheDocument();
      expect(screen.getByTestId("price-filter")).toBeInTheDocument();
      expect(screen.getByTestId("district-filter")).toBeInTheDocument();
      expect(screen.getByTestId("feature-filter")).toBeInTheDocument();
      expect(screen.getByTestId("map-legend")).toBeInTheDocument();
    });

    it("評価フィルターが表示される", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      expect(screen.getByText("⭐ 評価")).toBeInTheDocument();
      expect(screen.getByLabelText("⭐ 評価")).toBeInTheDocument();
    });

    it("営業中フィルターが表示される", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      expect(screen.getByText("🕐 営業中のみ表示")).toBeInTheDocument();
    });

    it("ポイントタイプフィルターが表示される", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      expect(screen.getByText("📍 表示ポイント")).toBeInTheDocument();
      expect(screen.getByText("🍽️ 飲食店")).toBeInTheDocument();
      expect(screen.getByText("🅿️ 駐車場")).toBeInTheDocument();
      expect(screen.getByText("🚻 トイレ")).toBeInTheDocument();
    });

    it("ソートセレクトが表示される", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      expect(screen.getByText("📊 並び順")).toBeInTheDocument();
      expect(screen.getByLabelText("📊 並び順")).toBeInTheDocument();
    });

    it("リセットボタンが表示される", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      expect(screen.getByText("🔄 フィルターをリセット")).toBeInTheDocument();
    });
  });

  describe("統計情報の表示", () => {
    it("stats付きで詳細統計が表示される", () => {
      const props = createDefaultProps({
        resultCount: 25,
        stats: {
          restaurants: 20,
          parkings: 3,
          toilets: 2,
          total: 25,
        },
      });
      render(<FilterPanel {...props} />);

      expect(screen.getByText("📊 25件")).toBeInTheDocument();
      expect(screen.getByText("🍽️ 20")).toBeInTheDocument();
      expect(screen.getByText("🅿️ 3")).toBeInTheDocument();
      expect(screen.getByText("🚻 2")).toBeInTheDocument();
    });

    it("statsなしでは詳細統計が非表示", () => {
      const props = createDefaultProps({
        resultCount: 10,
        stats: undefined,
      });
      render(<FilterPanel {...props} />);

      expect(screen.getByText("📊 10件")).toBeInTheDocument();
      // stats由来の詳細カウント（"🍽️ 20"形式）が非表示
      expect(screen.queryByText(/🍽️ \d+/)).not.toBeInTheDocument();
    });

    it("resultCount=0で結果なしメッセージが表示される", () => {
      const props = createDefaultProps({
        resultCount: 0,
      });
      render(<FilterPanel {...props} />);

      expect(screen.getByText("📊 0件")).toBeInTheDocument();
      expect(
        screen.getByText("条件に一致するポイントが見つかりませんでした")
      ).toBeInTheDocument();
    });

    it("resultCount>0では結果なしメッセージが非表示", () => {
      const props = createDefaultProps({
        resultCount: 5,
      });
      render(<FilterPanel {...props} />);

      expect(
        screen.queryByText("条件に一致するポイントが見つかりませんでした")
      ).not.toBeInTheDocument();
    });
  });

  describe("評価フィルター", () => {
    it("評価セレクトボックスが正しく動作する", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const ratingSelect = screen.getByLabelText("⭐ 評価");
      fireEvent.change(ratingSelect, { target: { value: "4" } });

      expect(mockFilterState.handleRatingChange).toHaveBeenCalledTimes(1);
    });

    it("評価フィルターの初期値が正しく設定される", () => {
      mockFilterState.selectedRating = 4;
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const ratingSelect = screen.getByLabelText("⭐ 評価");
      expect(ratingSelect.value).toBe("4");
    });

    it("評価フィルターのすべてのオプションが表示される", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const ratingSelect = screen.getByLabelText("⭐ 評価");
      expect(ratingSelect).toContainHTML("すべての評価");
      expect(ratingSelect).toContainHTML("4.0以上");
      expect(ratingSelect).toContainHTML("3.0以上");
      expect(ratingSelect).toContainHTML("2.0以上");
    });
  });

  describe("営業中フィルター", () => {
    it("営業中チェックボックスが正しく動作する", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const checkbox = screen.getByRole("checkbox", {
        name: /営業中のみ表示/,
      });
      fireEvent.click(checkbox);

      expect(mockFilterState.handleOpenNowChange).toHaveBeenCalledTimes(1);
    });

    it("営業中チェックボックスの初期状態が正しい", () => {
      mockFilterState.openNow = true;
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const checkbox = screen.getByRole("checkbox", {
        name: /営業中のみ表示/,
      });
      expect(checkbox.checked).toBe(true);
    });

    it("営業中チェックボックスの初期状態がfalse", () => {
      mockFilterState.openNow = false;
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const checkbox = screen.getByRole("checkbox", {
        name: /営業中のみ表示/,
      });
      expect(checkbox.checked).toBe(false);
    });
  });

  describe("ポイントタイプフィルター", () => {
    it("飲食店チェックボックスが正しく動作する", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const checkbox = screen.getByRole("checkbox", { name: /飲食店/ });
      fireEvent.click(checkbox);

      expect(mockFilterState.handlePointTypeToggle).toHaveBeenCalledWith(
        "restaurant"
      );
    });

    it("駐車場チェックボックスが正しく動作する", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const checkbox = screen.getByRole("checkbox", { name: /駐車場/ });
      fireEvent.click(checkbox);

      expect(mockFilterState.handlePointTypeToggle).toHaveBeenCalledWith(
        "parking"
      );
    });

    it("トイレチェックボックスが正しく動作する", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const checkbox = screen.getByRole("checkbox", { name: /トイレ/ });
      fireEvent.click(checkbox);

      expect(mockFilterState.handlePointTypeToggle).toHaveBeenCalledWith(
        "toilet"
      );
    });

    it("ポイントタイプの初期状態が正しく反映される", () => {
      mockFilterState.selectedPointTypes = ["restaurant"];
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const restaurantCheckbox = screen.getByRole("checkbox", {
        name: /飲食店/,
      });
      const parkingCheckbox = screen.getByRole("checkbox", {
        name: /駐車場/,
      });

      expect(restaurantCheckbox.checked).toBe(true);
      expect(parkingCheckbox.checked).toBe(false);
    });
  });

  describe("ソート機能", () => {
    it("ソートセレクトボックスが正しく動作する", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const sortSelect = screen.getByLabelText("📊 並び順");
      fireEvent.change(sortSelect, { target: { value: "rating" } });

      expect(mockFilterState.handleSortChange).toHaveBeenCalledTimes(1);
    });

    it("ソートの初期値が正しく設定される", () => {
      mockFilterState.selectedSort = "distance";
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const sortSelect = screen.getByLabelText("📊 並び順");
      expect(sortSelect.value).toBe("distance");
    });

    it("ソートのすべてのオプションが表示される", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const sortSelect = screen.getByLabelText("📊 並び順");
      expect(sortSelect).toContainHTML("名前順");
      expect(sortSelect).toContainHTML("評価順");
      expect(sortSelect).toContainHTML("距離順");
    });
  });

  describe("リセット機能", () => {
    it("リセットボタンクリックでhandleResetFiltersが呼ばれる", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const resetButton = screen.getByText("🔄 フィルターをリセット");
      fireEvent.click(resetButton);

      expect(mockFilterState.handleResetFilters).toHaveBeenCalledTimes(1);
    });

    it("loading=trueでリセットボタンが無効化される", () => {
      const props = createDefaultProps({ loading: true });
      render(<FilterPanel {...props} />);

      const resetButton = screen.getByText("🔄 フィルターをリセット");
      expect(resetButton.disabled).toBe(true);
    });

    it("loading=falseでリセットボタンが有効", () => {
      const props = createDefaultProps({ loading: false });
      render(<FilterPanel {...props} />);

      const resetButton = screen.getByText("🔄 フィルターをリセット");
      expect(resetButton.disabled).toBe(false);
    });

    it("リセットボタンにaria-describedbyがある", () => {
      const props = createDefaultProps();
      render(<FilterPanel {...props} />);

      const resetButton = screen.getByText("🔄 フィルターをリセット");
      expect(resetButton).toHaveAttribute("aria-describedby", "reset-help");
      expect(
        screen.getByText("すべてのフィルター設定をクリアします")
      ).toBeInTheDocument();
    });
  });

  describe("propsの伝搬", () => {
    it("onCuisineFilterハンドラーがuseFilterStateに渡される", () => {
      const onCuisineFilter = vi.fn();
      const props = createDefaultProps({ onCuisineFilter });
      render(<FilterPanel {...props} />);

      expect(mockUseFilterState).toHaveBeenCalledWith(
        expect.objectContaining({ onCuisineFilter })
      );
    });

    it("onResetFiltersハンドラーがuseFilterStateに渡される", () => {
      const onResetFilters = vi.fn();
      const props = createDefaultProps({ onResetFilters });
      render(<FilterPanel {...props} />);

      expect(mockUseFilterState).toHaveBeenCalledWith(
        expect.objectContaining({ onResetFilters })
      );
    });

    it("すべてのハンドラーがuseFilterStateに渡される", () => {
      const handlers = {
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
      const props = createDefaultProps(handlers);
      render(<FilterPanel {...props} />);

      expect(mockUseFilterState).toHaveBeenCalledWith(
        expect.objectContaining(handlers)
      );
    });
  });
});
