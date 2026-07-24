/**
 * Regression guard: ensures every Suno callback / recovery handler routes
 * raw-clip URL and model access through `_shared/suno-clip-fields.ts`.
 *
 * The July 2026 outage — tracks stuck in `completed` state without audio,
 * cover, or versions — was caused by handlers reading `clip.audio_url` /
 * `clip.audioUrl` directly. Suno then flipped payload casing and half the
 * paths silently dropped the URL.
 *
 * If this test fails, import `getAudioUrl` / `getImageUrl` / `getStreamUrl`
 * / `getModelName` / `extractClipFields` from `_shared/suno-clip-fields.ts`
 * in the offending file instead of reading the fields off the raw clip.
 *
 * NOTE: DB-row access (e.g. `track.audio_url`, `sourceTrack.audio_url`) is
 * fine — those are already-normalized columns. This test only flags the
 * known raw-clip identifiers below.
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { fromFileUrl } from "https://deno.land/std@0.224.0/path/mod.ts";

const FORBIDDEN_FIELDS = [
  "audioUrl",
  "audio_url",
  "imageUrl",
  "image_url",
  "streamAudioUrl",
  "stream_audio_url",
  "sourceAudioUrl",
  "source_audio_url",
  "sourceImageUrl",
  "source_image_url",
  "modelName",
  "model_name",
];

// Identifiers that reference a RAW Suno clip payload (as delivered by the
// vendor). Accessing forbidden fields on these values is the bug we prevent.
// Do NOT add locally-constructed / already-normalized arrays here
// (e.g. `audioClipsData`, `stemsToInsert`).
const RAW_CLIP_IDENTIFIERS = [
  "clip",
  "clips",
  "firstClip",
  "first",
  "coverInfo",
  "clipData",
];

const ALLOWLIST_SUBSTRINGS = [
  "/_shared/suno-clip-fields.ts",
  "/_shared/suno-clip-fields_test.ts",
  "/_shared/suno-clip-fields_regression_test.ts",
  "/telegram-bot/",
  "/send-telegram-notification/",
];

Deno.test("suno callback handlers must use shared clip-field helpers", async () => {
  const functionsRoot = fromFileUrl(new URL("../", import.meta.url));
  const offenders: string[] = [];

  for await (const entry of walk(functionsRoot, { exts: [".ts"], includeDirs: false })) {
    if (ALLOWLIST_SUBSTRINGS.some((s) => entry.path.includes(s))) continue;
    if (!/suno-.*callback|suno-music|sync-stale-tasks|suno-remix|suno-extend|suno-persona|suno-cover|suno-vocal/i.test(entry.path)) {
      continue;
    }
    const source = await Deno.readTextFile(entry.path);
    const lines = source.split("\n");

    for (const ident of RAW_CLIP_IDENTIFIERS) {
      for (const field of FORBIDDEN_FIELDS) {
        // Match `clip.audioUrl`, `clips[0]?.audio_url`, `first.imageUrl`, etc.
        const re = new RegExp(`\\b${ident}\\b(?:\\[[^\\]]*\\])?\\??\\.${field}\\b`);
        lines.forEach((line, idx) => {
          if (re.test(line)) {
            offenders.push(
              `${entry.path}:${idx + 1} — ${ident}.${field} (use helpers from _shared/suno-clip-fields.ts)`,
            );
          }
        });
      }
    }
  }

  assertEquals(
    offenders,
    [],
    `Direct clip-field access detected. Import from _shared/suno-clip-fields.ts.\n` +
      offenders.join("\n"),
  );
});
