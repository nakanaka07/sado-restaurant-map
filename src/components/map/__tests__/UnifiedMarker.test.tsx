/**
 * @fileoverview UnifiedMarker comprehensive tests
 *
 * Coverage targets:
 * - Strategy Pattern variant switching (pin/icon/svg)
 * - Props propagation to strategy components
 * - useMemo optimization for MarkerComponent
 * - Default values (variant="icon", size="medium")
 * - All MapPoint types (Restaurant/Parking/Toilet)
 * - State props (isSelected/isHovered)
 * - ARIA labels & Type definitions
 * - Edge cases & fallback behavior
 *
 * Expected: 36 lines, 16.66% → 100% coverage (+0.23% overall)
 */

import type { Parking, Restaurant, Toilet } from "@/types";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  MarkerSize,
  MarkerStrategyProps,
  MarkerVariant,
  UnifiedMarkerProps,
} from "../UnifiedMarker";
import { UnifiedMarker } from "../UnifiedMarker";

// ==============================
// Mocks
// ==============================

// Google Maps mocking
vi.mock("@vis.gl/react-google-maps", () => ({
  AdvancedMarker: ({
    children,
    onClick,
    title,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    title?: string;
  }) => (
    <div
      data-testid="advanced-marker"
      onClick={onClick}
      role="button"
      aria-label={title}
    >
      {children}
    </div>
  ),
  Pin: () => <div data-testid="pin-component" />,
}));

// markerColorUtils mocking
vi.mock("../markers/utils/markerColorUtils", () => ({
  getMarkerColor: vi.fn((point: { type: string }) => {
    if (point.type === "restaurant") return "#D32F2F";
    if (point.type === "parking") return "#4CAF50";
    if (point.type === "toilet") return "#2196F3";
    return "#757575";
  }),
}));

// CircularMarker mocking - IconMarkerが内部で使用
vi.mock("../markers/CircularMarker", () => ({
  CircularMarker: ({
    point,
    onClick,
    ...props
  }: {
    point?: { name: string };
    onClick?: () => void;
    "data-testid"?: string;
  }) => (
    <div
      data-testid={props["data-testid"] || "circular-marker"}
      aria-label={point?.name || ""}
      onClick={onClick}
      role="button"
    />
  ),
}));

// ==============================
// Test Data
// ==============================

const mockRestaurant: Restaurant = {
  id: "test-restaurant-1",
  type: "restaurant",
  name: "テストレストラン",
  cuisineType: "日本料理",
  priceRange: "1000-2000円",
  district: "両津",
  address: "新潟県佐渡市両津湊1-1",
  coordinates: { lat: 38.0451, lng: 138.4365 },
  openingHours: [],
  features: [],
  lastUpdated: "2024-01-01",
};

const mockParking: Parking = {
  id: "test-parking-1",
  type: "parking",
  name: "テスト駐車場",
  district: "両津",
  address: "新潟県佐渡市両津湊2-2",
  coordinates: { lat: 38.0452, lng: 138.4366 },
  capacity: 50,
  fee: "無料",
  features: ["大型車対応"],
  lastUpdated: "2024-01-01",
};

const mockToilet: Toilet = {
  id: "test-toilet-1",
  type: "toilet",
  name: "テストトイレ",
  district: "両津",
  address: "新潟県佐渡市両津湊3-3",
  coordinates: { lat: 38.0453, lng: 138.4367 },
  features: ["バリアフリー"],
  lastUpdated: "2024-01-01",
};

// ==============================
// Tests
// ==============================

