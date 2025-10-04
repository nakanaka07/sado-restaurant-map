/**
 * SVG最適化スクリプト
 * svgoを使用してSVGファイルを最適化し、バンドルサイズを削減
 *
 * 実行: node scripts/optimize-svg.js
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, extname, join } from "path";
import { optimize } from "svgo";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// svgo設定
const svgoConfig = {
  multipass: true, // 複数回最適化
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          // viewBox保持（レスポンシブ対応）
          removeViewBox: false,
          // title/desc保持（アクセシビリティ）
          removeTitle: false,
          removeDesc: false,
        },
      },
    },
    // 不要な属性削除
    "removeXMLNS",
    "removeComments",
    "removeMetadata",
    "removeEditorsNSData",
    // 数値最適化
    {
      name: "cleanupNumericValues",
      params: {
        floatPrecision: 2,
      },
    },
    // パス最適化
    "convertPathData",
    "mergePaths",
    "convertShapeToPath",
    // 色最適化
    "convertColors",
    "removeUselessStrokeAndFill",
  ],
};

/**
 * ディレクトリ内のSVGファイルを再帰的に検索
 */
function findSvgFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      findSvgFiles(filePath, fileList);
    } else if (extname(file) === ".svg") {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * SVGファイルを最適化
 */
function optimizeSvg(filePath) {
  try {
    const originalContent = readFileSync(filePath, "utf8");
    const originalSize = Buffer.byteLength(originalContent, "utf8");

    const result = optimize(originalContent, {
      path: filePath,
      ...svgoConfig,
    });

    if (result.data) {
      const optimizedSize = Buffer.byteLength(result.data, "utf8");
      const reduction = (
        ((originalSize - optimizedSize) / originalSize) *
        100
      ).toFixed(2);

      writeFileSync(filePath, result.data, "utf8");

      return {
        success: true,
        filePath,
        originalSize,
        optimizedSize,
        reduction,
      };
    }

    return { success: false, filePath, error: "No optimized data" };
  } catch (error) {
    return { success: false, filePath, error: error.message };
  }
}

/**
 * メイン処理
 */
function main() {
  console.log("🎨 SVG最適化を開始します...\n");

  const targetDirs = [
    join(__dirname, "..", "public"),
    join(__dirname, "..", "src", "assets"),
  ];

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let successCount = 0;
  let failCount = 0;

  targetDirs.forEach(dir => {
    const svgFiles = findSvgFiles(dir);

    svgFiles.forEach(filePath => {
      const result = optimizeSvg(filePath);

      if (result.success) {
        totalOriginalSize += result.originalSize;
        totalOptimizedSize += result.optimizedSize;
        successCount++;

        const relativePath = filePath.replace(join(__dirname, ".."), "");
        console.log(
          `✅ ${relativePath}\n   ${(result.originalSize / 1024).toFixed(2)} KB → ${(result.optimizedSize / 1024).toFixed(2)} KB (-${result.reduction}%)\n`
        );
      } else {
        failCount++;
        console.error(`❌ ${result.filePath}: ${result.error}`);
      }
    });
  });

  // サマリー
  const totalReduction = (
    ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) *
    100
  ).toFixed(2);

  console.log("\n📊 最適化完了\n");
  console.log(`成功: ${successCount} ファイル`);
  console.log(`失敗: ${failCount} ファイル`);
  console.log(`元のサイズ: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
  console.log(`最適化後: ${(totalOptimizedSize / 1024).toFixed(2)} KB`);
  console.log(`削減率: -${totalReduction}%\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
