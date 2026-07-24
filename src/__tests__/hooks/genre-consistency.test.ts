/**
 * Regression: genre identifier sets must stay in sync across
 *   - GENRES              (UI tabs, src/components/home/GenreTabsSection.tsx)
 *   - GENRE_QUERIES       (batch fetch, src/hooks/public-content/constants.ts)
 *   - GENRE_DB_VALUES     (infinite scroll, src/hooks/useInfiniteGenreTracks.ts)
 *
 * A mismatch means a tab renders with no data or a genre gets fetched but
 * never displayed. Keep this test as the single source of truth.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GENRE_QUERIES } from "@/hooks/public-content/constants";

function extractIds(source: string, marker: string): string[] {
  // Parses `id: "value"` occurrences inside the first array literal after `marker`.
  const startIdx = source.indexOf(marker);
  if (startIdx === -1) return [];
  const slice = source.slice(startIdx, startIdx + 8000);
  const ids: string[] = [];
  const re = /id:\s*"([a-z0-9-]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(slice)) !== null) ids.push(m[1]);
  return ids;
}

function extractKeys(source: string, marker: string): string[] {
  const startIdx = source.indexOf(marker);
  if (startIdx === -1) return [];
  const slice = source.slice(startIdx, startIdx + 4000);
  const end = slice.indexOf("};");
  const body = end === -1 ? slice : slice.slice(0, end);
  const keys: string[] = [];
  const re = /^\s*([a-z0-9-]+):\s*\[/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) keys.push(m[1]);
  return keys;
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

const uiIds = extractIds(genreTabsSrc, "const GENRES");
const queryIds = GENRE_QUERIES.map((g) => g.id);
const dbKeys = extractKeys(infiniteSrc, "GENRE_DB_VALUES");

describe("genre identifier consistency", () => {
  it("GENRES (UI) matches GENRE_QUERIES (batch)", () => {
    expect(uiIds.sort()).toEqual(queryIds.sort());
  });

  it("GENRES (UI) matches GENRE_DB_VALUES (infinite scroll)", () => {
    expect(uiIds.sort()).toEqual(dbKeys.sort());
  });

  it("no duplicate ids in any list", () => {
    for (const [name, list] of [
      ["GENRES", uiIds],
      ["GENRE_QUERIES", queryIds],
      ["GENRE_DB_VALUES", dbKeys],
    ] as const) {
      expect(new Set(list).size, `${name} has duplicates`).toBe(list.length);
    }
  });

  it("every UI genre has non-empty dbValues", () => {
    for (const cfg of GENRE_QUERIES) {
      expect(cfg.dbValues.length, `${cfg.id} has empty dbValues`).toBeGreaterThan(0);
    }
  });
});
