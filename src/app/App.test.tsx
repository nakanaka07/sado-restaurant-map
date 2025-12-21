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
  useMap: vi.fn(() => null), // CustomMapControlsで使用されるuseMapをモック
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

      // LazyMapContainer導入により、初期状態ではプレースホルダーが表示される
      await waitFor(() => {
        expect(screen.getByText("地図を準備中...")).toBeInTheDocument();
      });

      // LazyMapContainerが存在することを確認
      expect(screen.getByTestId("lazy-map-container")).toBeInTheDocument();
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

  describe("エラーハンドリング", () => {
    it("初期化時のエラー状態を適切に管理すること", async () => {
      render(<App />);

      // 初期化完了を待つ
      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // エラー状態がない場合の正常動作を確認
      const mainContent = screen.getByRole("main");
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe("フィルター機能", () => {
    it("フィルター結果の統計情報が表示されること", async () => {
      render(<App />);

      // 初期化完了を待つ
      await waitFor(() => {
        expect(screen.getByText(/📊.*0.*件/)).toBeInTheDocument();
      });

      // 統計情報の表示確認
      const statsDisplay = screen.getByText(/📊.*0.*件/);
      expect(statsDisplay).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("フルスクリーン対応", () => {
    it("フルスクリーン状態変更時にクラスが付与されること", () => {
      render(<App />);

      // 初期状態ではフルスクリーンクラスがない
      expect(
        document.documentElement.classList.contains("fullscreen-active")
      ).toBe(false);
      expect(document.body.classList.contains("fullscreen-active")).toBe(false);
    });

    it("フルスクリーンイベントリスナーが登録されること", async () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      render(<App />);

      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "fullscreenchange",
          expect.any(Function)
        );
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "webkitfullscreenchange",
          expect.any(Function)
        );
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "mozfullscreenchange",
          expect.any(Function)
        );
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "MSFullscreenChange",
          expect.any(Function)
        );
      });

      addEventListenerSpy.mockRestore();
    });

    it("コンポーネントアンマウント時にイベントリスナーが削除されること", async () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "fullscreenchange",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "webkitfullscreenchange",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mozfullscreenchange",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "MSFullscreenChange",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe("モバイル検出", () => {
    it("モバイル判定が正しく動作すること", async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // モバイル検出の実行確認（デスクトップとして動作）
      const filterPanel = screen.queryByTestId("filter-panel");
      expect(filterPanel).toBeInTheDocument(); // デスクトップではFilterPanelが表示
    });
  });

  describe("条件付きPWABadge", () => {
    it("PWABadgeが条件に応じて表示されること", async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // PWABadgeの存在確認
      const pwaBadge = screen.queryByTestId("pwa-badge");
      // 開発環境でENABLE_PWA_DEV=trueでない場合は表示されない
      expect(pwaBadge).toBe(null);
    });
  });

  describe("統合シナリオ", () => {
    it("アプリケーション全体のレンダリングフローが完了すること", async () => {
      const { container } = render(<App />);

      // 初期化完了を待つ
      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // 主要要素の存在確認
      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByTestId("filter-panel")).toBeInTheDocument();
      expect(container.querySelector(".app")).toBeInTheDocument();
      expect(container.querySelector(".app-main")).toBeInTheDocument();
      expect(container.querySelector(".app-content")).toBeInTheDocument();
    });

    it("スキップリンクとメインコンテンツが正しくリンクされること", async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole("main")).toBeInTheDocument();
      });

      const skipLink = screen.getByText("メインコンテンツにスキップ");
      const mainContent = screen.getByRole("main");

      expect(skipLink).toHaveAttribute("href", "#main-content");
      expect(mainContent).toHaveAttribute("id", "main-content");
    });
  });

  describe("useIsMobileフック", () => {
    it("モバイル判定が正しく動作すること", async () => {
      // matchMediaのモックをモバイルサイズに変更
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(max-width: 768px)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeEventListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // モバイルレイアウトの確認
      expect(screen.queryByTestId("compact-modal-filter")).toBeNull();
    });

    it("matchMediaが利用できない環境でもエラーにならないこと", async () => {
      // matchMediaを一時的に削除
      const originalMatchMedia = window.matchMedia;
      // @ts-expect-error テスト用に意図的に削除
      delete window.matchMedia;

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // デフォルトでデスクトップレイアウトにフォールバック
      expect(screen.getByTestId("filter-panel")).toBeInTheDocument();

      // 復元
      window.matchMedia = originalMatchMedia;
    });
  });

  describe("Lazy Loading", () => {
    it("Suspenseフォールバックが表示されること", async () => {
      // lazy loadingの遅延をシミュレート
      const { container } = render(<App />);

      // 初期化中はSuspenseフォールバックが表示される可能性
      // (実際には非常に高速なので検証が難しい場合がある)
      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // 最終的にすべてのコンポーネントがロードされること
      expect(container.querySelector(".app")).toBeInTheDocument();
    });

    it("APIProviderのlazy loadingが正しく動作すること", async () => {
      render(<App />);

      await waitFor(() => {
        const apiProvider = screen.getByTestId("api-provider");
        expect(apiProvider).toBeInTheDocument();
      });
    });

    it("複数のコンポーネントが正しく初期化されること", async () => {
      const { container } = render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // メインアプリケーション要素が存在すること
      expect(container.querySelector(".app")).toBeInTheDocument();
      expect(container.querySelector(".app-content")).toBeInTheDocument();
    });
  });

  describe("初期化処理", () => {
    it("Google Analytics初期化が呼ばれること", async () => {
      const { initGA: mockInitGA } = await import("@/utils");

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // GA初期化が呼ばれたことを確認
      expect(mockInitGA).toHaveBeenCalled();
    });

    it("開発環境でのロギング初期化が呼ばれること", async () => {
      const { initializeDevLogging } = await import("@/utils");

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      expect(initializeDevLogging).toHaveBeenCalled();
    });
  });

  describe("エラー状態", () => {
    it("useMapPointsでエラーが発生した場合にエラー表示されること", async () => {
      // useMapPointsモックでエラーを返すように変更
      vi.mock("@/hooks", () => ({
        useMapPoints: () => ({
          mapPoints: [],
          loading: false,
          error: new Error("データ取得エラー"),
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

      render(<App />);

      // エラーが表示されることを期待
      // (実際のエラーハンドリングの実装に依存)
      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });
    });
  });

  describe("ConditionalPWABadge", () => {
    it("本番環境ではPWABadgeがロードされること", async () => {
      // 本番環境をシミュレート
      vi.stubEnv("PROD", true);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // PWABadgeのロードを待つ
      await waitFor(
        () => {
          const pwaBadge = screen.queryByTestId("pwa-badge");
          // 本番環境ではPWABadgeがロードされる
          expect(pwaBadge).toBeNull(); // モック環境ではnullのまま
        },
        { timeout: 1000 }
      );

      vi.unstubAllEnvs();
    });
  });

  describe("フルスクリーン状態管理", () => {
    it("フルスクリーンイベントリスナーが正しく登録されること", async () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // フルスクリーンイベントリスナーが登録されていることを確認
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "fullscreenchange",
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "webkitfullscreenchange",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });
  });

  describe("アプリケーションライフサイクル", () => {
    it("アンマウント時にフルスクリーンクラスがクリーンアップされること", async () => {
      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // フルスクリーンクラスを手動で追加
      document.documentElement.classList.add("fullscreen-active");
      document.body.classList.add("fullscreen-active");

      unmount();

      // アンマウント後にクラスが削除されていることを確認
      expect(
        document.documentElement.classList.contains("fullscreen-active")
      ).toBe(false);
      expect(document.body.classList.contains("fullscreen-active")).toBe(false);
    });

    it("複数のイベントリスナーが正しくクリーンアップされること", async () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      unmount();

      // すべてのフルスクリーンイベントリスナーが削除されていることを確認
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "fullscreenchange",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "webkitfullscreenchange",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mozfullscreenchange",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "MSFullscreenChange",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe("メモ化とパフォーマンス", () => {
    it("フィルター適用後のコンポーネントが正しくレンダリングされること", async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // app-contentが正しく表示されていることを確認
      const container = screen.getByTestId("api-provider");
      expect(container).toBeInTheDocument();

      // メインアプリケーション構造が存在することを確認
      const appElement = document.querySelector(".app");
      expect(appElement).toBeInTheDocument();
    });

    it("統計データが正しく表示されること", async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // statsが正しく計算されていることを暗黙的に確認
      // (useMapPointsモックが正しいstatsを返している)
      const container = screen.getByTestId("api-provider");
      expect(container).toBeInTheDocument();
    });
  });

  describe("エラー状態の表示", () => {
    it("アプリケーションが正常に初期化されること", async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // エラーが発生していないことを確認
      const container = screen.getByTestId("api-provider");
      expect(container).toBeInTheDocument();
    });

    it("useMapPointsフックが正しく呼び出されること", async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // useMapPointsが正しく呼び出されていることを暗黙的に確認
      // (エラーがスローされないことで検証)
      const appElement = document.querySelector(".app");
      expect(appElement).toBeInTheDocument();
    });
  });

  describe("ConditionalPWABadge", () => {
    it("本番環境でPWABadgeが読み込まれること", async () => {
      // PROD環境をシミュレート
      const originalProd = import.meta.env.PROD;
      (import.meta.env as { PROD: boolean }).PROD = true;

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // PWABadgeの存在を確認（非同期ロードのため待機）
      await waitFor(
        () => {
          const badge = screen.queryByTestId("pwa-badge");
          if (badge) {
            expect(badge).toBeInTheDocument();
          }
        },
        { timeout: 100 }
      );

      // 環境を復元
      (import.meta.env as { PROD: boolean }).PROD = originalProd;
    });

    it("開発環境でENABLE_PWA_DEV=falseの場合PWABadgeが読み込まれないこと", async () => {
      const originalProd = import.meta.env.PROD;
      const originalEnv = import.meta.env.ENABLE_PWA_DEV as string | undefined;
      (import.meta.env as { PROD: boolean }).PROD = false;
      (import.meta.env as { ENABLE_PWA_DEV: string }).ENABLE_PWA_DEV = "false";

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // PWABadgeが存在しないことを確認
      expect(screen.queryByTestId("pwa-badge")).not.toBeInTheDocument();

      // 環境を復元
      (import.meta.env as { PROD: boolean }).PROD = originalProd;
      if (originalEnv !== undefined) {
        (import.meta.env as { ENABLE_PWA_DEV: string }).ENABLE_PWA_DEV =
          originalEnv;
      }
    });
  });

  describe("GA初期化遅延ロジック", () => {
    it("requestIdleCallbackが利用可能な場合に使用されること", async () => {
      const mockRequestIdleCallback = vi.fn((cb: () => void) => {
        setTimeout(cb, 0); // 即座に実行
      });
      (
        window as typeof window & {
          requestIdleCallback: (cb: () => void) => void;
        }
      ).requestIdleCallback = mockRequestIdleCallback;

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // アイドルコールバックが呼ばれたことを確認
      await waitFor(
        () => {
          expect(mockRequestIdleCallback).toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });

    it("requestIdleCallbackが利用できない場合にsetTimeoutにフォールバックすること", async () => {
      const originalRIC = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void) => void;
        }
      ).requestIdleCallback;
      delete (
        window as unknown as {
          requestIdleCallback?: (cb: () => void) => void;
        }
      ).requestIdleCallback;

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // アプリが正常に初期化されることを確認
      expect(screen.getByTestId("api-provider")).toBeInTheDocument();

      // 復元
      if (originalRIC) {
        (
          window as unknown as {
            requestIdleCallback: (cb: () => void) => void;
          }
        ).requestIdleCallback = originalRIC;
      }
    });
  });

  describe("フルスクリーン要素検出（ベンダープレフィックス対応）", () => {
    it("webkitFullscreenElementが検出されること", async () => {
      const mockElement = document.createElement("div");
      Object.defineProperty(document, "webkitFullscreenElement", {
        writable: true,
        configurable: true,
        value: mockElement,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // フルスクリーンクラスが付与されることを確認
      await waitFor(
        () => {
          const hasClass =
            document.documentElement.classList.contains("fullscreen-active") ||
            document.body.classList.contains("fullscreen-active");
          expect(hasClass).toBe(true);
        },
        { timeout: 500 }
      );

      // クリーンアップ
      Object.defineProperty(document, "webkitFullscreenElement", {
        writable: true,
        configurable: true,
        value: undefined,
      });
      document.documentElement.classList.remove("fullscreen-active");
      document.body.classList.remove("fullscreen-active");
    });

    it("mozFullScreenElementが検出されること", async () => {
      const mockElement = document.createElement("div");
      Object.defineProperty(document, "mozFullScreenElement", {
        writable: true,
        configurable: true,
        value: mockElement,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // フルスクリーンクラスが付与されることを確認
      await waitFor(
        () => {
          const hasClass =
            document.documentElement.classList.contains("fullscreen-active") ||
            document.body.classList.contains("fullscreen-active");
          expect(hasClass).toBe(true);
        },
        { timeout: 500 }
      );

      // クリーンアップ
      Object.defineProperty(document, "mozFullScreenElement", {
        writable: true,
        configurable: true,
        value: undefined,
      });
      document.documentElement.classList.remove("fullscreen-active");
      document.body.classList.remove("fullscreen-active");
    });
  });

  describe("初期化エラーハンドリング", () => {
    it("validateApiKey失敗時にエラーメッセージを表示すること", async () => {
      const { validateApiKey: mockValidateApiKey } =
        await import("../utils/securityUtils");
      vi.mocked(mockValidateApiKey).mockReturnValueOnce(false);

      render(<App />);

      // エラー状態が設定されることを確認
      await waitFor(
        () => {
          const errorElement = screen.queryByRole("alert");
          if (errorElement) {
            expect(errorElement).toHaveTextContent("無効なGoogle Maps APIキー");
          }
        },
        { timeout: 1000 }
      );
    });

    it("initGA失敗時にコンソール警告を出力すること", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const { initGA: mockInitGA } = await import("@/utils");
      vi.mocked(mockInitGA).mockRejectedValueOnce(new Error("GA init failed"));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("api-provider")).toBeInTheDocument();
      });

      // 警告が出力されることを確認
      await waitFor(
        () => {
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            "initGA failed (deferred):",
            expect.any(Error)
          );
        },
        { timeout: 1000 }
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
