import "@testing-library/jest-dom";
import { vi } from "vitest";
import { configure } from "@testing-library/react";

// React Testing Library の設定
// 非同期更新の自動 act() ラッピングを有効化
configure({
  // 非同期更新を自動的にact()でラップ
  asyncUtilTimeout: 2000,
  // React 19 Concurrent Features対応
  reactStrictMode: true,
});

// Act warning の抑制（開発時のみ）
// 本番環境では React DevTools が適切に警告を表示
if (process.env.NODE_ENV === "test") {
  // React Testing Library による自動 act() 処理を信頼
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: An update to") &&
      args[0].includes("was not wrapped in act")
    ) {
      // act() 警告をテスト環境でのみ抑制
      return;
    }
    originalError.call(console, ...args);
  };
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
    LatLng: vi.fn().mockImplementation((lat, lng) => ({ lat, lng })),
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

// Environment variables for testing
process.env.VITE_GA_MEASUREMENT_ID = "G-TEST123456";
process.env.VITE_GOOGLE_MAPS_API_KEY = "TEST_API_KEY";

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
    constructor(message: string, public status: number = 500) {
      super(message);
      this.name = "SheetsApiError";
    }
  },
}));

// Suppress console.log in tests
if (process.env.NODE_ENV === "test") {
  // Vitest環境下で安全にconsole出力を抑制
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (console.log as any) = () => {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (console.info as any) = () => {};
}
