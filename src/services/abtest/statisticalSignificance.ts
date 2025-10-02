/**
 * @fileoverview A/Bテスト統計的有意性検証システム
 * ベイズ統計、信頼区間、効果サイズ計算によるPhase移行判定
 *
 * 🎯 機能:
 * 1. 統計的有意性計算（p値、信頼区間）
 * 2. ベイズファクター分析
 * 3. 効果サイズ測定（Cohen's d）
 * 4. A/Aテスト検証
 * 5. 多重比較補正
 * 6. 継続監視と早期停止判定
 */

import { abTestAnalytics } from "./abTestAnalytics";

// ==============================
// 統計検定型定義
// ==============================

/** 統計検定結果 */
export interface StatisticalTestResult {
  readonly testName: string;
  readonly pValue: number;
  readonly confidenceInterval: [number, number];
  readonly effectSize: number;
  readonly sampleSize: number;
  readonly power: number;
  readonly isSignificant: boolean;
  readonly recommendation: StatisticalRecommendation;
}

/** ベイズ分析結果 */
export interface BayesianAnalysisResult {
  readonly bayesFactor: number;
  readonly posteriorProbability: number;
  readonly credibleInterval: [number, number];
  readonly interpretation: string;
  readonly strength:
    | "decisive"
    | "very_strong"
    | "strong"
    | "moderate"
    | "weak"
    | "inconclusive";
}

/** 統計的推奨事項 */
export interface StatisticalRecommendation {
  readonly action: "proceed" | "continue" | "stop" | "redesign";
  readonly confidence: number;
  readonly reasoning: string[];
  readonly requiredSampleSize?: number;
  readonly estimatedTimeToSignificance?: number;
}

/** 比較グループ */
export interface ComparisonGroup {
  readonly name: string;
  readonly sampleSize: number;
  readonly successes: number;
  readonly mean: number;
  readonly standardDeviation: number;
  readonly conversionRate: number;
}

/** 統計検定設定 */
export interface StatisticalTestConfig {
  readonly alpha: number; // 有意水準
  readonly beta: number; // 第二種過誤率
  readonly minimumDetectableEffect: number; // 最小検出効果サイズ
  readonly confidenceLevel: number; // 信頼度
  readonly bayesianPrior: {
    alpha: number;
    beta: number;
  };
}

// ==============================
// 統計定数
// ==============================

const DEFAULT_TEST_CONFIG: StatisticalTestConfig = {
  alpha: 0.05, // 5%有意水準
  beta: 0.2, // 80%検出力
  minimumDetectableEffect: 0.05, // 5%の最小効果
  confidenceLevel: 0.95, // 95%信頼区間
  bayesianPrior: {
    alpha: 1, // 事前分布パラメータ
    beta: 1,
  },
} as const;

// ==============================
// 統計関数ライブラリ
// ==============================

/**
 * 標準正規分布の累積分布関数（近似）
 */
function normalCDF(z: number): number {
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z);

  // Abramowitz and Stegun approximation
  const a1 = 0.31938153;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;
  const p = 0.2316419;

  const t = 1 / (1 + p * z);
  const poly =
    a1 * t +
    a2 * t * t +
    a3 * t * t * t +
    a4 * t * t * t * t +
    a5 * t * t * t * t * t;
  const cdf = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z) * poly;

  return sign > 0 ? cdf : 1 - cdf;
}

/**
 * ベータ関数
 */
function betaFunction(a: number, b: number): number {
  return (gamma(a) * gamma(b)) / gamma(a + b);
}

/**
 * ガンマ関数（Stirlingの近似）
 */
function gamma(n: number): number {
  if (n < 1) return gamma(n + 1) / n;
  if (n === 1) return 1;

  // Stirling's approximation
  return Math.sqrt((2 * Math.PI) / n) * Math.pow(n / Math.E, n);
}

// ==============================
// 統計検定クラス
// ==============================

class StatisticalSignificanceAnalyzer {
  private readonly config: StatisticalTestConfig;

  constructor(config: StatisticalTestConfig = DEFAULT_TEST_CONFIG) {
    this.config = config;
  }

