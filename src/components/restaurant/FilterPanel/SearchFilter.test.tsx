import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchFilter } from "./SearchFilter";

describe("SearchFilter", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("正常にレンダリングされること", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      expect(screen.getByLabelText("検索")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("店名・料理名で検索")
      ).toBeInTheDocument();
    });

    it("初期値が設定されること", () => {
      render(<SearchFilter value="寿司" onChange={mockOnChange} />);

      expect(screen.getByDisplayValue("寿司")).toBeInTheDocument();
    });

    it("カスタムプレースホルダーが設定されること", () => {
      render(
        <SearchFilter
          value=""
          onChange={mockOnChange}
          placeholder="カスタム検索"
        />
      );

      expect(screen.getByPlaceholderText("カスタム検索")).toBeInTheDocument();
    });
  });

  describe("検索機能", () => {
    it("検索テキスト入力時にデバウンス後にコールバックが呼ばれること", async () => {
      const user = userEvent.setup();
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const searchInput = screen.getByLabelText("検索");
      await user.type(searchInput, "寿司");

      // デバウンス(300ms)待機
      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith("寿司");
        },
        { timeout: 500 }
      );
    });

    it("検索欄をクリアできること", async () => {
      const user = userEvent.setup();
      render(<SearchFilter value="テスト" onChange={mockOnChange} />);

      const clearButton = screen.getByLabelText("検索をクリア");
      await user.click(clearButton);

      expect(screen.getByDisplayValue("")).toBeInTheDocument();
    });

    it("クリアボタンは値がある時のみ表示されること", () => {
      const { rerender } = render(
        <SearchFilter value="" onChange={mockOnChange} />
      );

      expect(screen.queryByLabelText("検索をクリア")).not.toBeInTheDocument();

      rerender(<SearchFilter value="テスト" onChange={mockOnChange} />);
      expect(screen.getByLabelText("検索をクリア")).toBeInTheDocument();
    });
  });

  describe("ローディング状態", () => {
    it("ローディング中は入力が無効化されること", () => {
      render(<SearchFilter value="" onChange={mockOnChange} loading={true} />);

      const searchInput = screen.getByLabelText("検索");
      expect(searchInput).toBeDisabled();
    });

    it("ローディング中はスピナーが表示されること", () => {
      render(<SearchFilter value="" onChange={mockOnChange} loading={true} />);

      expect(screen.getByLabelText("検索中")).toBeInTheDocument();
    });
  });

  describe("外部制御", () => {
    it("外部から値を制御できること", () => {
      const { rerender } = render(
        <SearchFilter value="初期値" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue("初期値")).toBeInTheDocument();

      rerender(<SearchFilter value="更新値" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue("更新値")).toBeInTheDocument();
    });

    it("外部からの値変更が内部状態に反映されること", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <SearchFilter value="" onChange={mockOnChange} />
      );

      const searchInput = screen.getByLabelText("検索");
      await user.type(searchInput, "ユーザー入力");

      // 外部から値を変更
      rerender(<SearchFilter value="外部変更" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue("外部変更")).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("ラベルが正しく関連付けられていること", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const searchInput = screen.getByLabelText("検索");
      expect(searchInput).toBeInTheDocument();
    });

    it("ヘルプテキストが関連付けられていること", () => {
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const searchInput = screen.getByLabelText("検索");
      expect(searchInput).toHaveAttribute("aria-describedby", "search-help");
      expect(
        screen.getByText("店名、料理名、エリア名で検索できます")
      ).toBeInTheDocument();
    });

    it("フォーカス可能であること", async () => {
      const user = userEvent.setup();
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const searchInput = screen.getByLabelText("検索");
      await user.click(searchInput);

      expect(searchInput).toHaveFocus();
    });
  });

  describe("エラーハンドリング・エッジケース", () => {
    it("非常に長い検索テキストでも正常に動作すること", async () => {
      const user = userEvent.setup();
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const longText = "非常に長いレストラン名前".repeat(20);

      const searchInput = screen.getByLabelText("検索");
      await user.type(searchInput, longText);

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith(longText);
        },
        { timeout: 500 }
      );
    });

    it("連続した検索入力でも正常に動作すること", async () => {
      const user = userEvent.setup();
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const searchInput = screen.getByLabelText("検索");

      await user.type(searchInput, "寿司");
      await user.clear(searchInput);
      await user.type(searchInput, "カフェ");

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith("カフェ");
        },
        { timeout: 500 }
      );
    });

    it("特殊文字を含む検索でも正常に動作すること", async () => {
      const user = userEvent.setup();
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const specialChars = "!@#$%^&*()_+-=";

      const searchInput = screen.getByLabelText("検索");
      await user.click(searchInput);
      await user.keyboard(specialChars);

      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });

    it("デバウンス処理が正常に動作すること", async () => {
      const user = userEvent.setup();
      render(<SearchFilter value="" onChange={mockOnChange} />);

      const searchInput = screen.getByLabelText("検索");

      // 連続して文字を入力
      await user.type(searchInput, "すし");

      // デバウンス時間内ではコールバックが呼ばれない
      expect(mockOnChange).not.toHaveBeenCalled();

      // デバウンス後にコールバックが呼ばれる
      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalledWith("すし");
        },
        { timeout: 500 }
      );

      // 1回だけ呼ばれていることを確認
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
  });
});
