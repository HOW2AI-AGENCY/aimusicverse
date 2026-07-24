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

/**
 * Incremental analyzer — reuses `AnalyzedLine` entries from a previous report
 * for lines whose raw text AND section context are unchanged.
 *
 * The editor calls this on every keystroke; reusing objects keeps
 * `<LyricsProsodyPanel>` list items referentially stable, so React skips
 * re-rendering unchanged rows and the textarea keeps caret + selection.
 *
 * Rhyme groups are recomputed per contiguous run (section) — but only for
 * runs that actually changed. Unchanged runs keep the previous scheme and
 * per-line `rhymeGroup` assignments verbatim.
 */
export function analyzeProsodyIncremental(
  text: string,
  prev: ProsodyReport | null,
): ProsodyReport {
  if (!prev) return analyzeProsody(text);

  const rawLines = text.split("\n");

  // Split into runs the same way `analyzeProsody` does so the cache key
  // matches: [Tag] and blank lines act as separators.
  type Run = { start: number; end: number; lines: string[]; sectionLabel: string | null };
  const runs: Run[] = [];
  let currentSection: string | null = null;
  let i = 0;
  while (i < rawLines.length) {
    // Advance through tags/empties, tracking section labels.
    while (i < rawLines.length && (rawLines[i].trim() === "" || isTagLine(rawLines[i]))) {
      if (isTagLine(rawLines[i])) {
        const m = rawLines[i].match(/\[([^\]]+)\]/);
        currentSection = m?.[1] ?? currentSection;
      }
      i++;
    }
    if (i >= rawLines.length) break;
    const start = i;
    while (i < rawLines.length && rawLines[i].trim() !== "" && !isTagLine(rawLines[i])) i++;
    runs.push({
      start,
      end: i - 1,
      lines: rawLines.slice(start, i),
      sectionLabel: currentSection,
    });
  }

  // Build a map of previous runs keyed by their content signature.
  const prevRunsBySig = new Map<string, AnalyzedLine[]>();
  for (const sec of prev.sections) {
    const key = signRun(prev.lines, sec.startLine, sec.endLine, sec.label);
    prevRunsBySig.set(key, prev.lines.slice(sec.startLine, sec.endLine + 1));
  }

  // Build the analyzed line array — start from a fresh full pass to keep
  // tags/empties/section propagation correct, then splice in reused runs.
  const fresh = analyzeProsody(text);
  const merged: AnalyzedLine[] = fresh.lines.slice();

  const reusedSections: ProsodyReport["sections"] = [];
  for (const run of runs) {
    const sig = signRunFromRaw(run.lines, run.sectionLabel);
    const cached = prevRunsBySig.get(sig);
    if (cached && cached.length === run.lines.length) {
      // Rewrite indices to match the current layout.
      for (let k = 0; k < cached.length; k++) {
        const idx = run.start + k;
        merged[idx] = { ...cached[k], index: idx, section: run.sectionLabel };
      }
      const scheme = prev.sections.find((s) => s.label === run.sectionLabel && signRun(prev.lines, s.startLine, s.endLine, s.label) === sig)?.scheme || "";
      const countable = cached.filter((l) => !l.isTag && !l.isEmpty && !l.isBackVocal);
      reusedSections.push({
        label: run.sectionLabel ?? "Секция",
        startLine: run.start,
        endLine: run.end,
        scheme,
        issueCount: countable.reduce((sum, l) => sum + l.issues.length, 0),
      });
    }
  }

  // For sections we couldn't reuse, keep the freshly computed entries — they're
  // already in `merged` and `fresh.sections`. Combine section lists so callers
  // see one entry per run.
  const finalSections = fresh.sections.map((s) => {
    const reused = reusedSections.find((r) => r.startLine === s.startLine && r.endLine === s.endLine);
    return reused ?? s;
  });

  const problemLineIndices = merged
    .filter((l) => l.issues.some((iss) => iss.level !== "info"))
    .map((l) => l.index);
  const totalIssues = merged.reduce((sum, l) => sum + l.issues.length, 0);

  return { lines: merged, sections: finalSections, totalIssues, problemLineIndices };
}

function signRun(lines: AnalyzedLine[], startLine: number, endLine: number, label: string | null): string {
  const slice = lines.slice(startLine, endLine + 1).map((l) => l.raw).join("\u0001");
  return `${label ?? ""}\u0002${slice}`;
}
function signRunFromRaw(lines: string[], label: string | null): string {
  return `${label ?? ""}\u0002${lines.join("\u0001")}`;
}

