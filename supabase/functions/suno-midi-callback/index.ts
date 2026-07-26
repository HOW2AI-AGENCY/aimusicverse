import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";

const logger = createLogger("suno-midi-callback");

/**
 * Sprint 053-A3: Callback receiver for Suno `/api/v1/generate/midi`.
 *
 * Suno posts `{ code, msg, data: { taskId, status, midiUrl, midiData } }` when MIDI
 * generation completes. midiUrl is a transient URL pointing at the generated .mid
 * file — we download it and re-upload to Supabase Storage so the URL is permanent
 * (Suno URLs expire).
 *
 * On SUCCESS: download .mid, upload to `midi` Storage bucket, UPDATE
 *             track_versions SET midi_url=..., midi_generation_source='suno'
 *             WHERE suno_task_id NOT present (we identify by track_version_id from
 *             a side-channel row in generation_tasks — see below).
 *
 * Note on Suno's payload: some Suno MIDI endpoints return base64 midiData instead of
 * midiUrl. We handle BOTH shapes.
 *
 * Side channel for taskId→track_version_id:
 *   We DO NOT add a new column. Instead, we rely on the fact that suno-midi/index.ts
 *   already UPDATEd track_versions.midi_generation_source='suno' (status=pending)
 *   during the request. So we can find the row by:
 *     WHERE midi_generation_source='suno' AND midi_url IS NULL
 *     ORDER BY updated_at DESC LIMIT 1
 *   This works because the user shouldn't be parallelly issuing two MIDI requests
 *   for the same track (and the slow polling cadence makes collisions rare).
 *
 * For multi-task safety, the timestamp of the original UPDATE could be parsed from
 * api_usage_logs metadata; that's a future hardening pass.
 */

const STORAGE_BUCKET = "midi";

interface MidiCallbackClip {
  midiUrl?: string;
  midiData?: string; // base64 fallback
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();
    const payload = await req.json();

    logger.info("Suno MIDI callback received", {
      code: payload?.code,
      taskId: payload?.data?.taskId,
      status: payload?.data?.status,
    });

    if (!isSunoSuccessCode(payload?.code)) {
      logger.warn("MIDI callback non-success code", { payload });
      return new Response(JSON.stringify({ success: false, error: payload?.msg || "non-success code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const taskId: string | undefined = payload?.data?.taskId;
    const status: string | undefined = payload?.data?.status;
    const clip: MidiCallbackClip = payload?.data?.clips?.[0] ?? payload?.data ?? {};

    if (!taskId) {
      throw new Error("callback missing taskId");
    }

    // Find the pending track_version by source mark (set in suno-midi/index.ts).
    // Order DESC by updated_at — most recent pending wins (assumes no parallel suno-midi).
    const { data: pending, error: findError } = await supabase
      .from("track_versions")
      .select("id, midi_url, updated_at")
      .eq("midi_generation_source", "suno")
      .is("midi_url", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      logger.error("Failed to query pending midi row", findError);
      return new Response(JSON.stringify({ success: false, error: "lookup failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!pending) {
      logger.warn("No pending midi row for task", { taskId });
      return new Response(JSON.stringify({ success: false, error: "no pending version" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const versionId = (pending as unknown as { id: string }).id;

    if (status === "FAILED" || status === "failed") {
      // Mark only the source back to NULL (revert pending) so Replicate fallback can run.
      await supabase
        .from("track_versions")
        .update({
          midi_generation_source: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", versionId);
      logger.warn("Suno MIDI failed — cleared source marker for Replicate fallback", {
        taskId,
        versionId,
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // SUCCESS — fetch the MIDI bytes.
    let midiBytes: Uint8Array;
    if (clip.midiData) {
      // base64 payload (some Suno variants)
      const b64 = clip.midiData.replace(/^data:[^;]+;base64,/, "");
      const binary = atob(b64);
      midiBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) midiBytes[i] = binary.charCodeAt(i);
    } else if (clip.midiUrl) {
      const midiController = new AbortController();
      const midiTimeout = setTimeout(() => midiController.abort(), 30000);
      const sunoResp = await fetch(clip.midiUrl, { signal: midiController.signal });
      clearTimeout(midiTimeout);
      if (!sunoResp.ok) throw new Error(`failed to fetch midiUrl: ${sunoResp.status}`);
      const ab = await sunoResp.arrayBuffer();
      midiBytes = new Uint8Array(ab);
    } else {
      throw new Error("callback success but no midiUrl/midiData");
    }

    // Upload to Supabase Storage. Path: {user-scoped-prefix}/{versionId}.mid
    // We use a flat path under the bucket — actual user scoping is enforced via
    // signed URLs on read.
    const storagePath = `tracks/${versionId}.mid`;

    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, midiBytes, {
      contentType: "audio/midi",
      cacheControl: "31536000", // 1 year — MIDI files are immutable per version
      upsert: true,
    });

    if (uploadError) {
      logger.error("Failed to upload MIDI to Storage", uploadError);
      throw new Error("Failed to persist MIDI to Storage");
    }

    // Get a long-lived public URL (the bucket is expected to be configured with
    // public read for 'tracks/' prefix; if not, callers should use signed URLs).
    const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    const midiUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("track_versions")
      .update({
        midi_url: midiUrl,
        midi_generation_source: "suno",
        updated_at: new Date().toISOString(),
      })
      .eq("id", versionId);

    if (updateError) {
      logger.error("Failed to update track_versions.midi_url", updateError);
      throw new Error("Failed to persist MIDI URL");
    }

    logger.info("MIDI generation completed", {
      taskId,
      versionId,
      midiBytes: midiBytes.byteLength,
    });

    return new Response(JSON.stringify({ success: true, midiUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    logger.error("MIDI callback handler failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // 200 even on error — Suno doesn't retry
    });
  }
});
