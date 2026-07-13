#!/usr/bin/env node
/**
 * CI guard: fail if the removed swipe-hint tooltip re-appears in app code.
 *
 * Scope is intentionally narrow — this project has legitimate gesture
 * onboarding UI that mentions "свайп"/"swipe". We only guard against the
 * specific pieces that were removed because they broke layout:
 *
 *   1. A `"swipe-gesture"` entry re-added to the hint registry.
 *   2. A `SWIPE_GESTURE` export re-added to HINT_IDS.
 *   3. `UnifiedTipCard` re-imported inside any track-card variant.
 *
 * Comments/docstrings referencing the historical id are allowed so future
 * maintainers understand why it is gone.
 */
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

const ALLOWLIST = new Set(
  [
    "src/__tests__/hints/no-swipe-hint.test.ts",
    "src/__tests__/hints/list-variant-no-swipe-hint.test.tsx",
  ].map((p) => p.split("/").join(sep)),
);

const TRACK_CARD_DIR = join("src", "components", "track", "track-card-new");
const HINT_REGISTRY = join("src", "components", "hints", "registry.ts");
const HINT_TRACKING = join("src", "hooks", "useHintTracking.ts");

// Strips line/block comments so we only inspect executable code.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

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
  const raw = readFileSync(file, "utf8");
  const code = stripComments(raw);

  if (rel === HINT_REGISTRY && /["']swipe-gesture["']/.test(code)) {
    findings.push(`${rel}: "swipe-gesture" hint id re-added to registry`);
  }
  if (rel === HINT_TRACKING && /\bSWIPE_GESTURE\b\s*:/.test(code)) {
    findings.push(`${rel}: SWIPE_GESTURE constant re-added to HINT_IDS`);
  }
  if (
    rel.startsWith(TRACK_CARD_DIR) &&
    /^\s*import\s+\{[^}]*UnifiedTipCard[^}]*\}\s+from/m.test(code)
  ) {
    findings.push(`${rel}: UnifiedTipCard import in track-card variant`);
  }
}

walk(SRC);

if (findings.length > 0) {
  console.error("❌ Swipe-hint guard failed. Remove these references:");
  for (const f of findings) console.error("  - " + f);
  process.exit(1);
}

console.log("✅ Swipe-hint guard passed.");
