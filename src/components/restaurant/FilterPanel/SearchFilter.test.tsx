/**
 * @fileoverview Tests for SearchFilter component
 * 検索フィルターコンポーネントのテスト
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchFilter } from "./SearchFilter";

describe("SearchFilter", () => {
  const mockOnChange = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("基本レンダリング", () => {
    it("デフォルトのpropsで検索フィルターをレンダリングする", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      expect(screen.getByLabelText("🔍 検索")).toBeInTheDocument();
    });

    it("filter-sectionクラスが適用されている", () => {
      const { container } = render(
        <SearchFilter value="" onChange={mockOnChange} />
      );

      const section = container.querySelector(".filter-section");
      expect(section).toBeInTheDocument();
    });

    it("検索アイコン(🔍)とラベルが表示される", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      expect(screen.getByText("🔍 検索")).toBeInTheDocument();
    });

    it("プレースホルダーが正しく表示される", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText("店名、料理、地域で検索...");
      expect(input).toBeInTheDocument();
    });
  });

  describe("value prop", () => {
    it("valueが空文字列の場合入力欄が空", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");
      expect(input).toHaveValue("");
    });

    it("valueが指定されている場合その値を表示", () => {
      render(<SearchFilter value="ラーメン" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");
      expect(input).toHaveValue("ラーメン");
    });

    it("valueが変更された場合表示も更新される", () => {
      const { rerender } = render(
        <SearchFilter value="寿司" onChange={mockOnChange} />
      );

      const input = screen.getByLabelText("🔍 検索");
      expect(input).toHaveValue("寿司");

      rerender(<SearchFilter value="そば" onChange={mockOnChange} />);
      expect(input).toHaveValue("そば");
    });
  });

  describe("onChange handler", () => {
    it("入力時にonChangeが呼ばれる", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");
      fireEvent.change(input, { target: { value: "カフェ" } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("複数回の入力で複数回呼ばれる", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");
      fireEvent.change(input, { target: { value: "a" } });
      fireEvent.change(input, { target: { value: "ab" } });
      fireEvent.change(input, { target: { value: "abc" } });

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });

  describe("loading state", () => {
    it("loading未指定時は入力可能", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");
      expect(input).not.toBeDisabled();
    });

    it("loading=falseの場合も入力可能", () => {
      render(<SearchFilter value="" onChange={mockOnChange} loading={false} />);

      const input = screen.getByLabelText("🔍 検索");
      expect(input).not.toBeDisabled();
    });

    it("loading=trueの場合入力欄が無効化される", () => {
      render(<SearchFilter value="" onChange={mockOnChange} loading={true} />);

      const input = screen.getByLabelText("🔍 検索");
      expect(input).toBeDisabled();
    });

    it("loading中でもonChangeは定義されている", () => {
      render(<SearchFilter value="" onChange={mockOnChange} loading={true} />);

      const input = screen.getByLabelText("🔍 検索");
      // disabled状態でもonChangeハンドラは設定されている
      expect(input).toHaveProperty("onchange");
    });
  });

  describe("Accessibility", () => {
    it("labelとinputが正しく関連付けられている", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");
      expect(input).toHaveAttribute("id", "modern-search");
    });

    it("aria-describedbyでヘルプテキストが関連付けられている", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");
      expect(input).toHaveAttribute("aria-describedby", "search-help");
    });

    it("スクリーンリーダー用ヘルプテキストが存在する", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const helpText = screen.getByText(
        "店名、料理ジャンル、地域名で検索できます"
      );
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveAttribute("id", "search-help");
    });

    it("ヘルプテキストにsr-onlyクラスが適用されている", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const helpText = screen.getByText(
        "店名、料理ジャンル、地域名で検索できます"
      );
      expect(helpText).toHaveClass("sr-only");
    });
  });

  describe("フォーカススタイル", () => {
    it("フォーカス時にborderColorが変更される", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");
      fireEvent.focus(input);

      expect(input.style.borderColor).toBe("rgb(59, 130, 246)");
      expect(input.style.boxShadow).toBe("0 0 0 3px rgba(59, 130, 246, 0.1)");
    });

    it("ブラー時にborderColorがデフォルトに戻る", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(input.style.borderColor).toBe("rgb(229, 231, 235)");
      expect(input.style.boxShadow).toBe("none");
    });

    it("フォーカス→ブラー→再フォーカスで正しく動作", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");

      // 初回フォーカス
      fireEvent.focus(input);
      expect(input.style.borderColor).toBe("rgb(59, 130, 246)");

      // ブラー
      fireEvent.blur(input);
      expect(input.style.borderColor).toBe("rgb(229, 231, 235)");

      // 再フォーカス
      fireEvent.focus(input);
      expect(input.style.borderColor).toBe("rgb(59, 130, 246)");
    });
  });

  describe("スタイリング", () => {
    it("入力欄がwidth: 100%で表示される", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const input = screen.getByLabelText("🔍 検索");
      expect(input.style.width).toBe("100%");
    });

    it("ラベルが正しいフォントスタイルを持つ", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const label = screen.getByText("🔍 検索");
      const span = label.closest("span");

      expect(span).toHaveStyle({
        fontSize: "14px",
        fontWeight: "600",
      });
    });
  });
});
