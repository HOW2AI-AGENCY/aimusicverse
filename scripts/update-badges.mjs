#!/usr/bin/env node
/**
 * Regenerates the version badge block in README.md
 * from package.json dependency versions and the latest git tag.
 *
 * Badge block is delimited by:
 *   <!-- BADGES:START -->  ...  <!-- BADGES:END -->
 *
 * Safe to run repeatedly: only the content between the markers changes.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const clean = (v) => (v ? String(v).replace(/^[\^~>=<\s]+/, "") : "unknown");

let latestTag = null;
try {
  latestTag = execSync("git describe --tags --abbrev=0", { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim() || null;
} catch {
  // no tags yet — omit the Release badge below rather than show a fake v0.0.0
}

const shield = (label, message, color) =>
  `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(message)}-${color}?style=flat-square`;

const rows = [
  ...(latestTag ? [["Release", latestTag, "26A5E4"]] : []),
  ["React", clean(deps.react), "61DAFB"],
  ["TypeScript", clean(deps.typescript), "3178C6"],
  ["Vite", clean(deps.vite), "646CFF"],
  ["Tailwind", clean(deps.tailwindcss), "06B6D4"],
  ["Vitest", clean(deps.vitest), "6E9F18"],
  ["Playwright", clean(deps["@playwright/test"] ?? deps.playwright), "2EAD33"],
];

const block = rows
  .map(([l, m, c]) => `![${l}](${shield(l, m, c)})`)
  .join(" ");

const START = "<!-- BADGES:START -->";
const END = "<!-- BADGES:END -->";

const updateFile = (path) => {
  if (!existsSync(path)) return false;
  const src = readFileSync(path, "utf8");
  if (!src.includes(START) || !src.includes(END)) {
    console.warn(`[update-badges] markers not found in ${path}, skipping`);
    return false;
  }
  const next = src.replace(
    new RegExp(`${START}[\\s\\S]*?${END}`),
    `${START}\n${block}\n${END}`,
  );
  if (next === src) {
    console.log(`[update-badges] no change in ${path}`);
    return false;
  }
  writeFileSync(path, next);
  console.log(`[update-badges] updated ${path}`);
  return true;
};

updateFile("README.md");
process.exit(0);