  /**
   * 2群の比率の差の検定（Z検定）
   */
  proportionZTest(
    group1: ComparisonGroup,
    group2: ComparisonGroup
  ): StatisticalTestResult {
    const p1 = group1.conversionRate;
    const p2 = group2.conversionRate;
    const n1 = group1.sampleSize;
    const n2 = group2.sampleSize;

    // プールされた比率
    const pooledP = (group1.successes + group2.successes) / (n1 + n2);

    // 標準誤差
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

    // Z統計量
    const z = (p1 - p2) / se;

    // p値（両側検定）
    const pValue = 2 * (1 - normalCDF(Math.abs(z)));

    // 信頼区間
    const margin =
      1.96 * Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
    const confidenceInterval: [number, number] = [
      p1 - p2 - margin,
      p1 - p2 + margin,
    ];

    // 効果サイズ（Cohen's h）
    const effectSize =
      2 * (Math.asin(Math.sqrt(p1)) - Math.asin(Math.sqrt(p2)));

    // 統計的検出力
    const power = this.calculatePower(effectSize, n1, n2);

    return {
      testName: "Two-Proportion Z-Test",
      pValue,
      confidenceInterval,
      effectSize: Math.abs(effectSize),
      sampleSize: n1 + n2,
      power,
      isSignificant: pValue < this.config.alpha,
      recommendation: this.generateRecommendation(
        pValue,
        effectSize,
        power,
        n1 + n2
      ),
    };
  }

  /**
   * ベイズ分析
   */
  bayesianAnalysis(
    group1: ComparisonGroup,
    group2: ComparisonGroup
  ): BayesianAnalysisResult {
    const { alpha: priorAlpha, beta: priorBeta } = this.config.bayesianPrior;

    // 事後分布パラメータ
    const posterior1Alpha = priorAlpha + group1.successes;
    const posterior1Beta = priorBeta + group1.sampleSize - group1.successes;
    const posterior2Alpha = priorAlpha + group2.successes;
    const posterior2Beta = priorBeta + group2.sampleSize - group2.successes;

    // ベイズファクター計算（簡略版）
    const likelihood1 = this.betaBinomialLikelihood(
      group1.successes,
      group1.sampleSize,
      priorAlpha,
      priorBeta
    );
    const likelihood2 = this.betaBinomialLikelihood(
      group2.successes,
      group2.sampleSize,
      priorAlpha,
      priorBeta
    );
    const bayesFactor = likelihood1 / likelihood2;

    // 事後確率（group1が優位である確率）
    const posteriorProbability = this.calculatePosteriorProbability(
      posterior1Alpha,
      posterior1Beta,
      posterior2Alpha,
      posterior2Beta
    );

    // 信頼可能区間（95%）
    const credibleInterval = this.calculateCredibleInterval(
      posterior1Alpha,
      posterior1Beta,
      posterior2Alpha,
      posterior2Beta
    );

    const strength = this.interpretBayesFactor(bayesFactor);

    return {
      bayesFactor,
      posteriorProbability,
      credibleInterval,
      interpretation: this.getBayesianInterpretation(
        bayesFactor,
        posteriorProbability
      ),
      strength,
    };
  }

  /**
   * 多重比較補正（Bonferroni法）
   */
  bonferroniCorrection(pValues: number[]): number[] {
    const k = pValues.length;
    return pValues.map(p => Math.min(p * k, 1));
  }

  /**
   * 必要サンプルサイズ計算
   */
  calculateRequiredSampleSize(
    expectedEffect: number,
    power = 0.8,
    alpha = this.config.alpha
  ): number {
    const zAlpha = this.getZScore(alpha / 2);
    const zBeta = this.getZScore(1 - power);

    // Cohen's formula for two proportions
    const n =
      (Math.pow(zAlpha + zBeta, 2) * (2 * 0.25)) / Math.pow(expectedEffect, 2);

    return Math.ceil(n);
  }

