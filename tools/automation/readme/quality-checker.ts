#!/usr/bin/env node

/**
 * README テンプレート準拠度チェック・SCRAP原則評価システム
 */

import * as fs from "fs";
import * as path from "path";

interface TemplateRequirement {
  id: string;
  name: string;
  pattern: RegExp;
  required: boolean;
  weight: number;
  description: string;
}

interface SCRAPCriteria {
  specific: number;
  concise: number;
  relevant: number;
  actionable: number;
  practical: number;
}

interface QualityAssessment {
  file: string;
  templateCompliance: {
    score: number;
    maxScore: number;
    percentage: number;
    missing: string[];
    present: string[];
  };
  scrapCompliance: {
    score: SCRAPCriteria;
    overall: number;
    grade: "A" | "B" | "C" | "D" | "F";
  };
  recommendations: string[];
}

class ReadmeQualityChecker {
  private projectRoot: string;

  // 標準テンプレート要件定義
  private templateRequirements: TemplateRequirement[] = [
    {
      id: "title",
      name: "タイトル",
      pattern: /^#\s+[^\n]+/m,
      required: true,
      weight: 5,
      description: "明確なタイトルが必要",
    },
    {
      id: "purpose",
      name: "目的セクション",
      pattern: />\s*🎯\s*\*\*目的\*\*:/m,
      required: true,
      weight: 10,
      description: "🎯 目的の明記が必要",
    },
    {
      id: "target",
      name: "対象読者",
      pattern: />\s*\*\*対象\*\*:/m,
      required: true,
      weight: 8,
      description: "対象読者の明記が必要",
    },
    {
      id: "lastUpdated",
      name: "最終更新日",
      pattern: />\s*\*\*最終更新\*\*:\s*\d{4}\s*年/m,
      required: true,
      weight: 5,
      description: "最終更新日の記載が必要",
    },
    {
      id: "toc",
      name: "目次",
      pattern: /##\s+📋?\s*(目次|Contents)/m,
      required: false,
      weight: 3,
      description: "目次があると良い",
    },
    {
      id: "quickStart",
      name: "クイックスタート",
      pattern: /##\s+🚀?\s*(クイックスタート|Quick\s*Start|使用方法|Usage)/m,
      required: false,
      weight: 7,
      description: "クイックスタートセクションがあると良い",
    },
    {
      id: "codeExamples",
      name: "コード例",
      pattern: /```[\s\S]*?```/m,
      required: false,
      weight: 6,
      description: "コード例があると実用的",
    },
    {
      id: "links",
      name: "関連リンク",
      pattern: /##\s+🔗?\s*(関連|Links|References)/m,
      required: false,
      weight: 4,
      description: "関連リンクがあると良い",
    },
  ];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * テンプレート準拠度チェック
   */
  private checkTemplateCompliance(
    content: string
  ): QualityAssessment["templateCompliance"] {
    let score = 0;
    let maxScore = 0;
    const missing: string[] = [];
    const present: string[] = [];

    for (const requirement of this.templateRequirements) {
      maxScore += requirement.weight;

      if (requirement.pattern.test(content)) {
        score += requirement.weight;
        present.push(requirement.name);
      } else if (requirement.required) {
        missing.push(requirement.description);
      }
    }

    return {
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      missing,
      present,
    };
  }

