/**
 * @fileoverview A/Bテストサービス統合エクスポート
 * A/Bテスト関連の全ての機能を統一管理
 */

// 分析・結果評価
export {
  analyzeABTestResults,
  shouldProceedToNextPhase,
  type ABTestAnalysisResult,
  type RolloutRecommendation,
} from "./abTestResultsAnalyzer";

// 統計分析
export {
  applyMultipleComparisonCorrection,
  calculateSampleSize,
  performStatisticalAnalysis,
  type BayesianAnalysisResult,
  type ComparisonGroup,
  type StatisticalRecommendation,
  type StatisticalTestConfig,
  type StatisticalTestResult,
} from "./statisticalSignificance";

// リアルタイム監視
export {
  monitoringSystem,
  startABTestMonitoring,
  stopABTestMonitoring,
  type Alert as ABTestAlert,
  type MonitoringConfig as ABTestMonitoringConfig,
  type MonitoringState as ABTestMonitoringState,
  type RealtimeMetrics as ABTestRealtimeMetrics,
  type AlertSeverity,
  type AlertType,
} from "./abTestMonitoring";

// 分析データ・メトリクス
export {
  abTestAnalytics,
  displayABTestResults,
  type ABTestEventType,
  type ABTestMetrics,
  type ABTestResultSummary,
  type DashboardData,
  type PerformanceMetrics,
} from "./abTestAnalytics";

// Phase 3 デプロイメントテスト
export {
  runPhase3DeploymentTests,
  type TestResult,
  type TestSuite,
} from "./phase3DeploymentTest";
