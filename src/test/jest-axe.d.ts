/**
 * @fileoverview jest-axeのTypeScript型定義拡張
 * アクセシビリティテストのためのカスタムマッチャー型定義
 */

import { AxeResults } from "axe-core";

declare global {
  namespace Vi {
    interface JestAssertion {
      toHaveNoViolations(): Promise<void>;
    }
  }
}

declare module "jest-axe" {
  export function axe(
    html: string | Element,
    options?: Record<string, unknown>
  ): Promise<AxeResults>;

  export function toHaveNoViolations(
    this: unknown,
    results?: AxeResults
  ): {
    message(): string;
    pass: boolean;
  };
}

export {};
