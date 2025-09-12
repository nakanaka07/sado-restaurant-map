import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

// window.matchMediaのモックを追加
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// PWA関連をモック
vi.mock("./PWABadge", () => ({
  default: () => <div data-testid="pwa-badge">PWA Badge</div>,
}));

// 環境変数をモック
vi.mock("import.meta", () => ({
  env: {
    VITE_GOOGLE_MAPS_API_KEY: "test_api_key",
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
      await act(async () => {
        render(<App />);
      });

      // アプリケーションの基本要素の確認
      expect(screen.getByText("🔍 フィルター")).toBeInTheDocument();
      expect(screen.getByTestId("api-provider")).toBeInTheDocument();
    });

    it("フィルターコンテナが適切なARIA属性を持つこと", async () => {
      await act(async () => {
        render(<App />);
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
      await act(async () => {
        render(<App />);
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
      await act(async () => {
        render(<App />);
      });

      // フィルター状態での表示確認
      const filterHeader = screen.getByText("🔍 フィルター");
      expect(filterHeader).toBeInTheDocument();

      // 検索入力欄の確認
      const searchInput =
        screen.getByPlaceholderText("店名、料理、地域で検索...");
      expect(searchInput).toBeInTheDocument();

      // 料理ジャンルセレクトぼックスの確認
      const cuisineSelect = screen.getByDisplayValue("すべての料理");
      expect(cuisineSelect).toBeInTheDocument();
    });
  });

  describe("レスポンシブ対応", () => {
    it("アプリケーションが適切にレンダリングされること", async () => {
      await act(async () => {
        render(<App />);
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
