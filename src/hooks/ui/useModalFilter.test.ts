/**
 * @fileoverview useModalFilter Hook Tests
 * React 19 useActionState/useOptimistic を使用したモーダルフィルターHookのテスト
 * @vitest-environment jsdom
 */

import type { CuisineType } from "@/types";
import {
  FilterDisplayMode,
  INITIAL_MODAL_FILTER_STATE,
  ModalState,
} from "@/types";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useModalFilter } from "./useModalFilter";

describe("useModalFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("初期化", () => {
    it("デフォルト初期値で初期化されること", () => {
      const { result } = renderHook(() => useModalFilter());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.modalState).toBe(ModalState.CLOSED);
      expect(result.current.displayMode).toBe(FilterDisplayMode.COMPACT);
      expect(result.current.activeFilterCount).toBe(0);
      expect(result.current.filters).toEqual(
        INITIAL_MODAL_FILTER_STATE.filters
      );
    });

    it("カスタム初期フィルターで初期化されること", () => {
      const initialFilters = {
        cuisineTypes: ["日本料理", "イタリアン"] as CuisineType[],
        minRating: 4.0,
      };

      const { result } = renderHook(() => useModalFilter(initialFilters));

      expect(result.current.filters.cuisineTypes).toEqual([
        "日本料理",
        "イタリアン",
      ]);
      expect(result.current.filters.minRating).toBe(4.0);
      expect(result.current.activeFilterCount).toBeGreaterThan(0);
    });

    it("部分的な初期フィルターがマージされること", () => {
      const initialFilters = {
        cuisineTypes: ["カフェ・喫茶店"] as CuisineType[],
      };

      const { result } = renderHook(() => useModalFilter(initialFilters));

      expect(result.current.filters.cuisineTypes).toEqual(["カフェ・喫茶店"]);
      expect(result.current.filters.minRating).toBe(
        INITIAL_MODAL_FILTER_STATE.filters.minRating
      );
    });
  });

  describe("モーダル開閉", () => {
    it("openModal() でモーダルが開くこと", async () => {
      const { result } = renderHook(() => useModalFilter());

      act(() => {
        result.current.openModal();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      expect(result.current.modalState).toBe(ModalState.OPENING);
    });

    it("closeModal() でモーダルが閉じること", async () => {
      const { result } = renderHook(() => useModalFilter());

      // まず開く
      act(() => {
        result.current.openModal();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      // 次に閉じる
      act(() => {
        result.current.closeModal();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(false);
      });

      expect(result.current.modalState).toBe(ModalState.CLOSING);
    });

    it("toggleModal() で開閉が切り替わること", async () => {
      const { result } = renderHook(() => useModalFilter());

      // 閉 → 開
      act(() => {
        result.current.toggleModal();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      // 開 → 閉
      act(() => {
        result.current.toggleModal();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(false);
      });
    });

    it("既に開いている時にopenModal()を呼んでも変化しないこと", async () => {
      const { result } = renderHook(() => useModalFilter());

      act(() => {
        result.current.openModal();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      const stateBefore = result.current.state;

      act(() => {
        result.current.openModal();
      });

      // 状態が変わらないことを確認
      expect(result.current.state).toBe(stateBefore);
    });

    it("既に閉じている時にcloseModal()を呼んでも変化しないこと", () => {
      const { result } = renderHook(() => useModalFilter());

      expect(result.current.isOpen).toBe(false);

      const stateBefore = result.current.state;

      act(() => {
        result.current.closeModal();
      });

      // 状態が変わらないことを確認
      expect(result.current.state).toBe(stateBefore);
    });
  });

  describe("フィルター更新", () => {
    it("updateFilters() でフィルターが更新されること", async () => {
      const { result } = renderHook(() => useModalFilter());

      act(() => {
        result.current.updateFilters({
          cuisineTypes: ["フレンチ"] as CuisineType[],
          minRating: 4.5,
        });
      });

      await waitFor(() => {
        expect(result.current.filters.cuisineTypes).toEqual(["フレンチ"]);
        expect(result.current.filters.minRating).toBe(4.5);
      });
    });

    it("updateFilters() でactiveFilterCountが更新されること", async () => {
      const { result } = renderHook(() => useModalFilter());

      expect(result.current.activeFilterCount).toBe(0);

      act(() => {
        result.current.updateFilters({
          cuisineTypes: ["日本料理", "イタリアン"] as CuisineType[],
        });
      });

      await waitFor(() => {
        expect(result.current.activeFilterCount).toBeGreaterThan(0);
      });
    });

    it("部分的なフィルター更新が正しくマージされること", async () => {
      const { result } = renderHook(() => useModalFilter());

      act(() => {
        result.current.updateFilters({
          cuisineTypes: ["日本料理"] as CuisineType[],
        });
      });

      await waitFor(() => {
        expect(result.current.filters.cuisineTypes).toEqual(["日本料理"]);
      });

      act(() => {
        result.current.updateFilters({
          minRating: 3.5,
        });
      });

      await waitFor(() => {
        expect(result.current.filters.cuisineTypes).toEqual(["日本料理"]);
        expect(result.current.filters.minRating).toBe(3.5);
      });
    });

    it("複数回のupdateFilters()が順次適用されること", async () => {
      const { result } = renderHook(() => useModalFilter());

      act(() => {
        result.current.updateFilters({
          cuisineTypes: ["イタリアン"] as CuisineType[],
        });
        result.current.updateFilters({ minRating: 4.0 });
        result.current.updateFilters({ openNow: true });
      });

      await waitFor(() => {
        expect(result.current.filters.cuisineTypes).toEqual(["イタリアン"]);
        expect(result.current.filters.minRating).toBe(4.0);
        expect(result.current.filters.openNow).toBe(true);
      });
    });
  });

  describe("フィルターリセット", () => {
    it("resetFilters() で初期状態に戻ること", async () => {
      const { result } = renderHook(() => useModalFilter());

      // フィルターを変更
      act(() => {
        result.current.updateFilters({
          cuisineTypes: ["日本料理"] as CuisineType[],
          minRating: 4.5,
        });
      });

      await waitFor(() => {
        expect(result.current.filters.cuisineTypes).toEqual(["日本料理"]);
      });

      // リセット
      act(() => {
        result.current.resetFilters();
      });

      await waitFor(() => {
        expect(result.current.filters).toEqual(
          INITIAL_MODAL_FILTER_STATE.filters
        );
        expect(result.current.activeFilterCount).toBe(0);
      });
    });

    it("resetFilters()後も他の状態は保持されること", async () => {
      const { result } = renderHook(() => useModalFilter());

      // モーダルを開く
      act(() => {
        result.current.openModal();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      // フィルターをリセット
      act(() => {
        result.current.resetFilters();
      });

      await waitFor(() => {
        expect(result.current.activeFilterCount).toBe(0);
      });

      // モーダルは開いたまま
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe("displayMode", () => {
    it("setDisplayMode() でdisplayModeが変更されること", async () => {
      const { result } = renderHook(() => useModalFilter());

      expect(result.current.displayMode).toBe(FilterDisplayMode.COMPACT);

      act(() => {
        result.current.setDisplayMode(FilterDisplayMode.FULL);
      });

      await waitFor(() => {
        expect(result.current.displayMode).toBe(FilterDisplayMode.FULL);
      });
    });

    it("MINIMALモードに切り替えられること", async () => {
      const { result } = renderHook(() => useModalFilter());

      act(() => {
        result.current.setDisplayMode(FilterDisplayMode.MINIMAL);
      });

      await waitFor(() => {
        expect(result.current.displayMode).toBe(FilterDisplayMode.MINIMAL);
      });
    });
  });

  describe("メモ化とパフォーマンス", () => {
    it("複数回レンダリングしてもアクション関数が同一参照であること", () => {
      const { result, rerender } = renderHook(() => useModalFilter());

      const firstOpenModal = result.current.openModal;
      const firstCloseModal = result.current.closeModal;
      const firstToggleModal = result.current.toggleModal;

      rerender();

      expect(result.current.openModal).toBe(firstOpenModal);
      expect(result.current.closeModal).toBe(firstCloseModal);
      expect(result.current.toggleModal).toBe(firstToggleModal);
    });

    it("状態更新後も不要なアクション関数の再生成が起きないこと", async () => {
      const { result } = renderHook(() => useModalFilter());

      const openModalBefore = result.current.openModal;

      act(() => {
        result.current.updateFilters({
          cuisineTypes: ["日本料理"] as CuisineType[],
        });
      });

      await waitFor(() => {
        expect(result.current.filters.cuisineTypes).toEqual(["日本料理"]);
      });

      expect(result.current.openModal).toBe(openModalBefore);
    });
  });

  describe("エッジケース", () => {
    it("空のフィルター更新が適用されること", async () => {
      const { result } = renderHook(() => useModalFilter());

      const stateBefore = result.current.filters;

      act(() => {
        result.current.updateFilters({});
      });

      await waitFor(() => {
        expect(result.current.filters).toEqual(stateBefore);
      });
    });

    it("lastUpdatedが更新されること", async () => {
      const { result } = renderHook(() => useModalFilter());

      const lastUpdatedBefore = result.current.state.lastUpdated;

      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 10));

      act(() => {
        result.current.openModal();
      });

      await waitFor(() => {
        expect(result.current.state.lastUpdated.getTime()).toBeGreaterThan(
          lastUpdatedBefore.getTime()
        );
      });
    });

    it("undefinedの初期フィルターでエラーが発生しないこと", () => {
      expect(() => {
        renderHook(() => useModalFilter(undefined));
      }).not.toThrow();
    });

    it("null値を含むフィルター更新が正常に動作すること", async () => {
      const { result } = renderHook(() => useModalFilter());

      act(() => {
        result.current.updateFilters({
          cuisineTypes: [] as CuisineType[],
        });
      });

      await waitFor(() => {
        expect(result.current.filters.cuisineTypes).toEqual([]);
      });
    });
  });

  describe("統合シナリオ", () => {
    it("モーダル開閉とフィルター更新が連携すること", async () => {
      const { result } = renderHook(() => useModalFilter());

      // モーダルを開く
      act(() => {
        result.current.openModal();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      // フィルターを変更
      act(() => {
        result.current.updateFilters({
          cuisineTypes: ["日本料理"] as CuisineType[],
        });
      });

      await waitFor(() => {
        expect(result.current.filters.cuisineTypes).toEqual(["日本料理"]);
      });

      // モーダルを閉じる
      act(() => {
        result.current.closeModal();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(false);
      });

      // フィルターは保持されている
      expect(result.current.filters.cuisineTypes).toEqual(["日本料理"]);
    });

    it("displayMode変更とモーダル状態が独立していること", async () => {
      const { result } = renderHook(() => useModalFilter());

      act(() => {
        result.current.setDisplayMode(FilterDisplayMode.FULL);
      });

      await waitFor(() => {
        expect(result.current.displayMode).toBe(FilterDisplayMode.FULL);
      });

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.openModal();
      });

      await waitFor(() => {
        expect(result.current.isOpen).toBe(true);
      });

      expect(result.current.displayMode).toBe(FilterDisplayMode.FULL);
    });
  });
});
