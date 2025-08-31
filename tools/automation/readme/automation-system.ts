#!/usr/bin/env node

/**
 * README 自動化システム統合インターフェース
 * 全ての自動化機能を統合して実行
 */

import * as fs from "fs";
import * as path from "path";
import { LinkValidator } from "./link-validator";
import { ReadmeQualityChecker } from "./quality-checker";
import { TechStackSynchronizer } from "./tech-stack-sync";

interface AutomationConfig {
  enableTechStackSync: boolean;
  enableLinkValidation: boolean;
  enableQualityCheck: boolean;
  enableAutoFix: boolean;
  generateReports: boolean;
}

interface AutomationResult {
  timestamp: string;
  techStackSync?: {
    executed: boolean;
    filesUpdated: number;
    errors: string[];
  };
  linkValidation?: {
    executed: boolean;
    totalLinks: number;
    brokenLinks: number;
    fixedLinks: number;
    errors: string[];
  };
  qualityCheck?: {
    executed: boolean;
    filesAssessed: number;
    averageTemplateScore: number;
    averageSCRAPScore: number;
    errors: string[];
  };
}

class ReadmeAutomationSystem {
  private projectRoot: string;
  private config: AutomationConfig;
  private techStackSync: TechStackSynchronizer;
  private linkValidator: LinkValidator;
  private qualityChecker: ReadmeQualityChecker;

  constructor(
    projectRoot: string = process.cwd(),
    config: Partial<AutomationConfig> = {}
  ) {
    this.projectRoot = projectRoot;
    this.config = {
      enableTechStackSync: true,
      enableLinkValidation: true,
      enableQualityCheck: true,
      enableAutoFix: false,
      generateReports: true,
      ...config,
    };

    this.techStackSync = new TechStackSynchronizer(projectRoot);
    this.linkValidator = new LinkValidator(projectRoot);
    this.qualityChecker = new ReadmeQualityChecker(projectRoot);
  }

