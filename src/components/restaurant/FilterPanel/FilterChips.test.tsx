import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterChips } from "./FilterChips";
import type {
  CuisineType,
  PriceRange,
  SadoDistrict,
  MapPointType,
} from "@/types";

describe("FilterChips", () => {
  const defaultProps = {
    searchQuery: "",
    selectedCuisine: "" as CuisineType | "",
    selectedPrice: "" as PriceRange | "",
    selectedDistricts: [] as SadoDistrict[],
    selectedRating: undefined,
    openNow: false,
    selectedFeatures: [] as string[],
    selectedPointTypes: ["restaurant", "parking", "toilet"] as MapPointType[],
    onClearSearch: vi.fn(),
    onClearCuisine: vi.fn(),
    onClearPrice: vi.fn(),
    onClearDistrict: vi.fn(),
    onClearRating: vi.fn(),
    onClearOpenNow: vi.fn(),
    onClearFeature: vi.fn(),
    onClearPointType: vi.fn(),
    onClearAll: vi.fn(),
    resultCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("表示制御", () => {
    it("フィルターが設定されていない場合は何も表示されないこと", () => {
      const { container } = render(<FilterChips {...defaultProps} />);

      expect(container).toBeEmptyDOMElement();
    });

    it("検索フィルターが設定されている場合に表示されること", () => {
      render(
        <FilterChips {...defaultProps} searchQuery="寿司" resultCount={5} />
      );

      expect(screen.getByText("適用中のフィルター")).toBeInTheDocument();
      expect(screen.getByText("検索: 寿司")).toBeInTheDocument();
      expect(screen.getByText("5件の結果")).toBeInTheDocument();
    });

    it("料理フィルターが設定されている場合に表示されること", () => {
      render(
        <FilterChips {...defaultProps} selectedCuisine="寿司" resultCount={3} />
      );

      expect(screen.getByText("料理: 寿司")).toBeInTheDocument();
    });

    it("価格フィルターが設定されている場合に表示されること", () => {
      render(
        <FilterChips
          {...defaultProps}
          selectedPrice="1000-2000円"
          resultCount={2}
        />
      );

      expect(screen.getByText("価格: 1000-2000円")).toBeInTheDocument();
    });

    it("地区フィルターが設定されている場合に表示されること", () => {
      render(
        <FilterChips
          {...defaultProps}
          selectedDistricts={["両津", "相川"]}
          resultCount={4}
        />
      );

      expect(screen.getByText("地区: 両津")).toBeInTheDocument();
      expect(screen.getByText("地区: 相川")).toBeInTheDocument();
    });

    it("評価フィルターが設定されている場合に表示されること", () => {
      render(
        <FilterChips {...defaultProps} selectedRating={4} resultCount={1} />
      );

      expect(screen.getByText("評価: 4星以上")).toBeInTheDocument();
    });

    it("営業中フィルターが設定されている場合に表示されること", () => {
      render(<FilterChips {...defaultProps} openNow={true} resultCount={6} />);

      expect(screen.getByText("営業中のみ")).toBeInTheDocument();
    });

    it("特徴フィルターが設定されている場合に表示されること", () => {
      render(
        <FilterChips
          {...defaultProps}
          selectedFeatures={["駐車場あり", "禁煙"]}
          resultCount={3}
        />
      );

      expect(screen.getByText("設備: 駐車場あり")).toBeInTheDocument();
      expect(screen.getByText("設備: 禁煙")).toBeInTheDocument();
    });

    it("地図ポイントタイプフィルターが設定されている場合に表示されること", () => {
      render(
        <FilterChips
          {...defaultProps}
          selectedPointTypes={["restaurant"]}
          resultCount={2}
        />
      );

      expect(screen.getByText("種類: 飲食店")).toBeInTheDocument();
    });
  });

  describe("削除機能", () => {
    it("検索フィルターを削除できること", async () => {
      const user = userEvent.setup();
      render(<FilterChips {...defaultProps} searchQuery="寿司" />);

      const removeButton = screen.getByLabelText("検索フィルターを削除");
      await user.click(removeButton);

      expect(defaultProps.onClearSearch).toHaveBeenCalled();
    });

    it("料理フィルターを削除できること", async () => {
      const user = userEvent.setup();
      render(<FilterChips {...defaultProps} selectedCuisine="寿司" />);

      const removeButton = screen.getByLabelText("料理フィルターを削除");
      await user.click(removeButton);

      expect(defaultProps.onClearCuisine).toHaveBeenCalled();
    });

    it("価格フィルターを削除できること", async () => {
      const user = userEvent.setup();
      render(<FilterChips {...defaultProps} selectedPrice="1000-2000円" />);

      const removeButton = screen.getByLabelText("価格フィルターを削除");
      await user.click(removeButton);

      expect(defaultProps.onClearPrice).toHaveBeenCalled();
    });

    it("地区フィルターを個別に削除できること", async () => {
      const user = userEvent.setup();
      render(
        <FilterChips {...defaultProps} selectedDistricts={["両津", "相川"]} />
      );

      const removeButton = screen.getByLabelText("両津地区フィルターを削除");
      await user.click(removeButton);

      expect(defaultProps.onClearDistrict).toHaveBeenCalledWith("両津");
    });

    it("評価フィルターを削除できること", async () => {
      const user = userEvent.setup();
      render(<FilterChips {...defaultProps} selectedRating={4} />);

      const removeButton = screen.getByLabelText("評価フィルターを削除");
      await user.click(removeButton);

      expect(defaultProps.onClearRating).toHaveBeenCalled();
    });

    it("営業中フィルターを削除できること", async () => {
      const user = userEvent.setup();
      render(<FilterChips {...defaultProps} openNow={true} />);

      const removeButton = screen.getByLabelText("営業中フィルターを削除");
      await user.click(removeButton);

      expect(defaultProps.onClearOpenNow).toHaveBeenCalled();
    });

    it("特徴フィルターを個別に削除できること", async () => {
      const user = userEvent.setup();
      render(
        <FilterChips
          {...defaultProps}
          selectedFeatures={["駐車場あり", "禁煙"]}
        />
      );

      const removeButton =
        screen.getByLabelText("駐車場あり設備フィルターを削除");
      await user.click(removeButton);

      expect(defaultProps.onClearFeature).toHaveBeenCalledWith("駐車場あり");
    });

    it("地図ポイントタイプフィルターを削除できること", async () => {
      const user = userEvent.setup();
      render(
        <FilterChips {...defaultProps} selectedPointTypes={["restaurant"]} />
      );

      const removeButton = screen.getByLabelText(
        "restaurant種類フィルターを削除"
      );
      await user.click(removeButton);

      expect(defaultProps.onClearPointType).toHaveBeenCalledWith("restaurant");
    });

    it("すべてのフィルターを一括削除できること", async () => {
      const user = userEvent.setup();
      render(
        <FilterChips
          {...defaultProps}
          searchQuery="寿司"
          selectedCuisine="寿司"
        />
      );

      const clearAllButton =
        screen.getByLabelText("すべてのフィルターをクリア");
      await user.click(clearAllButton);

      expect(defaultProps.onClearAll).toHaveBeenCalled();
    });
  });

  describe("結果件数表示", () => {
    it("結果件数が正しく表示されること", () => {
      render(
        <FilterChips {...defaultProps} searchQuery="寿司" resultCount={42} />
      );

      expect(screen.getByText("42件の結果")).toBeInTheDocument();
    });

    it("結果件数が0件でも正しく表示されること", () => {
      render(
        <FilterChips {...defaultProps} searchQuery="寿司" resultCount={0} />
      );

      expect(screen.getByText("0件の結果")).toBeInTheDocument();
    });

    it("結果件数が1件でも正しく表示されること", () => {
      render(
        <FilterChips {...defaultProps} searchQuery="寿司" resultCount={1} />
      );

      expect(screen.getByText("1件の結果")).toBeInTheDocument();
    });
  });

  describe("複合フィルター", () => {
    it("複数のフィルターが同時に表示されること", () => {
      render(
        <FilterChips
          {...defaultProps}
          searchQuery="寿司"
          selectedCuisine="寿司"
          selectedPrice="1000-2000円"
          selectedDistricts={["両津"]}
          selectedRating={4}
          openNow={true}
          selectedFeatures={["駐車場あり"]}
          resultCount={5}
        />
      );

      expect(screen.getByText("検索: 寿司")).toBeInTheDocument();
      expect(screen.getByText("料理: 寿司")).toBeInTheDocument();
      expect(screen.getByText("価格: 1000-2000円")).toBeInTheDocument();
      expect(screen.getByText("地区: 両津")).toBeInTheDocument();
      expect(screen.getByText("評価: 4星以上")).toBeInTheDocument();
      expect(screen.getByText("営業中のみ")).toBeInTheDocument();
      expect(screen.getByText("設備: 駐車場あり")).toBeInTheDocument();
      expect(screen.getByText("5件の結果")).toBeInTheDocument();
    });

    it("各フィルターの削除ボタンがすべて表示されること", () => {
      render(
        <FilterChips
          {...defaultProps}
          searchQuery="寿司"
          selectedCuisine="寿司"
          selectedPrice="1000-2000円"
          selectedRating={4}
          openNow={true}
        />
      );

      expect(screen.getByLabelText("検索フィルターを削除")).toBeInTheDocument();
      expect(screen.getByLabelText("料理フィルターを削除")).toBeInTheDocument();
      expect(screen.getByLabelText("価格フィルターを削除")).toBeInTheDocument();
      expect(screen.getByLabelText("評価フィルターを削除")).toBeInTheDocument();
      expect(
        screen.getByLabelText("営業中フィルターを削除")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("すべてのフィルターをクリア")
      ).toBeInTheDocument();
    });
  });

  describe("地図ポイントタイプ特殊ケース", () => {
    it("全ての地図ポイントタイプが選択されている場合は表示されないこと", () => {
      render(
        <FilterChips
          {...defaultProps}
          selectedPointTypes={["restaurant", "parking", "toilet"]}
          searchQuery="test" // 他のフィルターを設定してコンポーネントを表示
        />
      );

      expect(screen.queryByText("種類:")).not.toBeInTheDocument();
    });

    it("一部の地図ポイントタイプのみ選択されている場合に表示されること", () => {
      render(
        <FilterChips
          {...defaultProps}
          selectedPointTypes={["restaurant", "parking"]}
        />
      );

      expect(screen.getByText("種類: 飲食店")).toBeInTheDocument();
      expect(screen.getByText("種類: 駐車場")).toBeInTheDocument();
      expect(screen.queryByText("種類: トイレ")).not.toBeInTheDocument();
    });

    it("地図ポイントタイプの日本語変換が正しいこと", () => {
      render(
        <FilterChips {...defaultProps} selectedPointTypes={["parking"]} />
      );

      expect(screen.getByText("種類: 駐車場")).toBeInTheDocument();
    });

    it("地図ポイントタイプの日本語変換が正しいこと（トイレ）", () => {
      render(<FilterChips {...defaultProps} selectedPointTypes={["toilet"]} />);

      expect(screen.getByText("種類: トイレ")).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("削除ボタンに適切なaria-labelが設定されていること", () => {
      render(
        <FilterChips
          {...defaultProps}
          searchQuery="寿司"
          selectedCuisine="寿司"
          selectedDistricts={["両津"]}
          selectedFeatures={["駐車場あり"]}
        />
      );

      expect(screen.getByLabelText("検索フィルターを削除")).toBeInTheDocument();
      expect(screen.getByLabelText("料理フィルターを削除")).toBeInTheDocument();
      expect(
        screen.getByLabelText("両津地区フィルターを削除")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("駐車場あり設備フィルターを削除")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("すべてのフィルターをクリア")
      ).toBeInTheDocument();
    });

    it("削除ボタンがbutton要素であること", () => {
      render(<FilterChips {...defaultProps} searchQuery="寿司" />);

      const removeButton = screen.getByLabelText("検索フィルターを削除");
      expect(removeButton.tagName).toBe("BUTTON");
      expect(removeButton).toHaveAttribute("type", "button");
    });

    it("すべてクリアボタンがbutton要素であること", () => {
      render(<FilterChips {...defaultProps} searchQuery="寿司" />);

      const clearAllButton =
        screen.getByLabelText("すべてのフィルターをクリア");
      expect(clearAllButton.tagName).toBe("BUTTON");
      expect(clearAllButton).toHaveAttribute("type", "button");
    });
  });

  describe("エラーハンドリング", () => {
    it("コールバック関数が未定義でもエラーが発生しないこと", async () => {
      const user = userEvent.setup();
      render(
        <FilterChips
          {...defaultProps}
          searchQuery="寿司"
          onClearSearch={undefined as any}
          onClearAll={undefined as any}
        />
      );

      const removeButton = screen.getByLabelText("検索フィルターを削除");
      const clearAllButton =
        screen.getByLabelText("すべてのフィルターをクリア");

      // エラーが発生しないことを確認
      await expect(user.click(removeButton)).resolves.not.toThrow();
      await expect(user.click(clearAllButton)).resolves.not.toThrow();
    });

    it("空の配列や無効な値でも正常にレンダリングされること", () => {
      render(
        <FilterChips
          {...defaultProps}
          selectedDistricts={[]}
          selectedFeatures={[]}
          selectedPointTypes={[]}
          searchQuery="test"
        />
      );

      expect(screen.getByText("検索: test")).toBeInTheDocument();
      expect(screen.queryByText("地区:")).not.toBeInTheDocument();
      expect(screen.queryByText("設備:")).not.toBeInTheDocument();
      expect(screen.queryByText("種類:")).not.toBeInTheDocument();
    });
  });

  describe("境界値テスト", () => {
    it("非常に長い検索クエリでも正常に表示されること", () => {
      const longQuery = "非常に長い検索クエリ".repeat(10);
      render(<FilterChips {...defaultProps} searchQuery={longQuery} />);

      expect(screen.getByText(`検索: ${longQuery}`)).toBeInTheDocument();
    });

    it("大量のフィルターが設定されても正常に表示されること", () => {
      const manyDistricts: SadoDistrict[] = [
        "両津",
        "相川",
        "佐和田",
        "金井",
        "新穂",
      ];
      const manyFeatures = [
        "駐車場あり",
        "禁煙",
        "テイクアウト可",
        "予約可能",
        "カード利用可",
      ];

      render(
        <FilterChips
          {...defaultProps}
          selectedDistricts={manyDistricts}
          selectedFeatures={manyFeatures}
        />
      );

      manyDistricts.forEach((district) => {
        expect(screen.getByText(`地区: ${district}`)).toBeInTheDocument();
      });

      manyFeatures.forEach((feature) => {
        expect(screen.getByText(`設備: ${feature}`)).toBeInTheDocument();
      });
    });
  });
});
