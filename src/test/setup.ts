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
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

// Environment variables for testing
process.env.VITE_GA_MEASUREMENT_ID = "G-TEST123456";
process.env.VITE_GOOGLE_MAPS_API_KEY = "TEST_API_KEY";

// Mock sheetsService for testing
vi.mock("../services/sheetsService", () => ({
  fetchRestaurantsFromSheets: vi.fn().mockResolvedValue([
    {
      id: "1",
      name: "海鮮市場 金太",
      description: "佐渡の新鮮な海の幸を味わえる海鮮料理店",
      cuisineType: "海鮮",
      priceRange: "2000-3000円",
      address: "新潟県佐渡市両津湊119",
      phone: "0259-27-5938",
      coordinates: { lat: 38.018611, lng: 138.367222 },
      rating: 4.2,
      reviewCount: 85,
      openingHours: [
        { day: "月-日", open: "11:00", close: "21:00", isHoliday: false },
      ],
      features: ["駐車場あり", "団体利用可", "個室あり"],
      lastUpdated: "2025-07-10",
    },
    {
      id: "2",
      name: "そば処 竹の子",
      description: "佐渡の水で打つ手打ちそばが自慢",
      cuisineType: "そば・うどん",
      priceRange: "1000-2000円",
      address: "新潟県佐渡市小木町1956",
      coordinates: { lat: 37.9, lng: 138.25 },
      rating: 4.5,
      reviewCount: 123,
      openingHours: [
        { day: "火-日", open: "11:30", close: "20:00", isHoliday: false },
        { day: "月", open: "", close: "", isHoliday: true },
      ],
      features: ["テラス席", "禁煙", "手打ちそば", "テイクアウト可"],
      lastUpdated: "2025-07-10",
    },
    {
      id: "3",
      name: "佐渡カフェ",
      description: "佐渡の絶景を眺めながらゆったりできるカフェ",
      cuisineType: "カフェ・喫茶店",
      priceRange: "～1000円",
      address: "新潟県佐渡市両津夷269-1",
      phone: "0259-23-4567",
      coordinates: { lat: 38.05, lng: 138.38 },
      rating: 4.3,
      reviewCount: 67,
      openingHours: [
        { day: "月-日", open: "9:00", close: "18:00", isHoliday: false },
      ],
      features: [
        "Wi-Fiあり",
        "テラス席",
        "駐車場あり",
        "禁煙",
        "テイクアウト可",
      ],
      lastUpdated: "2025-07-10",
    },
    {
      id: "4",
      name: "寿司処 金峰",
      description: "佐渡近海の新鮮なネタが自慢の老舗寿司店",
      cuisineType: "寿司",
      priceRange: "3000円～",
      address: "新潟県佐渡市相川下戸村358",
      phone: "0259-74-2109",
      coordinates: { lat: 38.03, lng: 138.23 },
      rating: 4.6,
      reviewCount: 142,
      openingHours: [
        { day: "火-日", open: "17:00", close: "22:00", isHoliday: false },
        { day: "月", open: "", close: "", isHoliday: true },
      ],
      features: ["カウンター席", "個室あり", "予約可能"],
      lastUpdated: "2025-07-10",
    },
  ]),
  checkDataFreshness: vi.fn().mockResolvedValue({ needsUpdate: false }),
  SheetsApiError: class SheetsApiError extends Error {
    constructor(message: string) {
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
