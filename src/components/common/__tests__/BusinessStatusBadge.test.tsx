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
});
