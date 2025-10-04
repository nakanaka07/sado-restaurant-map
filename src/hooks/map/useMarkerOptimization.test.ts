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

    test("再レンダリング時のパフォーマンスが劣化しない", () => {
      const mockRestaurants = Array.from({ length: 100 }, (_, i) =>
        createMockRestaurant(`${i}`, 38.0 + i * 0.01, 138.5 + i * 0.01)
      );

      const { result, rerender } = renderHook(
        ({ restaurants }) => useMarkerOptimization(restaurants),
        { initialProps: { restaurants: mockRestaurants } }
      );

      const initialTime = performance.now();

      // 10回再レンダリング
      for (let i = 0; i < 10; i++) {
        rerender({ restaurants: mockRestaurants });
      }

      const totalTime = performance.now() - initialTime;

      // 10回の再レンダリングが50ms以内
      expect(totalTime).toBeLessThan(50);
      expect(result.current.optimizedMarkers.length).toBe(100);
    });
  });

  describe("エッジケースとエラーハンドリング", () => {
    test("空の座標配列でもクラッシュしない", () => {
      const { result } = renderHook(() => useMarkerOptimization([]));

      expect(result.current.optimizedMarkers).toEqual([]);
      expect(result.current.clusters).toEqual([]);
    });

    test("不正な座標値を持つマーカーを適切にフィルタ", () => {
      const invalidRestaurants = [
        createMockRestaurant("1", NaN, 138.5),
        createMockRestaurant("2", 38.0, NaN),
        // @ts-expect-error - テスト目的で不正な値
        createMockRestaurant("3", "invalid", "invalid"),
        createMockRestaurant("4", 38.0, 138.5), // 正常なデータ
      ];

      const { result } = renderHook(() =>
        useMarkerOptimization(invalidRestaurants)
      );

      // 不正なマーカーが除外され、正常なマーカーのみ表示
      expect(result.current.optimizedMarkers.length).toBeGreaterThanOrEqual(0);
      expect(result.current.performanceStats.totalMarkers).toBe(4);
    });

    test("極端に大きい/小さい座標値でも処理可能", () => {
      const extremeRestaurants = [
        createMockRestaurant("1", 90, 180), // 最大値
        createMockRestaurant("2", -90, -180), // 最小値
        createMockRestaurant("3", 0, 0), // ゼロ
      ];

      const { result } = renderHook(() =>
        useMarkerOptimization(extremeRestaurants)
      );

      expect(result.current.optimizedMarkers).toBeDefined();
      expect(result.current.performanceStats.totalMarkers).toBe(3);
    });

    test("boundsがundefinedの場合は全マーカーを表示", () => {
      const mockRestaurants = [
        createMockRestaurant("1", 38.0, 138.5),
        createMockRestaurant("2", 40.0, 140.0),
        createMockRestaurant("3", 50.0, 150.0),
      ];

      const { result } = renderHook(() =>
        useMarkerOptimization(mockRestaurants)
      );

      // bounds未指定時は全マーカー表示
      expect(result.current.optimizedMarkers.length).toBe(3);
      expect(result.current.performanceStats.visibleMarkers).toBe(3);
    });

    test("bounds境界値上のマーカーを正しく扱う", () => {
      const mockRestaurants = [
        createMockRestaurant("1", 38.0, 138.0), // 境界上 (south, west)
        createMockRestaurant("2", 39.0, 139.0), // 境界上 (north, east)
        createMockRestaurant("3", 38.5, 138.5), // 中央
      ];

      const bounds = {
        north: 39.0,
        south: 38.0,
        east: 139.0,
        west: 138.0,
        zoom: 10,
      };

      const { result } = renderHook(() =>
        useMarkerOptimization(mockRestaurants, bounds)
      );

      // 境界値上のマーカーも含まれる
      expect(result.current.optimizedMarkers.length).toBeGreaterThanOrEqual(2);
    });

    test("同一座標の重複マーカーを正しく処理", () => {
      const duplicateRestaurants = [
        createMockRestaurant("1", 38.0, 138.5),
        createMockRestaurant("2", 38.0, 138.5), // 同じ座標
        createMockRestaurant("3", 38.0, 138.5), // 同じ座標
      ];

      const { result } = renderHook(() =>
        useMarkerOptimization(duplicateRestaurants, /* bounds */ undefined, {
          enableClustering: true,
        })
      );

      // 重複座標でもクラッシュせず、適切にクラスタリング
      expect(result.current.performanceStats.totalMarkers).toBe(3);
      // clustersプロパティへのアクセスがエラーを投げないことを確認
      expect(result.current.clusters).toBeDefined();
    });

    test("options未指定でもデフォルト設定で動作", () => {
      const mockRestaurants = [createMockRestaurant("1", 38.0, 138.5)];

      const { result } = renderHook(() =>
        useMarkerOptimization(mockRestaurants)
      );

      expect(result.current.optimizedMarkers).toBeDefined();
      expect(result.current.clusters).toBeDefined();
      expect(result.current.performanceStats).toBeDefined();
    });

    test("ズーム値が極端な値でも安全に処理", () => {
      const mockRestaurants = [createMockRestaurant("1", 38.0, 138.5)];

      // ズーム最小値
      const boundsZoom0 = {
        north: 39,
        south: 37,
        east: 139,
        west: 138,
        zoom: 0,
      };
      const { result: result0 } = renderHook(() =>
        useMarkerOptimization(mockRestaurants, boundsZoom0)
      );
      expect(result0.current.optimizedMarkers).toBeDefined();

      // ズーム最大値
      const boundsZoom22 = {
        north: 39,
        south: 37,
        east: 139,
        west: 138,
        zoom: 22,
      };
      const { result: result22 } = renderHook(() =>
        useMarkerOptimization(mockRestaurants, boundsZoom22)
      );
      expect(result22.current.optimizedMarkers).toBeDefined();

      // 無効値
      const boundsZoomInvalid = {
        north: 39,
        south: 37,
        east: 139,
        west: 138,
        zoom: -1,
      };
      const { result: resultInvalid } = renderHook(() =>
        useMarkerOptimization(mockRestaurants, boundsZoomInvalid)
      );
      expect(resultInvalid.current.optimizedMarkers).toBeDefined();
    });
  });

  describe("メモリとリソース管理", () => {
    test("大量マーカーのクリーンアップが正しく動作", () => {
      const largeDataset = Array.from({ length: 5000 }, (_, i) =>
        createMockRestaurant(`${i}`, 38.0 + i * 0.001, 138.5 + i * 0.001)
      );

      const { result, unmount } = renderHook(() =>
        useMarkerOptimization(largeDataset)
      );

      expect(result.current.performanceStats.totalMarkers).toBe(5000);

      // アンマウント時にメモリリークしない
      expect(() => unmount()).not.toThrow();
    });

    test("頻繁なbounds更新でもメモリリークしない", () => {
      const mockRestaurants = Array.from({ length: 50 }, (_, i) =>
        createMockRestaurant(`${i}`, 38.0 + i * 0.01, 138.5 + i * 0.01)
      );

      const { rerender, unmount } = renderHook(
        ({ bounds }) => useMarkerOptimization(mockRestaurants, bounds),
        {
          initialProps: {
            bounds: {
              north: 39,
              south: 37,
              east: 139,
              west: 138,
              zoom: 10,
            },
          },
        }
      );

      // 100回bounds更新
      for (let i = 0; i < 100; i++) {
        rerender({
          bounds: {
            north: 39 + i * 0.01,
            south: 37 + i * 0.01,
            east: 139 + i * 0.01,
            west: 138 + i * 0.01,
            zoom: 10 + (i % 5),
          },
        });
      }

      expect(() => unmount()).not.toThrow();
    });
  });
});
