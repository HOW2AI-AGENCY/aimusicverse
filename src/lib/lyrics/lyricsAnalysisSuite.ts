/**
 * Professional lyrics analysis suite
 * Extracted from LyricsParser.ts — Sprint 051 T056 decomposition
 *
 * Provides rhyme detection, cliché analysis, professional scoring,
 * and style prompt generation. Calls LyricsParser static methods internally.
 */

import { LyricsParser } from "./LyricsParser";

/**
 * Detect rhyme scheme in lyrics (AABB, ABAB, AABCCB, etc.)
 */
export function detectRhymeScheme(lyrics: string): {
  scheme: string;
  details: Array<{ line: string; rhymeGroup: string }>;
} {
  const lines = lyrics
    .split("\n")
    .map((l) => LyricsParser.extractCleanLine(l))
    .filter((l) => l.length > 3);

  if (lines.length < 2) return { scheme: "N/A", details: [] };

  const getEnding = (line: string): string => {
    const words = line.trim().split(/\s+/);
    const lastWord = words[words.length - 1]?.toLowerCase() || "";
    return lastWord.slice(-3);
  };

  const endings = lines.map(getEnding);
  const rhymeMap = new Map<string, string>();
  const details: Array<{ line: string; rhymeGroup: string }> = [];
  let currentLabel = 65; // 'A'

  endings.forEach((ending, i) => {
    if (!ending) {
      details.push({ line: lines[i], rhymeGroup: "-" });
      return;
    }

    let matched = false;
    for (const [e, label] of rhymeMap) {
      if (isRhyme(ending, e)) {
        details.push({ line: lines[i], rhymeGroup: label });
        matched = true;
        break;
      }
    }

    if (!matched) {
      const newLabel = String.fromCharCode(currentLabel);
      rhymeMap.set(ending, newLabel);
      details.push({ line: lines[i], rhymeGroup: newLabel });
      currentLabel++;
    }
  });

  const scheme = details.map((d) => d.rhymeGroup).join("");
  return { scheme, details };
}

/**
 * Check if two endings rhyme (Cyrillic + Latin support)
 */
function isRhyme(e1: string, e2: string): boolean {
  if (e1 === e2) return true;

  const vowels = "аеёиоуыэюяaeiou";
  const v1 = e1
    .split("")
    .filter((c) => vowels.includes(c))
    .join("");
  const v2 = e2
    .split("")
    .filter((c) => vowels.includes(c))
    .join("");

  return v1 === v2 || e1.slice(-2) === e2.slice(-2);
}

/**
 * Detect clichés in lyrics
 */
export function detectCliches(lyrics: string): Array<{
  cliche: string;
  line: number;
  suggestion: string;
}> {
  const CLICHES: Array<{ pattern: RegExp; suggestion: string }> = [
    { pattern: /навсегда|forever/gi, suggestion: 'Используй конкретный образ вместо "навсегда"' },
    { pattern: /никогда|never(?!mind)/gi, suggestion: "Замени на уникальную метафору" },
    { pattern: /вечно|eternal/gi, suggestion: "Конкретизируй временной образ" },
    { pattern: /сердце\s+бьётся|heart\s+beats/gi, suggestion: "Найди свежий образ для описания волнения" },
    { pattern: /глаза\s+как\s+звёзды|eyes\s+like\s+stars/gi, suggestion: "Используй неожиданное сравнение" },
    { pattern: /танцевать\s+до\s+утра|dance\s+till\s+dawn/gi, suggestion: "Опиши танец через ощущения" },
    { pattern: /любовь\s+навеки|love\s+forever/gi, suggestion: "Покажи любовь через действие, не декларируй" },
    { pattern: /звёзды\s+светят|stars\s+are\s+shining/gi, suggestion: "Персонализируй образ неба" },
    { pattern: /душа\s+поёт|soul\s+sings/gi, suggestion: "Используй конкретное ощущение" },
    { pattern: /ночь\s+темна|dark\s+night/gi, suggestion: "Добавь уникальную деталь к образу ночи" },
  ];

  const results: Array<{ cliche: string; line: number; suggestion: string }> = [];
  const lines = lyrics.split("\n");

  lines.forEach((line, i) => {
    for (const { pattern, suggestion } of CLICHES) {
      const match = line.match(pattern);
      if (match) {
        results.push({
          cliche: match[0],
          line: i + 1,
          suggestion,
        });
      }
    }
  });

  return results;
}

