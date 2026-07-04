#!/usr/bin/env node
/**
 * check-section-tokens.mjs
 *
 * Guard against re-introducing oversaturated brand washes
 * (bg-primary / bg-accent / from-primary / via-accent / …) inside the
 * shared layout primitives (Section + close relatives).
 *
 * Exposes a programmatic API for unit tests:
 *   - FORBIDDEN          rule table
 *   - DEFAULT_TARGETS    files scanned by the CLI
 *   - scanText(text)     → [{ line, matched, hint, snippet }]
 *   - scanFiles(paths)   → [{ file, line, matched, hint, snippet }]
 *   - formatViolation(v) → string (colored on TTY)
 *   - rewriteText(text)  → { output, changed } codemod
 *
 * CLI behavior is unchanged: scan the default targets, print a clear
 * report, exit 1 if anything is found.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(process.cwd());

// Files where saturated primary/accent washes are forbidden.
export const DEFAULT_TARGETS = [
  "src/components/layout/Section.tsx",
  "src/components/layout/PageContainer.tsx",
  "src/components/layout/SafeLayout.tsx",
];

// Allow-list comment markers — put `// section-tokens-allow-next-line`
// (or `/* section-tokens-allow */` on the same line) to opt a single
// line out. Use sparingly; PR review should justify each one.
const ALLOW_INLINE = /section-tokens-allow\b/;
const ALLOW_NEXT = /section-tokens-allow-next-line\b/;

export const FORBIDDEN = [
  {
    id: "bg-brand",
    pattern: /\bbg-(primary|accent)(?!-foreground|-glow)(\/(?:[1-9]\d?|100))?\b/g,
    hint: "bg-card/60 + border border-border/50",
    replacement: "bg-card/60",
  },
  {
    id: "from-brand",
    pattern: /\bfrom-(primary|accent)(?!-foreground|-glow)(\/(?:[1-9]\d?|100))?\b/g,
    hint: "from-card/60",
    replacement: "from-card/60",
  },
  {
    id: "via-brand",
    pattern: /\bvia-(primary|accent)(?!-foreground|-glow)(\/(?:[1-9]\d?|100))?\b/g,
    hint: "via-background",
    replacement: "via-background",
  },
  {
    id: "to-brand",
    pattern: /\bto-(primary|accent)(?!-foreground|-glow)(\/(?:[1-9]\d?|100))?\b/g,
    hint: "to-muted/40",
    replacement: "to-muted/40",
  },
  {
    id: "bg-gradient-brand",
    pattern: /\bbg-gradient-(primary|generate)\b/g,
    hint: "bg-gradient-to-br from-card/60 via-background to-muted/40",
    replacement: "bg-gradient-to-br from-card/60 via-background to-muted/40",
  },
];

const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const YEL = (s) => `\x1b[33m${s}\x1b[0m`;
const GRN = (s) => `\x1b[32m${s}\x1b[0m`;
const BLU = (s) => `\x1b[34m${s}\x1b[0m`;

/**
 * Scan plain text. Returns violations with 1-indexed line numbers.
 * Honors `section-tokens-allow` / `section-tokens-allow-next-line` markers.
 */
export function scanText(text) {
  const lines = text.split("\n");
  const out = [];
  lines.forEach((line, idx) => {
    const prev = idx > 0 ? lines[idx - 1] : "";
    if (ALLOW_INLINE.test(line) || ALLOW_NEXT.test(prev)) return;
    for (const rule of FORBIDDEN) {
      rule.pattern.lastIndex = 0;
      const matches = [...line.matchAll(rule.pattern)];
      if (matches.length === 0) continue;
      out.push({
        line: idx + 1,
        matched: matches.map((m) => m[0]).join(", "),
        hint: rule.hint,
        snippet: line.trim().slice(0, 140),
        ruleId: rule.id,
      });
    }
  });
  return out;
}

export function scanFiles(paths) {
  const out = [];
  for (const rel of paths) {
    const abs = resolve(ROOT, rel);
    if (!existsSync(abs)) continue;
    const text = readFileSync(abs, "utf8");
    for (const v of scanText(text)) {
      out.push({ file: relative(ROOT, abs), ...v });
    }
  }
  return out;
}

export function formatViolation(v, { color = true } = {}) {
  const c = color ? { red: RED, yel: YEL, grn: GRN } : { red: (s) => s, yel: (s) => s, grn: (s) => s };
  return [
    `  ${c.red(`✖ ${v.file}:${v.line}`)}`,
    `      forbidden:  ${c.yel(v.matched)}`,
    `      suggest:    ${c.grn(v.hint)}`,
    `      line:       ${v.snippet}`,
  ].join("\n");
}

/**
 * Codemod: rewrite forbidden tokens to their neutral replacement.
 * Returns { output, changed, count }. Honors allow markers so a line
 * with `section-tokens-allow` stays untouched.
 */
export function rewriteText(text) {
  const lines = text.split("\n");
  let count = 0;
  const next = lines.map((line, idx) => {
    const prev = idx > 0 ? lines[idx - 1] : "";
    if (ALLOW_INLINE.test(line) || ALLOW_NEXT.test(prev)) return line;
    let updated = line;
    for (const rule of FORBIDDEN) {
      rule.pattern.lastIndex = 0;
      updated = updated.replace(rule.pattern, () => {
        count++;
        return rule.replacement;
      });
    }
    return updated;
  });
  const output = next.join("\n");
  return { output, changed: output !== text, count };
}

function helpFooter() {
  console.error("");
  console.error(BLU("Why this matters:"));
  console.error("  Section/Page shells must stay calm. bg-primary / bg-accent /");
  console.error("  bg-gradient-primary paint the entire surface in saturated brand");
  console.error("  color and break visual hierarchy across home, library, studio.");
  console.error("");
  console.error(BLU("How to fix:"));
  console.error("  • Auto-fix:       " + GRN("npm run check:section-tokens -- --fix"));
  console.error(
    "  • Manual replace: " +
      GRN("bg-card/60 / bg-muted/30 / bg-gradient-to-br from-card/60 via-background to-muted/40"),
  );
  console.error("  • Opt-out (rare): add " + YEL("// section-tokens-allow-next-line") + " on the previous line.");
  console.error("");
}

// ---- CLI -----------------------------------------------------------
const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const argv = process.argv.slice(2);
  const fix = argv.includes("--fix");
  const fileArgs = argv.filter((a) => !a.startsWith("--"));
  const targets = fileArgs.length > 0 ? fileArgs : DEFAULT_TARGETS;

  if (fix) {
    let total = 0;
    for (const rel of targets) {
      const abs = resolve(ROOT, rel);
      if (!existsSync(abs)) continue;
      const text = readFileSync(abs, "utf8");
      const { output, changed, count } = rewriteText(text);
      if (changed) {
        writeFileSync(abs, output, "utf8");
        total += count;
        console.log(GRN(`✓ rewrote ${count} token(s) in ${rel}`));
      }
    }
    if (total === 0) console.log("✓ Nothing to rewrite — all Section tokens already neutral.");
    process.exit(0);
  }

  const violations = scanFiles(targets);
  if (violations.length > 0) {
    for (const v of violations) {
      console.error("");
      console.error(formatViolation(v));
    }
    console.error("");
    console.error(RED(`✖ ${violations.length} saturated brand wash(es) found in shared layout primitives.`));
    helpFooter();
    process.exit(1);
  }
  console.log("✓ Section tokens: no saturated brand washes in layout primitives.");
}
