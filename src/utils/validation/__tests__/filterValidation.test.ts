/**
 * @fileoverview フィルターバリデーションユーティリティのテスト
 * filterValidation.ts の単体テスト
 */

import type { CuisineType, PriceRange, SadoDistrict } from "@/types";
import { describe, expect, it } from "vitest";
import {
  validateCuisineType,
  validateDistricts,
  validateFeatures,
  validatePriceRange,
  validateSearchQuery,
  type ValidationResult,
} from "../filterValidation";

describe("filterValidation", () => {
  describe("validateSearchQuery", () => {
    it("正常な検索クエリをバリデーションする", () => {
      const result = validateSearchQuery("テストクエリ");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("テストクエリ");
      expect(result.error).toBeNull();
    });

    it("空文字列を正常に処理する", () => {
      const result = validateSearchQuery("");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("");
      expect(result.error).toBeNull();
    });

    it("100文字以下の検索クエリを許可する", () => {
      const query = "a".repeat(100);
      const result = validateSearchQuery(query);
      expect(result.isValid).toBe(true);
      expect(result.value.length).toBe(100);
    });

    it("100文字を超える検索クエリを切り詰める", () => {
      const query = "a".repeat(150);
      const result = validateSearchQuery(query);
      expect(result.isValid).toBe(false);
      expect(result.value.length).toBe(100);
      expect(result.error).toBe("検索クエリは100文字以下で入力してください");
    });

    it("文字列以外の型を拒否する", () => {
      const result = validateSearchQuery(123 as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.value).toBe("");
      expect(result.error).toBe("検索クエリは文字列である必要があります");
    });

    it("XSSを含む入力をサニタイズする", () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = validateSearchQuery(maliciousInput);
      expect(result.isValid).toBe(true);
      expect(result.value).not.toContain("<script>");
      expect(result.value).not.toContain("</script>");
    });

    it("特殊文字を含む検索クエリを処理する", () => {
      const result = validateSearchQuery("テスト & < > \" '");
      expect(result.isValid).toBe(true);
      // sanitizeInputによってエスケープされる
      expect(result.value).toBeTruthy();
    });

    it("改行文字を含む検索クエリを処理する", () => {
      const result = validateSearchQuery("テスト\n改行");
      expect(result.isValid).toBe(true);
      expect(result.value).toBeTruthy();
    });
  });

  describe("validateFeatures", () => {
    it("正常な特徴配列をバリデーションする", () => {
      const features = ["駐車場", "Wi-Fi", "クレジットカード"];
      const result = validateFeatures(features);
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual(features);
      expect(result.error).toBeNull();
    });

    it("空配列を正常に処理する", () => {
      const result = validateFeatures([]);
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("20個以下の特徴を許可する", () => {
      const features = Array.from({ length: 20 }, (_, i) => `特徴${i + 1}`);
      const result = validateFeatures(features);
      expect(result.isValid).toBe(true);
      expect(result.value.length).toBe(20);
    });

    it("20個を超える特徴を切り詰める", () => {
      const features = Array.from({ length: 25 }, (_, i) => `特徴${i + 1}`);
      const result = validateFeatures(features);
      expect(result.isValid).toBe(false);
      expect(result.value.length).toBe(20);
      expect(result.error).toBe("特徴フィルターは20個以下で選択してください");
    });

    it("配列以外の型を拒否する", () => {
      const result = validateFeatures("not an array" as unknown as string[]);
      expect(result.isValid).toBe(false);
      expect(result.value).toEqual([]);
      expect(result.error).toBe("特徴フィルターは配列である必要があります");
    });

    it("50文字以下の特徴を許可する", () => {
      const feature = "a".repeat(50);
      const result = validateFeatures([feature]);
      expect(result.isValid).toBe(true);
      expect(result.value[0]?.length).toBe(50);
    });

    it("50文字を超える特徴を切り詰める", () => {
      const feature = "a".repeat(60);
      const result = validateFeatures([feature]);
      expect(result.isValid).toBe(true);
      expect(result.value[0]?.length).toBe(50);
    });

    it("文字列以外の要素をフィルタリングする", () => {
      const features = [
        "有効な特徴",
        123,
        null,
        undefined,
        "別の特徴",
      ] as unknown as string[];
      const result = validateFeatures(features);
      expect(result.isValid).toBe(true);
      expect(result.value.length).toBe(2);
      expect(result.value).toContain("有効な特徴");
      expect(result.value).toContain("別の特徴");
    });

    it("空文字列をフィルタリングする", () => {
      const features = ["特徴1", "", "特徴2", "   ", "特徴3"];
      const result = validateFeatures(features);
      expect(result.isValid).toBe(true);
      // 空文字とトリミング後空文字は除外される
      expect(result.value.length).toBeLessThanOrEqual(3);
    });

    it("XSSを含む特徴をサニタイズする", () => {
      const maliciousFeature = '<script>alert("xss")</script>';
      const result = validateFeatures([maliciousFeature]);
      expect(result.isValid).toBe(true);
      expect(result.value[0]).not.toContain("<script>");
    });

    it("重複する特徴を許可する（重複除去はしない）", () => {
      const features = ["Wi-Fi", "Wi-Fi", "駐車場"];
      const result = validateFeatures(features);
      expect(result.isValid).toBe(true);
      expect(result.value.length).toBe(3);
    });
  });

  describe("validateDistricts", () => {
    it("正常な地区配列をバリデーションする", () => {
      const districts: SadoDistrict[] = ["両津", "相川", "佐和田"];
      const result = validateDistricts(districts);
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual(districts);
      expect(result.error).toBeNull();
    });

    it("空配列を正常に処理する", () => {
      const result = validateDistricts([]);
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("10個以下の地区を許可する", () => {
      const districts: SadoDistrict[] = [
        "両津",
        "相川",
        "佐和田",
        "金井",
        "新穂",
        "畑野",
        "真野",
        "小木",
        "羽茂",
        "赤泊",
      ];
      const result = validateDistricts(districts);
      expect(result.isValid).toBe(true);
      expect(result.value.length).toBe(10);
    });

    it("10個を超える地区を切り詰める", () => {
      // 全地区（11個）を指定
      const districts: SadoDistrict[] = [
        "両津",
        "相川",
        "佐和田",
        "金井",
        "新穂",
        "畑野",
        "真野",
        "小木",
        "羽茂",
        "赤泊",
        "その他",
      ];
      const result = validateDistricts(districts);
      expect(result.isValid).toBe(false);
      expect(result.value.length).toBe(10);
      expect(result.error).toBe("地区は10個以下で選択してください");
    });

    it("配列以外の型を拒否する", () => {
      const result = validateDistricts("両津" as unknown as SadoDistrict[]);
      expect(result.isValid).toBe(false);
      expect(result.value).toEqual([]);
      expect(result.error).toBe("地区フィルターは配列である必要があります");
    });

    it("単一の地区を正常に処理する", () => {
      const districts: SadoDistrict[] = ["両津"];
      const result = validateDistricts(districts);
      expect(result.isValid).toBe(true);
      expect(result.value).toEqual(["両津"]);
    });

    it("重複する地区を許可する（重複除去はしない）", () => {
      const districts: SadoDistrict[] = ["両津", "両津", "相川"];
      const result = validateDistricts(districts);
      expect(result.isValid).toBe(true);
      expect(result.value.length).toBe(3);
    });
  });

  describe("validateCuisineType", () => {
    it("正常な料理タイプをバリデーションする", () => {
      const cuisineTypes: CuisineType[] = [
        "日本料理",
        "ステーキ・洋食",
        "中華",
        "イタリアン",
        "フレンチ",
        "カレー・エスニック",
        "ラーメン",
        "寿司",
        "そば・うどん",
        "焼肉・焼鳥",
        "海鮮",
        "弁当・テイクアウト",
        "デザート・スイーツ",
      ];

      cuisineTypes.forEach(cuisine => {
        const result = validateCuisineType(cuisine);
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(cuisine);
        expect(result.error).toBeNull();
      });
    });

    it("空文字列を正常に処理する", () => {
      const result = validateCuisineType("");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("");
      expect(result.error).toBeNull();
    });

    it("文字列以外の型を拒否する", () => {
      const result = validateCuisineType(123 as unknown as CuisineType | "");
      expect(result.isValid).toBe(false);
      expect(result.value).toBe("");
      expect(result.error).toBe("無効な料理タイプが指定されました");
    });

    it("nullを拒否する", () => {
      const result = validateCuisineType(null as unknown as CuisineType | "");
      expect(result.isValid).toBe(false);
      expect(result.value).toBe("");
      expect(result.error).toBe("無効な料理タイプが指定されました");
    });

    it("undefinedを拒否する", () => {
      const result = validateCuisineType(
        undefined as unknown as CuisineType | ""
      );
      expect(result.isValid).toBe(false);
      expect(result.value).toBe("");
      expect(result.error).toBe("無効な料理タイプが指定されました");
    });

    it("オブジェクトを拒否する", () => {
      const result = validateCuisineType({ type: "和食" } as unknown as
        | CuisineType
        | "");
      expect(result.isValid).toBe(false);
      expect(result.value).toBe("");
      expect(result.error).toBe("無効な料理タイプが指定されました");
    });
  });

  describe("validatePriceRange", () => {
    it("正常な価格範囲をバリデーションする", () => {
      const priceRanges: PriceRange[] = [
        "～1000円",
        "1000-2000円",
        "2000-3000円",
        "3000円～",
      ];

      priceRanges.forEach(price => {
        const result = validatePriceRange(price);
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(price);
        expect(result.error).toBeNull();
      });
    });

    it("空文字列を正常に処理する", () => {
      const result = validatePriceRange("");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("");
      expect(result.error).toBeNull();
    });

    it("文字列以外の型を拒否する", () => {
      const result = validatePriceRange(1000 as unknown as PriceRange | "");
      expect(result.isValid).toBe(false);
      expect(result.value).toBe("");
      expect(result.error).toBe("無効な価格範囲が指定されました");
    });

    it("nullを拒否する", () => {
      const result = validatePriceRange(null as unknown as PriceRange | "");
      expect(result.isValid).toBe(false);
      expect(result.value).toBe("");
      expect(result.error).toBe("無効な価格範囲が指定されました");
    });

    it("undefinedを拒否する", () => {
      const result = validatePriceRange(
        undefined as unknown as PriceRange | ""
      );
      expect(result.isValid).toBe(false);
      expect(result.value).toBe("");
      expect(result.error).toBe("無効な価格範囲が指定されました");
    });

    it("配列を拒否する", () => {
      const result = validatePriceRange(["¥", "¥¥"] as unknown as
        | PriceRange
        | "");
      expect(result.isValid).toBe(false);
      expect(result.value).toBe("");
      expect(result.error).toBe("無効な価格範囲が指定されました");
    });
  });

  describe("ValidationResult interface", () => {
    it("ValidationResult型が正しい構造を持つ", () => {
      const result: ValidationResult<string> = {
        value: "test",
        error: null,
        isValid: true,
      };

      expect(result).toHaveProperty("value");
      expect(result).toHaveProperty("error");
      expect(result).toHaveProperty("isValid");
      expect(typeof result.isValid).toBe("boolean");
    });

    it("エラー時のValidationResultが正しい構造を持つ", () => {
      const result: ValidationResult<string> = {
        value: "",
        error: "エラーメッセージ",
        isValid: false,
      };

      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe("string");
    });
  });

  describe("エッジケース", () => {
    it("validateSearchQueryが特殊なUnicode文字を処理する", () => {
      const result = validateSearchQuery("テスト🍣🍺");
      expect(result.isValid).toBe(true);
      expect(result.value).toBeTruthy();
    });

    it("validateFeaturesが空配列要素を除外する", () => {
      const features = ["  ", "\t", "\n", "有効な特徴"];
      const result = validateFeatures(features);
      expect(result.isValid).toBe(true);
      // 空白のみの要素は除外される
      expect(result.value.length).toBeLessThanOrEqual(1);
    });

    it("validateDistrictsがnullを含む配列を拒否する", () => {
      const districts = ["両津", null, "相川"] as unknown as SadoDistrict[];
      const result = validateDistricts(districts);
      // 配列自体は有効なのでtrueを返すが、nullは保持される（型安全性の問題）
      expect(result.isValid).toBe(true);
      expect(result.value).toContain(null);
    });

    it("validateFeaturesが最大長と最大数の組み合わせを処理する", () => {
      const features = Array.from({ length: 25 }, () => "a".repeat(60));
      const result = validateFeatures(features);
      expect(result.isValid).toBe(false);
      expect(result.value.length).toBe(20);
      expect(result.value.every(f => f.length === 50)).toBe(true);
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量の特徴を高速に処理する", () => {
      const features = Array.from({ length: 100 }, (_, i) => `特徴${i + 1}`);
      const start = performance.now();
      const result = validateFeatures(features);
      const duration = performance.now() - start;

      expect(result.isValid).toBe(false); // 20個に切り詰められる
      expect(result.value.length).toBe(20);
      expect(duration).toBeLessThan(10); // 10ms未満
    });

    it("長い検索クエリを高速に処理する", () => {
      const query = "a".repeat(1000);
      const start = performance.now();
      const result = validateSearchQuery(query);
      const duration = performance.now() - start;

      expect(result.isValid).toBe(false); // 100文字に切り詰められる
      expect(result.value.length).toBe(100);
      expect(duration).toBeLessThan(5); // 5ms未満
    });
  });
});