/**
 * Analyze lyrics professionally for Suno V5
 */
export function professionalAnalysis(lyrics: string): {
  syllableStats: { average: number; min: number; max: number; optimal: number; overlong: number };
  rhymeScheme: string;
  cliches: Array<{ cliche: string; line: number; suggestion: string }>;
  tagBalance: { structural: number; vocal: number; dynamic: number; instrumental: number };
  qualityScore: number;
  recommendations: string[];
} {
  const syllableAnalysis = LyricsParser.analyzeSyllables(lyrics);
  const rhymeData = detectRhymeScheme(lyrics);
  const cliches = detectCliches(lyrics);
  const parsed = LyricsParser.parse(lyrics);

  const syllableCounts = syllableAnalysis.map((a) => a.syllableCount).filter((c) => c > 0);
  const syllableStats = {
    average: syllableCounts.length ? Math.round(syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length) : 0,
    min: syllableCounts.length ? Math.min(...syllableCounts) : 0,
    max: syllableCounts.length ? Math.max(...syllableCounts) : 0,
    optimal: syllableAnalysis.filter((a) => a.isOptimal).length,
    overlong: syllableAnalysis.filter((a) => a.syllableCount > 12).length,
  };

  const tagBalance = {
    structural: parsed.tags.structural.length,
    vocal: parsed.tags.vocal.length,
    dynamic: parsed.tags.dynamic.length,
    instrumental: parsed.tags.instrumental.length,
  };

  let score = 100;

  if (!lyrics.includes("[End]")) score -= 20;
  if (parsed.tagValidation?.russianTags.length) score -= 15;
  if (parsed.tagValidation?.conflicts.length) score -= 10 * parsed.tagValidation.conflicts.length;
  if (syllableStats.overlong > 3) score -= 5 * (syllableStats.overlong - 3);
  if (cliches.length > 2) score -= 5 * (cliches.length - 2);
  if (tagBalance.structural === 0) score -= 15;

  if (parsed.tags.compound.length > 0) score += 5;
  if (parsed.tags.effect.length > 0) score += 3;
  if (syllableStats.average >= 6 && syllableStats.average <= 12) score += 5;

  score = Math.max(0, Math.min(100, score));

  const recommendations: string[] = [];

  if (!lyrics.includes("[End]")) {
    recommendations.push("🔴 Добавь [End] в конце — критически важно!");
  }
  if (cliches.length > 0) {
    recommendations.push(`⚠️ Найдено ${cliches.length} клише — замени на оригинальные образы`);
  }
  if (syllableStats.overlong > 0) {
    recommendations.push(`📝 ${syllableStats.overlong} строк слишком длинные — разбей на 6-12 слогов`);
  }
  if (tagBalance.dynamic === 0) {
    recommendations.push("🎵 Добавь динамические теги: [Build], [Drop], [!crescendo]");
  }
  if (tagBalance.vocal === 0) {
    recommendations.push("🎤 Добавь вокальные теги: [Male Vocal], [Whisper], [Powerful]");
  }
  if (parsed.tags.compound.length === 0) {
    recommendations.push("💡 Используй составные теги V5: [Verse | Male Vocal | Intimate]");
  }

  return {
    syllableStats,
    rhymeScheme: rhymeData.scheme.substring(0, 20) + (rhymeData.scheme.length > 20 ? "..." : ""),
    cliches,
    tagBalance,
    qualityScore: score,
    recommendations,
  };
}

/**
 * Get style prompt suggestion from lyrics analysis
 */
export function suggestStylePrompt(lyrics: string, genre?: string, mood?: string): string {
  const parsed = LyricsParser.parse(lyrics);

  const parts: string[] = [];

  if (genre) parts.push(genre);
  if (mood) parts.push(mood);

  const vocalTags = parsed.tags.vocal.slice(0, 2);
  if (vocalTags.length) parts.push(vocalTags.join(", "));

  const instruments = parsed.tags.instrumental.slice(0, 3);
  if (instruments.length) parts.push(instruments.join(", "));

  const dynamics = parsed.tags.dynamic.slice(0, 2);
  if (dynamics.length) parts.push(dynamics.join(", "));

  const effects = parsed.tags.effect.filter((e) => e.startsWith("!")).slice(0, 2);
  if (effects.length) parts.push(effects.map((e) => `[${e}]`).join(", "));

  return parts.join(", ").substring(0, 120);
}
