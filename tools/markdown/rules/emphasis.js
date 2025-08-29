/**
 * MD036: 強調の見出し化ルール
 * 強調マークアップを適切な見出しに変換
 */

/**
 * 強調マークアップを見出しに変換
 * @param {string} content - Markdownコンテンツ
 * @returns {string} - 修正されたコンテンツ
 */
export function fixEmphasisToHeadings(content) {
  let fixed = content;

  // **text** -> #### text (独立行の強調を見出しに変換)
  fixed = fixed.replace(/^\*\*([^*]+)\*\*$/gm, "#### $1");

  // __text__ -> #### text (独立行のアンダースコア強調も変換)
  fixed = fixed.replace(/^__([^_]+)__$/gm, "#### $1");

  return fixed;
}

/**
 * より柔軟な強調→見出し変換
 * @param {string} content - Markdownコンテンツ
 * @param {string} headingLevel - 見出しレベル（デフォルト: "####"）
 * @returns {string} - 修正されたコンテンツ
 */
export function fixEmphasisToHeadingsCustom(content, headingLevel = "####") {
  let fixed = content;

  // **text** を指定した見出しレベルに変換
  fixed = fixed.replace(/^\*\*([^*]+)\*\*$/gm, `${headingLevel} $1`);

  // __text__ を指定した見出しレベルに変換
  fixed = fixed.replace(/^__([^_]+)__$/gm, `${headingLevel} $1`);

  return fixed;
}

/**
 * 強調修正の統計情報を取得
 * @param {string} originalContent - 元のコンテンツ
 * @param {string} fixedContent - 修正後のコンテンツ
 * @returns {object} - 修正統計
 */
export function getEmphasisStats(originalContent, fixedContent) {
  const originalEmphasis =
    (originalContent.match(/^\*\*[^*]+\*\*$/gm) || []).length +
    (originalContent.match(/^__[^_]+__$/gm) || []).length;

  const fixedHeadings =
    (fixedContent.match(/^#### /gm) || []).length -
    (originalContent.match(/^#### /gm) || []).length;

  return {
    rule: "MD036",
    description: "強調の見出し化",
    fixedCount: Math.max(0, fixedHeadings),
    originalEmphasis,
  };
}
