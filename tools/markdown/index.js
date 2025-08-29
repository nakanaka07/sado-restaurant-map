#!/usr/bin/env node

/**
 * 統合Markdownリントツール
 * 複数のMarkdownリントルールを一括適用
 *
 * 対応ルール:
 * - MD040: コードブロックの言語指定
 * - MD029: 順序付きリストの番号修正
 * - MD036: 強調の見出し化
 */

import { fixCodeBlocks, getCodeBlockStats } from "./rules/codeBlocks.js";
import { fixEmphasisToHeadings, getEmphasisStats } from "./rules/emphasis.js";
import {
  fixOrderedLists,
  fixOrderedListsSequential,
  getOrderedListStats,
} from "./rules/orderedLists.js";
import {
  findMarkdownFilesFromDirs,
  readMarkdownFile,
  writeMarkdownFile,
} from "./utils/fileUtils.js";

/**
 * 設定オプション
 */
const DEFAULT_CONFIG = {
  directories: ["src", "docs", "tools"],
  rules: {
    codeBlocks: true,
    orderedLists: true,
    emphasis: true,
  },
  sequentialLists: false, // 連続番号リスト修正を使用するか
  dryRun: false, // テスト実行（実際にファイルを変更しない）
  verbose: true, // 詳細ログ
};

/**
 * すべてのMarkdownルールを適用
 * @param {string} content - Markdownコンテンツ
 * @param {object} config - 設定オプション
 * @returns {object} - { content: 修正後コンテンツ, stats: 統計情報 }
 */
function applyAllRules(content, config = DEFAULT_CONFIG) {
  let fixed = content;
  const stats = [];

  // MD040: コードブロックの言語指定
  if (config.rules.codeBlocks) {
    const originalContent = fixed;
    fixed = fixCodeBlocks(fixed);
    stats.push(getCodeBlockStats(originalContent, fixed));
  }

  // MD029: 順序付きリストの番号修正
  if (config.rules.orderedLists) {
    const originalContent = fixed;
    fixed = config.sequentialLists
      ? fixOrderedListsSequential(fixed)
      : fixOrderedLists(fixed);
    stats.push(getOrderedListStats(originalContent, fixed));
  }

  // MD036: 強調の見出し化
  if (config.rules.emphasis) {
    const originalContent = fixed;
    fixed = fixEmphasisToHeadings(fixed);
    stats.push(getEmphasisStats(originalContent, fixed));
  }

  return { content: fixed, stats };
}

/**
 * 単一ファイルの修正
 * @param {string} filePath - ファイルパス
 * @param {object} config - 設定オプション
 * @returns {object} - 修正結果
 */
function fixSingleFile(filePath, config = DEFAULT_CONFIG) {
  const originalContent = readMarkdownFile(filePath);
  if (!originalContent) {
    return { success: false, error: "ファイル読み込み失敗" };
  }

  const { content: fixedContent, stats } = applyAllRules(
    originalContent,
    config
  );

  // 変更があるかチェック
  const hasChanges = originalContent !== fixedContent;

  if (hasChanges && !config.dryRun) {
    const writeSuccess = writeMarkdownFile(filePath, fixedContent);
    if (!writeSuccess) {
      return { success: false, error: "ファイル書き込み失敗" };
    }
  }

  return {
    success: true,
    filePath,
    hasChanges,
    stats,
    dryRun: config.dryRun,
  };
}

/**
 * 処理開始時のログ出力
 * @param {number} fileCount - ファイル数
 * @param {boolean} isDryRun - ドライランモードか
 */
function logProcessStart(fileCount, isDryRun) {
  console.log(`🔍 ${fileCount}個のMarkdownファイルを検出`);
  if (isDryRun) {
    console.log("🧪 ドライラン モード（実際の変更は行いません）");
  }
  console.log("");
}

/**
 * 単一ファイルの処理結果をログ出力
 * @param {object} result - 処理結果
 * @param {boolean} verbose - 詳細ログを出力するか
 */
