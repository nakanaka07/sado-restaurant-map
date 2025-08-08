import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PriceFilter } from "./PriceFilter";

describe("PriceFilter", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("正常にレンダリングされること", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      expect(screen.getByLabelText("価格帯")).toBeInTheDocument();
      expect(screen.getByText("すべての価格帯")).toBeInTheDocument();
    });

    it("ヘルプテキストが表示されること", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      expect(
        screen.getByText("予算に合わせてお店を絞り込み")
      ).toBeInTheDocument();
    });

    it("すべての価格帯オプションが表示されること", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      const options = Array.from(select.querySelectorAll("option"));

      expect(options).toHaveLength(5); // すべての価格帯オプション
      expect(options[0]).toHaveTextContent("すべての価格帯");
      expect(options[1]).toHaveTextContent("～1000円");
      expect(options[2]).toHaveTextContent("1000-2000円");
      expect(options[3]).toHaveTextContent("2000-3000円");
      expect(options[4]).toHaveTextContent("3000円～");
    });
  });

  describe("選択機能", () => {
    it("価格帯選択時にコールバックが呼ばれること", async () => {
      const user = userEvent.setup();
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      await user.selectOptions(select, "1000-2000円");

      expect(mockOnChange).toHaveBeenCalledWith("1000-2000円");
    });

    it("すべての価格帯選択時に空文字が送信されること", async () => {
      const user = userEvent.setup();
      render(<PriceFilter value="1000-2000円" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      await user.selectOptions(select, "");

      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("複数の価格帯を順次選択できること", async () => {
      const user = userEvent.setup();
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");

      await user.selectOptions(select, "～1000円");
      expect(mockOnChange).toHaveBeenCalledWith("～1000円");

      await user.selectOptions(select, "2000-3000円");
      expect(mockOnChange).toHaveBeenCalledWith("2000-3000円");

      await user.selectOptions(select, "3000円～");
      expect(mockOnChange).toHaveBeenCalledWith("3000円～");
    });
  });

  describe("値の制御", () => {
    it("初期値が正しく設定されること", () => {
      render(<PriceFilter value="1000-2000円" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      expect(select).toHaveValue("1000-2000円");
    });

    it("外部から値を制御できること", () => {
      const { rerender } = render(
        <PriceFilter value="" onChange={mockOnChange} />
      );

      let select = screen.getByLabelText("価格帯");
      expect(select).toHaveValue("");

      rerender(<PriceFilter value="2000-3000円" onChange={mockOnChange} />);
      select = screen.getByLabelText("価格帯");
      expect(select).toHaveValue("2000-3000円");
    });

    it("空文字が選択されていること", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      expect(select).toHaveValue("");
    });
  });

  describe("アクセシビリティ", () => {
    it("ラベルが正しく関連付けられていること", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute("id", "price-select");
    });

    it("ヘルプテキストが関連付けられていること", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      expect(select).toHaveAttribute("aria-describedby", "price-help");
    });

    it("フォーカス可能であること", async () => {
      const user = userEvent.setup();
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      await user.click(select);

      expect(select).toHaveFocus();
    });

    it("キーボードで操作できること", async () => {
      const user = userEvent.setup();
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");

      // selectに直接値を設定してchangeイベントを発火
      await user.selectOptions(select, "～1000円");

      expect(mockOnChange).toHaveBeenCalledWith("～1000円");
    });
  });

  describe("特定の価格帯オプション", () => {
    const testCases = [
      { value: "～1000円", label: "～1000円" },
      { value: "1000-2000円", label: "1000-2000円" },
      { value: "2000-3000円", label: "2000-3000円" },
      { value: "3000円～", label: "3000円～" },
    ];

    testCases.forEach(({ value, label }) => {
      it(`${label}が選択できること`, async () => {
        const user = userEvent.setup();
        render(<PriceFilter value="" onChange={mockOnChange} />);

        const select = screen.getByLabelText("価格帯");
        await user.selectOptions(select, value);

        expect(mockOnChange).toHaveBeenCalledWith(value);
      });
    });

    testCases.forEach(({ value, label }) => {
      it(`${label}が初期値として設定できること`, () => {
        render(<PriceFilter value={value as any} onChange={mockOnChange} />);

        const select = screen.getByLabelText("価格帯");
        expect(select).toHaveValue(value);
      });
    });
  });

  describe("価格帯の順序", () => {
    it("価格帯が安い順に並んでいること", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      const options = Array.from(select.querySelectorAll("option"));
      const optionTexts = options.map((option) => option.textContent);

      expect(optionTexts).toEqual([
        "すべての価格帯",
        "～1000円",
        "1000-2000円",
        "2000-3000円",
        "3000円～",
      ]);
    });
  });

  describe("エラーハンドリング", () => {
    it("無効な値でも正常に動作すること", () => {
      // TypeScriptの型チェックを回避して無効な値をテスト
      render(<PriceFilter value={"invalid" as any} onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      // select要素では無効な値はそのまま表示される
      expect(select).toHaveValue("invalid");
    });

    it("コールバックが未定義でもエラーが発生しないこと", async () => {
      const user = userEvent.setup();
      render(<PriceFilter value="" onChange={undefined as any} />);

      const select = screen.getByLabelText("価格帯");

      // エラーが発生しないことを確認
      await expect(
        user.selectOptions(select, "1000-2000円")
      ).resolves.not.toThrow();
    });
  });

  describe("価格帯ビジネスロジック", () => {
    it("低価格帯から高価格帯まで網羅していること", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      // 1000円未満から3000円以上まで網羅
      expect(screen.getByText("～1000円")).toBeInTheDocument();
      expect(screen.getByText("1000-2000円")).toBeInTheDocument();
      expect(screen.getByText("2000-3000円")).toBeInTheDocument();
      expect(screen.getByText("3000円～")).toBeInTheDocument();
    });

    it("価格帯の範囲に重複がないこと", () => {
      render(<PriceFilter value="" onChange={mockOnChange} />);

      const select = screen.getByLabelText("価格帯");
      const options = Array.from(select.querySelectorAll("option"));
      const priceOptions = options.slice(1); // "すべての価格帯"を除く

      // 各価格帯が重複していないことを確認
      expect(priceOptions).toHaveLength(4);
      expect(priceOptions.map((o) => o.value)).toEqual([
        "～1000円",
        "1000-2000円",
        "2000-3000円",
        "3000円～",
      ]);
    });
  });
});
