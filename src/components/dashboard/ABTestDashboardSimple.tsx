/**
 * @fileoverview A/Bテスト監視ダッシュボード - シンプル版
 * HTMLベースのリアルタイム分析UI
 *
 * 🎯 機能:
 * 1. リアルタイムメトリクス表示
 * 2. バリアント別パフォーマンス比較
 * 3. 統計的有意性の視覚化
 * 4. 改善推奨事項の表示
 */

import { CURRENT_AB_TEST_CONFIG } from "@/config/abTestConfig";
import type { ABTestResultSummary, DashboardData } from "@/services/abtest";
import { abTestAnalytics, displayABTestResults } from "@/services/abtest";
import React, { useEffect, useState } from "react";

// ==============================
// ダッシュボードスタイル
// ==============================

const dashboardStyles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    padding: "24px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
  },
  button: {
    padding: "8px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  buttonActive: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  metricCard: {
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
  },
  metricTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b",
    margin: "0 0 8px 0",
  },
  metricValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  metricChange: {
    fontSize: "12px",
    fontWeight: "500",
  },
  changePositive: { color: "#10b981" },
  changeNegative: { color: "#ef4444" },
  changeNeutral: { color: "#64748b" },
  tabsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  tabsList: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
  },
  tab: {
    flex: 1,
    padding: "12px 16px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748b",
    borderBottom: "2px solid transparent",
    transition: "all 0.2s",
  },
  tabActive: {
    color: "#3b82f6",
    borderBottomColor: "#3b82f6",
    backgroundColor: "#f8fafc",
  },
  tabContent: {
    padding: "24px",
  },
  variantGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },
  variantCard: {
    padding: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#f8fafc",
  },
  variantHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  variantTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    textTransform: "capitalize",
  },
  badge: {
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeWarning: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "12px",
  },
  statItem: {
    fontSize: "12px",
  },
  statLabel: {
    color: "#64748b",
    display: "block",
  },
  statValue: {
    fontWeight: "600",
    color: "#1e293b",
  },
  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#e2e8f0",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    transition: "width 0.3s ease",
  },
  alert: {
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    marginBottom: "12px",
  },
  alertSuccess: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
    color: "#065f46",
  },
  alertWarning: {
    backgroundColor: "#fffbeb",
    borderColor: "#f59e0b",
    color: "#92400e",
  },
  footer: {
    textAlign: "center" as const,
    fontSize: "12px",
    color: "#64748b",
    marginTop: "32px",
    padding: "16px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    color: "#64748b",
  },
} as const;

// ==============================
// メインダッシュボードコンポーネント
// ==============================

export const ABTestDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("variants");
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

    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        loadDashboardData();
      }, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  if (isLoading) {
    return (
      <div style={dashboardStyles.loading}>
        <div>ダッシュボード読み込み中...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={dashboardStyles.loading}>
        <div>ダッシュボードデータが利用できません</div>
      </div>
    );
  }

  return (
    <div style={dashboardStyles.container}>
      {/* ヘッダー */}
      <div style={dashboardStyles.header}>
        <div>
          <h1 style={dashboardStyles.title}>A/Bテスト監視ダッシュボード</h1>
          <p style={dashboardStyles.subtitle}>
            フェーズ: {dashboardData.currentPhase} | ロールアウト:{" "}
            {dashboardData.rolloutPercentage}%
          </p>
        </div>

        <div style={dashboardStyles.buttonGroup}>
          <button
            style={{
              ...dashboardStyles.button,
              ...(autoRefresh ? dashboardStyles.buttonActive : {}),
            }}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "自動更新ON" : "自動更新OFF"}
          </button>

          <button
            style={dashboardStyles.button}
            onClick={() => displayABTestResults()}
          >
            コンソール出力
          </button>
        </div>
      </div>

      {/* メトリクス概要 */}
      <div style={dashboardStyles.metricsGrid}>
        <MetricCard
          title="総参加者"
          value={dashboardData.totalParticipants}
          change="+12% (24h)"
          trend="positive"
        />

        <MetricCard
          title="アクティブユーザー"
          value={dashboardData.realtimeMetrics.activeUsers}
          change="リアルタイム"
          trend="neutral"
        />

        <MetricCard
          title="平均読み込み時間"
          value={`${dashboardData.realtimeMetrics.averageLoadTime.toFixed(0)}ms`}
          change="-8% (24h)"
          trend="negative"
        />

        <MetricCard
          title="エラー発生"
          value={dashboardData.realtimeMetrics.errorCount}
          change="過去1時間"
          trend={
            dashboardData.realtimeMetrics.errorCount > 0
              ? "positive"
              : "neutral"
          }
        />
      </div>

      {/* タブコンテンツ */}
      <div style={dashboardStyles.tabsContainer}>
        <div style={dashboardStyles.tabsList}>
          {["variants", "performance", "recommendations"].map(tab => (
            <button
              key={tab}
              style={{
                ...dashboardStyles.tab,
                ...(activeTab === tab ? dashboardStyles.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "variants" && "バリアント比較"}
              {tab === "performance" && "パフォーマンス"}
              {tab === "recommendations" && "推奨事項"}
            </button>
          ))}
        </div>

        <div style={dashboardStyles.tabContent}>
          {activeTab === "variants" && (
            <VariantsTab variants={dashboardData.variants} />
          )}

          {activeTab === "performance" && (
            <PerformanceTab variants={dashboardData.variants} />
          )}

          {activeTab === "recommendations" && (
            <RecommendationsTab
              recommendations={dashboardData.recommendations}
            />
          )}
        </div>
      </div>

      {/* フッター */}
      <div style={dashboardStyles.footer}>
        最終更新: {new Date(dashboardData.lastUpdated).toLocaleString("ja-JP")}{" "}
        | 設定バージョン: {CURRENT_AB_TEST_CONFIG.currentPhase}
      </div>
    </div>
  );
};

