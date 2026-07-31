import {
  type RecoveryTask,
  type StaleTask,
  type StemTask,
  type TrackVersion,
  type TaskRecoveryStats,
} from "./types.ts";

export async function findRecoveryTasks(
  supabase: any,
  userId: string | null,
  limit: number = 25,
  windowDays: number = 7,
): Promise<RecoveryTask[]> {
  let query = supabase
    .from("generation_tasks")
    .select("*, tracks(*)")
    .eq("status", "completed")
    .not("audio_clips", "is", null)
    .gte("created_at", new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function findStaleTasks(supabase: any, userId: string | null): Promise<StaleTask[]> {
  let query = supabase
    .from("generation_tasks")
    .select("*, tracks(*)")
    .in("status", ["pending", "processing"])
    .lt("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .not("suno_task_id", "is", null);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function findStaleStemTasks(
  supabase: any,
  userId: string | null,
  limit: number = 20,
): Promise<StemTask[]> {
  let query = supabase
    .from("stem_separation_tasks")
    .select("*, tracks(*)")
    .eq("status", "processing")
    .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  if (userId) {
    query = query.eq("tracks.user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function expireStaleGenerations(supabase: any, timeoutMinutes: number = 30): Promise<unknown> {
  const { data, error } = await supabase.rpc("expire_stale_generations", {
    p_timeout_minutes: timeoutMinutes,
  });
  if (error) throw error;
  return data;
}

export async function updateTrackVersion(
  supabase: any,
  versionId: string,
  versionData: Partial<TrackVersion>,
): Promise<void> {
  const { error } = await supabase.from("track_versions").update(versionData).eq("id", versionId);
  if (error) throw error;
}

export async function insertTrackVersion(supabase: any, versionData: Omit<TrackVersion, "id">): Promise<string> {
  const { data, error } = await supabase.from("track_versions").insert(versionData).select("id").single();
  if (error || !data) throw error || new Error("Failed to insert track version");
  return data.id;
}

export async function updateTrack(supabase: any, trackId: string, trackData: Partial<TrackVersion>): Promise<void> {
  const { error } = await supabase.from("tracks").update(trackData).eq("id", trackId);
  if (error) throw error;
}

export async function updateGenerationTask(supabase: any, taskId: string, taskData: any): Promise<void> {
  const { error } = await supabase.from("generation_tasks").update(taskData).eq("id", taskId);
  if (error) throw error;
}

export async function updateStemSeparationTask(supabase: any, taskId: string, taskData: any): Promise<void> {
  const { error } = await supabase.from("stem_separation_tasks").update(taskData).eq("id", taskId);
  if (error) throw error;
}

export async function insertTrackStems(
  supabase: any,
  stems: Array<{ track_id: string; stem_type: string; audio_url: string; separation_mode: string }>,
): Promise<void> {
  const { error } = await supabase.from("track_stems").insert(stems);
  if (error) throw error;
}

export async function logTrackChange(
  supabase: any,
  trackId: string,
  userId: string,
  changeType: string,
  metadata: any,
): Promise<void> {
  const { error } = await supabase.from("track_change_log").insert({
    track_id: trackId,
    user_id: userId,
    change_type: changeType,
    changed_by: "sync_stale_tasks",
    metadata,
  });
  if (error) throw error;
}

export async function insertNotification(
  supabase: any,
  userId: string,
  type: string,
  title: string,
  message: string,
  actionUrl: string,
  groupKey: string,
  metadata: any,
  priority: number,
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    action_url: actionUrl,
    group_key: groupKey,
    metadata,
    priority,
  });
  if (error) throw error;
}

export async function invokeTelegramNotification(supabase: any, chatId: string, payload: any): Promise<void> {
  const { error } = await supabase.functions.invoke("send-telegram-notification", {
    body: payload,
  });
  if (error) throw error;
}

export function calculateRecoveryStats(
  recoveryTasks: RecoveryTask[],
  staleTasks: StaleTask[],
  updatedCount: number,
  completedCount: number,
  failedCount: number,
  stemCheckedCount: number,
  stemCompletedCount: number,
  stemFailedCount: number,
  expired: unknown,
): TaskRecoveryStats {
  return {
    recovered: recoveryTasks.filter((t) => t.tracks?.status !== "completed").length || 0,
    checked: staleTasks.length || 0,
    updated: updatedCount,
    completed: completedCount,
    failed: failedCount,
    stemChecked: stemCheckedCount,
    stemCompleted: stemCompletedCount,
    stemFailed: stemFailedCount,
    expired,
  };
}
