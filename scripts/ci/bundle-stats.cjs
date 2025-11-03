#!/usr/bin/env node
/**
 * Bundle Stats Markdown Table Generator
 *
 * Reads size-limit.json and generates a Markdown table
 * for GitHub Actions Step Summary.
 *
 * Usage: node scripts/ci/bundle-stats.js
 *
 * Inputs:
 *   - size-limit.json
 *
 * Outputs:
 *   - Markdown table to stdout
 */

const fs = require("fs");

const INPUT_FILE = "size-limit.json";

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + " KB";
}

function main() {
  try {
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`Error: ${INPUT_FILE} not found`);
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

    // Generate table header
    console.log("| Name | Limit | Size | Status |");
    console.log("|------|-------|------|--------|");

    // Generate table rows
    for (const item of data) {
      const name = item.name || "main";
      const limit = item.sizeLimit ? formatBytes(item.sizeLimit) : "N/A";
      const size = formatBytes(item.size);

      let status = "✅ Pass";
      if (item.sizeLimit && item.size > item.sizeLimit) {
        status = "❌ Fail";
      } else if (item.passed === false) {
        status = "❌ Fail";
      }

      // Calculate percentage of limit
      let pctOfLimit = "";
      if (item.sizeLimit && item.sizeLimit > 0) {
        const pct = ((item.size / item.sizeLimit) * 100).toFixed(1);
        pctOfLimit = ` (${pct}%)`;
      }

      console.log(`| ${name} | ${limit} | ${size}${pctOfLimit} | ${status} |`);
    }

    // Total row
    const totalSize = data.reduce((sum, item) => sum + item.size, 0);
    console.log(`| **Total** | - | **${formatBytes(totalSize)}** | - |`);
  } catch (error) {
    console.error("Bundle stats generation failed:", error.message);
    process.exit(1);
  }
}

main();
