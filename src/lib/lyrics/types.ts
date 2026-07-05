/**
 * Lyrics Parser Types
 * Extracted from LyricsParser.ts — Sprint 051 decomposition
 */

export interface ParsedLyrics {
  raw: string;
  title?: string;
  style?: string;
  sections: LyricsSection[];
  tags: {
    structural: string[];
    vocal: string[];
    dynamic: string[];
    instrumental: string[];
    emotional: string[];
    compound: string[];
    transform: string[];
    effect: string[];
  };
  isValid: boolean;
  warnings: string[];
  syllableAnalysis?: SyllableAnalysis[];
  tagValidation?: TagValidationResult;
}

export interface LyricsSection {
  id: string;
  name: string;
  type: "intro" | "verse" | "pre-chorus" | "chorus" | "bridge" | "outro" | "instrumental" | "solo" | "other";
  content: string;
  tags: SectionTag[];
  startLine: number;
  endLine: number;
}

export interface SectionTag {
  type: "structural" | "vocal" | "dynamic" | "instrumental" | "emotional" | "compound" | "transform" | "effect";
  value: string;
  format: "bracket" | "parenthesis" | "compound";
  parts?: string[];
}

export interface SyllableAnalysis {
  line: string;
  lineNumber: number;
  syllableCount: number;
  isOptimal: boolean;
  suggestion?: string;
}

export interface TagValidationResult {
  isValid: boolean;
  conflicts: [string, string, string][];
  russianTags: string[];
  missingEnd: boolean;
  overloadedLines: number[];
  duplicateSections: string[];
}
