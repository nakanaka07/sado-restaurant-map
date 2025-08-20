import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

// Google Maps APIをモック
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-provider">{children}</div>
  ),
}));

// PWA関連をモック
vi.mock("./PWABadge", () => ({
  default: () => <div data-testid="pwa-badge">PWA Badge</div>,
}));

// 環境変数をモック
vi.mock("import.meta", () => ({
  env: {
    VITE_GOOGLE_MAPS_API_KEY: "test_api_key",
  },
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup(); // DOM要素の完全クリーンアップ
  });

  afterEach(() => {
    cleanup();
    // 残存する要素の強制削除（テスト間の分離保証）
    const remainingContainers = document.querySelectorAll(
      '.loading-container, output[aria-live="polite"]'
    );
    remainingContainers.forEach((container) => container.remove());
    const remainingHeadings = document.querySelectorAll("h1");
    remainingHeadings.forEach((heading) => heading.remove());
  });

  describe("基本レンダリング", () => {
    it("ローディング状態が表示されること", () => {
      render(<App />);

      // ローディング状態の確認
      expect(screen.getByText("🗺️ 佐渡飲食店マップ")).toBeInTheDocument();
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    it("ローディングコンテナが適切なARIA属性を持つこと", () => {
      render(<App />);

      // output要素がstatus役割を持っていることを確認
      const outputElement = screen.getByText("読み込み中...").closest("output");
      expect(outputElement).toBeInTheDocument();
      expect(outputElement).toHaveAttribute("aria-live", "polite");
      expect(outputElement).toHaveClass("loading-container");
    });
  });

  describe("アクセシビリティ", () => {
    it("適切なARIA属性が設定されていること", () => {
      render(<App />);

      // ローディング状態のoutput要素が存在することを確認
      const outputElement = screen.getByText("読み込み中...").closest("output");
      expect(outputElement).toBeInTheDocument();
      expect(outputElement).toHaveAttribute("aria-live", "polite");
    });

    it("見出しが適切な階層で設定されていること", () => {
      render(<App />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("🗺️ 佐渡飲食店マップ");
    });
  });

  describe("レスポンシブ対応", () => {
    it("読み込み状態でも適切にレンダリングされること", () => {
      render(<App />);

      // ローディング状態のoutput要素が存在することを確認
      const outputElement = screen.getByText("読み込み中...").closest("output");
      expect(outputElement).toBeInTheDocument();
      expect(outputElement).toHaveClass("loading-container");
    });
  });
});
