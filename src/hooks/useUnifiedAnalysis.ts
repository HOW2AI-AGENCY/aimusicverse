/**
 * Unified Audio Analysis Hook
 * Provides React integration for the AudioAnalysisService
 */

import { useState, useCallback } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { audioAnalysisService } from "@/services/unified-analysis";
import type {
  AnalysisRequest,
  AnalysisState,
  AnalysisStatus,
  AnalysisType,
  UnifiedAnalysisResult,
} from "@/services/unified-analysis/types";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "useUnifiedAnalysis" });

// ==========================================
// Main Analysis Hook
// ==========================================

export function useUnifiedAnalysis() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AnalysisState>({
    status: "idle",
    result: null,
    error: null,
  });

  const handleProgress = useCallback((status: AnalysisStatus, message?: string) => {
    setState((prev) => ({
      ...prev,
      status,
      currentStep: message,
    }));
  }, []);

  const analyzeMutation = useMutation({
    mutationFn: async (request: AnalysisRequest) => {
      setState({ status: "pending", result: null, error: null });

      return audioAnalysisService.analyze({
        ...request,
        onProgress: handleProgress,
      });
    },
    onSuccess: (result, variables) => {
      setState({
        status: "completed",
        result,
        error: null,
      });

      toast.success("Анализ завершён");

      // Invalidate related queries
      if (variables.trackId) {
        queryClient.invalidateQueries({ queryKey: ["audio-analysis", variables.trackId] });
        queryClient.invalidateQueries({ queryKey: ["tracks"] });
      }
    },
    onError: (error: Error) => {
      setState({
        status: "failed",
        result: null,
        error: error.message,
      });

      log.error("Analysis failed", error);
      toast.error(`Ошибка анализа: ${error.message}`);
    },
  });

  const analyze = useCallback(
    (request: Omit<AnalysisRequest, "onProgress">) => {
      return analyzeMutation.mutateAsync(request);
    },
    [analyzeMutation],
  );

  const reset = useCallback(() => {
    setState({
      status: "idle",
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyze,
    reset,
    isAnalyzing: analyzeMutation.isPending,
  };
}

// ==========================================
// Quick Analysis Hooks
// ==========================================

/**
 * Quick style analysis (genre, mood, instruments)
 */
export function useStyleAnalysis() {
  return useAnalysisByType(["style"]);
}

/**
 * Quick music theory analysis (BPM, key, time signature)
 */
export function useMusicTheoryAnalysis() {
  return useAnalysisByType(["music-theory"]);
}

/**
 * Quick emotion analysis (arousal, valence)
 */
export function useEmotionAnalysis() {
  return useAnalysisByType(["emotion"]);
}

/**
 * MIDI transcription
 */
export function useTranscriptionAnalysis() {
  return useAnalysisByType(["transcription"]);
}

/**
 * Beat detection
 */
export function useBeatAnalysis() {
  return useAnalysisByType(["beats"]);
}

/**
 * Chord recognition
 */
export function useChordAnalysis() {
  return useAnalysisByType(["chords"]);
}

/**
 * Full comprehensive analysis
 */
export function useFullAnalysis() {
  return useAnalysisByType(["full"]);
}

// ==========================================
// Helper Hook
// ==========================================

function useAnalysisByType(types: AnalysisType[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { audioUrl?: string; trackId?: string; userId?: string }) => {
      return audioAnalysisService.analyze({
        ...params,
        analysisTypes: types,
      });
    },
    onSuccess: (_, variables) => {
      toast.success("Анализ завершён");
      if (variables.trackId) {
        queryClient.invalidateQueries({ queryKey: ["audio-analysis", variables.trackId] });
      }
    },
    onError: (error: Error) => {
      toast.error(`Ошибка анализа: ${error.message}`);
    },
  });
}

// ==========================================
// Fetch Existing Analysis
// ==========================================

export function useTrackAnalysis(trackId: string | null) {
  return useQuery({
    queryKey: ["audio-analysis", trackId],
    queryFn: async (): Promise<UnifiedAnalysisResult | null> => {
      if (!trackId) return null;

      const { data, error } = await supabase
        .from("audio_analysis")
        .select("*")
        .eq("track_id", trackId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Normalize to UnifiedAnalysisResult
      return {
        id: data.id,
        trackId: data.track_id,
        genre: data.genre || undefined,
        mood: data.mood || undefined,
        bpm: data.bpm || undefined,
        key: data.key_signature || undefined,
        instruments: data.instruments || undefined,
        structure: data.structure ? { sections: [data.structure] } : undefined,
        styleDescription: data.style_description || undefined,
        arousal: data.arousal ? data.arousal * 100 : undefined,
        valence: data.valence ? data.valence * 100 : undefined,
        analyzedAt: data.created_at,
      };
    },
    enabled: !!trackId,
  });
}

// ==========================================
// Re-export types
// ==========================================

export type {
  AnalysisRequest,
  AnalysisState,
  AnalysisStatus,
  AnalysisType,
  UnifiedAnalysisResult,
} from "@/services/unified-analysis/types";
