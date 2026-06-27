#!/usr/bin/env node
/**
 * Build-time guard: ensures every @import in src/index.css appears
 * BEFORE any other CSS statement.
 *
 * CSS spec requires @import (and @charset / empty @layer) to precede
 * all other rules — otherwise PostCSS/Vite silently drops the import
 * and the app may fail to load in the browser.
 *
 * Exits with code 1 and a readable message on violation.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Files to validate. Add more entry CSS files here if needed.
const TARGETS = ["src/index.css"];

let hasError = false;

for (const rel of TARGETS) {
  const abs = path.join(projectRoot, rel);
  if (!fs.existsSync(abs)) {
    console.warn(`[check-css-imports] Skipping missing file: ${rel}`);
    continue;
  }

  const src = fs.readFileSync(abs, "utf8");
  const lines = src.split(/\r?\n/);

  // Track whether we've seen a non-import, non-comment, non-blank,
  // non-@charset statement. After that point @import is illegal.
  let sawOtherStatement = false;
  let inBlockComment = false;
  let firstOtherLine = -1;
  let firstOtherText = "";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Strip / track block comments
    if (inBlockComment) {
      const end = trimmed.indexOf("*/");
      if (end === -1) continue;
      line = trimmed.slice(end + 2).trim();
      inBlockComment = false;
      if (!line) continue;
    } else {
      const start = trimmed.indexOf("/*");
      if (start !== -1) {
        const end = trimmed.indexOf("*/", start + 2);
        if (end === -1) {
          inBlockComment = true;
          // before the comment may still be code
          const before = trimmed.slice(0, start).trim();
          if (!before) continue;
          line = before;
        }
      }
    }

    const code = (typeof line === "string" ? line : "").trim();
    if (!code) continue;
    if (code.startsWith("//")) continue; // not real CSS but skip
    if (code.startsWith("/*") && code.endsWith("*/")) continue;

    const isImport = /^@import\b/i.test(code);
    const isCharset = /^@charset\b/i.test(code);
    const isEmptyLayer = /^@layer\s+[^;{]+;$/i.test(code); // bare @layer decl

    if (isImport) {
      if (sawOtherStatement) {
        hasError = true;
        console.error(
          `\n[check-css-imports] ❌ ${rel}:${i + 1}\n` +
            `  @import must precede all other CSS statements.\n` +
            `  Offending line ${i + 1}: ${code}\n` +
            `  First non-import statement was line ${firstOtherLine + 1}: ${firstOtherText}\n` +
            `  Fix: move every @import to the very top of ${rel} (only @charset and bare @layer may come before).\n`,
        );
      }
      continue;
    }

    if (isCharset || isEmptyLayer) continue;

    if (!sawOtherStatement) {
      sawOtherStatement = true;
      firstOtherLine = i;
      firstOtherText = code.slice(0, 120);
    }
  }
}

if (hasError) {
  console.error("[check-css-imports] Build aborted: fix the @import order above.");
  process.exit(1);
}

console.log("[check-css-imports] ✅ @import order OK");
