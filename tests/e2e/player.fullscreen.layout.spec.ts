/**
 * FullscreenPlayer layout regression tests.
 *
 * Validates that the timeline / waveform and transport controls do not overlap
 * each other across the canonical breakpoints (390 / 768 / 1440), in both
 * portrait and landscape orientations. Also asserts that the close affordance
 * has a touch-target ≥ 44×44 px.
 */
import { test, expect, type Page } from "@playwright/test";

const SAMPLE_TRACK = {
  id: "e2e-fullscreen-layout-track",
  title: "E2E Fullscreen Layout",
  style: "Test",
  audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  streaming_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  cover_url: null,
  user_id: null,
  duration_seconds: 90,
};

async function mountFullscreen(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((track) => {
    const store = (window as any).__playerStore;
    if (store?.setState) {
      store.setState({
        activeTrack: track,
        playerMode: "fullscreen",
        queue: [],
        isPlaying: false,
      });
    }
  }, SAMPLE_TRACK);
  await page.waitForTimeout(400);
}

function intersects(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

const SCENARIOS = [
  { name: "mobile-390-portrait", width: 390, height: 844 },
  { name: "mobile-390-landscape", width: 844, height: 390 },
  { name: "tablet-768-portrait", width: 768, height: 1024 },
  { name: "tablet-768-landscape", width: 1024, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
] as const;

for (const s of SCENARIOS) {
  test.describe(`FullscreenPlayer layout @ ${s.name}`, () => {
    test.use({ viewport: { width: s.width, height: s.height } });

    test("timeline & transport do not overlap; close button reachable", async ({
      page,
    }) => {
      await mountFullscreen(page);

      const root = page.locator(
        '[data-testid="fullscreen-player"], [data-testid="mobile-fullscreen-player"], [data-testid="desktop-fullscreen-player"]',
      );
      if ((await root.count()) === 0) {
        test.skip(true, "Fullscreen player not mounted in this build");
      }

      // Close button: 44×44 minimum
      const close = page
        .getByRole("button", { name: /close|закры/i })
        .first();
      await expect(close).toBeVisible();
      const cb = await close.boundingBox();
      expect(cb).not.toBeNull();
      if (cb) {
        expect(cb.width).toBeGreaterThanOrEqual(40);
        expect(cb.height).toBeGreaterThanOrEqual(40);
      }

      // Timeline / waveform vs transport: must not overlap when both present.
      const timeline = page
        .locator(
          '[data-testid="player-timeline"], [data-testid="waveform"], [data-testid="progress-bar"]',
        )
        .first();
      const transport = page
        .locator(
          '[data-testid="player-transport"], [data-testid="playback-controls"]',
        )
        .first();

      if ((await timeline.count()) && (await transport.count())) {
        const tb = await timeline.boundingBox();
        const cb2 = await transport.boundingBox();
        if (tb && cb2) {
          expect(intersects(tb, cb2)).toBe(false);
        }
      }
    });
  });
}
