/**
 * @fileoverview A/Bテスト リアルタイム監視システム
 * リアルタイムアラート、自動判定ロジック、性能劣化検知
 *
 * 🎯 機能:
 * 1. リアルタイムメトリクス監視
 * 2. 閾値ベースアラートシステム
 * 3. 性能劣化自動検知
 * 4. Phase移行自動判定
 * 5. ロールバック条件監視
 */

import type { MigrationReadinessCheck } from "@/config/phase3MigrationPlan";
import { evaluatePhase3Readiness } from "@/config/phase3MigrationPlan";
import { abTestAnalytics } from "@/utils/abTestAnalytics";

// ==============================
// 監視システム型定義
// ==============================

/** アラート重要度 */
export type AlertSeverity = "critical" | "high" | "medium" | "low";

/** アラートタイプ */
export type AlertType =
  | "performance_degradation"
  | "error_rate_spike"
  | "statistical_significance"
  | "user_satisfaction_drop"
  | "rollback_required"
  | "phase_migration_ready";

/** アラート情報 */
export interface Alert {
  readonly id: string;
  readonly type: AlertType;
  readonly severity: AlertSeverity;
  readonly title: string;
  readonly message: string;
  readonly timestamp: string;
  readonly acknowledged: boolean;
  readonly metrics: Record<string, number>;
  readonly recommendedActions: string[];
}

/** 監視設定 */
export interface MonitoringConfig {
  readonly enabled: boolean;
  readonly checkInterval: number; // 秒
  readonly alertThresholds: Record<string, number>;
  readonly retentionPeriod: number; // 時間
  readonly notificationChannels: string[];
}

/** リアルタイムメトリクス */
export interface RealtimeMetrics {
  readonly timestamp: string;
  readonly activeUsers: number;
  readonly errorRate: number;
  readonly averageLoadTime: number;
  readonly performanceScore: number;
  readonly conversionRate: number;
  readonly userSatisfaction: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
}

/** 監視状態 */
export interface MonitoringState {
  readonly isMonitoring: boolean;
  readonly currentMetrics: RealtimeMetrics;
  readonly alerts: Alert[];
  readonly lastCheck: string;
  readonly migrationReadiness: MigrationReadinessCheck | null;
}

// ==============================
// 監視システム設定
// ==============================

const MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  checkInterval: 30, // 30秒ごと
  retentionPeriod: 72, // 72時間
  notificationChannels: ["console", "localStorage"],

  alertThresholds: {
    // エラー率（%）
    error_rate_warning: 2,
    error_rate_critical: 5,

    // パフォーマンススコア
    performance_warning: 70,
    performance_critical: 50,

    // 読み込み時間（ms）
    load_time_warning: 3000,
    load_time_critical: 5000,

    // ユーザー満足度（%）
    satisfaction_warning: 75,
    satisfaction_critical: 60,

    // メモリ使用率（%）
    memory_warning: 80,
    memory_critical: 90,

    // CPU使用率（%）
    cpu_warning: 70,
    cpu_critical: 85,
  },
} as const;

// ==============================
// リアルタイム監視クラス
// ==============================

class ABTestMonitoringSystem {
  private intervalId: NodeJS.Timeout | null = null;
  private state: MonitoringState;
  private metricsHistory: RealtimeMetrics[] = [];
  private alertHistory: Alert[] = [];

  constructor() {
    this.state = {
      isMonitoring: false,
      currentMetrics: this.generateMockMetrics(),
      alerts: [],
      lastCheck: new Date().toISOString(),
      migrationReadiness: null,
    };

    // 初期化時にローカルストレージから履歴を復元
    this.loadHistoryFromStorage();
  }

