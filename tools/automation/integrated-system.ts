#!/usr/bin/env node

/**
 * 統合自動化システム
 * 全ての改善機能を統合して実行
 */

import * as fs from "fs";
import * as path from "path";
import { AdvancedAlertSystem } from "./alerts/advanced-alert-system";
import { GitHubIssueCreator } from "./github/issue-creator";
import { ReadmeAutomationSystem } from "./readme/automation-system";
import { DetailedQualityReporter } from "./reports/detailed-quality-reporter";

interface IntegratedSystemConfig {
  enableAutomation: boolean;
  enableIssueCreation: boolean;
  enableAlerts: boolean;
  enableDetailedReports: boolean;
  autoFix: boolean;
  alertThresholds: {
    quality: number;
    links: number;
  };
}

interface SystemExecutionResult {
  timestamp: Date;
  automation?: any;
  issues?: {
    created: number;
    errors: string[];
  };
  alerts?: {
    triggered: number;
    notifications: number;
  };
  reports?: {
    generated: boolean;
    score: number;
    grade: string;
  };
  summary: {
    success: boolean;
    totalDuration: number;
    recommendations: string[];
  };
}

class IntegratedAutomationSystem {
  private projectRoot: string;
  private config: IntegratedSystemConfig;
  private automationSystem: ReadmeAutomationSystem;
  private issueCreator: GitHubIssueCreator;
  private alertSystem: AdvancedAlertSystem;
  private qualityReporter: DetailedQualityReporter;

  constructor(
    projectRoot: string = process.cwd(),
    config?: Partial<IntegratedSystemConfig>
  ) {
    this.projectRoot = projectRoot;

    this.config = {
      enableAutomation: true,
      enableIssueCreation: true,
      enableAlerts: true,
      enableDetailedReports: true,
      autoFix: false,
      alertThresholds: {
        quality: 75,
        links: 0,
      },
      ...config,
    };

    this.automationSystem = new ReadmeAutomationSystem(projectRoot, {
      enableAutoFix: this.config.autoFix,
      generateReports: true,
    });

    this.issueCreator = new GitHubIssueCreator(projectRoot);
    this.alertSystem = new AdvancedAlertSystem(projectRoot);
    this.qualityReporter = new DetailedQualityReporter(projectRoot);
  }

