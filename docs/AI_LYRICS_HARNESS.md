# AI Lyrics Assistant — Harness Architecture

> Last updated: 2026-07-26

## Overview

The lyrics assistant is a **three-layer harness** built around a single Supabase Edge Function. It is NOT native LLM function-calling — it is a set of **action presets** where the frontend controls which actions are available, what context is sent, and how results are applied.

```
UI Tool / Chat / Wizard
  → services/lyrics/ai-tools.service.ts
  → api/lyrics.api.ts
  → Supabase Edge Function: ai-lyrics-assistant
  → Lovable AI Gateway
  → google/gemini-2.5-flash
  → parser.ts (JSON extraction + metadata)
  → UI result cards / apply callbacks
```

## Two Frontend Surfaces

### 1. Generate Sheet Wizard (lightweight)

**Files:**

- `src/components/generate-form/lyrics/LyricsAssistantSheet.tsx`
- `src/components/generate-form/lyrics/LyricsAssistantChat.tsx`
- `src/hooks/lyrics/useLyricsAssistant.ts`

A Vaul-based bottom sheet with a guided flow:

```
genre → mood (max 3) → structure → streaming generation → preview → apply
```

Generation streams via SSE:

```
streamLyricsAssistant()
  → POST ai-lyrics-assistant { stream: true }
  → SSE: event:chunk (raw JSON delta)
  → SSE: event:done (final structured result)
  → extractPartialLyrics() progressively updates the preview
```

After completion, user can apply:

- `lyrics` → form lyrics field
- `title` → form title field
- `style` → form style field

Quick edit suggestions are available in `EnhancedLyricsPreview.tsx`: "энергичнее", "эмоциональнее", "больше тегов", "лучше рифмы", "короче", "атмосфернее", plus custom instruction.

### 2. Lyrics Studio Agent (full)

**Files:**

- `src/components/lyrics-workspace/LyricsAIChatAgent.tsx`
- `src/components/lyrics-workspace/ai-agent/hooks/useAITools.ts`
- `src/pages/lyrics-studio/LyricsAIPanel.tsx`

Desktop: 400px slide-in panel. Mobile: full-screen panel + FAB.

Before each call, the agent assembles context:

| Context field         | Source             | Purpose                             |
| --------------------- | ------------------ | ----------------------------------- |
| `existingLyrics`      | current document   | base text for analysis/modification |
| `selectedSection`     | clicked section    | section-scoped operations           |
| `globalTags`          | document tags      | tag-aware generation                |
| `sectionTags`         | per-section tags   | fine-grained tag context            |
| `allSectionNotes`     | section notes      | creative direction per section      |
| `stylePrompt`         | track style prompt | Suno style alignment                |
| `title`               | document title     | context for naming                  |
| `projectContext`      | album data         | genre, mood, concept, audience      |
| `trackContext`        | track data         | position in album, recommendations  |
| `tracklist`           | album tracklist    | inter-track continuity              |
| `conversationHistory` | last 6 messages    | chat continuity                     |

This gives the model album-level awareness — it knows this is track #3 of 12.

## Tools

### Visible Studio Tools (9)

Defined in `src/components/lyrics-workspace/ai-agent/constants.ts`.

| UI Tool       | Backend Action      | Output Type     | Description                               |
| ------------- | ------------------- | --------------- | ----------------------------------------- |
| ✏️ Написать   | `smart_generate`    | lyrics          | Full text with title, style, Suno tags    |
| ↪️ Продолжить | `continue_line`     | lyrics          | Next line continuation                    |
| 📊 Анализ     | `full_analysis`     | full_analysis   | Meaning, rhythm, rhymes, structure scores |
| 🎧 Продюсер   | `producer_review`   | producer_review | Commercial review, hooks, vocal map       |
| ⚡ Suno       | `optimize_for_suno` | lyrics          | Optimized text + V5 validation            |
| 💬 Рифмы      | `suggest_rhymes`    | rhymes          | Exact, assonance, compound rhymes         |
| 📐 Структура  | `fit_structure`     | lyrics          | Re-arranged text to match a form          |
| 🔀 Стиль      | `style_convert`     | lyrics          | Genre/style rewrite variants              |
| 🌐 Перевод    | `translate_adapt`   | lyrics          | Singable translation preserving rhythm    |

