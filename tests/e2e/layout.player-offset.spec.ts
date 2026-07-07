/**
 * Layout offset regression tests.
 *
 * Ensures that when the CompactPlayer is mounted, the page bottom padding
 * grows enough so that BottomNavigation + CompactPlayer never overlap the
 * last in-page content after scrolling to the bottom.
 */
import { test, expect, type Page } from "@playwright/test";

const SAMPLE_TRACK = {
  id: "e2e-layout-offset-track",
  title: "E2E Layout Offset",
  style: "Test",
  audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  streaming_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  cover_url: null,
  user_id: null,
  duration_seconds: 60,
};

async function mountCompact(page: Page) {
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

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-820", width: 820, height: 1180 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`Player offset @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("CompactPlayer + BottomNav do not overlap last section after scroll", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
      await mountCompact(page);

      // Scroll the main scroll container to its bottom.
      const main = page.locator("#main-content");
      await main.evaluate((el) => {
        el.scrollTo({ top: el.scrollHeight, behavior: "instant" as ScrollBehavior });
      });
      await page.waitForTimeout(200);

      const compact = page.getByTestId("compact-player");
      if ((await compact.count()) === 0) {
        test.skip(true, "Compact player not mounted in this build");
      }

      // Last in-page section bottom should be above CompactPlayer top.
      const sections = page.locator("[data-section-id]");
      const count = await sections.count();
      if (count === 0) {
        test.skip(true, "No HomeSection wrappers found");
      }

      const last = sections.nth(count - 1);
      const lastBox = await last.boundingBox();
      const compactBox = await compact.boundingBox();
      expect(lastBox).not.toBeNull();
      expect(compactBox).not.toBeNull();
      if (lastBox && compactBox) {
        // Last section bottom must sit above (or at) the player's top edge.
        expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(
          compactBox.y + 1,
        );
      }
    });
  });
}
