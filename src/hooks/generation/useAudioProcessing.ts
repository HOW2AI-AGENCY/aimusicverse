/**
 * useAudioProcessing - Unified hook for all audio processing operations
 * Consolidates extend, cover, add-vocals, add-instrumental with shared progress tracking
 */

import { useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { getUserErrorMessage } from "@/lib/errors";
import { useProgressTracking } from "./audioProcessing/useProgressTracking";
import type {
  AudioProcessingOperation,
  ExtendParams,
  CoverParams,
  AddVocalsParams,
  AddInstrumentalParams,
  OperationResult,
  UseAudioProcessingReturn,
} from "./audioProcessing/types";

const log = logger.child({ module: "AudioProcessing" });

/**
 * Convert File to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

/**
 * Unified hook for all audio processing operations
 */
export function useAudioProcessing(): UseAudioProcessingReturn {
  // Individual progress trackers for each operation
  const extendProgress = useProgressTracking("extend");
  const coverProgress = useProgressTracking("cover");
  const addVocalsProgress = useProgressTracking("add_vocals");
  const addInstrumentalProgress = useProgressTracking("add_instrumental");

  // ==========================================
  // Extend Operation
  // ==========================================

  const extend = useCallback(
    async (params: ExtendParams): Promise<OperationResult> => {
      extendProgress.setSubmitting();

      try {
        log.info("Starting extend operation", { sourceTrackId: params.sourceTrackId });

        const { data, error } = await supabase.functions.invoke("suno-music-extend", {
          body: {
            trackId: params.sourceTrackId,
            continueAt: params.continueAt,
            prompt: params.prompt,
            style: params.style,
            title: params.title,
            model: params.model,
            instrumental: params.instrumental,
          },
        });

        if (error) throw error;

        if (data?.taskId) {
          extendProgress.startTracking(data.taskId, data.trackId || data.taskId);
        }

        return {
          success: true,
          taskId: data?.taskId,
          trackId: data?.trackId,
        };
      } catch (err) {
        log.error("Extend operation failed", err);
        extendProgress.setError(getUserErrorMessage(err));
        return { success: false, error: err };
      }
    },
    [extendProgress],
  );

  // ==========================================
  // Cover Operation
  // ==========================================

  const cover = useCallback(
    async (params: CoverParams): Promise<OperationResult> => {
      coverProgress.setSubmitting();

      try {
        log.info("Starting cover operation");

        let audioData: { name: string; type: string; data: string } | undefined;

        if (params.audioFile) {
          const base64 = await fileToBase64(params.audioFile);
          audioData = {
            name: params.audioFile.name,
            type: params.audioFile.type,
            data: base64,
          };
        }

        const { data, error } = await supabase.functions.invoke("suno-upload-cover", {
          body: {
            audioFile: audioData,
            audioUrl: params.audioUrl,
            audioDuration: params.audioDuration,
            model: params.model || "V4_5ALL",
            customMode: true,
            instrumental: params.instrumental ?? false,
            style: params.style,
            title: params.title || "Кавер",
            prompt: params.instrumental ? undefined : params.lyrics,
            negativeTags: params.negativeTags,
            vocalGender: params.vocalGender === "auto" ? undefined : params.vocalGender,
            projectId: params.projectId,
          },
        });

        if (error) throw error;

        if (data?.taskId) {
          coverProgress.startTracking(data.taskId, data.trackId || data.taskId);
        }

        return {
          success: true,
          taskId: data?.taskId,
          trackId: data?.trackId,
        };
      } catch (err) {
        log.error("Cover operation failed", err);
        coverProgress.setError(getUserErrorMessage(err));
        return { success: false, error: err };
      }
    },
    [coverProgress],
  );

  // ==========================================
  // Add Vocals Operation
  // ==========================================

  const addVocals = useCallback(
    async (params: AddVocalsParams): Promise<OperationResult> => {
      addVocalsProgress.setSubmitting();

      try {
        log.info("Starting add vocals operation", { trackId: params.trackId });

        const { data, error } = await supabase.functions.invoke("suno-add-vocals", {
          body: {
            trackId: params.trackId,
            audioUrl: params.audioUrl,
            lyrics: params.lyrics,
            style: params.style,
            title: params.title,
            audioWeight: params.audioWeight ?? 0.7,
            styleWeight: params.styleWeight ?? 0.6,
            model: params.model,
          },
        });

        if (error) throw error;

        if (data?.taskId) {
          addVocalsProgress.startTracking(data.taskId, data.trackId || data.taskId);
        }

        return {
          success: true,
          taskId: data?.taskId,
          trackId: data?.trackId,
        };
      } catch (err) {
        log.error("Add vocals operation failed", err);
        addVocalsProgress.setError(getUserErrorMessage(err));
        return { success: false, error: err };
      }
    },
    [addVocalsProgress],
  );

  // ==========================================
  // Add Instrumental Operation
  // ==========================================

  const addInstrumental = useCallback(
    async (params: AddInstrumentalParams): Promise<OperationResult> => {
      addInstrumentalProgress.setSubmitting();

      try {
        log.info("Starting add instrumental operation", { trackId: params.trackId });

        const { data, error } = await supabase.functions.invoke("suno-add-instrumental", {
          body: {
            trackId: params.trackId,
            audioUrl: params.audioUrl,
            style: params.style,
            title: params.title,
            audioWeight: params.audioWeight ?? 0.85,
            openInStudio: params.openInStudio,
            model: params.model,
          },
        });

        if (error) throw error;

        if (data?.taskId) {
          addInstrumentalProgress.startTracking(data.taskId, data.trackId || data.taskId, {
            studioProjectId: data.studioProjectId,
          });
        }

        return {
          success: true,
          taskId: data?.taskId,
          trackId: data?.trackId,
        };
      } catch (err) {
        log.error("Add instrumental operation failed", err);
        addInstrumentalProgress.setError(getUserErrorMessage(err));
        return { success: false, error: err };
      }
    },
    [addInstrumentalProgress],
  );

  // ==========================================
  // Active Operations Tracking
  // ==========================================

  const activeOperations = useMemo<AudioProcessingOperation[]>(() => {
    const ops: AudioProcessingOperation[] = [];
    if (extendProgress.isActive) ops.push("extend");
    if (coverProgress.isActive) ops.push("cover");
    if (addVocalsProgress.isActive) ops.push("add_vocals");
    if (addInstrumentalProgress.isActive) ops.push("add_instrumental");
    return ops;
  }, [extendProgress.isActive, coverProgress.isActive, addVocalsProgress.isActive, addInstrumentalProgress.isActive]);

  const resetAll = useCallback(() => {
    extendProgress.reset();
    coverProgress.reset();
    addVocalsProgress.reset();
    addInstrumentalProgress.reset();
  }, [extendProgress, coverProgress, addVocalsProgress, addInstrumentalProgress]);

  return {
    // Operations
    extend,
    cover,
    addVocals,
    addInstrumental,

    // Progress states
    extendProgress: extendProgress.state,
    coverProgress: coverProgress.state,
    addVocalsProgress: addVocalsProgress.state,
    addInstrumentalProgress: addInstrumentalProgress.state,

    // Individual reset functions
    resetExtend: extendProgress.reset,
    resetCover: coverProgress.reset,
    resetAddVocals: addVocalsProgress.reset,
    resetAddInstrumental: addInstrumentalProgress.reset,
    resetAll,

    // Meta
    activeOperations,
    hasActiveOperation: activeOperations.length > 0,
  };
}
