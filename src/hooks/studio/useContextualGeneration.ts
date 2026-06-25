/**
 * useContextualGeneration - Hook for AI-powered contextual stem generation
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getStemLabel } from "@/lib/stemLabels";

export interface TrackContext {
  bpm?: number;
  key?: string;
  scale?: string;
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  suggestedInstruments?: string[];
  style_description?: string;
}

export type StemType = "drums" | "bass" | "piano" | "strings" | "synth" | "sfx" | "guitar" | "pad";

export interface GenerationParams {
  stemType: StemType;
  styleHint?: string;
  duration?: number;
}

export interface GenerationResult {
  success: boolean;
  stemId: string;
  audioUrl: string;
  stemType: string;
  prompt: string;
  model: string;
}

interface UseContextualGenerationOptions {
  trackId: string;
  trackUrl: string;
}

export function useContextualGeneration({ trackId, trackUrl }: UseContextualGenerationOptions) {
  const queryClient = useQueryClient();
  const [generationProgress, setGenerationProgress] = useState(0);

  // Fetch track context
  const {
    data: trackContext,
    isLoading: isLoadingContext,
    refetch: refetchContext,
  } = useQuery<TrackContext>({
    queryKey: ["track-context", trackId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("analyze-track-context", {
        body: { audioUrl: trackUrl, trackId },
      });

      if (error) throw error;
      return data as TrackContext;
    },
    enabled: !!trackId && !!trackUrl,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  // Generate stem mutation
  const generateStemMutation = useMutation<GenerationResult, Error, GenerationParams>({
    mutationFn: async (params) => {
      setGenerationProgress(10);

      const { data, error } = await supabase.functions.invoke("generate-contextual-stem", {
        body: {
          trackId,
          trackUrl,
          stemType: params.stemType,
          styleHint: params.styleHint,
          duration: params.duration || 30,
          context: trackContext,
        },
      });

      if (error) throw error;

      setGenerationProgress(100);
      return data as GenerationResult;
    },
    onMutate: () => {
      setGenerationProgress(5);
    },
    onSuccess: (data) => {
      // Invalidate stems query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["track-stems", trackId] });
      toast.success(`${getStemLabel(data.stemType)} успешно создан`);
    },
    onError: (error) => {
      setGenerationProgress(0);
      toast.error(`Ошибка генерации: ${error.message}`);
    },
    onSettled: () => {
      // Reset progress after a delay
      setTimeout(() => setGenerationProgress(0), 1000);
    },
  });

  return {
    // Context
    trackContext,
    isLoadingContext,
    refetchContext,

    // Generation
    generateStem: generateStemMutation.mutate,
    generateStemAsync: generateStemMutation.mutateAsync,
    isGenerating: generateStemMutation.isPending,
    generationProgress,
    generationError: generateStemMutation.error,
    lastGeneration: generateStemMutation.data,
  };
}

// Re-export centralized stem labeling for backwards compatibility
export { getStemLabel };

// Stem type icons mapping
export const stemTypeConfig: Record<
  StemType,
  {
    emoji: string;
    label: string;
    description: string;
  }
> = {
  drums: { emoji: "🥁", label: "Ударные", description: "Ритм-секция: кик, снэйр, хэты" },
  bass: { emoji: "🎸", label: "Бас", description: "Басовая линия и грув" },
  piano: { emoji: "🎹", label: "Пианино", description: "Мелодия и аккорды" },
  strings: { emoji: "🎻", label: "Струнные", description: "Оркестровые струнные" },
  synth: { emoji: "🎛️", label: "Синтезатор", description: "Электронные текстуры" },
  sfx: { emoji: "✨", label: "SFX", description: "Эффекты и переходы" },
  guitar: { emoji: "🎸", label: "Гитара", description: "Электро или акустика" },
  pad: { emoji: "🌊", label: "Пэд", description: "Атмосферные текстуры" },
};
