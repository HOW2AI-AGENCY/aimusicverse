import { test, expect } from "@playwright/test";

/**
 * Heading semantics + landmark uniqueness — smoke tests.
 * Covers UI Audit 2026-07-03 patches #1-4.
 *
 * Dev-server note: First-load bundle compile (Vite) can exceed the default
 * 30s Playwright timeout for cold runs, so we extend the per-test timeout.
 *
 * Auth note: headless browser has no Telegram WebApp SDK. Tests run against
 * `/` because Index is the only route the AuthGate allows without auth.
 * Library H1 is still proven in the axe.spec below (axe runs after Library
 * page renders past the gate in CI).
 */
test.describe.configure({ mode: "parallel", timeout: 120_000 });

test.describe("a11y: headings & landmarks", () => {
  test("Index has exactly one H1 with visible greeting text", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#main-content", { timeout: 60_000 });
    const h1s = page.getByRole("heading", { level: 1 });
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toBeVisible();
  });

  test("Main landmark has accessible name 'Основное содержимое'", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#main-content", { timeout: 60_000 });
    const main = page.locator("#main-content");
    await expect(main).toHaveAccessibleName(/Основное содержимое/);
  });

  test("Sidebar has unique landmark label 'Боковая навигация'", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#main-content", { timeout: 60_000 });
    const sidebar = page.getByRole("complementary", { name: /Боковая навигация/ });
    await expect(sidebar).toBeVisible();
  });
});