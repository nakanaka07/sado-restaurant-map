/**
 * @fileoverview マーカー移行システム型定義
 */

// ==============================
// 移行設定・制御
// ==============================

export interface MigrationConfig {
  readonly enabled: boolean; // 移行機能有効/無効
  readonly rolloutPercentage: number; // ロールアウト率 (0-100%)
  readonly useNewSystemForced?: boolean; // 強制的に新システム使用
  readonly enableFallback: boolean; // フォールバック有効
  readonly enablePerformanceMonitoring: boolean;
  readonly enableUserFeedback: boolean;
  readonly debugMode: boolean;
}

export interface MigrationState {
  readonly isUsingNewSystem: boolean;
  readonly migrationStats?: MigrationStatistics;
  readonly performanceMetrics?: PerformanceMetrics;
  readonly errors: string[];
  readonly lastUpdate: string;
}

export interface PerformanceMetrics {
  readonly renderTime: number; // レンダリング時間 (ms)
  readonly memoryUsage?: number; // メモリ使用量 (MB)
  readonly bundleSize?: number; // バンドルサイズ増減 (KB)
  readonly userInteractions: number; // ユーザーインタラクション数
}

export interface MigrationStatistics {
  readonly totalMigrations: number;
  readonly successfulMigrations: number;
  readonly failedMigrations: number;
  readonly averagePerformance: number;
  readonly userSatisfactionScore?: number;
}
