/**
 * useProjectDetailHandlers - Event handlers for ProjectDetail
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { usePlanTrackStore } from "@/stores/planTrackStore";
import { useTelegram } from "@/contexts/TelegramContext";
import type { ProjectTrack } from "@/hooks/useProjectTracks";

interface UseProjectDetailHandlersProps {
  projectId?: string;
  project?: {
    id: string;
    title: string;
    cover_url?: string | null;
    genre?: string | null;
    mood?: string | null;
    language?: string | null;
    description?: string | null;
    concept?: string | null;
  } | null;
  tracks?: ProjectTrack[] | null;
  reorderTracks: (updates: { id: string; position: number }[]) => void;
  updateTrack: (params: { id: string; updates: Partial<ProjectTrack> }) => void;
}

export function useProjectDetailHandlers({
  projectId,
  project,
  tracks,
  reorderTracks,
  updateTrack,
}: UseProjectDetailHandlersProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPlanTrackContext } = usePlanTrackStore();
  const { shareToStory, shareURL, platform, isDevelopmentMode, hapticFeedback } = useTelegram();

  const isRealMiniApp = platform && platform !== "web" && platform !== "" && !isDevelopmentMode;

  // Apply project updates
  const handleApplyUpdates = useCallback(
    async (updates: Record<string, string | number | boolean | null>) => {
      if (!project) return;

      try {
        const { error } = await supabase
          .from("music_projects")
          .update(updates as any)
          .eq("id", project.id);

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      } catch (error) {
        logger.error("Error updating project", error);
        throw error;
      }
    },
    [project, queryClient],
  );

  // Drag and drop reorder
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !tracks) return;

      const oldIndex = tracks.findIndex((t) => t.id === String(active.id));
      const newIndex = tracks.findIndex((t) => t.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(tracks, oldIndex, newIndex);
      const updates = reordered.map((track, index) => ({
        id: track.id,
        position: index + 1,
      }));

      reorderTracks(updates);
    },
    [tracks, reorderTracks],
  );

  // Generate from plan track
  const handleGenerateFromPlan = useCallback(
    (track: ProjectTrack) => {
      if (!project) return;

      setPlanTrackContext({
        planTrackId: track.id,
        planTrackTitle: track.title,
        stylePrompt: track.style_prompt,
        notes: track.notes,
        lyrics: track.lyrics || undefined,
        recommendedTags: track.recommended_tags,
        projectId: project.id,
        projectGenre: project.genre || undefined,
        projectMood: project.mood || undefined,
        projectLanguage: project.language || undefined,
        projectDescription: project.description || undefined,
        projectConcept: project.concept || undefined,
      });
      navigate("/generate");
    },
    [project, navigate, setPlanTrackContext],
  );

  // Open lyrics studio
  const handleOpenLyrics = useCallback(
    (track: ProjectTrack) => {
      navigate(`/lyrics-studio?projectId=${projectId}&trackId=${track.id}`);
    },
    [navigate, projectId],
  );

  // Save lyrics
  const handleSaveLyrics = useCallback(
    async (trackId: string, lyrics: string, lyricsStatus?: string) => {
      try {
        await supabase
          .from("project_tracks")
          .update({ lyrics, lyrics_status: lyricsStatus || "draft" })
          .eq("id", trackId);
        queryClient.invalidateQueries({ queryKey: ["project-tracks", projectId] });
        toast.success("Лирика сохранена");
      } catch (error) {
        logger.error("Error saving lyrics", error);
        toast.error("Ошибка сохранения");
      }
    },
    [projectId, queryClient],
  );

  // Save notes
  const handleSaveNotes = useCallback(
    async (trackId: string, notes: string) => {
      try {
        updateTrack({ id: trackId, updates: { notes } });
      } catch (error) {
        logger.error("Error saving notes", error);
        toast.error("Ошибка сохранения");
      }
    },
    [updateTrack],
  );

  // Handle lyrics generated from wizard
  const handleLyricsGenerated = useCallback(
    async (lyrics: string, selectedTrackId?: string) => {
      if (selectedTrackId) {
        try {
          await supabase
            .from("project_tracks")
            .update({ lyrics, lyrics_status: "generated" })
            .eq("id", selectedTrackId);
          queryClient.invalidateQueries({ queryKey: ["project-tracks", projectId] });
          toast.success("Лирика сохранена");
        } catch (error) {
          logger.error("Error saving lyrics", error);
          toast.error("Ошибка сохранения");
        }
      }
    },
    [projectId, queryClient],
  );

  // Share project to Telegram
  const handleShare = useCallback(async () => {
    if (!project) return;

    hapticFeedback("medium");

    try {
      const appUrl = `https://t.me/musicverse_ai_bot/app?startapp=project_${project.id}`;

      if (isRealMiniApp && project.cover_url) {
        // Share to Telegram Story with cover image
        shareToStory(project.cover_url, {
          media_url: project.cover_url,
          text: `🎵 ${project.title}${project.genre ? ` • ${project.genre}` : ""}\n\nСлушай в MusicVerse!`,
          widget_link: {
            url: appUrl,
            name: "Открыть проект",
          },
        });
        toast.success("Открыта публикация в Stories");
      } else if (isRealMiniApp) {
        // Share URL if no cover
        shareURL(appUrl, `🎵 ${project.title} - послушай мой проект в MusicVerse!`);
        toast.success("Ссылка скопирована");
      } else {
        // Fallback for web - copy link
        await navigator.clipboard.writeText(appUrl);
        toast.success("Ссылка скопирована в буфер обмена");
      }
    } catch (error) {
      logger.error("Share error", error);
      toast.error("Не удалось поделиться");
    }
  }, [project, isRealMiniApp, hapticFeedback, shareToStory, shareURL]);

  return {
    handleApplyUpdates,
    handleDragEnd,
    handleGenerateFromPlan,
    handleOpenLyrics,
    handleSaveLyrics,
    handleSaveNotes,
    handleLyricsGenerated,
    handleShare,
  };
}
