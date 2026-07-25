/**
 * Public Content Constants
 *
 * Configuration constants for genre filtering and playlist generation.
 *
 * @module hooks/public-content/constants
 */

import type { GenreQueryConfig, GenrePlaylistConfig } from "./types";

/**
 * Genre queries — the SINGLE SOURCE OF TRUTH for genre ids and their
 * associated `computed_genre` DB values across the whole app:
 *   - UI tabs                       (GenreTabsSection)
 *   - batch fetch                   (usePublicContentBatch)
 *   - infinite scroll               (useInfiniteGenreTracks)
 *   - client-side keyword fallback  (GenreTabsSection)
 *
 * DB values must match the `computed_genre` column exactly.
 * Never duplicate this list — import `GENRE_QUERIES` / `getGenreDbValues`
 * instead. Guard: `assertGenreIdsMatch` / `assertGenreDbValuesMatch`.
 */
export const GENRE_QUERIES: GenreQueryConfig[] = [
  { id: "hiphop", dbValues: ["hiphop", "hip-hop", "rap", "trap", "drill"] },
  { id: "pop", dbValues: ["pop", "dance", "electropop", "synth-pop"] },
  { id: "rock", dbValues: ["rock", "alternative", "indie", "punk", "grunge"] },
  { id: "metal", dbValues: ["metal", "heavy-metal", "metalcore"] },
  { id: "electronic", dbValues: ["electronic", "house", "techno", "edm", "dnb", "dubstep", "trance"] },
  { id: "ambient", dbValues: ["ambient", "chill", "downtempo"] },
  { id: "jazz", dbValues: ["jazz", "swing", "bebop", "fusion"] },
  { id: "classical", dbValues: ["classical", "orchestral", "symphony"] },
  { id: "folk", dbValues: ["folk", "acoustic", "country", "americana", "bluegrass"] },
];

/**
 * Canonical set of genre ids.
 */
export const CANONICAL_GENRE_IDS: readonly string[] = Object.freeze(
  GENRE_QUERIES.map((g) => g.id),
);

/**
 * Canonical id → dbValues lookup, derived once from GENRE_QUERIES so
 * consumers cannot fork the list.
 */
export const CANONICAL_GENRE_DB_VALUES: Readonly<Record<string, readonly string[]>> = Object.freeze(
  Object.fromEntries(GENRE_QUERIES.map((g) => [g.id, Object.freeze([...g.dbValues])])),
);

/** Safe lookup — returns `[]` for unknown ids. */
export function getGenreDbValues(id: string): readonly string[] {
  return CANONICAL_GENRE_DB_VALUES[id] ?? [];
}

function reportDrift(msg: string): void {
  if (import.meta.env?.DEV) {
    throw new Error(msg);
  }
  // eslint-disable-next-line no-console
  console.warn(msg);
}

/**
 * Dev-time guard: throws in development if a list of genre ids drifts from
 * the canonical set. In production it logs a warning so a stale bundle
 * cannot crash the shell.
 */
export function assertGenreIdsMatch(source: string, ids: readonly string[]): void {
  const canonical = new Set(CANONICAL_GENRE_IDS);
  const foreign = new Set(ids);
  const missing = [...canonical].filter((id) => !foreign.has(id));
  const extra = [...foreign].filter((id) => !canonical.has(id));
  const dupes = ids.length !== foreign.size;
  if (!missing.length && !extra.length && !dupes) return;
  reportDrift(
    `[genre-consistency] ${source} ids out of sync with GENRE_QUERIES. ` +
      `missing=[${missing.join(",")}] extra=[${extra.join(",")}] duplicates=${dupes}`,
  );
}

/**
 * Dev-time guard: validates a full id → dbValues map against the canonical
 * source. Fails on unknown ids, missing ids, or drifted dbValues sets.
 */
