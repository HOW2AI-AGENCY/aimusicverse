#!/usr/bin/env node
/**
 * Wipes local caches that commonly cause stale-build / "white screen"
 * incidents, then prints next-step instructions.
 *
 * Removed paths:
 *   - node_modules/.vite           (Vite dep cache)
 *   - node_modules/.cache          (generic loader caches)
 *   - dist                         (previous production build)
 *   - .turbo, .parcel-cache        (if present)
 *   - coverage                     (stale coverage reports)
 *
 * Use with: `npm run clean:cache` then `npm install && npm run build`.
 * Or one-shot: `npm run reset` (clean + install + build).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const TARGETS = [
  "node_modules/.vite",
  "node_modules/.vite-temp",
  "node_modules/.cache",
  "dist",
  ".turbo",
  ".parcel-cache",
  "coverage",
];

let removed = 0;
for (const rel of TARGETS) {
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) {
    try {
      fs.rmSync(abs, { recursive: true, force: true });
      console.log(`  ✓ removed ${rel}`);
      removed++;
    } catch (err) {
      console.warn(`  ! could not remove ${rel}: ${err.message}`);
    }
  }
}

if (removed === 0) {
  console.log("Nothing to clean — caches already empty.");
} else {
  console.log(`\nCleaned ${removed} cache path(s).`);
}

console.log("\nNext steps:");
console.log("  npm install   # ensure deps are intact");
console.log("  npm run build # full rebuild from scratch");
console.log("  npm run dev   # or restart dev server with fresh deps");
