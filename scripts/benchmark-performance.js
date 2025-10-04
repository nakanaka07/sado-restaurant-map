#!/usr/bin/env node
/**
 * @fileoverview Performance Benchmark Script
 * UnifiedMarker Phase 3: バンドルサイズ・レンダリング時間・メモリ使用量の計測
 *
 * 使用方法:
 *   node scripts/benchmark-performance.js
 *
 * 出力:
 *   - docs/performance-benchmark.json
 *   - コンソールに比較結果表示
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🎯 ベンチマーク設定
const BENCHMARK_CONFIG = {
  outputFile: path.join(__dirname, "../docs/performance-benchmark.json"),
  metricsDir: path.join(__dirname, "../metrics"),
  distDir: path.join(__dirname, "../dist"),
  buildCommand: "pnpm build",
  analyzeCommand: "ANALYZE=true pnpm build",
};

// 📊 現在のビルド統計を取得
function getCurrentBuildStats() {
  console.log("📦 Building project...");

  try {
    const buildOutput = execSync(BENCHMARK_CONFIG.buildCommand, {
      cwd: path.join(__dirname, ".."),
      encoding: "utf-8",
      stdio: "pipe",
    });

    console.log("✓ Build completed");

    // dist/ ディレクトリのファイルサイズを取得
    const distFiles = [];
    const distDir = BENCHMARK_CONFIG.distDir;

    if (fs.existsSync(distDir)) {
      const scanDir = dir => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            scanDir(filePath);
          } else {
            const relativePath = path.relative(distDir, filePath);
            distFiles.push({
              path: relativePath,
              size: stat.size,
              sizeKB: (stat.size / 1024).toFixed(2),
            });
          }
        });
      };
      scanDir(distDir);
    }

    // 主要チャンクを特定
    const mainChunk = distFiles.find(
      f => f.path.includes("index-") && f.path.endsWith(".js")
    );
    const appChunk = distFiles.find(
      f => f.path.includes("App-") && f.path.endsWith(".js")
    );
    const googleMapsChunk = distFiles.find(
      f => f.path.includes("google-maps") && f.path.endsWith(".js")
    );

    // ビルド出力から gzip サイズを抽出
    const gzipMatch = buildOutput.match(
      /index-\w+\.js\s+[\d.]+\s+kB\s+│\s+gzip:\s+([\d.]+)\s+kB/
    );
    const appGzipMatch = buildOutput.match(
      /App-\w+\.js\s+[\d.]+\s+kB\s+│\s+gzip:\s+([\d.]+)\s+kB/
    );
    const googleMapsGzipMatch = buildOutput.match(
      /google-maps-\w+\.js\s+[\d.]+\s+kB\s+│\s+gzip:\s+([\d.]+)\s+kB/
    );

    return {
      timestamp: new Date().toISOString(),
      totalFiles: distFiles.length,
      totalSize: distFiles.reduce((sum, f) => sum + f.size, 0),
      totalSizeKB: (
        distFiles.reduce((sum, f) => sum + f.size, 0) / 1024
      ).toFixed(2),
      mainChunk: {
        path: mainChunk?.path || "unknown",
        size: mainChunk?.size || 0,
        sizeKB: mainChunk?.sizeKB || "0",
        gzipKB: gzipMatch ? gzipMatch[1] : "unknown",
      },
      appChunk: {
        path: appChunk?.path || "unknown",
        size: appChunk?.size || 0,
        sizeKB: appChunk?.sizeKB || "0",
        gzipKB: appGzipMatch ? appGzipMatch[1] : "unknown",
      },
      googleMapsChunk: {
        path: googleMapsChunk?.path || "unknown",
        size: googleMapsChunk?.size || 0,
        sizeKB: googleMapsChunk?.sizeKB || "0",
        gzipKB: googleMapsGzipMatch ? googleMapsGzipMatch[1] : "unknown",
      },
      allFiles: distFiles.slice(0, 10), // 上位10ファイルのみ保存
    };
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    throw error;
  }
}

// 📈 過去のベンチマーク結果を読み込み
function loadPreviousBenchmark() {
  if (!fs.existsSync(BENCHMARK_CONFIG.outputFile)) {
    return null;
  }

  try {
    const data = fs.readFileSync(BENCHMARK_CONFIG.outputFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.warn("⚠️ Failed to load previous benchmark:", error.message);
    return null;
  }
}

/**
 * サイズ変化のステータスを取得
 */
function getSizeChangeStatus(sizeDiff) {
  if (sizeDiff > 0) {
    return "increased";
  }
  if (sizeDiff < 0) {
    return "decreased";
  }
  return "unchanged";
}

