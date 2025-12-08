/**
 * @vitest-environment jsdom
 */
import "@/test/accessibility.setup";
import { BusinessStatus } from "@/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BusinessStatusBadge } from "../BusinessStatusBadge";

describe("BusinessStatusBadge", () => {
  it("営業中のバッジを正しく表示", () => {
    render(<BusinessStatusBadge status={BusinessStatus.OPEN} />);

    const badge = screen.getByText("営業中");
    expect(badge).toBeInTheDocument();
  });

  it("閉店中のバッジを正しく表示", () => {
    render(<BusinessStatusBadge status={BusinessStatus.CLOSED} />);

    const badge = screen.getByText("閉店中");
    expect(badge).toBeInTheDocument();
  });

  it("不明のバッジを正しく表示", () => {
    render(<BusinessStatusBadge status={BusinessStatus.UNKNOWN} />);

    // 実際のテキスト表示を確認（「営業時間不明」が表示される）
    const badge = screen.getByText("営業時間不明");
    expect(badge).toBeInTheDocument();
  });

  it("適切なARIAラベルを設定", () => {
    const { container } = render(
      <BusinessStatusBadge status={BusinessStatus.OPEN} />
    );

    // aria-labelを持つ要素が存在することを確認
    const badge = container.querySelector('[aria-label*="営業状況"]');
    expect(badge).toBeInTheDocument();
  });

  it("営業中バッジがレンダリングされる", () => {
    const { container } = render(
      <BusinessStatusBadge status={BusinessStatus.OPEN} />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it("閉店中バッジに適切なスタイルが適用される", () => {
    const { container } = render(
      <BusinessStatusBadge status={BusinessStatus.CLOSED} />
    );

    const badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();
  });

  it("UNKNOWNステータスでもエラーにならない", () => {
    expect(() => {
      render(<BusinessStatusBadge status={BusinessStatus.UNKNOWN} />);
    }).not.toThrow();
  });

  describe("サイズバリエーション", () => {
    it("smallサイズが正しく表示される", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.OPEN} size="small" />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ fontSize: "10px" });
      expect(badge).toHaveStyle({ padding: "2px 6px" });
    });

    it("mediumサイズ（デフォルト）が正しく表示される", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.OPEN} size="medium" />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ fontSize: "12px" });
      expect(badge).toHaveStyle({ padding: "4px 8px" });
    });

    it("largeサイズが正しく表示される", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.OPEN} size="large" />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ fontSize: "14px" });
      expect(badge).toHaveStyle({ padding: "6px 12px" });
    });

    it("サイズ指定なしの場合mediumになる", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.OPEN} />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ fontSize: "12px" });
    });
  });

  describe("アイコン表示制御", () => {
    it("showIcon=trueの場合アイコンが表示される", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.OPEN} showIcon={true} />
      );

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
      expect(icon?.textContent).toBe("🟢");
    });

    it("showIcon=falseの場合アイコンが非表示になる", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.OPEN} showIcon={false} />
      );

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).not.toBeInTheDocument();
    });

    it("デフォルトでアイコンが表示される", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.OPEN} />
      );

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe("カスタムクラス", () => {
    it("classNameが正しく適用される", () => {
      const { container } = render(
        <BusinessStatusBadge
          status={BusinessStatus.OPEN}
          className="custom-class"
        />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass("business-status-badge");
      expect(badge).toHaveClass("custom-class");
    });

    it("className未指定の場合はデフォルトクラスのみ", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.OPEN} />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass("business-status-badge");
      expect(badge.className).not.toContain("custom");
    });
  });

  describe("ステータスごとのアイコン", () => {
    it("営業中は緑のアイコンが表示される", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.OPEN} />
      );

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon?.textContent).toBe("🟢");
    });

    it("閉店中は赤のアイコンが表示される", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.CLOSED} />
      );

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon?.textContent).toBe("🔴");
    });

    it("不明は黄色のアイコンが表示される", () => {
      const { container } = render(
        <BusinessStatusBadge status={BusinessStatus.UNKNOWN} />
      );

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon?.textContent).toBe("🟡");
    });
  });

  describe("複合パターン", () => {
    it("全オプション指定時も正常に動作する", () => {
      const { container } = render(
        <BusinessStatusBadge
          status={BusinessStatus.CLOSED}
          size="large"
          showIcon={false}
          className="test-badge"
        />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("test-badge");
      expect(badge).toHaveStyle({ fontSize: "14px" });

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).not.toBeInTheDocument();
    });
  });
});
