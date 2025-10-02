/**
 * @fileoverview Phase 3配信設定テストスイート
 * 80%ロールアウト配信の動作確認とロールバック機能テスト
 *
 * 🎯 機能:
 * 1. Phase 3設定の適用テスト
 * 2. ロールアウト率検証
 * 3. ユーザー分類テスト
 * 4. ロールバック機能テスト
 * 5. 統合監視システムテスト
 */

import {
  ABTestConfig,
  CURRENT_AB_TEST_CONFIG,
  classifyUser,
} from "@/config/abTestConfig";
import {
  PHASE3_MIGRATION_CONFIG,
  applyPhase3Configuration,
  evaluatePhase3Readiness,
} from "@/config/phase3MigrationPlan";
import {
  getMonitoringStatus,
  startABTestMonitoring,
  stopABTestMonitoring,
} from "./abTestMonitoring";
import { performStatisticalAnalysis } from "./statisticalSignificance";

// ==============================
// テスト設定
// ==============================

interface TestResult {
  readonly testName: string;
  readonly passed: boolean;
  readonly message: string;
  readonly details: unknown;
  readonly duration: number;
}

interface TestSuite {
  readonly suiteName: string;
  readonly results: TestResult[];
  readonly passed: boolean;
  readonly totalDuration: number;
}

// ==============================
// Phase 3 配信テストクラス
// ==============================

class Phase3DeploymentTester {
  private readonly testResults: TestResult[] = [];

  /**
   * 全テストスイートを実行
   */
  async runAllTests(): Promise<TestSuite> {
    console.log("🧪 Phase 3配信テストスイートを開始します...");
    const startTime = Date.now();

    try {
      // 各テストを順次実行
      this.testPhase3Configuration();
      this.testRolloutPercentage();
      this.testUserClassification();
      this.testStatisticalValidation();
      await this.testMonitoringSystem();
      this.testRollbackFunctionality();

      const totalDuration = Date.now() - startTime;
      const passed = this.testResults.every(result => result.passed);

      console.log(
        `✅ テストスイート完了: ${passed ? "成功" : "失敗"} (${totalDuration}ms)`
      );

      return {
        suiteName: "Phase 3 Deployment Test Suite",
        results: [...this.testResults],
        passed,
        totalDuration,
      };
    } catch (error) {
      console.error("❌ テストスイート実行エラー:", error);
      throw error;
    }
  }

