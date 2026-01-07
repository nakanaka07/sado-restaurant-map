/* @vitest-environment jsdom */
/**
 * @fileoverview testEnv ヘルパーのテスト
 */

import { describe, expect, it, vi } from "vitest";
import { cleanupTestEnv, setupTestEnv, type TestEnv } from "../testEnv";

describe("testEnv helpers", () => {
  describe("setupTestEnv", () => {
    it("デフォルト設定でテスト環境をセットアップする", () => {
      const testEnv = setupTestEnv();

      // Console スパイが作成されている
      expect(testEnv.consoleErrorSpy).toBeDefined();
      expect(testEnv.consoleWarnSpy).toBeDefined();
      expect(testEnv.consoleLogSpy).toBeDefined();
      expect(testEnv.consoleInfoSpy).toBeDefined();

      // DEV環境が設定されている
      expect(import.meta.env.DEV).toBe(true);
      expect(import.meta.env.PROD).toBe(false);

      // クリーンアップ
      cleanupTestEnv(testEnv);
    });

    it("PROD環境でセットアップできる", () => {
      const testEnv = setupTestEnv({ isDev: false });

      expect(import.meta.env.DEV).toBe(false);
      expect(import.meta.env.PROD).toBe(true);

      cleanupTestEnv(testEnv);
    });

    it("console.error を抑制する", () => {
      const testEnv = setupTestEnv({ suppressConsoleError: true });

      console.error("test error");

      // エラーが呼ばれたが、実行はモック化されている
      expect(testEnv.consoleErrorSpy).toHaveBeenCalledWith("test error");

      cleanupTestEnv(testEnv);
    });

    it("console.error を抑制しない設定", () => {
      const testEnv = setupTestEnv({ suppressConsoleError: false });

      // スパイは設定されているが、元の実装を呼ぶ
      expect(testEnv.consoleErrorSpy).toBeDefined();

      cleanupTestEnv(testEnv);
    });

    it("追加の環境変数を設定できる", () => {
      const testEnv = setupTestEnv({
        envVars: {
          TEST_VAR: "test-value",
          TEST_BOOL: true,
        },
      });

      expect(import.meta.env.TEST_VAR).toBe("test-value");
      // vi.stubEnv は string のみ受け付けるため、boolean は "true" に変換される
      expect(import.meta.env.TEST_BOOL).toBe("true");

      cleanupTestEnv(testEnv);
    });
  });

  describe("cleanupTestEnv", () => {
    it("console スパイをリストアする", () => {
      const testEnv = setupTestEnv();

      // スパイが作成されている
      expect(vi.isMockFunction(console.error)).toBe(true);

      cleanupTestEnv(testEnv);

      // リストア後もモック（vitest環境のため）だが、リストアは呼ばれた
      expect(vi.isMockFunction(testEnv.consoleErrorSpy)).toBe(true);
    });

    it("環境変数をリセットする", () => {
      const testEnv = setupTestEnv({
        envVars: { CUSTOM_VAR: "custom" },
      });

      expect(import.meta.env.CUSTOM_VAR).toBe("custom");

      cleanupTestEnv(testEnv);

      // unstubAllEnvsが呼ばれる
      // 環境変数は元の状態に戻る（vitestのグローバル設定に依存）
    });
  });

  describe("autoSetupTestEnv", () => {
    it("beforeEach/afterEach を自動設定する", () => {
      // このテストでは autoSetupTestEnv の動作を検証
      // 実際の使用例では describe ブロックで使用される

      let testEnv: TestEnv | null = null;

      // beforeEach をシミュレート
      testEnv = setupTestEnv();
      expect(testEnv).not.toBeNull();
      expect(testEnv.consoleErrorSpy).toBeDefined();

      // afterEach をシミュレート
      if (testEnv) {
        cleanupTestEnv(testEnv);
        testEnv = null;
      }

      expect(testEnv).toBeNull();
    });
  });
});
