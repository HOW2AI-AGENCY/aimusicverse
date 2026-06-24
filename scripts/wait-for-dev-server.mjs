#!/usr/bin/env node
/**
 * Wait for the Vite dev server before running Playwright.
 *
 * Env (all optional):
 *   E2E_DEV_HOST     – host to probe (default: 127.0.0.1)
 *   E2E_DEV_PORT     – port to probe (default: 5173)
 *   E2E_DEV_PATH     – path to probe (default: /)
 *   E2E_DEV_TIMEOUT  – timeout in ms (default: 120000)
 *   E2E_DEV_INTERVAL – poll interval in ms (default: 1000)
 *   PLAYWRIGHT_BASE_URL – if set, overrides host/port/path
 */
import { setTimeout as sleep } from "node:timers/promises";

const host = process.env.E2E_DEV_HOST || "127.0.0.1";
const port = Number(process.env.E2E_DEV_PORT || 5173);
const path = process.env.E2E_DEV_PATH || "/";
const timeoutMs = Number(process.env.E2E_DEV_TIMEOUT || 120_000);
const intervalMs = Number(process.env.E2E_DEV_INTERVAL || 1000);

const url =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") + path ||
  `http://${host}:${port}${path}`;

console.log(`[wait-for-dev-server] target=${url} timeout=${timeoutMs}ms interval=${intervalMs}ms`);

const start = Date.now();
let attempt = 0;
let lastError = "";

while (Date.now() - start < timeoutMs) {
  attempt++;
  try {
    const res = await fetch(url, { method: "GET" });
    if (res.ok || (res.status >= 200 && res.status < 500)) {
      console.log(
        `[wait-for-dev-server] ready after ${attempt} attempt(s) in ${
          Date.now() - start
        }ms — status=${res.status} url=${url}`,
      );
      process.exit(0);
    }
    lastError = `HTTP ${res.status}`;
  } catch (err) {
    lastError = err?.code || err?.message || String(err);
  }
  if (attempt % 5 === 0) {
    console.log(
      `[wait-for-dev-server] still waiting (attempt ${attempt}, ${Math.round(
        (Date.now() - start) / 1000,
      )}s) last=${lastError}`,
    );
  }
  await sleep(intervalMs);
}

console.error(
  `[wait-for-dev-server] FAILED — url=${url} did not respond within ${timeoutMs}ms. last=${lastError}`,
);
process.exit(1);
