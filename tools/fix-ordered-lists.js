import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { extname, join } from "path";

/**
 * Markdown lint 追加修正ツール
 * 順序付きリストの番号修正
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

function fixOrderedLists(content) {
  const lines = content.split("\n");
  let currentListItems = [];
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)(\d+)\.\s(.+)/);

    if (match) {
      const [, indent, , text] = match;
      currentListItems.push({ indent, text, lineIndex: i });
    } else {
      // リスト以外の行または空行
      if (currentListItems.length > 0) {
        // 現在のリストを処理
        for (let j = 0; j < currentListItems.length; j++) {
          const item = currentListItems[j];
          result.push(`${item.indent}${j + 1}. ${item.text}`);
        }
        currentListItems = [];
      }
      result.push(line);
    }
  }

  // 最後のリストを処理
  if (currentListItems.length > 0) {
    for (let j = 0; j < currentListItems.length; j++) {
      const item = currentListItems[j];
      result.push(`${item.indent}${j + 1}. ${item.text}`);
    }
  }

  return result.join("\n");
}

function fixMarkdownFiles() {
  const files = [...findMarkdownFiles("src"), ...findMarkdownFiles("tools")];

  for (const file of files) {
    console.log(`修正中: ${file}`);
    let content = readFileSync(file, "utf-8");

    // 順序付きリストの番号修正
    content = fixOrderedLists(content);

    writeFileSync(file, content, "utf-8");
  }

  console.log(`修正完了: ${files.length} ファイル`);
}

fixMarkdownFiles();
