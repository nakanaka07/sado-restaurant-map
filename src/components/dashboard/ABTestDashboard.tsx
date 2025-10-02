/**
 * @fileoverview A/Bテスト監視ダッシュボード - 完全自己完結型実装
 * 外部UIライブラリに依存しない、セキュアなダッシュボード
 */

import type { DashboardData } from "@/services/abtest";
import { abTestAnalytics } from "@/services/abtest";
import React, { useEffect, useMemo, useState } from "react";

// ==============================
// 型安全な内蔵UIコンポーネント
// ==============================

interface UIProps {
  children: React.ReactNode;
  className?: string;
}

interface IconProps {
  className?: string;
}

// CSS-in-JS スタイル定数
const styles = {
  card: "bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-4",
  button:
    "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200",
  buttonOutline:
    "px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200",
  badge: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
  badgeBlue: "bg-blue-100 text-blue-800",
  badgeGreen: "bg-green-100 text-green-800",
  badgeYellow: "bg-yellow-100 text-yellow-800",
  badgeRed: "bg-red-100 text-red-800",
  alert: "p-4 mb-4 rounded-lg border border-blue-200 bg-blue-50",
  tabs: "w-full",
  tabsList: "flex bg-gray-100 rounded-lg p-1 mb-4",
  tab: "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200",
  tabActive: "bg-white text-blue-600 shadow-sm",
  tabInactive: "text-gray-600 hover:text-gray-800",
  grid: "grid gap-4",
  gridCols2: "grid-cols-1 md:grid-cols-2",
  gridCols3: "grid-cols-1 md:grid-cols-3",
  gridCols4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  flexCenter: "flex items-center justify-center",
  flexBetween: "flex items-center justify-between",
  textXs: "text-xs",
  textSm: "text-sm",
  textBase: "text-base",
  textLg: "text-lg",
  textXl: "text-xl",
  text2xl: "text-2xl",
  text3xl: "text-3xl",
  fontMedium: "font-medium",
  fontSemibold: "font-semibold",
  fontBold: "font-bold",
  textGray500: "text-gray-500",
  textGray600: "text-gray-600",
  textGray700: "text-gray-700",
  textGray900: "text-gray-900",
} as const;

// Card コンポーネント
const Card: React.FC<UIProps> = ({ children, className = "" }) => (
  <div className={`${styles.card} ${className}`}>{children}</div>
);

// Button コンポーネント
const Button: React.FC<
  UIProps & {
    onClick?: () => void;
    variant?: "default" | "outline";
    size?: "sm" | "md" | "lg";
  }
> = ({
  children,
  onClick,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const baseStyle =
    variant === "outline" ? styles.buttonOutline : styles.button;
  let sizeClass = "px-4 py-2";
  if (size === "sm") {
    sizeClass = "px-3 py-1 text-sm";
  } else if (size === "lg") {
    sizeClass = "px-6 py-3 text-lg";
  }
  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
};

// Badge コンポーネント
const Badge: React.FC<
  UIProps & { variant?: "blue" | "green" | "yellow" | "red" }
> = ({ children, variant = "blue", className = "" }) => {
  const variantClass = {
    blue: styles.badgeBlue,
    green: styles.badgeGreen,
    yellow: styles.badgeYellow,
    red: styles.badgeRed,
  }[variant];

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`}>
      {children}
    </span>
  );
};

// Alert コンポーネント
const Alert: React.FC<UIProps> = ({ children, className = "" }) => (
  <div className={`${styles.alert} ${className}`}>{children}</div>
);

// Simplified Tabs Component
const SimpleTabs: React.FC<{
  defaultValue?: string;
  className?: string;
  tabItems: Array<{ value: string; label: string; content: React.ReactNode }>;
}> = ({ defaultValue, className = "", tabItems }) => {
  const [activeTab, setActiveTab] = useState(
    defaultValue || tabItems[0]?.value || ""
  );

  const handleTabClick = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  return (
    <div className={`${styles.tabs} ${className}`}>
      {/* Tab Headers */}
      <div className={styles.tabsList}>
        {tabItems.map(tab => (
          <button
            key={tab.value}
            className={`${styles.tab} ${
              activeTab === tab.value ? styles.tabActive : styles.tabInactive
            }`}
            onClick={() => handleTabClick(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>{tabItems.find(tab => tab.value === activeTab)?.content}</div>
    </div>
  );
};

// アイコンコンポーネント
const Users: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);

const Activity: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
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
    className={`w-4 h-4 ${className}`}
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

const AlertTriangle: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const Eye: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const Clock: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const CheckCircle: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
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

// ==============================
// ダッシュボード型定義
// ==============================

interface ChartDataPoint {
  readonly timestamp: string;
  readonly original: number;
  readonly "enhanced-png": number;
  readonly svg: number;
  readonly testing: number;
}

interface MetricCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly change: string;
  readonly icon: React.ReactNode;
  readonly trend: "up" | "down" | "neutral";
}

// ==============================
// メトリクスカードコンポーネント
// ==============================

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
}) => {
  const trendColor = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  }[trend];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className={styles.flexBetween}>
        <div>
          <p className={`${styles.textSm} ${styles.textGray500}`}>{title}</p>
          <p
            className={`${styles.text2xl} ${styles.fontBold} ${styles.textGray900}`}
          >
            {value}
          </p>
          <p className={`${styles.textSm} ${trendColor}`}>{change}</p>
        </div>
        <div className={`${styles.textGray500}`}>{icon}</div>
      </div>
    </Card>
  );
};

// ==============================
// 簡易チャートコンポーネント
// ==============================

const SimpleBarChart: React.FC<{
  data: Array<{ name: string; value: number; color?: string }>;
}> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div
          key={`bar-chart-${item.name}-${index}`}
          className="flex items-center space-x-3"
        >
          <div className="w-16 text-sm text-gray-600">{item.name}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
            <div
              className={`h-4 rounded-full ${item.color || "bg-blue-500"}`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-12 text-sm font-medium text-right">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};

const SimpleLineChart: React.FC<{
  data: ChartDataPoint[];
  lines: string[];
}> = ({ data, lines }) => {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        時系列データ（過去24時間）
      </div>
      <div className="space-y-2">
        {lines.map((line, index) => (
          <div
            key={line}
            className={`flex items-center space-x-2 ${styles.textSm}`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-${["blue", "green", "yellow", "red"][index % 4]}-500`}
            />
            <span>{line}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500">
        データポイント数: {data.length}
      </div>
    </div>
  );
};

