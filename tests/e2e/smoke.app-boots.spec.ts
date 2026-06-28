/**
 * Smoke tests: app boots into real router, key UI renders, auth context
 * settles in guest mode, no early error UI. Runs in a browser matrix so a
 * regression that only hits Firefox/WebKit is caught in CI.
 *
 * On failure we dump everything a reviewer needs to a per-browser folder:
 *   test-results/smoke/<browser>/
 *     - boot-log.json            musicverse_boot_log from sessionStorage
 *     - early-errors.json        window.__EARLY_ERRORS captured by index.html
 *     - console-errors.log       page console.error stream
 *     - page-errors.log          uncaught page errors (window.onerror)
 *     - failed-requests.log      4xx/5xx responses + requestfailed events
 *     - dom-map.json             snapshot of key selectors (counts + samples)
 *     - <route>.png              full screenshots of each visited route
 *
 * Playwright trace/video are forced to retain-on-failure so CI uploads
 * them per-browser run.
 */
import { test, expect, type Page, type Request, type Response } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Force per-test trace + video. Overrides global playwright.config.ts
// so smoke always has a debuggable artifact on failure, regardless of
// whether retries kicked in.
test.use({
  trace: "retain-on-failure",
  video: "retain-on-failure",
  screenshot: "only-on-failure",
});

