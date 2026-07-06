/**
 * Unit tests for presets.api.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { getPresetById } from "@/api/presets.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

function createChainMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "in",
    "order",
    "limit",
    "single",
    "maybeSingle",
    "upsert",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn((resolve) => resolve(finalResult));
  return chain;
}

describe("presets.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPresetById", () => {
    it("fetches preset by id", async () => {
      const chain = createChainMock({
        data: {
          id: "p1",
          name: "Rock",
          style_prompt: "Rock",
          genre: "rock",
          mood: "energetic",
          tags: ["rock"],
          is_public: true,
          is_system: false,
          usage_count: 10,
        },
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await getPresetById("p1");

      expect(result.data?.id).toBe("p1");
      expect(result.error).toBeNull();
    });

    it("returns null data on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "not found" } });
      mockFrom.mockReturnValue(chain);

      const result = await getPresetById("p1");

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });
});
