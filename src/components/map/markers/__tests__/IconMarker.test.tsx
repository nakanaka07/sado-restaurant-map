/* @vitest-environment jsdom */
import "@testing-library/jest-dom";
/**
 * @fileoverview IconMarker comprehensive tests
 *
 * Coverage targets:
 * - getCategoryFromPoint() logic (Restaurant/Parking/Toilet discrimination)
 * - getCuisineCategory() mapping (10+ cuisine types)
 * - getDefaultAriaLabel() generation (3 point types)
 * - Size mapping (small/medium/large)
 * - Animation states (attention/subtle/none)
 * - AdvancedMarker integration
 * - CircularMarker props passing
 * - Edge cases (undefined cuisineType, empty strings, unknown types)
 *
 * Expected: 90 lines, 10% → 85%+ coverage (+0.6% overall)
 */

import type { Parking, Restaurant, Toilet } from "@/types";
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IconMarker } from "../IconMarker";

// ==============================
// Mocks
// ==============================

// Google Maps mocking
vi.mock("@vis.gl/react-google-maps", () => ({
  AdvancedMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="advanced-marker">{children}</div>
  ),
}));

// CircularMarker mocking
vi.mock("../CircularMarker", () => ({
  CircularMarker: ({
    category,
    size,
    onClick,
    interactive,
    ariaLabel,
    animation,
    ringed,
  }: {
    category: string;
    size: string;
    onClick: () => void;
    interactive: boolean;
    ariaLabel: string;
    animation: string;
    ringed: boolean;
  }) => (
    <button
      data-testid="circular-marker"
      data-category={category}
      data-size={size}
      data-interactive={interactive}
      data-animation={animation}
      data-ringed={ringed}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {category}
    </button>
  ),
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

describe("IconMarker", () => {
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
    it("AdvancedMarkerでラップされたCircularMarkerが表示されること", () => {
      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      const advancedMarker = screen.getByTestId("advanced-marker");
      expect(advancedMarker).toBeInTheDocument();

      const circularMarker = screen.getByTestId("circular-marker");
      expect(circularMarker).toBeInTheDocument();
    });

    it("レストランポイントが正しくレンダリングされること", () => {
      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-category", "general");
    });

    it("駐車場ポイントが正しくレンダリングされること", () => {
      render(
        <IconMarker point={mockParking} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-category", "parking");
    });

    it("トイレポイントが正しくレンダリングされること", () => {
      render(
        <IconMarker point={mockToilet} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-category", "general");
    });
  });

  // ==============================
  // getCategoryFromPoint Logic
  // ==============================

  describe("getCategoryFromPoint()ロジック", () => {
    it("capacityプロパティを持つポイントは'parking'カテゴリになること", () => {
      render(
        <IconMarker point={mockParking} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-category", "parking");
    });

    it("トイレタイプのポイントはカテゴリ判定ロジックで処理されること", () => {
      // 実装: Toilet型にはisAccessibleプロパティがないため、featuresで判別
      render(
        <IconMarker point={mockToilet} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-category", "general");
    });

    it("cuisineTypeプロパティを持つポイントはgetCuisineCategory()でカテゴリ判定されること", () => {
      const noodleRestaurant: Restaurant = {
        ...mockRestaurant,
        cuisineType: "ラーメン",
      };

      render(
        <IconMarker
          point={noodleRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      const marker = screen.getByTestId("circular-marker");
      // "ラーメン"は実装では"general"（categoryMapに含まれない）
      expect(marker).toHaveAttribute("data-category", "general");
    });
  });

  // ==============================
  // getCuisineCategory Mapping
  // ==============================

  describe("getCuisineCategory()マッピング", () => {
    const testCases: Array<{ cuisine: string; expected: string }> = [
      { cuisine: "日本料理", expected: "general" }, // 実装では"和食"キーワードが必要
      { cuisine: "Japanese", expected: "japanese" },
      { cuisine: "Noodle", expected: "noodles" },
      { cuisine: "焼肉・焼鳥", expected: "yakiniku" },
      { cuisine: "Yakiniku", expected: "yakiniku" },
      { cuisine: "カフェ・喫茶店", expected: "cafe" },
      { cuisine: "Cafe", expected: "cafe" },
      { cuisine: "バー・居酒屋", expected: "izakaya" },
      { cuisine: "Izakaya", expected: "izakaya" },
      { cuisine: "ファストフード", expected: "fastfood" },
      { cuisine: "Fast Food", expected: "fastfood" },
      { cuisine: "カレー・エスニック", expected: "general" }, // "多国籍"キーワードなし
      { cuisine: "International", expected: "international" },
      { cuisine: "その他", expected: "general" },
      { cuisine: "ラーメン", expected: "general" }, // "麺"キーワード必要
      { cuisine: "そば・うどん", expected: "general" }, // "麺"キーワード必要
    ];

    testCases.forEach(({ cuisine, expected }) => {
      it(`cuisineType="${cuisine}"は"${expected}"カテゴリになること`, () => {
        const restaurant: Restaurant = {
          ...mockRestaurant,
          cuisineType: cuisine as never,
        };

        render(
          <IconMarker point={restaurant} onClick={mockOnClick} size="medium" />
        );

        const marker = screen.getByTestId("circular-marker");
        expect(marker).toHaveAttribute("data-category", expected);
      });
    });

    it("cuisineTypeがundefinedの場合は'general'カテゴリになること", () => {
      const restaurant = {
        ...mockRestaurant,
        cuisineType: undefined,
      } as unknown as Restaurant;

      render(
        <IconMarker point={restaurant} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-category", "general");
    });
  });

  // ==============================
  // Size Mapping
  // ==============================

  describe("サイズマッピング", () => {
    it("size='small'が正しく渡されること", () => {
      render(
        <IconMarker point={mockRestaurant} onClick={mockOnClick} size="small" />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-size", "small");
    });

    it("size='medium'が正しく渡されること", () => {
      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-size", "medium");
    });

    it("size='large'が正しく渡されること", () => {
      render(
        <IconMarker point={mockRestaurant} onClick={mockOnClick} size="large" />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-size", "large");
    });
  });

  // ==============================
  // Animation States
  // ==============================

  describe("アニメーション状態", () => {
    it("isSelected=trueの場合、animation='attention'になること", () => {
      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
        />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-animation", "attention");
      expect(marker).toHaveAttribute("data-ringed", "true");
    });

    it("isHovered=trueの場合、animation='subtle'になること", () => {
      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isHovered={true}
        />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-animation", "subtle");
    });

    it("isSelected=false, isHovered=falseの場合、animation='none'になること", () => {
      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={false}
          isHovered={false}
        />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-animation", "none");
    });

    it("isSelectedがundefinedの場合、animation='none'になること", () => {
      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-animation", "none");
    });

    it("isSelected=trueはisHovered=trueより優先されること", () => {
      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
          isHovered={true}
        />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-animation", "attention");
    });
  });

  // ==============================
  // onClick Handling
  // ==============================

  describe("クリックハンドリング", () => {
    it("マーカークリックでonClickが呼ばれること", async () => {
      const user = userEvent.setup();

      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      const marker = screen.getByTestId("circular-marker");
      await user.click(marker);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(mockRestaurant);
    });

    it("異なるポイントタイプでも正しくonClickが機能すること", async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      const marker = screen.getByTestId("circular-marker");
      await user.click(marker);

      expect(mockOnClick).toHaveBeenCalledWith(mockRestaurant);

      // Re-render with parking
      mockOnClick.mockClear();
      rerender(
        <IconMarker point={mockParking} onClick={mockOnClick} size="medium" />
      );

      await user.click(marker);
      expect(mockOnClick).toHaveBeenCalledWith(mockParking);
    });
  });

  // ==============================
  // ARIA Label Generation
  // ==============================

  describe("ARIAラベル生成", () => {
    it("レストランのデフォルトARIAラベルが正しく生成されること", () => {
      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName(
        "レストラン: テスト和食レストラン (日本料理)"
      );
    });

    it("cuisineTypeがundefinedの場合'一般'になること", () => {
      const restaurant = {
        ...mockRestaurant,
        cuisineType: undefined,
      } as unknown as Restaurant;

      render(
        <IconMarker point={restaurant} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName(
        "レストラン: テスト和食レストラン (一般)"
      );
    });

    it("駐車場のデフォルトARIAラベルが正しく生成されること", () => {
      render(
        <IconMarker point={mockParking} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName(
        "駐車場: テスト駐車場 (収容台数: 50台)"
      );
    });

    it("capacity未定義の駐車場は'不明'になること", () => {
      const parking = {
        ...mockParking,
        capacity: undefined,
      } as unknown as Parking;

      render(
        <IconMarker point={parking} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName(
        "駐車場: テスト駐車場 (収容台数: 不明台)"
      );
    });

    it("トイレのデフォルトARIAラベルが正しく生成されること", () => {
      // 実装: Toilet型にはisAccessibleプロパティがないため、point.nameのみ返される
      render(
        <IconMarker point={mockToilet} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("テストトイレ");
    });

    it("バリアフリー非対応のトイレのARIAラベルが正しく生成されること", () => {
      const toilet = { ...mockToilet, isAccessible: false } as Toilet;

      render(<IconMarker point={toilet} onClick={mockOnClick} size="medium" />);

      const marker = screen.getByRole("button");
      expect(marker).toHaveAccessibleName("トイレ: テストトイレ");
    });

    it("カスタムariaLabelが優先されること", () => {
      render(
        <IconMarker
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
  // CircularMarker Integration
  // ==============================

  describe("CircularMarker統合", () => {
    it("interactive=trueが渡されること", () => {
      render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
        />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-interactive", "true");
    });

    it("ringedプロパティがisSelectedに連動すること", () => {
      const { rerender } = render(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={false}
        />
      );

      let marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-ringed", "false");

      rerender(
        <IconMarker
          point={mockRestaurant}
          onClick={mockOnClick}
          size="medium"
          isSelected={true}
        />
      );

      marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-ringed", "true");
    });
  });

  // ==============================
  // Edge Cases
  // ==============================

  describe("エッジケース", () => {
    it("ポイント名が空文字列でもクラッシュしないこと", () => {
      const restaurant: Restaurant = { ...mockRestaurant, name: "" };

      expect(() =>
        render(
          <IconMarker point={restaurant} onClick={mockOnClick} size="medium" />
        )
      ).not.toThrow();
    });

    it("座標が極端な値でもレンダリングされること", () => {
      const restaurant: Restaurant = {
        ...mockRestaurant,
        coordinates: { lat: 90, lng: 180 },
      };

      render(
        <IconMarker point={restaurant} onClick={mockOnClick} size="medium" />
      );

      expect(screen.getByTestId("advanced-marker")).toBeInTheDocument();
    });

    it("大文字小文字が混在したcuisineTypeでも正しく判定されること", () => {
      const restaurant = {
        ...mockRestaurant,
        cuisineType: "YaKiNiKu" as never,
      };

      render(
        <IconMarker point={restaurant} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-category", "yakiniku");
    });

    it("部分一致でカテゴリ判定が機能すること", () => {
      const restaurant = {
        ...mockRestaurant,
        cuisineType: "焼肉レストラン" as never,
      };

      render(
        <IconMarker point={restaurant} onClick={mockOnClick} size="medium" />
      );

      const marker = screen.getByTestId("circular-marker");
      expect(marker).toHaveAttribute("data-category", "yakiniku");
    });
  });
});
