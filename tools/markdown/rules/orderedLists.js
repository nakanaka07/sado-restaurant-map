/**
 * MD029: 順序付きリストの番号ルール
 * 順序付きリストの番号を1から順番に修正
 */

/**
 * 順序付きリストの番号を修正（シンプル版）
 * @param {string} content - Markdownコンテンツ
 * @returns {string} - 修正されたコンテンツ
 */
export function fixOrderedLists(content) {
  const lines = content.split("\n");
  const result = [];

  for (const line of lines) {
    const match = line.match(/^(\s*)(\d+)\.\s(.+)/);

    if (match) {
      const [, indent, , text] = match;
      // すべて1番から始まるように修正
      result.push(`${indent}1. ${text}`);
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * より高度な順序付きリスト修正（連続番号対応）
 * @param {string} content - Markdownコンテンツ
 * @returns {string} - 修正されたコンテンツ
 */
export function fixOrderedListsSequential(content) {
  const lines = content.split("\n");
  const result = [];
  let currentListNumber = 0;
  let lastIndent = "";
  let inList = false;

  for (const line of lines) {
    const match = line.match(/^(\s*)(\d+)\.\s(.+)/);

    if (match) {
      const [, indent, , text] = match;

      if (!inList || indent !== lastIndent) {
        // 新しいリストまたは異なるレベル
        currentListNumber = 1;
        inList = true;
        lastIndent = indent;
      } else {
        // 同じレベルの継続
        currentListNumber++;
      }

      result.push(`${indent}${currentListNumber}. ${text}`);
    } else if (line.trim() === "") {
      // 空行はリストを継続
      result.push(line);
    } else {
      // 非空行でリスト終了
      inList = false;
      currentListNumber = 0;
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * 順序付きリスト修正の統計情報を取得
 * @param {string} originalContent - 元のコンテンツ
 * @param {string} fixedContent - 修正後のコンテンツ
 * @returns {object} - 修正統計
 */
export function getOrderedListStats(originalContent, fixedContent) {
  const originalLists = (originalContent.match(/^\s*\d+\.\s/gm) || []).length;
  const fixedLists = (fixedContent.match(/^\s*\d+\.\s/gm) || []).length;

  // 実際の変更を検出（文字列比較）
  const hasChanges = originalContent !== fixedContent;

  return {
    rule: "MD029",
    description: "順序付きリストの番号修正",
    fixedCount: hasChanges ? originalLists : 0,
    totalLists: fixedLists,
  };
}
