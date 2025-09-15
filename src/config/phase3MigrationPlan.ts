/**
 * @fileoverview Phase 3 移行計画設定
 * A/BテストPhase 2からPhase 3（80%ロールアウト）への移行準備
 *
 * 🎯 機能:
 * 1. Phase 3移行条件の定義
 * 2. 統計的有意性検証基準
 * 3. パフォーマンス閾値設定
 * 4. ロールバック条件と手順
 * 5. 移行プロセス自動化
 */

import type { ABTestVariant, RolloutPhase } from "@/config/abTestConfig";

// ==============================
// Phase 3 移行設定型定義
// ==============================

/** 移行条件評価結果 */
export interface MigrationReadinessCheck {
  readonly phase: RolloutPhase;
  readonly isReady: boolean;
  readonly requirements: MigrationRequirement[];
  readonly warnings: string[];
  readonly timestamp: string;
}

/** 移行要件 */
export interface MigrationRequirement {
  readonly id: string;
  readonly description: string;
  readonly isMet: boolean;
  readonly currentValue: number;
  readonly threshold: number;
  readonly priority: "critical" | "high" | "medium" | "low";
}

/** ロールバック条件 */
export interface RollbackTrigger {
  readonly metric: string;
  readonly threshold: number;
  readonly timeWindow: number; // 監視時間（分）
  readonly severity: "critical" | "major" | "minor";
}

/** Phase 3 設定 */
export interface Phase3Config {
  readonly targetRolloutPercentage: number;
  readonly migrationRequirements: MigrationRequirement[];
  readonly rollbackTriggers: RollbackTrigger[];
  readonly validationPeriod: number; // 検証期間（時間）
  readonly minimumSampleSize: number;
  readonly confidenceLevel: number;
}

// ==============================
// Phase 3 移行設定定数
// ==============================

/** Phase 3 移行設定 */
export const PHASE3_MIGRATION_CONFIG: Phase3Config = {
  targetRolloutPercentage: 80,
  validationPeriod: 24, // 24時間の検証期間
  minimumSampleSize: 1000, // 最小サンプル数
  confidenceLevel: 0.95, // 95%信頼区間

  // 移行要件定義
  migrationRequirements: [
    {
      id: "statistical_significance",
      description: "統計的有意性（p値 < 0.05）",
      isMet: false,
      currentValue: 0,
      threshold: 0.05,
      priority: "critical",
    },
    {
      id: "minimum_sample_size",
      description: "最小サンプルサイズ（1,000ユーザー以上）",
      isMet: false,
      currentValue: 0,
      threshold: 1000,
      priority: "critical",
    },
    {
      id: "performance_score",
      description: "パフォーマンススコア（70点以上）",
      isMet: false,
      currentValue: 0,
      threshold: 70,
      priority: "high",
    },
    {
      id: "error_rate",
      description: "エラー率（1%未満）",
      isMet: false,
      currentValue: 0,
      threshold: 0.01,
      priority: "high",
    },
    {
      id: "conversion_improvement",
      description: "コンバージョン率改善（5%以上）",
      isMet: false,
      currentValue: 0,
      threshold: 0.05,
      priority: "medium",
    },
    {
      id: "user_satisfaction",
      description: "ユーザー満足度（80%以上）",
      isMet: false,
      currentValue: 0,
      threshold: 0.8,
      priority: "medium",
    },
    {
      id: "stability_period",
      description: "安定稼働期間（48時間以上）",
      isMet: false,
      currentValue: 0,
      threshold: 48,
      priority: "high",
    },
  ],

  // ロールバック条件
  rollbackTriggers: [
    {
      metric: "error_rate",
      threshold: 0.05, // 5%以上のエラー率
      timeWindow: 15, // 15分間継続
      severity: "critical",
    },
    {
      metric: "performance_degradation",
      threshold: 0.3, // 30%以上の性能劣化
      timeWindow: 30, // 30分間継続
      severity: "major",
    },
    {
      metric: "user_complaints",
      threshold: 10, // 10件以上の苦情
      timeWindow: 60, // 1時間以内
      severity: "major",
    },
    {
      metric: "conversion_drop",
      threshold: 0.1, // 10%以上のコンバージョン低下
      timeWindow: 120, // 2時間継続
      severity: "minor",
    },
  ],
} as const;

