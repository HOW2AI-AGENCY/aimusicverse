/**
 * Browser Compatibility Tests
 *
 * Comprehensive cross-browser compatibility tests for:
 * - Chrome, Firefox, Safari (WebKit)
 * - Mobile Chrome, Mobile Safari
 * - Microsoft Edge
 *
 * Tests core web APIs and browser features required by the app
 */

import { test, expect } from "@playwright/test";

test.describe("Browser Compatibility - Core APIs", () => {
  test("should support required Web APIs", async ({ page, browserName }) => {
    console.log(`Testing browser: ${browserName}`);

    const apis = await page.evaluate(() => {
      return {
        // Storage APIs
        localStorage: typeof localStorage !== "undefined",
        sessionStorage: typeof sessionStorage !== "undefined",
        indexedDB: typeof indexedDB !== "undefined",

        // File APIs
        File: typeof File !== "undefined",
        Blob: typeof Blob !== "undefined",
        FileReader: typeof FileReader !== "undefined",
        FormData: typeof FormData !== "undefined",

        // Network APIs
        fetch: typeof fetch !== "undefined",
        XMLHttpRequest: typeof XMLHttpRequest !== "undefined",
        WebSocket: typeof WebSocket !== "undefined",

        // DOM APIs
        document: typeof document !== "undefined",
        window: typeof window !== "undefined",
        navigator: typeof navigator !== "undefined",

        // Modern JS features
        Promise: typeof Promise !== "undefined",
        async: typeof async function () {} === "function",
        Map: typeof Map !== "undefined",
        Set: typeof Set !== "undefined",

        // Observer APIs
        IntersectionObserver: typeof IntersectionObserver !== "undefined",
        MutationObserver: typeof MutationObserver !== "undefined",
        ResizeObserver: typeof ResizeObserver !== "undefined",

        // Image APIs
        Image: typeof Image !== "undefined",
        canvas: !!document.createElement("canvas"),

        // Performance APIs
        performance: typeof performance !== "undefined",
        requestAnimationFrame: typeof requestAnimationFrame !== "undefined",
      };
    });

    // Critical APIs that MUST be supported
    expect(apis.localStorage).toBe(true);
    expect(apis.fetch).toBe(true);
    expect(apis.Promise).toBe(true);
    expect(apis.File).toBe(true);
    expect(apis.Blob).toBe(true);
    expect(apis.document).toBe(true);
    expect(apis.IntersectionObserver).toBe(true);

    console.log(`${browserName} - API Support Check: PASSED`);
  });

  test("should support ES6+ features", async ({ page, browserName }) => {
    const es6Support = await page.evaluate(() => {
      try {
        // Test arrow functions
        const arrow = () => true;

        // Test template literals
        const template = `test ${1 + 1}`;

        // Test destructuring
        const { a, b } = { a: 1, b: 2 };
        const [x, y] = [1, 2];

        // Test spread operator
        const arr = [...[1, 2, 3]];
        const obj = { ...{ a: 1 } };

        // Test async/await
        const asyncTest = async () => await Promise.resolve(true);

        // Test classes
        class TestClass {
          constructor() {}
        }

        return {
          arrow: arrow(),
          template: template === "test 2",
          destructuring: a === 1 && b === 2 && x === 1 && y === 2,
          spread: arr.length === 3 && obj.a === 1,
          async: typeof asyncTest === "function",
          classes: typeof TestClass === "function",
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    expect(es6Support.arrow).toBe(true);
    expect(es6Support.template).toBe(true);
    expect(es6Support.destructuring).toBe(true);
    expect(es6Support.spread).toBe(true);
    expect(es6Support.async).toBe(true);
    expect(es6Support.classes).toBe(true);

    console.log(`${browserName} - ES6+ Support: PASSED`);
  });

  test("should handle dynamic imports", async ({ page, browserName }) => {
    const dynamicImport = await page.evaluate(async () => {
      try {
        // Test dynamic import
        const module = await import("/src/lib/storage.ts");
        return {
          success: true,
          hasExports: typeof module === "object",
          hasFormatBytes: typeof module.formatBytes === "function",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    expect(dynamicImport.success).toBe(true);
    expect(dynamicImport.hasExports).toBe(true);
    expect(dynamicImport.hasFormatBytes).toBe(true);

    console.log(`${browserName} - Dynamic Imports: PASSED`);
  });
});

test.describe("Browser Compatibility - Media APIs", () => {
  test("should support image formats", async ({ page, browserName }) => {
    const imageSupport = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;

      return {
        png: canvas.toDataURL("image/png").indexOf("data:image/png") === 0,
        jpeg: canvas.toDataURL("image/jpeg").indexOf("data:image/jpeg") === 0,
        webp: canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0,
      };
    });

    expect(imageSupport.png).toBe(true);
    expect(imageSupport.jpeg).toBe(true);
    // WebP support varies by browser, but we don't fail the test

    console.log(`${browserName} - Image Formats:`, imageSupport);
  });

  test("should support audio APIs", async ({ page, browserName }) => {
    const audioSupport = await page.evaluate(() => {
      return {
        Audio: typeof Audio !== "undefined",
        AudioContext: typeof AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined",
        MediaRecorder: typeof MediaRecorder !== "undefined",
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      };
    });

    expect(audioSupport.Audio).toBe(true);
    // Other audio APIs may not be available in all test environments

    console.log(`${browserName} - Audio APIs:`, audioSupport);
  });
});

test.describe("Browser Compatibility - Storage & Network", () => {
  test("should support localStorage operations", async ({ page, browserName }) => {
    const storageTest = await page.evaluate(() => {
      try {
        const testKey = "__test_key__";
        const testValue = "test_value";

        // Set
        localStorage.setItem(testKey, testValue);

        // Get
        const retrieved = localStorage.getItem(testKey);

        // Remove
        localStorage.removeItem(testKey);

        return {
          success: true,
          setWorks: true,
          getWorks: retrieved === testValue,
          removeWorks: localStorage.getItem(testKey) === null,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    expect(storageTest.success).toBe(true);
    expect(storageTest.setWorks).toBe(true);
    expect(storageTest.getWorks).toBe(true);
    expect(storageTest.removeWorks).toBe(true);

    console.log(`${browserName} - localStorage: PASSED`);
  });

  test("should support fetch API", async ({ page, browserName }) => {
    const fetchTest = await page.evaluate(async () => {
      try {
        // Test that fetch exists and can be called
        const response = await fetch("/", { method: "HEAD" });
        return {
          success: true,
          hasFetch: typeof fetch === "function",
          hasResponse: response instanceof Response,
          hasStatus: typeof response.status === "number",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    expect(fetchTest.hasFetch).toBe(true);
    expect(fetchTest.hasResponse).toBe(true);
    expect(fetchTest.hasStatus).toBe(true);

    console.log(`${browserName} - Fetch API: PASSED`);
  });
});

test.describe("Browser Compatibility - Responsive Design", () => {
  test("should handle viewport changes", async ({ page, browserName }) => {
    const viewports = [
      { width: 375, height: 667, name: "Mobile" },
      { width: 768, height: 1024, name: "Tablet" },
      { width: 1920, height: 1080, name: "Desktop" },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const dimensions = await page.evaluate(() => {
        return {
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        };
      });

      expect(dimensions.windowWidth).toBe(viewport.width);
      expect(dimensions.windowHeight).toBe(viewport.height);

      console.log(`${browserName} - ${viewport.name} viewport: ${dimensions.windowWidth}x${dimensions.windowHeight}`);
    }
  });

  test("should support media queries", async ({ page, browserName }) => {
    const mediaQuerySupport = await page.evaluate(() => {
      return {
        matchMedia: typeof window.matchMedia === "function",
        prefersReducedMotion: window.matchMedia("(prefers-reduced-motion)").matches,
        prefersColorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches,
      };
    });

    expect(mediaQuerySupport.matchMedia).toBe(true);

    console.log(`${browserName} - Media Queries:`, mediaQuerySupport);
  });
});

test.describe("Browser Compatibility - Performance", () => {
  test("should support performance APIs", async ({ page, browserName }) => {
    const perfSupport = await page.evaluate(() => {
      return {
        performance: typeof performance !== "undefined",
        now: typeof performance.now === "function",
        mark: typeof performance.mark === "function",
        measure: typeof performance.measure === "function",
        timing: !!performance.timing || !!performance.getEntriesByType,
      };
    });

    expect(perfSupport.performance).toBe(true);
    expect(perfSupport.now).toBe(true);

    console.log(`${browserName} - Performance APIs:`, perfSupport);
  });

  test("should measure basic performance", async ({ page, browserName }) => {
    const perf = await page.evaluate(() => {
      const start = performance.now();

      // Simulate some work
      let result = 0;
      for (let i = 0; i < 1000; i++) {
        result += i;
      }

      const end = performance.now();

      return {
        duration: end - start,
        result,
      };
    });

    expect(perf.duration).toBeGreaterThan(0);
    expect(perf.duration).toBeLessThan(100); // Should be very fast

    console.log(`${browserName} - Performance measurement: ${perf.duration.toFixed(2)}ms`);
  });
});

test.describe("Browser Compatibility - Summary", () => {
  test("should generate compatibility report", async ({ page, browserName }) => {
    const report = await page.evaluate(() => {
      return {
        browser: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
        },
        screen: {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth,
        },
        window: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
        features: {
          localStorage: typeof localStorage !== "undefined",
          indexedDB: typeof indexedDB !== "undefined",
          serviceWorker: "serviceWorker" in navigator,
          webGL: (() => {
            const canvas = document.createElement("canvas");
            return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
          })(),
        },
      };
    });

    console.log(`\n=== ${browserName} Compatibility Report ===`);
    console.log("Browser:", report.browser.userAgent.substring(0, 80) + "...");
    console.log("Platform:", report.browser.platform);
    console.log("Screen:", `${report.screen.width}x${report.screen.height}`);
    console.log("Viewport:", `${report.window.innerWidth}x${report.window.innerHeight}`);
    console.log("Pixel Ratio:", report.window.devicePixelRatio);
    console.log("Features:", JSON.stringify(report.features, null, 2));
    console.log("==========================================\n");

    // Basic sanity checks
    expect(report.browser.cookieEnabled).toBe(true);
    expect(report.features.localStorage).toBe(true);
  });
});
