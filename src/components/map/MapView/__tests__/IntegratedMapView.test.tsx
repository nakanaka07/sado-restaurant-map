/* @vitest-environment jsdom */
import type { MapPoint } from "@/types";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntegratedMapView } from "../IntegratedMapView";

// モック設定
vi.mock("@/utils/analytics", () => ({
  trackMapInteraction: vi.fn(),
  trackRestaurantClick: vi.fn(),
}));

vi.mock("@/config/abTestConfig", () => ({
  classifyUser: vi.fn(() => ({
    segment: "control",
    variant: "original",
  })),
  loadABTestState: vi.fn(() => null),
  saveABTestState: vi.fn(),
  trackABTestEvent: vi.fn(),
  CURRENT_AB_TEST_CONFIG: {
    currentPhase: "phase-0",
    rolloutPercentage: 100,
  },
}));

vi.mock("../EnhancedMapContainer", () => ({
  EnhancedMapContainer: ({
    children,
    mapPoints,
    onMarkerClick,
  }: {
    children?: React.ReactNode;
    mapPoints: MapPoint[];
    onMarkerClick?: (point: MapPoint) => void;
  }) => (
    <div data-testid="enhanced-map-container">
      <div data-testid="map-points-count">{mapPoints.length}</div>
      <button
        data-testid="test-marker-click"
        onClick={() => {
          const firstPoint = mapPoints[0];
          if (firstPoint && onMarkerClick) {
            onMarkerClick(firstPoint);
          }
        }}
      >
        Click Marker
      </button>
      {children}
    </div>
  ),
}));

