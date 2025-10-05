/**
 * LoadingSpinner コンポーネントのテスト
 *
 * Phase 8 Task 1.2.1 実装
 */

import { cleanup, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { LoadingSpinner } from "./LoadingSpinner";

expect.extend(toHaveNoViolations);

// 各テスト後に確実にクリーンアップ
afterEach(() => {
  cleanup();
});

describe("LoadingSpinner", () => {
  describe("基本レンダリング", () => {
    it("デフォルトメッセージで正常にレンダリングされる", () => {
      render(<LoadingSpinner />);

      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("カスタムメッセージが表示される", () => {
      const customMessage = "地図を読み込み中...";
      render(<LoadingSpinner message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it("カスタムクラス名が適用される", () => {
      render(<LoadingSpinner className="custom-spinner" />);

      const container = screen.getByRole("status");
      expect(container).toHaveClass("loading-spinner-container");
      expect(container).toHaveClass("custom-spinner");
    });

    it("カスタムスタイルが適用される", () => {
      const customStyle = { backgroundColor: "red", padding: "10px" };
      const { container } = render(<LoadingSpinner style={customStyle} />);

      const statusElement = container.querySelector(
        '[role="status"]'
      ) as HTMLElement;
      // style prop が DOM 要素に渡されることを確認
      expect(statusElement?.style.backgroundColor).toBe("red");
      expect(statusElement?.style.padding).toBe("10px");
    });
  });

  describe("アクセシビリティ", () => {
    it("role='status' が設定されている", () => {
      render(<LoadingSpinner />);

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
    });

    it("aria-live='polite' が設定されている", () => {
      render(<LoadingSpinner />);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-live", "polite");
    });

    it("aria-label がメッセージと一致する", () => {
      const message = "データ取得中...";
      const { container } = render(<LoadingSpinner message={message} />);

      const status = container.querySelector('[role="status"]');
      expect(status).toHaveAttribute("aria-label", message);
    });

    it("カスタム aria-label が優先される", () => {
      const customLabel = "カスタムラベル";
      const { container } = render(
        <LoadingSpinner message="メッセージ" ariaLabel={customLabel} />
      );

      const status = container.querySelector('[role="status"]');
      expect(status).toHaveAttribute("aria-label", customLabel);
    });

    it("スピナー要素が aria-hidden='true' を持つ（視覚的装飾のみ）", () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector(".loading-spinner");
      expect(spinner).toHaveAttribute("aria-hidden", "true");
    });

    it("axe アクセシビリティチェックに合格する", async () => {
      const { container } = render(<LoadingSpinner />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("サイズバリエーション", () => {
    it("small サイズが正しく適用される", () => {
      const { container } = render(<LoadingSpinner size="small" />);

      const spinner = container.querySelector(".loading-spinner");
      expect(spinner).toHaveStyle({ width: "24px", height: "24px" });
    });

    it("medium サイズ（デフォルト）が正しく適用される", () => {
      const { container } = render(<LoadingSpinner size="medium" />);

      const spinner = container.querySelector(".loading-spinner");
      expect(spinner).toHaveStyle({ width: "40px", height: "40px" });
    });

    it("large サイズが正しく適用される", () => {
      const { container } = render(<LoadingSpinner size="large" />);

      const spinner = container.querySelector(".loading-spinner");
      expect(spinner).toHaveStyle({ width: "64px", height: "64px" });
    });
  });

  describe("エッジケース", () => {
    it("空文字列メッセージでもレンダリングされる", () => {
      const { container } = render(<LoadingSpinner message="" />);

      const status = container.querySelector('[role="status"]');
      expect(status).toBeInTheDocument();
    });

    it("非常に長いメッセージでも正常にレンダリングされる", () => {
      const longMessage = "あ".repeat(100);
      render(<LoadingSpinner message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("すべてのプロパティを同時に指定してもエラーが発生しない", () => {
      expect(() => {
        render(
          <LoadingSpinner
            message="テストメッセージ"
            size="large"
            className="test-class"
            style={{ color: "blue" }}
            ariaLabel="カスタムラベル"
          />
        );
      }).not.toThrow();
    });
  });
});
