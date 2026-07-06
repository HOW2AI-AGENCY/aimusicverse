/**
 * Unit tests for shortcuts.api.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { getShortcuts, resetShortcuts, DEFAULT_SHORTCUTS } from "@/api/shortcuts.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

function createChainMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["select", "insert", "update", "delete", "eq", "maybeSingle", "single"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn((resolve) => resolve(finalResult));
  return chain;
}

describe("shortcuts.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DEFAULT_SHORTCUTS", () => {
    it("has all four categories", () => {
      expect(DEFAULT_SHORTCUTS.studio).toBeDefined();
      expect(DEFAULT_SHORTCUTS.lyrics).toBeDefined();
      expect(DEFAULT_SHORTCUTS.mixer).toBeDefined();
      expect(DEFAULT_SHORTCUTS.general).toBeDefined();
    });

    it("has play_pause in studio", () => {
      expect(DEFAULT_SHORTCUTS.studio?.play_pause.key).toBe(" ");
    });
  });

  describe("getShortcuts", () => {
    it("returns stored shortcuts when present", async () => {
      const chain = createChainMock({
        data: { keyboard_shortcuts: DEFAULT_SHORTCUTS },
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await getShortcuts("user-1");

      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(result.shortcuts.studio).toBeDefined();
    });

    it("throws on database error", async () => {
      const chain = createChainMock({ data: null, error: { message: "DB fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(getShortcuts("user-1")).rejects.toThrow("Failed to fetch shortcuts");
    });
  });

  describe("resetShortcuts", () => {
    it("resets shortcuts to defaults", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await resetShortcuts("user-1");

      expect(result.shortcuts).toBeDefined();
    });

    it("throws on error", async () => {
      const chain = createChainMock({ data: null, error: { message: "fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(resetShortcuts("user-1")).rejects.toThrow();
    });
  });
});
