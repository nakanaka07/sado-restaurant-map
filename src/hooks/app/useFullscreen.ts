/**
 * @fileoverview Fullscreen Detection Hook
 * フルスクリーン状態の検出とCSS連携
 *
 * 責務:
 * - フルスクリーン状態の監視
 * - document/body へのクラス付与
 * - ブラウザ互換性対応（webkit, moz, ms）
 *
 * @see docs/guidelines/COLLAB_PROMPT.md - 責務分離原則
 */

import { useCallback, useEffect, useState } from "react";

// ==============================
// Types
// ==============================

/**
 * フルスクリーン検出のためのDocument拡張型
 */
interface DocumentWithFullscreen extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
}

// ==============================
// Hook Implementation
// ==============================

/**
 * フルスクリーン状態を検出・管理するカスタムフック
 *
 * @returns フルスクリーン状態（true: フルスクリーン中）
 *
 * @example
 * ```tsx
 * const isFullscreen = useFullscreen();
 *
 * // フルスクリーン時はモバイルUIを表示
 * {(isMobile || isFullscreen) && <MobileControls />}
 * ```
 *
 * @remarks
 * - document/bodyに `fullscreen-active` クラスを自動付与
 * - CSSでフルスクリーン時のレイアウト調整に使用可能
 */
export function useFullscreen(): boolean {
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * フルスクリーン要素を取得（ブラウザ互換）
   */
  const getFullscreenElement = useCallback((): Element | null => {
    const doc = document as DocumentWithFullscreen;
    return (
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement ||
      null
    );
  }, []);

  useEffect(() => {
    /**
     * フルスクリーン状態変更ハンドラー
     */
    const handleFullscreenChange = () => {
      const fullscreenElement = getFullscreenElement();
      const isFullscreenActive = !!fullscreenElement;

      // React state更新
      setIsFullscreen(isFullscreenActive);

      // CSS classによる配置制御（Level 2: 非侵入的対応）
      document.documentElement.classList.toggle(
        "fullscreen-active",
        isFullscreenActive
      );
      document.body.classList.toggle("fullscreen-active", isFullscreenActive);

      // 開発環境でのログ
      if (import.meta.env.DEV) {
        if (isFullscreenActive) {
          console.log(
            "🎯 フルスクリーンモードが有効になりました - カスタムコントロール配置"
          );
        } else {
          console.log("🔄 通常モードに戻りました");
        }
      }
    };

    // フルスクリーン変更イベントの監視（ブラウザ互換）
    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ] as const;

    events.forEach(event => {
      document.addEventListener(event, handleFullscreenChange);
    });

    // 初回実行（現在の状態を反映）
    handleFullscreenChange();

    // クリーンアップ
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFullscreenChange);
      });
      // クラスも削除
      document.documentElement.classList.remove("fullscreen-active");
      document.body.classList.remove("fullscreen-active");
    };
  }, [getFullscreenElement]);

  return isFullscreen;
}

export default useFullscreen;
