/**
 * Regression guard — AI lyrics agent button must stay visible.
 *
 * The floating toolbar under the lyrics textarea used to overflow horizontally
 * once long lyrics were pasted, pushing the "ИИ" agent button outside the
 * dialog. This spec opens the full generation form, pastes a long multi-section
 * lyrics text and asserts, across several widths plus mobile landscape, that:
 *   - the button is visible and reasonably sized (touch target),
 *   - its bounding box stays inside the viewport and inside the toolbar,
 *   - the toolbar itself has no horizontal overflow.
 *
 * Run: npx playwright test -c playwright.visual.config.ts tests/visual/lyrics-ai-button.spec.ts
 */
import { test, expect, Page } from "@playwright/test";

const AI_BUTTON_LABEL = "ИИ-агент написания текста";

const VIEWPORTS = [
  { name: "xs-portrait", width: 320, height: 640 },
  { name: "sm-portrait", width: 375, height: 812 },
  { name: "md-portrait", width: 420, height: 900 },
  { name: "mobile-landscape", width: 812, height: 375 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const;

const LONG_LYRICS = Array.from(
  { length: 12 },
  (_, i) =>
    `[Verse ${i + 1}]\nОчень длинная строка текста песни номер ${i + 1}, которая проверяет перенос и переполнение\nЕщё одна строка с длинным словом супердлинноесловодляпроверкипереполнения\n\n[Chorus]\nПрипев ${i + 1}\n`,
).join("\n");

async function openLyricsEditor(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.addStyleTag({
    content: `*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;}`,
  });

  // Onboarding overlay intercepts pointer events on a fresh session.
  const skipOnboarding = page.getByLabel("Пропустить онбординг");
  if (await skipOnboarding.count()) {
    await skipOnboarding.click({ timeout: 15_000 }).catch(() => undefined);
  }

  await page.getByLabel("Открыть форму создания трека").click({ timeout: 20_000 });
  await page.getByLabel("Полный — Все настройки").click({ timeout: 20_000 });

  const aiButton = page.getByLabel(AI_BUTTON_LABEL);
  await aiButton.waitFor({ state: "visible", timeout: 20_000 });
  return aiButton;
}

test.describe("Lyrics AI agent button visibility", () => {
  for (const vp of VIEWPORTS) {
    test(`stays inside the toolbar @ ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const aiButton = await openLyricsEditor(page);

      // Paste long lyrics — the original regression only appeared with content.
      const textarea = page.locator("textarea").filter({ hasNot: page.locator(":scope[readonly]") }).last();
      await textarea.fill(LONG_LYRICS);
      await page.waitForTimeout(400);

      await expect(aiButton, `AI button hidden @ ${vp.name}`).toBeVisible();

      const box = await aiButton.boundingBox();
      expect(box, `no bounding box @ ${vp.name}`).not.toBeNull();
      if (!box) return;

      // Touch target: the compact button is h-8 (32px); never smaller.
      expect(box.height, `AI button too short @ ${vp.name}`).toBeGreaterThanOrEqual(28);
      expect(box.width, `AI button too narrow @ ${vp.name}`).toBeGreaterThanOrEqual(40);

      // Fully inside the viewport horizontally and vertically.
      expect(box.x, `AI button clipped on the left @ ${vp.name}`).toBeGreaterThanOrEqual(-0.5);
      expect(box.x + box.width, `AI button clipped on the right @ ${vp.name}`).toBeLessThanOrEqual(vp.width + 0.5);
      expect(box.y, `AI button above the viewport @ ${vp.name}`).toBeGreaterThanOrEqual(-0.5);
      expect(box.y + box.height, `AI button below the viewport @ ${vp.name}`).toBeLessThanOrEqual(vp.height + 0.5);

      // Inside its own toolbar row (no escape from the scrolling actions row)
      // and the toolbar must not overflow horizontally.
      const geometry = await aiButton.evaluate((el) => {
        const toolbar = el.parentElement?.parentElement as HTMLElement | null;
        if (!toolbar) return null;
        const r = toolbar.getBoundingClientRect();
        return {
          left: r.left,
          right: r.right,
          scrollWidth: toolbar.scrollWidth,
          clientWidth: toolbar.clientWidth,
        };
      });
      expect(geometry, `toolbar not found @ ${vp.name}`).not.toBeNull();
      if (!geometry) return;

      expect(box.x + box.width, `AI button outside toolbar @ ${vp.name}`).toBeLessThanOrEqual(geometry.right + 0.5);
      expect(box.x, `AI button left of toolbar @ ${vp.name}`).toBeGreaterThanOrEqual(geometry.left - 0.5);
      expect(
        geometry.scrollWidth - geometry.clientWidth,
        `lyrics toolbar overflows horizontally @ ${vp.name}`,
      ).toBeLessThanOrEqual(1);
    });
  }
});
