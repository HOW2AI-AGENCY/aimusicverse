/**
 * Unit tests for midi.api.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { getMidiMetadata, deleteMidiFile } from "@/api/midi.api";

const mockFunctionsInvoke = supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>;

describe("midi.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMidiMetadata", () => {
    it("returns error for empty midiId", async () => {
      const result = await getMidiMetadata("");
      expect(result.success).toBe(false);
      expect(result.error).toBe("MIDI ID is required");
    });

    it("fetches metadata via edge function", async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: { success: true, metadata: { id: "m1", fileName: "test.mid" } },
        error: null,
      });

      const result = await getMidiMetadata("m1");

      expect(mockFunctionsInvoke).toHaveBeenCalledWith("midi-get-metadata", { body: { midiId: "m1" } });
      expect(result.success).toBe(true);
    });

    it("returns error when edge function fails", async () => {
      mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "Edge fail" } });

      const result = await getMidiMetadata("m1");

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("deleteMidiFile", () => {
    it("deletes midi file via edge function", async () => {
      mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });

      const result = await deleteMidiFile("m1");

      expect(result.success).toBe(true);
    });

    it("returns error when edge function fails", async () => {
      mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: "fail" } });

      const result = await deleteMidiFile("m1");

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
