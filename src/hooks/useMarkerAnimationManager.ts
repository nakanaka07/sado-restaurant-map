/**
 * 🎯 MarkerAnimationManager - マーカーアニメーション管理システム
 *
 * Phase 4 Week 3: アニメーション効果の統合管理
 * CircularMarkerとClusterMarkerのアニメーション制御
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarkerAnimation } from "../components/map/markers/CircularMarker";

/**
 * 型ガード: 有効なMarkerAnimationかどうかをチェック
 */
function isValidMarkerAnimation(value: unknown): value is MarkerAnimation {
  return (
    typeof value === "string" &&
    ["none", "attention", "loading", "subtle"].includes(value)
  );
}

/**
 * 型ガード: 有効なマーカーIDかどうかをチェック
 */
function isValidMarkerId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * アニメーション状態管理
 */
interface AnimationState {
  /** アニメーション中のマーカー一覧 */
  animatingMarkers: Set<string>;
  /** マーカー別アニメーション設定 */
  markerAnimations: Map<string, MarkerAnimation>;
  /** グローバルアニメーション設定 */
  globalAnimation?: MarkerAnimation;
}

/**
 * アニメーション設定
 */
interface AnimationConfig {
  /** デフォルトアニメーション持続時間（ms） */
  readonly defaultDuration: number;
  /** 同時アニメーション最大数 */
  readonly maxConcurrentAnimations: number;
  /** アニメーション優先度設定 */
  readonly priorityLevels: Record<MarkerAnimation, number>;
}

/**
 * アニメーションイベント
 */
interface AnimationEvent {
  markerId: string;
  animation: MarkerAnimation;
  timestamp: number;
  trigger: "user-interaction" | "system" | "focus" | "data-update";
}

/**
 * マーカーアニメーション管理Hook
 */
