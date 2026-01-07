/**
 * @fileoverview Central Logging Management System
 * suppressLogs.ts, logFilter.ts, analytics.tsの機能を統合した中央ログ管理システム
 *
 * 機能:
 * - 環境別ログレベル制御（dev/prod）
 * - カテゴリ別フィルタリング（Workbox, Google Maps, API等）
 * - アナリティクストラッキング統合
 * - テスト環境でのモック対応
 */

// ========================
// Types & Interfaces
// ========================

/**
 * ログレベル定義
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "none";

/**
 * ログカテゴリ定義
 */
export type LogCategory =
  | "workbox"
  | "googleMaps"
  | "apiRequests"
  | "analytics"
  | "general";

/**
 * 環境別ログ設定
 */
export interface LogConfig {
  /** デフォルトログレベル */
  defaultLevel: LogLevel;
  /** カテゴリ別ログレベル */
  categories: Record<LogCategory, LogLevel>;
  /** consoleメソッドの抑制設定 */
  suppressConsole: {
    log: boolean;
    info: boolean;
    debug: boolean;
    warn: boolean;
    error: boolean;
  };
}

/**
 * ログエントリ
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
}

// ========================
// Default Configurations
// ========================

/**
 * 開発環境デフォルト設定
 */
const DEV_CONFIG: LogConfig = {
  defaultLevel: "debug",
  categories: {
    workbox: "none", // Workboxログを完全無効化
    googleMaps: "error", // Google Mapsは重要なエラーのみ
    apiRequests: "info", // APIリクエストはマスキングして表示
    analytics: "info", // アナリティクスイベント表示
    general: "debug", // 一般的なログは全て表示
  },
  suppressConsole: {
    log: false,
    info: false,
    debug: false,
    warn: false,
    error: false,
  },
};

/**
 * 本番環境デフォルト設定
 */
const PROD_CONFIG: LogConfig = {
  defaultLevel: "error",
  categories: {
    workbox: "error", // エラーのみ
    googleMaps: "error", // エラーのみ
    apiRequests: "none", // 本番ではAPIリクエストログを非表示
    analytics: "none", // 本番ではアナリティクスログ非表示
    general: "error", // エラーのみ
  },
  suppressConsole: {
    log: true,
    info: true,
    debug: true,
    warn: false,
    error: false,
  },
};

/**
 * テスト環境デフォルト設定
 */
const TEST_CONFIG: LogConfig = {
  defaultLevel: "none",
  categories: {
    workbox: "none",
    googleMaps: "none",
    apiRequests: "none",
    analytics: "none",
    general: "error", // テストではエラーのみ
  },
  suppressConsole: {
    log: true,
    info: true,
    debug: true,
    warn: true,
    error: false, // テストでもerrorは出力
  },
};

// ========================
// LogManager Class
// ========================

/**
 * 中央ログ管理クラス
 * シングルトンパターンで実装
 */
class LogManager {
  private static instance: LogManager | null = null;
  private config: LogConfig;
  private originalConsole: Partial<typeof console> | null = null;
  private isInitialized = false;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  private constructor(config: LogConfig) {
    this.config = config;
  }

  /**
   * LogManagerインスタンスを取得
   */
  public static getInstance(customConfig?: Partial<LogConfig>): LogManager {
    if (!LogManager.instance) {
      // 環境に応じた基本設定を選択
      const baseConfig = LogManager.getDefaultConfig();
      const finalConfig = customConfig
        ? { ...baseConfig, ...customConfig }
        : baseConfig;

      LogManager.instance = new LogManager(finalConfig);
    }
    return LogManager.instance;
  }

  /**
   * 環境に応じたデフォルト設定を取得
   */
  private static getDefaultConfig(): LogConfig {
    // テスト環境判定
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
      return TEST_CONFIG;
    }
    if (typeof window !== "undefined" && "__vitest__" in window) {
      return TEST_CONFIG;
    }

    // Vite環境判定
    if (typeof import.meta.env !== "undefined") {
      return import.meta.env.DEV ? DEV_CONFIG : PROD_CONFIG;
    }

