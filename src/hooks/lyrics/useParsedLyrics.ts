import { useMemo } from "react";
import { logger } from "@/lib/logger";

interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
}

interface ParsedLyricsResult {
  lyricsLines: AlignedWord[][] | null;
  plainLyrics: string | null;
  parseError: boolean;
}

const isStructuralTag = (text: string) => {
  if (!text || typeof text !== "string") return false;
  return /^\[?(Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Refrain|Interlude|Break|Solo|Instrumental|Ad-lib|Coda|Куплет|Припев|Бридж|Аутро|Интро)(\s*\d*)?\]?$/i.test(
    text.trim(),
  );
};

const cleanLyrics = (text: string) => {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(
      /\[(Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Refrain|Interlude|Break|Solo|Instrumental|Ad-lib|Coda|Куплет|Припев|Бридж|Аутро|Интро)(\s*\d*)?\]/gi,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// Suno's aligned-words API sometimes tokenizes a section tag as separate
// words per bracket — e.g. "[", "Verse", "]" instead of one "[Verse]" token.
// isStructuralTag alone only matches a single self-contained token, so a
// fragmented tag leaks "[", "Verse", "]" through as three literal lyric
// words/lines. Strip any run of tokens that opens with "[" until its
// closing "]" is seen, regardless of how many words the tag spans.
const stripFragmentedTags = (input: AlignedWord[]): AlignedWord[] => {
  const result: AlignedWord[] = [];
  let insideTag = false;
  for (const w of input) {
    const t = w.word.trim();
    if (!t) continue;
    if (insideTag) {
      if (t.includes("]")) insideTag = false;
      continue;
    }
    if (t.startsWith("[") && !isStructuralTag(t)) {
      if (!t.includes("]")) insideTag = true;
      continue;
    }
    result.push(w);
  }
  return result;
};

const isValidAlignedWord = (w: unknown): w is AlignedWord => {
  if (!w || typeof w !== "object") return false;
  const obj = w as Record<string, unknown>;
  return (
    typeof obj.word === "string" &&
    typeof obj.startS === "number" &&
    typeof obj.endS === "number" &&
    isFinite(obj.startS) &&
    isFinite(obj.endS)
  );
};

export function useParsedLyrics(
  alignedWords: unknown[] | undefined | null,
  trackLyrics: string | null | undefined,
): ParsedLyricsResult {
  return useMemo(() => {
    let words: AlignedWord[] = [];

    try {
      if (alignedWords && Array.isArray(alignedWords) && alignedWords.length > 0) {
        words = stripFragmentedTags(alignedWords.filter(isValidAlignedWord)).filter((w) => !isStructuralTag(w.word));
      } else if (trackLyrics) {
        try {
          if (trackLyrics.trim().startsWith("{") || trackLyrics.trim().startsWith("[")) {
            const parsed = JSON.parse(trackLyrics);
            if (parsed?.alignedWords && Array.isArray(parsed.alignedWords)) {
              words = stripFragmentedTags((parsed.alignedWords as unknown[]).filter(isValidAlignedWord)).filter(
                (w) => !isStructuralTag(w.word),
              );
            }
          }
        } catch {
          return { lyricsLines: null, plainLyrics: cleanLyrics(trackLyrics), parseError: false };
        }

        if (words.length === 0) {
          return { lyricsLines: null, plainLyrics: cleanLyrics(trackLyrics), parseError: false };
        }
      }

      if (words.length === 0) {
        return { lyricsLines: null, plainLyrics: null, parseError: false };
      }

      const lines: AlignedWord[][] = [];
      let currentLine: AlignedWord[] = [];

      words.forEach((word) => {
        if (isStructuralTag(word.word)) return;

        const hasLineBreak = word.word.includes("\n");

        if (hasLineBreak) {
          const parts = word.word.split("\n");
          parts.forEach((part, index) => {
            if (part.trim() && !isStructuralTag(part)) {
              currentLine.push({ ...word, word: part.trim() });
            }
            if (index < parts.length - 1) {
              if (currentLine.length > 0) {
                lines.push([...currentLine]);
                currentLine = [];
              }
            }
          });
        } else if (word.word.trim()) {
          currentLine.push(word);
          const endsWithPunctuation = /[.!?;]$/.test(word.word.trim());
          if (endsWithPunctuation || currentLine.length >= 6) {
            lines.push([...currentLine]);
            currentLine = [];
          }
        }
      });

      if (currentLine.length > 0) {
        lines.push(currentLine);
      }

      return { lyricsLines: lines.length > 0 ? lines : null, plainLyrics: null, parseError: false };
    } catch (err) {
      logger.error("Error parsing lyrics", err);
      const fallbackText = trackLyrics ? cleanLyrics(trackLyrics) : null;
      return { lyricsLines: null, plainLyrics: fallbackText, parseError: true };
    }
  }, [alignedWords, trackLyrics]);
}
