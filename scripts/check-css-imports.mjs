#!/usr/bin/env node
/**
 * Build-time guard: ensures every @import in src/index.css appears
 * BEFORE any other CSS statement.
 *
 * CSS spec: @import (and @charset, bare @layer) MUST precede every
 * other rule. PostCSS/Vite silently drops misplaced @import → broken
 * styles → white screen in the browser.
 *
 * Exits with code 1 and a readable, actionable message on violation.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const TARGETS = ["src/index.css"];

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function color(c, s) {
  return process.stdout.isTTY ? `${c}${s}${RESET}` : s;
}

let hasError = false;

for (const rel of TARGETS) {
  const abs = path.join(projectRoot, rel);
  if (!fs.existsSync(abs)) {
    console.warn(`[check-css-imports] Skipping missing file: ${rel}`);
    continue;
  }

  const src = fs.readFileSync(abs, "utf8");
  const lines = src.split(/\r?\n/);

  let sawOtherStatement = false;
  let firstOtherLine = -1;
  let firstOtherText = "";
  let inBlockComment = false;
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    if (inBlockComment) {
      const end = trimmed.indexOf("*/");
      if (end === -1) continue;
      line = trimmed.slice(end + 2).trim();
      inBlockComment = false;
      if (!line) continue;
    } else {
      const start = trimmed.indexOf("/*");
      if (start !== -1 && trimmed.indexOf("*/", start + 2) === -1) {
        inBlockComment = true;
        const before = trimmed.slice(0, start).trim();
        if (!before) continue;
        line = before;
      }
    }

    const code = (typeof line === "string" ? line : "").trim();
    if (!code) continue;
    if (code.startsWith("//")) continue;
    if (code.startsWith("/*") && code.endsWith("*/")) continue;

    const isImport = /^@import\b/i.test(code);
    const isCharset = /^@charset\b/i.test(code);
    const isEmptyLayer = /^@layer\s+[^;{]+;$/i.test(code);

    if (isImport) {
      if (sawOtherStatement) {
        violations.push({ line: i + 1, text: code });
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

  if (violations.length > 0) {
    hasError = true;
    const filePath = `${rel}`;
    const absPath = path.relative(process.cwd(), abs) || rel;

    console.error("");
    console.error(color(RED + BOLD, `✖ CSS @import order violation in ${filePath}`));
    console.error(color(DIM, `  ${absPath}`));
    console.error("");
    console.error(
      color(YELLOW, `  The CSS spec requires every @import to appear BEFORE any other rule.`),
    );
    console.error(
      color(YELLOW, `  Vite/PostCSS silently drops misplaced @import → broken styles → white screen.`),
    );
    console.error("");
    console.error(color(BOLD, `  First non-import statement:`));
    console.error(
      color(DIM, `    ${filePath}:${firstOtherLine + 1}  `) + color(CYAN, firstOtherText),
    );
    console.error("");
    console.error(color(BOLD, `  Misplaced @import statement(s):`));
    for (const v of violations) {
      console.error(color(RED, `    ✖ ${filePath}:${v.line}  ${v.text}`));
    }
    console.error("");
    console.error(color(BOLD, `  How to fix:`));
    console.error(`    1. Open ${color(CYAN, filePath)} in your editor.`);
    console.error(`    2. Move every @import to the very TOP of the file.`);
    console.error(`       Only @charset and bare @layer declarations may come before.`);
    console.error(`    3. Save and re-run: ${color(CYAN, "npm run check:css-imports")}`);
    console.error("");
    console.error(color(BOLD, `  Correct structure:`));
    console.error(color(GREEN, `    /* ✅ correct */`));
    console.error(color(GREEN, `    @charset "UTF-8";`));
    console.error(color(GREEN, `    @import "./styles/micro-animations.css";`));
    console.error(color(GREEN, `    @import "./styles/other.css";`));
    console.error(color(GREEN, `    `));
    console.error(color(GREEN, `    @tailwind base;`));
    console.error(color(GREEN, `    @tailwind components;`));
    console.error(color(GREEN, `    @tailwind utilities;`));
    console.error(color(GREEN, `    `));
    console.error(color(GREEN, `    :root { --color: hsl(0 0% 100%); }`));
    console.error("");
    console.error(color(RED, `    /* ❌ wrong — @import after other rules is ignored */`));
    console.error(color(RED, `    @tailwind base;`));
    console.error(color(RED, `    @import "./styles/other.css";  /* dropped! */`));
    console.error("");
  }
}

if (hasError) {
  console.error(color(RED + BOLD, "Build aborted: fix the @import order above."));
  process.exit(1);
}

console.log(color(GREEN, "[check-css-imports] ✓ @import order OK"));
