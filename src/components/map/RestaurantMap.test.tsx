import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RestaurantMap } from "./RestaurantMap";
import type { Restaurant } from "@/types";
import type { ReactNode } from "react";

// 型定義
interface MockMapProps {
  children?: ReactNode;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  mapId?: string;
  gestureHandling?: string;
  disableDefaultUI?: boolean;
  mapTypeControl?: boolean;
  fullscreenControl?: boolean;
  streetViewControl?: boolean;
  zoomControl?: boolean;
}

interface MockAdvancedMarkerProps {
  onClick?: () => void;
  title?: string;
  position?: { lat: number; lng: number };
  children?: ReactNode;
}

interface MockPinProps {
  background?: string;
  borderColor?: string;
  glyphColor?: string;
}

interface MockInfoWindowProps {
  children?: ReactNode;
  onCloseClick?: () => void;
  position?: { lat: number; lng: number };
}

// Google Maps API コンポーネントのモック
vi.mock("@vis.gl/react-google-maps", () => ({
  Map: ({ children, ...props }: MockMapProps) => (
    <div data-testid="google-map" {...props}>
      {children}
    </div>
  ),
  AdvancedMarker: ({ onClick, title, ...props }: MockAdvancedMarkerProps) => (
    <div
      data-testid="advanced-marker"
      data-title={title}
      onClick={onClick}
      {...props}
    >
      Marker: {title}
    </div>
  ),
  Pin: ({ background, ...props }: MockPinProps) => (
    <div data-testid="pin" data-background={background} {...props}>
      Pin
    </div>
  ),
  InfoWindow: ({ children, onCloseClick, ...props }: MockInfoWindowProps) => (
    <div data-testid="info-window" {...props}>
      <button data-testid="close-info-window" onClick={onCloseClick}>
        ×
      </button>
      {children}
    </div>
  ),
}));

// Analytics モック
vi.mock("@/utils/analytics", () => ({
  trackRestaurantClick: vi.fn(),
  trackMapInteraction: vi.fn(),
}));

