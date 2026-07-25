import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger("retry-track-processing");

/**
 * Retries version/cover reconstruction for a track whose Suno callback was
 * partial or arrived out of order. Idempotent: `rebuild_track_versions_from_task`
 * only fills in missing rows and never overwrites existing audio/cover URLs.
 *
 * Auth model:
 *  - Requires a signed-in user (JWT is inspected explicitly — do not rely on
 *    verify_jwt because this project's edge functions run with it disabled).
 *  - The RPC re-checks that the caller owns the task (or is admin).
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Server not configured" }, 500);
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Missing bearer token" }, 401);
    }
    const jwt = authHeader.slice(7).trim();

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRes, error: authErr } = await admin.auth.getUser(jwt);
    if (authErr || !userRes?.user) {
      return json({ error: "Invalid token" }, 401);
    }
    const userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const trackId = typeof body?.track_id === "string" ? body.track_id : null;
    if (!trackId) return json({ error: "track_id is required" }, 400);

    // Locate the most recent task for this track and verify ownership
    const { data: task, error: taskErr } = await admin
      .from("generation_tasks")
      .select("id, user_id, track_id, status, audio_clips")
      .eq("track_id", trackId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (taskErr) return json({ error: taskErr.message }, 500);
    if (!task) return json({ error: "No generation task found for this track" }, 404);

    if (task.user_id !== userId) {
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
      if (!isAdmin) return json({ error: "Not authorized" }, 403);
    }

    // Delegate to the SECURITY DEFINER RPC (service_role only)
    const { data: rebuild, error: rpcErr } = await admin.rpc(
      "rebuild_track_versions_from_task",
      { p_task_id: task.id, p_caller: userId },
    );
    if (rpcErr) return json({ error: rpcErr.message }, 500);

    const summary = Array.isArray(rebuild) ? rebuild[0] : rebuild;

    // Emit a metric so we can measure retry success rate
    const { error: metricError } = await admin.from("generation_skip_metrics").insert({
      task_id: task.id,
      track_id: trackId,
      user_id: userId,
      code: "retry_requested",
      source: "retry_endpoint",
      message: `created=${summary?.versions_created ?? 0} updated=${summary?.versions_updated ?? 0}`,
    });
    if (metricError) {
      logger.warn("Failed to record retry metric", { trackId, taskId: task.id, error: metricError.message });
    }

    return json(
      {
        ok: true,
        task_id: task.id,
        versions_created: summary?.versions_created ?? 0,
        versions_updated: summary?.versions_updated ?? 0,
        active_version: summary?.active_version ?? null,
      },
      200,
    );
  } catch (err) {
    logger.error("retry-track-processing failed", err);
    return json({ error: (err as Error).message ?? "Unknown error" }, 500);
  }
});

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
