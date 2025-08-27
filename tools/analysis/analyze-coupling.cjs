/**
 * 依存関係分析・結合度測定スクリプト
 * Phase C2: モジュール結合度最適化
 */

const fs = require("fs");
const path = require("path");

class DependencyAnalyzer {
  constructor() {
    this.dependencyGraph = null;
    this.metrics = {
      highCoupling: [],
      circularRisk: [],
      interfaceViolations: [],
      recommendedSeparations: [],
    };
  }

  /**
   * 依存関係グラフを読み込み
   */
  loadDependencyGraph() {
    const graphPath = path.join(__dirname, "../../dependency-graph.json");
    if (!fs.existsSync(graphPath)) {
      throw new Error(
        "dependency-graph.json が見つかりません。先に check-circular-deps.cjs を実行してください。"
      );
    }
    this.dependencyGraph = JSON.parse(fs.readFileSync(graphPath, "utf8"));
  }

  /**
   * 結合度を計算
   */
  calculateCoupling() {
    const couplingScores = {};

    for (const [file, dependencies] of Object.entries(this.dependencyGraph)) {
      // 出力結合度（このファイルが依存するモジュール数）
      const efferentCoupling = dependencies.length;

      // 入力結合度（このファイルに依存するモジュール数）
      const afferentCoupling = Object.values(this.dependencyGraph).filter(
        (deps) =>
          deps.some(
            (dep) =>
              this.normalizePathForComparison(dep) ===
              this.normalizePathForComparison(file)
          )
      ).length;

      couplingScores[file] = {
        efferent: efferentCoupling,
        afferent: afferentCoupling,
        total: efferentCoupling + afferentCoupling,
        instability:
          efferentCoupling / (efferentCoupling + afferentCoupling) || 0,
      };
    }

    return couplingScores;
  }

  /**
   * パス正規化（比較用）
   */
  normalizePathForComparison(filePath) {
    return filePath.replace(/\\/g, "/").replace(/\.(ts|tsx)$/, "");
  }

  /**
   * レイヤー違反を検出
   */
  detectLayerViolations() {
    const violations = [];

    // レイヤー定義
    const layers = {
      ui: ["components"],
      application: ["app", "hooks"],
      domain: ["types"],
      infrastructure: ["services", "utils"],
      config: ["config", "data"],
    };

    for (const [file, dependencies] of Object.entries(this.dependencyGraph)) {
      const fileLayer = this.getFileLayer(file, layers);

      for (const dep of dependencies) {
        const depLayer = this.getFileLayer(dep, layers);

        // 禁止されたレイヤー依存を検出
        if (this.isProhibitedDependency(fileLayer, depLayer)) {
          violations.push({
            file,
            dependency: dep,
            violation: `${fileLayer} → ${depLayer}`,
            severity: this.getViolationSeverity(fileLayer, depLayer),
          });
        }
      }
    }

    return violations;
  }

  /**
   * ファイルのレイヤーを判定
   */
  getFileLayer(filePath, layers) {
    for (const [layer, patterns] of Object.entries(layers)) {
      if (patterns.some((pattern) => filePath.includes(pattern))) {
        return layer;
      }
    }
    return "unknown";
  }

  /**
   * 禁止された依存関係かチェック
   */
  isProhibitedDependency(fromLayer, toLayer) {
    const prohibitedDeps = {
      domain: ["ui", "application", "infrastructure"], // Domainは他に依存すべきではない
      infrastructure: ["ui", "application"], // Infrastructureは上位レイヤーに依存すべきではない
    };

    return prohibitedDeps[fromLayer]?.includes(toLayer) || false;
  }

  /**
   * 違反の重要度を取得
   */
  getViolationSeverity(fromLayer, toLayer) {
    if (fromLayer === "domain") return "HIGH";
    if (fromLayer === "infrastructure" && toLayer === "ui") return "HIGH";
    return "MEDIUM";
  }

  /**
   * インターフェース分離の機会を検出
   */
  detectInterfaceSeparationOpportunities() {
    const opportunities = [];
    const couplingScores = this.calculateCoupling();

    // 高結合ファイルを特定
    const highCouplingFiles = Object.entries(couplingScores)
      .filter(([file, scores]) => scores.total > 5)
      .sort((a, b) => b[1].total - a[1].total);

    for (const [file, scores] of highCouplingFiles) {
      const suggestions = this.generateSeparationSuggestions(file, scores);
      if (suggestions.length > 0) {
        opportunities.push({
          file,
          couplingScore: scores.total,
          suggestions,
        });
      }
    }

    return opportunities;
  }

