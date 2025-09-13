/**
 * @fileoverview 地図コンポーネント用デバッグHook
 * 開発者体験の向上とトラブルシューティング支援
 */

import type { Restaurant } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * デバッグ統計情報
 */
interface DebugStats {
  readonly totalRestaurants: number;
  readonly validRestaurants: number;
  readonly displayedRestaurants: number;
  readonly renderTime: number;
  readonly memoryUsage?: number;
  readonly lastUpdate: Date;
}

/**
 * デバッグイベントの種類
 */
type DebugEventType =
  | "marker_click"
  | "map_load"
  | "data_filter"
  | "performance_measure"
  | "error_caught"
  | "memory_check";

/**
 * デバッグイベント
 */
interface DebugEvent {
  readonly type: DebugEventType;
  readonly timestamp: Date;
  readonly data?: Record<string, unknown>;
  readonly duration?: number;
}

/**
 * マップデバッグング設定
 */
interface MapDebugConfig {
  readonly enabled: boolean;
  readonly logLevel: "verbose" | "normal" | "minimal";
  readonly trackPerformance: boolean;
  readonly trackMemory: boolean;
  readonly maxEventHistory: number;
}

/**
 * パフォーマンス測定結果
 */
interface PerformanceMeasurement {
  readonly operation: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly additionalData?: Record<string, unknown>;
}

/**
 * マップデバッグフック
 */
