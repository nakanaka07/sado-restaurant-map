/**
 * LoadingSpinner - アクセシビリティに対応したローディングインジケーター
 *
 * WCAG 2.1 AA 準拠:
 * - aria-live="polite": スクリーンリーダーに読み込み状態を通知
 * - role="status": ステータス領域として認識
 * - aria-label: 明示的なラベルで状況説明
 *
 * Phase 8 Task 1.2.1 実装
 */

import type { CSSProperties } from "react";

export interface LoadingSpinnerProps {
  /**
   * ローディングメッセージ
   * @default "読み込み中..."
   */
  message?: string;

  /**
   * スピナーのサイズ
   * @default "medium"
   */
  size?: "small" | "medium" | "large";

  /**
   * 追加のCSSクラス名
   */
  className?: string;

  /**
   * インラインスタイル
   */
  style?: CSSProperties;

  /**
   * aria-label（カスタムラベル）
   */
  ariaLabel?: string;
}

/**
 * LoadingSpinner コンポーネント
 *
 * @example
 * ```tsx
 * // Suspense fallback で使用
 * <Suspense fallback={<LoadingSpinner message="地図を読み込み中..." />}>
 *   <MapComponent />
 * </Suspense>
 *
 * // カスタムサイズ
 * <LoadingSpinner size="small" message="データ取得中..." />
 * ```
 */
export function LoadingSpinner({
  message = "読み込み中...",
  size = "medium",
  className = "",
  style,
  ariaLabel,
}: Readonly<LoadingSpinnerProps>) {
  // サイズに応じたスピナーサイズ（px）
  const spinnerSize = {
    small: 24,
    medium: 40,
    large: 64,
  }[size];

  // サイズに応じたボーダー幅
  const borderWidth = {
    small: 2,
    medium: 3,
    large: 4,
  }[size];

  return (
    <div
      className={`loading-spinner-container ${className}`}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || message}
      style={style}
    >
      <div
        className="loading-spinner"
        style={{
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          border: `${borderWidth}px solid rgba(0, 0, 0, 0.1)`,
          borderTopColor: "#007bff",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
        aria-hidden="true" // 視覚的装飾のみ、スクリーンリーダーには隠す
      />
      <span className="loading-message">{message}</span>

      {/* インラインアニメーション定義 */}
      <style>{`
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem;
          min-height: 200px;
        }

        .loading-message {
          font-size: 1rem;
          color: #333;
          font-weight: 500;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* ダークモード対応 */
        @media (prefers-color-scheme: dark) {
          .loading-message {
            color: #e0e0e0;
          }
          .loading-spinner {
            border-color: rgba(255, 255, 255, 0.2) !important;
            border-top-color: #4a9eff !important;
          }
        }

        /* モーション削減設定対応 */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
            opacity: 0.6;
          }
        }

        /* アクセシビリティ: フォーカス可能な要素のフォーカスリング維持 */
        .loading-spinner-container:focus-visible {
          outline: 2px solid #007bff;
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
}

export default LoadingSpinner;
