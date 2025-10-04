import { describe, expect, it } from "vitest";
import {
  getAllDistricts,
  getDistrictFromAddress,
  isValidDistrict,
  normalizeDistrict,
} from "../districtUtils";

describe("districtUtils", () => {
  describe("getDistrictFromAddress", () => {
    it("extracts district from typical address", () => {
      const result = getDistrictFromAddress("新潟県佐渡市両津港123");
      expect(result).toBe("両津");
    });

    it('handles "佐和田" district', () => {
      const result = getDistrictFromAddress("佐渡市佐和田456");
      expect(result).toBe("佐和田");
    });

    it('returns "その他" for unknown address', () => {
      const result = getDistrictFromAddress("未知の住所");
      expect(result).toBe("その他");
    });

    it('handles "相川" district', () => {
      const result = getDistrictFromAddress("佐渡市相川789");
      expect(result).toBe("相川");
    });

    it("handles empty address", () => {
      const result = getDistrictFromAddress("");
      expect(result).toBe("その他");
    });
  });

  describe("normalizeDistrict", () => {
    it("returns exact match for valid district", () => {
      expect(normalizeDistrict("両津")).toBe("両津");
      expect(normalizeDistrict("佐和田")).toBe("佐和田");
      expect(normalizeDistrict("相川")).toBe("相川");
    });

    it("extracts district from partial string", () => {
      expect(normalizeDistrict("新潟県佐渡市両津123")).toBe("両津");
      expect(normalizeDistrict("佐和田区456")).toBe("佐和田");
    });

    it('returns "その他" for unknown input', () => {
      expect(normalizeDistrict("unknown")).toBe("その他");
      expect(normalizeDistrict("")).toBe("その他");
      expect(normalizeDistrict("りょうつ")).toBe("その他"); // No hiragana mapping
    });
  });

  describe("isValidDistrict", () => {
    it("validates known districts", () => {
      expect(isValidDistrict("両津")).toBe(true);
      expect(isValidDistrict("佐和田")).toBe(true);
      expect(isValidDistrict("相川")).toBe(true);
      expect(isValidDistrict("その他")).toBe(true);
    });

    it("rejects invalid districts", () => {
      expect(isValidDistrict("不明な地区")).toBe(false);
      expect(isValidDistrict("")).toBe(false);
    });
  });

  describe("getAllDistricts", () => {
    it("returns all valid districts", () => {
      const districts = getAllDistricts();

      expect(districts).toBeInstanceOf(Array);
      expect(districts.length).toBeGreaterThan(0);
      expect(districts).toContain("両津");
      expect(districts).toContain("佐和田");
      expect(districts).toContain("相川");
    });

    it("returns readonly array (type-level immutability)", () => {
      const districts = getAllDistricts();
      // TypeScript readonly, not Object.freeze
      expect(Array.isArray(districts)).toBe(true);
    });
  });
});
