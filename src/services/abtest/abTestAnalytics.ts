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
import { trackEvent } from "@/utils/analytics";

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

// ==============================
// データ収集・分析システム
// ==============================

export class ABTestAnalyticsService {
  private readonly storageKey = "ab-test-metrics";
  private readonly maxStorageEntries = 10000;
  private readonly sessionId: string;
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
      console.error(
        "ABTestAnalytics data submission error:",
        error instanceof Error ? error.message : String(error)
      );
      this.metrics = [];
    }
  }

  /**
   * メトリクスの保存
   *
   * NOTE: localStorage.setItem エラー（QuotaExceededError等）は
   * try-catch で補足し、console.warn で通知。
   * エラー時もアプリケーションは正常動作を継続。
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

  // ==============================
  // プライベートヘルパーメソッド
  // ==============================

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
}

// ==============================
// シングルトンインスタンス・エクスポート
// ==============================

export const abTestAnalytics = new ABTestAnalyticsService();

// 開発環境でのグローバル公開（Vite: import.meta.env.DEV）
if (typeof window !== "undefined" && import.meta.env.DEV) {
  // @ts-expect-error - 開発用のグローバル変数設定
  window.abTestAnalytics = abTestAnalytics;
}

// ==============================
// 開発環境デバッグ用ユーティリティ
// ==============================

/**
 * 収集したメトリクスの基本情報をコンソール出力（開発用）
 */
export function debugMetrics(): void {
  if (!import.meta.env.DEV) return;

  console.group("📊 A/Bテストメトリクス");
  console.log("総イベント数:", abTestAnalytics["metrics"].length);
  console.log("セッションID:", abTestAnalytics["sessionId"]);
  console.groupEnd();
}
