#!/usr/bin/env node
/**
 * Build-time SEO checker.
 * Fails the build if essential meta tags or canonical link are missing/invalid
 * in the produced dist/index.html (and validates public/sitemap.xml + robots.txt).
 */
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const PUBLIC = path.resolve("public");
const errors = [];
const warn = [];

function fail(msg) { errors.push(msg); }
function warnMsg(msg) { warn.push(msg); }

const indexPath = fs.existsSync(path.join(DIST, "index.html"))
  ? path.join(DIST, "index.html")
  : path.resolve("index.html");

if (!fs.existsSync(indexPath)) {
  fail(`index.html not found (looked in dist/ and project root)`);
} else {
  const html = fs.readFileSync(indexPath, "utf8");
  const checks = [
    [/<title>([^<]{10,70})<\/title>/i, "<title> missing or out of 10–70 chars"],
    [/<meta\s+name=["']description["']\s+content=["']([^"']{30,170})["']/i, 'meta[name="description"] missing or out of 30–170 chars'],
    [/<link\s+rel=["']canonical["']\s+href=["'](https?:\/\/[^"']+)["']/i, 'link[rel="canonical"] missing or not absolute URL'],
    [/<meta\s+property=["']og:title["']\s+content=["'][^"']+["']/i, "og:title missing"],
    [/<meta\s+property=["']og:description["']\s+content=["'][^"']+["']/i, "og:description missing"],
    [/<meta\s+property=["']og:url["']\s+content=["']https?:\/\/[^"']+["']/i, "og:url missing or not absolute"],
    [/<meta\s+property=["']og:type["']\s+content=["'][^"']+["']/i, "og:type missing"],
    [/<meta\s+name=["']viewport["']/i, "viewport meta missing"],
    [/<html[^>]+\blang=/i, "<html lang> missing"],
  ];
  for (const [re, msg] of checks) if (!re.test(html)) fail(msg);

  // Canonical sanity
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
  if (canonical && !/^https?:\/\//.test(canonical)) fail(`canonical not absolute: ${canonical}`);
  const ogUrl = html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i)?.[1];
  if (canonical && ogUrl && new URL(canonical).origin !== new URL(ogUrl).origin) {
    warnMsg(`canonical and og:url origins differ: ${canonical} vs ${ogUrl}`);
  }
}

// Sitemap + robots
const sitemap = path.join(PUBLIC, "sitemap.xml");
if (!fs.existsSync(sitemap)) fail("public/sitemap.xml missing");
else {
  const xml = fs.readFileSync(sitemap, "utf8");
  if (!/<urlset[\s\S]*<\/urlset>/.test(xml)) fail("sitemap.xml: <urlset> missing");
  if (!/<loc>https?:\/\/[^<]+<\/loc>/.test(xml)) fail("sitemap.xml: no absolute <loc> URLs");
}

const robots = path.join(PUBLIC, "robots.txt");
if (!fs.existsSync(robots)) fail("public/robots.txt missing");
else {
  const txt = fs.readFileSync(robots, "utf8");
  if (/Disallow:\s*\/\s*$/m.test(txt) && !/Allow:\s*\//m.test(txt)) {
    fail("robots.txt blocks the entire site (Disallow: /)");
  }
  if (!/Sitemap:\s*https?:\/\//i.test(txt)) warnMsg("robots.txt: no Sitemap: directive");
}

for (const w of warn) console.warn(`⚠ SEO warning: ${w}`);
if (errors.length) {
  console.error(`\n✗ SEO check failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ SEO check passed${warn.length ? ` (${warn.length} warnings)` : ""}`);
