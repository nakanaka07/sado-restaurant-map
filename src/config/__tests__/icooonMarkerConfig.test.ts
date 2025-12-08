/**
 * @fileoverview icooonMarkerConfig basic validation test
 */

import { describe, expect, it } from "vitest";
import { ICOOON_MARKER_CONFIGS } from "../icooonMarkerConfig";

describe("icooonMarkerConfig", () => {
  it("should export ICOOON_MARKER_CONFIGS", () => {
    expect(ICOOON_MARKER_CONFIGS).toBeDefined();
    expect(typeof ICOOON_MARKER_CONFIGS).toBe("object");
  });

  it("should have japanese category", () => {
    expect(ICOOON_MARKER_CONFIGS.japanese).toBeDefined();
    expect(ICOOON_MARKER_CONFIGS.japanese.category).toBe("japanese");
  });

  it("should have general category", () => {
    expect(ICOOON_MARKER_CONFIGS.general).toBeDefined();
    expect(ICOOON_MARKER_CONFIGS.general.category).toBe("general");
  });

  it("should have parking category", () => {
    expect(ICOOON_MARKER_CONFIGS.parking).toBeDefined();
    expect(ICOOON_MARKER_CONFIGS.parking.category).toBe("parking");
  });

  it("should have toilet category", () => {
    expect(ICOOON_MARKER_CONFIGS.toilet).toBeDefined();
    expect(ICOOON_MARKER_CONFIGS.toilet.category).toBe("toilet");
  });
});
