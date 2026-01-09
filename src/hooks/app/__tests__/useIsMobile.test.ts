/**
 * @fileoverview useIsMobile Hook Tests
 *
 * テスト対象:
 * - モバイル判定
 * - matchMediaリスナー
 * - テスト環境フォールバック
 */

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "../useIsMobile";

describe("useIsMobile", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let addEventListenerMock: ReturnType<typeof vi.fn>;
  let removeEventListenerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();

    matchMediaMock = vi.fn((query: string) => ({
      matches: query.includes("768") && window.innerWidth <= 768,
      media: query,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
    }));

    vi.stubGlobal("matchMedia", matchMediaMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("デスクトップ判定", () => {
    it("768px超の場合はfalseを返す", () => {
      vi.stubGlobal("innerWidth", 1024);

      matchMediaMock = vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }));
      vi.stubGlobal("matchMedia", matchMediaMock);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe("モバイル判定", () => {
    it("768px以下の場合はtrueを返す", () => {
      vi.stubGlobal("innerWidth", 375);

      matchMediaMock = vi.fn((query: string) => ({
        matches: true,
        media: query,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      }));
      vi.stubGlobal("matchMedia", matchMediaMock);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });
  });

  describe("リサイズ対応", () => {
    it("changeイベントリスナーが登録される", () => {
      renderHook(() => useIsMobile());

      expect(addEventListenerMock).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
    });

    it("アンマウント時にリスナーが解除される", () => {
      const { unmount } = renderHook(() => useIsMobile());

      unmount();

      expect(removeEventListenerMock).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
    });
  });

  describe("matchMedia未対応環境", () => {
    it("matchMediaがundefinedの場合はfalseを返す", () => {
      vi.stubGlobal("matchMedia", undefined);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe("breakpoint", () => {
    it("正しいメディアクエリが使用される", () => {
      renderHook(() => useIsMobile());

      expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 768px)");
    });
  });
});
