/**
 * @fileoverview markerColorUtils tests
 *
 * Coverage target: 36 lines, 94.44% → 100% (+0.05%)
 */

import type { MapPoint, Parking, Restaurant, Toilet } from "@/types";
import { describe, expect, it } from "vitest";
import { getMarkerColor } from "../markerColorUtils";

describe("getMarkerColor", () => {
  it("駐車場ポイントは#546E7Aを返すこと", () => {
    const parking: Parking = {
      id: "p1",
      type: "parking",
      name: "Test Parking",
      district: "両津",
      address: "新潟県佐渡市",
      coordinates: { lat: 38.0, lng: 138.0 },
      capacity: 20,
      fee: "無料",
      features: [],
      lastUpdated: "2024-01-01",
    };

    expect(getMarkerColor(parking)).toBe("#546E7A");
  });

  it("トイレポイントは#2196F3を返すこと", () => {
    const toilet: Toilet = {
      id: "t1",
      type: "toilet",
      name: "Test Toilet",
      district: "両津",
      address: "新潟県佐渡市",
      coordinates: { lat: 38.0, lng: 138.0 },
      features: [],
      lastUpdated: "2024-01-01",
    };

    expect(getMarkerColor(toilet)).toBe("#2196F3");
  });

  it("和食レストランはjapaneseカテゴリ色#E53E3Eを返すこと", () => {
    const restaurant: Restaurant = {
      id: "r1",
      type: "restaurant",
      name: "Test Restaurant",
      cuisineType: "日本料理", // CuisineType準拠
      priceRange: "1000-2000円",
      district: "両津",
      address: "新潟県佐渡市",
      coordinates: { lat: 38.0, lng: 138.0 },
      openingHours: [],
      features: [],
      lastUpdated: "2024-01-01",
    };

    expect(getMarkerColor(restaurant)).toBe("#E53E3E");
  });

  it("cuisineTypeがundefinedの場合はgeneral色#00A693を返すこと", () => {
    const restaurant = {
      id: "r2",
      type: "restaurant" as const,
      name: "Test Restaurant",
      cuisineType: undefined as unknown as string, // Force undefined for testing
      priceRange: "1000-2000円",
      district: "両津",
      address: "新潟県佐渡市",
      coordinates: { lat: 38.0, lng: 138.0 },
      openingHours: [],
      features: [],
      lastUpdated: "2024-01-01",
    } as Restaurant;

    expect(getMarkerColor(restaurant)).toBe("#00A693");
  });

  it("未定義のcuisineTypeでもgeneral色#00A693を返すこと", () => {
    const restaurant = {
      id: "r3",
      type: "restaurant" as const,
      name: "Test Restaurant",
      cuisineType: "unknown-type", // Invalid CuisineType for testing
      priceRange: "1000-2000円",
      district: "両津",
      address: "新潟県佐渡市",
      coordinates: { lat: 38.0, lng: 138.0 },
      openingHours: [],
      features: [],
      lastUpdated: "2024-01-01",
    } as unknown as Restaurant;

    expect(getMarkerColor(restaurant)).toBe("#00A693");
  });

  it("不正なtype値でもフォールバックgeneral色#00A693を返すこと", () => {
    const invalidPoint = {
      id: "invalid",
      type: "unknown",
      name: "Invalid Point",
      district: "両津",
      address: "新潟県佐渡市",
      coordinates: { lat: 38.0, lng: 138.0 },
      lastUpdated: "2024-01-01",
    } as unknown as MapPoint;

    expect(getMarkerColor(invalidPoint)).toBe("#00A693");
  });
});
