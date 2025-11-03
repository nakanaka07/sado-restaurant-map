/**
 * 環境変数の型定義（2025年セキュリティ強化対応）
 *
 * @description
 * Viteの環境変数に対する型安全性を提供します。
 * 機密情報の漏洩防止とTypescript型チェックを強化します。
 */

// Vite環境変数の型拡張
interface ImportMetaEnv {
  // === 必須環境変数 ===
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;

  // === オプション環境変数 ===
  readonly VITE_BASE_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_ENABLE_PWA_DEV?: string;
  readonly VITE_SHEETS_API_KEY?: string;
  readonly VITE_SPREADSHEET_ID?: string;

  // === 開発環境用 ===
  readonly VITE_DEBUG_MODE?: string;
  readonly VITE_MOCK_DATA?: string;
  readonly VITE_LOG_LEVEL?: "error" | "warn" | "info" | "debug";

  // === セキュリティ関連 ===
  readonly VITE_CSP_NONCE?: string;
  readonly VITE_ALLOWED_ORIGINS?: string;

  // === パフォーマンス監視 ===
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_PERFORMANCE_MONITORING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// === 環境変数バリデーション関数 ===
export interface EnvConfig {
  googleMapsApiKey: string;
  googleMapsMapId: string;
  baseUrl?: string;
  appName: string;
  appVersion: string;
  gaTrackingId?: string;
  enablePwaInDev: boolean;
  sheetsApiKey?: string;
  spreadsheetId?: string;
  debugMode: boolean;
  mockData: boolean;
  logLevel: "error" | "warn" | "info" | "debug";
  cspNonce?: string;
  allowedOrigins: string[];
  sentryDsn?: string;
  performanceMonitoring: boolean;
}

/**
 * 環境変数の型安全なアクセサー
 */
export const getEnvConfig = (): EnvConfig => {
  // 必須環境変数の検証
  const requiredEnvVars = [
    "VITE_GOOGLE_MAPS_API_KEY",
    "VITE_GOOGLE_MAPS_MAP_ID",
  ] as const;

  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      throw new Error(`必須環境変数が設定されていません: ${envVar}`);
    }
  }

  return {
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    googleMapsMapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    baseUrl: import.meta.env.VITE_BASE_URL as string | undefined,
    appName: (import.meta.env.VITE_APP_NAME as string) || "佐渡飲食店マップ",
    appVersion: (import.meta.env.VITE_APP_VERSION as string) || "1.0.0",
    gaTrackingId: import.meta.env.VITE_GA_MEASUREMENT_ID as string,
    enablePwaInDev: import.meta.env.VITE_ENABLE_PWA_DEV === "true",
    sheetsApiKey: import.meta.env.VITE_SHEETS_API_KEY as string,
    spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID as string,
    debugMode: import.meta.env.VITE_DEBUG_MODE === "true",
    mockData: import.meta.env.VITE_MOCK_DATA === "true",
    logLevel:
      (import.meta.env.VITE_LOG_LEVEL as EnvConfig["logLevel"]) || "info",
    cspNonce: import.meta.env.VITE_CSP_NONCE as string,
    allowedOrigins:
      (import.meta.env.VITE_ALLOWED_ORIGINS as string)?.split(",") || [],
    sentryDsn: import.meta.env.VITE_SENTRY_DSN as string,
    performanceMonitoring:
      import.meta.env.VITE_PERFORMANCE_MONITORING === "true",
  };
};

/**
 * 開発環境でのみ実行される環境変数検証
 */
export const validateEnvInDevelopment = (): void => {
  if (import.meta.env.DEV) {
    try {
      getEnvConfig();
      console.log("✅ 環境変数の検証に成功しました");
    } catch (error) {
      console.error("❌ 環境変数の検証に失敗しました:", error);
      throw error;
    }
  }
};

/**
 * セキュアな環境変数ログ出力（機密情報をマスク）
 */
export const logEnvConfigSafely = (): void => {
  if (import.meta.env.DEV) {
    const config = getEnvConfig();
    const safeConfig = {
      ...config,
      googleMapsApiKey: config.googleMapsApiKey ? "***MASKED***" : undefined,
      sheetsApiKey: config.sheetsApiKey ? "***MASKED***" : undefined,
      gaTrackingId: config.gaTrackingId ? "***MASKED***" : undefined,
      sentryDsn: config.sentryDsn ? "***MASKED***" : undefined,
    };
    console.log("🔧 環境設定:", safeConfig);
  }
};
