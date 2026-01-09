/**
 * @fileoverview useAppInitialization Hook Tests
 *
 * テスト対象:
 * - APIキーバリデーション
 * - 初期化フロー
 * - エラーハンドリング
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { useAppInitialization } from "../useAppInitialization";

// ==============================
// Mocks
// ==============================

// @/utils のモック
vi.mock("@/utils", () => ({
  initGA: vi.fn(() => Promise.resolve()),
  checkGAStatus: vi.fn(() => Promise.resolve()),
  initializeDevLogging: vi.fn(),
}));

// securityUtils のモック
vi.mock("@/utils/securityUtils", () => ({
  validateApiKey: vi.fn((key: string | undefined) => !!key && key.length > 0),
}));

describe("useAppInitialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // requestIdleCallbackのモック
    vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
      cb();
      return 1;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("初期化成功", () => {
    it("有効なAPIキーで正常に初期化される", async () => {
      const { result } = renderHook(() =>
        useAppInitialization({ apiKey: "valid-api-key" })
      );

      // 初期状態
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.appError).toBe(null);

      // 初期化完了を待機
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.appError).toBe(null);
    });

    it("setAppError関数が正しく動作する", async () => {
      const { result } = renderHook(() =>
        useAppInitialization({ apiKey: "valid-api-key" })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // エラー設定
      act(() => {
        result.current.setAppError("Test error");
      });

      expect(result.current.appError).toBe("Test error");
    });
  });

  describe("初期化失敗", () => {
    it("無効なAPIキーでエラーを返す", async () => {
      // validateApiKeyがfalseを返すようにモック
      const { validateApiKey } = await import("@/utils/securityUtils");
      (validateApiKey as Mock).mockReturnValue(false);

      const { result } = renderHook(() => useAppInitialization({ apiKey: "" }));

      await waitFor(() => {
        expect(result.current.appError).toBe("無効なGoogle Maps APIキーです");
      });

      expect(result.current.isInitialized).toBe(false);
    });

    it("undefinedのAPIキーでエラーを返す", async () => {
      const { validateApiKey } = await import("@/utils/securityUtils");
      (validateApiKey as Mock).mockReturnValue(false);

      const { result } = renderHook(() =>
        useAppInitialization({ apiKey: undefined })
      );

      await waitFor(() => {
        expect(result.current.appError).toBe("無効なGoogle Maps APIキーです");
      });
    });
  });

  describe("GA初期化", () => {
    it("initGAが呼び出される", async () => {
      const { validateApiKey } = await import("@/utils/securityUtils");
      (validateApiKey as Mock).mockReturnValue(true);

      const { initGA } = await import("@/utils");

      renderHook(() => useAppInitialization({ apiKey: "valid-api-key" }));

      await waitFor(
        () => {
          expect(initGA).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it("initGA失敗時もアプリ初期化は継続", async () => {
      const { validateApiKey } = await import("@/utils/securityUtils");
      (validateApiKey as Mock).mockReturnValue(true);

      const { initGA } = await import("@/utils");
      (initGA as Mock).mockRejectedValue(new Error("GA Error"));

      const { result } = renderHook(() =>
        useAppInitialization({ apiKey: "valid-api-key" })
      );

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true);
        },
        { timeout: 3000 }
      );
    });
  });

  describe("開発環境ログ", () => {
    it("initializeDevLoggingが呼び出される", async () => {
      const { initializeDevLogging } = await import("@/utils");

      renderHook(() => useAppInitialization({ apiKey: "valid-api-key" }));

      await waitFor(() => {
        expect(initializeDevLogging).toHaveBeenCalled();
      });
    });
  });
});
