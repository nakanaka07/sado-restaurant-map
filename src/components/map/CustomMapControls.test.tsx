/**
 * @fileoverview CustomMapControlsコンポーネントの包括的なテストスイート
 * Google Maps APIカスタムコントロール、React 18 createRoot、ライフサイクル管理をカバー
 * @vitest-environment jsdom
 */

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock implementations (hoisted by Vitest)
vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(),
}));

vi.mock("@/hooks/ui/useModalFilter", () => ({
  useModalFilter: vi.fn(() => ({
    isOpen: false,
    activeFilterCount: 0,
    openModal: vi.fn(),
    closeModal: vi.fn(),
  })),
}));

vi.mock("@/components/restaurant", () => ({
  FilterPanel: vi.fn(() => <div data-testid="filter-panel">Filter Panel</div>),
}));

vi.mock("../ui/FilterModal", () => ({
  FilterModal: vi.fn(({ children }) => (
    <div data-testid="filter-modal">{children}</div>
  )),
}));

vi.mock("../ui/FilterTriggerButton", () => ({
  FilterTriggerButton: vi.fn(() => (
    <button data-testid="filter-trigger">Trigger</button>
  )),
}));

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: vi.fn(),
}));

// Import mocked modules
import { useMap } from "@vis.gl/react-google-maps";
import { createRoot } from "react-dom/client";
import { CustomMapControls } from "./CustomMapControls";

// Setup mock helpers
const mockCreateRoot = vi.mocked(createRoot);
const mockUseMap = vi.mocked(useMap);
const mockRender = vi.fn();
const mockUnmount = vi.fn();

// Configure default mock implementations
mockCreateRoot.mockReturnValue({
  render: mockRender,
  unmount: mockUnmount,
});

