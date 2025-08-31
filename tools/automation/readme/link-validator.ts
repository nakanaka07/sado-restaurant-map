#!/usr/bin/env node

/**
 * README リンク整合性自動チェック・修正システム
 * 内部リンク・外部リンクの生存確認と自動修正
 */

import axios from "axios";
import * as fs from "fs";
import * as path from "path";

interface LinkInfo {
  url: string;
  text: string;
  line: number;
  column: number;
  type: "internal" | "external" | "anchor";
}

interface LinkCheckResult {
  file: string;
  valid: LinkInfo[];
  broken: LinkInfo[];
  suggestions: { broken: LinkInfo; suggestion?: string }[];
}

class LinkValidator {
  private projectRoot: string;
  private validatedExternalLinks: Map<string, boolean> = new Map();
  private fileExists: Map<string, boolean> = new Map();

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * README ファイルからリンクを抽出
   */
  private extractLinks(content: string): LinkInfo[] {
    const links: LinkInfo[] = [];
    const lines = content.split("\n");

    // Markdown リンクパターン: [text](url)
    const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;

    // HTML リンクパターン: <a href="url">text</a>
    const htmlLinkRegex = /<a\s+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/g;

    lines.forEach((line, lineIndex) => {
      let match;

      // Markdown リンク
      while ((match = markdownLinkRegex.exec(line)) !== null) {
        const [, text, url] = match;
        links.push({
          url: url.trim(),
          text: text.trim(),
          line: lineIndex + 1,
          column: match.index,
          type: this.getLinkType(url),
        });
      }

      // HTML リンク
      markdownLinkRegex.lastIndex = 0; // Reset regex
      while ((match = htmlLinkRegex.exec(line)) !== null) {
        const [, url, text] = match;
        links.push({
          url: url.trim(),
          text: text.trim(),
          line: lineIndex + 1,
          column: match.index,
          type: this.getLinkType(url),
        });
      }
    });

    return links;
  }

