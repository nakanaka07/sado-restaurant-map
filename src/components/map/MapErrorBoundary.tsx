/**
 * @fileoverview マップコンポーネント用のError Boundary
 * Google Maps API エラーの堅牢な処理と回復機能
 */

/* eslint-disable react-refresh/only-export-components */

import React, { Component, ReactNode } from "react";

/**
 * マップエラーの種類
 */
enum MapErrorType {
  API_LOAD_FAILURE = "API_LOAD_FAILURE",
  MARKER_RENDER_ERROR = "MARKER_RENDER_ERROR",
  INITIALIZATION_ERROR = "INITIALIZATION_ERROR",
  DATA_PROCESSING_ERROR = "DATA_PROCESSING_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * マップエラー詳細情報
 */
interface MapErrorInfo {
  readonly type: MapErrorType;
  readonly message: string;
  readonly originalError?: Error;
  readonly timestamp: number;
  readonly userAgent: string;
  readonly additionalInfo?: Record<string, unknown>;
}

/**
 * Error Boundary の State
 */
interface MapErrorBoundaryState {
  readonly hasError: boolean;
  readonly errorInfo?: MapErrorInfo;
  readonly retryCount: number;
}

/**
 * Error Boundary の Props
 */
export interface MapErrorBoundaryProps {
  readonly children: ReactNode;
  readonly onError?: (errorInfo: MapErrorInfo) => void;
  readonly maxRetryCount?: number;
  readonly fallbackComponent?: React.ComponentType<{
    errorInfo?: MapErrorInfo;
    onRetry: () => void;
  }>;
}

/**
 * デフォルトのフォールバックコンポーネント
 */
const DefaultFallback: React.FC<{
  errorInfo?: MapErrorInfo;
  onRetry: () => void;
}> = ({ errorInfo, onRetry }) => (
  <div
    style={{
      height: "500px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8f9fa",
      border: "1px solid #dee2e6",
      borderRadius: "8px",
      padding: "2rem",
      textAlign: "center",
    }}
  >
    {/* エラーアイコン */}
    <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🗺️❌</div>

    {/* エラーメッセージ */}
    <h3
      style={{
        color: "#dc3545",
        marginBottom: "0.5rem",
        fontSize: "1.25rem",
        fontWeight: "600",
      }}
    >
      地図の読み込みに失敗しました
    </h3>

    <p
      style={{
        color: "#6c757d",
        marginBottom: "1.5rem",
        fontSize: "0.9rem",
        lineHeight: "1.4",
      }}
    >
      {errorInfo?.type === MapErrorType.API_LOAD_FAILURE
        ? "Google Maps API の読み込みに問題が発生しました"
        : "地図コンポーネントでエラーが発生しました"}
    </p>

    {/* 対処法 */}
    <div
      style={{
        backgroundColor: "#fff",
        padding: "1rem",
        borderRadius: "6px",
        border: "1px solid #e9ecef",
        marginBottom: "1.5rem",
        fontSize: "0.85rem",
        textAlign: "left",
      }}
    >
      <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600" }}>💡 対処法:</p>
      <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
        <li>インターネット接続を確認してください</li>
        <li>ページを再読み込みしてください</li>
        <li>しばらく時間をおいて再度お試しください</li>
      </ul>
    </div>

    {/* 再試行ボタン */}
    <button
      onClick={onRetry}
      style={{
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "0.75rem 1.5rem",
        fontSize: "0.9rem",
        fontWeight: "500",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
      }}
      onMouseOver={e => {
        e.currentTarget.style.backgroundColor = "#0056b3";
      }}
      onMouseOut={e => {
        e.currentTarget.style.backgroundColor = "#007bff";
      }}
      onFocus={e => {
        e.currentTarget.style.backgroundColor = "#0056b3";
      }}
      onBlur={e => {
        e.currentTarget.style.backgroundColor = "#007bff";
      }}
    >
      🔄 再試行
    </button>

    {/* デバッグ情報（開発環境のみ） */}
    {process.env.NODE_ENV === "development" && errorInfo && (
      <details
        style={{
          marginTop: "1.5rem",
          fontSize: "0.75rem",
          color: "#6c757d",
          textAlign: "left",
        }}
      >
        <summary style={{ cursor: "pointer", fontWeight: "600" }}>
          🔧 デバッグ情報
        </summary>
        <pre
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(errorInfo, null, 2)}
        </pre>
      </details>
    )}
  </div>
);

/**
 * マップ専用 Error Boundary
 */
export class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  private readonly maxRetryCount: number;

  constructor(props: MapErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      retryCount: 0,
    };

    this.maxRetryCount = props.maxRetryCount ?? 3;
  }

  /**
   * エラー分類ヘルパー
   */
  private classifyError(error: Error): MapErrorType {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes("google") && errorMessage.includes("maps")) {
      return MapErrorType.API_LOAD_FAILURE;
    }

    if (errorMessage.includes("marker") || errorMessage.includes("pin")) {
      return MapErrorType.MARKER_RENDER_ERROR;
    }

    if (errorMessage.includes("initialize") || errorMessage.includes("init")) {
      return MapErrorType.INITIALIZATION_ERROR;
    }

    if (errorMessage.includes("data") || errorMessage.includes("coordinate")) {
      return MapErrorType.DATA_PROCESSING_ERROR;
    }

    return MapErrorType.UNKNOWN_ERROR;
  }

  /**
   * エラー情報の構築
   */
  private buildErrorInfo(error: Error): MapErrorInfo {
    return {
      type: this.classifyError(error),
      message: error.message,
      originalError: error,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      additionalInfo: {
        retryCount: this.state.retryCount,
        location: window.location.href,
      },
    };
  }

  static getDerivedStateFromError(
    _error: Error
  ): Partial<MapErrorBoundaryState> {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const mapErrorInfo = this.buildErrorInfo(error);

    // Error Boundaryの状態を更新
    this.setState(prevState => ({
      errorInfo: mapErrorInfo,
      retryCount: prevState.retryCount,
    }));

    // 外部エラーハンドラーを呼び出し
    this.props.onError?.(mapErrorInfo);

    // 開発環境でのログ出力
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Map Error Boundary Triggered");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Classified Info:", mapErrorInfo);
      console.groupEnd();
    }

    // 本番環境でのエラー追跡（アナリティクス等）
    if (process.env.NODE_ENV === "production") {
      // ここに外部エラー追跡サービス（Sentry等）への送信を実装
      // trackError("MapErrorBoundary", mapErrorInfo);
    }
  }

  /**
   * エラーからの回復処理
   */
  private readonly handleRetry = () => {
    const { retryCount } = this.state;

    if (retryCount < this.maxRetryCount) {
      this.setState({
        hasError: false,
        retryCount: retryCount + 1,
      });
    } else {
      // 最大再試行回数に達した場合の処理
      console.warn("🚨 Max retry count reached for MapErrorBoundary");
    }
  };

  override render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallbackComponent ?? DefaultFallback;

      return (
        <FallbackComponent
          {...(this.state.errorInfo && { errorInfo: this.state.errorInfo })}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
