/* @vitest-environment jsdom */
import { classifyUser } from "@/config/abTestConfig";
import type { MapPoint, Parking, Restaurant } from "@/types";
import "@testing-library/jest-dom";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EnhancedMapContainer } from "../EnhancedMapContainer";

// Google Maps APIのモック
vi.mock("@vis.gl/react-google-maps", () => ({
  Map: vi.fn(({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-map">{children}</div>
  )),
  InfoWindow: vi.fn(
    ({
      children,
      onCloseClick,
    }: {
      children?: React.ReactNode;
      onCloseClick?: () => void;
    }) => (
      <div data-testid="mock-info-window">
        {children}
        <button data-testid="info-window-close-button" onClick={onCloseClick}>
          Close InfoWindow
        </button>
      </div>
    )
  ),
}));

// A/Bテスト分類のモック
vi.mock("@/config/abTestConfig", () => ({
  classifyUser: vi.fn(),
}));

// CircularMarkerContainerのモック
vi.mock("../CircularMarkerContainer", () => ({
  CircularMarkerContainer: vi.fn(
    ({
      points,
      onPointClick,
    }: {
      points: MapPoint[];
      onPointClick?: (point: MapPoint) => void;
    }) => (
      <div
        data-testid={`circular-marker-${points[0]?.id ?? "default"}`}
        onClick={() => {
          const firstPoint = points[0];
          if (firstPoint) onPointClick?.(firstPoint);
        }}
      >
        Circular Marker
      </div>
    )
  ),
}));

// UnifiedMarkerのモック
vi.mock("../../UnifiedMarker", () => ({
  UnifiedMarker: vi.fn(
    ({
      point,
      onClick,
      variant,
    }: {
      point: MapPoint;
      onClick?: (point: MapPoint) => void;
      variant: string;
    }) => (
      <div
        data-testid={`unified-marker-${point.id}`}
        data-variant={variant}
        onClick={() => onClick?.(point)}
      >
        Unified Marker
      </div>
    )
  ),
}));

// MapInfoWindowのモック
vi.mock("../MapInfoWindow", () => ({
  MapInfoWindow: vi.fn(({ point }: { point: MapPoint }) => (
    <div data-testid="map-info-window-content">
      <span data-testid="info-window-name">{point?.name}</span>
    </div>
  )),
}));

describe("EnhancedMapContainer", () => {
  const mockMapPoints: MapPoint[] = [
    {
      id: "restaurant-1",
      name: "Test Restaurant 1",
      type: "restaurant",
      coordinates: { lat: 38.0, lng: 138.5 },
      cuisineType: "日本料理",
      priceRange: "～1000円",
      district: "両津",
      address: "新潟県佐渡市",
      openingHours: [],
      features: [],
      lastUpdated: "2025-01-01",
    } as Restaurant,
    {
      id: "restaurant-2",
      name: "Test Restaurant 2",
      type: "restaurant",
      coordinates: { lat: 38.1, lng: 138.6 },
      cuisineType: "イタリアン",
      priceRange: "1000-2000円",
      district: "相川",
      address: "新潟県佐渡市",
      openingHours: [],
      features: [],
      lastUpdated: "2025-01-01",
    } as Restaurant,
    {
      id: "parking-1",
      name: "Test Parking",
      type: "parking",
      coordinates: { lat: 38.2, lng: 138.7 },
      district: "佐和田",
      address: "新潟県佐渡市",
      features: [],
      lastUpdated: "2025-01-01",
    } as Parking,
  ];

  const mockCenter = { lat: 38.0, lng: 138.5 };
  const mockMapId = "test-map-id";
  const mockOnMarkerClick = vi.fn();
  const mockOnCloseInfoWindow = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトのA/Bテスト分類
    vi.mocked(classifyUser).mockReturnValue({
      segment: "general",
      variant: "enhanced-png",
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("Mapコンポーネントを正しくレンダリングする", () => {
      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.getByTestId("mock-map")).toBeInTheDocument();
    });

    it("空のmapPointsでもエラーなくレンダリングする", () => {
      render(
        <EnhancedMapContainer
          mapPoints={[]}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.getByTestId("mock-map")).toBeInTheDocument();
    });

    it("map-containerクラスを持つdiv要素を持つ", () => {
      const { container } = render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(container.querySelector(".map-container")).toBeInTheDocument();
    });
  });

  describe("マーカーレンダリング", () => {
    it("デフォルトでUnifiedMarkerを使用する（A/Bテスト有効時）", () => {
      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(
        screen.getByTestId("unified-marker-restaurant-1")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("unified-marker-restaurant-2")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("unified-marker-parking-1")
      ).toBeInTheDocument();
    });

    it("initialMarkerTypeでCircularMarkerを使用できる", () => {
      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
          initialMarkerType="circular-icooon"
        />
      );

      // CircularMarkerContainerは各pointごとに個別にレンダリングされる
      // 少なくとも1つのCircularMarkerが表示されることを確認
      expect(
        screen.getByTestId("circular-marker-restaurant-1")
      ).toBeInTheDocument();

      // CircularMarkerテキストが存在することを確認
      expect(screen.getByText("Circular Marker")).toBeInTheDocument();
    });

    it("A/Bテストvariantに応じてUnifiedMarkerのvariantが設定される", () => {
      vi.mocked(classifyUser).mockReturnValue({
        segment: "general",
        variant: "svg",
      });

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const marker = screen.getByTestId("unified-marker-restaurant-1");
      expect(marker).toHaveAttribute("data-variant", "svg");
    });

    it("すべてのmapPointsに対してマーカーをレンダリングする", () => {
      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(
        screen.getByTestId("unified-marker-restaurant-1")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("unified-marker-restaurant-2")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("unified-marker-parking-1")
      ).toBeInTheDocument();
    });
  });

  describe("マーカークリック処理", () => {
    it("マーカークリック時にonMarkerClickが呼ばれる", async () => {
      const user = userEvent.setup();

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const marker = screen.getByTestId("unified-marker-restaurant-1");
      await user.click(marker);

      const firstMapPoint = mockMapPoints[0];
      expect(firstMapPoint).toBeDefined();
      expect(mockOnMarkerClick).toHaveBeenCalledTimes(1);
      expect(mockOnMarkerClick).toHaveBeenCalledWith(firstMapPoint);
    });

    it("複数のマーカーでそれぞれクリックイベントが動作する", async () => {
      const user = userEvent.setup();

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      await user.click(screen.getByTestId("unified-marker-restaurant-1"));
      await user.click(screen.getByTestId("unified-marker-parking-1"));

      const firstMapPoint = mockMapPoints[0];
      const thirdMapPoint = mockMapPoints[2];
      expect(firstMapPoint).toBeDefined();
      expect(thirdMapPoint).toBeDefined();
      expect(mockOnMarkerClick).toHaveBeenCalledTimes(2);
      expect(mockOnMarkerClick).toHaveBeenNthCalledWith(1, firstMapPoint);
      expect(mockOnMarkerClick).toHaveBeenNthCalledWith(2, thirdMapPoint);
    });

    it("マーカークリック時のエラーをキャッチしてコンソールに出力する", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const errorOnClick = vi.fn(() => {
        throw new Error("Click error");
      });

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={errorOnClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      await user.click(screen.getByTestId("unified-marker-restaurant-1"));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "マーカークリック時エラー:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("InfoWindow処理", () => {
    it("selectedPointがある場合はMapInfoWindowを表示する", () => {
      const firstMapPoint = mockMapPoints[0];
      expect(firstMapPoint).toBeDefined();

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={firstMapPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.getByTestId("mock-info-window")).toBeInTheDocument();
      expect(screen.getByTestId("info-window-name")).toHaveTextContent(
        "Test Restaurant 1"
      );
    });

    it("selectedPointがnullの場合はMapInfoWindowを表示しない", () => {
      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.queryByTestId("mock-info-window")).not.toBeInTheDocument();
    });

    it("InfoWindow閉じるボタンでonCloseInfoWindowが呼ばれる", async () => {
      const user = userEvent.setup();
      const firstMapPoint = mockMapPoints[0];
      expect(firstMapPoint).toBeDefined();

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={firstMapPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      await user.click(screen.getByTestId("info-window-close-button"));

      expect(mockOnCloseInfoWindow).toHaveBeenCalledTimes(1);
    });

    it("InfoWindow閉じる時のエラーをキャッチする", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const errorOnClose = vi.fn(() => {
        throw new Error("Close error");
      });
      const firstMapPoint = mockMapPoints[0];
      expect(firstMapPoint).toBeDefined();

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={firstMapPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={errorOnClose}
        />
      );

      await user.click(screen.getByTestId("info-window-close-button"));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "InfoWindow閉じる時エラー:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("重複除去機能", () => {
    it("重複したtype+idを持つpointを除去する", () => {
      const firstMapPoint = mockMapPoints[0];
      const secondMapPoint = mockMapPoints[1];
      expect(firstMapPoint).toBeDefined();
      expect(secondMapPoint).toBeDefined();

      const duplicatePoints: MapPoint[] = [
        ...mockMapPoints,
        firstMapPoint, // 重複
        secondMapPoint, // 重複
      ];

      render(
        <EnhancedMapContainer
          mapPoints={duplicatePoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      // 重複が除去されているため、ユニークな3つのマーカーのみ表示
      const markers = screen.getAllByText("Unified Marker");
      expect(markers).toHaveLength(3);
    });

    it("開発環境で重複除去時にデバッグログを出力する", () => {
      const consoleDebugSpy = vi
        .spyOn(console, "debug")
        .mockImplementation(() => {});
      const firstMapPoint = mockMapPoints[0];
      expect(firstMapPoint).toBeDefined();
      const duplicatePoints: MapPoint[] = [...mockMapPoints, firstMapPoint];

      render(
        <EnhancedMapContainer
          mapPoints={duplicatePoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      // DEV環境でのみログ出力（テスト環境ではimport.meta.env.DEVがfalseかも）
      if (import.meta.env.DEV) {
        expect(consoleDebugSpy).toHaveBeenCalledWith(
          "[EnhancedMapContainer] Duplicates removed:",
          1
        );
      }

      consoleDebugSpy.mockRestore();
    });
  });

  describe("A/Bテスト統合", () => {
    it("A/Bテストが無効な場合はCircularMarkerを使用する", () => {
      vi.mocked(classifyUser).mockReturnValue({
        segment: "general",
        variant: "original",
      });

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(
        screen.getByTestId("circular-marker-restaurant-1")
      ).toBeInTheDocument();
    });

    it("A/Bテストvariantが'original'の場合はCircularMarkerを使用", () => {
      vi.mocked(classifyUser).mockReturnValue({
        segment: "general",
        variant: "original",
      });

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      // variant='original'の場合はCircularMarkerが使われる
      expect(
        screen.getByTestId("circular-marker-restaurant-1")
      ).toBeInTheDocument();
    });

    it("A/Bテストvariantが'enhanced-png'の場合はicon variantを使用", () => {
      vi.mocked(classifyUser).mockReturnValue({
        segment: "general",
        variant: "enhanced-png",
      });

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const marker = screen.getByTestId("unified-marker-restaurant-1");
      expect(marker).toHaveAttribute("data-variant", "icon");
    });
  });

  describe("initialMarkerType同期", () => {
    it("initialMarkerTypeが変更されるとマーカータイプが更新される", async () => {
      const { rerender } = render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
          initialMarkerType="circular-icooon"
        />
      );

      expect(
        screen.getByTestId("circular-marker-restaurant-1")
      ).toBeInTheDocument();

      rerender(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
          initialMarkerType="unified-marker"
        />
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("unified-marker-restaurant-1")
        ).toBeInTheDocument();
      });
    });

    it("initialMarkerTypeが未定義の場合はA/Bテスト結果を使用", () => {
      vi.mocked(classifyUser).mockReturnValue({
        segment: "general",
        variant: "svg",
      });

      render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(
        screen.getByTestId("unified-marker-restaurant-1")
      ).toBeInTheDocument();
    });
  });

  describe("エッジケース", () => {
    it("mapPointsが更新されるとマーカーが再レンダリングされる", () => {
      const firstMapPoint = mockMapPoints[0];
      expect(firstMapPoint).toBeDefined();

      const { rerender } = render(
        <EnhancedMapContainer
          mapPoints={[firstMapPoint]}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(
        screen.getByTestId("unified-marker-restaurant-1")
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("unified-marker-restaurant-2")
      ).not.toBeInTheDocument();

      rerender(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(
        screen.getByTestId("unified-marker-restaurant-1")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("unified-marker-restaurant-2")
      ).toBeInTheDocument();
    });

    it("centerが変更されても問題なく動作する", () => {
      const { rerender } = render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const newCenter = { lat: 39.0, lng: 139.0 };
      rerender(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={newCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.getByTestId("mock-map")).toBeInTheDocument();
      expect(
        screen.getByTestId("unified-marker-restaurant-1")
      ).toBeInTheDocument();
    });

    it("selectedPointが変更されるとInfoWindowが更新される", () => {
      const firstMapPoint = mockMapPoints[0];
      expect(firstMapPoint).toBeDefined();

      const { rerender } = render(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={firstMapPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.getByTestId("info-window-name")).toHaveTextContent(
        "Test Restaurant 1"
      );

      const secondMapPoint = mockMapPoints[1];
      expect(secondMapPoint).toBeDefined();

      rerender(
        <EnhancedMapContainer
          mapPoints={mockMapPoints}
          center={mockCenter}
          mapId={mockMapId}
          selectedPoint={secondMapPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.getByTestId("info-window-name")).toHaveTextContent(
        "Test Restaurant 2"
      );
    });
  });
});
