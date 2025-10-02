// Fast-fail: jsdom environment must be active for DOM-based tests
if (typeof document === "undefined" || typeof window === "undefined") {
  throw new Error(
    "Test setup: jsdom environment not active. Ensure environment=jsdom or per-file /* @vitest-environment jsdom */ is set."
  );
}

// Environment variables for testing - 最優先で設定
process.env.VITE_GA_MEASUREMENT_ID = "G-TEST123456";
process.env.VITE_GOOGLE_MAPS_API_KEY = "TEST_API_KEY";
process.env.VITE_GOOGLE_SHEETS_API_KEY = "test-sheets-api-key";
process.env.VITE_SPREADSHEET_ID = "test-spreadsheet-id";

import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";
import { vi } from "vitest";

// React Testing Library の設定
// 非同期更新の自動 act() ラッピングを有効化
configure({
  // 非同期更新を自動的にact()でラップ
  asyncUtilTimeout: 2000,
  // React 19 Concurrent Features対応
  reactStrictMode: true,
});

// DOM API のモック設定
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000/test",
    origin: "http://localhost:3000",
    protocol: "http:",
    host: "localhost:3000",
    hostname: "localhost",
    port: "3000",
    pathname: "/test",
    search: "",
    hash: "",
  },
  writable: true,
});

Object.defineProperty(window, "navigator", {
  value: {
    userAgent: "Mozilla/5.0 (Test Browser) TestAgent/1.0",
    language: "ja-JP",
    languages: ["ja-JP", "en-US"],
    platform: "Test Platform",
    cookieEnabled: true,
    onLine: true,
  },
  writable: true,
});

// DOM イベントリスナーのモック
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, "addEventListener", {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(window, "removeEventListener", {
  value: mockRemoveEventListener,
  writable: true,
});

// Document のモック
Object.defineProperty(document, "addEventListener", {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(document, "removeEventListener", {
  value: mockRemoveEventListener,
  writable: true,
});

// Act warning の抑制（開発時のみ）
// 本番環境では React DevTools が適切に警告を表示
if (process.env.NODE_ENV === "test") {
  // React Testing Library による自動 act() 処理を信頼
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    const msg = typeof first === "string" ? first : "";

    // 抑制対象パターン (過剰ノイズ / 外部ライブラリ由来 / 意図したエラーパス)
    const suppressPatterns: RegExp[] = [
      /Warning: An update to .* was not wrapped in act/, // act() 警告
      /React does not recognize the `zIndex` prop on a DOM element/, // ライブラリがzIndexをdivへ透過
      /Not implemented: window.open/, // jsdom未実装 (下でモック)
      /Failed to fetch restaurants from sheets/, // エラーパス検証用ノイズ
      /Google Sheets API request failed:/, // Sheets API エラー系
    ];

    if (suppressPatterns.some(r => r.test(msg))) {
      return; // テストで期待される・無視可能なノイズ
    }

    originalError.call(console, ...args);
  };
}

// window.open を jsdom 環境で安全にモック (Not implemented 警告回避)
if (typeof window.open !== "function") {
  Object.defineProperty(window, "open", {
    value: vi.fn(() => null),
    writable: true,
    configurable: true,
  });
} else {
  // 既存実装が jsdom の not implemented を投げる場合でも上書き
  window.open = vi.fn(() => null) as unknown as typeof window.open;
}

// Google Maps API の型安全なモック実装
// テスト環境専用: 本番コードでは実際のGoogle Maps APIを使用
interface MockGoogleMaps {
  maps: {
    MapTypeId: Record<string, string>;
    Map: ReturnType<typeof vi.fn>;
    Marker: ReturnType<typeof vi.fn>;
    InfoWindow: ReturnType<typeof vi.fn>;
    LatLng: ReturnType<typeof vi.fn>;
    event: {
      addListener: ReturnType<typeof vi.fn>;
      removeListener: ReturnType<typeof vi.fn>;
    };
  };
}

// テスト環境でのGoogle Maps API モック設定
// セキュリティ考慮: スコープを限定し型安全性を最優先
declare global {
  interface Window {
    google?: MockGoogleMaps;
  }
}

const mockGoogle: MockGoogleMaps = {
  maps: {
    MapTypeId: {
      ROADMAP: "roadmap",
      SATELLITE: "satellite",
      HYBRID: "hybrid",
      TERRAIN: "terrain",
    },
    Map: vi.fn().mockImplementation(() => ({
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      addListener: vi.fn(),
    })),
    Marker: vi.fn().mockImplementation(() => ({
      setPosition: vi.fn(),
      setMap: vi.fn(),
      addListener: vi.fn(),
    })),
    InfoWindow: vi.fn().mockImplementation(() => ({
      setContent: vi.fn(),
      open: vi.fn(),
      close: vi.fn(),
    })),
    LatLng: vi
      .fn()
      .mockImplementation((lat: number, lng: number) => ({ lat, lng })),
    event: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
};

// 型安全なグローバル変数設定
Object.defineProperty(globalThis, "google", {
  value: mockGoogle,
  configurable: true,
  enumerable: true,
});

// Window オブジェクトにも設定
Object.defineProperty(window, "google", {
  value: mockGoogle,
  configurable: true,
  enumerable: true,
});

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

// Mock analytics for testing
vi.mock("../utils/analytics", () => ({
  trackSearch: vi.fn(),
  trackFilter: vi.fn(),
  initGA: vi.fn().mockResolvedValue(undefined),
  trackEvent: vi.fn(),
  trackRestaurantClick: vi.fn(),
  trackMapInteraction: vi.fn(),
  trackPWAUsage: vi.fn(),
  trackPageView: vi.fn(),
  checkGAStatus: vi.fn().mockResolvedValue({}),
  debugGA: vi.fn().mockResolvedValue({}),
  runGADiagnostics: vi.fn().mockReturnValue({}),
  sendTestEvents: vi.fn(),
  autoFixGA: vi.fn().mockReturnValue({}),
}));

// Mock services for general testing (excluding sheetsService which has its own tests)
vi.mock("../services/sheets/sheetsService", () => ({
  fetchRestaurantsFromSheets: vi.fn().mockResolvedValue([]),
  fetchParkingsFromSheets: vi.fn().mockResolvedValue([]),
  fetchToiletsFromSheets: vi.fn().mockResolvedValue([]),
  fetchAllMapPoints: vi.fn().mockResolvedValue([]),
  checkDataFreshness: vi.fn().mockResolvedValue({ needsUpdate: false }),
  SheetsApiError: class SheetsApiError extends Error {
    constructor(
      message: string,
      public status: number = 500
    ) {
      super(message);
      this.name = "SheetsApiError";
    }
  },
}));

// Suppress console.log in tests
if (process.env.NODE_ENV === "test") {
  // Vitest環境下で安全にconsole出力を抑制
  // Narrow console methods safely: use unknown then assert to function type
  (console.log as unknown as (...args: unknown[]) => void) = () => {};
  (console.info as unknown as (...args: unknown[]) => void) = () => {};
}