### Hidden Backend Actions

Additional actions exist in the prompt registry but are not all exposed as separate buttons:

- `deep_analysis` — expanded musicological analysis
- `hook_generator` — hook strength assessment + suggestions
- `vocal_map` — per-section vocal production guide
- `paraphrase` — tone variants
- `validate_suno_v5` — deep Suno V5 syntax validation
- `generate_compound_tags` — compound tag generation per section
- `analyze_rhythm` — syllable/stress analysis
- `drill_prompt_builder` — UK/US Drill specialized prompts
- `epic_prompt_builder` — cinematic/orchestral prompts
- `context_recommendations` — album-aware creative suggestions

## Backend Architecture

### Edge Function: `supabase/functions/ai-lyrics-assistant/`

```
ai-lyrics-assistant/
├── index.ts      — auth, meta-tag loading, model call, SSE proxy
├── prompts.ts    — system + user prompt builders per action
├── parser.ts     — JSON extraction, response shaping
└── types.ts      — action enum, genre/mood tag profiles
```

**Model:** `google/gemini-2.5-flash` via Lovable AI Gateway (`ai.gateway.lovable.dev`)

**Auth:** Supabase JWT validation. Handles 429 (rate limit) and 402 (payment required).

**Meta tags:** Loaded from `suno_meta_tags` DB table at request time, injected into the base system prompt.

### Streaming

When `stream: true` is passed:

1. Edge Function proxies provider SSE
2. Forwards `event: chunk` with `{ delta }` to client
3. Accumulates raw text
4. On stream end: parses full response via `parseResponse(action, fullText)`
5. Adds metadata (recommended tags, genre/mood profiles)
6. Emits `event: done` with the final structured result

Client-side streaming in `src/lib/lyrics/streaming.ts`:

- Reads SSE events
- Progressively extracts partial `"lyrics"` JSON field via `extractPartialLyrics()`
- Calls `onLyricsProgress(partial)` for live preview updates
- Trusts the final `done` event for the structured result

### Prompt Registry

**Base system prompt** (`buildBaseSystemPrompt`):

- Role: elite songwriter + producer for Suno AI V5
- Rules: 6-12 syllables per line, cross-rhymes, avoid clichés
- Suno tag library: structural, vocal, instrumental, dynamic, SFX, production
- V5 compound tag syntax: `[Verse 1 | Male Grit Vocal | Aggressive | 808 Bass]`
- Tag order: structure → vocal → dynamics → instruments → effects
- `[End]` is mandatory
- Round brackets `(ooh, aah)` = sung content only, never numbers
- Tag language: English only (no `[Куплет]`)
- Recommended tags from `GENRE_TAG_PROFILES` + `MOOD_TAG_PROFILES`

**Action-specific prompts** (`buildSystemPrompt`):

Each action adds specialization on top of the base prompt. Example for `full_analysis`:

```
Return ONLY valid JSON (no markdown):
{
  "meaning": { "theme", "emotions", "narrative", "issues", "score" },
  "rhythm": { "pattern", "issues", "score" },
  "rhymes": { "scheme", "weakRhymes", "score" },
  "structure": { "tags", "issues", "score" },
  "overallScore", "recommendations", "quickActions"
}
```

### Response Parsing

**Backend** (`parser.ts`):

- Greedy regex JSON extraction (handles nested `}` inside lyrics strings)
- Per-action field mapping
- Metadata injection (recommended tags, genre/mood profiles)

**Frontend** (`src/lib/ai/aiResponseParser.ts`):

- `extractJSON()` — multi-pattern: raw JSON, markdown code fences, trailing comma cleanup
- `parseAIResponse()` — universal dispatcher by action type
- `parseFullAnalysis()` — validates and normalizes analysis fields
- `parseProducerReview()` — validates producer review shape
- `parseLyricsResponse()` — extracts lyrics, falls back to raw text if `[Verse` detected
- `getFallbackAnalysis()` — zero-scored fallback when parsing fails