export const useMapDebugging = (
  restaurants: readonly Restaurant[],
  config: Partial<MapDebugConfig> = {}
) => {
  const defaultConfig: MapDebugConfig = {
    enabled: process.env.NODE_ENV === "development",
    logLevel: "normal",
    trackPerformance: true,
    trackMemory: false,
    maxEventHistory: 100,
  };

  const finalConfig = { ...defaultConfig, ...config };

  // デバッグ状態
  const [debugStats, setDebugStats] = useState<DebugStats>({
    totalRestaurants: 0,
    validRestaurants: 0,
    displayedRestaurants: 0,
    renderTime: 0,
    lastUpdate: new Date(),
  });

  const [eventHistory, setEventHistory] = useState<DebugEvent[]>([]);
  const performanceTimers = useRef<Map<string, number>>(new Map());

  /**
   * デバッグイベントをログに記録
   */
  const logEvent = useCallback(
    (
      type: DebugEventType,
      data?: Record<string, unknown>,
      duration?: number
    ) => {
      if (!finalConfig.enabled) return;

      const event: DebugEvent = {
        type,
        timestamp: new Date(),
        ...(data && { data }),
        ...(duration !== undefined && { duration }),
      };

      // イベント履歴に追加
      setEventHistory(prev => {
        const newHistory = [event, ...prev];
        return newHistory.slice(0, finalConfig.maxEventHistory);
      });

      // コンソールログ出力
      if (finalConfig.logLevel !== "minimal") {
        const logMessage = `🗺️ Map Debug [${type}]`;

        if (duration !== undefined) {
          console.log(`${logMessage} - ${duration.toFixed(2)}ms`, data);
        } else {
          console.log(logMessage, data);
        }
      }
    },
    [finalConfig.enabled, finalConfig.logLevel, finalConfig.maxEventHistory]
  );

  /**
   * パフォーマンス測定開始
   */
  const startPerformanceTimer = useCallback(
    (operation: string) => {
      if (!finalConfig.enabled || !finalConfig.trackPerformance) return;

      performanceTimers.current.set(operation, performance.now());
    },
    [finalConfig.enabled, finalConfig.trackPerformance]
  );

  /**
   * パフォーマンス測定終了
   */
  const endPerformanceTimer = useCallback(
    (
      operation: string,
      additionalData?: Record<string, unknown>
    ): PerformanceMeasurement | null => {
      if (!finalConfig.enabled || !finalConfig.trackPerformance) return null;

      const startTime = performanceTimers.current.get(operation);
      if (startTime === undefined) {
        console.warn(`🚨 Performance timer "${operation}" was not started`);
        return null;
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      performanceTimers.current.delete(operation);

      const measurement: PerformanceMeasurement = {
        operation,
        startTime,
        endTime,
        duration,
        ...(additionalData && { additionalData }),
      };

      // デバッグイベントとして記録
      logEvent(
        "performance_measure",
        {
          operation,
          duration,
          ...additionalData,
        },
        duration
      );

      return measurement;
    },
    [finalConfig.enabled, finalConfig.trackPerformance, logEvent]
  );

  /**
   * メモリ使用量を取得
   */
  const getMemoryUsage = useCallback((): number | undefined => {
    if (!finalConfig.enabled || !finalConfig.trackMemory) return undefined;

    // @ts-expect-error - performance.memory is available in Chrome
    if (performance.memory) {
      // @ts-expect-error - performance.memory is available in Chrome
      return performance.memory.usedJSHeapSize / (1024 * 1024); // MB
    }

    return undefined;
  }, [finalConfig.enabled, finalConfig.trackMemory]);

  /**
   * デバッグ統計を更新
   */
  const updateDebugStats = useCallback(
    (validCount: number, displayedCount: number, renderTime: number) => {
      if (!finalConfig.enabled) return;

      const memoryUsage = getMemoryUsage();

      const newStats: DebugStats = {
        totalRestaurants: restaurants.length,
        validRestaurants: validCount,
        displayedRestaurants: displayedCount,
        renderTime,
        ...(memoryUsage && { memoryUsage }),
        lastUpdate: new Date(),
      };

      setDebugStats(newStats);

      // 詳細ログ
      if (finalConfig.logLevel === "verbose") {
        console.group("🎯 Map Debug Stats Update");
        console.table(newStats);
        console.groupEnd();
      }
    },
    [
      finalConfig.enabled,
      finalConfig.logLevel,
      restaurants.length,
      getMemoryUsage,
    ]
  );

  /**
   * エラーをデバッグログに記録
   */
  const logError = useCallback(
    (error: Error, context?: string) => {
      if (!finalConfig.enabled) return;

      logEvent("error_caught", {
        message: error.message,
        stack: error.stack,
        context,
        userAgent: navigator.userAgent,
      });

      console.error("🚨 Map Error:", error, { context });
    },
    [finalConfig.enabled, logEvent]
  );

  /**
   * デバッグ情報のエクスポート
   */
  const exportDebugData = useCallback(() => {
    if (!finalConfig.enabled) return null;

    return {
      config: finalConfig,
      stats: debugStats,
      eventHistory,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }, [finalConfig, debugStats, eventHistory]);

  /**
   * デバッグコンソール表示
   */
  const showDebugConsole = useCallback(() => {
    if (!finalConfig.enabled) return;

    const debugData = exportDebugData();

    console.group("🗺️ Map Debug Console");
    console.log("📊 Current Stats:", debugStats);
    console.log("📜 Recent Events:", eventHistory.slice(0, 10));
    console.log("⚙️ Configuration:", finalConfig);
    console.log("💾 Full Debug Data:", debugData);
    console.groupEnd();
  }, [
    finalConfig.enabled,
    exportDebugData,
    debugStats,
    eventHistory,
    finalConfig,
  ]);

  // レストランデータの変更を監視
  useEffect(() => {
    if (finalConfig.enabled) {
      logEvent("data_filter", {
        totalRestaurants: restaurants.length,
        timestamp: new Date().toISOString(),
      });
    }
  }, [restaurants.length, finalConfig.enabled, logEvent]);

  // 開発モードでグローバルデバッグ関数を登録
  useEffect(() => {
    if (finalConfig.enabled && typeof window !== "undefined") {
      // @ts-expect-error - Adding debug function to window for development
      window.mapDebug = {
        showConsole: showDebugConsole,
        exportData: exportDebugData,
        stats: debugStats,
        events: eventHistory,
      };

      return () => {
        // @ts-expect-error - Cleaning up debug function
        delete window.mapDebug;
      };
    }
    return undefined;
  }, [
    finalConfig.enabled,
    showDebugConsole,
    exportDebugData,
    debugStats,
    eventHistory,
  ]);

  return {
    // デバッグ状態
    debugStats,
    eventHistory,
    isEnabled: finalConfig.enabled,

    // デバッグ関数
    logEvent,
    logError,
    startPerformanceTimer,
    endPerformanceTimer,
    updateDebugStats,
    getMemoryUsage,

    // ユーティリティ
    showDebugConsole,
    exportDebugData,
  };
};
