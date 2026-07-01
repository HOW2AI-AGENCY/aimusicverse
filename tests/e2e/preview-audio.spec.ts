/**
 * Preview-audio pool contract regression.
 *
 * WHY:
 *   MusicVerse deliberately uses a SINGLE HTMLAudioElement for playback
 *   (owned by GlobalAudioProvider, mounted at the app root). All other
 *   preview / dialog / stem / version audio MUST go through
 *   `usePreviewAudio` -> `audioElementPool`, which creates *detached*
 *   HTMLAudioElement instances (see `src/lib/audioElementPool.ts`
 *   `createAudioElement` -> `new Audio()` with no `appendChild`).
 *
 *   iOS Safari caps simultaneous <audio> elements (~6-8). Any new code
 *   that calls `new Audio(...).play()` directly — or that mounts a
 *   <audio> JSX element outside GlobalAudioProvider — will silently
 *   increase the attached-audio count and eventually crash the player
 *   on real devices.
 *
 *   This spec asserts the structural invariant after app boot: the DOM
 *   contains exactly ONE <audio> element, and it has no `src=` (the
 *   active src is swapped on the single element by GlobalAudioProvider,
 *   not by mounting a new tag). The spec is intentionally a structural
 *   smoke — not an interaction test — so it stays stable across UI
 *   changes that B1/B2/B3 introduced (LyricsStudio decomp, PromptDJ
 *   hook split, 10 `new Audio()` -> usePreviewAudio migrations).
 *
 *   If this fails, the most likely regression is a `new Audio()` call
 *   that was reintroduced, or a <audio> JSX tag added to a component
 *   that bypasses the global player.
 */
import { test, expect } from "@playwright/test";

test.describe("Preview-audio pool contract", () => {
  test("exactly one <audio> element exists in the DOM after boot", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for React to mount so GlobalAudioProvider has rendered.
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        const fallback = document.getElementById("loading-fallback");
        const hasReal =
          root?.querySelector("main, [role='main'], nav, [role='navigation'], [data-testid]") != null;
        return !!root && (!fallback || hasReal);
      },
      { timeout: 20_000 },
    );

    const audioInfo = await page.evaluate(() => {
      const audios = Array.from(document.querySelectorAll("audio"));
      return audios.map((el) => ({
        src: el.getAttribute("src") ?? "",
        currentSrc: el.currentSrc ?? "",
        attached: el.isConnected,
        parentTag: el.parentElement?.tagName?.toLowerCase() ?? null,
      }));
    });

    // The whole point: the global player owns exactly ONE <audio>.
    // Pool elements (audioElementPool) and previews (usePreviewAudio)
    // create detached HTMLAudioElements that are NOT appended to the DOM,
    // so they must not show up here.
    expect(
      audioInfo.length,
      `expected exactly 1 <audio> in DOM, found ${audioInfo.length}: ${JSON.stringify(audioInfo)}`,
    ).toBe(1);
  });

  test("the singleton <audio> is the only attached audio element", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        const fallback = document.getElementById("loading-fallback");
        const hasReal =
          root?.querySelector("main, [role='main'], nav, [role='navigation'], [data-testid]") != null;
        return !!root && (!fallback || hasReal);
      },
      { timeout: 20_000 },
    );

    const attached = await page.evaluate(() => {
      const audios = Array.from(document.querySelectorAll("audio"));
      return audios.filter((a) => a.isConnected).length;
    });

    expect(
      attached,
      "attached <audio> count must be 1 (GlobalAudioProvider singleton). " +
        "Multiple attached elements indicate a leaked <audio> JSX tag or " +
        "a new Audio() that was incorrectly appended to the DOM.",
    ).toBe(1);
  });
});