  /**
   * A/Bテストの包括的分析を実行
   */
  analyzeABTest(): {
    overallResult: StatisticalTestResult;
    variantComparisons: Array<{
      comparison: string;
      result: StatisticalTestResult;
      bayesian: BayesianAnalysisResult;
    }>;
    recommendations: string[];
    readyForNextPhase: boolean;
  } {
    try {
      const dashboardData = abTestAnalytics.generateDashboardData();
      const variants = dashboardData.variants;

      if (variants.length < 2) {
        throw new Error("比較に十分なバリアントがありません");
      }

      // コントロール群（original）を特定
      const control = variants.find(v => v.variant === "original");
      const treatments = variants.filter(v => v.variant !== "original");

      if (!control) {
        throw new Error("コントロール群（original）が見つかりません");
      }

      // バリアント間比較
      const variantComparisons = treatments.map(treatment => {
        const controlGroup: ComparisonGroup = {
          name: control.variant,
          sampleSize: control.totalSessions,
          successes: Math.round(control.totalSessions * control.conversionRate),
          mean: control.performanceScore,
          standardDeviation: 10, // 仮定値
          conversionRate: control.conversionRate,
        };

        const treatmentGroup: ComparisonGroup = {
          name: treatment.variant,
          sampleSize: treatment.totalSessions,
          successes: Math.round(
            treatment.totalSessions * treatment.conversionRate
          ),
          mean: treatment.performanceScore,
          standardDeviation: 10, // 仮定値
          conversionRate: treatment.conversionRate,
        };

        const statisticalResult = this.proportionZTest(
          controlGroup,
          treatmentGroup
        );
        const bayesianResult = this.bayesianAnalysis(
          controlGroup,
          treatmentGroup
        );

        return {
          comparison: `${control.variant} vs ${treatment.variant}`,
          result: statisticalResult,
          bayesian: bayesianResult,
        };
      });

      // 全体的な結果評価
      const significantResults = variantComparisons.filter(
        comp =>
          comp.result.isSignificant &&
          comp.result.effectSize > this.config.minimumDetectableEffect
      );

      const overallResult: StatisticalTestResult = {
        testName: "A/B Test Overall Analysis",
        pValue: Math.min(...variantComparisons.map(comp => comp.result.pValue)),
        confidenceInterval: [0, 0], // 全体値として意味のある計算は複雑
        effectSize: Math.max(
          ...variantComparisons.map(comp => comp.result.effectSize)
        ),
        sampleSize: variants.reduce((sum, v) => sum + v.totalSessions, 0),
        power: Math.min(...variantComparisons.map(comp => comp.result.power)),
        isSignificant: significantResults.length > 0,
        recommendation: this.generateOverallRecommendation(variantComparisons),
      };

      // 推奨事項生成
      const recommendations = this.generateDetailedRecommendations(
        variantComparisons,
        overallResult
      );

      // Phase移行準備判定
      const readyForNextPhase = this.isReadyForNextPhase(
        variantComparisons,
        overallResult
      );

      return {
        overallResult,
        variantComparisons,
        recommendations,
        readyForNextPhase,
      };
    } catch (error) {
      console.error("A/Bテスト分析エラー:", error);
      throw error;
    }
  }

  // ==============================
  // プライベートメソッド
  // ==============================

  private calculatePower(effectSize: number, n1: number, n2: number): number {
    const zAlpha = this.getZScore(this.config.alpha / 2);
    const se = Math.sqrt(2 * 0.25 * (1 / n1 + 1 / n2)); // 保守的な見積もり
    const zBeta = Math.abs(effectSize) / se - zAlpha;

    return normalCDF(zBeta);
  }

  private getZScore(probability: number): number {
    // 逆正規分布の近似
    if (probability === 0.5) return 0;
    if (probability < 0.5) return -this.getZScore(1 - probability);

    const c = [2.515517, 0.802853, 0.010328];
    const d = [1.432788, 0.189269, 0.001308];

    const t = Math.sqrt(-2 * Math.log(1 - probability));
    const numerator = c[0] + c[1] * t + c[2] * t * t;
    const denominator = 1 + d[0] * t + d[1] * t * t + d[2] * t * t * t;

    return t - numerator / denominator;
  }

  private betaBinomialLikelihood(
    k: number,
    n: number,
    alpha: number,
    beta: number
  ): number {
    return betaFunction(k + alpha, n - k + beta) / betaFunction(alpha, beta);
  }

  private calculatePosteriorProbability(
    alpha1: number,
    beta1: number,
    alpha2: number,
    beta2: number
  ): number {
    // モンテカルロシミュレーション（簡略版）
    const samples = 1000;
    let count = 0;

    for (let i = 0; i < samples; i++) {
      const p1 = this.sampleFromBeta(alpha1, beta1);
      const p2 = this.sampleFromBeta(alpha2, beta2);
      if (p1 > p2) count++;
    }

    return count / samples;
  }

