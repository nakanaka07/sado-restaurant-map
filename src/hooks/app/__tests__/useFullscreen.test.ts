/**
 * @fileoverview useFullscreen Hook Tests
 *
 * テスト対象:
 * - フルスクリーン状態検出
 * - イベントリスナー登録/解除
 * - CSSクラス操作
 */

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFullscreen } from "../useFullscreen";

describe("useFullscreen", () => {
  const documentClassListToggleMock = vi.fn();
  const bodyClassListToggleMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // classList.toggleをモック
    vi.spyOn(document.documentElement.classList, "toggle").mockImplementation(
      documentClassListToggleMock
    );
    vi.spyOn(document.body.classList, "toggle").mockImplementation(
      bodyClassListToggleMock
    );
    vi.spyOn(document.documentElement.classList, "remove").mockImplementation(
      vi.fn()
    );
    vi.spyOn(document.body.classList, "remove").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初期状態", () => {
    it("フルスクリーンでない場合はfalseを返す", () => {
      // fullscreenElementが未定義の場合
      Object.defineProperty(document, "fullscreenElement", {
        value: null,
        configurable: true,
      });

      const { result } = renderHook(() => useFullscreen());

      expect(result.current).toBe(false);
    });

    it("フルスクリーン中はtrueを返す", () => {
      // fullscreenElementがある場合
      Object.defineProperty(document, "fullscreenElement", {
        value: document.body,
        configurable: true,
      });

      const { result } = renderHook(() => useFullscreen());

      expect(result.current).toBe(true);
    });
  });

  describe("フルスクリーン変更イベント", () => {
    it("fullscreenchangeイベントでハンドラーが呼び出される", () => {
      // fullscreenchangeイベントがリスナーに正しく登録されているかテスト
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      renderHook(() => useFullscreen());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "fullscreenchange",
        expect.any(Function)
      );
    });

    // Note: jsdomではdocument.fullscreenElementのgetterモックが正しく動作しないため
    // イベント発火による状態変化のテストは省略
    // 実際のブラウザでの動作はE2Eテストでカバー
  });

  describe("CSSクラス操作", () => {
    it("フルスクリーン時にfullscreen-activeクラスが付与される", () => {
      Object.defineProperty(document, "fullscreenElement", {
        value: document.body,
        configurable: true,
      });

      renderHook(() => useFullscreen());

      expect(documentClassListToggleMock).toHaveBeenCalledWith(
        "fullscreen-active",
        true
      );
      expect(bodyClassListToggleMock).toHaveBeenCalledWith(
        "fullscreen-active",
        true
      );
    });

    it("通常モード時にfullscreen-activeクラスが解除される", () => {
      Object.defineProperty(document, "fullscreenElement", {
        value: null,
        configurable: true,
      });

      renderHook(() => useFullscreen());

      expect(documentClassListToggleMock).toHaveBeenCalledWith(
        "fullscreen-active",
        false
      );
      expect(bodyClassListToggleMock).toHaveBeenCalledWith(
        "fullscreen-active",
        false
      );
    });
  });

  describe("クリーンアップ", () => {
    it("アンマウント時にイベントリスナーが解除される", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderHook(() => useFullscreen());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "fullscreenchange",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "webkitfullscreenchange",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mozfullscreenchange",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "MSFullscreenChange",
        expect.any(Function)
      );
    });

    it("アンマウント時にCSSクラスが削除される", () => {
      const documentClassListRemoveMock = vi.fn();
      const bodyClassListRemoveMock = vi.fn();

      vi.spyOn(document.documentElement.classList, "remove").mockImplementation(
        documentClassListRemoveMock
      );
      vi.spyOn(document.body.classList, "remove").mockImplementation(
        bodyClassListRemoveMock
      );

      const { unmount } = renderHook(() => useFullscreen());

      unmount();

      expect(documentClassListRemoveMock).toHaveBeenCalledWith(
        "fullscreen-active"
      );
      expect(bodyClassListRemoveMock).toHaveBeenCalledWith("fullscreen-active");
    });
  });
});
