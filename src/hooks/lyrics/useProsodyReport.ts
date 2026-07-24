/**
 * useProsodyReport — debounced, incremental prosody analysis for the editor.
 *
 * - Debounces recomputation (default 150ms) so the analyzer doesn't run on
 *   every keystroke while the user is actively typing.
 * - Reuses per-run `AnalyzedLine` objects from the previous report via
 *   `analyzeProsodyIncremental`, keeping list items in `<LyricsProsodyPanel>`
 *   referentially stable. That prevents the panel from re-rendering
 *   unchanged rows (no flicker) and lets React keep textarea selection
 *   intact between updates.
 */

import { useEffect, useRef, useState } from "react";
import { analyzeProsody, analyzeProsodyIncremental, type ProsodyReport } from "@/lib/lyrics/prosody";

interface Options {
  debounceMs?: number;
}

export function useProsodyReport(lyrics: string, opts: Options = {}): ProsodyReport {
  const { debounceMs = 150 } = opts;
  const [report, setReport] = useState<ProsodyReport>(() => analyzeProsody(lyrics));
  const prevRef = useRef<ProsodyReport>(report);

  useEffect(() => {
    // Empty text short-circuits — cheap, no timer needed.
    if (!lyrics) {
      const empty = analyzeProsody("");
      prevRef.current = empty;
      setReport(empty);
      return;
    }
    const handle = setTimeout(() => {
      const next = analyzeProsodyIncremental(lyrics, prevRef.current);
      prevRef.current = next;
      setReport(next);
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [lyrics, debounceMs]);

  return report;
}