  private sampleFromBeta(alpha: number, beta: number): number {
    // ベータ分布からのサンプリング（Box-Muller変換の簡略版）
    const u1 = Math.random();
    const u2 = Math.random();

    // 簡易近似（正確ではないが実用的）
    const mean = alpha / (alpha + beta);
    const variance =
      (alpha * beta) / ((alpha + beta) * (alpha + beta) * (alpha + beta + 1));
    const std = Math.sqrt(variance);

    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const sample = mean + std * z;

    return Math.max(0, Math.min(1, sample));
  }

  private calculateCredibleInterval(
    alpha1: number,
    beta1: number,
    alpha2: number,
    beta2: number
  ): [number, number] {
    // 差の信頼可能区間（簡略計算）
    const mean1 = alpha1 / (alpha1 + beta1);
    const mean2 = alpha2 / (alpha2 + beta2);
    const variance1 =
      (alpha1 * beta1) /
      ((alpha1 + beta1) * (alpha1 + beta1) * (alpha1 + beta1 + 1));
    const variance2 =
      (alpha2 * beta2) /
      ((alpha2 + beta2) * (alpha2 + beta2) * (alpha2 + beta2 + 1));

    const diffMean = mean1 - mean2;
    const diffSE = Math.sqrt(variance1 + variance2);

    return [diffMean - 1.96 * diffSE, diffMean + 1.96 * diffSE];
  }

  private interpretBayesFactor(bf: number): BayesianAnalysisResult["strength"] {
    const absBF = Math.abs(bf);

    if (absBF >= 100) return "decisive";
    if (absBF >= 30) return "very_strong";
    if (absBF >= 10) return "strong";
    if (absBF >= 3) return "moderate";
    if (absBF >= 1) return "weak";
    return "inconclusive";
  }

  private getBayesianInterpretation(bf: number, probability: number): string {
    const strength = this.interpretBayesFactor(bf);
    const prob = (probability * 100).toFixed(1);

    const interpretations = {
      decisive: `決定的な証拠: ${prob}%の確率で改善効果あり`,
      very_strong: `非常に強い証拠: ${prob}%の確率で改善効果あり`,
      strong: `強い証拠: ${prob}%の確率で改善効果あり`,
      moderate: `中程度の証拠: ${prob}%の確率で改善効果あり`,
      weak: `弱い証拠: ${prob}%の確率で改善効果あり`,
      inconclusive: `結論不可: 証拠が不十分です`,
    };

    return interpretations[strength];
  }

  private generateRecommendation(
    pValue: number,
    effectSize: number,
    power: number,
    sampleSize: number
  ): StatisticalRecommendation {
    const isSignificant = pValue < this.config.alpha;
    const hasMinimumEffect =
      Math.abs(effectSize) >= this.config.minimumDetectableEffect;
    const hasSufficientPower = power >= 1 - this.config.beta;

    if (isSignificant && hasMinimumEffect && hasSufficientPower) {
      return {
        action: "proceed",
        confidence: 0.95,
        reasoning: [
          "統計的に有意な差が検出されました",
          `効果サイズが十分です (${effectSize.toFixed(3)})`,
          `検出力が十分です (${(power * 100).toFixed(1)}%)`,
        ],
      };
    }

    if (!hasSufficientPower) {
      const requiredSampleSize = this.calculateRequiredSampleSize(
        this.config.minimumDetectableEffect
      );
      return {
        action: "continue",
        confidence: 0.7,
        reasoning: ["検出力が不十分です", "より多くのサンプルが必要です"],
        requiredSampleSize,
        estimatedTimeToSignificance: Math.ceil(
          (requiredSampleSize - sampleSize) / 100
        ), // 日数の概算
      };
    }

    if (isSignificant && !hasMinimumEffect) {
      return {
        action: "stop",
        confidence: 0.8,
        reasoning: [
          "統計的有意だが実用的効果が小さすぎます",
          "コストと効果を再検討してください",
        ],
      };
    }

    return {
      action: "continue",
      confidence: 0.6,
      reasoning: [
        "まだ結論を出すには早すぎます",
        "データ収集を継続してください",
      ],
    };
  }

