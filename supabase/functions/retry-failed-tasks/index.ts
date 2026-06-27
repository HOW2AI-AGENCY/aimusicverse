import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorize } from "../_shared/auth.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { getApiModelName } from "../_shared/suno-models.ts";

const logger = createLogger("retry-failed-tasks");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const __auth = await authorize(req, { requireAdmin: true });
  if (!__auth.ok) {
    return new Response(JSON.stringify({ error: __auth.error }), {
      status: __auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");

    if (!sunoApiKey) {
      throw new Error("SUNO_API_KEY not configured");
    }

    const supabase = getSupabaseClient();

    const { taskIds, newModel = "V4_5ALL" } = await req.json();

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return new Response(JSON.stringify({ error: "taskIds array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logger.info(`Retrying ${taskIds.length} failed tasks with model: ${newModel}`);

    // Fetch failed tasks with their associated track data
    const { data: failedTasks, error: fetchError } = await supabase
      .from("generation_tasks")
      .select("*, tracks!generation_tasks_track_id_fkey(*)")
      .in("id", taskIds)
      .eq("status", "failed");

    if (fetchError) {
      logger.error("Error fetching tasks:", fetchError);
      throw fetchError;
    }

    if (!failedTasks || failedTasks.length === 0) {
      return new Response(JSON.stringify({ message: "No failed tasks found", retried: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/suno-music-callback`;
    const apiModel = getApiModelName(newModel);

    for (const task of failedTasks) {
      try {
        const track = task.tracks;
        const customMode = task.generation_mode === "custom";
        const instrumental = track?.has_vocals === false;

        // Create new track record
        const { data: newTrack, error: trackError } = await supabase
          .from("tracks")
          .insert({
            user_id: task.user_id,
            project_id: track?.project_id,
            prompt: task.prompt,
            title: track?.title,
            style: track?.style,
            has_vocals: !instrumental,
            status: "pending",
            provider: "suno",
            suno_model: newModel,
            generation_mode: task.generation_mode || "custom",
            vocal_gender: track?.vocal_gender,
            negative_tags: track?.negative_tags,
            artist_id: track?.artist_id,
            artist_name: track?.artist_name,
            artist_avatar_url: track?.artist_avatar_url,
          })
          .select()
          .single();

        if (trackError || !newTrack) {
          logger.error("Error creating track:", trackError);
          results.push({ taskId: task.id, success: false, error: "Failed to create track" });
          continue;
        }

        // Create new generation task
        const { data: newTask, error: taskInsertError } = await supabase
          .from("generation_tasks")
          .insert({
            user_id: task.user_id,
            prompt: task.prompt,
            status: "pending",
            telegram_chat_id: task.telegram_chat_id,
            track_id: newTrack.id,
            source: "retry",
            generation_mode: task.generation_mode || "custom",
            model_used: newModel,
          })
          .select()
          .single();

        if (taskInsertError || !newTask) {
          logger.error("Error creating task:", taskInsertError);
          results.push({ taskId: task.id, success: false, error: "Failed to create task" });
          continue;
        }

        // Prepare Suno API payload - use same format as suno-music-generate
        const sunoPayload: Record<string, unknown> = {
          customMode,
          instrumental,
          model: apiModel, // Use 'model' like in working suno-music-generate
          callBackUrl: callbackUrl,
          prompt: task.prompt,
        };

        if (customMode) {
          if (track?.style) sunoPayload.style = track.style;
          if (track?.title) sunoPayload.title = track.title;
        }

        if (track?.negative_tags) sunoPayload.negativeTags = track.negative_tags;
        if (track?.vocal_gender) sunoPayload.vocalGender = track.vocal_gender;

        logger.info(
          `Calling Suno API for task ${task.id} with model ${apiModel}, payload:`,
          JSON.stringify(sunoPayload),
        );

        // Use /api/v1/generate like in working suno-music-generate
        const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sunoApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sunoPayload),
        });

        const sunoText = await sunoResponse.text();
        logger.info(`Suno API response for task ${task.id}:`, sunoText);

        let sunoData;
        try {
          sunoData = JSON.parse(sunoText);
        } catch (e) {
          logger.error("Failed to parse Suno response:", sunoText);
          results.push({ taskId: task.id, success: false, error: "Invalid Suno response" });
          continue;
        }

        // Check for success - code 200 means success
        if (!sunoResponse.ok || sunoData.code !== 200) {
          logger.error("Suno API error:", sunoData);

          // Update task with error
          await supabase
            .from("generation_tasks")
            .update({
              status: "failed",
              error_message: sunoData.msg || sunoData.message || "Suno API error",
            })
            .eq("id", newTask.id);

          await supabase
            .from("tracks")
            .update({ status: "failed", error_message: sunoData.msg || sunoData.message })
            .eq("id", newTrack.id);

          results.push({
            taskId: task.id,
            newTaskId: newTask.id,
            success: false,
            error: sunoData.msg || sunoData.message || "Suno API error",
          });
          continue;
        }

        // Update task with Suno task ID - data is the taskId string directly per docs
        const sunoTaskId = typeof sunoData.data === "string" ? sunoData.data : sunoData.data?.taskId;
        if (sunoTaskId) {
          await supabase
            .from("generation_tasks")
            .update({
              suno_task_id: sunoTaskId,
              status: "processing",
            })
            .eq("id", newTask.id);

          await supabase
            .from("tracks")
            .update({
              suno_task_id: sunoTaskId,
              status: "processing",
            })
            .eq("id", newTrack.id);
        }

        logger.info(`Successfully started generation for task ${task.id} -> ${newTask.id}`);
        results.push({
          taskId: task.id,
          newTaskId: newTask.id,
          newTrackId: newTrack.id,
          sunoTaskId,
          success: true,
        });

        // Add delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (err) {
        logger.error("Error processing task:", task.id, err);
        results.push({ taskId: task.id, success: false, error: String(err) });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info(`Retry complete: ${successCount}/${failedTasks.length} successful`);

    return new Response(
      JSON.stringify({
        message: `Retried ${successCount} of ${failedTasks.length} tasks`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    logger.error("Error in retry-failed-tasks:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
