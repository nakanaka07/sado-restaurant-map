/* @vitest-environment jsdom */
import type { Restaurant } from "@/types";
import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OptimizedInfoWindow } from "./OptimizedInfoWindow";

// ========================
// Mock Setup
// ========================

// Mock InfoWindow from @vis.gl/react-google-maps
vi.mock("@vis.gl/react-google-maps", () => ({
  InfoWindow: ({
    children,
    onCloseClick,
  }: {
    children: ReactNode;
    onCloseClick: () => void;
  }) => (
    <div data-testid="info-window">
      <button data-testid="close-button" onClick={onCloseClick}>
        Close
      </button>
      {children}
    </div>
  ),
}));

// Mock LastUpdatedDisplay
vi.mock("@/components/common/LastUpdatedDisplay", () => ({
  LastUpdatedDisplay: ({ lastUpdated }: { lastUpdated: string }) => (
    <div data-testid="last-updated-display">{lastUpdated}</div>
  ),
}));

// Mock getMarkerColorByCuisine
vi.mock("./utils", () => ({
  getMarkerColorByCuisine: (cuisineType: string) => {
    const colors: Record<string, string> = {
      日本料理: "#dc2626",
      "ステーキ・洋食": "#2563eb",
      中華: "#f59e0b",
    };
    return colors[cuisineType] || "#6b7280";
  },
}));

// ========================
// Test Data
// ========================

const createMockRestaurant = (overrides?: Partial<Restaurant>): Restaurant => ({
  id: "1",
  name: "テスト和食レストラン",
  address: "新潟県佐渡市テスト町1-2-3",
  coordinates: { lat: 38.0, lng: 138.0 },
  type: "restaurant",
  district: "両津",
  cuisineType: "日本料理",
  priceRange: "1000-2000円",
  openingHours: [],
  rating: 4.5,
  reviewCount: 120,
  phone: "0259-12-3456",
  description: "美味しい和食を提供するレストランです",
  features: ["駐車場", "Wi-Fi", "禁煙"],
  lastUpdated: "2025-01-01",
  ...overrides,
});

// ========================
// Tests
// ========================