// ==============================
// メインダッシュボードコンポーネント
// ==============================

export const ABTestDashboard: React.FC = () => {
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
  useEffect(() => {
    const loadDashboardData = () => {
      try {
        setIsLoading(true);
        const data = abTestAnalytics.generateDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("ダッシュボードデータ読み込みエラー:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();

    // 自動更新設定
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        loadDashboardData();
      }, 30000); // 30秒ごと
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  // チャートデータ生成
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!dashboardData) return [];

    // 過去24時間のモックデータ生成
    const dataPoints: ChartDataPoint[] = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = timestamp.getHours().toString().padStart(2, "0");

      dataPoints.push({
        timestamp: `${hour}:00`,
        original: Math.floor(Math.random() * 100),
        "enhanced-png": Math.floor(Math.random() * 100),
        svg: Math.floor(Math.random() * 100),
        testing: Math.floor(Math.random() * 100),
      });
    }

    return dataPoints;
  }, [dashboardData]);

  // バリアント別データ
  const variantData = useMemo(() => {
    return dashboardData.variants.map(variant => ({
      name: variant.variant,
      value: Math.floor(Math.random() * 1000), // モックデータ
      color:
        (
          {
            original: "bg-blue-500",
            "enhanced-png": "bg-green-500",
            svg: "bg-yellow-500",
            testing: "bg-red-500",
            "phase4-enhanced": "bg-purple-500",
          } as const
        )[variant.variant] || "bg-gray-500",
    }));
  }, [dashboardData.variants]);

  if (isLoading) {
    return (
      <div className={`${styles.flexCenter} min-h-screen`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <div className={`${styles.textGray600}`}>
            ダッシュボード読み込み中...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className={styles.flexBetween}>
        <div>
          <h1
            className={`${styles.text3xl} ${styles.fontBold} ${styles.textGray900}`}
          >
            A/Bテスト監視ダッシュボード
          </h1>
          <p className={styles.textGray600}>
            リアルタイムパフォーマンス分析 - 最終更新:{" "}
            {new Date(dashboardData.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={autoRefresh ? "green" : "yellow"}>
            {autoRefresh ? "自動更新ON" : "自動更新OFF"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Clock className="h-4 w-4 mr-2" />
            自動更新切替
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <Eye className="h-4 w-4 mr-2" />
            手動更新
          </Button>
        </div>
      </div>

      {/* 重要な警告 */}
      <Alert>
        <div className={styles.flexCenter}>
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <div className="text-center">
            <h3 className={`${styles.textLg} ${styles.fontSemibold} mb-2`}>
              注意事項
            </h3>
            <p className={styles.textSm}>
              本ダッシュボードは開発環境用のモック実装です。本番環境では適切なチャートライブラリ（Recharts、Chart.js等）を使用してください。
            </p>
          </div>
        </div>
      </Alert>

      {/* メトリクスカード */}
      <div className={`${styles.grid} ${styles.gridCols4}`}>
        <MetricCard
          title="アクティブユーザー"
          value={dashboardData.realtimeMetrics.activeUsers}
          change="+12.5%"
          icon={<Users className="h-6 w-6" />}
          trend="up"
        />
        <MetricCard
          title="エラー数"
          value={dashboardData.realtimeMetrics.errorCount}
          change="-5.2%"
          icon={<AlertTriangle className="h-6 w-6" />}
          trend="down"
        />
        <MetricCard
          title="平均読み込み時間"
          value={`${dashboardData.realtimeMetrics.averageLoadTime.toFixed(2)}s`}
          change="-8.1%"
          icon={<Activity className="h-6 w-6" />}
          trend="down"
        />
        <MetricCard
          title="総参加者数"
          value={dashboardData.totalParticipants}
          change="+24.3%"
          icon={<Zap className="h-6 w-6" />}
          trend="up"
        />
      </div>

      {/* タブナビゲーション */}
      <SimpleTabs
        defaultValue="variants"
        tabItems={[
          {
            value: "variants",
            label: "バリアント比較",
            content: (
              <div className={`${styles.grid} ${styles.gridCols2}`}>
                <Card>
                  <h3
                    className={`${styles.textLg} ${styles.fontSemibold} mb-4`}
                  >
                    バリアント別パフォーマンス
                  </h3>
                  <SimpleBarChart data={variantData} />
                </Card>
                <Card>
                  <h3
                    className={`${styles.textLg} ${styles.fontSemibold} mb-4`}
                  >
                    統計的有意性
                  </h3>
                  <div className="space-y-3">
                    {dashboardData.variants.map((variant, index) => (
                      <div
                        key={variant.variant}
                        className={`${styles.flexBetween} p-3 bg-gray-50 rounded-lg`}
                      >
                        <span className={styles.fontMedium}>
                          {variant.variant}
                        </span>
                        <Badge variant={index % 2 === 0 ? "green" : "yellow"}>
                          {index % 2 === 0 ? "有意" : "検証中"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ),
          },
          {
            value: "performance",
            label: "パフォーマンス",
            content: (
              <div className={`${styles.grid} ${styles.gridCols2}`}>
                <Card>
                  <h3
                    className={`${styles.textLg} ${styles.fontSemibold} mb-4`}
                  >
                    Core Web Vitals
                  </h3>
                  <SimpleBarChart
                    data={[
                      { name: "LCP", value: 2.1, color: "bg-green-500" },
                      { name: "FID", value: 85, color: "bg-yellow-500" },
                      { name: "CLS", value: 0.05, color: "bg-green-500" },
                    ]}
                  />
                </Card>
                <Card>
                  <h3
                    className={`${styles.textLg} ${styles.fontSemibold} mb-4`}
                  >
                    エラー統計
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className={styles.flexBetween}>
                      <span>JavaScript エラー</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className={styles.flexBetween}>
                      <span>ネットワークエラー</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className={styles.flexBetween}>
                      <span>レンダリングエラー</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </Card>
              </div>
            ),
          },
          {
            value: "timeline",
            label: "時系列分析",
            content: (
              <Card>
                <h3 className={`${styles.textLg} ${styles.fontSemibold} mb-4`}>
                  時系列パフォーマンス
                </h3>
                <SimpleLineChart
                  data={chartData}
                  lines={["original", "enhanced-png", "svg", "testing"]}
                />
              </Card>
            ),
          },
          {
            value: "recommendations",
            label: "推奨事項",
            content: (
              <div className="space-y-4">
                {dashboardData.recommendations.length > 0 ? (
                  dashboardData.recommendations.map((rec, index) => (
                    <Card key={`recommendation-${index}-${rec.slice(0, 10)}`}>
                      <div className={styles.flexBetween}>
                        <div>
                          <h4 className={`${styles.fontSemibold} mb-2`}>
                            推奨事項 {index + 1}
                          </h4>
                          <p className={styles.textSm}>{rec}</p>
                        </div>
                        <Badge variant="yellow">medium</Badge>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3
                        className={`${styles.textLg} ${styles.fontSemibold} mb-2`}
                      >
                        すべて順調です
                      </h3>
                      <p className={styles.textGray600}>
                        現在、緊急の推奨事項はありません。
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* フッター */}
      <div
        className={`text-center ${styles.textSm} ${styles.textGray500} py-4`}
      >
        <p>
          A/Bテスト設定: バリアントテスト | フェーズ:{" "}
          {dashboardData.currentPhase} | ロールアウト:{" "}
          {dashboardData.rolloutPercentage}%
        </p>
      </div>
    </div>
  );
};

export default ABTestDashboard;
