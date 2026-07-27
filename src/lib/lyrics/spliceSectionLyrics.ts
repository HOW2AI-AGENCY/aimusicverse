/**
 * Splice edited section lyrics back into the full lyrics document.
 *
 * Suno's replace-section API regenerates the [infillStartS, infillEndS] window
 * using `fullLyrics` — the document must already contain the MODIFIED text for
 * that section. Sending the untouched original lyrics makes Suno re-sing the
 * same words, which looks like "replacement does nothing".
 */

const normalize = (value: string) => value.replace(/\r\n/g, "\n").trim();

interface IndexedToken {
  token: string;
  start: number;
  end: number;
}

const tokenPattern = /[\p{L}\p{N}]+/gu;

function tokenize(value: string): string[] {
  return Array.from(value.toLowerCase().matchAll(tokenPattern), (match) => match[0]);
}

function tokenizeWithIndexes(value: string): IndexedToken[] {
  return Array.from(value.toLowerCase().matchAll(tokenPattern), (match) => ({
    token: match[0],
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

function lcsLength(a: string[], b: string[]): number {
  const previous = new Array(b.length + 1).fill(0);
  const current = new Array(b.length + 1).fill(0);

  for (const tokenA of a) {
    for (let indexB = 0; indexB < b.length; indexB += 1) {
      current[indexB + 1] =
        tokenA === b[indexB]
          ? previous[indexB] + 1
          : Math.max(previous[indexB + 1] ?? 0, current[indexB] ?? 0);
    }
    previous.splice(0, previous.length, ...current);
    current.fill(0);
  }

  return previous[b.length] ?? 0;
}

function findFuzzyWindow(full: string, original: string): { start: number; end: number } | null {
  const originalTokens = tokenize(original);
  const fullTokens = tokenizeWithIndexes(full);
  if (originalTokens.length < 4 || fullTokens.length < originalTokens.length) return null;

  const minWindowSize = Math.max(4, originalTokens.length - 3);
  const maxWindowSize = Math.min(fullTokens.length, originalTokens.length + 3);
  let best: { start: number; end: number; score: number } | null = null;

  for (let windowSize = minWindowSize; windowSize <= maxWindowSize; windowSize += 1) {
    for (let index = 0; index <= fullTokens.length - windowSize; index += 1) {
      const window = fullTokens.slice(index, index + windowSize);
      const windowTokens = window.map((item) => item.token);
      const common = lcsLength(originalTokens, windowTokens);
      const score = (2 * common) / (originalTokens.length + windowTokens.length);

      if (!best || score > best.score) {
        const first = window[0];
        const last = window[window.length - 1];
        if (first && last) {
          best = { start: first.start, end: last.end, score };
        }
      }
    }
  }

  return best && best.score >= 0.72 ? { start: best.start, end: best.end } : null;
}

/**
 * Returns fullLyrics with `originalSection` replaced by `editedSection`.
 * Falls back to the original document when the section text can't be located.
 */
export function spliceSectionLyrics(
  fullLyrics: string | null | undefined,
  originalSection: string | null | undefined,
  editedSection: string | null | undefined,
): { lyrics: string; spliced: boolean } {
  const full = normalize(fullLyrics ?? "");
  const original = normalize(originalSection ?? "");
  const edited = normalize(editedSection ?? "");

  if (!edited || edited === original) return { lyrics: full, spliced: false };
  if (!full) return { lyrics: edited, spliced: true };
  if (!original) return { lyrics: full, spliced: false };

  // 1. Exact match
  const exactIndex = full.indexOf(original);
  if (exactIndex !== -1) {
    return {
      lyrics: full.slice(0, exactIndex) + edited + full.slice(exactIndex + original.length),
      spliced: true,
    };
  }

  // 2. Whitespace-tolerant match (line-by-line join with flexible spacing)
  const pattern = original
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  if (pattern) {
    const regex = new RegExp(pattern);
    if (regex.test(full)) {
      return { lyrics: full.replace(regex, () => edited), spliced: true };
    }
  }

  // 3. Fuzzy token-window match. Timestamped lyrics and manual edits can drop
  // short leading words or punctuation while still pointing to the same range.
  const fuzzyWindow = findFuzzyWindow(full, original);
  if (fuzzyWindow) {
    return {
      lyrics: full.slice(0, fuzzyWindow.start) + edited + full.slice(fuzzyWindow.end),
      spliced: true,
    };
  }

  return { lyrics: full, spliced: false };
}
