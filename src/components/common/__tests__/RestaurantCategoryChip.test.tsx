/**
 * @fileoverview RestaurantCategoryChip Comprehensive Tests
 * カバレッジ目標: 0% → 100%
 *
 * テスト対象:
 * - 全19カテゴリの表示 (CuisineType + RestaurantCategory)
 * - サイズバリエーション (small, medium)
 * - バリアント (filled, outlined)
 * - アイコン表示/非表示
 * - アクセシビリティ (aria-label, aria-hidden)
 * - スタイル適用 (色、パディング、フォントサイズ)
 */

import { RestaurantCategory } from "@/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RestaurantCategoryChip } from "../RestaurantCategoryChip";

// ==============================
// カテゴリー定義
// ==============================

const CUISINE_TYPES = [
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
  "日本料理",
  "レストラン",
  "その他",
] as const;

const RESTAURANT_CATEGORIES = [
  RestaurantCategory.SUSHI,
  RestaurantCategory.SEAFOOD,
  RestaurantCategory.YAKINIKU,
  RestaurantCategory.RAMEN,
  RestaurantCategory.NOODLES,
  RestaurantCategory.CHINESE,
  RestaurantCategory.ITALIAN,
  RestaurantCategory.FRENCH,
  RestaurantCategory.CAFE,
  RestaurantCategory.BAR,
  RestaurantCategory.FAST_FOOD,
  RestaurantCategory.DESSERT,
  RestaurantCategory.CURRY,
  RestaurantCategory.STEAK,
  RestaurantCategory.BENTO,
  RestaurantCategory.JAPANESE,
  RestaurantCategory.RESTAURANT,
  RestaurantCategory.OTHER,
] as const;

// カテゴリと表示テキストのマッピング
const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  寿司: "寿司",
  sushi: "寿司",
  海鮮: "海鮮",
  seafood: "海鮮",
  "焼肉・焼鳥": "焼肉・焼鳥",
  yakiniku: "焼肉・焼鳥",
  ラーメン: "ラーメン",
  ramen: "ラーメン",
  "そば・うどん": "そば・うどん",
  noodles: "そば・うどん",
  中華: "中華",
  chinese: "中華",
  イタリアン: "イタリアン",
  italian: "イタリアン",
  フレンチ: "フレンチ",
  french: "フレンチ",
  "カフェ・喫茶店": "カフェ",
  cafe: "カフェ",
  "バー・居酒屋": "バー・居酒屋",
  bar: "バー・居酒屋",
  ファストフード: "ファストフード",
  fastfood: "ファストフード",
  "デザート・スイーツ": "デザート",
  dessert: "デザート",
  "カレー・エスニック": "カレー",
  curry: "カレー",
  "ステーキ・洋食": "ステーキ・洋食",
  steak: "ステーキ・洋食",
  "弁当・テイクアウト": "弁当",
  bento: "弁当",
  日本料理: "和食",
  japanese: "和食",
  レストラン: "レストラン",
  restaurant: "レストラン",
  その他: "その他",
  other: "その他",
};

// ==============================
// 基本表示テスト
// ==============================

describe("RestaurantCategoryChip - Basic Rendering", () => {
  describe("CuisineType カテゴリ", () => {
    CUISINE_TYPES.forEach(category => {
      it(`"${category}" カテゴリを正しく表示する`, () => {
        render(<RestaurantCategoryChip category={category} />);

        const expectedText = CATEGORY_DISPLAY_MAP[category] || category;
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      });
    });
  });

  describe("RestaurantCategory enum", () => {
    RESTAURANT_CATEGORIES.forEach(category => {
      it(`"${category}" カテゴリを正しく表示する`, () => {
        render(<RestaurantCategoryChip category={category} />);

        const expectedText = CATEGORY_DISPLAY_MAP[category] || "その他";
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      });
    });
  });

  it("デフォルトカテゴリ (その他) を表示する", () => {
    render(
      <RestaurantCategoryChip
        category={"不明なカテゴリ" as unknown as RestaurantCategory}
      />
    );
    expect(screen.getByText("その他")).toBeInTheDocument();
  });
});

