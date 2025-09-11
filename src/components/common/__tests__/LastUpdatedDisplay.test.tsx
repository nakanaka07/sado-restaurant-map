/**
 * @vitest-environment jsdom
 */
import "@/test/accessibility.setup";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LastUpdatedDisplay } from "../LastUpdatedDisplay";

describe("LastUpdatedDisplay", () => {
  it("最終更新日を正しく表示", () => {
    const lastUpdated = "2024-01-15T10:00:00Z";
    const { container } = render(
      <LastUpdatedDisplay lastUpdated={lastUpdated} />
    );

    // コンテナ内で「更新」を含むテキストが存在することを確認
    expect(container.textContent).toMatch(/更新/);
  });

  it("更新日がない場合は適切な表示", () => {
    render(<LastUpdatedDisplay lastUpdated="" />);

    // 空の場合は「更新日不明」が表示される
    const component = screen.getByText("更新日不明");
    expect(component).toBeInTheDocument();
  });

  it("適切なARIAラベルを設定", () => {
    const lastUpdated = "2024-01-15T10:00:00Z";
    render(<LastUpdatedDisplay lastUpdated={lastUpdated} />);

    // FreshnessIndicatorのaria-labelをチェック
    const indicator = screen.getByLabelText(
      /データが古い可能性があります|データは最新です/
    );
    expect(indicator).toBeInTheDocument();
  });
});