    // フォールバック: 本番設定
    return PROD_CONFIG;
  }

  /**
   * ログシステムを初期化
   */
  public initialize(): void {
    // SSR対応: windowが存在しない場合はスキップ
    if (typeof window === "undefined") {
      this.isInitialized = true;
      return;
    }

    // 二重初期化チェック（オリジナルのconsoleで警告）
    if (this.isInitialized) {
      // 既にオーバーライドされている可能性があるため、保存済みのoriginalConsoleを使用
      if (this.originalConsole?.warn) {
        this.originalConsole.warn("LogManager is already initialized");
      } else {
        console.warn("LogManager is already initialized");
      }
      return;
    }

    // オリジナルのconsoleメソッドを保存
    this.originalConsole = {
      log: console.log,
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error,
    };

    // consoleメソッドのオーバーライド
    this.overrideConsoleMethods();

    // Workboxログの追加フィルタリング
    this.setupWorkboxFiltering();

    this.isInitialized = true;

    // 初期化完了通知（開発環境のみ）
    if (this.shouldLog("info", "general")) {
      this.originalConsole.info?.("🔧 [LogManager] Initialized with config:", {
        defaultLevel: this.config.defaultLevel,
        categories: this.config.categories,
      });
    }
  }

  /**
   * consoleメソッドをオーバーライド
   */
  private overrideConsoleMethods(): void {
    if (!this.originalConsole) return;

    const noop: (..._args: unknown[]) => void = () => {};

    // 型安全なconsoleオーバーライド
    type MutableConsole = {
      [K in keyof Console]: Console[K];
    };
    const mConsole = console as unknown as MutableConsole;

    // log
    if (this.config.suppressConsole.log) {
      mConsole.log = noop;
    } else {
      mConsole.log = (...args: unknown[]) => {
        if (this.shouldLogMessage(args, "info")) {
          const log = this.originalConsole.log;
          if (log) {
            log(...args);
          }
        }
      };
    }

    // info
    if (this.config.suppressConsole.info) {
      mConsole.info = noop;
    } else {
      mConsole.info = (...args: unknown[]) => {
        if (this.shouldLogMessage(args, "info")) {
          const info = this.originalConsole.info;
          if (info) {
            info(...args);
          }
        }
      };
    }

    // debug
    if (this.config.suppressConsole.debug) {
      mConsole.debug = noop;
    } else {
      mConsole.debug = (...args: unknown[]) => {
        if (this.shouldLogMessage(args, "debug")) {
          const debug = this.originalConsole.debug;
          if (debug) {
            debug(...args);
          }
        }
      };
    }

    // warn
    if (this.config.suppressConsole.warn) {
      mConsole.warn = noop;
    } else {
      mConsole.warn = (...args: unknown[]) => {
        if (this.shouldLogMessage(args, "warn")) {
          const warn = this.originalConsole.warn;
          if (warn) {
            warn(...args);
          }
        }
      };
    }

    // error (通常は常に出力)
    if (this.config.suppressConsole.error) {
      mConsole.error = noop;
    } else {
      mConsole.error = (...args: unknown[]) => {
        if (this.shouldLogMessage(args, "error")) {
          const error = this.originalConsole.error;
          if (error) {
            error(...args);
          }
        }
      };
    }
  }

  /**
   * Workboxログの追加フィルタリング
   */
  private setupWorkboxFiltering(): void {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener("message", event => {
      // Workboxからのメッセージをフィルタリング
      if (
        event.data &&
        typeof event.data === "object" &&
        event.data !== null &&
        "type" in event.data &&
        typeof (event.data as { type: unknown }).type === "string" &&
        (event.data as { type: string }).type.includes("workbox")
      ) {
        if (this.config.categories.workbox === "none") {
          event.stopImmediatePropagation();
        }
      }
    });
  }

  /**
   * メッセージがフィルタ対象か判定
   * console経由のログの場合、履歴にも記録する
   */
  private shouldLogMessage(args: unknown[], level: LogLevel): boolean {
    const message = args.join(" ");
    const category = this.detectCategory(message);
    const shouldLog = this.shouldLog(level, category);

    // console経由のログも履歴に記録
    if (shouldLog) {
      const entry: LogEntry = {
        timestamp: new Date(),
        level,
        category,
        message,
        data: args.length > 1 ? args.slice(1) : undefined,
      };
      this.logHistory.push(entry);

      // 履歴サイズ管理
      if (this.logHistory.length > this.maxHistorySize) {
        this.logHistory.shift();
      }
    }

    return shouldLog;
  }

  /**
   * メッセージからカテゴリを検出
   */
  private detectCategory(message: string): LogCategory {
    // Workbox関連
    if (
      message.includes("workbox") ||
      message.includes("sw.js") ||
      message.includes("Service Worker") ||
      message.includes("vt/pb=")
    ) {
      return "workbox";
    }

    // Google Maps関連
    if (
      message.includes("maps.googleapis.com") ||
      message.includes("Google Maps") ||
      message.includes("google.maps")
    ) {
      return "googleMaps";
    }

    // APIリクエスト関連
    if (
      message.includes("APIリクエスト") ||
      message.includes("sheets.googleapis.com") ||
      message.includes("API")
    ) {
      return "apiRequests";
    }

    // アナリティクス関連
    if (
      message.includes("Google Analytics") ||
      message.includes("GA_MEASUREMENT_ID") ||
      message.includes("[Analytics]")
    ) {
      return "analytics";
    }

    return "general";
  }

  /**
   * 指定されたレベルとカテゴリでログ出力すべきか判定
   */
  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    const categoryLevel = this.config.categories[category];

    if (categoryLevel === "none") return false;
    if (level === "none") return false;

    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      none: 4,
    };

    return levelPriority[level] >= levelPriority[categoryLevel];
  }

  /**
   * カテゴリ別ロガーを取得
   */
  public getLogger(category: LogCategory) {
    return {
      debug: (message: string, data?: unknown) => {
        this.log("debug", category, message, data);
      },
      info: (message: string, data?: unknown) => {
        this.log("info", category, message, data);
      },
      warn: (message: string, data?: unknown) => {
        this.log("warn", category, message, data);
      },
      error: (message: string, data?: unknown) => {
        this.log("error", category, message, data);
      },
    };
  }

  /**
   * ログを記録
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: unknown
  ): void {
    if (!this.shouldLog(level, category)) return;

    // ログ履歴に追加
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    this.logHistory.push(entry);

    // 履歴サイズ管理
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // consoleに出力
    if (!this.originalConsole) return;

    const prefix = `[${category}]`;
    const args =
      data !== undefined ? [prefix, message, data] : [prefix, message];

    switch (level) {
      case "debug":
        if (this.originalConsole.debug) {
          this.originalConsole.debug(...args);
        }
        break;
      case "info":
        if (this.originalConsole.info) {
          this.originalConsole.info(...args);
        }
        break;
      case "warn":
        if (this.originalConsole.warn) {
          this.originalConsole.warn(...args);
        }
        break;
      case "error":
        if (this.originalConsole.error) {
          this.originalConsole.error(...args);
        }
        break;
    }
  }

  /**
   * ログ履歴を取得
   */
  public getHistory(): ReadonlyArray<LogEntry> {
    return [...this.logHistory];
  }

  /**
   * ログ履歴をクリア
   */
  public clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * consoleを元に戻す
   */
  public restore(): void {
    if (!this.originalConsole) return;

    Object.assign(console, this.originalConsole);
    this.isInitialized = false;
    this.originalConsole = null;
  }

  /**
   * 設定を更新
   */
  public updateConfig(partialConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...partialConfig };

    // 再初期化が必要な場合
    if (this.isInitialized) {
      this.restore();
      this.initialize();
    }
  }

  /**
   * 現在の設定を取得
   */
  public getConfig(): Readonly<LogConfig> {
    return { ...this.config };
  }

  /**
   * テスト用: インスタンスをリセット
   * @internal
   */
  public static resetInstance(): void {
    if (LogManager.instance) {
      LogManager.instance.restore();
      LogManager.instance = null;
    }
  }
}

