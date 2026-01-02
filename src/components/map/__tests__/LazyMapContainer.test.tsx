/* @vitest-environment jsdom */
/**
 * @fileoverview LazyMapContainer Unit Tests
 * Intersection Observer遅延読み込みロジックのテスト
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LazyMapContainer } from "../LazyMapContainer";

// IntersectionObserver モック
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  // IntersectionObserver のモック実装（コンストラクタとして機能）
  class MockIntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string;
    readonly thresholds: ReadonlyArray<number>;
    readonly scrollMargin: string = "0px";

    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit
    ) {
      this.rootMargin = options?.rootMargin ?? "0px";
      this.thresholds = Array.isArray(options?.threshold)
        ? options.threshold
        : [options?.threshold ?? 0];
      mockIntersectionObserver(callback, options);
    }

    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = vi.fn();
    takeRecords = vi.fn(() => []);
  }

  // グローバルに IntersectionObserver を設定
  global.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;

  // モックをクリア
  mockIntersectionObserver.mockClear();
  mockObserve.mockClear();
  mockDisconnect.mockClear();
});

describe("LazyMapContainer", () => {
  it("初期状態ではプレースホルダーを表示", () => {
    render(
      <LazyMapContainer>
        <div data-testid="map-content">Map Content</div>
      </LazyMapContainer>
    );

    // プレースホルダーが表示されている
    expect(screen.getByText(/地図を準備中/)).toBeInTheDocument();

    // 地図コンテンツはまだ表示されていない
    expect(screen.queryByTestId("map-content")).not.toBeInTheDocument();
  });

  it("containerRefにIntersectionObserverが設定される", () => {
    render(
      <LazyMapContainer>
        <div>Map Content</div>
      </LazyMapContainer>
    );

    // IntersectionObserverが作成された（React 19 Strict Modeで2回呼ばれる可能性）
    expect(mockIntersectionObserver).toHaveBeenCalled();

    // observe が呼ばれた
    expect(mockObserve).toHaveBeenCalled();
  });

  it("Intersection時に地図コンテンツをロード", async () => {
    render(
      <LazyMapContainer>
        <div data-testid="map-content">Map Content</div>
      </LazyMapContainer>
    );

    // IntersectionObserver callback を取得
    const callArgs = mockIntersectionObserver.mock.calls[0];
    if (!callArgs) {
      throw new Error("IntersectionObserver was not called");
    }
    const callback = callArgs[0] as IntersectionObserverCallback;
    const mockObserver = {} as IntersectionObserver;

    // isIntersecting: true でコールバック実行
    callback(
      [
        {
          isIntersecting: true,
          intersectionRatio: 0.5,
          target: document.createElement("div"),
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ],
      mockObserver
    );

    // 地図コンテンツが表示される
    await waitFor(() => {
      expect(screen.getByTestId("map-content")).toBeInTheDocument();
    });

    // プレースホルダーは非表示
    expect(screen.queryByText(/地図を準備中/)).not.toBeInTheDocument();

    // disconnect が呼ばれた（React 19 Strict Modeで複数回呼ばれる可能性）
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("非Intersection時は地図をロードしない", async () => {
    render(
      <LazyMapContainer>
        <div data-testid="map-content">Map Content</div>
      </LazyMapContainer>
    );

    // IntersectionObserver callback を取得
    const callArgs = mockIntersectionObserver.mock.calls[0];
    if (!callArgs) {
      throw new Error("IntersectionObserver was not called");
    }
    const callback = callArgs[0] as IntersectionObserverCallback;
    const mockObserver = {} as IntersectionObserver;

    // isIntersecting: false でコールバック実行
    callback(
      [
        {
          isIntersecting: false,
          intersectionRatio: 0,
          target: document.createElement("div"),
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ],
      mockObserver
    );

    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 100));

    // プレースホルダーが表示されたまま
    expect(screen.getByText(/地図を準備中/)).toBeInTheDocument();

    // 地図コンテンツは表示されない
    expect(screen.queryByTestId("map-content")).not.toBeInTheDocument();
  });

  it("アンマウント時にIntersectionObserverをクリーンアップ", () => {
    const { unmount } = render(
      <LazyMapContainer>
        <div>Map Content</div>
      </LazyMapContainer>
    );

    // アンマウント
    unmount();

    // disconnect が呼ばれた
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("IntersectionObserver非対応環境では即座にロード", async () => {
    // IntersectionObserver を削除
    // @ts-expect-error Testing fallback behavior
    delete global.IntersectionObserver;

    render(
      <LazyMapContainer>
        <div data-testid="map-content">Map Content</div>
      </LazyMapContainer>
    );

    // 即座に地図コンテンツが表示される
    await waitFor(() => {
      expect(screen.getByTestId("map-content")).toBeInTheDocument();
    });

    // プレースホルダーは非表示
    expect(screen.queryByText(/地図を準備中/)).not.toBeInTheDocument();
  });

  it("アクセシビリティ属性が正しく設定される", () => {
    render(
      <LazyMapContainer>
        <div>Map Content</div>
      </LazyMapContainer>
    );

    const placeholder = screen.getByRole("status");
    expect(placeholder).toHaveAttribute("aria-live", "polite");
  });

  it("複数の子要素を正しくレンダリング", async () => {
    render(
      <LazyMapContainer>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </LazyMapContainer>
    );

    // IntersectionObserver callback を取得
    const callArgs = mockIntersectionObserver.mock.calls[0];
    if (!callArgs) {
      throw new Error("IntersectionObserver was not called");
    }
    const callback = callArgs[0] as IntersectionObserverCallback;
    const mockObserver = {} as IntersectionObserver;

    // Intersection トリガー
    callback(
      [
        {
          isIntersecting: true,
          intersectionRatio: 0.5,
          target: document.createElement("div"),
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ],
      mockObserver
    );

    // 両方の子要素が表示される
    await waitFor(() => {
      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });
  });

  it("threshold設定が正しく適用される", () => {
    render(
      <LazyMapContainer>
        <div>Map Content</div>
      </LazyMapContainer>
    );

    // IntersectionObserver が正しいオプションで作成された
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.1,
        rootMargin: "50px",
      })
    );
  });
});
