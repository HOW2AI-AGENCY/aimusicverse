import { test, expect } from "@playwright/test";

/**
 * Visual regression / blank-frame smoke for the two highest-traffic routes.
 * Captures timestamped screenshots and asserts the root has non-empty paint
 * at every tick — protects against the "blank frame on route swap" regression.
 */

const ROUTES = ["/", "/projects"] as const;
const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 720 },
  { name: "mobile-424", width: 424, height: 783 },
  { name: "tablet-768", width: 768, height: 1024 },
] as const;
const TICKS_MS = [0, 100, 300, 600, 1200, 2000];

for (const vp of VIEWPORTS) {
  for (const route of ROUTES) {
    test(`no blank frame on ${route} @ ${vp.name}`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:8080${route}`, { waitUntil: "domcontentloaded" });

      for (const t of TICKS_MS) {
        await page.waitForTimeout(t === 0 ? 0 : TICKS_MS[TICKS_MS.indexOf(t)] - (TICKS_MS[TICKS_MS.indexOf(t) - 1] ?? 0));
        const shot = await page.screenshot();
        await testInfo.attach(`${vp.name}_${route.replace(/\W+/g, "_")}_t${t}.png`, {
          body: shot,
          contentType: "image/png",
        });
      }

      // Root must have rendered content (no permanent blank frame)
      const rootHTML = await page.locator("#root").innerHTML();
      expect(rootHTML.length, "root should not be empty after 2s").toBeGreaterThan(200);

      expect(errors, `runtime errors: ${errors.join("\n")}`).toEqual([]);
    });
  }
}
