/* @vitest-environment jsdom */
/**
 * @fileoverview Tests for MapErrorFallback component
 * 地図エラーフォールバックコンポーネントのテスト
 */

import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MapErrorFallback } from "./MapErrorFallback";

describe("MapErrorFallback", () => {
  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("最小限のpropsでエラーフォールバックをレンダリングする", () => {
      render(<MapErrorFallback />);

      expect(screen.getByText("🗺️")).toBeInTheDocument();
      expect(screen.getByText("地図を読み込めません")).toBeInTheDocument();
    });

    it("map-loadingクラスが適用されている", () => {
      const { container } = render(<MapErrorFallback />);

      const wrapper = container.querySelector(".map-loading");
      expect(wrapper).toBeInTheDocument();
    });

    it("エラーアイコン(🗺️)が表示される", () => {
      render(<MapErrorFallback />);

      const icon = screen.getByText("🗺️");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveStyle({ fontSize: "48px", marginBottom: "16px" });
    });
  });

  describe("error prop", () => {
    it("error未指定時はデフォルトメッセージを表示", () => {
      render(<MapErrorFallback />);

      expect(
        screen.getByText("Google Maps API の Map ID を設定してください")
      ).toBeInTheDocument();
    });

    it("errorがnullの場合もデフォルトメッセージを表示", () => {
      render(<MapErrorFallback error={null} />);

      expect(
        screen.getByText("Google Maps API の Map ID を設定してください")
      ).toBeInTheDocument();
    });

    it("errorが空文字列の場合もデフォルトメッセージを表示", () => {
      render(<MapErrorFallback error="" />);

      expect(
        screen.getByText("Google Maps API の Map ID を設定してください")
      ).toBeInTheDocument();
    });

    it("errorが指定されている場合はエラーメッセージを表示", () => {
      const errorMessage = "API キーが無効です";
      render(<MapErrorFallback error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it("カスタムエラーメッセージが指定された場合デフォルトメッセージは表示されない", () => {
      render(<MapErrorFallback error="カスタムエラー" />);

      expect(
        screen.queryByText("Google Maps API の Map ID を設定してください")
      ).not.toBeInTheDocument();
    });
  });

  describe("mapId prop", () => {
    it("mapId未指定時は「未設定」と表示", () => {
      render(<MapErrorFallback />);

      expect(screen.getByText("未設定")).toBeInTheDocument();
    });

    it("mapIdが指定されている場合はその値を表示", () => {
      const mapId = "test-map-id-123";
      render(<MapErrorFallback mapId={mapId} />);

      expect(screen.getByText(mapId)).toBeInTheDocument();
    });

    it("mapIdが空文字列の場合は空として表示", () => {
      const { container } = render(<MapErrorFallback mapId="" />);

      const codeElements = container.querySelectorAll("code");
      const mapIdCode = Array.from(codeElements).find(
        el => el.textContent === ""
      );
      expect(mapIdCode).toBeInTheDocument();
    });
  });

  describe("テキストコンテンツ", () => {
    it("環境変数名が表示される", () => {
      render(<MapErrorFallback />);

      expect(
        screen.getByText("環境変数:", { exact: false })
      ).toBeInTheDocument();
      expect(screen.getByText("VITE_GOOGLE_MAPS_MAP_ID")).toBeInTheDocument();
    });

    it("現在の値ラベルが表示される", () => {
      render(<MapErrorFallback />);

      expect(
        screen.getByText("現在の値:", { exact: false })
      ).toBeInTheDocument();
    });

    it("見出しが赤色で表示される", () => {
      render(<MapErrorFallback />);

      const heading = screen.getByText("地図を読み込めません");
      expect(heading.tagName).toBe("H3");
      expect(heading).toHaveStyle({ color: "#dc3545" });
    });
  });

  describe("複合ケース", () => {
    it("errorとmapIdの両方が指定された場合正しく表示", () => {
      const errorMessage = "接続エラー";
      const mapId = "my-map-123";

      render(<MapErrorFallback error={errorMessage} mapId={mapId} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText(mapId)).toBeInTheDocument();
      expect(
        screen.queryByText("Google Maps API の Map ID を設定してください")
      ).not.toBeInTheDocument();
    });

    it("全ての必須テキストが1つのコンポーネントに含まれる", () => {
      render(<MapErrorFallback mapId="test-id" />);

      // すべてのキー要素が存在
      expect(screen.getByText("🗺️")).toBeInTheDocument();
      expect(screen.getByText("地図を読み込めません")).toBeInTheDocument();
      expect(screen.getByText("VITE_GOOGLE_MAPS_MAP_ID")).toBeInTheDocument();
      expect(screen.getByText("test-id")).toBeInTheDocument();
    });
  });

  describe("displayName", () => {
    it("コンポーネントのdisplayNameがMapErrorFallbackである", () => {
      expect(MapErrorFallback.name).toBe("MapErrorFallback");
    });
  });
});
