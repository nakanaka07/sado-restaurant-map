/**
 * @fileoverview FilterPanelCompound tests
 * Week 2 P2-1: Compound Components パターンテスト
 */

import { FilterProvider } from "@/contexts/FilterContext";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FilterPanelCompound, FullFilterPanel } from "./FilterPanelCompound";

// Mock analytics
vi.mock("@/utils/analytics", () => ({
  trackFilter: vi.fn(),
}));

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FilterProvider
      loading={false}
      resultCount={10}
      stats={{ restaurants: 5, parkings: 3, toilets: 2, total: 10 }}
    >
      {children}
    </FilterProvider>
  );
}

describe("FilterPanelCompound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Root", () => {
    it("子要素をレンダリングする", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <div data-testid="child">テストコンテンツ</div>
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("Header", () => {
    it("件数を表示する", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Header />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      expect(screen.getByText("🔍 フィルター")).toBeInTheDocument();
      expect(screen.getByText("📊 10件")).toBeInTheDocument();
    });

    it("統計情報を表示する", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Header />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      expect(screen.getByText("🍽️ 5")).toBeInTheDocument();
      expect(screen.getByText("🅿️ 3")).toBeInTheDocument();
      expect(screen.getByText("🚻 2")).toBeInTheDocument();
    });
  });

  describe("Search", () => {
    it("検索入力を受け付ける", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Search />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      const input = screen.getByLabelText("🔎 検索");
      fireEvent.change(input, { target: { value: "寿司" } });

      expect(input).toHaveValue("寿司");
    });
  });

  describe("Cuisine", () => {
    it("料理ジャンルを選択できる", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Cuisine />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      const select = screen.getByLabelText("🍽️ 料理ジャンル");
      fireEvent.change(select, { target: { value: "寿司" } });

      expect(select).toHaveValue("寿司");
    });
  });

  describe("Price", () => {
    it("価格帯を選択できる", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Price />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      const select = screen.getByLabelText("💰 価格帯");
      fireEvent.change(select, { target: { value: "1000-2000円" } });

      expect(select).toHaveValue("1000-2000円");
    });
  });

  describe("Rating", () => {
    it("評価を選択できる", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Rating />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      const select = screen.getByLabelText("⭐ 評価");
      fireEvent.change(select, { target: { value: "4" } });

      expect(select).toHaveValue("4");
    });
  });

  describe("OpenNow", () => {
    it("営業中フィルターをトグルできる", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.OpenNow />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      const checkbox = screen.getByRole("checkbox", {
        name: /営業中のみ表示/,
      });
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe("Districts", () => {
    it("地域を選択できる", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Districts />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      // 初期表示では4つの地域が表示される
      expect(screen.getByText("両津")).toBeInTheDocument();
      expect(screen.getByText("相川")).toBeInTheDocument();
    });

    it("展開ボタンで全地域を表示できる", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Districts />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      const expandButton = screen.getByText("▼ もっと見る");
      fireEvent.click(expandButton);

      expect(screen.getByText("小木")).toBeInTheDocument();
      expect(screen.getByText("羽茂")).toBeInTheDocument();
    });
  });

  describe("Features", () => {
    it("特徴を選択できる", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Features />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      const checkbox = screen.getByRole("checkbox", { name: /駐車場あり/ });
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe("PointTypes", () => {
    it("ポイントタイプをトグルできる", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.PointTypes />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      const checkbox = screen.getByRole("checkbox", { name: /飲食店/ });
      expect(checkbox).toBeChecked(); // 初期状態では選択済み

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe("Sort", () => {
    it("並び順を変更できる", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Sort />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      const select = screen.getByLabelText("📊 並び順");
      expect(select).toHaveValue("name");

      fireEvent.change(select, { target: { value: "rating" } });
      expect(select).toHaveValue("rating");
    });
  });

  describe("Reset", () => {
    it("リセットボタンが表示される", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Reset />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      expect(
        screen.getByRole("button", { name: /フィルターをリセット/ })
      ).toBeInTheDocument();
    });
  });

  describe("Legend", () => {
    it("凡例が表示される", () => {
      render(
        <TestWrapper>
          <FilterPanelCompound.Root>
            <FilterPanelCompound.Legend />
          </FilterPanelCompound.Root>
        </TestWrapper>
      );

      expect(screen.getByText("🗺️ マップ凡例")).toBeInTheDocument();
      expect(screen.getByText("飲食店")).toBeInTheDocument();
      expect(screen.getByText("駐車場")).toBeInTheDocument();
      expect(screen.getByText("トイレ")).toBeInTheDocument();
    });
  });
});

describe("FullFilterPanel", () => {
  it("全てのコンポーネントをレンダリングする", () => {
    render(
      <TestWrapper>
        <FullFilterPanel />
      </TestWrapper>
    );

    // ヘッダー
    expect(screen.getByText("🔍 フィルター")).toBeInTheDocument();

    // フィルター要素
    expect(screen.getByLabelText("🔎 検索")).toBeInTheDocument();
    expect(screen.getByLabelText("🍽️ 料理ジャンル")).toBeInTheDocument();
    expect(screen.getByLabelText("💰 価格帯")).toBeInTheDocument();
    expect(screen.getByLabelText("⭐ 評価")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /営業中のみ表示/ })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("📊 並び順")).toBeInTheDocument();

    // リセットボタン
    expect(
      screen.getByRole("button", { name: /フィルターをリセット/ })
    ).toBeInTheDocument();

    // 凡例
    expect(screen.getByText("🗺️ マップ凡例")).toBeInTheDocument();
  });
});
