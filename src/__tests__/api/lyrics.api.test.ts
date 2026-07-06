/**
 * Unit tests for lyrics.api.ts
 * Sprint 040 — Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  getLyricVersions,
  createLyricVersion,
  restoreLyricVersion,
  getSectionNotes,
  createSectionNote,
  updateSectionNote,
  deleteSectionNote,
  getLyricVersionsBatch,
  invokeLyricsAssistant,
} from "@/api/lyrics.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockFunctionsInvoke = supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>;

function createChainMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["select", "insert", "update", "delete", "eq", "in", "order", "limit", "single"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn((resolve) => resolve(finalResult));
  return chain;
}

const mockVersion = {
  id: "v1",
  version_number: 1,
  lyrics: "[Verse]\nHello world",
  is_current: true,
  created_at: "2026-07-06T00:00:00Z",
  change_description: "Initial",
  version_name: "v1",
  change_type: "manual_edit",
  sections_data: null,
  tags: ["rock"],
  ai_model_used: null,
  ai_prompt_used: null,
  project_track_id: "track-1",
  user_id: "user-1",
  profiles: { id: "user-1", username: "testuser" },
};

const mockNote = {
  id: "n1",
  notes: "Add harmony here",
  section_type: "production",
  created_at: "2026-07-06T00:00:00Z",
  section_id: "section-1",
  position: 0,
  tags: null,
  audio_note_url: null,
  reference_audio_url: null,
  reference_analysis: null,
  profiles: { id: "user-1", username: "testuser" },
};

describe("lyrics.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLyricVersions", () => {
    it("fetches versions with author profiles", async () => {
      const chain = createChainMock({ data: [mockVersion], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getLyricVersions("track-1");

      expect(mockFrom).toHaveBeenCalledWith("lyrics_versions");
      expect(result.versions).toHaveLength(1);
      expect(result.versions[0].id).toBe("v1");
      expect(result.versions[0].author.username).toBe("testuser");
      expect(result.versions[0].content).toBe("[Verse]\nHello world");
    });

    it("returns empty array when no versions exist", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getLyricVersions("track-1");
      expect(result.versions).toEqual([]);
    });

    it("throws on database error", async () => {
      const chain = createChainMock({ data: null, error: { message: "DB error" } });
      mockFrom.mockReturnValue(chain);

      await expect(getLyricVersions("track-1")).rejects.toThrow("Failed to fetch lyric versions");
    });
  });

  describe("createLyricVersion", () => {
    it("creates a new version with correct version number", async () => {
      // First call: fetch existing versions
      const fetchChain = createChainMock({ data: [{ version_number: 2 }], error: null });
      // Second call: update is_current=false
      const updateChain = createChainMock({ data: null, error: null });
      // Third call: insert new version
      const insertChain = createChainMock({ data: mockVersion, error: null });

      mockFrom.mockReturnValueOnce(fetchChain).mockReturnValueOnce(updateChain).mockReturnValueOnce(insertChain);

      const result = await createLyricVersion("track-1", "user-1", {
        content: "New lyrics",
        changeType: "manual_edit",
      });

      expect(result.versionNumber).toBe(1);
      expect(result.isCurrent).toBe(true);
    });

    it("throws on fetch error", async () => {
      const chain = createChainMock({ data: null, error: { message: "Fetch fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(createLyricVersion("track-1", "user-1", { content: "x", changeType: "edit" })).rejects.toThrow(
        "Failed to fetch existing versions",
      );
    });
  });

  describe("restoreLyricVersion", () => {
    it("restores a version and creates new entry", async () => {
      const fetchVersionChain = createChainMock({ data: mockVersion, error: null });
      const fetchExistingChain = createChainMock({ data: [{ version_number: 3 }], error: null });
      const updateChain = createChainMock({ data: null, error: null });
      const insertChain = createChainMock({
        data: { ...mockVersion, version_number: 4, change_type: "restore" },
        error: null,
      });

      mockFrom
        .mockReturnValueOnce(fetchVersionChain)
        .mockReturnValueOnce(fetchExistingChain)
        .mockReturnValueOnce(updateChain)
        .mockReturnValueOnce(insertChain);

      const result = await restoreLyricVersion("v1");

      expect(result.success).toBe(true);
      expect(result.restoredVersion.versionNumber).toBe(4);
    });

    it("throws when version not found", async () => {
      const chain = createChainMock({ data: null, error: { message: "Not found" } });
      mockFrom.mockReturnValue(chain);

      await expect(restoreLyricVersion("v1")).rejects.toThrow("Failed to fetch version to restore");
    });
  });

  describe("getSectionNotes", () => {
    it("fetches notes with author profiles", async () => {
      const chain = createChainMock({ data: [mockNote], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getSectionNotes("section-1");

      expect(mockFrom).toHaveBeenCalledWith("lyrics_section_notes");
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].content).toBe("Add harmony here");
      expect(result.notes[0].author.username).toBe("testuser");
    });

    it("returns empty array when no notes exist", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getSectionNotes("section-1");
      expect(result.notes).toEqual([]);
    });

    it("throws on database error", async () => {
      const chain = createChainMock({ data: null, error: { message: "DB error" } });
      mockFrom.mockReturnValue(chain);

      await expect(getSectionNotes("section-1")).rejects.toThrow("Failed to fetch section notes");
    });
  });

  describe("createSectionNote", () => {
    it("creates a note with correct fields", async () => {
      const chain = createChainMock({ data: mockNote, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await createSectionNote("section-1", "user-1", {
        content: "Add harmony here",
        noteType: "production",
      });

      expect(result.id).toBe("n1");
      expect(result.content).toBe("Add harmony here");
      expect(result.sectionId).toBe("section-1");
    });

    it("throws on database error", async () => {
      const chain = createChainMock({ data: null, error: { message: "Insert fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(createSectionNote("section-1", "user-1", { content: "x", noteType: "general" })).rejects.toThrow(
        "Failed to create section note",
      );
    });
  });

  describe("updateSectionNote", () => {
    it("updates note content", async () => {
      const chain = createChainMock({ data: { ...mockNote, notes: "Updated" }, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await updateSectionNote("n1", { content: "Updated" });

      expect(result.notes).toBe("Updated");
    });

    it("throws on database error", async () => {
      const chain = createChainMock({ data: null, error: { message: "Update fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(updateSectionNote("n1", { content: "x" })).rejects.toThrow("Failed to update section note");
    });
  });

  describe("deleteSectionNote", () => {
    it("deletes a note by id", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await expect(deleteSectionNote("n1")).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith("lyrics_section_notes");
    });

    it("throws on database error", async () => {
      const chain = createChainMock({ data: null, error: { message: "Delete fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(deleteSectionNote("n1")).rejects.toThrow("Failed to delete section note");
    });
  });

  describe("getLyricVersionsBatch", () => {
    it("returns empty object for empty input", async () => {
      const result = await getLyricVersionsBatch([]);
      expect(result).toEqual({});
    });

    it("groups versions by track id", async () => {
      const chain = createChainMock({
        data: [
          { ...mockVersion, project_track_id: "track-1" },
          { ...mockVersion, id: "v2", project_track_id: "track-2" },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await getLyricVersionsBatch(["track-1", "track-2"]);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result["track-1"]).toHaveLength(1);
      expect(result["track-2"]).toHaveLength(1);
    });

    it("throws on database error", async () => {
      const chain = createChainMock({ data: null, error: { message: "Batch fail" } });
      mockFrom.mockReturnValue(chain);

      await expect(getLyricVersionsBatch(["track-1"])).rejects.toThrow("Failed to fetch lyric versions batch");
    });
  });

  describe("invokeLyricsAssistant", () => {
    it("invokes edge function and returns data", async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: { lyrics: "Generated lyrics" },
        error: null,
      });

      const result = await invokeLyricsAssistant({ action: "generate", genre: "rock" });

      expect(mockFunctionsInvoke).toHaveBeenCalledWith("ai-lyrics-assistant", {
        body: { action: "generate", genre: "rock" },
      });
      expect(result.data?.lyrics).toBe("Generated lyrics");
      expect(result.error).toBeNull();
    });

    it("returns error when edge function fails", async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: new Error("Edge function failed"),
      });

      const result = await invokeLyricsAssistant({ action: "generate" });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });
});
