/**
 * @fileoverview Modal Filter Hook
 * React 19 useActionState とスタイル最適化を活用したモーダルフィルター管理Hook
 * TypeScript 5.7 enum安全性パターン対応
 */

import type {
  ExtendedMapFilters,
  FilterAction,
  FilterDisplayMode,
  ModalFilterState,
  UseModalFilterResult,
} from "@/types";
import {
  FilterActionType,
  INITIAL_MODAL_FILTER_STATE,
  ModalState,
  countActiveFilters,
  isValidFilterAction,
  isValidFilterState,
} from "@/types";
import {
  startTransition,
  useActionState,
  useCallback,
  useMemo,
  useOptimistic,
} from "react";

/**
 * モーダルフィルター状態を管理するReducer
 */
function modalFilterReducer(
  state: ModalFilterState,
  action: FilterAction
): ModalFilterState {
  // 型安全性の確認
  if (!isValidFilterAction(action)) {
    console.warn("Invalid filter action:", action);
    return state;
  }

  switch (action.type) {
    case FilterActionType.TOGGLE_MODAL:
      return {
        ...state,
        isOpen: !state.isOpen,
        modalState: !state.isOpen ? ModalState.OPENING : ModalState.CLOSING,
        isAnimating: true,
        lastUpdated: new Date(),
      };

    case FilterActionType.OPEN_MODAL:
      if (state.isOpen) return state; // 既に開いている場合は何もしない

      return {
        ...state,
        isOpen: true,
        modalState: ModalState.OPENING,
        isAnimating: true,
        lastUpdated: new Date(),
      };

    case FilterActionType.CLOSE_MODAL:
      if (!state.isOpen) return state; // 既に閉じている場合は何もしない

      return {
        ...state,
        isOpen: false,
        modalState: ModalState.CLOSING,
        isAnimating: true,
        lastUpdated: new Date(),
      };

    case FilterActionType.UPDATE_FILTERS: {
      const updatedFilters = {
        ...state.filters,
        ...action.payload,
      };

      return {
        ...state,
        filters: updatedFilters,
        activeFilterCount: countActiveFilters(updatedFilters),
        lastUpdated: new Date(),
      };
    }

    case FilterActionType.RESET_FILTERS:
      return {
        ...state,
        filters: INITIAL_MODAL_FILTER_STATE.filters,
        activeFilterCount: 0,
        lastUpdated: new Date(),
      };

    case FilterActionType.SET_DISPLAY_MODE:
      return {
        ...state,
        displayMode: action.payload,
        lastUpdated: new Date(),
      };

    case FilterActionType.INCREMENT_ACTIVE_COUNT:
      return {
        ...state,
        activeFilterCount: Math.max(0, state.activeFilterCount + 1),
        lastUpdated: new Date(),
      };

    case FilterActionType.DECREMENT_ACTIVE_COUNT:
      return {
        ...state,
        activeFilterCount: Math.max(0, state.activeFilterCount - 1),
        lastUpdated: new Date(),
      };

    default: {
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = action;
      console.warn("Unhandled action type:", _exhaustiveCheck);
      return state;
    }
  }
}

/**
 * モーダルフィルターを管理するカスタムHook
 * React 19 useActionState + useOptimistic を活用した最新パターン
 */
export function useModalFilter(
  initialFilters?: Partial<ExtendedMapFilters>
): UseModalFilterResult {
  // 初期状態の設定
  const initialState = useMemo((): ModalFilterState => {
    if (!initialFilters) return INITIAL_MODAL_FILTER_STATE;

    const mergedFilters = {
      ...INITIAL_MODAL_FILTER_STATE.filters,
      ...initialFilters,
    };

    return {
      ...INITIAL_MODAL_FILTER_STATE,
      filters: mergedFilters,
      activeFilterCount: countActiveFilters(mergedFilters),
    };
  }, [initialFilters]);

  // React 19 useActionState による状態管理
  const [state, dispatch] = useActionState(modalFilterReducer, initialState);

  // useOptimistic による楽観的更新
  const [optimisticState, addOptimisticUpdate] = useOptimistic(
    state,
    (
      currentState: ModalFilterState,
      optimisticFilters: Partial<ExtendedMapFilters>
    ) => ({
      ...currentState,
      filters: { ...currentState.filters, ...optimisticFilters },
      activeFilterCount: countActiveFilters({
        ...currentState.filters,
        ...optimisticFilters,
      }),
      lastUpdated: new Date(),
    })
  );

  // アクション関数の定義
  const toggleModal = useCallback(() => {
    startTransition(() => {
      dispatch({ type: FilterActionType.TOGGLE_MODAL });
    });
  }, [dispatch]);

  const openModal = useCallback(() => {
    startTransition(() => {
      dispatch({ type: FilterActionType.OPEN_MODAL });
    });
  }, [dispatch]);

  const closeModal = useCallback(() => {
    startTransition(() => {
      dispatch({ type: FilterActionType.CLOSE_MODAL });
    });
  }, [dispatch]);

  const updateFilters = useCallback(
    (filters: Partial<ExtendedMapFilters>) => {
      // 楽観的更新を適用
      addOptimisticUpdate(filters);

      // 実際の状態更新
      startTransition(() => {
        dispatch({
          type: FilterActionType.UPDATE_FILTERS,
          payload: filters,
        });
      });
    },
    [dispatch, addOptimisticUpdate]
  );

  const resetFilters = useCallback(() => {
    startTransition(() => {
      dispatch({ type: FilterActionType.RESET_FILTERS });
    });
  }, [dispatch]);

  const setDisplayMode = useCallback(
    (mode: FilterDisplayMode) => {
      startTransition(() => {
        dispatch({
          type: FilterActionType.SET_DISPLAY_MODE,
          payload: mode,
        });
      });
    },
    [dispatch]
  );

  // パフォーマンス最適化された戻り値
  const result = useMemo(
    (): UseModalFilterResult => ({
      // State (楽観的更新を考慮)
      state: optimisticState,
      isOpen: optimisticState.isOpen,
      modalState: optimisticState.modalState,
      displayMode: optimisticState.displayMode,
      activeFilterCount: optimisticState.activeFilterCount,
      filters: optimisticState.filters,

      // Actions
      toggleModal,
      openModal,
      closeModal,
      updateFilters,
      resetFilters,
      setDisplayMode,
    }),
    [
      optimisticState,
      toggleModal,
      openModal,
      closeModal,
      updateFilters,
      resetFilters,
      setDisplayMode,
    ]
  );

  return result;
}

/**
 * デバッグ用のHook - 開発環境でのみ有効
 */
export function useModalFilterDebug(state: ModalFilterState) {
  // パフォーマンス監視（開発環境のみ）- React Hook規則に従い条件分岐前に配置
  const stateChangeCount = useMemo(() => {
    let count = 0;
    return () => ++count;
  }, []);

  // 開発環境チェック
  const isDevMode = process.env.NODE_ENV === "development";

  // 状態の検証
  if (isDevMode && !isValidFilterState(state)) {
    console.error("Invalid modal filter state detected:", state);
  }

  // 開発環境でのパフォーマンスログ
  if (isDevMode) {
    console.log(`Modal Filter State Change #${stateChangeCount()}:`, {
      isOpen: state.isOpen,
      modalState: state.modalState,
      activeFilterCount: state.activeFilterCount,
      lastUpdated: state.lastUpdated.toISOString(),
    });
  }
}
