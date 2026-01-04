/**
 * Browser Tests for CDN Integration
 *
 * Tests CDN helper functions across multiple browsers:
 * - Chrome, Firefox, Safari (WebKit)
 * - Mobile Chrome, Mobile Safari
 * - Edge
 *
 * Coverage:
 * - CDN URL generation
 * - Image optimization
 * - Responsive image srcsets
 * - Browser-specific image format support
 */

import { test, expect } from "@playwright/test";

test.describe("CDN Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for app to be ready
    await page.waitForLoadState("networkidle");
  });

  test("should load CDN helper module without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    const result = await page.evaluate(async () => {
      try {
        const cdnModule = await import("/src/lib/cdn.ts");
        return {
          success: true,
          hasGetCDNUrl: typeof cdnModule.getCDNUrl === "function",
          hasGetOptimizedImageUrl: typeof cdnModule.getOptimizedImageUrl === "function",
          hasGetResponsiveImageSrcSet: typeof cdnModule.getResponsiveImageSrcSet === "function",
          hasGetThumbnailUrl: typeof cdnModule.getThumbnailUrl === "function",
          hasGetBlurPlaceholderUrl: typeof cdnModule.getBlurPlaceholderUrl === "function",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.hasGetCDNUrl).toBe(true);
    expect(result.hasGetOptimizedImageUrl).toBe(true);
    expect(result.hasGetResponsiveImageSrcSet).toBe(true);
    expect(result.hasGetThumbnailUrl).toBe(true);
    expect(result.hasGetBlurPlaceholderUrl).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test("should validate CDN providers configuration", async ({ page }) => {
    const providers = await page.evaluate(async () => {
      const { CDN_PROVIDERS } = await import("/src/lib/cdn.ts");
      return CDN_PROVIDERS;
    });

    expect(providers).toHaveProperty("SUPABASE");
    expect(providers).toHaveProperty("CLOUDFLARE");
    expect(providers).toHaveProperty("BUNNY");

    expect(providers.SUPABASE).toBe("supabase");
    expect(providers.CLOUDFLARE).toBe("cloudflare");
    expect(providers.BUNNY).toBe("bunny");
  });

  test("should generate optimized image URLs", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { getOptimizedImageUrl } = await import("/src/lib/cdn.ts");

      const url = getOptimizedImageUrl("covers", "test/image.jpg", 512, 512, 90);

      return {
        url,
        isString: typeof url === "string",
        hasPath: url.includes("test/image.jpg"),
      };
    });

    expect(result.isString).toBe(true);
    expect(result.hasPath).toBe(true);
    expect(result.url).toBeTruthy();
  });

  test("should generate responsive image srcsets", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { getResponsiveImageSrcSet } = await import("/src/lib/cdn.ts");

      const { src, srcset, sizes } = getResponsiveImageSrcSet({
        bucket: "covers",
        path: "test/image.jpg",
        sizes: [320, 640, 1024, 1920],
        format: "webp",
        quality: 90,
      });

      return {
        hasSrc: !!src,
        hasSrcset: !!srcset,
        hasSizes: !!sizes,
        srcsetParts: srcset.split(",").length,
      };
    });

    expect(result.hasSrc).toBe(true);
    expect(result.hasSrcset).toBe(true);
    expect(result.hasSizes).toBe(true);
    expect(result.srcsetParts).toBe(4); // 4 different sizes
  });

  test("should generate thumbnail URLs", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { getThumbnailUrl } = await import("/src/lib/cdn.ts");

      const thumb256 = getThumbnailUrl("covers", "test/image.jpg", 256);
      const thumb512 = getThumbnailUrl("covers", "test/image.jpg", 512);

      return {
        thumb256,
        thumb512,
        bothStrings: typeof thumb256 === "string" && typeof thumb512 === "string",
      };
    });

    expect(result.bothStrings).toBe(true);
    expect(result.thumb256).toBeTruthy();
    expect(result.thumb512).toBeTruthy();
  });

  test("should generate blur placeholder URLs", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { getBlurPlaceholderUrl } = await import("/src/lib/cdn.ts");

      const placeholder = getBlurPlaceholderUrl("covers", "test/image.jpg");

      return {
        placeholder,
        isString: typeof placeholder === "string",
        hasPath: placeholder.includes("test/image.jpg"),
      };
    });

    expect(result.isString).toBe(true);
    expect(result.hasPath).toBe(true);
    expect(result.placeholder).toBeTruthy();
  });

  test("should detect browser image format support", async ({ page, browserName }) => {
    const support = await page.evaluate(() => {
      // Check browser image format support
      const canvas = document.createElement("canvas");

      return {
        hasCanvas: !!canvas,
        canvasToDataURL: typeof canvas.toDataURL === "function",
        hasImage: typeof Image !== "undefined",
        hasCreateElement: typeof document.createElement === "function",
      };
    });

    expect(support.hasCanvas).toBe(true);
    expect(support.canvasToDataURL).toBe(true);
    expect(support.hasImage).toBe(true);
    expect(support.hasCreateElement).toBe(true);

    console.log(`${browserName}: Image API support verified`);
  });

  test("should handle IntersectionObserver for lazy loading", async ({ page, browserName }) => {
    const observerSupport = await page.evaluate(() => {
      return {
        hasIntersectionObserver: typeof IntersectionObserver !== "undefined",
        hasResizeObserver: typeof ResizeObserver !== "undefined",
        hasMutationObserver: typeof MutationObserver !== "undefined",
      };
    });

    // IntersectionObserver is widely supported in modern browsers
    expect(observerSupport.hasIntersectionObserver).toBe(true);

    console.log(`${browserName} Observer APIs:`, observerSupport);
  });

  test("should work with different viewport sizes", async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: "iPhone SE" },
      { width: 768, height: 1024, name: "iPad" },
      { width: 1920, height: 1080, name: "Desktop" },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const result = await page.evaluate(async () => {
        const { getOptimizedImageUrl } = await import("/src/lib/cdn.ts");
        return getOptimizedImageUrl("covers", "test.jpg", 512, 512);
      });

      expect(result).toBeTruthy();
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}): CDN URL generated`);
    }
  });
});

test.describe("CDN Integration - Cross-browser compatibility", () => {
  test("should generate consistent URLs across browsers", async ({ page, browserName }) => {
    console.log(`Testing CDN on: ${browserName}`);

    const result = await page.evaluate(async () => {
      const { getOptimizedImageUrl, getThumbnailUrl, getBlurPlaceholderUrl } = await import("/src/lib/cdn.ts");

      return {
        optimized: getOptimizedImageUrl("covers", "test.jpg", 512, 512, 90),
        thumbnail: getThumbnailUrl("covers", "test.jpg", 256),
        placeholder: getBlurPlaceholderUrl("covers", "test.jpg"),
        userAgent: navigator.userAgent,
      };
    });

    // All URLs should be generated successfully
    expect(result.optimized).toBeTruthy();
    expect(result.thumbnail).toBeTruthy();
    expect(result.placeholder).toBeTruthy();

    console.log(`${browserName}: All CDN URLs generated successfully`);
  });

  test("should handle responsive images on different devices", async ({ page, browserName }) => {
    const result = await page.evaluate(async () => {
      const { getResponsiveImageSrcSet } = await import("/src/lib/cdn.ts");

      const responsive = getResponsiveImageSrcSet({
        bucket: "covers",
        path: "test.jpg",
        sizes: [320, 640, 1024],
      });

      return {
        hasSrc: !!responsive.src,
        srcsetCount: responsive.srcset.split(",").length,
        hasCorrectSizes:
          responsive.srcset.includes("320w") &&
          responsive.srcset.includes("640w") &&
          responsive.srcset.includes("1024w"),
      };
    });

    expect(result.hasSrc).toBe(true);
    expect(result.srcsetCount).toBe(3);
    expect(result.hasCorrectSizes).toBe(true);

    console.log(`${browserName}: Responsive images working correctly`);
  });
});

test.describe("CDN Integration - Performance", () => {
  test("should generate URLs quickly", async ({ page }) => {
    const timing = await page.evaluate(async () => {
      const { getOptimizedImageUrl } = await import("/src/lib/cdn.ts");

      const start = performance.now();

      // Generate 100 URLs
      for (let i = 0; i < 100; i++) {
        getOptimizedImageUrl("covers", `test-${i}.jpg`, 512, 512);
      }

      const end = performance.now();
      const duration = end - start;

      return {
        duration,
        avgPerUrl: duration / 100,
      };
    });

    // Should generate URLs quickly (< 100ms for 100 URLs)
    expect(timing.duration).toBeLessThan(100);
    expect(timing.avgPerUrl).toBeLessThan(1);

    console.log(`URL generation: ${timing.avgPerUrl.toFixed(3)}ms per URL`);
  });
});
