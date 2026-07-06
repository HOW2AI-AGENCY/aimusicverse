/**
 * Unit tests for tracks.service.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { updateTrackVisibility } from "@/services/tracks.service";

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

describe("tracks.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateTrackVisibility", () => {
    it("updates track visibility to public", async () => {
      const chain = createChainMock({
        data: { id: "t1", is_public: true },
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await updateTrackVisibility("t1", true);

      expect(result.is_public).toBe(true);
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(updateTrackVisibility("t1", true)).rejects.toThrow();
    });
  });
});
