/**
 * Unit tests for analytics/content-analytics.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi } from "vitest";
import * as adminApi from "@/api/admin.api";

vi.mock("@/api/admin.api", () => ({
  fetchCompletedTracksForContentAnalytics: vi.fn(),
}));

import {
  ContentAnalyticsStats,
  timePeriodToStartDate,
  rollupContentAnalytics,
  getContentAnalytics,
} from "@/services/analytics/content-analytics.service";

describe("analytics/content-analytics.service", () => {
  describe("timePeriodToStartDate", () => {
    it("maps 24 hours to 1 day ago", () => {
      const d = timePeriodToStartDate("24 hours");
      expect(d.getTime()).toBeGreaterThan(Date.now() - 2 * 24 * 60 * 60 * 1000);
    });

    it("maps 7 days to 7 days ago", () => {
      const d = timePeriodToStartDate("7 days");
      expect(d.getTime()).toBeGreaterThan(Date.now() - 8 * 24 * 60 * 60 * 1000);
    });

    it("maps 30 days to 30 days ago", () => {
      const d = timePeriodToStartDate("30 days");
      expect(d.getTime()).toBeGreaterThan(Date.now() - 31 * 24 * 60 * 60 * 1000);
    });

    it("defaults to 90 days for unknown period", () => {
      const d = timePeriodToStartDate("all time");
      expect(d.getTime()).toBeGreaterThan(Date.now() - 91 * 24 * 60 * 60 * 1000);
    });
  });

  describe("rollupContentAnalytics", () => {
    const sampleTracks = [
      {
        id: "t1",
        computed_genre: "pop",
        computed_mood: "happy",
        style: "modern",
        lyrics_language: "en",
        tags: "guitar,drums",
        duration_seconds: 200,
        is_public: true,
        lyrics: "Hello world",
      },
      {
        id: "t2",
        computed_genre: "pop",
        computed_mood: "sad",
        style: "ballad",
        lyrics_language: "ru",
        tags: "piano",
        duration_seconds: 180,
        is_public: false,
        lyrics: "Goodbye",
      },
      {
        id: "t3",
        computed_genre: "rock",
        computed_mood: "happy",
        style: "classic",
        lyrics_language: "en",
        tags: "guitar,bass",
        duration_seconds: null,
        is_public: true,
        lyrics: "",
      },
    ] as never[];

    it("aggregates genres, moods, styles, languages correctly", () => {
      const result = rollupContentAnalytics(sampleTracks);

      expect(result.total_tracks).toBe(3);
      expect(result.public_tracks).toBe(2);
      expect(result.genres).toHaveLength(2);
      expect(result.genres.find((g) => g.name === "pop")?.count).toBe(2);
      expect(result.moods).toHaveLength(2);
      expect(result.styles).toHaveLength(3);
      expect(result.languages).toHaveLength(2);
    });

    it("calculates avg_duration skipping null durations", () => {
      const result = rollupContentAnalytics(sampleTracks);

      // total 380 / 3 rows = 126.67 (null duration counted as row)
      expect(result.avg_duration_sec).toBeCloseTo(126.67, 1);
    });

    it("returns 0 avg_duration for empty input", () => {
      const result = rollupContentAnalytics([]);

      expect(result.total_tracks).toBe(0);
      expect(result.avg_duration_sec).toBe(0);
    });

    it("parses comma-separated tags", () => {
      const result = rollupContentAnalytics(sampleTracks);

      const guitar = result.top_tags.find((t) => t.tag === "guitar");
      expect(guitar?.count).toBe(2);
    });

    it("computes instrumental/with_lyrics ratio", () => {
      const result = rollupContentAnalytics(sampleTracks);

      expect(result.instrumental_ratio).toBeCloseTo((1 / 3) * 100, 1);
      expect(result.with_lyrics_ratio).toBeCloseTo((2 / 3) * 100, 1);
    });
  });

  describe("getContentAnalytics", () => {
    it("fetches tracks and rolls them up", async () => {
      const rows = [
        { id: "t1", computed_genre: "pop", style: "modern", duration_seconds: 200, is_public: true, lyrics: "a" },
        { id: "t2", computed_genre: "rock", style: "classic", duration_seconds: 100, is_public: false, lyrics: null },
      ] as never[];
      vi.mocked(adminApi.fetchCompletedTracksForContentAnalytics).mockResolvedValue(rows);

      const result = await getContentAnalytics("7 days");

      expect(adminApi.fetchCompletedTracksForContentAnalytics).toHaveBeenCalledWith({
        startDate: expect.any(Date),
      });
      expect(result.total_tracks).toBe(2);
      expect(result.public_tracks).toBe(1);
    });
  });
});