vi.mock("../MapErrorBoundary", () => ({
  MapErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock("../MapErrorFallback", () => ({
  MapErrorFallback: ({ error }: { error?: string }) => (
    <div data-testid="error-fallback">{error || "Error occurred"}</div>
  ),
}));

// テスト後のクリーンアップ
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("IntegratedMapView", () => {
  const mockMapId = "test-map-id";
  const mockCenter = { lat: 38.0, lng: 138.4 };

  const mockRestaurantPoint: MapPoint = {
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

  beforeEach(() => {
    // 環境変数のモック
    vi.stubEnv("VITE_GOOGLE_MAPS_MAP_ID", mockMapId);
    vi.stubEnv("DEV", true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("基本レンダリング", () => {
    it("正常にマップをレンダリングできる", async () => {
      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("enhanced-map-container")
        ).toBeInTheDocument();
      });
    });

    it("複数のマップポイントを表示できる", async () => {
      const points = [
        mockRestaurantPoint,
        { ...mockRestaurantPoint, id: "rest-2", name: "レストラン2" },
        { ...mockRestaurantPoint, id: "rest-3", name: "レストラン3" },
      ];

      render(
        <IntegratedMapView
          mapPoints={points}
          center={mockCenter}
          loading={false}
        />
      );

      await waitFor(() => {
        const count = screen.getByTestId("map-points-count");
        expect(count).toHaveTextContent("3");
      });
    });

    it("空のポイント配列でもレンダリングできる", async () => {
      render(
        <IntegratedMapView mapPoints={[]} center={mockCenter} loading={false} />
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("enhanced-map-container")
        ).toBeInTheDocument();
      });
    });
  });

  describe("ローディング状態", () => {
    it("ローディング中は適切なメッセージを表示", () => {
      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={true}
        />
      );

      expect(screen.getByText("地図を読み込み中...")).toBeInTheDocument();
      expect(screen.getByText("🔄")).toBeInTheDocument();
    });

    it("ローディング中はマップコンテナを表示しない", () => {
      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={true}
        />
      );

      expect(
        screen.queryByTestId("enhanced-map-container")
      ).not.toBeInTheDocument();
    });
  });

  describe("エラー処理", () => {
    it("エラーがある場合はエラーフォールバックを表示", () => {
      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
          error="マップの読み込みに失敗しました"
        />
      );

      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
      expect(
        screen.getByText("マップの読み込みに失敗しました")
      ).toBeInTheDocument();
    });

    it("Map IDが未設定の場合はエラーフォールバックを表示", () => {
      vi.stubEnv("VITE_GOOGLE_MAPS_MAP_ID", "");

      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
        />
      );

      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
    });
  });

  describe("A/Bテスト統合", () => {
    it("A/Bテスト分類を実行する", async () => {
      const { classifyUser, saveABTestState, trackABTestEvent } = await import(
        "@/config/abTestConfig"
      );

      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
        />
      );

      await waitFor(() => {
        expect(classifyUser).toHaveBeenCalled();
        expect(saveABTestState).toHaveBeenCalled();
        expect(trackABTestEvent).toHaveBeenCalledWith(
          "assigned",
          expect.any(Object)
        );
      });
    });

    it("保存済みA/Bテスト状態を読み込む", async () => {
      const { loadABTestState } = await import("@/config/abTestConfig");

      vi.mocked(loadABTestState).mockReturnValueOnce({
        segment: "general",
        variant: "original",
      });

      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
        />
      );

      await waitFor(() => {
        expect(loadABTestState).toHaveBeenCalled();
      });
    });

    it("開発環境でA/Bテスト情報を表示", async () => {
      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
        />
      );

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /A\/B割当とは異なるマーカータイプ|A\/Bテスト現在の状態/,
        });
        expect(button).toBeInTheDocument();
      });
    });

    it("forceVariant指定時は強制的にバリアントを設定", async () => {
      const { classifyUser } = await import("@/config/abTestConfig");

      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
          forceVariant="enhanced-png"
        />
      );

      await waitFor(() => {
        expect(classifyUser).toHaveBeenCalledWith(
          undefined,
          expect.objectContaining({ forceVariant: "enhanced-png" })
        );
      });
    });
  });

  describe("マーカークリックイベント", () => {
    it("マーカークリック時にトラッキングイベントを送信", async () => {
      const { trackRestaurantClick, trackMapInteraction } = await import(
        "@/utils/analytics"
      );
      const { trackABTestEvent } = await import("@/config/abTestConfig");

      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("test-marker-click")).toBeInTheDocument();
      });

      const clickButton = screen.getByTestId("test-marker-click");
      clickButton.click();

      await waitFor(() => {
        expect(trackRestaurantClick).toHaveBeenCalledWith({
          id: "rest-1",
          name: "テストレストラン",
          category: "日本料理",
          priceRange: "2000-3000円",
        });
        expect(trackMapInteraction).toHaveBeenCalledWith("marker_click");
        expect(trackABTestEvent).toHaveBeenCalledWith(
          "interaction",
          expect.any(Object)
        );
      });
    });
  });

  describe("カスタムコントロール", () => {
    it("開発環境でカスタムコントロールを表示", async () => {
      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
          customControls={
            <div data-testid="custom-control">Custom Control</div>
          }
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("custom-control")).toBeInTheDocument();
      });
    });

    it("本番環境ではカスタムコントロールを非表示", async () => {
      vi.stubEnv("DEV", false);
      vi.stubEnv("PROD", true);

      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
          customControls={
            <div data-testid="custom-control">Custom Control</div>
          }
        />
      );

      await waitFor(() => {
        expect(screen.queryByTestId("custom-control")).not.toBeInTheDocument();
      });
    });
  });

  describe("エラーバウンダリ", () => {
    it("MapErrorBoundaryでラップされている", async () => {
      render(
        <IntegratedMapView
          mapPoints={[mockRestaurantPoint]}
          center={mockCenter}
          loading={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      });
    });
  });
  describe("パフォーマンス", () => {
    it("大量のマーカー（50件）でも正常にレンダリング", async () => {
      const manyPoints = Array.from({ length: 50 }, (_, i) => ({
        ...mockRestaurantPoint,
        id: `rest-${i}`,
        name: `レストラン${i}`,
        coordinates: {
          lat: 38.0 + i * 0.01,
          lng: 138.4 + i * 0.01,
        },
      }));

      render(
        <IntegratedMapView
          mapPoints={manyPoints}
          center={mockCenter}
          loading={false}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("enhanced-map-container")
        ).toBeInTheDocument();
      });
    });
  });
});
