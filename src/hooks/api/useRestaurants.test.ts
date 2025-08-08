/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// localStorage モックをグローバルスコープで設定
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
};

// グローバルlocalStorageモック
const localStorageMock = createLocalStorageMock();

// Vitestのグローバル設定として localStorage を定義
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// windowオブジェクトにも設定
if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

// sheetsService をモック
vi.mock("@/services", () => ({
  fetchRestaurantsFromSheets: vi.fn().mockResolvedValue([
    {
      id: "1",
      type: "restaurant",
      name: "海鮮市場 金太",
      description: "佐渡の新鮮な海の幸を味わえる海鮮料理店",
      cuisineType: "海鮮",
      priceRange: "2000-3000円",
      district: "両津",
      address: "新潟県佐渡市両津湊119",
      phone: "0259-27-5938",
      coordinates: { lat: 38.018611, lng: 138.367222 },
      rating: 4.2,
      reviewCount: 85,
      openingHours: [
        { day: "月-日", open: "11:00", close: "21:00", isHoliday: false },
      ],
      features: ["駐車場あり", "団体利用可", "個室あり"],
      lastUpdated: "2025-07-10",
    },
    {
      id: "2",
      type: "restaurant",
      name: "そば処 竹の子",
      description: "佐渡の水で打つ手打ちそばが自慢",
      cuisineType: "そば・うどん",
      priceRange: "1000-2000円",
      district: "小木",
      address: "新潟県佐渡市小木町1956",
      coordinates: { lat: 37.9, lng: 138.25 },
      rating: 4.5,
      reviewCount: 123,
      openingHours: [
        { day: "火-日", open: "11:30", close: "20:00", isHoliday: false },
        { day: "月", open: "", close: "", isHoliday: true },
      ],
      features: ["テラス席", "禁煙", "手打ちそば", "テイクアウト可"],
      lastUpdated: "2025-07-10",
    },
    {
      id: "3",
      type: "restaurant",
      name: "佐渡カフェ",
      description: "佐渡の絶景を眺めながらゆったりできるカフェ",
      cuisineType: "カフェ・喫茶店",
      priceRange: "～1000円",
      district: "両津",
      address: "新潟県佐渡市両津夷269-1",
      phone: "0259-23-4567",
      coordinates: { lat: 38.05, lng: 138.38 },
      rating: 4.3,
      reviewCount: 67,
      openingHours: [
        { day: "月-日", open: "9:00", close: "18:00", isHoliday: false },
      ],
      features: [
        "Wi-Fiあり",
        "テラス席",
        "駐車場あり",
        "禁煙",
        "テイクアウト可",
      ],
      lastUpdated: "2025-07-10",
    },
    {
      id: "4",
      type: "restaurant",
      name: "寿司処 金峰",
      description: "佐渡近海の新鮮なネタが自慢の老舗寿司店",
      cuisineType: "寿司",
      priceRange: "3000円～",
      district: "相川",
      address: "新潟県佐渡市相川下戸村358",
      phone: "0259-74-2109",
      coordinates: { lat: 38.03, lng: 138.23 },
      rating: 4.6,
      reviewCount: 142,
      openingHours: [
        { day: "火-日", open: "17:00", close: "22:00", isHoliday: false },
        { day: "月", open: "", close: "", isHoliday: true },
      ],
      features: ["カウンター席", "個室あり", "予約可能"],
      lastUpdated: "2025-07-10",
    },
  ]),
  checkDataFreshness: vi.fn().mockResolvedValue({ needsUpdate: false }),
  SheetsApiError: class extends Error {
    status: number;
    constructor(message: string, status: number = 500) {
      super(message);
      this.status = status;
    }
  },
}));

// useRestaurants をインポート（モック設定後）
import { useRestaurants } from "./useRestaurants";

describe("useRestaurants Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // localStorage をクリア（モック関数もリセット）
    localStorageMock.clear();
    vi.clearAllMocks(); // vi.fn() のモックもクリア
  });
  it("should initialize with mock data", async () => {
    const { result } = renderHook(() => useRestaurants());

    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(result.current.asyncState.loading).toBe(false);
    });

    expect(result.current.restaurants).toHaveLength(4);
    expect(result.current.filteredRestaurants).toHaveLength(4);
    expect(result.current.selectedRestaurant).toBeNull();
    expect(result.current.asyncState.loading).toBe(false);
  });

  it("should filter restaurants by cuisine type", async () => {
    const { result } = renderHook(() => useRestaurants());

    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(result.current.asyncState.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ cuisineTypes: ["寿司"] });
    });

    expect(result.current.filteredRestaurants).toHaveLength(1);
    expect(result.current.filteredRestaurants[0].name).toBe("寿司処 金峰");
  });

  it("should filter restaurants by price range", async () => {
    const { result } = renderHook(() => useRestaurants());

    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(result.current.asyncState.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ priceRanges: ["～1000円"] });
    });

    expect(result.current.filteredRestaurants).toHaveLength(1);
    expect(result.current.filteredRestaurants[0].name).toBe("佐渡カフェ");
  });

  it("should search restaurants by name", async () => {
    const { result } = renderHook(() => useRestaurants());

    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(result.current.asyncState.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ searchQuery: "金太" });
    });

    expect(result.current.filteredRestaurants).toHaveLength(1);
    expect(result.current.filteredRestaurants[0].name).toBe("海鮮市場 金太");
  });

  it("should combine multiple filters", async () => {
    const { result } = renderHook(() => useRestaurants());

    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(result.current.asyncState.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({
        cuisineTypes: ["カフェ・喫茶店"],
        features: ["Wi-Fiあり"],
      });
    });

    expect(result.current.filteredRestaurants).toHaveLength(1);
    expect(result.current.filteredRestaurants[0].name).toBe("佐渡カフェ");
  });

  it("should sort restaurants by name", async () => {
    const { result } = renderHook(() => useRestaurants());

    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(result.current.asyncState.loading).toBe(false);
    });

    act(() => {
      result.current.setSortOrder("name");
    });

    const names = result.current.filteredRestaurants.map((r) => r.name);
    expect(names).toEqual([
      "そば処 竹の子",
      "海鮮市場 金太",
      "佐渡カフェ",
      "寿司処 金峰",
    ]);
  });

  it("should sort restaurants by rating", async () => {
    const { result } = renderHook(() => useRestaurants());

    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(result.current.asyncState.loading).toBe(false);
    });

    act(() => {
      result.current.setSortOrder("rating");
    });

    const ratings = result.current.filteredRestaurants
      .map((r) => r.rating)
      .filter((rating): rating is number => rating !== undefined);

    if (ratings.length > 1) {
      expect(ratings[0]).toBeGreaterThanOrEqual(ratings[1]);
    }
  });
});
