/**
 * AI Response Parser - Reliable JSON extraction and validation
 */

import { logger } from "@/lib/logger";
import { FullAnalysisData, ProducerReviewData, QuickAction } from "@/components/lyrics-workspace/ai-agent/types";

export interface ParsedLyricsResponse {
  lyrics: string;
  title?: string;
  style?: string;
  emotionalCore?: {
    mainImage: string;
    journey: string;
  };
  punchlines?: Record<string, string>;
  changes?: string[];
  tagsSummary?: string[];
}

export interface ExpandedAnalysisData extends FullAnalysisData {
  narrative?: {
    start: string;
    conflict: string;
    climax: string;
    resolution: string;
  };
  technicalLyrics?: {
    figurativeDevices: string[];
    phonetics: string;
    wordChoice: string;
  };
  cultural?: {
    influences: string[];
    era: string;
    references: string[];
  };
  keyInsights?: string[];
  uniqueStrength?: string;
}

/**
 * Extract JSON from AI response, handling markdown code blocks and partial JSON
 */
export function extractJSON<T>(content: string): T | null {
  if (!content) return null;

  // Try to find JSON in various formats
  const patterns = [
    // Standard JSON object
    /\{[\s\S]*\}/,
    // JSON in markdown code block
    /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
    // JSON array
    /\[[\s\S]*\]/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const jsonStr = match[1] || match[0];
      try {
        // Clean common issues
        const cleaned = jsonStr
          .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
          .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
          .replace(/'/g, '"') // Replace single quotes
          .trim();

        return JSON.parse(cleaned) as T;
      } catch (e) {
        logger.debug("JSON parse attempt failed", { error: e instanceof Error ? e.message : String(e) });
        continue;
      }
    }
  }

  // Last resort: try to parse the entire content
  try {
    return JSON.parse(content) as T;
  } catch {
    logger.debug("Failed to extract JSON from content");
    return null;
  }
}

/**
 * Parse full analysis response with validation
 */
export function parseFullAnalysis(content: string): ExpandedAnalysisData | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Untyped JSON shape from LLM; we narrow field-by-field below
  const data = extractJSON<any>(content);
  if (!data) return null;

  // Validate and normalize required fields
  return {
    meaning: {
      theme: data.meaning?.theme || "Не определена",
      emotions: data.meaning?.emotions || [],
      issues: data.meaning?.issues || [],
      score: data.meaning?.score || 0,
    },
    rhythm: {
      pattern: data.rhythm?.pattern || "",
      issues: data.rhythm?.issues || [],
      score: data.rhythm?.score || 0,
    },
    rhymes: {
      scheme: data.rhymes?.scheme || "",
      weakRhymes: data.rhymes?.weakRhymes || [],
      score: data.rhymes?.score || 0,
    },
    structure: {
      tags: data.structure?.detected || data.structure?.tags || [],
      issues: data.structure?.issues || [],
      score: data.structure?.score || 0,
    },
    overallScore: data.overallScore || 0,
    recommendations: (data.recommendations || []).map((r: Record<string, unknown>) => ({
      type: (r.type as string) || "general",
      text: (r.text as string) || "",
      priority: (r.priority as string) || "medium",
    })),
    quickActions: data.quickActions || [],
    // Extended fields
    narrative: data.meaning?.narrative || data.narrative,
    technicalLyrics: data.technicalLyrics,
    cultural: data.cultural,
    keyInsights: data.keyInsights || [],
    uniqueStrength: data.uniqueStrength || "",
  };
}

/**
 * Parse producer review response with validation
 */
export function parseProducerReview(content: string): ProducerReviewData | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Untyped JSON shape from LLM; we narrow field-by-field below
  const data = extractJSON<any>(content);
  if (!data) return null;

  return {
    commercialScore: data.commercialScore || data.overallScore || 0,
    overallScore: data.commercialScore || data.overallScore || 0,
    summary: data.summary || "",
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    productionNotes: data.productionNotes || "",
    hooks: data.hooks
      ? {
          current: data.hooks.current || "",
          suggestions: data.hooks.suggestions || [],
        }
      : undefined,
    vocalMap: data.vocalMap || [],
    arrangement: data.arrangement
      ? {
          add: data.arrangement.add || [],
          remove: data.arrangement.remove || [],
          dynamics: data.arrangement.dynamics || [],
        }
      : undefined,
    stylePrompt: data.stylePrompt || "",
    suggestedTags: data.suggestedTags || [],
    genreTags: data.genreTags || [],
    topRecommendations: data.topRecommendations || [],
    recommendations:
      data.recommendations ||
      data.topRecommendations?.map((r: Record<string, unknown>, i: number) => ({
        priority: (r.priority as number) || i + 1,
        text: (r.text as string) || "",
      })) ||
      [],
    quickActions: data.quickActions || [],
  };
}

/**
 * Parse lyrics generation response
 */