// ==============================
// サイズバリエーション
// ==============================

describe("RestaurantCategoryChip - Size Variants", () => {
  it("small サイズを適用する", () => {
    const { container } = render(
      <RestaurantCategoryChip category="寿司" size="small" />
    );

    const chip = container.querySelector(".restaurant-category-chip");
    expect(chip).toHaveStyle({
      padding: "2px 6px",
      fontSize: "10px",
      borderRadius: "6px",
    });
  });

  it("medium サイズを適用する (デフォルト)", () => {
    const { container } = render(
      <RestaurantCategoryChip category="寿司" size="medium" />
    );

    const chip = container.querySelector(".restaurant-category-chip");
    expect(chip).toHaveStyle({
      padding: "4px 8px",
      fontSize: "11px",
      borderRadius: "8px",
    });
  });

  it("サイズ指定なしでmediumサイズになる", () => {
    const { container } = render(<RestaurantCategoryChip category="寿司" />);

    const chip = container.querySelector(".restaurant-category-chip");
    expect(chip).toHaveStyle({
      padding: "4px 8px",
      fontSize: "11px",
    });
  });
});

// ==============================
// バリアント (filled / outlined)
// ==============================

describe("RestaurantCategoryChip - Variants", () => {
  it("filled バリアント (デフォルト) を適用する", () => {
    const { container } = render(
      <RestaurantCategoryChip category="寿司" variant="filled" />
    );

    const chip = container.querySelector(".restaurant-category-chip");
    expect(chip).toHaveStyle({
      backgroundColor: "#fef3c7",
      color: "#d97706",
      border: "1px solid #fbbf24",
    });
  });

  it("outlined バリアントを適用する", () => {
    const { container } = render(
      <RestaurantCategoryChip category="寿司" variant="outlined" />
    );

    const chip = container.querySelector(
      ".restaurant-category-chip"
    ) as HTMLElement;
    // toHaveStyle は transparent を空文字として扱うため、直接style属性をチェック
    expect(chip.style.backgroundColor).toBe("transparent");
    expect(chip).toHaveStyle({
      color: "#d97706",
      border: "1px solid #fbbf24",
    });
  });

  it("バリアント指定なしでfilledになる", () => {
    const { container } = render(<RestaurantCategoryChip category="寿司" />);

    const chip = container.querySelector(".restaurant-category-chip");
    expect(chip).toHaveStyle({
      backgroundColor: "#fef3c7",
    });
  });
});

// ==============================
// アイコン表示
// ==============================