  /**
   * SCRAP原則評価
   */
  private assessSCRAP(content: string): QualityAssessment["scrapCompliance"] {
    const wordCount = content.split(/\s+/).length;
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
    const links = (content.match(/\[([^\]]*)\]\(([^)]+)\)/g) || []).length;
    const headers = (content.match(/^#+\s/gm) || []).length;

    // Specific (具体性): 具体的な例、数値、明確な説明
    const specificScore = Math.min(
      100,
      codeBlocks * 20 +
        links * 5 +
        (content.match(/\d+/g) || []).length * 2 +
        (content.match(/例:|Example:|たとえば/g) || []).length * 10
    );

    // Concise (簡潔性): 適切な文書長、冗長でない
    const idealWordCount = 800; // 理想的な語数
    const concisenessRatio = Math.min(
      1,
      idealWordCount / Math.max(wordCount, 1)
    );
    const conciseScore = Math.round(concisenessRatio * 100);

    // Relevant (関連性): トピックの一貫性、対象読者との関連性
    const relevantScore = Math.min(
      100,
      headers * 10 + // 構造化されている
        (content.match(/🎯|対象|目的/g) || []).length * 15 + // 目的が明確
        (content.match(/##\s+/g) || []).length * 8 // セクション分けされている
    );

    // Actionable (実行可能性): 具体的な手順、コマンド例
    const actionableScore = Math.min(
      100,
      codeBlocks * 25 + // コード例
        (content.match(/```bash|```sh|```powershell/g) || []).length * 30 + // コマンド例
        (content.match(/\d+\.\s|\*\s|-\s/g) || []).length * 2 + // リスト形式の手順
        (content.match(/手順|Steps|How to|方法/g) || []).length * 15
    );

    // Practical (実用性): 実際の使用場面、問題解決
    const practicalScore = Math.min(
      100,
      (content.match(/問題|Problem|トラブル|Error|FAQ/g) || []).length * 15 +
        (content.match(/解決|Solution|Fix|対応/g) || []).length * 15 +
        (content.match(/使用方法|Usage|実装|Implementation/g) || []).length *
          10 +
        links * 3 // 外部リソースへのリンク
    );

    const scrapScore: SCRAPCriteria = {
      specific: Math.round(specificScore),
      concise: Math.round(conciseScore),
      relevant: Math.round(relevantScore),
      actionable: Math.round(actionableScore),
      practical: Math.round(practicalScore),
    };

    const overall = Math.round(
      (scrapScore.specific +
        scrapScore.concise +
        scrapScore.relevant +
        scrapScore.actionable +
        scrapScore.practical) /
        5
    );

    let grade: "A" | "B" | "C" | "D" | "F";
    if (overall >= 90) grade = "A";
    else if (overall >= 80) grade = "B";
    else if (overall >= 70) grade = "C";
    else if (overall >= 60) grade = "D";
    else grade = "F";

    return {
      score: scrapScore,
      overall,
      grade,
    };
  }

  /**
   * 改善推奨事項生成
   */
  private generateRecommendations(
    templateResult: QualityAssessment["templateCompliance"],
    scrapResult: QualityAssessment["scrapCompliance"]
  ): string[] {
    const recommendations: string[] = [];

    // テンプレート準拠度の改善
    if (templateResult.percentage < 80) {
      templateResult.missing.forEach((missing) => {
        recommendations.push(`📝 ${missing}`);
      });
    }

    // SCRAP原則の改善
    if (scrapResult.score.specific < 70) {
      recommendations.push("🎯 具体的な例やコード例を追加してください");
    }

    if (scrapResult.score.concise < 70) {
      recommendations.push(
        "✂️ 内容を簡潔にまとめ、冗長な部分を削除してください"
      );
    }

    if (scrapResult.score.relevant < 70) {
      recommendations.push(
        "🔗 対象読者との関連性を明確にし、構造を整理してください"
      );
    }

    if (scrapResult.score.actionable < 70) {
      recommendations.push("⚡ 実行可能な手順やコマンド例を追加してください");
    }

    if (scrapResult.score.practical < 70) {
      recommendations.push("🛠️ 実際の使用場面や問題解決方法を追加してください");
    }

    return recommendations;
  }

  /**
   * 単一ファイルの品質評価
   */
  public assessFile(filePath: string): QualityAssessment {
    const content = fs.readFileSync(filePath, "utf-8");

    const templateCompliance = this.checkTemplateCompliance(content);
    const scrapCompliance = this.assessSCRAP(content);
    const recommendations = this.generateRecommendations(
      templateCompliance,
      scrapCompliance
    );

    return {
      file: filePath,
      templateCompliance,
      scrapCompliance,
      recommendations,
    };
  }

  /**
   * 全READMEファイルの品質評価
   */
  public async assessAllFiles(): Promise<QualityAssessment[]> {
    console.log("📊 Starting quality assessment...\n");

    // README ファイルを手動で検索（globなしで実装）
    const readmeFiles: string[] = [];

    const searchDirectory = (dir: string, basePath: string = ""): void => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativePath = path.join(basePath, item);

          // 除外ディレクトリ
          if (["node_modules", "dist", ".git", ".vscode"].includes(item)) {
            continue;
          }

          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            searchDirectory(fullPath, relativePath);
          } else if (item === "README.md") {
            readmeFiles.push(fullPath);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.debug(`Cannot access directory ${dir}: ${errorMessage}`);
      }
    };

    searchDirectory(this.projectRoot);

    const results: QualityAssessment[] = [];
    let totalTemplateScore = 0;
    let totalSCRAPScore = 0;

    for (const readmeFile of readmeFiles) {
      const relativePath = path.relative(this.projectRoot, readmeFile);
      console.log(`📋 Assessing: ${relativePath}`);

      try {
        const assessment = this.assessFile(readmeFile);
        results.push(assessment);

        totalTemplateScore += assessment.templateCompliance.percentage;
        totalSCRAPScore += assessment.scrapCompliance.overall;

        console.log(
          `   Template: ${assessment.templateCompliance.percentage}%`
        );
        console.log(
          `   SCRAP: ${assessment.scrapCompliance.overall}% (${assessment.scrapCompliance.grade})`
        );

        if (assessment.recommendations.length > 0) {
          console.log(
            `   💡 ${assessment.recommendations.length} recommendations`
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`   💥 Error assessing ${relativePath}: ${errorMessage}`);
      }
    }

    console.log(`\n📈 Quality assessment complete:`);
    console.log(`   Files assessed: ${results.length}`);
    console.log(
      `   Average template compliance: ${Math.round(
        totalTemplateScore / results.length
      )}%`
    );
    console.log(
      `   Average SCRAP score: ${Math.round(totalSCRAPScore / results.length)}%`
    );

    return results;
  }

  /**
   * 品質レポート生成
   */
  public generateQualityReport(assessments: QualityAssessment[]): string {
    const report: string[] = [];

    report.push("# 📊 README Quality Assessment Report");
    report.push("");
    report.push(`> Generated: ${new Date().toISOString()}`);
    report.push("");

    // サマリー
    const avgTemplate = Math.round(
      assessments.reduce((sum, a) => sum + a.templateCompliance.percentage, 0) /
        assessments.length
    );
    const avgSCRAP = Math.round(
      assessments.reduce((sum, a) => sum + a.scrapCompliance.overall, 0) /
        assessments.length
    );

    report.push("## 📈 Overall Summary");
    report.push("");
    report.push(`- **Files assessed**: ${assessments.length}`);
    report.push(`- **Average template compliance**: ${avgTemplate}%`);
    report.push(`- **Average SCRAP score**: ${avgSCRAP}%`);
    report.push("");

    // グレード分布
    const gradeDistribution = assessments.reduce((acc, a) => {
      acc[a.scrapCompliance.grade] = (acc[a.scrapCompliance.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    report.push("## 📊 Grade Distribution");
    report.push("");
    Object.entries(gradeDistribution).forEach(([grade, count]) => {
      report.push(`- **Grade ${grade}**: ${count} files`);
    });
    report.push("");

    // 個別ファイル詳細
    report.push("## 📋 Detailed Results");
    report.push("");

    assessments.forEach((assessment) => {
      const relativePath = path.relative(this.projectRoot, assessment.file);
      report.push(`### \`${relativePath}\``);
      report.push("");

      report.push(
        `**Template Compliance**: ${assessment.templateCompliance.percentage}%`
      );
      report.push(
        `**SCRAP Score**: ${assessment.scrapCompliance.overall}% (Grade ${assessment.scrapCompliance.grade})`
      );
      report.push("");

      report.push("**SCRAP Breakdown**:");

      report.push(`- Specific: ${assessment.scrapCompliance.score.specific}%`);
      report.push(`- Concise: ${assessment.scrapCompliance.score.concise}%`);
      report.push(`- Relevant: ${assessment.scrapCompliance.score.relevant}%`);
      report.push(
        `- Actionable: ${assessment.scrapCompliance.score.actionable}%`
      );
      report.push(
        `- Practical: ${assessment.scrapCompliance.score.practical}%`
      );

      if (assessment.recommendations.length > 0) {
        report.push("");
        report.push("**Recommendations**:");

        assessment.recommendations.forEach((rec) => {
          report.push(`- ${rec}`);
        });
      }

      report.push("");
    });

    return report.join("\n");
  }
}

// CLI 実行
if (
  import.meta.url.startsWith("file:") &&
  import.meta.url.includes(process.argv[1])
) {
  const args = process.argv.slice(2);
  const checker = new ReadmeQualityChecker();

  async function main() {
    if (args.length > 0) {
      // 特定ファイル評価
      const assessment = checker.assessFile(args[0]);
      console.log(JSON.stringify(assessment, null, 2));
    } else {
      // 全ファイル評価
      const assessments = await checker.assessAllFiles();
      const report = checker.generateQualityReport(assessments);

      // レポート保存
      fs.writeFileSync("tools/reports/readme-quality-report.md", report);
      console.log(
        "\n📄 Quality report saved to: tools/reports/readme-quality-report.md"
      );
    }
  }

  main().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in main execution: ${errorMessage}`);
  });
}

export { ReadmeQualityChecker };