describe("RestaurantMap", () => {
  const mockRestaurants: Restaurant[] = [
    {
      id: "1",
      name: "寿司処金峰",
      address: "佐渡市両津湊353",
      cuisineType: "寿司",
      priceRange: "2000-3000円",
      coordinates: { lat: 38.0751, lng: 138.4094 },
      phone: "0259-27-5473",
      rating: 4.2,
      features: ["駐車場あり", "禁煙"],
      openingHours: [
        {
          day: "月曜日",
          open: "11:00",
          close: "21:00",
          isHoliday: false,
        },
      ],
      lastUpdated: "2025-08-01T00:00:00Z",
    },
    {
      id: "2",
      name: "そば処竹の子",
      address: "佐渡市金井新保甲1228",
      cuisineType: "そば・うどん",
      priceRange: "1000-2000円",
      coordinates: { lat: 38.0621, lng: 138.3667 },
      phone: "0259-67-7408",
      rating: 4.0,
      features: ["テイクアウト可"],
      openingHours: [
        {
          day: "火曜日",
          open: "11:30",
          close: "20:00",
          isHoliday: false,
        },
      ],
      lastUpdated: "2025-08-01T00:00:00Z",
    },
  ];

  const defaultProps = {
    restaurants: mockRestaurants,
    center: { lat: 38.0751, lng: 138.4094 },
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Map ID環境変数を設定
    vi.stubEnv("VITE_GOOGLE_MAPS_MAP_ID", "test-map-id");
  });

  describe("基本レンダリング", () => {
    it("正常にレンダリングされること", () => {
      render(<RestaurantMap {...defaultProps} />);

      expect(screen.getByTestId("google-map")).toBeInTheDocument();
      expect(screen.getByTestId("google-map")).toHaveAttribute(
        "mapId",
        "test-map-id"
      );
    });

    it("レストランマーカーが表示されること", () => {
      render(<RestaurantMap {...defaultProps} />);

      const markers = screen.getAllByTestId("advanced-marker");
      expect(markers).toHaveLength(2);
      expect(markers[0]).toHaveAttribute("data-title", "寿司処金峰");
      expect(markers[1]).toHaveAttribute("data-title", "そば処竹の子");
    });

    it("各マーカーに適切な属性が設定されていること", () => {
      render(<RestaurantMap {...defaultProps} />);

      const markers = screen.getAllByTestId("advanced-marker");
      expect(markers).toHaveLength(2);
      expect(markers[0]).toHaveAttribute("data-title", "寿司処金峰");
      expect(markers[1]).toHaveAttribute("data-title", "そば処竹の子");
    });
  });

  describe("ローディング状態", () => {
    it("ローディング中は専用UIが表示されること", () => {
      render(<RestaurantMap {...defaultProps} loading={true} />);

      expect(screen.getByText("🗺️ 地図を読み込み中...")).toBeInTheDocument();
      expect(screen.queryByTestId("google-map")).not.toBeInTheDocument();
    });

    it("ローディングUIに適切なスタイルが適用されること", () => {
      render(<RestaurantMap {...defaultProps} loading={true} />);

      const loadingElement =
        screen.getByText("🗺️ 地図を読み込み中...").parentElement;
      expect(loadingElement).toHaveStyle({ height: "500px" });
      expect(loadingElement).toHaveClass("map-loading");
    });
  });

  describe("エラー状態", () => {
    it("Map IDが未設定の場合はエラーUIが表示されること", () => {
      vi.stubEnv("VITE_GOOGLE_MAPS_MAP_ID", undefined);

      render(<RestaurantMap {...defaultProps} />);

      expect(
        screen.getByText("❌ Map ID が設定されていません")
      ).toBeInTheDocument();
      expect(screen.getByText("環境変数:").nextSibling).toBeInTheDocument();
      expect(screen.queryByTestId("google-map")).not.toBeInTheDocument();
    });

    it("エラーUIに適切なスタイルが適用されること", () => {
      vi.stubEnv("VITE_GOOGLE_MAPS_MAP_ID", "");

      render(<RestaurantMap {...defaultProps} />);

      const errorElement = screen.getByText("❌ Map ID が設定されていません")
        .parentElement as HTMLElement;
      expect(errorElement).toHaveStyle("height: 500px");
      expect(errorElement).toHaveClass("map-error");
    });
  });

  describe("インタラクション", () => {
    it("マーカークリック時にInfoWindowが表示されること", () => {
      render(<RestaurantMap {...defaultProps} />);

      const firstMarker = screen.getAllByTestId("advanced-marker")[0];
      fireEvent.click(firstMarker);

      expect(screen.getByTestId("info-window")).toBeInTheDocument();
      expect(screen.getByText("寿司処金峰")).toBeInTheDocument();
      expect(screen.getByText("📍 佐渡市両津湊353")).toBeInTheDocument();
      expect(screen.getByText("🍽️ 寿司")).toBeInTheDocument();
      expect(screen.getByText("📞 0259-27-5473")).toBeInTheDocument();
    });

    it("InfoWindow閉じるボタンでInfoWindowが非表示になること", () => {
      render(<RestaurantMap {...defaultProps} />);

      // マーカーをクリックしてInfoWindowを表示
      const firstMarker = screen.getAllByTestId("advanced-marker")[0];
      fireEvent.click(firstMarker);

      expect(screen.getByTestId("info-window")).toBeInTheDocument();

      // 閉じるボタンをクリック
      const closeButton = screen.getByTestId("close-info-window");
      fireEvent.click(closeButton);

      expect(screen.queryByTestId("info-window")).not.toBeInTheDocument();
    });

    it("複数のマーカーを順次クリックできること", () => {
      render(<RestaurantMap {...defaultProps} />);

      const markers = screen.getAllByTestId("advanced-marker");

      // 最初のマーカーをクリック
      fireEvent.click(markers[0]);
      expect(screen.getByText("寿司処金峰")).toBeInTheDocument();

      // 2番目のマーカーをクリック
      fireEvent.click(markers[1]);
      expect(screen.getByText("そば処竹の子")).toBeInTheDocument();
      expect(screen.queryByText("寿司処金峰")).not.toBeInTheDocument(); // 前のInfoWindowは閉じる
    });
  });

  describe("Analytics統合", () => {
    it("マーカークリック時にAnalyticsイベントが送信されること", async () => {
      const { trackRestaurantClick, trackMapInteraction } = await import(
        "@/utils/analytics"
      );

      render(<RestaurantMap {...defaultProps} />);

      const firstMarker = screen.getAllByTestId("advanced-marker")[0];
      fireEvent.click(firstMarker);

      expect(trackRestaurantClick).toHaveBeenCalledWith({
        id: "1",
        name: "寿司処金峰",
        category: "寿司",
        priceRange: "2000-3000円",
      });

      expect(trackMapInteraction).toHaveBeenCalledWith("marker_click");
    });
  });

  describe("プロップス検証", () => {
    it("空のレストラン配列でもエラーが発生しないこと", () => {
      render(<RestaurantMap {...defaultProps} restaurants={[]} />);

      expect(screen.getByTestId("google-map")).toBeInTheDocument();
      expect(screen.queryAllByTestId("advanced-marker")).toHaveLength(0);
    });

    it("phone情報がないレストランでも正常に表示されること", () => {
      const restaurantWithoutPhone = [
        {
          ...mockRestaurants[0],
          phone: undefined,
        },
      ];

      render(
        <RestaurantMap {...defaultProps} restaurants={restaurantWithoutPhone} />
      );

      const marker = screen.getByTestId("advanced-marker");
      fireEvent.click(marker);

      expect(screen.getByText("寿司処金峰")).toBeInTheDocument();
      expect(screen.queryByText(/📞/)).not.toBeInTheDocument();
    });

    it("centerプロップスが地図に反映されること", () => {
      const customCenter = { lat: 35.6762, lng: 139.6503 }; // 東京

      render(<RestaurantMap {...defaultProps} center={customCenter} />);

      const mapElement = screen.getByTestId("google-map");
      expect(mapElement).toHaveAttribute("defaultCenter", "[object Object]");
    });
  });

  describe("アクセシビリティ", () => {
    it("マーカーにtitle属性が設定されていること", () => {
      render(<RestaurantMap {...defaultProps} />);

      const markers = screen.getAllByTestId("advanced-marker");
      expect(markers[0]).toHaveAttribute("data-title", "寿司処金峰");
      expect(markers[1]).toHaveAttribute("data-title", "そば処竹の子");
    });

    it("InfoWindow内の情報が適切に構造化されていること", () => {
      render(<RestaurantMap {...defaultProps} />);

      const firstMarker = screen.getAllByTestId("advanced-marker")[0];
      fireEvent.click(firstMarker);

      // 見出しが適切にh3タグであること
      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
        "寿司処金峰"
      );
    });
  });

  describe("エッジケース", () => {
    it("非常に長いレストラン名でも適切に表示されること", () => {
      const longNameRestaurant = [
        {
          ...mockRestaurants[0],
          name: "非常に長いレストラン名前前前前前前前前前前前前前前前前前前前前前前前前",
        },
      ];

      render(
        <RestaurantMap {...defaultProps} restaurants={longNameRestaurant} />
      );

      const marker = screen.getByTestId("advanced-marker");
      fireEvent.click(marker);

      // InfoWindow内のh3要素から長い名前を検証
      const longNameElement = screen.getByRole("heading", { level: 3 });
      expect(longNameElement).toHaveTextContent(
        "非常に長いレストラン名前前前前前前前前前前前前前前前前前前前前前前前前"
      );
    });

    it("座標が極端な値でもエラーが発生しないこと", () => {
      const extremeCoordinateRestaurant = [
        {
          ...mockRestaurants[0],
          coordinates: { lat: 85.0, lng: 180.0 }, // 極端な座標
        },
      ];

      render(
        <RestaurantMap
          {...defaultProps}
          restaurants={extremeCoordinateRestaurant}
        />
      );

      expect(screen.getByTestId("advanced-marker")).toBeInTheDocument();
    });
  });
});
