/**
 * 循環依存検出スクリプト
 * Phase C2: モジュール結合度最適化
 */

const fs = require("fs");
const path = require("path");

class CircularDependencyChecker {
  constructor(srcPath) {
    this.srcPath = srcPath;
    this.dependencies = new Map();
    this.visited = new Set();
    this.recursionStack = new Set();
    this.circularDeps = [];
  }

  /**
   * TypeScript/TSXファイルからimport文を抽出
   */
  extractImports(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    const imports = [];

    // @/で始まるimportを抽出
    const importRegex = /import.*?from\s+['"](@\/[^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      // @/を実際のパスに変換
      const resolvedPath = importPath.replace("@/", "");
      imports.push(resolvedPath);
    }

    return imports;
  }

  /**
   * ディレクトリを再帰的にスキャン
   */
  scanDirectory(dirPath, relativePath = "") {
    const entries = fs.readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const relativeFilePath = path.join(relativePath, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.scanDirectory(fullPath, relativeFilePath);
      } else if (
        entry.match(/\.(ts|tsx)$/) &&
        !entry.includes(".test.") &&
        !entry.includes(".d.ts")
      ) {
        const imports = this.extractImports(fullPath);
        this.dependencies.set(relativeFilePath, imports);
      }
    }
  }

  /**
   * DFS を使用して循環依存を検出
   */
  detectCircularDependency(node, path = []) {
    if (this.recursionStack.has(node)) {
      // 循環依存発見
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      this.circularDeps.push(cycle);
      return true;
    }

    if (this.visited.has(node)) {
      return false;
    }

    this.visited.add(node);
    this.recursionStack.add(node);
    path.push(node);

    const dependencies = this.dependencies.get(node) || [];

    for (const dep of dependencies) {
      // 依存関係を正規化
      const normalizedDep = this.normalizePath(dep);
      if (
        normalizedDep &&
        this.detectCircularDependency(normalizedDep, [...path])
      ) {
        return true;
      }
    }

    this.recursionStack.delete(node);
    path.pop();
    return false;
  }

  /**
   * パスを正規化（ファイル存在チェック含む）
   */
  normalizePath(importPath) {
    const possiblePaths = [
      `${importPath}.ts`,
      `${importPath}.tsx`,
      `${importPath}/index.ts`,
      `${importPath}/index.tsx`,
    ];

    for (const possiblePath of possiblePaths) {
      if (this.dependencies.has(possiblePath)) {
        return possiblePath;
      }
    }

    return null;
  }

  /**
   * 依存関係グラフを生成
   */
  generateDependencyGraph() {
    const graph = {};

    for (const [file, deps] of this.dependencies.entries()) {
      graph[file] = deps.map((dep) => this.normalizePath(dep)).filter(Boolean);
    }

    return graph;
  }

  /**
   * メイン実行関数
   */
  run() {
    console.log("🔍 循環依存検出を開始...");

    // ファイルスキャン
    this.scanDirectory(this.srcPath);
    console.log(`📁 ${this.dependencies.size} ファイルをスキャンしました`);

    // 循環依存検出
    for (const node of this.dependencies.keys()) {
      if (!this.visited.has(node)) {
        this.detectCircularDependency(node);
      }
    }

    // 結果出力
    if (this.circularDeps.length === 0) {
      console.log("✅ 循環依存は検出されませんでした");
    } else {
      console.log(
        `🚨 ${this.circularDeps.length} 個の循環依存が検出されました:`
      );
      this.circularDeps.forEach((cycle, index) => {
        console.log(`\n${index + 1}. ${cycle.join(" → ")}`);
      });
    }

    // 依存関係グラフ出力
    const graph = this.generateDependencyGraph();
    fs.writeFileSync(
      path.join(__dirname, "../../dependency-graph.json"),
      JSON.stringify(graph, null, 2)
    );
    console.log("\n📊 dependency-graph.json を生成しました");

    return {
      circularDependencies: this.circularDeps,
      dependencyGraph: graph,
      totalFiles: this.dependencies.size,
    };
  }
}

// スクリプト実行
if (require.main === module) {
  const srcPath = path.join(__dirname, "../../src");
  const checker = new CircularDependencyChecker(srcPath);
  const result = checker.run();

  // 終了コード設定
  process.exit(result.circularDependencies.length > 0 ? 1 : 0);
}

module.exports = CircularDependencyChecker;
