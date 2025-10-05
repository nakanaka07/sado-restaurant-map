/**
 * @fileoverview Services barrel export
 * 外部サービス・API通信モジュールの統一エクスポート
 */

// Sheets Service
export {
  SheetsApiError,
  checkDataFreshness,
  fetchAllMapPoints,
  fetchParkingsFromSheets,
  fetchRestaurantsFromSheets,
  fetchToiletsFromSheets,
  type SheetRestaurantData,
} from "./sheets/sheetsService";

// A/B Test Services
export {
  abTestAnalytics,
  analyzeABTestResults,
  applyMultipleComparisonCorrection,
  calculateSampleSize,
  displayABTestResults,
  monitoringSystem,
  performStatisticalAnalysis,
  // runPhase3DeploymentTests, // 未使用 - コメントアウト
  shouldProceedToNextPhase,
  startABTestMonitoring,
  stopABTestMonitoring,
  type ABTestAlert,
  type ABTestAnalysisResult,
  type ABTestEventType,
  type ABTestMetrics,
  type ABTestMonitoringConfig,
  type ABTestMonitoringState,
  type ABTestRealtimeMetrics,
  type ABTestResultSummary,
  type AlertSeverity,
  type AlertType,
  type BayesianAnalysisResult,
  type ComparisonGroup,
  type DashboardData,
  type PerformanceMetrics,
  type RolloutRecommendation,
  type StatisticalRecommendation,
  type StatisticalTestConfig,
  type StatisticalTestResult,
} from "./abtest";

// Re-export types for convenience
export type { SheetsApiConfig, SheetsApiResponse } from "@/types";
