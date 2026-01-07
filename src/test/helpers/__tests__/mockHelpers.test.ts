/* @vitest-environment jsdom */
/**
 * @fileoverview mockHelpers のテスト
 */

import { describe, expect, it } from "vitest";
import {
  clearMockLocalStorage,
  createMockFilterHandlers,
  createMockFilters,
  createMockGoogleMap,
  createMockGoogleMarker,
  createMockMapPoint,
  createMockRestaurant,
  getGoogleMapsApiMock,
} from "../mockHelpers";

describe("mockHelpers", () => {
  describe("createMockFilters", () => {
    it("デフォルトのフィルターを作成する", () => {
      const filters = createMockFilters();

      expect(filters).toEqual({
        cuisineTypes: [],
        priceRanges: [],
        districts: [],
        features: [],
        searchQuery: "",
        openNow: false,
        pointTypes: ["restaurant", "parking", "toilet"],
      });
    });

    it("プロパティを上書きできる", () => {
      const filters = createMockFilters({
        openNow: true,
        cuisineTypes: ["日本料理"],
        searchQuery: "テスト",
      });

      expect(filters.openNow).toBe(true);
      expect(filters.cuisineTypes).toEqual(["日本料理"]);
      expect(filters.searchQuery).toBe("テスト");
      expect(filters.districts).toEqual([]); // 上書きされていないプロパティ
    });
  });

  describe("createMockRestaurant", () => {
    it("デフォルトのレストランを作成する", () => {
      const restaurant = createMockRestaurant();

      expect(restaurant).toMatchObject({
        id: "test-restaurant-1",
        type: "restaurant",
        name: "テストレストラン",
        cuisineType: "日本料理",
        priceRange: "1000-2000円",
        district: "両津",
        coordinates: { lat: 38.0, lng: 138.5 },
      });
    });

    it("プロパティを上書きできる", () => {
      const restaurant = createMockRestaurant({
        name: "カスタム店",
        cuisineType: "イタリアン",
        coordinates: { lat: 37.5, lng: 138.5 },
      });

      expect(restaurant.name).toBe("カスタム店");
      expect(restaurant.cuisineType).toBe("イタリアン");
      expect(restaurant.coordinates.lat).toBe(37.5);
      expect(restaurant.priceRange).toBe("1000-2000円"); // 上書きされていない
    });
  });

  describe("createMockMapPoint", () => {
    it("デフォルトのマップポイントを作成する", () => {
      const point = createMockMapPoint();

      expect(point).toMatchObject({
        id: "test-point-1",
        type: "restaurant",
        name: "テストポイント",
        coordinates: { lat: 38.0, lng: 138.5 },
      });
    });

    it("タイプを指定できる", () => {
      const parking = createMockMapPoint({ type: "parking" });
      const toilet = createMockMapPoint({ type: "toilet" });

      expect(parking.type).toBe("parking");
      expect(toilet.type).toBe("toilet");
    });
  });

  describe("createMockFilterHandlers", () => {
    it("モックハンドラーを作成する", () => {
      const handlers = createMockFilterHandlers();

      expect(handlers.mockUpdateFilters).toBeDefined();
      expect(handlers.mockOnError).toBeDefined();
      expect(handlers.mockResetFilters).toBeDefined();

      // vi.fn() として動作する
      handlers.mockUpdateFilters({ openNow: true });
      expect(handlers.mockUpdateFilters).toHaveBeenCalledWith({
        openNow: true,
      });
    });
  });

  describe("getGoogleMapsApiMock", () => {
    it("グローバルモックを取得する", () => {
      const mapsApi = getGoogleMapsApiMock();

      // setup.ts で設定されたモック
      expect(mapsApi).toBeDefined();
      expect(mapsApi?.MapTypeId).toBeDefined();
      expect(mapsApi?.Map).toBeDefined();
      expect(mapsApi?.Marker).toBeDefined();
    });
  });

  describe("createMockGoogleMap", () => {
    it("Map インスタンスのモックを作成する", () => {
      const map = createMockGoogleMap();

      expect(map.setCenter).toBeDefined();
      expect(map.setZoom).toBeDefined();
      expect(map.addListener).toBeDefined();

      // vi.fn() として動作する
      map.setCenter({ lat: 38.0, lng: 138.5 });
      expect(map.setCenter).toHaveBeenCalledWith({ lat: 38.0, lng: 138.5 });
    });

    it("getCenter/getZoom が動作する", () => {
      const map = createMockGoogleMap();

      const center = map.getCenter();
      expect(center.lat()).toBe(38.0);
      expect(center.lng()).toBe(138.5);

      const zoom = map.getZoom();
      expect(zoom).toBe(10);
    });
  });

  describe("createMockGoogleMarker", () => {
    it("Marker インスタンスのモックを作成する", () => {
      const marker = createMockGoogleMarker();

      expect(marker.setPosition).toBeDefined();
      expect(marker.setMap).toBeDefined();
      expect(marker.addListener).toBeDefined();

      // vi.fn() として動作する
      marker.setPosition({ lat: 38.0, lng: 138.5 });
      expect(marker.setPosition).toHaveBeenCalledWith({
        lat: 38.0,
        lng: 138.5,
      });
    });
  });

  describe("clearMockLocalStorage", () => {
    it("localStorage をクリアする", () => {
      // データを設定
      window.localStorage.setItem("test-key", "test-value");
      expect(window.localStorage.getItem("test-key")).toBe("test-value");

      // クリア
      clearMockLocalStorage();

      // クリアされている
      expect(window.localStorage.getItem("test-key")).toBeNull();
      expect(window.localStorage.length).toBe(0);
    });
  });
});
