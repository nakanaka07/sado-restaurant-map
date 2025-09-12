/**
 * @fileoverview Filter Modal Component
 * モーダル形式のフィルターコンテナ - React 19 Portal + Modern CSS
 */

import type { FilterModalProps } from "@/types";
import { FilterDisplayMode } from "@/types";
import { forwardRef, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * フィルターモーダルコンポーネント
 * 計画書のPattern 1: Compact Modal Filter 実装
 */
export const FilterModal = forwardRef<HTMLDialogElement, FilterModalProps>(
  (
    {
      isOpen,
      onClose,
      children,
      displayMode = FilterDisplayMode.COMPACT,
      className = "",
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDialogElement>(null);
    const overlayRef = useRef<HTMLDialogElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // モーダル開閉時のフォーカス管理 - メモリリーク防止とエラーハンドリング強化
    useEffect(() => {
      if (!modalRef.current) return undefined;

      if (isOpen) {
        // 現在のフォーカス要素を記憶
        previousFocusRef.current = document.activeElement as HTMLElement;

        // モーダル内の最初のフォーカス可能要素にフォーカス
        try {
          const firstFocusable = modalRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        } catch (error) {
          console.warn("Focus management error:", error);
        }

        // bodyのスクロールを無効化
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
          document.body.style.overflow = originalOverflow;
        };
      } else {
        // 以前フォーカスされていた要素に戻す
        try {
          if (previousFocusRef.current?.focus) {
            previousFocusRef.current.focus();
          }
        } catch (error) {
          console.warn("Focus restoration error:", error);
        }

        // bodyのスクロールを有効化
        document.body.style.overflow = "";
      }

      return undefined;
    }, [isOpen]);

    // ESCキーでモーダルを閉じる
    useEffect(() => {
      const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscapeKey);
        return () => document.removeEventListener("keydown", handleEscapeKey);
      }

      return undefined;
    }, [isOpen, onClose]);

    // オーバーレイクリックでモーダルを閉じる
    const handleOverlayClick = useCallback(
      (event: React.MouseEvent) => {
        if (event.target === overlayRef.current) {
          onClose();
        }
      },
      [onClose]
    );

    // タッチジェスチャー対応
    const handleTouchStart = useCallback((event: React.TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        // swipe down to close のための初期位置記録
        modalRef.current?.setAttribute(
          "data-touch-start-y",
          touch.clientY.toString()
        );
      }
    }, []);

    const handleTouchEnd = useCallback(
      (event: React.TouchEvent) => {
        const touchStartY =
          modalRef.current?.getAttribute("data-touch-start-y");
        const touchEndY = event.changedTouches[0]?.clientY;

        if (touchStartY && touchEndY) {
          const deltaY = touchEndY - parseFloat(touchStartY);
          // 下方向に100px以上スワイプした場合はモーダルを閉じる
          if (deltaY > 100) {
            onClose();
          }
        }

        modalRef.current?.removeAttribute("data-touch-start-y");
      },
      [onClose]
    );

    // フォーカストラップ
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (event.key === "Tab") {
        const focusableElements =
          modalRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift+Tab: 最初の要素で逆順移動した場合、最後の要素へ
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else if (document.activeElement === lastElement) {
          // Tab: 最後の要素で順序移動した場合、最初の要素へ
          event.preventDefault();
          firstElement.focus();
        }
      }
    }, []);

    // モーダルが閉じている場合は何もレンダリングしない
    if (!isOpen) {
      return null;
    }

    // 型ガード: displayModeの有効性を確認
    if (!Object.values(FilterDisplayMode).includes(displayMode)) {
      console.warn("Invalid displayMode provided:", displayMode);
    }

    // エラーハンドリング: onClose関数の存在確認
    if (typeof onClose !== "function") {
      console.error("onClose prop must be a function");
      return null;
    }

    // Portalでbodyに直接レンダリング - HTML5 dialog要素使用
    return createPortal(
      <dialog
        ref={ref || overlayRef}
        className={`filter-modal-overlay ${className}`}
        open={isOpen}
        data-display-mode={displayMode}
        data-testid="filter-modal-overlay"
        aria-labelledby="filter-modal-title"
        aria-describedby="filter-modal-description"
      >
        {/* オーバーレイクリック用の対話的要素 */}
        <button
          type="button"
          className="filter-modal-backdrop"
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          aria-label="モーダルを閉じる"
        />
        {/* WCAG 2.2準拠: メインコンテンツ領域を適切にHTML要素でマークアップ */}
        <main
          className="filter-modal-content"
          data-testid="filter-modal-content"
          aria-live="polite"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* ヘッダー部分 */}
          <header className="filter-modal-header">
            {/* スワイプインジケータ（モバイル用） */}
            <div className="filter-modal-handle" aria-hidden="true" />

            {/* タイトル */}
            <h2 id="filter-modal-title" className="filter-modal-title">
              🔍 フィルター設定
            </h2>

            {/* 閉じるボタン */}
            <button
              type="button"
              className="filter-modal-close"
              onClick={onClose}
              aria-label="フィルターを閉じる"
              data-testid="filter-modal-close"
            >
              ✕
            </button>
          </header>

          {/* 説明文（スクリーンリーダー用） */}
          <p id="filter-modal-description" className="sr-only">
            検索条件を設定して、表示する飲食店やスポットを絞り込むことができます。
            設定した条件はリアルタイムで地図に反映されます。
          </p>

          {/* メインコンテンツ */}
          <section className="filter-modal-body">{children}</section>
        </main>
      </dialog>,
      document.body
    );
  }
);

FilterModal.displayName = "FilterModal";
