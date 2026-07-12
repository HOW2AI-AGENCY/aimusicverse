/**
 * Regression: swipe-gesture hint must never be re-introduced.
 *
 * The swipe tip broke layout in the library list and interrupted users.
 * It was removed from the hint registry and constants, so:
 *  - `HINT_REGISTRY` must not contain a "swipe-gesture" entry.
 *  - `getHintsByContext("library")` must not surface any swipe-gesture tip.
 *  - `resolveHint("swipe-gesture")` must return undefined.
 *  - `HINT_IDS.SWIPE_GESTURE` must not exist.
 *  - `<ListVariant>` source must not import UnifiedTipCard.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  HINT_REGISTRY,
  getHintsByContext,
  resolveHint,
} from "@/components/hints/registry";
import { HINT_IDS } from "@/hooks/useHintTracking";

describe("swipe-gesture hint removal (regression)", () => {
  it("is absent from HINT_REGISTRY", () => {
    expect(Object.keys(HINT_REGISTRY)).not.toContain("swipe-gesture");
  });

  it("is not returned by getHintsByContext('library')", () => {
    const libraryHints = getHintsByContext("library");
    expect(libraryHints.find((h) => h.id === "swipe-gesture")).toBeUndefined();
    for (const h of libraryHints) {
      expect(h.title.toLowerCase()).not.toContain("свайп");
      expect(h.message.toLowerCase()).not.toContain("свайп");
    }
  });

  it("resolveHint('swipe-gesture') returns undefined", () => {
    expect(resolveHint("swipe-gesture")).toBeUndefined();
  });

  it("HINT_IDS.SWIPE_GESTURE is not exported", () => {
    expect((HINT_IDS as Record<string, string>).SWIPE_GESTURE).toBeUndefined();
  });

  it("ListVariant does not import UnifiedTipCard", () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        "src/components/track/track-card-new/variants/ListVariant.tsx",
      ),
      "utf8",
    );
    expect(src).not.toMatch(/^import\s+\{[^}]*UnifiedTipCard[^}]*\}\s+from/m);
  });
});
