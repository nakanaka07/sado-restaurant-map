#!/usr/bin/env node

/**
 * 高度化アラートシステム
 * 多チャンネル通知・閾値監視・エスカレーション機能を提供
 */

import * as fs from "fs";
import * as path from "path";
import { GitHubIssueCreator } from "../github/issue-creator";

interface AlertChannel {
  type: "console" | "email" | "slack" | "teams" | "github" | "discord";
  config: Record<string, any>;
  enabled: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: ">" | "<" | ">=" | "<=" | "==" | "!=";
    threshold: number;
    duration?: number; // 継続時間（分）
  };
  severity: "info" | "warning" | "error" | "critical";
  channels: string[]; // 通知チャンネルID
  escalation?: {
    enabled: boolean;
    delay: number; // エスカレーション遅延（分）
    channels: string[]; // エスカレーション先
  };
  suppressionTime: number; // 抑制時間（分）
}

interface AlertEvent {
  id: string;
  ruleId: string;
  timestamp: Date;
  severity: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  source: string;
  metadata?: Record<string, any>;
}

interface AlertHistory {
  events: AlertEvent[];
  lastNotification: Record<string, Date>; // ruleId -> last notification time
  escalations: Record<string, Date>; // ruleId -> escalation time
}

class AdvancedAlertSystem {
  private projectRoot: string;
  private configPath: string;
  private historyPath: string;
  private channels: Map<string, AlertChannel>;
  private rules: Map<string, AlertRule>;
  private history: AlertHistory;
  private issueCreator: GitHubIssueCreator;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(
      projectRoot,
      "tools",
      "automation",
      "alerts",
      "config.json"
    );
    this.historyPath = path.join(
      projectRoot,
      "tools",
      "automation",
      "alerts",
      "history.json"
    );

    this.channels = new Map();
    this.rules = new Map();
    this.history = { events: [], lastNotification: {}, escalations: {} };

    this.issueCreator = new GitHubIssueCreator(projectRoot);

