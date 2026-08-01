import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorize } from "../_shared/auth.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { calculateRecoveryStats } from "./queries.ts";
import { recoverCompletedTasks } from "./phases/recovery.ts";
import { processStaleTasks, type StaleTaskResult } from "./phases/stale-tasks.ts";
import { processStaleStems, expireVeryOld, type StemResult } from "./phases/stems.ts";

const logger = createLogger("sync-stale-tasks");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await authorize(req, { requireAdmin: true });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");
    if (!sunoApiKey) throw new Error("SUNO_API_KEY not configured");

    const supabase = getSupabaseClient();

    let userId: string | null = null;
    try {
      const body = await req.json();
      userId = body?.user_id || null;
    } catch {
      // no body, proceed without filter
    }

    logger.info("Starting stale tasks sync", { userId: userId || "all users" });

    const recovered = await recoverCompletedTasks(supabase, userId);
    const staleResult: StaleTaskResult = await processStaleTasks(supabase, sunoApiKey, userId);
    const stemResult: StemResult = await processStaleStems(supabase, sunoApiKey, userId);
    const expired = await expireVeryOld(supabase);

    logger.info("Sync completed", {
      recovered,
      checked: staleResult.updated + staleResult.completed + staleResult.failed,
      ...staleResult,
      ...stemResult,
      expired,
    });

    return new Response(JSON.stringify({ success: true, recovered, ...staleResult, ...stemResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logger.error("Error in sync-stale-tasks", error);
    return new Response(JSON.stringify({ success: false, error: error.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