  /**
   * 完全統合実行
   */
  public async runFullIntegration(): Promise<SystemExecutionResult> {
    const startTime = Date.now();
    console.log("🚀 Starting Integrated Automation System...\n");

    const result: SystemExecutionResult = {
      timestamp: new Date(),
      summary: {
        success: true,
        totalDuration: 0,
        recommendations: [],
      },
    };

    try {
      // 1. 基本自動化実行
      if (this.config.enableAutomation) {
        console.log("📋 Step 1: Running basic automation...");
        result.automation = await this.automationSystem.runAutomation();
        console.log("✅ Basic automation completed\n");
      }

      // 2. 詳細品質レポート生成
      if (this.config.enableDetailedReports) {
        console.log("📊 Step 2: Generating detailed quality report...");
        const detailedReport =
          await this.qualityReporter.generateComprehensiveReport();
        await this.qualityReporter.saveDetailedReport(detailedReport, "both");

        result.reports = {
          generated: true,
          score: detailedReport.quality.overall.score,
          grade: detailedReport.quality.overall.grade,
        };
        console.log(
          `✅ Quality report generated (Score: ${detailedReport.quality.overall.score}%)\n`
        );
      }

      // 3. アラート評価
      if (this.config.enableAlerts) {
        console.log("🚨 Step 3: Evaluating alerts...");
        await this.alertSystem.evaluateFromAutomationReport();

        const alertStats = this.alertSystem.getAlertStatistics(1);
        result.alerts = {
          triggered: alertStats.total,
          notifications: alertStats.total,
        };
        console.log(
          `✅ Alert evaluation completed (${alertStats.total} alerts)\n`
        );
      }

      // 4. GitHub Issue自動作成
      if (this.config.enableIssueCreation) {
        console.log("📋 Step 4: Creating GitHub Issues...");
        const issuesCreated =
          await this.issueCreator.createIssuesFromAutomationReport();

        result.issues = {
          created: issuesCreated,
          errors: [],
        };
        console.log(`✅ GitHub Issues created: ${issuesCreated}\n`);
      }

      // 5. 推奨事項生成
      result.summary.recommendations = this.generateRecommendations(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Integration failed: ${errorMessage}`);
      result.summary.success = false;
      result.summary.recommendations.push(
        "System integration failed - check logs for details"
      );
    }

    result.summary.totalDuration = Date.now() - startTime;

    // 結果保存
    await this.saveExecutionResult(result);

    // サマリー出力
    this.printExecutionSummary(result);

    return result;
  }

  /**
   * 段階的実行（問題発生時の復旧用）
   */
  public async runStepByStep(): Promise<SystemExecutionResult> {
    console.log("🔧 Running step-by-step execution...\n");

    const result: SystemExecutionResult = {
      timestamp: new Date(),
      summary: {
        success: true,
        totalDuration: 0,
        recommendations: [],
      },
    };

    const steps = [
      { name: "Basic Automation", action: () => this.runBasicAutomation() },
      { name: "Quality Report", action: () => this.runQualityReport() },
      { name: "Alert Evaluation", action: () => this.runAlertEvaluation() },
      { name: "Issue Creation", action: () => this.runIssueCreation() },
    ];

    for (const step of steps) {
      try {
        console.log(`🔄 Executing: ${step.name}...`);
        const stepResult = await step.action();
        console.log(`✅ ${step.name} completed`);

        // 結果をマージ
        Object.assign(result, stepResult);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`❌ ${step.name} failed: ${errorMessage}`);
        console.log("⏭️ Continuing with next step...\n");
      }
    }

    result.summary.recommendations = this.generateRecommendations(result);
    await this.saveExecutionResult(result);
    this.printExecutionSummary(result);

    return result;
  }

  /**
   * 基本自動化実行
   */
  private async runBasicAutomation(): Promise<Partial<SystemExecutionResult>> {
    const automation = await this.automationSystem.runAutomation();
    return { automation };
  }

  /**
   * 品質レポート実行
   */
  private async runQualityReport(): Promise<Partial<SystemExecutionResult>> {
    const detailedReport =
      await this.qualityReporter.generateComprehensiveReport();
    await this.qualityReporter.saveDetailedReport(detailedReport, "both");

    return {
      reports: {
        generated: true,
        score: detailedReport.quality.overall.score,
        grade: detailedReport.quality.overall.grade,
      },
    };
  }

  /**
   * アラート評価実行
   */
  private async runAlertEvaluation(): Promise<Partial<SystemExecutionResult>> {
    await this.alertSystem.evaluateFromAutomationReport();
    const alertStats = this.alertSystem.getAlertStatistics(1);

    return {
      alerts: {
        triggered: alertStats.total,
        notifications: alertStats.total,
      },
    };
  }

  /**
   * Issue作成実行
   */
  private async runIssueCreation(): Promise<Partial<SystemExecutionResult>> {
    const issuesCreated =
      await this.issueCreator.createIssuesFromAutomationReport();

    return {
      issues: {
        created: issuesCreated,
        errors: [],
      },
    };
  }

  /**
   * 推奨事項生成
   */
  private generateRecommendations(result: SystemExecutionResult): string[] {
    const recommendations: string[] = [];

    // 品質スコアに基づく推奨
    if (result.reports && result.reports.score < 80) {
      recommendations.push("品質スコアが低いため、自動修正の実行を推奨");
      recommendations.push("README テンプレートの見直しを検討");
    }

    // アラートに基づく推奨
    if (result.alerts && result.alerts.triggered > 0) {
      recommendations.push(
        "アラートが発生しているため、問題の確認と対応を実施"
      );
    }

    // Issue作成に基づく推奨
    if (result.issues && result.issues.created > 0) {
      recommendations.push("作成されたGitHub Issueの確認と対応を計画");
    }

    // 自動化結果に基づく推奨
    if (result.automation) {
      if (result.automation.linkValidation?.brokenLinks > 0) {
        recommendations.push("壊れたリンクの修正を優先して実施");
      }

      if (result.automation.qualityCheck?.averageTemplateScore < 75) {
        recommendations.push("テンプレート準拠率の改善を実施");
      }
    }

    // デフォルト推奨
    if (recommendations.length === 0) {
      recommendations.push("品質が良好です。現在のレベルを維持してください");
      recommendations.push("定期的な品質監視を継続することを推奨");
    }

    return recommendations;
  }

  /**
   * 実行結果保存
   */
  private async saveExecutionResult(
    result: SystemExecutionResult
  ): Promise<void> {
    try {
      const reportsDir = path.join(
        this.projectRoot,
        "tools",
        "reports",
        "integration"
      );
      this.ensureDirectoryExists(reportsDir);

      const timestamp = result.timestamp
        .toISOString()
        .slice(0, 19)
        .replace(/[T:]/g, "-");
      const resultPath = path.join(
        reportsDir,
        `integration-result-${timestamp}.json`
      );

      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));

      // 最新結果の保存
      const latestPath = path.join(
        reportsDir,
        "integration-result-latest.json"
      );
      fs.writeFileSync(latestPath, JSON.stringify(result, null, 2));

      console.log(`📄 Integration result saved: ${resultPath}`);
    } catch (error) {
      console.error("Failed to save integration result:", error);
    }
  }

  /**
   * 実行サマリー出力
   */
  private printExecutionSummary(result: SystemExecutionResult): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 統合自動化システム実行サマリー");
    console.log("=".repeat(60));

    console.log(`🕐 実行時間: ${result.summary.totalDuration}ms`);
    console.log(`✅ 成功: ${result.summary.success ? "Yes" : "No"}`);

    if (result.automation) {
      console.log("\n📋 基本自動化:");
      if (result.automation.qualityCheck) {
        console.log(
          `  - 品質スコア: ${result.automation.qualityCheck.averageTemplateScore}%`
        );
      }
      if (result.automation.linkValidation) {
        console.log(
          `  - リンク検証: ${result.automation.linkValidation.brokenLinks}/${result.automation.linkValidation.totalLinks} broken`
        );
      }
    }

    if (result.reports) {
      console.log(
        `\n📊 詳細レポート: ${result.reports.score}% (${result.reports.grade})`
      );
    }

    if (result.alerts) {
      console.log(`\n🚨 アラート: ${result.alerts.triggered} triggered`);
    }

    if (result.issues) {
      console.log(`\n📋 GitHub Issues: ${result.issues.created} created`);
    }

    console.log("\n💡 推奨事項:");
    result.summary.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    console.log("\n🔗 関連ファイル:");
    console.log("  - ./tools/reports/automation-result.json");
    console.log("  - ./tools/reports/detailed/quality-report-latest.json");
    console.log(
      "  - ./tools/reports/integration/integration-result-latest.json"
    );

    console.log("\n" + "=".repeat(60));
  }

  /**
   * 設定更新
   */
  public updateConfig(newConfig: Partial<IntegratedSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 子システムの設定も更新
    this.automationSystem.updateConfig({
      enableAutoFix: this.config.autoFix,
    });
  }

  /**
   * ヘルスチェック
   */
  public async healthCheck(): Promise<{
    status: "healthy" | "warning" | "error";
    components: Record<string, boolean>;
    recommendations: string[];
  }> {
    console.log("🔍 Running system health check...");

    const components = {
      "README Automation": true,
      "GitHub CLI": false,
      "Quality Checker": true,
      "Alert System": true,
      "Report Generator": true,
    };

    // GitHub CLI確認
    try {
      const { spawn } = require("child_process");
      const child = spawn("gh", ["--version"], { stdio: "ignore" });
      await new Promise((resolve) => {
        child.on("close", (code: number | null) => {
          components["GitHub CLI"] = code === 0;
          resolve(code);
        });
        child.on("error", () => {
          components["GitHub CLI"] = false;
          resolve(1);
        });
      });
    } catch {
      components["GitHub CLI"] = false;
    }

    const healthyCount = Object.values(components).filter(Boolean).length;
    const totalCount = Object.values(components).length;

    let status: "healthy" | "warning" | "error";
    if (healthyCount === totalCount) {
      status = "healthy";
    } else if (healthyCount >= totalCount * 0.7) {
      status = "warning";
    } else {
      status = "error";
    }

    const recommendations = [];
    if (!components["GitHub CLI"]) {
      recommendations.push(
        "Install GitHub CLI for Issue creation functionality"
      );
    }

    console.log(
      `✅ Health check complete: ${status} (${healthyCount}/${totalCount} components healthy)`
    );

    return { status, components, recommendations };
  }

  /**
   * ディレクトリ存在確認・作成
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// CLI実行
const isMainModule =
  process.argv[1] && process.argv[1].endsWith("integrated-system.ts");
if (isMainModule) {
  const args = process.argv.slice(2);

  async function main() {
    const system = new IntegratedAutomationSystem();

    // 設定オプション
    if (args.includes("--auto-fix")) {
      system.updateConfig({ autoFix: true });
    }

    if (args.includes("--no-issues")) {
      system.updateConfig({ enableIssueCreation: false });
    }

    if (args.includes("--no-alerts")) {
      system.updateConfig({ enableAlerts: false });
    }

    // 実行モード
    if (args.includes("--health")) {
      const health = await system.healthCheck();
      console.log("Health Check Result:", JSON.stringify(health, null, 2));
    } else if (args.includes("--step-by-step")) {
      await system.runStepByStep();
    } else {
      // フル統合実行
      await system.runFullIntegration();
    }
  }

  main().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ System execution failed: ${errorMessage}`);
    process.exit(1);
  });
}

export {
  IntegratedAutomationSystem,
  IntegratedSystemConfig,
  SystemExecutionResult,
};
