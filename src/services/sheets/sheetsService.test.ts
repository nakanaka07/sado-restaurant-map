import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 環境変数を事前にセット（モジュール読み込み前）
vi.stubEnv("VITE_GOOGLE_SHEETS_API_KEY", "test-api-key");
vi.stubEnv("VITE_SPREADSHEET_ID", "test-sheet-id");

// vi.mockを無効化して実際の関数をテストする
vi.unmock("./sheetsService");

import {
  fetchAllMapPoints,
  fetchParkingsFromSheets,
  fetchRestaurantsFromSheets,
  fetchToiletsFromSheets,
  SheetsApiError,
} from "./sheetsService";

// Global fetch をモック
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Google Sheets API連携テスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 環境変数を再セット（念のため）
    vi.stubEnv("VITE_GOOGLE_SHEETS_API_KEY", "test-api-key");
    vi.stubEnv("VITE_SPREADSHEET_ID", "test-sheet-id");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // 環境変数はグローバルに設定しているので、個別にunstubしない
  });

  describe("fetchRestaurantsFromSheets", () => {
    it("正常にレストランデータを取得できるべき", async () => {
      const mockResponse = {
        values: [
          ["Header Row"], // ヘッダー行をスキップ
          [
            "1",
            "海鮮市場 金太",
            "新潟県佐渡市両津湊119",
            "38.018611",
            "138.367222",
            "4.2",
            "85",
            "Open",
            "月-日: 11:00–21:00",
            "0259-27-5938",
            "",
            "2",
            "海鮮料理",
            "佐渡の新鮮な海の幸を味わえる海鮮料理店",
            "true",
            "false",
            "true",
            "false",
            "false",
            "false",
            "true",
            "true",
            "false",
            "false",
            "false",
            "false",
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
        address: "新潟県佐渡市両津湊119",
        cuisineType: "海鮮",
        type: "restaurant",
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
      // 実際のエラーメッセージパターンに合わせる
      await expect(fetchRestaurantsFromSheets()).rejects.toThrow(
        /Google Sheets API request failed|Restaurant data fetch failed/
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
            // 必要なフィールドが不足（5フィールド未満）
          ],
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await expect(fetchRestaurantsFromSheets()).rejects.toThrow(
        "No valid restaurant data could be parsed"
      );
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
            "新潟県佐渡市両津湊",
            "38.018611",
            "138.367222",
            "駐車場",
            "公共駐車場",
            "Open",
            "両津港の公共駐車場",
            "新潟県佐渡市両津湊119",
            "9:00-18:00",
            "車椅子対応",
            "現金",
            "無料",
            "あり",
            "4.0",
            "20",
            "両津",
            "https://maps.google.com/",
            "手動",
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
        coordinates: { lat: 38.018611, lng: 138.367222 },
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
            "新潟県佐渡市両津湊",
            "38.018611",
            "138.367222",
            "公衆トイレ",
            "バリアフリートイレ",
            "Open",
            "両津港の公衆トイレ",
            "新潟県佐渡市両津湊119",
            "9:00-18:00",
            "車椅子対応",
            "おむつ交換台",
            "駐車場併設",
            "4.0",
            "15",
            "両津",
            "https://maps.google.com/",
            "手動",
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
            "新潟県佐渡市両津",
            "38.0",
            "138.0",
            "4.5",
            "100",
            "Open",
            "営業時間",
            "電話",
            "",
            "2",
            "日本料理",
            "説明",
            "true",
            "false",
            "true",
            "false",
            "false",
            "false",
            "true",
            "true",
            "false",
            "false",
            "false",
            "false",
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
            "新潟県佐渡市両津",
            "38.0",
            "138.0",
            "駐車場",
            "公共駐車場",
            "Open",
            "説明",
            "住所",
            "営業時間",
            "バリアフリー",
            "現金",
            "無料",
            "特徴",
            "4.0",
            "10",
            "両津",
            "URL",
            "方法",
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
            "新潟県佐渡市両津",
            "38.0",
            "138.0",
            "公衆トイレ",
            "バリアフリートイレ",
            "Open",
            "説明",
            "住所",
            "営業時間",
            "バリアフリー",
            "子供対応",
            "駐車場",
            "4.0",
            "5",
            "両津",
            "URL",
            "方法",
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
                  "新潟県佐渡市両津",
                  "38.0",
                  "138.0",
                  "4.5",
                  "100",
                  "Open",
                  "営業時間",
                  "電話",
                  "",
                  "2",
                  "日本料理",
                  "説明",
                  "true",
                  "false",
                  "true",
                  "false",
                  "false",
                  "false",
                  "true",
                  "true",
                  "false",
                  "false",
                  "false",
                  "false",
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
                  "新潟県佐渡市両津",
                  "38.0",
                  "138.0",
                  "公衆トイレ",
                  "バリアフリートイレ",
                  "Open",
                  "説明",
                  "住所",
                  "営業時間",
                  "バリアフリー",
                  "子供対応",
                  "駐車場",
                  "4.0",
                  "5",
                  "両津",
                  "URL",
                  "方法",
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
    it("429エラーの場合はSheetsApiErrorをスローするべき", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve("Too Many Requests"),
      });

      await expect(fetchRestaurantsFromSheets()).rejects.toThrow(
        SheetsApiError
      );
      // 実際のエラーメッセージパターンに合わせる
      await expect(fetchRestaurantsFromSheets()).rejects.toThrow(
        /Google Sheets API request failed|Restaurant data fetch failed/
      );
    });
  });
});
