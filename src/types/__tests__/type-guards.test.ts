/**
 * @fileoverview Type Guards Comprehensive Tests
 * カバレッジ目標: 11.38% → 100%
 *
 * テスト対象:
 * - MapPoint型ガード (isRestaurant, isParking, isToilet)
 * - 型バリデーション (isValidMapPointType, isValidSadoDistrict)
 * - APIエラー型ガード (isApiError, isSheetsApiError)
 * - 座標検証 (isValidLatLng)
 * - 配列型ガード (isNonEmptyArray, isStringArray)
 * - React要素型ガード (isReactElement)
 * - 開発用詳細検証 (validateMapPoint)
 */

import type {
  ApiError,
  MapPoint,
  Parking,
  Restaurant,
  SheetsApiError,
  Toilet,
} from "@/types";
import { RestaurantCategory } from "@/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isApiError,
  isNonEmptyArray,
  isParking,
  isReactElement,
  isRestaurant,
  isSheetsApiError,
  isStringArray,
  isToilet,
  isValidLatLng,
  isValidMapPointType,
  isValidSadoDistrict,
  validateMapPoint,
} from "../type-guards";

// ==============================
// モックデータ
// ==============================

const mockRestaurant: Restaurant = {
  id: "r1",
  type: "restaurant",
  name: "テスト寿司店",
  district: "両津",
  address: "新潟県佐渡市両津",
  coordinates: { lat: 38.0489, lng: 138.4366 },
  features: ["駐車場あり", "カード可"],
  lastUpdated: "2025-11-03",
  cuisineType: "寿司",
  priceRange: "1000-2000円",
  openingHours: [],
  rating: 4.5,
  reviewCount: 120,
  phone: "0259-27-1234",
  website: "https://example.com",
  images: [],
  mainCategory: RestaurantCategory.SUSHI,
};

const mockParking: Parking = {
  id: "p1",
  type: "parking",
  name: "両津港駐車場",
  district: "両津",
  address: "新潟県佐渡市両津",
  coordinates: { lat: 38.0489, lng: 138.4366 },
  features: ["無料", "24時間"],
  lastUpdated: "2025-11-03",
  capacity: 50,
  fee: "無料",
};

const mockToilet: Toilet = {
  id: "t1",
  type: "toilet",
  name: "両津港公衆トイレ",
  district: "両津",
  address: "新潟県佐渡市両津",
  coordinates: { lat: 38.0489, lng: 138.4366 },
  features: ["バリアフリー", "24時間"],
  lastUpdated: "2025-11-03",
};

// ==============================
// MapPoint型ガード
// ==============================

describe("MapPoint Type Guards", () => {
  describe("isRestaurant", () => {
    it("restaurant型を正しく識別する", () => {
      expect(isRestaurant(mockRestaurant)).toBe(true);
    });

    it("parking型をfalseと判定する", () => {
      expect(isRestaurant(mockParking)).toBe(false);
    });

    it("toilet型をfalseと判定する", () => {
      expect(isRestaurant(mockToilet)).toBe(false);
    });
  });

  describe("isParking", () => {
    it("parking型を正しく識別する", () => {
      expect(isParking(mockParking)).toBe(true);
    });

    it("restaurant型をfalseと判定する", () => {
      expect(isParking(mockRestaurant)).toBe(false);
    });

    it("toilet型をfalseと判定する", () => {
      expect(isParking(mockToilet)).toBe(false);
    });
  });

  describe("isToilet", () => {
    it("toilet型を正しく識別する", () => {
      expect(isToilet(mockToilet)).toBe(true);
    });

    it("restaurant型をfalseと判定する", () => {
      expect(isToilet(mockRestaurant)).toBe(false);
    });

    it("parking型をfalseと判定する", () => {
      expect(isToilet(mockParking)).toBe(false);
    });
  });
});

// ==============================
// 型バリデーション
// ==============================

