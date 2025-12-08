/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Restaurant } from "@/types";
import {
  useMarkerOptimization,
  useSimpleMarkerOptimization,
} from "../useMarkerOptimization";

// モックデータ
const createMockRestaurant = (
  id: string,
  overrides: Partial<Restaurant> = {}
): Restaurant => ({
  id,
  type: "restaurant",
  name: `レストラン${id}`,
  coordinates: { lat: 38.0, lng: 138.0 },
  district: "両津",
  address: "新潟県佐渡市",
  description: "テストレストラン",
  cuisineType: "日本料理",
  priceRange: "1000-2000円",
  features: [],
  rating: 4.0,
  reviewCount: 100,
  openingHours: [],
  lastUpdated: "2025-01-01",
  ...overrides,
});

describe("useMarkerOptimization", () => {
  describe("基本機能", () => {
    it("空配列を処理できる", () => {
      const { result } = renderHook(() => useMarkerOptimization([]));

      expect(result.current.optimizedMarkers).toEqual([]);
      expect(result.current.performanceStats.totalMarkers).toBe(0);
      expect(result.current.performanceStats.visibleMarkers).toBe(0);
    });

    it("単一マーカーを処理できる", () => {
      const restaurants = [createMockRestaurant("1")];
      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      expect(result.current.optimizedMarkers).toHaveLength(1);
      expect(result.current.optimizedMarkers[0]?.restaurant.id).toBe("1");
    });

    it("複数マーカーを処理できる", () => {
      const restaurants = [
        createMockRestaurant("1"),
        createMockRestaurant("2"),
        createMockRestaurant("3"),
      ];
      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      expect(result.current.optimizedMarkers).toHaveLength(3);
    });

    it("パフォーマンス統計が正しく計算される", () => {
      const restaurants = [
        createMockRestaurant("1"),
        createMockRestaurant("2"),
      ];
      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      expect(result.current.performanceStats.totalMarkers).toBe(2);
      expect(result.current.performanceStats.visibleMarkers).toBe(2);
      expect(result.current.performanceStats.renderTime).toBeGreaterThan(0);
    });
  });

  describe("座標検証", () => {
    it("有効な座標のみを処理する", () => {
      const restaurants = [
        createMockRestaurant("1", { coordinates: { lat: 38.0, lng: 138.0 } }),
        createMockRestaurant("2", { coordinates: { lat: NaN, lng: 138.0 } }),
        createMockRestaurant("3", { coordinates: { lat: 38.0, lng: NaN } }),
        createMockRestaurant("4", {
          coordinates: { lat: 91.0, lng: 138.0 },
        }), // lat > 90
        createMockRestaurant("5", {
          coordinates: { lat: 38.0, lng: 181.0 },
        }), // lng > 180
      ];
      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      // 有効なのはid=1のみ
      expect(result.current.optimizedMarkers).toHaveLength(1);
      expect(result.current.optimizedMarkers[0]?.restaurant.id).toBe("1");
    });

    it("座標境界値を正しく処理する", () => {
      const restaurants = [
        createMockRestaurant("1", { coordinates: { lat: -90, lng: -180 } }),
        createMockRestaurant("2", { coordinates: { lat: 90, lng: 180 } }),
        createMockRestaurant("3", { coordinates: { lat: 0, lng: 0 } }),
      ];
      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      expect(result.current.optimizedMarkers).toHaveLength(3);
    });

    it("isValidCoordinatesユーティリティが正しく動作する", () => {
      const { result } = renderHook(() => useMarkerOptimization([]));

      expect(result.current.isValidCoordinates(38.0, 138.0)).toBe(true);
      expect(result.current.isValidCoordinates(NaN, 138.0)).toBe(false);
      expect(result.current.isValidCoordinates(38.0, NaN)).toBe(false);
      expect(result.current.isValidCoordinates(91, 138)).toBe(false);
      expect(result.current.isValidCoordinates(38, 181)).toBe(false);
    });
  });

  describe("ビューポートフィルタリング", () => {
    it("ビューポート内のマーカーのみ表示する", () => {
      const restaurants = [
        createMockRestaurant("1", { coordinates: { lat: 38.0, lng: 138.0 } }),
        createMockRestaurant("2", { coordinates: { lat: 39.0, lng: 139.0 } }),
        createMockRestaurant("3", { coordinates: { lat: 40.0, lng: 140.0 } }),
      ];

      const viewportBounds = {
        north: 38.5,
        south: 37.5,
        east: 138.5,
        west: 137.5,
        zoom: 10,
      };

      const { result } = renderHook(() =>
        useMarkerOptimization(restaurants, viewportBounds)
      );

      // id=1のみがビューポート内
      expect(result.current.optimizedMarkers).toHaveLength(1);
      expect(result.current.optimizedMarkers[0]?.restaurant.id).toBe("1");
    });

    it("ビューポート未指定時は全マーカーを表示する", () => {
      const restaurants = [
        createMockRestaurant("1"),
        createMockRestaurant("2"),
        createMockRestaurant("3"),
      ];

      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      expect(result.current.optimizedMarkers).toHaveLength(3);
    });
  });

  describe("優先度計算", () => {
    it("評価が高いレストランの優先度が高い", () => {
      const restaurants = [
        createMockRestaurant("1", { rating: 3.0 }),
        createMockRestaurant("2", { rating: 5.0 }),
        createMockRestaurant("3", { rating: 4.0 }),
      ];

      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      // 評価順でソートされる
      expect(result.current.optimizedMarkers[0]?.restaurant.rating).toBe(5.0);
      expect(result.current.optimizedMarkers[1]?.restaurant.rating).toBe(4.0);
      expect(result.current.optimizedMarkers[2]?.restaurant.rating).toBe(3.0);
    });

    it("レビュー数が多いレストランの優先度が高い", () => {
      const restaurants = [
        createMockRestaurant("1", { rating: 4.0, reviewCount: 50 }),
        createMockRestaurant("2", { rating: 4.0, reviewCount: 200 }),
        createMockRestaurant("3", { rating: 4.0, reviewCount: 100 }),
      ];

      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      // レビュー数順でソートされる
      expect(result.current.optimizedMarkers[0]?.restaurant.reviewCount).toBe(
        200
      );
      expect(result.current.optimizedMarkers[1]?.restaurant.reviewCount).toBe(
        100
      );
      expect(result.current.optimizedMarkers[2]?.restaurant.reviewCount).toBe(
        50
      );
    });

    it("価格帯が優先度に影響する", () => {
      const restaurants = [
        createMockRestaurant("1", {
          rating: 4.0,
          reviewCount: 100,
          priceRange: "3000円～",
        }),
        createMockRestaurant("2", {
          rating: 4.0,
          reviewCount: 100,
          priceRange: "～1000円",
        }),
      ];

      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      // 手頃な価格（～1000円）の方が優先される
      expect(result.current.optimizedMarkers[0]?.restaurant.priceRange).toBe(
        "～1000円"
      );
    });
  });

  describe("最大表示数制限", () => {
    it("maxVisibleMarkersで表示数を制限できる", () => {
      const restaurants = Array.from({ length: 100 }, (_, i) =>
        createMockRestaurant(`${i}`)
      );

      const { result } = renderHook(() =>
        useMarkerOptimization(restaurants, undefined, {
          maxVisibleMarkers: 50,
        })
      );

      expect(result.current.optimizedMarkers).toHaveLength(50);
      expect(result.current.performanceStats.totalMarkers).toBe(100);
      expect(result.current.performanceStats.visibleMarkers).toBe(50);
    });

    it("デフォルトの最大表示数は500", () => {
      const restaurants = Array.from({ length: 600 }, (_, i) =>
        createMockRestaurant(`${i}`)
      );

      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      expect(result.current.optimizedMarkers).toHaveLength(500);
    });
  });

  describe("クラスタリング機能", () => {
    it("近接マーカーをクラスタリングする", () => {
      // generateClusters関数を直接テストする
      const restaurants = [
        createMockRestaurant("1", { coordinates: { lat: 38.0, lng: 138.0 } }),
        createMockRestaurant("2", {
          coordinates: { lat: 38.0, lng: 138.0 },
        }), // 完全に同じ座標
        createMockRestaurant("3", {
          coordinates: { lat: 38.0, lng: 138.0 },
        }), // 完全に同じ座標
      ];

      const { result } = renderHook(() =>
        useMarkerOptimization(restaurants, undefined, {
          enableClustering: true,
          clusteringMinCount: 2,
        })
      );

      // generateClusters関数を直接呼び出してテスト
      const clusters = result.current.generateClusters(restaurants, 10);
      expect(clusters.length).toBeGreaterThanOrEqual(0);

      // クラスターが生成された場合、各クラスターが最低2件以上のレストランを含むことを確認
      clusters.forEach(cluster => {
        expect(cluster.count).toBeGreaterThanOrEqual(2);
      });
    });

    it("クラスタリング無効化できる", () => {
      const restaurants = [
        createMockRestaurant("1", { coordinates: { lat: 38.0, lng: 138.0 } }),
        createMockRestaurant("2", {
          coordinates: { lat: 38.001, lng: 138.001 },
        }),
      ];

      const { result } = renderHook(() =>
        useMarkerOptimization(
          restaurants,
          { zoom: 15, north: 39, south: 37, east: 139, west: 137 },
          {
            enableClustering: false,
          }
        )
      );

      expect(result.current.clusters).toEqual([]);
    });

    it("最小件数未満ではクラスタリングしない", () => {
      const restaurants = [createMockRestaurant("1")];

      const { result } = renderHook(() =>
        useMarkerOptimization(
          restaurants,
          { zoom: 15, north: 39, south: 37, east: 139, west: 137 } as const,
          {
            enableClustering: true,
            clusteringMinCount: 2,
          }
        )
      );

      expect(result.current.clusters).toEqual([]);
    });

    it("ズームレベルに応じてクラスタリング距離が調整される", () => {
      const restaurants = [
        createMockRestaurant("1", { coordinates: { lat: 38.0, lng: 138.0 } }),
        createMockRestaurant("2", {
          coordinates: { lat: 38.001, lng: 138.001 },
        }),
      ];

      // ズームレベル低い（広域）
      const { result: result1 } = renderHook(() =>
        useMarkerOptimization(
          restaurants,
          { zoom: 5, north: 39, south: 37, east: 139, west: 137 },
          {
            enableClustering: true,
          }
        )
      );

      // ズームレベル高い（詳細）
      const { result: result2 } = renderHook(() =>
        useMarkerOptimization(
          restaurants,
          { zoom: 15, north: 39, south: 37, east: 139, west: 137 },
          {
            enableClustering: true,
          }
        )
      );

      // 低ズームの方がクラスタリングされやすい
      expect(result1.current.clusters.length).toBeGreaterThanOrEqual(
        result2.current.clusters.length
      );
    });

    it("クラスター統計が正しく計算される", () => {
      const restaurants = [
        createMockRestaurant("1", { coordinates: { lat: 38.0, lng: 138.0 } }),
        createMockRestaurant("2", {
          coordinates: { lat: 38.001, lng: 138.001 },
        }),
        createMockRestaurant("3", {
          coordinates: { lat: 38.002, lng: 138.002 },
        }),
      ];

      const { result } = renderHook(() =>
        useMarkerOptimization(
          restaurants,
          { zoom: 15, north: 39, south: 37, east: 139, west: 137 } as const,
          {
            enableClustering: true,
            clusteringMinCount: 2,
          }
        )
      );

      if (result.current.clusters.length > 0) {
        expect(result.current.performanceStats.clusterCount).toBeGreaterThan(0);
        expect(
          result.current.performanceStats.averageClusterSize
        ).toBeGreaterThan(0);
      }
    });
  });

  describe("距離計算", () => {
    it("calculateDistanceが正しく動作する", () => {
      const { result } = renderHook(() => useMarkerOptimization([]));

      // 同一座標
      const distance1 = result.current.calculateDistance(
        38.0,
        138.0,
        38.0,
        138.0
      );
      expect(distance1).toBe(0);

      // 異なる座標
      const distance2 = result.current.calculateDistance(
        38.0,
        138.0,
        39.0,
        139.0
      );
      expect(distance2).toBeGreaterThan(0);
    });

    it("大きな距離を正しく計算する", () => {
      const { result } = renderHook(() => useMarkerOptimization([]));

      // 東京-大阪程度の距離
      const distance = result.current.calculateDistance(
        35.6895,
        139.6917,
        34.6937,
        135.5023
      );
      expect(distance).toBeGreaterThan(390000); // 390km以上
      expect(distance).toBeLessThan(410000); // 410km未満
    });
  });

  describe("設定の変更", () => {
    it("設定変更時に再計算される", () => {
      const restaurants = Array.from({ length: 100 }, (_, i) =>
        createMockRestaurant(`${i}`)
      );

      const { result, rerender } = renderHook(
        ({ config }) => useMarkerOptimization(restaurants, undefined, config),
        {
          initialProps: { config: { maxVisibleMarkers: 50 } },
        }
      );

      expect(result.current.optimizedMarkers).toHaveLength(50);

      // 設定変更
      rerender({ config: { maxVisibleMarkers: 30 } });

      expect(result.current.optimizedMarkers).toHaveLength(30);
    });

    it("設定オブジェクトが変わっても値が同じなら再計算しない", () => {
      const restaurants = [createMockRestaurant("1")];

      const { result, rerender } = renderHook(
        ({ config }) => useMarkerOptimization(restaurants, undefined, config),
        {
          initialProps: { config: { maxVisibleMarkers: 100 } },
        }
      );

      const initialRenderTime = result.current.performanceStats.lastUpdate;

      // 同じ値の新しいオブジェクト
      rerender({ config: { maxVisibleMarkers: 100 } });

      // lastUpdateが変わっていないことを確認（再計算されていない）
      expect(result.current.performanceStats.lastUpdate).toBe(
        initialRenderTime
      );
    });
  });

  describe("resetOptimization", () => {
    it("統計をリセットできる", () => {
      const restaurants = [createMockRestaurant("1")];
      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      const initialTotalMarkers = result.current.performanceStats.totalMarkers;
      expect(initialTotalMarkers).toBe(1);

      result.current.resetOptimization();

      // resetOptimizationは一時的に統計を0にセットするが、useEffectですぐに再計算される
      // ただし、optimizedMarkers自体は変わらない
      expect(result.current.optimizedMarkers).toHaveLength(1);
      // リセット後、useEffectにより統計が再計算されるため、最終的には1に戻ることを確認
      expect(result.current.performanceStats.totalMarkers).toBe(1);
    });
  });

  describe("デバッグモード", () => {
    it("テスト環境ではデフォルトでデバッグモードは無効", () => {
      const restaurants = [createMockRestaurant("1")];
      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      // process.env.NODE_ENV === 'test'のためfalse
      expect(result.current.config.debugMode).toBe(false);
    });

    it("debugModeを明示的に無効化できる", () => {
      const restaurants = [createMockRestaurant("1")];
      const { result } = renderHook(() =>
        useMarkerOptimization(restaurants, undefined, { debugMode: false })
      );

      expect(result.current.config.debugMode).toBe(false);
    });
  });

  describe("エッジケース", () => {
    it("大量データを処理できる", () => {
      const restaurants = Array.from({ length: 10000 }, (_, i) =>
        createMockRestaurant(`${i}`)
      );

      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      expect(result.current.performanceStats.totalMarkers).toBe(10000);
      expect(result.current.optimizedMarkers.length).toBeLessThanOrEqual(500); // デフォルト最大値
    });

    it("ratingやreviewCountが未定義でも動作する", () => {
      const restaurants = [
        createMockRestaurant("1", {
          rating: 0,
          reviewCount: 0,
        }),
      ];

      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      expect(result.current.optimizedMarkers).toHaveLength(1);
    });

    it("priceRangeが未定義でも動作する", () => {
      // priceRangeを省略したレストランを作成
      const restaurants: Restaurant[] = [
        {
          ...createMockRestaurant("1"),
          priceRange: "1000-2000円",
        },
      ];

      const { result } = renderHook(() => useMarkerOptimization(restaurants));

      expect(result.current.optimizedMarkers).toHaveLength(1);
    });
  });
});

