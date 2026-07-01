/**
 * Studio Stem Sync Hook
 * Handles syncing stems from database and realtime updates
 */

import { useEffect, useRef, useCallback } from "react";
import { fetchTrackStemsMinimal, subscribeToTrackStemsInsert } from "@/services/studio.service";
import { useUnifiedStudioStore, TrackType, TRACK_COLORS } from "@/stores/useUnifiedStudioStore";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

interface UseStudioStemSyncProps {
  projectId: string | undefined;
  sourceTrackId: string | undefined;
}

export function useStudioStemSync({ projectId, sourceTrackId }: UseStudioStemSyncProps) {
  const { addTrack, addClip, project } = useUnifiedStudioStore();
  const importedStemsForTrackRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const mapStemTypeToTrackType = useCallback((stemType: string): TrackType => {
    const t = stemType.toLowerCase();
    if (t === "vocals" || t === "vocal") return "vocal";
    if (t === "instrumental") return "instrumental";
    if (t === "drums") return "drums";
    if (t === "bass") return "bass";
    return "other";
  }, []);

  const mapStemTypeToLabel = useCallback((stemType: string): string => {
    const t = stemType.toLowerCase();
    if (t === "vocals" || t === "vocal") return "Вокал";
    if (t === "instrumental") return "Инструментал";
    if (t === "drums") return "Ударные";
    if (t === "bass") return "Бас";
    return "Другое";
  }, []);

  const addStemToProjectIfMissing = useCallback(
    (stem: { stem_type: string; audio_url: string }) => {
      const currentProject = useUnifiedStudioStore.getState().project;
      if (!currentProject) return;

      const alreadyExists = currentProject.tracks.some(
        (t) => (t.audioUrl || t.clips?.[0]?.audioUrl) === stem.audio_url,
      );
      if (alreadyExists) return;

      const type = mapStemTypeToTrackType(stem.stem_type);
      const name = mapStemTypeToLabel(stem.stem_type);

      const newTrackId = addTrack({
        name,
        type,
        audioUrl: stem.audio_url,
        volume: 0.9,
        pan: 0,
        muted: false,
        solo: false,
        color: TRACK_COLORS[type] || TRACK_COLORS.other,
        status: "ready",
      });

      addClip(newTrackId, {
        audioUrl: stem.audio_url,
        name,
        startTime: 0,
        duration: currentProject.durationSeconds || 180,
        trimStart: 0,
        trimEnd: 0,
        fadeIn: 0,
        fadeOut: 0,
      });
    },
    [addTrack, addClip, mapStemTypeToTrackType, mapStemTypeToLabel],
  );

  // Initial load and realtime subscription
  useEffect(() => {
    if (!projectId || !sourceTrackId) return;

    const abortController = new AbortController();
    isMountedRef.current = true;

    // Import stems once per source track
    if (importedStemsForTrackRef.current !== sourceTrackId) {
      importedStemsForTrackRef.current = sourceTrackId;

      (async () => {
        try {
          const rows = await fetchTrackStemsMinimal(sourceTrackId, abortController.signal);

          if (!isMountedRef.current) return;

          const stems = rows.filter((s): s is { stem_type: string; audio_url: string } => !!s.audio_url);
          stems.forEach((s) => addStemToProjectIfMissing(s));
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
          logger.warn("Failed to load track stems for studio project", { error: err });
        }
      })();
    }

    // Realtime subscription for new stems
    const sub = subscribeToTrackStemsInsert(sourceTrackId, (stem) => {
      if (!isMountedRef.current) return;
      if (stem?.audio_url && stem?.stem_type) {
        addStemToProjectIfMissing({ stem_type: stem.stem_type, audio_url: stem.audio_url });
        toast.success("Стем добавлен в студию");
      }
    });

    return () => {
      isMountedRef.current = false;
      abortController.abort();
      sub.unsubscribe();
    };
  }, [projectId, sourceTrackId, addStemToProjectIfMissing]);

  return { isMountedRef };
}
