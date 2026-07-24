// DB helpers for suno-music-generate: track/task creation and failure handling
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger("suno-music-generate");

export interface CreateTrackParams {
  userId: string;
  projectId?: string | null;
  planTrackId?: string | null;
  parentTrackId?: string | null;
  prompt?: string;
  title?: string | null;
  style?: string | null;
  instrumental: boolean;
  isPublic: boolean;
  mode: string;
  model: string;
  vocalGender?: string;
  styleWeight?: number;
  negativeTags?: string;
  customMode: boolean;
  artistData: { id: string; name: string; avatar_url: string | null } | null;
  creatorDisplayName: string | null;
}

export async function createTrackRecord(supabase: any, p: CreateTrackParams) {
  const { data: track, error: trackError } = await supabase
    .from("tracks")
    .insert({
      user_id: p.userId,
      project_id: p.projectId,
      project_track_id: p.planTrackId || null,
      prompt: p.prompt,
      title: p.customMode ? p.title : null,
      style: p.style,
      has_vocals: !p.instrumental,
      status: "pending",
      provider: "suno",
      suno_model: p.model,
      generation_mode: p.mode,
      vocal_gender: p.vocalGender,
      style_weight: p.styleWeight,
      negative_tags: p.negativeTags,
      is_public: p.isPublic,
      parent_track_id: p.parentTrackId || null,
      artist_id: p.artistData?.id || null,
      artist_name: p.artistData?.name || null,
      artist_avatar_url: p.artistData?.avatar_url || null,
      creator_display_name: p.creatorDisplayName,
    })
    .select()
    .single();

  if (trackError || !track) {
    logger.error("Track creation error", trackError);
    throw new Error("Failed to create track record");
  }
  return track;
}

export async function createGenerationTask(
  supabase: any,
  params: {
    userId: string;
    prompt?: string;
    telegramChatId: number | null;
    trackId: string;
    mode: string;
    model: string;
    planTrackId?: string | null;
  },
) {
  const { data: task, error: taskError } = await supabase
    .from("generation_tasks")
    .insert({
      user_id: params.userId,
      prompt: params.prompt,
      status: "pending",
      telegram_chat_id: params.telegramChatId,
      track_id: params.trackId,
      source: "mini_app",
      generation_mode: params.mode,
      model_used: params.model,
      audio_clips: params.planTrackId ? JSON.stringify({ project_track_id: params.planTrackId }) : null,
    })
    .select()
    .single();

  if (taskError || !task) {
    logger.error("Task creation error", taskError);
    throw new Error("Failed to create generation task");
  }
  return task;
}

export async function markFailure(
  supabase: any,
  taskId: string,
  trackId: string,
  errorMessage: string,
) {
  await supabase
    .from("generation_tasks")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", taskId);
  await supabase
    .from("tracks")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", trackId);
}

export async function updateFallbackModel(
  supabase: any,
  taskId: string,
  trackId: string,
  currentModel: string,
) {
  await supabase.from("generation_tasks").update({ model_used: currentModel }).eq("id", taskId);
  await supabase.from("tracks").update({ suno_model: currentModel }).eq("id", trackId);
}

export async function bindSunoTaskId(
  supabase: any,
  taskId: string,
  trackId: string,
  sunoTaskId: string,
) {
  await supabase
    .from("generation_tasks")
    .update({ suno_task_id: sunoTaskId, status: "processing" })
    .eq("id", taskId);
  await supabase
    .from("tracks")
    .update({ suno_task_id: sunoTaskId, status: "processing" })
    .eq("id", trackId);
}
