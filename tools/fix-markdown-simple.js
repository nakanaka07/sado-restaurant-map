import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { extname, join } from "path";

/**
 * Markdown lint 自動修正ツール
 * 主な修正項目:
 * - MD040: コードブロックの言語指定
 * - MD036: 強調の見出し化
 */

function findMarkdownFiles(dir) {
  const files = [];

  function walkDir(currentDir) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (extname(item) === ".md") {
        files.push(fullPath);
      }
    }
  }

  walkDir(dir);
  return files;
}

function fixMarkdownFiles() {
  const files = findMarkdownFiles("src");

  for (const file of files) {
    console.log(`修正中: ${file}`);
    let content = readFileSync(file, "utf-8");

    // MD040: コードブロックに言語指定を追加
    content = content.replace(/^```$/gm, "```text");
    content = content.replace(/^```(\s+)$/gm, "```text");

    // MD036: **text** -> #### text (見出しとして使われている強調)
    content = content.replace(/^\*\*([^*]+)\*\*$/gm, "#### $1");

    writeFileSync(file, content, "utf-8");
  }

  console.log(`修正完了: ${files.length} ファイル`);
}

fixMarkdownFiles();
