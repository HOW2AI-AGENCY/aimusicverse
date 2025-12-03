/**
 * Browser Tests for Storage Infrastructure
 *
 * Tests storage helper functions across multiple browsers:
 * - Chrome, Firefox, Safari (WebKit)
 * - Mobile Chrome, Mobile Safari
 * - Edge
 *
 * Coverage:
 * - Upload file functionality
 * - Storage quota checking
 * - File deletion
 * - Error handling
 */

import { test, expect } from "@playwright/test";

test.describe("Storage Infrastructure", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for app to be ready
    await page.waitForLoadState("networkidle");
  });

  test("should load storage helper module without errors", async ({ page }) => {
    // Check that storage module loads correctly
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Try to import storage module
    const result = await page.evaluate(async () => {
      try {
        // Check if storage functions are available
        const storageModule = await import("/src/lib/storage.ts");
        return {
          success: true,
          hasUploadFile: typeof storageModule.uploadFile === "function",
          hasDeleteFile: typeof storageModule.deleteFile === "function",
          hasCheckStorageQuota: typeof storageModule.checkStorageQuota === "function",
          hasGetStorageUsage: typeof storageModule.getStorageUsage === "function",
          hasFormatBytes: typeof storageModule.formatBytes === "function",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    expect(result.success).toBe(true);
    expect(result.hasUploadFile).toBe(true);
    expect(result.hasDeleteFile).toBe(true);
    expect(result.hasCheckStorageQuota).toBe(true);
    expect(result.hasGetStorageUsage).toBe(true);
    expect(result.hasFormatBytes).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test("should format bytes correctly across browsers", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { formatBytes } = await import("/src/lib/storage.ts");

      return {
        zeroBytes: formatBytes(0),
        kilobyte: formatBytes(1024),
        megabyte: formatBytes(1048576),
        gigabyte: formatBytes(1073741824),
        decimalPlaces: formatBytes(1536, 2), // 1.5 KB
      };
    });

    expect(result.zeroBytes).toBe("0 Bytes");
    expect(result.kilobyte).toBe("1 KB");
    expect(result.megabyte).toBe("1 MB");
    expect(result.gigabyte).toBe("1 GB");
    expect(result.decimalPlaces).toBe("1.5 KB");
  });

  test("should validate storage buckets configuration", async ({ page }) => {
    const buckets = await page.evaluate(async () => {
      const { STORAGE_BUCKETS } = await import("/src/lib/storage.ts");
      return STORAGE_BUCKETS;
    });

    // Verify all required buckets exist
    expect(buckets).toHaveProperty("TRACKS");
    expect(buckets).toHaveProperty("COVERS");
    expect(buckets).toHaveProperty("STEMS");
    expect(buckets).toHaveProperty("UPLOADS");
    expect(buckets).toHaveProperty("AVATARS");
    expect(buckets).toHaveProperty("BANNERS");
    expect(buckets).toHaveProperty("TEMP");

    // Verify bucket names are correct
    expect(buckets.TRACKS).toBe("tracks");
    expect(buckets.COVERS).toBe("covers");
    expect(buckets.STEMS).toBe("stems");
    expect(buckets.UPLOADS).toBe("uploads");
    expect(buckets.AVATARS).toBe("avatars");
    expect(buckets.BANNERS).toBe("banners");
    expect(buckets.TEMP).toBe("temp");
  });

  test("should handle File API correctly across browsers", async ({ page, browserName }) => {
    // Test File API compatibility
    const fileApiSupport = await page.evaluate(() => {
      return {
        hasFile: typeof File !== "undefined",
        hasBlob: typeof Blob !== "undefined",
        hasFileReader: typeof FileReader !== "undefined",
        hasFormData: typeof FormData !== "undefined",
      };
    });

    expect(fileApiSupport.hasFile).toBe(true);
    expect(fileApiSupport.hasBlob).toBe(true);
    expect(fileApiSupport.hasFileReader).toBe(true);
    expect(fileApiSupport.hasFormData).toBe(true);
  });

  test("should detect storage quota API support", async ({ page }) => {
    const quotaSupport = await page.evaluate(() => {
      return {
        hasNavigatorStorage: "storage" in navigator,
        hasEstimate: "storage" in navigator && "estimate" in navigator.storage,
      };
    });

    // Note: Some browsers may not support Storage API
    // This test documents browser capabilities
    console.log("Storage API support:", quotaSupport);
  });

  test("should handle upload errors gracefully", async ({ page }) => {
    // Mock scenario: upload without authentication
    const result = await page.evaluate(async () => {
      const { uploadFile, STORAGE_BUCKETS } = await import("/src/lib/storage.ts");

      // Create a test file
      const testFile = new File(["test content"], "test.txt", { type: "text/plain" });

      try {
        const uploadResult = await uploadFile({
          bucket: STORAGE_BUCKETS.TEMP,
          file: testFile,
          path: "test/test.txt",
          entityType: "temp",
        });

        return {
          success: uploadResult.success,
          hasError: !!uploadResult.error,
          errorMessage: uploadResult.error,
        };
      } catch (error) {
        return {
          success: false,
          hasError: true,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    // Should fail gracefully due to no authentication
    expect(result.success).toBe(false);
    expect(result.hasError).toBe(true);
    expect(result.errorMessage).toBeTruthy();
  });

  test("should work consistently across viewport sizes", async ({ page, browserName }) => {
    const viewports = [
      { width: 375, height: 667 }, // iPhone SE
      { width: 768, height: 1024 }, // iPad
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      // Test that storage module still works after viewport change
      const result = await page.evaluate(async () => {
        const { formatBytes } = await import("/src/lib/storage.ts");
        return formatBytes(1048576);
      });

      expect(result).toBe("1 MB");
    }
  });
});

test.describe("Storage Infrastructure - Cross-browser compatibility", () => {
  test("should have consistent behavior across all browsers", async ({ page, browserName }) => {
    console.log(`Testing on: ${browserName}`);

    const result = await page.evaluate(async () => {
      const { STORAGE_BUCKETS, formatBytes } = await import("/src/lib/storage.ts");

      return {
        browser: navigator.userAgent,
        buckets: Object.keys(STORAGE_BUCKETS),
        formatTest: formatBytes(5242880), // 5MB
      };
    });

    // Should work identically across all browsers
    expect(result.buckets).toHaveLength(7);
    expect(result.formatTest).toBe("5 MB");

    console.log(`Browser: ${browserName}`);
    console.log(`Buckets available: ${result.buckets.length}`);
  });
});