// ========================
// Exports
// ========================

/**
 * デフォルトLogManagerインスタンス
 */
export const logManager = LogManager.getInstance();

/**
 * 便利関数: LogManagerを初期化
 */
export function initializeLogging(customConfig?: Partial<LogConfig>): void {
  const manager = customConfig
    ? LogManager.getInstance(customConfig)
    : logManager;

  manager.initialize();
}

/**
 * 便利関数: カテゴリ別ロガーを取得
 */
export function getLogger(category: LogCategory) {
  return logManager.getLogger(category);
}

/**
 * 便利関数: 一般ログ用ロガー
 */
export const logger = {
  debug: (message: string, data?: unknown) => {
    logManager.getLogger("general").debug(message, data);
  },
  info: (message: string, data?: unknown) => {
    logManager.getLogger("general").info(message, data);
  },
  warn: (message: string, data?: unknown) => {
    logManager.getLogger("general").warn(message, data);
  },
  error: (message: string, data?: unknown) => {
    logManager.getLogger("general").error(message, data);
  },
};

/**
 * 後方互換性: 既存のsuppressLogs相当
 * @deprecated LogManager.initialize()を使用してください
 */
export function suppressLogs(
  options: { suppressWarn?: boolean; suppressError?: boolean } = {}
): void {
  const config: Partial<LogConfig> = {
    suppressConsole: {
      log: true,
      info: true,
      debug: true,
      warn: options.suppressWarn ?? false,
      error: options.suppressError ?? false,
    },
  };

  const manager = LogManager.getInstance(config);
  manager.initialize();
}

/**
 * 後方互換性: 既存のrestoreLogs相当
 * @deprecated LogManager.restore()を使用してください
 */
export function restoreLogs(): void {
  logManager.restore();
}

/**
 * 後方互換性: 既存のinitializeDevLogging相当
 * @deprecated initializeLogging()を使用してください
 */
export function initializeDevLogging(): void {
  initializeLogging();
}

// テスト用エクスポート
export { LogManager };
