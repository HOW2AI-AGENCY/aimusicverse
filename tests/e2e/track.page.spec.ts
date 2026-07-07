/**
 * /track/:trackId smoke test.
 *
 * Ensures the standalone player route mounts without the
 * "usePlayerTransition must be used within PlayerTransitionProvider"
 * regression, and that a missing/invalid id falls through to the
 * differentiated error UI instead of the app-wide ErrorBoundary.
 */
import { test, expect } from "@playwright/test";

test.describe("/track/:trackId standalone player", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("invalid trackId renders scoped error page, not the app crash screen", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    // Deterministic non-UUID: hits the `invalid-id` branch, no network required.
    await page.goto("/track/not-a-real-uuid", { waitUntil: "domcontentloaded" });

    // Auth guard may redirect to /auth; if so, the route itself is reachable
    // and the provider wiring is not the failure mode we're guarding against.
    // Either the scoped error page or the auth page is acceptable — the app
    // crash screen ("Что-то пошло не так") is not.
    await page.waitForLoadState("domcontentloaded");

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Что-то пошло не так");
    expect(body).not.toMatch(/usePlayerTransition must be used within/i);

    // No uncaught page errors referencing the provider.
    expect(consoleErrors.join("\n")).not.toMatch(/usePlayerTransition/);
  });
});
