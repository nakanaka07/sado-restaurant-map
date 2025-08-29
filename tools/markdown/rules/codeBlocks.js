/**
 * MD040: コードブロックの言語指定ルール
 * 言語指定のないコードブロックに'text'を追加
 */

/**
 * コードブロックに言語指定を追加
 * @param {string} content - Markdownコンテンツ
 * @returns {string} - 修正されたコンテンツ
 */
export function fixCodeBlocks(content) {
  let fixed = content;

  // 空の```を```textに変更
  fixed = fixed.replace(/^```$/gm, "```text");

  // スペースのみの```を```textに変更
  fixed = fixed.replace(/^```(\s+)$/gm, "```text");

  return fixed;
}

/**
 * コードブロック修正の統計情報を取得
 * @param {string} originalContent - 元のコンテンツ
 * @param {string} fixedContent - 修正後のコンテンツ
 * @returns {object} - 修正統計
 */
export function getCodeBlockStats(originalContent, fixedContent) {
  const originalTextBlocks = (originalContent.match(/^```text$/gm) || [])
    .length;
  const fixedTextBlocks = (fixedContent.match(/^```text$/gm) || []).length;

  return {
    rule: "MD040",
    description: "コードブロックの言語指定",
    fixedCount: Math.max(0, fixedTextBlocks - originalTextBlocks),
  };
}
