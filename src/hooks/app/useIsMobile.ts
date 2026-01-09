/**
 * @fileoverview Mobile Detection Hook
 * モバイルデバイス検出
 *
 * 責務:
 * - メディアクエリによるモバイル判定
 * - リサイズ対応
 * - テスト環境でのフォールバック
 *
 * @see docs/guidelines/COLLAB_PROMPT.md - 責務分離原則
 */

import { useEffect, useState } from "react";

// ==============================
// Constants
// ==============================

/** モバイル判定のブレークポイント */
const MOBILE_BREAKPOINT = 768;

// ==============================
// Hook Implementation
// ==============================

/**
 * モバイルデバイスを検出するカスタムフック
 *
 * @returns モバイル状態（true: モバイルデバイス）
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 *
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 * ```
 *
 * @remarks
 * - 768px以下をモバイルと判定
 * - matchMedia APIを使用（リサイズに自動対応）
 * - テスト環境ではデフォルトでfalse（デスクトップ）
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    /**
     * モバイル判定を実行
     */
    const checkMobile = () => {
      // テスト環境ではmatchMediaがundefinedの可能性があるためフォールバックを追加
      if (typeof window !== "undefined" && window.matchMedia) {
        const mobile = window.matchMedia(
          `(max-width: ${MOBILE_BREAKPOINT}px)`
        ).matches;

        if (import.meta.env.DEV) {
          console.log("🔍 Mobile Detection Debug:", {
            windowWidth: window.innerWidth,
            mediaQueryMatches: mobile,
            isMobile: mobile,
          });
        }

        setIsMobile(mobile);
      } else {
        // テスト環境等でmatchMediaが利用できない場合のデフォルト値
        if (import.meta.env.DEV) {
          console.log("⚠️ matchMedia not available, defaulting to desktop");
        }
        setIsMobile(false);
      }
    };

    // 初回チェック
    checkMobile();

    // matchMediaが利用可能な場合のみリスナーを設定
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia(
        `(max-width: ${MOBILE_BREAKPOINT}px)`
      );
      mediaQuery.addEventListener("change", checkMobile);

      return () => mediaQuery.removeEventListener("change", checkMobile);
    }

    // matchMediaが利用できない場合は何もしない
    return undefined;
  }, []);

  return isMobile;
}

export default useIsMobile;
