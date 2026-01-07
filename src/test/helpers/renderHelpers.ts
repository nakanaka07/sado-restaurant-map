/**
 * @fileoverview React Testing Library ラッパーヘルパー
 * render/renderHook の共通設定とボイラープレート削減
 */

import type { RenderHookOptions, RenderOptions } from "@testing-library/react";
import { render, renderHook } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

/**
 * カスタムレンダーオプション
 */
export interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /** カスタムラッパーコンポーネント */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
  /** 追加の初期化処理 */
  onRender?: () => void;
}

/**
 * React Testing Library の render をラップして、共通設定を適用
 *
 * @example
 * ```typescript
 * const { getByRole } = renderWithTestWrapper(
 *   <MyComponent />,
 *   { wrapper: MyProvider }
 * );
 * ```
 *
 * @param ui レンダリングする React 要素
 * @param options レンダーオプション
 * @returns Testing Library の render 結果
 */
export function renderWithTestWrapper(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { wrapper, onRender, ...renderOptions } = options;

  // レンダリング前の初期化処理
  if (onRender) {
    onRender();
  }

  // wrapperは既にReact.ComponentType型なので直接使用可能
  return render(ui, {
    wrapper,
    ...renderOptions,
  });
}

/**
 * カスタムレンダーフックオプション
 */
export interface CustomRenderHookOptions<
  TProps,
> extends RenderHookOptions<TProps> {
  /** 追加の初期化処理 */
  onRender?: () => void;
}

/**
 * React Testing Library の renderHook をラップして、共通設定を適用
 *
 * @example
 * ```typescript
 * const { result } = renderHookWithTestWrapper(() =>
 *   useMyHook({ value: 123 })
 * );
 * ```
 *
 * @param hook テストするフック
 * @param options レンダーフックオプション
 * @returns Testing Library の renderHook 結果
 */
export function renderHookWithTestWrapper<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: CustomRenderHookOptions<TProps> = {}
) {
  const { onRender, ...renderHookOptions } = options;

  // レンダリング前の初期化処理
  if (onRender) {
    onRender();
  }

  return renderHook(hook, renderHookOptions);
}

/**
 * 複数のモック関数をまとめてリセット
 *
 * @example
 * ```typescript
 * const mocks = resetMocks(mockFn1, mockFn2, mockFn3);
 * ```
 *
 * @param mocks リセットするモック関数の配列
 */
export function resetMocks(
  ...mocks: Array<ReturnType<typeof vi.fn> | undefined>
): void {
  mocks.forEach(mock => {
    if (mock && typeof mock.mockClear === "function") {
      mock.mockClear();
    }
  });
}
