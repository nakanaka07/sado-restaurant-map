/**
 * @fileoverview A/Bテスト監視ダッシュボード - 型安全な模擬UI実装
 * 外部依存関係なしで動作する、型安全なダッシュボードUI
 *
 * 🎯 機能:
 * 1. リアルタイムメトリクス表示
 * 2. バリアント別パフォーマンス比較
 * 3. 統計的有意性の視覚化
 * 4. 改善推奨事項の表示
 * 5. セキュリティとアクセシビリティ対応
 */

import type {
  ABTestResultSummary,
  DashboardData,
} from "@/utils/abTestAnalytics";
import { abTestAnalytics } from "@/utils/abTestAnalytics";
import React, { useCallback, useEffect, useState } from "react";

// ==============================
// 型安全な模擬UIコンポーネント
// ==============================

interface MockUIProps {
  children: React.ReactNode;
  className?: string;
}

interface IconProps {
  className?: string;
}

// Alert コンポーネント群
const Alert: React.FC<MockUIProps> = ({ children, className = "" }) => (
  <div
    className={`bg-blue-50 border border-blue-200 rounded-md p-4 ${className}`}
    role="alert"
    aria-live="polite"
  >
    {children}
  </div>
);

const AlertDescription: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="text-sm text-blue-700">{children}</div>;

const AlertTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-base font-semibold text-blue-800 mb-2">{children}</h4>
);

// Card コンポーネント群
const Card: React.FC<MockUIProps> = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
  >
    {children}
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6">{children}</div>
);

const CardHeader: React.FC<MockUIProps> = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<MockUIProps> = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardDescription: React.FC<MockUIProps> = ({
  children,
  className = "",
}) => <p className={`text-sm text-gray-600 mt-1 ${className}`}>{children}</p>;

// その他のUI コンポーネント
const Badge: React.FC<MockUIProps> = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 ${className}`}
  >
    {children}
  </span>
);

interface ButtonProps extends MockUIProps {
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  onClick,
  disabled = false,
  type = "button",
}) => (
  <button
    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    onClick={onClick}
    disabled={disabled}
    type={type}
    aria-label={typeof children === "string" ? children : undefined}
  >
    {children}
  </button>
);

// Progress コンポーネント
interface ProgressProps {
  value: number;
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({ value, className = "" }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  </div>
);

// アイコン模擬実装
const CheckCircle: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 text-green-600 ${className}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const TrendingUp: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 text-green-600 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

const Users: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 text-blue-600 ${className}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);

const Activity: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 text-purple-600 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const Zap: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 text-yellow-600 ${className}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
      clipRule="evenodd"
    />
  </svg>
);

// ==============================
// 型ガード・バリデーション関数
// ==============================

/**
 * 型安全なメトリクス値の検証
 */
const isValidMetricValue = (value: unknown): value is number => {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
};

/**
 * バリアントデータの検証
 */
const isValidVariant = (variant: unknown): variant is ABTestResultSummary => {
  if (!variant || typeof variant !== "object") return false;

  const v = variant as Record<string, unknown>;
  return (
    typeof v.variant === "string" &&
    isValidMetricValue(v.totalSessions) &&
    isValidMetricValue(v.conversionRate) &&
    isValidMetricValue(v.performanceScore)
  );
};

/**
 * XSS攻撃防止のための文字列サニタイズ
 */
const sanitizeString = (str: unknown): string => {
  if (typeof str !== "string") return "";
  return str.replace(/[<>"'&]/g, char => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#x27;";
      case "&":
        return "&amp;";
      default:
        return char;
    }
  });
};

// ==============================
// メインダッシュボードコンポーネント
// ==============================

export const ABTestDashboardMockUI: React.FC = () => {
  // State管理
  const [dashboardData, setDashboardData] = useState<DashboardData>(() => ({
    currentPhase: "実験中",
    rolloutPercentage: 50,
    totalParticipants: 0,
    variants: [],
    realtimeMetrics: {
      activeUsers: 0,
      errorCount: 0,
      averageLoadTime: 0,
    },
    recommendations: [],
    lastUpdated: new Date().toISOString(),
  }));

  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // リアルタイムデータ更新
  const loadDashboardData = useCallback(() => {
    try {
      setIsLoading(true);
      const data = abTestAnalytics.generateDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("ダッシュボードデータ読み込みエラー:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, 30000); // 30秒間隔
      return () => clearInterval(interval);
    }

    return undefined; // 明示的なリターン
  }, [autoRefresh, loadDashboardData]);

  // メモ化されたステータスカラー関数
  const getStatusColor = useCallback(
    (value: number, thresholds: [number, number] = [70, 90]) => {
      if (value >= thresholds[1]) return "text-green-600 bg-green-50";
      if (value >= thresholds[0]) return "text-yellow-600 bg-yellow-50";
      return "text-red-600 bg-red-50";
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">
            ダッシュボードデータを読み込み中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            A/Bテスト監視ダッシュボード
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            リアルタイム分析 - マーカーデザイン最適化
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Badge className="px-3 py-1">
            {sanitizeString(dashboardData.currentPhase)}
          </Badge>
          <Button
            onClick={() => {
              setAutoRefresh(!autoRefresh);
            }}
            className={
              autoRefresh
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-600 hover:bg-gray-700"
            }
          >
            自動更新: {autoRefresh ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      {/* リアルタイムメトリクス */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  アクティブユーザー
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.realtimeMetrics.activeUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  平均読み込み時間
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.realtimeMetrics.averageLoadTime.toFixed(1)}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">総参加者</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.totalParticipants.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">展開率</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.rolloutPercentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* バリアント比較 */}
      <Card>
        <CardHeader>
          <CardTitle>バリアント別パフォーマンス</CardTitle>
          <CardDescription>
            コンバージョン率とパフォーマンススコアの比較
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.variants.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.variants.filter(isValidVariant).map(variant => {
                const variantKey = `variant-${sanitizeString(variant.variant).replace(/\W+/g, "")}-${variant.totalSessions}`;
                return (
                  <div
                    key={variantKey}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge className="px-3 py-1">
                        {sanitizeString(variant.variant)}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          コンバージョン率:{" "}
                          {(variant.conversionRate * 100).toFixed(2)}%
                        </p>
                        <p className="text-sm text-gray-500">
                          セッション数: {variant.totalSessions.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={variant.performanceScore} />
                      </div>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(variant.performanceScore)}`}
                      >
                        {variant.performanceScore.toFixed(0)}点
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              データを読み込み中...
            </p>
          )}
        </CardContent>
      </Card>

      {/* 推奨事項 */}
      {dashboardData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>改善推奨事項</CardTitle>
            <CardDescription>データに基づく最適化提案</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recommendations.map((recommendation, index) => {
                const recommendationKey = `recommendation-${sanitizeString(recommendation.slice(0, 15)).replace(/\W+/g, "")}-${index}`;
                return (
                  <Alert key={recommendationKey}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>推奨事項 #{index + 1}</AlertTitle>
                    <AlertDescription>
                      {sanitizeString(recommendation)}
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* フッター情報 */}
      <div className="text-xs text-gray-500 text-center">
        最終更新: {new Date(dashboardData.lastUpdated).toLocaleString("ja-JP")}
      </div>
    </div>
  );
};

export default ABTestDashboardMockUI;