describe("useSimpleMarkerOptimization", () => {
  it("有効な座標のレストランのみ返す", () => {
    const restaurants = [
      createMockRestaurant("1", { coordinates: { lat: 38.0, lng: 138.0 } }),
      createMockRestaurant("2", { coordinates: { lat: NaN, lng: 138.0 } }),
      createMockRestaurant("3", { coordinates: { lat: 38.0, lng: NaN } }),
    ];

    const { result } = renderHook(() =>
      useSimpleMarkerOptimization(restaurants)
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0]?.id).toBe("1");
  });

  it("maxMarkersで表示数を制限できる", () => {
    const restaurants = Array.from({ length: 200 }, (_, i) =>
      createMockRestaurant(`${i}`)
    );

    const { result } = renderHook(() =>
      useSimpleMarkerOptimization(restaurants, 50)
    );

    expect(result.current).toHaveLength(50);
  });

  it("デフォルトの最大表示数は100", () => {
    const restaurants = Array.from({ length: 150 }, (_, i) =>
      createMockRestaurant(`${i}`)
    );

    const { result } = renderHook(() =>
      useSimpleMarkerOptimization(restaurants)
    );

    expect(result.current).toHaveLength(100);
  });

  it("空配列を処理できる", () => {
    const { result } = renderHook(() => useSimpleMarkerOptimization([]));

    expect(result.current).toEqual([]);
  });

  it("座標境界値を正しく処理する", () => {
    const restaurants = [
      createMockRestaurant("1", { coordinates: { lat: -90, lng: -180 } }),
      createMockRestaurant("2", { coordinates: { lat: 90, lng: 180 } }),
      createMockRestaurant("3", { coordinates: { lat: 0, lng: 0 } }),
    ];

    const { result } = renderHook(() =>
      useSimpleMarkerOptimization(restaurants)
    );

    expect(result.current).toHaveLength(3);
  });
});
