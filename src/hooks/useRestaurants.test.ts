import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRestaurants } from "../hooks/useRestaurants";

describe("useRestaurants Hook", () => {
  it("should initialize with mock data", () => {
    const { result } = renderHook(() => useRestaurants());

    expect(result.current.restaurants).toHaveLength(4);
    expect(result.current.filteredRestaurants).toHaveLength(4);
    expect(result.current.selectedRestaurant).toBeNull();
    expect(result.current.asyncState.loading).toBe(false);
  });

  it("should filter restaurants by cuisine type", () => {
    const { result } = renderHook(() => useRestaurants());

    act(() => {
      result.current.setFilters({ cuisineTypes: ["寿司"] });
    });

    expect(result.current.filteredRestaurants).toHaveLength(1);
    expect(result.current.filteredRestaurants[0].name).toBe("寿司処 金峰");
  });

  it("should filter restaurants by price range", () => {
    const { result } = renderHook(() => useRestaurants());

    act(() => {
      result.current.setFilters({ priceRanges: ["～1000円"] });
    });

    expect(result.current.filteredRestaurants).toHaveLength(1);
    expect(result.current.filteredRestaurants[0].name).toBe("佐渡カフェ");
  });

  it("should search restaurants by name", () => {
    const { result } = renderHook(() => useRestaurants());

    act(() => {
      result.current.setFilters({ searchQuery: "金太" });
    });

    expect(result.current.filteredRestaurants).toHaveLength(1);
    expect(result.current.filteredRestaurants[0].name).toBe("海鮮市場 金太");
  });

  it("should combine multiple filters", () => {
    const { result } = renderHook(() => useRestaurants());

    act(() => {
      result.current.setFilters({
        cuisineTypes: ["カフェ・喫茶店"],
        features: ["Wi-Fiあり"],
      });
    });

    expect(result.current.filteredRestaurants).toHaveLength(1);
    expect(result.current.filteredRestaurants[0].name).toBe("佐渡カフェ");
  });

  it("should sort restaurants by name", () => {
    const { result } = renderHook(() => useRestaurants());

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

  it("should sort restaurants by rating", () => {
    const { result } = renderHook(() => useRestaurants());

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
