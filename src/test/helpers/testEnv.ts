/**
 * @fileoverview テスト環境セットアップヘルパー
 * beforeEach/afterEach の共通ボイラープレートを削減
 */

import { vi } from "vitest";

/**
 * テスト環境の型定義
 */
export interface TestEnv {
  /** console.error スパイ */
  consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  /** console.warn スパイ */
  consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  /** console.log スパイ */
  consoleLogSpy: ReturnType<typeof vi.spyOn>;
  /** console.info スパイ */
  consoleInfoSpy: ReturnType<typeof vi.spyOn>;
}

/**
 * テスト環境セットアップのオプション
 */
export interface SetupTestEnvOptions {
  /** DEV環境として設定するか (デフォルト: true) */
  isDev?: boolean;
  /** console.error を抑制するか (デフォルト: true) */
  suppressConsoleError?: boolean;
  /** console.warn を抑制するか (デフォルト: true) */
  suppressConsoleWarn?: boolean;
  /** console.log を抑制するか (デフォルト: false) */
  suppressConsoleLog?: boolean;
  /** console.info を抑制するか (デフォルト: false) */
  suppressConsoleInfo?: boolean;
  /** 追加の環境変数 */
  envVars?: Record<string, string | boolean>;
}

/**
 * テスト環境をセットアップする
 * beforeEach で使用して、console スパイと環境変数を設定
 *
 * @example
 * ```typescript
 * let testEnv: TestEnv;
 *
 * beforeEach(() => {
 *   testEnv = setupTestEnv();
 * });
 *
 * afterEach(() => {
 *   cleanupTestEnv(testEnv);
 * });
 * ```
 *
 * @param options セットアップオプション
 * @returns テスト環境オブジェクト
 */
export function setupTestEnv(options: SetupTestEnvOptions = {}): TestEnv {
  const {
    isDev = true,
    suppressConsoleError = true,
    suppressConsoleWarn = true,
    suppressConsoleLog = false,
    suppressConsoleInfo = false,
    envVars = {},
  } = options;

  // Console スパイを設定
  const consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(suppressConsoleError ? () => {} : console.error);

  const consoleWarnSpy = vi
    .spyOn(console, "warn")
    .mockImplementation(suppressConsoleWarn ? () => {} : console.warn);

  const consoleLogSpy = vi
    .spyOn(console, "log")
    .mockImplementation(suppressConsoleLog ? () => {} : console.log);

  const consoleInfoSpy = vi
    .spyOn(console, "info")
    .mockImplementation(suppressConsoleInfo ? () => {} : console.info);

  // 環境変数を設定
  vi.stubEnv("DEV", isDev);
  vi.stubEnv("PROD", !isDev);

  // 追加の環境変数を設定
  Object.entries(envVars).forEach(([key, value]) => {
    vi.stubEnv(key, String(value));
  });

  return {
    consoleErrorSpy,
    consoleWarnSpy,
    consoleLogSpy,
    consoleInfoSpy,
  };
}

/**
 * テスト環境をクリーンアップする
 * afterEach で使用して、スパイと環境変数をリセット
 *
 * @param testEnv setupTestEnv で作成したテスト環境
 */
export function cleanupTestEnv(testEnv: TestEnv): void {
  // Console スパイをリストア

  if (testEnv.consoleErrorSpy && "mockRestore" in testEnv.consoleErrorSpy) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    testEnv.consoleErrorSpy.mockRestore();
  }

  if (testEnv.consoleWarnSpy && "mockRestore" in testEnv.consoleWarnSpy) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    testEnv.consoleWarnSpy.mockRestore();
  }

  if (testEnv.consoleLogSpy && "mockRestore" in testEnv.consoleLogSpy) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    testEnv.consoleLogSpy.mockRestore();
  }

  if (testEnv.consoleInfoSpy && "mockRestore" in testEnv.consoleInfoSpy) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    testEnv.consoleInfoSpy.mockRestore();
  }

  // 環境変数をリセット
  vi.unstubAllEnvs();
}

/**
 * テスト環境の簡易セットアップ
 * beforeEach と afterEach を自動的に設定
 *
 * @example
 * ```typescript
 * describe("MyComponent", () => {
 *   const testEnv = autoSetupTestEnv();
 *
 *   it("should work", () => {
 *     // testEnv.consoleErrorSpy などを使用可能
 *   });
 * });
 * ```
 *
 * @param options セットアップオプション
 * @returns テスト環境オブジェクト（beforeEach で更新される）
 */
export function autoSetupTestEnv(options: SetupTestEnvOptions = {}): {
  current: TestEnv | null;
} {
  const testEnvRef = { current: null as TestEnv | null };

  beforeEach(() => {
    testEnvRef.current = setupTestEnv(options);
  });

  afterEach(() => {
    if (testEnvRef.current) {
      cleanupTestEnv(testEnvRef.current);
      testEnvRef.current = null;
    }
  });

  return testEnvRef;
}