export function parseLyricsResponse(content: string): ParsedLyricsResponse | null {
  // First try to extract JSON
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Untyped JSON shape from LLM; we narrow field-by-field below
  const data = extractJSON<any>(content);

  if (data?.lyrics) {
    return {
      lyrics: data.lyrics,
      title: data.title,
      style: data.style,
      emotionalCore: data.emotionalCore,
      punchlines: data.punchlines,
      changes: data.changes,
      tagsSummary: data.tagsSummary,
    };
  }

  // If no JSON found, check if content is raw lyrics
  if (content.includes("[Verse") || content.includes("[Chorus") || content.includes("[Intro")) {
    return {
      lyrics: content,
    };
  }

  return null;
}

/**
 * Universal AI response parser based on action type
 */
export function parseAIResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Universal parser accepts heterogeneous LLM payloads
  data: any,
  action: string,

): {
  type: string;
  message: string;
  lyrics?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Returned passthrough of caller-supplied payload
  data?: unknown;
  expandedAnalysis?: ExpandedAnalysisData;
  keyInsights?: string[];
  uniqueStrength?: string;
} {
  // If data is already structured (from edge function), use it directly
  if (data && typeof data === "object") {
    // Handle deep_analysis
    if (action === "deep_analysis" || data.expandedAnalysis) {
      const expandedAnalysis = data.expandedAnalysis || data.fullAnalysis || data;
      return {
        type: "expanded_analysis",
        message: data.message || "Глубокий анализ завершен",
        expandedAnalysis: expandedAnalysis,
        keyInsights: expandedAnalysis?.keyInsights || data.keyInsights,
        uniqueStrength: expandedAnalysis?.uniqueStrength || data.uniqueStrength,
      };
    }

    // Handle full_analysis
    if (action === "full_analysis" || data.fullAnalysis) {
      return {
        type: "full_analysis",
        message: data.message || "Анализ завершен",
        data: data.fullAnalysis || data,
      };
    }

    // Handle producer_review
    if (action === "producer_review" || data.producerReview) {
      return {
        type: "producer_review",
        message: data.message || "Разбор продюсера готов",
        data: data.producerReview || data,
      };
    }

    // Handle lyrics
    if (data.lyrics) {
      return {
        type: "lyrics",
        message: data.message || "Текст сгенерирован",
        lyrics: data.lyrics,
      };
    }

    // Default: return as-is
    return {
      type: "text",
      message: data.message || data.result || "Готово",
      data: data,
    };
  }

  // If data is string, try to parse
  if (typeof data === "string") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Recursive parse of LLM-provided string content; shape unknown
    const parsed = extractJSON<any>(data);
    if (parsed) {
      return parseAIResponse(parsed, action);
    }
    return {
      type: "text",
      message: data,
    };
  }

  return {
    type: "text",
    message: "Ответ получен",
  };
}

/**
 * Parse chat response which can contain multiple data types
 */
export function parseChatResponse(content: string): {
  message: string;
  lyrics?: string;
  title?: string;
  style?: string;
  tags?: string[];
  suggestions?: Array<{ label: string; value: string; action?: string }>;
  quickActions?: QuickAction[];
  stylePrompt?: string;
  changes?: string[];
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Untyped JSON shape from chat LLM; we narrow field-by-field below
  const data = extractJSON<any>(content);

  if (data) {
    return {
      message: data.response || data.message || "",
      lyrics: data.lyrics,
      title: data.title,
      style: data.style,
      tags: data.tags,
      suggestions: data.suggestions,
      quickActions: data.quickActions,
      stylePrompt: data.stylePrompt,
      changes: data.changes,
    };
  }

  // Return raw content as message
  return {
    message: content,
  };
}

/**
 * Validate that required analysis sections are present
 */
export function validateAnalysis(data: ExpandedAnalysisData): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!data.meaning?.theme) missing.push("meaning.theme");
  if (!data.overallScore) missing.push("overallScore");
  if (typeof data.meaning?.score !== "number") missing.push("meaning.score");
  if (typeof data.rhythm?.score !== "number") missing.push("rhythm.score");
  if (typeof data.rhymes?.score !== "number") missing.push("rhymes.score");
  if (typeof data.structure?.score !== "number") missing.push("structure.score");

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get fallback analysis data when parsing fails
 */
export function getFallbackAnalysis(rawContent: string): ExpandedAnalysisData {
  return {
    meaning: {
      theme: "Анализ не распознан",
      emotions: [],
      issues: ["Не удалось выполнить структурный анализ"],
      score: 0,
    },
    rhythm: {
      pattern: "Не определён",
      issues: [],
      score: 0,
    },
    rhymes: {
      scheme: "Не определена",
      weakRhymes: [],
      score: 0,
    },
    structure: {
      tags: [],
      issues: [],
      score: 0,
    },
    overallScore: 0,
    recommendations: [
      {
        type: "general",
        text: rawContent.slice(0, 200) + "...",
        priority: "medium" as const,
      },
    ],
    quickActions: [],
    keyInsights: [],
    uniqueStrength: "",
  };
}
