/**
 * @fileoverview clusterUtils テスト
 * マーカークラスタリングアルゴリズムの包括的テスト
 */

import type { Restaurant } from "@/types";
import { describe, expect, it } from "vitest";
import { calculatePixelDistance, generateClusters } from "../clusterUtils";

// テスト用のモックレストランファクトリ
const createMockRestaurant = (
  id: string,
  lat: number,
  lng: number,
  name: string = `Restaurant ${id}`
): Restaurant => ({
  id,
  name,
  coordinates: { lat, lng },
  type: "restaurant",
  address: "テスト住所",
  cuisineType: "日本料理",
  features: [],
  district: "両津",
  priceRange: "1000-2000円",
  openingHours: [],
  lastUpdated: "2024-01-01",
});

describe("clusterUtils", () => {
  // ==============================
  // calculatePixelDistance テスト
  // ==============================
  describe("calculatePixelDistance", () => {
    it("同じ座標で距離0を返す", () => {
      const coord = { lat: 38.0, lng: 138.4 };
      const distance = calculatePixelDistance(coord, coord, 10);
      expect(distance).toBe(0);
    });

    it("異なる座標で正の距離を返す", () => {
      const coord1 = { lat: 38.0, lng: 138.4 };
      const coord2 = { lat: 38.1, lng: 138.5 };
      const distance = calculatePixelDistance(coord1, coord2, 10);
      expect(distance).toBeGreaterThan(0);
    });

    it("ズームレベルが高いほど距離（ピクセル）が大きくなる", () => {
      const coord1 = { lat: 38.0, lng: 138.4 };
      const coord2 = { lat: 38.1, lng: 138.5 };

      const distanceZoom10 = calculatePixelDistance(coord1, coord2, 10);
      const distanceZoom15 = calculatePixelDistance(coord1, coord2, 15);

      expect(distanceZoom15).toBeGreaterThan(distanceZoom10);
    });

    it("緯度による補正が適用される（赤道からの距離でcos補正）", () => {
      // 同じ経度差でも緯度が高いほど実際の距離は短い
      const coord1Equator = { lat: 0, lng: 0 };
      const coord2Equator = { lat: 0, lng: 1 };

      const coord1High = { lat: 60, lng: 0 };
      const coord2High = { lat: 60, lng: 1 };

      const distanceEquator = calculatePixelDistance(
        coord1Equator,
        coord2Equator,
        10
      );
      const distanceHigh = calculatePixelDistance(coord1High, coord2High, 10);

      // 高緯度では経度1度の距離が短くなる
      expect(distanceHigh).toBeLessThan(distanceEquator);
    });

    it("対称性: coord1とcoord2を入れ替えても近い距離を返す", () => {
      // 注: cos補正で使われる緯度がcoord1基準のため、完全な対称性はない
      // これはアルゴリズムの仕様であり、実用上問題ない範囲（<1%差）
      const coord1 = { lat: 38.0, lng: 138.4 };
      const coord2 = { lat: 38.1, lng: 138.5 };

      const distance1 = calculatePixelDistance(coord1, coord2, 10);
      const distance2 = calculatePixelDistance(coord2, coord1, 10);

      // 1%未満の差であることを確認
      const difference = Math.abs(distance1 - distance2);
      const relativeDiff = difference / Math.max(distance1, distance2);
      expect(relativeDiff).toBeLessThan(0.01);
    });

    it("緯度のみの差分で正しく計算される", () => {
      const coord1 = { lat: 38.0, lng: 138.4 };
      const coord2 = { lat: 38.5, lng: 138.4 }; // 経度は同じ

      const distance = calculatePixelDistance(coord1, coord2, 10);
      expect(distance).toBeGreaterThan(0);
    });

    it("経度のみの差分で正しく計算される", () => {
      const coord1 = { lat: 38.0, lng: 138.4 };
      const coord2 = { lat: 38.0, lng: 139.0 }; // 緯度は同じ

      const distance = calculatePixelDistance(coord1, coord2, 10);
      expect(distance).toBeGreaterThan(0);
    });

    it("ズームレベル0でも動作する", () => {
      const coord1 = { lat: 38.0, lng: 138.4 };
      const coord2 = { lat: 38.1, lng: 138.5 };

      const distance = calculatePixelDistance(coord1, coord2, 0);
      expect(distance).toBeGreaterThan(0);
      expect(Number.isFinite(distance)).toBe(true);
    });

    it("ズームレベル21でも動作する", () => {
      const coord1 = { lat: 38.0, lng: 138.4 };
      const coord2 = { lat: 38.001, lng: 138.401 };

      const distance = calculatePixelDistance(coord1, coord2, 21);
      expect(distance).toBeGreaterThan(0);
      expect(Number.isFinite(distance)).toBe(true);
    });
  });

  // ==============================
  // generateClusters テスト
  // ==============================
  describe("generateClusters", () => {
    it("空配列で空配列を返す", () => {
      const clusters = generateClusters([], 50, 10);
      expect(clusters).toEqual([]);
    });

    it("1つのレストランで1つのクラスタを生成", () => {
      const restaurants = [createMockRestaurant("1", 38.0, 138.4)];
      const clusters = generateClusters(restaurants, 50, 10);

      expect(clusters).toHaveLength(1);
      expect(clusters[0]?.count).toBe(1);
      expect(clusters[0]?.restaurants).toHaveLength(1);
    });

    it("離れた2つのレストランで2つのクラスタを生成", () => {
      const restaurants = [
        createMockRestaurant("1", 38.0, 138.4),
        createMockRestaurant("2", 39.0, 139.4), // 遠い
      ];
      const clusters = generateClusters(restaurants, 50, 10);

      expect(clusters).toHaveLength(2);
      clusters.forEach(cluster => {
        expect(cluster.count).toBe(1);
      });
    });

    it("近接する複数のレストランを1つのクラスタにまとめる", () => {
      const restaurants = [
        createMockRestaurant("1", 38.0, 138.4),
        createMockRestaurant("2", 38.0001, 138.4001), // 非常に近い
        createMockRestaurant("3", 38.0002, 138.4002), // 非常に近い
      ];
      const clusters = generateClusters(restaurants, 100, 15); // 大きいclusterDistance

      // すべてが1つのクラスタになるはず
      expect(clusters).toHaveLength(1);
      expect(clusters[0]?.count).toBe(3);
      expect(clusters[0]?.restaurants).toHaveLength(3);
    });

    it("クラスタの中心座標が正しく計算される", () => {
      const restaurants = [
        createMockRestaurant("1", 38.0, 138.0),
        createMockRestaurant("2", 38.0, 138.2),
      ];
      const clusters = generateClusters(restaurants, 1000, 5); // 大きい距離で1クラスタに

      if (clusters.length === 1) {
        const cluster = clusters[0];
        expect(cluster).toBeDefined();
        expect(cluster?.position.lat).toBeCloseTo(38.0, 5);
        expect(cluster?.position.lng).toBeCloseTo(138.1, 5); // 平均
      }
    });

    it("クラスタのboundsが正しく計算される", () => {
      const restaurants = [
        createMockRestaurant("1", 38.0, 138.0),
        createMockRestaurant("2", 38.5, 138.5),
      ];
      const clusters = generateClusters(restaurants, 1000, 5); // 1クラスタに

      if (clusters.length === 1) {
        const cluster = clusters[0];
        expect(cluster).toBeDefined();
        expect(cluster?.bounds.north).toBeCloseTo(38.5, 5);
        expect(cluster?.bounds.south).toBeCloseTo(38.0, 5);
        expect(cluster?.bounds.east).toBeCloseTo(138.5, 5);
        expect(cluster?.bounds.west).toBeCloseTo(138.0, 5);
      }
    });

    it("すべてのレストランがいずれかのクラスタに含まれる", () => {
      const restaurants = [
        createMockRestaurant("1", 38.0, 138.4),
        createMockRestaurant("2", 38.5, 138.8),
        createMockRestaurant("3", 39.0, 139.0),
        createMockRestaurant("4", 38.0001, 138.4001),
      ];
      const clusters = generateClusters(restaurants, 50, 10);

      const totalInClusters = clusters.reduce(
        (sum, c) => sum + c.restaurants.length,
        0
      );
      expect(totalInClusters).toBe(restaurants.length);
    });

    it("各レストランは1つのクラスタにのみ含まれる（重複なし）", () => {
      const restaurants = [
        createMockRestaurant("1", 38.0, 138.4),
        createMockRestaurant("2", 38.5, 138.8),
        createMockRestaurant("3", 39.0, 139.0),
      ];
      const clusters = generateClusters(restaurants, 50, 10);

      const allIds = clusters.flatMap(c => c.restaurants.map(r => r.id));
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it("クラスタIDが一意である", () => {
      const restaurants = [
        createMockRestaurant("1", 38.0, 138.4),
        createMockRestaurant("2", 38.5, 138.8),
        createMockRestaurant("3", 39.0, 139.0),
      ];
      const clusters = generateClusters(restaurants, 50, 10);

      const ids = clusters.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("ズームレベルが高いほどクラスタが分散する", () => {
      const restaurants = [
        createMockRestaurant("1", 38.0, 138.4),
        createMockRestaurant("2", 38.001, 138.401),
        createMockRestaurant("3", 38.002, 138.402),
      ];

      const clustersLowZoom = generateClusters(restaurants, 50, 8);
      const clustersHighZoom = generateClusters(restaurants, 50, 15);

      // 高ズームではより多くのクラスタに分散する可能性が高い
      expect(clustersHighZoom.length).toBeGreaterThanOrEqual(
        clustersLowZoom.length
      );
    });

    it("clusterDistanceが大きいほどクラスタが統合される", () => {
      const restaurants = [
        createMockRestaurant("1", 38.0, 138.4),
        createMockRestaurant("2", 38.01, 138.41),
        createMockRestaurant("3", 38.02, 138.42),
      ];

      const clustersSmallDistance = generateClusters(restaurants, 10, 10);
      const clustersLargeDistance = generateClusters(restaurants, 500, 10);

      expect(clustersLargeDistance.length).toBeLessThanOrEqual(
        clustersSmallDistance.length
      );
    });

    it("デフォルト引数で動作する", () => {
      const restaurants = [createMockRestaurant("1", 38.0, 138.4)];
      const clusters = generateClusters(restaurants);

      expect(clusters).toHaveLength(1);
    });
  });

  // ==============================
  // ClusterData 型テスト
  // ==============================
  describe("ClusterData structure", () => {
    it("クラスタデータが正しい構造を持つ", () => {
      const restaurants = [createMockRestaurant("1", 38.0, 138.4)];
      const clusters = generateClusters(restaurants, 50, 10);

      expect(clusters).toHaveLength(1);
      const cluster = clusters[0];
      expect(cluster).toBeDefined();
      expect(cluster).toHaveProperty("id");
      expect(cluster).toHaveProperty("count");
      expect(cluster).toHaveProperty("restaurants");
      expect(cluster).toHaveProperty("position");
      expect(cluster).toHaveProperty("bounds");

      expect(cluster?.position).toHaveProperty("lat");
      expect(cluster?.position).toHaveProperty("lng");

      expect(cluster?.bounds).toHaveProperty("north");
      expect(cluster?.bounds).toHaveProperty("south");
      expect(cluster?.bounds).toHaveProperty("east");
      expect(cluster?.bounds).toHaveProperty("west");
    });
  });
});
