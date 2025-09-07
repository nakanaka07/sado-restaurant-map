#!/usr/bin/env tsx

/**
 * Copilot Instructions 自動同期システム
 *
 * 機能:
 * - docs/のマスターファイルから .copilot-instructions を自動更新
 * - 内容整合性チェック
 * - 更新ログ記録
 *
 * 実行方法:
 * - pnpm run copilot:sync
 * - Git hooks での自動実行
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const PROJECT_ROOT = resolve(process.cwd());
const MASTER_FILE = resolve(
  PROJECT_ROOT,
  "docs",
  "development",
  "ai-assistant",
  "copilot-instructions.md"
);
const TARGET_FILE = resolve(PROJECT_ROOT, ".copilot-instructions");

interface SyncResult {
  success: boolean;
  message: string;
  updated: boolean;
  masterSize: number;
  targetSize: number;
  timestamp: string;
}

/**
 * Copilot Instructions の同期実行
 */
async function syncCopilotInstructions(): Promise<SyncResult> {
  const timestamp = new Date().toISOString();

  try {
    // マスターファイル存在確認
    if (!existsSync(MASTER_FILE)) {
      return {
        success: false,
        message: `マスターファイルが見つかりません: ${MASTER_FILE}`,
        updated: false,
        masterSize: 0,
        targetSize: 0,
        timestamp,
      };
    }

    // マスターファイル読み込み
    const masterContent = readFileSync(MASTER_FILE, "utf-8");
    const masterSize = Buffer.byteLength(masterContent, "utf-8");

    // 対象ファイル内容確認
    let targetContent = "";
    let targetSize = 0;
    let needsUpdate = true;

    if (existsSync(TARGET_FILE)) {
      targetContent = readFileSync(TARGET_FILE, "utf-8");
      targetSize = Buffer.byteLength(targetContent, "utf-8");

      // 内容比較 (正規化後)
      const normalizedMaster = masterContent.replace(/\r\n/g, "\n").trim();
      const normalizedTarget = targetContent.replace(/\r\n/g, "\n").trim();

      needsUpdate = normalizedMaster !== normalizedTarget;
    }

    if (needsUpdate) {
      // ファイル更新
      writeFileSync(TARGET_FILE, masterContent, "utf-8");

      console.log("✅ Copilot Instructions 同期完了");
      console.log(`📄 マスターファイル: ${MASTER_FILE}`);
      console.log(`🎯 対象ファイル: ${TARGET_FILE}`);
      console.log(`📊 サイズ: ${masterSize} bytes`);

      return {
        success: true,
        message: "Copilot Instructions が正常に同期されました",
        updated: true,
        masterSize,
        targetSize: masterSize,
        timestamp,
      };
    } else {
      console.log("ℹ️  Copilot Instructions は既に同期済みです");

      return {
        success: true,
        message: "ファイルは既に同期済みです",
        updated: false,
        masterSize,
        targetSize,
        timestamp,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ 同期エラー:", errorMessage);

    return {
      success: false,
      message: `同期エラー: ${errorMessage}`,
      updated: false,
      masterSize: 0,
      targetSize: 0,
      timestamp,
    };
  }
}

/**
 * 整合性チェック実行
 */
async function checkConsistency(): Promise<void> {
  console.log("\n🔍 Copilot Instructions 整合性チェック");

  if (!existsSync(MASTER_FILE)) {
    console.error(`❌ マスターファイルが存在しません: ${MASTER_FILE}`);
    process.exit(1);
  }

  if (!existsSync(TARGET_FILE)) {
    console.warn(`⚠️  対象ファイルが存在しません: ${TARGET_FILE}`);
    console.log("📥 同期を実行します...");
    await syncCopilotInstructions();
    return;
  }

  const masterContent = readFileSync(MASTER_FILE, "utf-8");
  const targetContent = readFileSync(TARGET_FILE, "utf-8");

  const masterSize = Buffer.byteLength(masterContent, "utf-8");
  const targetSize = Buffer.byteLength(targetContent, "utf-8");

  // 正規化比較
  const normalizedMaster = masterContent.replace(/\r\n/g, "\n").trim();
  const normalizedTarget = targetContent.replace(/\r\n/g, "\n").trim();

  if (normalizedMaster === normalizedTarget) {
    console.log("✅ ファイルは同期されています");
    console.log(`📊 サイズ: マスター ${masterSize}B / 対象 ${targetSize}B`);
  } else {
    console.warn("⚠️  ファイルに差分があります");
    console.log(`📊 サイズ差分: ${masterSize - targetSize}B`);
    console.log("📥 同期を実行します...");
    await syncCopilotInstructions();
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case "sync":
      syncCopilotInstructions();
      break;
    case "check":
      checkConsistency();
      break;
    default:
      console.log("📋 Copilot Instructions 管理ツール");
      console.log("");
      console.log("使用方法:");
      console.log("  pnpm run copilot:sync   - 同期実行");
      console.log("  pnpm run copilot:check  - 整合性チェック");
      break;
  }
}

export { checkConsistency, syncCopilotInstructions };