describe("Type Validation", () => {
  describe("isValidMapPointType", () => {
    it("有効な型文字列を正しく判定する", () => {
      expect(isValidMapPointType("restaurant")).toBe(true);
      expect(isValidMapPointType("parking")).toBe(true);
      expect(isValidMapPointType("toilet")).toBe(true);
    });

    it("無効な型文字列をfalseと判定する", () => {
      expect(isValidMapPointType("invalid")).toBe(false);
      expect(isValidMapPointType("")).toBe(false);
      expect(isValidMapPointType("Restaurant")).toBe(false); // 大文字
    });
  });

  describe("isValidSadoDistrict", () => {
    const validDistricts = [
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

    it("全ての有効な地域を正しく判定する", () => {
      validDistricts.forEach(district => {
        expect(isValidSadoDistrict(district)).toBe(true);
      });
    });

    it("無効な地域名をfalseと判定する", () => {
      expect(isValidSadoDistrict("新潟市")).toBe(false);
      expect(isValidSadoDistrict("")).toBe(false);
      expect(isValidSadoDistrict("ryotsu")).toBe(false); // 英語
    });
  });
});

// ==============================
// APIエラー型ガード
// ==============================

describe("API Error Type Guards", () => {
  describe("isApiError", () => {
    it("有効なApiErrorを正しく識別する", () => {
      const error: ApiError = { code: 404, message: "Not Found" };
      expect(isApiError(error)).toBe(true);
    });

    it("完全なApiErrorオブジェクトを識別する", () => {
      const error: ApiError = {
        code: 500,
        message: "Internal Server Error",
        details: { reason: "Database connection failed" },
      };
      expect(isApiError(error)).toBe(true);
    });

    it("標準のErrorオブジェクトをfalseと判定する", () => {
      const error = new Error("Standard error");
      expect(isApiError(error)).toBe(false);
    });

    it("code が文字列の場合はfalseと判定する", () => {
      const error = { code: "404", message: "Not Found" };
      expect(isApiError(error)).toBe(false);
    });

    it("message が欠けている場合はfalseと判定する", () => {
      const error = { code: 404 };
      expect(isApiError(error)).toBe(false);
    });

    it("nullをfalseと判定する", () => {
      expect(isApiError(null)).toBe(false);
    });

    it("undefinedをfalseと判定する", () => {
      expect(isApiError(undefined)).toBe(false);
    });

    it("プリミティブ型をfalseと判定する", () => {
      expect(isApiError("error")).toBe(false);
      expect(isApiError(404)).toBe(false);
      expect(isApiError(true)).toBe(false);
    });
  });

  describe("isSheetsApiError", () => {
    it("有効なSheetsApiErrorを正しく識別する", () => {
      const error: SheetsApiError = {
        error: {
          code: 403,
          message: "API key not valid",
          status: "PERMISSION_DENIED",
        },
      };
      expect(isSheetsApiError(error)).toBe(true);
    });

    it("ネストされたerrorオブジェクトを検証する", () => {
      const error = {
        error: {
          code: 429,
          message: "Rate limit exceeded",
          status: "RESOURCE_EXHAUSTED",
        },
      };
      expect(isSheetsApiError(error)).toBe(true);
    });

    it("errorプロパティが欠けている場合はfalseと判定する", () => {
      const error = { code: 403, message: "Forbidden" };
      expect(isSheetsApiError(error)).toBe(false);
    });

    it("nullをfalseと判定する", () => {
      expect(isSheetsApiError(null)).toBe(false);
    });

    it("undefinedをfalseと判定する", () => {
      expect(isSheetsApiError(undefined)).toBe(false);
    });
  });
});

// ==============================
// 座標・位置情報型ガード
// ==============================

describe("Coordinate Validation", () => {
  describe("isValidLatLng", () => {
    describe("有効な座標", () => {
      it("佐渡島の座標を有効と判定する", () => {
        expect(isValidLatLng({ lat: 38.0489, lng: 138.4366 })).toBe(true);
      });

      it("境界値 - 最小値を有効と判定する", () => {
        expect(isValidLatLng({ lat: -90, lng: -180 })).toBe(true);
      });

      it("境界値 - 最大値を有効と判定する", () => {
        expect(isValidLatLng({ lat: 90, lng: 180 })).toBe(true);
      });

      it("ゼロ座標を有効と判定する", () => {
        expect(isValidLatLng({ lat: 0, lng: 0 })).toBe(true);
      });

      it("小数点を含む座標を有効と判定する", () => {
        expect(isValidLatLng({ lat: 35.123456, lng: 139.987654 })).toBe(true);
      });
    });

    describe("無効な座標", () => {
      it("緯度が範囲外 (下限超過)", () => {
        expect(isValidLatLng({ lat: -90.1, lng: 0 })).toBe(false);
        expect(isValidLatLng({ lat: -91, lng: 0 })).toBe(false);
      });

      it("緯度が範囲外 (上限超過)", () => {
        expect(isValidLatLng({ lat: 90.1, lng: 0 })).toBe(false);
        expect(isValidLatLng({ lat: 91, lng: 0 })).toBe(false);
      });

      it("経度が範囲外 (下限超過)", () => {
        expect(isValidLatLng({ lat: 0, lng: -180.1 })).toBe(false);
        expect(isValidLatLng({ lat: 0, lng: -181 })).toBe(false);
      });

      it("経度が範囲外 (上限超過)", () => {
        expect(isValidLatLng({ lat: 0, lng: 180.1 })).toBe(false);
        expect(isValidLatLng({ lat: 0, lng: 181 })).toBe(false);
      });

      it("NaNを含む座標を無効と判定する", () => {
        expect(isValidLatLng({ lat: NaN, lng: 138.4366 })).toBe(false);
        expect(isValidLatLng({ lat: 38.0489, lng: NaN })).toBe(false);
      });

      it("型が不正な場合は無効と判定する", () => {
        expect(isValidLatLng({ lat: "38.0489", lng: 138.4366 })).toBe(false);
        expect(isValidLatLng({ lat: 38.0489, lng: "138.4366" })).toBe(false);
      });

      it("latプロパティが欠けている場合は無効と判定する", () => {
        expect(isValidLatLng({ lng: 138.4366 } as unknown as LatLng)).toBe(
          false
        );
      });

      it("lngプロパティが欠けている場合は無効と判定する", () => {
        expect(isValidLatLng({ lat: 38.0489 } as unknown as LatLng)).toBe(
          false
        );
      });

      it("nullを無効と判定する", () => {
        expect(isValidLatLng(null)).toBe(false);
      });

      it("undefinedを無効と判定する", () => {
        expect(isValidLatLng(undefined)).toBe(false);
      });

      it("プリミティブ型を無効と判定する", () => {
        expect(isValidLatLng("coordinates")).toBe(false);
        expect(isValidLatLng(123)).toBe(false);
      });

      it("配列を無効と判定する", () => {
        expect(isValidLatLng([38.0489, 138.4366])).toBe(false);
      });
    });
  });
});

// ==============================
// 配列・コレクション型ガード
// ==============================

describe("Array Type Guards", () => {
  describe("isNonEmptyArray", () => {
    it("要素を持つ配列をtrueと判定する", () => {
      expect(isNonEmptyArray([1])).toBe(true);
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
      expect(isNonEmptyArray(["a", "b"])).toBe(true);
    });

    it("空配列をfalseと判定する", () => {
      expect(isNonEmptyArray([])).toBe(false);
    });

    it("配列でない値をfalseと判定する", () => {
      expect(isNonEmptyArray(null as unknown as unknown[])).toBe(false);
      expect(isNonEmptyArray(undefined as unknown as unknown[])).toBe(false);
      expect(isNonEmptyArray("string" as unknown as unknown[])).toBe(false);
      expect(isNonEmptyArray(123 as unknown as unknown[])).toBe(false);
    });
  });

  describe("isStringArray", () => {
    it("文字列配列をtrueと判定する", () => {
      expect(isStringArray(["a", "b", "c"])).toBe(true);
      expect(isStringArray([""])).toBe(true); // 空文字列も許可
      expect(isStringArray([])).toBe(true); // 空配列も許可
    });

    it("混合型配列をfalseと判定する", () => {
      expect(isStringArray(["a", 1])).toBe(false);
      expect(isStringArray(["a", null])).toBe(false);
      expect(isStringArray(["a", undefined])).toBe(false);
    });

    it("数値配列をfalseと判定する", () => {
      expect(isStringArray([1, 2, 3])).toBe(false);
    });

    it("配列でない値をfalseと判定する", () => {
      expect(isStringArray("string")).toBe(false);
      expect(isStringArray(null)).toBe(false);
      expect(isStringArray(undefined)).toBe(false);
    });
  });
});

// ==============================
// React関連型ガード
// ==============================

describe("React Type Guards", () => {
  describe("isReactElement", () => {
    it("React要素をtrueと判定する", () => {
      const element = {
        type: "div",
        props: { children: "test" },
        key: null,
      };
      expect(isReactElement(element)).toBe(true);
    });

    it("typeとpropsを持つオブジェクトをtrueと判定する", () => {
      const element = {
        type: "span",
        props: {},
      };
      expect(isReactElement(element)).toBe(true);
    });

    it("typeが欠けている場合はfalseと判定する", () => {
      const element = { props: {} };
      expect(isReactElement(element)).toBe(false);
    });

    it("propsが欠けている場合はfalseと判定する", () => {
      const element = { type: "div" };
      expect(isReactElement(element)).toBe(false);
    });

    it("nullをfalseと判定する", () => {
      expect(isReactElement(null)).toBe(false);
    });

    it("undefinedをfalseと判定する", () => {
      expect(isReactElement(undefined)).toBe(false);
    });

    it("プリミティブ型をfalseと判定する", () => {
      expect(isReactElement("string")).toBe(false);
      expect(isReactElement(123)).toBe(false);
      expect(isReactElement(true)).toBe(false);
    });
  });
});

// ==============================
// 開発時デバッグ用型ガード
// ==============================

describe("Development Validation", () => {
  describe("validateMapPoint", () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("有効なRestaurantをtrueと判定する", () => {
      expect(validateMapPoint(mockRestaurant)).toBe(true);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("有効なParkingをtrueと判定する", () => {
      expect(validateMapPoint(mockParking)).toBe(true);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("有効なToiletをtrueと判定する", () => {
      expect(validateMapPoint(mockToilet)).toBe(true);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("オブジェクトでない場合は警告を出す", () => {
      expect(validateMapPoint(null)).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "MapPoint validation failed: not an object",
        null
      );
    });

    it("必須フィールドが欠けている場合は警告を出す", () => {
      const invalid = { id: "r1", type: "restaurant" };
      expect(validateMapPoint(invalid)).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('missing field "name"'),
        invalid
      );
    });

    it("無効なtypeの場合は警告を出す", () => {
      const invalid = {
        ...mockRestaurant,
        type: "invalid",
      };
      expect(validateMapPoint(invalid)).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "MapPoint validation failed: invalid type",
        "invalid"
      );
    });

    it("無効なdistrictの場合は警告を出す", () => {
      const invalid = {
        ...mockRestaurant,
        district: "新潟市",
      };
      expect(validateMapPoint(invalid)).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "MapPoint validation failed: invalid district",
        "新潟市"
      );
    });

    it("無効な座標の場合は警告を出す", () => {
      const invalid = {
        ...mockRestaurant,
        coordinates: { lat: 200, lng: 300 },
      };
      expect(validateMapPoint(invalid)).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "MapPoint validation failed: invalid coordinates",
        { lat: 200, lng: 300 }
      );
    });

    it("featuresが文字列配列でない場合は警告を出す", () => {
      const invalid = {
        ...mockRestaurant,
        features: [1, 2, 3],
      };
      expect(validateMapPoint(invalid)).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "MapPoint validation failed: invalid features",
        [1, 2, 3]
      );
    });

    it("複数のフィールド検証を順次実行する", () => {
      // 最初の必須フィールドチェックで失敗するため、他のチェックは実行されない
      const invalid = {};
      expect(validateMapPoint(invalid)).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });
});

// ==============================
// エッジケースと統合テスト
// ==============================

describe("Edge Cases and Integration", () => {
  describe("型ガードの組み合わせ", () => {
    it("isRestaurantとisValidMapPointTypeの組み合わせ", () => {
      const point = mockRestaurant;
      expect(isRestaurant(point)).toBe(true);
      expect(isValidMapPointType(point.type)).toBe(true);
    });

    it("型ガードを使った絞り込み", () => {
      const points: MapPoint[] = [mockRestaurant, mockParking, mockToilet];

      const restaurants = points.filter(isRestaurant);
      const parkings = points.filter(isParking);
      const toilets = points.filter(isToilet);

      expect(restaurants).toHaveLength(1);
      expect(parkings).toHaveLength(1);
      expect(toilets).toHaveLength(1);
    });
  });

  describe("エラーハンドリングパターン", () => {
    it("APIエラーと通常エラーの区別", () => {
      const apiError: ApiError = { code: 500, message: "Server Error" };
      const standardError = new Error("Standard Error");

      expect(isApiError(apiError)).toBe(true);
      expect(isApiError(standardError)).toBe(false);
    });

    it("SheetsApiErrorの階層構造検証", () => {
      const error: SheetsApiError = {
        error: {
          code: 403,
          message: "Access denied",
          status: "PERMISSION_DENIED",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              reason: "API_KEY_INVALID",
              domain: "googleapis.com",
            },
          ],
        },
      };

      expect(isSheetsApiError(error)).toBe(true);
    });
  });

  describe("パフォーマンス考慮", () => {
    it("大量の座標検証を高速に処理する", () => {
      const coordinates = Array.from({ length: 1000 }, (_, i) => ({
        lat: 38 + i * 0.001,
        lng: 138 + i * 0.001,
      }));

      const start = performance.now();
      coordinates.forEach(coord => isValidLatLng(coord));
      const duration = performance.now() - start;

      // 1000件の検証が100ms以内に完了することを期待
      expect(duration).toBeLessThan(100);
    });
  });
});
