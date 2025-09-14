/**
 * @fileoverview パフォーマンステストユーティリティ
 * 改善前後のパフォーマンス比較と測定
 */

/**
 * Core Web Vitals 測定結果
 */
interface WebVitalsMeasurement {
  readonly lcp: number; // Largest Contentful Paint
  readonly cls: number; // Cumulative Layout Shift
  readonly inp: number; // Interaction to Next Paint
  readonly ttfb: number; // Time to First Byte
  readonly fid?: number; // First Input Delay (legacy)
}

/**
 * パフォーマンス測定結果
 */
interface PerformanceTestResult {
  readonly testName: string;
  readonly timestamp: Date;
  readonly metrics: {
    readonly renderTime: number;
    readonly memoryUsage: number;
    readonly markerCount: number;
    readonly jsHeapSize?: number;
    readonly domNodes: number;
  };
  readonly webVitals?: WebVitalsMeasurement;
  readonly userAgent: string;
  readonly additionalInfo?: Record<string, unknown>;
}

/**
 * 比較テスト結果
 */
interface ComparisonResult {
  readonly baseline: PerformanceTestResult;
  readonly optimized: PerformanceTestResult;
  readonly improvements: {
    readonly renderTimeImprovement: number; // percentage
    readonly memoryImprovement: number; // percentage
    readonly performanceScore: number; // 0-100
  };
  readonly summary: string;
}

/**
 * パフォーマンステストユーティリティクラス
 */
export class MapPerformanceTester {
  private results: PerformanceTestResult[] = [];
  private observer?: PerformanceObserver;

  /**
   * Web Vitals測定の開始
   */
  private startWebVitalsMeasurement(): Promise<Partial<WebVitalsMeasurement>> {
    return new Promise(resolve => {
      const vitals: Record<string, number> = {};
      let measurementsComplete = 0;
      const totalMeasurements = 4; // LCP, CLS, INP, TTFB

      const checkComplete = () => {
        measurementsComplete++;
        if (measurementsComplete >= totalMeasurements) {
          resolve(vitals as Partial<WebVitalsMeasurement>);
        }
      };

      // Performance Observer for Web Vitals
      if ("PerformanceObserver" in window) {
        this.observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            switch (entry.entryType) {
              case "largest-contentful-paint":
                vitals.lcp = entry.startTime;
                checkComplete();
                break;
              case "layout-shift": {
                // 型安全なLayoutShiftEntryアクセス
                interface LayoutShiftEntry extends PerformanceEntry {
                  hadRecentInput?: boolean;
                  value: number;
                }
                const layoutEntry = entry as LayoutShiftEntry;
                if (!layoutEntry.hadRecentInput) {
                  vitals.cls = (vitals.cls || 0) + layoutEntry.value;
                }
                break;
              }
              case "first-input": {
                // 型安全なFirstInputEntryアクセス
                interface FirstInputEntry extends PerformanceEntry {
                  processingStart: number;
                }
                const inputEntry = entry as FirstInputEntry;
                vitals.fid = inputEntry.processingStart - entry.startTime;
                break;
              }
              case "navigation": {
                const navEntry = entry as PerformanceNavigationTiming;
                vitals.ttfb = navEntry.responseStart - navEntry.fetchStart;
                checkComplete();
                break;
              }
            }
          }
        });

        try {
          this.observer.observe({
            entryTypes: [
              "largest-contentful-paint",
              "layout-shift",
              "first-input",
              "navigation",
            ],
          });
        } catch (e) {
          console.warn("Some performance entries are not supported:", e);
        }
      }

      // CLS measurement completion
      setTimeout(() => {
        vitals.cls = vitals.cls || 0;
        checkComplete();
      }, 5000);

