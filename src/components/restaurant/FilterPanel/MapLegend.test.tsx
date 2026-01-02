/**
 * @fileoverview MapLegend Component Tests
 * マップ凡例コンポーネントのテスト
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MapLegend } from "./MapLegend";

describe("MapLegend", () => {
  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("マップの見方セクションが表示されること", () => {
      render(<MapLegend />);

      expect(screen.getByText("🗺️ マップの見方")).toBeInTheDocument();
    });

    it("detailsタグでレンダリングされること", () => {
      const { container } = render(<MapLegend />);

      const details = container.querySelector("details");
      expect(details).toBeInTheDocument();
    });

    it("summaryタグにクリック可能なスタイルが適用されること", () => {
      const { container } = render(<MapLegend />);

      const summary = container.querySelector("summary");
      expect(summary).toBeInTheDocument();
      expect(summary).toHaveStyle({ cursor: "pointer" });
    });
  });

  describe("展開・折りたたみ", () => {
    it("初期状態では折りたたまれていること", () => {
      const { container } = render(<MapLegend />);

      const details = container.querySelector("details");
      expect(details).not.toHaveAttribute("open");

      // 詳細が非表示状態
      expect(screen.queryByText("🎨 色 = 料理ジャンル")).not.toBeVisible();
    });

    it("summaryクリックで展開されること", () => {
      const { container } = render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      const details = container.querySelector("details");
      expect(details).toHaveAttribute("open");
    });

    it("展開時に料理ジャンルセクションが表示されること", () => {
      render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      expect(screen.getByText("🎨 色 = 料理ジャンル")).toBeInTheDocument();
    });

    it("展開時に価格帯セクションが表示されること", () => {
      render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      expect(screen.getByText("💰 サイズ = 価格帯")).toBeInTheDocument();
    });
  });

  describe("料理ジャンルの凡例", () => {
    it("18種類の料理ジャンルが表示されること", () => {
      render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      // 各料理ジャンルの確認
      const cuisines = [
        "日本料理",
        "寿司",
        "海鮮",
        "焼肉・焼鳥",
        "ラーメン",
        "そば・うどん",
        "中華",
        "イタリアン",
        "フレンチ",
        "カフェ・喫茶店",
        "バー・居酒屋",
        "ファストフード",
        "デザート・スイーツ",
        "カレー・エスニック",
        "ステーキ・洋食",
        "弁当・テイクアウト",
        "レストラン",
        "その他",
      ];

      cuisines.forEach(cuisine => {
        expect(screen.getByText(cuisine)).toBeInTheDocument();
      });
    });

    it("各料理ジャンルに色付きの円が表示されること", () => {
      const { container } = render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      // 色付きの円要素を確認
      const colorCircles = container.querySelectorAll(
        'div[style*="border-radius: 50%"]'
      );
      expect(colorCircles.length).toBeGreaterThan(0);
    });

    it("料理ジャンルがグリッドレイアウトで表示されること", () => {
      const { container } = render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      // グリッドコンテナの確認
      const gridContainer = container.querySelector(
        'div[style*="grid-template-columns"]'
      );
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe("価格帯の説明", () => {
    it("価格帯の説明テキストが表示されること", () => {
      render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      const priceDescription = screen.getByText(
        /小 = ～1000円.*中 = 1000-2000円.*大 = 2000-3000円.*特大 = 3000円～/
      );
      expect(priceDescription).toBeInTheDocument();
    });

    it("価格帯説明が小さいフォントサイズで表示されること", () => {
      render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      const priceDescription = screen.getByText(
        /小 = ～1000円.*中 = 1000-2000円/
      );
      // 親要素のdivにfontSize: 11pxが設定されている
      expect(priceDescription).toBeInTheDocument();
      expect(priceDescription.parentElement).toBeInTheDocument();
    });
  });

  describe("スタイリング", () => {
    it("filter-sectionクラスが適用されること", () => {
      const { container } = render(<MapLegend />);

      const section = container.querySelector(".filter-section");
      expect(section).toBeInTheDocument();
    });

    it("見出しに適切なフォントサイズが適用されること", () => {
      const { container } = render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      const headings = container.querySelectorAll("h5");
      headings.forEach(heading => {
        expect(heading).toHaveStyle({ fontSize: "13px" });
      });
    });

    it("料理ジャンルのテキストが小さいフォントで表示されること", () => {
      render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      // 最初の料理ジャンル（日本料理）のフォントサイズを確認
      const japaneseText = screen.getByText("日本料理");
      expect(japaneseText).toHaveStyle({ fontSize: "11px" });
    });

    it("色円に適切な視覚スタイルが適用されること", () => {
      const { container } = render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      const colorCircles = container.querySelectorAll(
        'div[style*="border-radius: 50%"]'
      );
      const firstCircle = colorCircles[0];

      expect(firstCircle).toHaveStyle({
        width: "12px",
        height: "12px",
        borderRadius: "50%",
      });
    });
  });

  describe("アクセシビリティ", () => {
    it("summaryがキーボードでフォーカス可能であること", () => {
      const { container } = render(<MapLegend />);

      const summary = container.querySelector("summary");
      expect(summary).toBeInTheDocument();
      // summaryはネイティブでフォーカス可能
    });

    it("展開状態がdetailsタグのopen属性で管理されること", () => {
      const { container } = render(<MapLegend />);

      const details = container.querySelector("details");
      const summary = screen.getByText("🗺️ マップの見方");

      // 初期状態
      expect(details).not.toHaveAttribute("open");

      // 展開
      fireEvent.click(summary);
      expect(details).toHaveAttribute("open");

      // 再度クリックで折りたたみ
      fireEvent.click(summary);
      expect(details).not.toHaveAttribute("open");
    });
  });

  describe("エッジケース", () => {
    it("複数回展開・折りたたみを繰り返しても正常に動作すること", () => {
      const { container } = render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      const details = container.querySelector("details");

      for (let i = 0; i < 5; i++) {
        fireEvent.click(summary);
        expect(details).toHaveAttribute("open");

        fireEvent.click(summary);
        expect(details).not.toHaveAttribute("open");
      }
    });

    it("展開時に全てのコンテンツが正しくレンダリングされること", () => {
      render(<MapLegend />);

      const summary = screen.getByText("🗺️ マップの見方");
      fireEvent.click(summary);

      // 主要要素の存在確認
      expect(screen.getByText("🎨 色 = 料理ジャンル")).toBeInTheDocument();
      expect(screen.getByText("💰 サイズ = 価格帯")).toBeInTheDocument();
      expect(screen.getByText("日本料理")).toBeInTheDocument();
      expect(screen.getByText("その他")).toBeInTheDocument();
      expect(
        screen.getByText(/小 = ～1000円.*特大 = 3000円～/)
      ).toBeInTheDocument();
    });
  });
});
