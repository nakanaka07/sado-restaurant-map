/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as sheetsService from "@/services/sheets/sheetsService";
import { useMapPoints } from "../useMapPoints";

import type { MapPoint } from "@/types";

// モックデータ
const mockRestaurant: MapPoint = {
  id: "rest1",
  type: "restaurant",
  name: "テストレストラン",
  coordinates: { lat: 38.0, lng: 138.0 },
  district: "両津",
  address: "新潟県佐渡市両津地区",
  description: "美味しい和食レストラン",
  features: ["Wi-Fi", "駐車場あり"],
  cuisineType: "日本料理",
  priceRange: "1000-2000円",
  rating: 4.5,
  reviewCount: 100,
  openingHours: [
    { day: "月", open: "11:00", close: "20:00", isHoliday: false },
    { day: "火", open: "11:00", close: "20:00", isHoliday: false },
  ],
  lastUpdated: "2025-01-01",
};

const mockParking: MapPoint = {
  id: "park1",
  type: "parking",
  name: "テスト駐車場",
  coordinates: { lat: 38.1, lng: 138.1 },
  district: "相川",
  address: "新潟県佐渡市相川地区",
  description: "無料駐車場",
  features: ["無料", "24時間営業"],
  lastUpdated: "2025-01-01",
};

const mockToilet: MapPoint = {
  id: "toilet1",
  type: "toilet",
  name: "テストトイレ",
  coordinates: { lat: 38.2, lng: 138.2 },
  district: "佐和田",
  address: "新潟県佐渡市佐和田地区",
  description: "公共トイレ",
  features: ["車椅子対応", "オムツ交換台"],
  lastUpdated: "2025-01-01",
};

