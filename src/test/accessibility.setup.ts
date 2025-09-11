/**
 * アクセシビリティテスト設定
 * @description React Testing LibraryとVitest用のアクセシビリティテストスイート
 */

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect } from "vitest";

// Testing Library DOM matchers
import "@testing-library/jest-dom/vitest";

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});

/**
 * 共通のアクセシビリティマッチャー
 */
expect.extend({
  toHaveAccessibleName(received: Element, expectedName: string) {
    const accessibleName =
      received.getAttribute("aria-label") ||
      received.getAttribute("aria-labelledby") ||
      received.textContent;

    const pass = accessibleName === expectedName;

    return {
      message: () =>
        `expected element to have accessible name "${expectedName}" but got "${accessibleName}"`,
      pass,
    };
  },
});

/**
 * カスタムレンダラー（必要に応じて拡張）
 */
export const renderWithAccessibility = (component: React.ReactElement) => {
  const renderResult = render(component);

  // アクセシビリティチェック用のヘルパー
  const checkAccessibility = () => {
    const interactiveElements = renderResult.container.querySelectorAll(
      "button, [role='button'], input, select, textarea, a[href]"
    );

    interactiveElements.forEach((element: Element) => {
      if (!element.getAttribute("aria-label") && !element.textContent?.trim()) {
        console.warn("Interactive element without accessible name:", element);
      }
    });
  };

  return {
    ...renderResult,
    checkAccessibility,
  };
};