      // INP measurement (simplified)
      setTimeout(() => {
        vitals.inp = performance.now(); // Simplified measurement
        checkComplete();
      }, 1000);
    });
  }

  /**
   * メモリ使用量を取得
   */
  private getMemoryUsage(): number {
    // 型安全なperformance.memoryアクセス
    interface PerformanceWithMemory extends Performance {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }
    const perfWithMemory = performance as PerformanceWithMemory;
    if (perfWithMemory.memory?.usedJSHeapSize) {
      return perfWithMemory.memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  /**
   * JS Heap サイズを取得
   */
  private getJSHeapSize(): number | undefined {
    // 型安全なperformance.memoryアクセス
    interface PerformanceWithMemory extends Performance {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }
    const perfWithMemory = performance as PerformanceWithMemory;
    if (perfWithMemory.memory?.totalJSHeapSize) {
      return perfWithMemory.memory.totalJSHeapSize / (1024 * 1024); // MB
    }
    return undefined;
  }

  /**
   * DOM ノード数を取得
   */
  private getDOMNodeCount(): number {
    return document.getElementsByTagName("*").length;
  }

  /**
   * パフォーマンステストを実行
   */
  public async runTest(
    testName: string,
    testFunction: () => Promise<void> | void,
    markerCount: number = 0,
    additionalInfo?: Record<string, unknown>
  ): Promise<PerformanceTestResult> {
    console.log(`🚀 Starting performance test: ${testName}`);

    // GC実行（可能であれば）
    interface WindowWithGC extends Window {
      gc?: () => void;
    }
    const windowWithGC = window as WindowWithGC;
    if (windowWithGC.gc && typeof windowWithGC.gc === "function") {
      windowWithGC.gc();
    }

    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    // Web Vitals測定開始
    const webVitalsPromise = this.startWebVitalsMeasurement();

    try {
      // テスト関数実行
      await testFunction();

      // レンダリング完了まで待機
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
    } catch (error) {
      console.error(`❌ Test failed: ${testName}`, error);
      throw error;
    }

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    const renderTime = endTime - startTime;

    // Web Vitals測定結果を取得
    const webVitals = await Promise.race([
      webVitalsPromise,
      new Promise<Partial<WebVitalsMeasurement>>(resolve => {
        setTimeout(() => resolve({}), 10000); // 10秒でタイムアウト
      }),
    ]);

    const result: PerformanceTestResult = {
      testName,
      timestamp: new Date(),
      metrics: {
        renderTime,
        memoryUsage: endMemory - startMemory,
        markerCount,
        domNodes: this.getDOMNodeCount(),
        ...(this.getJSHeapSize() !== undefined && {
          jsHeapSize: this.getJSHeapSize() ?? 0,
        }),
      },
      webVitals: webVitals as WebVitalsMeasurement,
      userAgent: navigator.userAgent,
      ...(additionalInfo && { additionalInfo }),
    };

    this.results.push(result);

    console.log(`✅ Test completed: ${testName}`);
    console.table({
      "Render Time (ms)": renderTime.toFixed(2),
      "Memory Usage (MB)": result.metrics.memoryUsage.toFixed(2),
      "Marker Count": markerCount,
      "DOM Nodes": result.metrics.domNodes,
    });

    return result;
  }

  /**
   * ベースラインテスト（改善前）
   */
  public async runBaselineTest(
    testFunction: () => Promise<void> | void,
    markerCount: number = 0
  ): Promise<PerformanceTestResult> {
    return this.runTest(
      "Baseline (Before Optimization)",
      testFunction,
      markerCount,
      { optimization: false }
    );
  }

  /**
   * 最適化テスト（改善後）
   */
  public async runOptimizedTest(
    testFunction: () => Promise<void> | void,
    markerCount: number = 0
  ): Promise<PerformanceTestResult> {
    return this.runTest(
      "Optimized (After Optimization)",
      testFunction,
      markerCount,
      { optimization: true }
    );
  }

  /**
   * 結果比較
   */
  public compareResults(
    baselineResult: PerformanceTestResult,
    optimizedResult: PerformanceTestResult
  ): ComparisonResult {
    const renderTimeImprovement =
      ((baselineResult.metrics.renderTime -
        optimizedResult.metrics.renderTime) /
        baselineResult.metrics.renderTime) *
      100;

    const memoryImprovement =
      ((baselineResult.metrics.memoryUsage -
        optimizedResult.metrics.memoryUsage) /
        Math.abs(baselineResult.metrics.memoryUsage)) *
      100;

    // パフォーマンススコア計算 (0-100)
    let performanceScore = 50; // ベース点

    if (renderTimeImprovement > 0)
      performanceScore += Math.min(renderTimeImprovement, 25);
    if (memoryImprovement > 0)
      performanceScore += Math.min(memoryImprovement / 2, 25);

    performanceScore = Math.max(0, Math.min(100, performanceScore));

    const summary = this.generateSummary(
      renderTimeImprovement,
      memoryImprovement,
      performanceScore
    );

    return {
      baseline: baselineResult,
      optimized: optimizedResult,
      improvements: {
        renderTimeImprovement,
        memoryImprovement,
        performanceScore,
      },
      summary,
    };
  }

  /**
   * 改善サマリー生成
   */
  private generateSummary(
    renderImprovement: number,
    memoryImprovement: number,
    score: number
  ): string {
    const improvements: string[] = [];

    if (renderImprovement > 0) {
      improvements.push(
        `レンダリング速度 ${renderImprovement.toFixed(1)}% 向上`
      );
    }

    if (memoryImprovement > 0) {
      improvements.push(`メモリ使用量 ${memoryImprovement.toFixed(1)}% 削減`);
    }

    let scoreText = "改善なし";
    if (score >= 80) scoreText = "大幅改善";
    else if (score >= 60) scoreText = "顕著な改善";
    else if (score >= 40) scoreText = "軽微な改善";

    const improvementText =
      improvements.length > 0 ? " - " + improvements.join(", ") : "";
    return `${scoreText} (スコア: ${score.toFixed(1)}/100)${improvementText}`;
  }

  /**
   * 結果レポート生成
   */
  public generateReport(): string {
    if (this.results.length === 0) {
      return "📊 パフォーマンステスト結果がありません。";
    }

    let report = "📊 パフォーマンステストレポート\n\n";

    this.results.forEach((result, index) => {
      report += `## ${index + 1}. ${result.testName}\n`;
      report += `- 実行時間: ${result.metrics.renderTime.toFixed(2)}ms\n`;
      report += `- メモリ使用: ${result.metrics.memoryUsage.toFixed(2)}MB\n`;
      report += `- マーカー数: ${result.metrics.markerCount}\n`;
      report += `- DOM要素: ${result.metrics.domNodes}\n`;

      if (result.webVitals?.lcp) {
        report += `- LCP: ${result.webVitals.lcp.toFixed(2)}ms\n`;
      }
      if (result.webVitals?.cls !== undefined) {
        report += `- CLS: ${result.webVitals.cls.toFixed(4)}\n`;
      }

      report += `- 実行日時: ${result.timestamp.toISOString()}\n\n`;
    });

    return report;
  }

  /**
   * 結果をJSONでエクスポート
   */
  public exportResults(): string {
    return JSON.stringify(
      {
        results: this.results,
        exportTime: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
      null,
      2
    );
  }

  /**
   * 結果をクリア
   */
  public clearResults(): void {
    this.results = [];
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * すべての結果を取得
   */
  public getResults(): readonly PerformanceTestResult[] {
    return this.results;
  }
}

/**
 * グローバルパフォーマンステスターインスタンス（開発用）
 */
export const mapPerformanceTester = new MapPerformanceTester();

// 開発環境でグローバルに公開
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // @ts-expect-error - Adding global debug utility
  window.mapPerformanceTester = mapPerformanceTester;
}