function artifactDir(browserName: string) {
  const dir = path.resolve(process.cwd(), "test-results", "smoke", browserName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeArtifact(browserName: string, name: string, content: string) {
  fs.writeFileSync(path.join(artifactDir(browserName), name), content, "utf8");
}

async function waitForAppMounted(page: Page) {
  // React replaces / removes the static #loading-fallback once mounted.
  await page.waitForFunction(
    () => {
      const root = document.getElementById("root");
      if (!root) return false;
      const fallback = document.getElementById("loading-fallback");
      const hasReal =
        root.querySelector("main, [role='main'], nav, [role='navigation'], [data-testid]") != null;
      return !fallback || hasReal;
    },
    { timeout: 20_000 },
  );
}

async function captureDomMap(page: Page) {
  return page.evaluate(() => {
    const selectors = [
      "main",
      "nav",
      "[role='navigation']",
      "[role='main']",
      "[data-testid='edge-rail']",
      "[data-testid]",
      "[data-section-id]",
      "[data-hint-id]",
      "header",
      "footer",
      "button",
      "a[href]",
    ];
    const out: Record<string, { count: number; samples: string[] }> = {};
    for (const sel of selectors) {
      const nodes = Array.from(document.querySelectorAll(sel));
      out[sel] = {
        count: nodes.length,
        samples: nodes.slice(0, 5).map((n) => {
          const el = n as HTMLElement;
          const id = el.id ? `#${el.id}` : "";
          const tid = el.getAttribute("data-testid");
          const cls = el.className && typeof el.className === "string" ? `.${el.className.split(/\s+/).slice(0, 2).join(".")}` : "";
          const text = (el.innerText || "").trim().slice(0, 40);
          return `${el.tagName.toLowerCase()}${id}${tid ? `[data-testid=${tid}]` : ""}${cls}${text ? ` "${text}"` : ""}`;
        }),
      };
    }
    return {
      url: location.href,
      title: document.title,
      rootChildren: document.getElementById("root")?.children.length ?? 0,
      hasFallback: !!document.getElementById("loading-fallback"),
      errorDisplayVisible:
        !!document.getElementById("error-display") &&
        document.getElementById("error-display")!.classList.contains("visible"),
      selectors: out,
    };
  });
}

test.describe("App smoke", () => {
  test("boots router, renders guest UI, no #error-display", async (
    { page, browserName },
    testInfo,
  ) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      pageErrors.push(`${err.name}: ${err.message}\n${err.stack ?? ""}`);
    });
    page.on("requestfailed", (req: Request) => {
      // Ignore aborted requests during navigation — those are expected.
      const failure = req.failure();
      if (failure?.errorText === "net::ERR_ABORTED") return;
      failedRequests.push(`REQFAIL ${req.method()} ${req.url()} — ${failure?.errorText ?? "unknown"}`);
    });
    page.on("response", (res: Response) => {
      const status = res.status();
      if (status >= 400) {
        // Telegram script + analytics 404s in dev shouldn't fail smoke.
        const url = res.url();
        if (/telegram\.org|t\.me|sentry|google-analytics|gtag/.test(url)) return;
        failedRequests.push(`HTTP ${status} ${res.request().method()} ${url}`);
      }
    });

    // ---------- 1. Initial boot at / ----------
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response, "page should respond").not.toBeNull();
    expect(response!.status(), "HTTP status").toBeLessThan(400);

    await waitForAppMounted(page);

    // Persist boot diagnostics regardless of pass/fail.
    const bootLog = await page.evaluate(() => {
      try {
        return sessionStorage.getItem("musicverse_boot_log") ?? "";
      } catch {
        return "";
      }
    });
    const earlyErrors = await page.evaluate(() =>
      JSON.stringify((window as any).__EARLY_ERRORS ?? [], null, 2),
    );
    if (bootLog) writeArtifact(browserName, "boot-log.json", bootLog);
    writeArtifact(browserName, "early-errors.json", earlyErrors);

    // The static error block must NOT be visible.
    const errorVisible = await page.evaluate(() => {
      const el = document.getElementById("error-display");
      return !!el && el.classList.contains("visible");
    });
    expect(errorVisible, "early #error-display must not be visible").toBe(false);

    // ---------- 2. Guest mode: key UI from MainLayout ----------
    // No Telegram session / no Supabase auth → app must render the guest
    // home with the layout shell (main + bottom nav / edge rail). This
    // proves AuthContext settled to "unauthenticated" without throwing.
    await expect(page.locator("main").first(), "<main> from MainLayout").toBeVisible({
      timeout: 10_000,
    });
    const navLandmark = page.locator("nav, [role='navigation'], [data-testid='edge-rail']").first();
    await expect(navLandmark, "navigation landmark from MainLayout").toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveTitle(/MusicVerse|Music/i);

    // ---------- 3. Auth page renders (login surface) ----------
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await waitForAppMounted(page);
    // Auth screen should expose at least one interactive sign-in surface.
    // In dev mode: "Войти как Test User" or "Попробовать без авторизации"
    // In prod with Telegram: "Продолжить" or "Попробовать без авторизации"
    const authSurface = page
      .getByRole("button", {
        name: /войти|sign in|log in|telegram|continue|guest|попробовать|test user/i,
      })
      .first();
    await expect(authSurface, "auth page interactive surface").toBeVisible({ timeout: 10_000 });

    // ---------- 4. Second SPA route to verify client-side routing ----------
    await page.goto("/studio-v2", { waitUntil: "domcontentloaded" });
    await waitForAppMounted(page);
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });

    // ---------- 5. Always flush streams. On failure, also dump DOM map. ----------
    if (consoleErrors.length)
      writeArtifact(browserName, "console-errors.log", consoleErrors.join("\n"));
    if (pageErrors.length) writeArtifact(browserName, "page-errors.log", pageErrors.join("\n\n"));
    if (failedRequests.length)
      writeArtifact(browserName, "failed-requests.log", failedRequests.join("\n"));

    expect(pageErrors, `uncaught page errors in ${browserName}:\n${pageErrors.join("\n")}`).toEqual(
      [],
    );

    testInfo.annotations.push({
      type: "smoke-artifacts",
      description: `test-results/smoke/${browserName}/`,
    });
  });

  // Runs after EVERY smoke test — on failure, dumps DOM map + screenshot
  // for each route. The arrays above are flushed in the test body too.
  test.afterEach(async ({ page, browserName }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return;
    try {
      const map = await captureDomMap(page);
      writeArtifact(browserName, "dom-map.json", JSON.stringify(map, null, 2));
      await page.screenshot({
        path: path.join(artifactDir(browserName), `failure-${Date.now()}.png`),
        fullPage: true,
      });
    } catch {
      // Page may have crashed — nothing more we can do.
    }
  });
});