// ==============================
// 移行判定ロジック
// ==============================

/**
 * Phase 3 移行準備状況を評価
 */
export function evaluatePhase3Readiness(currentData: {
  statisticalSignificance: number;
  sampleSize: number;
  performanceScore: number;
  errorRate: number;
  conversionImprovement: number;
  userSatisfaction: number;
  stabilityHours: number;
}): MigrationReadinessCheck {
  const requirements = PHASE3_MIGRATION_CONFIG.migrationRequirements.map(
    req => ({
      ...req,
      currentValue: getCurrentValue(req.id, currentData),
      isMet: isRequirementMet(req.id, currentData),
    })
  );

  const criticalRequirements = requirements.filter(
    r => r.priority === "critical"
  );
  const allCriticalMet = criticalRequirements.every(r => r.isMet);
  const highPriorityMet = requirements
    .filter(r => r.priority === "high")
    .every(r => r.isMet);

  const warnings: string[] = [];

  // 警告生成
  if (!allCriticalMet) {
    warnings.push("重要な移行条件が満たされていません");
  }

  if (!highPriorityMet) {
    warnings.push("高優先度の条件を満たすことを推奨します");
  }

  const unmetRequirements = requirements.filter(r => !r.isMet);
  if (unmetRequirements.length > 0) {
    warnings.push(`${unmetRequirements.length}個の条件が未達成です`);
  }

  return {
    phase: "phase3",
    isReady: allCriticalMet && highPriorityMet,
    requirements,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 指定された要件IDの現在値を取得
 */
function getCurrentValue(
  requirementId: string,
  data: {
    statisticalSignificance: number;
    sampleSize: number;
    performanceScore: number;
    errorRate: number;
    conversionImprovement: number;
    userSatisfaction: number;
    stabilityHours: number;
  }
): number {
  switch (requirementId) {
    case "statistical_significance":
      return data.statisticalSignificance;
    case "minimum_sample_size":
      return data.sampleSize;
    case "performance_score":
      return data.performanceScore;
    case "error_rate":
      return data.errorRate;
    case "conversion_improvement":
      return data.conversionImprovement;
    case "user_satisfaction":
      return data.userSatisfaction;
    case "stability_period":
      return data.stabilityHours;
    default:
      return 0;
  }
}

/**
 * 要件が満たされているかチェック
 */
function isRequirementMet(
  requirementId: string,
  data: {
    statisticalSignificance: number;
    sampleSize: number;
    performanceScore: number;
    errorRate: number;
    conversionImprovement: number;
    userSatisfaction: number;
    stabilityHours: number;
  }
): boolean {
  const requirement = PHASE3_MIGRATION_CONFIG.migrationRequirements.find(
    r => r.id === requirementId
  );
  if (!requirement) return false;

  const currentValue = getCurrentValue(requirementId, data);

  // エラー率と統計的有意性は閾値未満が条件
  if (
    requirementId === "error_rate" ||
    requirementId === "statistical_significance"
  ) {
    return currentValue < requirement.threshold;
  }

  // その他は閾値以上が条件
  return currentValue >= requirement.threshold;
}

// ==============================
// 移行実行ロジック
// ==============================

/**
 * Phase 3 への移行を実行
 */
export interface Phase3MigrationPlan {
  readonly steps: MigrationStep[];
  readonly rollbackPlan: RollbackStep[];
  readonly monitoringChecks: MonitoringCheck[];
}

export interface MigrationStep {
  readonly id: string;
  readonly description: string;
  readonly action: string;
  readonly estimatedDuration: number; // 分
  readonly dependencies: string[];
}

export interface RollbackStep {
  readonly id: string;
  readonly description: string;
  readonly action: string;
  readonly priority: number;
}

export interface MonitoringCheck {
  readonly metric: string;
  readonly checkInterval: number; // 秒
  readonly alertThreshold: number;
  readonly duration: number; // 分
}

/**
 * Phase 3 移行計画を生成
 */
export function generatePhase3MigrationPlan(): Phase3MigrationPlan {
  return {
    steps: [
      {
        id: "backup_current_config",
        description: "現在の設定をバックアップ",
        action: "backup_ab_test_config",
        estimatedDuration: 2,
        dependencies: [],
      },
      {
        id: "update_rollout_percentage",
        description: "ロールアウト率を80%に更新",
        action: "update_config_phase3",
        estimatedDuration: 1,
        dependencies: ["backup_current_config"],
      },
      {
        id: "deploy_configuration",
        description: "新しい設定をデプロイ",
        action: "deploy_ab_test_config",
        estimatedDuration: 5,
        dependencies: ["update_rollout_percentage"],
      },
      {
        id: "validate_deployment",
        description: "デプロイメントを検証",
        action: "validate_phase3_deployment",
        estimatedDuration: 10,
        dependencies: ["deploy_configuration"],
      },
      {
        id: "start_monitoring",
        description: "拡張監視を開始",
        action: "start_enhanced_monitoring",
        estimatedDuration: 2,
        dependencies: ["validate_deployment"],
      },
    ],

    rollbackPlan: [
      {
        id: "immediate_rollback",
        description: "即座にPhase 2設定に戻す",
        action: "rollback_to_phase2",
        priority: 1,
      },
      {
        id: "clear_cache",
        description: "キャッシュをクリア",
        action: "clear_ab_test_cache",
        priority: 2,
      },
      {
        id: "notify_team",
        description: "チームに通知",
        action: "send_rollback_notification",
        priority: 3,
      },
    ],

    monitoringChecks: [
      {
        metric: "error_rate",
        checkInterval: 30, // 30秒ごと
        alertThreshold: 0.02, // 2%
        duration: 120, // 2時間
      },
      {
        metric: "performance_score",
        checkInterval: 60, // 1分ごと
        alertThreshold: 60, // 60点未満で警告
        duration: 180, // 3時間
      },
      {
        metric: "user_satisfaction",
        checkInterval: 300, // 5分ごと
        alertThreshold: 0.7, // 70%未満で警告
        duration: 360, // 6時間
      },
    ],
  };
}

// ==============================
// ユーティリティ関数
// ==============================

/**
 * 移行準備レポートを生成
 */
export function generateMigrationReport(
  readiness: MigrationReadinessCheck
): string {
  const report = [
    `=== Phase 3 移行準備レポート ===`,
    `作成日時: ${new Date(readiness.timestamp).toLocaleString("ja-JP")}`,
    ``,
    `🎯 移行準備状況: ${readiness.isReady ? "✅ 準備完了" : "⚠️ 未完了"}`,
    ``,
    `📊 要件チェック結果:`,
  ];

  readiness.requirements.forEach(req => {
    const status = req.isMet ? "✅" : "❌";
    const priority = req.priority.toUpperCase();
    report.push(
      `  ${status} [${priority}] ${req.description}: ${req.currentValue} (基準: ${req.threshold})`
    );
  });

  if (readiness.warnings.length > 0) {
    report.push(``, `⚠️ 警告事項:`);
    readiness.warnings.forEach(warning => {
      report.push(`  - ${warning}`);
    });
  }

  return report.join("\n");
}

/**
 * Phase 3設定を適用
 */
export function applyPhase3Configuration(): {
  success: boolean;
  message: string;
  config: Record<string, unknown> | null;
} {
  try {
    // Phase 3設定を作成
    const phase3Config = {
      enabled: true,
      currentPhase: "phase3" as const,
      rolloutPercentage: 80,
      defaultVariant: "enhanced-png" as ABTestVariant,
      testingModeEnabled: true,
    };

    // 設定をlocalStorageに保存（本来はAPIエンドポイント経由）
    const configKey = "ab_test_phase3_config";
    localStorage.setItem(
      configKey,
      JSON.stringify({
        ...phase3Config,
        appliedAt: new Date().toISOString(),
        previousPhase: "phase2",
      })
    );

    return {
      success: true,
      message: "Phase 3設定が正常に適用されました",
      config: phase3Config,
    };
  } catch (error) {
    return {
      success: false,
      message: `Phase 3設定の適用に失敗しました: ${String(error)}`,
      config: null,
    };
  }
}

export default {
  PHASE3_MIGRATION_CONFIG,
  evaluatePhase3Readiness,
  generatePhase3MigrationPlan,
  generateMigrationReport,
  applyPhase3Configuration,
};
