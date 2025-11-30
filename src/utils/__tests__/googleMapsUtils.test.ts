/**
 * @fileoverview Google Maps ユーティリティのテスト
 * googleMapsUtils.ts の単体テスト
 */

import type { LatLngLiteral } from "@/types";
import { describe, expect, it } from "vitest";
import {
  extractPlaceIdFromUrl,
  generateGoogleMapsEmbedUrl,
  generateGoogleMapsUrl,
  generateMobileGoogleMapsUrl,
  generatePhoneUrl,
  generatePlaceUrl,
  generateRouteUrl,
  isValidUrl,
  normalizeWebsiteUrl,
} from "../googleMapsUtils";

describe("googleMapsUtils", () => {
  const mockCoordinates: LatLngLiteral = {
    lat: 38.0,
    lng: 138.5,
  };

  describe("generateGoogleMapsUrl", () => {
    it("基本的な検索URLを生成すること", () => {
      const url = generateGoogleMapsUrl("テストレストラン", mockCoordinates);

      expect(url).toContain("https://www.google.com/maps/search/");
      expect(url).toContain("38");
      expect(url).toContain("138.5");
    });

    it("placeIdがある場合はplace URLを生成すること", () => {
      const url = generateGoogleMapsUrl("テストレストラン", mockCoordinates, {
        placeId: "ChIJtest123",
      });

      expect(url).toContain("place_id:ChIJtest123");
    });

    it("directions モードでURLを生成すること", () => {
      const url = generateGoogleMapsUrl("テストレストラン", mockCoordinates, {
        mode: "directions",
      });

      expect(url).toContain("https://www.google.com/maps/dir/");
      expect(url).toContain("destination=38,138.5");
    });

    it("streetview モードでURLを生成すること", () => {
      const url = generateGoogleMapsUrl("テストレストラン", mockCoordinates, {
        mode: "streetview",
      });

      expect(url).toContain("map_action=pano");
      expect(url).toContain("viewpoint=38,138.5");
    });

    it("カスタムズームレベルを指定できること", () => {
      const url = generateGoogleMapsUrl("テストレストラン", mockCoordinates, {
        zoom: 20,
      });

      expect(url).toContain("20z");
    });
  });

  describe("generateMobileGoogleMapsUrl", () => {
    it("モバイル用のGoogle Maps URLを生成すること", () => {
      const result = generateMobileGoogleMapsUrl(mockCoordinates, {
        query: "テストレストラン",
      });

      expect(result).toHaveProperty("ios");
      expect(result).toHaveProperty("android");
      expect(result).toHaveProperty("fallback");
      expect(result.ios).toContain("comgooglemaps");
      expect(result.ios).toContain("38");
      expect(result.ios).toContain("138.5");
    });

    it("navigate モードでURLを生成できること", () => {
      const result = generateMobileGoogleMapsUrl(mockCoordinates, {
        mode: "navigate",
      });

      expect(result.ios).toContain("comgooglemaps");
      expect(result.ios).toContain("daddr");
      expect(result.android).toContain("google.navigation");
    });

    it("search モードでURLを生成できること", () => {
      const result = generateMobileGoogleMapsUrl(mockCoordinates, {
        mode: "search",
        query: "テストレストラン",
      });

      expect(result.ios).toContain("q=");
      expect(result.android).toContain("geo:0,0");
    });
  });

  describe("generatePhoneUrl", () => {
    it("電話番号からtel:URLを生成すること", () => {
      const url = generatePhoneUrl("025-123-4567");

      expect(url).toBe("tel:0251234567");
    });

    it("ハイフンを除去すること", () => {
      const url = generatePhoneUrl("090-1234-5678");

      expect(url).toBe("tel:09012345678");
    });

    it("括弧を除去すること", () => {
      const url = generatePhoneUrl("(025)123-4567");

      expect(url).toBe("tel:0251234567");
    });

    it("スペースを除去すること", () => {
      const url = generatePhoneUrl("025 123 4567");

      expect(url).toBe("tel:0251234567");
    });

    it("空文字の場合空のtel:URLを返すこと", () => {
      const url = generatePhoneUrl("");

      expect(url).toBe("tel:");
    });
  });

  describe("normalizeWebsiteUrl", () => {
    it("http://から始まるURLをそのまま返すこと", () => {
      const url = normalizeWebsiteUrl("http://example.com");

      expect(url).toBe("http://example.com");
    });

    it("https://から始まるURLをそのまま返すこと", () => {
      const url = normalizeWebsiteUrl("https://example.com");

      expect(url).toBe("https://example.com");
    });

    it("プロトコルがない場合https://を追加すること", () => {
      const url = normalizeWebsiteUrl("example.com");

      expect(url).toBe("https://example.com");
    });

    it("www.から始まるURLにhttps://を追加すること", () => {
      const url = normalizeWebsiteUrl("www.example.com");

      expect(url).toBe("https://www.example.com");
    });

    it("空文字の場合空文字を返すこと", () => {
      const url = normalizeWebsiteUrl("");

      expect(url).toBe("");
    });

    it("既に正しいURLは変更しないこと", () => {
      const url = normalizeWebsiteUrl("https://www.example.com/path?query=1");

      expect(url).toBe("https://www.example.com/path?query=1");
    });
  });

  describe("generateGoogleMapsEmbedUrl", () => {
    it("基本的なplace埋め込みURLを生成すること", () => {
      const url = generateGoogleMapsEmbedUrl(mockCoordinates);

      expect(url).toContain("https://www.google.com/maps/embed/v1/place");
      expect(url).toContain("zoom=15");
    });

    it("APIキーを含むURLを生成すること", () => {
      const url = generateGoogleMapsEmbedUrl(mockCoordinates, {
        apiKey: "test_api_key_123",
      });

      expect(url).toContain("key=test_api_key_123");
    });

    it("カスタムズームレベルを指定できること", () => {
      const url = generateGoogleMapsEmbedUrl(mockCoordinates, {
        zoom: 20,
      });

      expect(url).toContain("zoom=20");
    });

    it("viewモードでURLを生成すること", () => {
      const url = generateGoogleMapsEmbedUrl(mockCoordinates, {
        mode: "view",
      });

      expect(url).toContain("/view?");
      expect(url).toContain("center=38%2C138.5");
    });

    it("directionsモードでURLを生成すること", () => {
      const url = generateGoogleMapsEmbedUrl(mockCoordinates, {
        mode: "directions",
      });

      expect(url).toContain("/directions?");
      expect(url).toContain("destination=38%2C138.5");
    });

    it("searchモードでURLを生成すること", () => {
      const url = generateGoogleMapsEmbedUrl(mockCoordinates, {
        mode: "search",
        query: "テストレストラン",
      });

      expect(url).toContain("/search?");
      expect(url).toContain("q=");
    });

    it("queryパラメータが指定された場合に使用すること", () => {
      const url = generateGoogleMapsEmbedUrl(mockCoordinates, {
        mode: "place",
        query: "カスタムクエリ",
      });

      expect(url).toContain(
        "q=%E3%82%AB%E3%82%B9%E3%82%BF%E3%83%A0%E3%82%AF%E3%82%A8%E3%83%AA"
      );
    });

    it("queryがない場合は座標を使用すること", () => {
      const url = generateGoogleMapsEmbedUrl(mockCoordinates, {
        mode: "place",
      });

      expect(url).toContain("q=38%2C138.5");
    });
  });

  describe("generateRouteUrl", () => {
    it("基本的なルート案内URLを生成すること", () => {
      const url = generateRouteUrl(mockCoordinates);

      expect(url).toContain("https://www.google.com/maps/dir/");
      expect(url).toContain("api=1");
      expect(url).toContain("destination=38%2C138.5");
      expect(url).toContain("travelmode=driving");
    });

    it("出発地を指定できること", () => {
      const origin: LatLngLiteral = { lat: 37.5, lng: 137.0 };
      const url = generateRouteUrl(mockCoordinates, { origin });

      expect(url).toContain("origin=37.5%2C137");
      expect(url).toContain("destination=38%2C138.5");
    });

    it("移動手段を指定できること", () => {
      const url = generateRouteUrl(mockCoordinates, {
        mode: "walking",
      });

      expect(url).toContain("travelmode=walking");
    });

    it("transitモードでURLを生成すること", () => {
      const url = generateRouteUrl(mockCoordinates, {
        mode: "transit",
      });

      expect(url).toContain("travelmode=transit");
    });

    it("bicyclingモードでURLを生成すること", () => {
      const url = generateRouteUrl(mockCoordinates, {
        mode: "bicycling",
      });

      expect(url).toContain("travelmode=bicycling");
    });

    it("有料道路回避オプションを設定できること", () => {
      const url = generateRouteUrl(mockCoordinates, {
        avoidTolls: true,
      });

      expect(url).toContain("avoid=tolls");
    });

    it("高速道路回避オプションを設定できること", () => {
      const url = generateRouteUrl(mockCoordinates, {
        avoidHighways: true,
      });

      expect(url).toContain("avoid=highways");
    });

    it("有料道路と高速道路の両方を回避できること", () => {
      const url = generateRouteUrl(mockCoordinates, {
        avoidTolls: true,
        avoidHighways: true,
      });

      expect(url).toContain("avoid=tolls");
      expect(url).toContain("highways");
    });

    it("すべてのオプションを組み合わせられること", () => {
      const origin: LatLngLiteral = { lat: 37.5, lng: 137.0 };
      const url = generateRouteUrl(mockCoordinates, {
        origin,
        mode: "driving",
        avoidTolls: true,
        avoidHighways: true,
      });

      expect(url).toContain("origin=37.5%2C137");
      expect(url).toContain("destination=38%2C138.5");
      expect(url).toContain("travelmode=driving");
      expect(url).toContain("avoid=");
    });
  });

  describe("generatePlaceUrl", () => {
    it("基本的なPlace URLを生成すること", () => {
      const url = generatePlaceUrl("ChIJtest123");

      expect(url).toContain("https://www.google.com/maps/place/");
      expect(url).toContain("place_id=ChIJtest123");
    });

    it("detailsモードでURLを生成すること", () => {
      const url = generatePlaceUrl("ChIJtest123", {
        mode: "details",
      });

      expect(url).toContain("place_id=ChIJtest123");
      expect(url).not.toContain("tab=");
    });

    it("reviewsモードでURLを生成すること", () => {
      const url = generatePlaceUrl("ChIJtest123", {
        mode: "reviews",
      });

      expect(url).toContain("place_id=ChIJtest123");
      expect(url).toContain("tab=reviews");
    });

    it("photosモードでURLを生成すること", () => {
      const url = generatePlaceUrl("ChIJtest123", {
        mode: "photos",
      });

      expect(url).toContain("place_id=ChIJtest123");
      expect(url).toContain("tab=photos");
    });

    it("Place IDに特殊文字が含まれていても正しくエンコードすること", () => {
      const url = generatePlaceUrl("ChIJ_test+special/chars");

      expect(url).toContain("place_id=");
      expect(url).toContain("ChIJ_test");
    });
  });

  describe("isValidUrl", () => {
    it("有効なHTTP URLをtrueと判定すること", () => {
      expect(isValidUrl("http://example.com")).toBe(true);
    });

    it("有効なHTTPS URLをtrueと判定すること", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
    });

    it("パスとクエリを含むURLをtrueと判定すること", () => {
      expect(isValidUrl("https://example.com/path?query=value")).toBe(true);
    });

    it("フラグメントを含むURLをtrueと判定すること", () => {
      expect(isValidUrl("https://example.com/path#section")).toBe(true);
    });

    it("プロトコルがないURLをfalseと判定すること", () => {
      expect(isValidUrl("example.com")).toBe(false);
    });

    it("無効なURLをfalseと判定すること", () => {
      expect(isValidUrl("not a url")).toBe(false);
    });

    it("空文字列をfalseと判定すること", () => {
      expect(isValidUrl("")).toBe(false);
    });

    it("特殊なプロトコルのURLをtrueと判定すること", () => {
      expect(isValidUrl("ftp://example.com")).toBe(true);
    });

    it("localhostのURLをtrueと判定すること", () => {
      expect(isValidUrl("http://localhost:3000")).toBe(true);
    });

    it("IPアドレスのURLをtrueと判定すること", () => {
      expect(isValidUrl("http://192.168.1.1")).toBe(true);
    });
  });

  describe("extractPlaceIdFromUrl", () => {
    it("place_idパラメータからPlace IDを抽出すること", () => {
      const url = "https://www.google.com/maps/place/?place_id=ChIJtest123";
      const placeId = extractPlaceIdFromUrl(url);

      expect(placeId).toBe("ChIJtest123");
    });

    it("パスからPlace IDを抽出すること", () => {
      const url =
        "https://www.google.com/maps/place/Tokyo/something/ChIJ51cu8IcbXWAR_W_a_0q6VDI";
      const placeId = extractPlaceIdFromUrl(url);

      expect(placeId).toBe("ChIJ51cu8IcbXWAR_W_a_0q6VDI");
    });

    it("複数のパラメータがある場合でも抽出できること", () => {
      const url =
        "https://www.google.com/maps/place/?q=Tokyo&place_id=ChIJtest456&zoom=15";
      const placeId = extractPlaceIdFromUrl(url);

      expect(placeId).toBe("ChIJtest456");
    });

    it("Place IDがない場合はnullを返すこと", () => {
      const url = "https://www.google.com/maps/search/Tokyo";
      const placeId = extractPlaceIdFromUrl(url);

      expect(placeId).toBeNull();
    });

    it("無効なURLの場合はnullを返すこと", () => {
      const placeId = extractPlaceIdFromUrl("not a url");

      expect(placeId).toBeNull();
    });

    it("空文字列の場合はnullを返すこと", () => {
      const placeId = extractPlaceIdFromUrl("");

      expect(placeId).toBeNull();
    });

    it("Google Maps以外のURLの場合はnullを返すこと", () => {
      const placeId = extractPlaceIdFromUrl("https://example.com");

      expect(placeId).toBeNull();
    });
  });
});
