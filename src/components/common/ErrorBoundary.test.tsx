/* @vitest-environment jsdom */
/**
 * ErrorBoundary コンポーネントのテスト
 *
 * Phase 8 Task 1.2.2 実装
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

// エラーをスローするテストコンポーネント
const ThrowError = ({ message = "Test error" }: { message?: string } = {}) => {
  throw new Error(message);
};

// console.error をモック（React のエラーログを抑制）
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  vi.clearAllMocks();
});

describe("ErrorBoundary", () => {
  describe("基本動作", () => {
    it("エラーがない場合は子要素を正常に表示", () => {
      const { container } = render(
        <ErrorBoundary>
          <div data-testid="normal-content">正常なコンテンツ</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId("normal-content")).toBeInTheDocument();
      expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
    });

    it("エラーが発生した場合はフォールバック UI を表示", () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // role="alert" が存在することを確認
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
    });

    it("デフォルトのエラーメッセージが表示される", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(
        screen.getAllByText(
          /申し訳ございません。アプリケーションでエラーが発生しました。/
        )[0]
      ).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("role='alert' が設定されている", () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it("aria-live='assertive' が設定されている", () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveAttribute("aria-live", "assertive");
    });

    it("エラーアイコンが aria-hidden='true' を持つ", () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // エラーアイコン（⚠️）を含む div を探す
      const icon = Array.from(container.querySelectorAll("div")).find(
        el => el.textContent === "⚠️"
      );
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("カスタムフォールバック", () => {
    it("カスタムフォールバックが提供された場合はそれを使用", () => {
      const customFallback = (error: Error | null) => (
        <div data-testid="custom-fallback">
          カスタムエラー: {error?.message}
        </div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
      expect(screen.getByText(/カスタムエラー:/)).toBeInTheDocument();
    });
  });

  describe("エラーハンドラー", () => {
    it("onError コールバックが呼ばれる", async () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Test error" }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it("onError が例外をスローしてもアプリはクラッシュしない", () => {
      const onError = vi.fn(() => {
        throw new Error("Callback error");
      });

      // render 自体は成功するはず
      const { container } = render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      // フォールバック UI は表示される
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe("boundaryName", () => {
    it("boundaryName が指定された場合にログに含まれる", () => {
      const consoleError = vi.spyOn(console, "error");

      render(
        <ErrorBoundary boundaryName="TestBoundary">
          <ThrowError />
        </ErrorBoundary>
      );

      // console.error が呼ばれていることを確認
      expect(consoleError).toHaveBeenCalled();
      const errorCall = consoleError.mock.calls.find(call => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const firstArg = call[0];
        return (
          typeof firstArg === "string" &&
          firstArg.includes("[ErrorBoundary: TestBoundary]")
        );
      });
      expect(errorCall).toBeDefined();
    });
  });

  describe("ユーザーインタラクション", () => {
    it("リトライボタンが存在し、クリック可能", async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getAllByText("リトライ")[0];
      expect(retryButton).toBeInTheDocument();

      // クリックしても例外が発生しないことを確認
      await user.click(retryButton);
    });

    it("ページリロードボタンが存在する", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const reloadButton = screen.getAllByText("ページをリロード")[0];
      expect(reloadButton).toBeInTheDocument();
    });
  });

  describe("開発環境とプロダクション環境の違い", () => {
    it("開発環境ではエラー詳細の展開ボタンが表示される", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // 開発環境の場合、エラー詳細セクションが存在
      const detailsButtons = screen.queryAllByText(/エラー詳細を表示/);

      if (import.meta.env.DEV) {
        expect(detailsButtons.length).toBeGreaterThan(0);
        expect(detailsButtons[0]).toBeInTheDocument();
      } else {
        expect(detailsButtons.length).toBe(0);
      }
    });
  });

  describe("エッジケース", () => {
    it("エラーメッセージが長い場合でも正常に表示", () => {
      const longMessage = "あ".repeat(1000);

      render(
        <ErrorBoundary>
          <ThrowError message={longMessage} />
        </ErrorBoundary>
      );

      // フォールバック UI が表示されることを確認
      const errorHeadings = screen.getAllByText("エラーが発生しました");
      expect(errorHeadings[0]).toBeInTheDocument();
    });

    it("エラーオブジェクトが最小限の情報しか持たない場合", () => {
      const MinimalError = () => {
        const error = new Error("Minimal error");
        delete (error as { stack?: string }).stack;
        throw error;
      };

      const { container } = render(
        <ErrorBoundary>
          <MinimalError />
        </ErrorBoundary>
      );

      // フォールバック UI は表示される
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it("複数の子要素がある場合でも正常動作", () => {
      const { container } = render(
        <ErrorBoundary>
          <div>最初の要素</div>
          <ThrowError />
          <div>最後の要素</div>
        </ErrorBoundary>
      );

      // エラーが発生するとフォールバック UI が表示される
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });
});
