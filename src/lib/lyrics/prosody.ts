/**
 * Prosody analyzer for lyrics — syllable count + rhyme detection.
 *
 * Optimised for Russian + English (matches Suno V5 6-12 syllable-per-line rule).
 * Pure functions, no React deps — safe for tests and workers.
 */

export type LineIssueLevel = "info" | "warn" | "error";
export type LineIssueCode =
  | "too-short"
  | "too-long"
  | "way-too-long"
  | "no-rhyme"
  | "empty";

export interface LineIssue {
  code: LineIssueCode;
  level: LineIssueLevel;
  message: string;
}

export interface AnalyzedLine {
  index: number; // 0-based line index in the original text
  raw: string;
  isTag: boolean; // [Verse], [Chorus]...
  isEmpty: boolean;
  isBackVocal: boolean; // starts with ( — sung back-vocals, skip counting
  section: string | null; // last seen section tag label
  syllables: number;
  rhymeKey: string | null; // last-vowel-based key for grouping
  rhymeGroup: string | null; // e.g. "A", "B"; null if no partner in same section
  issues: LineIssue[];
}

export interface ProsodyReport {
  lines: AnalyzedLine[];
  sections: Array<{
    label: string;
    startLine: number;
    endLine: number;
    scheme: string; // e.g. "AABB", "ABAB"
    issueCount: number;
  }>;
  totalIssues: number;
  problemLineIndices: number[];
}

// Optimal syllable range per Suno V5 guidance in the system prompt.
const MIN_SYLL = 6;
const MAX_SYLL = 12;
const HARD_MAX_SYLL = 16;

const RU_VOWELS = "аеёиоуыэюя";
const EN_VOWELS = "aeiouy";
const ALL_VOWELS = new Set((RU_VOWELS + EN_VOWELS).split(""));

/** Count singable syllables in a line. Merges adjacent EN vowel clusters. */
export function countSyllables(line: string): number {
  const cleaned = stripNonSingable(line);
  if (!cleaned.trim()) return 0;
  const chars = cleaned.toLowerCase().split("");
  let count = 0;
  let prevVowel = false;
  let prevIsRuVowel = false;
  for (const ch of chars) {
    const isVowel = ALL_VOWELS.has(ch);
    if (!isVowel) {
      prevVowel = false;
      prevIsRuVowel = false;
      continue;
    }
    const isRu = RU_VOWELS.includes(ch);
    // Russian vowels are always their own syllable.
    // English vowels merge into a cluster (ae, ou, ea → 1 syllable).
    if (isRu || !prevVowel || prevIsRuVowel) {
      count++;
    }
    prevVowel = true;
    prevIsRuVowel = isRu;
  }
  return count;
}

/** Remove parenthesised back-vocals, tags, punctuation used for pauses. */
function stripNonSingable(line: string): string {
  return line
    .replace(/\([^)]*\)/g, " ") // back-vocal (ooh)
    .replace(/\[[^\]]*\]/g, " ") // inline tags
    .replace(/[!?.,;:—–\-"'`]/g, " ");
}

/** Best-effort last-word rhyme key: last vowel + trailing consonants. */
export function getRhymeKey(line: string): string | null {
  const cleaned = stripNonSingable(line).toLowerCase().trim();
  if (!cleaned) return null;
  const words = cleaned.split(/\s+/);
  const last = words[words.length - 1];
  if (!last) return null;
  // Grab up to last 4 chars ending on a vowel-anchored suffix.
  const chars = last.split("");
  let lastVowelIdx = -1;
  for (let i = chars.length - 1; i >= 0; i--) {
    if (ALL_VOWELS.has(chars[i])) {
      lastVowelIdx = i;
      break;
    }
  }
  if (lastVowelIdx < 0) return null;
  const start = Math.max(0, lastVowelIdx - 1);
  return chars.slice(start).join("");
}

/** Two rhyme keys match if they share at least the last-vowel and last consonant. */
function keysRhyme(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  // suffix ≥2 chars must match
  const minLen = Math.min(a.length, b.length);
  if (minLen < 2) return false;
  return a.slice(-2) === b.slice(-2);
}

function isTagLine(line: string): boolean {
  return /^\s*\[[^\]]+\]\s*$/.test(line);
}

