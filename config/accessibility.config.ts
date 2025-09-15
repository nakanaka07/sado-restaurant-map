import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "accessibility-tests",
    include: ["src/test/accessibility/**/*.test.{js,ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/accessibility/setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