describe("OptimizedInfoWindow", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // console.logのモック
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("レストラン情報が正しく表示される", () => {
      const restaurant = createMockRestaurant();

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(screen.getByText("テスト和食レストラン")).toBeInTheDocument();
      expect(screen.getByText("新潟県佐渡市テスト町1-2-3")).toBeInTheDocument();
      expect(screen.getByText("日本料理")).toBeInTheDocument();
      expect(screen.getByText("1000-2000円")).toBeInTheDocument();
    });

    it("評価と口コミ数が表示される", () => {
      const restaurant = createMockRestaurant();

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(screen.getByText(/4.5/)).toBeInTheDocument();
      expect(screen.getByText(/120件/)).toBeInTheDocument();
    });

    it("説明文が表示される", () => {
      const restaurant = createMockRestaurant();

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(
        screen.getByText("美味しい和食を提供するレストランです")
      ).toBeInTheDocument();
    });

    it("特徴タグが表示される", () => {
      const restaurant = createMockRestaurant();

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(screen.getByText("駐車場")).toBeInTheDocument();
      expect(screen.getByText("Wi-Fi")).toBeInTheDocument();
      expect(screen.getByText("禁煙")).toBeInTheDocument();
    });

    it("最終更新日が表示される", () => {
      const restaurant = createMockRestaurant();

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(screen.getByTestId("last-updated-display")).toBeInTheDocument();
      expect(screen.getByText("2025-01-01")).toBeInTheDocument();
    });
  });

  describe("電話番号リンク", () => {
    it("電話番号が表示される", () => {
      const restaurant = createMockRestaurant();

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(screen.getByText("0259-12-3456")).toBeInTheDocument();
    });

    it("電話番号クリックでtel:リンクが開かれる", async () => {
      const user = userEvent.setup();
      const restaurant = createMockRestaurant();
      const mockWindowOpen = vi
        .spyOn(window, "open")
        .mockImplementation(() => null);

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      const phoneLink = screen.getByText("0259-12-3456");
      await user.click(phoneLink);

      expect(mockWindowOpen).toHaveBeenCalledWith("tel:0259-12-3456", "_self");
    });

    it("Enterキーで電話番号リンクが開かれる", async () => {
      const user = userEvent.setup();
      const restaurant = createMockRestaurant();
      const mockWindowOpen = vi
        .spyOn(window, "open")
        .mockImplementation(() => null);

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      const phoneLink = screen.getByText("0259-12-3456");
      phoneLink.focus();
      await user.keyboard("{Enter}");

      expect(mockWindowOpen).toHaveBeenCalledWith("tel:0259-12-3456", "_self");
    });

    it("Spaceキーで電話番号リンクが開かれる", async () => {
      const user = userEvent.setup();
      const restaurant = createMockRestaurant();
      const mockWindowOpen = vi
        .spyOn(window, "open")
        .mockImplementation(() => null);

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      const phoneLink = screen.getByText("0259-12-3456");
      phoneLink.focus();
      await user.keyboard(" ");

      expect(mockWindowOpen).toHaveBeenCalledWith("tel:0259-12-3456", "_self");
    });
  });

  describe("オプショナルフィールド", () => {
    it("電話番号がない場合は表示されない", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { phone, ...restaurantWithoutPhone } = createMockRestaurant();
      const restaurant = restaurantWithoutPhone as Restaurant;

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(screen.queryByText(/📞/)).not.toBeInTheDocument();
    });

    it("評価がない場合は表示されない", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { rating, reviewCount, ...restaurantWithoutRating } =
        createMockRestaurant();
      const restaurant = restaurantWithoutRating as Restaurant;

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(screen.queryByText(/⭐/)).not.toBeInTheDocument();
    });

    it("説明文がない場合は表示されない", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { description, ...restaurantWithoutDescription } =
        createMockRestaurant();
      const restaurant = restaurantWithoutDescription as Restaurant;

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(
        screen.queryByText("美味しい和食を提供するレストランです")
      ).not.toBeInTheDocument();
    });

    it("特徴がない場合は表示されない", () => {
      const restaurant = createMockRestaurant({ features: [] });

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(screen.queryByText("特徴:")).not.toBeInTheDocument();
    });

    it("最終更新日がない場合は表示されない", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { lastUpdated, ...restaurantWithoutLastUpdated } =
        createMockRestaurant();
      const restaurant = restaurantWithoutLastUpdated as Restaurant;

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(
        screen.queryByTestId("last-updated-display")
      ).not.toBeInTheDocument();
    });
  });

  describe("特徴タグの制限", () => {
    it("特徴が6個以上ある場合は6個まで表示される", () => {
      const restaurant = createMockRestaurant({
        features: [
          "駐車場",
          "Wi-Fi",
          "禁煙",
          "クレジットカード",
          "予約可",
          "個室",
          "テラス席",
          "バリアフリー",
        ],
      });

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(screen.getByText("駐車場")).toBeInTheDocument();
      expect(screen.getByText("Wi-Fi")).toBeInTheDocument();
      expect(screen.getByText("禁煙")).toBeInTheDocument();
      expect(screen.getByText("クレジットカード")).toBeInTheDocument();
      expect(screen.getByText("予約可")).toBeInTheDocument();
      expect(screen.getByText("個室")).toBeInTheDocument();
      expect(screen.queryByText("テラス席")).not.toBeInTheDocument();
      expect(screen.queryByText("バリアフリー")).not.toBeInTheDocument();
    });
  });

  describe("閉じるボタン", () => {
    it("閉じるボタンクリックでonCloseが呼ばれる", async () => {
      const user = userEvent.setup();
      const restaurant = createMockRestaurant();

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      const closeButton = screen.getByTestId("close-button");
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("料理タイプによる色分け", () => {
    it("日本料理は赤色で表示される", () => {
      const restaurant = createMockRestaurant({ cuisineType: "日本料理" });

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      const cuisineTag = screen.getByText("日本料理");
      expect(cuisineTag).toHaveStyle({ backgroundColor: "#dc2626" });
    });

    it("洋食は青色で表示される", () => {
      const restaurant = createMockRestaurant({
        cuisineType: "ステーキ・洋食",
      });

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      const cuisineTag = screen.getByText("ステーキ・洋食");
      expect(cuisineTag).toHaveStyle({ backgroundColor: "#2563eb" });
    });

    it("中華は黄色で表示される", () => {
      const restaurant = createMockRestaurant({ cuisineType: "中華" });

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      const cuisineTag = screen.getByText("中華");
      expect(cuisineTag).toHaveStyle({ backgroundColor: "#f59e0b" });
    });
  });

  describe("評価表示", () => {
    it("口コミ数がない場合は評価のみ表示される", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reviewCount, ...restaurantWithoutReviewCount } =
        createMockRestaurant();
      const restaurant = {
        ...restaurantWithoutReviewCount,
        rating: 4.5,
      } as Restaurant;

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      expect(screen.getByText("4.5")).toBeInTheDocument();
      expect(screen.queryByText(/件/)).not.toBeInTheDocument();
    });

    it("評価が小数点1桁で表示される", () => {
      const restaurant = createMockRestaurant({ rating: 4.567 });

      render(
        <OptimizedInfoWindow restaurant={restaurant} onClose={mockOnClose} />
      );

      // 評価表示を正確に取得 (電話番号との混同を避ける)
      const ratingText = screen.getByText(/⭐/).parentElement?.textContent;
      expect(ratingText).toContain("4.6");
    });
  });

  describe("displayName", () => {
    it("OptimizedInfoWindowにdisplayNameが設定されている", () => {
      expect(OptimizedInfoWindow.displayName).toBe("OptimizedInfoWindow");
    });
  });
});
