/* @vitest-environment jsdom */
import { FilterDisplayMode } from "@/types";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterModal } from "../FilterModal";

// テスト後のクリーンアップ
afterEach(() => {
  cleanup();
  // body overflow をリセット
  document.body.style.overflow = "";
});

describe("FilterModal", () => {
  const mockOnClose = vi.fn();
  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnFiltersChange.mockClear();
  });

  describe("基本レンダリング", () => {
    it("開いている状態で正しくレンダリングできる", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div data-testid="modal-content">Test Content</div>
        </FilterModal>
      );

      expect(screen.getByTestId("filter-modal-overlay")).toBeInTheDocument();
      expect(screen.getByTestId("modal-content")).toBeInTheDocument();
    });

    it("閉じている状態では何もレンダリングしない", () => {
      render(
        <FilterModal
          isOpen={false}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div data-testid="modal-content">Test Content</div>
        </FilterModal>
      );

      expect(
        screen.queryByTestId("filter-modal-overlay")
      ).not.toBeInTheDocument();
    });

    it("タイトルと説明文を表示する", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      expect(screen.getByText("🍣 佐渡グルメ検索")).toBeInTheDocument();
      expect(
        screen.getByText(
          /検索条件を設定して、表示する飲食店やスポットを絞り込む/
        )
      ).toBeInTheDocument();
    });
  });

  describe("表示モード", () => {
    it("デフォルトでCOMPACTモードを使用", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const overlay = screen.getByTestId("filter-modal-overlay");
      expect(overlay).toHaveAttribute(
        "data-display-mode",
        FilterDisplayMode.COMPACT
      );
    });

    it("FULLモードを指定できる", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
          displayMode={FilterDisplayMode.FULL}
        >
          <div>Content</div>
        </FilterModal>
      );

      const overlay = screen.getByTestId("filter-modal-overlay");
      expect(overlay).toHaveAttribute(
        "data-display-mode",
        FilterDisplayMode.FULL
      );
    });

    it("カスタムクラス名を適用できる", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
          className="custom-class"
        >
          <div>Content</div>
        </FilterModal>
      );

      const overlay = screen.getByTestId("filter-modal-overlay");
      expect(overlay).toHaveClass("custom-class");
    });
  });

  describe("閉じる機能", () => {
    it("閉じるボタンでモーダルを閉じられる", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const closeButton = screen.getByTestId("filter-modal-close");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("背景クリックでモーダルを閉じられる", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const backdrop = screen.getByTestId("filter-modal-backdrop");
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    // NOTE: ESCキーテストはE2Eに移行済み
    // E2Eテスト: e2e/filter-modal.spec.ts - "ESCキーでモーダルを閉じられる"

    it("背景でEnterキーを押すと閉じられる", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const backdrop = screen.getByTestId("filter-modal-backdrop");
      fireEvent.keyDown(backdrop, { key: "Enter" });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("背景でSpaceキーを押すと閉じられる", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const backdrop = screen.getByTestId("filter-modal-backdrop");
      fireEvent.keyDown(backdrop, { key: " " });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // NOTE: スクロール管理テストはE2Eに移行済み
  // E2Eテスト: e2e/filter-modal.spec.ts
  // - "モーダルが開いている時はbodyのスクロールが無効化される"
  // - "モーダルが閉じたらbodyのスクロールが復元される"

  describe("アクセシビリティ", () => {
    it("適切なaria属性が設定されている", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const overlay = screen.getByTestId("filter-modal-overlay");
      expect(overlay).toHaveAttribute("aria-labelledby", "filter-modal-title");
      expect(overlay).toHaveAttribute(
        "aria-describedby",
        "filter-modal-description"
      );
    });

    it("閉じるボタンに適切なaria-labelが設定されている", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const closeButton = screen.getByTestId("filter-modal-close");
      expect(closeButton).toHaveAttribute("aria-label", "フィルターを閉じる");
    });

    it("背景ボタンに適切なaria-labelが設定されている", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const backdrop = screen.getByTestId("filter-modal-backdrop");
      expect(backdrop).toHaveAttribute("aria-label", "モーダルを閉じる");
    });

    it("メインコンテンツにaria-live属性が設定されている", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const content = screen.getByTestId("filter-modal-content");
      expect(content).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("タッチジェスチャー", () => {
    // NOTE: 下方向スワイプテストはE2Eに移行済み
    // E2Eテスト: e2e/filter-modal.spec.ts - "下方向スワイプでモーダルを閉じられる"

    it("上方向スワイプではモーダルを閉じない", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const content = screen.getByTestId("filter-modal-content");

      // タッチ開始（Y座標200）
      fireEvent.touchStart(content, {
        touches: [{ clientX: 0, clientY: 200, identifier: 0, target: content }],
      });

      // タッチ終了（Y座標100、上に100px移動）
      fireEvent.touchEnd(content, {
        changedTouches: [
          { clientX: 0, clientY: 100, identifier: 0, target: content },
        ],
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("小さな下方向スワイプではモーダルを閉じない", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const content = screen.getByTestId("filter-modal-content");

      // タッチ開始（Y座標100）
      fireEvent.touchStart(content, {
        touches: [{ clientX: 0, clientY: 100, identifier: 0, target: content }],
      });

      // タッチ終了（Y座標150、下に50px移動）
      fireEvent.touchEnd(content, {
        changedTouches: [
          { clientX: 0, clientY: 150, identifier: 0, target: content },
        ],
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("フォーカス管理", () => {
    it("モーダル内にフォーカス可能な要素が存在する", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <button data-testid="first-button">First Button</button>
          <button data-testid="second-button">Second Button</button>
        </FilterModal>
      );

      const firstButton = screen.getByTestId("first-button");
      const secondButton = screen.getByTestId("second-button");

      expect(firstButton).toBeInTheDocument();
      expect(secondButton).toBeInTheDocument();
    });

    it("閉じるボタンがフォーカス可能", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const closeButton = screen.getByTestId("filter-modal-close");
      closeButton.focus();

      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe("エラーハンドリング", () => {
    it("onCloseが関数でない場合は何もレンダリングしない", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <FilterModal
          isOpen={true}
          onClose={null as unknown as () => void}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      expect(
        screen.queryByTestId("filter-modal-overlay")
      ).not.toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "onClose prop must be a function"
      );

      consoleErrorSpy.mockRestore();
    });

    it("無効なdisplayModeの場合は警告を出す", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
          displayMode={"invalid-mode" as never}
        >
          <div>Content</div>
        </FilterModal>
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Invalid displayMode provided:",
        "invalid-mode"
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Portal レンダリング", () => {
    it("bodyにPortalが作成される", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div>Content</div>
        </FilterModal>
      );

      const overlay = screen.getByTestId("filter-modal-overlay");
      expect(overlay.parentElement).toBe(document.body);
    });
  });

  describe("子コンポーネント", () => {
    it("複数の子要素を正しくレンダリングできる", () => {
      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </FilterModal>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
      expect(screen.getByTestId("child-3")).toBeInTheDocument();
    });

    it("インタラクティブな子要素を正しく処理できる", () => {
      const handleClick = vi.fn();

      render(
        <FilterModal
          isOpen={true}
          onClose={mockOnClose}
          onFiltersChange={mockOnFiltersChange}
        >
          <button data-testid="child-button" onClick={handleClick}>
            Click Me
          </button>
        </FilterModal>
      );

      const button = screen.getByTestId("child-button");
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
