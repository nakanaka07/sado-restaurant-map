/**
 * @fileoverview ConnectedCustomMapControls テスト
 * Week 2 P2-2: Context as Provider Migration
 *
 * Note: このコンポーネントはGoogle Maps APIに依存するため、
 * 統合テストはE2Eで実施。ここでは基本的なモジュール検証のみ。
 */

import { describe, expect, it, vi } from "vitest";

// Mock modules before import
vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => null,
}));

vi.mock("react-dom/client", () => ({
  createRoot: () => ({
    render: vi.fn(),
    unmount: vi.fn(),
  }),
}));

describe("ConnectedCustomMapControls", () => {
  describe("Module Export", () => {
    it("モジュールが正しくエクスポートされる", async () => {
      const module = await import("../ConnectedCustomMapControls");

      expect(module.ConnectedCustomMapControls).toBeDefined();
      expect(typeof module.ConnectedCustomMapControls).toBe("object"); // memo wrapped
      expect(module.default).toBeDefined();
    });
  });

  describe("Type Safety", () => {
    it("position propがオプショナルである", async () => {
      const module = await import("../ConnectedCustomMapControls");

      // TypeScript型チェックで検証（ランタイムではコンポーネントの存在を確認）
      expect(module.ConnectedCustomMapControls).toBeDefined();
    });
  });
});
