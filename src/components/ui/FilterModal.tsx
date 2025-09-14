/**
 * @fileoverview Filter Modal Component
 * モーダル形式のフィルターコンテナ - React 19 Portal + Modern CSS
 */

import type { FilterModalProps } from "@/types";
import { FilterDisplayMode } from "@/types";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
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
    const [portalContainer, setPortalContainer] = useState<Element>(
      () => document.body
    );

    // フルスクリーン状態の検出とPortal先の動的変更
    useEffect(() => {
      const updatePortalContainer = () => {
        // フルスクリーン要素を取得（ブラウザ互換性考慮）
        const fullscreenElement =
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement;

        if (fullscreenElement) {
          // フルスクリーン時はフルスクリーン要素内にPortalを作成
          console.log(
            "🔧 フルスクリーンモード検出: モーダルPortalをフルスクリーン要素内に移動"
          );
          setPortalContainer(fullscreenElement);
        } else {
          // 通常時はbodyに戻す
          console.log("🔄 通常モードに戻しました: モーダルPortalをbodyに配置");
          setPortalContainer(document.body);
        }
      };

      // フルスクリーン変更イベントの監視
      document.addEventListener("fullscreenchange", updatePortalContainer);
      document.addEventListener(
        "webkitfullscreenchange",
        updatePortalContainer
      );
      document.addEventListener("mozfullscreenchange", updatePortalContainer);
      document.addEventListener("msfullscreenchange", updatePortalContainer);

      // 初回実行
      updatePortalContainer();

      return () => {
        document.removeEventListener("fullscreenchange", updatePortalContainer);
        document.removeEventListener(
          "webkitfullscreenchange",
          updatePortalContainer
        );
        document.removeEventListener(
          "mozfullscreenchange",
          updatePortalContainer
        );
        document.removeEventListener(
          "msfullscreenchange",
          updatePortalContainer
        );
      };
    }, []);

    // フォーカス管理ユーティリティ関数 - Cognitive Complexity減少
    const setInitialFocus = useCallback((modalElement: HTMLElement) => {
      try {
        const firstFocusable = modalElement.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable && typeof firstFocusable.focus === "function") {
          firstFocusable.focus();
        }
      } catch (error) {
        console.warn(
          "Focus management error:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }, []);

    const restorePreviousFocus = useCallback(() => {
      try {
        const previousElement = previousFocusRef.current;
        if (
          previousElement &&
          typeof previousElement.focus === "function" &&
          document.body.contains(previousElement)
        ) {
          previousElement.focus();
        }
      } catch (error) {
        console.warn(
          "Focus restoration error:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }, []);

    // モーダル開閉時のフォーカス管理 - Cognitive Complexity簡素化
    useEffect(() => {
      const modalElement = modalRef.current;
      if (!modalElement) return undefined;

      if (isOpen) {
        // 現在のフォーカス要素を安全に記憶
        const currentActiveElement = document.activeElement;
        if (
          currentActiveElement &&
          currentActiveElement instanceof HTMLElement
        ) {
          previousFocusRef.current = currentActiveElement;
        }

        // 初期フォーカス設定
        setInitialFocus(modalElement);

        // bodyのスクロール無効化
        const originalOverflow = document.body.style.overflow || "";
        document.body.style.overflow = "hidden";

        return () => {
          document.body.style.overflow = originalOverflow;
        };
      } else {
        // 以前のフォーカス復元
        restorePreviousFocus();
        document.body.style.overflow = "";
      }

      return undefined;
    }, [isOpen, setInitialFocus, restorePreviousFocus]);

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

    // フォーカストラップユーティリティ関数 - Cognitive Complexity減少
    const handleTabNavigation = useCallback(
      (event: React.KeyboardEvent<HTMLDialogElement>) => {
        const modalElement = modalRef.current;
        if (!modalElement) {
          console.warn("Modal element not found during focus trap");
          return;
        }

        const focusableElements = modalElement.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) {
          console.warn("No focusable elements found in modal");
          return;
        }

        const focusableArray = Array.from(focusableElements);
        const firstElement = focusableArray[0];
        const lastElement = focusableArray[focusableArray.length - 1];
        const currentActiveElement = document.activeElement;

        if (!firstElement || !lastElement) {
          console.warn("Invalid focusable elements in modal");
          return;
        }

        try {
          if (event.shiftKey && currentActiveElement === firstElement) {
            event.preventDefault();
            if (typeof lastElement.focus === "function") {
              lastElement.focus();
            }
          } else if (!event.shiftKey && currentActiveElement === lastElement) {
            event.preventDefault();
            if (typeof firstElement.focus === "function") {
              firstElement.focus();
            }
          }
        } catch (error) {
          console.error(
            "Focus trap error:",
            error instanceof Error ? error.message : String(error)
          );
        }
      },
      []
    );

    // フォーカストラップ - Tab/Shift+Tab のキー処理
    useEffect(() => {
      if (!isOpen) return undefined;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Tab") {
          handleTabNavigation(
            event as unknown as React.KeyboardEvent<HTMLDialogElement>
          );
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleTabNavigation]);

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

    // Portalで動的なコンテナにレンダリング - HTML5 dialog要素使用
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
        {/* オーバーレイクリック用の適切な対話的要素 - WCAG 2.2準拠 */}
        <button
          type="button"
          className="filter-modal-backdrop"
          onClick={e => {
            console.log("🎯 Backdrop clicked!", e.target);
            onClose();
          }}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              console.log("⌨️ Backdrop keyboard activated:", e.key);
              e.preventDefault();
              onClose();
            }
          }}
          aria-label="モーダルを閉じる"
          data-testid="filter-modal-backdrop"
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
              🍣 佐渡グルメ検索
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
      portalContainer
    );
  }
);

FilterModal.displayName = "FilterModal";