  /**
   * 技術スタック同期実行
   */
  private async executeTechStackSync(): Promise<
    AutomationResult["techStackSync"]
  > {
    console.log("🔄 Running tech stack synchronization...");

    const result = {
      executed: true,
      filesUpdated: 0,
      errors: [] as string[],
    };

    try {
      // README ファイルを検索
      const readmeFiles = this.findReadmeFiles();

      for (const readmeFile of readmeFiles) {
        try {
          // 既存のファイル内容を確認
          const content = fs.readFileSync(readmeFile, "utf-8");

          // 技術スタックセクションがある場合のみ更新
          if (content.includes("## 🛠️ 技術スタック")) {
            this.techStackSync.syncSpecificReadme(readmeFile);
            result.filesUpdated++;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          result.errors.push(`Error syncing ${readmeFile}: ${errorMessage}`);
        }
      }

      console.log(
        `✅ Tech stack sync complete: ${result.filesUpdated} files updated`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push(`Tech stack sync failed: ${errorMessage}`);
      console.error("❌ Tech stack sync failed:", errorMessage);
    }

    return result;
  }

  /**
   * リンク検証実行
   */
  private async executeLinkValidation(): Promise<
    AutomationResult["linkValidation"]
  > {
    console.log("🔍 Running link validation...");

    const result = {
      executed: true,
      totalLinks: 0,
      brokenLinks: 0,
      fixedLinks: 0,
      errors: [] as string[],
    };

    try {
      const linkResults = await this.linkValidator.checkAllFiles();

      result.totalLinks = linkResults.reduce(
        (sum, r) => sum + r.valid.length + r.broken.length,
        0
      );
      result.brokenLinks = linkResults.reduce(
        (sum, r) => sum + r.broken.length,
        0
      );

      // 自動修正が有効な場合
      if (this.config.enableAutoFix) {
        const fixableResults = linkResults.filter((r) =>
          r.suggestions.some((s) => s.suggestion)
        );

        if (fixableResults.length > 0) {
          await this.linkValidator.autoFix(fixableResults);
          result.fixedLinks = fixableResults.reduce(
            (sum, r) => sum + r.suggestions.filter((s) => s.suggestion).length,
            0
          );
        }
      }

      // レポート生成
      if (this.config.generateReports) {
        const report = this.linkValidator.generateReport(linkResults);
        const reportPath = path.join(
          this.projectRoot,
          "tools",
          "reports",
          "link-validation-report.md"
        );
        this.ensureDirectoryExists(path.dirname(reportPath));
        fs.writeFileSync(reportPath, report);
      }

      console.log(
        `✅ Link validation complete: ${result.brokenLinks}/${result.totalLinks} broken links found`
      );

      if (result.fixedLinks > 0) {
        console.log(`🔧 Auto-fixed: ${result.fixedLinks} links`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push(`Link validation failed: ${errorMessage}`);
      console.error("❌ Link validation failed:", errorMessage);
    }

    return result;
  }

  /**
   * 品質チェック実行
   */
  private async executeQualityCheck(): Promise<
    AutomationResult["qualityCheck"]
  > {
    console.log("📊 Running quality assessment...");

    const result = {
      executed: true,
      filesAssessed: 0,
      averageTemplateScore: 0,
      averageSCRAPScore: 0,
      errors: [] as string[],
    };

    try {
      const assessments = await this.qualityChecker.assessAllFiles();

      result.filesAssessed = assessments.length;
      result.averageTemplateScore = Math.round(
        assessments.reduce(
          (sum, a) => sum + a.templateCompliance.percentage,
          0
        ) / assessments.length
      );
      result.averageSCRAPScore = Math.round(
        assessments.reduce((sum, a) => sum + a.scrapCompliance.overall, 0) /
          assessments.length
      );

      // レポート生成
      if (this.config.generateReports) {
        const report = this.qualityChecker.generateQualityReport(assessments);
        const reportPath = path.join(
          this.projectRoot,
          "tools",
          "reports",
          "readme-quality-report.md"
        );
        this.ensureDirectoryExists(path.dirname(reportPath));
        fs.writeFileSync(reportPath, report);
      }

      console.log(
        `✅ Quality check complete: Template ${result.averageTemplateScore}%, SCRAP ${result.averageSCRAPScore}%`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push(`Quality check failed: ${errorMessage}`);
      console.error("❌ Quality check failed:", errorMessage);
    }

    return result;
  }

  /**
   * README ファイル検索
   */
  private findReadmeFiles(): string[] {
    const readmeFiles: string[] = [];

    const searchDirectory = (dir: string): void => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);

          // 除外ディレクトリ
          if (["node_modules", "dist", ".git", ".vscode"].includes(item)) {
            continue;
          }

          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            searchDirectory(fullPath);
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
    return readmeFiles;
  }

  /**
   * ディレクトリ存在確認・作成
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * 全自動化プロセス実行
   */
  public async runAutomation(): Promise<AutomationResult> {
    console.log("🚀 Starting README automation system...\n");
    console.log("Configuration:");
    console.log(
      `  - Tech Stack Sync: ${this.config.enableTechStackSync ? "✅" : "❌"}`
    );
    console.log(
      `  - Link Validation: ${this.config.enableLinkValidation ? "✅" : "❌"}`
    );
    console.log(
      `  - Quality Check: ${this.config.enableQualityCheck ? "✅" : "❌"}`
    );
    console.log(`  - Auto Fix: ${this.config.enableAutoFix ? "✅" : "❌"}`);
    console.log(
      `  - Generate Reports: ${this.config.generateReports ? "✅" : "❌"}`
    );
    console.log("");

    const result: AutomationResult = {
      timestamp: new Date().toISOString(),
    };

    // 技術スタック同期
    if (this.config.enableTechStackSync) {
      result.techStackSync = await this.executeTechStackSync();
    }

    // リンク検証
    if (this.config.enableLinkValidation) {
      result.linkValidation = await this.executeLinkValidation();
    }

    // 品質チェック
    if (this.config.enableQualityCheck) {
      result.qualityCheck = await this.executeQualityCheck();
    }

    // 実行結果レポート保存
    if (this.config.generateReports) {
      const reportPath = path.join(
        this.projectRoot,
        "tools",
        "reports",
        "automation-result.json"
      );
      this.ensureDirectoryExists(path.dirname(reportPath));
      fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    }

    console.log("\n🎉 README automation complete!");
    console.log("📄 Reports saved to: ./tools/reports/");

    return result;
  }

  /**
   * 特定機能のみ実行
   */
  public async runSpecific(
    feature: "techstack" | "links" | "quality"
  ): Promise<void> {
    console.log(`🎯 Running specific automation: ${feature}\n`);

    switch (feature) {
      case "techstack":
        await this.executeTechStackSync();
        break;
      case "links":
        await this.executeLinkValidation();
        break;
      case "quality":
        await this.executeQualityCheck();
        break;
      default:
        console.error(`❌ Unknown feature: ${feature}`);
    }
  }

  /**
   * 設定更新
   */
  public updateConfig(newConfig: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// CLI 実行
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

console.log("Debug: __filename:", __filename);
console.log("Debug: process.argv[1]:", process.argv[1]);
console.log("Debug: isMainModule:", isMainModule);

console.log("Debug: __filename:", __filename);
console.log("Debug: process.argv[1]:", process.argv[1]);
console.log("Debug: isMainModule:", isMainModule);

if (isMainModule) {
  console.log("Debug: Entering main execution");
  console.log("Debug: Entering main execution");
  const args = process.argv.slice(2);

  async function main() {
    console.log("Debug: Starting main function");
    const automation = new ReadmeAutomationSystem();

    // コマンドライン引数による設定
    if (args.includes("--fix")) {
      automation.updateConfig({ enableAutoFix: true });
    }

    if (args.includes("--no-reports")) {
      automation.updateConfig({ generateReports: false });
    }

    // 特定機能実行
    if (args.includes("--techstack")) {
      await automation.runSpecific("techstack");
    } else if (args.includes("--links")) {
      await automation.runSpecific("links");
    } else if (args.includes("--quality")) {
      await automation.runSpecific("quality");
    } else {
      console.log("Debug: Starting full automation");
      // 全機能実行
      await automation.runAutomation();
    }
  }

  main().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in main execution: ${errorMessage}`);
  });
} else {
  console.log("Debug: Not executing main (import check failed)");
}

export { AutomationConfig, AutomationResult, ReadmeAutomationSystem };