  /**
   * 監視を開始
   */
  startMonitoring(): void {
    if (this.state.isMonitoring) {
      console.warn("監視は既に開始されています");
      return;
    }

    console.log("🔍 A/Bテスト監視システムを開始しました");

    this.state = {
      ...this.state,
      isMonitoring: true,
    };

    // 定期的なメトリクス収集を開始
    this.intervalId = setInterval(() => {
      this.collectMetrics();
      this.checkAlertConditions();
      this.evaluateMigrationReadiness();
    }, MONITORING_CONFIG.checkInterval * 1000);

    // 初回実行
    this.collectMetrics();
    this.checkAlertConditions();
  }

  /**
   * 監視を停止
   */
  stopMonitoring(): void {
    if (!this.state.isMonitoring) {
      console.warn("監視は開始されていません");
      return;
    }

    console.log("⏹️ A/Bテスト監視システムを停止しました");

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.state = {
      ...this.state,
      isMonitoring: false,
    };
  }

  /**
   * 現在の監視状態を取得
   */
  getMonitoringState(): MonitoringState {
    return { ...this.state };
  }

  /**
   * メトリクス履歴を取得
   */
  getMetricsHistory(hours = 24): RealtimeMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(
      metrics => new Date(metrics.timestamp) > cutoff
    );
  }

  /**
   * アラート履歴を取得
   */
  getAlertHistory(hours = 24): Alert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alertHistory.filter(
      alert => new Date(alert.timestamp) > cutoff
    );
  }

  /**
   * アラートを確認済みにマーク
   */
  acknowledgeAlert(alertId: string): boolean {
    const alertIndex = this.state.alerts.findIndex(
      alert => alert.id === alertId
    );

    if (alertIndex === -1) {
      return false;
    }

    this.state.alerts[alertIndex] = {
      ...this.state.alerts[alertIndex],
      acknowledged: true,
    };

    this.saveStateToStorage();
    return true;
  }

  /**
   * メトリクス収集
   */
  private collectMetrics(): void {
    try {
      const metrics = this.generateMockMetrics();

      this.state = {
        ...this.state,
        currentMetrics: metrics,
        lastCheck: new Date().toISOString(),
      };

      // 履歴に追加
      this.metricsHistory.push(metrics);

      // 古いデータを削除
      this.cleanupOldData();

      // ストレージに保存
      this.saveStateToStorage();
    } catch (error) {
      console.error("メトリクス収集エラー:", error);
    }
  }

  /**
   * アラート条件をチェック
   */
  private checkAlertConditions(): void {
    const metrics = this.state.currentMetrics;
    const newAlerts: Alert[] = [];

    // エラー率チェック
    if (
      metrics.errorRate > MONITORING_CONFIG.alertThresholds.error_rate_critical
    ) {
      newAlerts.push(
        this.createAlert(
          "error_rate_spike",
          "critical",
          "エラー率が危険レベルに達しました",
          `現在のエラー率: ${metrics.errorRate.toFixed(2)}%`,
          { errorRate: metrics.errorRate },
          [
            "即座にロールバックを検討してください",
            "エラーログを確認してください",
          ]
        )
      );
    } else if (
      metrics.errorRate > MONITORING_CONFIG.alertThresholds.error_rate_warning
    ) {
      newAlerts.push(
        this.createAlert(
          "error_rate_spike",
          "high",
          "エラー率が上昇しています",
          `現在のエラー率: ${metrics.errorRate.toFixed(2)}%`,
          { errorRate: metrics.errorRate },
          ["エラーパターンを監視してください"]
        )
      );
    }

    // パフォーマンスチェック
    if (
      metrics.performanceScore <
      MONITORING_CONFIG.alertThresholds.performance_critical
    ) {
      newAlerts.push(
        this.createAlert(
          "performance_degradation",
          "critical",
          "パフォーマンスが著しく低下しています",
          `現在のスコア: ${metrics.performanceScore.toFixed(1)}/100`,
          { performanceScore: metrics.performanceScore },
          [
            "パフォーマンス最適化を実行してください",
            "リソース使用量を確認してください",
          ]
        )
      );
    }

    // ユーザー満足度チェック
    if (
      metrics.userSatisfaction <
      MONITORING_CONFIG.alertThresholds.satisfaction_critical / 100
    ) {
      newAlerts.push(
        this.createAlert(
          "user_satisfaction_drop",
          "high",
          "ユーザー満足度が低下しています",
          `現在の満足度: ${(metrics.userSatisfaction * 100).toFixed(1)}%`,
          { userSatisfaction: metrics.userSatisfaction },
          [
            "ユーザーフィードバックを確認してください",
            "UX改善を検討してください",
          ]
        )
      );
    }

    // 新しいアラートを追加
    if (newAlerts.length > 0) {
      this.state = {
        ...this.state,
        alerts: [...this.state.alerts, ...newAlerts],
      };

      this.alertHistory.push(...newAlerts);

      // アラート通知
      newAlerts.forEach(alert => {
        this.sendAlert(alert);
      });
    }
  }

  /**
   * 移行準備状況を評価
   */
  private evaluateMigrationReadiness(): void {
    try {
      const metrics = this.state.currentMetrics;
      const dashboardData = abTestAnalytics.generateDashboardData();

      // サンプルデータで移行評価
      const migrationData = {
        statisticalSignificance: 0.03, // p値
        sampleSize: dashboardData.totalParticipants,
        performanceScore: metrics.performanceScore,
        errorRate: metrics.errorRate / 100, // パーセントから割合に変換
        conversionImprovement: 0.08, // 8%改善
        userSatisfaction: metrics.userSatisfaction,
        stabilityHours: 72, // 72時間安定稼働
      };

      const readiness = evaluatePhase3Readiness(migrationData);

      this.state = {
        ...this.state,
        migrationReadiness: readiness,
      };

      // 移行準備完了アラート
      if (readiness.isReady && !this.hasRecentAlert("phase_migration_ready")) {
        const alert = this.createAlert(
          "phase_migration_ready",
          "medium",
          "Phase 3移行準備が完了しました",
          "全ての移行条件が満たされています",
          {},
          ["Phase 3移行を実行できます", "移行計画を確認してください"]
        );

        this.state.alerts.push(alert);
        this.alertHistory.push(alert);
        this.sendAlert(alert);
      }
    } catch (error) {
      console.error("移行準備評価エラー:", error);
    }
  }

  /**
   * アラートを作成
   */
  private createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    metrics: Record<string, number>,
    recommendedActions: string[]
  ): Alert {
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      type,
      severity,
      title,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metrics,
      recommendedActions,
    };
  }

  /**
   * アラートを送信
   */
  private sendAlert(alert: Alert): void {
    const severityIcon = {
      critical: "🚨",
      high: "⚠️",
      medium: "ℹ️",
      low: "📝",
    }[alert.severity];

    console.warn(
      `${severityIcon} [A/Bテスト監視] ${alert.title}\n` +
        `詳細: ${alert.message}\n` +
        `時刻: ${new Date(alert.timestamp).toLocaleString("ja-JP")}`
    );

    if (alert.recommendedActions.length > 0) {
      console.log("推奨アクション:", alert.recommendedActions.join(", "));
    }
  }

  /**
   * 最近のアラートが存在するかチェック
   */
  private hasRecentAlert(type: AlertType, minutes = 30): boolean {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.alertHistory.some(
      alert => alert.type === type && new Date(alert.timestamp) > cutoff
    );
  }

  /**
   * モックメトリクスを生成
   */
  private generateMockMetrics(): RealtimeMetrics {
    return {
      timestamp: new Date().toISOString(),
      activeUsers: Math.floor(100 + Math.random() * 50),
      errorRate: Math.max(0, 1 + (Math.random() - 0.5) * 2), // 0-3%
      averageLoadTime: Math.floor(1800 + Math.random() * 400), // 1800-2200ms
      performanceScore: Math.floor(75 + Math.random() * 20), // 75-95
      conversionRate: 0.15 + (Math.random() - 0.5) * 0.02, // 14-16%
      userSatisfaction: 0.8 + (Math.random() - 0.5) * 0.1, // 75-85%
      memoryUsage: Math.floor(60 + Math.random() * 20), // 60-80%
      cpuUsage: Math.floor(40 + Math.random() * 30), // 40-70%
    };
  }

  /**
   * 古いデータをクリーンアップ
   */
  private cleanupOldData(): void {
    const retentionCutoff = new Date(
      Date.now() - MONITORING_CONFIG.retentionPeriod * 60 * 60 * 1000
    );

    this.metricsHistory = this.metricsHistory.filter(
      metrics => new Date(metrics.timestamp) > retentionCutoff
    );

    this.alertHistory = this.alertHistory.filter(
      alert => new Date(alert.timestamp) > retentionCutoff
    );
  }

  /**
   * 状態をlocalStorageに保存
   */
  private saveStateToStorage(): void {
    try {
      const storageData = {
        metricsHistory: this.metricsHistory.slice(-100), // 最新100件
        alertHistory: this.alertHistory.slice(-50), // 最新50件
        lastUpdate: new Date().toISOString(),
      };

      localStorage.setItem(
        "ab_test_monitoring_data",
        JSON.stringify(storageData)
      );
    } catch (error) {
      console.error("監視データ保存エラー:", error);
    }
  }

  /**
   * localStorageから履歴を読み込み
   */
  private loadHistoryFromStorage(): void {
    try {
      const stored = localStorage.getItem("ab_test_monitoring_data");
      if (!stored) return;

      const data = JSON.parse(stored) as {
        metricsHistory?: RealtimeMetrics[];
        alertHistory?: Alert[];
      };
      this.metricsHistory = data.metricsHistory || [];
      this.alertHistory = data.alertHistory || [];
    } catch (error) {
      console.error("監視データ読み込みエラー:", error);
    }
  }
}

