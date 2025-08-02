import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterPanel } from "./FilterPanel";

// Analytics モック
vi.mock("@/utils/analytics", () => ({
  trackSearch: vi.fn(),
  trackFilter: vi.fn(),
}));

describe("FilterPanel", () => {
  const mockProps = {
    loading: false,
    resultCount: 10,
    onCuisineFilter: vi.fn(),
    onPriceFilter: vi.fn(),
    onSearchFilter: vi.fn(),
    onSortChange: vi.fn(),
    onFeatureFilter: vi.fn(),
    onResetFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基本レンダリング", () => {
    it("正常にレンダリングされること", () => {
      render(<FilterPanel {...mockProps} />);

      expect(screen.getByText("🔍 飲食店を探す")).toBeInTheDocument();
      expect(screen.getByText("10件")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("店舗名を入力...")
      ).toBeInTheDocument();
    });

    it("すべてのフィルター要素が表示されること", () => {
      render(<FilterPanel {...mockProps} />);

      // 検索欄
      expect(screen.getByLabelText("店舗名で検索")).toBeInTheDocument();

      // セレクトボックス
      expect(screen.getByLabelText("ジャンル")).toBeInTheDocument();
      expect(screen.getByLabelText("価格帯")).toBeInTheDocument();
      expect(screen.getByLabelText("並び順")).toBeInTheDocument();

      // チェックボックス
      expect(screen.getByLabelText("駐車場あり")).toBeInTheDocument();
      expect(screen.getByLabelText("禁煙")).toBeInTheDocument();
      expect(screen.getByLabelText("テイクアウト可")).toBeInTheDocument();
      expect(screen.getByLabelText("予約可能")).toBeInTheDocument();

      // リセットボタン
      expect(screen.getByText("リセット")).toBeInTheDocument();
    });

    it("結果件数が正しく表示されること", () => {
      render(<FilterPanel {...mockProps} resultCount={25} />);

      expect(screen.getByText("25件")).toBeInTheDocument();
    });

    it("結果件数0件でも正常に表示されること", () => {
      render(<FilterPanel {...mockProps} resultCount={0} />);

      expect(screen.getByText("0件")).toBeInTheDocument();
    });
  });

  describe("ローディング状態", () => {
    it("ローディング中は専用UIが表示されること", () => {
      render(<FilterPanel {...mockProps} loading={true} />);

      expect(screen.getByText("フィルターを読み込み中...")).toBeInTheDocument();
      expect(screen.queryByText("🔍 飲食店を探す")).not.toBeInTheDocument();
    });

    it("ローディングUIにスピナーが表示されること", () => {
      render(<FilterPanel {...mockProps} loading={true} />);

      const loadingContainer =
        screen.getByText("フィルターを読み込み中...").parentElement;
      const spinner = loadingContainer?.querySelector(
        "div[style*='animation']"
      );
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("検索機能", () => {
    it("検索テキスト入力時にコールバックが呼ばれること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const searchInput = screen.getByPlaceholderText("店舗名を入力...");
      await user.type(searchInput, "寿司");

      expect(mockProps.onSearchFilter).toHaveBeenCalledWith("寿司");
    });

    it("検索時にAnalyticsが送信されること", async () => {
      const { trackSearch } = await import("@/utils/analytics");
      const user = userEvent.setup();

      render(<FilterPanel {...mockProps} />);

      const searchInput = screen.getByPlaceholderText("店舗名を入力...");
      await user.type(searchInput, "寿司");

      expect(trackSearch).toHaveBeenCalledWith("寿司", 10);
    });

    it("空文字検索ではAnalyticsが送信されないこと", async () => {
      const { trackSearch } = await import("@/utils/analytics");
      const user = userEvent.setup();

      render(<FilterPanel {...mockProps} />);

      const searchInput = screen.getByPlaceholderText("店舗名を入力...");
      await user.type(searchInput, "   "); // 空白文字

      expect(trackSearch).not.toHaveBeenCalled();
    });

    it("検索欄をクリアできること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const searchInput = screen.getByPlaceholderText("店舗名を入力...");
      await user.type(searchInput, "テスト");

      expect(searchInput).toHaveValue("テスト");

      await user.clear(searchInput);
      expect(searchInput).toHaveValue("");
    });
  });

  describe("ジャンルフィルター", () => {
    it("ジャンル選択時にコールバックが呼ばれること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const cuisineSelect = screen.getByLabelText("ジャンル");
      await user.selectOptions(cuisineSelect, "寿司");

      expect(mockProps.onCuisineFilter).toHaveBeenCalledWith("寿司");
    });

    it("ジャンル選択時にAnalyticsが送信されること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const user = userEvent.setup();

      render(<FilterPanel {...mockProps} />);

      const cuisineSelect = screen.getByLabelText("ジャンル");
      await user.selectOptions(cuisineSelect, "寿司");

      expect(trackFilter).toHaveBeenCalledWith("cuisine", "寿司");
    });

    it("ジャンル「すべて」選択時に適切な値が送信されること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const user = userEvent.setup();

      render(<FilterPanel {...mockProps} />);

      const cuisineSelect = screen.getByLabelText("ジャンル");
      await user.selectOptions(cuisineSelect, "");

      expect(mockProps.onCuisineFilter).toHaveBeenCalledWith("");
      expect(trackFilter).toHaveBeenCalledWith("cuisine", "all");
    });

    it("すべてのジャンルオプションが表示されること", () => {
      render(<FilterPanel {...mockProps} />);

      const cuisineSelect = screen.getByLabelText("ジャンル");
      const options = Array.from(cuisineSelect.querySelectorAll("option"));

      expect(options).toHaveLength(15); // すべてのジャンル + "すべてのジャンル"
      expect(options[0]).toHaveTextContent("すべてのジャンル");
      expect(options[1]).toHaveTextContent("日本料理");
      expect(options[2]).toHaveTextContent("寿司");
    });
  });

  describe("価格帯フィルター", () => {
    it("価格帯選択時にコールバックが呼ばれること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const priceSelect = screen.getByLabelText("価格帯");
      await user.selectOptions(priceSelect, "1000-2000円");

      expect(mockProps.onPriceFilter).toHaveBeenCalledWith("1000-2000円");
    });

    it("価格帯選択時にAnalyticsが送信されること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const user = userEvent.setup();

      render(<FilterPanel {...mockProps} />);

      const priceSelect = screen.getByLabelText("価格帯");
      await user.selectOptions(priceSelect, "2000-3000円");

      expect(trackFilter).toHaveBeenCalledWith("price_range", "2000-3000円");
    });

    it("すべての価格帯オプションが表示されること", () => {
      render(<FilterPanel {...mockProps} />);

      const priceSelect = screen.getByLabelText("価格帯");
      const options = Array.from(priceSelect.querySelectorAll("option"));

      expect(options).toHaveLength(5); // すべての価格帯 + "すべての価格帯"
      expect(options[0]).toHaveTextContent("すべての価格帯");
      expect(options[1]).toHaveTextContent("～1000円");
      expect(options[4]).toHaveTextContent("3000円～");
    });
  });

  describe("ソート機能", () => {
    it("ソート選択時にコールバックが呼ばれること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const sortSelect = screen.getByLabelText("並び順");
      await user.selectOptions(sortSelect, "rating");

      expect(mockProps.onSortChange).toHaveBeenCalledWith("rating");
    });

    it("ソート選択時にAnalyticsが送信されること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const user = userEvent.setup();

      render(<FilterPanel {...mockProps} />);

      const sortSelect = screen.getByLabelText("並び順");
      await user.selectOptions(sortSelect, "distance");

      expect(trackFilter).toHaveBeenCalledWith("sort_order", "distance");
    });

    it("すべてのソートオプションが表示されること", () => {
      render(<FilterPanel {...mockProps} />);

      const sortSelect = screen.getByLabelText("並び順");
      const options = Array.from(sortSelect.querySelectorAll("option"));

      expect(options).toHaveLength(4);
      expect(options[0]).toHaveTextContent("店名順");
      expect(options[1]).toHaveTextContent("評価順");
      expect(options[2]).toHaveTextContent("価格順");
      expect(options[3]).toHaveTextContent("距離順");
    });

    it("デフォルトで店名順が選択されていること", () => {
      render(<FilterPanel {...mockProps} />);

      const sortSelect = screen.getByLabelText("並び順");
      expect(sortSelect).toHaveValue("name");
    });
  });

  describe("こだわり条件フィルター", () => {
    it("チェックボックスがトグル動作すること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const parkingCheckbox = screen.getByLabelText("駐車場あり");

      expect(parkingCheckbox).not.toBeChecked();

      await user.click(parkingCheckbox);
      expect(parkingCheckbox).toBeChecked();
      expect(mockProps.onFeatureFilter).toHaveBeenCalledWith(["駐車場あり"]);

      await user.click(parkingCheckbox);
      expect(parkingCheckbox).not.toBeChecked();
      expect(mockProps.onFeatureFilter).toHaveBeenCalledWith([]);
    });

    it("複数のチェックボックスを同時選択できること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const parkingCheckbox = screen.getByLabelText("駐車場あり");
      const smokingCheckbox = screen.getByLabelText("禁煙");

      await user.click(parkingCheckbox);
      await user.click(smokingCheckbox);

      expect(mockProps.onFeatureFilter).toHaveBeenLastCalledWith([
        "駐車場あり",
        "禁煙",
      ]);
    });

    it("特徴フィルター選択時にAnalyticsが送信されること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const user = userEvent.setup();

      render(<FilterPanel {...mockProps} />);

      const takeoutCheckbox = screen.getByLabelText("テイクアウト可");
      await user.click(takeoutCheckbox);

      expect(trackFilter).toHaveBeenCalledWith("features", "テイクアウト可");
    });

    it("すべてのチェックボックスを解除時にAnalyticsが送信されること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const user = userEvent.setup();

      render(<FilterPanel {...mockProps} />);

      const takeoutCheckbox = screen.getByLabelText("テイクアウト可");
      await user.click(takeoutCheckbox); // チェック
      await user.click(takeoutCheckbox); // チェック解除

      expect(trackFilter).toHaveBeenLastCalledWith("features", "none");
    });
  });

  describe("リセット機能", () => {
    it("リセットボタンクリック時にすべての状態がクリアされること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      // 各フィルターに値を設定
      const searchInput = screen.getByPlaceholderText("店舗名を入力...");
      const cuisineSelect = screen.getByLabelText("ジャンル");
      const priceSelect = screen.getByLabelText("価格帯");
      const sortSelect = screen.getByLabelText("並び順");
      const parkingCheckbox = screen.getByLabelText("駐車場あり");

      await user.type(searchInput, "テスト");
      await user.selectOptions(cuisineSelect, "寿司");
      await user.selectOptions(priceSelect, "1000-2000円");
      await user.selectOptions(sortSelect, "rating");
      await user.click(parkingCheckbox);

      // リセットボタンをクリック
      const resetButton = screen.getByText("リセット");
      await user.click(resetButton);

      // すべての状態がクリアされていることを確認
      expect(mockProps.onResetFilters).toHaveBeenCalled();

      // UI状態の確認
      expect(searchInput).toHaveValue("");
      expect(cuisineSelect).toHaveValue("");
      expect(priceSelect).toHaveValue("");
      expect(sortSelect).toHaveValue("name");
      expect(parkingCheckbox).not.toBeChecked();
    });

    it("リセット時にAnalyticsが送信されること", async () => {
      const { trackFilter } = await import("@/utils/analytics");
      const user = userEvent.setup();

      render(<FilterPanel {...mockProps} />);

      const resetButton = screen.getByText("リセット");
      await user.click(resetButton);

      expect(trackFilter).toHaveBeenCalledWith("reset", "all_filters_cleared");
    });

    it("リセットボタンにホバー効果があること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const resetButton = screen.getByText("リセット");

      await user.hover(resetButton);
      expect(resetButton).toHaveStyle({ backgroundColor: "#f1f5f9" });

      await user.unhover(resetButton);
      expect(resetButton).toHaveStyle({ backgroundColor: "#f8fafc" });
    });
  });

  describe("プロップス処理", () => {
    it("コールバック関数が未定義でもエラーが発生しないこと", async () => {
      const user = userEvent.setup();
      render(<FilterPanel resultCount={5} />);

      const searchInput = screen.getByPlaceholderText("店舗名を入力...");
      await user.type(searchInput, "テスト");

      // エラーが発生しないことを確認
      expect(screen.getByDisplayValue("テスト")).toBeInTheDocument();
    });

    it("結果件数が未定義の場合0件として表示されること", () => {
      render(<FilterPanel />);

      expect(screen.getByText("0件")).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("すべてのフォーム要素にラベルが関連付けられていること", () => {
      render(<FilterPanel {...mockProps} />);

      expect(screen.getByLabelText("店舗名で検索")).toBeInTheDocument();
      expect(screen.getByLabelText("ジャンル")).toBeInTheDocument();
      expect(screen.getByLabelText("価格帯")).toBeInTheDocument();
      expect(screen.getByLabelText("並び順")).toBeInTheDocument();
      expect(screen.getByLabelText("駐車場あり")).toBeInTheDocument();
      expect(screen.getByLabelText("禁煙")).toBeInTheDocument();
      expect(screen.getByLabelText("テイクアウト可")).toBeInTheDocument();
      expect(screen.getByLabelText("予約可能")).toBeInTheDocument();
    });

    it("検索欄にフォーカス可能であること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const searchInput = screen.getByPlaceholderText("店舗名を入力...");
      await user.click(searchInput);

      expect(searchInput).toHaveFocus();
    });

    it("キーボードナビゲーションでフォーム要素を移動できること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      // 検索欄に直接フォーカス
      const searchInput = screen.getByPlaceholderText("店舗名を入力...");
      await user.click(searchInput);
      expect(searchInput).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText("ジャンル")).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText("価格帯")).toHaveFocus();
    });
  });

  describe("エラーハンドリング・エッジケース", () => {
    it("非常に長い検索テキストでも正常に動作すること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const longText =
        "非常に長いレストラン名前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前前";

      const searchInput = screen.getByPlaceholderText("店舗名を入力...");
      await user.type(searchInput, longText);

      expect(mockProps.onSearchFilter).toHaveBeenCalledWith(longText);
    });

    it("連続した検索入力でも正常に動作すること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const searchInput = screen.getByPlaceholderText("店舗名を入力...");

      await user.type(searchInput, "寿司");
      await user.clear(searchInput);
      await user.type(searchInput, "カフェ");

      expect(mockProps.onSearchFilter).toHaveBeenLastCalledWith("カフェ");
    });

    it("特殊文字を含む検索でも正常に動作すること", async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...mockProps} />);

      const specialChars = "!@#$%^&*()_+-=";

      const searchInput = screen.getByPlaceholderText("店舗名を入力...");

      // 文字を一つずつ入力する方法
      await user.click(searchInput);
      await user.keyboard(specialChars);

      expect(mockProps.onSearchFilter).toHaveBeenCalled();
    });
  });
});
