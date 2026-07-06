/**
 * Unit tests for smart-alerts.service.ts
 * Sprint 040 — Service Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkProjectsCount, checkTracksCount, checkArtistsCount } from "@/services/smart-alerts.service";
import * as projectsApi from "@/api/projects.api";
import * as tracksApi from "@/api/tracks.api";
import * as artistsApi from "@/api/artists.api";

vi.mock("@/api/projects.api", () => ({ countUserProjects: vi.fn() }));
vi.mock("@/api/tracks.api", () => ({ countUserTracks: vi.fn() }));
vi.mock("@/api/artists.api", () => ({ countUserArtists: vi.fn() }));

const mockCountProjects = projectsApi.countUserProjects as unknown as ReturnType<typeof vi.fn>;
const mockCountTracks = tracksApi.countUserTracks as unknown as ReturnType<typeof vi.fn>;
const mockCountArtists = artistsApi.countUserArtists as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe("smart-alerts.service", () => {
  describe("checkProjectsCount", () => {
    it("returns project count", async () => {
      mockCountProjects.mockResolvedValue(5);
      expect(await checkProjectsCount("u1")).toBe(5);
    });

    it("returns 0 on error", async () => {
      mockCountProjects.mockRejectedValue(new Error("fail"));
      expect(await checkProjectsCount("u1")).toBe(0);
    });
  });

  describe("checkTracksCount", () => {
    it("returns track count", async () => {
      mockCountTracks.mockResolvedValue(12);
      expect(await checkTracksCount("u1")).toBe(12);
    });

    it("returns 0 on error", async () => {
      mockCountTracks.mockRejectedValue(new Error("fail"));
      expect(await checkTracksCount("u1")).toBe(0);
    });
  });

  describe("checkArtistsCount", () => {
    it("returns artist count", async () => {
      mockCountArtists.mockResolvedValue(3);
      expect(await checkArtistsCount("u1")).toBe(3);
    });

    it("returns 0 on error", async () => {
      mockCountArtists.mockRejectedValue(new Error("fail"));
      expect(await checkArtistsCount("u1")).toBe(0);
    });
  });
});