    this.initialize();
  }

  /**
   * システム初期化
   */
  private initialize(): void {
    this.ensureDirectoryExists(path.dirname(this.configPath));
    this.loadConfiguration();
    this.loadHistory();
  }

  /**
   * ディレクトリ作成
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * 設定読み込み
   */
  private loadConfiguration(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, "utf-8"));

        // チャンネル設定読み込み
        if (config.channels) {
          for (const [id, channel] of Object.entries(config.channels)) {
            this.channels.set(id, channel as AlertChannel);
          }
        }

        // ルール設定読み込み
        if (config.rules) {
          for (const [id, rule] of Object.entries(config.rules)) {
            this.rules.set(id, rule as AlertRule);
          }
        }
      } else {
        // デフォルト設定作成
        this.createDefaultConfiguration();
      }
    } catch (error) {
      console.error("Failed to load alert configuration:", error);
      this.createDefaultConfiguration();
    }
  }

  /**
   * デフォルト設定作成
   */
  private createDefaultConfiguration(): void {
    const defaultConfig = {
      channels: {
        console: {
          type: "console",
          config: {},
          enabled: true,
        },
        github: {
          type: "github",
          config: {
            repository: "auto-detect",
          },
          enabled: true,
        },
      },
      rules: {
        quality_degradation: {
          id: "quality_degradation",
          name: "品質劣化検出",
          description: "README品質スコアが閾値を下回った場合",
          condition: {
            metric: "quality.template_score",
            operator: "<",
            threshold: 75,
          },
          severity: "warning",
          channels: ["console", "github"],
          suppressionTime: 60,
        },
        quality_critical: {
          id: "quality_critical",
          name: "品質重大劣化",
          description: "README品質スコアが危険レベルに達した場合",
          condition: {
            metric: "quality.template_score",
            operator: "<",
            threshold: 60,
          },
          severity: "critical",
          channels: ["console", "github"],
          escalation: {
            enabled: true,
            delay: 30,
            channels: ["github"],
          },
          suppressionTime: 30,
        },
        link_failures: {
          id: "link_failures",
          name: "リンク切れ検出",
          description: "壊れたリンクが検出された場合",
          condition: {
            metric: "links.broken_count",
            operator: ">",
            threshold: 0,
          },
          severity: "error",
          channels: ["console", "github"],
          suppressionTime: 120,
        },
        test_failures: {
          id: "test_failures",
          name: "テスト失敗検出",
          description: "テストが失敗した場合",
          condition: {
            metric: "test.failed_count",
            operator: ">",
            threshold: 0,
          },
          severity: "error",
          channels: ["console", "github"],
          suppressionTime: 30,
        },
        security_vulnerabilities: {
          id: "security_vulnerabilities",
          name: "セキュリティ脆弱性検出",
          description: "セキュリティ脆弱性が検出された場合",
          condition: {
            metric: "security.vulnerability_count",
            operator: ">",
            threshold: 0,
          },
          severity: "critical",
          channels: ["console", "github"],
          escalation: {
            enabled: true,
            delay: 15,
            channels: ["github"],
          },
          suppressionTime: 60,
        },
      },
    };

    this.saveConfiguration(defaultConfig);
    this.loadConfiguration();
  }

  /**
   * 設定保存
   */
  private saveConfiguration(config: any): void {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * 履歴読み込み
   */
  private loadHistory(): void {
    try {
      if (fs.existsSync(this.historyPath)) {
        const historyData = JSON.parse(
          fs.readFileSync(this.historyPath, "utf-8")
        );
        this.history = {
          events:
            historyData.events?.map((e: any) => ({
              ...e,
              timestamp: new Date(e.timestamp),
            })) || [],
          lastNotification: this.parseTimestampRecord(
            historyData.lastNotification
          ),
          escalations: this.parseTimestampRecord(historyData.escalations),
        };
      }
    } catch (error) {
      console.error("Failed to load alert history:", error);
      this.history = { events: [], lastNotification: {}, escalations: {} };
    }
  }

  /**
   * タイムスタンプレコード解析
   */
  private parseTimestampRecord(record: any): Record<string, Date> {
    const result: Record<string, Date> = {};
    if (record) {
      for (const [key, value] of Object.entries(record)) {
        result[key] = new Date(value as string);
      }
    }
    return result;
  }

  /**
   * 履歴保存
   */
  private saveHistory(): void {
    try {
      const historyData = {
        events: this.history.events,
        lastNotification: this.serializeTimestampRecord(
          this.history.lastNotification
        ),
        escalations: this.serializeTimestampRecord(this.history.escalations),
      };
      fs.writeFileSync(this.historyPath, JSON.stringify(historyData, null, 2));
    } catch (error) {
      console.error("Failed to save alert history:", error);
    }
  }

  /**
   * タイムスタンプレコードシリアライズ
   */
  private serializeTimestampRecord(
    record: Record<string, Date>
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      result[key] = value.toISOString();
    }
    return result;
  }

  /**
   * メトリクス監視・アラート評価
   */
  public async evaluateMetrics(metrics: Record<string, number>): Promise<void> {
    console.log("🔍 Evaluating metrics for alerts...");
    console.log("Metrics:", metrics);

    for (const [, rule] of this.rules) {
      const metricValue = this.getNestedValue(metrics, rule.condition.metric);

      if (metricValue === undefined) {
        console.log(`⚠️ Metric not found: ${rule.condition.metric}`);
        continue;
      }

      // 条件評価
      const conditionMet = this.evaluateCondition(
        metricValue,
        rule.condition.operator,
        rule.condition.threshold
      );

      if (conditionMet) {
        console.log(`🚨 Alert condition met for rule: ${rule.name}`);
        await this.triggerAlert(rule, metricValue, metrics);
      }
    }
  }

  /**
   * ネストされた値取得
   */
  private getNestedValue(obj: any, path: string): number | undefined {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return typeof current === "number" ? current : undefined;
  }

  /**
   * 条件評価
   */
  private evaluateCondition(
    value: number,
    operator: string,
    threshold: number
  ): boolean {
    switch (operator) {
      case ">":
        return value > threshold;
      case "<":
        return value < threshold;
      case ">=":
        return value >= threshold;
      case "<=":
        return value <= threshold;
      case "==":
        return value === threshold;
      case "!=":
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * アラート発火
   */
  private async triggerAlert(
    rule: AlertRule,
    value: number,
    allMetrics: Record<string, number>
  ): Promise<void> {
    const now = new Date();

    // 抑制時間チェック
    if (this.isSuppressionActive(rule.id, now)) {
      console.log(`⏰ Alert suppressed for rule: ${rule.name}`);
      return;
    }

    // アラートイベント作成
    const alertEvent: AlertEvent = {
      id: this.generateEventId(),
      ruleId: rule.id,
      timestamp: now,
      severity: rule.severity,
      title: rule.name,
      message: this.formatAlertMessage(rule, value),
      metric: rule.condition.metric,
      value: value,
      threshold: rule.condition.threshold,
      source: "automation-system",
      metadata: allMetrics,
    };

    // イベント保存
    this.history.events.push(alertEvent);
    this.history.lastNotification[rule.id] = now;

    // 通知送信
    await this.sendNotifications(alertEvent, rule.channels);

    // エスカレーション設定
    if (rule.escalation?.enabled) {
      setTimeout(async () => {
        await this.handleEscalation(alertEvent, rule);
      }, rule.escalation.delay * 60 * 1000);
    }

    // 履歴保存
    this.saveHistory();

    console.log(`📢 Alert triggered: ${alertEvent.title}`);
  }

  /**
   * 抑制時間確認
   */
  private isSuppressionActive(ruleId: string, currentTime: Date): boolean {
    const lastNotification = this.history.lastNotification[ruleId];
    if (!lastNotification) return false;

    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    const suppressionDuration = rule.suppressionTime * 60 * 1000; // ms
    const timeSinceLastNotification =
      currentTime.getTime() - lastNotification.getTime();

    return timeSinceLastNotification < suppressionDuration;
  }

  /**
   * アラートメッセージフォーマット
   */
  private formatAlertMessage(rule: AlertRule, value: number): string {
    return `${rule.description}

**詳細**:
- メトリクス: ${rule.condition.metric}
- 現在値: ${value}
- 閾値: ${rule.condition.threshold}
- 条件: ${rule.condition.operator}
- 時刻: ${new Date().toISOString()}

${rule.severity === "critical" ? "🚨 **即座の対応が必要です**" : ""}`;
  }

  /**
   * 通知送信
   */
  private async sendNotifications(
    event: AlertEvent,
    channelIds: string[]
  ): Promise<void> {
    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) {
        console.log(`⚠️ Channel not available: ${channelId}`);
        continue;
      }

      try {
        await this.sendToChannel(event, channel);
        console.log(`✅ Notification sent to ${channel.type}`);
      } catch (error) {
        console.error(
          `❌ Failed to send notification to ${channel.type}:`,
          error
        );
      }
    }
  }

  /**
   * チャンネル別通知送信
   */
  private async sendToChannel(
    event: AlertEvent,
    channel: AlertChannel
  ): Promise<void> {
    switch (channel.type) {
      case "console":
        this.sendConsoleNotification(event);
        break;
      case "github":
        await this.sendGitHubNotification(event);
        break;
      case "slack":
        await this.sendSlackNotification(event, channel.config);
        break;
      case "teams":
        await this.sendTeamsNotification(event, channel.config);
        break;
      case "email":
        await this.sendEmailNotification(event, channel.config);
        break;
      case "discord":
        await this.sendDiscordNotification(event, channel.config);
        break;
    }
  }

  /**
   * コンソール通知
   */
  private sendConsoleNotification(event: AlertEvent): void {
    const emoji = this.getSeverityEmoji(event.severity);

    console.log(`\n${emoji} ALERT: ${event.title}`);
    console.log(`Severity: ${event.severity.toUpperCase()}`);
    console.log(`Message: ${event.message}`);
    console.log(`Timestamp: ${event.timestamp.toISOString()}\n`);
  }

  /**
   * GitHub Issue通知
   */
  private async sendGitHubNotification(event: AlertEvent): Promise<void> {
    // GitHub Issue作成は適切なメソッドを呼び出し
    switch (event.ruleId) {
      case "quality_degradation":
      case "quality_critical":
        await this.issueCreator.createQualityIssue(
          "Multiple files",
          event.value,
          event.message
        );
        break;
      case "link_failures":
        await this.issueCreator.createLinkIssue("Multiple files", [
          `${event.value} broken links detected`,
        ]);
        break;
      case "test_failures":
        await this.issueCreator.createTestFailureIssue([
          `${event.value} tests failed`,
        ]);
        break;
      case "security_vulnerabilities":
        await this.issueCreator.createSecurityIssue([
          `${event.value} vulnerabilities detected`,
        ]);
        break;
    }
  }

  /**
   * Slack通知
   */
  private async sendSlackNotification(
    event: AlertEvent,
    config: any
  ): Promise<void> {
    if (!config.webhookUrl) {
      throw new Error("Slack webhook URL not configured");
    }

    const payload = {
      text: `🚨 Alert: ${event.title}`,
      attachments: [
        {
          color: this.getSeverityColor(event.severity),
          fields: [
            {
              title: "Severity",
              value: event.severity.toUpperCase(),
              short: true,
            },
            { title: "Metric", value: event.metric, short: true },
            { title: "Value", value: event.value.toString(), short: true },
            {
              title: "Threshold",
              value: event.threshold.toString(),
              short: true,
            },
          ],
          text: event.message,
          ts: Math.floor(event.timestamp.getTime() / 1000),
        },
      ],
    };

    // 実装：Slack Webhook呼び出し
    console.log(
      "Slack notification payload:",
      JSON.stringify(payload, null, 2)
    );
  }

  /**
   * Teams通知
   */
  private async sendTeamsNotification(
    event: AlertEvent,
    config: any
  ): Promise<void> {
    // Microsoft Teams Webhook実装
    console.log("Teams notification would be sent for:", event.title);
  }

  /**
   * Email通知
   */
  private async sendEmailNotification(
    event: AlertEvent,
    config: any
  ): Promise<void> {
    // Email送信実装
    console.log("Email notification would be sent for:", event.title);
  }

  /**
   * Discord通知
   */
  private async sendDiscordNotification(
    event: AlertEvent,
    config: any
  ): Promise<void> {
    // Discord Webhook実装
    console.log("Discord notification would be sent for:", event.title);
  }

  /**
   * エスカレーション処理
   */
  private async handleEscalation(
    event: AlertEvent,
    rule: AlertRule
  ): Promise<void> {
    if (!rule.escalation) return;

    // エスカレーション済みかチェック
    const escalationTime = this.history.escalations[rule.id];
    if (escalationTime) {
      const timeSinceEscalation = Date.now() - escalationTime.getTime();
      if (timeSinceEscalation < rule.escalation.delay * 60 * 1000) {
        return; // まだエスカレーション待機中
      }
    }

    // エスカレーション通知
    const escalatedEvent: AlertEvent = {
      ...event,
      id: this.generateEventId(),
      title: `🔥 ESCALATED: ${event.title}`,
      message: `**エスカレーション通知**\n\n${
        event.message
      }\n\n**初回発生時刻**: ${event.timestamp.toISOString()}\n**エスカレーション時刻**: ${new Date().toISOString()}`,
      timestamp: new Date(),
    };

    this.history.escalations[rule.id] = new Date();
    await this.sendNotifications(escalatedEvent, rule.escalation.channels);

    console.log(`🔥 Alert escalated: ${escalatedEvent.title}`);
  }

  /**
   * 重要度絵文字取得
   */
  private getSeverityEmoji(severity: string): string {
    const emojiMap: Record<string, string> = {
      info: "ℹ️",
      warning: "⚠️",
      error: "❌",
      critical: "🚨",
    };
    return emojiMap[severity] || "📢";
  }

  /**
   * 重要度色取得
   */
  private getSeverityColor(severity: string): string {
    const colorMap: Record<string, string> = {
      info: "#0066cc",
      warning: "#ff9900",
      error: "#cc0000",
      critical: "#ff0000",
    };
    return colorMap[severity] || "#666666";
  }

  /**
   * イベントID生成
   */
  private generateEventId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 自動化レポートからメトリクス抽出・評価
   */
  public async evaluateFromAutomationReport(
    reportPath?: string
  ): Promise<void> {
    const defaultReportPath = path.join(
      this.projectRoot,
      "tools",
      "reports",
      "automation-result.json"
    );

    const actualReportPath = reportPath || defaultReportPath;

    try {
      if (!fs.existsSync(actualReportPath)) {
        console.log(`⚠️ Automation report not found: ${actualReportPath}`);
        return;
      }

      const report = JSON.parse(fs.readFileSync(actualReportPath, "utf-8"));
      const metrics: Record<string, number> = {};

      // メトリクス抽出
      if (report.qualityCheck) {
        metrics["quality.template_score"] =
          report.qualityCheck.averageTemplateScore || 0;
        metrics["quality.scrap_score"] =
          report.qualityCheck.averageSCRAPScore || 0;
        metrics["quality.files_assessed"] =
          report.qualityCheck.filesAssessed || 0;
      }

      if (report.linkValidation) {
        metrics["links.broken_count"] = report.linkValidation.brokenLinks || 0;
        metrics["links.total_count"] = report.linkValidation.totalLinks || 0;
        metrics["links.success_rate"] =
          report.linkValidation.totalLinks > 0
            ? ((report.linkValidation.totalLinks -
                report.linkValidation.brokenLinks) /
                report.linkValidation.totalLinks) *
              100
            : 100;
      }

      if (report.techStackSync) {
        metrics["techstack.files_updated"] =
          report.techStackSync.filesUpdated || 0;
        metrics["techstack.errors"] = report.techStackSync.errors?.length || 0;
      }

      // アラート評価実行
      await this.evaluateMetrics(metrics);
    } catch (error) {
      console.error("Failed to evaluate automation report:", error);
    }
  }

  /**
   * アラート履歴取得
   */
  public getAlertHistory(days: number = 7): AlertEvent[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.history.events.filter((event) => event.timestamp >= cutoffDate);
  }

  /**
   * アラート統計取得
   */
  public getAlertStatistics(days: number = 7): Record<string, any> {
    const recentEvents = this.getAlertHistory(days);

    const stats = {
      total: recentEvents.length,
      bySeverity: {} as Record<string, number>,
      byRule: {} as Record<string, number>,
      lastDay: recentEvents.filter(
        (e) => e.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
    };

    for (const event of recentEvents) {
      stats.bySeverity[event.severity] =
        (stats.bySeverity[event.severity] || 0) + 1;
      stats.byRule[event.ruleId] = (stats.byRule[event.ruleId] || 0) + 1;
    }

    return stats;
  }
}

