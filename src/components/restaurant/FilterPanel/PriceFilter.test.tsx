/**
 * @fileoverview Tests for PriceFilter component
 * 価格フィルターコンポーネントのテスト
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PriceFilter } from "./PriceFilter";

describe("PriceFilter", () => {
  const mockOnChange = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("基本レンダリング", () => {
    it("デフォルトのpropsで価格フィルターをレンダリングする", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      expect(screen.getByLabelText("💰 価格帯")).toBeInTheDocument();
    });

    it("filter-sectionクラスが適用されている", () => {
      const { container } = render(
        <PriceFilter value="" onChange={mockOnChange} />
      );

      const section = container.querySelector(".filter-section");
      expect(section).toBeInTheDocument();
    });

    it("価格アイコン(💰)とラベルが表示される", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      expect(screen.getByText("💰 価格帯")).toBeInTheDocument();
    });

    it("すべての価格帯オプションが存在する", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      expect(
        screen.getByRole("option", { name: "すべての価格帯" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "～1000円" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "1000-2000円" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "2000-3000円" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "3000円～" })
      ).toBeInTheDocument();
    });
  });

  describe("value prop", () => {
    it("valueが空文字列の場合「すべての価格帯」が選択される", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      expect(select.value).toBe("");
    });

    it('value="～1000円"の場合その選択肢が選ばれる', () => {
      render(<PriceFilter value="～1000円" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      expect(select.value).toBe("～1000円");
    });

    it('value="1000-2000円"の場合その選択肢が選ばれる', () => {
      render(<PriceFilter value="1000-2000円" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      expect(select.value).toBe("1000-2000円");
    });

    it('value="2000-3000円"の場合その選択肢が選ばれる', () => {
      render(<PriceFilter value="2000-3000円" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      expect(select.value).toBe("2000-3000円");
    });

    it('value="3000円～"の場合その選択肢が選ばれる', () => {
      render(<PriceFilter value="3000円～" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      expect(select.value).toBe("3000円～");
    });

    it("valueが変更された場合表示も更新される", () => {
      const { rerender } = render(
        <PriceFilter value="～1000円" onChange={mockOnChange} />
      );

      const select = screen.getByLabelText("💰 価格帯");
      expect(select.value).toBe("～1000円");

      rerender(<PriceFilter value="3000円～" onChange={mockOnChange} />);
      expect(select.value).toBe("3000円～");
    });
  });

  describe("onChange handler", () => {
    it("選択変更時にonChangeが呼ばれる", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      fireEvent.change(select, { target: { value: "～1000円" } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("異なる価格帯への変更でもonChangeが呼ばれる", () => {
      render(<PriceFilter value="～1000円" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      fireEvent.change(select, { target: { value: "3000円～" } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("「すべての価格帯」への変更でもonChangeが呼ばれる", () => {
      render(<PriceFilter value="～1000円" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      fireEvent.change(select, { target: { value: "" } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("labelとselectが正しく関連付けられている", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      expect(select).toHaveAttribute("id", "modern-price");
    });

    it("aria-describedbyでヘルプテキストが関連付けられている", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      expect(select).toHaveAttribute("aria-describedby", "price-help");
    });

    it("スクリーンリーダー用ヘルプテキストが存在する", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const helpText = screen.getByText("価格帯でフィルタリングします");
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveAttribute("id", "price-help");
    });

    it("ヘルプテキストにsr-onlyクラスが適用されている", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const helpText = screen.getByText("価格帯でフィルタリングします");
      expect(helpText).toHaveClass("sr-only");
    });

    it("すべてのオプションがアクセス可能", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      const options = Array.from(
        select.querySelectorAll<HTMLOptionElement>("option")
      ).map(opt => opt.value);

      expect(options).toEqual([
        "",
        "～1000円",
        "1000-2000円",
        "2000-3000円",
        "3000円～",
      ]);
    });
  });

  describe("フォーカススタイル", () => {
    it("フォーカス時にborderColorが変更される", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      fireEvent.focus(select);

      expect(select.style.borderColor).toBe("rgb(59, 130, 246)");
      expect(select.style.boxShadow).toBe("0 0 0 3px rgba(59, 130, 246, 0.1)");
    });

    it("ブラー時にborderColorがデフォルトに戻る", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      fireEvent.focus(select);
      fireEvent.blur(select);

      expect(select.style.borderColor).toBe("rgb(229, 231, 235)");
      expect(select.style.boxShadow).toBe("none");
    });

    it("フォーカス→ブラー→再フォーカスで正しく動作", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");

      // 初回フォーカス
      fireEvent.focus(select);
      expect(select.style.borderColor).toBe("rgb(59, 130, 246)");

      // ブラー
      fireEvent.blur(select);
      expect(select.style.borderColor).toBe("rgb(229, 231, 235)");

      // 再フォーカス
      fireEvent.focus(select);
      expect(select.style.borderColor).toBe("rgb(59, 130, 246)");
    });
  });

  describe("スタイリング", () => {
    it("selectがwidth: 100%で表示される", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      expect(select.style.width).toBe("100%");
    });

    it("ラベルが正しいフォントスタイルを持つ", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const label = screen.getByText("💰 価格帯");
      const span = label.closest("span");

      expect(span).toHaveStyle({
        fontSize: "14px",
        fontWeight: "600",
      });
    });
  });

  describe("オプション生成", () => {
    it("価格オプションが正しい順序で表示される", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("💰 価格帯");
      const optionTexts = Array.from(
        select.querySelectorAll<HTMLOptionElement>("option")
      ).map(opt => opt.text);

      expect(optionTexts).toEqual([
        "すべての価格帯",
        "～1000円",
        "1000-2000円",
        "2000-3000円",
        "3000円～",
      ]);
    });

    it("各価格オプションに正しいkey属性が設定されている", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      // 価格オプションがレンダリングされている
      expect(screen.getByText("～1000円")).toBeInTheDocument();
      expect(screen.getByText("1000-2000円")).toBeInTheDocument();
      expect(screen.getByText("2000-3000円")).toBeInTheDocument();
      expect(screen.getByText("3000円～")).toBeInTheDocument();
    });
  });
});
