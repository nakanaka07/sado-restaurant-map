import { deriveMarkerType, type ABTestVariant } from "@/config/abTestConfig";
import { describe, expect, test } from "vitest";

describe("deriveMarkerType", () => {
  const cases: Array<[ABTestVariant, string]> = [
    ["original", "circular-icooon"],
    ["enhanced-png", "circular-icooon"],
    ["svg", "circular-icooon"],
    ["phase4-enhanced", "circular-icooon"],
    ["testing", "circular-icooon"],
  ];
  test.each(cases)("%s -> %s", (variant, expected) => {
    expect(deriveMarkerType(variant)).toBe(expected);
  });
});