// CLI実行
const isMainModule =
  process.argv[1] && process.argv[1].endsWith("advanced-alert-system.ts");
if (isMainModule) {
  const args = process.argv.slice(2);

  async function main() {
    const alertSystem = new AdvancedAlertSystem();

    if (args.includes("--evaluate")) {
      await alertSystem.evaluateFromAutomationReport();
    } else if (args.includes("--stats")) {
      const days = parseInt(args[args.indexOf("--stats") + 1] || "7");
      const stats = alertSystem.getAlertStatistics(days);
      console.log("Alert Statistics:", JSON.stringify(stats, null, 2));
    } else if (args.includes("--history")) {
      const days = parseInt(args[args.indexOf("--history") + 1] || "7");
      const history = alertSystem.getAlertHistory(days);
      console.log(
        `Alert History (${days} days):`,
        JSON.stringify(history, null, 2)
      );
    } else {
      console.log("Advanced Alert System");
      console.log("Usage:");
      console.log("  --evaluate  Evaluate metrics from automation report");
      console.log("  --stats [days]  Show alert statistics");
      console.log("  --history [days]  Show alert history");
    }
  }

  main().catch(console.error);
}

export {
  AdvancedAlertSystem,
  AlertChannel,
  AlertEvent,
  AlertHistory,
  AlertRule,
};
