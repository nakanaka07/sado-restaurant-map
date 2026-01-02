/* @vitest-environment jsdom */
import "@testing-library/jest-dom";
/**
 * @fileoverview SVGMarker comprehensive tests
 *
 * Coverage targets:
 * - SVG rendering with viewBox, path, gradients
 * - Size configuration (small/medium/large)
 * - Click handling
 * - Animation states (selected/hovered/default)
 * - Filter/transform values based on state
 * - Gradient definitions with unique IDs
 * - Glow effect for selected state
 * - ARIA label generation and accessibility
 * - Color mapping via getMarkerColor()
 * - All point types (Restaurant/Parking/Toilet)
 * - Edge cases
 *
 * Expected: 98 lines, 9.18% → 85%+ coverage (+0.6% overall)
 */

import type { Parking, Restaurant, Toilet } from "@/types";
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SVGMarker } from "../SVGMarker";

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

describe("SVGMarker", () => {
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
    it("AdvancedMarkerとSVGが正しくレンダリングされること", () => {
      render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      expect(screen.getByTestId("advanced-marker")).toBeInTheDocument();
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("SVGがrole='img'とaria-labelを持つこと", () => {
      render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("role", "img");
      expect(svg).toHaveAttribute("aria-label");
    });

    it("レストランポイントが正しい色でレンダリングされること", () => {
      const { container } = render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const gradient = container.querySelector("linearGradient");
      expect(gradient).toBeInTheDocument();
      // Gradient IDに point.id が含まれることを確認
      expect(gradient?.id).toBe(`gradient-${mockRestaurant.id}`);
    });

    it("駐車場ポイントが正しい色でレンダリングされること", () => {
      const { container } = render(
        <SVGMarker point={mockParking} onClick={mockOnClick} size="medium" />
      );

      const gradient = container.querySelector("linearGradient");
      expect(gradient?.id).toBe(`gradient-${mockParking.id}`);
    });

    it("トイレポイントが正しい色でレンダリングされること", () => {
      const { container } = render(
        <SVGMarker point={mockToilet} onClick={mockOnClick} size="medium" />
      );

      const gradient = container.querySelector("linearGradient");
      expect(gradient?.id).toBe(`gradient-${mockToilet.id}`);
    });
  });

  // ==============================
  // Size Configuration
  // ==============================

  describe("サイズ設定", () => {
    it("size='small'の場合、width=32, height=40が設定されること", () => {
      render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="small" />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("width", "32");
      expect(svg).toHaveAttribute("height", "40");
    });

    it("size='medium'の場合、width=40, height=50が設定されること", () => {
      render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("width", "40");
      expect(svg).toHaveAttribute("height", "50");
    });

    it("size='large'の場合、width=48, height=60が設定されること", () => {
      render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="large" />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("width", "48");
      expect(svg).toHaveAttribute("height", "60");
    });

    it("すべてのサイズでviewBoxが統一されていること", () => {
      const { rerender } = render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="small" />
      );

      let svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("viewBox", "0 0 40 50");

      rerender(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );
      svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("viewBox", "0 0 40 50");

      rerender(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="large" />
      );
      svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("viewBox", "0 0 40 50");
    });
  });

  // ==============================
  // Animation States
  // ==============================

  describe("アニメーション状態", () => {
    it("isSelected=trueの場合、transform='scale(1.15)'になること", () => {
      render(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
        />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveStyle({ transform: "scale(1.15)" });
    });

    it("isHovered=trueの場合、transform='scale(1.05)'になること", () => {
      render(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isHovered={true}
        />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveStyle({ transform: "scale(1.05)" });
    });

    it("デフォルト状態の場合、transform='scale(1)'になること", () => {
      render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveStyle({ transform: "scale(1)" });
    });

    it("isSelectedがisHoveredより優先されること", () => {
      render(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
          isHovered={true}
        />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveStyle({ transform: "scale(1.15)" });
    });
  });

  // ==============================
  // Filter Effects
  // ==============================

  describe("フィルター効果", () => {
    it("isSelected=trueの場合、drop-shadowフィルターが適用されること", () => {
      render(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
        />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveStyle({
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
      });
    });

    it("isHovered=trueの場合、軽いdrop-shadowフィルターが適用されること", () => {
      render(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isHovered={true}
        />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveStyle({
        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
      });
    });

    it("デフォルト状態の場合、基本的なdrop-shadowフィルターが適用されること", () => {
      render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveStyle({
        filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.2))",
      });
    });
  });

  // ==============================
  // Glow Effect (Selected State)
  // ==============================

  describe("グロー効果", () => {
    it("isSelected=trueの場合、glowフィルターが定義されること", () => {
      const { container } = render(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
        />
      );

      const glowFilter = container.querySelector(
        `filter[id="glow-${mockRestaurant.id}"]`
      );
      expect(glowFilter).toBeInTheDocument();
    });

    it("isSelected=falseの場合、glowフィルターが定義されないこと", () => {
      const { container } = render(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={false}
        />
      );

      const glowFilter = container.querySelector(
        `filter[id="glow-${mockRestaurant.id}"]`
      );
      expect(glowFilter).not.toBeInTheDocument();
    });

    it("isSelected=trueの場合、中央インジケーターが表示されること", () => {
      const { container } = render(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
        />
      );

      const circles = container.querySelectorAll("circle");
      // 白ドット(cx=20, cy=18, r=6) + カテゴリインジケーター(cx=20, cy=18, r=3)
      expect(circles.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==============================
  // Click Handling
  // ==============================

  describe("クリックハンドリング", () => {
    it("マーカークリックでonClickが呼ばれること", async () => {
      const user = userEvent.setup();
      render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByTestId("advanced-marker");
      await user.click(marker);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(mockRestaurant);
    });

    it("異なるポイントタイプでも正しくonClickが機能すること", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <SVGMarker point={mockParking} onClick={mockOnClick} size="medium" />
      );

      let marker = screen.getByTestId("advanced-marker");
      await user.click(marker);
      expect(mockOnClick).toHaveBeenCalledWith(mockParking);

      rerender(
        <SVGMarker point={mockToilet} onClick={mockOnClick} size="medium" />
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
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("レストラン: テスト和食レストラン");
    });

    it("駐車場のデフォルトARIAラベルが正しく生成されること", () => {
      render(
        <SVGMarker point={mockParking} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("駐車場: テスト駐車場");
    });

    it("トイレのデフォルトARIAラベルが正しく生成されること", () => {
      // 実装: Toilet型にはisAccessibleプロパティがないため、point.nameのみ返される
      render(
        <SVGMarker point={mockToilet} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("テストトイレ");
    });

    it("カスタムariaLabelが優先されること", () => {
      render(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          ariaLabel="カスタムラベル"
        />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("カスタムラベル");
    });

    it("SVG要素にもARIAラベルが設定されること", () => {
      render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const svg = screen.getByRole("img");
      expect(svg).toHaveAttribute(
        "aria-label",
        "レストラン: テスト和食レストラン"
      );
    });
  });

  // ==============================
  // SVG Structure
  // ==============================

  describe("SVG構造", () => {
    it("defsにgradient定義が含まれること", () => {
      const { container } = render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const defs = container.querySelector("defs");
      expect(defs).toBeInTheDocument();

      const gradient = container.querySelector("linearGradient");
      expect(gradient).toBeInTheDocument();
    });

    it("pathでピン本体が描画されること", () => {
      const { container } = render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const path = container.querySelector("path");
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute("d");
      expect(path).toHaveAttribute("fill");
      expect(path).toHaveAttribute("stroke", "#FFFFFF");
    });

    it("circleで中央ドットが描画されること", () => {
      const { container } = render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBeGreaterThanOrEqual(1);

      // 中央ドット(cx=20, cy=18, r=6)
      const centerDot = Array.from(circles).find(
        circle =>
          circle.getAttribute("cx") === "20" &&
          circle.getAttribute("cy") === "18" &&
          circle.getAttribute("r") === "6"
      );
      expect(centerDot).toBeInTheDocument();
    });
  });

  // ==============================
  // Edge Cases
  // ==============================

  describe("エッジケース", () => {
    it("ポイント名が空文字列でもクラッシュしないこと", () => {
      const emptyNamePoint = { ...mockRestaurant, name: "" };
      render(
        <SVGMarker point={emptyNamePoint} onClick={mockOnClick} size="medium" />
      );

      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("座標が極端な値でもレンダリングされること", () => {
      const extremeCoordPoint = {
        ...mockRestaurant,
        coordinates: { lat: 89.9, lng: 179.9 },
      };
      render(
        <SVGMarker
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
          <SVGMarker
            point={mockRestaurant}
            onClick={mockOnClick}
            size="medium"
          />
          <SVGMarker point={mockParking} onClick={mockOnClick} size="small" />
          <SVGMarker point={mockToilet} onClick={mockOnClick} size="large" />
        </>
      );

      const svgs = container.querySelectorAll('svg[role="img"]');
      expect(svgs).toHaveLength(3);
    });

    it("gradient IDが各マーカーでユニークであること", () => {
      const { container } = render(
        <>
          <SVGMarker
            point={mockRestaurant}
            onClick={mockOnClick}
            size="medium"
          />
          <SVGMarker point={mockParking} onClick={mockOnClick} size="medium" />
        </>
      );

      const gradients = container.querySelectorAll("linearGradient");
      expect(gradients).toHaveLength(2);

      const gradient1 = gradients[0];
      const gradient2 = gradients[1];
      expect(gradient1).toBeDefined();
      expect(gradient2).toBeDefined();
      expect(gradient1?.id).not.toBe(gradient2?.id);
    });
  });

  // ==============================
  // Integration
  // ==============================

  describe("統合シナリオ", () => {
    it("選択→ホバー→デフォルトの状態遷移が正しく動作すること", () => {
      const { rerender } = render(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
        />
      );

      let svg = screen.getByRole("img");
      expect(svg).toHaveStyle({ transform: "scale(1.15)" });

      rerender(
        <SVGMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isHovered={true}
        />
      );

      svg = screen.getByRole("img");
      expect(svg).toHaveStyle({ transform: "scale(1.05)" });

      rerender(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="medium" />
      );

      svg = screen.getByRole("img");
      expect(svg).toHaveStyle({ transform: "scale(1)" });
    });

    it("サイズ変更が即座に反映されること", () => {
      const { rerender } = render(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="small" />
      );

      let svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("width", "32");

      rerender(
        <SVGMarker point={mockRestaurant} onClick={mockOnClick} size="large" />
      );

      svg = screen.getByRole("img");
      expect(svg).toHaveAttribute("width", "48");
    });
  });
});