describe("useMapPoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("基本機能", () => {
    it("初期状態でローディングが開始される", () => {
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useMapPoints());

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.mapPoints).toEqual([]);
    });

    it("データ取得成功時に全ポイントが取得される", async () => {
      const mockData = [mockRestaurant, mockParking, mockToilet];
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue(mockData);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.mapPoints).toHaveLength(3);
      expect(result.current.allMapPoints).toHaveLength(3);
      expect(result.current.error).toBeNull();
    });

    it("統計情報が正しく計算される", async () => {
      const mockData = [mockRestaurant, mockParking, mockToilet];
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue(mockData);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        restaurants: 1,
        parkings: 1,
        toilets: 1,
        total: 3,
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("SheetsApiErrorを適切に処理する", async () => {
      const error = new sheetsService.SheetsApiError("データ取得失敗", 500);
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockRejectedValue(error);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain("データベース接続エラー");
      expect(result.current.mapPoints).toEqual([]);
    });

    it("一般的なErrorを適切に処理する", async () => {
      const error = new Error("ネットワークエラー");
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockRejectedValue(error);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain("予期しないエラーが発生しました");
      expect(result.current.error).toContain("ネットワークエラー");
    });

    it("未知のエラーを適切に処理する", async () => {
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockRejectedValue(
        "Unknown error"
      );

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain("Unknown error");
    });
  });

  describe("フィルタリング機能", () => {
    beforeEach(() => {
      const mockData = [mockRestaurant, mockParking, mockToilet];
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue(mockData);
    });

    it("ポイントタイプでフィルタリングできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // レストランのみ
      result.current.updateFilters({ pointTypes: ["restaurant"] });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
        expect(result.current.mapPoints[0]?.type).toBe("restaurant");
      });
    });

    it("地区でフィルタリングできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({ districts: ["両津"] });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
        expect(result.current.mapPoints[0]?.district).toBe("両津");
      });
    });

    it("検索クエリでフィルタリングできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({ searchQuery: "レストラン" });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
        expect(result.current.mapPoints[0]?.name).toContain("レストラン");
      });
    });

    it("料理ジャンルでフィルタリングできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({
        pointTypes: ["restaurant"],
        cuisineTypes: ["日本料理"],
      });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
        expect(result.current.mapPoints[0]?.type).toBe("restaurant");
      });
    });

    it("価格帯でフィルタリングできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({
        pointTypes: ["restaurant"],
        priceRanges: ["1000-2000円"],
      });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
        expect(result.current.mapPoints[0]?.type).toBe("restaurant");
      });
    });

    it("評価でフィルタリングできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({
        pointTypes: ["restaurant"],
        minRating: 4.0,
      });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
        expect(result.current.mapPoints[0]?.type).toBe("restaurant");
      });
    });

    it("特徴でフィルタリングできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({ features: ["Wi-Fi"] });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
        expect(result.current.mapPoints[0]?.features).toContain("Wi-Fi");
      });
    });

    it("駐車場特徴でフィルタリングできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({
        pointTypes: ["parking"],
        parkingFeatures: ["無料"],
      });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
        expect(result.current.mapPoints[0]?.type).toBe("parking");
      });
    });

    it("トイレ特徴でフィルタリングできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({
        pointTypes: ["toilet"],
        toiletFeatures: ["車椅子対応"],
      });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
        expect(result.current.mapPoints[0]?.type).toBe("toilet");
      });
    });

    it("複数条件でフィルタリングできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({
        pointTypes: ["restaurant"],
        districts: ["両津"],
        cuisineTypes: ["日本料理"],
      });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
        expect(result.current.mapPoints[0]?.name).toBe("テストレストラン");
      });
    });

    it("条件に一致しない場合は空配列を返す", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({ districts: ["存在しない地区" as never] });

      await waitFor(() => {
        expect(result.current.mapPoints).toEqual([]);
      });
    });
  });

  describe("ソート機能", () => {
    beforeEach(() => {
      const mockData = [
        { ...mockRestaurant, name: "C店", rating: 4.0 },
        { ...mockRestaurant, id: "rest2", name: "A店", rating: 4.5 },
        { ...mockRestaurant, id: "rest3", name: "B店", rating: 3.5 },
      ] as MapPoint[];
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue(mockData);
    });

    it("名前順でソートできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateSortOrder("name");

      await waitFor(() => {
        const names = result.current.mapPoints.map(p => p.name);
        expect(names).toEqual(["A店", "B店", "C店"]);
      });
    });

    it("評価順でソートできる", async () => {
      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateSortOrder("rating");

      await waitFor(() => {
        const ratings = result.current.mapPoints.map(p =>
          p.type === "restaurant" ? p.rating : 0
        );
        expect(ratings[0]).toBeGreaterThanOrEqual(ratings[1] ?? 0);
        expect(ratings[1]).toBeGreaterThanOrEqual(ratings[2] ?? 0);
      });
    });

    it("価格順でソートできる", async () => {
      const mockData = [
        { ...mockRestaurant, priceRange: "3000円～" },
        {
          ...mockRestaurant,
          id: "rest2",
          priceRange: "～1000円",
        },
        {
          ...mockRestaurant,
          id: "rest3",
          priceRange: "1000-2000円",
        },
      ] as MapPoint[];
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue(mockData);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateSortOrder("priceRange");

      await waitFor(() => {
        const prices = result.current.mapPoints.map(p =>
          p.type === "restaurant" ? p.priceRange : undefined
        );
        expect(prices).toEqual(["～1000円", "1000-2000円", "3000円～"]);
      });
    });

    it("距離順でソートできる（現在地指定時）", async () => {
      const mockData = [
        { ...mockRestaurant, coordinates: { lat: 38.5, lng: 138.5 } },
        {
          ...mockRestaurant,
          id: "rest2",
          coordinates: { lat: 38.0, lng: 138.0 },
        },
        {
          ...mockRestaurant,
          id: "rest3",
          coordinates: { lat: 38.2, lng: 138.2 },
        },
      ] as MapPoint[];
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue(mockData);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({
        currentLocation: { lat: 38.0, lng: 138.0 },
      });
      result.current.updateSortOrder("distance");

      await waitFor(() => {
        // 最初のポイントが最も近い
        expect(result.current.mapPoints[0]?.coordinates).toEqual({
          lat: 38.0,
          lng: 138.0,
        });
      });
    });
  });

  describe("フィルターリセット", () => {
    it("resetFiltersで初期状態に戻る", async () => {
      const mockData = [mockRestaurant, mockParking, mockToilet];
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue(mockData);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // フィルター適用
      result.current.updateFilters({ districts: ["両津"] });

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(1);
      });

      // リセット
      result.current.resetFilters();

      await waitFor(() => {
        expect(result.current.mapPoints).toHaveLength(3);
      });
    });
  });

  describe("データ再取得", () => {
    it("refetchでデータを再取得できる", async () => {
      const mockData1 = [mockRestaurant];
      const mockData2 = [mockRestaurant, mockParking];

      const fetchSpy = vi
        .spyOn(sheetsService, "fetchAllMapPoints")
        .mockResolvedValue(mockData1);

      const { result } = renderHook(() => useMapPoints());

      // 初回fetch完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.mapPoints.length).toBeGreaterThan(0);
      });

      const initialCallCount = fetchSpy.mock.calls.length;

      // 2回目のモックデータを設定
      fetchSpy.mockResolvedValueOnce(mockData2);

      // 再取得
      await result.current.refetch();

      // 再取得完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.mapPoints.length).toBe(2);
      });

      // fetchが追加で呼ばれていることを確認
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe("エッジケース", () => {
    it("空データを適切に処理する", async () => {
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue([]);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.mapPoints).toEqual([]);
      expect(result.current.stats.total).toBe(0);
    });

    it("不正な座標を持つデータも含む場合の動作", async () => {
      const invalidData: MapPoint[] = [
        mockRestaurant,
        {
          ...mockParking,
          coordinates: { lat: NaN, lng: NaN },
        },
      ];
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue(
        invalidData
      );

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // データは取得されるが、フィルタリング/ソートで問題が起きないことを確認
      expect(result.current.allMapPoints).toHaveLength(2);
    });

    it("openNowフィルターが機能する（営業時間外）", async () => {
      // 現在時刻を固定（午前8時 - 営業時間外）
      vi.setSystemTime(new Date("2025-12-08T08:00:00"));

      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue([
        mockRestaurant,
      ]);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({ openNow: true });

      await waitFor(() => {
        // 営業時間外なのでフィルタリングされる
        expect(result.current.mapPoints).toEqual([]);
      });

      vi.useRealTimers();
    });

    it("openNowフィルターが機能する（営業中）", async () => {
      // 現在時刻を固定（月曜日 12:00 - 営業中）
      vi.setSystemTime(new Date("2025-12-08T12:00:00")); // 月曜日

      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue([
        mockRestaurant,
      ]);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateFilters({ openNow: true });

      await waitFor(() => {
        // 営業中なので表示される
        expect(result.current.mapPoints).toHaveLength(1);
      });

      vi.useRealTimers();
    });
  });

  describe("パフォーマンス", () => {
    it("大量データを処理できる", async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        ...mockRestaurant,
        id: `rest${i}`,
        name: `レストラン${i}`,
      }));
      vi.spyOn(sheetsService, "fetchAllMapPoints").mockResolvedValue(largeData);

      const { result } = renderHook(() => useMapPoints());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.mapPoints).toHaveLength(1000);
      expect(result.current.stats.total).toBe(1000);
    });
  });
});
