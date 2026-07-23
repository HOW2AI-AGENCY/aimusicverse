export function parseResponse(action: string, content: string): Record<string, unknown> {
  const res: Record<string, unknown> = { success: true, action };

  // Common: try structured JSON for all generation/analysis actions
  const jsonActions = new Set([
    "generate",
    "smart_generate",
    "improve",
    "add_tags",
    "full_analysis",
    "deep_analysis",
    "producer_review",
    "chat",
    "style_convert",
    "paraphrase",
    "hook_generator",
    "vocal_map",
    "translate_adapt",
    "drill_prompt_builder",
    "epic_prompt_builder",
    "validate_suno_v5",
  ]);

  if (!jsonActions.has(action)) {
    res.message = content;
    return res;
  }

  // Full-json-obj match — greedy so nested braces inside lyrics don't truncate
  const strictMatch =
    action === "generate" || action === "smart_generate" || action === "improve" || action === "add_tags"
      ? content.match(/\{[\s\S]*\}(?=\s*$|(?:\s*```\s*$))/)
      : content.match(/\{[\s\S]*\}/);

  if (!strictMatch) {
    res.message = content;
    return res;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(strictMatch[0]);
  } catch {
    res.message = content;
    return res;
  }

  // Per-action field mapping
  switch (action) {
    case "generate":
    case "smart_generate":
    case "improve":
    case "add_tags":
      if (parsed.lyrics) {
        res.lyrics = parsed.lyrics;
        res.title = parsed.title ?? null;
        res.style = parsed.style ?? null;
        res.changes = parsed.changes ?? null;
        res.tagsSummary = parsed.tagsSummary ?? null;
      } else {
        res.lyrics = content;
      }
      break;

    case "full_analysis":
      res.message = "Анализ завершён";
      res.fullAnalysis = parsed;
      res.quickActions = parsed.quickActions ?? [];
      break;

    case "deep_analysis":
      res.message = "Глубокий анализ завершён";
      res.fullAnalysis = parsed;
      res.quickActions = parsed.quickActions ?? [];
      break;

    case "producer_review":
      res.message = "Продюсерский разбор готов";
      res.producerReview = parsed;
      res.quickActions = parsed.quickActions ?? [];
      break;

    case "chat":
      res.lyrics = parsed.lyrics ?? null;
      res.title = parsed.title ?? null;
      res.style = parsed.style ?? null;
      res.response = parsed.response ?? content;
      res.suggestions = parsed.suggestions ?? null;
      res.quickActions = parsed.quickActions ?? null;
      break;

    case "style_convert":
      res.lyrics = parsed.lyrics;
      res.style = parsed.style;
      res.changes = parsed.changes;
      res.originalStyle = parsed.originalStyle;
      break;

    case "paraphrase":
      res.variants = parsed.variants;
      res.original = parsed.original;
      break;

    case "hook_generator":
      res.currentHooks = parsed.currentHooks;
      res.suggestedHooks = parsed.suggestedHooks;
      res.hookScore = parsed.hookScore;
      res.recommendations = parsed.recommendations;
      break;

    case "vocal_map":
      res.sections = parsed.sections;
      res.generalNotes = parsed.generalNotes;
      res.suggestedSingerType = parsed.suggestedSingerType;
      break;

    case "translate_adapt":
      res.translatedLyrics = parsed.translatedLyrics;
      res.adaptationNotes = parsed.adaptationNotes;
      res.preservedElements = parsed.preservedElements;
      res.changedElements = parsed.changedElements;
      res.qualityScore = parsed.qualityScore;
      break;

    case "drill_prompt_builder":
    case "epic_prompt_builder":
      res.lyrics = parsed.lyrics;
      res.title = parsed.title;
      res.style = parsed.style;
      res.tagsSummary = parsed.tagsSummary;
      break;

    case "validate_suno_v5":
      res.validation = parsed;
      res.isValid = parsed.isValid;
      res.score = parsed.score;
      res.errors = parsed.errors;
      res.warnings = parsed.warnings;
      res.suggestions = parsed.suggestions;
      break;

    default:
      res.message = content;
  }

  return res;
}

export function addMetadata(
  response: Record<string, unknown>,
  action: string,
  genre: string | undefined,
  mood: string | undefined,
  genreProfile: { vocal: string[]; instruments: string[]; dynamics: string[]; emotions: string[] } | undefined,
  moodProfile: { vocal: string[]; dynamics: string[]; emotions: string[] } | undefined,
  useAdvancedTags: boolean,
  vocalTags: string[] | undefined,
  instrumentTags: string[] | undefined,
  dynamicTags: string[] | undefined,
  emotionalCues: string[] | undefined,
): void {
  if (action === "smart_generate" || action === "generate") {
    response.metadata = {
      genre,
      mood,
      recommendedTags: {
        vocal: [...(genreProfile?.vocal ?? []), ...(moodProfile?.vocal ?? [])],
        instruments: genreProfile?.instruments ?? [],
        dynamics: [...(genreProfile?.dynamics ?? []), ...(moodProfile?.dynamics ?? [])],
        emotions: [...(genreProfile?.emotions ?? []), ...(moodProfile?.emotions ?? [])],
      },
      customTagsUsed: useAdvancedTags ? { vocalTags, instrumentTags, dynamicTags, emotionalCues } : null,
    };
  }
}