/** Full lyrics analyzer. Returns per-line diagnostics + section-scoped rhyme scheme. */
export function analyzeProsody(text: string): ProsodyReport {
  const rawLines = text.split("\n");
  const lines: AnalyzedLine[] = [];
  let currentSection: string | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();
    const isEmpty = trimmed.length === 0;
    const isTag = isTagLine(raw);
    const isBackVocal = /^\s*\(/.test(raw) && /\)\s*$/.test(raw);

    if (isTag) {
      const m = raw.match(/\[([^\]]+)\]/);
      currentSection = m?.[1] ?? currentSection;
    }

    const countable = !isTag && !isEmpty && !isBackVocal;
    const syllables = countable ? countSyllables(raw) : 0;
    const rhymeKey = countable ? getRhymeKey(raw) : null;

    const issues: LineIssue[] = [];
    if (countable) {
      if (syllables === 0) {
        issues.push({ code: "empty", level: "info", message: "Пустая строка" });
      } else if (syllables < MIN_SYLL) {
        issues.push({
          code: "too-short",
          level: "warn",
          message: `${syllables} слогов — коротко (реком. ${MIN_SYLL}–${MAX_SYLL})`,
        });
      } else if (syllables > HARD_MAX_SYLL) {
        issues.push({
          code: "way-too-long",
          level: "error",
          message: `${syllables} слогов — слишком длинно, разбей строку`,
        });
      } else if (syllables > MAX_SYLL) {
        issues.push({
          code: "too-long",
          level: "warn",
          message: `${syllables} слогов — длинновато (реком. до ${MAX_SYLL})`,
        });
      }
    }

    lines.push({
      index: i,
      raw,
      isTag,
      isEmpty,
      isBackVocal,
      section: currentSection,
      syllables,
      rhymeKey,
      rhymeGroup: null,
      issues,
    });
  }

  // Assign rhyme groups within contiguous section runs (broken by [Tag] or ≥1 empty line).
  const sections: ProsodyReport["sections"] = [];
  let runStart = 0;
  while (runStart < lines.length) {
    // Skip lines that don't start a run (tags/empty/back-vocals).
    while (runStart < lines.length && (lines[runStart].isTag || lines[runStart].isEmpty)) {
      runStart++;
    }
    if (runStart >= lines.length) break;
    let runEnd = runStart;
    while (
      runEnd < lines.length &&
      !lines[runEnd].isTag &&
      !lines[runEnd].isEmpty
    ) {
      runEnd++;
    }

    const runLines = lines.slice(runStart, runEnd).filter((l) => l.rhymeKey);
    // Group by rhyme
    const groups: Array<{ key: string; letter: string; lines: AnalyzedLine[] }> = [];
    const letters = "ABCDEFGHIJKLMN";
    for (const line of runLines) {
      const existing = groups.find((g) => keysRhyme(g.key, line.rhymeKey!));
      if (existing) {
        existing.lines.push(line);
      } else {
        groups.push({ key: line.rhymeKey!, letter: letters[groups.length] ?? "?", lines: [line] });
      }
    }
    const scheme = runLines.map((line) => {
      const g = groups.find((g) => g.lines.includes(line));
      return g?.letter ?? "?";
    }).join("");

    for (const g of groups) {
      if (g.lines.length >= 2) {
        for (const l of g.lines) l.rhymeGroup = g.letter;
      } else if (g.lines.length === 1) {
        const l = g.lines[0];
        // Only warn if the section has ≥2 countable lines — a single-line section is fine.
        if (runLines.length >= 2) {
          l.issues.push({
            code: "no-rhyme",
            level: "info",
            message: "Нет рифмы-партнёра в секции",
          });
        }
      }
    }

    if (runLines.length > 0) {
      sections.push({
        label: runLines[0].section ?? "Секция",
        startLine: runStart,
        endLine: runEnd - 1,
        scheme,
        issueCount: runLines.reduce((sum, l) => sum + l.issues.length, 0),
      });
    }
    runStart = runEnd;
  }

  const problemLineIndices = lines
    .filter((l) => l.issues.some((i) => i.level !== "info"))
    .map((l) => l.index);
  const totalIssues = lines.reduce((sum, l) => sum + l.issues.length, 0);

  return { lines, sections, totalIssues, problemLineIndices };
}
