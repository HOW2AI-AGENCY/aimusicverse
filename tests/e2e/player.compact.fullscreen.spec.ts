/**
 * CompactPlayer fullscreen + viewport-change regression tests.
 *
 * Covers:
 *   - Fullscreen expansion is reachable at 390 / 820 / 1440 widths
 *   - Close button stays accessible after expand/collapse cycles
 *   - Layout has no overlapping/clipping after rotating portrait↔landscape
 */
import { test, expect, type Page } from "@playwright/test";

const SAMPLE_TRACK = {
  id: "e2e-compact-fullscreen-track",
  title: "E2E Fullscreen Sample",
  style: "Test",
  audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  streaming_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  cover_url: null,
  user_id: null,
  duration_seconds: 60,
};

async function mountPlayer(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate((track) => {
    const store = (window as any).__playerStore;
    if (store?.setState) {
      store.setState({
        activeTrack: track,
        playerMode: "compact",
        queue: [],
        isPlaying: false,
      });
    }
  }, SAMPLE_TRACK);
  await page.waitForTimeout(300);
}

async function ensureMounted(page: Page) {
  const player = page.getByTestId("compact-player");
  if ((await player.count()) === 0) {
    test.skip(true, "Player store API unavailable in this build");
  }
  return player;
}

const SIZES = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-820", width: 820, height: 1180 },
  { name: "desktop-1440", width: 1440, height: 900 },
] as const;

for (const size of SIZES) {
  test.describe(`Fullscreen expand @ ${size.name}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test("expand → close button accessible → collapse restores compact", async ({
      page,
    }) => {
      await mountPlayer(page);
      const player = await ensureMounted(page);
      await expect(player).toBeVisible();

      // Expand to fullscreen
      const expandZone = page.getByTestId("compact-player-expand").first();
      await expandZone.click();
      await page.waitForTimeout(350);

      // Fullscreen surface should be present and cover most of viewport
      const fs = page
        .locator('[data-testid="fullscreen-player"], [data-testid="expanded-player"], [role="dialog"]')
        .first();
      await expect(fs).toBeVisible({ timeout: 3000 });

      const fsBox = await fs.boundingBox();
      expect(fsBox?.width ?? 0).toBeGreaterThanOrEqual(size.width * 0.85);

      // Close button reachable + within viewport
      const closeBtn = page
        .getByRole("button", { name: /закрыть|close/i })
        .first();
      await expect(closeBtn).toBeVisible();
      const cb = await closeBtn.boundingBox();
      expect(cb).toBeTruthy();
      expect(cb!.x).toBeGreaterThanOrEqual(0);
      expect(cb!.x + cb!.width).toBeLessThanOrEqual(size.width + 1);
      expect(cb!.y).toBeGreaterThanOrEqual(0);
      // Hit-area >= 36px
      expect(Math.min(cb!.width, cb!.height)).toBeGreaterThanOrEqual(36);

      // Close → compact restored
      await closeBtn.click();
      await page.waitForTimeout(300);
      await expect(player).toBeVisible();
    });
  });
}

test.describe("CompactPlayer non-overlap across orientation changes", () => {
  test("portrait → landscape → portrait keeps layout intact", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mountPlayer(page);
    const player = await ensureMounted(page);
    await expect(player).toBeVisible();

    const checkNoOverflow = async (label: string) => {
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow @ ${label}`).toBeLessThanOrEqual(2);

      const box = await player.boundingBox();
      expect(box, `player box @ ${label}`).toBeTruthy();
      // Player stays within viewport horizontally
      const vw = page.viewportSize()!.width;
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(vw + 1);
      // Player stays within viewport vertically (above bottom)
      const vh = page.viewportSize()!.height;
      expect(box!.y + box!.height).toBeLessThanOrEqual(vh + 1);
    };

    await checkNoOverflow("portrait-390");

    // Rotate to landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(250);
    await expect(player).toBeVisible();
    await checkNoOverflow("landscape-844");

    // Back to portrait
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    await expect(player).toBeVisible();
    await checkNoOverflow("portrait-390-again");

    // Close button still reachable
    await expect(page.getByTestId("compact-player-close")).toBeVisible();
  });

  test("desktop wide → narrow keeps controls reachable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mountPlayer(page);
    const player = await ensureMounted(page);
    await expect(player).toBeVisible();
    await expect(page.getByTestId("compact-player-close")).toBeVisible();

    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(250);
    await expect(player).toBeVisible();
    await expect(page.getByTestId("compact-player-close")).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    await expect(player).toBeVisible();
    await expect(page.getByTestId("compact-player-close")).toBeVisible();
  });
});
