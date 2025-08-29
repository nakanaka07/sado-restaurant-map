#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";

/**
 * Markdown lint 自動修正ツール
 * 主な修正項目:
 * - MD040: コードブロックの言語指定
 * - MD029: 順序付きリストの番号
 * - MD036: 強調の見出し化
 */

async function fixMarkdownFiles() {
  const files = await glob("src/**/*.md");

  for (const file of files) {
    console.log(`修正中: ${file}`);
    let content = readFileSync(file, "utf-8");

    // MD040: コードブロックに言語指定を追加
    content = content.replace(/^```$/gm, "```text");
    content = content.replace(/^```(\s+)$/gm, "```text");

    // MD029: 順序付きリストの番号を1から開始
    const lines = content.split("\n");
    let inOrderedList = false;
    let listLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\s*)(\d+)\.\s/);

      if (match) {
        const indent = match[1];
        const currentLevel = Math.floor(indent.length / 2);

        if (!inOrderedList || currentLevel !== listLevel) {
          // 新しいリストまたは異なるレベル
          inOrderedList = true;
          listLevel = currentLevel;
          lines[i] = line.replace(/^(\s*)\d+\./, `${indent}1.`);
        } else {
          // 同じレベルの継続
          lines[i] = line.replace(/^(\s*)\d+\./, `${indent}1.`);
        }
      } else if (line.trim() === "" || !line.match(/^\s/)) {
        // 空行または非インデント行でリスト終了
        inOrderedList = false;
      }
    }

    content = lines.join("\n");

    // MD036: **text** -> ## text (見出しとして使われている強調)
    content = content.replace(/^\*\*([^*]+)\*\*$/gm, "#### $1");

    writeFileSync(file, content, "utf-8");
  }

  console.log(`修正完了: ${files.length} ファイル`);
}

fixMarkdownFiles().catch(console.error);
