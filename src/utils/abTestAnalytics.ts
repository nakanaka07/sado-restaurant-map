/**
 * @fileoverview A/Bテスト分析・データ収集システム
 * A/Bテストの効果測定、ユーザー行動分析、統計的有意性検定
 *
 * 🎯 機能:
 * 1. A/Bテスト結果の収集・分析
 * 2. 統計的有意性の判定
 * 3. ユーザー行動メトリクスの追跡
 * 4. リアルタイムダッシュボード連携
 */

import type { ABTestVariant, UserSegment } from "@/config/abTestConfig";
import { trackEvent } from "./analytics";

// ==============================
// A/Bテスト分析型定義
// ==============================

/** A/Bテストイベントタイプ */
export type ABTestEventType =
  | "variant_assigned"
  | "marker_clicked"
  | "marker_hover"
  | "filter_used"
  | "search_performed"
  | "session_started"
  | "session_ended"
  | "error_encountered"
  | "performance_measured";

/** A/Bテストメトリクス */
export interface ABTestMetrics {
  readonly variant: ABTestVariant;
  readonly segment: UserSegment;
  readonly eventType: ABTestEventType;
  readonly eventData: Record<string, unknown>;
  readonly timestamp: number;
  readonly sessionId: string;
  readonly userId?: string | undefined;
}

/** パフォーマンス指標 */
export interface PerformanceMetrics {
  readonly renderTime: number; // レンダリング時間 (ms)
  readonly memoryUsage: number; // メモリ使用量 (MB)
  readonly bundleSize: number; // バンドルサイズ (KB)
  readonly interactionLatency: number; // インタラクション遅延 (ms)
  readonly errorRate: number; // エラー率 (%)
}

/** A/Bテスト結果サマリー */
export interface ABTestResultSummary {
  readonly variant: ABTestVariant;
  readonly totalSessions: number;
  readonly avgSessionDuration: number;
  readonly conversionRate: number; // 目標達成率
  readonly errorRate: number;
  readonly performanceScore: number; // パフォーマンス総合スコア
  readonly userSatisfaction: number; // ユーザー満足度
  readonly statisticalSignificance: number; // 統計的有意性 (p-value)
}

/** ダッシュボード表示用データ */
export interface DashboardData {
  readonly currentPhase: string;
  readonly rolloutPercentage: number;
  readonly totalParticipants: number;
  readonly variants: ABTestResultSummary[];
  readonly realtimeMetrics: {
    activeUsers: number;
    errorCount: number;
    averageLoadTime: number;
  };
  readonly recommendations: string[];
  readonly lastUpdated: string;
}

// ==============================
// データ収集・分析システム
// ==============================

class ABTestAnalyticsService {
  private readonly storageKey = "ab-test-metrics";
  private readonly maxStorageEntries = 10000;
  private sessionId: string;
  private metrics: ABTestMetrics[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredMetrics();
    this.setupPerformanceMonitoring();
  }

