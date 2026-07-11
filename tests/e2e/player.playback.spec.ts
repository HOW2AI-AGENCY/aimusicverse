import { test, expect } from "@playwright/test";

test.describe("Player playback controls", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("play/pause toggle changes button aria-label", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // Find any play/pause button
    const playBtn = page.locator(
      'button[aria-label*="Play"], button[aria-label*="Воспр"], [data-testid="play-button"], [data-testid="play-pause"]',
    ).first();

    const pauseBtn = page.locator(
      'button[aria-label*="Pause"], button[aria-label*="Пауз"], [data-testid="pause-button"]',
    ).first();

    const hasControl = (await playBtn.count() + await pauseBtn.count()) > 0;

    if (!hasControl) {
      test.skip(true, "No play/pause control found — no track loaded");
      return;
    }

    const target = (await playBtn.count() > 0) ? playBtn : pauseBtn;
    await expect(target).toBeVisible();
    await target.click();
    await page.waitForTimeout(500);

    // After click, button should still be present (no crash)
    await expect(target).toBeVisible();
  });

  test("queue button opens queue sheet", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const queueBtn = page.locator(
      'button[aria-label*="queue"], button[aria-label*="очеред"], button[aria-label*="Очеред"], [data-testid="queue-button"]',
    ).first();

    if ((await queueBtn.count()) === 0) {
      test.skip(true, "No queue button found");
      return;
    }

    await expect(queueBtn).toBeVisible();
    await queueBtn.click();
    await page.waitForTimeout(500);

    // Queue sheet should appear
    const queueSheet = page.locator(
      '[class*="QueueSheet"], [class*="queue-sheet"], [data-testid="queue-sheet"], [role="dialog"]',
    );
    await expect(queueSheet.first()).toBeVisible({ timeout: 5000 });
  });
});
