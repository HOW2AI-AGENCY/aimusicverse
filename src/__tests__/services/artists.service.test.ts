/**
 * Unit tests for artists.service.ts
 * Sprint 040 — Service Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createArtistWithPortrait,
  updateArtistPortrait,
  generateArtistPortraitForPreview,
  getArtistStats,
  searchArtists,
} from "@/services/artists.service";
import * as artistsApi from "@/api/artists.api";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/api/artists.api", () => ({
  createArtist: vi.fn(),
  updateArtist: vi.fn(),
  generateArtistPortrait: vi.fn(),
  fetchPublicArtists: vi.fn(),
}));

const mockCreateArtist = artistsApi.createArtist as unknown as ReturnType<typeof vi.fn>;
const mockUpdateArtist = artistsApi.updateArtist as unknown as ReturnType<typeof vi.fn>;
const mockGeneratePortrait = artistsApi.generateArtistPortrait as unknown as ReturnType<typeof vi.fn>;
const mockFetchPublic = artistsApi.fetchPublicArtists as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe("artists.service", () => {
  describe("createArtistWithPortrait", () => {
    it("creates artist without portrait", async () => {
      const artist = { id: "a1", name: "DJ Bot", user_id: "u1" };
      mockCreateArtist.mockResolvedValue(artist);
      const res = await createArtistWithPortrait("u1", "DJ Bot");
      expect(res).toEqual(artist);
      expect(mockCreateArtist).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "u1",
          name: "DJ Bot",
          is_ai_generated: true,
          avatar_url: null,
        }),
      );
      expect(mockGeneratePortrait).not.toHaveBeenCalled();
    });

    it("creates artist with portrait generation", async () => {
      const artist = { id: "a1", name: "DJ Bot" };
      mockGeneratePortrait.mockResolvedValue({ imageUrl: "portrait.png" });
      mockCreateArtist.mockResolvedValue(artist);
      const res = await createArtistWithPortrait("u1", "DJ Bot", { generatePortrait: true });
      expect(mockGeneratePortrait).toHaveBeenCalledWith("DJ Bot", undefined);
      expect(mockCreateArtist).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: "portrait.png" }));
    });

    it("continues without portrait on generation failure", async () => {
      const artist = { id: "a1", name: "DJ Bot" };
      mockGeneratePortrait.mockRejectedValue(new Error("gen failed"));
      mockCreateArtist.mockResolvedValue(artist);
      const res = await createArtistWithPortrait("u1", "DJ Bot", { generatePortrait: true });
      expect(mockCreateArtist).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: null }));
      expect(res).toEqual(artist);
    });

    it("passes all options to createArtist", async () => {
      mockCreateArtist.mockResolvedValue({ id: "a1" });
      await createArtistWithPortrait("u1", "Bot", {
        bio: "AI musician",
        styleDescription: "electronic",
        genreTags: ["edm"],
        moodTags: ["energetic"],
        isPublic: false,
      });
      expect(mockCreateArtist).toHaveBeenCalledWith(
        expect.objectContaining({
          bio: "AI musician",
          style_description: "electronic",
          genre_tags: ["edm"],
          mood_tags: ["energetic"],
          is_public: false,
        }),
      );
    });
  });

  describe("updateArtistPortrait", () => {
    it("generates portrait and updates artist", async () => {
      mockGeneratePortrait.mockResolvedValue({ imageUrl: "new-portrait.png" });
      mockUpdateArtist.mockResolvedValue({ id: "a1", avatar_url: "new-portrait.png" });
      const res = await updateArtistPortrait("a1", "DJ Bot", "cyberpunk");
      expect(mockGeneratePortrait).toHaveBeenCalledWith("DJ Bot", "cyberpunk");
      expect(mockUpdateArtist).toHaveBeenCalledWith("a1", { avatar_url: "new-portrait.png" });
    });
  });

  describe("generateArtistPortraitForPreview", () => {
    it("returns image URL", async () => {
      mockGeneratePortrait.mockResolvedValue({ imageUrl: "preview.png" });
      const url = await generateArtistPortraitForPreview("Bot", "style", "ref.png");
      expect(url).toBe("preview.png");
    });

    it("throws on error", async () => {
      mockGeneratePortrait.mockRejectedValue(new Error("fail"));
      await expect(generateArtistPortraitForPreview("Bot")).rejects.toThrow("fail");
    });
  });

  describe("getArtistStats", () => {
    it("returns placeholder stats", async () => {
      const stats = await getArtistStats("a1");
      expect(stats).toEqual({ trackCount: 0, totalPlays: 0, totalLikes: 0 });
    });
  });

  describe("searchArtists", () => {
    it("searches public artists by name", async () => {
      mockFetchPublic.mockResolvedValue([
        { id: "a1", name: "DJ Bot", style_description: "electronic" },
        { id: "a2", name: "Rock Star", style_description: "rock" },
      ]);
      const res = await searchArtists("bot", { publicOnly: true });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe("DJ Bot");
    });

    it("searches by style description", async () => {
      mockFetchPublic.mockResolvedValue([
        { id: "a1", name: "Bot", style_description: "electronic music" },
        { id: "a2", name: "Star", style_description: "rock" },
      ]);
      const res = await searchArtists("electronic", { publicOnly: true });
      expect(res).toHaveLength(1);
    });

    it("returns empty for non-public search", async () => {
      const res = await searchArtists("bot");
      expect(res).toEqual([]);
    });
  });
});
