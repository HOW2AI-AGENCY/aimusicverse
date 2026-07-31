import { getSupabaseClient } from "../../_shared/supabase-client.ts";
import { createLogger } from "../../_shared/logger.ts";

const supabase = getSupabaseClient();
const logger = createLogger("studio-utils");

export async function handleStudioInstrumental(
  task: any,
  clips: any[],
  studioProjectId: string,
  pendingTrackId: string,
) {
  try {
    const { data: project } = await supabase
      .from("studio_projects")
      .select("tracks")
      .eq("id", studioProjectId)
      .single();
    if (!project) return;

    const versions = clips.slice(0, 2).map((c: any, i: number) => ({
      label: ["A", "B"][i] || `V${i + 1}`,
      audioUrl: c.audioUrl,
      duration: Math.round(c.duration) || 180,
    }));

    const tracks = (project.tracks as any[]) || [];
    const updated = tracks.map((t: any) => {
      if (t.id !== pendingTrackId || t.status !== "pending") return t;
      return {
        ...t,
        status: "ready",
        versions,
        audioUrl: versions[0]?.audioUrl,
        activeVersionLabel: versions[0]?.label || "A",
        clips: versions[0]
          ? [
              {
                id: `clip-${Date.now()}`,
                trackId: t.id,
                audioUrl: versions[0].audioUrl,
                name: t.name.replace(" (генерация...)", ""),
                startTime: 0,
                duration: versions[0].duration,
                trimStart: 0,
                trimEnd: 0,
                fadeIn: 0,
                fadeOut: 0,
              },
            ]
          : [],
        name: t.name.replace(" (генерация...)", ""),
      };
    });

    await supabase
      .from("studio_projects")
      .update({ tracks: updated, updated_at: new Date().toISOString() })
      .eq("id", studioProjectId);
  } catch (e) {
    logger.error("Studio instrumental update error", e);
  }
}

export async function createStudioProject(
  task: any,
  clips: any[],
  trackId: string,
  originalTrackId: string,
  trackTitle: string,
) {
  try {
    const { data: orig } = await supabase
      .from("tracks")
      .select("id, title, audio_url, duration_seconds, style")
      .eq("id", originalTrackId)
      .single();
    const { data: next } = await supabase
      .from("tracks")
      .select("id, title, audio_url, duration_seconds, style")
      .eq("id", trackId)
      .single();
    if (!orig || !next) return;

    const now = Date.now();
    const studioTracks = [
      {
        id: `track-vocal-${now}`,
        name: orig.title || "Вокал",
        type: "vocals",
        audioUrl: orig.audio_url,
        sourceTrackId: orig.id,
        volume: 0.8,
        pan: 0,
        mute: false,
        solo: false,
        status: "ready",
        clips: [
          {
            id: `clip-vocal-${now}`,
            trackId: `track-vocal-${now}`,
            audioUrl: orig.audio_url,
            name: orig.title || "Вокал",
            startTime: 0,
            duration: orig.duration_seconds || 180,
            trimStart: 0,
            trimEnd: 0,
            fadeIn: 0,
            fadeOut: 0,
          },
        ],
      },
      {
        id: `track-instrumental-${now + 1}`,
        name: next.title || "Инструментал",
        type: "instrumental",
        audioUrl: next.audio_url,
        sourceTrackId: next.id,
        volume: 0.7,
        pan: 0,
        mute: false,
        solo: false,
        status: "ready",
        clips: [
          {
            id: `clip-instrumental-${now + 1}`,
            trackId: `track-instrumental-${now + 1}`,
            audioUrl: next.audio_url,
            name: next.title || "Инструментал",
            startTime: 0,
            duration: next.duration_seconds || 180,
            trimStart: 0,
            trimEnd: 0,
            fadeIn: 0,
            fadeOut: 0,
          },
        ],
      },
    ];

    const { data: newProject } = await supabase
      .from("studio_projects")
      .insert({
        user_id: task.user_id,
        source_track_id: orig.id,
        name: `${orig.title || "Трек"} + Инструментал`,
        description: "Автоматически создано из добавления инструментала",
        status: "draft",
        stems_mode: "simple",
        tracks: studioTracks,
        duration_seconds: Math.max(orig.duration_seconds || 180, next.duration_seconds || 180),
      })
      .select("id")
      .single();

    if (newProject) {
      await supabase.from("notifications").insert({
        user_id: task.user_id,
        type: "studio_ready",
        title: "Инструментал готов! 🎸",
        message: `Инструментал для "${orig.title || "трека"}" готов. Открыть студию для сведения?`,
        action_url: `/studio-v2/project/${newProject.id}`,
        metadata: {
          studio_project_id: newProject.id,
          original_track_id: originalTrackId,
          instrumental_track_id: trackId,
        },
      });
    }
  } catch (e) {
    logger.error("Studio project creation error", e);
  }
}
