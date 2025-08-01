import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["../src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
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
    },
  },
});
