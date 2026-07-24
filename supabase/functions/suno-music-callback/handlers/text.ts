/**
 * Text callback handler.
 *
 * Suno's earliest callback (typically arrives 10-30s after task submission)
 * carries the AI-generated title and lyrics for the track BEFORE any audio
 * is ready. Surfacing this data immediately gives the user a meaningful
 * label + lyrics preview while the audio is still rendering, instead of
 * showing "Трек" placeholder until the "first" callback lands.
 */

import { getSupabaseClient } from "../../_shared/supabase-client.ts";
import { createLogger } from "../../_shared/logger.ts";
import { sanitizeAndCleanTitle } from "../../_shared/track-naming.ts";

const logger = createLogger("text-callback");

export async function handleTextCallback(payload: any, task: any) {
  const trackId = task.track_id;
  const clips: any[] = payload?.data?.data ?? [];
  const first = clips[0] ?? {};

  const rawTitle = first.title || first.name || task.tracks?.title;
  const cleanedTitle = sanitizeAndCleanTitle(rawTitle, "Трек");
  const lyrics = first.prompt || first.lyric || first.lyrics || null;
  const tags = first.tags || first.style || null;

  logger.info("Text callback", {
    trackId,
    hasTitle: !!rawTitle,
    hasLyrics: !!lyrics,
    hasTags: !!tags,
    availableKeys: Object.keys(first),
  });

  const supabase = getSupabaseClient();

  const trackUpdate: Record<string, unknown> = {
    title: cleanedTitle,
    status: "processing",
  };
  if (lyrics) trackUpdate.lyrics = lyrics;
  if (tags && typeof tags === "string") trackUpdate.style = tags;

  await supabase.from("tracks").update(trackUpdate).eq("id", trackId);

  await supabase
    .from("generation_tasks")
    .update({ status: "processing" })
    .eq("id", task.id);

  return {
    success: true,
    callbackType: "text",
    trackId,
    trackTitle: cleanedTitle,
  };
}
