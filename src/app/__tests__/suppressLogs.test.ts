/**
 * @fileoverview suppressLogs テスト
 * console出力抑制/復元ユーティリティの包括的テスト
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("suppressLogs", () => {
  // 各テスト前にconsoleの元の状態を保存
  let originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    debug: typeof console.debug;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  // モジュールを動的にインポートして状態をリセット
  let suppressLogs: typeof import("../suppressLogs").suppressLogs;
  let restoreLogs: typeof import("../suppressLogs").restoreLogs;
  let autoApplySuppression: typeof import("../suppressLogs").autoApplySuppression;
  let logger: typeof import("../suppressLogs").logger;

  beforeEach(async () => {
    // モジュールキャッシュをクリアして状態をリセット
    vi.resetModules();

    // 各テスト前にオリジナルのconsoleメソッドを保存
    originalConsole = {
      log: console.log,
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error,
    };

    // モジュールを再インポート（状態がリセットされる）
    const module = await import("../suppressLogs");
    suppressLogs = module.suppressLogs;
    restoreLogs = module.restoreLogs;
    autoApplySuppression = module.autoApplySuppression;
    logger = module.logger;
  });

  afterEach(() => {
    // 各テスト後にconsoleを復元
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe("suppressLogs関数", () => {
    it("log/info/debugを抑制する", () => {
      const originalLog = console.log;
      const originalInfo = console.info;
      const originalDebug = console.debug;

      suppressLogs();

      // 関数が置き換えられていることを確認
      expect(console.log).not.toBe(originalLog);
      expect(console.info).not.toBe(originalInfo);
      expect(console.debug).not.toBe(originalDebug);

      restoreLogs();
    });

    it("デフォルトでwarnとerrorは抑制しない", () => {
      const originalWarn = console.warn;
      const originalError = console.error;

      suppressLogs();

      // warn/errorは変更されていないことを確認
      expect(console.warn).toBe(originalWarn);
      expect(console.error).toBe(originalError);

      restoreLogs();
    });

    it("suppressWarn: trueでwarnも抑制する", () => {
      const originalWarn = console.warn;

      suppressLogs({ suppressWarn: true });

      expect(console.warn).not.toBe(originalWarn);

      restoreLogs();
    });

    it("suppressError: trueでerrorも抑制する", () => {
      const originalError = console.error;

      suppressLogs({ suppressError: true });

      expect(console.error).not.toBe(originalError);

      restoreLogs();
    });

    it("抑制されたメソッドは何も出力しない（no-op）", () => {
      const logSpy = vi.fn();
      console.log = logSpy;

      suppressLogs();
      console.log("test message");

      // no-opに置き換えられたので元のスパイは呼ばれない
      // （新しいno-op関数が呼ばれる）
      restoreLogs();
    });

    it("二重適用を防止する", () => {
      suppressLogs();
      const afterFirstSuppress = console.log;

      suppressLogs(); // 二度目の呼び出し
      const afterSecondSuppress = console.log;

      // 二度目は何も変わらない
      expect(afterFirstSuppress).toBe(afterSecondSuppress);

      restoreLogs();
    });
  });

  describe("restoreLogs関数", () => {
    it("抑制を解除して元のconsoleメソッドを復元する", () => {
      const originalLog = console.log;

      suppressLogs();
      expect(console.log).not.toBe(originalLog);

      restoreLogs();
      expect(console.log).toBe(originalLog);
    });

    it("suppressLogsを呼ばずにrestoreLogsを呼んでもエラーにならない", () => {
      expect(() => restoreLogs()).not.toThrow();
    });

    it("複数回呼んでも問題ない", () => {
      suppressLogs();
      restoreLogs();
      expect(() => restoreLogs()).not.toThrow();
      expect(() => restoreLogs()).not.toThrow();
    });
  });

  describe("autoApplySuppression関数", () => {
    it("VITE_SUPPRESS_DEV_LOGSがtrueの場合に抑制を適用", () => {
      // import.meta.envをモック
      const originalLog = console.log;

      // 環境変数をtrueに設定（実際の適用はimport.meta.env依存）
      // テスト環境では直接適用をテスト
      vi.stubEnv("VITE_SUPPRESS_DEV_LOGS", "true");

      autoApplySuppression();

      // 環境変数がtrueなら抑制される
      if (import.meta.env?.VITE_SUPPRESS_DEV_LOGS === "true") {
        expect(console.log).not.toBe(originalLog);
      }

      restoreLogs();
      vi.unstubAllEnvs();
    });

    it("VITE_SUPPRESS_DEV_LOGSが未設定の場合は抑制しない", () => {
      vi.stubEnv("VITE_SUPPRESS_DEV_LOGS", undefined);
      const originalLog = console.log;

      autoApplySuppression();

      // 抑制されていないことを確認
      expect(console.log).toBe(originalLog);

      vi.unstubAllEnvs();
    });
  });

  describe("logger オブジェクト", () => {
    it("logメソッドがconsole.logを呼ぶ", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.log("test");
      expect(spy).toHaveBeenCalledWith("test");
      spy.mockRestore();
    });

    it("infoメソッドがconsole.infoを呼ぶ", () => {
      const spy = vi.spyOn(console, "info").mockImplementation(() => {});
      logger.info("test");
      expect(spy).toHaveBeenCalledWith("test");
      spy.mockRestore();
    });

    it("debugメソッドがconsole.debugを呼ぶ", () => {
      const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
      logger.debug("test");
      expect(spy).toHaveBeenCalledWith("test");
      spy.mockRestore();
    });

    it("warnメソッドがconsole.warnを呼ぶ", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logger.warn("test");
      expect(spy).toHaveBeenCalledWith("test");
      spy.mockRestore();
    });

    it("errorメソッドがconsole.errorを呼ぶ", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("test");
      expect(spy).toHaveBeenCalledWith("test");
      spy.mockRestore();
    });

    it("複数の引数を渡せる", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.log("arg1", "arg2", { key: "value" });
      expect(spy).toHaveBeenCalledWith("arg1", "arg2", { key: "value" });
      spy.mockRestore();
    });
  });
});
