/**
 * @fileoverview Google Maps ユーティリティのテスト
 * googleMapsUtils.ts の単体テスト
 */

import type { LatLngLiteral } from "@/types";
import { describe, expect, it } from "vitest";
import {
  generateGoogleMapsUrl,
  generateMobileGoogleMapsUrl,
  generatePhoneUrl,
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
});
