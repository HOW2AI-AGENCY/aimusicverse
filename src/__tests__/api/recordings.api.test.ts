/**
 * Unit tests for recordings.api.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { deleteReferenceAudio, listReferenceAudioForUser } from "@/api/recordings.api";

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

describe("recordings.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteReferenceAudio", () => {
    it("deletes reference audio", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await expect(deleteReferenceAudio("ra1")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(deleteReferenceAudio("ra1")).rejects.toThrow();
    });
  });

  describe("listReferenceAudioForUser", () => {
    it("lists reference audio for user", async () => {
      const chain = createChainMock({
        data: [
          { id: "ra1", file_name: "ref1.mp3" },
          { id: "ra2", file_name: "ref2.mp3" },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await listReferenceAudioForUser("u1");

      expect(result).toHaveLength(2);
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(listReferenceAudioForUser("u1")).rejects.toThrow();
    });
  });
});
