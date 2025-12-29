/* @vitest-environment jsdom */
/**
 * @fileoverview MapContainer テスト
 * 地図コンテナコンポーネントの包括的テスト
 */

import type { MapPoint } from "@/types";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MapContainer } from "../MapContainer";

// Google Maps APIのモック
vi.mock("@vis.gl/react-google-maps", () => ({
  Map: ({
    children,
    defaultCenter,
    defaultZoom,
    mapId,
    style,
    gestureHandling,
    disableDefaultUI,
    mapTypeControl,
    fullscreenControl,
    streetViewControl,
    zoomControl,
    mapTypeControlOptions,
    zoomControlOptions,
    fullscreenControlOptions,
    streetViewControlOptions,
    mapTypeId,
  }: {
    children?: React.ReactNode;
    defaultCenter?: { lat: number; lng: number };
    defaultZoom?: number;
    mapId?: string;
    style?: React.CSSProperties;
    gestureHandling?: string;
    disableDefaultUI?: boolean;
    mapTypeControl?: boolean;
    fullscreenControl?: boolean;
    streetViewControl?: boolean;
    zoomControl?: boolean;
    mapTypeControlOptions?: object;
    zoomControlOptions?: object;
    fullscreenControlOptions?: object;
    streetViewControlOptions?: object;
    mapTypeId?: string;
  }) => (
    <div
      data-testid="google-map"
      data-center={JSON.stringify(defaultCenter)}
      data-zoom={defaultZoom}
      data-map-id={mapId}
      data-style={JSON.stringify(style)}
      data-gesture-handling={gestureHandling}
      data-disable-default-ui={disableDefaultUI}
      data-map-type-control={mapTypeControl}
      data-fullscreen-control={fullscreenControl}
      data-street-view-control={streetViewControl}
      data-zoom-control={zoomControl}
      data-map-type-control-options={JSON.stringify(mapTypeControlOptions)}
      data-zoom-control-options={JSON.stringify(zoomControlOptions)}
      data-fullscreen-control-options={JSON.stringify(fullscreenControlOptions)}
      data-street-view-control-options={JSON.stringify(
        streetViewControlOptions
      )}
      data-map-type-id={mapTypeId}
    >
      {children}
    </div>
  ),
  InfoWindow: ({
    children,
    position,
    onCloseClick,
    maxWidth,
  }: {
    children?: React.ReactNode;
    position?: { lat: number; lng: number };
    onCloseClick?: () => void;
    maxWidth?: number;
  }) => (
    <div
      data-testid="info-window"
      data-position={JSON.stringify(position)}
      data-max-width={maxWidth}
    >
      <button data-testid="close-info-window" onClick={onCloseClick}>
        Close
      </button>
      {children}
    </div>
  ),
}));

// UnifiedMarkerのモック（絶対パスで指定）
vi.mock("@/components/map/UnifiedMarker", () => ({
  UnifiedMarker: ({
    point,
    onClick,
  }: {
    point: MapPoint;
    onClick: (point: MapPoint) => void;
  }) => (
    <button
      data-testid={`marker-${point.id}`}
      data-point-name={point.name}
      data-point-type={point.type}
      onClick={() => onClick(point)}
    >
      {point.name}
    </button>
  ),
}));

// MapInfoWindowのモック（絶対パスで指定）
vi.mock("@/components/map/MapView/MapInfoWindow", () => ({
  MapInfoWindow: ({ point }: { point: MapPoint }) => (
    <div data-testid="map-info-window" data-point-id={point.id}>
      {point.name}
    </div>
  ),
}));

// グローバルwindow.googleモックの設定
const setupGoogleMock = () => {
  Object.defineProperty(window, "google", {
    value: {
      maps: {
        ControlPosition: {
          TOP_RIGHT: 1,
          RIGHT_CENTER: 6,
        },
        MapTypeControlStyle: {
          DROPDOWN_MENU: 1,
        },
      },
    },
    writable: true,
    configurable: true,
  });
};

