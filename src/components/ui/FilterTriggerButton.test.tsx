/**
 * @fileoverview FilterTriggerButton Component Tests
 * フィルタートリガーボタンの包括的テスト
 */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilterTriggerButton } from "./FilterTriggerButton";

describe("FilterTriggerButton", () => {
  const defaultProps = {
    onClick: vi.fn(),
    activeCount: 0,
  };

  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("ボタンがレンダリングされる", () => {
      render(<FilterTriggerButton {...defaultProps} />);

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "button");
    });

    it("デフォルトアイコンが表示される", () => {
      render(<FilterTriggerButton {...defaultProps} />);

      expect(screen.getByText("🔍")).toBeInTheDocument();
    });

    it("ラベルが表示される", () => {
      render(<FilterTriggerButton {...defaultProps} />);

      expect(screen.getByText("フィルター")).toBeInTheDocument();
    });

    it("className属性が正しく適用される", () => {
      const { container } = render(
        <FilterTriggerButton {...defaultProps} className="custom-class" />
      );

      const button = container.querySelector(".filter-trigger-btn");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("アクティブカウント", () => {
    it("activeCount=0の場合はバッジが表示されない", () => {
      render(<FilterTriggerButton {...defaultProps} activeCount={0} />);

      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("activeCount>0の場合はバッジが表示される", () => {
      render(<FilterTriggerButton {...defaultProps} activeCount={3} />);

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("バッジにaria-labelが設定される", () => {
      render(<FilterTriggerButton {...defaultProps} activeCount={5} />);

      const badge = screen.getByText("5");
      expect(badge).toHaveAttribute("aria-label", "5件の条件が設定中");
    });

    it("data-active属性がactiveCount>0で設定される", () => {
      const { rerender } = render(
        <FilterTriggerButton {...defaultProps} activeCount={0} />
      );

      let button = screen.getByTestId("filter-trigger-button");
      expect(button).toHaveAttribute("data-active", "false");

      rerender(<FilterTriggerButton {...defaultProps} activeCount={1} />);

      button = screen.getByTestId("filter-trigger-button");
      expect(button).toHaveAttribute("data-active", "true");
    });
  });

  describe("ローディング状態", () => {
    it("isLoading=trueの場合はローディングアイコンが表示される", () => {
      render(<FilterTriggerButton {...defaultProps} isLoading={true} />);

      expect(screen.getByText("⏳")).toBeInTheDocument();
      expect(screen.queryByText("🔍")).not.toBeInTheDocument();
    });

    it("isLoading=trueの場合はボタンが無効化される", () => {
      render(<FilterTriggerButton {...defaultProps} isLoading={true} />);

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toBeDisabled();
    });

    it("data-loading属性が設定される", () => {
      render(<FilterTriggerButton {...defaultProps} isLoading={true} />);

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toHaveAttribute("data-loading", "true");
    });
  });

  describe("無効化状態", () => {
    it("disabled=trueの場合はボタンが無効化される", () => {
      render(<FilterTriggerButton {...defaultProps} disabled={true} />);

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toBeDisabled();
    });

    it("disabled=trueでもisLoading=trueでも無効化される", () => {
      render(
        <FilterTriggerButton
          {...defaultProps}
          disabled={true}
          isLoading={true}
        />
      );

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toBeDisabled();
    });
  });

  describe("アクセシビリティ", () => {
    it("デフォルトのaria-labelが設定される", () => {
      render(<FilterTriggerButton {...defaultProps} />);

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toHaveAttribute("aria-label", "フィルターを開く");
    });

    it("activeCount>0の場合はaria-labelに件数が含まれる", () => {
      render(<FilterTriggerButton {...defaultProps} activeCount={2} />);

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toHaveAttribute(
        "aria-label",
        "フィルターを開く (2件の条件が設定済み)"
      );
    });

    it("カスタムaria-labelが優先される", () => {
      render(
        <FilterTriggerButton {...defaultProps} aria-label="カスタムラベル" />
      );

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toHaveAttribute("aria-label", "カスタムラベル");
    });

    it("aria-pressed属性が設定される", () => {
      render(<FilterTriggerButton {...defaultProps} />);

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("aria-haspopup属性が設定される", () => {
      render(<FilterTriggerButton {...defaultProps} />);

      const button = screen.getByTestId("filter-trigger-button");
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
    });
  });

  describe("インタラクション", () => {
    it("クリック時にonClickが呼ばれる", async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();

      render(<FilterTriggerButton {...defaultProps} onClick={mockOnClick} />);

      const button = screen.getByTestId("filter-trigger-button");
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("Enterキー押下時にonClickが呼ばれる", async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();

      render(<FilterTriggerButton {...defaultProps} onClick={mockOnClick} />);

      const button = screen.getByTestId("filter-trigger-button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("Spaceキー押下時にonClickが呼ばれる", async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();

      render(<FilterTriggerButton {...defaultProps} onClick={mockOnClick} />);

      const button = screen.getByTestId("filter-trigger-button");
      button.focus();
      await user.keyboard(" ");

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("disabled=trueの場合はクリックが無視される", async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();

      render(
        <FilterTriggerButton
          {...defaultProps}
          onClick={mockOnClick}
          disabled={true}
        />
      );

      const button = screen.getByTestId("filter-trigger-button");
      await user.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("isLoading=trueの場合はクリックが無視される", async () => {
      const mockOnClick = vi.fn();
      const user = userEvent.setup();

      render(
        <FilterTriggerButton
          {...defaultProps}
          onClick={mockOnClick}
          isLoading={true}
        />
      );

      const button = screen.getByTestId("filter-trigger-button");
      await user.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe("displayName", () => {
    it("displayNameが設定されている", () => {
      expect(FilterTriggerButton.displayName).toBe("FilterTriggerButton");
    });
  });
});