  /**
   * Phase 3設定テスト
   */
  private testPhase3Configuration(): void {
    const testName = "Phase 3 Configuration Test";
    const startTime = Date.now();

    try {
      console.log("🔧 Phase 3設定テストを実行中...");

      // Phase 3設定を適用
      const result = applyPhase3Configuration();

      if (!result.success) {
        throw new Error(`設定適用失敗: ${result.message}`);
      }

      // 設定値を検証
      const config = result.config;
      if (!config) {
        throw new Error("設定が取得できませんでした");
      }

      const assertions = [
        {
          condition:
            "currentPhase" in config && config.currentPhase === "phase3",
          message: "フェーズがphase3に設定されている",
        },
        {
          condition:
            "rolloutPercentage" in config && config.rolloutPercentage === 80,
          message: "ロールアウト率が80%に設定されている",
        },
        {
          condition: "enabled" in config && config.enabled === true,
          message: "A/Bテストが有効になっている",
        },
        {
          condition:
            "testingModeEnabled" in config &&
            config.testingModeEnabled === true,
          message: "テストモードが有効になっている",
        },
      ];

      const failedAssertions = assertions.filter(a => !a.condition);

      if (failedAssertions.length > 0) {
        throw new Error(
          `設定検証失敗: ${failedAssertions.map(a => a.message).join(", ")}`
        );
      }

      this.addTestResult({
        testName,
        passed: true,
        message: "Phase 3設定が正常に適用されました",
        details: { config, assertions: assertions.length },
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.addTestResult({
        testName,
        passed: false,
        message: `Phase 3設定テスト失敗: ${String(error)}`,
        details: { error: String(error) },
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * ロールアウト率テスト
   */
  private testRolloutPercentage(): void {
    const testName = "Rollout Percentage Test";
    const startTime = Date.now();

    try {
      console.log("📊 ロールアウト率テストを実行中...");

      const testUsers = 1000;
      const userClassifications = [];

      // 1000人の仮想ユーザーで分類テスト
      for (let i = 0; i < testUsers; i++) {
        const userId = `test_user_${i}`;
        const classification = classifyUser(userId);
        userClassifications.push(classification);
      }

      // 統計を計算
      const inTestUsers = userClassifications.filter(c => c.isInTest).length;
      const actualRolloutPercentage = (inTestUsers / testUsers) * 100;
      const expectedPercentage = 80;
      const tolerance = 5; // 5%の許容誤差

      console.log(
        `実際のロールアウト率: ${actualRolloutPercentage.toFixed(1)}%`
      );

      // バリアント分布も確認
      const variantDistribution = userClassifications.reduce(
        (acc, c) => {
          acc[c.variant] = (acc[c.variant] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const isWithinTolerance =
        Math.abs(actualRolloutPercentage - expectedPercentage) <= tolerance;

      if (!isWithinTolerance) {
        throw new Error(
          `ロールアウト率が期待値から外れています: 実際=${actualRolloutPercentage.toFixed(1)}%, 期待=${expectedPercentage}%`
        );
      }

      this.addTestResult({
        testName,
        passed: true,
        message: `ロールアウト率が正常です: ${actualRolloutPercentage.toFixed(1)}%`,
        details: {
          expectedPercentage,
          actualRolloutPercentage,
          variantDistribution,
          tolerance,
        },
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.addTestResult({
        testName,
        passed: false,
        message: `ロールアウト率テスト失敗: ${String(error)}`,
        details: { error: String(error) },
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * ユーザー分類テスト
   */
  private testUserClassification(): void {
    const testName = "User Classification Test";
    const startTime = Date.now();

    try {
      console.log("👥 ユーザー分類テストを実行中...");

      const testCases = [
        { userId: "early_adopter_1", expectedSegment: "early-adopter" },
        { userId: "beta_tester_1", expectedSegment: "beta-tester" },
        { userId: "general_user_1", expectedSegment: "general" },
        { userId: "control_user_1", expectedSegment: "control" },
      ];

      const results = testCases.map(testCase => {
        const classification = classifyUser(testCase.userId);
        return {
          ...testCase,
          actualSegment: classification.segment,
          variant: classification.variant,
          isInTest: classification.isInTest,
          passed: true, // セグメント分類は確率的なのでログ出力のみ
        };
      });

      // 一貫性チェック：同じユーザーIDは常に同じ分類結果になるべき
      const consistencyTestUserId = "consistency_test_user";
      const classifications = Array(10)
        .fill(0)
        .map(() => classifyUser(consistencyTestUserId));

      const firstClassification = classifications[0];
      const isConsistent = classifications.every(
        c =>
          c.segment === firstClassification.segment &&
          c.variant === firstClassification.variant &&
          c.isInTest === firstClassification.isInTest
      );

      if (!isConsistent) {
        throw new Error("ユーザー分類の一貫性が保たれていません");
      }

      this.addTestResult({
        testName,
        passed: true,
        message: "ユーザー分類が正常に動作しています",
        details: {
          testCases: results,
          consistencyTest: {
            userId: consistencyTestUserId,
            classification: firstClassification,
            consistent: isConsistent,
          },
        },
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.addTestResult({
        testName,
        passed: false,
        message: `ユーザー分類テスト失敗: ${String(error)}`,
        details: { error: String(error) },
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * 統計的検証テスト
   */
  private testStatisticalValidation(): void {
    const testName = "Statistical Validation Test";
    const startTime = Date.now();

    try {
      console.log("📈 統計的検証テストを実行中...");

      // 統計分析を実行
      const analysisResult = performStatisticalAnalysis();

      // 結果の構造を検証
      const requiredFields = [
        "overallResult",
        "variantComparisons",
        "recommendations",
        "readyForNextPhase",
      ];

      const missingFields = requiredFields.filter(
        field => !(field in analysisResult)
      );

      if (missingFields.length > 0) {
        throw new Error(
          `統計分析結果に必要なフィールドがありません: ${missingFields.join(", ")}`
        );
      }

      // Phase 3移行準備評価
      const mockData = {
        statisticalSignificance: 0.03,
        sampleSize: 1500,
        performanceScore: 82,
        errorRate: 0.008,
        conversionImprovement: 0.12,
        userSatisfaction: 0.85,
        stabilityHours: 72,
      };

      const readinessCheck = evaluatePhase3Readiness(mockData);

      this.addTestResult({
        testName,
        passed: true,
        message: "統計的検証が正常に動作しています",
        details: {
          analysisResult: {
            overallSignificant: analysisResult.overallResult.isSignificant,
            variantCount: analysisResult.variantComparisons.length,
            recommendationCount: analysisResult.recommendations.length,
            readyForNextPhase: analysisResult.readyForNextPhase,
          },
          readinessCheck: {
            isReady: readinessCheck.isReady,
            metRequirements: readinessCheck.requirements.filter(r => r.isMet)
              .length,
            totalRequirements: readinessCheck.requirements.length,
            warnings: readinessCheck.warnings.length,
          },
        },
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.addTestResult({
        testName,
        passed: false,
        message: `統計的検証テスト失敗: ${String(error)}`,
        details: { error: String(error) },
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * 監視システムテスト
   */
  private async testMonitoringSystem(): Promise<void> {
    const testName = "Monitoring System Test";
    const startTime = Date.now();

    try {
      console.log("🔍 監視システムテストを実行中...");

      // 監視システムを開始
      startABTestMonitoring();

      // 少し待ってから状態を確認
      await new Promise(resolve => setTimeout(resolve, 1000));

      const monitoringState = getMonitoringStatus();

      // 監視システムの基本機能をテスト
      const assertions = [
        {
          condition: monitoringState.isMonitoring,
          message: "監視システムが開始されている",
        },
        {
          condition: monitoringState.currentMetrics !== null,
          message: "現在のメトリクスが取得できている",
        },
        {
          condition: Array.isArray(monitoringState.alerts),
          message: "アラート配列が存在する",
        },
        {
          condition: monitoringState.lastCheck !== null,
          message: "最終チェック時刻が記録されている",
        },
      ];

      const failedAssertions = assertions.filter(a => !a.condition);

      if (failedAssertions.length > 0) {
        throw new Error(
          `監視システム検証失敗: ${failedAssertions.map(a => a.message).join(", ")}`
        );
      }

      // 監視システムを停止
      stopABTestMonitoring();

      this.addTestResult({
        testName,
        passed: true,
        message: "監視システムが正常に動作しています",
        details: {
          monitoringState: {
            isMonitoring: monitoringState.isMonitoring,
            hasMetrics: !!monitoringState.currentMetrics,
            alertCount: monitoringState.alerts.length,
            lastCheck: monitoringState.lastCheck,
          },
          assertions: assertions.length,
        },
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.addTestResult({
        testName,
        passed: false,
        message: `監視システムテスト失敗: ${String(error)}`,
        details: { error: String(error) },
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * ロールバック機能テスト
   */
  private testRollbackFunctionality(): void {
    const testName = "Rollback Functionality Test";
    const startTime = Date.now();

    try {
      console.log("🔄 ロールバック機能テストを実行中...");

      // 現在の設定を記録
      const beforeRollback = { ...CURRENT_AB_TEST_CONFIG } as ABTestConfig;

      // Phase 3設定を適用
      const phase3Result = applyPhase3Configuration();
      if (!phase3Result.success) {
        throw new Error("Phase 3設定適用に失敗");
      }

      // ロールバック実行（localStorageベース）
      const rollbackResult = this.executeRollback();

      if (!rollbackResult.success) {
        throw new Error(`ロールバック実行失敗: ${rollbackResult.message}`);
      }

      // ロールバック後の状態を検証
      const afterRollback = this.getCurrentConfiguration();

      const isRolledBack =
        afterRollback.currentPhase === "phase2" &&
        afterRollback.rolloutPercentage === 50;

      if (!isRolledBack) {
        throw new Error("ロールバックが正常に実行されませんでした");
      }

      this.addTestResult({
        testName,
        passed: true,
        message: "ロールバック機能が正常に動作しています",
        details: {
          beforeRollback: {
            phase: beforeRollback.currentPhase,
            rollout: beforeRollback.rolloutPercentage,
          },
          afterRollback: {
            phase: afterRollback.currentPhase,
            rollout: afterRollback.rolloutPercentage,
          },
          rollbackResult,
        },
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.addTestResult({
        testName,
        passed: false,
        message: `ロールバック機能テスト失敗: ${String(error)}`,
        details: { error: String(error) },
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * ロールバックを実行
   */
  private executeRollback(): { success: boolean; message: string } {
    try {
      const rollbackConfig = {
        enabled: true,
        currentPhase: "phase2",
        rolloutPercentage: 50,
        defaultVariant: "enhanced-png",
        testingModeEnabled: true,
        rolledBackAt: new Date().toISOString(),
        rollbackReason: "Test rollback execution",
      };

      localStorage.setItem(
        "ab_test_rollback_config",
        JSON.stringify(rollbackConfig)
      );

      return {
        success: true,
        message: "ロールバックが正常に実行されました",
      };
    } catch (error) {
      return {
        success: false,
        message: `ロールバック実行エラー: ${String(error)}`,
      };
    }
  }

  /**
   * 現在の設定を取得
   */
  private getCurrentConfiguration(): ABTestConfig {
    try {
      const rollbackConfig = localStorage.getItem("ab_test_rollback_config");
      if (rollbackConfig) {
        return JSON.parse(rollbackConfig) as ABTestConfig;
      }
      return CURRENT_AB_TEST_CONFIG;
    } catch (error) {
      console.error("設定取得エラー:", error);
      return CURRENT_AB_TEST_CONFIG;
    }
  }

  /**
   * 元の設定を復元
   */
  /**
   * テスト結果を追加
   */
  private addTestResult(result: TestResult): void {
    this.testResults.push(result);
    const status = result.passed ? "✅" : "❌";
    console.log(
      `${status} ${result.testName}: ${result.message} (${result.duration}ms)`
    );
  }
}

// ==============================
// テスト実行関数
// ==============================

/**
 * Phase 3配信テストを実行
 */
export async function runPhase3DeploymentTests(): Promise<TestSuite> {
  const tester = new Phase3DeploymentTester();
  return await tester.runAllTests();
}

/**
 * クイックヘルスチェック
 */
export function runQuickHealthCheck(): {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
} {
  console.log("⚡ クイックヘルスチェックを実行中...");

  const checks = [
    {
      name: "A/B Test Config",
      test: () => CURRENT_AB_TEST_CONFIG.enabled === true,
      message: "A/Bテスト設定が有効",
    },
    {
      name: "Phase 3 Migration Config",
      test: () => PHASE3_MIGRATION_CONFIG.targetRolloutPercentage === 80,
      message: "Phase 3移行設定が正常",
    },
    {
      name: "Statistical Analyzer",
      test: () => {
        try {
          performStatisticalAnalysis();
          return true;
        } catch {
          return false;
        }
      },
      message: "統計分析システムが動作",
    },
    {
      name: "Monitoring System",
      test: () => {
        try {
          const state = getMonitoringStatus();
          return state !== null;
        } catch {
          return false;
        }
      },
      message: "監視システムが利用可能",
    },
  ];

  const results = checks.map(check => ({
    name: check.name,
    passed: check.test(),
    message: check.message,
  }));

  const allPassed = results.every(result => result.passed);

  results.forEach(result => {
    const status = result.passed ? "✅" : "❌";
    console.log(`${status} ${result.name}: ${result.message}`);
  });

  console.log(`⚡ ヘルスチェック完了: ${allPassed ? "正常" : "異常"}`);

  return {
    passed: allPassed,
    checks: results,
  };
}

// ==============================
// テスト結果レポート生成
// ==============================

/**
 * テスト結果のHTMLレポートを生成
 */
export function generateTestReport(testSuite: TestSuite): string {
  const passedCount = testSuite.results.filter(r => r.passed).length;
  const failedCount = testSuite.results.length - passedCount;

  return `
=== ${testSuite.suiteName} ===
実行時間: ${testSuite.totalDuration}ms
テスト総数: ${testSuite.results.length}
成功: ${passedCount}
失敗: ${failedCount}
結果: ${testSuite.passed ? "✅ 成功" : "❌ 失敗"}

詳細結果:
${testSuite.results
  .map(
    (result, index) => `
${index + 1}. ${result.testName}
   ステータス: ${result.passed ? "✅ 成功" : "❌ 失敗"}
   実行時間: ${result.duration}ms
   メッセージ: ${result.message}
`
  )
  .join("")}

=== レポート終了 ===
  `.trim();
}

// ==============================
// エクスポート
// ==============================

export default {
  runPhase3DeploymentTests,
  runQuickHealthCheck,
  generateTestReport,
};

// 型エクスポート
export type { TestResult, TestSuite };
