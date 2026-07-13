#!/usr/bin/env node
/**
 * CI guard: fail if any swipe-hint UI or copy re-appears in app code.
 *
 * Scans src/ (excluding regression tests that intentionally reference the
 * strings) for:
 *   - "swipe-gesture"      — legacy hint registry id
 *   - "SWIPE_GESTURE"      — legacy HINT_IDS constant
 *   - "свайп" / "Свайп"    — russian tooltip copy
 *   - "UnifiedTipCard" imports inside track-card variants
 */
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

// Files allowed to mention the banned strings (regression tests + this script).
const ALLOWLIST = new Set(
  [
    "src/__tests__/hints/no-swipe-hint.test.ts",
    "src/__tests__/hints/list-variant-no-swipe-hint.test.tsx",
  ].map((p) => p.split("/").join(sep)),
);

const PATTERNS = [
  { re: /swipe-gesture/g, label: '"swipe-gesture" hint id' },
  { re: /SWIPE_GESTURE/g, label: "SWIPE_GESTURE constant" },
  { re: /свайп/gi, label: 'russian "свайп" copy' },
];

const TRACK_CARD_DIR = join("src", "components", "track", "track-card-new");
const TIP_CARD_IMPORT = /^\s*import\s+\{[^}]*UnifiedTipCard[^}]*\}\s+from/m;

const findings = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      walk(full);
    } else if (/\.(t|j)sx?$/.test(name)) {
      scan(full);
    }
  }
}

function scan(file) {
  const rel = relative(ROOT, file);
  if (ALLOWLIST.has(rel)) return;
  const text = readFileSync(file, "utf8");

  for (const { re, label } of PATTERNS) {
    if (re.test(text)) {
      findings.push(`${rel}: ${label}`);
    }
    re.lastIndex = 0;
  }

  if (rel.startsWith(TRACK_CARD_DIR) && TIP_CARD_IMPORT.test(text)) {
    findings.push(`${rel}: UnifiedTipCard import in track-card variant`);
  }
}

walk(SRC);

if (findings.length > 0) {
  console.error("❌ Swipe-hint guard failed. Remove these references:");
  for (const f of findings) console.error("  - " + f);
  process.exit(1);
}

console.log("✅ No swipe-hint references found.");
