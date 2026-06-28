/**
 * Screenshot Capture Script for Repository Documentation
 *
 * Captures 4 key screenshots of the MusicVerse AI app for README.md:
 * - home (главная страница)
 * - player (полноэкранный плеер)
 * - studio (студия)
 * - library (библиотека)
 *
 * Usage: npx playwright test scripts/capture-screenshots.ts --project="Mobile Safari"
 */

import { test } from "@playwright/test";
import path from "path";

const SCREENSHOT_DIR = path.resolve("public/screenshots");
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 14 Pro

test.describe("Documentation Screenshots", () => {
  test("capture home page", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "home.webp"),
      type: "webp",
      quality: 85,
      fullPage: false,
    });
  });

  test("capture library page", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(`${BASE_URL}/library`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "library.webp"),
      type: "webp",
      quality: 85,
      fullPage: false,
    });
  });

  test("capture studio page", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(`${BASE_URL}/studio-v2`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "studio.webp"),
      type: "webp",
      quality: 85,
      fullPage: false,
    });
  });

  test("capture player page", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const trackCard = page.locator('[data-testid="track-card"], .track-card, [class*="track"]').first();
    if (await trackCard.isVisible()) {
      await trackCard.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "player.webp"),
      type: "webp",
      quality: 85,
      fullPage: false,
    });
  });
});