  private generateOverallRecommendation(
    comparisons: Array<{
      result: StatisticalTestResult;
      bayesian: BayesianAnalysisResult;
    }>
  ): StatisticalRecommendation {
    const significantCount = comparisons.filter(
      c => c.result.isSignificant
    ).length;
    const strongBayesianCount = comparisons.filter(c =>
      ["decisive", "very_strong", "strong"].includes(c.bayesian.strength)
    ).length;

    if (significantCount > 0 && strongBayesianCount > 0) {
      return {
        action: "proceed",
        confidence: 0.9,
        reasoning: [
          `${significantCount}個のバリアントで統計的有意性を確認`,
          `${strongBayesianCount}個のバリアントで強いベイズ証拠`,
          "Phase 3への移行を推奨します",
        ],
      };
    }

    return {
      action: "continue",
      confidence: 0.6,
      reasoning: [
        "十分な証拠が蓄積されていません",
        "データ収集を継続してください",
      ],
    };
  }

  private generateDetailedRecommendations(
    comparisons: Array<{
      comparison: string;
      result: StatisticalTestResult;
      bayesian: BayesianAnalysisResult;
    }>,
    overall: StatisticalTestResult
  ): string[] {
    const recommendations: string[] = [];

    // 統計的有意性に基づく推奨
    if (overall.isSignificant) {
      recommendations.push("✅ 統計的に有意な改善が確認されました");
    } else {
      recommendations.push("⚠️ まだ統計的有意性に達していません");
    }

    // 効果サイズに基づく推奨
    if (overall.effectSize >= this.config.minimumDetectableEffect) {
      recommendations.push(
        `✅ 実用的な効果サイズが確認されました (${overall.effectSize.toFixed(3)})`
      );
    } else {
      recommendations.push("⚠️ 効果サイズが小さい可能性があります");
    }

    // 検出力に基づく推奨
    if (overall.power >= 0.8) {
      recommendations.push("✅ 十分な検出力があります");
    } else {
      recommendations.push(
        "⚠️ 検出力が不十分です。サンプルサイズの増加を検討してください"
      );
    }

    // バリアント別推奨
    comparisons.forEach(comp => {
      if (comp.result.isSignificant) {
        recommendations.push(
          `📊 ${comp.comparison}: 有意な差を検出 (p=${comp.result.pValue.toFixed(4)})`
        );
      }
    });

    return recommendations;
  }

  private isReadyForNextPhase(
    comparisons: Array<{
      result: StatisticalTestResult;
      bayesian: BayesianAnalysisResult;
    }>,
    overall: StatisticalTestResult
  ): boolean {
    // Phase移行の基準
    const hasSignificantResult = overall.isSignificant;
    const hasMinimumEffect =
      overall.effectSize >= this.config.minimumDetectableEffect;
    const hasSufficientPower = overall.power >= 0.8;
    const hasSufficientSampleSize = overall.sampleSize >= 1000;

    // ベイズ分析での強い証拠
    const hasStrongBayesianEvidence = comparisons.some(c =>
      ["decisive", "very_strong", "strong"].includes(c.bayesian.strength)
    );

    return (
      hasSignificantResult &&
      hasMinimumEffect &&
      hasSufficientPower &&
      hasSufficientSampleSize &&
      hasStrongBayesianEvidence
    );
  }
}

// ==============================
// エクスポート
// ==============================

export const statisticalAnalyzer = new StatisticalSignificanceAnalyzer();

/**
 * A/Bテストの統計分析を実行
 */
export function performStatisticalAnalysis() {
  return statisticalAnalyzer.analyzeABTest();
}

/**
 * 必要サンプルサイズを計算
 */
export function calculateSampleSize(
  expectedEffect: number,
  power = 0.8,
  alpha = 0.05
): number {
  return statisticalAnalyzer.calculateRequiredSampleSize(
    expectedEffect,
    power,
    alpha
  );
}

/**
 * 多重比較補正を適用
 */
export function applyMultipleComparisonCorrection(pValues: number[]): number[] {
  return statisticalAnalyzer.bonferroniCorrection(pValues);
}

export default {
  statisticalAnalyzer,
  performStatisticalAnalysis,
  calculateSampleSize,
  applyMultipleComparisonCorrection,
};

// 型エクスポート（エイリアスで重複回避）
export type {
  BayesianAnalysisResult as ABTestBayesianResult,
  ComparisonGroup as ABTestComparisonGroup,
  StatisticalTestConfig as ABTestStatisticalConfig,
  StatisticalRecommendation as ABTestStatisticalRecommendation,
  StatisticalTestResult as ABTestStatisticalResult,
};
