import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

// window.matchMediaのモックを追加
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Google Maps APIを完全にモック
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-provider">{children}</div>
  ),
  Map: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  AdvancedMarker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="advanced-marker">{children}</div>
  ),
  InfoWindow: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="info-window">{children}</div>
  ),
  Pin: () => <div data-testid="pin" />,
}));

// フックやコンポーネントのモック
vi.mock("@/hooks", () => ({
  useMapPoints: () => ({
    mapPoints: [],
    loading: false,
    error: null,
    filters: {
      cuisineTypes: [],
      priceRanges: [],
      districts: [],
      searchQuery: "",
      openNow: false,
      pointTypes: ["restaurant", "parking", "toilet"],
    },
    updateFilters: vi.fn(),
    updateSortOrder: vi.fn(),
    stats: {
      total: 0,
      restaurants: 0,
      parkings: 0,
      toilets: 0,
    },
  }),
}));

vi.mock("../components/common/AccessibilityComponents", () => ({
  SkipLink: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a className="skip-link" href={href}>
      {children}
    </a>
  ),
}));

vi.mock("../components/layout/PWABadge", () => ({
  default: () => <div data-testid="pwa-badge">PWA Badge</div>,
}));

vi.mock("../components/map", () => ({
  MapView: ({ mapPoints }: { mapPoints: unknown[] }) => (
    <div data-testid="map-view">Map with {mapPoints.length} points</div>
  ),
}));

vi.mock("../components/restaurant", () => ({
  FilterPanel: () => (
    <div data-testid="filter-panel">
      <h2>🔍 フィルター</h2>
      <div aria-live="polite">📊 0 件</div>
    </div>
  ),
}));

vi.mock("../components/ui", () => ({
  CompactModalFilter: () => (
    <div data-testid="compact-modal-filter">
      <h2>🔍 フィルター</h2>
      <div aria-live="polite">📊 0 件</div>
    </div>
  ),
}));

// ユーティリティ関数のモック
vi.mock("@/utils", () => ({
  checkGAStatus: vi.fn().mockResolvedValue(undefined),
  initGA: vi.fn(() => Promise.resolve()), // 即座に解決されるPromise
  initializeDevLogging: vi.fn(),
  sanitizeInput: vi.fn((input: string) => input),
  logUnknownAddressStats: vi.fn(),
  testDistrictAccuracy: vi.fn(),
}));

vi.mock("@/utils/districtUtils", () => ({
  logUnknownAddressStats: vi.fn(),
  testDistrictAccuracy: vi.fn(),
}));

vi.mock("../utils/securityUtils", () => ({
  validateApiKey: vi.fn().mockReturnValue(true),
}));

// 環境変数をモック
vi.mock("import.meta", () => ({
  env: {
    VITE_GOOGLE_MAPS_API_KEY: "test_api_key",
    DEV: false,
  },
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // DOM要素の完全クリーンアップ
  });

  afterEach(() => {
    cleanup();
    // 残存する要素の強制削除（テスト間の分離保証）
    const remainingContainers = document.querySelectorAll(
      '.loading-container, output[aria-live="polite"]'
    );
    remainingContainers.forEach(container => container.remove());
    const remainingHeadings = document.querySelectorAll("h1");
    remainingHeadings.forEach(heading => heading.remove());
  });

  describe("基本レンダリング", () => {
    it("アプリケーションが正常にレンダリングされること", async () => {
      render(<App />);

      // 初期化完了を待つ
      await waitFor(() => {
        expect(screen.getByText("🔍 フィルター")).toBeInTheDocument();
      });

      // アプリケーションの基本要素の確認
      expect(screen.getByTestId("api-provider")).toBeInTheDocument();
    });

    it("フィルターコンテナが適切なARIA属性を持つこと", async () => {
      render(<App />);

      // 初期化完了を待つ
      await waitFor(() => {
        expect(screen.getByText("🔍 フィルター")).toBeInTheDocument();
      });

      // フィルターコンテナのARIA属性確認
      const filterTitle = screen.getByText("🔍 フィルター");
      expect(filterTitle).toBeInTheDocument();

      // ライブリージョンのaria-live属性を確認
      const liveRegion = screen.getByText(/📊.*0.*件/);
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("アクセシビリティ", () => {
    it("適切なARIA属性が設定されていること", async () => {
      render(<App />);

      // 初期化完了を待つ
      await waitFor(() => {
        expect(screen.getByRole("main")).toBeInTheDocument();
      });

      // メインコンテンツの確認
      const mainContent = screen.getByRole("main");
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveAttribute("id", "main-content");

      // スキップリンクの確認
      const skipLink = screen.getByText("メインコンテンツにスキップ");
      expect(skipLink).toHaveAttribute("href", "#main-content");
    });

    it("フィルター状態では必要な要素が表示されること", async () => {
      render(<App />);

      // 初期化完了を待つ
      await waitFor(() => {
        expect(screen.getByText("🔍 フィルター")).toBeInTheDocument();
      });

      // フィルター状態での表示確認
      const filterHeader = screen.getByText("🔍 フィルター");
      expect(filterHeader).toBeInTheDocument();

      // フィルターパネルの確認
      const filterPanel = screen.getByTestId("filter-panel");
      expect(filterPanel).toBeInTheDocument();
    });
  });

  describe("レスポンシブ対応", () => {
    it("アプリケーションが適切にレンダリングされること", async () => {
      render(<App />);

      // 初期化完了を待つ
      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // アプリケーションコンテンツの確認
      const appContent = document.querySelector(".app-content");
      expect(appContent).toBeInTheDocument();

      // Google Maps API Providerの確認
      const apiProvider = screen.getByTestId("api-provider");
      expect(apiProvider).toBeInTheDocument();
    });
  });
});
