// 🔧 開発環境でのログ制御ユーティリティ
// Google Maps API や Workbox のログを適切にフィルタリング

// ログレベル設定
type LogLevel = "all" | "error" | "warn" | "info" | "none";

interface LogFilterConfig {
  workbox: LogLevel;
  googleMaps: LogLevel;
  apiRequests: LogLevel; // APIリクエストログの制御を追加
  general: LogLevel;
}

// 開発環境用のログフィルター設定
const DEV_LOG_CONFIG: LogFilterConfig = {
  workbox: "none", // Workboxログを完全無効化
  googleMaps: "error", // Google Mapsは重要なエラーのみ
  apiRequests: "info", // APIリクエストはマスキングして表示
  general: "all", // 一般的なログは全て表示
};

// 本番環境用のログフィルター設定
const PROD_LOG_CONFIG: LogFilterConfig = {
  workbox: "error", // 本番ではエラーのみ
  googleMaps: "error", // エラーのみ
  apiRequests: "none", // 本番ではAPIリクエストログを非表示
  general: "error", // エラーのみ
};

/**
 * 開発環境でのコンソールログフィルタリング
 * Workboxや不要なログを抑制し、重要な情報のみ表示
 */
export function setupLogFiltering(): void {
  // 本番環境では何もしない
  if (import.meta.env.PROD) {
    return;
  }

  const config = import.meta.env.DEV ? DEV_LOG_CONFIG : PROD_LOG_CONFIG;

  // オリジナルのconsoleメソッドを保存
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  // ログメッセージがフィルタ対象かチェック
  const shouldFilterMessage = (message: string): boolean => {
    // Workboxログの検出
    if (
      message.includes("workbox") ||
      message.includes("sw.js") ||
      message.includes("Service Worker") ||
      message.includes("vt/pb=")
    ) {
      return config.workbox === "none";
    }

    // Google Maps関連ログの検出
    if (
      message.includes("maps.googleapis.com") ||
      message.includes("Google Maps") ||
      message.includes("google.maps")
    ) {
      return config.googleMaps === "none";
    }

    // APIリクエストログの検出
    if (
      message.includes("APIリクエスト") ||
      message.includes("sheets.googleapis.com") ||
      message.includes("API")
    ) {
      return config.apiRequests === "none";
    }

    return false;
  };

  // console.logをオーバーライド
  console.log = (...args: unknown[]) => {
    const message = args.join(" ");
    if (!shouldFilterMessage(message)) {
      originalConsole.log(...args);
    }
  };

  // console.warnをオーバーライド
  console.warn = (...args: unknown[]) => {
    const message = args.join(" ");
    if (
      !shouldFilterMessage(message) ||
      config.workbox === "warn" ||
      config.googleMaps === "warn"
    ) {
      originalConsole.warn(...args);
    }
  };

  // console.errorは常に表示（重要なため）
  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
  };

  // 開発者向けメッセージ
  console.info(
    "🔧 [LogFilter] Workbox logs filtered for development environment"
  );
}

/**
 * Workboxログの手動無効化
 * Service Worker内でのログ出力も制御
 */
export function disableWorkboxLogs(): void {
  // Service Worker内でのWorkboxログ無効化
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      // Workboxからのメッセージをフィルタリング
      if (
        event.data &&
        typeof event.data === "object" &&
        event.data !== null &&
        "type" in event.data &&
        typeof (event.data as { type: unknown }).type === "string" &&
        (event.data as { type: string }).type.includes("workbox")
      ) {
        event.stopImmediatePropagation();
      }
    });
  }
}

/**
 * 開発環境でのログ制御初期化
 */
export function initializeDevLogging(): void {
  if (import.meta.env.DEV) {
    setupLogFiltering();
    disableWorkboxLogs();
  }
}

export default initializeDevLogging;