function logFileResult(result, verbose) {
  if (!result.success) {
    console.error(`❌ エラー: ${result.filePath} - ${result.error}`);
    return;
  }

  if (result.hasChanges && verbose) {
    console.log(`✅ 修正: ${result.filePath}`);

    // 統計情報の表示
    for (const stat of result.stats) {
      if (stat.fixedCount > 0) {
        console.log(
          `   ${stat.rule}: ${stat.description} (${stat.fixedCount}箇所)`
        );
      }
    }
    console.log("");
  } else if (!result.hasChanges && verbose) {
    console.log(`⏭️  変更なし: ${result.filePath}`);
  }
}

/**
 * 最終結果のサマリーをログ出力
 * @param {object} summary - 処理結果サマリー
 * @param {boolean} isDryRun - ドライランモードか
 */
function logResultSummary(summary, isDryRun) {
  console.log("\n📊 修正結果:");
  console.log(`   処理ファイル: ${summary.totalFiles}`);
  console.log(`   成功: ${summary.successCount}`);
  console.log(`   変更あり: ${summary.changedCount}`);
  console.log(`   変更なし: ${summary.successCount - summary.changedCount}`);
  console.log(`   エラー: ${summary.totalFiles - summary.successCount}`);

  if (isDryRun && summary.changedCount > 0) {
    console.log(
      "\n💡 実際に修正を適用するには --fix オプションを使用してください"
    );
  }
}

/**
 * ファイルリストを処理して結果を集計
 * @param {string[]} files - ファイルパスの配列
 * @param {object} config - 設定オプション
 * @returns {object} - 処理結果の配列と統計情報
 */
function processFileList(files, config) {
  const results = [];
  let successCount = 0;
  let changedCount = 0;

  for (const file of files) {
    const result = fixSingleFile(file, config);
    results.push(result);

    if (result.success) {
      successCount++;
      if (result.hasChanges) {
        changedCount++;
      }
    }

    logFileResult(result, config.verbose);
  }

  return { results, successCount, changedCount };
}

/**
 * 複数ファイルの一括修正
 * @param {object} config - 設定オプション
 * @returns {object} - 修正結果の概要
 */
function fixAllFiles(config = DEFAULT_CONFIG) {
  const files = findMarkdownFilesFromDirs(config.directories);

  if (files.length === 0) {
    console.log("❌ Markdownファイルが見つかりませんでした");
    return { success: false, totalFiles: 0 };
  }

  logProcessStart(files.length, config.dryRun);

  const { results, successCount, changedCount } = processFileList(
    files,
    config
  );

  const summary = {
    totalFiles: files.length,
    successCount,
    changedCount,
  };

  logResultSummary(summary, config.dryRun);

  return {
    success: true,
    totalFiles: files.length,
    successCount,
    changedCount,
    results,
  };
}

/**
 * コマンドライン引数の解析
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (const arg of args) {
    switch (arg) {
      case "--dry-run":
        config.dryRun = true;
        break;
      case "--fix":
        config.dryRun = false;
        break;
      case "--sequential":
        config.sequentialLists = true;
        break;
      case "--quiet":
        config.verbose = false;
        break;
      case "--help":
        showHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`❌ 不明なオプション: ${arg}`);
          console.log("ヘルプを表示するには --help を使用してください");
          process.exit(1);
        }
    }
  }

  return config;
}

/**
 * ヘルプメッセージの表示
 */
function showHelp() {
  console.log(`
📝 統合Markdownリントツール

使用方法:
  node tools/markdown/index.js [options]

オプション:
  --dry-run     変更を実行せずにプレビューのみ表示
  --fix         実際にファイルを修正（デフォルト）
  --sequential  順序付きリストの番号を連続で修正
  --quiet       詳細ログを非表示
  --help        このヘルプを表示

対応ルール:
  MD040: コードブロックの言語指定
  MD029: 順序付きリストの番号修正
  MD036: 強調の見出し化

例:
  node tools/markdown/index.js --dry-run     # プレビューのみ
  node tools/markdown/index.js --fix         # 実際に修正
  node tools/markdown/index.js --sequential  # 連続番号で修正
`);
}

/**
 * メイン実行関数
 */
function main() {
  try {
    const config = parseArgs();
    const result = fixAllFiles(config);

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("❌ 予期しないエラーが発生しました:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// スクリプトとして直接実行された場合のみmainを呼び出し
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// モジュールとしてもエクスポート
export { applyAllRules, fixAllFiles, fixSingleFile };