  /**
   * 分離提案を生成
   */
  generateSeparationSuggestions(file, scores) {
    const suggestions = [];

    if (file.includes("components") && scores.efferent > 3) {
      suggestions.push("コンポーネントのPropsインターフェース抽出");
    }

    if (file.includes("hooks") && scores.afferent > 4) {
      suggestions.push("フックのインターフェース定義によるデカップリング");
    }

    if (file.includes("utils") && scores.afferent > 5) {
      suggestions.push("ユーティリティ関数の機能別分割");
    }

    if (scores.instability > 0.8) {
      suggestions.push("安定性向上のための依存関係逆転");
    }

    return suggestions;
  }

  /**
   * 最適化レポートを生成
   */
  generateOptimizationReport() {
    const couplingScores = this.calculateCoupling();
    const violations = this.detectLayerViolations();
    const opportunities = this.detectInterfaceSeparationOpportunities();

    const report = {
      summary: {
        totalFiles: Object.keys(this.dependencyGraph).length,
        highCouplingFiles: Object.values(couplingScores).filter(
          (s) => s.total > 5
        ).length,
        layerViolations: violations.length,
        optimizationOpportunities: opportunities.length,
      },
      highCouplingModules: Object.entries(couplingScores)
        .filter(([file, scores]) => scores.total > 5)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10),
      layerViolations: violations,
      interfaceSeparationOpportunities: opportunities,
      recommendations: this.generateRecommendations(
        couplingScores,
        violations,
        opportunities
      ),
    };

    return report;
  }

  /**
   * 最適化推奨事項を生成
   */
  generateRecommendations(couplingScores, violations, opportunities) {
    const recommendations = [];

    // 1. 循環依存回避
    recommendations.push({
      priority: "HIGH",
      category: "Architecture",
      action: "依存関係逆転原則の適用",
      description: "インターフェースを通じた抽象化で具象依存を排除",
    });

    // 2. レイヤー違反修正
    if (violations.length > 0) {
      recommendations.push({
        priority: "HIGH",
        category: "Layer Separation",
        action: "レイヤー違反の修正",
        description: `${violations.length}件のレイヤー違反を解決`,
      });
    }

    // 3. インターフェース分離
    if (opportunities.length > 0) {
      recommendations.push({
        priority: "MEDIUM",
        category: "Interface Segregation",
        action: "インターフェース分離の実装",
        description: "高結合モジュールのインターフェース抽出",
      });
    }

    return recommendations;
  }

  /**
   * メイン実行関数
   */
  run() {
    console.log("📊 依存関係分析を開始...");

    this.loadDependencyGraph();
    const report = this.generateOptimizationReport();

    // レポート出力
    console.log("\n=== 📈 結合度分析結果 ===");
    console.log(`総ファイル数: ${report.summary.totalFiles}`);
    console.log(`高結合ファイル数: ${report.summary.highCouplingFiles}`);
    console.log(`レイヤー違反: ${report.summary.layerViolations}件`);
    console.log(`最適化機会: ${report.summary.optimizationOpportunities}件`);

    if (report.highCouplingModules.length > 0) {
      console.log("\n🚨 高結合度モジュール (TOP 5):");
      report.highCouplingModules
        .slice(0, 5)
        .forEach(([file, scores], index) => {
          console.log(`${index + 1}. ${file}`);
          console.log(
            `   結合度: ${scores.total} (入力: ${scores.afferent}, 出力: ${scores.efferent})`
          );
          console.log(`   不安定性: ${(scores.instability * 100).toFixed(1)}%`);
        });
    }

    if (report.layerViolations.length > 0) {
      console.log("\n⚠️ レイヤー違反:");
      report.layerViolations.forEach((violation, index) => {
        console.log(
          `${index + 1}. ${violation.file} → ${violation.dependency}`
        );
        console.log(
          `   違反: ${violation.violation} (重要度: ${violation.severity})`
        );
      });
    }

    console.log("\n💡 推奨アクション:");
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.action}`);
      console.log(`   ${rec.description}`);
    });

    // 詳細レポートをファイルに保存
    fs.writeFileSync(
      path.join(__dirname, "../../coupling-analysis-report.json"),
      JSON.stringify(report, null, 2)
    );
    console.log("\n📄 coupling-analysis-report.json を生成しました");

    return report;
  }
}

// スクリプト実行
if (require.main === module) {
  const analyzer = new DependencyAnalyzer();
  analyzer.run();
}

module.exports = DependencyAnalyzer;
