/**
 * Smoke test: app boots, main route renders, no early error UI is shown.
 *
 * Also persists boot log + any errors to test-results/ so PR reviewers
 * can open the artifact and see exactly why the app failed to load —
 * no need to reproduce locally or dig through browser console.
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR = path.resolve(process.cwd(), "test-results", "smoke");

function writeArtifact(name: string, content: string) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, name), content, "utf8");
}

test.describe("App smoke", () => {
  test("boots, renders main route, shows no #error-display", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      pageErrors.push(`${err.name}: ${err.message}\n${err.stack ?? ""}`);
    });

    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response, "page should respond").not.toBeNull();
    expect(response!.status(), "HTTP status").toBeLessThan(400);

    // Wait for React to replace the static loading fallback.
    // The fallback removes itself once #root has real React content.
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        const fallback = document.getElementById("loading-fallback");
        // Either fallback is gone, OR root has more than just the fallback.
        return !fallback || (root?.children.length ?? 0) > 1 || (root?.querySelector("[data-app-ready], main, [role='main']") != null);
      },
      { timeout: 15_000 },
    );

    // Collect boot log + early errors from the page for the artifact.
    const bootLog = await page.evaluate(() => {
      try {
        return sessionStorage.getItem("musicverse_boot_log") ?? "";
      } catch {
        return "";
      }
    });
    const earlyErrors = await page.evaluate(
      () => JSON.stringify((window as any).__EARLY_ERRORS ?? [], null, 2),
    );

    if (bootLog) writeArtifact("boot-log.json", bootLog);
    writeArtifact("early-errors.json", earlyErrors);
    if (consoleErrors.length) writeArtifact("console-errors.log", consoleErrors.join("\n"));
    if (pageErrors.length) writeArtifact("page-errors.log", pageErrors.join("\n\n"));

    // The #error-display block must NOT have the `visible` class.
    const errorVisible = await page.evaluate(() => {
      const el = document.getElementById("error-display");
      return !!el && el.classList.contains("visible");
    });
    expect(errorVisible, "early #error-display must not be visible").toBe(false);

    // Main route must actually render something (not blank, not just fallback).
    const root = page.locator("#root");
    await expect(root).not.toBeEmpty();
    const text = (await root.innerText()).trim();
    expect(text.length, "root should have rendered text").toBeGreaterThan(0);

    // Title is set (catches catastrophic head/SSR failures).
    await expect(page).toHaveTitle(/MusicVerse|Music/i);

    // No uncaught page errors (window.onerror / unhandled rejections that bubbled).
    expect(pageErrors, `unexpected page errors:\n${pageErrors.join("\n")}`).toEqual([]);
  });
});
