import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FilterPanel } from "./FilterPanel";

vi.mock("@/utils/analytics", () => ({
  trackSearch: vi.fn(),
  trackFilter: vi.fn(),
}));

describe("FilterPanel", () => {
  const mockProps = {
    loading: false,
    resultCount: 10,
    onCuisineFilter: vi.fn(),
    onPriceFilter: vi.fn(),
    onSearchFilter: vi.fn(),
    onSortChange: vi.fn(),
    onFeatureFilter: vi.fn(),
    onResetFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("正常にレンダリングされること", () => {
    expect(() => {
      render(<FilterPanel {...mockProps} />);
    }).not.toThrow();
  });

  it("フィルターコンポーネントが表示されること", () => {
    render(<FilterPanel {...mockProps} />);
    expect(screen.getByText("フィルター")).toBeInTheDocument();
  });
});