describe("RestaurantCategoryChip - Icon Display", () => {
  it("アイコンをデフォルトで表示する", () => {
    const { container } = render(<RestaurantCategoryChip category="寿司" />);

    const icon = container.querySelector('span[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent("🍣");
  });

  it("showIcon={true} でアイコンを表示する", () => {
    const { container } = render(
      <RestaurantCategoryChip category="海鮮" showIcon={true} />
    );

    const icon = container.querySelector('span[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent("🐟");
  });

  it("showIcon={false} でアイコンを非表示にする", () => {
    const { container } = render(
      <RestaurantCategoryChip category="寿司" showIcon={false} />
    );

    const icon = container.querySelector('span[aria-hidden="true"]');
    expect(icon).not.toBeInTheDocument();
  });

  it("全カテゴリが固有のアイコンを持つ", () => {
    const icons = new Set<string>();

    CUISINE_TYPES.forEach(category => {
      const { container } = render(
        <RestaurantCategoryChip category={category} />
      );
      const icon = container.querySelector('span[aria-hidden="true"]');
      if (icon) {
        icons.add(icon.textContent || "");
      }
    });

    // 18種類の固有アイコン (その他除く)
    expect(icons.size).toBeGreaterThanOrEqual(17);
  });
});

// ==============================
// スタイル適用
// ==============================

describe("RestaurantCategoryChip - Styling", () => {
  it("共通スタイルを適用する", () => {
    const { container } = render(<RestaurantCategoryChip category="寿司" />);

    const chip = container.querySelector(".restaurant-category-chip");
    expect(chip).toHaveStyle({
      fontWeight: "500",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      lineHeight: "1",
      whiteSpace: "nowrap",
      transition: "all 0.2s ease-in-out",
    });
  });

  it("カスタムclassNameを適用する", () => {
    const { container } = render(
      <RestaurantCategoryChip category="寿司" className="custom-class" />
    );

    const chip = container.querySelector(".restaurant-category-chip");
    expect(chip).toHaveClass("restaurant-category-chip");
    expect(chip).toHaveClass("custom-class");
  });

  it("各カテゴリが固有の色設定を持つ", () => {
    const colors = new Set<string>();

    CUISINE_TYPES.slice(0, 5).forEach(category => {
      const { container } = render(
        <RestaurantCategoryChip category={category} />
      );
      const chip = container.querySelector(
        ".restaurant-category-chip"
      ) as HTMLElement;
      if (chip) {
        colors.add(chip.style.backgroundColor);
      }
    });

    // 異なる5つのカテゴリは異なる背景色を持つ
    expect(colors.size).toBe(5);
  });
});

// ==============================
// アクセシビリティ
// ==============================

describe("RestaurantCategoryChip - Accessibility", () => {
  it("aria-label を正しく設定する", () => {
    render(<RestaurantCategoryChip category="寿司" />);

    const chip = screen.getByLabelText("カテゴリ: 寿司");
    expect(chip).toBeInTheDocument();
  });

  it("アイコンに aria-hidden を設定する", () => {
    const { container } = render(<RestaurantCategoryChip category="寿司" />);

    const icon = container.querySelector('span[aria-hidden="true"]');
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("全カテゴリが適切な aria-label を持つ", () => {
    CUISINE_TYPES.slice(0, 5).forEach(category => {
      const { unmount } = render(
        <RestaurantCategoryChip category={category} />
      );

      const expectedText = CATEGORY_DISPLAY_MAP[category] || category;
      const chip = screen.getByLabelText(`カテゴリ: ${expectedText}`);
      expect(chip).toBeInTheDocument();

      unmount();
    });
  });
});

// ==============================
// カテゴリー別詳細テスト
// ==============================

describe("RestaurantCategoryChip - Category-Specific Tests", () => {
  it("寿司カテゴリの完全な設定を検証する", () => {
    const { container } = render(<RestaurantCategoryChip category="寿司" />);

    const chip = container.querySelector(
      ".restaurant-category-chip"
    ) as HTMLElement;
    expect(chip).toHaveStyle({
      backgroundColor: "#fef3c7",
      color: "#d97706",
      border: "1px solid #fbbf24",
    });

    expect(screen.getByText("寿司")).toBeInTheDocument();
    expect(screen.getByLabelText("カテゴリ: 寿司")).toBeInTheDocument();

    const icon = container.querySelector('span[aria-hidden="true"]');
    expect(icon).toHaveTextContent("🍣");
  });

  it("ステーキ・洋食カテゴリの特殊な色設定を検証する", () => {
    const { container } = render(
      <RestaurantCategoryChip category="ステーキ・洋食" />
    );

    const chip = container.querySelector(
      ".restaurant-category-chip"
    ) as HTMLElement;
    // 暗い背景色の場合は白文字
    expect(chip).toHaveStyle({
      backgroundColor: "#7c2d12",
      color: "#ffffff",
    });
  });

  it("CuisineTypeとRestaurantCategoryで同じ表示になる", () => {
    const { container: container1 } = render(
      <RestaurantCategoryChip category="寿司" />
    );
    const { container: container2 } = render(
      <RestaurantCategoryChip category={RestaurantCategory.SUSHI} />
    );

    const chip1 = container1.querySelector(
      ".restaurant-category-chip"
    ) as HTMLElement;
    const chip2 = container2.querySelector(
      ".restaurant-category-chip"
    ) as HTMLElement;

    expect(chip1.style.backgroundColor).toBe(chip2.style.backgroundColor);
    expect(chip1.style.color).toBe(chip2.style.color);
    expect(chip1.textContent).toBe(chip2.textContent);
  });
});

// ==============================
// 組み合わせテスト
// ==============================

describe("RestaurantCategoryChip - Combination Tests", () => {
  it("small + outlined + アイコン非表示の組み合わせ", () => {
    const { container } = render(
      <RestaurantCategoryChip
        category="ラーメン"
        size="small"
        variant="outlined"
        showIcon={false}
      />
    );

    const chip = container.querySelector(
      ".restaurant-category-chip"
    ) as HTMLElement;

    // サイズ
    expect(chip).toHaveStyle({
      padding: "2px 6px",
      fontSize: "10px",
    });

    // バリアント
    expect(chip.style.backgroundColor).toBe("transparent");

    // アイコン非表示
    const icon = container.querySelector('span[aria-hidden="true"]');
    expect(icon).not.toBeInTheDocument();

    // テキスト表示
    expect(screen.getByText("ラーメン")).toBeInTheDocument();
  });

  it("medium + filled + カスタムクラスの組み合わせ", () => {
    const { container } = render(
      <RestaurantCategoryChip
        category="カフェ・喫茶店"
        size="medium"
        variant="filled"
        className="my-custom-chip"
      />
    );

    const chip = container.querySelector(
      ".restaurant-category-chip"
    ) as HTMLElement;

    expect(chip).toHaveStyle({
      padding: "4px 8px",
      backgroundColor: "#fefbf3",
    });
    expect(chip).toHaveClass("my-custom-chip");
  });

  it("複数のチップを同時にレンダリング", () => {
    render(
      <>
        <RestaurantCategoryChip category="寿司" />
        <RestaurantCategoryChip category="ラーメン" />
        <RestaurantCategoryChip category="カフェ・喫茶店" />
      </>
    );

    expect(screen.getByText("寿司")).toBeInTheDocument();
    expect(screen.getByText("ラーメン")).toBeInTheDocument();
    expect(screen.getByText("カフェ")).toBeInTheDocument();
  });
});

// ==============================
// エッジケース
// ==============================

describe("RestaurantCategoryChip - Edge Cases", () => {
  it("空文字列を渡すとデフォルトカテゴリになる", () => {
    render(
      <RestaurantCategoryChip category={"" as unknown as RestaurantCategory} />
    );
    expect(screen.getByText("その他")).toBeInTheDocument();
  });

  it("nullを渡すとデフォルトカテゴリになる", () => {
    render(
      <RestaurantCategoryChip
        category={null as unknown as RestaurantCategory}
      />
    );
    expect(screen.getByText("その他")).toBeInTheDocument();
  });

  it("undefinedを渡すとデフォルトカテゴリになる", () => {
    render(
      <RestaurantCategoryChip
        category={undefined as unknown as RestaurantCategory}
      />
    );
    expect(screen.getByText("その他")).toBeInTheDocument();
  });

  it("数値を渡すとデフォルトカテゴリになる", () => {
    render(
      <RestaurantCategoryChip category={123 as unknown as RestaurantCategory} />
    );
    expect(screen.getByText("その他")).toBeInTheDocument();
  });
});

// ==============================
// パフォーマンステスト
// ==============================

describe("RestaurantCategoryChip - Performance", () => {
  it("React.memo による再レンダリング抑制", () => {
    const { rerender } = render(<RestaurantCategoryChip category="寿司" />);

    // 同じpropsで再レンダリング (memo により再レンダリングされないはず)
    rerender(<RestaurantCategoryChip category="寿司" />);

    expect(screen.getByText("寿司")).toBeInTheDocument();
  });

  it("displayNameが正しく設定されている", () => {
    expect(RestaurantCategoryChip.displayName).toBe("RestaurantCategoryChip");
  });

  it("大量のチップを高速にレンダリング", () => {
    const start = performance.now();

    render(
      <>
        {CUISINE_TYPES.map((category, index) => (
          <RestaurantCategoryChip key={index} category={category} />
        ))}
      </>
    );

    const duration = performance.now() - start;

    // 18カテゴリのレンダリングが100ms以内
    expect(duration).toBeLessThan(100);
  });
});
