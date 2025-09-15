/**
 * @fileoverview 型安全性・セキュリティ・アクセシビリティ強化ユーティリティ
 * ランタイム検証とユーザー定義型ガードの実装
 *
 * 🎯 機能:
 * 1. TypeScript型ガード関数群
 * 2. XSS攻撃防止のサニタイズ機能
 * 3. アクセシビリティ準拠検証
 * 4. 実行時型検証とエラーハンドリング
 * 5. セキュリティベストプラ  cons  const focus    '[tabindex]:not([tabindex="-1"])',bleSelectors = [
    "button",
    "input",
    "select",
    "textarea",
    "a[href]",
    '[tabindex]:not([tabindex="-1"])',
  ];bleSelectors = [
    'button',
    'input',
    'select',
    'textarea',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ]; */

// ==============================
// 基本型検証ユーティリティ
// ==============================

/**
 * 型安全な文字列検証
 */
export const isValidString = (value: unknown): value is string => {
  return typeof value === "string" && value.length > 0;
};

/**
 * 型安全な数値検証
 */
export const isValidNumber = (value: unknown): value is number => {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
};

/**
 * 型安全な配列検証
 */
export const isValidArray = <T>(
  value: unknown,
  itemValidator?: (item: unknown) => item is T
): value is T[] => {
  if (!Array.isArray(value)) return false;
  if (!itemValidator) return true;
  return value.every(itemValidator);
};

/**
 * 型安全なオブジェクト検証
 */
export const isValidObject = (
  value: unknown
): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

// ==============================
// セキュリティ強化ユーティリティ
// ==============================

/**
 * XSS攻撃防止のための包括的文字列サニタイズ
 */
export const sanitizeString = (input: unknown): string => {
  if (!isValidString(input)) return "";

  return input
    .replace(/[<>"'&]/g, char => {
      const entityMap: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return entityMap[char] || char;
    })
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "")
    .trim();
};

/**
 * HTMLエスケープ強化版
 */
