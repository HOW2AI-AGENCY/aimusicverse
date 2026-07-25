/**
 * Regression: genre identifier sets AND their DB-value maps must stay
 * in sync across:
 *   - GENRES               (UI tabs, src/components/home/GenreTabsSection.tsx)
 *   - GENRE_QUERIES        (batch fetch, src/hooks/public-content/constants.ts) — canonical
 *   - GENRE_DB_VALUES      (infinite scroll, src/hooks/useInfiniteGenreTracks.ts)
 *
 * A mismatch means a tab renders with no data or a genre gets fetched but
 * never displayed. `GENRE_QUERIES` is the single source of truth; other
 * lists must derive from it via getGenreDbValues.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GENRE_QUERIES,
  CANONICAL_GENRE_IDS,
  CANONICAL_GENRE_DB_VALUES,
  getGenreDbValues,
  assertGenreDbValuesMatch,
} from "@/hooks/public-content/constants";

function extractIds(source: string, marker: string): string[] {
  const startIdx = source.indexOf(marker);
  if (startIdx === -1) return [];
  const slice = source.slice(startIdx, startIdx + 8000);
  const ids: string[] = [];
  const re = /id:\s*"([a-z0-9-]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(slice)) !== null) ids.push(m[1]);
  return ids;
}

const root = resolve(__dirname, "../../..");
const genreTabsSrc = readFileSync(
  resolve(root, "src/components/home/GenreTabsSection.tsx"),
  "utf8",
);
const infiniteSrc = readFileSync(
  resolve(root, "src/hooks/useInfiniteGenreTracks.ts"),
  "utf8",
);

const uiIds = extractIds(genreTabsSrc, "GENRE_PRESENTATION");
const queryIds = GENRE_QUERIES.map((g) => g.id);

describe("genre identifier consistency", () => {
  it("GENRES (UI) matches GENRE_QUERIES (batch)", () => {
    expect(uiIds.sort()).toEqual([...queryIds].sort());
  });

  it("useInfiniteGenreTracks derives from canonical constants (no local copy)", () => {
    // The local GENRE_DB_VALUES alias must be assigned from
    // CANONICAL_GENRE_DB_VALUES — no hand-typed object literal.
    expect(infiniteSrc).toMatch(
      /GENRE_DB_VALUES[^=]*=\s*CANONICAL_GENRE_DB_VALUES/,
    );
    // Legacy inline `{ hiphop: [...] }` literal must not reappear.
    expect(infiniteSrc).not.toMatch(/const GENRE_DB_VALUES[^=]*=\s*\{\s*hiphop:/);
  });

  it("no duplicate ids or dbValues in the canonical source", () => {
    expect(new Set(queryIds).size).toBe(queryIds.length);
    for (const cfg of GENRE_QUERIES) {
      expect(new Set(cfg.dbValues).size, `${cfg.id} has duplicate dbValues`).toBe(
        cfg.dbValues.length,
      );
    }
  });

  it("every canonical genre has non-empty dbValues", () => {
    for (const cfg of GENRE_QUERIES) {
      expect(cfg.dbValues.length, `${cfg.id} has empty dbValues`).toBeGreaterThan(0);
    }
  });

  it("getGenreDbValues returns canonical entries and [] for unknown ids", () => {
    for (const id of CANONICAL_GENRE_IDS) {
      expect([...getGenreDbValues(id)]).toEqual([...CANONICAL_GENRE_DB_VALUES[id]]);
    }
    expect(getGenreDbValues("unknown-genre-xyz")).toEqual([]);
  });

  it("assertGenreDbValuesMatch accepts canonical map and rejects drift", () => {
    expect(() =>
      assertGenreDbValuesMatch("test-canonical", CANONICAL_GENRE_DB_VALUES),
    ).not.toThrow();

    // Drifted copy: hiphop missing "drill"
    const drifted = {
      ...CANONICAL_GENRE_DB_VALUES,
      hiphop: CANONICAL_GENRE_DB_VALUES.hiphop.filter((v) => v !== "drill"),
    };
    // In tests import.meta.env.DEV is true → guard throws.
    expect(() => assertGenreDbValuesMatch("test-drift", drifted)).toThrow(
      /out of sync/,
    );
  });
});