  /**
   * リンクタイプ判定
   */
  private getLinkType(url: string): "internal" | "external" | "anchor" {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return "external";
    }
    if (url.startsWith("#")) {
      return "anchor";
    }
    return "internal";
  }

  /**
   * 内部リンクの存在確認
   */
  private async checkInternalLink(
    url: string,
    basePath: string
  ): Promise<boolean> {
    try {
      // 相対パス解決
      const absolutePath = path.resolve(path.dirname(basePath), url);

      // キャッシュチェック
      if (this.fileExists.has(absolutePath)) {
        return this.fileExists.get(absolutePath)!;
      }

      const exists = fs.existsSync(absolutePath);
      this.fileExists.set(absolutePath, exists);
      return exists;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(`Failed to check internal link ${url}: ${errorMessage}`);
      return false;
    }
  }

  /**
   * 外部リンクの存在確認
   */
  private async checkExternalLink(url: string): Promise<boolean> {
    // キャッシュチェック
    if (this.validatedExternalLinks.has(url)) {
      return this.validatedExternalLinks.get(url)!;
    }

    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: {
          "User-Agent": "Mozilla/5.0 (README Link Checker)",
        },
      });

      const isValid = response.status >= 200 && response.status < 400;
      this.validatedExternalLinks.set(url, isValid);
      return isValid;
    } catch (error) {
      // HEAD リクエストが失敗した場合、GET リクエストを試行
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.debug(
        `HEAD request failed for ${url}: ${errorMessage}, trying GET...`
      );

      try {
        const response = await axios.get(url, {
          timeout: 5000,
          headers: {
            "User-Agent": "Mozilla/5.0 (README Link Checker)",
          },
          maxRedirects: 3,
        });

        const isValid = response.status >= 200 && response.status < 400;
        this.validatedExternalLinks.set(url, isValid);
        return isValid;
      } catch (getError) {
        const getErrorMessage =
          getError instanceof Error ? getError.message : String(getError);
        console.warn(
          `Failed to validate external link ${url}: ${getErrorMessage}`
        );
        this.validatedExternalLinks.set(url, false);
        return false;
      }
    }
  }

  /**
   * アンカーリンクの存在確認
   */
  private checkAnchorLink(url: string, content: string): boolean {
    const anchor = url.substring(1); // Remove #

    // Markdown ヘッダーパターン
    const headerRegex = new RegExp(
      `^#+\\s+.*${anchor.replace(/-/g, "\\s+")}.*$`,
      "im"
    );

    // HTML id 属性パターン
    const idRegex = new RegExp(`id=["']${anchor}["']`, "i");

    return headerRegex.test(content) || idRegex.test(content);
  }

  /**
   * 壊れたリンクの修正候補提案
   */
  private suggestFix(
    brokenLink: LinkInfo,
    basePath: string
  ): string | undefined {
    if (brokenLink.type === "internal") {
      // 類似ファイル検索
      const dirname = path.dirname(basePath);
      const targetName = path.basename(brokenLink.url);

      try {
        const files = fs.readdirSync(dirname, { recursive: true }) as string[];
        const similar = files.find(
          (file) =>
            file.toLowerCase().includes(targetName.toLowerCase()) ||
            targetName.toLowerCase().includes(file.toLowerCase())
        );

        if (similar) {
          return path.relative(dirname, path.join(dirname, similar));
        }
      } catch (error) {
        // ディレクトリが存在しない場合
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.debug(`Directory access failed: ${errorMessage}`);
      }
    }

    return undefined;
  }

  /**
   * 単一ファイルのリンクチェック
   */
  public async checkFile(filePath: string): Promise<LinkCheckResult> {
    const content = fs.readFileSync(filePath, "utf-8");
    const links = this.extractLinks(content);

    const result: LinkCheckResult = {
      file: filePath,
      valid: [],
      broken: [],
      suggestions: [],
    };

    for (const link of links) {
      let isValid = false;

      switch (link.type) {
        case "internal":
          isValid = await this.checkInternalLink(link.url, filePath);
          break;

        case "external":
          isValid = await this.checkExternalLink(link.url);
          break;

        case "anchor":
          isValid = this.checkAnchorLink(link.url, content);
          break;
      }

      if (isValid) {
        result.valid.push(link);
      } else {
        result.broken.push(link);
        const suggestion = this.suggestFix(link, filePath);
        result.suggestions.push({ broken: link, suggestion });
      }
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
   * 全 README ファイルのリンクチェック
   */
  public async checkAllFiles(): Promise<LinkCheckResult[]> {
    console.log("🔍 Starting link validation...\n");

    const readmeFiles = this.findReadmeFiles();

    const results: LinkCheckResult[] = [];
    let totalLinks = 0;
    let brokenLinks = 0;

    for (const readmeFile of readmeFiles) {
      const relativePath = path.relative(this.projectRoot, readmeFile);
      console.log(`📋 Checking: ${relativePath}`);

      try {
        const result = await this.checkFile(readmeFile);
        results.push(result);

        totalLinks += result.valid.length + result.broken.length;
        brokenLinks += result.broken.length;

        if (result.broken.length > 0) {
          console.log(`   ❌ Found ${result.broken.length} broken links`);
        } else {
          console.log(`   ✅ All links valid`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`   💥 Error checking ${relativePath}: ${errorMessage}`);
      }
    }

    console.log(`\n📊 Link validation complete:`);
    console.log(`   Total links checked: ${totalLinks}`);
    console.log(`   Broken links found: ${brokenLinks}`);
    console.log(
      `   Success rate: ${
        totalLinks > 0
          ? (((totalLinks - brokenLinks) / totalLinks) * 100).toFixed(1)
          : 100
      }%`
    );

    return results;
  }

  /**
   * 壊れたリンクレポート生成
   */
  public generateReport(results: LinkCheckResult[]): string {
    const brokenResults = results.filter((r) => r.broken.length > 0);

    if (brokenResults.length === 0) {
      return "# 🔗 Link Validation Report\n\n✅ **All links are valid!** No broken links found.\n";
    }

    const report: string[] = [];
    report.push("# 🔗 Link Validation Report");
    report.push("");
    report.push(`> Generated: ${new Date().toISOString()}`);
    report.push("");

    report.push("## 📊 Summary");
    report.push("");
    const totalBroken = brokenResults.reduce(
      (sum, r) => sum + r.broken.length,
      0
    );
    report.push(`- **Files with broken links**: ${brokenResults.length}`);
    report.push(`- **Total broken links**: ${totalBroken}`);
    report.push("");

    report.push("## 🚨 Broken Links\n");

    brokenResults.forEach((result) => {
      const relativePath = path.relative(this.projectRoot, result.file);
      report.push(`### \`${relativePath}\`\n`);

      result.broken.forEach((link) => {
        const suggestion = result.suggestions.find(
          (s) => s.broken === link
        )?.suggestion;
        report.push(`- **Line ${link.line}**: [\`${link.text}\`](${link.url})`);
        report.push(`  - Type: ${link.type}`);
        report.push(`  - URL: \`${link.url}\``);
        if (suggestion) {
          report.push(`  - 💡 Suggestion: \`${suggestion}\``);
        }
        report.push("");
      });
    });

    return report.join("\n");
  }

  /**
   * 自動修正実行
   */
  public async autoFix(results: LinkCheckResult[]): Promise<void> {
    console.log("🔧 Starting automatic link fixes...\n");

    let fixedCount = 0;

    for (const result of results) {
      if (result.suggestions.length === 0) continue;

      const content = fs.readFileSync(result.file, "utf-8");
      let updatedContent = content;

      for (const { broken, suggestion } of result.suggestions) {
        if (!suggestion) continue;

        const oldPattern = `](${broken.url})`;
        const newPattern = `](${suggestion})`;

        if (updatedContent.includes(oldPattern)) {
          updatedContent = updatedContent.replace(oldPattern, newPattern);
          console.log(
            `✅ Fixed: ${broken.url} → ${suggestion} in ${path.relative(
              this.projectRoot,
              result.file
            )}`
          );
          fixedCount++;
        }
      }

      if (updatedContent !== content) {
        fs.writeFileSync(result.file, updatedContent, "utf-8");
      }
    }

    console.log(`\n🎉 Auto-fix complete: ${fixedCount} links fixed`);
  }
}

// CLI 実行
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  const args = process.argv.slice(2);
  const validator = new LinkValidator();

  async function main() {
    if (args.includes("--fix")) {
      // チェック + 自動修正
      const results = await validator.checkAllFiles();
      await validator.autoFix(results);

      // 修正後レポート生成
      const report = validator.generateReport(results);
      fs.writeFileSync("tools/reports/link-validation-report.md", report);
      console.log(
        "\n📄 Report saved to: tools/reports/link-validation-report.md"
      );
    } else if (args.length > 0) {
      // 特定ファイルチェック
      const result = await validator.checkFile(args[0]);
      console.log(JSON.stringify(result, null, 2));
    } else {
      // 全ファイルチェック
      const results = await validator.checkAllFiles();
      const report = validator.generateReport(results);
      console.log("\n" + report);
    }
  }

  main().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in main execution: ${errorMessage}`);
  });
}

export { LinkValidator };