export function assertGenreDbValuesMatch(
  source: string,
  map: Readonly<Record<string, readonly string[]>>,
): void {
  assertGenreIdsMatch(source, Object.keys(map));
  const issues: string[] = [];
  for (const id of CANONICAL_GENRE_IDS) {
    const foreign = map[id];
    if (!foreign) continue; // reported by assertGenreIdsMatch
    const canonical = new Set(CANONICAL_GENRE_DB_VALUES[id]);
    const got = new Set(foreign);
    const missing = [...canonical].filter((v) => !got.has(v));
    const extra = [...got].filter((v) => !canonical.has(v));
    if (missing.length || extra.length) {
      issues.push(`${id}: missing=[${missing.join(",")}] extra=[${extra.join(",")}]`);
    }
  }
  if (issues.length) {
    reportDrift(
      `[genre-consistency] ${source} dbValues out of sync with GENRE_QUERIES. ${issues.join("; ")}`,
    );
  }
}

/**
 * Genre playlist configurations for auto-generated playlists
 */
export const GENRE_PLAYLISTS: GenrePlaylistConfig[] = [
  {
    genre: "electronic",
    title: "Электроника",
    description: "Лучшие электронные треки",
    keywords: ["electronic", "electro", "edm", "techno", "house", "trance"],
  },
  {
    genre: "hip-hop",
    title: "Хип-Хоп",
    description: "Свежий хип-хоп и рэп",
    keywords: ["hip-hop", "hip hop", "rap", "trap", "boom bap"],
  },
  {
    genre: "pop",
    title: "Поп",
    description: "Популярная музыка",
    keywords: ["pop", "dance", "synth-pop", "dream pop"],
  },
  {
    genre: "rock",
    title: "Рок",
    description: "Энергичный рок",
    keywords: ["rock", "metal", "alternative", "indie", "punk", "grunge"],
  },
  {
    genre: "ambient",
    title: "Амбиент",
    description: "Атмосферная музыка",
    keywords: ["ambient", "chill", "downtempo", "atmospheric", "drone"],
  },
  {
    genre: "jazz",
    title: "Джаз",
    description: "Классический и современный джаз",
    keywords: ["jazz", "swing", "bebop", "fusion", "smooth jazz"],
  },
  {
    genre: "rnb",
    title: "R&B / Soul",
    description: "Ритм-н-блюз и соул",
    keywords: ["r&b", "rnb", "soul", "neo-soul", "funk", "rhythm"],
  },
  {
    genre: "classical",
    title: "Классика",
    description: "Классическая и оркестровая музыка",
    keywords: ["classical", "orchestral", "symphony", "piano", "opera", "baroque"],
  },
  {
    genre: "lofi",
    title: "Lo-Fi",
    description: "Lo-Fi биты для релакса",
    keywords: ["lo-fi", "lofi", "chillhop", "study", "relax", "beats"],
  },
  {
    genre: "latin",
    title: "Латино",
    description: "Латиноамериканская музыка",
    keywords: ["latin", "reggaeton", "salsa", "bachata", "cumbia", "bossa"],
  },
  {
    genre: "country",
    title: "Кантри",
    description: "Кантри и фолк",
    keywords: ["country", "folk", "acoustic", "bluegrass", "americana"],
  },
  {
    genre: "cinematic",
    title: "Кинематографичная",
    description: "Эпическая и саундтрек музыка",
    keywords: ["cinematic", "epic", "soundtrack", "film", "trailer", "dramatic"],
  },
];

/**
 * Default stale time for public content queries (60s — fresh enough to surface
 * new public tracks without hammering the DB on every navigation).
 */
export const PUBLIC_CONTENT_STALE_TIME = 60 * 1000;

/**
 * Default gc time for public content queries (15 minutes)
 */
export const PUBLIC_CONTENT_GC_TIME = 1000 * 60 * 15;

/**
 * Default batch fetch limit for main tracks
 */
export const BATCH_FETCH_LIMIT = 50;

/**
 * Default fetch limit for genre-specific tracks
 */
export const GENRE_FETCH_LIMIT = 20;
