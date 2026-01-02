/* @vitest-environment jsdom */
/**
 * @fileoverview OptimizedImage Component Tests
 * 最適化画像コンポーネントのテスト
 */

import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OptimizedImage } from "./OptimizedImage";

describe("OptimizedImage", () => {
  const defaultProps = {
    src: "/assets/png/test.png",
    alt: "テスト画像",
    width: 100,
    height: 100,
  };

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("基本レンダリング", () => {
    it("picture要素が正しくレンダリングされる", () => {
      const { container } = render(<OptimizedImage {...defaultProps} />);

      const picture = container.querySelector("picture");
      expect(picture).toBeInTheDocument();
    });

    it("img要素が正しい属性でレンダリングされる", () => {
      render(<OptimizedImage {...defaultProps} />);

      const img = screen.getByAltText("テスト画像");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/assets/png/test.png");
      expect(img).toHaveAttribute("alt", "テスト画像");
      expect(img).toHaveAttribute("width", "100");
      expect(img).toHaveAttribute("height", "100");
    });

    it("デフォルトのloading属性がlazyになる", () => {
      render(<OptimizedImage {...defaultProps} />);

      const img = screen.getByAltText("テスト画像");
      expect(img).toHaveAttribute("loading", "lazy");
    });

    it("デフォルトのdecoding属性がasyncになる", () => {
      render(<OptimizedImage {...defaultProps} />);

      const img = screen.getByAltText("テスト画像");
      expect(img).toHaveAttribute("decoding", "async");
    });
  });

  describe("フォーマットフォールバック", () => {
    it("AVIF source要素が生成される", () => {
      const { container } = render(<OptimizedImage {...defaultProps} />);

      const avifSource = container.querySelector('source[type="image/avif"]');
      expect(avifSource).toBeInTheDocument();
      expect(avifSource).toHaveAttribute("srcset", "/assets/png/test.avif");
    });

    it("WebP source要素が生成される", () => {
      const { container } = render(<OptimizedImage {...defaultProps} />);

      const webpSource = container.querySelector('source[type="image/webp"]');
      expect(webpSource).toBeInTheDocument();
      expect(webpSource).toHaveAttribute("srcset", "/assets/png/test.webp");
    });

    it("source要素の順序が正しい（AVIF → WebP → img）", () => {
      const { container } = render(<OptimizedImage {...defaultProps} />);

      const sources = container.querySelectorAll("source");
      expect(sources).toHaveLength(2);
      expect(sources[0]).toHaveAttribute("type", "image/avif");
      expect(sources[1]).toHaveAttribute("type", "image/webp");
    });

    it("jpg拡張子でも正しく変換される", () => {
      const { container } = render(
        <OptimizedImage
          src="/images/photo.jpg"
          alt="写真"
          width={200}
          height={150}
        />
      );

      const avifSource = container.querySelector('source[type="image/avif"]');
      const webpSource = container.querySelector('source[type="image/webp"]');

      expect(avifSource).toHaveAttribute("srcset", "/images/photo.avif");
      expect(webpSource).toHaveAttribute("srcset", "/images/photo.webp");
    });

    it("jpeg拡張子でも正しく変換される", () => {
      const { container } = render(
        <OptimizedImage
          src="/images/photo.jpeg"
          alt="写真"
          width={200}
          height={150}
        />
      );

      const avifSource = container.querySelector('source[type="image/avif"]');
      expect(avifSource).toHaveAttribute("srcset", "/images/photo.avif");
    });

    it("大文字拡張子でも正しく変換される", () => {
      const { container } = render(
        <OptimizedImage
          src="/images/PHOTO.PNG"
          alt="写真"
          width={200}
          height={150}
        />
      );

      const avifSource = container.querySelector('source[type="image/avif"]');
      expect(avifSource).toHaveAttribute("srcset", "/images/PHOTO.avif");
    });
  });

  describe("プロパティの適用", () => {
    it("loading属性をeagerに設定できる", () => {
      render(<OptimizedImage {...defaultProps} loading="eager" />);

      const img = screen.getByAltText("テスト画像");
      expect(img).toHaveAttribute("loading", "eager");
    });

    it("decoding属性をsyncに設定できる", () => {
      render(<OptimizedImage {...defaultProps} decoding="sync" />);

      const img = screen.getByAltText("テスト画像");
      expect(img).toHaveAttribute("decoding", "sync");
    });

    it("className属性が適用される", () => {
      render(<OptimizedImage {...defaultProps} className="custom-image" />);

      const img = screen.getByAltText("テスト画像");
      expect(img).toHaveClass("custom-image");
    });

    it("style属性が適用される", () => {
      const customStyle = { borderRadius: "8px", objectFit: "cover" as const };
      render(<OptimizedImage {...defaultProps} style={customStyle} />);

      const img = screen.getByAltText("テスト画像");
      expect(img).toHaveStyle({ borderRadius: "8px", objectFit: "cover" });
    });

    it("sizes属性が適用される", () => {
      render(
        <OptimizedImage
          {...defaultProps}
          sizes="(max-width: 600px) 100vw, 50vw"
        />
      );

      const img = screen.getByAltText("テスト画像");
      expect(img).toHaveAttribute("sizes", "(max-width: 600px) 100vw, 50vw");
    });

    it("imgSrcSet属性が適用される", () => {
      render(
        <OptimizedImage
          {...defaultProps}
          imgSrcSet="test-480w.png 480w, test-800w.png 800w"
        />
      );

      const img = screen.getByAltText("テスト画像");
      expect(img).toHaveAttribute(
        "srcset",
        "test-480w.png 480w, test-800w.png 800w"
      );
    });

    it("その他のHTML属性が適用される", () => {
      render(
        <OptimizedImage
          {...defaultProps}
          data-testid="custom-image"
          title="カスタムタイトル"
        />
      );

      const img = screen.getByTestId("custom-image");
      expect(img).toHaveAttribute("title", "カスタムタイトル");
    });
  });

  describe("レスポンシブ対応", () => {
    it("width/heightを文字列で指定できる", () => {
      render(
        <OptimizedImage
          src="/test.png"
          alt="テスト"
          width="100%"
          height="auto"
        />
      );

      const img = screen.getByAltText("テスト");
      expect(img).toHaveAttribute("width", "100%");
      expect(img).toHaveAttribute("height", "auto");
    });

    it("width/heightなしでもレンダリングされる", () => {
      render(<OptimizedImage src="/test.png" alt="テスト" />);

      const img = screen.getByAltText("テスト");
      expect(img).toBeInTheDocument();
    });
  });

  describe("開発環境での警告", () => {
    it("width/heightがない場合でもレンダリングされる", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      render(<OptimizedImage src="/test.png" alt="テスト" />);

      const img = screen.getByAltText("テスト");
      expect(img).toBeInTheDocument();

      consoleWarnSpy.mockRestore();
    });

    it("width/heightがある場合は正常にレンダリングされる", () => {
      render(<OptimizedImage {...defaultProps} />);

      const img = screen.getByAltText("テスト画像");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("width", "100");
      expect(img).toHaveAttribute("height", "100");
    });
  });

  describe("エッジケース", () => {
    it("パス内に複数の拡張子パターンがあっても最後のみ置換される", () => {
      const { container } = render(
        <OptimizedImage
          src="/path/to/image.png.backup.png"
          alt="テスト"
          width={100}
          height={100}
        />
      );

      const avifSource = container.querySelector('source[type="image/avif"]');
      expect(avifSource).toHaveAttribute(
        "srcset",
        "/path/to/image.png.backup.avif"
      );
    });

    it("拡張子なしのパスでもエラーにならない", () => {
      const { container } = render(
        <OptimizedImage
          src="/path/to/image"
          alt="テスト"
          width={100}
          height={100}
        />
      );

      const picture = container.querySelector("picture");
      expect(picture).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("alt属性が必須である", () => {
      render(<OptimizedImage {...defaultProps} />);

      const img = screen.getByAltText("テスト画像");
      expect(img).toHaveAttribute("alt", "テスト画像");
    });

    it("空のalt属性も設定できる（装飾画像用）", () => {
      const { container } = render(
        <OptimizedImage src="/decoration.png" alt="" width={50} height={50} />
      );

      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("alt", "");
    });
  });
});