// テスト後のクリーンアップ
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MapContainer", () => {
  const defaultCenter = { lat: 38.0, lng: 138.4 };
  const mockMapId = "test-map-id";

  const mockRestaurantPoint: MapPoint = {
    id: "rest-1",
    type: "restaurant",
    name: "テストレストラン",
    district: "両津",
    address: "佐渡市両津1-1",
    coordinates: { lat: 38.05, lng: 138.45 },
    features: ["駐車場あり"],
    lastUpdated: new Date().toISOString(),
    cuisineType: "日本料理",
    priceRange: "2000-3000円",
    openingHours: [],
  };

  const mockParkingPoint: MapPoint = {
    id: "park-1",
    type: "parking",
    name: "テスト駐車場",
    district: "相川",
    address: "佐渡市相川2-2",
    coordinates: { lat: 38.1, lng: 138.3 },
    features: ["無料"],
    lastUpdated: new Date().toISOString(),
  };

  const mockToiletPoint: MapPoint = {
    id: "toilet-1",
    type: "toilet",
    name: "テストトイレ",
    district: "佐和田",
    address: "佐渡市佐和田3-3",
    coordinates: { lat: 38.02, lng: 138.35 },
    features: ["バリアフリー"],
    lastUpdated: new Date().toISOString(),
  };

  const mockOnMarkerClick = vi.fn();
  const mockOnCloseInfoWindow = vi.fn();

  beforeEach(() => {
    setupGoogleMock();
    vi.clearAllMocks();
  });

  describe("レンダリング", () => {
    it("地図コンテナが正しくレンダリングされる", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.getByTestId("google-map")).toBeInTheDocument();
    });

    it("正しいセンターとズームで地図が初期化される", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const map = screen.getByTestId("google-map");
      expect(map.getAttribute("data-center")).toBe(
        JSON.stringify(defaultCenter)
      );
      expect(map.getAttribute("data-zoom")).toBe("11");
    });

    it("正しいマップIDが設定される", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const map = screen.getByTestId("google-map");
      expect(map.getAttribute("data-map-id")).toBe(mockMapId);
    });

    it("地図スタイルが100%幅と高さで設定される", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const map = screen.getByTestId("google-map");
      const style = JSON.parse(map.getAttribute("data-style") ?? "{}") as {
        width?: string;
        height?: string;
      };
      expect(style.width).toBe("100%");
      expect(style.height).toBe("100%");
    });

    it("gestureHandlingがgreedyに設定される", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const map = screen.getByTestId("google-map");
      expect(map.getAttribute("data-gesture-handling")).toBe("greedy");
    });
  });

  describe("マーカー表示", () => {
    it("全てのマップポイントがマーカーとして表示される", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint, mockParkingPoint, mockToiletPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.getByTestId("marker-rest-1")).toBeInTheDocument();
      expect(screen.getByTestId("marker-park-1")).toBeInTheDocument();
      expect(screen.getByTestId("marker-toilet-1")).toBeInTheDocument();
    });

    it("マップポイントが空の場合、マーカーが表示されない", () => {
      render(
        <MapContainer
          mapPoints={[]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.queryByTestId(/^marker-/)).not.toBeInTheDocument();
    });

    it("各マーカーに正しいポイント情報が渡される", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const marker = screen.getByTestId("marker-rest-1");
      expect(marker.getAttribute("data-point-name")).toBe("テストレストラン");
      expect(marker.getAttribute("data-point-type")).toBe("restaurant");
    });
  });

  describe("マーカークリック", () => {
    it("マーカークリック時にonMarkerClickが呼ばれる", async () => {
      const user = userEvent.setup();

      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      await user.click(screen.getByTestId("marker-rest-1"));

      expect(mockOnMarkerClick).toHaveBeenCalledTimes(1);
      expect(mockOnMarkerClick).toHaveBeenCalledWith(mockRestaurantPoint);
    });

    it("マーカークリック時のエラーがキャッチされる", async () => {
      const user = userEvent.setup();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const throwingOnMarkerClick = vi.fn(() => {
        throw new Error("Test error");
      });

      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={throwingOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      await user.click(screen.getByTestId("marker-rest-1"));

      expect(errorSpy).toHaveBeenCalledWith(
        "マーカークリック時エラー:",
        expect.any(Error)
      );

      errorSpy.mockRestore();
    });
  });

  describe("InfoWindow", () => {
    it("selectedPointがnullの場合、InfoWindowは表示されない", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.queryByTestId("info-window")).not.toBeInTheDocument();
    });

    it("selectedPointがある場合、InfoWindowが表示される", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={mockRestaurantPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.getByTestId("info-window")).toBeInTheDocument();
    });

    it("InfoWindowに正しいpositionが設定される", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={mockRestaurantPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const infoWindow = screen.getByTestId("info-window");
      const position = JSON.parse(
        infoWindow.getAttribute("data-position") ?? "{}"
      ) as { lat?: number; lng?: number };
      expect(position.lat).toBe(mockRestaurantPoint.coordinates.lat);
      expect(position.lng).toBe(mockRestaurantPoint.coordinates.lng);
    });

    it("InfoWindow内にMapInfoWindowが表示される", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={mockRestaurantPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const mapInfoWindow = screen.getByTestId("map-info-window");
      expect(mapInfoWindow).toBeInTheDocument();
      expect(mapInfoWindow.getAttribute("data-point-id")).toBe(
        mockRestaurantPoint.id
      );
    });

    it("InfoWindowのmaxWidthが400に設定される", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={mockRestaurantPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const infoWindow = screen.getByTestId("info-window");
      expect(infoWindow.getAttribute("data-max-width")).toBe("400");
    });

    it("InfoWindowを閉じるとonCloseInfoWindowが呼ばれる", async () => {
      const user = userEvent.setup();

      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={mockRestaurantPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      await user.click(screen.getByTestId("close-info-window"));

      expect(mockOnCloseInfoWindow).toHaveBeenCalledTimes(1);
    });

    it("InfoWindow閉じる時のエラーがキャッチされる", async () => {
      const user = userEvent.setup();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const throwingOnClose = vi.fn(() => {
        throw new Error("Close error");
      });

      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={mockRestaurantPoint}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={throwingOnClose}
        />
      );

      await user.click(screen.getByTestId("close-info-window"));

      expect(errorSpy).toHaveBeenCalledWith(
        "InfoWindow閉じる時エラー:",
        expect.any(Error)
      );

      errorSpy.mockRestore();
    });
  });

  describe("カスタムコントロール", () => {
    it("customControlsが提供された場合、レンダリングされる", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
          customControls={<div data-testid="custom-control">Custom</div>}
        />
      );

      expect(screen.getByTestId("custom-control")).toBeInTheDocument();
    });

    it("customControlsが未提供の場合、エラーにならない", () => {
      expect(() =>
        render(
          <MapContainer
            mapPoints={[mockRestaurantPoint]}
            center={defaultCenter}
            mapId={mockMapId}
            selectedPoint={null}
            onMarkerClick={mockOnMarkerClick}
            onCloseInfoWindow={mockOnCloseInfoWindow}
          />
        )
      ).not.toThrow();
    });
  });

  describe("地図コントロールオプション", () => {
    it("地図コントロールが有効になっている", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const map = screen.getByTestId("google-map");
      expect(map.getAttribute("data-map-type-control")).toBe("true");
      expect(map.getAttribute("data-fullscreen-control")).toBe("true");
      expect(map.getAttribute("data-street-view-control")).toBe("true");
      expect(map.getAttribute("data-zoom-control")).toBe("true");
    });

    it("デフォルトUIが無効化されていない", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      const map = screen.getByTestId("google-map");
      expect(map.getAttribute("data-disable-default-ui")).toBe("false");
    });
  });

  describe("複数ポイントの処理", () => {
    it("同じタイプの複数ポイントを正しく表示する", () => {
      const multipleRestaurants: MapPoint[] = [
        { ...mockRestaurantPoint, id: "rest-1", name: "レストラン1" },
        { ...mockRestaurantPoint, id: "rest-2", name: "レストラン2" },
        { ...mockRestaurantPoint, id: "rest-3", name: "レストラン3" },
      ];

      render(
        <MapContainer
          mapPoints={multipleRestaurants}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      expect(screen.getByTestId("marker-rest-1")).toBeInTheDocument();
      expect(screen.getByTestId("marker-rest-2")).toBeInTheDocument();
      expect(screen.getByTestId("marker-rest-3")).toBeInTheDocument();
    });

    it("異なるタイプの混合ポイントを正しく表示する", () => {
      render(
        <MapContainer
          mapPoints={[mockRestaurantPoint, mockParkingPoint, mockToiletPoint]}
          center={defaultCenter}
          mapId={mockMapId}
          selectedPoint={null}
          onMarkerClick={mockOnMarkerClick}
          onCloseInfoWindow={mockOnCloseInfoWindow}
        />
      );

      // 各タイプが表示されていることを確認
      const markers = screen.getAllByTestId(/^marker-/);
      expect(markers).toHaveLength(3);
    });
  });
});
