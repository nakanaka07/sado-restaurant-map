/**
 * @fileoverview Vitestテスト環境のグローバル設定
 * アクセシビリティテストとモック環境の初期化
 */

import { toHaveNoViolations } from "jest-axe";
import { expect, vi } from "vitest";

// axe-coreのカスタムマッチャーを拡張
expect.extend(toHaveNoViolations);

// viを完全にグローバル化
(globalThis as unknown as { vi: typeof vi }).vi = vi;

// JSDOM環境でのSVG要素サポート改善
Object.defineProperty(global.SVGElement.prototype, "getBBox", {
  value: vi.fn(() => ({
    x: 0,
    y: 0,
    width: 24,
    height: 30,
  })),
  writable: true,
});

// PerformanceAPI mock
(globalThis as unknown as { performance: Performance }).performance =
  globalThis.performance ||
  ({
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  } as unknown as Performance);
