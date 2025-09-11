import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "dev-dist",
      "node_modules",
      "coverage",
      "tools",
      "scripts",
      "../*.config.js",
      "vitest.config.ts",
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: [
          "./typescript/tsconfig.app.json",
          "./typescript/tsconfig.node.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // TypeScript型安全性強化 - enum一貫使用パターン対応
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unsafe-enum-comparison": "error",
      "@typescript-eslint/no-redundant-type-constituents": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/prefer-enum-initializers": "warn",
      "@typescript-eslint/prefer-literal-enum-member": "error",
      // React 19対応
      "react-hooks/exhaustive-deps": "warn",
      // パフォーマンス（JavaScriptビルトイン使用）
      "prefer-const": "error",
      "no-var": "error",
    },
    settings: {
      react: {
        version: "19.0",
      },
    },
  },
  // Node.js設定ファイル用
  {
    files: ["*.config.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  }
);