## Genre & Mood Profiles

Defined in `types.ts`:

**Genres (18):** pop, rock, hip-hop, electronic, r&b, indie, folk, jazz, drill, uk-drill, trap, phonk, cyberpunk, latin, afrobeat, metal, ambient, house

**Moods (10):** romantic, energetic, melancholic, happy, dark, nostalgic, peaceful, epic, aggressive, hypnotic

Each profile provides recommended: vocal style, instruments, dynamics, emotions — injected into the system prompt and returned as metadata for UI tag chips.

## Import / Paste Flow

**Lyrics Studio empty state** (`src/components/lyrics-workspace/LyricsWorkspace.tsx`):

When no sections exist, the user sees an empty state with two paths:

1. **"Вставить текст"** — opens a dialog with a textarea. Pasted text is parsed through `parseLyrics()` from `lyricsEditorHelpers.ts`. If `[Verse]`/`[Chorus]` markers are present, the text is split into separate sections. Unmarked text becomes a single verse.
2. **Create section buttons** — manual section creation (existing flow)

Type mapping between generate-form `LyricSectionType` and lyrics-workspace `LyricsSection["type"]`:

| generate-form | lyrics-workspace |
| ------------- | ---------------- |
| `intro`       | `intro`          |
| `verse`       | `verse`          |
| `pre`         | `prechorus`      |
| `chorus`      | `chorus`         |
| `hook`        | `hook`           |
| `bridge`      | `bridge`         |
| `drop`        | `breakdown`      |
| `breakdown`   | `breakdown`      |
| `outro`       | `outro`          |

## Known Gaps (2026-07-26)

1. **`WriteToolPanel` sends unused fields**: `creativity`, `referenceLyrics`, and project fields are sent but not consumed by `buildUserPrompt("smart_generate")`.
2. **`AnalyzeToolPanel` sends `analysisTypes`**: but `full_analysis` prompt ignores it (always does full analysis).
3. **`useLyricsAssistant.handleSave()` is simulated**: shows a success toast but does not persist to the lyrics-version API.
4. **`LyricsAssistantResponse` type is narrower than actual responses**: missing `producerReview`, validation, hooks, translations, quickActions fields.
5. **Prompt size**: base system prompt is ~200 LOC with a full tag library; action prompts add more. Token cost is non-trivial.

## AI Lyrics Edit (separate)

`supabase/functions/ai-lyrics-edit/` is a narrower endpoint for section-level rewrite/improve/translate. It uses the same Gemini model but simpler prompts. Do not confuse it with the full assistant.

## Related Files

| Layer                | Path                                                           |
| -------------------- | -------------------------------------------------------------- |
| Edge Function        | `supabase/functions/ai-lyrics-assistant/`                      |
| Edge Function (edit) | `supabase/functions/ai-lyrics-edit/`                           |
| API client           | `src/api/lyrics.api.ts`                                        |
| Service layer        | `src/services/lyrics/ai-tools.service.ts`                      |
| Streaming            | `src/lib/lyrics/streaming.ts`                                  |
| Response parser      | `src/lib/ai/aiResponseParser.ts`                               |
| Wizard hook          | `src/hooks/lyrics/useLyricsAssistant.ts`                       |
| Studio agent hook    | `src/components/lyrics-workspace/ai-agent/hooks/useAITools.ts` |
| Tool definitions     | `src/components/lyrics-workspace/ai-agent/constants.ts`        |
| Tool types           | `src/components/lyrics-workspace/ai-agent/types.ts`            |
| Wizard sheet         | `src/components/generate-form/lyrics/LyricsAssistantSheet.tsx` |
| Studio agent         | `src/components/lyrics-workspace/LyricsAIChatAgent.tsx`        |
| Section parser       | `src/pages/lyrics-studio/sections.ts`                          |
| Generate-form parser | `src/components/generate-form/lyricsEditorHelpers.ts`          |
