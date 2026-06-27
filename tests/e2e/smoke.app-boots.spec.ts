/**
 * Smoke tests: app actually boots inside the React Router, key UI is
 * present, no early error UI is shown. Runs in a browser matrix so a
 * regression that only hits Firefox/WebKit is caught in CI.
 *
 * Artifacts (per browser, written to test-results/smoke/<browser>/):
 *   - boot-log.json          musicverse_boot_log from sessionStorage
 *   - early-errors.json      window.__EARLY_ERRORS captured by index.html
 *   - console-errors.log     page console.error stream
 *   - page-errors.log        uncaught page errors (window.onerror)
 *   - <route>.png            screenshot per route
 *
 * Lets CI publish them per-browser so the PR comment can link straight
 * to the failing artifact.
 */
import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function artifactDir(browserName: string) {
  const dir = path.resolve(process.cwd(), "test-results", "smoke", browserName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeArtifact(browserName: string, name: string, content: string) {
  fs.writeFileSync(path.join(artifactDir(browserName), name), content, "utf8");
}

async function waitForAppMounted(page: Page) {
  // React replaces / removes the static #loading-fallback once mounted.
  await page.waitForFunction(
    () => {
      const root = document.getElementById("root");
      if (!root) return false;
      const fallback = document.getElementById("loading-fallback");
      const hasReal =
        root.querySelector("main, [role='main'], nav, [role='navigation'], [data-testid]") != null;
      return !fallback || hasReal;
    },
    { timeout: 20_000 },
  );
}

test.describe("App smoke", () => {
  test("boots router, renders main UI, no #error-display", async ({ page, browserName }, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      pageErrors.push(`${err.name}: ${err.message}\n${err.stack ?? ""}`);
    });

    // 1. Root → React Router renders Index page.
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response, "page should respond").not.toBeNull();
    expect(response!.status(), "HTTP status").toBeLessThan(400);

    await waitForAppMounted(page);

    // 2. Persist diagnostics regardless of pass/fail.
    const bootLog = await page.evaluate(() => {
      try {
        return sessionStorage.getItem("musicverse_boot_log") ?? "";
      } catch {
        return "";
      }
    });
    const earlyErrors = await page.evaluate(() =>
      JSON.stringify((window as any).__EARLY_ERRORS ?? [], null, 2),
    );

    if (bootLog) writeArtifact(browserName, "boot-log.json", bootLog);
    writeArtifact(browserName, "early-errors.json", earlyErrors);
    await page.screenshot({ path: path.join(artifactDir(browserName), "route-root.png"), fullPage: false });

    // 3. The static error block must NOT be visible.
    const errorVisible = await page.evaluate(() => {
      const el = document.getElementById("error-display");
      return !!el && el.classList.contains("visible");
    });
    expect(errorVisible, "early #error-display must not be visible").toBe(false);

    // 4. React Router actually mounted: <main> landmark from MainLayout exists,
    //    and there is a navigation landmark (BottomNavigation / sidebar / edge-rail).
    await expect(page.locator("main").first(), "<main> from MainLayout").toBeVisible({ timeout: 10_000 });

    const navLandmark = page.locator("nav, [role='navigation'], [data-testid='edge-rail']").first();
    await expect(navLandmark, "navigation landmark from MainLayout").toBeVisible({ timeout: 10_000 });

    // 5. Page title set by the SPA (not the default empty string).
    await expect(page).toHaveTitle(/MusicVerse|Music/i);

    // 6. Visit a second real route to ensure client-side routing works,
    //    not just the initial server response.
    await page.goto("/studio-v2", { waitUntil: "domcontentloaded" });
    await waitForAppMounted(page);
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({
      path: path.join(artifactDir(browserName), "route-studio-v2.png"),
      fullPage: false,
    });

    // 7. Flush error streams to artifacts after all navigation.
    if (consoleErrors.length)
      writeArtifact(browserName, "console-errors.log", consoleErrors.join("\n"));
    if (pageErrors.length) writeArtifact(browserName, "page-errors.log", pageErrors.join("\n\n"));

    // 8. Hard fail on uncaught page errors — these are the white-screen class.
    expect(pageErrors, `uncaught page errors in ${browserName}:\n${pageErrors.join("\n")}`).toEqual([]);

    // Attach artifact dir as testInfo annotation so the HTML report links it.
    testInfo.annotations.push({
      type: "smoke-artifacts",
      description: `test-results/smoke/${browserName}/`,
    });
  });
});
