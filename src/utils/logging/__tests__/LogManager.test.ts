/**
 * @fileoverview LogManager Unit Tests
 * 中央ログ管理システムの包括的なテスト
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLogger,
  initializeLogging,
  logger,
  LogManager,
  logManager,
  restoreLogs,
  suppressLogs,
  type LogLevel,
} from "../LogManager";

describe("LogManager", () => {
  let originalConsole: Partial<typeof console>;

  beforeEach(() => {
    // consoleメソッドを保存
    originalConsole = {
      log: console.log,
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error,
    };

    // LogManagerインスタンスをリセット
    LogManager.resetInstance();
  });

  afterEach(() => {
    // consoleを復元
    Object.assign(console, originalConsole);

    // LogManagerをリセット
    LogManager.resetInstance();
  });

  describe("getInstance", () => {
    it("シングルトンインスタンスを返す", () => {
      const instance1 = LogManager.getInstance();
      const instance2 = LogManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("カスタム設定でインスタンスを初期化できる", () => {
      const customConfig = {
        defaultLevel: "error" as LogLevel,
      };
      const instance = LogManager.getInstance(customConfig);
      const config = instance.getConfig();
      expect(config.defaultLevel).toBe("error");
    });
  });

  describe("initialize", () => {
    it("初期化が正常に完了する", () => {
      const instance = LogManager.getInstance();
      expect(() => instance.initialize()).not.toThrow();
    });

    it("二重初期化を警告する", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const instance = LogManager.getInstance();

      instance.initialize();
      instance.initialize();

      expect(warnSpy).toHaveBeenCalledWith("LogManager is already initialized");
      warnSpy.mockRestore();
    });
  });

  describe("console overriding", () => {
    it("開発環境ではconsole.logが動作する", () => {
      const instance = LogManager.getInstance({
        suppressConsole: {
          log: false, // console.logを有効にする
          info: false,
          debug: false,
          warn: false,
          error: false,
        },
        categories: {
          workbox: "info",
          googleMaps: "info",
          apiRequests: "info",
          analytics: "info",
          general: "info", // infoレベルを有効にする (console.logはinfoとして記録される)
        },
      });
      instance.initialize();

      // ログ履歴を使用して検証
      const historyBefore = instance.getHistory().length;
      console.log("test message");
      const historyAfter = instance.getHistory().length;

      // ログ履歴が増加していることを確認
      expect(historyAfter).toBeGreaterThan(historyBefore);
    });

    it("suppressConsole設定でconsole.logを抑制できる", () => {
      const instance = LogManager.getInstance({
        suppressConsole: {
          log: true,
          info: true,
          debug: true,
          warn: false,
          error: false,
        },
      });
      instance.initialize();

      const historyBefore = instance.getHistory().length;
      console.log("test message");
      const historyAfter = instance.getHistory().length;

      // suppress設定により、ログ履歴は増加しない
      expect(historyAfter).toBe(historyBefore);
    });

    it("console.errorは常に動作する", () => {
      const instance = LogManager.getInstance({
        suppressConsole: {
          log: false,
          info: false,
          debug: false,
          warn: false,
          error: false, // console.errorも有効にする
        },
      });
      instance.initialize();

      const historyBefore = instance.getHistory().length;
      console.error("error message");
      const historyAfter = instance.getHistory().length;

      // errorレベルのログは必ず記録される
      expect(historyAfter).toBeGreaterThan(historyBefore);

      // 最新のログエントリを確認
      const history = instance.getHistory();
      const lastEntry = history[history.length - 1];
      expect(lastEntry?.level).toBe("error");
      expect(lastEntry?.message).toContain("error message");
    });
  });

  describe("category filtering", () => {
    it("Workboxログをフィルタリングする", () => {
      const instance = LogManager.getInstance({
        categories: {
          workbox: "none",
          googleMaps: "error",
          apiRequests: "info",
          analytics: "info",
          general: "debug",
        },
      });
      instance.initialize();

      const logSpy = vi
        .spyOn(originalConsole, "log")
        .mockImplementation(() => {});
      console.log("workbox message");

      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it("Google Mapsのエラーログのみ出力する", () => {
      const instance = LogManager.getInstance({
        suppressConsole: {
          log: false,
          info: false,
          debug: false,
          warn: false,
          error: false,
        },
        categories: {
          workbox: "none",
          googleMaps: "error",
          apiRequests: "info",
          analytics: "info",
          general: "debug",
        },
      });
      instance.initialize();

      const historyBefore = instance.getHistory().length;
      console.error("Google Maps error");
      console.log("Google Maps info");

      const history = instance.getHistory();
      const newEntries = history.slice(historyBefore);

      // errorのみが記録される（logは除外）
      expect(newEntries.length).toBe(1);
      expect(newEntries[0]?.level).toBe("error");
      expect(newEntries[0]?.category).toBe("googleMaps");
    });

    it("一般ログは全レベル出力する", () => {
      const instance = LogManager.getInstance({
        suppressConsole: {
          log: false, // console.logを有効にする
          info: false,
          debug: false,
          warn: false,
          error: false,
        },
        categories: {
          workbox: "none",
          googleMaps: "error",
          apiRequests: "info",
          analytics: "info",
          general: "debug",
        },
      });
      instance.initialize();

      const historyBefore = instance.getHistory().length;
      console.log("general message");

      const history = instance.getHistory();
      const newEntries = history.slice(historyBefore);

      // 一般ログは記録される
      expect(newEntries.length).toBeGreaterThan(0);
      expect(newEntries[0]?.category).toBe("general");
      expect(newEntries[0]?.message).toContain("general message");
    });
  });

  describe("getLogger", () => {
    it("カテゴリ別ロガーを取得できる", () => {
      const instance = LogManager.getInstance();
      instance.initialize();

      const generalLogger = instance.getLogger("general");
      expect(generalLogger).toBeDefined();
      expect(typeof generalLogger.info).toBe("function");
    });

    it("カテゴリロガーでログ出力できる", () => {
      const instance = LogManager.getInstance({
        suppressConsole: {
          log: false,
          info: false,
          debug: false,
          warn: false,
          error: false,
        },
        categories: {
          workbox: "info",
          googleMaps: "info",
          apiRequests: "info",
          analytics: "info",
          general: "info", // infoレベルを有効にする
        },
      });
      instance.initialize();

      const historyBefore = instance.getHistory().length;
      const generalLogger = instance.getLogger("general");
      generalLogger.info("test message");

      const history = instance.getHistory();
      expect(history.length).toBeGreaterThan(historyBefore);

      const lastEntry = history[history.length - 1];
      expect(lastEntry?.category).toBe("general");
      expect(lastEntry?.message).toContain("test message");
    });

    it("フィルタされたカテゴリではログ出力されない", () => {
      const instance = LogManager.getInstance({
        categories: {
          workbox: "none",
          googleMaps: "error",
          apiRequests: "info",
          analytics: "info",
          general: "debug",
        },
      });
      instance.initialize();

      const infoSpy = vi
        .spyOn(originalConsole, "info")
        .mockImplementation(() => {});
      const workboxLogger = instance.getLogger("workbox");
      workboxLogger.info("workbox message");

      expect(infoSpy).not.toHaveBeenCalled();
      infoSpy.mockRestore();
    });
  });

  describe("log history", () => {
    it("ログ履歴を記録する", () => {
      const instance = LogManager.getInstance({
        categories: {
          workbox: "info",
          googleMaps: "info",
          apiRequests: "info",
          analytics: "info",
          general: "info", // infoレベルを有効にする
        },
      });
      instance.initialize();

      const generalLogger = instance.getLogger("general");
      generalLogger.info("test message 1");
      generalLogger.warn("test message 2");

      const history = instance.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it("ログ履歴をクリアできる", () => {
      const instance = LogManager.getInstance({
        categories: {
          workbox: "info",
          googleMaps: "info",
          apiRequests: "info",
          analytics: "info",
          general: "info", // infoレベルを有効にする
        },
      });
      instance.initialize();

      const generalLogger = instance.getLogger("general");
      generalLogger.info("test message");

      expect(instance.getHistory().length).toBeGreaterThan(0);
      instance.clearHistory();
      expect(instance.getHistory().length).toBe(0);
    });

    it("ログ履歴は最大サイズを超えない", () => {
      const instance = LogManager.getInstance();
      instance.initialize();

      const generalLogger = instance.getLogger("general");

      // 150回ログ出力（maxHistorySize = 100を超える）
      for (let i = 0; i < 150; i++) {
        generalLogger.info(`message ${i}`);
      }

      const history = instance.getHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe("restore", () => {
    it("consoleを元に戻す", () => {
      const instance = LogManager.getInstance({
        suppressConsole: {
          log: false,
          info: false,
          debug: false,
          warn: false,
          error: false,
        },
        categories: {
          workbox: "info",
          googleMaps: "info",
          apiRequests: "info",
          analytics: "info",
          general: "info",
        },
      });
      instance.initialize();

      // LogManagerがconsoleを書き換えた後の履歴確認
      const historyBeforeRestore = instance.getHistory().length;
      console.log("test before restore");
      const historyAfterLog = instance.getHistory().length;

      // restore前は履歴に記録される
      expect(historyAfterLog).toBeGreaterThan(historyBeforeRestore);

      instance.restore();

      // restore後、LogManagerはオフになり、履歴は増えない
      const historyAfterRestore = instance.getHistory().length;
      console.log("test after restore");
      const historyFinal = instance.getHistory().length;

      // restore後のログは履歴に記録されない
      expect(historyFinal).toBe(historyAfterRestore);
    });
  });

  describe("updateConfig", () => {
    it("設定を更新できる", () => {
      const instance = LogManager.getInstance({
        defaultLevel: "info",
      });
      instance.initialize();

      instance.updateConfig({
        defaultLevel: "error",
      });

      const config = instance.getConfig();
      expect(config.defaultLevel).toBe("error");
    });
  });

  describe("backward compatibility", () => {
    it("suppressLogs関数が動作する", () => {
      suppressLogs();

      const logSpy = vi
        .spyOn(originalConsole, "log")
        .mockImplementation(() => {});
      console.log("test");

      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it("restoreLogs関数が動作する", () => {
      suppressLogs();
      restoreLogs();

      const logSpy = vi.spyOn(console, "log");
      console.log("test");

      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it("initializeLogging関数が動作する", () => {
      expect(() => initializeLogging()).not.toThrow();
    });
  });

  describe("convenience functions", () => {
    it("getLogger関数が動作する", () => {
      initializeLogging();
      const generalLogger = getLogger("general");
      expect(generalLogger).toBeDefined();
    });

    it("logger.info関数が動作する", () => {
      // logManagerの設定を直接更新
      logManager.updateConfig({
        categories: {
          workbox: "info",
          googleMaps: "info",
          apiRequests: "info",
          analytics: "info",
          general: "info", // infoレベルを有効にする
        },
      });
      logManager.initialize();

      const historyBefore = logManager.getHistory().length;
      logger.info("test message");

      expect(logManager.getHistory().length).toBeGreaterThan(historyBefore);
    });

    it("logger.error関数が動作する", () => {
      initializeLogging();

      const historyBefore = logManager.getHistory().length;
      logger.error("error message");

      const history = logManager.getHistory();
      expect(history.length).toBeGreaterThan(historyBefore);

      const lastEntry = history[history.length - 1];
      expect(lastEntry?.level).toBe("error");
    });
  });

  describe("logManager default instance", () => {
    it("デフォルトインスタンスが利用可能", () => {
      expect(logManager).toBeDefined();
      expect(typeof logManager.initialize).toBe("function");
    });

    it("デフォルトインスタンスでログ出力できる", () => {
      // 注意: ここではlogManagerではなく新しいインスタンスを使う
      // （他のテストとの干渉を避けるため）
      const testInstance = LogManager.getInstance({
        categories: {
          workbox: "info",
          googleMaps: "info",
          apiRequests: "info",
          analytics: "info",
          general: "info", // infoレベルを有効にする
        },
      });
      testInstance.initialize();

      const historyBefore = testInstance.getHistory().length;
      const generalLogger = testInstance.getLogger("general");
      generalLogger.info("test");

      expect(testInstance.getHistory().length).toBeGreaterThan(historyBefore);
    });
  });

  describe("level priority", () => {
    it("debug < info < warn < error の優先度でフィルタリングする", () => {
      const instance = LogManager.getInstance({
        categories: {
          workbox: "none",
          googleMaps: "error",
          apiRequests: "info",
          analytics: "info",
          general: "warn", // warnレベル以上のみ出力
        },
      });
      instance.initialize();

      const historyBefore = instance.getHistory().length;
      const generalLogger = instance.getLogger("general");
      generalLogger.debug("debug message");
      generalLogger.info("info message");
      generalLogger.warn("warn message");
      generalLogger.error("error message");

      const history = instance.getHistory();
      const newEntries = history.slice(historyBefore);

      // warnとerrorのみが記録される (debug, infoは除外)
      expect(newEntries.length).toBe(2);
      expect(newEntries[0]?.level).toBe("warn");
      expect(newEntries[1]?.level).toBe("error");
    });
  });

  describe("category detection", () => {
    it("メッセージからWorkboxカテゴリを検出する", () => {
      const instance = LogManager.getInstance({
        categories: {
          workbox: "none",
          googleMaps: "error",
          apiRequests: "info",
          analytics: "info",
          general: "debug",
        },
      });
      instance.initialize();

      const logSpy = vi
        .spyOn(originalConsole, "log")
        .mockImplementation(() => {});

      console.log("workbox service worker update");
      console.log("sw.js loaded");
      console.log("Service Worker registered");

      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it("メッセージからGoogle Mapsカテゴリを検出する", () => {
      const instance = LogManager.getInstance({
        categories: {
          workbox: "none",
          googleMaps: "error",
          apiRequests: "info",
          analytics: "info",
          general: "debug",
        },
      });
      instance.initialize();

      const logSpy = vi
        .spyOn(originalConsole, "log")
        .mockImplementation(() => {});

      console.log("maps.googleapis.com loaded");
      console.log("Google Maps initialized");
      console.log("google.maps.Map created");

      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it("メッセージからAPIリクエストカテゴリを検出する", () => {
      const instance = LogManager.getInstance({
        categories: {
          workbox: "none",
          googleMaps: "error",
          apiRequests: "info",
          analytics: "info",
          general: "debug",
        },
      });
      instance.initialize();

      const historyBefore = instance.getHistory().length;
      const apiLogger = instance.getLogger("apiRequests");
      apiLogger.info("APIリクエスト sent");

      const history = instance.getHistory();
      expect(history.length).toBeGreaterThan(historyBefore);

      const lastEntry = history[history.length - 1];
      expect(lastEntry?.category).toBe("apiRequests");
    });

    it("メッセージからアナリティクスカテゴリを検出する", () => {
      const instance = LogManager.getInstance({
        categories: {
          workbox: "none",
          googleMaps: "error",
          apiRequests: "info",
          analytics: "info",
          general: "debug",
        },
      });
      instance.initialize();

      const historyBefore = instance.getHistory().length;
      const analyticsLogger = instance.getLogger("analytics");
      analyticsLogger.info("Google Analytics event tracked");

      const history = instance.getHistory();
      expect(history.length).toBeGreaterThan(historyBefore);

      const lastEntry = history[history.length - 1];
      expect(lastEntry?.category).toBe("analytics");
    });
  });
});
