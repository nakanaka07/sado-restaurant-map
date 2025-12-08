/* @vitest-environment jsdom */
import type { MapPoint } from "@/types";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircularMarkerContainer } from "../CircularMarkerContainer";

// react-google-maps モック
vi.mock("@vis.gl/react-google-maps", () => ({
  AdvancedMarker: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <span
      data-testid="advanced-marker"
      onClick={onClick}
      style={{ display: "inline-block" }}
    >
      {children}
    </span>
  ),
  InfoWindow: ({
    children,
    onCloseClick,
  }: {
    children?: React.ReactNode;
    onCloseClick?: () => void;
  }) => (
    <div role="dialog">
      <button onClick={onCloseClick} aria-label="Close info window">
        ×
      </button>
      {children}
    </div>
  ),
}));

// CircularMarker は実際のコンポーネントを使用（モックしない）
// 理由: レンダリング、スタイル、アクセシビリティの検証が必要なため

// MapInfoWindow モック
vi.mock("./MapInfoWindow", () => ({
  MapInfoWindow: ({ point }: { point: MapPoint }) => (
    <div data-testid="map-info-window">
      <h3>{point.name}</h3>
      <p>{point.type}</p>
    </div>
  ),
}));

// テスト後のクリーンアップ
afterEach(() => {
  cleanup();
});

// テストデータ
const restaurantPoint: MapPoint = {
  id: "rest-1",
  type: "restaurant",
  name: "テストレストラン",
  district: "両津",
  address: "佐渡市両津1-1",
  coordinates: { lat: 38.0, lng: 138.4 },
  features: ["駐車場あり"],
  lastUpdated: new Date().toISOString(),
  cuisineType: "日本料理",
  priceRange: "2000-3000円",
  openingHours: [
    { day: "月曜日", open: "11:00", close: "20:00", isHoliday: false },
    { day: "火曜日", open: "11:00", close: "20:00", isHoliday: false },
    { day: "水曜日", open: "11:00", close: "20:00", isHoliday: false },
    { day: "木曜日", open: "11:00", close: "20:00", isHoliday: false },
    { day: "金曜日", open: "11:00", close: "20:00", isHoliday: false },
    { day: "土曜日", open: "11:00", close: "20:00", isHoliday: false },
    { day: "日曜日", open: "11:00", close: "20:00", isHoliday: false },
  ],
};

const parkingPoint: MapPoint = {
  id: "park-1",
  type: "parking",
  name: "テスト駐車場",
  district: "佐和田",
  address: "佐渡市佐和田2-2",
  coordinates: { lat: 38.1, lng: 138.5 },
  features: ["24時間"],
  lastUpdated: new Date().toISOString(),
  capacity: 50,
  fee: "無料",
};

const toiletPoint: MapPoint = {
  id: "toilet-1",
  type: "toilet",
  name: "テストトイレ",
  district: "金井",
  address: "佐渡市金井3-3",
  coordinates: { lat: 38.2, lng: 138.6 },
  features: ["多目的"],
  lastUpdated: new Date().toISOString(),
};

