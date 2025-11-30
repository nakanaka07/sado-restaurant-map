/**
 * @fileoverview markerColorUtils のテスト
 */

import type { Parking, Restaurant, Toilet } from "@/types";
import { describe, expect, it } from "vitest";
import { getMarkerColor } from "./markerColorUtils";

describe("markerColorUtils", () => {
  describe("getMarkerColor", () => {
    describe("Restaurant - Japanese category", () => {
      it("日本料理を正しく認識すること", () => {
        const restaurant: Restaurant = {
          id: "test-1",
          type: "restaurant",
          name: "テスト和食店",
          cuisineType: "日本料理",
          priceRange: "1000-2000円",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          openingHours: [],
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(restaurant);
        // "日本料理"はキーワードマップにマッチしないのでgeneral色
        expect(color).toBe("#00A693");
      });
    });

    describe("Restaurant - Noodles category", () => {
      it("ラーメンを正しく認識すること", () => {
        const restaurant: Restaurant = {
          id: "test-2",
          type: "restaurant",
          name: "ラーメン店",
          cuisineType: "ラーメン",
          priceRange: "～1000円",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          openingHours: [],
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(restaurant);
        // "ラーメン"はキーワードマップにマッチしないのでgeneral色
        expect(color).toBe("#00A693");
      });

      it("そば・うどんを正しく認識すること", () => {
        const restaurant: Restaurant = {
          id: "test-3",
          type: "restaurant",
          name: "そば屋",
          cuisineType: "そば・うどん",
          priceRange: "～1000円",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          openingHours: [],
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(restaurant);
        // "そば・うどん"はキーワードマップにマッチしないのでgeneral色
        expect(color).toBe("#00A693");
      });
    });

    describe("Restaurant - Yakiniku category", () => {
      it("焼肉・焼鳥を正しく認識すること", () => {
        const restaurant: Restaurant = {
          id: "test-4",
          type: "restaurant",
          name: "焼肉レストラン",
          cuisineType: "焼肉・焼鳥",
          priceRange: "2000-3000円",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          openingHours: [],
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(restaurant);
        expect(color).toBe("#D53F8C"); // yakiniku color
      });
    });

    describe("Restaurant - Cafe category", () => {
      it("カフェ・喫茶店を正しく認識すること", () => {
        const restaurant: Restaurant = {
          id: "test-5",
          type: "restaurant",
          name: "カフェテスト",
          cuisineType: "カフェ・喫茶店",
          priceRange: "～1000円",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          openingHours: [],
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(restaurant);
        expect(color).toBe("#FEB002"); // cafe color
      });
    });

    describe("Restaurant - Izakaya category", () => {
      it("バー・居酒屋を正しく認識すること", () => {
        const restaurant: Restaurant = {
          id: "test-6",
          type: "restaurant",
          name: "居酒屋テスト",
          cuisineType: "バー・居酒屋",
          priceRange: "2000-3000円",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          openingHours: [],
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(restaurant);
        expect(color).toBe("#DC143C"); // izakaya color
      });
    });

    describe("Restaurant - Fastfood category", () => {
      it("ファストフードを正しく認識すること", () => {
        const restaurant: Restaurant = {
          id: "test-7",
          type: "restaurant",
          name: "ファストフード店",
          cuisineType: "ファストフード",
          priceRange: "～1000円",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          openingHours: [],
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(restaurant);
        expect(color).toBe("#FF6B35"); // fastfood color
      });
    });

    describe("Restaurant - General fallback", () => {
      it("その他のカテゴリをgeneralとして扱うこと", () => {
        const restaurant: Restaurant = {
          id: "test-8",
          type: "restaurant",
          name: "テストレストラン",
          cuisineType: "その他",
          priceRange: "1000-2000円",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          openingHours: [],
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(restaurant);
        expect(color).toBe("#00A693"); // general color
      });

      it("イタリアンをgeneralとして扱うこと", () => {
        const restaurant: Restaurant = {
          id: "test-9",
          type: "restaurant",
          name: "イタリアンレストラン",
          cuisineType: "イタリアン",
          priceRange: "2000-3000円",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          openingHours: [],
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(restaurant);
        expect(color).toBe("#00A693"); // general color (not in keyword map)
      });
    });

    describe("Parking", () => {
      it("駐車場の色を返すこと", () => {
        const parking: Parking = {
          id: "parking-1",
          type: "parking",
          name: "テスト駐車場",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          capacity: 50,
          fee: "無料",
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(parking);
        expect(color).toBe("#546E7A"); // parking color
      });

      it("capacityが0の駐車場でも正しい色を返すこと", () => {
        const parking: Parking = {
          id: "parking-2",
          type: "parking",
          name: "小規模駐車場",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          capacity: 0,
          fee: "無料",
          features: [],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(parking);
        expect(color).toBe("#546E7A");
      });
    });

    describe("Toilet", () => {
      it("トイレの色を返すこと", () => {
        const toilet: Toilet = {
          id: "toilet-1",
          type: "toilet",
          name: "テストトイレ",
          district: "両津",
          address: "テスト住所",
          coordinates: { lat: 38.0, lng: 138.5 },
          features: ["バリアフリー"],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(toilet);
        expect(color).toBe("#2196F3"); // toilet color
      });

      it("バリアフリートイレの色を返すこと", () => {
        const toilet: Toilet = {
          id: "toilet-2",
          type: "toilet",
          name: "バリアフリートイレ",
          district: "相川",
          address: "テスト住所2",
          coordinates: { lat: 38.1, lng: 138.6 },
          features: ["多目的トイレ", "おむつ交換台", "車椅子対応"],
          lastUpdated: "2024-01-01",
        };

        const color = getMarkerColor(toilet);
        expect(color).toBe("#2196F3");
      });
    });
  });
});