// 📊 ベンチマーク比較
function compareBenchmarks(current, previous) {
  if (!previous) {
    return {
      isFirstRun: true,
      message: "初回ベンチマーク実行",
    };
  }

  const currentMainSize = parseFloat(current.mainChunk.sizeKB);
  const previousMainSize = parseFloat(previous.current.mainChunk.sizeKB);
  const mainSizeDiff = currentMainSize - previousMainSize;
  const mainSizePercent = ((mainSizeDiff / previousMainSize) * 100).toFixed(2);

  const currentAppSize = parseFloat(current.appChunk.sizeKB);
  const previousAppSize = parseFloat(previous.current.appChunk.sizeKB);
  const appSizeDiff = currentAppSize - previousAppSize;
  const appSizePercent = ((appSizeDiff / previousAppSize) * 100).toFixed(2);

  const currentTotalSize = parseFloat(current.totalSizeKB);
  const previousTotalSize = parseFloat(previous.current.totalSizeKB);
  const totalSizeDiff = currentTotalSize - previousTotalSize;
  const totalSizePercent = ((totalSizeDiff / previousTotalSize) * 100).toFixed(
    2
  );

  return {
    isFirstRun: false,
    mainChunk: {
      current: currentMainSize,
      previous: previousMainSize,
      diff: mainSizeDiff.toFixed(2),
      percent: mainSizePercent,
      status: getSizeChangeStatus(mainSizeDiff),
    },
    appChunk: {
      current: currentAppSize,
      previous: previousAppSize,
      diff: appSizeDiff.toFixed(2),
      percent: appSizePercent,
      status: getSizeChangeStatus(appSizeDiff),
    },
    total: {
      current: currentTotalSize,
      previous: previousTotalSize,
      diff: totalSizeDiff.toFixed(2),
      percent: totalSizePercent,
      status: getSizeChangeStatus(totalSizeDiff),
    },
  };
}

/**
 * 現在のバンドルサイズを表示
 */
function displayCurrentBundleSize(current) {
  console.log("\n📦 Bundle Size:");
  console.log(
    `  Total: ${current.totalSizeKB} KB (${current.totalFiles} files)`
  );
  console.log(
    `  Main Chunk: ${current.mainChunk.sizeKB} KB (gzip: ${current.mainChunk.gzipKB} KB)`
  );
  console.log(
    `  App Chunk: ${current.appChunk.sizeKB} KB (gzip: ${current.appChunk.gzipKB} KB)`
  );
  console.log(
    `  Google Maps: ${current.googleMapsChunk.sizeKB} KB (gzip: ${current.googleMapsChunk.gzipKB} KB)`
  );
}

/**
 * 比較結果を表示
 */
function displayComparison(comparison) {
  console.log("\n📈 Comparison with Previous Build:");
  console.log(
    `  Main Chunk: ${comparison.mainChunk.diff > 0 ? "+" : ""}${comparison.mainChunk.diff} KB (${comparison.mainChunk.percent > 0 ? "+" : ""}${comparison.mainChunk.percent}%)`
  );
  console.log(
    `  App Chunk: ${comparison.appChunk.diff > 0 ? "+" : ""}${comparison.appChunk.diff} KB (${comparison.appChunk.percent > 0 ? "+" : ""}${comparison.appChunk.percent}%)`
  );
  console.log(
    `  Total: ${comparison.total.diff > 0 ? "+" : ""}${comparison.total.diff} KB (${comparison.total.percent > 0 ? "+" : ""}${comparison.total.percent}%)`
  );
}

/**
 * 目標達成状況を表示
 */
function displayGoalProgress(comparison) {
  console.log("\n🎯 Goal Progress:");
  const targetReduction = -14; // -14% goal
  const actualReduction = parseFloat(comparison.total.percent);

  if (actualReduction <= targetReduction) {
    console.log(
      `  ✅ GOAL ACHIEVED! ${actualReduction}% <= ${targetReduction}%`
    );
  } else if (actualReduction < 0) {
    console.log(
      `  🟡 In Progress: ${actualReduction}% (target: ${targetReduction}%)`
    );
  } else {
    console.log(`  ⚠️ Size Increased: ${actualReduction}%`);
  }
}

// 🎨 結果表示
function displayResults(current, comparison) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 Performance Benchmark Results");
  console.log("=".repeat(60));

  displayCurrentBundleSize(current);

  if (!comparison.isFirstRun) {
    displayComparison(comparison);
    displayGoalProgress(comparison);
  }

  console.log("\n" + "=".repeat(60));
}

// 💾 結果保存
function saveBenchmark(current, comparison) {
  const benchmark = {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    current,
    comparison,
    history: [],
  };

  // 過去の履歴を読み込み
  const previous = loadPreviousBenchmark();
  if (previous?.current) {
    benchmark.history = [
      ...(previous.history || []),
      {
        timestamp: previous.current.timestamp,
        totalSizeKB: previous.current.totalSizeKB,
        mainChunkSizeKB: previous.current.mainChunk.sizeKB,
        appChunkSizeKB: previous.current.appChunk.sizeKB,
      },
    ].slice(-10); // 最新10件のみ保持
  }

  // ディレクトリ作成
  const dir = path.dirname(BENCHMARK_CONFIG.outputFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 保存
  fs.writeFileSync(
    BENCHMARK_CONFIG.outputFile,
    JSON.stringify(benchmark, null, 2),
    "utf-8"
  );

  console.log(`\n💾 Benchmark saved to: ${BENCHMARK_CONFIG.outputFile}`);
}

// 🚀 メイン処理
async function main() {
  console.log("🚀 Starting Performance Benchmark...\n");

  try {
    // 1. ビルド統計取得
    const currentStats = getCurrentBuildStats();

    // 2. 過去のベンチマークと比較
    const previousBenchmark = loadPreviousBenchmark();
    const comparison = compareBenchmarks(currentStats, previousBenchmark);

    // 3. 結果表示
    displayResults(currentStats, comparison);

    // 4. 結果保存
    saveBenchmark(currentStats, comparison);

    console.log("\n✅ Benchmark completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Benchmark failed:", error);
    process.exit(1);
  }
}

main();