// ==============================
// サブコンポーネント
// ==============================

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: "positive" | "negative" | "neutral";
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
}) => {
  const changeStyle = {
    positive: dashboardStyles.changePositive,
    negative: dashboardStyles.changeNegative,
    neutral: dashboardStyles.changeNeutral,
  }[trend];

  return (
    <div style={dashboardStyles.metricCard}>
      <div style={dashboardStyles.metricTitle}>{title}</div>
      <div style={dashboardStyles.metricValue}>{value}</div>
      <div style={{ ...dashboardStyles.metricChange, ...changeStyle }}>
        {change}
      </div>
    </div>
  );
};

const VariantsTab: React.FC<{ variants: ABTestResultSummary[] }> = ({
  variants,
}) => {
  return (
    <div style={dashboardStyles.variantGrid}>
      {variants.map(variant => (
        <VariantCard key={variant.variant} variant={variant} />
      ))}
    </div>
  );
};

const VariantCard: React.FC<{ variant: ABTestResultSummary }> = ({
  variant,
}) => {
  const isSignificant = variant.statisticalSignificance < 0.05;

  return (
    <div style={dashboardStyles.variantCard}>
      <div style={dashboardStyles.variantHeader}>
        <div style={dashboardStyles.variantTitle}>{variant.variant}</div>
        <span
          style={{
            ...dashboardStyles.badge,
            ...(isSignificant
              ? dashboardStyles.badgeSuccess
              : dashboardStyles.badgeWarning),
          }}
        >
          {isSignificant ? "統計的有意" : "検証中"}
        </span>
      </div>

      <div style={dashboardStyles.statsGrid}>
        <div style={dashboardStyles.statItem}>
          <span style={dashboardStyles.statLabel}>セッション数</span>
          <div style={dashboardStyles.statValue}>{variant.totalSessions}</div>
        </div>

        <div style={dashboardStyles.statItem}>
          <span style={dashboardStyles.statLabel}>コンバージョン率</span>
          <div style={dashboardStyles.statValue}>
            {(variant.conversionRate * 100).toFixed(2)}%
          </div>
        </div>

        <div style={dashboardStyles.statItem}>
          <span style={dashboardStyles.statLabel}>パフォーマンス</span>
          <div style={dashboardStyles.statValue}>
            {variant.performanceScore.toFixed(1)}/100
          </div>
        </div>

        <div style={dashboardStyles.statItem}>
          <span style={dashboardStyles.statLabel}>満足度</span>
          <div style={dashboardStyles.statValue}>
            {(variant.userSatisfaction * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={dashboardStyles.progressBar}>
        <div
          style={{
            ...dashboardStyles.progressFill,
            width: `${variant.performanceScore}%`,
          }}
        />
      </div>
    </div>
  );
};

const PerformanceTab: React.FC<{ variants: ABTestResultSummary[] }> = ({
  variants,
}) => {
  return (
    <div>
      <h3 style={{ marginBottom: "16px", color: "#1e293b" }}>
        バリアント別パフォーマンス分析
      </h3>

      <div style={dashboardStyles.variantGrid}>
        {variants.map(variant => (
          <div key={variant.variant} style={dashboardStyles.variantCard}>
            <div style={dashboardStyles.variantHeader}>
              <div style={dashboardStyles.variantTitle}>{variant.variant}</div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>
                p-value: {variant.statisticalSignificance.toFixed(3)}
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={dashboardStyles.statLabel}>パフォーマンススコア</div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#1e293b",
                }}
              >
                {variant.performanceScore.toFixed(1)}/100
              </div>

              <div style={dashboardStyles.progressBar}>
                <div
                  style={{
                    ...dashboardStyles.progressFill,
                    width: `${variant.performanceScore}%`,
                    backgroundColor: (() => {
                      if (variant.performanceScore >= 80) return "#10b981";
                      if (variant.performanceScore >= 60) return "#f59e0b";
                      return "#ef4444";
                    })(),
                  }}
                />
              </div>
            </div>

            <div style={dashboardStyles.statsGrid}>
              <div style={dashboardStyles.statItem}>
                <span style={dashboardStyles.statLabel}>エラー率</span>
                <div style={dashboardStyles.statValue}>
                  {(variant.errorRate * 100).toFixed(3)}%
                </div>
              </div>

              <div style={dashboardStyles.statItem}>
                <span style={dashboardStyles.statLabel}>セッション時間</span>
                <div style={dashboardStyles.statValue}>
                  {Math.round(variant.avgSessionDuration)}秒
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecommendationsTab: React.FC<{ recommendations: string[] }> = ({
  recommendations,
}) => {
  if (recommendations.length === 0) {
    return (
      <div
        style={{ ...dashboardStyles.alert, ...dashboardStyles.alertWarning }}
      >
        <strong>データ収集中</strong>
        <br />
        十分なデータが蓄積されると推奨事項が表示されます
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ marginBottom: "16px", color: "#1e293b" }}>改善推奨事項</h3>

      {recommendations.map((recommendation, index) => {
        const recommendationKey = `recommendation-${recommendation.slice(0, 15).replace(/\W+/g, "")}-${index}`;
        return (
          <div
            key={recommendationKey}
            style={{
              ...dashboardStyles.alert,
              ...dashboardStyles.alertSuccess,
            }}
          >
            <strong>推奨事項 #{index + 1}</strong>
            <br />
            {recommendation}
          </div>
        );
      })}
    </div>
  );
};

export default ABTestDashboard;
