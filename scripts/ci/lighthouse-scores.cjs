#!/usr/bin/env node
/**
 * Lighthouse Scores Extractor
 *
 * Extracts scores from Lighthouse CI manifest and generates
 * a JSON file with category scores.
 *
 * Usage: node scripts/ci/lighthouse-scores.js
 *
 * Inputs:
 *   - .lighthouseci/manifest.json
 *
 * Outputs:
 *   - lh-scores.json (category scores as percentages)
 */

const fs = require("fs");

const MANIFEST_FILE = ".lighthouseci/manifest.json";
const OUTPUT_FILE = "lh-scores.json";

function main() {
  try {
    if (!fs.existsSync(MANIFEST_FILE)) {
      console.error(`Error: ${MANIFEST_FILE} not found`);
      process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));

    if (!manifest || manifest.length === 0) {
      console.error("Error: Manifest is empty");
      process.exit(1);
    }

    // Extract first report
    const report = manifest[0];
    const categories = report.summary;

    // Convert to percentages (0-100)
    const pct = value => Math.round((value || 0) * 100);

    const scores = {
      performance: pct(categories.performance),
      accessibility: pct(categories.accessibility),
      seo: pct(categories.seo),
      "best-practices": pct(
        categories["best-practices"] || categories.bestPractices
      ),
      pwa: pct(categories.pwa),
    };

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scores, null, 2));
    console.log("✅ Lighthouse scores extracted:");
    console.log(JSON.stringify(scores, null, 2));
  } catch (error) {
    console.error("Lighthouse score extraction failed:", error.message);
    process.exit(1);
  }
}

main();
