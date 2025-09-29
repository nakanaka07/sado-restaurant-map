import { deriveMarkerType, type ABTestVariant } from "@/config/abTestConfig";
import { describe, expect, test } from "vitest";

describe("deriveMarkerType", () => {
  const cases: Array<[ABTestVariant, string]> = [
    ["original", "original"],
    ["enhanced-png", "enhanced-png"],
    ["svg", "svg"],
    ["phase4-enhanced", "circular-icooon"],
    ["testing", "svg"],
  ];
  test.each(cases)("%s -> %s", (variant, expected) => {
    expect(deriveMarkerType(variant)).toBe(expected);
  });
});
