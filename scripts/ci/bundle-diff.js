#!/usr/bin/env node
/**
 * Bundle Size Diff Calculator
 *
 * Compares current bundle sizes against baseline (metrics/size-limit.json)
 * and generates a report with percentage changes.
 *
 * Usage: node scripts/ci/bundle-diff.js
 *
 * Inputs:
 *   - size-limit.json (current build)
 *   - metrics/size-limit.json (baseline)
 *
 * Outputs:
 *   - size-diff.json (detailed diff report)
 *   - Warnings to GitHub Actions if size increased >5%
 */

const fs = require("fs");

const CURRENT_FILE = "size-limit.json";
const BASE_FILE = "metrics/size-limit.json";
const OUTPUT_FILE = "size-diff.json";
const WARN_THRESHOLD_PCT = 5; // Warn if size increased >5%

function main() {
  try {
    // Check if files exist
    if (!fs.existsSync(CURRENT_FILE)) {
      console.error(`Error: ${CURRENT_FILE} not found`);
      process.exit(1);
    }

    if (!fs.existsSync(BASE_FILE)) {
      console.log("No baseline found. Skipping diff calculation.");
      process.exit(0);
    }

    // Parse JSON files
    const current = JSON.parse(fs.readFileSync(CURRENT_FILE, "utf8"));
    const baseline = JSON.parse(fs.readFileSync(BASE_FILE, "utf8"));

    // Create name-indexed lookup
    const byName = arr =>
      Object.fromEntries(arr.map(item => [item.name || "main", item]));

    const baselineByName = byName(baseline);
    const currentByName = byName(current);

    // Calculate diffs
    const report = [];
    const allNames = new Set([
      ...Object.keys(baselineByName),
      ...Object.keys(currentByName),
    ]);

    for (const name of allNames) {
      const baseItem = baselineByName[name];
      const currItem = currentByName[name];

      if (!currItem) {
        // Chunk removed
        report.push({
          name,
          status: "removed",
          baseSize: baseItem.size,
          currentSize: 0,
          diffBytes: -baseItem.size,
          diffPct: -100,
        });
        continue;
      }

      if (!baseItem) {
        // New chunk added
        report.push({
          name,
          status: "added",
          baseSize: 0,
          currentSize: currItem.size,
          diffBytes: currItem.size,
          diffPct: Infinity,
        });
        continue;
      }

      // Size changed
      const diffBytes = currItem.size - baseItem.size;
      const diffPct = baseItem.size > 0 ? (diffBytes / baseItem.size) * 100 : 0;

      report.push({
        name,
        status:
          diffBytes > 0
            ? "increased"
            : diffBytes < 0
              ? "decreased"
              : "unchanged",
        baseSize: baseItem.size,
        currentSize: currItem.size,
        diffBytes,
        diffPct: Math.round(diffPct * 100) / 100, // Round to 2 decimal places
      });
    }

    // Write report
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
    console.log(`✅ Bundle diff report written to ${OUTPUT_FILE}`);

    // Check for risky increases
    const risky = report.filter(
      item => item.status === "increased" && item.diffPct > WARN_THRESHOLD_PCT
    );

    if (risky.length > 0) {
      const names = risky
        .map(item => `${item.name} (+${item.diffPct.toFixed(2)}%)`)
        .join(", ");
      console.log(
        `::warning::Bundle size increased >${WARN_THRESHOLD_PCT}% for: ${names}`
      );
    }

    // Summary
    const totalBase = Object.values(baselineByName).reduce(
      (sum, item) => sum + item.size,
      0
    );
    const totalCurrent = Object.values(currentByName).reduce(
      (sum, item) => sum + item.size,
      0
    );
    const totalDiff = totalCurrent - totalBase;
    const totalDiffPct = totalBase > 0 ? (totalDiff / totalBase) * 100 : 0;

    console.log(
      `\nTotal: ${totalBase} → ${totalCurrent} bytes (${totalDiff >= 0 ? "+" : ""}${totalDiff} bytes, ${totalDiffPct >= 0 ? "+" : ""}${totalDiffPct.toFixed(2)}%)`
    );
  } catch (error) {
    console.error("Bundle diff calculation failed:", error.message);
    process.exit(1);
  }
}

main();
