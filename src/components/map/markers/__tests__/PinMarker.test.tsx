/**
 * @fileoverview PinMarker comprehensive tests
 *
 * Coverage targets:
 * - Basic rendering with AdvancedMarker + Pin
 * - Size configuration (small/medium/large)
 * - Click handling
 * - Color mapping via getMarkerColor()
 * - ARIA label generation (default + custom)
 * - Selection state (zIndex, borderColor)
 * - All point types (Restaurant/Parking/Toilet)
 * - Edge cases
 *
 * Expected: 47 lines, 19.14% → 85%+ coverage (+0.3% overall)
 */

import type { Parking, Restaurant, Toilet } from "@/types";
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PinMarker } from "../PinMarker";

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
  Pin: ({
    background,
    borderColor,
    scale,
  }: {
    background?: string;
    borderColor?: string | null;
    scale?: number;
  }) => (
    <div
      data-testid="pin"
      data-background={background}
      data-border-color={borderColor ?? "none"}
      data-scale={scale}
    />
  ),
}));

// markerColorUtils mocking
vi.mock("../utils/markerColorUtils", () => ({
  getMarkerColor: vi.fn((point: { type: string }) => {
    if (point.type === "restaurant") return "#D32F2F";
    if (point.type === "parking") return "#4CAF50";
    if (point.type === "toilet") return "#2196F3";
    return "#757575";
  }),
}));

// ==============================
// Test Data
// ==============================

const mockRestaurant: Restaurant = {
  id: "test-restaurant-1",
  type: "restaurant",
  name: "テスト和食レストラン",
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
  features: ["バリアフリー", "多目的トイレ"],
  lastUpdated: "2024-01-01",
};

// ==============================
// Tests
// ==============================

