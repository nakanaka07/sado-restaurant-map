import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { extname, join } from "path";

/**
 * Markdownファイル操作ユーティリティ
 */

/**
 * 指定ディレクトリからMarkdownファイルを再帰的に検索
 * @param {string} dir - 検索対象ディレクトリ
 * @returns {string[]} - Markdownファイルパスの配列
 */
export function findMarkdownFiles(dir) {
  const files = [];

  function walkDir(currentDir) {
    try {
      const items = readdirSync(currentDir);

      for (const item of items) {
        const fullPath = join(currentDir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // node_modules、.git等を除外
          if (!item.startsWith(".") && item !== "node_modules") {
            walkDir(fullPath);
          }
        } else if (extname(item) === ".md") {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`ディレクトリアクセスエラー: ${currentDir}`, error.message);
    }
  }

  walkDir(dir);
  return files;
}

/**
 * 複数ディレクトリからMarkdownファイルを検索
 * @param {string[]} dirs - 検索対象ディレクトリの配列
 * @returns {string[]} - Markdownファイルパスの配列
 */
export function findMarkdownFilesFromDirs(dirs = ["src", "docs", "tools"]) {
  const allFiles = [];

  for (const dir of dirs) {
    try {
      const files = findMarkdownFiles(dir);
      allFiles.push(...files);
    } catch (error) {
      console.warn(`ディレクトリスキップ: ${dir}`, error.message);
    }
  }

  return [...new Set(allFiles)]; // 重複除去
}

/**
 * Markdownファイルの内容を安全に読み込み
 * @param {string} filePath - ファイルパス
 * @returns {string|null} - ファイル内容（エラー時はnull）
 */
export function readMarkdownFile(filePath) {
  try {
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`ファイル読み込みエラー: ${filePath}`, error.message);
    return null;
  }
}

/**
 * Markdownファイルの内容を安全に書き込み
 * @param {string} filePath - ファイルパス
 * @param {string} content - 書き込み内容
 * @returns {boolean} - 成功時true、失敗時false
 */
export function writeMarkdownFile(filePath, content) {
  try {
    writeFileSync(filePath, content, "utf-8");
    return true;
  } catch (error) {
    console.error(`ファイル書き込みエラー: ${filePath}`, error.message);
    return false;
  }
}
