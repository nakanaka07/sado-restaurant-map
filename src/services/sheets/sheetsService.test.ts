import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchRestaurantsFromSheets,
  fetchParkingsFromSheets,
  fetchToiletsFromSheets,
  fetchAllMapPoints,
  SheetsApiError,
} from "./sheetsService";

// Global fetch をモック
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Google Sheets API連携テスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 環境変数をセット
    process.env.VITE_GOOGLE_SHEETS_API_KEY = "test-api-key";
    process.env.VITE_RESTAURANT_SHEET_ID = "test-sheet-id";
  });

  describe("fetchRestaurantsFromSheets", () => {
    it("正常にレストランデータを取得できるべき", async () => {
      const mockResponse = {
        values: [
          ["Header Row"], // ヘッダー行をスキップ
          [
            "1",
            "海鮮市場 金太",
            "佐渡の新鮮な海の幸を味わえる海鮮料理店",
            "海鮮",
            "2000-3000円",
            "両津",
            "新潟県佐渡市両津湊119",
            "0259-27-5938",
            "38.018611",
            "138.367222",
            "4.2",
            "85",
            "月-日,11:00-21:00",
            "駐車場あり,団体利用可",
            "2025-07-10",
          ],
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchRestaurantsFromSheets();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "1",
        name: "海鮮市場 金太",
        description: "佐渡の新鮮な海の幸を味わえる海鮮料理店",
        cuisineType: "海鮮",
        priceRange: "2000-3000円",
        district: "両津",
        address: "新潟県佐渡市両津湊119",
        phone: "0259-27-5938",
        coordinates: { lat: 38.018611, lng: 138.367222 },
        rating: 4.2,
        reviewCount: 85,
      });
    });

    it("APIエラーが発生した場合にSheetsApiErrorをスローするべき", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              error: {
                code: 403,
                message: "Requests from referer <empty> are blocked.",
                status: "PERMISSION_DENIED",
              },
            })
          ),
      });

      await expect(fetchRestaurantsFromSheets()).rejects.toThrow(
        SheetsApiError
      );
      await expect(fetchRestaurantsFromSheets()).rejects.toThrow(
        "Google Sheets API request failed: 403 Forbidden"
      );
    });

    it("ネットワークエラーが発生した場合にエラーをスローするべき", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetchRestaurantsFromSheets()).rejects.toThrow(
        "Network error"
      );
    });

    it("不正なデータ形式の場合にエラーをスローするべき", async () => {
      const mockResponse = {
        values: [
          ["Header Row"],
          [
            "1",
            "テストレストラン",
            // 必要なフィールドが不足
          ],
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await expect(fetchRestaurantsFromSheets()).rejects.toThrow();
    });

    it("空のデータが返された場合に空配列を返すべき", async () => {
      const mockResponse = {
        values: [["Header Row"]], // ヘッダーのみ
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchRestaurantsFromSheets();
      expect(result).toEqual([]);
    });
  });

  describe("fetchParkingsFromSheets", () => {
    it("正常に駐車場データを取得できるべき", async () => {
      const mockResponse = {
        values: [
          ["Header Row"],
          [
            "p1",
            "両津港駐車場",
            "両津港の駐車場",
            "両津",
            "新潟県佐渡市両津湊",
            "38.018611",
            "138.367222",
            "50",
            "無料",
            "9:00-18:00",
            "大型車対応",
            "2025-07-10",
          ],
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchParkingsFromSheets();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "p1",
        type: "parking",
        name: "両津港駐車場",
        district: "両津",
        coordinates: { lat: 38.018611, lng: 138.367222 },
        capacity: 50,
        fee: "無料",
      });
    });
  });

  describe("fetchToiletsFromSheets", () => {
    it("正常に公衆トイレデータを取得できるべき", async () => {
      const mockResponse = {
        values: [
          ["Header Row"],
          [
            "t1",
            "両津港公衆トイレ",
            "両津港の公衆トイレ",
            "両津",
            "新潟県佐渡市両津湊",
            "38.018611",
            "138.367222",
            "9:00-18:00",
            "車椅子対応,おむつ交換台",
            "2025-07-10",
          ],
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchToiletsFromSheets();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "t1",
        type: "toilet",
        name: "両津港公衆トイレ",
        district: "両津",
        coordinates: { lat: 38.018611, lng: 138.367222 },
      });
    });
  });

  describe("fetchAllMapPoints", () => {
    it("全てのマップポイントを統合して取得できるべき", async () => {
      // レストランデータのモック
      const restaurantResponse = {
        values: [
          ["Header"],
          [
            "r1",
            "テストレストラン",
            "説明",
            "日本料理",
            "2000-3000円",
            "両津",
            "住所",
            "電話",
            "38.0",
            "138.0",
            "4.5",
            "100",
            "営業時間",
            "特徴",
            "2025-07-10",
          ],
        ],
      };

      // 駐車場データのモック
      const parkingResponse = {
        values: [
          ["Header"],
          [
            "p1",
            "テスト駐車場",
            "説明",
            "両津",
            "住所",
            "38.0",
            "138.0",
            "30",
            "無料",
            "営業時間",
            "特徴",
            "2025-07-10",
          ],
        ],
      };

      // トイレデータのモック
      const toiletResponse = {
        values: [
          ["Header"],
          [
            "t1",
            "テストトイレ",
            "説明",
            "両津",
            "住所",
            "38.0",
            "138.0",
            "営業時間",
            "特徴",
            "2025-07-10",
          ],
        ],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(restaurantResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(parkingResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(toiletResponse),
        });

      const result = await fetchAllMapPoints();

      expect(result).toHaveLength(3);
      expect(result.find((p) => p.type === "restaurant")).toBeDefined();
      expect(result.find((p) => p.type === "parking")).toBeDefined();
      expect(result.find((p) => p.type === "toilet")).toBeDefined();
    });

    it("一部のAPIが失敗した場合でも成功したデータを返すべき", async () => {
      // レストランは成功
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              values: [
                ["Header"],
                [
                  "r1",
                  "テストレストラン",
                  "説明",
                  "日本料理",
                  "2000-3000円",
                  "両津",
                  "住所",
                  "電話",
                  "38.0",
                  "138.0",
                  "4.5",
                  "100",
                  "営業時間",
                  "特徴",
                  "2025-07-10",
                ],
              ],
            }),
        })
        // 駐車場は失敗
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve("Internal Server Error"),
        })
        // トイレは成功
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              values: [
                ["Header"],
                [
                  "t1",
                  "テストトイレ",
                  "説明",
                  "両津",
                  "住所",
                  "38.0",
                  "138.0",
                  "営業時間",
                  "特徴",
                  "2025-07-10",
                ],
              ],
            }),
        });

      const result = await fetchAllMapPoints();

      expect(result).toHaveLength(2);
      expect(result.find((p) => p.type === "restaurant")).toBeDefined();
      expect(result.find((p) => p.type === "toilet")).toBeDefined();
      expect(result.find((p) => p.type === "parking")).toBeUndefined();
    });
  });

  describe("SheetsApiError", () => {
    it("カスタムエラークラスが正しく動作するべき", () => {
      const error = new SheetsApiError("Test error", 403);

      expect(error.name).toBe("SheetsApiError");
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(403);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("レート制限とリトライ", () => {
    it("リトライ可能なエラーの場合にリトライするべき", async () => {
      // 最初の2回は429エラー、3回目は成功
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve("Too Many Requests"),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve("Too Many Requests"),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              values: [
                ["Header"],
                [
                  "1",
                  "テストレストラン",
                  "説明",
                  "日本料理",
                  "2000-3000円",
                  "両津",
                  "住所",
                  "電話",
                  "38.0",
                  "138.0",
                  "4.5",
                  "100",
                  "営業時間",
                  "特徴",
                  "2025-07-10",
                ],
              ],
            }),
        });

      const result = await fetchRestaurantsFromSheets();

      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
