# Supabase audit: audio storage, stems, request/response logging

_Date: 2026-06-27 · scope: filtering & grouping readiness for music data_

This audit answers: **where exactly do we store audio / stems, and where do
prompts, tags, genres, model params, request/response bodies land so we can
filter and group later?**

## 1. Storage buckets

| Bucket | Public | What lives here |
| --- | --- | --- |
| `audio` | private | Master track audio (`tracks.audio_url`, `local_audio_url`) |
| `audio-references` | private | User-uploaded reference clips for cover/extend |
| `reference-audio` | private | Curated reference library (`reference_audio` table) |
| `stems` | private | Separated stems (`track_stems.audio_url`) |
| `voice-sources` | private | Voice clone training samples (`custom_voices`) |
| `voice-verifications` | private | Voice verification artefacts |
| `project-assets-private` | private | Studio project working files |
| `project-assets` | public | Published project deliverables |
| `project-banners` | public | Project cover banners |
| `avatars` | public | User avatars |
| `bot-assets` | public | Telegram bot static assets |
| `broadcast` | public | Broadcast campaign attachments |

**Gap:** no dedicated bucket for HD/upscaled audio — currently overwritten on
`tracks.audio_url_hd` pointing back into `audio`. Consider `audio-hd` or a
`hd/` prefix if we want lifecycle rules separate from masters.

## 2. Where prompts / tags / genres live

### `tracks` (64 cols) — the canonical row per generated song

| Concept | Column | Type | Notes |
| --- | --- | --- | --- |
| User prompt | `prompt` | text | Free-form |
| Lyrics | `lyrics` | text | |
| Style description | `style` | varchar | Plain-text style summary |
| Tags / genres | `tags` | text | **Comma-separated string** — not GIN-indexable |
| Negative tags | `negative_tags` | text | |
| Computed genre | `computed_genre` | text | ML-derived, single value |
| Computed mood | `computed_mood` | text | ML-derived |
| Model | `model_name`, `suno_model` | varchar | |
| Style weight | `style_weight` | numeric | Suno param |
| Vocal gender | `vocal_gender` | varchar | |
| Has vocals | `has_vocals` | boolean | |
| Instrumental | `is_instrumental` | boolean | |
| Reference audio | `reference_audio_url` | text | |
| Quality / trending | `quality_score`, `trending_score` | numeric | |
| Audio HD / watermark | `audio_url_hd`, `watermarked_url`, `watermark_status` | text | |

### `track_stems`
`stem_type`, `separation_mode`, `generation_prompt`, `generation_model`,
`status` — enough to filter by source and stem kind.

### `generation_tasks` — pre-callback request state
`prompt`, `audio_clips` (jsonb), `generation_mode`, `model_used`, `source`,
`expected_clips`, `received_clips`, `suno_task_id`, `callback_received_at`.

### `api_usage_logs` — full request/response
`service`, `endpoint`, `method`, `request_body` (jsonb), `response_body`
(jsonb), `response_status`, `duration_ms`, `estimated_cost`. **This is the
table for granular request-level filtering** — `request_body.prompt`,
`request_body.tags`, `request_body.model` are all queryable via `->>`.

### `content_audit_log` — auditable AI activity chain
`entity_type`, `entity_id`, `actor_type`, `ai_model_used`, `action_type`,
`action_category`, `prompt_used`, `prompt_hash`, `input_metadata` (jsonb),
`output_metadata` (jsonb), `chain_id`. Good for grouping a generation +
its derivatives (extend, cover, stems).

### `track_change_log` — per-field history
`change_type`, `field_name`, `old_value`, `new_value`, `ai_model_used`,
`prompt_used`, `metadata` (jsonb).

## 3. Filtering & grouping gaps

| Gap | Why it hurts | Proposed fix |
| --- | --- | --- |
| `tracks.tags` is a comma-separated text | Can't index, can't `?` filter, fuzzy joins to `track_tags` | Migrate to `text[]` + GIN, or rely solely on `track_tags` join table |
| No FTS index on `tracks.prompt` / `lyrics` | Search-by-prompt scans rows | `tsvector` generated column + GIN |
| `computed_genre` is single value | Songs are often multi-genre | Make `text[]` or use `track_tags` taxonomy |
| `generation_tasks.prompt` not indexed | Slow filtering by recent prompt | `CREATE INDEX … (prompt gin_trgm_ops)` |
| `api_usage_logs.request_body` not indexed | jsonb `->>` filters scan | `CREATE INDEX … USING GIN (request_body jsonb_path_ops)` |
| No partition on `api_usage_logs` | Table grows unbounded; archive table exists but no policy | Time partition + monthly archive job |

## 4. Recommended next steps (non-blocking)

1. **Tag normalization migration.** Backfill `track_tags` from
   `tracks.tags` comma-split, then deprecate the string column.
2. **`tsvector` for prompt/lyrics search.** Add generated column +
   GIN; expose `usePromptSearch` hook.
3. **jsonb path index** on `api_usage_logs.request_body` for the keys
   we filter on: `model`, `prompt`, `tags`.
4. **`audio-hd` bucket** to separate masters from HD renders so
   storage lifecycle / CDN cache can diverge.
5. **Group-by chain.** `content_audit_log.chain_id` already exists —
   surface it in the admin UI so a song + every derivative is one row.

## 5. Already healthy

- All audio/stems live in **private** buckets, public access goes through
  signed URLs / RLS — no leakage path.
- `api_usage_logs.request_body` + `response_body` already capture the
  full request/response for every Suno call; only indexing is missing.
- `content_audit_log` and `track_change_log` give us a full edit history
  with the prompt used — enough to reconstruct what happened.
