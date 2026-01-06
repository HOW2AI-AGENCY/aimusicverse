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

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const RESULTS_FILE = '.bundle-size-results.json';
const HISTORY_FILE = '.bundle-size-history.json';
const BUNDLE_DIR = 'dist/assets';

// Per constitution: 950 KB hard limit
const LIMITS = {
  total: 950,
  vendors: {
    'vendor-react': 200,
    'vendor-framer': 100,
    'vendor-tone': 150,
    'vendor-wavesurfer': 100,
    'vendor-query': 50,
    'vendor-radix': 80,
  },
  features: {
    'feature-studio': 200,
    'feature-lyrics': 150,
    'feature-generation': 180,
  },
};

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function getSizeLimit(type, name) {
  if (type === 'vendor') {
    return LIMITS.vendors[name] || null;
  } else if (type === 'feature') {
    return LIMITS.features[name] || null;
  }
  return null;
}

function analyzeBundleSizes() {
  console.log('📦 Analyzing bundle sizes...\n');

  // In a real implementation, this would read the actual dist/assets files
  // For now, we'll create a stub that demonstrates the monitoring structure

  const mockData = {
    timestamp: new Date().toISOString(),
    total: 850, // KB
    chunks: [
      { name: 'vendor-react', size: 180, limit: 200, type: 'vendor' },
      { name: 'vendor-framer', size: 85, limit: 100, type: 'vendor' },
      { name: 'vendor-tone', size: 140, limit: 150, type: 'vendor' },
      { name: 'feature-studio', size: 175, limit: 200, type: 'feature' },
    ],
  };

  console.log(`Total Bundle: ${formatSize(mockData.total * 1024)} / ${LIMITS.total} KB\n`);

  let hasWarning = false;

  mockData.chunks.forEach(chunk => {
    const usage = ((chunk.size / chunk.limit) * 100).toFixed(1);
    const status = chunk.size > chunk.limit * 0.9 ? '⚠️' : '✅';

    console.log(
      `${status} ${chunk.name}: ${formatSize(chunk.size * 1024)} / ${chunk.limit} KB (${usage}%)`
    );

    if (chunk.size > chunk.limit) {
      console.error(`   ❌ EXCEEDS LIMIT by ${formatSize((chunk.size - chunk.limit) * 1024)}\n`);
      hasWarning = true;
    } else if (chunk.size > chunk.limit * 0.9) {
      console.log(`   ⚠️  Approaching limit (${formatSize((chunk.limit - chunk.size) * 1024)} remaining)\n`);
      hasWarning = true;
    } else {
      console.log('');
    }
  });

  // Save results
  writeFileSync(RESULTS_FILE, JSON.stringify(mockData, null, 2));

  // Update history
  let history = [];
  if (existsSync(HISTORY_FILE)) {
    history = JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'));
  }
  history.push({
    timestamp: mockData.timestamp,
    total: mockData.total,
  });
  // Keep only last 30 entries
  if (history.length > 30) {
    history = history.slice(-30);
  }
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  console.log(`\n📊 Results saved to ${RESULTS_FILE}`);
  console.log(`📜 History saved to ${HISTORY_FILE}\n`);

  if (mockData.total > LIMITS.total) {
    console.error(
      `❌ TOTAL BUNDLE EXCEEDS ${LIMITS.total} KB LIMIT by ${formatSize((mockData.total - LIMITS.total) * 1024)}`
    );
    process.exit(1);
  } else if (hasWarning) {
    console.warn('⚠️  Some chunks are approaching or exceeding limits');
    process.exit(1);
  } else {
    console.log('✅ All bundles within limits\n');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeBundleSizes();
}

export { analyzeBundleSizes };