export const useMarkerAnimationManager = (
  config?: Partial<AnimationConfig>
) => {
  // 設定のデフォルト値
  const finalConfig: AnimationConfig = {
    defaultDuration: 2000,
    maxConcurrentAnimations: 10,
    priorityLevels: {
      attention: 3, // 最高優先度
      loading: 2,
      subtle: 1,
      none: 0,
    },
    ...config,
  };

  // アニメーション状態管理
  const [animationState, setAnimationState] = useState<AnimationState>({
    animatingMarkers: new Set(),
    markerAnimations: new Map(),
  });

  // タイマー管理
  const animationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * 特定マーカーのアニメーション開始
   */
  const startMarkerAnimation = useCallback(
    (
      markerId: string,
      animation: MarkerAnimation,
      duration?: number,
      trigger: AnimationEvent["trigger"] = "system"
    ) => {
      // 入力バリデーション
      if (!isValidMarkerId(markerId)) {
        console.warn(
          "Invalid markerId provided to startMarkerAnimation:",
          markerId
        );
        return;
      }

      if (!isValidMarkerAnimation(animation)) {
        console.warn(
          "Invalid animation provided to startMarkerAnimation:",
          animation
        );
        return;
      }

      if (animation === "none") {
        stopMarkerAnimation(markerId);
        return;
      }

      const finalDuration =
        duration && duration > 0 ? duration : finalConfig.defaultDuration;

      try {
        // 既存のタイマーをクリア
        const existingTimer = animationTimers.current.get(markerId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // アニメーション状態を更新
        setAnimationState(prev => {
          const newAnimatingMarkers = new Set(prev.animatingMarkers);
          const newMarkerAnimations = new Map(prev.markerAnimations);

          // 同時アニメーション数制限チェック
          if (
            !newAnimatingMarkers.has(markerId) &&
            newAnimatingMarkers.size >= finalConfig.maxConcurrentAnimations
          ) {
            // 優先度の低いアニメーションを停止
            const currentAnimations = Array.from(newMarkerAnimations.entries());
            if (currentAnimations.length > 0) {
              const lowestPriority = currentAnimations.reduce(
                (lowest, [id, anim]) => {
                  const priority = finalConfig.priorityLevels[anim] ?? 0;
                  const lowestPriority =
                    finalConfig.priorityLevels[lowest[1]] ?? 0;
                  return priority < lowestPriority ? [id, anim] : lowest;
                },
                currentAnimations[0] // 初期値として最初の要素を設定
              );

              const animationPriority =
                finalConfig.priorityLevels[animation] ?? 0;
              const lowestPriorityValue =
                finalConfig.priorityLevels[lowestPriority[1]] ?? 0;

              if (animationPriority > lowestPriorityValue) {
                newAnimatingMarkers.delete(lowestPriority[0]);
                newMarkerAnimations.delete(lowestPriority[0]);
                const timer = animationTimers.current.get(lowestPriority[0]);
                if (timer) {
                  clearTimeout(timer);
                  animationTimers.current.delete(lowestPriority[0]);
                }
              }
            }
          }

          newAnimatingMarkers.add(markerId);
          newMarkerAnimations.set(markerId, animation);

          return {
            ...prev,
            animatingMarkers: newAnimatingMarkers,
            markerAnimations: newMarkerAnimations,
          };
        });

        // アニメーション終了タイマー設定
        const timer = setTimeout(() => {
          stopMarkerAnimation(markerId);
        }, finalDuration);

        animationTimers.current.set(markerId, timer);

        // イベントログ（開発環境）
        if (process.env.NODE_ENV === "development") {
          console.log(`🎬 Animation started:`, {
            markerId,
            animation,
            duration: finalDuration,
            trigger,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error("Error starting marker animation:", error);
      }
    },
    [finalConfig]
  );

  /**
   * 特定マーカーのアニメーション停止
   */
  const stopMarkerAnimation = useCallback((markerId: string) => {
    // 入力バリデーション
    if (!isValidMarkerId(markerId)) {
      console.warn(
        "Invalid markerId provided to stopMarkerAnimation:",
        markerId
      );
      return;
    }

    try {
      // タイマークリア
      const timer = animationTimers.current.get(markerId);
      if (timer) {
        clearTimeout(timer);
        animationTimers.current.delete(markerId);
      }

      // 状態更新
      setAnimationState(prev => {
        const newAnimatingMarkers = new Set(prev.animatingMarkers);
        const newMarkerAnimations = new Map(prev.markerAnimations);

        newAnimatingMarkers.delete(markerId);
        newMarkerAnimations.delete(markerId);

        return {
          ...prev,
          animatingMarkers: newAnimatingMarkers,
          markerAnimations: newMarkerAnimations,
        };
      });

      if (process.env.NODE_ENV === "development") {
        console.log(`⏹️ Animation stopped:`, {
          markerId,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error("Error stopping marker animation:", error);
    }
  }, []);

  /**
   * 全マーカーのアニメーション停止
   */
  const stopAllAnimations = useCallback(() => {
    try {
      // 全タイマークリア
      animationTimers.current.forEach(timer => {
        if (timer) {
          clearTimeout(timer);
        }
      });
      animationTimers.current.clear();

      // 状態リセット
      setAnimationState({
        animatingMarkers: new Set(),
        markerAnimations: new Map(),
      });

      if (process.env.NODE_ENV === "development") {
        console.log(`🛑 All animations stopped:`, { timestamp: Date.now() });
      }
    } catch (error) {
      console.error("Error stopping all animations:", error);
    }
  }, []);

  /**
   * グローバルアニメーション設定
   */
  const setGlobalAnimation = useCallback(
    (animation: MarkerAnimation, duration?: number) => {
      try {
        setAnimationState(prev => ({
          ...prev,
          globalAnimation: animation,
        }));

        if (animation !== "none" && duration && duration > 0) {
          setTimeout(() => {
            setAnimationState(prev => ({
              ...prev,
              globalAnimation: "none",
            }));
          }, duration);
        }
      } catch (error) {
        console.error("Error setting global animation:", error);
      }
    },
    []
  );

  /**
   * マーカーの現在のアニメーション取得
   */
  const getMarkerAnimation = useCallback(
    (markerId: string): MarkerAnimation => {
      return (
        animationState.markerAnimations.get(markerId) ||
        animationState.globalAnimation ||
        "none"
      );
    },
    [animationState]
  );

  /**
   * インタラクション型アニメーション（ホバー・クリック等）
   */
  const triggerInteractionAnimation = useCallback(
    (markerId: string, interactionType: "hover" | "click" | "focus") => {
      if (!isValidMarkerId(markerId)) {
        console.warn(
          "Invalid markerId provided to triggerInteractionAnimation:",
          markerId
        );
        return;
      }

      const animationMap: Record<typeof interactionType, MarkerAnimation> = {
        hover: "subtle",
        click: "attention",
        focus: "attention",
      } as const;

      const animation = animationMap[interactionType];
      const duration = interactionType === "hover" ? 500 : 1500;

      startMarkerAnimation(markerId, animation, duration, "user-interaction");
    },
    [startMarkerAnimation]
  );

  /**
   * データ更新時のアニメーション
   */
  const triggerDataUpdateAnimation = useCallback(
    (markerIds: string[]) => {
      if (!Array.isArray(markerIds)) {
        console.warn(
          "Invalid markerIds array provided to triggerDataUpdateAnimation:",
          markerIds
        );
        return;
      }

      markerIds.filter(isValidMarkerId).forEach(markerId => {
        startMarkerAnimation(markerId, "loading", 1000, "data-update");
      });
    },
    [startMarkerAnimation]
  );

  /**
   * 検索結果ハイライトアニメーション
   */
  const highlightSearchResults = useCallback(
    (markerIds: string[]) => {
      if (!Array.isArray(markerIds)) {
        console.warn(
          "Invalid markerIds array provided to highlightSearchResults:",
          markerIds
        );
        return;
      }

      markerIds.filter(isValidMarkerId).forEach((markerId, index) => {
        // 順次アニメーション（視覚的効果向上）
        const delay = index * 200;
        if (delay >= 0) {
          setTimeout(() => {
            startMarkerAnimation(markerId, "attention", 2000, "system");
          }, delay);
        }
      });
    },
    [startMarkerAnimation]
  );

  /**
   * 統計情報取得
   */
  const getAnimationStats = useCallback(() => {
    const animationTypes: Record<MarkerAnimation, number> = {
      none: 0,
      attention: 0,
      loading: 0,
      subtle: 0,
    };

    const stats = {
      activeAnimations: animationState.animatingMarkers.size,
      maxConcurrent: finalConfig.maxConcurrentAnimations,
      animationTypes,
      globalAnimation: animationState.globalAnimation,
    };

    // アニメーション種別統計（型安全）
    animationState.markerAnimations.forEach(animation => {
      stats.animationTypes[animation] =
        (stats.animationTypes[animation] || 0) + 1;
    });

    return stats;
  }, [animationState, finalConfig]);

  return {
    // アニメーション制御
    startMarkerAnimation,
    stopMarkerAnimation,
    stopAllAnimations,
    setGlobalAnimation,

    // アニメーション状態
    getMarkerAnimation,
    animationState,

    // インタラクション対応
    triggerInteractionAnimation,
    triggerDataUpdateAnimation,
    highlightSearchResults,

    // 統計・デバッグ
    getAnimationStats,

    // 設定
    config: finalConfig,
  };
};

/**
 * 軽量アニメーション Hook（シンプル用途）
 */
export const useSimpleMarkerAnimation = () => {
  const [currentAnimation, setCurrentAnimation] =
    useState<MarkerAnimation>("none");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const animate = useCallback(
    (animation: MarkerAnimation, duration: number = 2000) => {
      // 入力バリデーション
      if (!isValidMarkerAnimation(animation)) {
        console.warn("Invalid animation provided to animate:", animation);
        return;
      }

      if (duration <= 0) {
        console.warn("Invalid duration provided to animate:", duration);
        return;
      }

      try {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        setCurrentAnimation(animation);

        if (animation !== "none") {
          timerRef.current = setTimeout(() => {
            setCurrentAnimation("none");
            timerRef.current = null;
          }, duration);
        }
      } catch (error) {
        console.error("Error in animate:", error);
      }
    },
    []
  );

  const stop = useCallback(() => {
    try {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setCurrentAnimation("none");
    } catch (error) {
      console.error("Error in stop:", error);
    }
  }, []);

  // クリーンアップ関数
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    currentAnimation,
    animate,
    stop,
  };
};

export default useMarkerAnimationManager;
