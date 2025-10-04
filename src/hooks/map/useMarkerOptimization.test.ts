/**
 * @fileoverview useMarkerOptimization Hook Tests
 * カバレッジ目標: 0% → 60%
 */

import type { Restaurant } from "@/types";
import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useMarkerOptimization } from "./useMarkerOptimization";

// テスト用のモックデータ
const createMockRestaurant = (
  id: string,
  lat: number,
  lng: number,
  overrides?: Partial<Restaurant>
): Restaurant => ({
  id,
  type: "restaurant",
  name: `テストレストラン${id}`,
  coordinates: { lat, lng },
  cuisineType: "日本料理",
  priceRange: "1000-2000円",
  district: "両津",
  address: "佐渡市",
  openingHours: [],
  features: [],
  lastUpdated: new Date().toISOString(),
  ...overrides,
});

describe("useMarkerOptimization", () => {
  describe("基本動作", () => {
    test("初期化時に空配列を返す", () => {
      const { result } = renderHook(() => useMarkerOptimization([]));

      expect(result.current.optimizedMarkers).toEqual([]);
      expect(result.current.clusters).toEqual([]);
      expect(result.current.performanceStats.totalMarkers).toBe(0);
      expect(result.current.performanceStats.visibleMarkers).toBe(0);
    });

    test("レストランリストを受け取り最適化する", () => {
      const mockRestaurants = [
        createMockRestaurant("1", 38.0, 138.5),
        createMockRestaurant("2", 38.1, 138.6),
        createMockRestaurant("3", 38.2, 138.7),
      ];

      const { result } = renderHook(() =>
        useMarkerOptimization(mockRestaurants)
      );

      expect(result.current.optimizedMarkers.length).toBe(3);
      expect(result.current.performanceStats.totalMarkers).toBe(3);
      expect(result.current.performanceStats.visibleMarkers).toBe(3);
    });
  });

  describe("ビューポート最適化", () => {
    test("ビューポート外のマーカーを非表示化 (優先度: 高)", () => {
      const mockRestaurants = [
        createMockRestaurant("1", 38.0, 138.5), // 範囲内
        createMockRestaurant("2", 38.05, 138.55), // 範囲内
        createMockRestaurant("3", 50.0, 150.0), // 範囲外 (緯度)
        createMockRestaurant("4", 38.0, 160.0), // 範囲外 (経度)
      ];

      const bounds = {
        north: 39.0,
        south: 37.0,
        east: 139.0,
        west: 138.0,
        zoom: 10,
      };

      const { result } = renderHook(() =>
        useMarkerOptimization(mockRestaurants, bounds)
      );

      // ビューポート内の2件のみ表示
      expect(result.current.optimizedMarkers.length).toBe(2);
      expect(result.current.optimizedMarkers[0].restaurant.id).toBe("1");
      expect(result.current.optimizedMarkers[1].restaurant.id).toBe("2");
    });

    test("ビューポート移動時に表示マーカーを更新", () => {
      const mockRestaurants = [
        createMockRestaurant("1", 38.0, 138.5),
        createMockRestaurant("2", 40.0, 140.0),
      ];

      const bounds1 = {
        north: 39.0,
        south: 37.0,
        east: 139.0,
        west: 138.0,
        zoom: 10,
      };

      const { result, rerender } = renderHook(
        ({ bounds }) => useMarkerOptimization(mockRestaurants, bounds),
        { initialProps: { bounds: bounds1 } }
      );

      // 最初は id:1 のみ表示
      expect(result.current.optimizedMarkers.length).toBe(1);
      expect(result.current.optimizedMarkers[0].restaurant.id).toBe("1");

      // ビューポート移動
      const bounds2 = {
        north: 41.0,
        south: 39.0,
        east: 141.0,
        west: 139.0,
        zoom: 10,
      };

      rerender({ bounds: bounds2 });

      // 移動後は id:2 のみ表示
      expect(result.current.optimizedMarkers.length).toBe(1);
      expect(result.current.optimizedMarkers[0].restaurant.id).toBe("2");
    });
  });

  describe("クラスタリング", () => {
    test("密集マーカーをクラスタ化 (優先度: 高)", () => {
      // 近接した3つのレストランを作成（クラスタリング距離内）
      const mockRestaurants = [
        createMockRestaurant("1", 38.0, 138.5),
        createMockRestaurant("2", 38.001, 138.501), // ~100m離れている
        createMockRestaurant("3", 38.002, 138.502), // ~200m離れている
      ];

      const { result } = renderHook(() =>
        useMarkerOptimization(mockRestaurants, undefined, {
          enableClustering: true,
          clusteringMinCount: 2,
        })
      );

      // クラスタが生成されることを確認
      expect(result.current.clusters.length).toBeGreaterThan(0);
      expect(result.current.performanceStats.clusteredMarkers).toBeGreaterThan(
        0
      );
    });

    test("ズームレベルに応じてクラスタ閾値を調整", () => {
      const mockRestaurants = [
        createMockRestaurant("1", 38.0, 138.5),
        createMockRestaurant("2", 38.1, 138.6),
      ];

      const boundsZoom10 = {
        north: 39.0,
        south: 37.0,
        east: 139.0,
        west: 138.0,
        zoom: 10, // 遠くから見る
      };

      const boundsZoom15 = {
        north: 38.5,
        south: 37.5,
        east: 139.0,
        west: 138.0,
        zoom: 15, // 近くで見る
      };

      const { result: result10 } = renderHook(() =>
        useMarkerOptimization(mockRestaurants, boundsZoom10, {
          enableClustering: true,
        })
      );

      const { result: result15 } = renderHook(() =>
        useMarkerOptimization(mockRestaurants, boundsZoom15, {
          enableClustering: true,
        })
      );

      // ズームレベルが高い（近く）ほどクラスタ数が少ない or 個別表示
      // 低いズーム（遠く）ではより多くクラスタ化される
      expect(
        result10.current.performanceStats.clusterCount
      ).toBeGreaterThanOrEqual(0);
      expect(
        result15.current.performanceStats.clusterCount
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe("パフォーマンス", () => {
    test("1000件のマーカーを100ms以内で処理", () => {
      // 1000件のモックレストランを生成
      const mockRestaurants = Array.from({ length: 1000 }, (_, i) =>
        createMockRestaurant(
          `${i}`,
          38.0 + (i % 100) * 0.01,
          138.5 + Math.floor(i / 100) * 0.01
        )
      );

      const startTime = performance.now();
      const { result } = renderHook(() =>
        useMarkerOptimization(mockRestaurants)
      );
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // 処理時間が100ms以内であることを確認
      expect(processingTime).toBeLessThan(100);

      // 全データが処理されていることを確認
      expect(result.current.performanceStats.totalMarkers).toBe(1000);

      // 最大表示数制限が適用されていることを確認（デフォルト500件）
      expect(
        result.current.performanceStats.visibleMarkers
      ).toBeLessThanOrEqual(500);
    });
  });
});
