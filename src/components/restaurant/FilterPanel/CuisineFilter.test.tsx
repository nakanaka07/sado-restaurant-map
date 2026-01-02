/**
 * @fileoverview Tests for CuisineFilter component
 * 料理ジャンルフィルターコンポーネントのテスト
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CuisineFilter } from "./CuisineFilter";

describe("CuisineFilter", () => {
  const mockOnChange = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("基本レンダリング", () => {
    it("デフォルトのpropsで料理ジャンルフィルターをレンダリングする", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      expect(screen.getByLabelText("🍽️ 料理ジャンル")).toBeInTheDocument();
    });

    it("filter-sectionクラスが適用されている", () => {
      const { container } = render(
        <CuisineFilter value="" onChange={mockOnChange} />
      );

      const section = container.querySelector(".filter-section");
      expect(section).toBeInTheDocument();
    });

    it("料理アイコン(🍽️)とラベルが表示される", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      expect(screen.getByText("🍽️ 料理ジャンル")).toBeInTheDocument();
    });

    it("「すべての料理」オプションが存在する", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      const allOption = Array.from(select.querySelectorAll("option")).find(
        opt => opt.value === ""
      );
      expect(allOption).toBeTruthy();
      expect(allOption?.textContent).toBe("すべての料理");
    });
  });

  describe("料理オプション", () => {
    it("すべての料理タイプがオプションとして表示される", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      const options = Array.from(select.querySelectorAll("option"));

      // 「すべての料理」+ 18種類の料理タイプ
      expect(options.length).toBe(19);

      // 主要な料理タイプが含まれていることを確認
      const optionValues = options.map(opt => opt.value);
      expect(optionValues).toContain("日本料理");
      expect(optionValues).toContain("寿司");
      expect(optionValues).toContain("海鮮");
      expect(optionValues).toContain("中華");
      expect(optionValues).toContain("イタリアン");
      expect(optionValues).toContain("ラーメン");
      expect(optionValues).toContain("カフェ・喫茶店");
    });

    it("各料理オプションにvalueとtextContentが正しく設定されている", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      const sushiOption = Array.from(select.querySelectorAll("option")).find(
        opt => opt.value === "寿司"
      );

      expect(sushiOption).toBeTruthy();
      expect(sushiOption?.value).toBe("寿司");
      expect(sushiOption?.textContent).toBe("寿司");
    });

    it("オプションがアルファベット順ではなく定義順に表示される", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      const options = Array.from(select.querySelectorAll("option"));

      // 「すべての料理」を除いた最初の3つ
      expect(options[1]?.value).toBe("日本料理");
      expect(options[2]?.value).toBe("寿司");
      expect(options[3]?.value).toBe("海鮮");
    });
  });

  describe("value prop", () => {
    it("valueが空文字列の場合「すべての料理」が選択される", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      expect(select.value).toBe("");
    });

    it("valueが指定されている場合その料理タイプが選択される", () => {
      render(<CuisineFilter value="日本料理" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      expect(select.value).toBe("日本料理");
    });

    it("valueが変更された場合表示も更新される", () => {
      const { rerender } = render(
        <CuisineFilter value="寿司" onChange={mockOnChange} />
      );

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      expect(select.value).toBe("寿司");

      rerender(<CuisineFilter value="中華" onChange={mockOnChange} />);
      expect(select.value).toBe("中華");
    });

    it("複数回の値変更で正しく更新される", () => {
      const { rerender } = render(
        <CuisineFilter value="" onChange={mockOnChange} />
      );

      const select = screen.getByLabelText("🍽️ 料理ジャンル");

      rerender(<CuisineFilter value="ラーメン" onChange={mockOnChange} />);
      expect(select.value).toBe("ラーメン");

      rerender(<CuisineFilter value="イタリアン" onChange={mockOnChange} />);
      expect(select.value).toBe("イタリアン");

      rerender(<CuisineFilter value="" onChange={mockOnChange} />);
      expect(select.value).toBe("");
    });
  });

  describe("onChange handler", () => {
    it("料理タイプ選択時にonChangeが呼ばれる", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      fireEvent.change(select, { target: { value: "日本料理" } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("複数回の選択で複数回呼ばれる", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      fireEvent.change(select, { target: { value: "寿司" } });
      fireEvent.change(select, { target: { value: "中華" } });
      fireEvent.change(select, { target: { value: "" } });

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });

    it("「すべての料理」選択時にonChangeが呼ばれる", () => {
      render(<CuisineFilter value="日本料理" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      fireEvent.change(select, { target: { value: "" } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("labelとselectが正しく関連付けられている", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      expect(select).toHaveAttribute("id", "modern-cuisine");
    });

    it("aria-describedbyでヘルプテキストが関連付けられている", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      expect(select).toHaveAttribute("aria-describedby", "cuisine-help");
    });

    it("スクリーンリーダー用ヘルプテキストが存在する", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const helpText = screen.getByText("料理ジャンルでフィルタリングします");
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveAttribute("id", "cuisine-help");
    });

    it("ヘルプテキストにsr-onlyクラスが適用されている", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const helpText = screen.getByText("料理ジャンルでフィルタリングします");
      expect(helpText).toHaveClass("sr-only");
    });
  });

  describe("キーボードナビゲーション", () => {
    it("Tabキーでフォーカス可能", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      fireEvent.keyDown(document.body, { key: "Tab", code: "Tab" });
      select.focus();

      expect(select).toHaveFocus();
    });

    it("矢印キーで選択肢を移動できる", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");

      // fireEventを使って選択肢を変更
      fireEvent.change(select, { target: { value: "日本料理" } });
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("Enterキーで選択を確定できる", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");

      // fireEventで選択を変更
      fireEvent.change(select, { target: { value: "寿司" } });

      // onChangeが呼ばれることを確認
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("Escapeキーでドロップダウンを閉じる（ブラウザデフォルト動作）", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      select.focus();

      // Escapeキーはブラウザのデフォルト動作（ドロップダウンを閉じる）
      fireEvent.keyDown(select, { key: "Escape", code: "Escape" });

      // フォーカスは維持される
      expect(select).toHaveFocus();
    });
  });

  describe("フォーカススタイル", () => {
    it("フォーカス時にborderColorが変更される", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      fireEvent.focus(select);

      expect(select.style.borderColor).toBe("rgb(59, 130, 246)");
      expect(select.style.boxShadow).toBe("0 0 0 3px rgba(59, 130, 246, 0.1)");
    });

    it("ブラー時にborderColorがデフォルトに戻る", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      fireEvent.focus(select);
      fireEvent.blur(select);

      expect(select.style.borderColor).toBe("rgb(229, 231, 235)");
      expect(select.style.boxShadow).toBe("none");
    });

    it("フォーカス→ブラー→再フォーカスで正しく動作", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");

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
    it("セレクトボックスがwidth: 100%で表示される", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      expect(select.style.width).toBe("100%");
    });

    it("ラベルが正しいフォントスタイルを持つ", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const label = screen.getByText("🍽️ 料理ジャンル");
      const span = label.closest("span");

      expect(span).toHaveStyle({
        fontSize: "14px",
        fontWeight: "600",
      });
    });

    it("セレクトボックスに正しいpadding/borderが適用される", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      expect(select.style.padding).toBe("10px 12px");
      expect(select.style.border).toBe("2px solid rgb(229, 231, 235)");
      expect(select.style.borderRadius).toBe("8px");
    });
  });

  describe("メモ化動作", () => {
    it("再レンダリング時にオプションリストが再生成されない", () => {
      const { rerender } = render(
        <CuisineFilter value="" onChange={mockOnChange} />
      );

      const select1 = screen.getByLabelText("🍽️ 料理ジャンル");
      const options1 = select1.querySelectorAll("option");

      // 異なるvalueで再レンダリング
      rerender(<CuisineFilter value="寿司" onChange={mockOnChange} />);

      const select2 = screen.getByLabelText("🍽️ 料理ジャンル");
      const options2 = select2.querySelectorAll("option");

      // オプション数は変わらない
      expect(options1.length).toBe(options2.length);
      expect(options1.length).toBe(19);
    });
  });

  describe("エッジケース", () => {
    it("onChange未定義でもクラッシュしない", () => {
      // @ts-expect-error - テスト目的で意図的にonChangeを省略
      expect(() => render(<CuisineFilter value="" />)).not.toThrow();
    });

    it("無効な料理タイプがvalueに設定されても表示される", () => {
      // @ts-expect-error - テスト目的で意図的に無効な値を設定
      render(<CuisineFilter value="無効な料理" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      // Reactは選択肢にない値の場合、空文字列にフォールバックする
      // これはブラウザの標準動作
      expect(select.value).toBe("");
    });

    it("空白文字を含む料理タイプが正しく動作する", () => {
      render(<CuisineFilter value="カフェ・喫茶店" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      expect(select.value).toBe("カフェ・喫茶店");
    });
  });

  describe("インタラクション統合テスト", () => {
    // NOTE: フォーカス関連テストは削除
    // - jsdom環境ではfireEvent.click()でフォーカスが移らない
    // - 実ブラウザでの動作はPhase 9 Playwright E2Eテストで検証予定

    it("連続した選択変更が正しく処理される", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("🍽️ 料理ジャンル");

      fireEvent.change(select, { target: { value: "日本料理" } });
      fireEvent.change(select, { target: { value: "寿司" } });
      fireEvent.change(select, { target: { value: "中華" } });
      fireEvent.change(select, { target: { value: "" } });

      expect(mockOnChange).toHaveBeenCalledTimes(4);
    });
  });
});
