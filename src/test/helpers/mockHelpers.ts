/**
 * @fileoverview テストモックヘルパー
 * 共通のモックオブジェクトとファクトリ関数
 */

import type {
  CuisineType,
  ExtendedMapFilters,
  MapPoint,
  PriceRange,
  Restaurant,
  SadoDistrict,
} from "@/types";
import { vi } from "vitest";

/**
 * デフォルトのマップフィルターを作成
 *
 * @example
 * ```typescript
 * const filters = createMockFilters({ openNow: true });
 * ```
 *
 * @param overrides 上書きするプロパティ
 * @returns モックフィルター
 */
export function createMockFilters(
  overrides: Partial<ExtendedMapFilters> = {}
): ExtendedMapFilters {
  return {
    cuisineTypes: [],
    priceRanges: [],
    districts: [],
    features: [],
    searchQuery: "",
    openNow: false,
    pointTypes: ["restaurant", "parking", "toilet"],
    ...overrides,
  };
}

/**
 * モックレストランデータを作成
 *
 * @example
 * ```typescript
 * const restaurant = createMockRestaurant({ name: "テスト店" });
 * ```
 *
 * @param overrides 上書きするプロパティ
 * @returns モックレストラン
 */
export function createMockRestaurant(
  overrides: Partial<Restaurant> = {}
): Restaurant {
  return {
    id: "test-restaurant-1",
    type: "restaurant" as const,
    name: "テストレストラン",
    cuisineType: "日本料理" as CuisineType,
    priceRange: "1000-2000円" as PriceRange,
    district: "両津" as SadoDistrict,
    address: "新潟県佐渡市両津地区",
    coordinates: { lat: 38.0, lng: 138.5 },
    features: ["駐車場", "Wi-Fi"],
    phone: "0259-00-0000",
    openingHours: [
      {
        day: "月曜日",
        open: "11:00",
        close: "20:00",
        isHoliday: false,
      },
    ],
    website: "https://example.com",
    images: ["https://example.com/image.jpg"],
    description: "テスト用レストランの説明",
    lastUpdated: "2024-01-01",
    ...overrides,
  };
}

/**
 * モックマップポイントを作成
 *
 * @example
 * ```typescript
 * const point = createMockMapPoint({ type: "parking" });
 * ```
 *
 * @param overrides 上書きするプロパティ
 * @returns モックマップポイント
 */
export function createMockMapPoint(
  overrides: Partial<MapPoint> = {}
): MapPoint {
  const basePoint: Restaurant = {
    id: "test-point-1",
    type: "restaurant" as const,
    name: "テストポイント",
    cuisineType: "日本料理" as CuisineType,
    priceRange: "1000-2000円" as PriceRange,
    district: "両津" as SadoDistrict,
    address: "新潟県佐渡市",
    coordinates: { lat: 38.0, lng: 138.5 },
    features: [],
    openingHours: [],
    lastUpdated: "2024-01-01",
  };
  return { ...basePoint, ...overrides } as MapPoint;
}

/**
 * フィルターハンドラーのモックを作成
 *
 * @example
 * ```typescript
 * const handlers = createMockFilterHandlers();
 * handlers.mockUpdateFilters({ openNow: true });
 * expect(handlers.mockUpdateFilters).toHaveBeenCalledWith({ openNow: true });
 * ```
 *
 * @returns モックハンドラー
 */
export function createMockFilterHandlers() {
  return {
    mockUpdateFilters: vi.fn(),
    mockOnError: vi.fn(),
    mockResetFilters: vi.fn(),
  };
}

/**
 * Google Maps API モックを取得
 * setup.ts で設定されたグローバルモックを返す
 *
 * @returns Google Maps API モック
 */
export function getGoogleMapsApiMock() {
  return window.google?.maps;
}

/**
 * Google Maps Map インスタンスのモックを作成
 *
 * @example
 * ```typescript
 * const map = createMockGoogleMap();
 * map.setCenter({ lat: 38.0, lng: 138.5 });
 * expect(map.setCenter).toHaveBeenCalled();
 * ```
 *
 * @returns モック Map インスタンス
 */
export function createMockGoogleMap() {
  return {
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    addListener: vi.fn(),
    getCenter: vi.fn(() => ({ lat: () => 38.0, lng: () => 138.5 })),
    getZoom: vi.fn(() => 10),
    panTo: vi.fn(),
    fitBounds: vi.fn(),
    getBounds: vi.fn(),
  };
}

/**
 * Google Maps Marker インスタンスのモックを作成
 *
 * @example
 * ```typescript
 * const marker = createMockGoogleMarker();
 * marker.setPosition({ lat: 38.0, lng: 138.5 });
 * expect(marker.setPosition).toHaveBeenCalled();
 * ```
 *
 * @returns モック Marker インスタンス
 */
export function createMockGoogleMarker() {
  return {
    setPosition: vi.fn(),
    setMap: vi.fn(),
    addListener: vi.fn(),
    getPosition: vi.fn(() => ({ lat: () => 38.0, lng: () => 138.5 })),
    setVisible: vi.fn(),
    setIcon: vi.fn(),
    setTitle: vi.fn(),
  };
}

/**
 * localStorage モックをクリア
 * テスト間でlocalStorageの状態をリセット
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   clearMockLocalStorage();
 * });
 * ```
 */
export function clearMockLocalStorage(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
}
