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

// Abstract Services (Phase C2: Dependency Inversion)
export {
  AbstractDataService,
  MapDataService,
  ParkingService,
  RestaurantService,
  ServiceFactory,
  ToiletService,
} from "./abstractions/AbstractDataService";

// A/B Test Services
export {
  abTestAnalytics,
  analyzeABTestResults,
  applyMultipleComparisonCorrection,
  calculateSampleSize,
  displayABTestResults,
  monitoringSystem,
  performStatisticalAnalysis,
  runPhase3DeploymentTests,
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
  type TestResult,
  type TestSuite,
} from "./abtest";

// Re-export types for convenience
export type { SheetsApiConfig, SheetsApiResponse } from "@/types";
