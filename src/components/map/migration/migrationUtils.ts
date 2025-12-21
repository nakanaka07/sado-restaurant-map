/**
 * @fileoverview マーカー移行システム用ユーティリティ
 * React Fast Refresh対応のため、コンポーネントと分離
 */

import { useCallback, useState } from "react";
import type {
  MigrationConfig,
  MigrationState,
  PerformanceMetrics,
} from "../../../types/migration";

// ==============================
// 移行制御フック
// ==============================

export const useMigrationControl = (
  config: MigrationConfig
): MigrationState & {
  toggleSystem: () => void;
  reportIssue: (issue: string) => void;
  clearErrors: () => void;
} => {
  // ロールアウト判定はstate初期化時に実行 (react-hooks/set-state-in-effect 対応)
  const [state, setState] = useState<MigrationState>(() => {
    const shouldUseNewSystem =
      config.enabled &&
      (config.useNewSystemForced ||
        Math.random() * 100 < config.rolloutPercentage);
    return {
      isUsingNewSystem: shouldUseNewSystem,
      errors: [],
      lastUpdate: new Date().toISOString(),
    };
  });

  const toggleSystem = useCallback(() => {
    setState((prev: MigrationState) => ({
      ...prev,
      isUsingNewSystem: !prev.isUsingNewSystem,
      lastUpdate: new Date().toISOString(),
    }));
  }, []);

  const reportIssue = useCallback(
    (issue: string) => {
      setState((prev: MigrationState) => ({
        ...prev,
        errors: [...prev.errors, issue],
        lastUpdate: new Date().toISOString(),
      }));

      if (config.debugMode) {
        console.warn(`Migration Issue: ${issue}`);
      }
    },
    [config.debugMode]
  );

  const clearErrors = useCallback(() => {
    setState((prev: MigrationState) => ({
      ...prev,
      errors: [],
      lastUpdate: new Date().toISOString(),
    }));
  }, []);

  return {
    ...state,
    toggleSystem,
    reportIssue,
    clearErrors,
  };
};

// ==============================
// 移行品質レポート生成
// ==============================

export const generateMigrationQualityReport = (
  performanceMetrics: PerformanceMetrics[],
  errorLogs: string[]
): {
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
} => {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // パフォーマンス評価
  const avgRenderTime =
    performanceMetrics.length > 0
      ? performanceMetrics.reduce((sum, m) => sum + m.renderTime, 0) /
        performanceMetrics.length
      : 0;

  if (avgRenderTime > 100) {
    score -= 20;
    issues.push("平均レンダリング時間が100msを超過");
    recommendations.push("レンダリングパフォーマンスの最適化を検討");
  }

  // エラー率評価
  const errorRate = errorLogs.length / Math.max(performanceMetrics.length, 1);
  if (errorRate > 0.05) {
    score -= 30;
    issues.push(`エラー率が5%を超過: ${(errorRate * 100).toFixed(1)}%`);
    recommendations.push("エラーハンドリングの強化とフォールバック機能の改善");
  }

  // メモリ使用量評価
  const avgMemoryUsage =
    performanceMetrics
      .filter(m => m.memoryUsage !== undefined)
      .reduce((sum, m) => sum + (m.memoryUsage || 0), 0) /
    performanceMetrics.length;

  if (avgMemoryUsage > 50) {
    score -= 15;
    issues.push("メモリ使用量が50MBを超過");
    recommendations.push("メモリリーク対策とガベージコレクション最適化");
  }

  // ユーザーインタラクション評価
  const totalInteractions = performanceMetrics.reduce(
    (sum, m) => sum + m.userInteractions,
    0
  );

  if (totalInteractions === 0 && performanceMetrics.length > 0) {
    score -= 10;
    issues.push("ユーザーインタラクションが記録されていない");
    recommendations.push("ユーザビリティテストの実施とフィードバック収集");
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  };
};
