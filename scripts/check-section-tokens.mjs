#!/usr/bin/env node
/**
 * check-section-tokens.mjs
 *
 * Guard against re-introducing oversaturated brand washes
 * (bg-primary / bg-accent / from-primary / via-accent / …) inside the
 * shared layout primitives (Section + close relatives). Those tokens
 * make the home page neon-bright and break visual hierarchy.
 *
 * Runs in prebuild and pre-commit, fails CI with a clear message
 * showing path:line and a suggested replacement.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";

const ROOT = resolve(process.cwd());

// Files where saturated primary/accent washes are forbidden.
// Add more "shell" layout primitives here as they're unified.
const TARGETS = [
  "src/components/layout/Section.tsx",
  "src/components/layout/PageContainer.tsx",
  "src/components/layout/SafeLayout.tsx",
];

// Patterns that flag a saturated brand wash on a surface.
// We allow `text-primary` (links/icons) and `border-primary/20` (subtle
// borders) — only fill/gradient washes are blocked.
const FORBIDDEN = [
  { pattern: /\bbg-(primary|accent)(\/(?:[1-9]\d?|100))?\b/g, hint: "bg-card/60 + border-border/50" },
  { pattern: /\bfrom-(primary|accent)\b/g, hint: "from-card/60" },
  { pattern: /\bvia-(primary|accent)\b/g, hint: "via-background" },
  { pattern: /\bto-(primary|accent)\b/g, hint: "to-muted/40" },
  { pattern: /\bbg-gradient-(primary|generate)\b/g, hint: "subtle bg-gradient-to-br from-card/60 to-muted/40" },
];

const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const YEL = (s) => `\x1b[33m${s}\x1b[0m`;
const GRN = (s) => `\x1b[32m${s}\x1b[0m`;
const BLU = (s) => `\x1b[34m${s}\x1b[0m`;

let violations = 0;

for (const rel of TARGETS) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, "utf8");
  const lines = text.split("\n");

  lines.forEach((line, idx) => {
    for (const { pattern, hint } of FORBIDDEN) {
      pattern.lastIndex = 0;
      const matches = [...line.matchAll(pattern)];
      if (matches.length === 0) continue;
      violations++;
      const lineNo = idx + 1;
      const matched = matches.map((m) => m[0]).join(", ");
      console.error("");
      console.error(RED(`  ✖ ${relative(ROOT, abs)}:${lineNo}`));
      console.error(`      forbidden:  ${YEL(matched)}`);
      console.error(`      suggest:    ${GRN(hint)}`);
      console.error(`      line:       ${line.trim().slice(0, 120)}`);
    }
  });
}

if (violations > 0) {
  console.error("");
  console.error(RED(`✖ ${violations} saturated brand wash(es) found in shared layout primitives.`));
  console.error("");
  console.error(BLU("Why this matters:"));
  console.error("  Section/Page shells must stay calm. bg-primary / bg-accent /");
  console.error("  bg-gradient-primary paint the entire surface in saturated brand");
  console.error("  color and break visual hierarchy across home, library, studio.");
  console.error("");
  console.error(BLU("How to fix:"));
  console.error("  Use neutral surface tokens:");
  console.error(GRN("    bg-card/60 border border-border/50"));
  console.error(GRN("    bg-muted/30"));
  console.error(GRN("    bg-gradient-to-br from-card/60 via-background to-muted/40"));
  console.error("");
  console.error("  Keep brand color for accents only:  text-primary, icon fills, focus ring.");
  console.error("");
  process.exit(1);
}

console.log("✓ Section tokens: no saturated brand washes in layout primitives.");
