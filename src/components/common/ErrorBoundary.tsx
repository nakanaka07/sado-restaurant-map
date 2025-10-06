/**
 * ErrorBoundary - React エラーバウンダリーコンポーネント
 *
 * React のエラーをキャッチし、フォールバック UI を表示します。
 * アクセシビリティに配慮し、エラーログ記録とリロード機能を提供します。
 *
 * Phase 8 Task 1.2.2 実装
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

export interface ErrorBoundaryProps {
  /**
   * 子要素
   */
  children: ReactNode;

  /**
   * フォールバック UI（カスタムエラー表示）
   * 指定しない場合はデフォルト UI を使用
   */
  fallback?: (error: Error, errorInfo: ErrorInfo | null) => ReactNode;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * エラー境界の識別子（ログ記録用）
   */
  boundaryName?: string;
}

export interface ErrorBoundaryState {
  /**
   * エラーが発生したかどうか
   */
  hasError: boolean;

  /**
   * キャッチされたエラー
   */
  error: Error | null;

  /**
   * エラー情報（コンポーネントスタック等）
   */
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary クラスコンポーネント
 *
 * @example
 * ```tsx
 * // 基本的な使用
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * // カスタムフォールバック
 * <ErrorBoundary
 *   fallback={(error) => <div>エラー: {error.message}</div>}
 *   onError={(error, info) => logError(error, info)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * エラー発生時に呼ばれる静的メソッド
   * 次の render で表示する state を返す
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * エラーがキャッチされた後に呼ばれるライフサイクルメソッド
   * エラーログ記録等の副作用を実行
   */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, boundaryName } = this.props;

    // エラー情報を state に保存
    this.setState({
      errorInfo,
    });

    // エラーログ記録
    this.logError(error, errorInfo);

    // カスタムエラーハンドラー実行
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (callbackError) {
        console.error("ErrorBoundary: onError callback failed:", callbackError);
      }
    }

    // Google Analytics へのエラー報告（開発環境では無効）
    if (import.meta.env.PROD && typeof window !== "undefined") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const gtag = (window as any).gtag;
        if (typeof gtag === "function") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          gtag("event", "exception", {
            description: error.message,
            fatal: false,
            boundary: boundaryName || "unnamed",
          });
        }
      } catch (analyticsError) {
        // Analytics エラーは無視（サイレントフェイル）
        console.warn("Failed to send error to analytics:", analyticsError);
      }
    }
  }

  /**
   * エラーログを記録
   */
  private logError(error: Error, errorInfo: ErrorInfo): void {
    const { boundaryName } = this.props;

    const boundaryLabel = boundaryName
      ? `[ErrorBoundary: ${boundaryName}]`
      : "[ErrorBoundary]";
    console.error(`${boundaryLabel} Error caught:`, {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // 開発環境では詳細なスタックトレースを表示
    if (import.meta.env.DEV) {
      console.group("Error Details");
      console.error("Error:", error);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }
  }

  /**
   * エラー状態をリセットしてリトライ
   */
  private readonly handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * ページをリロード
   */
  private readonly handleReload = (): void => {
    window.location.reload();
  };

  /**
   * デフォルトのフォールバック UI
   */
  private renderDefaultFallback(): ReactNode {
    const { error, errorInfo } = this.state;
    const { boundaryName } = this.props;

    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          padding: "2rem",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            width: "100%",
            padding: "2rem",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          {/* エラーアイコン */}
          <div
            style={{
              fontSize: "3rem",
              textAlign: "center",
              marginBottom: "1rem",
            }}
            aria-hidden="true"
          >
            ⚠️
          </div>

          {/* エラータイトル */}
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              textAlign: "center",
              marginBottom: "1rem",
              color: "#333",
            }}
          >
            エラーが発生しました
          </h1>

          {/* エラーメッセージ */}
          <p
            style={{
              fontSize: "1rem",
              lineHeight: "1.6",
              textAlign: "center",
              marginBottom: "1.5rem",
              color: "#666",
            }}
          >
            申し訳ございません。アプリケーションでエラーが発生しました。
            <br />
            ページをリロードするか、しばらく時間をおいて再度お試しください。
          </p>

          {/* エラー詳細（開発環境のみ） */}
          {import.meta.env.DEV && error && (
            <details
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                backgroundColor: "#f5f5f5",
                borderRadius: "4px",
                fontSize: "0.875rem",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#d32f2f",
                }}
              >
                エラー詳細を表示
              </summary>
              <div style={{ marginTop: "0.5rem" }}>
                <p style={{ marginBottom: "0.5rem" }}>
                  <strong>Boundary:</strong> {boundaryName || "unnamed"}
                </p>
                <p style={{ marginBottom: "0.5rem" }}>
                  <strong>Message:</strong> {error.message}
                </p>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: "0.75rem",
                    backgroundColor: "#fff",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    overflow: "auto",
                    maxHeight: "200px",
                  }}
                >
                  {error.stack}
                </pre>
                {errorInfo?.componentStack && (
                  <>
                    <p style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
                      <strong>Component Stack:</strong>
                    </p>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "0.75rem",
                        backgroundColor: "#fff",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        overflow: "auto",
                        maxHeight: "200px",
                      }}
                    >
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}

          {/* アクションボタン */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
            }}
          >
            <button
              onClick={this.handleReset}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                color: "#fff",
                backgroundColor: "#1976d2",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = "#1565c0";
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = "#1976d2";
              }}
              onFocus={e => {
                e.currentTarget.style.backgroundColor = "#1565c0";
              }}
              onBlur={e => {
                e.currentTarget.style.backgroundColor = "#1976d2";
              }}
            >
              リトライ
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                color: "#333",
                backgroundColor: "#f5f5f5",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = "#e0e0e0";
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
              onFocus={e => {
                e.currentTarget.style.backgroundColor = "#e0e0e0";
              }}
              onBlur={e => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
            >
              ページをリロード
            </button>
          </div>
        </div>
      </div>
    );
  }

  override render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    // errorInfo がまだ設定されていなくてもフォールバックを表示する
    if (hasError && error) {
      // カスタムフォールバックがある場合はそれを使用
      if (fallback) {
        return fallback(error, errorInfo);
      }

      // デフォルトフォールバック UI
      return this.renderDefaultFallback();
    }

    // エラーがない場合は通常通り子要素をレンダリング
    return children;
  }
}

export default ErrorBoundary;
