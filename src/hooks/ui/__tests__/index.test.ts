/**
 * @fileoverview hooks/ui barrel export test
 */

import { describe, expect, it } from "vitest";
import * as uiHooks from "../index";

describe("hooks/ui barrel exports", () => {
  it("should export useErrorHandler", () => {
    expect(uiHooks).toHaveProperty("useErrorHandler");
    expect(typeof uiHooks.useErrorHandler).toBe("function");
  });

  it("should export useAnalytics", () => {
    expect(uiHooks).toHaveProperty("useAnalytics");
    expect(typeof uiHooks.useAnalytics).toBe("function");
  });
});
