/**
 * 画像最適化スクリプト (WebP/AVIF変換)
 *
 * PNG画像を最新フォーマットに変換してバンドルサイズを削減:
 * - WebP: -25-35% (広範なブラウザサポート)
 * - AVIF: -50-60% (最高圧縮率、Safari 16.4+)
 *
 * 実行: node scripts/optimize-images.js
 */

import { readdir, stat } from "fs/promises";
import { dirname, extname, join } from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 変換設定
const CONFIG = {
  webp: {
    quality: 85,
    effort: 6, // 0-6: 圧縮努力度 (高いほど時間かかるが圧縮率向上)
  },
  avif: {
    quality: 60,
    effort: 9, // 0-9: AVIF最高圧縮
    chromaSubsampling: "4:2:0", // 色情報圧縮
  },
};

/**
 * ファイルサイズ取得
 */
async function getFileSize(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * ディレクトリ内の画像ファイルを再帰的に検索
 */
async function findImageFiles(dir, extensions = [".png", ".jpg", ".jpeg"]) {
  const files = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findImageFiles(fullPath, extensions);
        files.push(...subFiles);
      } else if (extensions.includes(extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`ディレクトリ読み込みエラー: ${dir}`, error.message);
  }

  return files;
}

/**
 * 画像をWebP/AVIF形式に変換
 */
async function convertImage(inputPath) {
  try {
    const ext = extname(inputPath);
    const outputWebP = inputPath.replace(ext, ".webp");
    const outputAVIF = inputPath.replace(ext, ".avif");

    const originalSize = await getFileSize(inputPath);

    // WebP変換
    await sharp(inputPath).webp(CONFIG.webp).toFile(outputWebP);

    const webpSize = await getFileSize(outputWebP);

    // AVIF変換
    await sharp(inputPath).avif(CONFIG.avif).toFile(outputAVIF);

    const avifSize = await getFileSize(outputAVIF);

    return {
      success: true,
      inputPath,
      originalSize,
      webpSize,
      avifSize,
      webpReduction: (((originalSize - webpSize) / originalSize) * 100).toFixed(
        2
      ),
      avifReduction: (((originalSize - avifSize) / originalSize) * 100).toFixed(
        2
      ),
    };
  } catch (error) {
    return {
      success: false,
      inputPath,
      error: error.message,
    };
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log("🖼️  画像最適化 (WebP/AVIF変換) を開始します...\n");

  const targetDirs = [
    join(__dirname, "..", "src", "assets", "png"),
    join(__dirname, "..", "public"),
  ];

  let totalOriginalSize = 0;
  let totalWebPSize = 0;
  let totalAVIFSize = 0;
  let successCount = 0;
  let failCount = 0;
  const results = [];

  // 全ディレクトリから画像ファイルを収集
  const allImageFiles = [];
  for (const dir of targetDirs) {
    const files = await findImageFiles(dir);
    allImageFiles.push(...files);
  }

  console.log(`📁 対象ファイル数: ${allImageFiles.length}\n`);

  // 変換処理
  for (const filePath of allImageFiles) {
    const result = await convertImage(filePath);

    if (result.success) {
      totalOriginalSize += result.originalSize;
      totalWebPSize += result.webpSize;
      totalAVIFSize += result.avifSize;
      successCount++;

      const relativePath = filePath.replace(join(__dirname, ".."), "");
      console.log(
        `✅ ${relativePath}\n` +
          `   元: ${(result.originalSize / 1024).toFixed(2)} KB\n` +
          `   WebP: ${(result.webpSize / 1024).toFixed(2)} KB (-${result.webpReduction}%)\n` +
          `   AVIF: ${(result.avifSize / 1024).toFixed(2)} KB (-${result.avifReduction}%)\n`
      );

      results.push(result);
    } else {
      failCount++;
      console.error(`❌ ${result.inputPath}: ${result.error}\n`);
    }
  }

  // サマリー出力
  const webpReduction = (
    ((totalOriginalSize - totalWebPSize) / totalOriginalSize) *
    100
  ).toFixed(2);
  const avifReduction = (
    ((totalOriginalSize - totalAVIFSize) / totalOriginalSize) *
    100
  ).toFixed(2);

  console.log("\n📊 最適化完了\n");
  console.log(`成功: ${successCount} ファイル`);
  console.log(`失敗: ${failCount} ファイル\n`);

  console.log(`元のサイズ: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
  console.log(
    `WebP合計: ${(totalWebPSize / 1024).toFixed(2)} KB (削減率: -${webpReduction}%)`
  );
  console.log(
    `AVIF合計: ${(totalAVIFSize / 1024).toFixed(2)} KB (削減率: -${avifReduction}%)\n`
  );

  // 最大削減率のファイルを表示
  const sortedByAVIF = results
    .sort((a, b) => parseFloat(b.avifReduction) - parseFloat(a.avifReduction))
    .slice(0, 5);

  console.log("🏆 AVIF削減率トップ5:\n");
  sortedByAVIF.forEach((result, index) => {
    const fileName = result.inputPath.split(/[\\/]/).pop();
    console.log(
      `${index + 1}. ${fileName}: -${result.avifReduction}% ` +
        `(${(result.originalSize / 1024).toFixed(2)} KB → ${(result.avifSize / 1024).toFixed(2)} KB)`
    );
  });

  console.log("\n💡 次のステップ:");
  console.log("1. Picture要素コンポーネント作成 (OptimizedImage.tsx)");
  console.log("2. 既存の<img>タグを<OptimizedImage>に置換");
  console.log("3. ビルド検証 (pnpm build)");
  console.log("4. Lighthouse測定でPerformanceスコア確認\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