  /**
   * セッションID生成
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * 保存されたメトリクスの読み込み
   */
  private loadStoredMetrics(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.metrics = JSON.parse(stored) as ABTestMetrics[];

        // 古いデータのクリーンアップ (7日以上前)
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        this.metrics = this.metrics.filter(m => m.timestamp > weekAgo);
      }
    } catch (error) {
      console.warn("A/Bテストメトリクス読み込みエラー:", error);
      this.metrics = [];
    }
  }

  /**
   * メトリクスの保存
   */
  private saveMetrics(): void {
    try {
      // 保存数制限
      if (this.metrics.length > this.maxStorageEntries) {
        this.metrics = this.metrics.slice(-this.maxStorageEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(this.metrics));
    } catch (error) {
      console.warn("A/Bテストメトリクス保存エラー:", error);
    }
  }

  /**
   * パフォーマンス監視セットアップ
   */
  private setupPerformanceMonitoring(): void {
    // Core Web Vitals監視
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      try {
        // LCP (Largest Contentful Paint) 監視
        const lcpObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.trackPerformanceMetric("lcp", entry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

        // CLS (Cumulative Layout Shift) 監視
        const clsObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };
            if (
              !layoutShiftEntry.hadRecentInput &&
              layoutShiftEntry.value !== undefined
            ) {
              this.trackPerformanceMetric("cls", layoutShiftEntry.value);
            }
          }
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });

        // Event timing 監視 (INPの代用)
        const eventObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            const eventEntry = entry as PerformanceEntry & {
              processingDuration?: number;
              processingStart?: number;
              processingEnd?: number;
            };
            if (eventEntry.processingDuration !== undefined) {
              this.trackPerformanceMetric(
                "event_timing",
                eventEntry.processingDuration
              );
            }
          }
        });

        // event entryTypeをサポートしているかチェック
        if (PerformanceObserver.supportedEntryTypes?.includes("event")) {
          eventObserver.observe({ entryTypes: ["event"] });
        }
      } catch (error) {
        console.warn("パフォーマンス監視セットアップエラー:", error);
      }
    }
  }

  /**
   * A/Bテストイベント追跡
   */
  public trackABTestEvent(
    variant: ABTestVariant,
    segment: UserSegment,
    eventType: ABTestEventType,
    eventData: Record<string, unknown> = {},
    userId?: string
  ): void {
    const metric: ABTestMetrics = {
      variant,
      segment,
      eventType,
      eventData,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId,
    };

    this.metrics.push(metric);
    this.saveMetrics();

    // Google Analytics連携
    trackEvent("ab_test_event", {
      variant,
      segment,
      event_type: eventType,
      session_id: this.sessionId,
    });
  }

  /**
   * パフォーマンスメトリクス追跡
   */
  private trackPerformanceMetric(type: string, value: number): void {
    this.trackABTestEvent(
      "original", // デフォルトバリアント
      "general",
      "performance_measured",
      {
        metric_type: type,
        metric_value: value,
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      }
    );
  }

  /**
   * マーカークリック追跡
   */
  public trackMarkerClick(
    variant: ABTestVariant,
    segment: UserSegment,
    markerType: string,
    markerCategory: string,
    renderTime: number,
    userId?: string
  ): void {
    this.trackABTestEvent(
      variant,
      segment,
      "marker_clicked",
      {
        marker_type: markerType,
        marker_category: markerCategory,
        render_time: renderTime,
        interaction_latency: performance.now(),
      },
      userId
    );
  }

  /**
   * ユーザーセッション開始追跡
   */
  public trackSessionStart(
    variant: ABTestVariant,
    segment: UserSegment,
    userId?: string
  ): void {
    this.trackABTestEvent(
      variant,
      segment,
      "session_started",
      {
        device_type: this.getDeviceType(),
        browser_info: this.getBrowserInfo(),
        screen_resolution: `${screen.width}x${screen.height}`,
        connection_type: this.getConnectionType(),
      },
      userId
    );
  }

  /**
   * エラー発生追跡
   */
  public trackError(
    variant: ABTestVariant,
    segment: UserSegment,
    errorType: string,
    errorMessage: string,
    stackTrace?: string,
    userId?: string
  ): void {
    this.trackABTestEvent(
      variant,
      segment,
      "error_encountered",
      {
        error_type: errorType,
        error_message: errorMessage,
        stack_trace: stackTrace,
        url: window.location.href,
        user_agent: navigator.userAgent,
      },
      userId
    );
  }

  /**
   * バリアント別結果サマリー生成
   */
  public generateResultSummary(): ABTestResultSummary[] {
    const variantGroups = this.groupMetricsByVariant();
    const summaries: ABTestResultSummary[] = [];

    for (const [variant, metrics] of variantGroups.entries()) {
      const sessions = this.getUniqueSessions(metrics);
      const summary: ABTestResultSummary = {
        variant,
        totalSessions: sessions.length,
        avgSessionDuration: this.calculateAvgSessionDuration(metrics),
        conversionRate: this.calculateConversionRate(metrics),
        errorRate: this.calculateErrorRate(metrics),
        performanceScore: this.calculatePerformanceScore(metrics),
        userSatisfaction: this.calculateUserSatisfaction(metrics),
        statisticalSignificance: this.calculateStatisticalSignificance(metrics),
      };
      summaries.push(summary);
    }

    return summaries;
  }

  /**
   * リアルタイムダッシュボードデータ生成
   */
  public generateDashboardData(): DashboardData {
    const summaries = this.generateResultSummary();
    const recentMetrics = this.getRecentMetrics(60000); // 過去1分

    return {
      currentPhase: "phase2",
      rolloutPercentage: 50,
      totalParticipants: this.getUniqueUsers().length,
      variants: summaries,
      realtimeMetrics: {
        activeUsers: this.getActiveUsers(recentMetrics),
        errorCount: this.getErrorCount(recentMetrics),
        averageLoadTime: this.getAverageLoadTime(recentMetrics),
      },
      recommendations: this.generateRecommendations(summaries),
      lastUpdated: new Date().toISOString(),
    };
  }

  // ==============================
  // プライベートヘルパーメソッド
  // ==============================

  private groupMetricsByVariant(): Map<ABTestVariant, ABTestMetrics[]> {
    const groups = new Map<ABTestVariant, ABTestMetrics[]>();

    for (const metric of this.metrics) {
      if (!groups.has(metric.variant)) {
        groups.set(metric.variant, []);
      }
      const group = groups.get(metric.variant);
      if (group) {
        group.push(metric);
      }
    }

    return groups;
  }

  private getUniqueSessions(metrics: ABTestMetrics[]): string[] {
    return [...new Set(metrics.map(m => m.sessionId))];
  }

  private getUniqueUsers(): string[] {
    return [
      ...new Set(
        this.metrics
          .filter((m): m is ABTestMetrics & { userId: string } =>
            Boolean(m.userId)
          )
          .map(m => m.userId)
      ),
    ];
  }

  private calculateAvgSessionDuration(metrics: ABTestMetrics[]): number {
    const sessions = this.getUniqueSessions(metrics);
    let totalDuration = 0;

    for (const sessionId of sessions) {
      const sessionMetrics = metrics.filter(m => m.sessionId === sessionId);
      if (sessionMetrics.length > 0) {
        const start = Math.min(...sessionMetrics.map(m => m.timestamp));
        const end = Math.max(...sessionMetrics.map(m => m.timestamp));
        totalDuration += end - start;
      }
    }

    return sessions.length > 0 ? totalDuration / sessions.length / 1000 : 0; // 秒単位
  }

  private calculateConversionRate(metrics: ABTestMetrics[]): number {
    const totalSessions = this.getUniqueSessions(metrics).length;
    if (totalSessions === 0) return 0;

    // コンバージョン = マーカークリック + フィルター使用
    const conversionEvents = metrics.filter(
      m => m.eventType === "marker_clicked" || m.eventType === "filter_used"
    );
    const conversionSessions = this.getUniqueSessions(conversionEvents).length;

    return conversionSessions / totalSessions;
  }

  private calculateErrorRate(metrics: ABTestMetrics[]): number {
    const totalEvents = metrics.length;
    if (totalEvents === 0) return 0;

    const errorEvents = metrics.filter(
      m => m.eventType === "error_encountered"
    );
    return errorEvents.length / totalEvents;
  }

  private calculatePerformanceScore(metrics: ABTestMetrics[]): number {
    const perfMetrics = metrics.filter(
      m => m.eventType === "performance_measured"
    );
    if (perfMetrics.length === 0) return 0;

    // パフォーマンススコア計算 (0-100)
    let score = 100;

    for (const metric of perfMetrics) {
      const type = metric.eventData.metric_type as string;
      const value = metric.eventData.metric_value as number;

      switch (type) {
        case "lcp":
          score -= this.calculateLCPPenalty(value);
          break;
        case "cls":
          score -= this.calculateCLSPenalty(value);
          break;
        case "inp":
        case "event_timing":
          score -= this.calculateInteractionPenalty(value);
          break;
      }
    }

    return Math.max(0, score);
  }

  private calculateLCPPenalty(value: number): number {
    if (value > 2500) return 20;
    if (value > 1200) return 10;
    return 0;
  }

  private calculateCLSPenalty(value: number): number {
    if (value > 0.25) return 15;
    if (value > 0.1) return 5;
    return 0;
  }

  private calculateInteractionPenalty(value: number): number {
    if (value > 200) return 15;
    if (value > 100) return 5;
    return 0;
  }

  private calculateUserSatisfaction(metrics: ABTestMetrics[]): number {
    // ユーザー満足度の代理指標
    const conversionRate = this.calculateConversionRate(metrics);
    const errorRate = this.calculateErrorRate(metrics);
    const avgSessionDuration = this.calculateAvgSessionDuration(metrics);

    // 満足度スコア計算 (0-100)
    const score =
      conversionRate * 40 + // コンバージョン率の重み: 40%
      (1 - errorRate) * 30 + // エラー率の逆数の重み: 30%
      Math.min(avgSessionDuration / 120, 1) * 30; // セッション時間の重み: 30% (上限2分)

    return Math.round(score * 100) / 100;
  }

  private calculateStatisticalSignificance(metrics: ABTestMetrics[]): number {
    // 簡易的なp-value計算 (実際の実装では適切な統計手法を使用)
    const sampleSize = this.getUniqueSessions(metrics).length;

    if (sampleSize < 30) return 1.0; // サンプルサイズが小さすぎる

    // 仮の計算 (実際にはt検定やカイ二乗検定を使用)
    const conversionRate = this.calculateConversionRate(metrics);
    const expectedRate = 0.1; // 期待コンバージョン率10%

    const zScore =
      Math.abs(conversionRate - expectedRate) /
      Math.sqrt((expectedRate * (1 - expectedRate)) / sampleSize);

    // 正規分布における片側検定のp-value近似
    return Math.max(0.001, 1 - zScore * 0.1);
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad/.test(userAgent)) return "mobile";
    if (/tablet/.test(userAgent)) return "tablet";
    return "desktop";
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  }

  private getConnectionType(): string {
    // ブラウザ接続情報APIの安全なアクセス
    try {
      // モダンブラウザのNetwork Information API対応
      const connection =
        (
          navigator as Navigator & {
            connection?: { effectiveType?: string };
            mozConnection?: { effectiveType?: string };
            webkitConnection?: { effectiveType?: string };
          }
        ).connection ||
        (
          navigator as Navigator & {
            mozConnection?: { effectiveType?: string };
          }
        ).mozConnection ||
        (
          navigator as Navigator & {
            webkitConnection?: { effectiveType?: string };
          }
        ).webkitConnection;

      return connection?.effectiveType || "unknown";
    } catch (error) {
      console.warn("接続情報の取得に失敗:", error);
      return "unknown";
    }
  }

  private getRecentMetrics(timeWindow: number): ABTestMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  private getActiveUsers(metrics: ABTestMetrics[]): number {
    return this.getUniqueSessions(metrics).length;
  }

  private getErrorCount(metrics: ABTestMetrics[]): number {
    return metrics.filter(m => m.eventType === "error_encountered").length;
  }

  private getAverageLoadTime(metrics: ABTestMetrics[]): number {
    const lcpMetrics = metrics.filter(
      m =>
        m.eventType === "performance_measured" &&
        m.eventData.metric_type === "lcp"
    );

    if (lcpMetrics.length === 0) return 0;

    const totalTime = lcpMetrics.reduce(
      (sum, m) => sum + (m.eventData.metric_value as number),
      0
    );

    return totalTime / lcpMetrics.length;
  }

  private generateRecommendations(summaries: ABTestResultSummary[]): string[] {
    const recommendations: string[] = [];

    if (summaries.length < 2) {
      recommendations.push("複数バリアントでのテストを開始してください");
      return recommendations;
    }

    // 最高パフォーマンスバリアント特定
    const bestVariant = summaries.reduce((best, current) =>
      current.performanceScore > best.performanceScore ? current : best
    );

    if (bestVariant.statisticalSignificance < 0.05) {
      recommendations.push(
        `${bestVariant.variant} バリアントが統計的に有意な改善を示しています (p=${bestVariant.statisticalSignificance.toFixed(3)})`
      );

      if (bestVariant.conversionRate > 0.15) {
        recommendations.push(
          "コンバージョン率が良好です。Phase 3への移行を検討できます"
        );
      }

      if (bestVariant.errorRate < 0.01) {
        recommendations.push("エラー率が低く安定しています");
      }
    } else {
      recommendations.push(
        "まだ統計的有意性に達していません。もう少しデータ収集を継続してください"
      );
    }

    // パフォーマンス改善提案
    const avgPerformanceScore =
      summaries.reduce((sum, s) => sum + s.performanceScore, 0) /
      summaries.length;
    if (avgPerformanceScore < 80) {
      recommendations.push(
        "パフォーマンススコアが低めです。最適化を検討してください"
      );
    }

    return recommendations;
  }
}

