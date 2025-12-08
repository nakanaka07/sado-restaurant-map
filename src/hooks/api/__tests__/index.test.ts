/**
 * @fileoverview hooks/api barrel export test
 */

import { describe, expect, it } from "vitest";
import * as apiHooks from "../index";

describe("hooks/api barrel exports", () => {
  it("should export useRestaurants", () => {
    expect(apiHooks).toHaveProperty("useRestaurants");
    expect(typeof apiHooks.useRestaurants).toBe("function");
  });
});
