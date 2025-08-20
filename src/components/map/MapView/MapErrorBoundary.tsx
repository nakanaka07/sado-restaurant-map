/**
 * @fileoverview MapErrorBoundary component
 * Google Maps関連エラー専用のエラーバウンダリー
 */

import React, { Component, type ReactNode } from "react";

interface MapErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

interface MapErrorBoundaryState {
  readonly hasError: boolean;
  readonly error?: Error;
}

export class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    // Google Maps関連エラーを特定
    const isGoogleMapsError =
      error.message.includes("google.maps") ||
      error.message.includes("AdvancedMarker") ||
      error.message.includes("maps.googleapis.com") ||
      error.stack?.includes("maps-api-v3");

    return {
      hasError: true,
      error: isGoogleMapsError ? error : undefined,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("MapErrorBoundary caught an error:", error, errorInfo);

    // Google Maps特有のエラー対処
    if (error.message.includes("AdvancedMarker")) {
      console.warn("AdvancedMarker エラーが発生しました。地図の再読み込みを試してください。");
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            width: "100%",
            height: "500px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
          <h3 style={{ margin: "0 0 12px 0", color: "#1f2937" }}>
            地図の読み込みでエラーが発生しました
          </h3>
          <p style={{ margin: "0 0 16px 0", color: "#6b7280" }}>
            地図の表示で問題が発生しました。ページを再読み込みしてください。
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ページを再読み込み
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details style={{ marginTop: "16px", textAlign: "left" }}>
              <summary style={{ cursor: "pointer", color: "#6b7280" }}>
                エラー詳細（開発環境のみ）
              </summary>
              <pre
                style={{
                  fontSize: "12px",
                  backgroundColor: "#f3f4f6",
                  padding: "8px",
                  borderRadius: "4px",
                  marginTop: "8px",
                  overflow: "auto",
                  maxHeight: "200px",
                }}
              >
                {this.state.error.message}
                {"\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