// ==============================
// シングルトンインスタンス・エクスポート
// ==============================

export const abTestAnalytics = new ABTestAnalyticsService();

// 開発環境でのグローバル公開
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // @ts-expect-error - 開発用のグローバル変数設定
  window.abTestAnalytics = abTestAnalytics;
}

// ==============================
// ユーティリティ関数
// ==============================

/**
 * A/Bテスト結果の簡易表示
 */
export function displayABTestResults(): void {
  const data = abTestAnalytics.generateDashboardData();

  console.group("📊 A/Bテスト結果サマリー");
  console.log(`フェーズ: ${data.currentPhase} (${data.rolloutPercentage}%)`);
  console.log(`総参加者: ${data.totalParticipants}`);
  console.log(`アクティブユーザー: ${data.realtimeMetrics.activeUsers}`);

  console.group("バリアント別結果:");
  for (const variant of data.variants) {
    console.log(`${variant.variant}:`, {
      セッション数: variant.totalSessions,
      コンバージョン率: `${(variant.conversionRate * 100).toFixed(2)}%`,
      エラー率: `${(variant.errorRate * 100).toFixed(2)}%`,
      パフォーマンス: `${variant.performanceScore.toFixed(1)}/100`,
      統計的有意性: `p=${variant.statisticalSignificance.toFixed(3)}`,
    });
  }
  console.groupEnd();

  console.group("推奨事項:");
  for (const recommendation of data.recommendations) {
    console.log(`• ${recommendation}`);
  }
  console.groupEnd();

  console.groupEnd();
}
