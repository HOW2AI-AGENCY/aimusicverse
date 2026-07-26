/**
 * Server-side Suno lyrics normalization (mirror of src/lib/lyrics/normalizeSunoLyrics.ts).
 *
 * Suno ignores Markdown decoration such as `**[Verse]**` or `## Chorus`,
 * which silently destroys the section structure of a generation.
 * Every lyrics payload sent to Suno MUST pass through normalizeSunoLyrics().
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
    .replace(/\*\*([\s\S]*?)\*\*/g, "$1")
    .replace(/__([\s\S]*?)__/g, "$1")
    .replace(/(?<!\*)\*(?!\s)([^*\n]+?)\*(?!\*)/g, "$1")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[*_~`]+/, "")
    .replace(/[*_~`]+$/, "");

const normalizeLine = (rawLine: string): string => {
  const line = stripEmphasis(rawLine.replace(/\r/g, "")).trim();
  if (!line) return "";

  const bracketMatch = line.match(/^\[([^\]]+)\]$/);
  if (bracketMatch) return `[${bracketMatch[1].trim()}]`;

  const bare = line.replace(/^[([{]+/, "").replace(/[)\]}]+$/, "").trim();
  if (isSectionWord(bare)) return `[${bare.replace(/[:.\-–—]+$/g, "").trim()}]`;

  return line;
};

export function normalizeSunoLyrics(input: string | null | undefined): string {
  if (!input) return "";
  const lines = input.split("\n").map(normalizeLine);
  const collapsed: string[] = [];
  for (const line of lines) {
    if (!line && collapsed.length > 0 && !collapsed[collapsed.length - 1]?.trim()) continue;
    collapsed.push(line);
  }
  return collapsed.join("\n").trim();
}

export function didNormalizeLyrics(input: string | null | undefined): boolean {
  if (!input) return false;
  return normalizeSunoLyrics(input) !== input.trim();
}
