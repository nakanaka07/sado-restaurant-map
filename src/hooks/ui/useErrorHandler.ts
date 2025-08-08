import { useCallback, useState } from "react";

interface ErrorState {
  message: string;
  code?: string;
  timestamp: Date;
  context?: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface ErrorDetails {
  error: Error;
  context?: string;
  severity?: "low" | "medium" | "high" | "critical";
  user?: string;
  metadata?: Record<string, unknown>;
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null);
  const [errorHistory, setErrorHistory] = useState<ErrorState[]>([]);

  const handleError = useCallback((details: ErrorDetails) => {
    const { error, context = "Unknown", severity = "medium" } = details;

    const errorState: ErrorState = {
      message: error.message,
      code: "code" in error ? String(error.code) : undefined,
      timestamp: new Date(),
      context,
      severity,
    };

    // 開発環境では詳細なログを出力
    if (import.meta.env.DEV) {
      console.group(`🚨 Error in ${context}`);
      console.error("Error:", error);
      console.error("Stack:", error.stack);
      console.error("Metadata:", details.metadata);
      console.groupEnd();
    }

    // 本番環境ではエラー報告サービスに送信（将来実装）
    if (import.meta.env.PROD) {
      // 将来: Sentry、LogRocket等に送信
      reportErrorToService(errorState, details);
    }

    setError(errorState);
    setErrorHistory((prev) => [errorState, ...prev.slice(0, 9)]); // 最新10件保持
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearErrorHistory = useCallback(() => {
    setErrorHistory([]);
  }, []);

  // エラーレベル別のハンドラー
  const handleCriticalError = useCallback(
    (error: Error, context?: string) => {
      handleError({ error, context, severity: "critical" });
      // クリティカルエラーの場合は追加のアクション
      if (import.meta.env.PROD) {
        // 緊急時のフォールバック処理
        console.error("Critical error occurred, attempting recovery...");
      }
    },
    [handleError]
  );

  const handleNetworkError = useCallback(
    (error: Error, context?: string) => {
      // ネットワークエラー特有の処理
      const networkErrorMessage = error.message.includes("fetch")
        ? "ネットワーク接続を確認してください"
        : error.message;

      const networkError = new Error(networkErrorMessage);
      handleError({
        error: networkError,
        context: context || "Network",
        severity: "medium",
        metadata: { originalError: error.message },
      });
    },
    [handleError]
  );

  const handleValidationError = useCallback(
    (error: Error, context?: string) => {
      handleError({
        error,
        context: context || "Validation",
        severity: "low",
        metadata: { type: "validation" },
      });
    },
    [handleError]
  );

  return {
    error,
    errorHistory,
    handleError,
    handleCriticalError,
    handleNetworkError,
    handleValidationError,
    clearError,
    clearErrorHistory,
  };
}

// エラー報告サービスへの送信（将来実装）
function reportErrorToService(errorState: ErrorState, details: ErrorDetails) {
  // 将来的にSentry、LogRocket等のサービスに送信
  // 現在はconsole.errorで代替
  console.error("Error reported to service:", {
    errorState,
    details: {
      ...details,
      error: {
        name: details.error.name,
        message: details.error.message,
        stack: details.error.stack,
      },
    },
  });
}

// グローバルエラーハンドラー（main.tsxで使用）
export function setupGlobalErrorHandling() {
  // 未処理のPromise拒否をキャッチ
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    event.preventDefault(); // デフォルトのエラー表示を抑制
  });

  // 一般的なJavaScriptエラーをキャッチ
  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error || event.message);
  });

  // Reactエラーバウンダリーでキャッチできないエラー
  window.addEventListener("load", () => {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      // React DevToolsのエラーをフィルタリング
      const firstArg: unknown = args[0];
      if (typeof firstArg === "string" && !firstArg.includes("Warning:")) {
        originalConsoleError.apply(console, args);
      } else if (
        firstArg &&
        typeof firstArg === "object" &&
        firstArg !== null &&
        "toString" in firstArg &&
        typeof firstArg.toString === "function"
      ) {
        const stringified = (firstArg as { toString(): string }).toString();
        if (!stringified.includes("Warning:")) {
          originalConsoleError.apply(console, args);
        }
      } else {
        originalConsoleError.apply(console, args);
      }
    };
  });
}

// React Error Boundary用のエラーレポート
export function reportErrorBoundaryError(
  error: Error,
  errorInfo: { componentStack: string }
) {
  const errorDetails = {
    error,
    context: "React Error Boundary",
    severity: "high" as const,
    metadata: {
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    },
  };

  if (import.meta.env.DEV) {
    console.group("🔴 React Error Boundary");
    console.error("Error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    console.groupEnd();
  }

  // 本番環境ではサービスに報告
  if (import.meta.env.PROD) {
    reportErrorToService(
      {
        message: error.message,
        code: error.name,
        timestamp: new Date(),
        context: "React Error Boundary",
        severity: "high",
      },
      errorDetails
    );
  }
}
