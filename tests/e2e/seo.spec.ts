import { test, expect } from "@playwright/test";

/**
 * SEO regression guards. Fails on missing/regressed:
 *   - <title>, meta description (length bounds)
 *   - absolute canonical link
 *   - og:title / og:description / og:url / og:type
 *   - viewport meta, html[lang]
 *
 * Static index.html is the source of truth for crawlers that don't execute JS,
 * so we assert against the served HTML. Per-route Helmet/SEOHead overrides
 * tested separately if needed.
 */

const ROUTES = ["/", "/library", "/pricing", "/auth", "/community"];

for (const route of ROUTES) {
  test(`SEO meta present on ${route}`, async ({ page }) => {
    const resp = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(resp?.ok(), `route ${route} did not return 2xx`).toBeTruthy();

    const title = await page.title();
    expect(title.length, "title length 10..70").toBeGreaterThanOrEqual(10);
    expect(title.length).toBeLessThanOrEqual(80);

    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc, "meta description missing").toBeTruthy();
    expect(desc!.length, "meta description length 30..170").toBeGreaterThanOrEqual(30);
    expect(desc!.length).toBeLessThanOrEqual(200);

    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href");
    expect(canonical, "canonical missing").toBeTruthy();
    expect(canonical!).toMatch(/^https?:\/\//);

    for (const prop of ["og:title", "og:description", "og:url", "og:type"]) {
      const v = await page.locator(`meta[property="${prop}"]`).first().getAttribute("content");
      expect(v, `${prop} missing`).toBeTruthy();
    }
    const ogUrl = await page.locator('meta[property="og:url"]').first().getAttribute("content");
    expect(ogUrl!).toMatch(/^https?:\/\//);

    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport, "viewport meta missing").toBeTruthy();

    const lang = await page.locator("html").getAttribute("lang");
    expect(lang, "html[lang] missing").toBeTruthy();
  });
}