export const escapeHtml = (unsafe: unknown): string => {
  if (!isValidString(unsafe)) return "";

  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#039;")
    .replace(/"/g, "&quot;");
};

/**
 * URLの安全性検証
 */
export const isValidUrl = (url: unknown): url is string => {
  if (!isValidString(url)) return false;

  try {
    const parsedUrl = new URL(url);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

// ==============================
// A/Bテスト専用型ガード
// ==============================

/**
 * A/Bテストメトリクス検証
 */
export interface ABTestMetrics {
  sessionId: string;
  variant: string;
  timestamp: number;
  conversionRate: number;
  performanceScore: number;
}

export const isValidABTestMetrics = (
  value: unknown
): value is ABTestMetrics => {
  if (!isValidObject(value)) return false;

  const metrics = value;
  return (
    isValidString(metrics.sessionId) &&
    isValidString(metrics.variant) &&
    isValidNumber(metrics.timestamp) &&
    isValidNumber(metrics.conversionRate) &&
    metrics.conversionRate >= 0 &&
    metrics.conversionRate <= 1 &&
    isValidNumber(metrics.performanceScore) &&
    metrics.performanceScore >= 0 &&
    metrics.performanceScore <= 100
  );
};

/**
 * ダッシュボードデータ検証
 */
export interface SafeDashboardData {
  currentPhase: string;
  rolloutPercentage: number;
  totalParticipants: number;
  realtimeMetrics: {
    activeUsers: number;
    errorCount: number;
    averageLoadTime: number;
  };
  lastUpdated: string;
}

export const isValidDashboardData = (
  value: unknown
): value is SafeDashboardData => {
  if (!isValidObject(value)) return false;

  const data = value;
  return (
    isValidString(data.currentPhase) &&
    isValidNumber(data.rolloutPercentage) &&
    data.rolloutPercentage >= 0 &&
    data.rolloutPercentage <= 100 &&
    isValidNumber(data.totalParticipants) &&
    data.totalParticipants >= 0 &&
    isValidObject(data.realtimeMetrics) &&
    isValidNumber(data.realtimeMetrics.activeUsers) &&
    isValidString(data.lastUpdated)
  );
};

// ==============================
// アクセシビリティ強化ユーティリティ
// ==============================

/**
 * ARIA属性の安全性検証
 */
export const getSafeAriaLabel = (label: unknown): string => {
  const sanitized = sanitizeString(label);
  return sanitized || "インタラクティブ要素";
};

/**
 * コントラスト比の検証
 */
export const isValidContrastRatio = (ratio: unknown): boolean => {
  return isValidNumber(ratio) && ratio >= 4.5; // WCAG AA準拠
};

/**
 * フォーカス可能要素の検証
 */
export const isFocusableElement = (
  element: unknown
): element is HTMLElement => {
  if (!(element instanceof HTMLElement)) return false;

  const focusableSelectors = [
    "button",
    "input",
    "select",
    "textarea",
    "a[href]",
    '[tabindex]:not([tabindex="-1"])',
  ];

  return focusableSelectors.some(selector => element.matches(selector));
};

// ==============================
// エラーハンドリング強化
// ==============================

/**
 * 型安全なエラーオブジェクト
 */
export interface SafeError {
  message: string;
  code?: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

/**
 * エラーの安全な処理
 */
export const handleSafeError = (
  error: unknown,
  context?: Record<string, unknown>
): SafeError => {
  const safeError: SafeError = {
    message: "Unknown error occurred",
    timestamp: Date.now(),
    context: context || {},
  };

  if (error instanceof Error) {
    safeError.message = sanitizeString(error.message);
    safeError.code = error.name;
  } else if (isValidString(error)) {
    safeError.message = sanitizeString(error);
  } else if (isValidObject(error)) {
    const errorObj = error;
    safeError.message =
      sanitizeString(errorObj.message) || "Object error occurred";
    safeError.code = sanitizeString(errorObj.code);
  }

  return safeError;
};

/**
 * 非同期処理の安全な実行
 */
export const safeAsyncExecute = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: Record<string, unknown>
): Promise<{ success: boolean; data: T; error?: SafeError }> => {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const safeError = handleSafeError(error, context);
    console.error("Safe async execution failed:", safeError);
    return { success: false, data: fallback, error: safeError };
  }
};

// ==============================
// パフォーマンス監視ユーティリティ
// ==============================

/**
 * メモリ使用量の安全な監視
 */
export const getMemoryUsage = (): { used: number; limit: number } | null => {
  if (typeof performance !== "undefined" && "memory" in performance) {
    const memory = (
      performance as unknown as {
        memory: { usedJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;
    return {
      used: memory.usedJSHeapSize || 0,
      limit: memory.jsHeapSizeLimit || 0,
    };
  }
  return null;
};

/**
 * レンダリングパフォーマンスの測定
 */
export const measureRenderTime = (componentName: string): (() => void) => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (renderTime > 16.67) {
      // 60FPSを下回る場合
      console.warn(
        `Slow render detected for ${componentName}: ${renderTime.toFixed(2)}ms`
      );
    }
  };
};

// ==============================
// 設定検証ユーティリティ
// ==============================

/**
 * 環境設定の安全な読み込み
 */
export const getSafeEnvConfig = <T>(
  key: string,
  defaultValue: T,
  validator?: (value: unknown) => value is T
): T => {
  try {
    const envValue =
      process.env[key] ||
      (window as unknown as { __ENV__?: Record<string, unknown> })?.__ENV__?.[
        key
      ];

    if (validator?.(envValue)) {
      return envValue;
    }

    if (!validator && envValue !== undefined) {
      return envValue as T;
    }
  } catch (error) {
    console.warn(`Failed to read environment config for ${key}:`, error);
  }

  return defaultValue;
};

/**
 * A/Bテスト設定の検証
 */
export interface SafeABTestConfig {
  enabled: boolean;
  variantRatio: number;
  maxParticipants: number;
}

export const isValidABTestConfig = (
  value: unknown
): value is SafeABTestConfig => {
  if (!isValidObject(value)) return false;

  const config = value;
  return (
    typeof config.enabled === "boolean" &&
    isValidNumber(config.variantRatio) &&
    config.variantRatio >= 0 &&
    config.variantRatio <= 1 &&
    isValidNumber(config.maxParticipants) &&
    config.maxParticipants > 0
  );
};

export default {
  // 型検証
  isValidString,
  isValidNumber,
  isValidArray,
  isValidObject,

  // セキュリティ
  sanitizeString,
  escapeHtml,
  isValidUrl,

  // A/Bテスト専用
  isValidABTestMetrics,
  isValidDashboardData,

  // アクセシビリティ
  getSafeAriaLabel,
  isValidContrastRatio,
  isFocusableElement,

  // エラーハンドリング
  handleSafeError,
  safeAsyncExecute,

  // パフォーマンス
  getMemoryUsage,
  measureRenderTime,

  // 設定
  getSafeEnvConfig,
  isValidABTestConfig,
};