// ==============================
// エクスポート
// ==============================

// シングルトンインスタンス
export const monitoringSystem = new ABTestMonitoringSystem();

// ユーティリティ関数
export function startABTestMonitoring(): void {
  monitoringSystem.startMonitoring();
}

export function stopABTestMonitoring(): void {
  monitoringSystem.stopMonitoring();
}

export function getMonitoringStatus(): MonitoringState {
  return monitoringSystem.getMonitoringState();
}

export function getMetricsHistory(hours = 24): RealtimeMetrics[] {
  return monitoringSystem.getMetricsHistory(hours);
}

export function getAlertHistory(hours = 24): Alert[] {
  return monitoringSystem.getAlertHistory(hours);
}

export function acknowledgeAlert(alertId: string): boolean {
  return monitoringSystem.acknowledgeAlert(alertId);
}

/**
 * 監視システム初期化
 * アプリケーション起動時に呼び出し
 */
export function initializeMonitoring(): void {
  console.log("🔧 A/Bテスト監視システムを初期化中...");

  // 自動開始（本番環境では設定により制御）
  if (MONITORING_CONFIG.enabled) {
    startABTestMonitoring();
  }
}

// デフォルトエクスポート
export default {
  monitoringSystem,
  startABTestMonitoring,
  stopABTestMonitoring,
  getMonitoringStatus,
  getMetricsHistory,
  getAlertHistory,
  acknowledgeAlert,
  initializeMonitoring,
};

// 型エクスポート（名前付きエクスポートを削除して重複を回避）
export type {
  Alert as ABTestAlert,
  AlertSeverity as ABTestAlertSeverity,
  AlertType as ABTestAlertType,
  MonitoringConfig as ABTestMonitoringConfig,
  MonitoringState as ABTestMonitoringState,
  RealtimeMetrics as ABTestRealtimeMetrics,
};
