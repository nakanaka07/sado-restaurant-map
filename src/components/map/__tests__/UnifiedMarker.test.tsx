/**
 * @fileoverview UnifiedMarker type & interface tests
 *
 * Phase 1: Strategy Pattern実装の型安全性テスト
 *
 * NOTE: jsdom環境ではGoogle Maps Web Componentsが完全にレンダリングされないため、
 * ここでは型チェックとProps interfaceの整合性のみ検証。
 * 視覚的レンダリング・マーカー表示は将来のE2E/Playwrightテストで検証予定。
 */

import type { Parking, Restaurant, Toilet } from "@/types";
import { describe, expect, it } from "vitest";
import type {
  MarkerSize,
  MarkerStrategyProps,
  MarkerVariant,
  UnifiedMarkerProps,
} from "../UnifiedMarker";

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
