/**
 * Suno lyrics normalization.
 *
 * Users (and LLM assistants) often paste lyrics with Markdown decoration:
 * `**[Verse]**`, `__[Chorus]__`, `### Verse 1`, `*Bridge*`.
 * Suno does NOT parse those — the asterisks end up sung/ignored and the
 * section structure is lost. This helper rewrites such text into the
 * canonical Suno format: bare `[Tag]` lines + plain lyric lines.
 */

const KNOWN_SECTION_WORDS = [
  "intro",
  "verse",
  "pre-chorus",
  "prechorus",
  "chorus",
  "post-chorus",
  "hook",
  "bridge",
  "breakdown",
  "break",
  "drop",
  "build",
  "interlude",
  "solo",
  "instrumental",
  "outro",
  "refrain",
  "ad-lib",
  "adlib",
  // Russian equivalents frequently used by users
  "интро",
  "куплет",
  "припев",
  "предприпев",
  "бридж",
  "мост",
  "аутро",
  "проигрыш",
  "вступление",
  "концовка",
];

const isSectionWord = (value: string): boolean => {
  const cleaned = value
    .toLowerCase()
    .replace(/[:.\-–—]+$/g, "")
    .replace(/\s*\d+\s*$/, "")
    .trim();
  return KNOWN_SECTION_WORDS.includes(cleaned);
};

const stripEmphasis = (line: string): string =>
  line
    // **bold** / __bold__ / *italic* / _italic_ wrappers
    .replace(/\*\*([\s\S]*?)\*\*/g, "$1")
    .replace(/__([\s\S]*?)__/g, "$1")
    .replace(/(?<!\*)\*(?!\s)([^*\n]+?)\*(?!\*)/g, "$1")
    // Markdown headings at line start
    .replace(/^#{1,6}\s*/, "")
    // Leftover stray emphasis markers around brackets
    .replace(/^[*_~`]+/, "")
    .replace(/[*_~`]+$/, "");

/**
 * Normalizes a single line into Suno format.
 * Returns the normalized line (may be an empty string).
 */
const normalizeLine = (rawLine: string): string => {
  const line = stripEmphasis(rawLine.replace(/\r/g, "")).trim();
  if (!line) return "";

  // Already a proper tag: [Verse 1] — keep, but tidy inner spacing.
  const bracketMatch = line.match(/^\[([^\]]+)\]$/);
  if (bracketMatch) {
    return `[${bracketMatch[1].trim()}]`;
  }

  // Bare section word (possibly with colon / numbering) → wrap in brackets.
  const bare = line.replace(/^[([{]+/, "").replace(/[)\]}]+$/, "").trim();
  if (isSectionWord(bare)) {
    return `[${bare.replace(/[:.\-–—]+$/g, "").trim()}]`;
  }

  return line;
};

export interface NormalizeSunoLyricsResult {
  lyrics: string;
  /** True when the input needed rewriting for Suno compatibility. */
  changed: boolean;
  /** Human-readable notes about applied fixes (RU, user-facing). */
  notes: string[];
}

/**
 * Normalizes lyrics/section text to the format Suno expects.
 */
export function normalizeSunoLyricsDetailed(input: string | null | undefined): NormalizeSunoLyricsResult {
  if (!input) return { lyrics: "", changed: false, notes: [] };

  const notes: string[] = [];
  const hadEmphasis = /(\*\*|__|^#{1,6}\s|(?<!\*)\*(?!\s)[^*\n]+\*)/m.test(input);

  const lines = input.split("\n").map(normalizeLine);
  // Collapse 3+ blank lines into one blank line
  const collapsed: string[] = [];
  for (const line of lines) {
    if (!line && !collapsed[collapsed.length - 1]?.trim() && collapsed.length > 0) continue;
    collapsed.push(line);
  }
  const lyrics = collapsed.join("\n").trim();

  if (hadEmphasis) notes.push("Убрано Markdown-форматирование (**, __, #) — Suno его не понимает");

  const bareTagsFixed = input
    .split("\n")
    .some((raw) => !/^\s*\[/.test(raw) && /^\[/.test(normalizeLine(raw)));
  if (bareTagsFixed) notes.push("Названия секций обёрнуты в квадратные скобки, например [Verse]");

  return { lyrics, changed: lyrics !== input.trim(), notes };
}

/**
 * Convenience wrapper returning only the normalized string.
 */
export function normalizeSunoLyrics(input: string | null | undefined): string {
  return normalizeSunoLyricsDetailed(input).lyrics;
}
