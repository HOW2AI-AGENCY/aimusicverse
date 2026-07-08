#!/usr/bin/env node
/**
 * count-any.mjs — Track the remaining `any` usages in src/ (excluding tests).
 *
 * The `@typescript-eslint/no-explicit-any` rule is enforced as an error in
 * `eslint.config.js`. Each remaining `any` MUST be:
 * 1. Justified with an inline `// eslint-disable-next-line` comment, OR
 * 2. Covered by a file-level `/* eslint-disable @typescript-eslint/no-explicit-any *\/`
 *
 * Whitelist is documented in `docs/TYPE_SAFETY_WHITELIST.md`.
 *
 * This script enforces a soft budget of 50 intentional `any` usages.
 * If the count exceeds the budget, the script exits 1 (CI failure).
 *
 * Budget rationale: per CLAUDE.md, "Type Safety: budget <50".
 *
 * Patterns matched: `: any`, `<any>`, `as any`, `Record<string, any>`, `any[]`,
 * `(...args: any[])`, `T extends ComponentType<any>`, `T extends Record<string, any>`.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const BUDGET = 50;

/**
 * Use git ls-files to enumerate tracked source files (so we ignore
 * untracked scratch files). This is more reliable than walking the
 * filesystem because it respects .gitignore automatically.
 */
function listSourceFiles() {
  const out = execSync("git ls-files src", { encoding: "utf-8", cwd: REPO_ROOT });
  return out
    .trim()
    .split("\n")
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
}

/**
 * Count `any` occurrences that are NOT covered by an eslint-disable directive.
 * A line is "covered" if:
 *   - The same line contains `eslint-disable` (e.g. inline disable-line), OR
 *   - The previous line contains `eslint-disable-next-line ... no-explicit-any`, OR
 *   - The file is currently inside a block-level `/* eslint-disable ... no-explicit-any *\/`
 *     (tracked via inFileBlock state machine).
 */
function countUncoveredAny() {
  const files = listSourceFiles();
  let total = 0;
  const offenders = [];

  for (const rel of files) {
    if (rel.includes("__tests__") || rel.includes(".test.") || rel.includes(".stories.")) continue;
    const abs = path.join(REPO_ROOT, rel);
    if (!existsSync(abs)) continue;
    const content = readFileSync(abs, "utf-8");
    const lines = content.split(/\r?\n/);

    let inFileBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Block-level disable tracking (file-scoped or region-scoped)
      if (
        /eslint-disable[^\n]*@typescript-eslint\/no-explicit-any/.test(line) &&
        !/disable-next-line/.test(line) &&
        !/disable-line/.test(line)
      ) {
        inFileBlock = true;
        continue;
      }
      if (/eslint-enable[^\n]*@typescript-eslint\/no-explicit-any/.test(line)) {
        inFileBlock = false;
        continue;
      }
      if (inFileBlock) continue;

      // Skip lines that are pure comments (e.g. "// Has any transcription files")
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

      // Match: `: any`, `<any>`, `as any`, `Record<string, any>`, `any[]`, etc.
      // We use a broad pattern but exclude the comment-skip above.
      const ANY_PATTERN = /(: any\b)|(<any>)|(\bas any\b)|(Record<[^,>]+,\s*any>)|(\bany\[\])/;
      if (!ANY_PATTERN.test(line)) continue;

      // Same-line disable
      if (/eslint-disable/.test(line)) continue;

      // Previous-line disable-next-line
      if (i > 0 && /eslint-disable-next-line[^\n]*no-explicit-any/.test(lines[i - 1])) continue;

      total++;
      if (offenders.length < 10) {
        offenders.push(`${rel}:${i + 1}: ${trimmed.substring(0, 100)}`);
      }
    }
  }

  return { total, offenders };
}

const { total, offenders } = countUncoveredAny();

if (total > BUDGET) {
  console.error(`✖ any count ${total} exceeds budget ${BUDGET}`);
  if (offenders.length > 0) {
    console.error("\nFirst offenders (missing eslint-disable justification):");
    for (const o of offenders) console.error(`  ${o}`);
  }
  console.error("\nAdd inline `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <justification>`");
  console.error("or update the whitelist in docs/TYPE_SAFETY_WHITELIST.md.");
  process.exit(1);
}

console.log(`✓ any count ${total} within budget ${BUDGET}`);
