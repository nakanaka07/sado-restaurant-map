import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [path.resolve(__dirname, "../src/test/setup.ts")],
    // React 19 Concurrent Features 対応
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // テスト環境の安定化
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: "v8",
      // NOTE: coverage-badge ワークフローが coverage-summary.json を artifact として取得するため
      // Vitest で json-summary レポーターを追加し coverage/coverage-summary.json を生成する。
      // 以前は reporter に含まれておらず artifact が空 -> badge 生成失敗していた。
      reporter: ["text", "json", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "dist/",
        "dev-dist/",
        "tools/",
        "scripts/",
        ".vscode/",
        "data-platform/",
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      // カバレッジ閾値: 現在34.74%達成済み、30%を最低基準として設定
      // Week 1目標: 35% | Week 2目標: 40%
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 30,
        statements: 30,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
      "@components": path.resolve(__dirname, "../src/components"),
      "@hooks": path.resolve(__dirname, "../src/hooks"),
      "@types": path.resolve(__dirname, "../src/types"),
      "@utils": path.resolve(__dirname, "../src/utils"),
      "@config": path.resolve(__dirname, "../src/config"),
      // PWA virtual module mock (base)
      "virtual:pwa-register": path.resolve(
        __dirname,
        "../src/test/mocks/pwa-register.base.ts"
      ),
      // Image file mocks for testing (SVG, PNG, etc.)
      "\\.(png|jpg|jpeg|gif|svg|webp)$": path.resolve(
        __dirname,
        "../src/test/mocks/fileMock.ts"
      ),
    },
  },
  assetsInclude: ["**/*.png", "**/*.svg", "**/*.jpg", "**/*.jpeg"],
});
