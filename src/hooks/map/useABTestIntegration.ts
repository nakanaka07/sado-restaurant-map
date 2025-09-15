/**
 * @fileoverview A/Bテスト統合フック
 * RestaurantMapコンポーネントでA/Bテスト分析を統合
 *
 * 🎯 機能:
 * 1. マーカーインタラクション追跡
 * 2. A/Bテストイベント収集
 * 3. ダッシュボード表示制御
 * 4. パフォーマンス監視
 */

import type { ABTestVariant, UserSegment } from "@/config/abTestConfig";
import type { Restaurant } from "@/types";
import { abTestAnalytics } from "@/utils/abTestAnalytics";
import { useCallback, useEffect, useState } from "react";

// ==============================
// A/Bテスト統合フック型定義
// ==============================

interface ABTestIntegrationOptions {
  readonly variant: ABTestVariant;
  readonly segment: UserSegment;
  readonly enableTracking: boolean;
  readonly enableDashboard: boolean;
  readonly debugMode?: boolean;
}

interface ABTestMarkerInteraction {
  readonly restaurant: Restaurant;
  readonly interactionType: "click" | "hover" | "info_open" | "info_close";
  readonly renderTime: number;
  readonly timestamp: number;
}

interface ABTestIntegrationReturn {
  readonly trackMarkerInteraction: (
    interaction: ABTestMarkerInteraction
  ) => void;
  readonly trackSessionStart: () => void;
  readonly trackError: (error: Error, context: string) => void;
  readonly isDashboardVisible: boolean;
  readonly toggleDashboard: () => void;
  readonly totalInteractions: number;
  readonly sessionDuration: number;
}

// ==============================
// A/Bテスト統合フック実装
// ==============================

export function useABTestIntegration(
  options: ABTestIntegrationOptions
): ABTestIntegrationReturn {
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);

  // セッション時間の更新
  useEffect(() => {
    const updateSessionDuration = () => {
      setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
    };

    updateSessionDuration();
    const interval = setInterval(updateSessionDuration, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // セッション開始追跡
  const trackSessionStart = useCallback(() => {
    if (!options.enableTracking) return;

    abTestAnalytics.trackSessionStart(
      options.variant,
      options.segment,
      undefined // userId は現在未実装
    );

    if (options.debugMode) {
      console.log("📊 A/Bテストセッション開始:", {
        variant: options.variant,
        segment: options.segment,
        timestamp: new Date().toISOString(),
      });
    }
  }, [options]);

  // マーカーインタラクション追跡
  const trackMarkerInteraction = useCallback(
    (interaction: ABTestMarkerInteraction) => {
      if (!options.enableTracking) return;

      // インタラクション数更新
      setTotalInteractions(prev => prev + 1);

      // A/Bテスト分析サービスに送信
      abTestAnalytics.trackMarkerClick(
        options.variant,
        options.segment,
        "restaurant", // マーカータイプ
        interaction.restaurant.mainCategory ||
          interaction.restaurant.cuisineType,
        interaction.renderTime,
        undefined // userId
      );

      // 詳細イベント追跡
      abTestAnalytics.trackABTestEvent(
        options.variant,
        options.segment,
        "marker_clicked",
        {
          restaurant_id: interaction.restaurant.id,
          restaurant_name: interaction.restaurant.name,
          interaction_type: interaction.interactionType,
          render_time: interaction.renderTime,
          restaurant_cuisine: interaction.restaurant.cuisineType,
          restaurant_main_category: interaction.restaurant.mainCategory,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          session_duration: sessionDuration,
          total_interactions: totalInteractions + 1,
        }
      );

      if (options.debugMode) {
        console.log("🎯 マーカーインタラクション追跡:", {
          restaurant: interaction.restaurant.name,
          type: interaction.interactionType,
          variant: options.variant,
          renderTime: `${interaction.renderTime}ms`,
          sessionDuration: `${sessionDuration}s`,
        });
      }
    },
    [options, sessionDuration, totalInteractions]
  );

  // エラー追跡
  const trackError = useCallback(
    (error: Error, context: string) => {
      if (!options.enableTracking) return;

      abTestAnalytics.trackError(
        options.variant,
        options.segment,
        error.name || "UnknownError",
        error.message || "No error message",
        error.stack,
        undefined // userId
      );

      if (options.debugMode) {
        console.error("❌ A/Bテストエラー追跡:", {
          error: error.message,
          context,
          variant: options.variant,
          stack: error.stack,
        });
      }
    },
    [options]
  );

  // ダッシュボード表示切り替え
  const toggleDashboard = useCallback(() => {
    if (!options.enableDashboard) {
      console.warn("ダッシュボード機能が無効になっています");
      return;
    }

    setIsDashboardVisible(prev => !prev);

    if (options.debugMode) {
      console.log("📊 ダッシュボード表示切り替え:", !isDashboardVisible);
    }
  }, [options.enableDashboard, options.debugMode, isDashboardVisible]);

  // 初期セットアップ
  useEffect(() => {
    // セッション開始を追跡
    trackSessionStart();

    // ページ離脱時のセッション終了追跡
    const handleBeforeUnload = () => {
      if (options.enableTracking) {
        abTestAnalytics.trackABTestEvent(
          options.variant,
          options.segment,
          "session_ended",
          {
            session_duration: sessionDuration,
            total_interactions: totalInteractions,
            final_timestamp: Date.now(),
          }
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload(); // クリーンアップ時にも実行
    };
  }, [trackSessionStart, options, sessionDuration, totalInteractions]);

  return {
    trackMarkerInteraction,
    trackSessionStart,
    trackError,
    isDashboardVisible,
    toggleDashboard,
    totalInteractions,
    sessionDuration,
  };
}

// ==============================
// マーカーインタラクション生成ヘルパー
// ==============================

/**
 * マーカーインタラクションオブジェクト生成
 */
export function createMarkerInteraction(
  restaurant: Restaurant,
  interactionType: ABTestMarkerInteraction["interactionType"],
  renderTime: number = 0
): ABTestMarkerInteraction {
  return {
    restaurant,
    interactionType,
    renderTime,
    timestamp: Date.now(),
  };
}

// ==============================
// デバッグ用ユーティリティ
// ==============================

/**
 * A/Bテスト統計情報をコンソールに出力
 */
export function logABTestStats(): void {
  const data = abTestAnalytics.generateDashboardData();

  console.group("📊 A/Bテスト統計サマリー");
  console.log("総参加者:", data.totalParticipants);
  console.log("アクティブユーザー:", data.realtimeMetrics.activeUsers);
  console.log("エラー数:", data.realtimeMetrics.errorCount);
  console.log(
    "平均読み込み時間:",
    `${data.realtimeMetrics.averageLoadTime.toFixed(1)}ms`
  );

  console.group("バリアント別結果:");
  for (const variant of data.variants) {
    console.log(`${variant.variant}:`, {
      セッション数: variant.totalSessions,
      コンバージョン率: `${(variant.conversionRate * 100).toFixed(2)}%`,
      パフォーマンススコア: `${variant.performanceScore.toFixed(1)}/100`,
    });
  }
  console.groupEnd();

  console.groupEnd();
}

// 開発環境でのグローバル公開
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // @ts-expect-error - 開発用のグローバル変数設定
  window.logABTestStats = logABTestStats;
}
