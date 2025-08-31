#!/usr/bin/env node

/**
 * README 技術スタック自動同期システム
 * package.json の依存関係を README ファイルに自動反映
 */

import * as fs from "fs";
import * as path from "path";

interface PackageInfo {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  engines?: Record<string, string>;
}

interface TechStackInfo {
  framework: string;
  version: string;
  language: string;
  runtime: string;
  buildTool: string;
  bundler: string;
  testing: string[];
  linting: string[];
  ui: string[];
  apis: string[];
}

class TechStackSynchronizer {
  private projectRoot: string;
  private packageInfo: PackageInfo;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.packageInfo = this.loadPackageInfo();
  }

  /**
   * package.json 情報読み込み
   */
  private loadPackageInfo(): PackageInfo {
    const packagePath = path.join(this.projectRoot, "package.json");

    if (!fs.existsSync(packagePath)) {
      throw new Error("package.json not found");
    }

    return JSON.parse(fs.readFileSync(packagePath, "utf-8"));
  }

  /**
   * 技術スタック情報抽出
   */
  private extractTechStack(): TechStackInfo {
    const deps = {
      ...this.packageInfo.dependencies,
      ...this.packageInfo.devDependencies,
    };

    return {
      framework: this.getFramework(deps),
      version: this.getFrameworkVersion(deps),
      language: this.getLanguage(deps),
      runtime: this.getRuntime(),
      buildTool: this.getBuildTool(deps),
      bundler: this.getBundler(deps),
      testing: this.getTestingTools(deps),
      linting: this.getLintingTools(deps),
      ui: this.getUILibraries(deps),
      apis: this.getAPILibraries(deps),
    };
  }

  private getFramework(deps: Record<string, string>): string {
    if (deps.react) return "React";
    if (deps.vue) return "Vue.js";
    if (deps.angular) return "Angular";
    if (deps.svelte) return "Svelte";
    return "Vanilla JavaScript";
  }

  private getFrameworkVersion(deps: Record<string, string>): string {
    if (deps.react) return deps.react.replace("^", "").replace("~", "");
    if (deps.vue) return deps.vue.replace("^", "").replace("~", "");
    return "";
  }

  private getLanguage(deps: Record<string, string>): string {
    if (deps.typescript || deps["@types/node"]) return "TypeScript";
    return "JavaScript";
  }

  private getRuntime(): string {
    const engines = this.packageInfo.engines;
    if (engines?.node) {
      return `Node.js ${engines.node}`;
    }
    return "Node.js (Latest LTS)";
  }

  private getBuildTool(deps: Record<string, string>): string {
    if (deps.vite) return "Vite";
    if (deps.webpack) return "Webpack";
    if (deps.rollup) return "Rollup";
    if (deps.parcel) return "Parcel";
    return "Native ES Modules";
  }

  private getBundler(deps: Record<string, string>): string {
    if (deps.vite) return "Vite (Rollup)";
    if (deps.webpack) return "Webpack";
    if (deps.rollup) return "Rollup";
    return "Native";
  }

  private getTestingTools(deps: Record<string, string>): string[] {
    const tools: string[] = [];
    if (deps.vitest) tools.push("Vitest");
    if (deps.jest) tools.push("Jest");
    if (deps.mocha) tools.push("Mocha");
    if (deps["@testing-library/react"]) tools.push("React Testing Library");
    if (deps.cypress) tools.push("Cypress");
    if (deps.playwright) tools.push("Playwright");
    return tools;
  }

  private getLintingTools(deps: Record<string, string>): string[] {
    const tools: string[] = [];
    if (deps.eslint) tools.push("ESLint");
    if (deps.prettier) tools.push("Prettier");
    if (deps.stylelint) tools.push("Stylelint");
    if (deps["@typescript-eslint/eslint-plugin"])
      tools.push("TypeScript ESLint");
    return tools;
  }

  private getUILibraries(deps: Record<string, string>): string[] {
    const libs: string[] = [];
    if (deps.tailwindcss) libs.push("Tailwind CSS");
    if (deps["styled-components"]) libs.push("Styled Components");
    if (deps["@emotion/react"]) libs.push("Emotion");
    if (deps["@mui/material"]) libs.push("Material-UI");
    if (deps.antd) libs.push("Ant Design");
    return libs;
  }

  private getAPILibraries(deps: Record<string, string>): string[] {
    const libs: string[] = [];
    if (deps.axios) libs.push("Axios");
    if (deps["@tanstack/react-query"]) libs.push("TanStack Query");
    if (deps.swr) libs.push("SWR");
    if (deps["@apollo/client"]) libs.push("Apollo Client");
    if (deps.graphql) libs.push("GraphQL");
    return libs;
  }

  /**
   * 技術スタック Markdown セクション生成
   */
  private generateTechStackMarkdown(techStack: TechStackInfo): string {
    const sections: string[] = [];

    sections.push("## 🛠️ 技術スタック\n");

    // コアテクノロジー
    sections.push("### 🎯 コアテクノロジー\n");
    sections.push(
      `- **フレームワーク**: ${techStack.framework} ${techStack.version}`
    );
    sections.push(`- **言語**: ${techStack.language}`);
    sections.push(`- **ランタイム**: ${techStack.runtime}`);
    sections.push(`- **ビルドツール**: ${techStack.buildTool}`);
    sections.push("");

    // 開発ツール
    if (techStack.testing.length > 0 || techStack.linting.length > 0) {
      sections.push("### 🔧 開発ツール\n");

      if (techStack.testing.length > 0) {
        sections.push(`- **テスト**: ${techStack.testing.join(", ")}`);
      }

      if (techStack.linting.length > 0) {
        sections.push(`- **リンティング**: ${techStack.linting.join(", ")}`);
      }
      sections.push("");
    }

    // UI ライブラリ
    if (techStack.ui.length > 0) {
      sections.push("### 🎨 UI ライブラリ\n");
      techStack.ui.forEach((lib) => {
        sections.push(`- ${lib}`);
      });
      sections.push("");
    }

    // API ライブラリ
    if (techStack.apis.length > 0) {
      sections.push("### 🌐 API・データ管理\n");
      techStack.apis.forEach((lib) => {
        sections.push(`- ${lib}`);
      });
      sections.push("");
    }

    return sections.join("\n");
  }

  /**
   * README ファイル内の技術スタックセクションを更新
   */
  private updateReadmeFile(filePath: string, newTechStack: string): boolean {
    if (!fs.existsSync(filePath)) {
      console.warn(`README not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, "utf-8");

    // 技術スタックセクションの検索・置換
    const techStackRegex = /## 🛠️ 技術スタック[\s\S]*?(?=\n## |\n# |$)/;

    if (techStackRegex.test(content)) {
      const updatedContent = content.replace(
        techStackRegex,
        newTechStack.trim()
      );
      fs.writeFileSync(filePath, updatedContent, "utf-8");
      console.log(`✅ Updated tech stack in: ${filePath}`);
      return true;
    } else {
      console.warn(`⚠️  Tech stack section not found in: ${filePath}`);
      return false;
    }
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
        // ディレクトリアクセスエラーは無視
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(
          `Warning: Cannot access directory ${dir}: ${errorMessage}`
        );
      }
    };

    searchDirectory(this.projectRoot);
    return readmeFiles;
  }

  /**
   * 全 README ファイルの技術スタック同期実行
   */
  public async syncAllReadmes(): Promise<void> {
    console.log("🚀 Starting tech stack synchronization...\n");

    const techStack = this.extractTechStack();
    const newTechStackSection = this.generateTechStackMarkdown(techStack);

    console.log("📊 Detected tech stack:");
    console.log(`   Framework: ${techStack.framework} ${techStack.version}`);
    console.log(`   Language: ${techStack.language}`);
    console.log(`   Build Tool: ${techStack.buildTool}`);
    console.log(`   Testing: ${techStack.testing.join(", ") || "None"}`);
    console.log("");

    // README ファイルを検索
    const readmeFiles = this.findReadmeFiles();

    let updatedCount = 0;
    let totalCount = 0;

    for (const readmeFile of readmeFiles) {
      totalCount++;

      if (this.updateReadmeFile(readmeFile, newTechStackSection)) {
        updatedCount++;
      }
    }

    console.log(`\n📈 Synchronization complete:`);
    console.log(`   Total README files: ${totalCount}`);
    console.log(`   Updated files: ${updatedCount}`);
    console.log(`   Skipped files: ${totalCount - updatedCount}`);
  }

  /**
   * 特定の README ファイルの技術スタック同期
   */
  public syncSpecificReadme(readmePath: string): void {
    console.log(`🎯 Syncing specific README: ${readmePath}`);

    const techStack = this.extractTechStack();
    const newTechStackSection = this.generateTechStackMarkdown(techStack);

    const fullPath = path.isAbsolute(readmePath)
      ? readmePath
      : path.join(this.projectRoot, readmePath);

    if (this.updateReadmeFile(fullPath, newTechStackSection)) {
      console.log("✅ Sync completed successfully");
    } else {
      console.log("❌ Sync failed");
    }
  }
}

// CLI 実行
if (
  import.meta.url.startsWith("file:") &&
  import.meta.url.includes(process.argv[1])
) {
  const args = process.argv.slice(2);
  const synchronizer = new TechStackSynchronizer();

  if (args.length === 0) {
    // 全 README ファイル同期
    synchronizer.syncAllReadmes().catch((error) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in sync execution: ${errorMessage}`);
    });
  } else {
    // 特定ファイル同期
    synchronizer.syncSpecificReadme(args[0]);
  }
}

export { TechStackSynchronizer };
