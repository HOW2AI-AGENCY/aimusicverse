#!/usr/bin/env node
// Offline reproduction of the Docs workflow's lychee local-file link check.
// Mirrors the excluded source paths from .github Docs workflow. Checks only
// local file-path links (the dominant failure class); external URLs are
// handled via the workflow's --exclude/--accept and are not validated here.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { globSync } from "node:fs";
import { dirname, resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIX = process.argv.includes("--fix");
// --strip: for links that are broken AND cannot be auto-resolved (target file
// truly does not exist anywhere), replace [text](deadlink) with plain text.
const STRIP = process.argv.includes("--strip");

// Source paths excluded from scanning by the Docs workflow (lychee --exclude-path)
const EXCLUDED_DIRS = [
  "docs/archive",
  "node_modules",
  "graphify-out",
  "prd",
  "specs",
  "plans",
  "SPRINTS/completed",
  ".git",
];

const isExcluded = (f) =>
  f.split("/").includes("node_modules") || EXCLUDED_DIRS.some((d) => f === d || f.startsWith(d + "/"));

const files = [...globSync("**/*.md", { cwd: root }), ...globSync(".*/**/*.md", { cwd: root })]
  .map((f) => f.replace(/\\/g, "/"))
  .filter((f, i, a) => a.indexOf(f) === i && !isExcluded(f));

// Basename index across the repo (used to relink files that moved but still
// exist under a unique name). Skip heavy/excluded trees.
const HEAVY = ["node_modules", ".git", "dist", "graphify-out"];
const basenameIndex = new Map();
for (const f of globSync("**/*", { cwd: root, nodir: true })) {
  const rel = f.replace(/\\/g, "/");
  if (HEAVY.some((d) => rel.startsWith(d + "/") || rel === d)) continue;
  const base = rel.split("/").pop();
  if (!basenameIndex.has(base)) basenameIndex.set(base, []);
  basenameIndex.get(base).push(rel);
}

const linkRe = /\]\(\s*([^)\s]+?)(?:\s+"[^"]*")?\s*\)/g;

let total = 0;
const byFile = new Map();

let fixedCount = 0;

// Resolve a raw link target -> { ok, abs, correctedRel } where correctedRel is
// the POSIX relative path from `dir` to a real file found via root-relative
// resolution (used to auto-fix the wrong-prefix bug). ok = dir-relative resolves.
function classify(rawTarget, dir) {
  const noFrag = rawTarget.replace(/[?#].*$/, "");
  const frag = rawTarget.slice(noFrag.length);
  if (!noFrag) return { skip: true };
  let decoded;
  try {
    decoded = decodeURIComponent(noFrag);
  } catch {
    decoded = noFrag;
  }
  const dirAbs = decoded.startsWith("/") ? join(root, decoded) : resolve(dir, decoded);
  if (existsSync(dirAbs)) return { ok: true };
  const toRel = (absTarget) => {
    let relPath = relative(dir, absTarget).replace(/\\/g, "/");
    if (!relPath.startsWith(".")) relPath = "./" + relPath;
    return relPath + frag;
  };
  // broken as-written; can we recover via root-relative resolution?
  const rootAbs = join(root, decoded.replace(/^\/+/, ""));
  if (existsSync(rootAbs) && !decoded.startsWith("/")) {
    return { ok: false, correctedRel: toRel(rootAbs) };
  }
  // last resort: unique basename match elsewhere in the repo (moved file).
  // strip a trailing :line or :start-end code-anchor notation first.
  const base = decoded
    .replace(/[/\\]+$/, "")
    .split(/[/\\]/)
    .pop()
    .replace(/:\d+(-\d+)?$/, "");
  const cands = basenameIndex.get(base);
  if (cands && cands.length === 1) {
    return { ok: false, correctedRel: toRel(join(root, cands[0])) };
  }
  return { ok: false };
}

for (const rel of files) {
  const abs = join(root, rel);
  const original = readFileSync(abs, "utf8");
  const dir = dirname(abs);

  if (FIX) {
    let changed = false;
    const out = original.replace(linkRe, (whole, target) => {
      if (/^(https?:|mailto:|tel:|#|data:|ftp:)/i.test(target)) return whole;
      const c = classify(target.trim(), dir);
      if (!c.ok && c.correctedRel) {
        changed = true;
        fixedCount++;
        return whole.replace(target, c.correctedRel);
      }
      return whole;
    });
    if (changed) writeFileSync(abs, out, "utf8");
    continue;
  }

  if (STRIP) {
    // Full markdown-link regex with the link text captured. Skip images (!)
    // and code fences.
    const fullLinkRe = /(!?)\[([^\]]+)\]\(\s*([^)\s]+?)(?:\s+"[^"]*")?\s*\)/g;
    let changed = false;
    let inFence = false;
    const lines = original.split("\n").map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line.replace(fullLinkRe, (whole, bang, text, target) => {
        if (bang) return whole; // keep images
        if (/^(https?:|mailto:|tel:|#|data:|ftp:)/i.test(target)) return whole;
        const c = classify(target.trim(), dir);
        if (!c.ok && !c.correctedRel) {
          changed = true;
          fixedCount++;
          return text; // dead link -> plain text
        }
        return whole;
      });
    });
    if (changed) writeFileSync(abs, lines.join("\n"), "utf8");
    continue;
  }

  // report mode: strip code so we match lychee (ignores code by default)
  const text = original.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  let m;
  while ((m = linkRe.exec(text)) !== null) {
    const target = m[1].trim();
    if (/^(https?:|mailto:|tel:|#|data:|ftp:)/i.test(target)) continue;
    const c = classify(target, dir);
    if (!c.ok) {
      total++;
      if (!byFile.has(rel)) byFile.set(rel, []);
      byFile.get(rel).push(target + (c.correctedRel ? `   → ${c.correctedRel}` : ""));
    }
  }
}

if (FIX) {
  console.log(`Auto-fixed ${fixedCount} broken links (wrong-prefix → real file).`);
  process.exit(0);
}
if (STRIP) {
  console.log(`Stripped ${fixedCount} dead links to plain text.`);
  process.exit(0);
}

if (total === 0) {
  console.log("OK: no broken local file links.");
  process.exit(0);
}

const sorted = [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]));
for (const [file, links] of sorted) {
  console.log(`\n### ${file} (${links.length})`);
  for (const l of links) console.log(`  - ${l}`);
}
console.log(`\nTOTAL broken local links: ${total} across ${byFile.size} files`);
process.exit(1);
