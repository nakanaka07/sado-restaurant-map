/**
 * @fileoverview hooks/map barrel export test
 */

import { describe, expect, it } from "vitest";
import * as mapHooks from "../index";

describe("hooks/map barrel exports", () => {
  it("should export useMapPoints", () => {
    expect(mapHooks).toHaveProperty("useMapPoints");
    expect(typeof mapHooks.useMapPoints).toBe("function");
  });
});
