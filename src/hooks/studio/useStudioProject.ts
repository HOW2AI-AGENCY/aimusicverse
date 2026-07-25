import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useUnifiedStudioStore,
  StudioTrack,
  StudioProject,
  TrackType,
  TRACK_COLORS,
} from "@/stores/useUnifiedStudioStore";
import { toast } from "sonner";

interface UseStudioProjectReturn {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  project: StudioProject | null;
  loadProject: (projectId: string) => Promise<boolean>;
  createFromTrack: (trackId: string) => Promise<string | null>;
  createEmptyProject: (name: string) => Promise<string | null>;
  addTrackFromUrl: (url: string, name: string, type: TrackType) => void;
  deleteProject: (projectId: string) => Promise<boolean>;
  saveProject: () => Promise<boolean>;
}

export function useStudioProject(): UseStudioProjectReturn {
  const { user } = useAuth();
  const store = useUnifiedStudioStore();
  const {
    project,
    isLoading,
    isSaving,
    loadProject: storeLoadProject,
    createProject: storeCreateProject,
    saveProject: storeSaveProject,
    deleteProject: storeDeleteProject,
    addTrack,
  } = store;

  const loadProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      return await storeLoadProject(projectId);
    },
    [storeLoadProject],
  );

  const createFromTrack = useCallback(
    async (trackId: string): Promise<string | null> => {
      try {
        // Fetch track data
        const { data: track, error: trackError } = await supabase
          .from("tracks")
          .select("title, audio_url, streaming_url, local_audio_url, duration_seconds")
          .eq("id", trackId)
          .single();

        if (trackError) throw trackError;
        if (!track) throw new Error("Track not found");

        const audioUrl = track.streaming_url || track.local_audio_url || track.audio_url || undefined;

        const projectId = await storeCreateProject({
          name: `Проект: ${track.title || "Без названия"}`,
          userId: user?.id,
          sourceTrackId: trackId,
          sourceAudioUrl: audioUrl,
          duration: track.duration_seconds || undefined,
          tracks: audioUrl
            ? [
                {
                  name: track.title || "Основной трек",
                  type: "main",
                  audioUrl,
                  volume: 0.85,
                  pan: 0,
                  muted: false,
                  solo: false,
                  color: TRACK_COLORS.main,
                  status: "ready",
                },
              ]
            : [],
        });

        if (projectId) {
          toast.success("Проект создан");
        }
        return projectId;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create project";
        toast.error("Ошибка создания проекта", { description: message });
        return null;
      }
    },
    [storeCreateProject, user?.id],
  );

  const createEmptyProject = useCallback(
    async (name: string): Promise<string | null> => {
      try {
        const projectId = await storeCreateProject({
          name: name || "Новый проект",
          userId: user?.id,
        });

        if (projectId) {
          toast.success("Проект создан");
        }
        return projectId;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create project";
        toast.error("Ошибка создания проекта", { description: message });
        return null;
      }
    },
    [storeCreateProject],
  );

  const addTrackFromUrl = useCallback(
    (url: string, name: string, type: TrackType): void => {
      if (!project) {
        toast.error("Нет активного проекта");
        return;
      }

      addTrack({
        name,
        type,
        audioUrl: url,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        color: TRACK_COLORS[type] || TRACK_COLORS.other,
      });

      toast.success(`Дорожка "${name}" добавлена`);
    },
    [project, addTrack],
  );

  const deleteProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      const success = await storeDeleteProject(projectId);
      if (success) {
        toast.success("Проект удалён");
      } else {
        toast.error("Ошибка удаления");
      }
      return success;
    },
    [storeDeleteProject],
  );

  const saveProject = useCallback(async (): Promise<boolean> => {
    return await storeSaveProject();
  }, [storeSaveProject]);

  return {
    isLoading,
    isSaving,
    error: null,
    project,
    loadProject,
    createFromTrack,
    createEmptyProject,
    addTrackFromUrl,
    deleteProject,
    saveProject,
  };
}