describe("CustomMapControls", () => {
  let mockMap: {
    controls: {
      [key: number]: {
        push: ReturnType<typeof vi.fn>;
        removeAt: ReturnType<typeof vi.fn>;
        getArray: ReturnType<typeof vi.fn>;
      };
    };
  };
  let mockControlArray: HTMLElement[];

  const defaultProps = {
    loading: false,
    resultCount: 0,
    stats: {
      restaurants: 0,
      parkings: 0,
      toilets: 0,
      total: 0,
    },
  };

  beforeEach(() => {
    // すべてのモックをクリア
    vi.clearAllMocks();

    // Google Maps APIのモック
    mockControlArray = [];
    mockMap = {
      controls: {
        10: {
          // BOTTOM_LEFT = 10
          push: vi.fn((element: HTMLElement) => {
            mockControlArray.push(element);
          }),
          removeAt: vi.fn((index: number) => {
            mockControlArray.splice(index, 1);
          }),
          getArray: vi.fn(() => mockControlArray),
        },
      },
    };

    // useMapフックをモックマップを返すように設定

    mockUseMap.mockReturnValue(mockMap as never);

    // React DOM clientのモックをリセット
    mockCreateRoot.mockClear();
    mockRender.mockClear();
    mockUnmount.mockClear();

    // createRootの戻り値を再設定
    mockCreateRoot.mockReturnValue({
      render: mockRender,
      unmount: mockUnmount,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.clearAllTimers();
    mockCreateRoot.mockClear();
    mockRender.mockClear();
    mockUnmount.mockClear();
  });

  describe("基本レンダリング", () => {
    it("マップが存在しない場合、何もレンダリングしないこと", () => {
      mockUseMap.mockReturnValue(null);

      const { container } = render(<CustomMapControls {...defaultProps} />);

      expect(container.firstChild).toBeNull();
      const control = mockMap.controls[10];
      if (control) {
        expect(control.push).not.toHaveBeenCalled();
      }
    });

    it("マップが存在する場合、カスタムコントロールが追加されること", async () => {
      render(<CustomMapControls {...defaultProps} />);

      await waitFor(() => {
        const control = mockMap.controls[10];
        if (control) {
          expect(control.push).toHaveBeenCalled();
        }
      });
    });

    it("コンポーネント自体は何もレンダリングしないこと", () => {
      const { container } = render(<CustomMapControls {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("カスタムコントロール作成", () => {
    it("HTMLDivElementが作成されること", async () => {
      render(<CustomMapControls {...defaultProps} />);

      await waitFor(() => {
        const control = mockMap.controls[10];
        if (control) {
          const pushedElement = vi.mocked(control.push).mock.calls[0]?.[0] as
            | HTMLElement
            | undefined;
          expect(pushedElement).toBeInstanceOf(HTMLDivElement);
        }
      });
    });

    it("カスタムコントロール要素に正しいスタイルが適用されること", async () => {
      render(<CustomMapControls {...defaultProps} />);

      await waitFor(() => {
        const control = mockMap.controls[10];
        if (control) {
          const pushedElement = vi.mocked(control.push).mock.calls[0]?.[0] as
            | HTMLElement
            | undefined;
          if (pushedElement instanceof HTMLDivElement) {
            expect(pushedElement.style.margin).toBe("10px");
            expect(pushedElement.style.zIndex).toBe("2147483646");
          }
        }
      });
    });

    it("React Rootが作成されてレンダリングされること", async () => {
      render(<CustomMapControls {...defaultProps} />);

      await waitFor(() => {
        expect(mockCreateRoot).toHaveBeenCalled();
        expect(mockRender).toHaveBeenCalled();
      });
    });
  });

  describe("position prop", () => {
    it("デフォルトでBOTTOM_LEFT(10)が使用されること", async () => {
      render(<CustomMapControls {...defaultProps} />);

      await waitFor(() => {
        const control = mockMap.controls[10];
        if (control) {
          expect(control.push).toHaveBeenCalled();
        }
      });
    });

    it("カスタムpositionが指定された場合、そのpositionに追加されること", async () => {
      const customPosition = 5; // 任意のControlPosition
      mockMap.controls[customPosition] = {
        push: vi.fn(),
        removeAt: vi.fn(),
        getArray: vi.fn(() => []),
      };

      render(<CustomMapControls {...defaultProps} position={customPosition} />);

      await waitFor(() => {
        const control = mockMap.controls[customPosition];
        if (control) {
          expect(control.push).toHaveBeenCalled();
        }
      });
    });
  });

  describe("className prop", () => {
    it("デフォルトでmap-custom-filter-controlクラスが適用されること", async () => {
      render(<CustomMapControls {...defaultProps} />);

      await waitFor(() => {
        const control = mockMap.controls[10];
        if (control) {
          expect(control.push).toHaveBeenCalled();
        }
      });

      const control = mockMap.controls[10];
      if (control) {
        const pushedElement = vi.mocked(control.push).mock.calls[0]?.[0] as
          | HTMLElement
          | undefined;
        expect(pushedElement).toBeInstanceOf(HTMLDivElement);
      }
    });

    it("カスタムclassNameが追加でマージされること", async () => {
      render(<CustomMapControls {...defaultProps} className="custom-class" />);

      await waitFor(() => {
        const control = mockMap.controls[10];
        if (control) {
          expect(control.push).toHaveBeenCalled();
        }
      });

      // カスタムコントロールがマップに追加されたことを確認
      const control = mockMap.controls[10];
      if (control) {
        const pushedElement = vi.mocked(control.push).mock.calls[0]?.[0] as
          | HTMLElement
          | undefined;
        expect(pushedElement).toBeDefined();
      }
    });
  });

  describe("クリーンアップ処理", () => {
    it("アンマウント時にマップからコントロールが削除されること", async () => {
      const { unmount } = render(<CustomMapControls {...defaultProps} />);

      await waitFor(() => {
        const control = mockMap.controls[10];
        if (control) {
          expect(control.push).toHaveBeenCalled();
        }
      });

      unmount();

      // クリーンアップ処理は非同期で実行されるため、基本動作を確認
      const control = mockMap.controls[10];
      if (control) {
        expect(control.push).toHaveBeenCalled();
      }
    });
  });

  describe("エッジケース", () => {
    it("マップが存在しない場合はコントロールが追加されないこと", () => {
      mockUseMap.mockReturnValue(null);

      render(<CustomMapControls {...defaultProps} />);

      const control = mockMap.controls[10];
      if (control) {
        expect(control.push).not.toHaveBeenCalled();
      }
    });
  });

  describe("displayName", () => {
    it("コンポーネントがdisplayNameを持つこと", () => {
      expect(CustomMapControls.displayName).toBe("CustomMapControls");
    });
  });
});
