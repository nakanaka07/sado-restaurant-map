import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FilterPanel } from "./FilterPanel";

// Analytics関数のモック
vi.mock("@/utils/analytics", () => ({
  trackSearch: vi.fn(),
  trackFilter: vi.fn(),
  initGA: vi.fn().mockResolvedValue(undefined),
  trackEvent: vi.fn(),
  trackRestaurantClick: vi.fn(),
  trackMapInteraction: vi.fn(),
  trackPWAUsage: vi.fn(),
  trackPageView: vi.fn(),
  checkGAStatus: vi.fn().mockResolvedValue({}),
  debugGA: vi.fn().mockResolvedValue({}),
  runGADiagnostics: vi.fn().mockReturnValue({}),
  sendTestEvents: vi.fn(),
  autoFixGA: vi.fn().mockReturnValue({}),
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

    // DOM環境の確認と設定
    if (typeof document === "undefined") {
      Object.defineProperty(globalThis, "document", {
        value: {
          createElement: vi.fn(() => ({})),
          getElementById: vi.fn(() => null),
          querySelector: vi.fn(() => null),
          querySelectorAll: vi.fn(() => []),
        },
        configurable: true,
      });
    }
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
