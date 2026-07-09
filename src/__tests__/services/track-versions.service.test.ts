/**
 * Unit tests for generation/track-versions.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi } from "vitest";
import * as tracksApi from "@/api/tracks.api";

vi.mock("@/api/tracks.api", () => ({
  fetchTrackVersions: vi.fn(),
  fetchTrackVersionsDetailed: vi.fn(),
}));

import {
  getTrackVersions,
  getTrackVersionsForSwitcher,
  getTrackVersionsForUnifiedSelector,
  mapTrackVersion,
} from "@/services/generation/track-versions.service";

describe("generation/track-versions.service", () => {
  describe("mapTrackVersion", () => {
    it("maps full TrackVersionRow to TrackVersion", () => {
      const row = {
        id: "v1",
        version_label: "B",
        audio_url: "https://cdn.example.com/a.mp3",
        duration_seconds: 180,
        is_primary: true,
      } as never;

      const result = mapTrackVersion(row);

      expect(result.id).toBe("v1");
      expect(result.label).toBe("B");
      expect(result.audioUrl).toBe("https://cdn.example.com/a.mp3");
      expect(result.duration).toBe(180);
      expect(result.isPrimary).toBe(true);
    });

    it("defaults label to A when version_label missing", () => {
      const row = { id: "v2", audio_url: "https://cdn.example.com/b.mp3", is_primary: false } as never;

      const result = mapTrackVersion(row);

      expect(result.label).toBe("A");
    });

    it("sets isPrimary to false when is_primary is null", () => {
      const row = {
        id: "v3",
        version_label: "A",
        audio_url: "https://cdn.example.com/c.mp3",
        is_primary: null,
      } as never;

      const result = mapTrackVersion(row);

      expect(result.isPrimary).toBe(false);
    });
  });

  describe("getTrackVersions", () => {
    it("delegates to fetchTrackVersions and maps results", async () => {
      const rows = [
        {
          id: "v1",
          version_label: "A",
          audio_url: "https://cdn.example.com/a.mp3",
          duration_seconds: null,
          is_primary: true,
        },
        {
          id: "v2",
          version_label: "B",
          audio_url: "https://cdn.example.com/b.mp3",
          duration_seconds: 200,
          is_primary: false,
        },
      ] as never[];
      vi.mocked(tracksApi.fetchTrackVersions).mockResolvedValue(rows);

      const result = await getTrackVersions("track-1");

      expect(tracksApi.fetchTrackVersions).toHaveBeenCalledWith("track-1");
      expect(result).toHaveLength(2);
      expect(result[0].label).toBe("A");
      expect(result[1].label).toBe("B");
      expect(result[1].duration).toBe(200);
    });
  });

  describe("getTrackVersionsForSwitcher", () => {
    it("delegates to fetchTrackVersionsDetailed and maps rows", async () => {
      const rows = [
        {
          id: "v1",
          audio_url: "https://cdn.example.com/a.mp3",
          cover_url: "https://cdn.example.com/c.jpg",
          version_label: "A",
          clip_index: 0,
          is_primary: true,
        },
        {
          id: "v2",
          audio_url: "https://cdn.example.com/b.mp3",
          cover_url: null,
          version_label: "B",
          clip_index: 1,
          is_primary: false,
        },
      ] as never[];
      vi.mocked(tracksApi.fetchTrackVersionsDetailed).mockResolvedValue(rows);

      const result = await getTrackVersionsForSwitcher("track-1");

      expect(tracksApi.fetchTrackVersionsDetailed).toHaveBeenCalledWith("track-1");
      expect(result[0].id).toBe("v1");
      expect(result[0].version_label).toBe("A");
      expect(result[1].cover_url).toBeNull();
    });
  });

  describe("getTrackVersionsForUnifiedSelector", () => {
    it("delegates to fetchTrackVersionsDetailed and maps to unified selector shape", async () => {
      const rows = [
        {
          id: "v1",
          version_label: "A",
          audio_url: "https://cdn.example.com/a.mp3",
          cover_url: "https://cdn.example.com/c.jpg",
          duration_seconds: 180,
          is_primary: true,
          version_type: "full",
          created_at: "2026-01-01",
        },
      ] as never[];
      vi.mocked(tracksApi.fetchTrackVersionsDetailed).mockResolvedValue(rows);

      const result = await getTrackVersionsForUnifiedSelector("track-1");

      expect(result[0]).toMatchObject({
        id: "v1",
        version_label: "A",
        duration_seconds: 180,
        is_primary: true,
        version_type: "full",
      });
    });
  });
});