describe("CircularMarkerContainer", () => {
  describe("基本レンダリング", () => {
    it("空配列でもエラーなくレンダリングできる", () => {
      const { container } = render(<CircularMarkerContainer points={[]} />);
      expect(container).toBeInTheDocument();
    });

    it("レストランマーカーが正しくレンダリングされる", () => {
      render(<CircularMarkerContainer points={[restaurantPoint]} />);
      const marker = screen.getByRole("button", {
        name: /テストレストラン/,
      });
      expect(marker).toBeInTheDocument();
      expect(marker).toHaveClass("circular-marker");
    });

    it("駐車場マーカーが正しくレンダリングされる", () => {
      render(<CircularMarkerContainer points={[parkingPoint]} />);
      const marker = screen.getByRole("button", {
        name: /駐車場: テスト駐車場/,
      });
      expect(marker).toBeInTheDocument();
      expect(marker).toHaveClass("parking-marker");
    });

    it("トイレマーカーが正しくレンダリングされる", () => {
      render(<CircularMarkerContainer points={[toiletPoint]} />);
      const marker = screen.getByRole("button", {
        name: /トイレ: テストトイレ/,
      });
      expect(marker).toBeInTheDocument();
      expect(marker).toHaveClass("circular-marker");
    });

    it("複数のマーカーを同時にレンダリングできる", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint, parkingPoint, toiletPoint]}
        />
      );
      expect(
        screen.getByRole("button", { name: /テストレストラン/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /駐車場: テスト駐車場/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /トイレ: テストトイレ/ })
      ).toBeInTheDocument();
    });
  });

  describe("マーカーサイズ", () => {
    it("デフォルトでmediumサイズが適用される（40px）", () => {
      render(<CircularMarkerContainer points={[restaurantPoint]} />);
      const marker = screen.getByRole("button", { name: /テストレストラン/ });
      expect(marker).toHaveStyle({ width: "40px", height: "40px" });
    });

    it("smallサイズが適用される（32px）", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint]}
          markerSize="small"
        />
      );
      const marker = screen.getByRole("button", { name: /テストレストラン/ });
      expect(marker).toHaveStyle({ width: "32px", height: "32px" });
    });

    it("largeサイズが適用される（48px）", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint]}
          markerSize="large"
        />
      );
      const marker = screen.getByRole("button", { name: /テストレストラン/ });
      expect(marker).toHaveStyle({ width: "48px", height: "48px" });
    });

    it("xlargeサイズが適用される（64px）", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint]}
          markerSize="xlarge"
        />
      );
      const marker = screen.getByRole("button", { name: /テストレストラン/ });
      expect(marker).toHaveStyle({ width: "64px", height: "64px" });
    });
  });

  describe("フィルタリング", () => {
    it("デフォルトで全タイプのマーカーが表示される", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint, parkingPoint, toiletPoint]}
        />
      );
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);
    });

    it("レストランのみフィルタリングできる", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint, parkingPoint, toiletPoint]}
          visibleTypes={["restaurant"]}
        />
      );
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(
        screen.getByRole("button", { name: /テストレストラン/ })
      ).toBeInTheDocument();
    });

    it("駐車場のみフィルタリングできる", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint, parkingPoint, toiletPoint]}
          visibleTypes={["parking"]}
        />
      );
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(
        screen.getByRole("button", { name: /駐車場/ })
      ).toBeInTheDocument();
    });

    it("複数タイプを同時にフィルタリングできる", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint, parkingPoint, toiletPoint]}
          visibleTypes={["restaurant", "parking"]}
        />
      );
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
    });

    it("空のフィルタで何も表示されない", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint, parkingPoint, toiletPoint]}
          visibleTypes={[]}
        />
      );
      const buttons = screen.queryAllByRole("button");
      expect(buttons).toHaveLength(0);
    });
  });

  describe("クリックイベント", () => {
    it("マーカークリック時にonPointClickが呼ばれる", () => {
      const handleClick = vi.fn();
      render(
        <CircularMarkerContainer
          points={[restaurantPoint]}
          onPointClick={handleClick}
        />
      );

      const markers = screen.getAllByRole("button", {
        name: /テストレストラン/,
      });
      fireEvent.click(markers[0]!);

      // AdvancedMarker + CircularMarkerの両方でonClickが発火するため2回
      expect(handleClick).toHaveBeenCalledTimes(2);
      expect(handleClick).toHaveBeenCalledWith(restaurantPoint);
    });

    it("onPointClickが未指定でもエラーにならない", () => {
      render(<CircularMarkerContainer points={[restaurantPoint]} />);

      const markers = screen.getAllByRole("button", {
        name: /テストレストラン/,
      });
      expect(() => fireEvent.click(markers[0]!)).not.toThrow();
    });

    it("複数マーカーのクリックをそれぞれ正しく処理する", () => {
      const handleClick = vi.fn();
      render(
        <CircularMarkerContainer
          points={[restaurantPoint, parkingPoint]}
          onPointClick={handleClick}
        />
      );

      const restaurantMarkers = screen.getAllByRole("button", {
        name: /テストレストラン/,
      });
      const parkingMarkers = screen.getAllByRole("button", {
        name: /駐車場/,
      });

      fireEvent.click(restaurantMarkers[0]!);
      expect(handleClick).toHaveBeenLastCalledWith(restaurantPoint);

      fireEvent.click(parkingMarkers[0]!);
      expect(handleClick).toHaveBeenLastCalledWith(parkingPoint);

      // 各マーカーで2回ずつ発火（AdvancedMarker + CircularMarker）
      expect(handleClick).toHaveBeenCalledTimes(4);
    });
  });

  describe("InfoWindow", () => {
    it("showInfoWindowがfalseの場合、InfoWindowは表示されない", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint]}
          selectedPoint={restaurantPoint}
          showInfoWindow={false}
        />
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("showInfoWindowがtrueでselectedPointがある場合、InfoWindowが表示される", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint]}
          selectedPoint={restaurantPoint}
          showInfoWindow={true}
        />
      );
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText("テストレストラン")).toBeInTheDocument();
    });

    it("selectedPointがnullの場合、InfoWindowは表示されない", () => {
      render(
        <CircularMarkerContainer
          points={[restaurantPoint]}
          selectedPoint={null}
          showInfoWindow={true}
        />
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("InfoWindow閉じるボタンでonInfoWindowCloseが呼ばれる", () => {
      const handleClose = vi.fn();
      const uniqueRestaurant = { ...restaurantPoint, id: "info-rest-1" };
      const { container } = render(
        <CircularMarkerContainer
          points={[uniqueRestaurant]}
          selectedPoint={uniqueRestaurant}
          showInfoWindow={true}
          onInfoWindowClose={handleClose}
        />
      );

      const closeButtons = within(container).getAllByRole("button", {
        name: /Close info window/,
      });
      fireEvent.click(closeButtons[0]!);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("onInfoWindowCloseが未指定でもエラーにならない", () => {
      const uniqueRestaurant = { ...restaurantPoint, id: "info-rest-2" };
      const { container } = render(
        <CircularMarkerContainer
          points={[uniqueRestaurant]}
          selectedPoint={uniqueRestaurant}
          showInfoWindow={true}
        />
      );

      const closeButtons = within(container).getAllByRole("button", {
        name: /Close info window/,
      });
      expect(() => fireEvent.click(closeButtons[0]!)).not.toThrow();
    });
  });

  describe("料理タイプマッピング", () => {
    it("日本料理マーカーが正しく表示される", () => {
      const japanesePoint = {
        ...restaurantPoint,
        id: "cuisine-jp-1",
        cuisineType: "日本料理" as const,
      };
      const { container } = render(
        <CircularMarkerContainer points={[japanesePoint]} />
      );
      const marker = within(container).getByRole("button", {
        name: /日本料理/,
      });
      expect(marker).toBeInTheDocument();
    });

    it("ラーメンマーカーが正しく表示される", () => {
      const ramenPoint = {
        ...restaurantPoint,
        id: "cuisine-ramen-1",
        cuisineType: "ラーメン" as const,
      };
      const { container } = render(
        <CircularMarkerContainer points={[ramenPoint]} />
      );
      const marker = within(container).getByRole("button", {
        name: /ラーメン/,
      });
      expect(marker).toBeInTheDocument();
    });

    it("カフェマーカーが正しく表示される", () => {
      const cafePoint = {
        ...restaurantPoint,
        id: "cuisine-cafe-1",
        cuisineType: "カフェ・喫茶店" as const,
      };
      const { container } = render(
        <CircularMarkerContainer points={[cafePoint]} />
      );
      const marker = within(container).getByRole("button", { name: /カフェ/ });
      expect(marker).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("レストランマーカーに適切なaria-labelが設定される", () => {
      const uniqueRestaurant = { ...restaurantPoint, id: "a11y-rest-1" };
      const { container } = render(
        <CircularMarkerContainer points={[uniqueRestaurant]} />
      );
      const marker = within(container).getByRole("button", {
        name: "テストレストラン - 日本料理",
      });
      expect(marker).toBeInTheDocument();
    });

    it("駐車場マーカーに適切なaria-labelが設定される", () => {
      const uniqueParking = { ...parkingPoint, id: "a11y-park-1" };
      const { container } = render(
        <CircularMarkerContainer points={[uniqueParking]} />
      );
      const marker = within(container).getByRole("button", {
        name: "駐車場: テスト駐車場",
      });
      expect(marker).toBeInTheDocument();
    });

    it("トイレマーカーに適切なaria-labelが設定される", () => {
      const uniqueToilet = { ...toiletPoint, id: "a11y-toilet-1" };
      const { container } = render(
        <CircularMarkerContainer points={[uniqueToilet]} />
      );
      const marker = within(container).getByRole("button", {
        name: "トイレ: テストトイレ",
      });
      expect(marker).toBeInTheDocument();
    });
  });

  describe("DEV環境でのデバッグログ", () => {
    it("開発環境でマーカークリック時にconsole.debugが呼ばれる", () => {
      const originalEnv = import.meta.env.DEV;
      (import.meta.env as { DEV: boolean }).DEV = true;
      const consoleSpy = vi
        .spyOn(console, "debug")
        .mockImplementation(() => {});

      const uniqueParking = { ...parkingPoint, id: "dev-park-1" };
      const { container } = render(
        <CircularMarkerContainer
          points={[uniqueParking]}
          onPointClick={vi.fn()}
        />
      );

      const marker = within(container).getByRole("button", {
        name: /駐車場/,
      });
      fireEvent.click(marker);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[CircularMarkerContainer] marker click",
        {
          id: "dev-park-1",
          type: "parking",
          name: "テスト駐車場",
        }
      );

      consoleSpy.mockRestore();
      (import.meta.env as { DEV: boolean }).DEV = originalEnv;
    });
  });

  describe("重複キー回避", () => {
    it("同じIDでも異なるtypeの場合、重複キーエラーが発生しない", () => {
      const duplicateIdPoints: MapPoint[] = [
        { ...restaurantPoint, id: "duplicate-1" },
        { ...parkingPoint, id: "duplicate-1" },
      ];

      // エラーなくレンダリングできることを確認
      const { container } = render(
        <CircularMarkerContainer points={duplicateIdPoints} />
      );
      expect(container).toBeInTheDocument();
      expect(within(container).getAllByRole("button")).toHaveLength(2);
    });
  });
});
