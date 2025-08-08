import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMapPoints } from "./useMapPoints";

// Mock the sheets service
vi.mock("../../services", () => ({
  fetchAllMapPoints: vi.fn().mockResolvedValue([]),
}));

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
});