describe("PinMarker", () => {
  let mockOnClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClick = vi.fn();
  });

  afterEach(() => {
    cleanup(); // 全体テストスイート実行時のDOM累積を防ぐ
    vi.clearAllMocks();
  });

  // ==============================
  // Basic Rendering
  // ==============================

  describe("基本レンダリング", () => {
    it("AdvancedMarkerとPinが正しくレンダリングされること", () => {
      render(
        <PinMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      expect(screen.getByTestId("advanced-marker")).toBeInTheDocument();
      expect(screen.getByTestId("pin")).toBeInTheDocument();
    });

    it("レストランポイントが正しい色でレンダリングされること", () => {
      render(
        <PinMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-background", "#D32F2F");
    });

    it("駐車場ポイントが正しい色でレンダリングされること", () => {
      render(
        <PinMarker point={mockParking} onClick={mockOnClick} size="medium" />
      );

      const pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-background", "#4CAF50");
    });

    it("トイレポイントが正しい色でレンダリングされること", () => {
      render(
        <PinMarker point={mockToilet} onClick={mockOnClick} size="medium" />
      );

      const pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-background", "#2196F3");
    });
  });

  // ==============================
  // Size Configuration
  // ==============================

  describe("サイズ設定", () => {
    it("size='small'の場合、scale=0.8が設定されること", () => {
      render(
        <PinMarker point={mockRestaurant} onClick={mockOnClick} size="small" />
      );

      const pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-scale", "0.8");
    });

    it("size='medium'の場合、scale=1.0が設定されること", () => {
      render(
        <PinMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-scale", "1");
    });

    it("size='large'の場合、scale=1.3が設定されること", () => {
      render(
        <PinMarker point={mockRestaurant} onClick={mockOnClick} size="large" />
      );

      const pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-scale", "1.3");
    });
  });

  // ==============================
  // Selection State
  // ==============================

  describe("選択状態", () => {
    it("isSelected=trueの場合、borderColorが白色になること", () => {
      render(
        <PinMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
        />
      );

      const pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-border-color", "#FFFFFF");
    });

    it("isSelected=falseの場合、borderColorがnullになること", () => {
      render(
        <PinMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={false}
        />
      );

      const pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-border-color", "none");
    });

    it("isSelectedがundefinedの場合、borderColorがnullになること", () => {
      render(
        <PinMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-border-color", "none");
    });
  });

  // ==============================
  // Click Handling
  // ==============================

  describe("クリックハンドリング", () => {
    it("マーカークリックでonClickが呼ばれること", async () => {
      const user = userEvent.setup();
      render(
        <PinMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByTestId("advanced-marker");
      await user.click(marker);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(mockRestaurant);
    });

    it("異なるポイントタイプでも正しくonClickが機能すること", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <PinMarker point={mockParking} onClick={mockOnClick} size="medium" />
      );

      let marker = screen.getByTestId("advanced-marker");
      await user.click(marker);
      expect(mockOnClick).toHaveBeenCalledWith(mockParking);

      rerender(
        <PinMarker point={mockToilet} onClick={mockOnClick} size="medium" />
      );

      marker = screen.getByTestId("advanced-marker");
      await user.click(marker);
      expect(mockOnClick).toHaveBeenCalledWith(mockToilet);
    });
  });

  // ==============================
  // ARIA Label Generation
  // ==============================

  describe("ARIAラベル生成", () => {
    it("レストランのデフォルトARIAラベルが正しく生成されること", () => {
      render(
        <PinMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("レストラン: テスト和食レストラン");
    });

    it("駐車場のデフォルトARIAラベルが正しく生成されること", () => {
      render(
        <PinMarker point={mockParking} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("駐車場: テスト駐車場");
    });

    it("トイレのデフォルトARIAラベルが正しく生成されること", () => {
      // 実装: Toilet型にはisAccessibleプロパティがないため、point.nameのみ返される
      render(
        <PinMarker point={mockToilet} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("テストトイレ");
    });

    it("カスタムariaLabelが優先されること", () => {
      render(
        <PinMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          ariaLabel="カスタムラベル"
        />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("カスタムラベル");
    });
  });

  // ==============================
  // Edge Cases
  // ==============================

  describe("エッジケース", () => {
    it("ポイント名が空文字列でもクラッシュしないこと", () => {
      const emptyNamePoint = { ...mockRestaurant, name: "" };
      render(
        <PinMarker point={emptyNamePoint} onClick={mockOnClick} size="medium" />
      );

      expect(screen.getByTestId("pin")).toBeInTheDocument();
    });

    it("座標が極端な値でもレンダリングされること", () => {
      const extremeCoordPoint = {
        ...mockRestaurant,
        coordinates: { lat: 89.9, lng: 179.9 },
      };
      render(
        <PinMarker
          point={extremeCoordPoint}
          onClick={mockOnClick}
          size="medium"
        />
      );

      expect(screen.getByTestId("advanced-marker")).toBeInTheDocument();
    });

    it("複数のマーカーを同時にレンダリングできること", () => {
      const { container } = render(
        <>
          <PinMarker
            point={mockRestaurant}
            onClick={mockOnClick}
            size="medium"
          />
          <PinMarker point={mockParking} onClick={mockOnClick} size="small" />
          <PinMarker point={mockToilet} onClick={mockOnClick} size="large" />
        </>
      );

      const pins = container.querySelectorAll('[data-testid="pin"]');
      expect(pins).toHaveLength(3);
    });
  });

  // ==============================
  // Integration
  // ==============================

  describe("統合シナリオ", () => {
    it("選択→クリック→選択解除のフローが正しく動作すること", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <PinMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
        />
      );

      let pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-border-color", "#FFFFFF");

      const marker = screen.getByTestId("advanced-marker");
      await user.click(marker);
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      rerender(
        <PinMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={false}
        />
      );

      pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-border-color", "none");
    });

    it("サイズ変更が即座に反映されること", () => {
      const { rerender } = render(
        <PinMarker point={mockRestaurant} onClick={mockOnClick} size="small" />
      );

      let pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-scale", "0.8");

      rerender(
        <PinMarker point={mockRestaurant} onClick={mockOnClick} size="large" />
      );

      pin = screen.getByTestId("pin");
      expect(pin).toHaveAttribute("data-scale", "1.3");
    });
  });
});
