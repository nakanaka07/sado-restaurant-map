import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 *
 * @see https://playwright.dev/docs/test-configuration
 *
 * 目的:
 * - FilterModal等のユーザーインタラクションテスト
 * - Vitestでは困難なタイミング問題（ESCキー、スワイプ等）のテスト
 */
export default defineConfig({
  // テストディレクトリ
  testDir: "./e2e",

  // テストファイルパターン
  testMatch: "**/*.spec.ts",

  // 並列実行（CIでは制限）
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,

  // リトライ設定
  retries: process.env.CI ? 2 : 0,

  // レポーター
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  // グローバル設定
  use: {
    // ベースURL（devサーバー）
    baseURL: "http://localhost:5173",

    // トレース設定（失敗時のみ）
    trace: "on-first-retry",

    // スクリーンショット設定
    screenshot: "only-on-failure",

    // ビデオ設定
    video: "on-first-retry",

    // タイムアウト
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // テスト全体のタイムアウト
  timeout: 60000,

  // 期待値のタイムアウト
  expect: {
    timeout: 10000,
  },

  // プロジェクト（ブラウザ）設定
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // モバイルテスト（スワイプ操作等）
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  // 開発サーバー起動設定
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