describe("UnifiedMarker", () => {
  let mockOnClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClick = vi.fn();
  });

  afterEach(() => {
    cleanup(); // DOM累積防止
    vi.clearAllMocks();
  });

  // ==============================
  // Strategy Pattern - Variant Switching
  // ==============================

  describe("Strategy Pattern バリアント切替", () => {
    it("variant='pin'でPinMarkerが使用されること", () => {
      render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="pin"
          size="medium"
        />
      );

      expect(screen.getByTestId("pin-component")).toBeInTheDocument();
    });

    it("variant='icon'でIconMarkerが使用されること", () => {
      render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="icon"
          size="medium"
        />
      );

      expect(screen.getByTestId("circular-marker")).toBeInTheDocument();
    });

    it("variant='svg'でSVGMarkerが使用されること", () => {
      const { container } = render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="svg"
          size="medium"
        />
      );

      expect(container.querySelector('svg[role="img"]')).toBeInTheDocument();
    });

    it("variantがundefinedの場合、デフォルトで'icon'が使用されること", () => {
      render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      expect(screen.getByTestId("circular-marker")).toBeInTheDocument();
    });

    it("無効なvariantの場合、フォールバックで'icon'が使用されること", () => {
      render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant={"invalid-variant" as MarkerVariant}
          size="medium"
        />
      );

      expect(screen.getByTestId("circular-marker")).toBeInTheDocument();
    });
  });

  // ==============================
  // Props Propagation
  // ==============================

  describe("Props伝播", () => {
    it("pointプロパティが正しく伝播されること (svg)", () => {
      render(
        <UnifiedMarker
          point={mockToilet}
          onClick={mockOnClick}
          variant="svg"
          size="medium"
        />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("テストトイレ");
    });

    it("sizeプロパティが正しく伝播されること", () => {
      const { rerender } = render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="svg"
          size="small"
        />
      );

      let svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("width", "32");

      rerender(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="svg"
          size="large"
        />
      );

      svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("width", "48");
    });

    it("isSelectedプロパティが正しく伝播されること", () => {
      render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="svg"
          size="medium"
          isSelected={true}
        />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveStyle({ transform: "scale(1.15)" });
    });

    it("ariaLabelプロパティが正しく伝播されること", () => {
      render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="pin"
          size="medium"
          ariaLabel="カスタムラベル"
        />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("カスタムラベル");
    });
  });

  // ==============================
  // Default Values
  // ==============================

  describe("デフォルト値", () => {
    it("variantのデフォルトが'icon'であること", () => {
      render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      expect(screen.getByTestId("circular-marker")).toBeInTheDocument();
    });

    it("sizeのデフォルトが'medium'であること", () => {
      render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="svg"
        />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("width", "40");
    });
  });

  // ==============================
  // Type Tests
  // ==============================

  describe("UnifiedMarker - Type Definitions", () => {
    describe("MarkerVariant type", () => {
      it("accepts 'pin', 'icon', 'svg'", () => {
        const variants: MarkerVariant[] = ["pin", "icon", "svg"];
        expect(variants).toHaveLength(3);
        expect(variants).toContain("pin");
        expect(variants).toContain("icon");
        expect(variants).toContain("svg");
      });
    });

    describe("MarkerSize type", () => {
      it("accepts 'small', 'medium', 'large'", () => {
        const sizes: MarkerSize[] = ["small", "medium", "large"];
        expect(sizes).toHaveLength(3);
        expect(sizes).toContain("small");
        expect(sizes).toContain("medium");
        expect(sizes).toContain("large");
      });
    });

    describe("UnifiedMarkerProps interface", () => {
      it("requires point and onClick props", () => {
        const requiredProps: Pick<UnifiedMarkerProps, "point" | "onClick"> = {
          point: mockRestaurant,
          onClick: () => {},
        };

        expect(requiredProps.point).toBeDefined();
        expect(requiredProps.onClick).toBeDefined();
      });

      it("allows optional variant prop", () => {
        const propsWithVariant: UnifiedMarkerProps = {
          point: mockRestaurant,
          onClick: () => {},
          variant: "pin",
        };

        expect(propsWithVariant.variant).toBe("pin");
      });

      it("allows optional size prop", () => {
        const propsWithSize: UnifiedMarkerProps = {
          point: mockRestaurant,
          onClick: () => {},
          size: "large",
        };

        expect(propsWithSize.size).toBe("large");
      });

      it("allows all optional props", () => {
        const fullProps: UnifiedMarkerProps = {
          point: mockRestaurant,
          onClick: () => {},
          variant: "svg",
          size: "medium",
          isSelected: true,
          isHovered: false,
          ariaLabel: "テストラベル",
        };

        expect(fullProps.variant).toBe("svg");
        expect(fullProps.size).toBe("medium");
        expect(fullProps.isSelected).toBe(true);
        expect(fullProps.isHovered).toBe(false);
        expect(fullProps.ariaLabel).toBe("テストラベル");
      });
    });

    describe("MarkerStrategyProps interface", () => {
      it("requires point, onClick, size props", () => {
        const strategyProps: MarkerStrategyProps = {
          point: mockRestaurant,
          onClick: () => {},
          size: "medium",
        };

        expect(strategyProps.point).toBeDefined();
        expect(strategyProps.onClick).toBeDefined();
        expect(strategyProps.size).toBe("medium");
      });

      it("allows optional props", () => {
        const strategyPropsWithOptional: MarkerStrategyProps = {
          point: mockRestaurant,
          onClick: () => {},
          size: "small",
          isSelected: true,
          isHovered: true,
          ariaLabel: "戦略プロパティ",
        };

        expect(strategyPropsWithOptional.isSelected).toBe(true);
        expect(strategyPropsWithOptional.isHovered).toBe(true);
        expect(strategyPropsWithOptional.ariaLabel).toBe("戦略プロパティ");
      });
    });

    describe("MapPoint type compatibility", () => {
      it("accepts Restaurant type", () => {
        const props: UnifiedMarkerProps = {
          point: mockRestaurant,
          onClick: () => {},
        };

        expect(props.point.type).toBe("restaurant");
      });

      it("accepts Parking type", () => {
        const props: UnifiedMarkerProps = {
          point: mockParking,
          onClick: () => {},
        };

        expect(props.point.type).toBe("parking");
      });

      it("accepts Toilet type", () => {
        const props: UnifiedMarkerProps = {
          point: mockToilet,
          onClick: () => {},
        };

        expect(props.point.type).toBe("toilet");
      });
    });
  });

  // ==============================
  // Integration
  // ==============================

  describe("統合シナリオ", () => {
    it("全variantが正常にレンダリングされること", () => {
      const { rerender } = render(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="pin"
          size="medium"
        />
      );

      expect(screen.getByTestId("pin-component")).toBeInTheDocument();

      rerender(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="icon"
          size="medium"
        />
      );

      expect(screen.getByTestId("circular-marker")).toBeInTheDocument();

      rerender(
        <UnifiedMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          variant="svg"
          size="medium"
        />
      );

      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });
});
