#!/usr/bin/env node

/**
 * Bundle size monitoring script
 *
 * Tracks bundle sizes over time and alerts when approaching limits.
 * Per constitution requirements:
 * - Total bundle: <950 KB
 * - Vendor chunks: 50-200 KB each
 * - Feature chunks: 150-200 KB each
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const RESULTS_FILE = ".bundle-size-results.json";
const HISTORY_FILE = ".bundle-size-history.json";
const BUNDLE_DIR = "dist/assets";

// Per constitution: 950 KB hard limit
const LIMITS = {
  total: 950,
  vendors: {
    "vendor-react": 200,
    "vendor-framer": 100,
    "vendor-tone": 150,
    "vendor-wavesurfer": 100,
    "vendor-query": 50,
    "vendor-radix": 80,
  },
  features: {
    "feature-studio": 200,
    "feature-lyrics": 150,
    "feature-generation": 180,
  },
};

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function getSizeLimit(type, name) {
  if (type === "vendor") {
    return LIMITS.vendors[name] || null;
  } else if (type === "feature") {
    return LIMITS.features[name] || null;
  }
  return null;
}

function getBundleFiles(bundleDir) {
  if (!existsSync(bundleDir)) {
    console.error(`❌ Bundle directory not found: ${bundleDir}`);
    console.error('Please run "npm run build" first to generate bundle files.');
    process.exit(1);
  }

  const files = readdirSync(bundleDir);
  const jsFiles = files.filter((file) => extname(file) === ".js");

  if (jsFiles.length === 0) {
    console.error(`❌ No JavaScript files found in ${bundleDir}`);
    console.error('Please run "npm run build" first to generate bundle files.');
    process.exit(1);
  }

  return jsFiles;
}

function analyzeBundleSizes() {
  console.log("📦 Analyzing bundle sizes...\n");

  const bundleDir = BUNDLE_DIR;
  const jsFiles = getBundleFiles(bundleDir);

  const chunks = [];
  let totalSize = 0;

  // Analyze each bundle file
  jsFiles.forEach((file) => {
    const filePath = join(bundleDir, file);
    const stats = statSync(filePath);
    const sizeKB = stats.size / 1024;

    // Determine chunk type and limit
    let type = "other";
    let limit = null;

    if (file.startsWith("vendor-")) {
      type = "vendor";
      const name = file.replace("vendor-", "").replace(".js", "");
      limit = LIMITS.vendors[name] || null;
    } else if (file.startsWith("feature-")) {
      type = "feature";
      const name = file.replace("feature-", "").replace(".js", "");
      limit = LIMITS.features[name] || null;
    } else if (file.match(/^index\.[a-f0-9]+\.js$/)) {
      type = "main";
      limit = LIMITS.total; // Main entry point
    }

    totalSize += sizeKB;

    chunks.push({
      name: file.replace(".js", ""),
      size: sizeKB,
      limit: limit,
      type: type,
    });
  });

  // Sort chunks by size (descending)
  chunks.sort((a, b) => b.size - a.size);

  const resultData = {
    timestamp: new Date().toISOString(),
    total: totalSize,
    chunks: chunks,
  };

  console.log(`Total Bundle: ${formatSize(totalSize * 1024)} / ${LIMITS.total} KB\n`);

  let hasWarning = false;

  resultData.chunks.forEach((chunk) => {
    if (!chunk.limit) {
      console.log(`ℹ️  ${chunk.name}: ${formatSize(chunk.size * 1024)} (no limit set)`);
      return;
    }

    const usage = ((chunk.size / chunk.limit) * 100).toFixed(1);
    const status = chunk.size > chunk.limit * 0.9 ? "⚠️" : "✅";

    console.log(`${status} ${chunk.name}: ${formatSize(chunk.size * 1024)} / ${chunk.limit} KB (${usage}%)`);

    if (chunk.size > chunk.limit) {
      console.error(`   ❌ EXCEEDS LIMIT by ${formatSize((chunk.size - chunk.limit) * 1024)}\n`);
      hasWarning = true;
    } else if (chunk.size > chunk.limit * 0.9) {
      console.log(`   ⚠️  Approaching limit (${formatSize((chunk.limit - chunk.size) * 1024)} remaining)\n`);
      hasWarning = true;
    } else {
      console.log("");
    }
  });

  // Save results
  writeFileSync(RESULTS_FILE, JSON.stringify(resultData, null, 2));

  // Update history
  let history = [];
  if (existsSync(HISTORY_FILE)) {
    history = JSON.parse(readFileSync(HISTORY_FILE, "utf-8"));
  }
  history.push({
    timestamp: resultData.timestamp,
    total: resultData.total,
  });
  // Keep only last 30 entries
  if (history.length > 30) {
    history = history.slice(-30);
  }
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  console.log(`\n📊 Results saved to ${RESULTS_FILE}`);
  console.log(`📜 History saved to ${HISTORY_FILE}`);

  // Calculate trend
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    const change = resultData.total - prev.total;
    const trend = change > 0 ? "📈" : change < 0 ? "📉" : "➡️";
    console.log(`${trend} Trend: ${change > 0 ? "+" : ""}${formatSize(change * 1024)} vs previous build`);
  }

  console.log("");

  if (resultData.total > LIMITS.total) {
    console.error(
      `❌ TOTAL BUNDLE EXCEEDS ${LIMITS.total} KB LIMIT by ${formatSize((resultData.total - LIMITS.total) * 1024)}`,
    );
    process.exit(1);
  } else if (hasWarning) {
    console.warn("⚠️  Some chunks are approaching or exceeding limits");
    process.exit(1);
  } else {
    console.log("✅ All bundles within limits\n");
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeBundleSizes();
}

export { analyzeBundleSizes };
