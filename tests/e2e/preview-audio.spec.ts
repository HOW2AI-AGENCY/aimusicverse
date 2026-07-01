/**
 * Preview-audio pool contract regression.
 *
 * WHY:
 *   MusicVerse deliberately uses a SINGLE HTMLAudioElement for playback
 *   (owned by GlobalAudioProvider, mounted at the app root).
 *
 *   GROUND TRUTH: the singleton lives in a JavaScript ref (React useRef /
 *   `audioRef.current = new Audio()` inside useAudioInit), it is NEVER
 *   appended to the DOM. Therefore `document.querySelectorAll("audio")`
 *   on the home page is 0, not 1.
 *
 *   All other preview / dialog / stem / version audio MUST go through
 *   `usePreviewAudio` -> `audioElementPool`, which creates *detached*
 *   HTMLAudioElement instances (see `src/lib/audioElementPool.ts`
 *   `createAudioElement` -> `new Audio()` with no `appendChild`).
 *
 *   iOS Safari caps simultaneous <audio> elements (~6-8). Any new code
 *   that mounts a <audio> JSX tag — or appends a pool element to the
 *   DOM (e.g. `document.body.appendChild(pool.audio)`) — will
 *   reintroduce the iOS Safari crash path.
 *
 *   This spec asserts the structural invariant after app boot: ZERO
 *   <audio> elements are attached to the DOM, and ZERO <audio[src]>
 *   elements exist anywhere. Either of those flipping to >0 is a
 *   regression. The spec is intentionally a structural smoke — not an
 *   interaction test — so it stays stable across UI changes that
 *   B1/B2/B3 introduced (LyricsStudio decomp, PromptDJ hook split,
 *   10 `new Audio()` -> usePreviewAudio migrations).
 */
import { test, expect } from "@playwright/test";

test.describe("Preview-audio pool contract", () => {
  test("no <audio> element is attached to the DOM after boot", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for React to mount so the app has rendered.
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

    // The whole point: GlobalAudioProvider's singleton lives in a JS
    // ref, never in the DOM. Pool elements (audioElementPool) and
    // previews (usePreviewAudio) create detached HTMLAudioElements that
    // are NOT appended to the DOM. Any element showing up here is a
    // regression that re-opens the iOS Safari multi-audio crash path.
    expect(
      audioInfo.length,
      `expected 0 attached <audio> in DOM, found ${audioInfo.length}: ${JSON.stringify(audioInfo)}. ` +
        `A non-zero count means a <audio> JSX tag or pool appendChild was introduced.`,
    ).toBe(0);
  });

  test("no <audio[src]> element exists anywhere in the DOM", async ({ page }) => {
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

    // Defensive complement: catches the regression scenario where a
    // pool element is appended to the DOM and assigned a src (the
    // pattern that B1/B2/B3 explicitly removed). Even if some future
    // code path attaches a pool element, it should never carry a src.
    const srcAudios = await page.evaluate(
      () => Array.from(document.querySelectorAll("audio[src]")).length,
    );

    expect(
      srcAudios,
      "expected 0 <audio[src]> in DOM. A non-zero count means a <audio> " +
        "element was mounted with a src attribute, which both bypasses the " +
        "GlobalAudioProvider singleton AND increases the iOS Safari audio cap.",
    ).toBe(0);
  });
});
