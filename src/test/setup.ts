import "@testing-library/jest-dom";

// Google Maps API の型安全なモック実装
// テスト環境専用: 本番コードでは実際のGoogle Maps APIを使用
interface MockGoogleMaps {
  maps: {
    MapTypeId: Record<string, string>;
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
  },
};

// 型安全なグローバル変数設定
Object.defineProperty(globalThis, "google", {
  value: mockGoogle,
  configurable: true,
  enumerable: true,
});

// Environment variables for testing
process.env.VITE_GA_MEASUREMENT_ID = "G-TEST123456";
process.env.VITE_GOOGLE_MAPS_API_KEY = "TEST_API_KEY";

// Suppress console.log in tests
if (process.env.NODE_ENV === "test") {
  // Vitest環境下で安全にconsole出力を抑制
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (console.log as any) = () => {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (console.info as any) = () => {};
}
