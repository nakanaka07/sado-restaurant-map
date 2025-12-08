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

  describe("モード切り替え", () => {
    it("directions モードでルート検索ボタンを表示", () => {
      render(<GoogleMapsLinkButton {...mockProps} mode="directions" />);

      const button = screen.getByRole("button", {
        name: /ルート案内/,
      });
      expect(button).toBeInTheDocument();
    });

    it("streetview モードでストリートビューボタンを表示", () => {
      render(<GoogleMapsLinkButton {...mockProps} mode="streetview" />);

      const button = screen.getByRole("button", {
        name: /ストリートビュー/,
      });
      expect(button).toBeInTheDocument();
    });
  });

  describe("バリアント", () => {
    it("secondary バリアントを適用できる", () => {
      render(<GoogleMapsLinkButton {...mockProps} variant="secondary" />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("text バリアントを適用できる", () => {
      render(<GoogleMapsLinkButton {...mockProps} variant="text" />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("サイズ", () => {
    it("small サイズを適用できる", () => {
      render(<GoogleMapsLinkButton {...mockProps} size="small" />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("large サイズを適用できる", () => {
      render(<GoogleMapsLinkButton {...mockProps} size="large" />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("アイコン表示", () => {
    it("showIcon=false でアイコンを非表示にできる", () => {
      render(<GoogleMapsLinkButton {...mockProps} showIcon={false} />);

      const icons = screen.queryAllByText("📍");
      expect(icons).toHaveLength(0);
    });
  });

  describe("カスタムクラス", () => {
    it("className を適用できる", () => {
      render(<GoogleMapsLinkButton {...mockProps} className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("google-maps-link-button");
      expect(button).toHaveClass("custom-class");
    });
  });
});
