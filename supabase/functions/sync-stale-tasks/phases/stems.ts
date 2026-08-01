import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { getAudioUrl, getImageUrl, getStreamUrl } from "../../_shared/suno-clip-fields.ts";
import { isProviderSuccess, downloadAndUpload } from "../utils.ts";
import type { StemTask } from "../types.ts";

const logger = createLogger("sync-stale-tasks:stems");

const STEM_URL = "https://api.sunoapi.org/api/v1/vocal-removal/record-info";

export interface StemResult {
  checked: number;
  completed: number;
  failed: number;
}

/** Recover stem-separation tasks stuck in processing when provider callback lost. */
export async function processStaleStems(
  supabase: SupabaseClient,
  sunoApiKey: string,
  userId: string | null,
): Promise<StemResult> {
  let query = supabase
    .from("stem_separation_tasks")
    .select("*, tracks(*)")
    .eq("status", "processing")
    .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .order("created_at", { ascending: true })
    .limit(20);

  if (userId) query = query.eq("tracks.user_id", userId);

  const { data: tasks, error } = await query;
  if (error) {
    logger.error("Error fetching stale stem tasks", error);
    return { checked: 0, completed: 0, failed: 0 };
  }

  logger.info("Found stale stem tasks to check with Suno API", { count: tasks?.length || 0 });

  let checked = 0,
    completed = 0,
    failed = 0;

  for (const stemTask of tasks || []) {
    checked++;
    const sepId = stemTask.separation_task_id;
    if (!sepId) continue;

    try {
      const resp = await fetch(`${STEM_URL}?taskId=${sepId}`, {
        headers: { Authorization: `Bearer ${sunoApiKey}`, "Content-Type": "application/json" },
      });

      if (!resp.ok) {
        logger.error("Suno stem HTTP error", null, {
          taskId: stemTask.id,
          separationTaskId: sepId,
          status: resp.status,
        });
        continue;
      }

      const data = await resp.json();
      const info = data?.response?.vocal_removal_info || data?.vocal_removal_info || data?.data?.vocal_removal_info;

      if (!info || !isProviderSuccess(info.status)) {
        logger.info("Stem still processing or no info", { taskId: stemTask.id, status: info?.status });
        continue;
      }

      const stemsToInsert: Array<{ track_id: string; stem_type: string; audio_url: string; separation_mode: string }> =
        [];
      const newStems: string[] = [];

      const STEM_TYPES: Record<string, string> = {
        vocal_url: "vocal",
        instrumental_url: "instrumental",
        backing_vocals_url: "backing_vocals",
        drums_url: "drums",
        bass_url: "bass",
        guitar_url: "guitar",
        keyboard_url: "keyboard",
        strings_url: "strings",
        brass_url: "brass",
        woodwinds_url: "woodwinds",
        percussion_url: "percussion",
        synth_url: "synth",
        fx_url: "fx",
        other_url: "other",
      };

      for (const [field, stemType] of Object.entries(STEM_TYPES)) {
        const url = info[field] as string | undefined;
        if (!url) continue;

        const path = `stems/${stemTask.tracks?.user_id || "unknown"}/${stemTask.track_id}_${stemType}_${Date.now()}.mp3`;
        const localUrl = await downloadAndUpload(supabase, url, path, "audio/mpeg");
        stemsToInsert.push({
          track_id: stemTask.track_id,
          stem_type: stemType,
          audio_url: localUrl || url,
          separation_mode: stemTask.tracks?.generation_mode || "vocal_removal",
        });
        newStems.push(stemType);
      }

      if (stemsToInsert.length > 0) {
        const { error: insertError } = await supabase.from("track_stems").insert(stemsToInsert);
        if (insertError) {
          logger.error("Failed to insert stems", insertError, { trackId: stemTask.track_id });
        } else {
          await supabase.from("tracks").update({ has_stems: true }).eq("id", stemTask.track_id);
        }
      }

      await supabase
        .from("stem_separation_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", stemTask.id);

      await supabase.from("track_change_log").insert({
        track_id: stemTask.track_id,
        user_id: stemTask.tracks?.user_id,
        change_type: "vocal_separation_completed",
        changed_by: "sync_stale_tasks",
        metadata: {
          stems_created: newStems.length,
          stem_types: stemsToInsert.map((s) => s.stem_type),
          separation_task_id: sepId,
          auto_synced: true,
        },
      });

      completed++;
    } catch (err) {
      logger.error("Error processing stale stem task", err, { taskId: stemTask.id });
    }
  }

  return { checked, completed, failed };
}

export async function expireVeryOld(supabase: SupabaseClient): Promise<unknown> {
  const { data, error } = await supabase.rpc("expire_stale_generations", { p_timeout_minutes: 30 });
  if (error) {
    logger.error("Failed to expire stale generations", error);
    return null;
  }
  logger.info("Expired stale generations", { expired: data });
  return data;
}
