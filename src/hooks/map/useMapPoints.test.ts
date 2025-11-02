import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMapPoints } from "./useMapPoints";

// Mock the sheets service
vi.mock("../../services", () => {
  class MockSheetsApiError extends Error {
    status: number;
    response?: unknown;
    constructor(message: string, status: number = 500) {
      super(message);
      this.name = "SheetsApiError";
      this.status = status;
    }
  }

  return {
    fetchAllMapPoints: vi.fn().mockResolvedValue([]),
    SheetsApiError: MockSheetsApiError,
  };
});

describe("useMapPoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初回レンダリング時にローディング状態を返すべき", () => {
    const { result } = renderHook(() => useMapPoints());

    expect(result.current.mapPoints).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it("正常にデータを取得できるべき", async () => {
    const mockData = [
      {
        id: "1",
        type: "restaurant" as const,
        name: "テストレストラン",
        description: "テスト",
        cuisineType: "日本料理" as const,
        priceRange: "1000-2000円" as const,
        district: "両津" as const,
        address: "テスト住所",
        coordinates: { lat: 38.0, lng: 138.0 },
        openingHours: [] as const,
        features: [] as const,
        lastUpdated: "2025-01-07",
      },
    ];

    const { fetchAllMapPoints } = await import("../../services");
    vi.mocked(fetchAllMapPoints).mockResolvedValue(mockData);

    const { result } = renderHook(() => useMapPoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.mapPoints).toEqual(mockData);
    expect(result.current.error).toBe(null);
  });

  it("統計情報が正しく計算されるべき", async () => {
    const mockData = [
      {
        id: "1",
        type: "restaurant" as const,
        name: "レストラン1",
        description: "テスト",
        cuisineType: "日本料理" as const,
        priceRange: "1000-2000円" as const,
        district: "両津" as const,
        address: "テスト住所",
        coordinates: { lat: 38.0, lng: 138.0 },
        openingHours: [] as const,
        features: [] as const,
        lastUpdated: "2025-01-07",
      },
      {
        id: "2",
        type: "parking" as const,
        name: "駐車場1",
        description: "テスト駐車場",
        address: "テスト住所2",
        coordinates: { lat: 38.1, lng: 138.1 },
        capacity: 10,
        district: "両津" as const,
        lastUpdated: "2025-01-07",
      },
      {
        id: "3",
        type: "toilet" as const,
        name: "トイレ1",
        description: "テストトイレ",
        address: "テスト住所3",
        coordinates: { lat: 38.2, lng: 138.2 },
        district: "両津" as const,
        lastUpdated: "2025-01-07",
      },
    ];

    const { fetchAllMapPoints } = await import("../../services");
    vi.mocked(fetchAllMapPoints).mockResolvedValue(mockData);

    const { result } = renderHook(() => useMapPoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.restaurants).toBe(1);
    expect(result.current.stats.parkings).toBe(1);
    expect(result.current.stats.toilets).toBe(1);
  });

  it("フィルターが正しく適用されるべき", async () => {
    const mockData = [
      {
        id: "1",
        type: "restaurant" as const,
        name: "和食レストラン",
        description: "テスト",
        cuisineType: "日本料理" as const,
        priceRange: "1000-2000円" as const,
        district: "両津" as const,
        address: "テスト住所",
        coordinates: { lat: 38.0, lng: 138.0 },
        openingHours: [] as const,
        features: [] as const,
        lastUpdated: "2025-01-07",
      },
      {
        id: "2",
        type: "restaurant" as const,
        name: "イタリアンレストラン",
        description: "テスト",
        cuisineType: "イタリアン" as const,
        priceRange: "2000-3000円" as const,
        district: "相川" as const,
        address: "テスト住所2",
        coordinates: { lat: 38.1, lng: 138.1 },
        openingHours: [] as const,
        features: [] as const,
        lastUpdated: "2025-01-07",
      },
    ];

    const { fetchAllMapPoints } = await import("../../services");
    vi.mocked(fetchAllMapPoints).mockResolvedValue(mockData);

    const { result } = renderHook(() => useMapPoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.mapPoints).toHaveLength(2);
  });

  it("エラーが発生した場合に適切にハンドリングされるべき", async () => {
    const { fetchAllMapPoints } = await import("../../services");
    vi.mocked(fetchAllMapPoints).mockRejectedValue(
      new Error("データ取得エラー")
    );

    const { result } = renderHook(() => useMapPoints());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBe(null);
    expect(result.current.mapPoints).toEqual([]);
  });
});
