import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

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
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "dist/",
        "dev-dist/",
        "tools/",
        "scripts/",
      ],
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
      // PWA virtual module mock
      "virtual:pwa-register/react": path.resolve(
        __dirname,
        "../src/test/mocks/pwa-register.ts"
      ),
    },
  },
});
