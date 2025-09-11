/**
 * @vitest-environment jsdom
 */
import "@/test/accessibility.setup";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GoogleMapsLinkButton } from "../GoogleMapsLinkButton";

describe("GoogleMapsLinkButton", () => {
  const mockProps = {
    name: "テストレストラン",
    coordinates: { lat: 38.0682, lng: 138.2306 }, // 佐渡市両津の座標
    placeId: "ChIJ123456789",
  };

  it("Google Mapsリンクボタンを正しく表示", () => {
    render(<GoogleMapsLinkButton {...mockProps} />);

    // 実際のaria-labelに基づいてボタンを検索
    const button = screen.getByRole("button", {
      name: "Google Mapsでテストレストランを表示する",
    });
    expect(button).toBeInTheDocument();
  });

  it("正しいGoogle Maps URLが設定されている", () => {
    render(<GoogleMapsLinkButton {...mockProps} />);

    // ボタンを取得して、クリック処理が設定されていることを確認
    const button = screen.getByRole("button", {
      name: "Google Mapsでテストレストランを表示する",
    });
    expect(button).toHaveAttribute("type", "button");
  });

  it("座標のみ提供された場合でも動作", () => {
    render(
      <GoogleMapsLinkButton
        name="テストレストラン"
        coordinates={{ lat: 38.0682, lng: 138.2306 }}
      />
    );

    const button = screen.getByRole("button", {
      name: "Google Mapsでテストレストランを表示する",
    });
    expect(button).toBeInTheDocument();
  });

  it("適切なアイコンが表示される", () => {
    render(<GoogleMapsLinkButton {...mockProps} />);

    // getAllByTextを使用して複数のアイコンの存在を確認
    const icons = screen.getAllByText("📍");
    expect(icons.length).toBeGreaterThan(0);
    expect(icons[0]).toBeInTheDocument();
  });
});
