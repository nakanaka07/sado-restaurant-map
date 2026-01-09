/**
 * @fileoverview App Initialization Hook
 * アプリケーション初期化ロジックをApp.tsxから分離
 *
 * 責務:
 * - APIキーのバリデーション
 * - Google Analytics初期化（アイドル時遅延）
 * - 開発環境ログ設定
 * - 初期化状態管理
 *
 * @see docs/guidelines/COLLAB_PROMPT.md - 責務分離原則
 */

import { checkGAStatus, initGA, initializeDevLogging } from "@/utils";
import { validateApiKey } from "@/utils/securityUtils";
import { useCallback, useEffect, useState } from "react";

// ==============================
// Types
// ==============================

interface UseAppInitializationOptions {
  /** Google Maps APIキー */
  readonly apiKey: string | undefined;
}

interface AppInitializationResult {
  /** 初期化完了フラグ */
  readonly isInitialized: boolean;
  /** アプリケーションエラー（初期化失敗時） */
  readonly appError: string | null;
  /** エラー設定関数 */
  readonly setAppError: (error: string | null) => void;
}

// ==============================
// Helpers
// ==============================

/**
 * アイドル時にコールバックを遅延実行
 */
const deferToIdle = (cb: () => void): void => {
  const ric = (
    window as unknown as {
      requestIdleCallback?: (cb: () => void) => void;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") {
    ric(cb);
  } else {
    setTimeout(cb, 0);
  }
};

/**
 * Google Analytics初期化（アイドル時遅延）
 */
async function initGADeferred(): Promise<void> {
  return new Promise<void>(resolve => {
    deferToIdle(() => {
      void initGA()
        .catch(err => {
          console.warn("initGA failed (deferred):", err);
        })
        .finally(() => resolve());
    });
  });
}

// ==============================
// Hook Implementation
// ==============================

/**
 * アプリケーション初期化を管理するカスタムフック
 *
 * @param options - 初期化オプション
 * @returns 初期化状態とエラー情報
 *
 * @example
 * ```tsx
 * const { isInitialized, appError, setAppError } = useAppInitialization({
 *   apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
 * });
 *
 * if (appError) return <ErrorDisplay message={appError} />;
 * if (!isInitialized) return <LoadingSpinner />;
 * ```
 */
export function useAppInitialization({
  apiKey,
}: UseAppInitializationOptions): AppInitializationResult {
  const [isInitialized, setIsInitialized] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // GA状態チェック（開発環境のみ、アイドル時に遅延実行）
  const scheduleGAStatusCheck = useCallback(() => {
    if (!import.meta.env.DEV || typeof checkGAStatus !== "function") {
      return;
    }

    setTimeout(() => {
      const result = checkGAStatus();
      // Promise型ガード: thenableチェック
      const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
        return (
          value !== null &&
          typeof value === "object" &&
          "catch" in value &&
          typeof (value as { catch: unknown }).catch === "function"
        );
      };

      if (isPromiseLike(result)) {
        void result.catch(console.warn);
      }
    }, 3000);
  }, []);

  // 初期化処理
  useEffect(() => {
    let canceled = false;

    const initializeApp = async () => {
      try {
        // 開発環境でのログフィルタリング初期化
        initializeDevLogging();

        // APIキーのバリデーション
        if (!validateApiKey(apiKey)) {
          throw new Error("無効なGoogle Maps APIキーです");
        }

        // Google Analytics初期化（アイドル時遅延）
        await initGADeferred();

        if (canceled) return;

        // 開発環境でのGA状態チェック
        scheduleGAStatusCheck();

        setIsInitialized(true);
      } catch (error) {
        console.error("アプリケーション初期化エラー:", error);
        setAppError(
          error instanceof Error
            ? error.message
            : "アプリケーションの初期化に失敗しました"
        );
      }
    };

    void initializeApp();

    return () => {
      canceled = true;
    };
  }, [apiKey, scheduleGAStatusCheck]);

  return {
    isInitialized,
    appError,
    setAppError,
  };
}

export default useAppInitialization;
