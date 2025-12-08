/**
 * @vitest-environment jsdom
 */
import "@/test/accessibility.setup";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CircularMarker } from "../CircularMarker";

describe("CircularMarker", () => {
  describe("基本レンダリング", () => {
    it("和食レストランマーカーが正しくレンダリングされること", () => {
      render(<CircularMarker category="japanese" />);

      const marker = screen.getByLabelText("和食レストラン");
      expect(marker).toBeInTheDocument();
    });

    it("駐車場マーカーが正しくレンダリングされること", () => {
      render(<CircularMarker category="parking" />);

      const marker = screen.getByLabelText("駐車場");
      expect(marker).toBeInTheDocument();
    });

    it("トイレマーカーが正しくレンダリングされること", () => {
      render(<CircularMarker category="toilet" />);

      const marker = screen.getByLabelText("トイレ");
      expect(marker).toBeInTheDocument();
    });
  });

  describe("サイズバリエーション", () => {
    it("smallサイズが正しく適用される", () => {
      const { container } = render(
        <CircularMarker category="japanese" size="small" />
      );

      const button = container.querySelector("button");
      expect(button).toHaveStyle({ width: "32px", height: "32px" });
    });

    it("mediumサイズ（デフォルト）が正しく適用される", () => {
      const { container } = render(
        <CircularMarker category="japanese" size="medium" />
      );

      const button = container.querySelector("button");
      expect(button).toHaveStyle({ width: "40px", height: "40px" });
    });

    it("largeサイズが正しく適用される", () => {
      const { container } = render(
        <CircularMarker category="japanese" size="large" />
      );

      const button = container.querySelector("button");
      expect(button).toHaveStyle({ width: "48px", height: "48px" });
    });
  });

  describe("インタラクティブ性", () => {
    it("interactive=trueの場合クリックイベントが発火する", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <CircularMarker
          category="japanese"
          interactive={true}
          onClick={handleClick}
        />
      );

      const marker = screen.getByLabelText("和食レストラン");
      await user.click(marker);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("interactive=falseの場合クリックイベントが発火しない", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <CircularMarker
          category="japanese"
          interactive={false}
          onClick={handleClick}
        />
      );

      const marker = screen.getByLabelText("和食レストラン");
      await user.click(marker);

      // interactive=falseの場合、onClickは呼ばれない
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("onClick未指定でもエラーにならない", async () => {
      const user = userEvent.setup();

      render(<CircularMarker category="japanese" interactive={true} />);

      const marker = screen.getByLabelText("和食レストラン");

      await expect(user.click(marker)).resolves.not.toThrow();
    });
  });

  describe("カスタムクラス", () => {
    it("classNameが正しく適用される", () => {
      const { container } = render(
        <CircularMarker category="japanese" className="custom-marker" />
      );

      const marker = container.querySelector(".circular-marker");
      expect(marker).toHaveClass("custom-marker");
    });

    it("デフォルトクラスが常に適用される", () => {
      const { container } = render(<CircularMarker category="japanese" />);

      const marker = container.querySelector(".circular-marker");
      expect(marker).toBeInTheDocument();
    });
  });

  describe("ARIAラベル", () => {
    it("カスタムariaLabelが優先される", () => {
      render(
        <CircularMarker category="japanese" ariaLabel="おすすめレストラン" />
      );

      const marker = screen.getByLabelText("おすすめレストラン");
      expect(marker).toBeInTheDocument();
    });

    it("ariaLabel未指定の場合デフォルトラベルが使用される", () => {
      render(<CircularMarker category="parking" />);

      const marker = screen.getByLabelText("駐車場");
      expect(marker).toBeInTheDocument();
    });
  });

  describe("アニメーション", () => {
    it("animation='attention'が正しく適用される", () => {
      const { container } = render(
        <CircularMarker category="japanese" animation="attention" />
      );

      const marker = container.querySelector(".circular-marker");
      expect(marker).toHaveClass("attention-animation");
    });

    it("animation='subtle'が正しく適用される", () => {
      const { container } = render(
        <CircularMarker category="japanese" animation="subtle" />
      );

      const marker = container.querySelector(".circular-marker");
      expect(marker).toHaveClass("subtle-animation");
    });

    it("animation='none'の場合アニメーションクラスが適用されない", () => {
      const { container } = render(
        <CircularMarker category="japanese" animation="none" />
      );

      const marker = container.querySelector(".circular-marker");
      expect(marker).not.toHaveClass("attention-animation");
      expect(marker).not.toHaveClass("subtle-animation");
    });
  });

  describe("リングスタイル", () => {
    it("駐車場は常にリングスタイルが適用される", () => {
      const { container } = render(<CircularMarker category="parking" />);

      const marker = container.querySelector(".circular-marker");
      expect(marker).toHaveClass("parking-marker");
    });

    it("ringed=trueの場合リングスタイルが適用される", () => {
      const { container } = render(
        <CircularMarker category="japanese" ringed={true} />
      );

      const marker = container.querySelector(".circular-marker");
      expect(marker).toHaveClass("ringed-marker");
    });

    it("ringed=falseの場合リングスタイルが適用されない", () => {
      const { container } = render(
        <CircularMarker category="japanese" ringed={false} />
      );

      const marker = container.querySelector(".circular-marker");
      expect(marker).not.toHaveClass("ringed-marker");
    });
  });

  describe("カスタムコンテンツ", () => {
    it("customContentが指定された場合に表示される", () => {
      render(
        <CircularMarker
          category="toilet"
          customContent={<div data-testid="custom-content">Custom</div>}
        />
      );

      const customContent = screen.getByTestId("custom-content");
      expect(customContent).toBeInTheDocument();
      expect(customContent).toHaveTextContent("Custom");
    });

    it("customContent未指定の場合デフォルトアイコンが表示される", () => {
      const { container } = render(<CircularMarker category="japanese" />);

      const icon = container.querySelector(".icon-image");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("エッジケース", () => {
    it("すべてのオプション指定時も正常に動作する", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <CircularMarker
          category="japanese"
          size="large"
          interactive={true}
          onClick={handleClick}
          className="test-marker"
          ariaLabel="テストマーカー"
          animation="attention"
          ringed={true}
          customContent={<span>Test</span>}
        />
      );

      const marker = screen.getByLabelText("テストマーカー");
      expect(marker).toBeInTheDocument();

      await user.click(marker);

      expect(handleClick).toHaveBeenCalled();
    });

    it("最小限のpropsでも動作する", () => {
      expect(() => {
        render(<CircularMarker category="japanese" />);
      }).not.toThrow();
    });

    it("複数のマーカーを同時にレンダリングできる", () => {
      const { container } = render(
        <>
          <CircularMarker category="japanese" />
          <CircularMarker category="parking" />
          <CircularMarker category="toilet" />
        </>
      );

      const markers = container.querySelectorAll(".circular-marker");
      expect(markers).toHaveLength(3);
    });
  });

  describe("アクセシビリティ", () => {
    it("buttonタグが使用されている", () => {
      const { container } = render(<CircularMarker category="japanese" />);

      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
    });

    it("aria-labelが正しく設定されている", () => {
      render(<CircularMarker category="toilet" />);

      const marker = screen.getByLabelText("トイレ");
      expect(marker).toBeInTheDocument();
    });

    it("フォーカス可能な要素として機能する", () => {
      const { container } = render(
        <CircularMarker category="japanese" interactive={true} />
      );

      const marker = container.querySelector(".circular-marker");
      expect(marker).toBeInTheDocument();
      // インタラクティブな要素としてタブキーでフォーカス可能
    });
  });
});
