/**
 * Content Analytics Service
 * Aggregations over completed tracks powering the admin
 * analytics/ContentAnalyticsPanel dashboard.
 */

import * as adminApi from "@/api/admin.api";

export interface ContentAnalyticsStats {
  total_tracks: number;
  public_tracks: number;
  avg_duration_sec: number;
  genres: Array<{ name: string; count: number }>;
  moods: Array<{ name: string; count: number }>;
  styles: Array<{ name: string; count: number }>;
  languages: Array<{ name: string; count: number }>;
  top_tags: Array<{ tag: string; count: number }>;
  instrumental_ratio: number;
  with_lyrics_ratio: number;
}

/**
 * Resolve a `timePeriod` string (used by the admin analytics tabs) into a
 * `Date` cutoff for the query.
 */
export function timePeriodToStartDate(timePeriod: string): Date {
  const periodDays = timePeriod === "24 hours" ? 1 : timePeriod === "7 days" ? 7 : timePeriod === "30 days" ? 30 : 90;
  return new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
}

const mapToArray = (map: Map<string, number>) =>
  Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

/**
 * Roll raw completed-track rows up into the ContentAnalyticsStats shape.
 * Pure function — kept here so the component is render-only.
 */
export function rollupContentAnalytics(rows: adminApi.CompletedTrackRow[]): ContentAnalyticsStats {
  const genreMap = new Map<string, number>();
  const moodMap = new Map<string, number>();
  const styleMap = new Map<string, number>();
  const languageMap = new Map<string, number>();
  const tagMap = new Map<string, number>();

  let totalDuration = 0;
  let instrumentalCount = 0;
  let withLyricsCount = 0;

  rows.forEach((track) => {
    if (track.computed_genre) {
      genreMap.set(track.computed_genre, (genreMap.get(track.computed_genre) || 0) + 1);
    }
    if (track.computed_mood) {
      moodMap.set(track.computed_mood, (moodMap.get(track.computed_mood) || 0) + 1);
    }
    if (track.style) {
      styleMap.set(track.style, (styleMap.get(track.style) || 0) + 1);
    }
    if (track.lyrics_language) {
      languageMap.set(track.lyrics_language, (languageMap.get(track.lyrics_language) || 0) + 1);
    }
    if (track.tags) {
      track.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)
        .forEach((tag: string) => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
    }
    if (track.duration_seconds) {
      totalDuration += track.duration_seconds;
    }
    if (track.lyrics && track.lyrics.trim().length > 0) {
      withLyricsCount++;
    } else {
      instrumentalCount++;
    }
  });

  return {
    total_tracks: rows.length,
    public_tracks: rows.filter((t) => t.is_public).length,
    avg_duration_sec: rows.length > 0 ? totalDuration / rows.length : 0,
    genres: mapToArray(genreMap),
    moods: mapToArray(moodMap),
    styles: mapToArray(styleMap),
    languages: mapToArray(languageMap),
    top_tags: Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    instrumental_ratio: rows.length > 0 ? (instrumentalCount / rows.length) * 100 : 0,
    with_lyrics_ratio: rows.length > 0 ? (withLyricsCount / rows.length) * 100 : 0,
  };
}

/**
 * Get content analytics for a given time period.
 */
export async function getContentAnalytics(timePeriod: string): Promise<ContentAnalyticsStats> {
  const startDate = timePeriodToStartDate(timePeriod);
  const rows = await adminApi.fetchCompletedTracksForContentAnalytics({ startDate });
  return rollupContentAnalytics(rows);
}
