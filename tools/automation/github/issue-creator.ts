#!/usr/bin/env node

/**
 * GitHub Issue自動作成システム
 * 品質レポートやテスト結果に基づいてIssueを自動生成
 */

import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface IssueData {
  title: string;
  body: string;
  labels: string[];
  priority: "low" | "medium" | "high" | "critical";
  assignees?: string[];
}

interface QualityIssue {
  type: "quality" | "link" | "techstack" | "test" | "security";
  severity: "low" | "medium" | "high" | "critical";
  file?: string;
  description: string;
  recommendation: string;
}

interface IssueTemplate {
  quality: {
    title: (file: string, score: number) => string;
    body: (file: string, score: number, details: string) => string;
  };
  link: {
    title: (count: number) => string;
    body: (brokenLinks: string[], file: string) => string;
  };
  techstack: {
    title: () => string;
    body: (outdated: string[]) => string;
  };
  test: {
    title: (failedCount: number) => string;
    body: (failures: string[]) => string;
  };
  security: {
    title: (vulnerabilities: number) => string;
    body: (issues: string[]) => string;
  };
}

class GitHubIssueCreator {
  private projectRoot: string;
  private repoOwner: string;
  private repoName: string;
  private templates: IssueTemplate;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;

    // package.jsonからリポジトリ情報を取得
    const packageJson = this.loadPackageJson();
    const repoUrl = packageJson.repository?.url || "";
    const match = repoUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);

    if (match) {
      this.repoOwner = match[1];
      this.repoName = match[2];
    } else {
      // デフォルト値（環境変数から取得可能）
      this.repoOwner = process.env.GITHUB_OWNER || "unknown";
      this.repoName = process.env.GITHUB_REPO || "unknown";
    }
    this.templates = this.initializeTemplates();
  }

  /**
   * package.json読み込み
   */
  private loadPackageJson(): any {
    try {
      const packagePath = path.join(this.projectRoot, "package.json");
      return JSON.parse(fs.readFileSync(packagePath, "utf-8"));
    } catch {
      console.warn("Warning: Could not load package.json");
      return {};
    }
  }

  /**
   * Issueテンプレート初期化
   */
  private initializeTemplates(): IssueTemplate {
    return {
      quality: {
        title: (file: string, score: number) =>
          `📊 品質改善要求: ${path.basename(file)} (スコア: ${score}%)`,
        body: (file: string, score: number, details: string) => `
## 📊 品質評価結果

**対象ファイル**: \`${file}\`
**品質スコア**: **${score}%**
**検出日時**: ${new Date().toISOString()}

## 🔍 問題詳細

${details}

## 🛠️ 推奨改善アクション

### 1. 自動修正の実行
\`\`\`bash
pnpm run readme:fix
\`\`\`

### 2. 手動確認・修正
- [ ] テンプレート準拠性の確認
- [ ] SCRAP原則の適用確認
- [ ] 技術スタック情報の更新
- [ ] リンクの動作確認

### 3. 品質再評価
\`\`\`bash
pnpm run readme:quality
\`\`\`

## 📋 品質基準

| 基準 | 目標 | 現在 |
|------|------|------|
| テンプレート準拠 | 75%以上 | ${score}% |
| SCRAP原則 | 85%以上 | - |

---

**自動生成**: GitHub Issue Creator
**関連**: 品質管理システム
        `,
      },

      link: {
        title: (count: number) => `🔗 リンク切れ検出: ${count}件の修正が必要`,
        body: (brokenLinks: string[], file: string) => `
## 🔗 リンク切れ検出レポート

**対象ファイル**: \`${file}\`
**検出件数**: **${brokenLinks.length}件**
**検出日時**: ${new Date().toISOString()}

## 🚨 壊れたリンク一覧

${brokenLinks.map((link, index) => `${index + 1}. \`${link}\``).join("\n")}

## 🛠️ 修正手順

### 1. 自動修正の試行
\`\`\`bash
pnpm run readme:links --fix
\`\`\`

### 2. 手動確認・修正
- [ ] リンク先の存在確認
- [ ] 相対パスの正確性確認
- [ ] 外部リンクのアクセス可能性確認

### 3. 修正後の検証
\`\`\`bash
pnpm run readme:links
\`\`\`

---

**自動生成**: GitHub Issue Creator
**関連**: リンク検証システム
        `,
      },

      techstack: {
        title: () => "🛠️ 技術スタック同期要求",
        body: (outdated: string[]) => `
## 🛠️ 技術スタック同期要求

**検出日時**: ${new Date().toISOString()}
**同期対象**: ${outdated.length}ファイル

## 📋 同期が必要なファイル

${outdated.map((file, index) => `${index + 1}. \`${file}\``).join("\n")}

