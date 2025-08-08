import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CuisineFilter } from "./CuisineFilter";

describe("CuisineFilter", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("正常にレンダリングされること", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      expect(screen.getByLabelText("料理分野")).toBeInTheDocument();
      expect(screen.getByText("すべての料理")).toBeInTheDocument();
    });

    it("ヘルプテキストが表示されること", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      expect(
        screen.getByText("料理の種類でお店を絞り込み")
      ).toBeInTheDocument();
    });

    it("すべての料理オプションが表示されること", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("料理分野");
      const options = Array.from(select.querySelectorAll("option"));

      expect(options).toHaveLength(19); // すべての料理オプション
      expect(options[0]).toHaveTextContent("すべての料理");
      expect(options[1]).toHaveTextContent("日本料理");
      expect(options[2]).toHaveTextContent("寿司");
      expect(options[3]).toHaveTextContent("海鮮");
    });
  });

  describe("選択機能", () => {
    it("料理分野選択時にコールバックが呼ばれること", async () => {
      const user = userEvent.setup();
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("料理分野");
      await user.selectOptions(select, "寿司");

      expect(mockOnChange).toHaveBeenCalledWith("寿司");
    });

    it("すべての料理選択時に空文字が送信されること", async () => {
      const user = userEvent.setup();
      render(<CuisineFilter value="寿司" onChange={mockOnChange} />);

      const select = screen.getByLabelText("料理分野");
      await user.selectOptions(select, "");

      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("複数の料理分野を順次選択できること", async () => {
      const user = userEvent.setup();
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("料理分野");

      await user.selectOptions(select, "寿司");
      expect(mockOnChange).toHaveBeenCalledWith("寿司");

      await user.selectOptions(select, "イタリアン");
      expect(mockOnChange).toHaveBeenCalledWith("イタリアン");

      await user.selectOptions(select, "カフェ・喫茶店");
      expect(mockOnChange).toHaveBeenCalledWith("カフェ・喫茶店");
    });
  });

  describe("値の制御", () => {
    it("初期値が正しく設定されること", () => {
      render(<CuisineFilter value="寿司" onChange={mockOnChange} />);

      const select = screen.getByLabelText("料理分野");
      expect(select).toHaveValue("寿司");
    });

    it("外部から値を制御できること", () => {
      const { rerender } = render(
        <CuisineFilter value="" onChange={mockOnChange} />
      );

      let select = screen.getByLabelText("料理分野");
      expect(select).toHaveValue("");

      rerender(<CuisineFilter value="イタリアン" onChange={mockOnChange} />);
      select = screen.getByLabelText("料理分野");
      expect(select).toHaveValue("イタリアン");
    });

    it("空文字が選択されていること", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("料理分野");
      expect(select).toHaveValue("");
    });
  });

  describe("アクセシビリティ", () => {
    it("ラベルが正しく関連付けられていること", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("料理分野");
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute("id", "cuisine-select");
    });

    it("ヘルプテキストが関連付けられていること", () => {
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("料理分野");
      expect(select).toHaveAttribute("aria-describedby", "cuisine-help");
    });

    it("フォーカス可能であること", async () => {
      const user = userEvent.setup();
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("料理分野");
      await user.click(select);

      expect(select).toHaveFocus();
    });

    it("キーボードで操作できること", async () => {
      const user = userEvent.setup();
      render(<CuisineFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("料理分野");

      // selectで選択肢を変更
      await user.selectOptions(select, "日本料理");

      expect(mockOnChange).toHaveBeenCalledWith("日本料理");
    });
  });

  describe("特定の料理分野オプション", () => {
    const testCases = [
      { value: "日本料理", label: "日本料理" },
      { value: "寿司", label: "寿司" },
      { value: "海鮮", label: "海鮮" },
      { value: "焼肉・焼鳥", label: "焼肉・焼鳥" },
      { value: "ラーメン", label: "ラーメン" },
      { value: "そば・うどん", label: "そば・うどん" },
      { value: "中華", label: "中華" },
      { value: "イタリアン", label: "イタリアン" },
      { value: "フレンチ", label: "フレンチ" },
      { value: "カフェ・喫茶店", label: "カフェ・喫茶店" },
      { value: "バー・居酒屋", label: "バー・居酒屋" },
      { value: "ファストフード", label: "ファストフード" },
      { value: "デザート・スイーツ", label: "デザート・スイーツ" },
      { value: "カレー・エスニック", label: "カレー・エスニック" },
      { value: "ステーキ・洋食", label: "ステーキ・洋食" },
      { value: "弁当・テイクアウト", label: "弁当・テイクアウト" },
      { value: "レストラン", label: "レストラン" },
      { value: "その他", label: "その他" },
    ];

    testCases.forEach(({ value, label }) => {
      it(`${label}が選択できること`, async () => {
        const user = userEvent.setup();
        render(<CuisineFilter value="" onChange={mockOnChange} />);

        const select = screen.getByLabelText("料理分野");
        await user.selectOptions(select, value);

        expect(mockOnChange).toHaveBeenCalledWith(value);
      });
    });

    testCases.forEach(({ value, label }) => {
      it(`${label}が初期値として設定できること`, () => {
        render(<CuisineFilter value={value as any} onChange={mockOnChange} />);

        const select = screen.getByLabelText("料理分野");
        expect(select).toHaveValue(value);
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("無効な値でも正常に動作すること", () => {
      // TypeScriptの型チェックを回避して無効な値をテスト
      render(
        <CuisineFilter value={"invalid" as any} onChange={mockOnChange} />
      );

      const select = screen.getByLabelText("料理分野");
      expect(select).toHaveValue("invalid");
    });

    it("コールバックが未定義でもエラーが発生しないこと", async () => {
      const user = userEvent.setup();
      render(<CuisineFilter value="" onChange={undefined as any} />);

      const select = screen.getByLabelText("料理分野");

      // エラーが発生しないことを確認
      await expect(user.selectOptions(select, "寿司")).resolves.not.toThrow();
    });
  });
});
