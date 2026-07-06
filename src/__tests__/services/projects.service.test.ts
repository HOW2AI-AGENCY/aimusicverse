/**
 * Unit tests for projects.service.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { PROJECT_TYPES, IMAGE_STYLES, updateVisualStyle } from "@/services/projects.service";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

function createChainMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["select", "insert", "update", "delete", "eq", "in", "order", "limit", "single", "maybeSingle"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn((resolve) => resolve(finalResult));
  return chain;
}

describe("projects.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PROJECT_TYPES", () => {
    it("has album, single, ep, mixtape types", () => {
      expect(PROJECT_TYPES.album).toBeDefined();
      expect(PROJECT_TYPES.single).toBeDefined();
      expect(PROJECT_TYPES.ep).toBeDefined();
      expect(PROJECT_TYPES.mixtape).toBeDefined();
    });

    it("each type has label and description", () => {
      for (const value of Object.values(PROJECT_TYPES)) {
        expect(value.label).toBeTruthy();
        expect(value.description).toBeTruthy();
      }
    });
  });

  describe("IMAGE_STYLES", () => {
    it("has multiple styles", () => {
      expect(Object.keys(IMAGE_STYLES).length).toBeGreaterThan(0);
    });

    it("each style has label and description", () => {
      for (const value of Object.values(IMAGE_STYLES)) {
        expect(value.label).toBeTruthy();
        expect(value.description).toBeTruthy();
      }
    });
  });

  describe("updateVisualStyle", () => {
    it("updates visual style", async () => {
      const chain = createChainMock({
        data: { id: "p1", visual_style: { imageStyle: "photo" } },
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await updateVisualStyle("p1", { imageStyle: "photo" });

      expect(result.id).toBe("p1");
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(updateVisualStyle("p1", { imageStyle: "photo" })).rejects.toThrow();
    });
  });
});