## 🔄 同期手順

### 1. 自動同期の実行
\`\`\`bash
pnpm run readme:techstack
\`\`\`

### 2. 手動確認
- [ ] package.jsonとの整合性
- [ ] バージョン情報の正確性
- [ ] 新規依存関係の反映

### 3. 同期確認
\`\`\`bash
pnpm run readme:all
\`\`\`

---

**自動生成**: GitHub Issue Creator
**関連**: 技術スタック同期システム
        `,
      },

      test: {
        title: (failedCount: number) =>
          `🧪 テスト失敗検出: ${failedCount}件の修正が必要`,
        body: (failures: string[]) => `
## 🧪 テスト失敗レポート

**失敗件数**: **${failures.length}件**
**検出日時**: ${new Date().toISOString()}

## ❌ 失敗したテスト

${failures.map((failure, index) => `${index + 1}. ${failure}`).join("\n")}

## 🛠️ 修正手順

### 1. テスト詳細の確認
\`\`\`bash
pnpm test --verbose
\`\`\`

### 2. 問題の特定・修正
- [ ] 失敗原因の分析
- [ ] コードの修正
- [ ] テストケースの見直し

### 3. 修正後の確認
\`\`\`bash
pnpm test
\`\`\`

---

**自動生成**: GitHub Issue Creator
**関連**: テスト自動化システム
        `,
      },

      security: {
        title: (vulnerabilities: number) =>
          `🔒 セキュリティ脆弱性検出: ${vulnerabilities}件の対応が必要`,
        body: (issues: string[]) => `
## 🔒 セキュリティ脆弱性レポート

**脆弱性件数**: **${issues.length}件**
**検出日時**: ${new Date().toISOString()}
**優先度**: 🚨 **HIGH**

## 🚨 検出された脆弱性

${issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n")}

## 🛠️ 対応手順

### 1. 脆弱性の詳細確認
\`\`\`bash
npm audit
pnpm audit
\`\`\`

### 2. 依存関係の更新
\`\`\`bash
npm audit fix
pnpm audit --fix
\`\`\`

### 3. 手動対応が必要な場合
- [ ] 代替パッケージの検討
- [ ] バージョン固定の検討
- [ ] セキュリティパッチの適用

### 4. 再検証
\`\`\`bash
npm audit
\`\`\`

---

**自動生成**: GitHub Issue Creator
**関連**: セキュリティ監視システム
        `,
      },
    };
  }

  /**
   * GitHub CLIの利用可能性確認
   */
  private async isGitHubCliAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn("gh", ["--version"], { stdio: "ignore" });
      child.on("close", (code) => {
        resolve(code === 0);
      });
      child.on("error", () => {
        resolve(false);
      });
    });
  }

  /**
   * GitHub CLI認証状態確認
   */
  private async isAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn("gh", ["auth", "status"], { stdio: "ignore" });
      child.on("close", (code) => {
        resolve(code === 0);
      });
      child.on("error", () => {
        resolve(false);
      });
    });
  }

  /**
   * GitHub Issue作成
   */
  private async createGitHubIssue(issueData: IssueData): Promise<boolean> {
    return new Promise((resolve) => {
      const args = [
        "issue",
        "create",
        "--title",
        issueData.title,
        "--body",
        issueData.body,
        "--label",
        issueData.labels.join(","),
      ];

      if (issueData.assignees && issueData.assignees.length > 0) {
        args.push("--assignee", issueData.assignees.join(","));
      }

      const child = spawn("gh", args, { stdio: "pipe" });

      child.on("close", (code) => {
        resolve(code === 0);
      });

      child.on("error", (error) => {
        console.error("GitHub CLI error:", error);
        resolve(false);
      });
    });
  }

  /**
   * 品質問題からIssue作成
   */
  public async createQualityIssue(
    file: string,
    score: number,
    details: string
  ): Promise<boolean> {
    // Priority決定ロジックを明確に分離
    let priority: "low" | "medium" | "high";
    if (score < 60) {
      priority = "high";
    } else if (score < 75) {
      priority = "medium";
    } else {
      priority = "low";
    }

    const issue: IssueData = {
      title: this.templates.quality.title(file, score),
      body: this.templates.quality.body(file, score, details),
      labels: ["documentation", "quality", "automated"],
      priority,
    };

    return this.createIssue(issue);
  }

  /**
   * リンク切れ問題からIssue作成
   */
  public async createLinkIssue(
    file: string,
    brokenLinks: string[]
  ): Promise<boolean> {
    const issue: IssueData = {
      title: this.templates.link.title(brokenLinks.length),
      body: this.templates.link.body(brokenLinks, file),
      labels: ["documentation", "links", "automated"],
      priority: brokenLinks.length > 5 ? "high" : "medium",
    };

    return this.createIssue(issue);
  }

  /**
   * 技術スタック同期Issue作成
   */
  public async createTechStackIssue(outdatedFiles: string[]): Promise<boolean> {
    const issue: IssueData = {
      title: this.templates.techstack.title(),
      body: this.templates.techstack.body(outdatedFiles),
      labels: ["documentation", "techstack", "automated"],
      priority: "medium",
    };

    return this.createIssue(issue);
  }

  /**
   * テスト失敗Issue作成
   */
  public async createTestFailureIssue(failures: string[]): Promise<boolean> {
    const issue: IssueData = {
      title: this.templates.test.title(failures.length),
      body: this.templates.test.body(failures),
      labels: ["testing", "bug", "automated"],
      priority: failures.length > 3 ? "high" : "medium",
    };

    return this.createIssue(issue);
  }

  /**
   * セキュリティ脆弱性Issue作成
   */
  public async createSecurityIssue(
    vulnerabilities: string[]
  ): Promise<boolean> {
    const issue: IssueData = {
      title: this.templates.security.title(vulnerabilities.length),
      body: this.templates.security.body(vulnerabilities),
      labels: ["security", "vulnerability", "automated"],
      priority: "critical",
    };

    return this.createIssue(issue);
  }

  /**
   * 統合Issue作成処理
   */
  private async createIssue(issueData: IssueData): Promise<boolean> {
    try {
      // GitHub CLI利用可能性確認
      if (!(await this.isGitHubCliAvailable())) {
        console.error(
          "❌ GitHub CLI not available. Please install gh CLI first."
        );
        return false;
      }

      // 認証状態確認
      if (!(await this.isAuthenticated())) {
        console.error(
          "❌ GitHub CLI not authenticated. Please run 'gh auth login' first."
        );
        return false;
      }

      // Issue作成
      const success = await this.createGitHubIssue(issueData);

      if (success) {
        console.log(`✅ GitHub Issue created: ${issueData.title}`);
        console.log(`   Priority: ${issueData.priority}`);
        console.log(`   Labels: ${issueData.labels.join(", ")}`);
        return true;
      } else {
        console.error(`❌ Failed to create GitHub Issue: ${issueData.title}`);
        return false;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error creating GitHub Issue: ${errorMessage}`);
      return false;
    }
  }

  /**
   * 自動化レポートからIssue一括作成
   */
  public async createIssuesFromAutomationReport(
    reportPath?: string
  ): Promise<number> {
    const report = await this.loadAutomationReport(reportPath);
    if (!report) return 0;

    let issuesCreated = 0;

    // 各種問題の処理を個別関数に分離
    issuesCreated += await this.processQualityIssues(report);
    issuesCreated += await this.processLinkIssues(report);
    issuesCreated += await this.processTechStackIssues(report);

    console.log(
      `📋 Created ${issuesCreated} GitHub Issues from automation report`
    );
    return issuesCreated;
  }

  /**
   * 自動化レポートの読み込み
   */
  private async loadAutomationReport(reportPath?: string): Promise<any | null> {
    const defaultReportPath = path.join(
      this.projectRoot,
      "tools",
      "reports",
      "automation-result.json"
    );

    const actualReportPath = reportPath || defaultReportPath;

    try {
      if (!fs.existsSync(actualReportPath)) {
        console.error(`❌ Automation report not found: ${actualReportPath}`);
        return null;
      }

      return JSON.parse(fs.readFileSync(actualReportPath, "utf-8"));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error loading automation report: ${errorMessage}`);
      return null;
    }
  }

  /**
   * 品質問題の処理
   */
  private async processQualityIssues(report: any): Promise<number> {
    if (
      !report.qualityCheck ||
      report.qualityCheck.averageTemplateScore >= 75
    ) {
      return 0;
    }

    const success = await this.createQualityIssue(
      "Multiple files",
      report.qualityCheck.averageTemplateScore,
      `Average template score below threshold: ${report.qualityCheck.averageTemplateScore}%`
    );

    return success ? 1 : 0;
  }

  /**
   * リンク問題の処理
   */
  private async processLinkIssues(report: any): Promise<number> {
    if (!report.linkValidation || report.linkValidation.brokenLinks <= 0) {
      return 0;
    }

    const success = await this.createLinkIssue("Multiple files", [
      `${report.linkValidation.brokenLinks} broken links found`,
    ]);

    return success ? 1 : 0;
  }

  /**
   * 技術スタック同期問題の処理
   */
  private async processTechStackIssues(report: any): Promise<number> {
    if (!report.techStackSync || report.techStackSync.errors.length <= 0) {
      return 0;
    }

    const success = await this.createTechStackIssue([
      `${report.techStackSync.filesUpdated} files need sync`,
    ]);

    return success ? 1 : 0;
  }

  /**
   * 重複Issue確認
   */
  public async checkDuplicateIssues(title: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(
        "gh",
        ["issue", "list", "--search", title, "--json", "title,state"],
        { stdio: "pipe" }
      );

      let output = "";
      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          try {
            const issues = JSON.parse(output);
            const openIssues = issues.filter(
              (issue: any) =>
                issue.state === "OPEN" &&
                issue.title.includes(title.split(":")[0])
            );
            resolve(openIssues.length > 0);
          } catch {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      });
    });
  }
}

// CLI実行
const isMainModule =
  process.argv[1] && process.argv[1].endsWith("issue-creator.ts");
if (isMainModule) {
  const args = process.argv.slice(2);

  async function main() {
    const issueCreator = new GitHubIssueCreator();

    if (args.includes("--from-report")) {
      const reportPath = args[args.indexOf("--from-report") + 1];
      await issueCreator.createIssuesFromAutomationReport(reportPath);
    } else if (args.includes("--quality")) {
      const file = args[args.indexOf("--quality") + 1] || "example.md";
      const score = parseInt(args[args.indexOf("--quality") + 2] || "70");
      await issueCreator.createQualityIssue(
        file,
        score,
        "Quality below threshold"
      );
    } else if (args.includes("--links")) {
      const file = args[args.indexOf("--links") + 1] || "example.md";
      await issueCreator.createLinkIssue(file, ["http://broken-link.com"]);
    } else {
      console.log("GitHub Issue Creator");
      console.log("Usage:");
      console.log(
        "  --from-report [path]  Create issues from automation report"
      );
      console.log("  --quality <file> <score>  Create quality issue");
      console.log("  --links <file>  Create link issue");
    }
  }

  main().catch(console.error);
}

export { GitHubIssueCreator, IssueData, QualityIssue };
